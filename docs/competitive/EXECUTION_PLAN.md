# Execution Plan — Reach the Achieved Flow (concrete, file-level)

> Maps the roadmap (ULTIDA_GAPS_AND_ROADMAP.md) to REAL modules already in the repo.
> Repo root: `C:\Users\USER\Documents\Muskans autocad solution\THE ULTIMATE INTERIOR DESIGN APPLICATION`
> Hard constraints (from memory): geometry = source of truth; AI never invents dimensions; error-free is non-negotiable (build + 0 console errors); UI enhance-only (distinct SVG icon per tool); verify vs live, not claims.

## A. Catalog → Stage → Quotation loop (Phase A1 — HIGHEST priority)
**Goal:** place catalog products into a room, then auto-generate a GST quotation/PI — ULTIDA's answer to Agent B's moat, on real geometry.

Existing assets to reuse:
- `server/services/cutlist-engine.js` — BOM/cutlist.
- `server/services/delivery-package.js` — production package (estimate_set → cutlist + GST invoice + payment plan).
- `server/services/plan-intelligence-core.js` `generateAutoLayoutProposal` — furniture from rooms (now FIXED: 8 rooms → 22 typed).
- `server/index.js` `/production-package` (Phase-5 single estimate_set).
- Catalog table in DB (verify in `server/database/database.js`).

Concrete steps:
1. `server/services/catalog-staging.js` (NEW): `stageCatalogItem(projectId, roomId, productId, {x,y,rotation,finishId})` → writes to `scene_graph` (rooms + placed furniture + material_slot). Reuse `material_slot` + `laminate_swap_history` audit pattern.
2. Extend `/api/projects/:id/scene/blender-export` (server/index.js:2891) to include staged catalog items as instanced meshes in the Blender script (`scene-to-blender.js` already exports scene; add catalog instance pass).
3. New route `POST /api/projects/:id/quotation/from-scene` → reads placed catalog items + `cutlist-engine` + GST → returns PDF/JSON (reuse `delivery-package.js` + `generate-pro-pdf-jpeg.js`).
4. Frontend: add "Catalog" panel to the 3D/stage view; drag product → room; "Generate Quotation" button → presentation+PI.
5. Verify live on proj_1: stage 3 items → quotation JSON has 3 line items + GST.

## B. Expose RCP / Elevation / BOM as named tools (Phase A2)
- RCP: reuse `plan-intelligence-core.measurePlan` (server/index.js:1540). Add nav "RCP" → calls it, renders ceiling/electrical overlay.
- Elevation: `DrawingsElevationsStudio` (frontend) + `photo-elevation` test exists. Add nav "Elevation".
- BOM: `cutlist-engine.js` → nav "BOM" → tabulated output.
- Just UI surfacing + one route each; engines exist.

## C. Render Studio surface (Phase A3)
**Goal:** one screen, Space/Studio/Cinematic + angles, never blocks on 429.
- `server/services/visualizer-engine.js` + `render-prompt-library.js` + `image-provider.js` = render pipeline.
- `server/services/blender-renderer.js` = Cycles when Blender present (script already exported; `blender-renderer.test.js` exists).
- New `POST /api/projects/:id/renders/studio` accepting `{mode:'space'|'studio'|'cinematic', angle, fallback:'deterministic'}`:
  - if cloud AI available → polish; else → deterministic Three.js/`blender-renderer` base + watermark "geometry-accurate".
- Frontend `RenderStudioScreen`: mode tabs + angle presets + export. Distinct SVG icon.

## D. Material/finish live swap (Phase B1)
- Reuse `material_slot` (12-slot) + `laminate_swap_history` audit (Phase-4 pattern from memory).
- Route `POST /api/projects/:id/materials/swap` → updates scene_graph material_slot, re-exports Blender script.
- Matches Agent B "Real-time Customization".

## E. Lighting / Angles / Video (Phase B2–B3)
- Lighting: Three.js rig presets in `visualizer-engine.js` (day/evening/studio).
- Video: ffmpeg concat of rendered angle frames → `storage/assets/<id>_walk.mp4`. New `server/services/render-video.js` (ffmpeg wrapper). Route `POST /api/projects/:id/renders/video`.

## F. Client presentation export (Phase B4)
- Bundle: plan (premium-dxf or PNG) + elevations + render + quotation → single PDF via `generate-pro-pdf-jpeg.js`.
- Route `POST /api/projects/:id/presentation` → `storage/assets/<id>_presentation.pdf`.

## G. Workspace / Commerce (Phase C)
- INR pricing page (frontend) mirroring Agent B bands: ₹2,999 / 6,999 / 11,999 / 26,999.
- RBAC + seats: extend `server/database/database.js` (users/roles) + workspace routes (exist partially).
- Brand storefront: `catalog` table multi-tenant-lite (brand_id on products).

## H. Resilience (Phase D)
- Cloud-AI graceful degradation: wrap `gemini-service.js` / `image-provider.js` calls in try/catch → deterministic fallback (already have starter-layout; extend to render polish). 429 → never hard-fail.
- Blender host: `blender-renderer.js` already script-exports; run on a Blender machine when available.

## I. Verification gates (every phase)
1. `npm run build` green.
2. `node --test tests/*.test.js` 0 fail.
3. Live smoke on :8787: each new route returns 200 with real JSON on proj_1.
4. Browser console: 0 errors on the new screen.
5. Geometry truth: any render/DXF must trace to scene_graph dimensions (no AI-invented sizes).

## J. Suggested build order (this week)
1. A1 catalog-staging + quotation-from-scene (the moat). ✅ proves "sellable to firms".
2. A2 RCP/Elevation/BOM nav surfacing.
3. A3 Render Studio surface (deterministic-first).
4. D cloud-AI graceful fallback hardening.
5. C INR pricing page.
Then B1–B4, then G.

## K. Do NOT do (per competitive analysis)
- 20 stub tools. Ship ~12 real.
- Villa/Restoration/Mixed-Use demos.
- Chase "0.5s latency" number.
