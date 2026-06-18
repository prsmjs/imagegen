/**
 * @typedef {import("./image.js").ImageOptions} ImageOptions
 * @typedef {import("./image.js").ImageResult} ImageResult
 */

/**
 * xAI image generation. The response shape matches OpenAI, but the request
 * accepts aspect_ratio and resolution rather than size/quality/style, and
 * images come back as jpeg.
 *
 * @param {string} modelName
 * @param {string} prompt
 * @param {string} apiKey
 * @param {ImageOptions} options
 * @returns {Promise<ImageResult[]>}
 */
export const generateXAI = async (modelName, prompt, apiKey, options) => {
  const body = {
    model: modelName,
    prompt,
    response_format: options.responseFormat || "b64_json",
  };

  if (options.n) body.n = options.n;
  if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options.resolution) body.resolution = options.resolution.toLowerCase();

  Object.assign(body, options.providerOptions);

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`xAI image API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.map((image) => ({
    data: image.b64_json || image.url,
    mediaType: "image/jpeg",
    isUrl: !image.b64_json,
    revisedPrompt: image.revised_prompt,
  }));
};
