# Image Generation Setup

The app reads provider keys from `.env`. `.env` is ignored by git and should never be committed.

Keys pasted into chat should be treated as exposed. Rotate them in the provider dashboards, then paste the fresh values into `.env`.

Minimum live setup:

```env
LIVE_IMAGE_GEN=true
IMAGE_PROVIDER=openai
IMAGE_PROVIDER_FALLBACKS=freepik,pexels,mock
OPENAI_API_KEY=your_fresh_openai_key
```

Optional fallbacks:

```env
FREEPIK_API_KEY=your_fresh_freepik_key
PEXELS_API_KEY=your_fresh_pexels_key
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

1. OpenAI image generation saves generated PNGs into `storage/assets`.
2. Freepik image generation saves generated PNGs into `storage/assets`.
3. Pexels downloads attributed stock references into `storage/assets`.
4. Mock SVG generation remains the last fallback so the app always works.
