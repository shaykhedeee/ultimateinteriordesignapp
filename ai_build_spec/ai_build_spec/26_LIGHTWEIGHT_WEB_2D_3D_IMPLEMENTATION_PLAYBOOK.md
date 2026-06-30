# 26 — Lightweight Web 2D/3D Implementation Playbook

## 1. Purpose

This playbook explains how to build the app’s 2D and 3D design engine correctly for the web.

The focus is:
- performance
- maintainability
- browser compatibility
- fast iteration
- low cost

---

## 2. Core Strategy

The browser editor should be:
- **fast for editing**
- **accurate enough for planning**
- **lightweight by default**
- **high fidelity only when necessary**

This means:
- lightweight 2D/3D in-browser
- heavy rendering and complex generation moved off the critical interaction path

---

## 3. Best Practices for 2D Design Engine

## 3.1 Prefer SVG or lightweight canvas for 2D plan interaction
Use 2D plan rendering for:
- walls
- openings
- room polygons
- module footprints
- dimensions
- selection overlays

### Why
- simpler interaction model
- easier snapping overlays
- easier annotations
- more controllable than forcing all logic through 3D

## 3.2 Normalize geometry early
Keep explicit structures for:
- walls
- corners
- rooms
- openings
- module footprints

Avoid storing only arbitrary points without semantic meaning.

## 3.3 Separate display state from scene truth
Keep:
- zoom/pan/view mode in UI state
- room/wall/module truth in scene document

---

## 4. Best Practices for 3D Design Engine

## 4.1 Use simple primitives in edit mode
For most modules, edit mode can use:
- boxes
- panels
- planes
- grouped primitives

### Do not
- load ultra-detailed furniture meshes by default
- run photoreal materials at edit time

## 4.2 Use scene graph grouping intentionally
For each module, group:
- shell mesh
- selection overlay
- handles / gizmos
- metadata reference

## 4.3 Defer expensive assets
Only load richer meshes when:
- object is selected
- room is focused
- user requests high-detail preview

---

## 5. Browser Performance Strategy

## 5.1 Route-level code splitting
Design Studio should be its own heavy route.

## 5.2 Component-level lazy loading
Lazy-load:
- 3D renderer
- heavy inspector tabs
- texture libraries
- advanced templates

## 5.3 Store design
Use:
- server state for persistent data
- lightweight editor store for interaction
- memoized selectors for hot rendering paths

## 5.4 Avoid global rerenders
- read tiny state slices
- avoid passing giant scene objects through many components
- normalize entities by ID where possible

## 5.5 Keep GPU load predictable
- limit shadow complexity in editor mode
- avoid too many dynamic lights
- use unlit or simple PBR-ish preview materials if needed

---

## 6. What Should Stay Off the Critical Browser Loop

Move these off hot interaction path:
- photoreal rendering
- heavy CV
- large exports
- PDF composition
- deep validation loops
- geometry-intensive optimization

Use:
- API jobs
- workers
- async background pipelines

---

## 7. Best Fidelity Strategy

### Edit Mode
- fast
- approximate but spatially correct
- semantic

### Review Mode
- richer materials
- better cameras
- still interactive enough

### Final Mode
- server-side rendering or export pipeline

This is the correct performance model.

---

## 8. Data Flow Best Practice

```text
API scene version
  → normalize scene entities
  → render 2D + 3D from same state
  → user interaction creates patch ops
  → patch ops create new scene version
  → dependent outputs may become stale
```

This pattern must never be broken.

---

## 9. Final Rule

> The web editor should feel instant, but its speed must come from smart architecture, not from sacrificing correctness. Keep the browser focused on interaction and lightweight spatial representation; move expensive work into services and background jobs.
