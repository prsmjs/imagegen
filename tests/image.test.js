import { describe, it, expect, afterEach, vi } from "vitest";
import { generateImage, parseModelName, setKeys } from "../src/index.js";

setKeys({ openai: "sk-test", xai: "x-test", google: "g-test" });

const jsonResponse = (obj) => new Response(JSON.stringify(obj), { status: 200 });

const mockFetch = (handler) => {
  const calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, init) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
      return handler(url);
    }),
  );
  return calls;
};

afterEach(() => vi.unstubAllGlobals());

describe("parseModelName", () => {
  it("defaults a bare name to openai", () => {
    expect(parseModelName("dall-e-3")).toEqual({ provider: "openai", model: "dall-e-3" });
    expect(parseModelName("google/gemini-2.5-flash-image")).toEqual({
      provider: "google",
      model: "gemini-2.5-flash-image",
    });
  });
});

describe("openai gpt-image", () => {
  it("sends gpt-image-only fields and reports the output format media type", async () => {
    const calls = mockFetch(() => jsonResponse({ data: [{ b64_json: "abc", revised_prompt: "a red bike" }] }));

    const result = await generateImage("openai/gpt-image-1", "a bike", {
      size: "1024x1024",
      quality: "high",
      background: "transparent",
      outputFormat: "webp",
      compression: 80,
      moderation: "low",
    });

    const body = calls[0].body;
    expect(body).toMatchObject({
      model: "gpt-image-1",
      size: "1024x1024",
      quality: "high",
      background: "transparent",
      output_format: "webp",
      output_compression: 80,
      moderation: "low",
    });
    expect(body.response_format).toBeUndefined(); // gpt-image never sends response_format
    expect(result).toEqual({ data: "abc", mediaType: "image/webp", isUrl: false, revisedPrompt: "a red bike" });
  });
});

describe("openai dall-e-3", () => {
  it("sends style and response_format and defaults to base64 png", async () => {
    const calls = mockFetch(() => jsonResponse({ data: [{ b64_json: "xyz" }] }));

    const result = await generateImage("openai/dall-e-3", "a cat", { style: "vivid", quality: "hd" });

    expect(calls[0].body).toMatchObject({
      model: "dall-e-3",
      style: "vivid",
      quality: "hd",
      response_format: "b64_json",
    });
    expect(result.mediaType).toBe("image/png");
  });

  it("marks the result as a url when response_format is url", async () => {
    mockFetch(() => jsonResponse({ data: [{ url: "https://img/x.png" }] }));
    const result = await generateImage("openai/dall-e-3", "a cat", { responseFormat: "url" });
    expect(result).toMatchObject({ data: "https://img/x.png", isUrl: true });
  });
});

describe("xai", () => {
  it("maps aspectRatio and resolution and returns jpeg", async () => {
    const calls = mockFetch(() => jsonResponse({ data: [{ b64_json: "jjj" }] }));

    const result = await generateImage("xai/grok-imagine-image-quality", "a fox", {
      aspectRatio: "16:9",
      resolution: "2K",
    });

    expect(calls[0].url).toBe("https://api.x.ai/v1/images/generations");
    expect(calls[0].body).toMatchObject({ aspect_ratio: "16:9", resolution: "2k" });
    expect(result.mediaType).toBe("image/jpeg");
  });
});

describe("google", () => {
  it("requests the IMAGE modality and parses inline base64", async () => {
    const calls = mockFetch(() =>
      jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                { text: "a serene lake" },
                { inlineData: { mimeType: "image/png", data: "g64" } },
              ],
            },
          },
        ],
      }),
    );

    const result = await generateImage("google/gemini-2.5-flash-image", "a lake", {
      aspectRatio: "16:9",
      resolution: "2k",
    });

    const config = calls[0].body.generationConfig;
    expect(config.responseModalities).toEqual(["TEXT", "IMAGE"]);
    expect(config.imageConfig).toEqual({ aspectRatio: "16:9", imageSize: "2K" });
    expect(result).toEqual({ data: "g64", mediaType: "image/png", isUrl: false, revisedPrompt: "a serene lake" });
  });

  it("throws when the response carries no image", async () => {
    mockFetch(() => jsonResponse({ candidates: [{ content: { parts: [{ text: "refused" }] } }] }));
    await expect(generateImage("google/gemini-2.5-flash-image", "x")).rejects.toThrow(/No image data/);
  });
});

describe("normalized behavior", () => {
  it("returns an array when n > 1, a single result otherwise", async () => {
    mockFetch(() => jsonResponse({ data: [{ b64_json: "a" }, { b64_json: "b" }] }));
    const many = await generateImage("openai/gpt-image-1", "x", { n: 2 });
    expect(Array.isArray(many)).toBe(true);
    expect(many).toHaveLength(2);

    mockFetch(() => jsonResponse({ data: [{ b64_json: "a" }] }));
    const one = await generateImage("openai/gpt-image-1", "x");
    expect(Array.isArray(one)).toBe(false);
  });

  it("merges providerOptions into the request body for unmodeled params", async () => {
    const calls = mockFetch(() => jsonResponse({ data: [{ b64_json: "a" }] }));
    await generateImage("openai/gpt-image-1", "x", {
      providerOptions: { some_new_param: "value", n: 1 },
    });
    expect(calls[0].body.some_new_param).toBe("value");
  });

  it("throws for an unsupported provider", async () => {
    await expect(generateImage("anthropic/claude", "x")).rejects.toThrow(/Unsupported image provider/);
  });

  it("surfaces upstream error text", async () => {
    mockFetch(() => new Response("content policy violation", { status: 400 }));
    await expect(generateImage("openai/gpt-image-1", "x")).rejects.toThrow(/content policy violation/);
  });
});
