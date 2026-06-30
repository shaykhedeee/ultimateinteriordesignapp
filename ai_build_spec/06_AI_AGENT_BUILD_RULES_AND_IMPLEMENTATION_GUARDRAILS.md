# 06 — AI Agent Build Rules and Implementation Guardrails

## 1. Purpose

This document tells an AI coding agent exactly how to build the app safely.

It exists to prevent:
- shallow architecture
- disconnected modules
- image-first mistakes
- schema drift
- hidden assumptions
- broken approval continuity
- production mismatch

This document is mandatory reading before implementation.

---

## 2. Build Mission

The coding agent must build a **geometry-first, workflow-connected, production-aware interior design platform**.

The coding agent must **not** build:
- a loose collection of pages
- a disconnected AI render demo
- a UI-first prototype with fake data structures
- an image-generation app pretending to be a design system

---

## 3. Non-Negotiable Build Rules

## Rule 1 — Canonical Schema First
No UI or API feature should be built before its canonical schema is defined.

## Rule 2 — Scene Graph Is the Source of Truth
Any feature related to room design, materials, renders, drawings, proposals, BOM, or cutlists must resolve back to a scene version.

## Rule 3 — Immutable Versions
Approved or historical versions must never be mutated in place.
Create new versions.

## Rule 4 — No Hidden Local Truth
The frontend must not keep secret business logic or unsynced permanent state outside the canonical API model.

## Rule 5 — No Output Without Traceability
A render, drawing, proposal, BOM, or cutlist must always reference:
- project ID
- scene version ID
- generator metadata

## Rule 6 — No Silent AI Decisions
Low-confidence interpretation must require explicit review.

## Rule 7 — No Production Logic Inside UI Components
Part formulas, edge rules, and schedule logic belong in domain/services/rules packages.

## Rule 8 — No Hardcoding Business Rules Into Random Functions
Use structured rule definitions and central validators.

---

## 4. Required Build Order

The coding agent must implement in this order:

### Phase 1
- monorepo scaffolding
- shared contracts
- database schema
- auth and studio/project foundations
- asset registry

### Phase 2
- intake and workflow stage services
- floor plan upload
- async jobs framework
- floor plan interpretation service contract
- spatial model contract

### Phase 3
- scene graph schema
- base scene generation
- 2D/3D editor state model
- versioning engine
- scene patch engine

### Phase 4
- parametric modules
- rule engine
- material/catalog foundation
- room/module validation system

### Phase 5
- render job pipeline
- drawing/elevation generation
- proposal generation
- pricing generation

### Phase 6
- approval flow
- stale output invalidation
- BOM and cutlist generation
- deliverables vault
- comments and collaboration

Do **not** reverse this order.

---

## 5. Required Package Responsibilities

## packages/contracts
Must contain:
- DTOs
- zod validators
- API request/response types
- enums
- shared payload schemas

## packages/domain
Must contain:
- business entities
- domain helpers
- stage logic
- readiness logic
- scene version rules

## packages/rules
Must contain:
- room rules
- module rules
- production rules
- standards configuration
- validation engine

## packages/scene
Must contain:
- scene graph types
- patch operations
- validation helpers
- scene hash generation
- stale-detection helpers

## packages/pricing
Must contain:
- room pricing aggregators
- module pricing logic
- rate card readers
- budget summaries

## packages/exports
Must contain:
- SVG generation
- PDF composition helpers
- CSV generators
- title block helpers

## apps/api
Must contain:
- route handlers
- orchestration services
- auth/permission checks
- queue job submission

## services/cv-intelligence
Must contain:
- CV/OCR service contracts
- interpretation pipeline
- confidence generation

---

## 6. Frontend Guardrails

## 6.1 UI State Rules
- use query cache for server state
- use Zustand or equivalent for editor interaction state only
- never store canonical scene truth only in component state
- always refetch or reconcile after version-creating operations

## 6.2 Editor Rules
- 2D and 3D must read from the same scene document
- drag operations must emit valid patch operations
- edits must create new scene versions, not mutate snapshots in memory without persistence

## 6.3 Screen Rules
Each major screen must have:
- loading state
- empty state
- error state
- stale data warning state when applicable

---

## 7. Backend Guardrails

## 7.1 Service Rules
- services must be modular by domain, not by page
- each write operation must validate input against shared schemas
- each versioned write must emit an audit event

## 7.2 Route Rules
- routes must be thin
- business logic belongs in services
- never embed significant domain logic directly in controllers

## 7.3 Persistence Rules
- use transactions for multi-step writes
- use optimistic or explicit locking when scene versions change
- never overwrite a locked scene version

---

## 8. Scene Graph Build Rules

The coding agent must implement scene graph operations as explicit patch types.

### Required Patch Types
- add_room_metadata
- update_room_metadata
- update_wall_geometry
- add_opening
- update_opening
- place_module
- update_module_params
- remove_module
- assign_material
- assign_lighting_preset
- add_camera
- update_camera
- reorder_variant_metadata

### Rule
Every patch operation must:
- validate references
- validate geometry constraints
- validate room/module rule compatibility where applicable
- return a new scene version

---

## 9. Versioning Rules

The coding agent must implement immutable versioning for:
- intake packages
- floor plan versions
- spatial model versions
- scene versions
- pricing sets
- render sets
- drawing sets
- proposal sets
- BOM sets
- cutlist sets
- approval packages

### Mandatory Behavior
When a scene changes:
1. create new scene version
2. mark downstream outputs stale if affected
3. preserve prior output history
4. never rewrite old approvals

---

## 10. Stale Output Rules

The coding agent must implement stale detection.

### If geometry changes
Invalidate:
- render sets
- drawing sets
- proposals
- pricing
- BOM
- cutlist

### If only finish/material changes
Invalidate:
- renders
- pricing
- finish schedules
- proposals using those renders/costs

### If camera-only changes
Invalidate:
- render outputs only

### Implementation Rule
Stale state must be stored in data, not inferred only in UI.

---

## 11. AI / CV Integration Guardrails

## 11.1 AI Must Be Assistive
AI may:
- interpret plans
- suggest room labels
- suggest modules
- suggest material palettes
- suggest layouts
- enhance images

AI may not:
- silently finalize spatial truth
- silently change approved geometry
- silently replace production settings

## 11.2 Confidence Rules
Every important detection result must store confidence.

### Threshold Model
- high confidence: may be batch-accepted if user chooses
- medium confidence: show prominently for review
- low confidence: must require explicit correction or acceptance

---

## 12. Drawing and Export Guardrails

### Drawings
- must be generated from scene version
- must include metadata in DB and file manifest
- must not rely on manually placed UI labels as the only annotation source

### Proposal PDFs
- must reference exact source scene, pricing, and render set IDs
- must be regeneratable deterministically

### Production Exports
- must reference approved or explicitly draft source state
- must indicate if site verification is pending

---

## 13. Test Requirements

The coding agent must create tests for:

## 13.1 Schema and Validation
- DTO validation
- scene patch validation
- rule evaluation
- stage transition guards

## 13.2 Versioning
- creating new scene versions
- locking scenes
- approval package creation
- stale invalidation behavior

## 13.3 Floor Plan Flow
- upload → interpret job creation
- review items resolution
- spatial model finalization

## 13.4 Production Flow
- module placement
- BOM generation
- cutlist generation
- export metadata linkage

## 13.5 UI
- key user flows
- editor patch submission
- stale warning behavior
- approval state UX

---

## 14. Definition of Done for Any Feature

A feature is only done if:

1. its schema exists
2. its API contract exists
3. its permissions are defined
4. its validation rules exist
5. its versioning behavior is defined
6. its stale/invalidation behavior is defined
7. its UI states are handled
8. its audit trail is recorded where relevant
9. tests are added
10. it does not break scene-to-output continuity

---

## 15. Definition of Done for the Product Core

The core is only considered built when the system can reliably perform this end-to-end flow:

1. create lead/project
2. capture intake
3. upload plan
4. interpret and review plan
5. create scene shell
6. place parametric modules
7. validate rules
8. generate renders
9. generate wall elevations
10. generate proposal
11. approve design package
12. generate BOM and cutlist
13. export deliverables

If any step requires manual rebuilding of prior data, the architecture is incomplete.

---

## 16. Mandatory Logging and Audit Rules

Must log:
- stage transitions
- scene version creation
- rule overrides
- approvals
- export generation
- job failures
- unlock operations

Must retain:
- reason
- actor
- timestamp
- source entity

---

## 17. Anti-Patterns the AI Agent Must Avoid

Do not:
- build one massive generic `projectData` blob with no structure
- keep render logic completely separate from scene versions
- build drawings from ad hoc frontend snapshots
- embed production formulas in UI code
- skip versioning because it seems faster
- hardcode room-specific rules in multiple places
- couple every screen directly to DB tables without service abstraction
- create “magic” AI changes that users cannot review

---

## 18. Required Coding Standards

- TypeScript strict mode on
- shared schemas validated at boundaries
- no `any` in core contracts
- zod or equivalent validation at API boundary
- service-oriented code organization
- pure functions for rules and derived calculations where possible
- deterministic IDs/reference generation inside scene documents where needed

---

## 19. Human Override Philosophy

The system must automate aggressively but preserve expert control.

That means:
- AI proposes
- rules validate
- user confirms
- approval locks
- production exports obey locked truth

This sequence must not be broken.

---

## 20. Final Instruction to the Coding Agent

> Build this product as a connected interior design operating system with a revision-safe scene graph at the center. Every feature must either create, validate, enrich, visualize, approve, or export that truth. If a feature bypasses the canonical model, it is wrong and must be redesigned before implementation.
