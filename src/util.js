/**
 * @typedef {{ openai?: string, xai?: string, google?: string, [provider: string]: string | undefined }} ApiKeys
 */

/** @type {ApiKeys} */
let globalKeys = {};

/**
 * @param {ApiKeys} keys
 */
export const setKeys = (keys) => {
  globalKeys = { ...globalKeys, ...keys };
};

const ENV_FALLBACKS = {
  openai: ["OPENAI_API_KEY"],
  xai: ["XAI_API_KEY"],
  google: ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY"],
};

/**
 * resolve a provider's key from setKeys() first, then known env vars
 *
 * @param {string} provider
 * @returns {string}
 */
export const getKey = (provider) => {
  const key = provider.toLowerCase();
  const fromConfig = globalKeys[key];
  if (fromConfig) return fromConfig;
  for (const name of ENV_FALLBACKS[key] || []) {
    if (process.env[name]) return process.env[name];
  }
  throw new Error(`No API key found for provider: ${provider}`);
};

/**
 * @param {string} model
 * @returns {{ provider: string, model: string }}
 */
export const parseModelName = (model) => {
  const parts = model.split("/");
  if (parts.length === 1) return { provider: "openai", model: parts[0] };
  return { provider: parts[0], model: parts.slice(1).join("/") };
};
