# Master Architecture: Connected Pipeline & Data Flow

## The Core Insight: Connected Data Flow

The fundamental problem with the current app is that data gets **captured in one module but lost before reaching the next**. This document defines exactly how data flows through every stage so nothing is lost.

---

## Data Flow Diagram

```
ONBOARDING ─────────────────────────────────────────────────────────────┐
│ Client Profile                                                        │
│ Project Scope (BHK, size, budget, timeline)                           │
│ Rooms & Spaces (name, size, requirements)                             │
│ Style Preferences (styles, colors)                                    │
│ Vastu & Orientation (direction, constraints)                          │
│ Cooking Habits (type, layout preference)                              │
│ References (inspiration images)                                       │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  project_id, client_name, rooms[], style_preferences,
         │  budget_band, vastu_direction, cooking_habits
         │
         ▼
FLOOR PLAN ─────────────────────────────────────────────────────────────┐
│ Upload image/PDF                                                      │
│ Draw zones: Living Room (x,y,w,h), Kitchen (x,y,w,h), MBR (x,y,w,h) │
│ Place markers: TV_Unit (zone, x,y), Sofa (zone, x,y)                 │
│ Add dimensions: Room sizes, wall lengths, openings                   │
│ Add notes per zone                                                    │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  project_id, image_path, zones[{name,coords,markers[]}],
         │  room_dimensions[], placement_notes
         │
         ▼
AI RENDER STUDIO ───────────────────────────────────────────────────────┐
│ Room selection (from floor plan zones)                                │
│ Style (from onboarding preferences)                                   │
│ Budget tier (from onboarding)                                         │
│ Exact furniture requirements (from markers + manual)                  │
│ Floor plan constraints (from zones)                                   │
│ Site photos (from uploads)                                            │
│ Reference images (from onboarding references)                         │
│ Correction memory (from previous renders)                             │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  project_id, room, style, budget, furniture_req,
         │  layout_annotations, floor_plan_notes, images[]
         │
         ▼
PDF BRIEF ──────────────────────────────────────────────────────────────┐
│ Cover page: project name, client, date, studio branding               │
│ Project summary: BHK, size, budget, timeline, style                   │
│ Client requirements: direct from onboarding                           │
│ Floor plan: uploaded image with annotations                           │
│ Room-wise brief: each room's style, modules, materials                │
│ Module schedule: from cutlist (or manual)                             │
│ Materials: selected laminates, boards, hardware                       │
│ Render images: approved variants                                      │
│ Sign-off page: client signature area, revision number                 │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  all project data + brief payload + PDF path + revision
         │
         ▼
CUTLIST PROJECT ────────────────────────────────────────────────────────┐
│ Modules from: floor plan markers + brief room requirements            │
│ Each module inherits: room name, placement notes, style               │
│ Production defaults: sheet sizes, kerf, trim, thicknesses            │
│ Materials: selected boards, laminates, edge banding                   │
│ C1301 learned patterns applied                                        │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  modules[{room,type,w,h,d,qty,material,finish,notes}]
         │
         ▼
PART GENERATION ────────────────────────────────────────────────────────┐
│ Sides: H × D (× Qty × 2)                                             │
│ Top/Btm: (W - 2×thk) × D (× Qty)                                    │
│ Back: (W - 2×thk) × (H - 2×thk) (× Qty)                             │
│ Shelves: (W - 2×thk) × D (× shelfCount × Qty)                       │
│ Shutters: (W / shutterCount) × H (× shutterCount × Qty)             │
│ Drawer fronts: (W / drawerCount) × drawerH (× drawerCount × Qty)     │
│ Edge bands: visible → 2mm, internal → 0.8mm, back → none             │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  parts[{code,name,material,thk,length,width,qty,grain,
         │         edge_t,edge_r,edge_b,edge_l,notes}]
         │
         ▼
SHEET OPTIMIZATION ─────────────────────────────────────────────────────┐
│ Group by material/thickness/grain                                     │
│ Sort largest first                                                    │
│ Place on 2440×1220 sheets                                             │
│ 3mm kerf, 10mm trim                                                   │
│ Allow rotation where grain permits                                    │
│ Flag oversized pieces                                                 │
│ Calculate waste %                                                     │
└──────────────────────────────────────────────────────────────────────┘
         │
         │  layouts[{sheetNum,placements[{partId,x,y,rotated}],
         │         waste%, cutLines[], unplaced[]}]
         │
         ▼
EXPORT ─────────────────────────────────────────────────────────────────┐
│ CSVs for workshop                                                     │
│ Workshop PDF (8 pages)                                                │
│ Panel Labels PDF                                                      │
│ Job Summary PDF                                                       │
│ All stored in Deliverables Vault                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Data Transfer Contracts

### Contract 1: Onboarding → Floor Plan

```
Input to Floor Plan:
{
  projectId: "abc123",
  clientName: "Raghav Iyer",
  rooms: [
    { name: "Living Room", size: "20x15 ft", notes: "Open plan" },
    { name: "Kitchen", size: "12x10 ft", notes: "L-shaped" },
    { name: "Master Bedroom", size: "14x12 ft", notes: "With attached bath" }
  ],
  stylePreferences: ["Modern", "Minimalist"],
  budgetBand: "Premium"
}

How Floor Plan uses it:
- Pre-fills zone labels with room names from onboarding
- Sets default zone sizes from room dimensions
- Remembers style preferences for annotations
```

### Contract 2: Floor Plan → AI Renders

```
Input to AI Renders:
{
  projectId: "abc123",
  zones: [
    { name: "Living Room", x: 100, y: 50, w: 600, h: 400,
      markers: [
        { type: "TV_Unit", x: 100, y: 200, w: 240, h: 45, 
          notes: "42-inch TV, soundbar shelf" },
        { type: "Sofa", x: 350, y: 250, w: 240, h: 90,
          notes: "L-shaped, 3-seater" }
      ],
      dimensions: { width: 6000, height: 4500, unit: "mm" },
      notes: "West wall has large window"
    }
  ],
  roomRequirements: ["Living Room", "Kitchen"],
  stylePreferences: ["Modern"],
  budgetBand: "Premium"
}

How AI Renders uses it:
- Pre-selects rooms from floor plan zones
- Uses marker notes as furniture requirements
- Uses zone dimensions as layout constraints
- Injects all into the prompt compiler
```

### Contract 3: AI Renders → PDF Brief

```
Input to PDF Brief:
{
  projectId: "abc123",
  approvedRenders: [
    { room: "Living Room", filePath: "/storage/assets/render1.png",
      style: "Modern", prompt: "...compiled prompt..." }
  ],
  briefPayload: { ... all onboarding + floor plan data ... }
}

How PDF Brief uses it:
- Approved render images placed in room-wise sections
- Render style and prompt shown as design direction
- Only APPROVED renders are included
- If no approved renders, PDF shows warning
```

### Contract 4: Brief → Cutlist

```
Input to Cutlist:
{
  projectId: "abc123",
  modules: [
    { room: "Living Room", type: "tv-unit", name: "TV Unit",
      width: 2400, height: 450, depth: 400, quantity: 1,
      shelfCount: 2, drawerCount: 0, shutterCount: 2,
      carcassMaterial: "18mm BWR", shutterFinish: "8609 GFP Frosty White",
      backPanelMaterial: "6mm MR",
      edgeRules: { visible: "2mm PVC", internal: "0.8mm PVC" },
      furnitureRequirements: "42\" TV, soundbar shelf",
      placementNotes: "Center on west wall"
    },
    { room: "Master Bedroom", type: "wardrobe", name: "Wardrobe",
      width: 2400, height: 2400, depth: 600, quantity: 1,
      shelfCount: 4, drawerCount: 3, shutterCount: 4,
      ... }
  ]
}

How Cutlist uses it:
- Each module creates full part list
- Inherits room for CSV grouping
- Uses material specs for sheet assignment
- Uses edge rules for per-part edge banding
- Uses furniture notes for production context
```

---

## Pipeline Readiness Algorithm

Each project has a **readiness score** (0-100%) calculated from stage completions:

```javascript
function calculateReadiness(project) {
  const stages = {
    onboarding: { weight: 15, check: p => p.intake_completed },
    floorPlan:  { weight: 15, check: p => p.floor_plan_uploaded },
    renders:    { weight: 20, check: p => p.approvedRenderCount > 0 },
    pdfBrief:   { weight: 20, check: p => p.pdf_brief_generated },
    cutlist:    { weight: 20, check: p => p.cutlist_exported },
    delivered:  { weight: 10, check: p => p.deliverables_exported }
  };
  
  let score = 0;
  for (const [stage, config] of Object.entries(stages)) {
    if (config.check(project)) score += config.weight;
  }
  return score;
}

// Color coding:
// >80%: Green (#7dbb74)  — "Ready for handover"
// 50-80%: Amber (#d19a3a) — "In progress"
// <50%: Red (#c46a4a)    — "Just started"
```

## Pipeline Stage Transitions

```
Current Stage      → Can Move To           → Condition
──────────────────────────────────────────────────────
Draft              → Onboarding            Add Client clicked
Onboarding         → Floor Plan            All 8 steps completed
Floor Plan         → AI Renders            Floor plan uploaded + zones defined
AI Renders         → Render Review         At least 1 variant generated
Render Review      → Render Approved       Designer accepts a variant
Render Approved    → PDF Brief             Generate PDF clicked
PDF Brief          → Brief Approved        Manually marked (client approved)
Brief Approved     → Cutlist Project       Create cutlist clicked
Cutlist Project    → Sheets Optimized      Generate parts + optimize
Sheets Optimized   → Delivered             All exports generated
```

---

## Cutlist Automation: 2D → Production Pipeline

This is the most important innovation. The designer's finalized 2D floor plan becomes the source of truth for the entire cutlist:

```
FINALIZED FLOOR PLAN
    │
    ├── Zone: Living Room (6000×4500mm)
    │     ├── Marker: TV_Unit @ (100, 200) → Module: TV Unit (2400×450×400)
    │     ├── Marker: Sofa @ (350, 250)    → Furniture reference
    │     └── Marker: Showcase @ (500, 100) → Module: Showcase (1200×1800×350)
    │
    ├── Zone: Kitchen (3600×3000mm)
    │     ├── Marker: Base_Cabinet @ (0, 0) → Module: Base Cabinet ×6 (600×720×560)
    │     ├── Marker: Wall_Cabinet @ (0, 2400) → Module: Wall Cabinet ×5 (600×720×350)
    │     ├── Marker: Counter → Production reference
    │     └── Marker: Sink → Module: Sink Cabinet (900×720×560)
    │
    ├── Zone: Master Bedroom (4200×3600mm)
    │     ├── Marker: Wardrobe @ (3000, 0) → Module: Wardrobe (2400×2400×600)
    │     ├── Marker: Bed → Furniture reference
    │     └── Marker: Study_Desk @ (0, 0) → Module: Study Desk (1200×750×500)
    │
    └── Zone: Foyer (1800×3000mm)
          └── Marker: Shoe_Rack @ (0, 0) → Module: Shoe Rack (1200×1200×350)

AUTO-GENERATED MODULES (designer reviews & edits):
├── TV Unit: Living Room, 2400×450×400, 1
│   └── Parts: S/P×2, TOP, BTM, BACK, Shelf×2, Shutter×2
├── Kitchen Base ×6: Kitchen, 600×720×560, 6
│   └── Parts: S/P×2, TOP, BTM, BACK, Shelf×1, Door×2
├── Kitchen Wall ×5: Kitchen, 600×720×350, 5
│   └── Parts: S/P×2, TOP, BTM, BACK, Door×2
├── Sink Cabinet: Kitchen, 900×720×560, 1
│   └── Parts: S/P×2, TOP, BTM, BACK, DOOR×2
├── Wardrobe: MBR, 2400×2400×600, 1
│   └── Parts: S/P×2, TOP, BTM, BACK, Shelf×4, Door×4, Drawer×3
├── Study Desk: MBR, 1200×750×500, 1
│   └── Parts: S/P×2, TOP, BACK, Shelf×1
└── Shoe Rack: Foyer, 1200×1200×350, 1
    └── Parts: S/P×2, TOP, BTM, BACK, Shelf×3, Door×2
```

---

## Production Learning Integration (C1301)

The C1301 analysis revealed these production patterns that must be baked into the cutlist engine:

### Part Naming Convention
```
S/P     = Side Panel
TOP     = Top Panel
BTM     = Bottom Panel
BACK    = Back Panel
V/P     = Vertical Panel (divider)
F/S     = Fixed Shelf
FACIA   = Fascia
DR-S/P  = Drawer Side Panel
DR-BK   = Drawer Back
DR-F/T  = Drawer Front
SK      = Skirting
DOOR    = Door/Shutter
FILLER  = Filler
DUMMY   = Dummy Panel
```

### Material Compound Strings
```
"16MR F+F"          = 16mm MR Grade, Frosty White both sides
"16MR 4211 EH+F"    = 16mm MR Grade, 4211 EH laminate outside, Frosty inside
"18HDHMR DA 325+F"  = 18mm HDHMR, DA 325 laminate outside, Frosty inside
"6MR F+F"           = 6mm MR Grade, Frosty White both sides
```

### Edge Banding Rules by Part Role
| Part Role | Visible Edge | Internal Edge | Hidden Edge |
|-----------|-------------|---------------|-------------|
| S/P (Side Panel) | Front: 2mm | Top/Btm: 0.8mm | Back: none |
| TOP | Front: 2mm | Sides: 0.8mm | Back: none |
| BTM | Front: 2mm | Side/Bk: 0.8mm | — |
| BACK | None | None | None |
| DOOR | All 4: 2mm | — | — |
| F/S (Fixed Shelf) | Front: 2mm | Sides: 0.8mm | Back: none |
| SK | Front: 2mm | All others: 0.8mm | — |

### Formula-Derived Dimensions
```
Side Panel:      Height = Module_H - Skirt_H, Width = Module_D
Top Panel:       Width = Module_W - (2 × Board_T), Depth = Module_D
Bottom Panel:    Width = Module_W - (2 × Board_T), Depth = Module_D
Back Panel:      Width = Module_W - (2 × Board_T), Height = Module_H - (2 × Board_T)
Shelf:           Width = Module_W - (2 × Board_T), Depth = Module_D - 10mm
Door:            Width = (Module_W - gaps) / Door_Count, Height = Module_H - gaps
Drawer Front:    Width = (Module_W - gaps) / Drawer_Count, Height = Drawer_H
Filler:          Width = calculated_gap, Height = Module_H
```

---

## This is the Master Plan

This document represents the complete restructured architecture for the Spacious Venture Studio OS. All other documentation files should be read in the context of this master plan.

**The three core problems are solved as follows:**

1. **Walk-in Client Experience**: Guided onboarding + floor plan annotation → AI renders → polished PDF brief = complete client journey from first visit to leave-behind deliverable.

2. **App Structure**: Linear pipeline with stage-gated progression, connected data contracts, readiness scoring, and next-action forcing. Every screen is in service of the pipeline.

3. **Cutlist Automation**: 2D finalization triggers auto-module generation from floor plan markers. Production rules (C1301-derived) ensure factory-ready outputs. Designer reviews and exports workshop package.