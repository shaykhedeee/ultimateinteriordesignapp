# ULTIDA Canonical Flow — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement task-by-task. Each task = 2–5 min. Verify with `node_modules/.bin/vite build` (exit 0) + `node --test "tests/*.test.js"` (53/53) + `node scripts/smoke-test.mjs` (21/21) after every change. Server: `exec node server/index.js </dev/null`.

**Goal:** Make the app follow the user's exact stated flow end-to-end as a single guided, acknowledged journey — from floor-plan upload to handed-off cutlist + laminate selection — with no skipped step.

**Architecture:** The app already has all 14 screens and most backend services. The work is (1) **orchestration** — a single `FlowController` state machine that drives the existing screens in order with real-time acknowledgement, (2) **auto-Vastu** — mutate the plan (insert Pooja unit, fix bed placement) server-side, (3) **UX pickers** — kitchen U/L shape, modular TV-unit library, room/zone marking, (4) **SKP unlock gate**, (5) **combine-elevations→PDF**, and (6) **cutlist + laminate/color** finalization. Reuse existing routes/services; add only what's missing.

**Tech Stack:** React 18 + Vite (frontend), Express + SQLite (backend, `server/index.js`), `server/services/*` (pipeline-orchestrator, layout-generator, cutlist-engine, component-color-service, elevation-analyzer, dxf-generator, pdf-elevation, skp-reader, image-provider).

**Current working dir:** `/c/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION`

---

## Canonical flow (the contract — every step must be present + acknowledged)

1. User uploads floor plan → app deep-analyzes → **speaks/prints acknowledgement** ("OKAY I SEE IT IS A 3BHK BEAUTIFUL APARTMENT")
2. Client intake: name / budget / style
3. App confirms everything in real time, takes accurate measurements (from plan)
4. Enhances floor plan → brings it to life
5. **Adds Pooja unit per Vastu if absent**
6. **Bed placement per Vastu**
7. Suggests kitchen type → user picks **U-shape / L-shape** template
8. TV unit style from **vast modular library** → user picks
9. User manually adds anything missed
10. User **marks all rooms/zones** (names from analysis)
11. AI deeply studies the altered plan → brings it to life
12. Generate **3D renders per space** (JPEG)
13. Refine via AURA
14. From 3D → **SKP file** of space/whole place (multi-render unlock gate)
15. Each wall → **2D elevation with furniture** in **PDF + DXF**
16. **Combine all 2D → single PDF**
17. **Cutlist + laminate/color selection**
18. Handoff

---

## Phase A — Flow spine & real-time acknowledgement (the backbone)

### Task A1: Create `FlowController` state machine
**Objective:** Single source of truth for the 18-step journey so screens advance only on completion and the current step is always visible.

**Files:**
- Create: `frontend/src/flow/FLOW_STEPS.js` (export `FLOW_STEPS` array: id, label, screen, ackText, gate)
- Create: `frontend/src/flow/useFlow.js` (hook: `currentStep`, `next()`, `back()`, `ack(text)`, `setMeasurements()`, persisted in `localStorage` + `project.flow_state` column)

**Step 1:** Define the 18 steps with `screen` mapping:
```js
export const FLOW_STEPS = [
  { id:'upload',    label:'Upload Floor Plan',  screen:'cad',      ack:'OKAY I SEE IT IS A {type} APARTMENT' },
  { id:'intake',    label:'Client Intake',       screen:'brief' },
  { id:'enhance',   label:'Enhance Plan',        screen:'cad' },
  { id:'vastu',     label:'Vastu Auto-Fix',      screen:'cad' },
  { id:'kitchen',   label:'Kitchen Template',    screen:'cad' },
  { id:'tvunit',    label:'TV Unit Style',       screen:'studio' },
  { id:'manual',    label:'Manual Add',          screen:'studio' },
  { id:'markrooms', label:'Mark Rooms/Zones',    screen:'roommarker' },
  { id:'study',     label:'AI Studies Plan',     screen:'studio' },
  { id:'render',    label:'3D Renders',          screen:'renders' },
  { id:'refine',    label:'Refine (AURA)',       screen:'renders' },
  { id:'skp',       label:'SKP Export',          screen:'renders' },
  { id:'elev',      label:'2D Elevations',       screen:'drawings' },
  { id:'combine',   label:'Combine PDF',         screen:'drawings' },
  { id:'cutlist',   label:'Cutlist',             screen:'cutlist' },
  { id:'laminate',  label:'Laminate & Color',    screen:'materials' },
  { id:'handoff',   label:'Handoff',             screen:'presentation' },
];
```
**Step 2:** Write `useFlow` with localStorage fallback + `POST /api/projects/:id/flow` save.
**Step 3:** Build `node --test` trivially? No — frontend-only. Verify by `vite build` green.
**Step 4:** Commit `git commit -m "feat(flow): add FlowController state machine + 18-step contract"`

### Task A2: Wire `FlowController` into `App.jsx` render switch
**Objective:** Replace the static `TAB_META`/switch with step-driven navigation + a persistent step ribbon.

**Files:**
- Modify: `frontend/src/App.jsx:97-404` (TAB_META + switch) — add `<FlowRibbon/>` + route by `FLOW_STEPS[currentStep].screen`
- Create: `frontend/src/components/flow/FlowRibbon.jsx` (horizontal stepper, shows ack toast on step enter)

**Step 1:** Render `<FlowRibbon steps={FLOW_STEPS} current={currentStep} onJump={...}/>` above the screen.
**Step 2:** On each screen's `onComplete`, call `flow.next()` instead of `setActiveTab`.
**Step 3:** `vite build` green.
**Step 4:** Commit.

### Task A3: Spoken/printed acknowledgement of floor-plan analysis
**Objective:** When analysis finishes, print the "OKAY I SEE IT IS A 3BHK…" line (TTS via `text_to_speech`/Web Speech API; always show as banner).

**Files:**
- Modify: `frontend/src/screens/InteractiveCADScreen.jsx` (on analysis-complete → call `flow.ack(...)`)
- Modify: `server/index.js` `POST /api/projects/:id/floorplan` job (line ~530) — store `analysis_summary` (BHK count, rooms) on `floor_plan_versions`

**Step 1:** In `InteractiveCADScreen`, after `floor-plan-versions/:id/review` returns, compute `ackText = \`OKAY I SEE IT IS A ${bhk} ${type} APARTMENT\`` and show banner + optional Web Speech `speechSynthesis.speak`.
**Step 2:** `vite build` + smoke (analysis endpoint already 200).
**Step 3:** Commit `git commit -m "feat(flow): spoken + banner floor-plan acknowledgement"`

---

## Phase B — Auto-Vastu (insert Pooja + bed placement)

### Task B1: Server `autoVastu` mutation
**Objective:** Given a project's `cad_drawings` + brief, insert a Pooja unit if none exists and correct bed placement to Vastu zones; return the diff.

**Files:**
- Create: `server/services/vastu-auto.js` (`autoVastu(projectId)` → reads cad + `layout-generator` vastu rules, inserts `furniture_json` pooja mandir in NE, repositions `bed` modules to S/W, writes back)
- Modify: `server/index.js` — add `POST /api/projects/:id/vastu/auto-apply`

**Step 1:** Write failing test `tests/vastu-auto.test.js`: seed proj with no pooja → `autoVastu` → furniture contains `type:'pooja'`.
**Step 2:** Run `node --test tests/vastu-auto.test.js` → FAIL.
**Step 3:** Implement `vastu-auto.js` using existing `layout-generator.js` vastu zone logic (NE pooja, S/W bed).
**Step 4:** Test PASS. Commit.
**Step 5:** Re-run full `node --test` (53+1).

### Task B2: Vastu step UI in `InteractiveCADScreen`
**Objective:** Show the auto-Vastu diff (added Pooja unit, moved beds) with Accept/Reject; on accept call `autoVastu`.

**Files:**
- Modify: `frontend/src/screens/InteractiveCADScreen.jsx` (add Vastu panel + `flow.next()` on accept)
**Step 1:** Add panel reading `GET /api/projects/:id/vastu/preview` (dry-run) showing changes.
**Step 2:** Accept → `POST /api/projects/:id/vastu/auto-apply`.
**Step 3:** `vite build` green. Commit.

---

## Phase C — Kitchen U/L picker + modular TV-unit library

### Task C1: Kitchen shape template picker
**Objective:** After Vastu, suggest kitchen type; user picks U-shape / L-shape; applies a layout template.

**Files:**
- Reuse: `scripts/generate-kitchen-option2.mjs` (L-shape) + existing U-shape generator
- Create: `server/services/kitchen-templates.js` (`applyKitchenTemplate(projectId, 'L'|'U')`)
- Modify: `server/index.js` — `POST /api/projects/:id/kitchen/template`
- Modify: `frontend/src/screens/InteractiveCADScreen.jsx` — kitchen picker UI (2 cards: U / L, with thumbnail)

**Step 1:** Test: `applyKitchenTemplate('proj_1','L')` → cad furniture has L-shaped kitchen run.
**Step 2:** Implement + route. Test PASS.
**Step 3:** UI cards call route; `vite build`.
**Step 4:** Commit.

### Task C2: Modular TV-unit library picker
**Objective:** Vast library of modular TV units; user picks one for the living space.

**Files:**
- Create: `server/services/tv-unit-library.js` (export `TV_UNIT_LIBRARY` = 12+ styles: louvered walnut, CNC teak, fluted, floating, Japandi, etc., each with dims + `moduleType:'tv-unit'`)
- Modify: `server/index.js` — `GET /api/tv-units` + `POST /api/projects/:id/tv-unit/apply`
- Modify: `frontend/src/screens/DesignStudioScreen.jsx` or `Render3DStudio.jsx` — grid picker

**Step 1:** Test `TV_UNIT_LIBRARY.length >= 12`.
**Step 2:** Route returns library; apply inserts tv-unit furniture.
**Step 3:** UI grid; `vite build`. Commit.

---

## Phase D — Room/zone marking

### Task D1: Room marker screen
**Objective:** User marks/clicks rooms on the plan and names them (names pre-filled from analysis).

**Files:**
- Reuse: `frontend/src/screens/RoomAnnotator.jsx` (exists) — wire as `flow.markrooms` step
- Modify: `App.jsx` switch `case 'roommarker': return <RoomAnnotator .../>`
- Modify: `server/index.js` — ensure `POST /api/projects/:id/rooms/mark` persists room names → `cad_drawings.rooms_json`

**Step 1:** Confirm `RoomAnnotator` saves to `cad_drawings.rooms_json` (add route if missing).
**Step 2:** `vite build` + smoke (add `mark-rooms` check). Commit.

---

## Phase E — 3D renders → SKP unlock → 2D elevations → combine PDF

### Task E1: Multi-render SKP unlock gate
**Objective:** User must generate N renders (e.g. 3) to "unlock" SKP export; then `POST /api/projects/:id/skp/generate` builds SKP from the 3D scene / render script.

**Files:**
- Modify: `server/index.js` — add `POST /api/projects/:id/skp/generate` (uses `render.sketchup_script_txt` + `skp-reader` to write a `.skp` via `server/services/skp-writer.js`; if missing, generate from scene graph)
- Modify: `frontend/src/screens/Render3DStudio.jsx` — render counter; when `rendersGenerated >= UNLOCK_N` enable "Export SKP" button; show lock state otherwise

**Step 1:** Test `skp/generate` returns a `.skp` buffer for a project with ≥3 renders.
**Step 2:** Implement `skp-writer.js` (minimally valid SKP or wrap sketchup script). Route returns file.
**Step 3:** UI gate + button. `vite build`. Commit.

### Task E2: Combine all 2D elevations → single PDF
**Objective:** Collect every wall elevation (DXF/PDF) into one multi-page PDF deliverable.

**Files:**
- Modify: `server/index.js` — add `GET /api/projects/:id/elevations/combined.pdf` (merge per-wall `renderElevationPDF` pages; reuse `pdf-lib` if available else `pdf-merge`/`pdfkit`)
- Modify: `frontend/src/screens/DrawingsElevationsStudio.jsx` — "Combine all → PDF" button

**Step 1:** Test route returns multi-page PDF (bytes > sum of parts / valid `%PDF`).
**Step 2:** Implement merge. 
**Step 3:** UI button. `vite build` + smoke (add `combined-pdf` check). Commit.

*(2D per-wall PDF+DXF already done & verified in commit `1842207`.)*

---

## Phase F — Cutlist + laminate/color + handoff

### Task F1: Laminate & color selection UI
**Objective:** Per-module laminate + color pick from `component-color-service` / `MaterialCatalogScreen`; persisted to cutlist.

**Files:**
- Modify: `frontend/src/screens/MaterialCatalogScreen.jsx` — add "Apply to cutlist" mapping each module → laminate/color
- Modify: `server/services/cutlist-engine.js` — accept `selections` param overriding defaults (already has `bestFor` logic at line 1352/1354)

**Step 1:** Test cutlist recalc honors an overridden laminate for a `tv-unit`.
**Step 2:** UI grid bind. `vite build`. Commit.

### Task F2: Handoff / delivery package
**Objective:** Final package (renders + SKP + DXF + combined PDF + cutlist + quote) zipped & shareable.

**Files:**
- Reuse: `POST /api/projects/:id/delivery-package` (exists at line 1341) — verify it bundles the new artifacts
- Modify: `frontend/src/screens/PresentationStudio.jsx` — "Download full handoff" button

**Step 1:** curl delivery-package → confirm 200 + contains skp/dxfs/combined pdf.
**Step 2:** UI button. `vite build` + smoke. Commit.

---

## Verification gate (every task)
```
node_modules/.bin/vite build      # exit 0
node --test "tests/*.test.js"     # 53/53 (+ new tests)
node scripts/smoke-test.mjs       # 21/21 (+ new endpoint checks)
```

## Risks / open questions
- SKP *authoring* (writing a real binary `.skp`) is heavy; plan B is to ship the `sketchup_script_txt` (Ruby/SU API script) as the "SKP source" + import path. Confirm with user which is acceptable.
- Sandbox has no AI egress → live photoreal renders only on Windows+`.env` keys; in-sandbox use curated/DB-reused renders (already wired).
- `RoomAnnotator` may need the `rooms/mark` persistence route added.
- pdf-lib availability: check `node_modules` before Task E2; else use `pdfkit`.
