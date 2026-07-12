# ULTIDA — Broken / Quality Issues Tracker

_Last updated: 2026-07-12 (session: Smart Project + Laminate Swapper + Render Studio fixes)_

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

## ✅ VERIFIED WORKING (live, 200 OK, real payloads)
- `POST /api/projects` → 201, real id
- `POST /api/projects/:id/cad` → persists rooms_json (user zones confirmed in DB)
- `POST /api/projects/:id/renders/generate` → real `/storage/assets/...jpg` URL (offline mock)
- `POST /api/projects/:id/renders/laminate-swap` → real swapped render (offline mock PNG)

## ⚠️ KNOWN QUALITY CAVEATS (not bugs, but "quality results" concerns)
- **AI image generation is OFFLINE-MOCK by default.** Without API keys (OpenAI GPT-Image, Freepik, HF SDXL, Pollinations live), renders/swaps return a generated SVG mock or a copied studio PNG, NOT a true AI image. To get "quality results" the user must set provider keys (`.env`): `OPENAI_API_KEY`, `FREEPIK_API_KEY`, `HUGGINGFACE_API_KEY`, and `LIVE_IMAGE_GEN=true`. Reuse-threshold + reference-library matching is wired.
- **Reuse library** (`generated_assets`) starts empty → first renders always generate fresh (mock). Quality improves after seeding real renders.
- **`Quick Generate` reference gallery** (CommandCenterScreen ~L2294) still shows an Unsplash inspiration thumbnail strip — intentional as a mood-board reference, NOT a fake render output. Left as-is.
- **Smart Project action grid** (Region Edit / Camera Angles / Upscale / Video / Lineage) mostly still toasts "Executed X" without real backend work — only RCP/Elevation/BOM/Layout/Video navigate to other tabs. These are stubs pending real implementations.

## 🔲 NEXT CANDIDATES TO HARDEN (if continuing)
- Wire the Smart Project `handleRunNextAction` real actions (Region Edit, Upscale, Video) to actual endpoints instead of toasts.
- Add a real "generate with live provider" path + key-status banner so user knows they're in mock mode.
- Replace remaining demo/placeholder seams in Specialist Suite / Settings tabs.
- Add unit/integration test for the 3 new flows (project create → cad save → render gen → laminate swap).
