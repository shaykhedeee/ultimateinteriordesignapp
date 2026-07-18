# 25 — AI Coder Master Prompt for 2D + 3D Design Engine

Copy-paste the prompt below into an AI coding system when asking it to build the 2D/3D core.

---

## MASTER PROMPT

You are building the **2D and 3D design engine** for a geometry-first Indian interior design operating system.

### Product context
This is **not** an image-generation toy.
This is **not** a moodboard app.
This is **not** a generic CRM.

This is a professional interior design OS where:
- floor plans become structured spatial models
- spatial models become versioned scene graphs
- scene graphs power 2D design, 3D design, render generation, drawings, BOQs, billing, approvals, and production outputs

### Your mission
Implement the **full web-based 2D + 3D editable design core** with best practices for:
- correctness
- lightweight browser performance
- version safety
- extensibility
- production-ready architecture

### Non-negotiable rules
1. **Scene graph is the source of truth**
   - No visual-only state may exist separately from the canonical scene document.
   - 2D and 3D must read from the same scene.

2. **Every meaningful design change must create or map to a versionable patch**
   - No hidden mutation-only behavior.
   - Support immutable scene versioning.

3. **2D and 3D are linked views of the same room/project**
   - If the user changes module size in inspector, both 2D and 3D reflect it.
   - If the user drags a module in 2D, 3D updates from the same scene state.

4. **The design engine must be lightweight for the web**
   - Favor simple primitives, good data structures, code splitting, and incremental rendering.
   - Avoid heavy always-on processing in the browser.

5. **Indian modular interior needs are first-class**
   - Support module placement for kitchen, wardrobe, TV unit, mandir, crockery, study, shoe rack, utility, false ceiling.

---

## Required architecture

### Frontend stack
Use:
- Next.js App Router
- React
- TypeScript strict mode
- Zustand for editor interaction state
- shared contracts from `@studio/contracts`
- Three.js or react-three-fiber for 3D rendering
- a 2D plan layer using SVG/canvas-based interaction

### Data architecture
Use this layered model:
- `SpatialModel` = interpreted/reviewed room/wall/opening structure
- `SceneDocument` = full editable scene graph
- `ScenePatchOperation` = immutable design change instructions
- `RuleEvaluationSummary` = validation output

### Required scene entities
- rooms
- walls
- openings
- modules
- materials
- lights
- cameras

### Required editors
#### 2D editor must support
- room shell display
- wall display
- opening display
- module footprints
- selection
- drag/move module footprints
- simple snapping
- dimension visibility

#### 3D editor must support
- room shell
- walls
- floor/ceiling planes
- parametric module blocks
- material application
- camera controls
- selection/highlight

---

## Performance / lightweight web requirements

Implement these best practices:

1. **Do not load all heavy modules at app startup**
   - lazy-load design studio and 3D-only code
   - route-split heavy screens

2. **Use simple geometry for live editing**
   - during editing, represent modules with lightweight box geometry
   - avoid high-poly meshes in edit mode
   - only attach rich meshes/textures on demand if needed

3. **Minimize re-renders**
   - use selector-based Zustand reads
   - keep canvas/editor state isolated from app-level UI state

4. **Use memoized derived data**
   - wall segments
   - room polygons
   - module bounding boxes
   - selection overlays

5. **Offload heavy non-UI work** where possible
   - geometry calculations
   - thumbnails
   - export prep
   - heavy validation
   Use web workers or async background APIs where justified.

6. **Use progressive fidelity**
   - 2D/3D edit mode = lightweight
   - review/final render mode = server/offline/on-demand

7. **Do not do full photoreal rendering in browser edit loop**
   - browser is for editing and preview
   - premium rendering happens in render pipeline later

8. **Prepare for mobile/tablet constraints**
   - touch-safe targets
   - compact controls
   - lower GPU assumptions

---

## Functional requirements

### Scene loading
- load a scene document from API
- normalize scene data for local editing
- render scene in both 2D and 3D

### Selection model
Support selecting:
- room
- wall
- module
- opening

### Module placement
Allow:
- placing module from template key
- assigning to room
- optional wall anchoring
- setting dimensions
- updating placement through patch operations

### Inspector editing
Support editing:
- module width/height/depth
- material slot assignments
- room metadata
- wall finish metadata

### Scene patch operations
Implement operations such as:
- place_module
- update_module_params
- remove_module
- assign_material
- update_room_metadata
- update_wall_geometry (if enabled)
- add_opening / update_opening (later-ready)

### Branching
Support scene branch creation and preserve current branch/version metadata.

### Validation hooks
Design engine must be able to request and display:
- room-level rule warnings
- module-level rule warnings
- Vastu advisories when enabled
- budget warnings when material/module changes affect cost assumptions

---

## UX requirements

### Design Studio layout
Use a 3-column layout:
- left: room/module/template navigator
- center: linked 2D/3D workspace
- right: inspector + rules + budget summary

### Required visible state
Always show:
- project code
- scene version
- branch name
- locked / editable status
- stale output warnings if relevant

### Required actions
- save version
- create branch
- validate scene
- open render studio
- open drawings studio

---

## Engineering requirements

### Code organization
Keep code modular:
- `components/layout`
- `components/screens`
- `components/design2d`
- `components/design3d`
- `stores/`
- `lib/scene/`
- `lib/patch/`
- `lib/selectors/`

### Contracts
- do not invent hidden types
- use `@studio/contracts`
- validate API payloads
- keep internal patch types explicit

### Quality bar
- TypeScript strict mode
- no `any` in core scene/editor logic
- no giant monolithic component
- no duplicated scene truth in separate 2D/3D states

---

## Definition of done
The 2D/3D engine is only done when:
1. a scene loads from API
2. 2D and 3D both render from the same data
3. a module can be placed, selected, edited, and displayed in both views
4. a scene patch operation is created for user edits
5. a new scene version can be requested after patch
6. layout remains lightweight and responsive in browser
7. structure is clean enough to extend into materials, drawings, and render workflows

---

## Build output required
Produce:
- the editor store
- 2D editor components
- 3D editor components
- shared selection model
- inspector panel
- patch creation utilities
- scene adapters/selectors
- integration into the design studio route

Do not return a toy demo.
Return a professional, extensible web design engine scaffold aligned to the architecture above.

---

## END OF MASTER PROMPT
