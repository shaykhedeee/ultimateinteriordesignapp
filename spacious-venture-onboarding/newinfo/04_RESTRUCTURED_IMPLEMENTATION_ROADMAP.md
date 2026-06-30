# Restructured Implementation Roadmap

## Current App Status

Based on the 20 document files and code analysis, the app has been built incrementally across multiple passes. Here is the current state:

### ✅ COMPLETED
- React + Vite frontend shell with dark command-center UI
- SQLite database with core tables
- Express API server with routes
- Navigation: Command Center, Projects, Onboarding, PDF Briefs, Cutlists, AI Renders, Materials, Deliverables, Settings
- Client onboarding wizard (8 steps: profile, scope, rooms, budget, style, vastu, cooking, references)
- Floor plan upload and annotation (zones, markers, dimensions)
- AI render studio with multi-variant generation and correction memory
- PDF brief generation with studio branding
- Cutlist engine V1 with module templates (10 types)
  - Part generation from modules
  - Sheet layout preview
  - CSV export, PDF export
- Materials library (laminates, boards, edge banding)
- Deliverables vault (stored PDF browser)
- Studio settings (brand identity, proposal copy)
- Full backup/export/import with version 2 schema
- Demo reset with guarded confirmation
- Production import pipeline (C1301 workbook analysis)
- C1301 production cutlist learning and import

### 🔴 REMAINING / NEEDS FIXING

1. **Onboarding-to-Render pipeline**: Ensure seamless data flow from intake → floor plan → renders → PDF brief
2. **Render approval gating**: Approved renders should unlock PDF brief and cutlist
3. **Onboarding form redesign**: Ensure comprehensive data collection that flows correctly to all downstream steps
4. **Cutlist automation from 2D**: The designer should be able to upload or finalize a 2D design and auto-generate cutlists
5. **Factory package export**: Generate 4 deliverables (workbook, job summary, panel labels, sign-off)
6. **Per-project file history**: Show all generated documents per project
7. **Client share workflow**: ZIP export or expiring links

---

## Phase Plan (Restructured for Clean Flow)

### PHASE 1: Pipeline Foundation & Flow Fix (Week 1-2)
**Goal**: Fix the broken connections between stages. Make data flow seamlessly.

#### Tasks:
1. **Onboarding Rewrite**
   - Ensure all 8 steps save properly to project record
   - Add validation at each step
   - Ensure room data flows to floor plan step
   - Ensure budget/style flows to render studio
   - Ensure module requirements flow to cutlist

2. **Render Approval Gating**
   - Add accept/reject/star status to each render variant
   - Carry only accepted images into PDF brief
   - Block PDF generation if no renders are approved (show warning)
   - Block cutlist creation if no brief is approved

3. **Connected Pipeline Dashboard**
   - Add kanban view showing each project's stage
   - Next action button always visible per project
   - Readiness score calculation across all stages
   - Project opens to correct next screen

#### Acceptance:
- ✓ Adding client starts a guided flow
- ✓ Every step saves and flows to next
- ✓ Renders can be accepted/rejected
- ✓ Only accepted renders appear in PDF
- ✓ PDF or Cutlist shows warning if previous step incomplete

---

### PHASE 2: Cutlist Automation from 2D (Week 2-3)
**Goal**: Designer uploads/finalizes 2D design → auto-generates cutlists with modules and parts.

#### Tasks:
1. **2D Upload/Finalization**
   - Allow designer to mark floor plan as "finalized" (ready for production)
   - Upload working drawings as reference PDFs
   - Draw components on floor plan that map to cutlist modules
   - Each component becomes a cutlist module with derived dimensions

2. **Auto-Module Generation**
   - From finalized floor plan + annotations, auto-generate:
     - TV units at marked positions
     - Kitchen cabinets along marked walls
     - Wardrobes in bedroom zones
     - Shoe racks in foyer zones
     - Pooja units at marked positions
   - Designer can review, edit, add, remove modules

3. **Production Cutlist Learning Integration**
   - Use C1301-learned patterns for:
     - Formula-driven dimensions (parent offsets)
     - Part naming conventions (S/P, TOP, BTM, BACK, etc.)
     - Material compound strings (e.g., "16MR F+F")
     - Edge banding rules per part role
   - Show production warnings based on learned rules

#### Acceptance:
- ✓ Designer marks floor plan as "finalized"
- ✓ Cutlist modules auto-generate from floor plan annotations
- ✓ Modules use production naming conventions from C1301
- ✓ Parts are generated with correct dimensions and offsets
- ✓ Workshop PDF/CSV reflects production standards

---

### PHASE 3: Precision Cutlist Engine V2 (Week 3-4)
**Goal**: Replace generic part generation with template-driven formulas learned from production data.

#### Tasks:
1. **Formula Engine**
   - Parent module dimensions serve as base
   - Formulas for each part role:
     - Sides: height × depth (minus offset)
     - Top/Btm: width × depth (minus offset)
     - Back: (width - 2×thickness) × (height - 2×thickness)
     - Shelves: (width - 2×thickness) × depth
     - Shutters: width/quantity × height
   - Production offsets configurable per project

2. **Edge Banding Automation**
   - Role-based edge rules:
     - Visible edges: 2mm PVC (colour-matched)
     - Internal edges: 0.8mm PVC
     - Back edges: none
   - Per-part edge assignments automatically

3. **Material Requirement Summary**
   - Group by material type
   - Calculate total board area per material
   - Estimate sheets required per material
   - Generate laminate requirement summary

#### Acceptance:
- ✓ All parts have formula-derived dimensions
- ✓ Edge bands are automatically assigned per part role
- ✓ Material summaries match production expectations
- ✓ Warnings for missing materials, zero dimensions, oversized parts

---

### PHASE 4: Sheet Optimization V2 & Factory Package (Week 4-5)
**Goal**: Production-ready sheet layouts and factory package export.

#### Tasks:
1. **Better Nesting**
   - Group by material/thickness/grain
   - Guillotine-friendly placement
   - Offcut reuse tracking
   - Grain direction enforcement
   - Rotation optimization
   - Better waste calculation

2. **Factory Package Export (4 deliverables)**
   - **Editable workbook/CSV**: Same as current but with production codes
   - **Job Summary PDF**: Total sheets, waste %, unique layouts, materials summary
   - **Panel Labels PDF**: Per-sheet labels with project, sheet no, panel no, part name, material, dimensions, date, edge labels
   - **Production Sign-off PDF**: Approval page for workshop verification

3. **Panel Labels Generator**
   - Each label includes:
     - Project: SV-{projectNo}
     - Sheet: {sheetNum}/{totalSheets}
     - Panel: {panelNum}
     - Part: {partName} ({partCode})
     - Material: {materialCode} {thickness}
     - Size: {L}×{W}×{T}
     - Edge: {top}/{right}/{bottom}/{left}
     - Date: {YYYY-MM-DD}
   - Printable on A4/label sheets

#### Acceptance:
- ✓ Sheets are optimized with guillotine-friendly layouts
- ✓ Waste percentage is calculated per material
- ✓ Factory package exports 4 deliverables
- ✓ Panel labels are printable and workshop-ready
- ✓ Job summary matches production expectations

---

### PHASE 5: Studio Completion & Sale-Ready (Week 5-6)
**Goal**: Polish, reliability, handover documentation, and demo readiness.

#### Tasks:
1. **Per-Project File History**
   - Every project shows timeline of generated documents
   - PDF brief revisions accessible
   - Cutlist revisions accessible
   - All renders accessible

2. **Client Share Workflow**
   - ZIP export of all project deliverables
   - Optional: expiring local links for client download
   - Clean client-facing package

3. **Error Handling & Edge Cases**
   - Empty states for all screens
   - Loading states with skeleton
   - Error boundaries
   - Network failure recovery
   - Graceful degradation when AI providers are offline

4. **First-Run Setup Wizard**
   - On first launch, guide through:
     - Studio name & branding
     - Contact details
     - Default production settings
     - Sample project creation

5. **Documentation & Deployment**
   - User manual for designers
   - Administration guide
   - Deployment guide for Windows studio systems
   - Packaged installer or setup script

#### Acceptance:
- ✓ Each project shows complete file history
- ✓ Client share package can be generated
- ✓ All error states handled gracefully
- ✓ First-run wizard configures the app
- ✓ Documentation is complete and handover-ready

---

## Pipeline Stage Definitions

Each project goes through these stages. The app shows readiness for each:

| Stage # | Stage Name | Description | Gate to Next |
|---------|-----------|-------------|--------------|
| 0 | Draft | Client added, onboarding started | Complete all 8 onboarding steps |
| 1 | Onboarding Complete | All client data captured | Upload floor plan |
| 2 | Floor Plan | Floor plan uploaded, zones/markers defined | Start AI renders |
| 3 | Render Review | Renders generated, variants to review | Accept at least 1 variant |
| 4 | Render Approved | At least 1 variant accepted | Generate PDF brief |
| 5 | PDF Brief | Brief generated, can be revised | Client approval (manual) |
| 6 | Brief Approved | Brief marked as approved | Create cutlist project |
| 7 | Cutlist Project | Modules defined, parts generated | Optimize sheets |
| 8 | Sheets Optimized | Layouts complete, waste calculated | Export deliverables |
| 9 | Delivered | All exports generated, project complete | — |

---

## Critical Path & Dependencies

```
Add Client
  │
  ▼
Onboarding ─────────────────────────────────────┐
  │                                               │
  ▼                                               │
Floor Plan                                        │
  │                                               │
  ▼                                               │
AI Renders ─── (accept at least 1) ──────────────┤
  │                                               │
  ▼                                               │
PDF Brief ───── (client approval) ───────────────┤
  │                                               │
  ▼                                               ▼
Cutlist Project ──────────────  C1301 Learning ──▶ Production Cutlist
  │                                   │
  ▼                                   ▼
Generate Parts ─── Formula Engine ──▶ Precision Parts
  │                                   │
  ▼                                   ▼
Sheet Optimization ─── Factory Rules ──▶ Workshop Layouts
  │                                   │
  ▼                                   ▼
Export Package ───── Factory Deliverables ──▶ Production Floor
```

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI renders delay core flow | PDF brief and cutlist work without renders. Renders are optional module. |
| Floor plan annotations imprecise | Always show dimensions. Allow manual override. Flag mismatches. |
| Cutlist dimensions not site-verified | Add "Site Verification" status. Require confirmation before production. |
| C1301 patterns too specific | Keep as learning/template, not hard-coded rules. Designers can override. |
| Data loss | Full backup/export available. SQLite enables file-level backup. |
| Complex nesting in V1 | Keep V1 as workshop planning. Label as "preliminary — verify before cutting". |