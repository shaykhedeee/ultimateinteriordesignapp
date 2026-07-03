# ULTIDA Rebuild Plan — Agent B Studio / rdash.ai Style
> Goal: rebuild the Ultimate Interior Design App into a polished, production-grade interior design OS with the UX depth of Agent B Studio and the dashboard clarity of rdash.ai, while keeping the current backend and real functionality.

## 1. Reference UX Analysis

### 1.1 Agent B Studio patterns to adopt
| Pattern | Why it matters | Where to apply |
|---------|----------------|----------------|
| **Project canvas → zone entry** | Users start from a spatial canvas, not a list | Project Pipeline, Design Studio landing |
| **3-panel layout: AI sidebar / canvas / product catalog** | Keeps assistant + workspace + catalog in one view | Design Studio, Floor Plan Analyzer |
| **Room chips + status legend** | Quick visual inventory of rooms and assignment state | Floor Plan Analyzer, Command Center |
| **Detecting / processing states** | Feels alive and trustworthy during AI passes | All AI tool surfaces |
| **Top toolbar with mode dropdown** | Fast switching between All / Rooms / Products / Layers | CAD + 3D studio viewports |
| **Product cards with brand / price / dimensions** | Real vendor-ready catalog UX | Materials Catalog, Product Board |
| **Prompt-led generation with step progress** | Converts vague AI waits into understandable progress | Render Studio, Quick Generate |

### 1.2 rdash.ai patterns to adopt
| Pattern | Why it matters | Where to apply |
|---------|----------------|----------------|
| **KPI ribbon + system banner** | Instant pulse on business health | Command Center top |
| **Workflow hub tabs** | Single place for Smart / Generate / Photo / Layout / Product | Command Center |
| **Underneath tools grid + pipeline** | Keeps hub compact, tools discoverable | Command Center bottom |
| **Module cards with hover elevation** | Feels tactile and premium | All specialist tool launchers |

### 1.3 Current app strengths to preserve
- Full backend API surface: `/api/projects/:id/...`, `/api/ai/chat`, `/api/diagnostics/api-keys`, `/api/demo/seed`
- AURA chat service with OpenRouter + Gemini fallback
- 6-step client brief wizard with floorplan + style-reference uploads
- Plan Intelligence Core with versioned floor plans, review items, jobs
- Scene/room model, materials, renders, cutlist, finance, timeline, vendor intelligence
- Offline-first privacy stance and dark ULTIDA theme with `#D4AF37` gold accent

## 2. New App Structure

### 2.1 High-level routing
```
/ → Command Center (project hub + workflow tabs)
/projects/:id/brief → Client Brief Studio
/projects/:id/cad → 2D Blueprint Drafting
/projects/:id/studio → 3D Furnishing Studio
/projects/:id/renders → 3D Render Studio
/projects/:id/cutlist → Cutlist & Nesting
/projects/:id/finance → Commerce & Quotes
/projects/:id/system-admin → Systems Admin
```

### 2.2 Recommended frontend folder shape
```
frontend/src/
  app/
    AppShell.jsx               # sidebar + topbar + workspace router
    AppRoutes.jsx              # route definitions
    useAppState.js             # projects, active project, jobs, AURA state
  features/
    command-center/
      CommandCenterScreen.jsx  # KPI ribbon, workflow tabs, Smart Project workspace
      SmartProjectWorkspace.jsx
      QuickGenerateWorkspace.jsx
      PhotoEditWorkspace.jsx
      QuickLayoutWorkspace.jsx
      DesignProductWorkspace.jsx
    design-studio/
      DesignStudioShell.jsx    # 3-panel: AI | Canvas | Catalog
      CanvasWorkspace.jsx
      CatalogPanel.jsx
      InspectorPanel.jsx
      Toolbar.jsx
    brief/
      ClientBriefStudio.jsx
    cad/
      InteractiveCADScreen.jsx
    renders/
      Render3DStudio.jsx
    cutlist/
      CutlistNestingScreen.jsx
    finance/
      FinanceScreen.jsx
    admin/
      SystemsAdminScreen.jsx
  shared/
    components/
      layout/
        Sidebar.jsx
        Topbar.jsx
        StatusChip.jsx
        Breadcrumbs.jsx
      primitives/
        Panel.jsx
        Card.jsx
        Button.jsx
        KpiCard.jsx
        ToolButton.jsx
        EmptyState.jsx
      catalog/
        ProductCard.jsx
        CategoryTree.jsx
    hooks/
      useProject.js
      useAuraChat.js
      useJobs.js
    utils/
      api.js
      cn.js
  styles/
    global.css
    tokens.css
```

### 2.3 Backend additions (minimal, additive)
- `/api/projects/:id/zones` — list project rooms/zones
- `/api/projects/:id/zones/:zoneId` — get zone detail
- `/api/projects/:id/scene/patches` — batch scene patch operations (aligns with scaffold contract)
- `/api/projects/:id/modules` — place / update / remove modules
- `/api/projects/:id/rendersets` — create render set
- `/api/projects/:id/drawingsets` — create drawing set
- `/api/projects/:id/approvals` — approval package + decision
- `/api/projects/:id/pricing` — estimate / BOM / quotation generation
- Keep all existing endpoints; do not break

## 3. Component Architecture Plan

### 3.1 AppShell
- Fixed sidebar with grouped nav: Client Acquisition, Design Studio, AI Visualization, Production & Commerce, Admin
- Top bar: project selector, breadcrumbs, AURA status pill, jobs indicator, theme lock
- Main content outlet with scroll container
- Keyboard shortcuts: `Cmd+K` command palette, `Cmd+J` jobs, `Cmd+/` AURA

### 3.2 Command Center
- **System banner**: ULTIDA OS version, active status
- **KPI ribbon**: Leads, Projects, Pending Approvals, Production Ready, Pipeline Valuation
- **Workflow hub tabs**: Smart Project, Quick Generate, Photo Edit, Quick Layout, Design Product
- **Tools grid**: launcher cards with `link` routing and hover elevation
- **Pipeline panel**: project rows with readiness, stage badge, Open Studio

### 3.3 Design Studio Shell (new 3-panel layout)
- **Left panel (AI)**: AURA Brain Chat compact variant, room-ready chips, object legend, status messages
- **Center panel (Canvas)**: toolbar + 2D/3D viewport, detecting indicator, assignment counts
- **Right panel (Catalog)**: tabs Catalog / Library / Product Board / Upload / Style, category tree, product grid

### 3.4 Client Brief Studio
- Keep 6-step flow
- Replace `alert()` with inline `aria-live` status chips
- Ensure Step 4 floorplan + style-reference upload persists and updates project brief
- Add Save Draft / Compile & Submit actions

### 3.5 AURA Orchestrator
- Default router: OpenRouter primary, Gemini fallback
- Provider/model admin controls in Systems Admin
- Streaming response support when provider supports it
- Action previews mapped to real backend operations where possible

## 4. Data Model Additions

| Table / Concept | Purpose |
|-----------------|---------|
| `zones` | Project room/zones with name, type, bounds, orientation |
| `scene_versions` | Scene branch/lock/patch model from scaffold |
| `scene_modules` | Placed modules with template key, room ref, params, materials |
| `render_sets` | Render job collections |
| `drawing_sets` | Drawing output collections |
| `approval_packages` | Client approval packages |
| `pricing_sets` | Estimate / proposal / final pricing |
| `payment_plans` | Milestone payment plans |
| `invoices` | Invoice ledger |
| `variation_orders` | Change orders |
| `purchase_orders` | Vendor PO tracking |

## 5. Migration Path

### Phase 1 — Shell + routing refactor (no behavior change)
- Introduce `AppShell`, `AppRoutes`, `useAppState`
- Move sidebar/topbar into shared layout
- Keep all current screens intact behind new router

### Phase 2 — Command Center rebuild
- Implement KPI ribbon + workflow tabs
- Merge scaffold Smart/Generate/Photo/Layout/Product workspaces as feature modules
- Wire tools grid to existing routes

### Phase 3 — Design Studio 3-panel
- Build `DesignStudioShell` with AI | Canvas | Catalog panels
- Port interactive canvas from `InteractiveCADScreen.jsx` / `Render3DStudio.jsx`
- Build `CatalogPanel` with category tree + product grid
- Wire toolbar modes: All / Rooms / Products / Layers

### Phase 4 — Scene + zone backend
- Add zones + scene patch endpoints
- Add module placement/update/remove endpoints
- Add render sets, drawing sets, approval packages, pricing endpoints
- Keep additive; no breaking changes

### Phase 5 — Specialist tools polish
- Ceiling Generator + TV Unit Generator under Design Studio
- Cutlist, Finance, Timeline, Vendor, Pinterest as production-grade modules
- All exports project-scoped

### Phase 6 — AURA + admin
- AURA provider router + streaming
- Systems Admin screen live
- Diagnostics + spend mode controls

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large refactor breaks existing routes | Phase 1 keeps all current screens; add new routes alongside |
| Build size grows | Add dynamic imports for heavy screens; manual chunks |
| Backend schema churn | Additive migrations only; version new tables separately |
| UX inconsistency | Adopt shared `tokens.css` + primitive components early |

## 7. Success Criteria

- `npm run build` passes after every phase
- Every specialist tool is reachable from sidebar and shows real data
- Command Center shows live KPIs from `/api/projects` and `/api/leads`
- Design Studio supports at least one end-to-end flow: brief → CAD → catalog → render
- AURA chat returns live provider response or clear offline state
- No secrets exposed in frontend/network responses
- Keyboard-navigable, `aria-live` status, no blocking `alert()`/`confirm()`
