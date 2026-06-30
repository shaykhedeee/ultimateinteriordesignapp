# Fast Accurate Render Studio

## Product Decision

Spacious Venture does not need a generic interior-design CRM or an AI experiment dashboard. It needs a digital experience centre that helps a designer move a client from requirements to a convincing first visual quickly.

The primary flow is:

1. Add Client.
2. Capture rooms, style, budget, practical requirements, and disliked finishes.
3. Upload the floor plan and mark room zones/components.
4. Add exact furniture/module requirements.
5. Generate a small set of controlled render variants.
6. Select, revise, or save a correction rule.
7. Reuse approved images for similar future clients.
8. Export the approved direction into the PDF brief and cutlist project.

## Accuracy Strategy

The application should not promise exact CAD geometry from a text-to-image model. Accuracy improves through structured inputs and a visible human selection loop:

- Manual floor-plan zones and component markers are the source of truth.
- Site photos describe walls, openings, and current conditions.
- Zoomed floor-plan/control images are reserved for the precision path.
- Exact furniture requirements are injected into the prompt.
- A deterministic compiler assembles project, room, style, budget, layout, material, and correction rules.
- The studio generates up to four variants so the designer can select the best result.
- Failed render corrections are saved as exact prompt patches and reused later.
- Accepted outputs are stored as reusable library assets.

## Implemented In This Pass

- Added `AI Renders` to the main studio navigation.
- Added a saved-project shortcut when the render desk has no active client.
- Added an active render studio with:
  - room/theme/budget selection
  - quick, balanced, and precision modes
  - up to four variants
  - kitchen and living-room accuracy rules
  - site photo, style reference, zoomed control image, and full floor-plan inputs
  - exact furniture requirement field
  - visible floor-plan constraints
  - reusable matches
  - correction memory
  - visible prompt output
  - always-visible Generate Variants action
- Added structured backend render-plan compilation.
- Added multi-variant asset generation and reusable-library indexing.
- Added SQLite-backed `render_corrections` persistence.
- Added render corrections to full backup/export/import.
- Kept live image generation behind configured providers and safe `.env` settings.

## Backend Contract

`POST /api/projects/:id/renders/generate`

The multipart request accepts:

- `room`
- `style`
- `budgetTier`
- `modelTier`
- `variantCount`
- `cameraAngle`
- room-specific rules
- `furnitureRequirement`
- `customInstruction`
- `layoutAnnotations`
- `floorPlanNotes`
- optional visual input files

The response returns:

- `asset`: first variant for backward compatibility
- `variants`: generated/stored alternatives
- `renderPlan`: compiled prompt, layout constraints, tags, and model plan
- `reuseMatches`: relevant saved images
- `correctionsApplied`: prompt-patch rules used

## Provider Safety

- Never commit live API keys.
- Treat keys pasted into chat as exposed and rotate them.
- Use `.env` for live provider keys.
- Current production-capable adapters are OpenAI and Freepik, with Pexels/curated/mock fallback.
- The precision plan is ready for a future Flux/ControlNet adapter using a zoomed floor-plan/control image.

## Recommended Next Pass

1. Add a real Flux/ControlNet provider adapter for the precision path.
2. Add accept/reject/star status to render variants and carry only accepted images into the PDF brief.
3. Generate first-page PDF preview thumbnails.
4. Add per-project file history on project detail and brief screens.
5. Add share-with-client packaged ZIP export or expiring links.
6. Add a first-run studio branding/setup wizard.

## QA Evidence

- Production frontend build passed.
- Render API generated variant batches and stored assets.
- Marker test confirmed floor-plan zones, TV unit, sofa placement, and exact furniture requirements were included in the compiled prompt.
- Render corrections are included in backup export metadata.
- In-app browser verified:
  - AI Renders navigation
  - saved-project shortcut
  - active render studio
  - visible layout constraints and correction memory
  - Generate Variants interaction
  - no console warnings or errors
- Desktop and mobile screenshots:
  - `qa-artifacts/render-studio-desktop.png`
  - `qa-artifacts/render-studio-mobile.png`
