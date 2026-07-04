# 45 — Phase 2K Implementation Status

## Phase goal

Phase 2K focused on the next design-production continuity upgrades:
- persisted overlay annotations
- category-specific low-poly GLTF furniture families
- render-memory-guided auto-variant suggestion
- interpolated walkthrough path mode
- professional elevation title blocks + dimension chains
- BOM preview from approved wall/module geometry

---

## 1. Persisted overlay annotations

### Implemented
- floor plan versions now store overlay state
- persisted overlay includes:
  - calibration points
  - room/module/reference markers
  - update timestamp
- new overlay save route added in mock API
- plan review overlay editor now saves back into the floor plan version
- reopening the version restores the overlay state

### Why it matters
This closes the gap between one-time annotation and a truly resumable reviewed plan workflow.

---

## 2. Category-specific low-poly GLTF furniture families

### Implemented
Added category-specific low-poly preview GLTF files for:
- bed
- linear sofa
- L-shape sofa
- wardrobe
- TV feature unit
- mandir
- study desk
- dresser

### Catalog upgrade
Furniture catalog entries now point to category-appropriate preview assets instead of a single generic cuboid proxy.

### Why it matters
This makes the 3D preview more believable without needing full vendor-grade assets yet.

---

## 3. Render-memory-guided auto-variant suggestion

### Implemented
- backend now produces suggestion stacks based on prior render feedback
- suggestions combine:
  - preferred cameras
  - preferred lighting presets
  - room fallback logic
  - simple scoring
- render set creation now uses those suggestions automatically in mock mode
- render studio shows the suggestion stack to the user

### Why it matters
This is the first visible move from passive feedback storage to active generation guidance.

---

## 4. Interpolated walkthrough path mode

### Implemented
- walkthrough player now supports:
  - fixed-point mode
  - interpolated path mode
- interpolated mode creates in-between frames between room viewpoints
- playback speed changes according to mode
- path is visualized on top of the plan footprint

### Why it matters
This is much closer to a real walkthrough experience than only stepping between static room points.

---

## 5. Professional elevation title blocks + dimension chains

### Implemented
Elevation pack generator now includes:
- outer drawing border
- title block
- project + drawing labels
- sheet numbering
- scene version reference
- overall wall dimensions
- per-module dimension chains
- numbered module callouts

### Why it matters
This meaningfully improves the transition from prototype-looking wall diagrams to real drawing-document behavior.

---

## 6. BOM preview from approved wall/module geometry

### Implemented
- new BOM preview utility derives module-level quantity estimates from scene geometry
- BOM preview returns:
  - module cards
  - board spec
  - edge spec
  - carcass board area
  - shutter area
  - edge band estimate
  - hardware estimate
  - estimated panel count
- drawings screen now displays BOM preview alongside elevation pack output

### Why it matters
This is the next critical bridge from design to production handoff.

---

## 7. Current limitations still remaining

### Overlay
- markers are persisted, but not yet deeply tied to reviewed room/opening entities
- no drag-edit of saved overlay markers yet

### GLTF assets
- category-specific, but still low-poly proxy families rather than real product-grade assets

### Render memory
- heuristic ranking only
- no learned client-style cluster model yet

### Walkthrough
- interpolation is lightweight UI playback, not full rendered video export

### Elevations
- not yet CAD-grade output
- openings, detailed notation, and printable sheet assembly still need deeper treatment

### BOM preview
- heuristic takeoff only
- not yet tied to exact commercial estimate lines or cutlist logic

---

## 8. Net result of Phase 2K

Phase 2K makes the product more operationally coherent across the full design pipeline:

1. upload real plan
2. calibrate and persist overlay intent
3. review and place modules with stronger category previews
4. generate memory-guided render options
5. play interpolated walkthrough path
6. produce better elevation sheets
7. inspect BOM preview from the same scene geometry

This is a significant improvement in the design-to-document-to-production continuity the product needs.
