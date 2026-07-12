# Ultimate Interior Designer App Blueprint

## 1) Executive Summary

You are not building a normal interior design app.
You are building a **studio operating system** that combines:

1. lead capture
2. requirement intake
3. floor plan understanding
4. editable 3D scene generation
5. photoreal client renders
6. wall elevations / 2D drawings
7. material & module scheduling
8. cutlist automation
9. client approvals
10. production handoff

The biggest product mistake to avoid:

> **Do not treat AI images as the core design model.**
>
> If you want editable 3D, 2D elevations, cutlists, approvals, and production accuracy, your source of truth must be a **structured spatial model / scene graph**, not just a generated image.

So the correct architecture is:

- **Truth layer** = floor plan understanding + room graph + walls/openings + modules + materials + dimensions
- **Edit layer** = real 2D/3D editor
- **Presentation layer** = fast previews, walkthroughs, photoreal renders, AI restyling
- **Production layer** = elevations, schedules, BOM, cutlists, exports

---

## 2) What Your Attached Files Already Show

### Your current app vision is already strong
From the uploaded specs, the app is already positioned as:

- a dark premium command-center product
- a guided studio pipeline
- a local-first studio OS
- a connected flow from onboarding to production
- a floor-plan-aware AI render system
- a cutlist and deliverables workflow tool

### What you have already tried / designed
Across the uploaded files, you already defined:

- **Pipeline:** Add Client → Onboarding → Floor Plan → AI Renders → PDF Brief → Approval → Cutlist → Deliverables
- **Core stack:** React + Vite, Node/Express, SQLite, local filesystem
- **Onboarding wizard:** profile, scope, rooms, budget, style, vastu, cooking habits, references
- **Floor plan annotation system:** upload, zones, markers, dimensions, notes
- **AI render studio:** variants, prompt compilation, correction memory, reuse library
- **7-phase floor plan understanding engine:** preprocessing, wall detection, room segmentation, component detection, spatial graph, dimension analysis, constraint compilation
- **Render pipeline:** layout compiler, structured prompt builder, variant generator, image generator, spatial validator, color post-processor
- **Component recolor system**
- **PDF brief flow**
- **Cutlist automation direction**
- **Deliverables vault**
- **Production readiness and provider fallback logic**

### Your domain knowledge files are valuable
The standards files are excellent seeds for turning design into rules:

- kitchen standards
- wardrobe standards
- TV wall standards
- mandir standards
- lighting/rendering standards
- interior terminology / lingo

These should not stay as plain markdown only.
They should become:

- prompt constraints
- rule-engine checks
- module templates
- auto-layout constraints
- QA validations
- render review warnings

### What seems missing or weak
From the files, the biggest missing piece is not UI polish.
It is the **canonical spatial model**.

You have AI render planning and workflow thinking, but not yet a full product architecture for:

- persistent editable 3D geometry
- wall-by-wall elevations generated from the model
- automatic sections / annotations from the model
- production-grade module geometry as source-of-truth
- scene-to-render and scene-to-drawing consistency

### Irrelevant uploaded files
A few attached files appear unrelated to your app strategy, like generic open-source package docs (`CHANGES.md`, `CONTRIBUTING.md`, `GOVERNANCE.md`, etc.). These can be ignored for product planning.

---

## 3) What the Best Market Tools Actually Do

The market leaders are not winning because they “make AI images.”
They win because they combine a few specific systems:

### Planner 5D
- floor plan upload to digital model
- editable 3D output
- 360 walkthroughs
- CAD export on higher tier
- low entry price for fast concepting

### Foyr Neo
- fast browser-based 2D → 3D workflow
- walkthroughs
- design library
- elevations export
- strong sales presentation workflow

### Coohom
- floor plan → 3D quickly
- very large furniture/catalog system
- cost widget / itemized outputs
- 360 links + client comments
- quick cloud render speed

### Homestyler
- very large asset library
- DWG/image upload
- quick 3D conversion
- photoreal images / panoramas / tours
- easy browser workflow

### RoomSketcher
- AI convert from plans
- live 3D walkthroughs
- replace materials
- branded plans
- measurements / area calculations

### Cedreo
- complete plan presentation package
- elevations and cross-sections
- 3D floor plans + renderings
- branded presentation documents
- fast client-sales workflow

### magicplan / Matterport
These are not interior styling leaders, but they are important because they solve the **capture** problem:
- mobile scan / LiDAR / measurements
- as-built documentation
- exports
- technical files / digital twin workflow

### Product lesson
Your app should combine the best of these categories:

1. **capture like magicplan / Matterport**
2. **editable 3D like Planner 5D / RoomSketcher**
3. **catalog + pricing + variants like Coohom**
4. **speed-to-render like Foyr / Homestyler**
5. **docs / elevations / presentations like Cedreo**
6. **production outputs like your own cutlist vision**

---

## 4) The Critical Product Truth

## Editable 3D renders are NOT enough
If a user says:
- “move this wardrobe 300 mm left”
- “make the loft beige but keep the wall cabinets white”
- “show all 4 walls in elevation”
- “change only the TV console finish”
- “generate cutlist for this kitchen wall”

…you cannot solve that reliably from pixels.

You need this chain:

```text
Floor Plan / Scan / Manual Markup
        ↓
Spatial Graph + Scene Graph
        ↓
Parametric Room + Module Model
        ↓
2D Plan / Elevations / 3D Preview / Render / BOM / Cutlist
```

That is the backbone of the ultimate app.

---

## 5) Recommended Core Product Architecture

## A. Canonical Project Model
Every project should persist as structured data:

```ts
Project
  Client
  Site
  Requirements
  Budget
  StyleProfile
  FloorPlan
  ScanData
  SpaceGraph
  SceneGraph
  Modules
  Materials
  Cameras
  RenderJobs
  Drawings
  BOM
  Cutlists
  Approvals
```

## B. Space Graph
This is the semantic understanding of the layout:

- rooms
- walls
- openings
- adjacencies
- circulation
- orientation
- windows / daylight directions
- fixed services
- probable module zones

## C. Scene Graph
This is the editable 3D truth:

- walls as geometry
- floors / ceilings
- openings
- room metadata
- placed objects
- parametric modules
- materials
- lights
- cameras

## D. Parametric Module Engine
This is how you scale quality and production accuracy.
Build room/module templates for:

- straight kitchen
- L kitchen
- U kitchen
- island kitchen
- wardrobe swing
- wardrobe sliding
- TV wall
- pooja unit
- crockery unit
- study desk
- vanity
- shoe rack
- false ceiling patterns

Each template should expose editable parameters:

- width / height / depth
- split counts
- shutter type
- loft height
- skirting
- handle/gola profile
- finish set
- lighting options
- appliance placement
- production rules

This is what lets you “replace the designer” for repetitive work.

## E. Dual Render System
Do not use one renderer for everything.

### 1. Interactive Real-Time Preview
For editing and walkthroughs:
- WebGL / Three.js
- PBR materials
- screen-space reflections where possible
- shadow baking / light probes
- good enough for live client sessions

### 2. Final Client Render Engine
For photoreal outputs:
- Blender headless render farm
- Eevee for quick finals
- Cycles for hero renders
- camera presets + lighting presets + material presets
- AI post-enhancement optional, not required

## F. AI Layer
AI should sit on top of the geometry system, not replace it.
Use AI for:

- floor plan understanding
- OCR + dimension extraction
- room-type inference
- reference matching
- style recommendations
- furniture suggestions
- lighting suggestions
- render prompt enrichment
- photo restyling / fast ideation
- voice or chat copilot

Do **not** use AI as the only representation of the design.

---

## 6) The Best User Flow for Your App

## Stage 0 — Lead Capture / Qualification
- name, phone, city
- property type
- budget band
- urgency
- source
- probability to close
- book consultation

## Stage 1 — Discovery Intake
- family profile
- rooms needed
- style likes / dislikes
- materials likes / dislikes
- storage needs
- cooking habits
- vastu constraints
- pets / kids / senior-citizen constraints
- appliance list
- must-have modules
- ideal budget vs max budget

## Stage 2 — Site Capture
Multiple input modes:
- upload CAD / PDF / image floor plan
- mobile photo scan
- LiDAR room capture (if available)
- manual tracing
- on-site measurement checklist
- site photo upload per wall

## Stage 3 — Floor Plan Intelligence Review
System auto-detects:
- room boundaries
- wall lengths
- door/window candidates
- column / duct / beam candidates
- kitchen wet points
- probable TV wall / wardrobe wall / mandir location

Designer reviews confidence scores.
Nothing low-confidence goes straight to final.

## Stage 4 — Auto 3D Shell Generation
System creates:
- 3D room shell
- floor finishes
- openings
- ceiling baseline
- room-level camera presets
- sunlight orientation

## Stage 5 — Auto Layout Proposals
Per room, the system proposes:
- 2–4 layout plans
- module positions
- style packs
- budget-conscious material options
- circulation warnings
- vastu warnings
- furniture scale checks

## Stage 6 — Edit Mode
This is your most important screen.
User can:
- drag modules
- snap to walls
- change dimensions
- change materials instantly
- switch styles
- toggle ceilings/lights
- pick camera
- compare variants side-by-side

## Stage 7 — Visualization Mode
Outputs:
- live 3D walkthrough
- 360 panorama
- fast render set
- premium render set
- day / evening / warm lighting / cool lighting presets
- elevation views of each wall

## Stage 8 — Documentation Mode
Auto-generate:
- annotated floor plan
- wall elevations
- reflected ceiling plan
- module schedule
- material schedule
- lighting schedule
- appliance schedule
- PDF brief

## Stage 9 — Commercial & Approval Mode
- estimated cost by room
- module-wise cost
- revision tracking
- approved options
- client comments on views
- sign-off workflow

## Stage 10 — Production Handoff
- cutlist-ready modules
- parts list
- laminate list
- hardware list
- workshop sheets
- labels
- export package

---

## 7) Must-Have Systems in the Ultimate Version

## 7.1 Floor Plan Analyzer 2.0
Your current concept is good. Upgrade it into a confidence-based system.

### Input support
- JPG / PNG / PDF / DWG / DXF
- scanned hand sketch
- builder brochure plan
- site photo set
- LiDAR capture

### Pipeline
1. preprocess image/pdf
2. OCR dimensions / text
3. detect walls/openings
4. detect room labels
5. infer unlabeled rooms from topology + fixtures
6. detect symbols / furniture / services
7. create scale model
8. create space graph
9. create editable room shell
10. ask for confirmation on low-confidence zones

### Output
- detected rooms with confidence
- exact walls/openings list
- dimension graph
- room tags
- probable design opportunities
- warnings

## 7.2 Editable 3D Studio
This is your moat.

### Capabilities
- 2D/3D linked editing
- drag + snap + dimension editing
- wall-by-wall elevation generation
- object/material selection
- lock fixed architecture
- compare design variants
- save camera views
- simulate day/night lighting
- instant finish swapping

## 7.3 Render Studio
Three quality levels:

### Draft
- real-time viewport screenshot
- cheap / instant

### Review
- Blender Eevee or equivalent
- 20–60 sec target

### Final
- Blender Cycles / high quality
- 2–5 min target

### AI-enhanced mode
- use scene-guided AI for stylization or surface refinement
- must preserve geometry and module boundaries

## 7.4 Elevation & 2D Drawing Engine
For each room, auto-generate:
- each wall elevation
- dimensions
- opening positions
- module outlines
- shelf/shutter divisions
- finish tags
- lighting tags
- switch/socket suggestions

## 7.5 Rules & Standards Engine
Turn your standards docs into machine-readable rules.

Examples:
- kitchen base depth: 560–600 mm
- sink under window preference
- wardrobe swing clearance >= 750 mm
- sliding wardrobe depth = 650 mm
- pooja in north-east preferred
- TV backdrop paneling termination rules
- no fisheye camera
- elevation camera is orthographic / perpendicular
- 3000K ambient cove + 4000K task hierarchy

## 7.6 Design Memory Engine
Track:
- approved styles
- rejected variants
- budget sensitivity
- repeated module choices
- preferred colors
- preferred laminate families
- room-specific successful templates

This makes later projects faster and cheaper.

## 7.7 Production Bridge
Every approved module should map to:
- parametric carcass logic
- part formulas
- banding rules
- material grades
- factory notes

---

## 8) Recommended Tech Stack

## Frontend
- **Next.js / React / TypeScript**
- **react-three-fiber + Three.js** for browser 3D
- **Zustand** for editor state
- **TanStack Query** for data sync
- **Konva** or **Fabric.js** for 2D plan markup
- **Tailwind + custom premium theme** or your current dark system

## Backend API
- **Node.js + NestJS or Express with stronger modularization**
- Keep Node for workflow APIs, auth, documents, exports, orchestration

## CV / AI Service
- **Python + FastAPI**
- OpenCV
- OCR
- detection/segmentation models
- geometry inference services

## Database
For V1 local demo, SQLite is okay.
For serious scale:
- **PostgreSQL**
- **Redis** for jobs/cache
- **pgvector** for reference similarity and design memory

## Storage
- **S3 / Cloudflare R2** for plans, renders, docs, models
- local cache for studio installs if needed

## Rendering
- **Three.js realtime** for preview
- **Blender headless** for final stills and panoramas
- optional GPU queue on RunPod / Vast / AWS as demand grows

## 2D Drawing / CAD Export
- SVG/PDF generator from scene graph
- DXF export using server-side CAD libraries
- later IFC/DWG bridge if required

## Jobs / Pipelines
- **BullMQ** or **Temporal**
- render queue
- floor plan analysis queue
- export queue
- thumbnail queue

## Collaboration
- **Yjs** later if you want real-time multi-user editing

## Auth / Multi-tenant
- local-only V1: basic token auth
- cloud V2: Auth.js / Clerk / Supabase Auth

---

## 9) Cost-Effective Build Strategy

## The cheapest wrong approach
The cheapest wrong approach is:
- upload floor plan
- send to image AI
- get a pretty render
- pretend it is editable

This fails for:
- accuracy
- revisions
- elevations
- production
- trust
- consistency

## The smartest low-cost correct approach

### Phase 1 — build a BIM-lite interior model, not full BIM
Do **not** start with full Revit-level complexity.
Build a focused **interior scene graph** with:
- walls
- openings
- rooms
- ceilings
- floors
- modular units
- furniture
- materials
- lighting
- camera presets

That gives 80% of value at much lower complexity.

### Phase 2 — template-first, not freeform-first
Start with strong templates for:
- kitchens
- wardrobes
- TV units
- mandirs
- bedrooms
- living rooms

You already have standards docs for these.

### Phase 3 — GPU only when needed
Use:
- realtime viewport for edits
- Eevee for review renders
- Cycles only for final hero shots

### Phase 4 — library reuse before generation
Reuse approved scenes, cameras, materials, and module templates.
This will reduce AI/render cost massively.

### Phase 5 — use AI for acceleration, not full authorship
AI should:
- infer
- suggest
- automate repetitive setup
- enrich
- style

But geometry should stay deterministic.

---

## 10) What Features You Should Borrow From Competitors

## Borrow and improve

### From Planner 5D
- floor plan → editable 3D workflow
- consumer-simple editing
- 360 and CAD bridge
- low-friction onboarding

### From Coohom
- itemized budget widget
- furniture/catalog linkage
- fast client-share links
- commenting on shared views

### From Foyr
- ultra-fast render workflow
- clear plan → 3D → walkthrough flow
- onboarding/training friendliness

### From Homestyler
- huge model library feeling
- drag-and-drop ease
- quick plan upload and 3D conversion
- simple visualization experience

### From RoomSketcher
- clarity in 2D / measurements / area outputs
- clean plan views
- very understandable UX

### From Cedreo
- complete presentation document generation
- elevations / sections / sales-ready docs

### From Matterport / magicplan
- reality capture and as-built workflows
- field capture before design

## Do NOT copy these weaknesses
- image-first instead of model-first
- generic Western furniture defaults only
- poor Indian modular cabinetry logic
- expensive per-render dependency everywhere
- no production bridge
- no quality confidence layer on floor plan analysis

---

## 11) How to Use Your Existing Knowledge Files Better

## Convert markdown standards into structured rules

Example:

```json
{
  "kitchen.base_unit.depth_mm": { "min": 560, "max": 600 },
  "wardrobe.swing.clearance_mm": { "min": 750 },
  "wardrobe.sliding.total_depth_mm": { "const": 650 },
  "mandir.preferred_direction": ["NE"],
  "lighting.task_spot_cct_k": [4000],
  "lighting.ambient_cove_cct_k": [3000]
}
```

## Use them in 5 places
1. auto-layout engine
2. prompt compiler
3. geometry validator
4. elevation annotations
5. cutlist formulas

## Mistakes log should not be empty
`mistakes_log.json` is empty right now.
That should become a goldmine.
Track failures like:
- wrong room detection
- wrong sink/hob side
- wrong wardrobe swing clearance
- light temperature mismatch
- marble vein mismatch
- loft color bleed
- camera distortion
- unrealistic appliance placement

---

## 12) The Best Screen Structure for the Final App

1. **Command Center**
2. **Leads / CRM**
3. **Onboarding**
4. **Site Capture**
5. **Floor Plan Intelligence Review**
6. **3D Design Studio**
7. **Render Studio**
8. **Drawings & Elevations**
9. **Materials / Catalog / Costing**
10. **PDF Brief / Proposal**
11. **Approvals & Revisions**
12. **Cutlist / Production**
13. **Deliverables Vault**
14. **Settings / Rule Engine / Admin**

The current uploaded flow covers many of these, but you need to split **AI Render Studio** into:

- **3D Design Studio**
- **Render Studio**
- **Drawings & Elevations**

That separation is important.

---

## 13) Recommended 6-Phase Build Plan

## Phase 1 — Canonical Spatial Core
Build first:
- project schema
- floor plan parser output schema
- room / wall / opening graph
- scene graph
- standards engine

## Phase 2 — 2D/3D Editor
Build:
- linked 2D plan editor
- 3D viewport
- wall/object snapping
- room shell generation
- template placement

## Phase 3 — Parametric Interiors
Build:
- kitchen configurator
- wardrobe configurator
- TV wall configurator
- mandir configurator
- living/bedroom presets

## Phase 4 — Render Engine
Build:
- realtime preview
- Eevee quick render
- Cycles final render
- camera presets
- lighting presets
- AI polish optional

## Phase 5 — Drawings + Production
Build:
- wall elevations
- sections (limited set)
- schedules
- BOM
- cutlist integration

## Phase 6 — Collaboration + Intelligence
Build:
- client comments
- share links
- design memory
- lead scoring
- estimator
- recommendation copilot

---

## 14) My Strongest Recommendation

If your goal is to make the **best interior designer app ever**, then the single most important architectural decision is this:

> **Build the app around a persistent editable 3D + parametric scene graph, not around AI image generation.**

Everything else becomes possible only after that:
- editable renders
- wall elevations
- 2D drawings
- cutlists
- BOM
- component recolor
- client walkthroughs
- production handoff

Without that, you will keep getting a beautiful but unstable demo.
With that, you can build a real company-grade product.

---

## 15) Immediate Action Plan

### Next 7 days
1. Freeze the canonical data model
2. Convert your standards markdown into JSON rules
3. Define scene graph schema
4. Define wall/opening/room/module object types
5. Split product into Design Studio vs Render Studio vs Drawings

### Next 30 days
1. Build floor plan parser output contract
2. Build shell-to-3D room generator
3. Build first parametric kitchen + wardrobe modules
4. Build wall-elevation generator
5. Add material swap + camera preset system

### Next 60–90 days
1. Add final render queue
2. Add client share links
3. Add PDF brief from actual scene data
4. Add cutlist generation from modules
5. Add QA confidence + mistake memory loops

---

## 16) Practical Market Benchmarks

A few useful market signals:

- Planner 5D positions Premium at **$4.99/month annually** and Professional at **$33.33/month annually**, with Professional including unlimited 4K renders, 360 walkthrough/panorama, and CAD export.[1](https://planner5d.com/pricing)
- Planner 5D’s business API says its floor-plan recognition can return a **live editable 3D project**, accepts formats like JPEG/PNG/PDF/DWG/DXF/TIFF, and connects to commerce/CRM workflows.[1](https://planner5d.com/business/api-integrations)
- Foyr Neo’s pricing page highlights **3D walkthroughs**, floor-plan export, AR view, and **true-to-scale elevations** on higher tiers, with listed plans at **$33 / $67 / $103 per month** on yearly billing.[3](https://foyr.com/pricing/)
- RoomSketcher’s Pro plan is listed at **$12/month billed annually** and includes **2D floor plans, 3D floor plans, 360 views, Live 3D, replace materials, measurements, total area, and branding**.[4](https://www.roomsketcher.com/pricing/)
- Homestyler’s official floor-plan page says users can upload an image or DWG, auto-convert it into a **3D floor plan**, use a **1,000,000+ model library**, and create **photo-real images, panoramas, virtual tours, and animated videos** in-browser.[1](https://www.homestyler.com/solution/design_floor-planner)
- Homestyler’s pricing page describes a free Basic plan and paid tiers, noting free users can design with **unlimited 1K renders** and access to **300K+ furniture models**, while higher resolutions and premium features are paid.[7](https://www.homestyler.com/pricing)
- Coohom’s official all-in-one page emphasizes **floor plan upload to instant 3D**, **4K cloud renders**, **360 walkthrough links**, an **AI layout assistant**, a **budget widget**, and export packs including renders, floor plan, and itemized cost list.[1](https://www.coohom.com/all-in-one-software)
- Cedreo’s floor-plan software page emphasizes automatically generated **cross sections and elevations**, **3D floor plans**, **photorealistic renderings**, and branded **presentation documents**, with a Pro Monthly plan listed at **$129/month**.[3](https://cedreo.com/floor-plan-software/)
- magicplan’s official pricing page positions itself around **mobile-first capture**, LiDAR on supported iOS Pro devices, real-time floor plans, built-in estimates, ESX/FML exports, and pricing from **$25/project** on longer commitments.[2](https://magicplan.app/pricing)
- Matterport’s plans page highlights **phone/tablet/360 camera capture**, measurements, schematic floor plans / MatterPak technical files on paid tiers, and the ability to purchase **CAD, BIM, e57, Sketch and TruePlan files** on higher plans.[1](https://matterport.com/plans)

---

## Final Conclusion

You already have the beginnings of a very strong product.
But right now it is still closer to a **workflow-and-render OS** than a true **editable design intelligence platform**.

To make it category-defining, do this:

1. make the **scene graph** the source of truth
2. make the **standards docs** executable rules
3. make the **3D editor** real, not fake
5. make **elevations and cutlists** come from the same model
5. make AI a **copilot**, not the only engine

That is the path to the ultimate interior designer app.

---

# MASTER ARCHITECTURE OF RECORD (authoritative — keep in sync with code)

> This section is the **single source of truth** for the shipped product. The
> strategy sections above describe *what to build*; this section records *what is
> actually built and how it is wired*, so future work never drifts from the
> launch-state contract. Update it whenever a pipeline, route, or data contract changes.

## A. Reality Check vs Blueprint (where we landed)

| Blueprint assumption | Implemented reality |
|---|---|
| Next.js / React / TS | **Vite + React 18 + JSX (no TS)**, ESM. Single SPA, no URL router — screens switch via `activeTab` state in `frontend/src/App.jsx` |
| NestJS backend | **Express** monolith `server/index.js` (~4000 lines), better-sqlite3 |
| Python CV service | In-repo Node services (no separate Python service in main app) |
| PostgreSQL at scale | **SQLite** (better-sqlite3) via `dbClient` wrapper that also supports Postgres |
| Blender headless render | **AI image generation** (Pollinations keyless + provider fallback) producing photoreal renders; deterministic geometry stays in the scene/cutlist layer |
| BullMQ/Temporal jobs | In-process job rows in `jobs` table + SSE progress |

**Decision: this is intentional.** For a local-first studio OS the Vite SPA + Express + SQLite stack ships and runs with zero external infra. The blueprint's *architecture principles* (scene-graph-as-truth, standards-as-rules, elevations+cutlist from one model) are honored in the data layer even though the renderer is AI-image-based.

## B. Canonical Data Model (shipped tables)

- `projects` — client, budget, `client_brief_json` (selectedSpaces, budgetTier, lifestyle…), status, current_step.
- `cad_data` — `walls_json`, `furniture_json`, `floor_plan_json`, `annotations_json` (the **measured truth** for elevations).
- `photo_elevations` — `model_json` (cabinets with measured `widthMm/heightMm/depthMm/xOffsetMm/zOffsetMm`), `dims_json`, `wall_json`, `confidence`.
- `cutlist_projects` / `cutlist_modules` / `cutlist_parts` — generated BOM (parts carry `elevationSource` trace).
- `design_renders` — AI render records per project.
- `invoices` / `invoice_items` / `payments` — GST billing.
- `jobs` — async job queue + progress.

## C. Cutlist Precision Pipeline (the hardened core)

Source of truth for cut dimensions = **measured 2D wall elevations**, NOT room templates.

1. `getElevationCabinets(projectId)` reads `cad_data.walls_json.cabinets` + `photo_elevations.model_json.cabinets`.
2. Each cabinet → `buildElevationModules()` → a cutlist module with **measured** `widthMm/heightMm/depthMm`, typed (base/wall/tall/wardrobe/tv-unit…) by `classifyCabinetToModuleType`.
3. `mergeElevationModules()` lets elevation modules **override** template defaults for the same room+type.
4. `precisionPartsForModule()` derives every part from the measured W/H/D; `part()` dims are precision-clamped (≥10 mm, integer).
5. Every generated part stores `elevationSource` (source wall/photo, measured dims, confidence) for traceability.

Verified: a 1847×871×560 mm measured base → side panel 871×560, bottom 1811 (=1847−2×18); no 3000 mm template leaks.

## D. API Contract (stable endpoints)

| Method + path | Purpose |
|---|---|
| `POST /api/projects` | create project (201) |
| `GET /api/projects/:id` | full project (incl. `cad_data`, `client_brief_json`) |
| `GET /api/projects/:id/renders` | list AI renders |
| `POST /api/projects/:id/renders/generate` | spawn render job (SSE progress) |
| `POST /api/projects/:id/elevations/from-renders` | DXF+PDF elevations from 3D unit library |
| `GET /api/projects/:id/cutlist` | current cutlist (modules + parts) |
| `POST /api/projects/:id/cutlist/refresh` | **rebuild cutlist from elevations + templates** |
| `POST /api/projects/:id/cutlist/calculate` | nesting/optimization |
| `POST /api/projects/:id/invoices` | itemized GST invoice |
| `POST /api/projects/:id/invoices/:id/pdf` | tax-invoice PDF |
| `POST /payments` (`allocations:[{invoiceId,amount}]`) | payment + balance tracking |

Server serves the built `dist` SPA on the same port (**default 5055**), so E2E hits one origin.

## E. Automated QA (no manual regression testing)

Two layers, both run in CI / pre-commit:

1. **Unit + integration** — `npm test` → `node --test tests/*.test.js` (≈376 pass). Covers cutlist math, CNC G-code, invoice GST, elevation accuracy.
2. **End-to-end (real browser)** — `npm run test:e2e` → Playwright against the built app + live server. Specs in `tests/e2e/`:
   - `magic-planner.spec.mjs` — dashboard → Client Intake (brief) → Plan Intelligence (CAD) flow.
   - `render-studio.spec.mjs` — 3D Render Studio mounts; "Generate Renders" creates a render record.
   - `elevations.spec.mjs` — Drawings & Elevations mounts with generation controls; Cutlist "Calculate/Refresh" rebuilds the cutlist.
   - Nav buttons carry `data-testid="nav-<tab>"` for stable selectors.
   - `playwright.config.mjs` builds + boots the server (`webServer`) so regressions in routing/state are caught automatically.

## F. Launch Checklist (definition of "done")

- [x] Every nav tab renders without throwing (E2E guards this).
- [x] Cutlist derives from measured elevations (precision pipeline + tests).
- [x] Invoice GST math + PDF + payment balance (unit tests).
- [x] CNC emits real G-code (unit tests).
- [x] E2E suite green on a clean build.
- [ ] Manual polish pass on premium gold-on-black consistency (ongoing).
- [ ] Smart Project action-grid buttons (Region Edit / Upscale / Video) wired past toast stubs (known gap).

## G. Golden Rules (do not violate without updating this file)

1. Geometry/cutlist truth lives in the DB (elevations, modules, parts) — never only in a rendered image.
2. `dbClient` exposes `.prepare()` but **not** `.transaction()` — use `runInTransaction()` (raw better-sqlite3 handle) for atomic writes.
3. The SPA has no URL router; add `data-testid="nav-<tab>"` to any new nav control so E2E stays stable.
4. Port default is **5055**; never hardcode `8787` in new code (legacy string remains in a few fetch URLs — migrate on touch).
5. Keep the E2E suite green after every feature change.