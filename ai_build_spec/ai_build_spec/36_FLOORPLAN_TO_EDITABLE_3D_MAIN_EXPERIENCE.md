# 36 — Floor Plan to Editable 3D Main Experience

## Purpose

This document captures the **main core experience** the app must deliver.

This is the primary design loop:
1. upload floor plan
2. calibrate scale with one known measurement
3. use AI + human review to identify rooms, walls, openings
4. use human-assisted annotation to mark planned modules (TV unit, wardrobes, etc.)
5. attach room-specific reference images
6. materialize an editable 2D + 3D scene
7. design each room with templates, configurators, materials, and furniture catalog
8. generate quick renders and walkthroughs
9. after approval, generate elevations and functional drawing pack
10. hand off to BOQ / cutlist / production

---

## Required Core Flow

### Step 1 — Floor Plan Upload
Support:
- image
- PDF
- later scan/LiDAR

### Step 2 — One-Known-Dimension Calibration
The app must immediately help the user define one known dimension so scale can be estimated.

### Step 3 — Human + AI Spatial Review
The app should:
- detect rooms
- detect walls
- detect openings
- suggest room types
- require user corrections where confidence is low

### Step 4 — Human-Annotated Intent Layer
The user should be able to mark where intended design modules go:
- TV unit
- wardrobe
- mandir
- kitchen run
- dresser
- sofa zone
- bed zone

This intent layer is essential for improving room-aware design generation.

### Step 5 — Reference Images by Space
Each room should allow attached reference images, style notes, and design direction.

### Step 6 — Materialized Editable Scene
The system should convert the reviewed plan and intent marks into:
- structured spatial model
- editable scene graph
- linked 2D/3D design environment

### Step 7 — Room Design and Editing
Each room should then be editable through:
- furniture/modules
- material changes
- module configurators
- room templates
- budget-aware recommendations

### Step 8 — Quick AI Renders + Walkthrough
The app should support:
- quick preview renders
- room-specific fixed camera views
- walkthrough generation
- iterative learning from user preference and approvals

### Step 9 — Approved Design → Professional Drawings
After approval, the system should generate:
- wall elevations
- internal/external wall drawing views where relevant
- functional drawing package
- room/module schedules

### Step 10 — Production Handoff
Approved geometry and drawings should feed:
- BOQ
- BOM
- cutlist
- procurement
- workshop outputs

---

## Final Rule

> The app’s primary magic is not just render generation. The magic is turning a static floor plan into a calibrated, human-assisted, AI-understood, editable 2D/3D design model that flows cleanly into renders, drawings, and production outputs.
