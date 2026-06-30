# Restructured App: Summary & Screen Fixes

## The Big Picture

The Spacious Venture Studio OS is being restructured from a disconnected set of features into a **linear, connected pipeline** that takes a walk-in client from first conversation to factory-ready production data.

---

## Three Core Problems — Solved

### 🔴 Problem 1: Walk-in client has no structured journey
**Solution**: A 9-stage pipeline that guides every project from Add Client → Onboarding → Floor Plan → AI Renders → PDF Brief → Client Approval → Cutlist → Sheets → Deliverables. Every stage feeds data to the next. Nothing is lost.

### 🔴 Problem 2: App is not structured properly
**Solution**: The restructured navigation has exactly 10 screens, each with a specific role in the pipeline. The Command Center shows the pipeline. Projects tracks all clients. Every screen has a right rail showing readiness and next actions.

### 🔴 Problem 3: No cutlist automation from 2D
**Solution**: When the designer marks a floor plan as "finalized", the system auto-generates cutlist modules from the component markers on the floor plan. Each marker (TV Unit, Kitchen Cabinet, Wardrobe, etc.) becomes a module. Production rules from C1301 ensure factory-ready output.

---

## Screens — What's Fixed & How

| # | Screen | Current Issue | Fix |
|---|--------|--------------|-----|
| 1 | **Command Center** | KPIs disconnected from actual pipeline stages | KPIs now calculated from real project stages. Pipeline kanban shows each project's exact position. Readiness score is live. |
| 2 | **Projects (CRM)** | Table doesn't show pipeline stage clearly | Added "Stage" column with colored badge. Added "Next Action" column that links to correct next screen. Added readiness % score. |
| 3 | **Onboarding Wizard** | Steps don't always save properly. Data doesn't always flow to next steps. | Rewrote save mechanism. Every step auto-saves. Data is structured and passed explicitly to floor plan, renders, and brief. |
| 4 | **Floor Plan** | Annotations don't drive cutlist generation | Zone markers now map to cutlist module types. "Finalize Floor Plan" button unlocks cutlist auto-generation. |
| 5 | **AI Renders** | No approval gating. All renders shown in PDF regardless of quality. | Accept/Reject per variant. Only accepted renders flow to PDF brief. PDF shows warning if no render approved. |
| 6 | **PDF Briefs** | May generate without renders or proper data | Brief now checks: onboarding complete, floor plan uploaded, renders approved (if AI enabled). Shows checklist of what's missing. |
| 7 | **Cutlists** | Modules must be created manually. No auto-generation from floor plan. | "Auto-generate from Floor Plan" button creates modules from finalized floor plan annotations. Designer reviews and edits. |
| 8 | **Materials** | Works but not linked to production pipeline | Materials now show which projects use which materials. Production warnings if material out of stock or wrong thickness. |
| 9 | **Deliverables** | Shows documents but doesn't show per-project history | Added per-project file history view. Timeline of all generated documents for each project. |
| 10 | **Settings** | Functional but no first-run wizard | Added first-run setup wizard on first launch. Backup, restore, demo reset available. |

---

## Navigation Structure (Fixed)

```
CURRENT (Broken)                    RESTRUCTURED (Connected)
═══════════════                     ════════════════════════

Command Center        →            Command Center (pipeline kanban + KPIs + readiness)
Projects                           Projects (CRM with stage + next action)
Onboarding                         Onboarding (auto-save, data contracts)
PDF Briefs                         PDF Briefs (approval-gated)
Cutlists                           Cutlists (auto-generate from floor plan)
AI Renders                         AI Renders (accept/reject workflow)
Materials                          Materials (production-linked)
Deliverables                       Deliverables (per-project history)
Settings                           Settings (first-run wizard + backup)

                                   NEW:
                                   • Pipeline view in Command Center
                                   • Stage-gated progression
                                   • Readiness score on every project
                                   • Next-action buttons on every screen
                                   • Data contracts between all modules
```

---

## Cutlist Automation Flow (NEW)

This is the most critical new feature — automating cutlists from the 2D floor plan:

```
DESIGNER COMPLETES:
┌────────────────────────────────────────────┐
│ 1. Finalize floor plan with all zones      │
│    and component markers                    │
│                                            │
│ 2. Clicks "Finalize for Production"        │
└────────────────────────────────────────────┘
         │
         ▼
SYSTEM AUTOMATICALLY:
┌────────────────────────────────────────────┐
│ 1. Scans all markers on floor plan         │
│ 2. Maps marker types to module templates:  │
│    - TV_Unit → tv-unit template            │
│    - Base_Cabinet → base-cabinet template  │
│    - Wall_Cabinet → wall-cabinet template  │
│    - Wardrobe → wardrobe template          │
│    - Sink → sink-cabinet template          │
│    - Shoe_Rack → shoe-rack template        │
│    - Study → study-desk template           │
│    - Pooja → pooja-unit template           │
│ 3. Derives dimensions from marker size     │
│    or uses defaults from room type         │
│ 4. Creates module in cutlist project       │
│ 5. Generates parts with production rules   │
└────────────────────────────────────────────┘
         │
         ▼
DESIGNER REVIEWS:
┌────────────────────────────────────────────┐
│ 1. Reviews auto-generated modules          │
│ 2. Edits dimensions if needed              │
│ 3. Adds/removes modules                    │
│ 4. Adjusts material/finish                 │
│ 5. Clicks "Generate Parts"                 │
└────────────────────────────────────────────┘
         │
         ▼
SYSTEM GENERATES:
┌────────────────────────────────────────────┐
│ 1. Complete part list with all production  │
│    formulas applied                        │
│ 2. Edge banding per part role              │
│ 3. Material requirement summary            │
│ 4. Sheet layout with optimization          │
│ 5. Waste calculation                       │
│ 6. Warning flags for oversized/odd parts   │
└────────────────────────────────────────────┘
         │
         ▼
DESIGNER EXPORTS:
┌────────────────────────────────────────────┐
│ 1. Workshop CSV for spreadsheet            │
│ 2. Workshop PDF (8-page document)          │
│ 3. Panel Labels PDF (factory floor)        │
│ 4. Job Summary PDF (management)            │
│ 5. All stored in Deliverables Vault        │
└────────────────────────────────────────────┘
```

---

## Stage Gate Conditions (What's Blocking What)

```
Stage                     ← Blocked Until           → Unlocks
────────────────────────────────────────────────────────────
Onboarding                —                         Floor Plan upload
Floor Plan                Onboarding complete        AI Renders
AI Renders                Floor plan uploaded        PDF Brief (if render approved)
PDF Brief                 AI render approved OR      Cutlist
                          designer bypasses renders
Cutlist Project           PDF brief approved         Part generation
Part Generation           Modules defined            Sheet optimization
Sheet Optimization        Parts generated            Export
Export                    Sheets optimized           Deliverables vault
```

---

## User Experience Flow (The Walk-in Client Journey)

**Scenario**: A couple walks into the Spacious Venture office, interested in modular interiors for their new 3BHK.

```
TIME: 0:00 — Client arrives
─────────────────────────────────────
- Designer opens Studio OS
- Clicks [Add Client]
- Captures: Name, Phone, City, Project Type, Budget
- Project created with stage = "Onboarding"

TIME: 0:15 — Onboarding
─────────────────────────────────────
- Designer guides through 8 steps:
  1. Client Profile ✓
  2. Project Scope ✓ (3BHK, 1500 sq ft)
  3. Rooms: Living, Kitchen, MBR, Kids, Pooja, Utility ✓
  4. Budget: Premium ✓
  5. Style: Modern + Minimalist ✓
  6. Vastu: East-facing ✓
  7. Cooking: Indian + Western ✓
  8. References: Couple shows Pinterest images ✓
- Auto-saved at each step

TIME: 0:30 — Floor Plan
─────────────────────────────────────
- Client has a PDF floor plan on phone
- Designer uploads it
- Draws zones: Living (20×15), Kitchen (12×10), MBR (14×12)...
- Places markers: TV Unit, Sofa, Dining, Wardrobe, Kitchen Base...
- Adds dimensions from PDF measurements

TIME: 0:45 — AI Renders (if client wants to see visuals)
─────────────────────────────────────
- Selects Living Room
- Picks Modern style (from onboarding)
- Furniture: "42-inch TV on wall, L-shaped sofa, coffee table"
- Generates 4 variants
- Client picks favorite → Designer accepts

TIME: 1:00 — PDF Brief
─────────────────────────────────────
- Designer clicks [Generate PDF Brief]
- System compiles: client data + floor plan + render + materials
- PDF exported: "SV-001-Iyer-brief-r1.pdf"
- Printed and handed to client as leave-behind

CLIENT LEAVES WITH PDF BRIEF
─────────────────────────────────────

NEXT DAY — Client calls to approve
─────────────────────────────────────
- Designer marks brief as "Client Approved"
- Stage unlocks: Cutlist Project

TIME: DAY 2 — Cutlist Automation
─────────────────────────────────────
- Designer clicks [Auto-generate from Floor Plan]
- System creates modules:
  - TV Unit (from Living Room marker)
  - Kitchen Base ×6 (from Kitchen markers)
  - Kitchen Wall ×5 (from Kitchen markers)
  - Wardrobe (from MBR marker)
  - Study Desk (from MBR marker)
  - Shoe Rack (from Foyer marker)
  - Pooja Unit (from Pooja marker)
- Designer reviews dimensions, adjusts finishes
- Clicks [Generate Parts]
- System creates 78 parts with production rules

TIME: DAY 2 — Export
─────────────────────────────────────
- [Optimize Sheets] → 22 sheets, 18.5% waste
- [Export Workshop PDF] → 8-page document
- [Export CSV] → Workshop spreadsheet
- [Export Panel Labels] → Factory floor labels
- All stored in Deliverables Vault
- Project stage = "Delivered"
```

---

## Validation Rules (Every Screen)

### Onboarding
```
✓ Client name is required (min 2 chars)
✓ At least 1 room selected
✓ Budget band is selected
✓ Project type is selected
```

### Floor Plan
```
✓ At least 1 image/PDF uploaded
✓ At least 1 zone defined
✓ Every zone has a label
```

### AI Renders
```
✓ At least 1 room selected for rendering
✓ Style is selected
✓ At least 1 variant generated before showing approval option
```

### PDF Brief
```
✓ Onboarding is 100% complete
✓ Floor plan is uploaded
✓ (If AI renders module is active) At least 1 render is approved
✓ Project has a name
```

### Cutlist
```
✓ At least 1 module defined
✓ All modules have width, height, depth > 0
✓ Material sheet is defined in settings
✓ (For parts generation) At least 1 module with valid dimensions
```

---

## Index of All Documentation Files

```
00_APP_OVERVIEW_AND_ARCHITECTURE.md    — System overview, tech stack, design system
01_USER_FLOW_AND_SCREEN_SPEC.md        — Complete user flow, every screen detailed
02_DATA_MODEL_AND_API.md               — Database tables, API contracts, exports
03_UI_DESIGN_SYSTEM_AND_NAVIGATION.md  — Colors, typography, components, layouts
04_RESTRUCTURED_IMPLEMENTATION_ROADMAP.md — Phased build plan with acceptance criteria
05_MASTER_ARCHITECTURE_AND_CONNECTED_PIPELINE.md — Data flow contracts, stage gates
06_RESTRUCTURED_APP_SUMMARY_AND_SCREENS_FIX.md — THIS FILE — Summary of all fixes

ORIGINAL FILES (for reference):
uploads/01_current_app_scan.md through uploads/20_connected_pipeline_and_render_handoff.md
uploads/README.md
uploads/IMAGE_GENERATION_SETUP.md
uploads/index.html
```
