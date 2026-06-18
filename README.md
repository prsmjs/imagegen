<p align="center">
  <img src=".github/logo.svg" width="80" height="80" alt="@prsm/image logo">
</p>

<h1 align="center">@prsm/image</h1>

<p align="center">
  <a href="https://github.com/prsmjs/image/actions/workflows/test.yml"><img src="https://github.com/prsmjs/image/actions/workflows/test.yml/badge.svg" alt="test"></a>
  <a href="https://www.npmjs.com/package/@prsm/image"><img src="https://img.shields.io/npm/v/@prsm/image.svg" alt="npm"></a>
</p>

Image generation across OpenAI, xAI, and Google behind one function.

Image APIs differ a lot between providers, and a parameter that exists for one often has no equivalent in another. This package normalizes the options that map cleanly across providers, ignores the ones a given model doesn't support, and gives you a raw passthrough for anything provider-specific.

## Installation

```bash
npm install @prsm/image
```

Node 24 or newer.

## Usage

```js
import { generateImage, setKeys } from "@prsm/image";
import { writeFileSync } from "fs";

setKeys({ openai: process.env.OPENAI_API_KEY });

const image = await generateImage("openai/gpt-image-1", "a red bicycle against a white wall", {
  size: "1024x1024",
});

writeFileSync("bicycle.png", Buffer.from(image.data, "base64"));
```

Keys resolve from `setKeys()` first, then environment variables (`OPENAI_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`).

## Result

```js
{
  data,          // base64 string, or a URL when responseFormat is "url"
  mediaType,     // "image/png", "image/jpeg", "image/webp"
  isUrl,         // true when data is a URL rather than base64
  revisedPrompt, // the prompt the provider actually used, when returned
}
```

`generateImage` returns a single result, or an array of results when you pass `n` greater than 1.

## Options

Pass any of these. A provider uses the ones it supports and ignores the rest.

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

### Raw passthrough

Provider APIs move quickly. When a model adds a parameter this package doesn't model yet, `providerOptions` is merged directly into the request body:

```js
await generateImage("openai/gpt-image-1", "a city at night", {
  providerOptions: { partial_images: 2 },
});
```

## Providers

| Provider | Prefix | Example models |
|---|---|---|
| OpenAI | `openai/` | `openai/gpt-image-1`, `openai/dall-e-3` |
| xAI | `xai/` | `xai/grok-imagine-image-quality` |
| Google | `google/` | `google/gemini-2.5-flash-image` |

OpenAI's `gpt-image-*` models return base64 and accept `background`, `outputFormat`, `compression`, and `moderation`. The `dall-e-3` model adds `style` and supports `responseFormat`. xAI returns jpeg and uses `aspectRatio` and `resolution`. Google returns inline base64 through the `generateContent` API and sets dimensions through `aspectRatio` and `resolution`.

## Multiple images

```js
const images = await generateImage("openai/gpt-image-1", "a paper airplane", { n: 3 });
images.forEach((img, i) => writeFileSync(`plane-${i}.png`, Buffer.from(img.data, "base64")));
```

## License

ISC
