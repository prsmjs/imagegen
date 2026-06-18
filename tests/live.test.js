import { describe, it, expect } from "vitest";
import { generateImage, setKeys } from "../src/index.js";

const liveEnabled = process.env.IMAGE_LIVE === "1";

setKeys({
  openai: process.env.OPENAI_API_KEY,
  xai: process.env.XAI_API_KEY,
  google: process.env.GEMINI_API_KEY,
});

const when = (key) => (liveEnabled && process.env[key] ? it : it.skip);

describe("live image generation", () => {
  when("OPENAI_API_KEY")("openai returns base64 image data", async () => {
    const result = await generateImage("openai/gpt-image-1", "a single red circle on white", {
      size: "1024x1024",
    });
    expect(result.isUrl).toBe(false);
    expect(result.data.length).toBeGreaterThan(1000);
    expect(result.mediaType).toMatch(/^image\//);
  }, 60000);

  when("GEMINI_API_KEY")("google returns inline image data", async () => {
    const result = await generateImage("google/gemini-2.5-flash-image", "a single blue square");
    expect(result.data.length).toBeGreaterThan(1000);
  }, 60000);
});
