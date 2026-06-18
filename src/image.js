import { getKey, parseModelName } from "./util.js";
import { generateOpenAICompatible } from "./openai.js";
import { generateXAI } from "./xai.js";
import { generateGoogle } from "./google.js";

/**
 * Common, normalized options. Each provider uses the ones it supports and
 * ignores the rest. For anything not modeled here, use `providerOptions` to
 * merge raw fields straight into the request body.
 *
 * @typedef {object} ImageOptions
 * @property {number} [n] number of images to generate
 * @property {string} [size] pixel dimensions, e.g. "1024x1024" (OpenAI)
 * @property {string} [aspectRatio] aspect ratio, e.g. "16:9" (xAI, Google)
 * @property {string} [resolution] output resolution, e.g. "1K" / "2K" (xAI, Google)
 * @property {string} [quality] quality level (OpenAI; values vary by model)
 * @property {string} [style] "vivid" or "natural" (dall-e-3)
 * @property {"transparent" | "opaque" | "auto"} [background] (gpt-image)
 * @property {"png" | "jpeg" | "webp"} [outputFormat] (gpt-image)
 * @property {number} [compression] 0-100 for jpeg/webp (gpt-image)
 * @property {"auto" | "low"} [moderation] (gpt-image)
 * @property {"url" | "b64_json"} [responseFormat] (OpenAI dall-e, xAI)
 * @property {Record<string, any>} [providerOptions] raw fields merged into the request body
 */

/**
 * @typedef {object} ImageResult
 * @property {string} data base64-encoded image, or a URL when responseFormat is "url"
 * @property {string} mediaType e.g. "image/png", "image/jpeg"
 * @property {boolean} isUrl true when `data` is a URL rather than base64
 * @property {string} [revisedPrompt] the prompt the provider actually used, when returned
 */

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";

/**
 * generate an image from a text prompt.
 *
 * the model is a "provider/model" string. options are normalized across
 * providers where possible; unsupported options are ignored, and
 * `providerOptions` passes raw fields through for anything not modeled.
 *
 * @example
 * const image = await generateImage("openai/gpt-image-1", "a red bicycle", { size: "1024x1024" });
 * writeFileSync("out.png", Buffer.from(image.data, "base64"));
 *
 * @param {string} model
 * @param {string} prompt
 * @param {ImageOptions} [options]
 * @returns {Promise<ImageResult | ImageResult[]>} a single result, or an array when `n` > 1
 */
export const generateImage = async (model, prompt, options = {}) => {
  const { provider, model: modelName } = parseModelName(model);
  const key = provider.toLowerCase();

  if (key !== "openai" && key !== "xai" && key !== "google") {
    throw new Error(`Unsupported image provider: ${provider}`);
  }

  const apiKey = getKey(key);

  let results;
  switch (key) {
    case "openai":
      results = await generateOpenAICompatible(OPENAI_ENDPOINT, modelName, prompt, apiKey, options);
      break;
    case "xai":
      results = await generateXAI(modelName, prompt, apiKey, options);
      break;
    case "google":
      results = await generateGoogle(modelName, prompt, apiKey, options);
      break;
  }

  return options.n && options.n > 1 ? results : results[0];
};
