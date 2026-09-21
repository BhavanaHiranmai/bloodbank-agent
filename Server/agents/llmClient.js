let Anthropic;
try {
  Anthropic = require("@anthropic-ai/sdk");
} catch (err) {
  Anthropic = null;
}

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !Anthropic) return null;
  try {
    return new Anthropic({ apiKey });
  } catch (err) {
    console.warn("Could not initialize Anthropic client:", err.message);
    return null;
  }
};

/**
 * Executes a call to Claude with graceful fallback
 * @param {Object} options
 * @param {string} options.system - Optional system instructions
 * @param {string} options.prompt - Prompt content
 * @param {string} [options.model="claude-sonnet-4-6"] - Claude model
 * @param {number} [options.maxTokens=1000] - Max tokens
 * @param {Function} options.fallbackHandler - Synchronous or async function returning fallback result
 */
async function callClaude({ system, prompt, model = "claude-sonnet-4-6", maxTokens = 1000, fallbackHandler }) {
  const client = getAnthropicClient();
  if (!client) {
    if (typeof fallbackHandler === "function") {
      return await fallbackHandler();
    }
    return null;
  }

  try {
    const response = await client.messages.create({
      model: model || "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: system || "You are a clinical decision intelligence assistant for BloodLink, an emergency blood donation network.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content?.[0]?.text || "";
    return text.trim();
  } catch (err) {
    console.warn(`Claude API call failed (${err.message}). Falling back to deterministic agent heuristics.`);
    if (typeof fallbackHandler === "function") {
      return await fallbackHandler();
    }
    return null;
  }
}

module.exports = {
  callClaude,
  getAnthropicClient,
};
