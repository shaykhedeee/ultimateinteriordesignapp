# AI Render Studio — UI Enhancement Specifications

## Current Issues with the Render Experience

1. **No floor plan overlay** — User can't see what the AI understood from the floor plan
2. **No component isolation** — Can't click on an element in the render to modify it
3. **Color change requires full regeneration** — No targeted recoloring
4. **No spatial accuracy feedback** — User doesn't know if the render matches the floor plan
5. **No Indian context preset** — User has to specify "Indian home" manually every time

---

## Enhanced Screen: AI Render Studio

### Full-Screen Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  AI RENDER STUDIO                  Project: Iyer Residence          │
│  ◀ Back to Dashboard               Stage: Render Review             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┬─────────────────────────────────────┬──────────┐ │
│  │  SPATIAL      │  RENDER CANVAS                      │ DESIGN   │ │
│  │  MAP          │                                     │ CONTROLS │ │
│  │  (260px)      │  ┌─────────────────────────────┐   │ (320px)  │ │
│  │               │  │                              │   │          │ │
│  │  ┌─────────┐  │  │                              │   │ Room:    │ │
│  │  │ FLOOR   │  │  │     [RENDER IMAGE]           │   │ ───────  │ │
│  │  │ PLAN    │  │  │                              │   │ Living   │ │
│  │  │ OVERLAY │  │  │                              │   │ Kitchen  │ │
│  │  │         │  │  │                              │   │ MBR      │ │
│  │  │ 🟦Room  │  │  └─────────────────────────────┘   │ Bedroom2 │ │
│  │  │ ■ Wall  │  │                                    │          │ │
│  │  │ 🚪Door  │  │  ┌─────────────────────────────┐   │ Style:   │ │
│  │  │ 🪟Windw │  │  │  VARIANT THUMBNAILS         │   │ ───────  │ │
│  │  │ 📺Comp  │  │  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │   │ Modern   │ │
│  │  └─────────┘  │  │  │V1│ │V2│ │V3│ │V4│ │V5│  │   │ Tradit.  │ │
│  │               │  │  └──┘ └──┘ └──┘ └──┘ └──┘  │   │ Minimal  │ │
│  │  Components:  │  │  ★ V1 = Selected            │   │ Luxury   │ │
│  │  ✓ TV Unit    │  └─────────────────────────────┘   │          │ │
│  │  ✓ Sofa       │                                    │ Budget:  │ │
│  │  ✓ Dining     │                                    │ ───────  │ │
│  │  ⚠ Rug (?)    │  ┌─────────────────────────────┐   │ Premium  │ │
│  │               │  │  SPATIAL ACCURACY            │   │ Standard │ │
│  │  [Show/Hide]  │  │  Score: 86% — Match floor   │   │          │ │
│  │               │  │  plan ✓ Layout ✓ Lighting ✓  │   │ Quality: │ │
│  │               │  │  TV Unit ✓ Sofa ✓ Kitchen ✗  │   │ ───────  │ │
│  │               │  │  [Fix mismatch]              │   │ Quick    │ │
│  │               │  └─────────────────────────────┘   │ Balanced │ │
│  │               │                                    │ Precision│ │
│  │               │                                    │          │ │
│  │               │                                    │ ───────  │ │
│  │               │                                    │          │ │
│  │               │                                    │ [GENERATE│ │
│  │               │                                    │  VARIANTS│ │
│  │               │                                    │ ┌──────┐ │ │
│  │               │                                    │ │ 🎨 AI │ │ │
│  │               │                                    │ └──────┘ │ │
│  └───────────────┴─────────────────────────────────────┴──────────┘ │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────────┐
│  │  COMPONENT COLOR EDITOR (Expandable Panel)                       │
│  ├───────────────────────────────────────────────────────────────────┤
│  │  SELECTED: Sofa (Living Room)   Current: Beige Fabric           │
│  │  ┌─────────────────────────────────────────────────────────────┐ │
│  │  │  ⬤ Navy Blue   ○ Charcoal   ○ Teal      ○ Mustard          │ │
│  │  │  ○ Burgundy    ○ Forest     ○ Blush     ○ Terracotta       │ │
│  │  │  Material: [Fabric: Velvet ▼]  [Apply to: This Variant ▼]   │ │
│  │  │  [Preview Change]  [Apply]                                   │ │
│  │  └─────────────────────────────────────────────────────────────┘ │
│  └───────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key UI Components

### 1. Spatial Map (Left Panel)

Shows a schematic overlay of the floor plan with all detected elements. This panel helps the designer **verify that the AI understood the space correctly**.

```
┌─────────────────────┐
│ FLOOR PLAN ANALYSIS │
├─────────────────────┤
│                     │
│  ┌─────────────┐    │
│  │ ┌────┐      │    │
│  │ │ TV │  W   │    │  W = Window
│  │ └────┘  I   │    │  D = Door
│  │         N   │    │  🛋 = Sofa
│  │ ┌──┐ D  D  │    │  📺 = TV
│  │ │🛋│ O  I   │    │  🪑 = Dining
│  │ └──┘ O  N   │    │
│  │      R  I   │    │  Color legend:
│  │ ┌──┐    N  │    │  ■ Wall (detected)
│  │ │🪑│   G   │    │  ■ Wall (uncertain)
│  │ └──┘       │    │  🟦 Room label
│  └─────────────┘    │
│                     │
│  ✓ 6 components     │
│  ⚠ 1 uncertain      │
│                     │
│  [Confirm All]      │
│  [Edit Annotations] │
└─────────────────────┘
```

**Interactive Features**:
- Click any detected component to highlight it in the render
- Drag to adjust positions if the AI got it wrong
- Color-coded confidence: Green ✓, Yellow ⚠, Red ✗
- Toggle overlay on/off to compare with render

### 2. Render Canvas (Center)

The main render display with interaction capabilities:

```
┌──────────────────────────────────────────┐
│  RENDER CANVAS                            │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │     [RENDER IMAGE]                │   │
│  │                                    │   │
│  │     Hover: Highlight component     │   │
│  │     Click: Select component        │   │
│  │     Right-click: Edit color        │   │
│  │                                    │   │
│  │  ┌── Currently viewed ──────────┐  │   │
│  │  │ Variant 1 of 4 | Premium     │  │   │
│  │  │ Living Room - Modern          │  │   │
│  │  │ Approved: Pending review      │  │   │
│  │  └───────────────────────────────┘  │   │
│  └────────────────────────────────────┘   │
│                                            │
│  Controls:                                  │
│  [Zoom In] [Zoom Out] [Fit] [Fullscreen]    │
│  Compare: [Before/After] [Side by Side]     │
└────────────────────────────────────────────┘
```

**Interaction States**:
| State | Behavior |
|-------|----------|
| Default | Full render displayed, pan/zoom enabled |
| Hover over component | Highlighted border + tooltip: "Sofa - Beige Fabric" |
| Click component | Opens Color Editor panel at bottom |
| Right-click component | Context menu: Edit Color, Edit Material, Remove, Replace |
| Drag from floor plan map | Highlights corresponding component in render |

### 3. Variant Thumbnails

Shows generated variants in a horizontal scrollable strip:

```
┌──────────────────────────────────────────────────────────┐
│  VARIANTS                                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │
│  │ V1 │ │ V2 │ │ V3 │ │ V4 │ │ V5 │   ← Scrollable      │
│  │ ★  │ │    │ │    │ │    │ │    │                      │
│  │Modern│ │Dark │ │Blue │ │Warm │ │Cool │                │
│  │ Beige│ │Char-│ │Navy │ │Terra│ │Grey │                │
│  │      │ │coal │ │     │ │cotta│ │     │                │
│  │✓ Aprv│ │     │ │     │ │     │ │     │                │
│  └────┘ └────┘ └────┘ └────┘ └────┘                      │
│                                                            │
│  [Generate 4 New Variants]  [Accept Selected] [Reject All] │
└────────────────────────────────────────────────────────────┘
```

Each variant card shows:
- Thumbnail of the render
- Variant name (e.g., "Designer's Choice", "Bold & Blue", "Evening Mood")
- Approval status (★ = Accepted, ○ = Pending, ✕ = Rejected)
- Quick action: Click to view full-size

### 4. Component Color Editor (Expandable Bottom Panel)

The most innovative UI element — enables **targeted color changes without regeneration**:

```
┌─────────────────────────────────────────────────────────────┐
│ △ COMPONENT COLOR EDITOR                     [Collapse]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Selected:      ┌─────────────────────────────────────────┐│
│  [Sofa ▼]       │ PREVIEW                                 ││
│  Living Room    │ ┌──────────┐ ┌──────────────────────┐  ││
│                 │ │ BEFORE   │ │ AFTER                │  ││
│  Current:       │ │ (beige)  │ │ (navy blue velvet)   │  ││
│  Beige Fabric   │ └──────────┘ └──────────────────────┘  ││
│                 └─────────────────────────────────────────┘│
│  Colors:                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤  More...                          │   │
│  │ Navy  Char   Teal  Mustard  Burg  Forest  Blush  Terr  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Materials:                                                 │
│  [Fabric ▼] [Velvet] [Linen] [Leather] [Boucle]            │
│                                                             │
│  Apply to: [This Room Only ▼] [All Rooms] [All Variants]   │
│                                                             │
│  [Cancel]  [Preview Change]  [Apply & Close]               │
└─────────────────────────────────────────────────────────────┘
```

### 5. Spatial Accuracy Report

After generation, shows how well the render matches the floor plan:

```
┌──────────────────────────────────────────────────────────────┐
│  SPATIAL ACCURACY                          Score: 86% PASS │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────┬────────────────────────────────┬────────┬────────┐ │
│  │ #   │ CHECK                          │ STATUS │ SCORE  │ │
│  ├─────┼────────────────────────────────┼────────┼────────┤ │
│  │ 1   │ Room dimensions match plan     │ ✓ PASS │ 92%    │ │
│  │ 2   │ Walls positioned correctly     │ ✓ PASS │ 90%    │ │
│  │ 3   │ Windows count & placement      │ ✓ PASS │ 95%    │ │
│  │ 4   │ Door positions                 │ ✓ PASS │ 88%    │ │
│  │ 5   │ TV Unit on west wall           │ ✓ PASS │ 90%    │ │
│  │ 6   │ Sofa opposite TV               │ ✓ PASS │ 85%    │ │
│  │ 7   │ Kitchen visible through arch   │ ⚠ PART │ 78%    │ │
│  │ 8   │ Dining area in correct zone    │ ✓ PASS │ 82%    │ │
│  │ 9   │ Lighting from correct direction│ ✓ PASS │ 96%    │ │
│  │ 10  │ Component colors match specs   │ ⚠ PART │ 75%    │ │
│  └─────┴────────────────────────────────┴────────┴────────┘ │
│                                                              │
│  Flagged: TV unit appears as white laminate, but design      │
│  specifies walnut veneer. Use Color Editor → TV Unit.        │
│                                                              │
│  [Accept Render]  [Regenerate with Fixes]  [Manual Edit]     │
└──────────────────────────────────────────────────────────────┘
```

---

## UI Interaction Flows

### Flow 1: Full Workflow — Floor Plan to Final Render

```
1. Designer uploads floor plan
   → Spatial Map panel shows all detected walls, rooms, components
   
2. Designer reviews and corrects any AI mistakes
   → Click on wall → drag to adjust
   → Click "Add missing component" → place on map
   
3. Designer clicks "Confirm All" → floor plan is finalized
   
4. Designer selects room, style, budget
   → Clicks "Generate Variants"
   
5. AI generates 4 variants (15-30 seconds each)
   → All shown as thumbnails
   → Spatial Accuracy report shown for each
   
6. Designer reviews variants:
   → Clicks V1 to view full size
   → Likes layout but wants navy sofa
   → Clicks sofa in render → Color Editor opens
   → Selects Navy Blue → clicks Preview → sees updated V1
   → Applies to all variants → all 4 now have navy sofa
   
7. Designer accepts V1 (★)
   → "Accepted" badge shown
   → PDF brief is now unlocked for this project
```

### Flow 2: Client Feedback Loop

```
Client: "I like this layout, but can we try warmer colors?"

1. Designer clicks on sofa → Color Editor
2. Changes from beige to terracotta
3. Preview shows updated render in 3 seconds
4. TV unit: walnut → white
5. Preview shows updated render
6. Wall color: off-white → warm beige
7. "Before/After" comparison shows dramatic difference
8. Client says "Yes, this is it!"
9. Designer clicks "Apply to All Variants" → saves as Revision 2
```

---

## UI Enhancement: One-Click Color Application to All Variants

The most powerful feature: change ONE component and see it in ALL variants instantly:

```
┌─────────────────────────────────────────────────────────────┐
│  Apply "Navy Blue Sofa" to all variants?                    │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │  V1  │  │  V2  │  │  V3  │  │  V4  │                   │
│  │Before│  │Before│  │Before│  │Before│                   │
│  │      │  │      │  │      │  │      │                   │
│  │████  │  │████  │  │████  │  │████  │                   │
│  │After │  │After │  │After │  │After │                   │
│  │▓▓▓▓  │  │▓▓▓▓  │  │▓▓▓▓  │  │▓▓▓▓  │                   │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
│                                                             │
│  [Cancel]  [Apply to All]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobile Adaptations

On mobile (< 768px), the layout collapses:

```
┌──────────────────────────────┐
│  AI RENDER STUDIO            │
├──────────────────────────────┤
│                              │
│  [RENDER IMAGE]              │
│  [full width, swipeable]     │
│                              │
│  ◄ Variant Thumbnails ►      │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │V1│ │V2│ │V3│ │V4│       │
│  └──┘ └──┘ └──┘ └──┘       │
│                              │
│  ─── Component Editor ───   │
│  [Tap on image to select    │
│   component, then edit]      │
│                              │
│  Sofa: [Navy Blue ▼]        │
│  Material: [Velvet ▼]        │
│                              │
│  [Apply] [Generate More]     │
└──────────────────────────────┘
```