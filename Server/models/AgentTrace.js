const mongoose = require("mongoose");
const { Schema } = mongoose;

const agentStepSchema = new Schema(
  {
    agent: {
      type: String,
      required: true,
      enum: ["intake", "matching", "outreach", "forecast", "coordinator"],
    },
    input: {
      type: Schema.Types.Mixed,
    },
    output: {
      type: Schema.Types.Mixed,
    },
    reasoning: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const agentTraceSchema = new Schema(
  {
    request: {
      type: Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
      index: true,
    },
    steps: [agentStepSchema],
    finalDecision: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

agentTraceSchema.index({ request: 1, createdAt: -1 });

module.exports = mongoose.model("AgentTrace", agentTraceSchema);
