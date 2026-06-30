# 49 — Agent B to StudioOS Superset Implementation PRD

## Purpose

This document defines how StudioOS should implement and surpass the capability classes visible in Agent B’s public surface.

This is the implementation PRD for **Agent-B-parity-plus** inside StudioOS.

---

## 1. Product Objective

StudioOS should provide a unified system for:
- spaces
- products/modules
- materials
- renders
- drawings
- BOM / BOQ / quotations
- presentations
- approvals
- production continuity

The public target is to match and surpass workflow families such as:
- Quick Generate
- Smart Project
- Photo Edit
- Design Product
- Quick Layout
- AI Studio specialized tools

---

## 2. StudioOS Superset Positioning

### Agent B public promise
A unified environment for elite designers and global brands.

### StudioOS target promise
A geometry-first, AI-assisted, production-aware interior operating system for Indian modular interiors and adjacent design/manufacturing workflows.

### Superset difference
StudioOS must be stronger in:
- plan calibration and review
- editable scene truth
- module configurators
- internal/external wall elevation generation
- BOM / BOQ / production continuity
- Indian modular execution logic

---

## 3. Workflow Parity Map

## 3.1 Smart Project

### Public parity requirement
Users must be able to:
- upload layout
- enhance / interpret it
- calibrate scale
- zone rooms
- generate renders zone by zone
- generate camera angles
- export presentation

### StudioOS implementation requirement
This must be implemented as:
1. project creation
2. floor plan interpretation version
3. uploaded source overlay
4. one-dimension calibration
5. persisted overlay review
6. reviewed room/wall/opening extraction
7. scene initialization from reviewed plan
8. room-specific templates / references / styling
9. render sets + camera generation
10. presentation package assembly

### Superset requirement
Unlike a render-first tool, StudioOS Smart Project must also support:
- wall/module linkage
- material assignments
- downstream drawing pack generation
- BOM continuity

---

## 3.2 Quick Generate

### Public parity requirement
Users must be able to:
- combine moodboard + layout + style
- get quick render concepts
- edit/refine them
- get product suggestions

### StudioOS implementation requirement
StudioOS should implement this as a **Concept Mode** that still respects geometry:
- input references / moodboard
- choose room / layout / style prompt
- generate quick render variants from scene or room geometry
- allow material and camera swapping
- show matched modules/products/materials

### Superset requirement
Quick Generate in StudioOS should never become detached from geometry.
It must either:
- derive from an existing room/scene
or
- create a temporary structured concept scene that can be promoted into the main project

---

## 3.3 Photo Edit

### Public parity requirement
Users must be able to:
- upload room photo / render
- target and modify elements
- change materials / color / lighting
- day/night transformation
- generate alternative viewpoints

### StudioOS implementation requirement
Implement Photo Edit as:
- reference/photo edit workspace
- target region selection or prompt-specified element changes
- lighting/time-of-day transformations
- material replacement previews
- optional conversion into product/style suggestions for the project

### Superset requirement
StudioOS should connect photo edit outputs back into:
- material choices
- moodboard/reference library
- room-specific style memory

---

## 3.4 Design Product

### Public parity requirement
Users must be able to:
- generate/refine product concepts
- analyze dimensions
- generate production drawings
- generate BOM

### StudioOS implementation requirement
This should map to:
- module/product configurator workspace
- parametric product families
- dimension rules
- internal production mapping
- drawing sheet generation
- BOM generation

### Superset requirement
StudioOS should go further by supporting:
- wall-linked module context
- room-specific product placement
- quote continuity from product to room to project

---

## 3.5 Quick Layout

### Public parity requirement
Users must be able to:
- start fresh layout canvas
- draw walls/doors/windows
- place furniture blocks
- lock and generate top view
- export image

### StudioOS implementation requirement
This should become:
- lightweight fast 2D sketch mode
- draw room/wall/opening geometry
- place low-detail furniture blocks
- convert sketch into reviewed scene starter
- export clean top view

### Superset requirement
The quick layout must be promotable into:
- editable scene version
- render flow
- drawing flow
- BOM flow

---

## 4. AI Studio Tool System Requirement

StudioOS should build a reusable tool system rather than a random gallery of gimmicks.

## Tool groups to implement

### A. Visualization tools
- quick room concept render
- facade/exterior concept render
- under-construction to finished visualization
- restoration visualization
- mixed-use / masterplan visualization
- landscape visualization
- exploded diagram / system diagram generation

### B. Conversion tools
- sketch to 3D concept
- photo to stylized model
- 2D layout to editable 3D scene
- exterior to CAD-like elevation/linework
- conceptual section to streetscape / scene

### C. Stylistic tools
- material change
- mood and atmosphere / time of day
- camera angle adjustment
- style transfer with geometry preservation

### D. Product/documentation tools
- product builder
- product customization
- product drawings
- product BOM calculator

### E. Layout tools
- new quick layout
- edit existing layout
- detect elements zone-wise
- erase/add furniture blocks
- generate clean top view

---

## 5. Industry-Specific Modes Requirement

## 5.1 Designer mode
Must prioritize:
- floorplan → editable design → render → drawing → quote

## 5.2 Brand mode
Must prioritize:
- digital product library
- product customization
- manufacturer materials
- catalog panels
- quotations / PI-like exports

## 5.3 Real estate mode
Must prioritize:
- unit-level layout upload
- finish package swapping
- buyer-facing presentation mode
- project/unit dashboards

## 5.4 Catalog mode
Must prioritize:
- searchable materials and products
- placement-ready metadata
- designer-facing discovery

---

## 6. Presentation and Client Delivery Requirement

StudioOS must include client-facing packaging:
- render boards
- camera angle sets
- moodboard/reference boards
- room-by-room concept summary
- elevation preview sheets
- material schedules
- quote summaries
- approval packages

This is important because competitors publicly market polished presentations, not just generation.

---

## 7. Minimum Superset Feature Set StudioOS Must Reach

To claim “better than Agent B on what matters,” StudioOS must reach this minimum combined state:

1. uploaded floor plan overlay review
2. one-measurement calibration
3. editable layout + scene continuity
4. category-specific furniture preview assets
5. room templates and module configurators
6. fast render set creation with memory-guided suggestions
7. fixed and interpolated walkthrough preview
8. professional wall elevation pack generation
9. BOM preview from the same scene
10. commercial continuity toward quote / procurement / production
11. workflow-specific entry points in UI
12. role-specific modes for designer / brand / real-estate

---

## 8. Final Product Requirement

StudioOS must not just imitate Agent B’s menu surface.
It must turn those visible workflow expectations into a deeper connected system whose outputs are:
- more editable
- more accurate
- more connected
- more production-ready
- more commercially usable
