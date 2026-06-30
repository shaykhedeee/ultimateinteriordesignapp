# 51 — Agent B Required Schema, API, and UI Expansions for StudioOS

## Purpose

This document turns the competitive scan into concrete implementation requirements across:
- schema
- API
- jobs
- UI structure
- workspace modes

---

## 1. Schema Expansions Required

## 1.1 Workflow entities
Add or formalize entities for:
- workflow runs
- tool runs
- generated references
- presentation decks
- role-specific workspace settings
- catalog/provider entities
- finish packages
- unit presentation packages

### Suggested entity families
- `workflow_run`
- `tool_run`
- `presentation_pack`
- `catalog_brand`
- `catalog_vendor`
- `finish_package`
- `unit_customization_session`
- `reference_board`

---

## 1.2 Photo edit entities
Needed to support Photo Edit style workflows:
- photo asset
- edit session
- targeted edit region / mask reference
- edit instruction set
- result lineage

### Core requirement
Photo edits should store:
- source image
- edit type
- prompt or structured intent
- linked room/project if applicable
- approved/rejected state

---

## 1.3 Product design entities
Needed for Design Product parity:
- product concept
- product family
- product parameter set
- product drawing set
- product BOM set
- supplier/vendor linkage

### Strong rule
Product entities should work both as:
- standalone custom product records
and
- project scene module references

---

## 1.4 Presentation entities
Needed to match public presentation/export framing:
- client presentation package
- slide blocks / sections
- linked render variants
- linked drawings
- linked quote summaries
- export status

---

## 1.5 Brand / catalog entities
Needed for future brand mode:
- manufacturer profile
- product collection
- material collection
- finish library
- price calculator profile
- quote template profile

---

## 2. API Expansions Required

## 2.1 Workflow endpoints
Add higher-level workflow endpoints for:
- create smart project run
- create quick generate run
- create photo edit session
- create design product session
- create quick layout session

These should orchestrate lower-level scene/floorplan/render/drawing steps.

---

## 2.2 Tool-run endpoints
Add tool-run endpoints such as:
- `/tools/material-change`
- `/tools/mood-shift`
- `/tools/camera-angle-adjust`
- `/tools/photo-edit`
- `/tools/layout-to-3d`
- `/tools/product-bom`

### Important rule
If a tool updates the canonical scene, it must do so through explicit patches or versioned outputs.

---

## 2.3 Presentation endpoints
Add endpoints for:
- create presentation package
- attach render variants
- attach drawings
- attach material boards
- export deck

---

## 2.4 Catalog / brand endpoints
Add future-facing endpoints for:
- list brands/vendors
- product collection CRUD
- material library CRUD
- quote request generation
- finish package retrieval

---

## 3. Job System Expansions Required

Current job system should expand to support:
- workflow-level jobs
- multi-stage tool jobs
- presentation export jobs
- photo-edit jobs
- product-drawing jobs
- product-BOM jobs
- layout-detection jobs

### Job requirement
Every job should clearly specify:
- source project/workflow/tool context
- result entity linkage
- progression stage
- stale dependencies

---

## 4. UI Information Architecture Expansions Required

## 4.1 Left navigation / product nav
Add or clarify top-level entry points like:
- Command Center
- Smart Project
- Quick Generate
- Photo Edit
- Quick Layout
- Design Product
- Renders
- Drawings
- BOM / Production
- Catalog
- Presentations
- Approvals

---

## 4.2 Workspace mode switching
The UI should support role-aware modes:
- Designer mode
- Brand mode
- Real Estate mode
- Catalog mode

This can begin as filtered navigation + permissions + tailored dashboards.

---

## 4.3 Home dashboard
The home/dashboard should expose:
- active projects
- render counts
- drawing counts
- product/module counts
- approval waiting items
- stale scene alerts
- recent AI suggestions
- workflow shortcuts

---

## 5. Smart Project UI Requirements

The Smart Project UI must clearly display:
- plan upload
- interpretation status
- calibration status
- overlay review
- zone/room readiness
- scene generation readiness
- render readiness
- drawing readiness
- BOM readiness
- approval readiness

This is essential for the “pipeline architecture” expectation created by competitors.

---

## 6. Quick Generate UI Requirements

Quick Generate should feel fast, but still grounded.

### UI requirements
- choose room / scene / temporary concept
- upload references / moodboard
- choose style and render intent
- generate variants
- refine via materials / lighting / camera
- save as branch or render set

---

## 7. Photo Edit UI Requirements

### UI requirements
- upload photo
- target element selection
- prompt + preset edit controls
- material replacement suggestions
- time-of-day presets
- approve / reject outputs
- attach to project room/reference library

---

## 8. Design Product UI Requirements

### UI requirements
- pick family or custom start
- prompt-based or parameter-based generation
- dimensions panel
- material panel
- production spec panel
- drawings panel
- BOM panel
- catalog publish/save flow

---

## 9. Quick Layout UI Requirements

### UI requirements
- new canvas
- walls / doors / windows tools
- furniture block palette
- lock and generate top view
- edit uploaded layout mode
- zone-wise detect/erase/add elements mode
- export top view
- promote into main project scene

---

## 10. Final Requirement

To fully respond to the competitor’s public surface, StudioOS must not just add buttons. It must add:
- workflow entities
- tool entities
- job orchestration
- UI routing
- role-aware workspaces
- presentation and catalog layers

all while preserving the central geometry-first architecture.
