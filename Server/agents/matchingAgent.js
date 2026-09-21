const UserModel = require("../models/user");
const { bloodGroupFilterFor, compatibleDonorGroupsFor } = require("../utils/bloodCompatibility");
const { haversineKm, roundKm } = require("../utils/haversine");
const { emitToRequest, emitToUser } = require("../utils/realtime");

const emitAgentEvent = (state, event, payload) => {
  if (state.requestId) emitToRequest(state.requestId, event, payload);
  if (state.requesterUser?._id) emitToUser(state.requesterUser._id, event, payload);
};

/**
 * 2. Matching Agent
 * Queries compatible donors using 2dsphere indexing and applies multi-attribute ranking:
 * (Distance Proximity + Historical Reliability + Donor Loyalty Points)
 */
async function matchingAgent(state) {
  const { bloodGroup, location, radiusKm = 10, requestId, requesterId } = state;
  const coordinates = location?.coordinates || [];

  // Emit "active" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "matching",
    status: "active",
    reasoning: `Scanning geospatial index and scoring donors within ${radiusKm}km...`,
    output: null,
    timestamp: new Date(),
  });

  if (process.env.DEMO_MODE === "true") {
    await new Promise((r) => setTimeout(r, 800));
  }

  if (!coordinates || coordinates.length < 2) {
    const errorStep = {
      agent: "matching",
      input: { bloodGroup, coordinates, radiusKm },
      output: { candidateCount: 0, rankedCount: 0 },
      reasoning: "Invalid coordinates provided; no donors could be matched.",
      timestamp: new Date(),
    };
    emitAgentEvent(state, "agent:step", {
      requestId: requestId || state.requestId,
      agent: "matching",
      status: "done",
      reasoning: errorStep.reasoning,
      output: errorStep.output,
      timestamp: new Date(),
    });
    return {
      ...state,
      candidateDonors: [],
      rankedDonors: [],
      traceSteps: [...(state.traceSteps || []), errorStep],
    };
  }

  const compatibleGroups = compatibleDonorGroupsFor(bloodGroup);
  const maxDistanceMeters = Math.max(Number(radiusKm) || 10, 1) * 1000;
  const excludeIds = requesterId ? [requesterId] : [];

  // Query MongoDB with 2dsphere $near
  const candidates = await UserModel.find({
    role: "donor",
    bloodGroup: bloodGroupFilterFor(bloodGroup),
    isActive: true,
    isEligible: true,
    _id: { $nin: excludeIds },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).select("-password");

  // Multi-criteria scoring function
  // Normalize & weight: Distance (50%), Total Donations / Reliability (35%), Points / Loyalty (15%)
  const scoredDonors = candidates.map((donor) => {
    const donorCoords = donor.location?.coordinates || [0, 0];
    const distanceKm = roundKm(haversineKm(coordinates, donorCoords));

    // Distance score: 100 at 0km decaying to 0 at max search radius
    const maxRadius = Math.max(Number(radiusKm) || 10, 1);
    const distanceScore = Math.max(0, 100 - (distanceKm / maxRadius) * 100);

    // Reliability score: 10 points per donation, capped at 100
    const totalDonations = Number(donor.totalDonations) || 0;
    const reliabilityScore = Math.min(100, totalDonations * 15 + 20);

    // Loyalty score: from points, capped at 100
    const points = Number(donor.points) || 0;
    const loyaltyScore = Math.min(100, points / 10);

    // Composite Weighted Score
    const compositeScore = Math.round(
      distanceScore * 0.5 + reliabilityScore * 0.35 + loyaltyScore * 0.15,
    );

    return {
      donor: donor.toObject ? donor.toObject() : donor,
      distanceKm,
      scores: {
        distance: Math.round(distanceScore),
        reliability: Math.round(reliabilityScore),
        loyalty: Math.round(loyaltyScore),
        composite: compositeScore,
      },
      routing: {
        distance: `${distanceKm} km`,
        duration: `${Math.round(distanceKm * 2.5)} mins`,
        algorithm: "multi-factor-agent-scoring",
      },
    };
  });

  // Sort descending by composite score, then by distance ascending
  scoredDonors.sort((a, b) => b.scores.composite - a.scores.composite || a.distanceKm - b.distanceKm);

  const candidateCount = candidates.length;
  const topCandidateSummary = scoredDonors.slice(0, 5).map((d) => ({
    name: `${d.donor.firstName || ""} ${d.donor.lastName || ""}`.trim() || "Donor",
    bloodGroup: d.donor.bloodGroup,
    distanceKm: d.distanceKm,
    score: d.scores.composite,
  }));

  const reasoning = candidateCount > 0
    ? `Identified ${candidateCount} compatible donors within ${radiusKm}km. Scored and ranked by proximity (50%), lifetime donation reliability (35%), and engagement level (15%).`
    : `No active eligible donors found within ${radiusKm}km for blood group ${bloodGroup} (compatible: ${compatibleGroups.join(", ")}).`;

  const stepLog = {
    agent: "matching",
    input: {
      bloodGroup,
      compatibleGroups,
      radiusKm,
      location: coordinates,
    },
    output: {
      candidateCount,
      rankedCount: scoredDonors.length,
      topCandidates: topCandidateSummary,
    },
    reasoning,
    timestamp: new Date(),
  };

  // Emit "done" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "matching",
    status: "done",
    reasoning,
    output: stepLog.output,
    timestamp: new Date(),
  });

  return {
    ...state,
    candidateDonors: candidates.map((c) => c._id),
    rankedDonors: scoredDonors,
    traceSteps: [...(state.traceSteps || []), stepLog],
  };
}

module.exports = matchingAgent;
