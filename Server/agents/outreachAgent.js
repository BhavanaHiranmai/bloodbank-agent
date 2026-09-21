const BloodRequest = require("../models/BloodRequest");
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const { sendEmail } = require("../controllers/auth");
const { emitToUser, emitToRequest } = require("../utils/realtime");
const { sendPushNotification } = require("../utils/webPush");
const { sendExpoPushToUsers } = require("../utils/expoPush");
const { compatibleDonorGroupsFor } = require("../utils/bloodCompatibility");
const { haversineKm, roundKm } = require("../utils/haversine");
const { callClaude } = require("./llmClient");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getDisplayName = (user) =>
  user?.hospitalName ||
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  "BloodLink user";

const emitAgentEvent = (state, event, payload) => {
  if (state.requestId) emitToRequest(state.requestId, event, payload);
  if (state.requesterUser?._id) emitToUser(state.requesterUser._id, event, payload);
};

/**
 * 3. Outreach Agent
 * Plans phased outreach waves using Claude and dispatches Wave 1 alerts across channels.
 */
async function outreachAgent(state) {
  const {
    requestId,
    bloodGroup,
    unitsNeeded,
    urgency = "normal",
    notes,
    location,
    rankedDonors = [],
    requesterUser,
  } = state;

  // Emit "active" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "outreach",
    status: "active",
    reasoning: "Formulating phased wave dispatch strategy and notifying initial donor cohort...",
    output: null,
    timestamp: new Date(),
  });

  if (process.env.DEMO_MODE === "true") {
    await new Promise((r) => setTimeout(r, 800));
  }

  const totalCandidates = rankedDonors.length;
  const coordinates = location?.coordinates || [];

  // Default heuristic fallback strategy
  const fallbackStrategy = () => {
    let wave1Count = 5;
    let timeoutMinutes = 15;

    if (urgency === "critical") {
      wave1Count = Math.min(totalCandidates, Math.max(8, Number(unitsNeeded) * 4));
      timeoutMinutes = 5;
    } else if (urgency === "urgent") {
      wave1Count = Math.min(totalCandidates, Math.max(5, Number(unitsNeeded) * 3));
      timeoutMinutes = 10;
    } else {
      wave1Count = Math.min(totalCandidates, Math.max(3, Number(unitsNeeded) * 2));
      timeoutMinutes = 20;
    }

    if (totalCandidates <= wave1Count) {
      wave1Count = totalCandidates;
    }

    const wave1 = rankedDonors.slice(0, wave1Count);
    const wave2 = rankedDonors.slice(wave1Count, wave1Count + 10);
    const wave3 = rankedDonors.slice(wave1Count + 10);

    const plan = [
      { wave: 1, donorCount: wave1.length, timeoutMinutes },
      ...(wave2.length > 0 ? [{ wave: 2, donorCount: wave2.length, timeoutMinutes: timeoutMinutes * 2 }] : []),
      ...(wave3.length > 0 ? [{ wave: 3, donorCount: wave3.length, timeoutMinutes: timeoutMinutes * 3 }] : []),
    ];

    const reasoning = `Formulated ${plan.length}-stage outreach plan for ${urgency} priority. Wave 1 immediately alerts ${wave1.length} top-ranked donors with a ${timeoutMinutes}-minute escalation window.`;

    return { plan, wave1Count, reasoning };
  };

  let strategyResult = fallbackStrategy();

  if (totalCandidates > 0) {
    const prompt = `Devise an optimal multi-wave notification plan for this blood request.
Urgency: ${urgency}
Units Needed: ${unitsNeeded}
Total Available Ranked Donors: ${totalCandidates}
Top 3 Donor Distances: ${rankedDonors.slice(0, 3).map((d) => d.distanceKm + "km").join(", ")}

Requirements:
- Specify Wave 1 donor count (between 1 and ${Math.min(totalCandidates, 15)})
- Specify escalation timeout in minutes for Wave 1 before escalating to Wave 2
- 1-2 sentence operational reasoning string.

Return ONLY a JSON object:
{
  "wave1Count": number,
  "timeoutMinutes": number,
  "reasoning": "string"
}`;

    const llmResponse = await callClaude({
      prompt,
      model: "claude-sonnet-4-6",
      fallbackHandler: fallbackStrategy,
    });

    if (typeof llmResponse === "string") {
      try {
        const cleaned = llmResponse.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.wave1Count && parsed.reasoning) {
          const w1 = Math.max(1, Math.min(totalCandidates, Number(parsed.wave1Count) || 5));
          const timeout = Number(parsed.timeoutMinutes) || 10;
          const plan = [
            { wave: 1, donorCount: w1, timeoutMinutes: timeout },
            ...(totalCandidates > w1 ? [{ wave: 2, donorCount: totalCandidates - w1, timeoutMinutes: timeout * 2 }] : []),
          ];
          strategyResult = { plan, wave1Count: w1, reasoning: parsed.reasoning };
        }
      } catch (err) {
        // use fallbackStrategy already set
      }
    }
  }

  const { plan, wave1Count, reasoning } = strategyResult;
  const wave1Donors = rankedDonors.slice(0, wave1Count);
  const wave1DonorIds = wave1Donors.map(({ donor }) => donor._id);

  // ── Dispatch Wave 1 Notifications across all channels ──
  if (wave1Donors.length > 0 && requestId) {
    try {
      // 1. Update BloodRequest document with wave 1 notified donors
      await BloodRequest.findByIdAndUpdate(requestId, {
        $addToSet: { notifiedDonors: { $each: wave1DonorIds } },
      });

      // 2. Insert in-app notifications
      const notifications = await Notification.insertMany(
        wave1Donors.map(({ donor, routing }, index) => {
          const distanceKm = roundKm(haversineKm(coordinates, donor.location.coordinates));
          const requesterName = requesterUser ? getDisplayName(requesterUser) : "BloodLink Requester";
          return {
            recipient: donor._id,
            type: "blood_request",
            title: `${urgency === "critical" ? "SOS: " : ""}${bloodGroup} blood needed`,
            message: `${requesterName} needs ${unitsNeeded} unit(s). Distance: ${distanceKm} km`,
            data: {
              requestId,
              urgency,
              bloodGroup,
              compatibleBloodGroups: compatibleDonorGroupsFor(bloodGroup),
              distance: routing.distance,
              duration: routing.duration,
              distanceKm,
              rank: index + 1,
              routingAlgorithm: routing.algorithm,
            },
          };
        }),
      );

      // 3. Socket.io real-time alerts
      notifications.forEach((notification) => {
        if (notification?.recipient) {
          emitToUser(notification.recipient, "blood-request:new", notification);
        }
      });

      // 4. Expo Push
      const requesterName = requesterUser ? requesterUser.firstName : "A hospital/requester";
      sendExpoPushToUsers(wave1DonorIds, {
        title: `🩸 ${urgency === "critical" ? "SOS: " : ""}${bloodGroup} blood needed`,
        body: `${requesterName} needs ${unitsNeeded} unit(s). Open BloodLink to respond.`,
        data: { screen: "donor:nearby", requestId: String(requestId) },
        channelId: urgency === "critical" ? "bloodlink-sos" : "bloodlink-default",
        priority: "high",
        sound: "default",
      });

      // 5. Firebase Admin FCM SOS multicast
      try {
        const { messaging } = require("../utils/firebase");
        if (messaging) {
          const allDeviceTokens = [];
          for (const { donor } of wave1Donors) {
            if (donor.deviceTokens && donor.deviceTokens.length > 0) {
              allDeviceTokens.push(...donor.deviceTokens);
            }
          }
          if (allDeviceTokens.length > 0) {
            await messaging.sendEachForMulticast({
              tokens: allDeviceTokens,
              notification: {
                title: "🚨 BLOOD NEEDED URGENTLY",
                body: `${bloodGroup} blood needed nearby — Tap to respond`,
              },
              data: {
                requestId: String(requestId),
                bloodGroup: String(bloodGroup),
                urgency: String(urgency),
                unitsNeeded: String(unitsNeeded),
                type: "sos_alert",
              },
              android: {
                priority: "high",
                notification: {
                  sound: "sos_alarm",
                  channelId: "sos_channel",
                  priority: "max",
                },
              },
            });
          }
        }
      } catch (fcmErr) {
        // non-blocking
      }

      // 6. Web Push
      if (process.env.VAPID_PUBLIC_KEY) {
        const distanceByDonor = new Map(
          wave1Donors.map(({ donor }) => [
            String(donor._id),
            roundKm(haversineKm(coordinates, donor.location.coordinates)),
          ]),
        );

        PushSubscription.find({ user: { $in: wave1DonorIds } })
          .then((subscriptions) =>
            Promise.all(
              subscriptions.map(async (pushSubscription) => {
                try {
                  const distanceKm = distanceByDonor.get(String(pushSubscription.user)) ?? "N/A";
                  await sendPushNotification(pushSubscription.subscription, {
                    title: `🩸 ${urgency === "critical" ? "SOS: " : ""}${bloodGroup} blood needed`,
                    body: `${distanceKm} km from you. Tap to respond.`,
                    url: "/donor/notifications",
                    urgency,
                    bloodGroup,
                    requestId: String(requestId),
                  });
                } catch (err) {
                  if (err?.expired) {
                    await PushSubscription.deleteOne({ _id: pushSubscription._id });
                  }
                }
              }),
            ),
          )
          .catch(() => {});
      }

      // 7. Email Notifications
      for (const { donor, routing } of wave1Donors) {
        if (donor.email) {
          const distanceKm = roundKm(haversineKm(coordinates, donor.location.coordinates));
          const requesterDisplayName = requesterUser ? getDisplayName(requesterUser) : "BloodLink user";
          const requesterType = requesterUser?.role === "hospital" ? "Hospital/requester" : "Donor requester";
          const locationText = `${coordinates[1]}, ${coordinates[0]}`;
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`;
          const notesText = notes?.trim() || "No extra notes provided.";

          sendEmail({
            to: donor.email,
            subject: `${urgency === "critical" ? "SOS: " : ""}${bloodGroup} blood needed - ${distanceKm} km away`,
            text: `${bloodGroup} blood is needed. Requester: ${requesterDisplayName}. Units: ${unitsNeeded}. Urgency: ${urgency}. Distance: ${distanceKm} km. Map: ${mapsLink}`,
            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
                <h2 style="color:#c0392b;margin-bottom:8px">${escapeHtml(bloodGroup)} blood needed</h2>
                <p>A BloodLink emergency alert near you needs immediate response.</p>
                <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
                  <tr><td><strong>Requester</strong></td><td>${escapeHtml(requesterDisplayName)}</td></tr>
                  <tr><td><strong>Requester type</strong></td><td>${escapeHtml(requesterType)}</td></tr>
                  <tr><td><strong>Blood group</strong></td><td>${escapeHtml(bloodGroup)}</td></tr>
                  <tr><td><strong>Units needed</strong></td><td>${unitsNeeded}</td></tr>
                  <tr><td><strong>Urgency</strong></td><td>${escapeHtml(urgency)}</td></tr>
                  <tr><td><strong>Distance</strong></td><td>${distanceKm} km</td></tr>
                  <tr><td><strong>Route estimate</strong></td><td>${escapeHtml(routing.distance || "N/A")}</td></tr>
                  <tr><td><strong>Notes</strong></td><td>${escapeHtml(notesText)}</td></tr>
                </table>
                <p><a href="${mapsLink}" style="color:#c0392b">View location on map</a></p>
              </div>
            `,
          }).catch(() => {});
        }
      }
    } catch (dispatchErr) {
      console.warn("Outreach notification dispatch warning:", dispatchErr.message);
    }
  }

  const stepLog = {
    agent: "outreach",
    input: {
      totalCandidates,
      urgency,
      unitsNeeded,
    },
    output: {
      outreachPlan: plan,
      wave1DispatchedCount: wave1Donors.length,
      wave1DonorIds,
    },
    reasoning,
    timestamp: new Date(),
  };

  // Emit "done" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "outreach",
    status: "done",
    reasoning,
    output: stepLog.output,
    timestamp: new Date(),
  });

  return {
    ...state,
    outreachPlan: plan,
    notifiedDonorsCount: wave1Donors.length,
    wave1DonorIds,
    traceSteps: [...(state.traceSteps || []), stepLog],
  };
}

module.exports = outreachAgent;
