/**
 * @typedef {import("./image.js").ImageOptions} ImageOptions
 * @typedef {import("./image.js").ImageResult} ImageResult
 */

const FORMAT_TO_MEDIA_TYPE = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * OpenAI and OpenAI-compatible image generation (also used for xAI).
 *
 * gpt-image-* models always return base64 and accept background, output_format,
 * output_compression, and moderation. dall-e-3 accepts style and response_format.
 *
 * @param {string} endpoint
 * @param {string} modelName
 * @param {string} prompt
 * @param {string} apiKey
 * @param {ImageOptions} options
 * @returns {Promise<ImageResult[]>}
 */
export const generateOpenAICompatible = async (endpoint, modelName, prompt, apiKey, options) => {
  const isGptImage = modelName.startsWith("gpt-image");

  const body = { model: modelName, prompt };

  if (options.n) body.n = options.n;
  if (options.size) body.size = options.size;
  if (options.quality) body.quality = options.quality;

  if (isGptImage) {
    if (options.background) body.background = options.background;
    if (options.outputFormat) body.output_format = options.outputFormat;
    if (options.compression != null) body.output_compression = options.compression;
    if (options.moderation) body.moderation = options.moderation;
  } else {
    // dall-e family and xai accept response_format and (dall-e-3) style
    body.response_format = options.responseFormat || "b64_json";
    if (options.style) body.style = options.style;
  }

  Object.assign(body, options.providerOptions);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Image API error: ${await response.text()}`);
  }

  const data = await response.json();
  const mediaType = isGptImage
    ? FORMAT_TO_MEDIA_TYPE[options.outputFormat] || "image/png"
    : "image/png";

  return data.data.map((image) => ({
    data: image.b64_json || image.url,
    mediaType,
    isUrl: !image.b64_json,
    revisedPrompt: image.revised_prompt,
  }));
};
