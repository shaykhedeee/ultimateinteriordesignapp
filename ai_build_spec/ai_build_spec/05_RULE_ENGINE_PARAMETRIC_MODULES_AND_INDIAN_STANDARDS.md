# 05 — Rule Engine, Parametric Modules, and Indian Standards

## 1. Purpose

This document defines how the app must encode interior intelligence.

The app must not treat design standards as static notes.
They must become executable rules, template constraints, validation logic, and downstream production assumptions.

This is a major product differentiator.

---

## 2. Core Principle

Rules must exist at four levels:

1. **global rules** — units, geometry validity, version safety
2. **room rules** — kitchen, bedroom, living, mandir, etc.
3. **module rules** — wardrobe, TV unit, kitchen run, crockery, etc.
4. **production rules** — board thickness, edge banding, part formulas, sheet logic

### Rule Types
- hard rule
- soft rule
- advisory rule
- scoring rule

### Meanings
- **hard rule**: must fail unless explicit override by authorized user
- **soft rule**: may pass with warning and explanation
- **advisory rule**: suggestion only
- **scoring rule**: contributes to design quality score

---

## 3. Rule Engine Contract

### Input
- scene version
- room data
- module data
- material assignments
- studio rule set
- production preset

### Output
```ts
interface RuleEvaluationResult {
  scope: 'scene' | 'room' | 'module' | 'production';
  scopeRef: string;
  summary: {
    passCount: number;
    warnCount: number;
    failCount: number;
    score?: number;
  };
  results: Array<{
    ruleCode: string;
    severity: 'hard' | 'soft' | 'advisory' | 'score';
    status: 'pass' | 'warn' | 'fail';
    message: string;
    measured?: Record<string, any>;
    expected?: Record<string, any>;
    overrideAllowed: boolean;
  }>;
}
```

### Engine Behavior
- deterministic
- auditable
- repeatable
- context-aware by room/module type
- no hidden implicit fixes
- user overrides stored with reason

---

## 4. Standardized Room Types

The product must support at minimum:

- foyer
- living_room
- dining_room
- kitchen
- utility
- master_bedroom
- bedroom
- kids_bedroom
- guest_bedroom
- study
- balcony
- bathroom
- powder_room
- mandir_room
- passage
- office_cabin
- workstation_area
- reception
- showroom_zone

Room type determines:
- allowed modules
- common camera presets
- common lighting presets
- validation logic
- documentation defaults

---

## 5. Parametric Module Framework

## 5.1 Required Module Categories

### Kitchen
- base_run_straight
- base_run_l_shape
- base_run_u_shape
- island_unit
- sink_unit
- hob_unit
- tall_unit
- wall_cabinet_run
- loft_run
- crockery_display_kitchen

### Wardrobes / Bedroom Storage
- wardrobe_swing
- wardrobe_sliding
- loft_storage
- dresser_unit
- study_desk
- bedside_unit

### Living / Dining
- tv_unit
- feature_wall_panel_system
- crockery_unit
- dining_console
- shoe_rack

### Mandir / Pooja
- mandir_floor_unit
- mandir_wall_unit
- mandir_niche_system

### Other
- vanity_unit
- utility_storage
- partition_screen
- false_ceiling_system

## 5.2 Parametric Module Contract

Each template must define:

```ts
interface ModuleTemplateDefinition {
  templateKey: string;
  roomType: string;
  moduleType: string;
  params: Array<{
    key: string;
    type: 'number' | 'string' | 'boolean' | 'enum';
    required: boolean;
    defaultValue?: any;
    min?: number;
    max?: number;
    unit?: string;
    options?: string[];
  }>;
  geometryRules: any[];
  materialSlots: Array<{
    slotKey: string;
    category: string;
    required: boolean;
  }>;
  productionMapping: {
    partFormulaSetKey: string;
    edgeRuleSetKey: string;
  };
  validations: string[];
}
```

---

## 6. Global Geometry Rules

These apply to all scenes.

### Hard Rules
- room polygon must be valid and non-self-intersecting
- wall lengths must be positive
- openings must fit within parent wall length
- modules must have positive width/height/depth
- locked scene versions cannot be mutated directly
- room references and wall references must resolve

### Soft Rules
- rooms should have valid area ranges for their detected type
- camera presets should avoid fisheye distortion
- door swing conflicts should be flagged

---

## 7. Kitchen Rules

These rules must be implemented from the uploaded standards and product direction.

## 7.1 Kitchen Hard Rules
- base unit depth must be within allowed configured range
- wall cabinet depth must be within allowed configured range
- loft depth must be within allowed configured range if present
- hob unit must support chimney/hood position logic if specified
- sink and hob cannot overlap in the same exact module footprint
- appliance slots must fit within run length

## 7.2 Kitchen Soft Rules
- sink preferred under or near window where possible
- loft heights across a continuous run should align
- wall cabinets and lofts should maintain clean separation bands
- top lofts and wall cabinets should not visually bleed finish assignments across intended split zones
- cooking workflow triangle should be scored where applicable

## 7.3 Kitchen Advisory Rules
- suggest tandem drawers for heavy-use base modules
- suggest separate dry/wet zones
- suggest brighter task lighting over countertop work zones

## 7.4 Kitchen Rule Parameters
Default config should include:

```json
{
  "kitchen.base.depth_mm": { "min": 560, "max": 600 },
  "kitchen.counter.depth_mm": { "min": 600, "max": 620 },
  "kitchen.wall.depth_mm": { "min": 300, "max": 350 },
  "kitchen.loft.depth_mm": { "min": 560, "max": 600 },
  "kitchen.backsplash.height_mm": { "default": 600 }
}
```

---

## 8. Wardrobe Rules

## 8.1 Hard Rules
- swing-door wardrobe requires minimum swing clearance threshold
- sliding wardrobe requires total depth threshold
- walk-in closet passage requires minimum passage threshold
- wardrobe height cannot exceed configured practical limit without explicit override

## 8.2 Soft Rules
- internal LED lighting recommended for smoked glass wardrobes
- door split count should match width feasibility
- internal segmentation should adapt to user clothing/storage profile

## 8.3 Default Parameters
```json
{
  "wardrobe.swing.clearance_mm": { "min": 750 },
  "wardrobe.sliding.depth_mm": { "default": 650, "hardMin": 650 },
  "wardrobe.walkin.passage_mm": { "min": 900 }
}
```

---

## 9. TV Unit and Feature Wall Rules

## 9.1 Hard Rules
- TV unit width must not exceed available wall width minus safety margins
- wall feature composition must respect opening/door boundaries on same wall
- console cannot intersect door swing or circulation zone

## 9.2 Soft Rules
- feature wall should center or intentionally align composition based on TV and seating axis
- backlit marble, wood veneer, and fluted panel systems should remain compositionally bounded
- sofa alignment and circulation should be scored

## 9.3 Advisory Rules
- suggest lighting halo behind marble feature panel
- suggest rounded or softened console edges in premium style packs

---

## 10. Mandir / Pooja Rules

## 10.1 Hard Rules
- if vastu mode is enabled, NE preference should be enforced as a high-priority rule or soft/hard based on studio settings
- platform/pedestal height must fall within configured range
- deity orientation recommendations must be surfaced

## 10.2 Soft Rules
- backlit stone or jali options suggested for premium tiers
- lower drawers recommended for storage

## 10.3 Default Parameters
```json
{
  "mandir.preferred_zone": ["north_east"],
  "mandir.platform.height_mm": { "min": 300, "max": 450 }
}
```

---

## 11. Lighting and Rendering Rules

## 11.1 Hard Rules
- elevation camera must be orthographic or equivalent straight-on non-distorted framing for elevation output
- walkthrough cameras must not use fisheye-like distortion by default
- vertical lines must remain visually straight in documentation and final architectural-style render views

## 11.2 Soft Rules
- natural daylight should be primary where openings exist
- warm ambient LED backlighting recommended for feature elements
- task spots should target work surfaces

## 11.3 Default Parameters
```json
{
  "lighting.ambient.cove_cct_k": { "default": 3000 },
  "lighting.task.cct_k": { "default": 4000 },
  "camera.eye_height_mm": { "min": 1200, "max": 1500 },
  "camera.allow_fisheye": false
}
```

---

## 12. Material Rules

## 12.1 Hard Rules
- material category assigned to a module slot must match slot-compatible categories
- board thickness must match production preset compatibility
- incompatible finish combinations must be blocked where required

## 12.2 Soft Rules
- finish harmony suggestions
- budget compatibility warnings
- fingerprint-prone glossy finishes in high-touch zones may trigger advisory notes

## 12.3 Material Slot Examples

### Kitchen
- carcass_board
- shutter_finish
- back_panel
- countertop
- dado_surface
- handle_profile

### Wardrobe
- carcass_board
- shutter_finish
- glass_type
- handle_type
- internal_finish

### TV Unit
- backdrop_finish
- fluted_finish
- console_finish
- lighting_detail

---

## 13. Production Rules

These translate approved modules into production data.

## 13.1 Board Defaults
Studio presets must define:
- carcass board thickness
- back panel thickness
- door panel thickness
- edge band standards
- sheet size
- kerf
- trim

## 13.2 Part Naming Convention
The system should support production naming schemes such as:
- S/P
- TOP
- BTM
- BACK
- V/P
- F/S
- DOOR
- FACIA
- FILLER
- SK
- drawer part naming

## 13.3 Default Formula Concepts
Examples:
- side panel height derived from module height minus applicable offsets
- top/bottom width derived from module width minus side thickness allowances
- shelf width derived from internal width
- back panel derived from carcass internal dimensions
- door width derived from module opening width and door count

## 13.4 Edge Band Rules
At minimum support:
- visible edge = 2mm
- internal edge = 0.8mm
- hidden edge = none
- studio overrides allowed

---

## 14. Rule Override Model

Users with permission may override selected hard or soft rules.

### Override Record Must Store
- user ID
- scene version ID
- room/module reference
- rule code
- old status
- override reason
- timestamp

### Rule
No hard-rule override may happen silently.

---

## 15. Design Scoring

The system should support a score for each room and scene.

### Scoring Dimensions
- geometry validity
- circulation quality
- standards compliance
- storage suitability
- lighting quality
- material harmony
- budget fit
- production feasibility

### Use Cases
- helps non-expert designers
- helps QA
- helps automated layout ranking
- helps client comparison

---

## 16. Template Packs

The product must support template packs for:

- budget-friendly modern
- premium contemporary
- warm luxury
- minimalist neutral
- family storage optimized
- compact apartment optimized
- vastu-sensitive pack

Each pack should include:
- room defaults
- module defaults
- finish suggestions
- camera presets
- lighting presets
- pricing assumptions

---

## 17. Room-Specific Suggestions Engine

For each room type, the app should auto-suggest:

### Kitchen
- likely run type
- sink and hob placement candidates
- storage optimization ideas

### Bedroom
- wardrobe type based on passage width
- study/vanity placement candidates

### Living Room
- likely TV wall candidate
- sofa orientation candidates
- crockery niche candidate near dining

### Mandir
- likely placement based on orientation and unoccupied zones

Suggestions must always be ranked by:
- rule fitness
- geometry fit
- circulation quality
- budget compatibility

---

## 18. Rules Source Strategy

The following uploaded documents must be converted into structured rules over time:

- kitchen_standards.md
- wardrobe_standards.md
- tv_elevation_standards.md
- mandir_standards.md
- lighting_and_rendering_standards.md
- interior_design_lingo.md

### Implementation Rule
These markdown files should be treated as seed knowledge, not runtime logic.
Runtime logic must live in JSON/YAML/DB rule definitions.

---

## 19. Foolproof Rule Engine Constraints

1. rules must be data-driven where possible
2. rules must not be hard-coded into random UI components
3. validation results must be returned in a machine-readable format
4. rules must support room/module scope separation
5. rules must support per-studio overrides
6. rules must support versioning
7. rule failures must not disappear after refresh

---

## 20. Final Rule Engine Statement

> The app’s intelligence advantage will come from turning Indian modular interior practice into executable logic. The rule engine and parametric module system must make the app behave less like a generic visualizer and more like a specialized interior design and production expert.
