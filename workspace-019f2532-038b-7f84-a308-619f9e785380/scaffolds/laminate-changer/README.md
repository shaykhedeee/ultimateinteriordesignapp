# Laminate Changer Tool Scaffold

This scaffold is a **production-grade starting point** for a premium `laminate changer` tool inside your design/render vertical.

## What this tool should do

Allow a user to:
- select a surface manually or use auto-detection
- choose a laminate / veneer / panel finish from catalog or reference image
- preserve geometry, lighting, and neighboring materials
- preview the edit plan before spending credits / queueing a job
- run the edit asynchronously
- save the result as a child render/version
- critique the result and suggest retry/fix paths

## Supported surface types
- wardrobe shutters
- kitchen cabinet fronts
- TV panels
- wall paneling
- vanity shutters
- partition cladding
- laminate flooring (optional, advanced)
- headboard panels
- built-in storage fronts

## Why this is more advanced than a simple inpaint tool

A basic inpaint tool only says "replace this area".

A serious laminate changer should additionally care about:
- **surface category**
- **grain direction**
- **panel seam continuity**
- **lighting and reflections**
- **finish realism**
- **neighboring material compatibility**
- **edge preservation**
- **style consistency with the room**

## File map

- `types.ts` — domain types
- `schemas.ts` — zod schemas and validation
- `prompts.ts` — AURA plan + critique prompts
- `laminate-changer.service.ts` — API/domain orchestration service
- `laminate-changer.processor.ts` — async worker pipeline
- `laminate-changer.api.ts` — sample route/controller wiring
- `useLaminateChanger.ts` — frontend state hook
- `LaminateChangerWorkspace.tsx` — premium workspace/panel UI
- `SurfaceCandidateOverlay.tsx` — overlay for selecting surfaces

## Suggested workflow

1. user opens a render or room
2. tool loads source render + zone/design context
3. user selects surface or runs auto-detect
4. tool proposes compatible laminate materials
5. AURA produces a structured edit plan
6. user reviews plan + must_keep / must_avoid
7. job is queued
8. processor runs provider edit + validation + critique
9. result is saved as a child render
10. user can accept / retry / refine mask / branch

## Integration points you will need in your real repo

- `fileAssetsRepo`
- `renderHistoryRepo`
- `designPlansRepo`
- `jobsRepo`
- `catalogRepo`
- `auraClient`
- `inferenceGateway`
- `auditLogger`

## Expected backend capabilities

- `image_edit`
- `render_critique`
- `room_semantics`
- `style_recommendation`

## Recommended future enhancements

- multi-surface batch material replacement
- laminate catalog search with embeddings
- finish tone auto-harmonization
- edge and handle preservation for cabinetry
- cabinet segmentation model
- grain-direction preview overlay
- gloss/matte level controls
- "keep handles/hardware unchanged" lock
- change proposal diff view

## Example request

```json
{
  "renderId": "uuid",
  "projectId": "uuid",
  "zoneId": "uuid",
  "selectionMode": "manual_mask",
  "maskAssetId": "uuid",
  "surfaceType": "wardrobe_shutter",
  "material": {
    "materialId": "uuid",
    "name": "Warm Walnut Laminate",
    "finish": "matte",
    "grainDirection": "vertical"
  },
  "preserveHardware": true,
  "notes": "Keep profile handles and surrounding wall paint unchanged."
}
```

## Important rule

If auto-detection confidence is low, force a manual confirmation path.
Do not silently edit the wrong surface.
