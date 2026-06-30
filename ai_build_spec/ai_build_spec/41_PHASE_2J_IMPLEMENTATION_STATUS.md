# 41 — Phase 2J Implementation Status

## Phase goal

Phase 2J focused on the next missing design-core upgrades that directly improve the main workflow:
- uploaded floor plan overlay editor
- GLTF-backed furniture previews
- render memory summary layer
- walkthrough playback foundation
- elevation pack generator

This phase continues the rule that the app is a **scene-graph-first interior operating system**, not an AI image toy.

---

## 1. Uploaded floor plan overlay editor

### Implemented
- plan review now supports uploading a real floor plan image
- uploaded plan source is attached to the floor plan version record in mock mode
- calibration canvas now renders the uploaded plan as the annotation/calibration background
- measure / room / module / reference overlay marking now happens over the real uploaded plan image
- uploaded source metadata persists in the floor plan version record during runtime

### Why this matters
This closes one of the biggest product realism gaps.
The user can now:
1. create a plan interpretation version
2. upload the actual floor plan image
3. define one known measurement
4. annotate directly on top of the actual drawing

### Current limitation
- image overlays are supported now
- PDF rasterization/normalization is still a next step
- annotation persistence is still lightweight and should later become per-marker persisted geometry

---

## 2. GLTF-backed furniture preview foundation

### Implemented
- catalog items now include GLTF preview metadata
- a generic cuboid GLTF asset has been added to the web app public assets
- furniture catalog panel now includes a live 3D preview card
- preview reads item width / height / depth and scales the GLTF asset accordingly
- preview provides fast massing confidence before the user places the object/module

### Why this matters
This is not the final furniture system, but it is an important step from:
- metadata-only catalog

to:
- geometry-backed previewable catalog

### Current limitation
- current GLTF is a generic massing proxy, not category-perfect furniture geometry
- next phase should introduce category-specific low-poly GLTF families and then richer vendor-specific assets

---

## 3. Render memory summary layer

### Implemented
- render feedback already existed; phase 2J converts that into a memory summary API
- backend now summarizes:
  - total signals
  - approved / shortlisted / rejected counts
  - top preferred cameras
  - top preferred lighting presets
  - room-level preference summaries
  - recent feedback events
- render studio now displays this memory layer

### Why this matters
This is the first operational version of the “learn from approvals/rejections” requirement.
It is not a full ML ranking model yet, but it creates:
- usable memory features
- explainable preference signals
- a future training/heuristic layer

### Current limitation
- no automatic re-ranking yet
- no personalized prompt/camera policy generation yet
- no long-horizon style-cluster memory yet

---

## 4. Walkthrough playback foundation

### Implemented
- render studio now includes a playback panel for generated walkthrough camera points
- fixed point camera sequence can be played, paused, stepped, and reviewed
- playback is visualized over the room plan footprint
- current camera position and target are displayed in the UI

### Why this matters
This makes the walkthrough system visible and testable even before full interpolated 3D video export.
It satisfies the near-term requirement that users should be able to review rooms from fixed camera positions.

### Current limitation
- current playback is point-sequenced, not yet fully interpolated cinematic movement
- no AI-enhanced walkthrough video export yet
- no frame-by-frame render generation yet

---

## 5. Elevation pack generator

### Implemented
- backend utility now derives wall elevation sheets from scene geometry
- only walls with modules/design relevance are included
- internal and external elevation variants are generated for each relevant wall
- elevation output includes:
  - wall size
  - room linkage
  - module count
  - SVG sheet preview
- drawings screen now fetches and previews the generated elevation pack

### Why this matters
This is the first real bridge from editable design scene to professional drawing output.
It aligns directly with the required workflow:
- approved design
- wall-by-wall elevation generation
- drawing document pack foundation
- production continuity

### Current limitation
- SVG elevations are still a professional foundation, not final CAD-grade drawings
- opening handling, section markers, title blocks, dimension chains, and sheet layouts need the next upgrade pass
- output is geometry-derived but not yet integrated with exact BOM/cutlist rules

---

## 6. Additional realism upgrades bundled into this phase

### Seed data improvements
- mock scene now includes a living room TV feature module by default
- seed render feedback exists so render memory is not empty on first boot

### Result
The scaffold is more demonstrable and the drawing/render screens now show a much more believable connected workflow.

---

## 7. Net product impact

Phase 2J materially improves the central promise of the product:

1. upload a real plan
2. calibrate from one dimension
3. annotate modules and references
4. preview real furniture massing in 3D
5. generate render variants and store preference memory
6. review room walkthrough viewpoints
7. generate wall elevation pack from the same scene

This is much closer to the real operating loop the user asked for.

---

## 8. Best next steps after Phase 2J

### Next highest-value upgrades
1. PDF-to-image normalization for plan overlays
2. persisted overlay annotations as editable entities
3. category-specific GLTF asset families
4. camera interpolation and video export
5. elevation title blocks, dimension chains, and sheet composition
6. BOQ/BOM linkage from elevation/module geometry
7. room-specific reference board + material moodboard memory

### Strong recommendation
Keep the next phases tightly connected to the same source-of-truth scene model.
Do not let rendering or AI generation drift away from the editable geometry backbone.
