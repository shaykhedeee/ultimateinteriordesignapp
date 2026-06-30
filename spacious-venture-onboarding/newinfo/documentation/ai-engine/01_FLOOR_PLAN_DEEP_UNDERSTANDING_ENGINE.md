# Floor Plan Deep Understanding Engine

## Core Concept

The AI must read a floor plan the way a trained architect would — not just as an image, but as a **structured spatial map** with walls, rooms, openings, circulation paths, component placements, and dimensional relationships. When a render is generated, it must reflect **exactly** what the floor plan shows: where the TV unit is on the wall, where the kitchen cabinets sit, which direction the windows face, and how the furniture is laid out.

---

## How The AI "Reads" The Floor Plan

### Phase 1: Image Preprocessing & Normalization

```
INPUT: Uploaded floor plan image (PNG/JPEG/PDF)
       ↓
1. Convert to standard resolution (300 DPI minimum)
2. Apply adaptive thresholding to clean lines
3. Detect scale from dimension annotations
4. Separate text layer from geometry layer
5. Output: Clean geometry-only raster + text annotations layer
```

### Phase 2: Wall Detection & Segmentation

**AI Model**: Custom U-Net with Swin Transformer backbone (trained on 1000+ Indian floor plans)

```
Detection Pipeline:
├── Exterior walls (load-bearing, drawn thick)
│   └── Thickness detection → structural grid
├── Interior walls (partitions, drawn thin)
│   └── Room boundary definition
├── Wall junctions (T-junctions, L-corners, Cross junctions)
│   └── Spatial connectivity graph
├── Wall openings (doors, arches, passages)
│   └── Circulation path detection
└── Output: Vector wall map with thickness, length, connectivity

Confidence scoring:
  >95%  → Auto-accepted
  80-95% → Highlight for manual review
  <80%  → Manual draw required
```

### Phase 3: Room Segmentation & Labeling

```
From the wall map, the AI:
1. Closes all door openings (mathematically fills gaps)
2. Flood-fills each enclosed area → Room polygon
3. Reads room labels from OCR text layer
4. Falls back to ML classification if no label found:
   - Kitchen: sink/ counter patterns, wet zone markers
   - Living: largest open area, TV/accent wall indicators
   - Bedroom: bed-sized zone, wardrobe alcove
   - Bathroom: plumbing fixtures, small enclosed area
   - Balcony: external boundary, thin depth
   - Utility: service area near kitchen/bathroom
   - Foyer: entrance zone, shoe storage indicators

Output: Room segmentation map with labels, areas (sq ft), dimensions
```

### Phase 4: Component Detection & Placement Mapping

**AI Model**: YOLOv8 / Mask R-CNN trained on interior component dataset

```
Component Detection:
┌──────────────────────────────────────────────────────────────┐
│ SYMBOL / MARKER          →   MAPPED TO                      │
├──────────────────────────────────────────────────────────────┤
│ TV / TV Unit icon        →   TV Unit module                  │
│ Sofa / L-shaped sofa     →   Sofa placement                  │
│ Bed / Double bed         →   Bed placement                   │
│ Dining Table              →   Dining setup                    │
│ Kitchen Sink             →   Sink cabinet module              │
│ Kitchen Counter           →   Counter + base cabinets         │
│ Hob / Stove               →   Hob drawer unit                 │
│ Wardrobe / Closet icon   →   Wardrobe module                 │
│ Shoe rack / Foyer unit   →   Shoe rack module                │
│ Pooja / Mandir symbol    →   Pooja unit module               │
│ Study Desk                →   Study desk module              │
│ Window                    →   Window position + light source  │
│ Door (with swing arc)    →   Door position + circulation     │
│ Column / Pillar          →   Structural constraint            │
│ Stairs                    →   Vertical circulation            │
│ Electrical points        →   Lighting / switch positions     │
│ Plumbing points          →   Wet zone constraints            │
└──────────────────────────────────────────────────────────────┘

Each detected component outputs:
{
  componentType: "TV_unit",
  roomName: "Living Room",
  boundingBox: { x: 120, y: 340, width: 240, height: 45 } // in mm
  wallAttachment: "west_wall",
  placementNotes: "Centered between windows",
  constraints: {
    heightFromFloor: 1200,
    clearanceRequired: 200,
    adjacentTo: ["window_left", "window_right"]
  }
}
```

### Phase 5: Spatial Relationship Graph

The AI builds a complete **spatial relationship graph** of the entire floor plan:

```
SPATIAL GRAPH EXAMPLE (3BHK Apartment):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ENTRY ──→ FOYER ──→ LIVING ──→ BALCONY                    │
│              │          │                                   │
│              │          ├──→ KITCHEN ──→ UTILITY            │
│              │          │       │                           │
│              │          │       └──→ DINING                  │
│              │          │                                   │
│              │          ├──→ PASSAGE ──→ MBR                │
│              │          │       │       └──→ MBR_BATH       │
│              │          │       │                           │
│              │          │       ├──→ BR_2                  │
│              │          │       │       └──→ BR2_BATH      │
│              │          │       │                           │
│              │          │       └──→ BR_3                  │
│              │          │                                   │
│              │          └──→ POOJA                          │
│              │                                             │
│              └──→ COMMON_TOILET                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

For each relationship:
{
  roomA: "Living Room",
  roomB: "Kitchen",
  relationship: "adjacent",
  connectionType: "doorway" | "arch" | "open_plan" | "passage",
  wallShared: "east_wall_of_living",
  openingWidthMm: 2400,  // for open plan
  doorSwingDirection: "into_kitchen" // for doors
}
```

### Phase 6: Dimensional Analysis & Scale Extraction

```
1. Find dimension lines (arrows + text like "2400")
2. Parse: "2400" → 2400mm, "12'-0\"" → 3658mm, "4m" → 4000mm
3. Calculate pixels-per-mm ratio
4. Derive ALL room/module dimensions from pixel measurements
5. Output structured measurement table:

Room: Living Room
  Width: 6000 mm (extracted)
  Length: 4500 mm (extracted)
  Ceiling Height: 3000 mm (assumed / annotation)
  Window: 1800mm wide on west wall, sill 900mm from floor
  Door: 900mm wide, opens inward on north wall
  TV Wall: West wall, clear span: 3600mm between windows
  Floor-to-Ceiling: 3000mm
```

### Phase 7: Layout Constraint Compilation

All spatial understanding compiles into render constraints:

```javascript
{
  renderConstraints: {
    room: {
      name: "Living Room",
      dimensions: { width: 6000, length: 4500, height: 3000 },
      orientation: "west_facing"
    },
    walls: [
      { name: "west_wall", length: 4500, features: ["window_1800mm"],
        restrictions: "TV unit between windows, max width 2400mm" },
      { name: "north_wall", length: 6000, features: ["door_900mm"],
        restrictions: "Sofa along this wall, leave 900mm door clearance" },
      { name: "east_wall", length: 4500, features: ["open_to_kitchen"],
        restrictions: "Open to kitchen, 2400mm arch" },
      { name: "south_wall", length: 6000, features: [],
        restrictions: "Dining table area, 800mm from wall" }
    ],
    components: [
      { type: "TV_unit", position: { wall: "west", x: 200, y: 1200 },
        size: { w: 2400, h: 450, d: 400 } },
      { type: "sofa", position: { wall: "north", x: 1500 },
        size: { w: 2400, h: 900, d: 800 } },
      { type: "dining_table", position: { x: 3800, y: 3500 },
        size: { w: 1500, h: 800 } }
    ],
    lightSources: [
      { type: "window", wall: "west", size: { w: 1800, h: 2100 },
        direction: "afternoon_sun" }
    ],
    circulationPaths: [
      { from: "door", to: "kitchen_arch", width: 900,
        obstacles: [] }
    ]
  }
}
```

---

## AI Render Prompt Compilation

The render engine compiles this understanding into a **deterministic, structured prompt**:

```
PROMPT COMPILATION RULES:
1. Room dimensions → camera field of view and composition
2. Wall positions → what surfaces are visible from camera angle
3. Component placements → exactly positioned furniture
4. Light sources → natural lighting direction and intensity
5. Window positions → background/scene visible through windows
6. Adjacent rooms → visible through open doors/arches
7. Style preferences → materials, finishes, color palette
8. Budget tier → level of detail and quality of finishes

Example compiled prompt:
"A photorealistic interior render of a modern Indian living room,
6000mm wide × 4500mm deep × 3000mm high.
The camera is positioned at the east end looking west at eye level (1600mm).
West wall: Two windows (1800mm wide each) with afternoon sunlight
streaming in warm beams. Between the windows: a wall-mounted
TV unit 2400mm wide, 450mm high, 400mm deep in matte walnut
veneer with white high-gloss shutters. A 65-inch TV centered.
North wall: A 3-seater L-shaped sofa in beige fabric, 2400mm wide,
with two accent cushions in teal and mustard.
Above the sofa: three linear pendant lights.
Floor: 600×600mm matte vitrified tiles in warm beige.
Walls: Textured off-white limewash paint.
Ceiling: 12mm gypsum board with 150mm drop, LED cove lighting.
East wall: Open archway (2400mm wide) leading to kitchen,
visible in the background.
South wall: Dining area with 6-seater wooden dining table.
Style: Modern Indian minimalist with warm neutral palette.
Quality: Photorealistic, 4K resolution, natural lighting,
professional interior photography."
```

---

## What Makes This "Deep Understanding"

| Capability | Traditional AI Render | Spacious Venture Engine |
|-----------|---------------------|------------------------|
| Wall detection | ❌ Ignores walls | ✅ Reads walls with thickness, position, junctions |
| Room labeling | ❌ Random room generation | ✅ Exact room names from floor plan |
| Component placement | ❌ Furniture floats randomly | ✅ TV exactly on TV wall, sofa exactly on sofa wall |
| Light source awareness | ❌ Random lighting | ✅ Windows cast light from correct direction |
| Spatial relationships | ❌ No adjacency awareness | ✅ Kitchen visible through open arch from living room |
| Scale | ❌ No dimension awareness | ✅ 6000mm living room produces proportional furniture |
| Circulation | ❌ Furniture blocks paths | ✅ 900mm door clearance maintained |
| Indian context | ❌ Western-style defaults | ✅ Indian modular furniture, vastu-aware placement |
| Component color control | ❌ Random colors | ✅ User-chosen laminate colors applied to specific components |

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FLOOR PLAN AI PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Upload Image ──→ Preprocessor ──→ Wall Detector (U-Net)   │
│                       │                    │                │
│                       ▼                    ▼                │
│                  OCR Text            Room Segmenter         │
│                  Extractor           (Flood Fill)           │
│                       │                    │                │
│                       ▼                    ▼                │
│                  Component            Spatial Graph         │
│                  Detector (YOLO)      Builder              │
│                       │                    │                │
│                       └────────┬──────────┘                │
│                                ▼                           │
│                     Constraint Compiler                     │
│                                │                           │
│                                ▼                           │
│                     Render Prompt Builder                   │
│                                │                           │
│                                ▼                           │
│                     Image Generator API                     │
│                     (OpenAI / Freepik / Flux)               │
│                                │                           │
│                                ▼                           │
│                     Spatial Validation                      │
│                     (Does render match floor plan?)         │
│                                │                           │
│                    ┌───────────┴───────────┐               │
│                    ▼                       ▼               │
│               Pass ✓                  Fail ✗              │
│            Return Result        Feedback Loop: Add         │
│                                 constraint to prompt       │
└─────────────────────────────────────────────────────────────┘
```

## Frontend UI: Floor Plan Analyzer Panel

When the user uploads a floor plan, a **visual analysis panel** shows:

```
┌──────────────────────────────────────────────────────────────┐
│  FLOOR PLAN ANALYZER                     Confidence: 92%   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  [FLOOR PLAN OVERLAY]                            │       │
│  │                                                   │       │
│  │  Walls: ████████████████  (24 detected) ✓         │       │
│  │  Rooms: ████████████████  (6 detected) ✓          │       │
│  │  Doors: ████████████████  (8 detected) ✓          │       │
│  │  Windows: █████████████  (5 detected) ✓           │       │
│  │  Components: █████████  (12 detected, 2 unsure) ⚠ │       │
│  │                                                   │       │
│  │  [Legend]                                         │       │
│  │  ■ = Wall (detected)    ■ = Wall (uncertain)      │       │
│  │  🟦 = Room              🚪 = Door                 │       │
│  │  🪟 = Window            📺 = Detected component    │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  Detected Components:                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ TV Unit│ │  Sofa  │ │ Dining │ │Wardrobe│ │Kitchen │   │
│  │ LR     │ │ LR     │ │ LR     │ │ MBR    │ │ Counter│   │
│  │ ✓95%   │ │ ✓97%   │ │ ✓88%   │ │ ✓99%   │ │ ✓94%   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                              │
│  [Manual Correction]  [Confirm All]  [Finalize for Render]   │
└──────────────────────────────────────────────────────────────┘
```