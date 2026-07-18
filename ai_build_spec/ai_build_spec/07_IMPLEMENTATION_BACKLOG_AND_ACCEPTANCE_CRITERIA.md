# 07 — Implementation Backlog and Acceptance Criteria

## 1. Purpose

This document converts the product vision, schema, and architecture into a build backlog that an AI coding agent can follow feature by feature.

Each milestone here should be treated as an implementation package with explicit acceptance criteria.

---

## 2. Milestone 1 — Foundations

## Scope
- monorepo structure
- shared contracts package
- user/studio/project schema
- auth and role system
- asset registry
- job system skeleton

## Acceptance Criteria
- project can be created
- studio/user roles exist
- asset upload works and records metadata
- async job table exists and statuses can be updated
- shared DTO validation works in API
- basic audit logging works

---

## 3. Milestone 2 — Intake and Workflow

## Scope
- lead capture
- client/project creation
- intake wizard schema and endpoints
- project stage transitions
- readiness scoring

## Acceptance Criteria
- lead converts into project
- intake saves as versioned package
- required intake validation exists
- readiness score returns next required action
- invalid stage transitions are blocked

---

## 4. Milestone 3 — Floor Plan Intelligence

## Scope
- floor plan upload
- interpretation job creation
- review items model
- spatial model generation
- confidence score handling

## Acceptance Criteria
- user uploads a plan and receives job ID
- interpretation version is created
- low-confidence items are visible for review
- review corrections can be submitted
- approved interpretation creates a spatial model version

---

## 5. Milestone 4 — Scene Graph Core

## Scope
- scene version schema
- scene shell generation from spatial model
- scene retrieval
- scene patch engine
- scene branch creation
- scene locking

## Acceptance Criteria
- base scene can be created from approved spatial model
- scene patch creates new version, not in-place mutation
- locked scene cannot be edited
- scene history is visible
- stale output rules can be triggered from scene changes

---

## 6. Milestone 5 — 2D/3D Design Studio

## Scope
- linked 2D/3D editor foundations
- room display
- walls/openings visualization
- module footprints in 2D
- basic 3D room shell
- material assignment UI

## Acceptance Criteria
- rooms and walls render in 2D and 3D
- material changes persist to scene version
- module placement updates both views
- editor operations submit scene patch requests correctly

---

## 7. Milestone 6 — Parametric Modules

## Scope
- module template system
- kitchen modules
- wardrobe modules
- TV unit modules
- mandir modules
- module validation hooks

## Acceptance Criteria
- module template can be instantiated in scene
- parameter changes update geometry and metadata
- invalid parameters are rejected
- room/module rules execute and return pass/warn/fail states
- module records map to scene data and production metadata

---

## 8. Milestone 7 — Rule Engine

## Scope
- rule set registry
- evaluation service
- hard/soft/advisory rule handling
- override logging

## Acceptance Criteria
- room and module validations are machine-readable
- hard-rule failure can block export or approval where required
- authorized user can override with reason
- evaluation results persist for history and QA

---

## 9. Milestone 8 — Render Pipeline

## Scope
- render set creation
- render job orchestration
- render variant records
- approval/rejection flow
- render metadata linkage to scene version

## Acceptance Criteria
- render set can be generated from a scene version
- variants are stored with asset linkage
- render can be approved/rejected/shortlisted
- changing scene invalidates previous render set state

---

## 10. Milestone 9 — Drawing and Elevation Pipeline

## Scope
- drawing set generation
- floor plan output
- wall elevation output
- ceiling plan output
- room/module schedule output

## Acceptance Criteria
- wall elevations generate from room geometry
- drawing outputs carry scene version metadata
- stale drawings are marked when geometry changes
- PDFs/SVGs are accessible in deliverables system

---

## 11. Milestone 10 — Pricing and Proposal Engine

## Scope
- rate cards
- pricing set generation
- room/module cost summaries
- proposal set generation
- PDF export

## Acceptance Criteria
- pricing set derives from scene/modules/materials
- proposal set includes linked render/drawing/pricing references
- proposal export fails or warns if dependent sets are stale
- proposal revisions are preserved historically

---

## 12. Milestone 11 — Approval System

## Scope
- approval package generation
- client approval/rejection recording
- scene lock on approval
- revision request flow

## Acceptance Criteria
- approval package can be created for a specific design package
- approval records exact scene version
- approved design becomes locked
- new revision supersedes prior approval package correctly

---

## 13. Milestone 12 — BOM and Cutlist

## Scope
- BOM generation from approved modules
- production presets
- cutlist generation
- export package

## Acceptance Criteria
- BOM derives from approved or draft scene with clear status labeling
- part formulas execute correctly for supported module types
- cutlist exports include metadata and warnings
- deliverables can be downloaded from vault

---

## 14. Milestone 13 — Collaboration and Memory

## Scope
- comments
- share packages
- reusable design assets
- mistakes log
- similarity and memory services

## Acceptance Criteria
- comments can target room/module/render/drawing entities
- share package aggregates latest valid outputs
- accepted templates/renders can be stored for reuse
- mistakes log captures failures with categories and reasons

---

## 15. Global Acceptance Gates

The product should not be called production-ready until all are true:

1. floor plan to scene works reliably
2. scene to modules works reliably
3. scene to render works with version linkage
4. scene to drawing works with version linkage
5. scene to proposal works with version linkage
6. approved scene to BOM/cutlist works reliably
7. stale outputs are properly marked and not confused as current
8. rule engine prevents obvious design/production errors
9. permissions and audit trail exist for critical actions
10. core end-to-end tests pass

---

## 16. Final Backlog Rule

> The implementation backlog must always move from truth-modeling to automation to presentation to production. If a future task skips the truth-modeling layer and goes directly to UI or AI outputs, it should be rejected or redesigned.
