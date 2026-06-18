# Image Generation

Generate images from text prompts across OpenAI, xAI, and Google.

## Basic usage

```js
import { generateImage } from "@prsm/imagegen";
import { writeFileSync } from "fs";

const image = await generateImage("openai/gpt-image-1", "a cat wearing a tiny top hat");

writeFileSync("output.png", Buffer.from(image.data, "base64"));
```

`generateImage` returns a single result, or an array of results when you pass `n` greater than 1.

## Result

```js
{
  data,          // base64 string, or a URL when responseFormat is "url"
  mediaType,     // "image/png", "image/jpeg", "image/webp"
  isUrl,         // true when data is a URL rather than base64
  revisedPrompt, // the prompt the provider actually used, when returned
}
```

Use `mediaType` to pick the file extension:

```js
const ext = image.mediaType.split("/")[1]; // "png"
writeFileSync(`output.${ext}`, Buffer.from(image.data, "base64"));
```

## Providers

```js
// OpenAI - gpt-image and dall-e families
await generateImage("openai/gpt-image-1", "a sunset over mountains");
await generateImage("openai/dall-e-3", "a sunset over mountains");

// xAI - returns jpeg
await generateImage("xai/grok-imagine-image-quality", "a sunset over mountains");

// Google - returns inline base64 via the generateContent API
await generateImage("google/gemini-2.5-flash-image", "a sunset over mountains");
```

## Options

Image APIs differ a lot between providers. Pass any of these options; a provider uses the ones it supports and ignores the rest.

| Option | Type | Providers |
|---|---|---|
| `n` | number | OpenAI, xAI |
| `size` | `"1024x1024"`, ... | OpenAI |
| `aspectRatio` | `"16:9"`, `"1:1"`, ... | xAI, Google |
| `resolution` | `"1K"`, `"2K"` | xAI, Google |
| `quality` | model-specific | OpenAI |
| `style` | `"vivid"`, `"natural"` | OpenAI dall-e-3 |
| `background` | `"transparent"`, `"opaque"`, `"auto"` | OpenAI gpt-image |
| `outputFormat` | `"png"`, `"jpeg"`, `"webp"` | OpenAI gpt-image |
| `compression` | `0`-`100` | OpenAI gpt-image |
| `moderation` | `"auto"`, `"low"` | OpenAI gpt-image |
| `responseFormat` | `"url"`, `"b64_json"` | OpenAI dall-e, xAI |
| `providerOptions` | object | all (raw passthrough) |

### OpenAI dall-e-3

```js
await generateImage("openai/dall-e-3", "a golden crown", {
  size: "1024x1024",
  quality: "hd",
  style: "vivid",
});
```

### OpenAI gpt-image

`gpt-image-*` models return base64 and add transparency, output format, and compression controls.

```js
await generateImage("openai/gpt-image-1", "a golden crown", {
  size: "1536x1024",
  quality: "high",
  outputFormat: "webp",
  background: "transparent",
});
```

Transparent backgrounds require `png` or `webp`.

### xAI and Google

These use `aspectRatio` and `resolution` instead of pixel sizes.

```js
await generateImage("xai/grok-imagine-image-quality", "a landscape", {
  aspectRatio: "16:9",
  resolution: "2K",
});

await generateImage("google/gemini-2.5-flash-image", "a landscape", {
  aspectRatio: "16:9",
});
```

## Raw passthrough

Provider image APIs move quickly. When a model adds a parameter this package doesn't model yet, `providerOptions` is merged directly into the request body.

```js
await generateImage("openai/gpt-image-1", "a city at night", {
  providerOptions: { partial_images: 2 },
});
```

For Google, `providerOptions` is merged into `generationConfig`, so you can reach fields like safety settings or a shifted image-config location without waiting for a package update.

## Multiple images

Pass `n` greater than 1 to get an array back.

```js
const images = await generateImage("openai/gpt-image-1", "a paper airplane", { n: 3 });
images.forEach((img, i) =>
  writeFileSync(`plane-${i}.png`, Buffer.from(img.data, "base64")),
);
```

## Revised prompts

Some providers rewrite your prompt before generating. When they do, it comes back as `revisedPrompt`.

```js
const image = await generateImage("openai/dall-e-3", "a cat in a hat");
console.log(image.revisedPrompt);
```

## API keys

Keys resolve from `setKeys()` first, then environment variables.

```js
import { setKeys } from "@prsm/imagegen";

setKeys({
  openai: process.env.OPENAI_API_KEY,
  xai: process.env.XAI_API_KEY,
  google: process.env.GEMINI_API_KEY,
});
```

| Provider | Env var |
|----------|---------|
| openai | `OPENAI_API_KEY` |
| xai | `XAI_API_KEY` |
| google | `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` |

## Comparing providers

```js
import { generateImage } from "@prsm/imagegen";
import { writeFileSync } from "fs";

const prompt = "a robot playing chess with a penguin";
const targets = [
  { model: "openai/gpt-image-1", options: { quality: "high" } },
  { model: "xai/grok-imagine-image-quality", options: { aspectRatio: "1:1" } },
  { model: "google/gemini-2.5-flash-image", options: { aspectRatio: "1:1" } },
];

for (const { model, options } of targets) {
  const image = await generateImage(model, prompt, options);
  const ext = image.mediaType.split("/")[1];
  writeFileSync(`${model.replace("/", "-")}.${ext}`, Buffer.from(image.data, "base64"));
}
```
