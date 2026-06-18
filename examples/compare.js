import { generateImage, setKeys } from "@prsm/imagegen";
import { writeFileSync } from "fs";

setKeys({
  openai: process.env.OPENAI_API_KEY,
  xai: process.env.XAI_API_KEY,
  google: process.env.GEMINI_API_KEY,
});

const prompt = process.argv[2] || "a cat wearing a tiny top hat in a vintage armchair";

// the same prompt across providers, each with options it actually supports
const targets = [
  { model: "openai/gpt-image-1", options: { quality: "high" } },
  { model: "openai/dall-e-3", options: { size: "1024x1024" } },
  { model: "xai/grok-imagine-image-quality", options: { aspectRatio: "1:1" } },
  { model: "google/gemini-2.5-flash-image", options: { aspectRatio: "1:1" } },
];

console.log(`prompt: "${prompt}"\n`);

for (const { model, options } of targets) {
  try {
    console.log(`generating with ${model}`);
    const image = await generateImage(model, prompt, options);
    const ext = image.mediaType.split("/")[1];
    writeFileSync(`${model.replace("/", "-")}.${ext}`, Buffer.from(image.data, "base64"));
    console.log(`  saved ${model.replace("/", "-")}.${ext}`);
  } catch (error) {
    console.log(`  skipped: ${error.message}`);
  }
}
