# 17 — Open Source Foundations and Reuse Strategy

## Purpose

This document identifies open-source building blocks that are strong candidates to accelerate development of StudioOS for Interiors.

The goal is not to blindly copy projects.
The goal is to:
- reuse proven subsystems where appropriate
- avoid rebuilding solved problems
- avoid license traps
- preserve the geometry-first, production-aware architecture

---

## 1. Best Open-Source Reuse Candidates

## A. 2D/3D Floor Planning Core

### Candidate 1 — blueprint3d-modern
Why useful:
- modern TypeScript rewrite
- Next.js demo app
- 2D/3D toggle
- walls, item placement, textures, templates
- IndexedDB persistence
- clean separation between core library and app

Best use:
- reference architecture for editor structure
- room/item model concepts
- 2D/3D interaction patterns
- rapid prototyping of planning UX

Do not use blindly for:
- final canonical scene model
- production/BOM mapping
- commercial workflow

### Candidate 2 — furnishup/blueprint3d
Why useful:
- classic interior planning foundation
- clear split between floorplanner/model/items/three controllers
- good reference for wall/corner/item editing concepts

Best use:
- conceptual reference only
- behavior and data-structure inspiration

Do not use blindly for:
- modern production app foundation
- stale code / old tooling concerns

### Candidate 3 — openfpc
Why useful:
- 2D CAD behavior
- selection, snapping, bulk transforms, object-boundary attachment
- immutable-state drawing lessons

Best use:
- reference for 2D editor ergonomics and CAD behavior

Do not use blindly for:
- direct adoption as main editor base
- 3D interior workflow

### Candidate 4 — pascalorg/editor
Why useful:
- serious modern monorepo
- React Three Fiber / viewer/editor split
- strong state architecture
- large-scale 3D architectural editor patterns
- AI-assisted repo governance and modular design discipline

Best use:
- architecture inspiration for editor package split
- state management boundaries
- modular node/rendering system patterns

Do not use blindly for:
- copying full architecture wholesale, because it is broader than your interior-specific needs

---

## B. Floor Plan Intelligence / CV

### Candidate 5 — FloorPlanAnalyzer
Why useful:
- combines OCR, CV, and multiple detection methods
- explicit acknowledgment of accuracy limitations
- room/wall/opening detection experimentation
- review/edit workflow inspiration

Best use:
- reference pipeline for hybrid CV + review
- proof that human review layer is mandatory

Caution:
- licensing constraints from third-party models
- experimental quality, not production-ready as-is

### Candidate 6 — FloorplanToBlender3d
Why useful:
- useful reference for wall/room/door/window CV steps
- direct 2D-to-3D mentality
- Blender-oriented downstream thinking

Best use:
- algorithm reference for geometry extraction and Blender bridging

### Candidate 7 — floor-plan-room-segmentation / floorData / floor-plan-object-detection
Why useful:
- useful training and experimentation references for segmentation and YOLO-based detection
- wall/door/window component understanding

Best use:
- model experimentation and evaluation benchmarks

---

## C. Quotation / Billing / ERP References

### Candidate 8 — IDURAR ERP CRM
Why useful:
- quote / invoice / payment / customer management concepts
- mature open-source ERP/CRM pattern

Best use:
- reference for document workflows and commercial concepts
- not a direct copy for your platform

Caution:
- stronger licensing obligations
- architecture not aligned with your preferred Postgres/geometry-first stack

### Candidate 9 — accountill / invoices-style repositories
Why useful:
- estimate/quote/invoice/report generation patterns
- good references for payment status and PDF workflows
- some use Node + TypeScript + Postgres + BullMQ patterns

Best use:
- commercial subsystem inspiration
- reporting/export workflow inspiration

### Candidate 10 — ddanielcruz/invoices-style backend pattern
Why useful:
- Node.js + TypeScript + Postgres
- background jobs with Redis and BullMQ
- report generation pipeline
- practical backend pattern for receipts/invoices/report extraction

Best use:
- backend job architecture reference for invoice/report generation
- CSV/PDF export workflow reference

---

## 2. Recommended Reuse Decision

## Use as direct foundation or heavy reference
- blueprint3d-modern
- pascalorg/editor (architecture only)
- selective invoice/reporting repos for commercial patterns

## Use as algorithm references, not app foundation
- FloorPlanAnalyzer
- FloorplanToBlender3d
- floor-plan-room-segmentation
- floor-plan-object-detection

## Use carefully or only conceptually
- furnishup/blueprint3d (old)
- openfpc (archived)
- IDURAR (license and stack mismatch)

---

## 3. Best Low-Cost Reuse Strategy

### Editor
Build your own canonical scene model, but borrow interaction and model concepts from:
- blueprint3d-modern
- openfpc
- pascalorg/editor

### CV
Build a separate Python service, but bootstrap experiments from:
- FloorPlanAnalyzer
- YOLO/CV examples
- segmentation examples

### Commercial
Build your own interiors-specific commercial engine, but borrow document state ideas from:
- IDURAR
- invoice/quote repos

### Rendering
Use your own scene export flow and Blender pipeline.
Do not depend on image-only AI.

---

## 4. Final Reuse Rule

> Reuse open-source components where they accelerate editor behavior, CV experimentation, and commercial workflow concepts — but do not let any borrowed project dictate the core source-of-truth architecture. The canonical scene graph, Indian modular rule engine, and scene-to-production continuity must remain your own system design.
