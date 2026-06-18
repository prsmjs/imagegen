import { generateImage, setKeys } from "@prsm/imagegen";
import { writeFileSync } from "fs";

setKeys({ openai: process.env.OPENAI_API_KEY });

// gpt-image-1 exposes the richest option set: size, quality, transparency,
// output format, and compression. each variant below saves a separate file.
const prompt = "a floating golden crown with jewels";

const variants = [
  { name: "landscape-high", options: { size: "1536x1024", quality: "high" } },
  { name: "portrait", options: { size: "1024x1536" } },
  { name: "jpeg-compressed", options: { outputFormat: "jpeg", compression: 80 } },
  { name: "webp-transparent", options: { outputFormat: "webp", background: "transparent", quality: "high" } },
];

console.log(`prompt: "${prompt}"\n`);

for (const { name, options } of variants) {
  console.log(`generating ${name} (${JSON.stringify(options)})`);
  const image = await generateImage("openai/gpt-image-1", prompt, options);
  const ext = image.mediaType.split("/")[1];
  writeFileSync(`crown-${name}.${ext}`, Buffer.from(image.data, "base64"));
  console.log(`  saved crown-${name}.${ext}`);
}
