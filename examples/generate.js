import { generateImage, setKeys } from "@prsm/imagegen";
import { writeFileSync } from "fs";

setKeys({
  openai: process.env.OPENAI_API_KEY,
  xai: process.env.XAI_API_KEY,
  google: process.env.GEMINI_API_KEY,
});

const prompt = process.argv[2];
const model = process.argv[3] || "openai/gpt-image-1";

if (!prompt) {
  console.log("usage: node generate.js <prompt> [model]");
  console.log("");
  console.log("models:");
  console.log("  openai/gpt-image-1");
  console.log("  openai/dall-e-3");
  console.log("  xai/grok-imagine-image-quality");
  console.log("  google/gemini-2.5-flash-image");
  process.exit(1);
}

console.log(`model:  ${model}`);
console.log(`prompt: "${prompt}"\n`);

const image = await generateImage(model, prompt);

if (image.revisedPrompt) {
  console.log(`revised: "${image.revisedPrompt}"\n`);
}

const ext = image.mediaType.split("/")[1];
const filename = `${model.replace("/", "-")}.${ext}`;
writeFileSync(filename, Buffer.from(image.data, "base64"));

console.log(`saved ${filename}`);
