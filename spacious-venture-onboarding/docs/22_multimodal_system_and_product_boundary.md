# Multimodal System and Product Boundary

## Current Answer

Spacious Venture Studio OS is a multimodal AI system in V1 form, but it should be described as an operational multimodal studio system, not a generic chatbot.

It already works across these modalities:

- Text: client intake, room notes, budget/style preferences, revision requests, prompt refinement, proposal copy.
- Image: floor-plan images, site photos, style references, uploaded references, AI render outputs.
- PDF: floor-plan PDF upload, client brief PDF export, cutlist/job/label PDF exports.
- Structured data: room zones, furniture/component markers, laminate catalog records, cutlist modules, render reviews.

It does not currently implement audio or video understanding. Those should stay out of V1 unless the studio specifically needs voice notes, call transcription, or walkthrough-video review.

## Best Implementation Direction

The right implementation is not to merge everything into one public-facing AI page. Keep the public website and internal software separate:

- `public-website/` is the public lead-generation site for `spaciousventure.com`.
- `frontend/`, `server/`, and `storage/` are the internal studio software.
- The public website should collect leads and send users to WhatsApp or a quote flow.
- The studio software should remain private and use `STUDIO_ACCESS_TOKEN` if exposed outside localhost.

The new runtime contract is:

- `GET /api/system/multimodal`

That endpoint reports:

- which modalities are active,
- which provider paths are client-safe,
- which paths are draft-only,
- whether the public website and software are still separate,
- the next implementation path.

## V1 Architecture

```text
Public Website
  public-website/
  static pages, quote CTAs, WhatsApp events
  no provider keys, no studio database, no generated assets

Studio Software
  frontend/
  server/
  storage/
  onboarding, floor plans, reference library, AI renders, PDFs, cutlists
  protected by local deployment or STUDIO_ACCESS_TOKEN

Multimodal Layer
  server/services/multimodal-system.js
  provider readiness, modality contract, product-boundary status
```

## What To Build Next

1. Keep provider logic server-side only.
2. Use `/api/system/multimodal` as the readiness source for Settings/Admin UI.
3. Route future text, image, PDF, and structured-data tasks through one orchestration service.
4. Add audio/video only after the floor-plan-to-render workflow is stable and client-safe.
5. Never expose `.env`, provider status secrets, storage paths, or internal project data on the public website.

## Current Readiness Definition

The software can be considered multimodal-ready when:

- `npm run preflight` passes.
- `/api/system/multimodal` returns `isMultimodalSystem: true`.
- `clientSafeLiveReady` is true for at least one real image provider.
- `publicWebsite.servedByStudioApp` remains false.
- public website files stay in `public-website/`, separate from `frontend/`.
