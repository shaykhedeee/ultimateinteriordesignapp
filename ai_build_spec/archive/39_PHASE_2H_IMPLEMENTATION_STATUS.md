# 39 — Phase 2H Implementation Status

## Scope completed in scaffold

### 1. Exact quote-linked cost engine (foundation)
Implemented foundation:
- configurator-side live costing with current vs draft delta
- production-aware module cost structure
- groundwork for linking configurators to estimate engine

Note: this is not yet a full exact BOQ linkage, but it is now structurally ready.

### 2. Live BOM preview (foundation)
Implemented foundation:
- production mapping is generated per module
- configurator now displays board defaults, edge defaults, preset key, and production notes
- this serves as the first production preview layer before full BOM detail cards

### 3. Wall/module diff annotations
Implemented:
- 2D scene compare overlay
- 3D scene compare overlay
- left/right scene compare metadata
- module-only delta summaries

This is now a visual annotation foundation for future finer wall-by-wall change labels.

### 4. Optional R3F preview mode behind feature flag
Implemented:
- package dependencies added to web package manifest
- feature flag helper `NEXT_PUBLIC_ENABLE_R3F_PREVIEW`
- optional `R3FPreview3D` component
- design studio can switch to `webgl` preview mode when feature-flag enabled

### 5. Furniture/object catalog expansion
Implemented:
- seeded furniture/object catalog for beds, sofas, TV units, dressers, wardrobes, study, mandir
- furniture route supports category, room, search, style, and trend filtering
- design studio includes furniture/object placement panel
- dedicated furniture catalog screen added

### 6. Floor plan calibration and annotation foundation
Implemented:
- floor plan version calibration support
- floor plan annotation support
- click-to-two-point calibration canvas in plan review
- human-assisted room/module/reference annotation flow
- reference image library panel per room/version

### 7. Walkthrough camera point generator
Implemented:
- walkthrough camera records in mock store
- generate camera points per room from scene geometry
- route and UI display in render studio
- this forms the basis of fixed-point room walkthroughs

### 8. Elevation generation quality pass
Implemented:
- drawing quality pass endpoint
- frontend drawing quality display for floor plan/elevation/room linkage checks
- note about internal/external wall generation requirements

## Remaining future upgrades
- exact estimate engine linkage to configurator deltas
- richer BOM line-item preview
- actual render learning model and preference memory weighting
- real WebGL live editing beyond preview mode
- wall-by-wall visual diff annotations with dimension labels
