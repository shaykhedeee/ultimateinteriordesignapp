# 09 — Full Product Requirements Document (PRD)

## 1. Document Purpose

This PRD defines the exact product to build.

It combines:
- product vision
- market strategy
- business goals
- personas
- workflows
- requirements
- technical boundaries
- acceptance criteria
- release strategy

This document should be treated as the primary build brief for product, design, and engineering.

---

## 2. Product Name

Working name:
**Ultimate Interior Designer App**

Recommended sellable name:
**StudioOS for Interiors**

---

## 3. Product Summary

StudioOS for Interiors is a geometry-first, AI-assisted interior design operating system for Indian modular interior businesses.

It helps studios move a client from:
- lead capture
- discovery
- site/floor-plan understanding
- editable 2D/3D design
- renders and walkthroughs
- wall elevations and drawings
- costing and proposal
- approval and revision
- BOM and cutlist
- deliverables and production handoff

through one connected workflow.

The product is designed to reduce design effort, accelerate sales, improve visualization quality, reduce production errors, and build reusable studio intelligence over time.

---

## 4. Problem Statement

Interior design businesses commonly suffer from these problems:

1. lead capture, design discovery, visualization, documentation, and production exist in separate tools
2. client requirements get lost between onboarding and actual design work
3. AI renders are visually attractive but not editable or production-useful
4. floor plan understanding is weak and error-prone
5. elevations and documentation are recreated manually after visualization
6. accepted client visuals do not cleanly flow into BOM/cutlist workflows
7. most tools are not designed for Indian modular interiors and workshop realities

The result is:
- slow sales cycles
- many revisions
- poor trust in visualization
- inconsistent drawings
- repetitive manual work
- production mismatch

---

## 5. Product Vision

Build the strongest interior design platform in the market by creating a system where:

- the floor plan becomes structured design truth
- the design becomes an editable scene graph
- the same model powers renders, drawings, budgets, proposals, and production outputs
- Indian modular interior rules are built into the system
- AI accelerates work without replacing deterministic geometry

---

## 6. Goals

## 6.1 Business Goals
- shorten time from first consultation to proposal
- increase close rates by improving visualization clarity
- reduce manual documentation effort
- reduce revision cycles
- reduce production errors after approval
- create a reusable studio knowledge system

## 6.2 User Goals
- quickly understand a client’s space and needs
- generate editable room concepts fast
- compare variants clearly
- produce client-ready outputs from one source of truth
- hand approved work to production without rebuilding data

## 6.3 Product Goals
- be faster than CAD-heavy tools for sales workflows
- be more editable than image-first AI tools
- be more production-aware than render-first tools
- be more India-specific than generic Western platforms

---

## 7. Non-Goals

The initial core product is not trying to be:
- full BIM for large architectural practice
- structural engineering software
- permitting-grade AEC stack for every jurisdiction
- generic social moodboard app
- pure marketplace app
- CNC nesting enterprise suite from day one

---

## 8. Users and Personas

## 8.1 Studio Owner
Needs:
- command center
- project visibility
- proposal speed
- team accountability
- quality control
- pricing visibility

## 8.2 Designer
Needs:
- editable 2D/3D design
- quick room iteration
- fast renders
- elevations and schedules
- material swaps
- design reuse

## 8.3 Sales Designer / Walk-in Consultant
Needs:
- fast intake
- floor plan upload
- quick concepts
- confidence-building visualization
- proposal export in same session or same day

## 8.4 Estimator
Needs:
- rate cards
- room-wise costing
- module-wise pricing
- cost revisions
- commercial summaries

## 8.5 Production Manager
Needs:
- approved module schedules
- BOM and cutlists
- part formulas
- material summary
- clear revision-safe handoff

## 8.6 Site Capture Executive
Needs:
- scan/measurement workflow
- room and wall photo capture
- issue tagging
- measurement verification
- easy upload

## 8.7 Client / Homeowner
Needs:
- understand what is being proposed
- compare options
- comment easily
- approve clearly
- trust that approved design matches final handoff

---

## 9. Jobs To Be Done

### JTBD 1
When a client walks in with a floor plan, help the designer capture requirements, understand the layout, and show a convincing design direction fast.

### JTBD 2
When the team has a plan but no clean model, convert it into an editable digital project with minimum redraw work.

### JTBD 3
When the client asks for changes, make revisions in the same model and regenerate accurate visuals and documents.

### JTBD 4
When a design is approved, generate commercial and production outputs without re-entering information.

---

## 10. Product Principles

1. geometry first
2. one source of truth
3. AI assists, does not silently decide
4. every output is version-safe
5. fast enough for sales, reliable enough for production
6. Indian modular intelligence is a core feature, not an afterthought

---

## 11. Core User Journey

1. lead created
2. project created
3. intake completed
4. floor plan / scan uploaded
5. plan intelligence reviewed
6. scene shell generated
7. room modules and finishes edited
8. renders and drawings generated
9. proposal exported
10. client comments and approval recorded
11. approved scene locked
12. BOM and cutlist generated
13. deliverables packaged

---

## 12. Functional Scope

## 12.1 CRM and Intake
### Requirements
- create leads
- convert leads to projects
- capture discovery inputs
- store room requirements
- store style/material likes/dislikes
- capture budget and timeline
- store references

## 12.2 Site Capture and Inputs
### Requirements
- upload plan image/PDF
- upload site photos
- attach photos to rooms/walls
- capture notes and site issues
- support scan/LiDAR roadmap
- measurement verification workflow

## 12.3 Floor Plan Intelligence
### Requirements
- OCR labels and dimensions
- detect walls/openings/rooms
- infer scale
- infer room types where possible
- generate confidence scores
- present review items for correction
- finalize into spatial model

## 12.4 Scene Generation and Design Core
### Requirements
- create scene shell from spatial model
- linked 2D and 3D views
- versioned scene graph
- branch/variant support
- room metadata and wall metadata
- materials, lights, and camera presets

## 12.5 Parametric Module Engine
### Requirements
- place configurable kitchen modules
- place configurable wardrobe modules
- place configurable TV units
- place configurable mandir units
- place storage and room-specific modules
- validate modules against room constraints
- maintain production mappings

## 12.6 Rule Engine
### Requirements
- room-specific validation
- modular dimension validation
- circulation and clearance validation
- material compatibility validation
- lighting/camera recommendations
- override system with audit trail

## 12.7 Render Studio
### Requirements
- draft preview
- review-quality render set
- final render set
- multiple cameras and lighting presets
- variant approval/rejection/shortlist
- scene-linked render metadata

## 12.8 Drawings and Elevations
### Requirements
- annotated floor plans
- wall elevations per room
- reflected ceiling plans
- room/module schedules
- scale-aware exports
- scene-linked output generation

## 12.9 Pricing and Proposal
### Requirements
- rate card support
- module-wise costing
- room-wise costing
- proposal generation
- branded PDF exports
- revision-safe proposal sets

## 12.10 Approval and Revision Flow
### Requirements
- create approval package
- capture client comments
- approve/reject designs
- lock scene version when approved
- request revisions
- mark stale outputs when changed

## 12.11 BOM and Cutlist
### Requirements
- generate BOM from approved modules
- apply production presets
- generate cutlists
- export CSV/PDF
- distinguish draft vs approved production basis

## 12.12 Deliverables Vault
### Requirements
- show render history
- show drawings history
- show proposal history
- show cutlist history
- ZIP/share package
- per-project file history

## 12.13 Memory and Reuse
### Requirements
- store approved room templates
- store finish packs
- store render references
- similarity search
- mistakes log
- suggest reuse on new projects

---

## 13. Detailed Product Requirements by Module

## 13.1 Command Center
Must show:
- active projects
- pipeline stages
- readiness score
- pending reviews
- pending approvals
- pending production handoffs
- recent deliverables

## 13.2 Design Studio
Must support:
- room selection
- 2D plan editing
- 3D preview editing
- module placement
- finish assignment
- wall notes and measurements
- validation state feedback

## 13.3 Render Studio
Must support:
- room render requests
- camera presets
- lighting presets
- style presets
- variant generation
- compare/approve/reject

## 13.4 Drawings Studio
Must support:
- room-by-room elevation browsing
- regenerate drawing set
- add annotation metadata
- download/export

## 13.5 Production Studio
Must support:
- approved module list
- BOM generation
- cutlist generation
- production warnings
- export history

---

## 14. Non-Functional Requirements

## Performance
- project summary load under 2 seconds for normal projects
- plan interpretation job status should be visible immediately
- scene editing should feel interactive
- render jobs must be asynchronous and trackable

## Reliability
- no approved design may lose its revision history
- no file output may exist without DB linkage
- no scene mutation may silently overwrite locked state

## Scalability
- support single-studio local-first mode and cloud multi-user mode
- isolate CV/render workers from main API

## Security
- role-based access control
- signed file URLs where needed
- audit logs for approvals, unlocks, exports, and overrides

## Observability
- job logs
- output generation logs
- scene version events
- rule evaluation logs

---

## 15. Success Metrics

## Sales
- first-visual turnaround time
- proposal turnaround time
- conversion rate after first session

## Design
- plan-to-scene success rate
- room concept turnaround time
- render approval rate
- reuse rate of templates/modules

## Production
- time from approval to BOM
- time from approval to cutlist
- production correction rate

## System
- scene save success rate
- job failure rate
- stale invalidation correctness
- render generation turnaround

---

## 16. Release Strategy

## Release 1 — Core Sales and Design Foundation
- CRM and intake
- plan upload
- floor plan intelligence review
- scene shell
- linked 2D/3D room editing
- first module types
- review renders

## Release 2 — Drawings and Proposal
- wall elevations
- drawing set generation
- pricing set generation
- proposal export
- approval workflow

## Release 3 — Production Bridge
- BOM
- cutlist
- production presets
- deliverables vault

## Release 4 — Memory and Scale
- design reuse
- mistakes log
- similarity search
- multi-user enhancements
- vendor catalog enrichment

---

## 17. Risks and Mitigations

### Risk
AI plan understanding may be inconsistent.
### Mitigation
confidence review layer + manual correction workflow + mistakes log

### Risk
Renders could diverge from production geometry.
### Mitigation
scene version binding + stale invalidation + approval locks

### Risk
Trying to build full BIM complexity too early.
### Mitigation
focus on BIM-lite interior scene graph with module intelligence

### Risk
Production complexity may delay sales value.
### Mitigation
release sales/design core before full production package, but architect for continuity from day one

---

## 18. Acceptance Criteria for Product Core

The product core is acceptable only if all of these are possible:

1. create project from lead
2. complete intake
3. upload plan
4. review AI interpretation
5. create editable room scene
6. place parametric modules
7. validate room/module rules
8. generate renders
9. generate wall elevations
10. generate proposal
11. lock approved scene
12. generate BOM and cutlist from approved version

---

## 19. Final PRD Statement

> StudioOS for Interiors must be built as a geometry-first, AI-assisted, interior design operating system where floor plans, design scenes, renders, drawings, proposals, and production outputs all flow from one revision-safe source of truth. The product must combine fast sales visualization with reliable modular production continuity, and it must be significantly better than generic design tools for Indian interior workflows.
