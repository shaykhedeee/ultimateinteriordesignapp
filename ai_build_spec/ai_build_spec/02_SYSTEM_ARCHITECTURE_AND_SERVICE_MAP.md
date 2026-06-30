# 02 — System Architecture and Service Map

## 1. Purpose

This document defines the exact system architecture for the app.

It is written to remove ambiguity for AI coding agents and engineering teams.
The architecture is designed to support:

- speed for sales sessions
- deterministic geometry and documentation
- AI-assisted floor plan understanding
- editable 2D/3D design
- render workflows
- production-ready outputs
- local-first and cloud-compatible deployment

---

## 2. Architecture Principle

The platform must use a **layered, service-oriented, geometry-first architecture**.

### Core Rule
Everything important must flow through the **canonical project model** and **scene graph**.

### High-Level Flow

```text
Lead / Intake / References
        ↓
Floor Plan / Scan / Site Inputs
        ↓
Plan Intelligence + Confidence Review
        ↓
Canonical Spatial Model + Scene Graph
        ↓
2D/3D Design Studio + Parametric Modules
        ↓
Renders / Walkthroughs / Drawings / Proposal
        ↓
Approval Lock
        ↓
BOM / Cutlist / Production Exports
        ↓
Deliverables Vault + Design Memory
```

---

## 3. Recommended Monorepo Structure

```text
studio-os/
  apps/
    web/                    # Next.js frontend
    api/                    # Node.js API / orchestration service
    worker/                 # background jobs / queue consumers
  services/
    cv-intelligence/        # Python/FastAPI for floor plan CV & OCR
    render-orchestrator/    # render control / scene export / Blender queue
  packages/
    contracts/              # shared TypeScript schemas / DTOs / zod validators
    domain/                 # domain models, enums, business logic helpers
    rules/                  # Indian standards, validations, rule engine config
    scene/                  # scene graph types, transformers, versioning helpers
    pricing/                # costing logic, rate cards, schedule calculators
    exports/                # PDF, SVG, CSV, DXF generation helpers
    ui/                     # shared design system and UI primitives
  infrastructure/
    docker/
    k8s/
    terraform/
  storage/
    local/                  # local-first fallback / dev mode
  docs/
```

---

## 4. Recommended Technology Stack

## 4.1 Frontend

### Required
- Next.js
- React
- TypeScript
- react-three-fiber / Three.js
- Zustand
- TanStack Query
- Zod for schema-safe parsing
- Konva or Fabric.js for plan annotation layers

### Why
- enables a modern web app
- strong typed contracts
- supports interactive 3D editing
- supports modular UI and editor state control

## 4.2 Backend API / Orchestration

### Required
- Node.js
- NestJS or strongly modular Express
- TypeScript
- Postgres client / ORM
- Redis
- BullMQ or Temporal for jobs

### Why
- orchestrates workflows across scenes, jobs, documents, renders, approvals, exports
- manages multi-step transactions and background tasks

## 4.3 Computer Vision / AI Service

### Required
- Python
- FastAPI
- OpenCV
- OCR engine
- ML model adapters
- geometry post-processing modules

### Why
- CV and OCR are easier to evolve in Python
- allows floor plan intelligence to scale separately from API logic

## 4.4 Database

### Required for serious build
- PostgreSQL
- pgvector
- PostGIS optional later
- Redis for queues and cache

### Local-first fallback
- SQLite can exist only as a local-dev or demo fallback, not the long-term system of record for multi-user production

## 4.5 File and Asset Storage

### Required
- S3 or Cloudflare R2 for persistent assets
- local disk cache for local-first mode

### Stores
- uploads
- scans
- floor plan originals
- room photos
- scene exports
- renders
- PDFs
- drawings
- cutlists
- thumbnails
- comparison images

## 4.6 Render Stack

### Required
- Three.js real-time preview
- Blender headless for premium rendering

### Optional later
- GPU cloud workers
- AI polish / inpainting / segmentation services

---

## 5. Core Architecture Layers

## 5.1 Experience Layer
Handles all user interaction.

### Includes
- dashboard
- CRM
- onboarding
- site capture
- design studio
- render studio
- drawing studio
- budgeting
- proposal generation
- approvals
- production workspace

### Rule
The frontend must not invent business truth locally.
It must consume and mutate canonical state through validated contracts.

---

## 5.2 Application Service Layer
Handles workflows, orchestration, permissions, and business processes.

### Includes
- project orchestration service
- workflow state service
- approval service
- design versioning service
- document generation service
- render job service
- production export service

### Rule
All important workflows must be centralized here, not buried inside UI components.

---

## 5.3 Domain Layer
Defines product truth.

### Includes
- projects
- rooms
- walls
- openings
- scenes
- modules
- materials
- budgets
- proposals
- approvals
- BOM and cutlist domain objects

### Rule
This is where invariants must live.
Example: an approved render cannot exist without scene revision linkage.

---

## 5.4 Intelligence Layer
Handles AI, CV, OCR, inference, similarity, and memory.

### Includes
- floor plan preprocessing
- OCR
- room detection
- opening detection
- dimension inference
- room type inference
- design similarity search
- prompt enrichment
- image segmentation / recolor helpers

### Rule
The intelligence layer may propose and annotate, but must not bypass deterministic review and validation logic.

---

## 5.5 Output Layer
Handles render, drawing, PDF, export, cutlist, and packaging generation.

### Includes
- render pipeline
- SVG drawing generator
- PDF proposal generator
- BOM exports
- cutlist exports
- deliverables packaging

### Rule
Every output must include metadata linking it to:
- project ID
- scene revision ID
- output type
- status
- generator version
- timestamp

---

## 6. Service Map

## 6.1 Project Service
Responsible for:
- project creation
- lead/client linkage
- high-level settings
- workflow stage
- project metadata

## 6.2 Intake Service
Responsible for:
- requirements capture
- room requirements
- style and material preferences
- budget and timeline capture
- vastu and functional constraints

## 6.3 Site Capture Service
Responsible for:
- floor plan upload
- room photo upload
- wall photo upload
- site notes
- scan ingestion
- dimension verification

## 6.4 Floor Plan Intelligence Service
Responsible for:
- preprocessing
- OCR
- wall detection
- room segmentation
- opening detection
- scale detection
- spatial graph generation
- confidence scoring
- review package generation

## 6.5 Scene Service
Responsible for:
- scene graph persistence
- entity versioning
- room shell generation
- 2D/3D transform synchronization
- design variant creation

## 6.6 Parametric Module Service
Responsible for:
- kitchen, wardrobe, TV, mandir, crockery, and other module templates
- editable parameters
- module geometry generation
- validation against room constraints
- conversion to production entities

## 6.7 Rule Engine Service
Responsible for:
- room-specific validations
- clearance checks
- material compatibility checks
- style and standards warnings
- hard-rule override auditing

## 6.8 Material and Catalog Service
Responsible for:
- materials
- laminates
- boards
- hardware
- product metadata
- vendor rate mapping
- finish packs

## 6.9 Render Service
Responsible for:
- preview render generation
- premium render job generation
- camera presets
- lighting preset application
- scene export for rendering
- render approval linkage

## 6.10 Drawing Service
Responsible for:
- floor plan outputs
- wall elevations
- reflected ceiling plans
- dimension overlays
- schedules

## 6.11 Pricing Service
Responsible for:
- room-wise costing
- module-wise costing
- material schedule totals
- estimate revisioning
- budget tracking

## 6.12 Proposal Service
Responsible for:
- proposal assembly
- room-wise story composition
- brand settings
- revisioned PDF generation

## 6.13 Approval Service
Responsible for:
- approval requests
- acceptance/rejection
- comment threads
- locking approved versions
- invalidating stale outputs

## 6.14 BOM / Cutlist Service
Responsible for:
- module-to-part translation
- formula-driven dimensions
- board usage logic
- hardware summary
- cutlist export

## 6.15 Deliverables Vault Service
Responsible for:
- asset registry
- document retrieval
- package downloads
- file history
- share link visibility

## 6.16 Memory and Similarity Service
Responsible for:
- design reuse
- render reuse
- room similarity search
- style similarity
- accepted/rejected pattern learning
- mistakes log enrichment

---

## 7. Canonical Data Flow

## 7.1 Intake Flow

```text
Lead created
  → project created
  → intake captured
  → room requirements stored
  → style/budget constraints stored
```

## 7.2 Plan Intelligence Flow

```text
Plan upload / scan upload
  → preprocessing
  → OCR and detection
  → confidence scoring
  → review package
  → user corrections
  → spatial graph finalized
  → initial scene shell created
```

## 7.3 Design Flow

```text
Scene shell
  → room templates suggested
  → parametric modules placed
  → materials and lights configured
  → design variant saved
  → renders and drawings generated
```

## 7.4 Approval Flow

```text
Render set / drawing set / proposal set generated
  → client review
  → comments captured
  → revisions requested or outputs approved
  → approved scene revision locked
```

## 7.5 Production Flow

```text
Approved scene revision
  → module schedule frozen
  → BOM generated
  → cutlist generated
  → deliverables packaged
```

---

## 8. Editor Architecture

## 8.1 2D Design Layer
Must support:
- wall display
- zones and room labels
- dimensions
- opening markers
- module footprints
- snapping
- ruler/grid
- annotation overlays

## 8.2 3D Design Layer
Must support:
- wall geometry
- ceiling and floor geometry
- module geometry
- furniture/props
- materials
- lights
- camera points
- clipping/section utilities later

## 8.3 Shared Scene State
Both 2D and 3D must read from the same scene model.

### Rule
There must never be a “plan only state” and a “3D only state” for the same room design.
They are two views of the same truth.

---

## 9. Rendering Architecture

## 9.1 Render Tiers

### Tier A — Draft Preview
- generated directly from interactive scene
- near-instant
- used in design sessions

### Tier B — Review Render
- medium-quality
- fast enough for decision-making
- suitable for internal reviews and first client look

### Tier C — Final Render
- premium output
- photoreal still or panorama
- suitable for client approval and proposal

## 9.2 Render Pipeline Stages
1. scene validation
2. camera selection
3. lighting preset application
4. material packing
5. scene export
6. renderer execution
7. QC validation
8. thumbnail generation
9. asset registration

## 9.3 Render Metadata
Each render must store:
- scene revision ID
- room ID
- camera ID
- lighting preset
- material pack ID
- render tier
- generator version
- approval status

---

## 10. Drawing Generation Architecture

## 10.1 Drawing Types
- annotated floor plan
- room plan
- each wall elevation
- ceiling plan
- module schedule sheet
- material schedule sheet

## 10.2 Drawing Pipeline
1. load locked scene or requested scene revision
2. compute room axes and wall order
3. extract relevant geometry
4. project geometry to drawing plane
5. place dimensions and annotations
6. apply branding / title block
7. generate SVG/PDF
8. register output asset

## 10.3 Mandatory Constraints
- drawings must be generated from exact scene revision
- all labels must be traceable to entity IDs
- stale drawings must be marked invalid after geometry change

---

## 11. Production Output Architecture

## 11.1 Required Inputs
- approved scene revision
- approved module states
- production settings preset
- material selections
- studio default formulas

## 11.2 Required Outputs
- module schedule
- part list
- BOM
- material summary
- edge-band summary
- cutlist CSV / PDF
- panel labels later

## 11.3 Rule
Production output must never derive directly from a render or informal annotation.
It must derive from structured approved module entities.

---

## 12. Storage Architecture

## 12.1 Structured Data Storage
Use Postgres for:
- entity tables
- revisions
- approvals
- job states
- comments
- metadata

## 12.2 Blob Storage
Use object storage for:
- originals
- images
- drawings
- PDFs
- render outputs
- scan attachments
- thumbnails

## 12.3 Cache / Queue Storage
Use Redis for:
- job scheduling
- transient cache
- progress tracking
- rate limiting

---

## 13. Async Job Architecture

## Required Job Types
- plan-analysis jobs
- OCR jobs
- scene-generation jobs
- preview render jobs
- premium render jobs
- drawing generation jobs
- proposal generation jobs
- BOM/cutlist generation jobs
- thumbnail jobs
- similarity-index jobs

## Required Job States
- queued
- running
- waiting-for-input
- succeeded
- failed
- canceled
- stale

## Required Metadata
- created by
- triggered by
- project ID
- scene revision ID when applicable
- retry count
- failure reason
- execution logs reference

---

## 14. Versioning Architecture

## Required Versioned Entities
- intake package
- floor plan interpretation
- scene graph
- room design variant
- render set
- drawing set
- proposal set
- BOM set
- cutlist set
- approval package

## Rules
- versions are immutable snapshots
- latest editable state may evolve, but approved snapshots must remain frozen
- outputs must store the exact source snapshot version they were generated from

---

## 15. Security and Access Architecture

## User Roles
- admin
- studio owner
- designer
- estimator
- production manager
- site capture executive
- client viewer

## Permissions Must Support
- who can edit scene geometry
- who can approve renders
- who can lock production versions
- who can view costing
- who can export deliverables
- who can override hard rules

---

## 16. Local-First and Cloud Modes

## Local-First Mode
Use for:
- studio demos
- single-office installs
- offline-like workflows

### Characteristics
- local file cache
- simplified auth
- local queue fallback
- possibly SQLite shadow mode for dev only

## Cloud Mode
Use for:
- production multi-user environment
- remote collaboration
- asset persistence
- scalable renders and jobs

### Characteristics
- Postgres
- Redis
- object storage
- worker processes
- separate AI/CV service

---

## 17. Failure Prevention Architecture

The architecture must actively prevent these failures:

### Failure A — Scene Drift
Fix by binding all outputs to scene revision IDs.

### Failure B — Hidden AI Errors
Fix by confidence review and user-confirmed correction flow.

### Failure C — Stale Outputs
Fix by invalidating render/drawing/proposal status after geometry/material changes.

### Failure D — Production Mismatch
Fix by deriving BOM/cutlist from approved module state only.

### Failure E — Data Fragmentation
Fix by forbidding disconnected modules with private truth models.

---

## 18. Recommended Initial Milestone Architecture

## Milestone 1
- project service
- intake service
- floor plan upload
- CV/OCR pipeline
- scene shell generator
- scene graph persistence

## Milestone 2
- linked 2D/3D editor
- room templates
- kitchen and wardrobe parametric modules
- materials service

## Milestone 3
- render pipeline
- drawing/elevation pipeline
- proposal generation
- approvals

## Milestone 4
- pricing engine
- BOM engine
- cutlist engine
- deliverables vault

## Milestone 5
- scan/as-built enhancements
- memory system
- similarity reuse
- collaboration and comments

---

## 19. Final Architecture Statement

> The system architecture must support a single source of truth for geometry, rules, approvals, outputs, and production handoff. Every service in the platform exists to enrich, validate, render, document, price, or export that truth — never to replace or fragment it.
