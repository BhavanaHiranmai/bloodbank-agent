const AgentTrace = require("../models/AgentTrace");
const intakeAgent = require("./intakeAgent");
const matchingAgent = require("./matchingAgent");
const outreachAgent = require("./outreachAgent");
const { forecastAgent } = require("./forecastAgent");

let StateGraph, END, START, Annotation;
try {
  const langgraph = require("@langchain/langgraph");
  StateGraph = langgraph.StateGraph;
  END = langgraph.END;
  START = langgraph.START;
  Annotation = langgraph.Annotation;
} catch (err) {
  // Graceful fallback if langgraph isn't yet resolved
  StateGraph = null;
}

// Define the Graph State schema using LangGraph Annotation if available
let GraphAnnotation;
if (Annotation) {
  GraphAnnotation = Annotation.Root({
    requestId: Annotation(),
    bloodGroup: Annotation(),
    unitsNeeded: Annotation(),
    urgency: Annotation(),
    notes: Annotation(),
    location: Annotation(),
    radiusKm: Annotation(),
    initialRadiusKm: Annotation(),
    candidateDonors: Annotation(),
    rankedDonors: Annotation(),
    outreachPlan: Annotation(),
    escalationLevel: Annotation(),
    forecastFlags: Annotation(),
    traceSteps: Annotation({
      reducer: (x, y) => (y ? (Array.isArray(y) ? y : [...(x || []), y]) : x || []),
      default: () => [],
    }),
    requesterUser: Annotation(),
    finalDecision: Annotation(),
    notifiedDonorsCount: Annotation(),
    wave1DonorIds: Annotation(),
  });
}

/**
 * Builds the LangGraph StateGraph instance
 */
function buildStateGraph() {
  if (!StateGraph) {
    return null;
  }

  const workflow = new StateGraph(GraphAnnotation || {
    channels: {
      requestId: { value: (x, y) => y ?? x },
      bloodGroup: { value: (x, y) => y ?? x },
      unitsNeeded: { value: (x, y) => y ?? x },
      urgency: { value: (x, y) => y ?? x },
      notes: { value: (x, y) => y ?? x },
      location: { value: (x, y) => y ?? x },
      radiusKm: { value: (x, y) => y ?? x },
      initialRadiusKm: { value: (x, y) => y ?? x },
      candidateDonors: { value: (x, y) => y ?? x ?? [] },
      rankedDonors: { value: (x, y) => y ?? x ?? [] },
      outreachPlan: { value: (x, y) => y ?? x ?? [] },
      escalationLevel: { value: (x, y) => y ?? x ?? 0 },
      forecastFlags: { value: (x, y) => y ?? x ?? [] },
      traceSteps: { value: (x, y) => y ?? x ?? [] },
      requesterUser: { value: (x, y) => y ?? x },
      finalDecision: { value: (x, y) => y ?? x },
      notifiedDonorsCount: { value: (x, y) => y ?? x },
      wave1DonorIds: { value: (x, y) => y ?? x },
    },
  });

  // Add agent nodes
  workflow.addNode("intake", intakeAgent);
  workflow.addNode("matching", matchingAgent);
  workflow.addNode("outreach", outreachAgent);
  workflow.addNode("forecast", forecastAgent);

  // Set edges
  workflow.addEdge(START || "__start__", "intake");
  workflow.addEdge("intake", "matching");
  workflow.addEdge("matching", "outreach");
  workflow.addEdge("outreach", "forecast");

  // Conditional routing after outreach: if escalation is requested, re-match with expanded perimeter
  workflow.addConditionalEdges("forecast", (state) => {
    if (state.needsReEscalation && state.escalationLevel < 3) {
      state.escalationLevel = (state.escalationLevel || 0) + 1;
      state.radiusKm = (state.radiusKm || 10) + 5;
      return "matching";
    }
    return END || "__end__";
  });

  return workflow.compile();
}

let compiledGraph = null;
try {
  compiledGraph = buildStateGraph();
} catch (err) {
  console.warn("Could not pre-compile StateGraph:", err.message);
}

/**
 * Main coordinator function called by bloodRequestController
 * Executes the agent graph, finalizes decisions, and persists AgentTrace
 */
async function runCoordinatorGraph(initialData) {
  let state = {
    requestId: initialData.requestId,
    bloodGroup: initialData.bloodGroup,
    unitsNeeded: initialData.unitsNeeded || 1,
    urgency: initialData.urgency || "normal",
    notes: initialData.notes || "",
    location: initialData.location || { type: "Point", coordinates: [] },
    radiusKm: initialData.radiusKm || 10,
    initialRadiusKm: initialData.radiusKm || 10,
    candidateDonors: [],
    rankedDonors: [],
    outreachPlan: [],
    escalationLevel: initialData.escalationLevel || 0,
    forecastFlags: [],
    traceSteps: [],
    requesterUser: initialData.requesterUser || null,
  };

  try {
    if (!compiledGraph) {
      compiledGraph = buildStateGraph();
    }

    if (compiledGraph && typeof compiledGraph.invoke === "function") {
      state = await compiledGraph.invoke(state);
    } else {
      // Direct node execution fallback if LangGraph runtime is unavailable
      state = await intakeAgent(state);
      state = await matchingAgent(state);
      state = await outreachAgent(state);
      state = await forecastAgent(state);
    }
  } catch (graphErr) {
    console.warn("LangGraph invocation error, falling back to sequential execution:", graphErr.message);
    try {
      if (!state.traceSteps.some((s) => s.agent === "intake")) state = await intakeAgent(state);
      if (!state.traceSteps.some((s) => s.agent === "matching")) state = await matchingAgent(state);
      if (!state.traceSteps.some((s) => s.agent === "outreach")) state = await outreachAgent(state);
      if (!state.traceSteps.some((s) => s.agent === "forecast")) state = await forecastAgent(state);
    } catch (fallbackErr) {
      console.error("Critical agent pipeline fallback error:", fallbackErr.message);
    }
  }

  // Generate final coordinator decision
  const notifiedCount = state.notifiedDonorsCount || state.wave1DonorIds?.length || 0;
  const totalRanked = state.rankedDonors?.length || 0;
  const radius = state.radiusKm || 10;
  const urgency = state.urgency || "normal";

  const emitCoordinatorEvent = (event, payload) => {
    const { emitToRequest, emitToUser } = require("../utils/realtime");
    if (state.requestId) emitToRequest(state.requestId, event, payload);
    if (state.requesterUser?._id) emitToUser(state.requesterUser._id, event, payload);
  };

  emitCoordinatorEvent("agent:step", {
    requestId: state.requestId,
    agent: "coordinator",
    status: "active",
    reasoning: "Synthesizing multi-agent outputs into final operational consensus...",
    output: null,
    timestamp: new Date(),
  });

  if (process.env.DEMO_MODE === "true") {
    await new Promise((r) => setTimeout(r, 800));
  }

  const finalDecision = notifiedCount > 0
    ? `Coordinated ${urgency.toUpperCase()} emergency alert: Matched ${totalRanked} candidate donors; dispatched Wave 1 alerts to top ${notifiedCount} donors within ${radius}km radius. Awaiting response.`
    : `Coordinated search across ${radius}km for ${state.bloodGroup}: No immediately available active donors found. Hospital inventory alerts flagged.`;

  const coordinatorStep = {
    agent: "coordinator",
    input: {
      stepsCompleted: (state.traceSteps || []).map((s) => s.agent),
      urgency,
      radiusKm: radius,
    },
    output: {
      finalDecision,
      notifiedDonors: notifiedCount,
      totalCandidates: totalRanked,
      outreachWaves: state.outreachPlan?.length || 1,
    },
    reasoning: finalDecision,
    timestamp: new Date(),
  };

  const finalTraceSteps = [...(state.traceSteps || []), coordinatorStep];

  // Save AgentTrace to MongoDB
  let traceDoc = null;
  if (state.requestId) {
    try {
      traceDoc = await AgentTrace.create({
        request: state.requestId,
        steps: finalTraceSteps,
        finalDecision,
      });
    } catch (dbErr) {
      console.warn("Could not persist AgentTrace to DB:", dbErr.message);
    }

    emitCoordinatorEvent("agent:step", {
      requestId: state.requestId,
      agent: "coordinator",
      status: "done",
      reasoning: finalDecision,
      output: coordinatorStep.output,
      timestamp: new Date(),
    });

    emitCoordinatorEvent("agent:complete", {
      requestId: state.requestId,
      finalDecision,
      steps: finalTraceSteps,
      timestamp: new Date(),
    });
  }

  return {
    ...state,
    finalDecision,
    traceSteps: finalTraceSteps,
    traceId: traceDoc?._id || null,
  };
}

module.exports = {
  runCoordinatorGraph,
  buildStateGraph,
};
