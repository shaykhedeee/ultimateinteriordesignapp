# 34 — Phase 2G Implementation Status

## Scope completed in scaffold

### 1. Geometric diff overlays
Implemented:
- compare route already returns scene comparison summary
- compare screen now loads both scene documents
- 2D diff overlay using base scene + compare scene in plan canvas
- 3D diff overlay using base scene + compare scene in isometric preview
- current scene rendered in green family, compare scene overlay rendered in red family

### 2. Live cost delta in configurators
Implemented:
- module configurator now maintains draft param state
- real-time cost calculation based on module type and param changes
- current cost, draft cost, and delta displayed live
- base / hardware / finish cost breakdown shown

### 3. Stronger production-aware module logic
Implemented:
- backend production mapping helper for modules
- production mapping assigned during module creation
- production mapping recalculated on param/material changes
- configurator panel displays production preset, board defaults, edge defaults, and production notes

### 4. Module duplication and template acceleration remain integrated
- duplicate action in inspector
- room template engine in design studio
- advanced configurator + materials + templates connected in the same workspace

### 5. Stronger approval consistency
Implemented:
- approval creation blocked when outputs are stale
- approval creation blocked when current scene is not used for client approval package
- approval locks source scene version
- locked scenes block patching and placement

### 6. Timeline and inbox remain connected
- more workflow actions continue to emit timeline events
- agentic inbox foundation remains active for future wager/verdict routing

## Remaining future upgrades
- true side-by-side geometric diff details for walls/openings, not only overlays and summaries
- exact quote delta integration into configurators from estimate engine, not only configurator-side heuristics
- live production/BOM preview cards in configurator panel
- richer scene compare for room-level and wall-level annotations
