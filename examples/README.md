# Examples

```bash
npm install
OPENAI_API_KEY=sk-... node generate.js "a red bicycle"
```

- **generate.js** - generate one image from a prompt and model: `node generate.js "<prompt>" [model]`. Saves a file named after the model, with the extension taken from the returned `mediaType`.
- **options.js** - the gpt-image-1 option set (size, quality, transparency, output format, compression), each variant saved to its own file.
- **compare.js** - the same prompt across OpenAI, xAI, and Google, each with options it supports. Providers without a key are skipped.
