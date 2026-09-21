const { callClaude } = require("./llmClient");
const { emitToRequest, emitToUser } = require("../utils/realtime");

const emitAgentEvent = (state, event, payload) => {
  if (state.requestId) emitToRequest(state.requestId, event, payload);
  if (state.requesterUser?._id) emitToUser(state.requesterUser._id, event, payload);
};

/**
 * 1. Intake Agent
 * Validates request parameters and evaluates clinical urgency from unstructured notes.
 */
async function intakeAgent(state) {
  const { bloodGroup, unitsNeeded, notes, urgency = "normal", radiusKm = 10, location, requestId } = state;

  // Emit "active" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "intake",
    status: "active",
    reasoning: "Evaluating clinical notes and urgency classification...",
    output: null,
    timestamp: new Date(),
  });

  if (process.env.DEMO_MODE === "true") {
    await new Promise((r) => setTimeout(r, 800));
  }

  const rawNotes = (notes || "").trim();
  let finalUrgency = urgency || "normal";
  let suggestedRadius = Number(radiusKm) || 10;
  let reasoning = "";

  // Deterministic fallback analyzer for clinical keywords
  const fallbackAnalyze = () => {
    const lowerNotes = rawNotes.toLowerCase();
    const isCritical =
      lowerNotes.includes("surgery") ||
      lowerNotes.includes("icu") ||
      lowerNotes.includes("trauma") ||
      lowerNotes.includes("bleeding") ||
      lowerNotes.includes("accident") ||
      lowerNotes.includes("hemorrhage") ||
      lowerNotes.includes("operation") ||
      lowerNotes.includes("immediate") ||
      lowerNotes.includes("stat") ||
      lowerNotes.includes("emergency");

    const isUrgent =
      lowerNotes.includes("urgent") ||
      lowerNotes.includes("today") ||
      lowerNotes.includes("hours") ||
      lowerNotes.includes("dialysis") ||
      lowerNotes.includes("transfusion");

    if (isCritical) {
      finalUrgency = "critical";
      suggestedRadius = Math.max(suggestedRadius, 15);
      reasoning = "Clinical notes indicate an acute trauma or surgical emergency; upgraded urgency to critical and widened radius to 15km.";
    } else if (isUrgent || urgency === "urgent") {
      finalUrgency = urgency === "critical" ? "critical" : "urgent";
      suggestedRadius = Math.max(suggestedRadius, 10);
      reasoning = "Urgent clinical requirements detected from intake details; maintaining a 10km search radius.";
    } else {
      finalUrgency = urgency || "normal";
      suggestedRadius = Math.max(suggestedRadius, 5);
      reasoning = "Standard intake verified. Setting an initial search radius of 5km for optimal local donor proximity.";
    }

    return { urgency: finalUrgency, initialRadiusKm: suggestedRadius, reasoning };
  };

  if (rawNotes.length > 3) {
    const prompt = `Analyze this blood request intake for emergency triage.
Blood Group Needed: ${bloodGroup}
Units Needed: ${unitsNeeded}
Stated Urgency: ${urgency}
Patient/Doctor Notes: "${rawNotes}"

Classify:
1. True Urgency (one of: "normal", "urgent", "critical")
2. Recommended initial search radius in km (integer between 5 and 25)
3. Concise 1-2 sentence clinical reasoning.

Return ONLY a valid JSON object matching this schema:
{
  "urgency": "normal" | "urgent" | "critical",
  "initialRadiusKm": number,
  "reasoning": "string"
}`;

    const llmResponse = await callClaude({
      prompt,
      model: "claude-sonnet-4-6",
      fallbackHandler: fallbackAnalyze,
    });

    if (typeof llmResponse === "string") {
      try {
        const cleaned = llmResponse.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.urgency && parsed.initialRadiusKm && parsed.reasoning) {
          finalUrgency = ["critical", "urgent", "normal"].includes(parsed.urgency)
            ? parsed.urgency
            : finalUrgency;
          suggestedRadius = Number(parsed.initialRadiusKm) || suggestedRadius;
          reasoning = parsed.reasoning;
        } else {
          fallbackAnalyze();
        }
      } catch (err) {
        fallbackAnalyze();
      }
    }
  } else {
    fallbackAnalyze();
  }

  // Ensure reasonable bounds
  if (finalUrgency === "critical") {
    suggestedRadius = Math.max(suggestedRadius, 15);
  } else if (finalUrgency === "urgent") {
    suggestedRadius = Math.max(suggestedRadius, 10);
  } else {
    suggestedRadius = Math.max(suggestedRadius, 5);
  }

  const stepLog = {
    agent: "intake",
    input: {
      bloodGroup,
      unitsNeeded,
      urgency,
      notes: rawNotes,
      location,
    },
    output: {
      urgency: finalUrgency,
      initialRadiusKm: suggestedRadius,
    },
    reasoning,
    timestamp: new Date(),
  };

  // Emit "done" status for real-time visualization
  emitAgentEvent(state, "agent:step", {
    requestId: requestId || state.requestId,
    agent: "intake",
    status: "done",
    reasoning,
    output: stepLog.output,
    timestamp: new Date(),
  });

  return {
    ...state,
    urgency: finalUrgency,
    radiusKm: suggestedRadius,
    initialRadiusKm: suggestedRadius,
    traceSteps: [...(state.traceSteps || []), stepLog],
  };
}

module.exports = intakeAgent;
