/**
 * @typedef {import("./image.js").ImageOptions} ImageOptions
 * @typedef {import("./image.js").ImageResult} ImageResult
 */

/**
 * Google Gemini image generation via generateContent. Images are requested by
 * asking for the IMAGE response modality and come back as inline base64. Size
 * and aspect ratio are set through imageConfig.
 *
 * @param {string} modelName
 * @param {string} prompt
 * @param {string} apiKey
 * @param {ImageOptions} options
 * @returns {Promise<ImageResult[]>}
 */
export const generateGoogle = async (modelName, prompt, apiKey, options) => {
  const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };

  const imageConfig = {};
  if (options.aspectRatio) imageConfig.aspectRatio = options.aspectRatio;
  // google expects an uppercase K (e.g. "2K")
  if (options.resolution) imageConfig.imageSize = options.resolution.toUpperCase();
  if (Object.keys(imageConfig).length > 0) generationConfig.imageConfig = imageConfig;

  // let providerOptions override or extend generationConfig (e.g. a shifted
  // imageConfig location, candidateCount, safety settings)
  Object.assign(generationConfig, options.providerOptions);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google image API error: ${await response.text()}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const revisedPrompt = parts.find((p) => p.text)?.text;

  const results = parts
    .filter((p) => p.inlineData?.data)
    .map((p) => ({
      data: p.inlineData.data,
      mediaType: p.inlineData.mimeType || "image/png",
      isUrl: false,
      revisedPrompt,
    }));

  if (results.length === 0) {
    throw new Error("No image data in Google response");
  }

  return results;
};
