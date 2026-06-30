# Image Generation Setup

The app reads provider keys from `.env`. `.env` is ignored by git and should never be committed.

Keys pasted into chat should be treated as exposed. Rotate them in the provider dashboards, then paste the fresh values into `.env`.

Recommended smart-cost live setup:

```env
LIVE_IMAGE_GEN=true
IMAGE_PROVIDER=library-reuse
IMAGE_PROVIDER_FALLBACKS=gemini-imagen,huggingface,freepik,openai-gpt-image-1,openai,pollinations,pexels,curated,mock
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_TEXT_MODEL=gemini-2.5-flash
GOOGLE_AI_STUDIO_KEY_1=your_fresh_google_ai_studio_key
```

Optional fallbacks:

```env
HUGGINGFACE_API_KEY=your_fresh_huggingface_key
HUGGINGFACE_IMAGE_MODELS=black-forest-labs/FLUX.1-schnell
FREEPIK_API_KEY=your_fresh_freepik_key
PEXELS_API_KEY=your_fresh_pexels_key
OPENAI_API_KEY=your_fresh_openai_platform_key
OPENROUTER_API_KEY=your_fresh_openrouter_key_for_prompt_refinement_only
POLLINATIONS_ENABLED=true
```

Restart the API server after editing `.env`:

```bash
npm run server
```

Check active provider:

```bash
curl http://127.0.0.1:8787/api/providers/status
```

Provider order:

1. Library reuse checks existing studio-approved renders first.
2. Gemini native image generation tries `generateContent` image models such as `gemini-2.5-flash-image`.
3. Imagen `predict` is tried for `imagen-*` models when the key/project has Imagen API access.
4. Hugging Face FLUX.1-schnell is the best low-cost/free fallback currently integrated.
5. Freepik/Vyro adds another image-generation fallback when those keys are active.
6. OpenAI `gpt-image-1` works only with a real OpenAI Platform key, not an OpenRouter key.
7. Pollinations is a zero-cost public draft fallback. It is useful for exploration and credit saving, but not guaranteed for final client-quality output.
8. Pexels/curated references keep the app functional when live providers fail.
9. Mock SVG remains the final development fallback and should not be shown to clients.

Why Gemini can fail even with paid billing:

- `GEMINI_IMAGE_MODEL=imagen-4.0-generate-001` uses the Imagen `:predict` style endpoint and may require Imagen access on that Google project.
- Gemini native image models use `:generateContent` instead. The app now tries native Gemini image models before falling back to Imagen.
- Some Google keys work for text/vision but not image generation. Check `/api/providers/status` and server logs for model-level status codes without printing secrets.
- If Google returns 403, confirm the key belongs to the billed project and that the Generative Language API/AI Studio access is enabled for that project.
