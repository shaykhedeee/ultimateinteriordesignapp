# Spacious Venture Production Deployment Readiness

## Production Goal

The app should run as one local-first studio product:

1. Designer starts client intake.
2. Floor plan and annotations are captured.
3. AI understands spaces and component placement.
4. One reference and fresh AI renders are generated per room.
5. PDF brief is exported for closing the client.
6. Approved brief moves to cutlist and MaxCut-style exports.
7. Generated assets and catalog selections become reusable studio memory.

## Deployment Shape

- Frontend: React + Vite build in `frontend/dist`.
- Backend: Node/Express.
- Storage: local `storage/` folder.
- Database: SQLite at `storage/spacious-venture.sqlite`.
- Static assets: `/storage`, `/images`, `/reference-library`, `/newinfo`.
- Production start: `npm run build` then `npm start`.

The Express server now serves `frontend/dist` when it exists, so one Node process can host the app and API.

## Required Commands

```bash
npm install
npm run build
npm run seed
npm run preflight
npm start
```

## Provider Defaults

Recommended smart-cost order:

```env
LIVE_IMAGE_GEN=true
IMAGE_PROVIDER=library-reuse
IMAGE_PROVIDER_FALLBACKS=gemini-imagen,openai-gpt-image-1,openai,huggingface,freepik,pollinations,pexels,curated,mock
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
HUGGINGFACE_IMAGE_MODELS=black-forest-labs/FLUX.1-schnell
POLLINATIONS_ENABLED=true
```

Gemini keys can fail for image generation even when text works. The app now supports both:

- Gemini native image generation through `generateContent` image models.
- Imagen generation through the older `imagen-*` predict endpoint.

For lowest-cost production testing, keep Hugging Face FLUX.1-schnell after Gemini and Pollinations after keyed providers. Hugging Face gives a better controllable path when a token is available. Pollinations is a no-key public draft fallback for exploration, but quality, uptime, and prompt adherence are not guaranteed enough for final client sign-off.

The sustainable credit-saving strategy is:

1. Reuse approved studio renders first.
2. Generate one fresh AI render per room only when reuse quality is below the threshold or the designer forces a fresh render.
3. Store every accepted render into the reusable library with room, style, budget, material, furniture, provider, and floor-plan tags.
4. Use free/draft providers for exploration and paid providers for final client-facing images.

## Laminate Catalog Knowledge

Catalog PDFs are stored under:

```text
reference-library/laminates
```

Current seeded catalog families include:

- Sampada TrendBook
- LVT Flooring
- Grande Collection
- Merino Play 2025
- Hanex Solid Surface
- Merino FABWood E1
- Merino EWC
- Shaurya E-Catalogue
- Additional budget brands: Advance, Virgo, NewMika, Asian Laminates, Stylam

These entries are curated product-family records with source PDF links. Exact SKU extraction should be a future importer step if the studio wants page-level shade/code lookup.

## Preflight Checks

`npm run preflight` verifies:

- frontend build exists
- storage folders exist
- SQLite opens and seeds
- laminate records are present
- reference image records are present
- provider status can be computed
- live image generation has at least one configured provider when requested

It does not print API key values.

## Production Notes

- Do not commit `.env`.
- Rotate any keys that were pasted into chat or screenshots.
- Set `STUDIO_ACCESS_TOKEN` before exposing the API outside the local machine.
- Back up `storage/` before deployment or machine transfer.
- For cloud deployment, persistent disk is required for SQLite, generated images, PDFs, floor plans, and reference library assets.
- For multi-user production, add authentication before exposing the app publicly.
- Final cutlists remain designer-verified production drafts until site measurements and working drawings are approved.
