# 19 — Competitor Strength to Build Decision Mapping

## Purpose

This document turns competitor strengths into exact build decisions.

---

## Foyr Strengths to Adopt

### Observed strength
- browser-first speed
- cloud rendering
- large 3D model catalog
- walkthroughs
- no high-end hardware dependency

### Build decision
- keep editor web-first
- use server/on-demand render workers, not local heavy rendering
- make draft/review/final render tiers
- support strong catalog metadata and search

---

## RoomSketcher Strengths to Adopt

### Observed strength
- plan conversion
- approachable drawing/editing
- LiDAR capture path
- live 3D walkthrough
- measurements and polished 2D/3D plans

### Build decision
- implement AI-assisted plan review pipeline
- keep 2D editing simple and immediate
- make measurement and plan readability a first-class feature
- design capture pipeline should support scan/LiDAR later

---

## Cedreo Strengths to Adopt

### Observed strength
- synchronized plans/elevations/3D visuals/presentations
- automatic document refresh when model changes
- strong presentation packaging

### Build decision
- implement stale output invalidation everywhere
- keep drawings/proposals tied to scene versions
- generate proposal packages from the same source model

---

## Matterport Strengths to Adopt

### Observed strength
- reality capture
- digital twin mindset
- CAD/BIM exportability
- Autodesk/Procore style downstream usefulness

### Build decision
- every room/wall can have real-world reference imagery and notes
- preserve existing-condition state separately from proposed design state
- think in terms of spatial truth, not just visuals

---

## Your Differentiation Layer

### What competitors do not own strongly together
- Indian modular interior expertise
- room-specific rules
- budget-first design logic
- estimate → quote → billing → procurement → production continuity
- scene-to-cutlist continuity

### Build decision
These become first-class modules, not add-ons.

---

## Final Mapping Rule

> Whenever a competitor is strong at a layer, copy the pattern — not the product. Adopt the infrastructure logic, but fuse it into your geometry-first, India-specific, commercially complete operating system.
