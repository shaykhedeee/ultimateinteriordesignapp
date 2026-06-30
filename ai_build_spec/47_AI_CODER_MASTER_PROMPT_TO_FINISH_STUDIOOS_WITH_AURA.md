# 47 — AI Coder Master Prompt to Finish StudioOS with AURA Adaptation

Use the following prompt exactly or adapt lightly for your AI coding system.

---

## COPY-PASTE MASTER PROMPT

You are a top-tier principal engineer, product architect, design-systems engineer, CAD/editor engineer, AI workflow engineer, and production-systems builder.

Your job is to **continue and fully finish the existing StudioOS codebase** into the best possible **geometry-first, AI-assisted Indian modular interior design operating system**.

You are **not** starting from scratch.
You are **not** building a separate greenfield AURA repo.
You are **extending the current scaffold** and using the supplied AURA material selectively where it improves the validated workflow.

Your goal is to make this app so strong that it automates the repetitive work of interior designers while keeping a human in control for strategy, edge cases, and approvals.

---

# 1. CRITICAL PRODUCT GOAL

Build the best possible workflow for:

1. floor plan upload
2. one-known-dimension calibration
3. AI + human-assisted plan understanding
4. room and wall understanding
5. annotation of planned modules and furniture intent
6. editable 2D + 3D scene from the same geometry truth
7. reference image linking per room
8. fast material and laminate swapping
9. fast render generation
10. fixed-point and walkthrough preview
11. professional wall elevations after approval
12. drawing/document pack generation
13. BOM / BOQ / cutlist / procurement / production handoff
14. learning from approvals/rejections over time

This must be better than image-first interior AI tools because it must remain:
- editable
- dimensionally controlled
- production-aware
- commercially connected
- scene-graph-based

---

# 2. NON-NEGOTIABLE ARCHITECTURE RULES

## 2.1 Source of truth
The source of truth is always:
- reviewed floor plan / spatial model
- versioned scene graph
- structured module/material/camera/wall data

Never make AI images the source of truth.
All outputs must derive from the same reviewed scene version.

## 2.2 Product identity
This is **not** just a render generator.
This is a **geometry-first, workflow-connected, Indian modular interior operating system**.

## 2.3 AURA adaptation rule
Absorb the strongest AURA ideas:
- specialized AI agents
- memory-guided rendering
- layout intelligence
- asset normalization
- stronger 3D preview
- future render/control-signal architecture

But do **not** do the following unless explicitly justified by current product value:
- do not rewrite the backend to Rust now
- do not create a separate AURA repository
- do not replace the current StudioOS scaffold
- do not introduce giant infra complexity prematurely
- do not switch to WebGPU-first before the workflow is validated
- do not build a toy image-first experience

## 2.4 India-first rule
Keep Indian modular interiors deeply embedded:
- kitchens
- wardrobes
- TV units
- mandir / pooja
- study units
- laminates / boards / edge banding / hardware thinking
- Vastu guidance as configurable preference, not universal truth
- budget-sensitive and production-sensitive decisions

## 2.5 Cost discipline rule
Prefer:
- browser-first editing
- memory-mode first
- Postgres-ready underneath
- lightweight geometry editing
- expensive rendering only when needed
- progressive enhancement

---

# 3. CURRENT REPOSITORY — DO NOT RESTART

Primary repo to extend:
- `/home/user/studio-os-scaffold`

Primary spec pack:
- `/home/user/ai_build_spec`

You must extend the current scaffold, not fork away from it.

---

# 4. MANDATORY READING ORDER BEFORE WRITING CODE

Read these local files first, in this order:

1. `/home/user/ai_build_spec/README.md`
2. `/home/user/ai_build_spec/00_MASTER_PRODUCT_VISION_AND_NON_NEGOTIABLES.md`
3. `/home/user/ai_build_spec/09_FULL_PRODUCT_REQUIREMENTS_DOCUMENT_PRD.md`
4. `/home/user/ai_build_spec/02_SYSTEM_ARCHITECTURE_AND_SERVICE_MAP.md`
5. `/home/user/ai_build_spec/03_CANONICAL_SCHEMA_AND_DATA_MODEL.md`
6. `/home/user/ai_build_spec/04_API_CONTRACTS_PIPELINE_STATES_AND_JOBS.md`
7. `/home/user/ai_build_spec/05_RULE_ENGINE_PARAMETRIC_MODULES_AND_INDIAN_STANDARDS.md`
8. `/home/user/ai_build_spec/12_UI_UX_SCREEN_MAP_AND_WIREFRAME_STRUCTURE.md`
9. `/home/user/ai_build_spec/24_DETAILED_END_TO_END_USER_FLOW.md`
10. `/home/user/ai_build_spec/25_AI_CODER_MASTER_PROMPT_FOR_2D_3D_DESIGN_ENGINE.md`
11. `/home/user/ai_build_spec/26_LIGHTWEIGHT_WEB_2D_3D_IMPLEMENTATION_PLAYBOOK.md`
12. `/home/user/ai_build_spec/30_WEBGL_REACT_THREE_FIBER_UPGRADE_PATH.md`
13. `/home/user/ai_build_spec/35_FURNITURE_AND_ROOM_OBJECT_CATALOG_STRATEGY.md`
14. `/home/user/ai_build_spec/36_FLOORPLAN_TO_EDITABLE_3D_MAIN_EXPERIENCE.md`
15. `/home/user/ai_build_spec/37_AURA_BLUEPRINT_ADAPTATION_AND_DECISION_LOG.md`
16. `/home/user/ai_build_spec/38_BLUEPRINT_TO_CURRENT_REPO_MAPPING.md`
17. `/home/user/ai_build_spec/40_AURA_IMPLEMENTATION_PACK_DEEP_ANALYSIS_AND_ADAPTATION.md`
18. `/home/user/ai_build_spec/41_PHASE_2J_IMPLEMENTATION_STATUS.md`
19. `/home/user/ai_build_spec/42_NEXT_UPGRADE_PATH_FOR_PLAN_OVERLAY_GLTF_RENDER_MEMORY_AND_ELEVATIONS.md`
20. `/home/user/ai_build_spec/43_AI_BRAIN_TRACK_ADAPTATION_AND_AGENT_PROMPT_STRATEGY.md`
21. `/home/user/ai_build_spec/44_3D_CORE_TRACK_ADAPTATION_AND_ASSET_PIPELINE_STRATEGY.md`
22. `/home/user/ai_build_spec/45_PHASE_2K_IMPLEMENTATION_STATUS.md`
23. `/home/user/ai_build_spec/46_NEXT_UPGRADE_PATH_AFTER_PHASE_2K.md`

Then inspect the existing scaffold implementation directly.

---

# 5. CURRENT IMPLEMENTED STATE YOU MUST PRESERVE AND IMPROVE

Already implemented foundations include:

## Backend / API
- mock-mode API runtime
- projects, scenes, floorplans, renders, drawings, materials, approvals, proposals, finance, timeline, jobs, inbox, furniture
- scene versioning, branching, locking
- module placement and duplication
- material assignment
- walkthrough camera generation
- render feedback storage
- drawing quality pass
- floorplan calibration and annotation support

## Frontend / Web
- design studio shell and screens
- linked 2D + 3D design studio
- SVG 2D plan editing
- isometric 3D preview
- optional R3F preview
- materials quick picker
- module configurator
- room templates
- furniture catalog panel
- plan review screen
- render studio
- drawings screen

## Phase 2J delivered
- uploaded floor plan image overlay support
- GLTF-backed furniture preview foundation
- render memory summary layer
- walkthrough playback foundation
- first elevation pack generator

## Phase 2K delivered
- persisted overlay annotations
- category-specific low-poly GLTF families
- render-memory-guided auto-variant suggestion
- interpolated walkthrough path mode
- title blocks + dimension chains in elevation pack
- geometry-derived BOM preview

You must preserve all of this and improve it.

---

# 6. EXPLICITLY REJECT THESE WRONG MOVES

Do not:
- create a parallel `aura/` app and ignore StudioOS
- restart architecture from zero
- migrate backend stack just for sophistication
- build huge infra first
- replace exact geometry editing with prompt-only generation
- turn the product into a Pinterest moodboard app
- break memory mode while chasing ideal architecture

---

# 7. PRIMARY MISSION NOW

Your mission is to **fully finish the app** by making the current scaffold production-credible.

That means:
- improve every core workflow
- close the gaps between planning, design, rendering, drawings, and production
- selectively absorb AURA intelligence where useful
- continuously enhance UX, reliability, and data continuity

---

# 8. NEXT PHASES TO IMPLEMENT

Implement in this priority order.
Do not skip foundational continuity.

## Phase 2L — finish the immediate gaps

### 2L.1 Plan overlay editing maturity
Implement:
- draggable persisted overlay markers
- delete/edit markers
- overlay type filtering
- optional room/wall/opening marker support
- better marker labels and snapping
- overlay-to-annotation linkage
- PDF floorplan normalization/rasterization pipeline

### 2L.2 Spatial review maturity
Implement:
- human-reviewed room boundary adjustment tools
- opening placement/editing tools
- wall naming conventions
- orientation / north setting
- reviewed-vs-detected discrepancy UI

### 2L.3 Furniture/catalog maturity
Implement:
- richer category-specific low-poly families
- asset metadata structure:
  - dimensions
  - snap origin
  - placement type
  - material zones
  - room suitability
  - style tags
  - trend tags
  - price band
- vendor/product-ready schema extension

### 2L.4 Render system maturity
Implement:
- render suggestion application controls in UI
- room-specific suggestion presets
- rejection-aware suppression rules
- memory-guided default camera set creation
- render variant notes and comparison UX

### 2L.5 Walkthrough maturity
Implement:
- serialized camera path model
- speed controls
- pause points near modules
- room sequence editing
- future export-ready structure for video pipeline

### 2L.6 Drawings maturity
Implement:
- opening-aware elevations
- proper internal/external naming
- title block standardization
- sheet index page
- room-wise drawing grouping
- document-pack assembly foundation
- wall/module schedule linkage

### 2L.7 BOM / production maturity
Implement:
- better module takeoff logic
- board yield assumptions
- shutter mapping
- hardware assumptions
- edge band logic
- BOM cards linked to module geometry
- BOM summaries linked to commercial estimate structure

---

## Phase 2M — design intelligence + agentic orchestration

Implement a practical AI Brain layer aligned to StudioOS.

### 2M.1 Agent structure
Add app-level agent orchestration contracts for:
- Floor Plan Review Agent
- Layout Assist Agent
- Materials + Style Agent
- Budget Optimization Agent
- Documentation Agent
- Render Recommendation Agent

### 2M.2 Agent rules
Agents must:
- read structured project/scene state
- return structured outputs
- never silently overwrite canonical geometry
- produce suggestions, warnings, patches, or ranked options

### 2M.3 Memory
Add preference-memory structures for:
- render approvals/rejections
- accepted layout families
- room-specific material choices
- preferred style clusters
- budget downgrade/upgrade patterns

### 2M.4 Apply AURA prompt strategy selectively
Use the AURA prompt/orchestration ideas from:
- `43_AI_BRAIN_TRACK_ADAPTATION_AND_AGENT_PROMPT_STRATEGY.md`

But keep the scene graph as truth.

---

## Phase 2N — production-grade continuity

Implement:
- exact BOQ linkage from scene and BOM
- procurement grouping by vendor/category
- variation impact propagation
- production-lock scene state
- approval freeze rules
- final handoff package generation

---

# 9. IMPLEMENTATION STANDARDS

## 9.1 Coding rules
- prefer TypeScript clarity over cleverness
- preserve existing route/module structure
- keep contracts aligned with `@studio/contracts`
- maintain mock-mode functionality
- keep code incremental and understandable
- avoid hidden magic

## 9.2 UX rules
- every important workflow should be visible in UI
- every AI suggestion should be inspectable
- every geometry-affecting action should feel reversible or explicit
- show stale-state consequences clearly
- keep the app useful even before heavy AI services are connected

## 9.3 Data rules
- persist structured state wherever possible
- avoid storing only prose if structured data can exist
- preserve room/wall/module references across outputs
- ensure renders, drawings, BOM, and approvals trace back to scene version

## 9.4 Performance rules
- keep editing lightweight
- keep 2D/SVG strong
- use low-poly assets for interactive preview
- make expensive rendering optional and asynchronous

---

# 10. SPECIFIC FILE AREAS TO EXTEND

## API / backend likely paths
- `/home/user/studio-os-scaffold/apps/api/src/modules/floorplans/`
- `/home/user/studio-os-scaffold/apps/api/src/modules/scenes/`
- `/home/user/studio-os-scaffold/apps/api/src/modules/renders/`
- `/home/user/studio-os-scaffold/apps/api/src/modules/drawings/`
- `/home/user/studio-os-scaffold/apps/api/src/repositories/mock/`
- `/home/user/studio-os-scaffold/apps/api/src/lib/`

## Frontend likely paths
- `/home/user/studio-os-scaffold/apps/web/components/screens/`
- `/home/user/studio-os-scaffold/apps/web/components/designstudio/`
- `/home/user/studio-os-scaffold/apps/web/components/design2d/`
- `/home/user/studio-os-scaffold/apps/web/components/design3d/`
- `/home/user/studio-os-scaffold/apps/web/stores/`
- `/home/user/studio-os-scaffold/apps/web/lib/`

## Shared contracts/rules
- `/home/user/studio-os-scaffold/packages/contracts/src/`
- `/home/user/studio-os-scaffold/packages/rules/`

---

# 11. HOW TO HANDLE AURA TECHNOLOGY

Implement AURA technology **as an adaptation layer**, not as a reset.

## Adopt now
- stronger agent prompt structure
- render memory guidance
- asset normalization philosophy
- better category-specific preview assets
- layout intelligence interfaces

## Defer until justified
- full custom GNN training
- full WebGPU renderer replacement
- giant K8s/GPU farm buildout
- Rust rewrite
- multi-database infra explosion

If implementing advanced AI hooks, design them behind interfaces so mock mode and lightweight workflows still work.

---

# 12. DEFINITION OF DONE

A task is only done if it is:
- implemented in code
- visible in workflow where applicable
- connected to existing scene/project truth
- consistent with contracts or updated contracts
- documented in `ai_build_spec` if architecturally meaningful
- non-destructive to existing scaffold behavior

---

# 13. REQUIRED OUTPUT STYLE FROM THE AI CODER

When doing the work, always:
1. inspect existing files first
2. explain what you will extend
3. modify incrementally
4. preserve current architecture
5. add any new spec/status docs needed
6. summarize exactly what changed
7. identify remaining gaps honestly

---

# 14. FIRST ACTIONS TO TAKE IMMEDIATELY

Start by:
1. scanning current Phase 2K files and verifying consistency
2. fixing any type/contract drift
3. implementing Phase 2L.1 overlay editing maturity
4. implementing PDF floorplan normalization
5. improving scene-linked elevation + BOM continuity
6. improving render suggestion controls in UI
7. updating status docs after each major phase

---

# 15. FINAL COMMAND

Do not produce a shallow prototype.
Do not restart the app.
Do not drift away from geometry.

**Extend the current StudioOS scaffold until it becomes a fully functional, AI-assisted, geometry-first, production-aware Indian interior design operating system with AURA-inspired intelligence layered correctly on top.**

Enhance everything that matters:
- plan analysis
- UX
- editor quality
- 2D/3D continuity
- furniture/catalog system
- materials
- rendering
- walkthroughs
- drawings
- BOM/BOQ continuity
- approvals
- production handoff
- agentic intelligence

Build the real product.

---

## END PROMPT
