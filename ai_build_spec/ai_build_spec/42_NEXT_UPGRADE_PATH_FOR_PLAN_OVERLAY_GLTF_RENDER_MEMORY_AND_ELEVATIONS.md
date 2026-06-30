# 42 — Next Upgrade Path for Plan Overlay, GLTF Preview, Render Memory, and Elevations

## Purpose

This document defines the most practical next upgrades after Phase 2J so the system moves from strong scaffold to strong production candidate.

---

## 1. Floor Plan Overlay: Next Upgrade

### Current state
- uploaded image overlay works
- one-dimension calibration works
- human marker overlay works

### Next step
Persist overlay entities as structured editable data:
- calibration line
- room markers
- module intent markers
- reference markers
- optional opening markers

### Why
This allows:
- re-opening the same plan without losing overlay intent
- feeding reviewed annotations into spatial model finalization
- comparing AI-detected vs human-confirmed geometry

---

## 2. GLTF Preview: Next Upgrade

### Current state
- generic GLTF massing preview exists

### Next step
Introduce category-specific preview asset families:
- bed_lowpoly_v1
- sofa_linear_v1
- sofa_lshape_v1
- wardrobe_tall_v1
- tv_unit_feature_v1
- mandir_compact_v1

### Why
This will make previews much more trustworthy without needing photoreal vendor assets immediately.

---

## 3. Render Memory: Next Upgrade

### Current state
- preference signals are summarized

### Next step
Use those signals actively during render generation:
- boost preferred camera families per room type
- boost preferred lighting presets per client/style cluster
- reduce repeated rejected compositions
- create default “memory-biased” render suggestions

### Why
This creates visible product intelligence before any expensive custom ML training.

---

## 4. Walkthrough: Next Upgrade

### Current state
- fixed point playback exists

### Next step
Add interpolated path mode:
- spline path between room viewpoints
- speed profile
- pause points near feature modules
- optional narration / callout overlays later

### Why
This is the shortest path from previewable design to client-facing walkthrough output.

---

## 5. Elevation Pack: Next Upgrade

### Current state
- relevant walls produce SVG elevation sheets

### Next step
Add sheet professionalism layer:
- title block
- scale note
- dimension chains
- opening references
- material tags
- internal/external wall naming standard
- drawing numbering convention
- printable document pack assembly

### Why
This is the difference between “good prototype” and “usable professional drawing package”.

---

## 6. Combined Product Rule

These upgrades should remain linked end-to-end:
- reviewed overlay intent
- placed modules
- selected materials
- preferred cameras
- approved elevation pack
- BOM / BOQ / cutlist handoff

If any of these become disconnected, the product loses its main strategic advantage.

---

## 7. Final Priority Order

1. persist overlay entities
2. better category-specific GLTF previews
3. render-memory-guided generation
4. interpolated walkthrough output
5. professional sheeting for elevation packs
6. BOM linkage from approved elevations
