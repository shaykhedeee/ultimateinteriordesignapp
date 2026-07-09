Here is the exhaustive deep-scan report for all 6 directories:

---

## 1. `spacious-venture-onboarding` â€” THE MAIN APPLICATION (Experience Centre / Studio Software)

### Purpose
The primary, most mature application in the workspace. It is an **AI-powered interior design experience centre** for "Spacious Venture" â€” an Indian interior design company. It handles the full pipeline: client onboarding â†’ floor plan analysis â†’ AI render generation â†’ design briefs/proposals â†’ cutlist production â†’ deliverables vault.

### Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 18 (JSX) + Vite 8 |
| **Backend** | Express 4 (Node.js, ESM) |
| **Database** | SQLite (better-sqlite3 v11) |
| **AI / Image Gen** | OpenAI (gpt-image-1), Gemini (gemini-2.5-flash-image / Imagen 4.0), HuggingFace FLUX, Freepik, Pollinations, Pexels |
| **AI / Analysis** | TensorFlow.js (client-side CV), Gemini text model (prompt refinement) |
| **PDF Generation** | PDFKit |
| **Excel Export** | ExcelJS |
| **Image Processing** | Sharp, Canvas |
| **Icons** | Lucide React |
| **Testing** | Playwright (e2e) |
| **Package Manager** | npm |

### File Structure (38 items at root)
- `server/index.js` â€” Express API entry (port 8787)
- `server/routes/` â€” 7 route files: `projects.js`, `proposals.js`, `materials.js`, `library.js`, `admin.js`, `cutlists.js`, `renders-enhanced.js`
- `server/services/` â€” 22 service files including:
  - `cutlist-engine.js` (76KB â€” full parametric cutlist calculator)
  - `visualizer-engine.js` (69KB â€” render pipeline orchestrator)
  - `image-provider.js` (44KB â€” multi-provider AI image gen with fallback chain)
  - `render-pipeline.js` (34KB â€” deterministic prompt compiler & variant workflow)
  - `floor-plan-analysis-service.js` (28KB â€” CV-based floor plan understanding)
  - `backup-service.js` (24KB â€” full backup/restore/demo-reset)
  - `design-engine.js` (22KB â€” room/module design logic)
  - `production-import-service.js` (21KB â€” factory workbook import pipeline)
  - `ai-spatial-engine.js`, `fp-understanding-engine.js`, `gemini-service.js`, `component-color-service.js`, etc.
- `frontend/src/` â€” React SPA:
  - `components/StudioShell.jsx` (17KB â€” main shell/layout with sidebar)
  - `components/FloorPlanScene.jsx` (26KB â€” interactive floor plan canvas)
  - `components/MoodboardCanvas.jsx` (18KB â€” drag-and-drop moodboard)
  - `components/OnboardingPanel.jsx` (14KB â€” client intake wizard)
  - `components/InspectorPanel.jsx` (14KB â€” property inspector sidebar)
  - `components/ColorEditor.jsx` (8KB)
  - `components/ui/` â€” 10 primitives: Badge, Button, Card, EmptyState, Logo, Modal, Skeleton, Spinner, Toast
  - `screens/AIRenderStudioEnhanced.jsx` (45KB â€” render generation/variant/correction studio)
  - `screens/DashboardScreen.jsx` (14KB â€” command-center dashboard)
  - `screens/ManagementScreens.jsx` (146KB â€” massive file with CRM, cutlists, proposals, admin, deliverables)
- `index.html` (53KB â€” legacy monolith single-page)
- `app.js` (112KB â€” legacy monolith logic)
- `data.js` (47KB â€” seed/reference data)
- `style.css` (38KB), `standards.js` (14KB), `floorplan-canvas.js` (25KB), `ai-engine.js` (8KB)
- `public-website/` â€” 13 SEO landing pages (Sarjapur interiors, modular kitchens, etc.) with sitemap.xml, robots.txt
- `client-brief/` â€” HTML/PDF client proposals and growth pilot briefs
- `docs/` â€” 24 planning/spec documents (01 through 23 + README)
- `core-library/` â€” enhanced app sub-package
- `.env.example` â€” 77-line config supporting 10+ AI providers

### Key Features
1. **Client onboarding wizard** with project intake
2. **AI render studio** with multi-provider image generation (9-tier fallback chain: library-reuse â†’ Gemini â†’ HuggingFace FLUX â†’ Freepik â†’ OpenAI gpt-image-1 â†’ Pollinations â†’ Pexels â†’ curated â†’ mock)
3. **Floor plan analysis** via TensorFlow.js computer vision
4. **Interactive floor plan canvas** with wall/opening/furniture editing
5. **Moodboard canvas** with drag-and-drop
6. **Design brief & proposal PDF generation** (branded)
7. **Cutlist engine** with Indian modular standards
8. **Production workbook import** (from factory Excel/CSV)
9. **Correction memory** â€” learns from designer feedback
10. **Backup/restore/demo-reset** system
11. **Deliverables vault** â€” stored PDF briefs & cutlists
12. **Admin dashboard** with CRM project table, readiness panels
13. **Studio branding settings** â€” white-label ready
14. **Public marketing website** with SEO pages

### UI Design
Premium dark command-center aesthetic â€” black sidebar, gold (#b8873b) accents, dense project table, right-side readiness panels.

---

## 2. `spacious-venture-quotation-maker` â€” QUOTATION / ESTIMATE BUILDER

### Purpose
A standalone **quotation/estimate builder** for Indian interior design companies. Enables creating professional itemized quotations with room-by-room breakdowns, GST calculations, milestone payment schedules, and PDF export. Branded for "Spacious Venture" but white-label ready.

### Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite 6 |
| **Styling** | Tailwind CSS 4 (via @tailwindcss/vite) |
| **PDF Export** | jsPDF + html2canvas |
| **Icons** | Lucide React |
| **Utilities** | clsx + tailwind-merge |
| **Storage** | localStorage (client-only, no backend) |

### File Structure
- `src/App.tsx` â€” Main app (295 lines, view routing between Dashboard/Edit/Preview/Settings/RateCatalog)
- `src/types.ts` â€” Full TS interfaces: `QuoteItem`, `Quotation`, `CompanyProfile`, `BankDetails`, `PaymentMilestone`, `RateItem`, `ViewState`
- `src/constants.ts` (24KB â€” extensive default data: rate items catalog, default specs, terms, payment schedules)
- `src/components/`:
  - `Dashboard.tsx` (19KB â€” quotation list with status filters, stats, template generation)
  - `QuotationForm.tsx` (41KB â€” full item-by-item quotation editor with room categories, sqft/lumpsum, materials, finishes, hardware)
  - `QuotationPreview.tsx` (42KB â€” print-ready preview with branded header, itemized table, payment schedule, terms, bank details)
  - `RateManager.tsx` (21KB â€” rate catalog CRUD with categories: Foyer, Living Room, Kitchen, Wardrobe, TV Unit, Services)
  - `Settings.tsx` (13KB â€” company profile, logo upload, bank details, GST config)
  - `Toast.tsx` (1.5KB)
- `dist/` â€” pre-built production bundle
- `tsconfig.json` â€” strict TS config

### Key Features
1. **Dashboard** â€” quotation list with status tracking (Draft/Initial Quote/Sent/Approved/Rejected)
2. **Quotation Form** â€” room-by-room items with dimensions, sqft calculation, rate application, material/finish/hardware tracking
3. **Rate Catalog** â€” master rate card management for all interior elements
4. **PDF Preview & Export** â€” branded quotation document with company logo, itemized table, GST, payment milestones, terms & conditions, bank details
5. **GST Engine** â€” configurable GST percentage (default 18%), per-item and aggregate calculation
6. **Payment Schedule** â€” milestone-based payment tracking with percentage splits
7. **Company Profile** â€” branded settings with logo, signature, bank/UPI details
8. **Duplicate & Revisions** â€” clone quotations, track revision numbers
9. **Offline-first** â€” fully client-side with localStorage persistence
10. Indian-specific: INR currency, IFSC codes, UPI IDs, GST numbers, Indian BHK project types

### UI Design
Clean professional design â€” dark green (#1f352b) header with gold accents, stone-100 background, Lucide icons, responsive mobile layout. Company: "Spacious Venture" tagline with logo.

---

## 3. `studio-os-scaffold` â€” PRODUCTION-GRADE MONOREPO SCAFFOLD

### Purpose
A **pnpm monorepo scaffold** implementing the full "StudioOS for Interiors" platform as specified in `ai_build_spec`. This is the implementation-grade architecture target â€” a modular, scalable, production-ready scaffold with proper separation of concerns.

### Tech Stack
| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces (v9.12.0) |
| **Frontend** | Next.js 15 App Router + React 18 + TypeScript |
| **Backend** | Express 4 + TypeScript (tsx hot-reload) |
| **Database** | PostgreSQL (pg v8) â€” with in-memory mock store for dev |
| **Validation** | Zod |
| **Logging** | Pino + pino-http |
| **Shared Packages** | @studio/contracts (TS interfaces + Zod validators), @studio/rules (JSON rule seeds) |

### Architecture (Phase 2B)
```
studio-os-scaffold/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/ (@studio/api)           â€” Express + TypeScript API
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ modules/             â€” 14 domain modules:
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ agentos/         â€” AI agentic OS
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ approvals/       â€” Approval workflows
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ commercial/      â€” Budgets, billing
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ drawings/        â€” Elevation drawings
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ floorplans/      â€” Floor plan pipeline
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ health/          â€” System health
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ intake/          â€” Client intake
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ jobs/            â€” Async job queue
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ leads/           â€” CRM leads
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ materials/       â€” Material catalog
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ projects/        â€” Project management
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ proposals/       â€” Proposal engine
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ renders/         â€” Render pipeline
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ scenes/          â€” Scene graph
â”‚   â”‚   â”‚   â”œâ”€â”€ lib/                 â€” mock-store.ts (11KB seeded data), workflow.ts (stage transitions), db.ts, logger.ts, validate.ts, stale-engine.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ repositories/        â€” Repository abstractions
â”‚   â”‚   â”‚   â””â”€â”€ routes/              â€” Express routers
â”‚   â”‚   â”œâ”€â”€ db/migrations/           â€” Postgres migration scripts
â”‚   â”‚   â””â”€â”€ openapi/                 â€” OpenAPI specs (core + commercial)
â”‚   â””â”€â”€ web/ (@studio/web)           â€” Next.js App Router frontend
â”‚       â”œâ”€â”€ app/(studio)/            â€” 15 page routes:
â”‚       â”‚   â”œâ”€â”€ approvals/
â”‚       â”‚   â”œâ”€â”€ command-center/
â”‚       â”‚   â”œâ”€â”€ deliverables/
â”‚       â”‚   â”œâ”€â”€ design-studio/
â”‚       â”‚   â”œâ”€â”€ drawings/
â”‚       â”‚   â”œâ”€â”€ leads/
â”‚       â”‚   â”œâ”€â”€ materials-budget/
â”‚       â”‚   â”œâ”€â”€ onboarding/
â”‚       â”‚   â”œâ”€â”€ plan-review/
â”‚       â”‚   â”œâ”€â”€ production/
â”‚       â”‚   â”œâ”€â”€ projects/
â”‚       â”‚   â”œâ”€â”€ proposal/
â”‚       â”‚   â”œâ”€â”€ render-studio/
â”‚       â”‚   â”œâ”€â”€ settings/
â”‚       â”‚   â””â”€â”€ site-capture/
â”‚       â””â”€â”€ components/
â”‚           â”œâ”€â”€ layout/              â€” StudioShell, Sidebar, Topbar, RightRail
â”‚           â”œâ”€â”€ screens/             â€” 11 screen components (Approvals, CommandCenter, Commercial, DesignStudio, Drawings, Leads, Onboarding, PlanReview, Projects, Proposal, RenderStudio)
â”‚           â””â”€â”€ primitives/          â€” Reusable UI components
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ contracts/ (@studio/contracts)  â€” Shared TS types + Zod validators
â”‚   â””â”€â”€ rules/ (@studio/rules)         â€” JSON rule seed files + loaders
â””â”€â”€ pnpm-workspace.yaml
```

### Key Features
- Dual runtime: `DATA_MODE=memory` (instant dev with seeded data) or `DATA_MODE=postgres` (production)
- Full CRUD services per domain module
- Workflow state machine with stage ordering, readiness checks, and next-action logic
- 15 frontend route screens covering the entire interior design workflow
- OpenAPI contracts (core + commercial)
- Shared contract and rule packages across frontend and backend

---

## 4. `2d autocad thing` â€” SpaceTrace AI 2D CAD EDITOR

### Purpose
A standalone **2D floorplan designer and CAD editor** called "SpaceTrace AI". It converts hand-drawn sketches into professional architectural floorplans. Includes a full-featured 2D drawing editor with walls, openings, furniture, rooms, dimensions, and DXF export.

### Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JS + HTML (single-page, no framework) |
| **Styling** | Tailwind CSS (CDN), custom CSS |
| **Icons** | Lucide (CDN) |
| **CV / AI** | Python scripts for floor plan generation |
| **Export** | DXF (AutoCAD format), SVG, PNG |
| **Fonts** | Google Fonts (Inter) |

### File Structure (31 files, flat â€” no subdirectories)
- `index.html` (82KB â€” entire UI in one file)
- `app.js` (72KB â€” main application logic)
- `editor.js` (64KB â€” full 2D CAD editor engine)
- `icons.js` (33KB â€” icon library)
- `dxf-exporter.js` (30KB â€” DXF/AutoCAD export engine)
- `cv-processor.js` (28KB â€” computer vision wall/opening detection)
- `app.css` (4KB â€” supplementary styles)
- Python scripts for reference floorplan generation:
  - `generate-professional-floorplan.py` (20KB)
  - `generate-reference-office-floorplan.py` (19KB)
  - `generate-matched-reference-floorplan.py` (25KB)
  - `generate-exterior-shell-floorplan.py` (16KB)
- Sample output files (5 floorplan sets, each with .dxf, .svg, .png, .project.json)

### Key Features
1. **Professional 2D CAD editor** with wall drawing, snapping, and constraints
2. **Sketch-to-floorplan conversion** via CV processor
3. **Live stats display** â€” wall count, opening count, room areas
4. **DXF export** â€” full AutoCAD-compatible output with layers
5. **SVG and PNG export** for presentation
6. **Room detection** with automatic area calculation
7. **Opening tools** â€” doors, windows, sliding doors with proper architectural symbols
8. **Furniture placement** from icon library
9. **Dimension annotations** with automatic measurement
10. **Project save/load** with JSON serialization

### UI Design
Dark CAD-studio aesthetic â€” slate-950 background, blue/indigo gradient branding, professional toolbar with live stats bar.

---

## 5. `cutlist` â€” STANDALONE CUTLIST CALCULATOR + PLANNING DOCS

### Purpose
A **standalone parametric cutlist calculator** for Indian modular furniture production, with extensive planning and market analysis documentation. The sub-app calculates cabinet part dimensions from outer sizes using Indian modular standards, then nests parts onto 8Ã—4 ft plywood sheets.

### Tech Stack (cutlist-app/)
| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 (JSX, no TypeScript) |
| **Linting** | ESLint 10 |
| **Storage** | localStorage via `storageService.js` |
| **No backend** | Fully client-side |

### File Structure
```
cutlist/
â”œâ”€â”€ cutlist-app/                     â€” The React application
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ App.jsx (8.7KB)          â€” Main app shell
â”‚   â”‚   â”œâ”€â”€ index.css (31KB)         â€” Heavy custom styling
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ Calculator/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ CabinetForm.jsx (29KB)      â€” Parametric cabinet input form
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ PartListTable.jsx (16KB)     â€” Generated parts list display
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ ProjectManager.jsx (8KB)     â€” Project save/load/manage
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ QuickImport.jsx (16KB)       â€” Import from external sources
â”‚   â”‚   â”‚   â”œâ”€â”€ Nesting/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ NestVisualizer.jsx (9KB)     â€” Visual sheet nesting display
â”‚   â”‚   â”‚   â”œâ”€â”€ Layout/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Header.jsx (2KB)
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Footer.jsx (1KB)
â”‚   â”‚   â”‚   â””â”€â”€ WhiteLabel/
â”‚   â”‚   â”‚       â””â”€â”€ SettingsPanel.jsx (8KB)      â€” White-label branding config
â”‚   â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”‚   â”œâ”€â”€ hardwareDb.js (3KB)              â€” Indian hardware database (Ebco, Hettich, Blum)
â”‚   â”‚   â”‚   â””â”€â”€ whiteLabel.json (595B)           â€” White-label config template
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â””â”€â”€ storageService.js (4KB)          â€” localStorage persistence
â”‚   â”‚   â””â”€â”€ utils/
â”‚   â”‚       â”œâ”€â”€ cabinetMath.js (39KB)            â€” Core parametric math engine
â”‚   â”‚       â””â”€â”€ nestOptimizer.js (22KB)          â€” 2D bin-packing algorithm
â”œâ”€â”€ Planning Documents (6 markdown files):
â”‚   â”œâ”€â”€ current_apps_analysis.md (10KB)          â€” Competitor landscape (Infurnia, KD Max, SketchUp, Cabinet Vision, MaxCut)
â”‚   â”œâ”€â”€ implementation_plan_and_roadmap.md (10KB)
â”‚   â”œâ”€â”€ manual_cutlist_and_standards.md (15KB)   â€” Indian standards, joinery math, formulas
â”‚   â”œâ”€â”€ monetization_and_saas_architecture.md (9KB)
â”‚   â”œâ”€â”€ proposed_solution_and_ai.md (9KB)        â€” AI integration blueprint
â”‚   â””â”€â”€ white_label_config.json (595B)
```

### Key Features
1. **Parametric cabinet templates** â€” Base, Sink, Drawer Pack, Overhead, Corner, Tall/Pantry, Wardrobe
2. **Indian modular math engine** (cabinetMath.js, 39KB):
   - Butt-joint calculations with material thickness deductions
   - Edge banding offsets (2mm front, 0.8mm internal)
   - Backing panel groove allowances (6mm/9mm)
   - Plinth height, countertop overhang standards
   - Hardware allowance database (Hettich, Blum, Ebco, Hafele)
3. **2D nesting optimizer** (nestOptimizer.js, 22KB) â€” bin-packing algorithm for 8Ã—4 ft sheets with blade kerf, grain constraints, trim allowances
4. **Sheet visualization** â€” visual display of part placement on plywood sheets
5. **Quick import** from external sources
6. **White-label engine** â€” full branding customization for resale to design firms
7. **Project management** â€” save/load/manage multiple cutlist projects
8. **Hardware database** â€” pre-loaded Indian hardware specifications

### Market Position
Targets the gap between expensive 3D CAD/CAM (Infurnia at â‚¹50K/yr, KD Max at â‚¹1.2L) and manual paper calculations. Designed for Indian SME designers and workshops.

---

## 6. `ai_build_spec` â€” MASTER PRODUCT SPECIFICATION VAULT

### Purpose
The **complete product specification** for the "Ultimate Interior Designer App" / "StudioOS for Interiors". This is a 25-document spec vault that defines every aspect of the system â€” written so AI coding agents or engineering teams can implement with minimal ambiguity.

### Contents (25 spec documents + 3 implementation directories)

| File | Size | Topic |
|---|---|---|
| `README.md` | 8KB | Master index, build order, mandatory reading sequence |
| `00_MASTER_PRODUCT_VISION` | 12KB | Vision, market position, non-negotiables, user roles, success criteria |
| `01_COMPETITOR_FEATURE_SUPERSET` | 14KB | Planner 5D, Coohom, Foyr, Homestyler, RoomSketcher, Cedreo, magicplan, Matterport analysis |
| `02_SYSTEM_ARCHITECTURE` | 16KB | Full technical architecture, services, pipelines, queues, rendering stack, AI stack |
| `03_CANONICAL_SCHEMA` | 25KB | Data model, entities, relations, JSON payloads, scene graph structures |
| `04_API_CONTRACTS` | 16KB | API contracts, job lifecycle, workflow stages, approval gates |
| `05_RULE_ENGINE` | 13KB | Indian design standards, parametric module contracts, validation rules |
| `06_AI_AGENT_BUILD_RULES` | 11KB | Implementation guardrails, folder structure, engineering rules, testing |
| `07_IMPLEMENTATION_BACKLOG` | 7KB | Milestone-by-milestone backlog with acceptance criteria |
| `08_COMPETITIVE_REVERSE_ENGINEERING` | 17KB | Deep Foyr/RoomSketcher/Cedreo/Matterport architecture analysis |
| `09_FULL_PRD` | 13KB | Complete PRD with personas, scope, functional/non-functional requirements |
| `10_EXACT_DATABASE_SCHEMA.sql` | 31KB | Complete Postgres schema |
| `11_OPENAPI_CONTRACTS.yaml` | 52KB | Full OpenAPI 3.0 specification |
| `12_UI_UX_SCREEN_MAP` | 26KB | Detailed wireframe structures, interaction rules |
| `13_INDIAN_OPERATING_FLOW` | 14KB | India-specific pipeline: estimate â†’ quote â†’ payment â†’ execution â†’ warranty |
| `14_QUOTATION_BILLING` | 11KB | BOQ, invoices, milestone billing, procurement, variations |
| `15_BUDGET_FIRST_DESIGN` | 4KB | Budget-first engine and material recommendation logic |
| `16_COMMERCIAL_API.yaml` | 19KB | Commercial API extension for billing/procurement |
| `17_OPEN_SOURCE_REUSE` | 6KB | OSS reuse strategy (editor, CV, commercial, rendering) |
| `18_COST_TIMELINE` | 6KB | Execution plan, cost structure, scalability, rollout |
| `19_COMPETITOR_DECISIONS` | 2KB | Competitor strength â†’ build decision mapping |
| `20_FACT_CHECKED_RESEARCH` | 2KB | Fact-checked competitor and OSS findings |
| `21_VASTU_KNOWLEDGE_BASE` | 6KB | Vastu-sensitive interior logic |
| `22_EXPANDED_ARCHITECTURE` | 3KB | Consolidated design + commercial + execution architecture |
| `23_AGENTIC_OS` | 7KB | OODA loop, ingestion, routing, wagers, verdicts, mission control |

### Implementation Artifacts
- `sql_migrations/` â€” 11 migration files (000-010) covering: extensions, core identity, CRM/projects, intake/assets, floorplan/spatial models, scene/modules/rules, materials/pricing, renders/drawings/proposals, approvals/production/jobs, billing/procurement/variations, constraints/indexes
- `typescript_contracts/` â€” 7 files: `api.ts` (7KB), `commercial.ts` (5KB), `enums.ts` (5KB), `scene.ts` (5KB), `validators.ts` (13KB), `index.ts`
- `rule_seeds/` â€” 9 JSON rule files: global, kitchen, wardrobe, TV, mandir, lighting, Vastu, production preset (India), budget/material policies

### Key Product Non-Negotiable
> "The source of truth must be a **canonical spatial model / scene graph**, not an AI image. AI images are outputs, not the design truth."

### Product Vision in One Line
> "A geometry-first, AI-assisted, Indian modular interior design operating system that converts floor plans and site inputs into editable 3D designs, client-ready visualizations, wall elevations, proposals, and production-ready outputs."

---

## CROSS-PROJECT RELATIONSHIPS

```
ai_build_spec (Master Spec)
    â†“ defines
studio-os-scaffold (Production monorepo implementation target)
    â†“ evolves from
spacious-venture-onboarding (Working MVP / experience centre app)
    â†“ uses concepts from
cutlist (Standalone cutlist calculator + Indian standards research)
    â†“ related to
spacious-venture-quotation-maker (Standalone quotation builder)
    â†“ complements
2d autocad thing (Standalone 2D CAD / floorplan editor)
```

All 6 projects collectively build toward a single vision: a comprehensive Indian interior design operating system spanning lead capture â†’ floor plan â†’ 3D design â†’ renders â†’ quotations â†’ cutlists â†’ production handoff.

