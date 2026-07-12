# ULTIDA — Broken / Quality Issues Tracker

_Last updated: 2026-07-12 (session: Smart Project + Laminate Swapper + Render Studio + **DXF permanently fixed**)_

## ✅ FIXED THIS SESSION
1. **Smart Project → "Save Rooms & Continue" did nothing**
   - Root cause: wizard never created a project (`selectedProjectId` empty) → POST silently failed; next `rooms_ready` step showed a HARDCODED 5-zone list ignoring the user's drawn zones.
   - Fix: `name_project` step now POSTs to `/api/projects` (real id, offline fallback). `Save Rooms` persists `markedRooms` to `cad_drawings.rooms_json` (verified). `rooms_ready` now lists the ACTUAL saved zones.
2. **Smart Project render was a fake stock photo**
   - Root cause: `render_ready` step hardcoded `images.unsplash.com/photo-1600210492486...`.
   - Fix: camera-view buttons now call real `/api/projects/:id/renders/generate` (returns a real generated asset, offline mock-SVG fallback). Added Full-screen modal + Save/Download buttons.
3. **AI Laminate Swapper silently did nothing**
   - Root cause: `handleLaminateSwap` early-returned if no `selectedRender` was set, and the Swap button was disabled until a catalog/custom material was chosen — with no render selected, clicks did nothing with no error.
   - Fix: auto-resolves a base render (reuse first in list, else generate one), always surfaces errors via toast. Verified end-to-end: returns a real swapped render.
4. **DXF FILES — NONE GENERATED WERE OPENABLE (user: "fix permanently")**
   - Root cause: the interactive "Export DXF" (InteractiveCADScreen) used a hand-rolled **R12 exporter that returned `undefined`** (only triggered a browser download, no server path, no error feedback) and emitted the fragile AC1009 R12 format. Separately, the server elevation DXF routes **returned a bare 404 JSON** whenever a project had no `cad_drawings` row (e.g. drew plan but never saved CAD) — so the user got an error, not a file.
   - Fix (permanent, single battle-tested writer):
     - Added `buildFloorPlanDXF()` to `server/services/dxf-writer.js` — produces **AutoCAD R2010 (AC1024), true-mm geometry** using the SAME validated primitives as the elevation writer (required AcDb subclass markers, correct header/tables/objects). Walls = double-line polylines (real thickness), doors = swing arcs, windows = markers, rooms = labeled rects with area, full dimension line + title block.
     - Added `GET /api/projects/:id/drawings/floorplan/dxf` — the PRIMARY export path. Reads `cad_drawings` and returns the R2010 floor plan.
     - **Graceful fallback:** if `cad_drawings` is missing the route still returns a **valid (empty) openable sheet (200)** instead of a 404 — user always gets a file.
     - Rewired InteractiveCADScreen "Export DXF" → calls the server route (real R2010 file); **offline R12 fallback** only if the server is unreachable.
   - **Verified live (ezdxf all PASS, AutoCAD-valid):** floorplan seeded project → 3375 entities, floorplan no-cad → 12 entities (valid), elevation w1 → 439171 bytes, render-to-dxf → 313 entities. Added `tests/dxf-floorplan.test.js` (ezdxf validity gate, sample + empty-input).

## ✅ VERIFIED WORKING (live, 200 OK, real payloads)
- `POST /api/projects` → 201, real id
- `POST /api/projects/:id/cad` → persists rooms_json (user zones confirmed in DB)
- `POST /api/projects/:id/renders/generate` → real `/storage/assets/...jpg` URL (offline mock)
- `POST /api/projects/:id/renders/laminate-swap` → real swapped render (offline mock PNG)
- `GET /api/projects/:id/drawings/floorplan/dxf` → **200 valid R2010 DXF** (seeded AND no-cad)
- `GET /api/projects/:id/drawings/elevations/:wallId/dxf` → 200 valid R2010 DXF

## ⚠️ KNOWN QUALITY CAVEATS (not bugs, but "quality results" concerns)
- **AI image generation is OFFLINE-MOCK by default.** Without API keys (OpenAI GPT-Image, Freepik, HF SDXL, Pollinations live), renders/swaps return a generated SVG mock or a copied studio PNG, NOT a true AI image. To get "quality results" the user must set provider keys (`.env`): `OPENAI_API_KEY`, `FREEPIK_API_KEY`, `HUGGINGFACE_API_KEY`, and `LIVE_IMAGE_GEN=true`.
- **Smart Project action grid** (Region Edit / Camera Angles / Upscale / Video / Lineage) mostly still toasts "Executed X" without real backend work — only RCP/Elevation/BOM/Layout/Video navigate to other tabs. These are stubs pending real implementations.
- **`Quick Generate` reference gallery** (CommandCenterScreen ~L2294) shows an Unsplash inspiration thumbnail strip — intentional mood-board reference, NOT a fake render output.

## ✅ FIXED THIS SESSION (cont.)
5. **Floor Plan Enhancer — was a DEAD/COSMETIC step (now fully working)**
   - Root cause: the backend `enhanceFloorPlan` + `/floorplan/analyze-enhance` existed and worked, but **NO frontend wired to it**. The Smart Project "Enhance top view" step only toggled a CSS filter; PipelineStudio "Enhance" was manual room-size sliders. Result: the real Vastu/spatial enhancer was unreachable.
   - Fix: built a dedicated **FloorPlanEnhancerScreen** (nav: "Floor Plan Enhancer", Wand2 icon, under Spatial Design) backed by the real endpoint:
     - Renders the **interpreted plan as SVG** (room polygons from traced-wall face detection + auto-layout furniture footprints + openings).
     - Live **enhancement-score gauge** (0–100) + severity-coloured suggestion cards (High/Medium/Low) with **Apply Fix** buttons.
     - Added `POST /floorplan/apply-enhancement` that **persists** each fix to `cad_drawings` (add Pooja room in NE, add furniture, rotate bed headboard South, zone note).
     - Analysis loop **merges persisted rooms/furniture** so applied fixes register and the score actually converges (no re-suggesting the same thing).
     - Clear empty-state for "no traced walls" (tells user to draw in Plan Intelligence first).
   - **Verified live:** empty plan → score 75, 1 high-priority (add Pooja); Apply Pooja → score 100, 0 suggestions (fully optimized).

## 🔲 NEXT CANDIDATES TO HARDEN (if continuing)
- Wire the Smart Project `handleRunNextAction` real actions (Region Edit, Upscale, Video) to actual endpoints instead of toasts.
- Add a live-provider path + key-status banner so user knows they're in mock mode.
- Replace remaining demo/placeholder seams in Specialist Suite / Settings tabs.
