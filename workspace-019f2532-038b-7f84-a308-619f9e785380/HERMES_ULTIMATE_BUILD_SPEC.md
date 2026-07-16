# HERMES ULTIMATE BUILD SPEC

## Purpose
This document is the **master operating spec** for Hermes to keep building the full application until it becomes a production-grade, white-label, enterprise-ready AI workspace platform.

Hermes must treat this as the **source of truth** for:
- product direction
- architecture
- UI/UX standards
- reliability expectations
- service boundaries
- AURA integration
- delivery sequence

---

# 1. Product Mission

Build a **premium white-label enterprise AI workspace platform** with many tools, where **design and floorplan intelligence** are one major vertical, but not the only one.

The platform must be:
- self-hostable
- organization-aware
- extensible via tool registry
- safe for enterprise use
- resilient under provider failures
- visually premium and differentiated
- ready to evolve into SaaS later

The product should feel like:
- a **spatial intelligence studio**
- a **multi-tool AI operating system**
- a **premium professional product**, not a generic dashboard

---

# 2. North Star

Hermes is not building:
- a one-off demo
- a template dashboard
- a single-purpose design toy

Hermes is building:
- a **stable platform core**
- a **design intelligence vertical**
- a **modular tool ecosystem**
- a **high-end UX system**
- a **safe AURA intelligence layer**

---

# 3. Non-Negotiable Constraints

## Architecture
- local/self-hostable stack first
- PostgreSQL as primary database
- Redis for queue/cache
- MinIO or S3-compatible object storage
- Node/TypeScript API
- Worker service for async jobs
- Python vision service for geometry/OCR/CV
- Inference gateway for all model/provider routing
- Next.js frontend

## Tenanting
- all business data is organization-aware
- support DB-per-client deployments now
- keep future shared SaaS possible
- organization branding, provider configs, feature flags, and data policies must be first-class

## Reliability
- no heavy AI work in request handlers
- all expensive work must be async job based
- every model output must be schema-validated
- every provider call must go through a single inference gateway
- every critical output must be versioned
- every failure must degrade gracefully
- one broken tool must not break the whole platform

## AURA
AURA is the platform’s structured planning and critique intelligence system.
AURA may be used for:
- room semantics
- style planning
- palette/material planning
- circulation-aware recommendations
- prompt composition
- output critique
- preference-aware recommendations

AURA must NOT be used for:
- exact geometry extraction
- exact wall measurement
- authoritative CAD coordinates
- exact symbol coordinate generation

---

# 4. Product Scope

## Platform Core
Build these foundational systems first:
- auth/session foundation
- organizations
- memberships / roles
- branding
- feature flags
- provider configuration
- file storage abstraction
- job system
- tool registry
- audit logs
- observability hooks

## Design Vertical
Build these design capabilities:
1. floorplan upload
2. preprocessing
3. OCR and scale assistance
4. wall/opening/fixed-element extraction
5. room segmentation
6. layout manifest
7. correction workspace
8. deterministic canonical top-view rendering
9. enhanced top-view generation with geometry validation
10. zone extraction
11. zone design planning
12. quick render
13. detailed render
14. inpainting / material swaps / furniture replacement
15. upscaling
16. render critique
17. version history

## Multi-tool Platform
The app will eventually include more tools beyond design. Therefore:
- build all tools through a tool registry
- build generic tool execution patterns
- do not hardcode platform architecture around only design flows

---

# 5. Service Architecture

```text
Browser
  -> Web App (Next.js)
  -> API App (Node/TS)
       -> PostgreSQL
       -> Redis
       -> MinIO
       -> Job creation
       -> Tool registry
       -> Org resolution
  -> Worker App
       -> Vision service
       -> Inference gateway
       -> Artifact persistence
  -> Vision Service (Python/FastAPI)
       -> preprocessing
       -> OCR
       -> geometry
       -> validation
  -> Inference Gateway
       -> Aura routing
       -> image generation routing
       -> edit/upscale routing
       -> fallback chains
```

## Ownership Boundaries

### Web
Owns:
- page routing
- visual workflows
- previews
- canvas tools
- stateful UX
- feature-gated rendering

### API
Owns:
- auth/session
- org resolution
- permissions
- CRUD
- file registration
- job creation
- tool metadata
- audit logging

### Worker
Owns:
- long-running tasks
- retries
- provider polling
- validation and fallback
- result persistence

### Vision Service
Owns:
- deterministic analysis
- OCR
- layout extraction
- geometry validation

### Inference Gateway
Owns:
- provider selection
- capability routing
- circuit breakers
- fallbacks
- AURA model dispatch

---

# 6. Monorepo Shape

```text
/apps
  /web
  /api
  /worker
  /admin (optional)
/services
  /vision-python
  /inference-gateway
/packages
  /config
  /db
  /auth
  /org-context
  /permissions
  /storage
  /jobs
  /events
  /logger
  /observability
  /types
  /schemas
  /ui
  /tool-registry
  /aura-core
  /design-core
/docs
/infra
/scripts
```

Hermes must keep strong modular boundaries. No random cross-module imports.

---

# 7. Tool Registry Standard

Every tool must be defined through a tool registry.

Each tool definition must include:
- slug
- name
- category
- description
- UI route
- API namespace
- run mode (sync/async)
- capabilities
- permissions
- feature flags
- queue/job types
- service owner
- health dependencies
- input schema key
- output schema key

## Required tool categories
- design
- media
- docs
- analysis
- automation
- catalog
- admin

## Rule
No new tool may be added without a tool definition.

---

# 8. Data Model Expectations

All core tables must include organization scoping where relevant.

## Core platform tables
- organizations
- organization_branding
- feature_flags
- organization_features
- organization_provider_configs
- organization_ai_data_policy
- users
- memberships
- file_assets
- ai_jobs
- audit_logs
- tool_definitions
- organization_tool_overrides

## Design tables
- projects
- project_assets
- layout_analyses
- layout_overrides
- zones
- detected_objects
- style_preferences
- design_plans
- product_assignments
- render_history
- render_edits

## Catalog tables
- categories
- products
- product_images
- materials
- material_images

## AURA tables
- prompt_versions
- tasks
- feedback
- training_candidates
- eval_cases
- eval_runs
- eval_results
- preferences
- critique_results
- memory_items

Hermes must keep schema changes additive-first and migration-safe.

---

# 9. Storage Conventions

Do not store large binaries directly in PostgreSQL.
Use object storage for images, documents, masks, render outputs, exports, and references.

## Storage path convention
```text
/orgs/{orgId}/projects/{projectId}/uploads/source.png
/orgs/{orgId}/projects/{projectId}/analysis/manifest.json
/orgs/{orgId}/projects/{projectId}/analysis/canonical_topview.svg
/orgs/{orgId}/projects/{projectId}/analysis/enhanced_topview.png
/orgs/{orgId}/projects/{projectId}/zones/{zoneId}/thumbnail.png
/orgs/{orgId}/renders/{renderId}/base.png
/orgs/{orgId}/renders/{renderId}/edits/{editId}.png
```

All writes must use helper functions from the shared storage package.

---

# 10. API Architecture

## Platform APIs
- `/api/auth/*`
- `/api/orgs/*`
- `/api/users/*`
- `/api/files/*`
- `/api/jobs/*`
- `/api/tools/*`
- `/api/audit/*`
- `/api/features/*`
- `/api/aura/*`
- `/api/catalog/*`

## Design APIs
- `/api/design/projects/*`
- `/api/design/projects/:projectId/floorplans/*`
- `/api/design/projects/:projectId/zones/*`
- `/api/design/zones/:zoneId/design-plan`
- `/api/design/zones/:zoneId/renders/*`
- `/api/design/renders/:renderId/*`

## Rule
All API inputs and outputs must use shared schemas and validation.

---

# 11. Job System Rules

Every heavy operation must become a job.

## Example job types
- layout_preprocess
- layout_analyze
- canonical_render
- enhance_topview
- validate_enhanced
- aura_room_semantics
- aura_style_recommend
- aura_zone_design_plan
- aura_render_prompt_compose
- aura_render_critic
- quick_render
- detailed_render
- inpaint_render
- upscale_render

## Job lifecycle
- queued
- running
- waiting_provider
- validating
- completed
- failed
- cancelled
- dead_letter

## Reliability rules
- jobs must be idempotent where possible
- retries must use backoff
- dead letter queue must exist
- partial failure must not corrupt project state
- UI must be able to poll job state cleanly

---

# 12. Floorplan Pipeline Rules

## True source of truth
The **layout manifest** is the structured truth, not the enhanced image.

## Pipeline
1. upload floorplan
2. preprocess image
3. OCR + scale hints
4. wall extraction
5. opening/fixed-element extraction
6. room segmentation
7. layout manifest generation
8. user correction
9. canonical deterministic top-view
10. optional enhanced top-view
11. geometry validation
12. zone extraction
13. zone planning
14. rendering

## Non-negotiables
- never jump directly from raw scan to stylized enhancement without structured manifest
- deterministic geometry comes before generative polish
- if enhanced top-view fails validation, fall back to canonical deterministic output

---

# 13. AURA Architecture

AURA is a **structured subsystem**, not a generic chat endpoint.

## Modules
- `room_semantics.ts`
- `style_recommender.ts`
- `zone_design_planner.ts`
- `render_prompt_composer.ts`
- `render_critic.ts`
- `aura_client.ts`
- `aura_prompts.ts`
- `aura_schemas.ts`
- `aura_memory.ts`
- `aura_feedback.ts`
- `aura_eval.ts`

## AURA operating principles
- all outputs must be JSON
- all outputs must be schema validated
- uncertainty must be explicit
- must include `must_keep` and `must_avoid` where relevant
- all feedback must be logged
- future self-improvement must happen through curated offline iteration, not uncontrolled live retraining

## AURA memory sources
- org rules
- style presets
- accepted plans
- rejected plans
- critique history
- prompt versions
- user edits

---

# 14. Vision / Model Strategy

Hermes must build the system so model backends are swappable.

## Suggested current defaults
- main visual analyst: Qwen2.5-VL-3B-class model
- lightweight fallback: SmolVLM2-class model
- utility OCR/grounding: Florence-2-class extractor

## Important
The codebase must not assume any single provider/model forever.
All model use must route through the inference gateway by capability.

---

# 15. UI/UX Direction

The UI must NOT feel like a generic admin SaaS app.
It must feel like a **premium spatial intelligence studio**.

## Design qualities
- dark-first, premium, calm, architectural
- big preview/canvas surfaces
- refined transitions
- large visual hierarchy
- strong compare/reveal moments
- minimal clutter
- workflow-guided

## Core design shells
- left rail navigation
- top workflow/context bar
- immersive main workspace
- optional right intelligence panel

## Key workflow screens
1. project creation / upload
2. preprocessing status
3. analysis review
4. correction workspace
5. canonical top-view preview
6. enhanced top-view preview
7. zone browser
8. zone design planning
9. quick render workspace
10. detailed render workspace
11. inpaint/edit workspace
12. version history / timeline

## UX rules
- always show current project + current stage
- never show dead feature shells when disabled
- loading states must be meaningful
- failures must be actionable
- compare tools must feel premium
- history must feel like creative evolution, not a table dump

---

# 16. Reliability & Safety Rules

Hermes must engineer for graceful failure.

## Rules
1. every model output must be schema-validated
2. every provider call must go through inference gateway
3. provider circuit breakers must exist
4. fallback chains must exist
5. every tool must fail independently
6. version everything important
7. destructive mutations must be auditable
8. heavy tasks must be isolated in workers
9. canonical deterministic outputs must remain usable even when AI is degraded
10. users must always be able to inspect the last known good state

## Examples of graceful degradation
- If AURA fails -> project still usable, manual editing still works
- If image generation fails -> canonical plan and design plan still available
- If OCR weak -> require calibration/manual correction instead of blocking everything
- If enhanced top-view fails validation -> fallback to canonical output

---

# 17. Observability Rules

The platform must be deeply observable.

## Must have
- structured logs
- request IDs
- correlation IDs
- job IDs
- provider call IDs
- queue metrics
- model parse failure metrics
- feature/tool success metrics

## Track at minimum
- job success rate
- job latency
- provider latency
- provider error rate
- AURA parse validity rate
- correction rate after AURA output
- render approval rate
- enhanced-topview validation pass rate

---

# 18. Security & Enterprise Rules

- never expose provider secrets to frontend
- isolate org data strictly
- support organization AI data policy controls
- support audit logging for all important mutations
- keep design ready for SSO later
- preserve organization-level provider configuration isolation
- preserve organization-level branding and feature isolation

---

# 19. Build Order Hermes Must Follow

Hermes must not jump around randomly.
Use this exact phased sequence.

## Phase 1 — Platform Foundation
- monorepo scaffolding
- config/env system
- db package
- auth/org model
- memberships/roles
- branding
- feature flags
- provider configs
- storage abstraction
- tool registry
- audit logs

## Phase 2 — Operational Backbone
- API scaffolding
- worker scaffolding
- job system
- file upload/registration
- inference gateway shell
- observability hooks

## Phase 3 — Design Intelligence Foundation
- vision service
- floorplan upload flow
- preprocessing
- OCR
- room segmentation
- manifest generation
- canonical deterministic renderer

## Phase 4 — AURA Integration
- schemas
- prompt library
- aura client
- room semantics
- style recommendation
- zone design planner
- prompt composer
- critic
- feedback hooks

## Phase 5 — Design UX
- upload screen
- processing states
- analysis review
- correction workspace
- canonical preview
- enhanced preview
- zone browser
- planning workspace

## Phase 6 — Rendering
- quick render
- detailed render
- render history
- inpaint
- upscale
- critic actions
- compare/version timeline

## Phase 7 — Hardening
- test coverage
- fallback flows
- dead letter jobs
- docs
- admin controls
- privacy policy enforcement
- eval pipeline

---

# 20. Definition of Done Per Module

A module is NOT done unless it includes:
- implementation
- schema validation
- tests or at minimum smoke checks
- documentation
- error states
- logging
- type-safe interfaces

A tool is NOT done unless:
- it is registered in tool registry
- it has routes and schemas
- it has feature flag support
- it supports failure isolation
- it can be observed in logs/jobs

---

# 21. Hermes Iteration Protocol

For every work cycle Hermes must:

1. inspect current repo structure
2. identify current missing phase/component
3. produce a concise build plan
4. implement smallest coherent vertical slice
5. wire schemas + types + logging
6. add docs
7. verify no existing features are broken
8. move to next dependency-safe slice

## Hermes must avoid
- giant unreviewable rewrites
- random architecture changes midstream
- adding providers directly into business logic
- bypassing schemas
- building UI before data shape is stable
- building AI magic without fallback or validation

---

# 22. What Success Looks Like

Success means Hermes has built a platform where:
- organizations can be created and branded
- tools are feature-gated and registry-driven
- floorplans can be uploaded, analyzed, corrected, and rendered
- AURA produces structured design intelligence
- renders can be critiqued, edited, versioned, and compared
- the system works locally/self-hosted
- one provider outage does not collapse the product
- the platform can keep expanding to more tools cleanly

---

# 23. Final Operating Command to Hermes

Use this as the active instruction:

> Build this product as a premium, self-hostable, enterprise AI workspace platform with a stable platform core, a powerful design intelligence vertical, a modular tool ecosystem, and a safe AURA intelligence layer. Prioritize architectural correctness, reliability, schema safety, feature isolation, and differentiated UX over speed hacks or demo shortcuts.

> Continue iteratively until the platform is production-grade, documentation-backed, locally runnable, and coherent across platform, design, and AURA domains.

---

# 24. Immediate Next Action

Hermes should begin by:
1. auditing the existing repo
2. aligning it to this architecture
3. identifying the current phase
4. implementing the next missing foundational slice before any polish work

If there is ambiguity, Hermes must choose the option that is:
- more modular
- more enterprise-safe
- more recoverable
- more schema-driven
- less brittle

---

# End of Master Spec
