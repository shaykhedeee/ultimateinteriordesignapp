# HERMES EXECUTION CHECKLIST

## Purpose
This file is the **phase-by-phase execution tracker** for Hermes.

It exists to ensure Hermes:
- builds in the correct order
- does not skip foundations
- does not over-focus on one feature prematurely
- always knows what “done” means
- can continue iterating toward a full production-grade app

This checklist must be used together with:
- `HERMES_ULTIMATE_BUILD_SPEC.md`
- `HERMES_ULTIMATE_UI_SPEC.md`

---

# 0. Global Operating Rules

Before each work cycle, Hermes must:

1. Read `HERMES_ULTIMATE_BUILD_SPEC.md`
2. Read `HERMES_ULTIMATE_UI_SPEC.md`
3. Read this checklist
4. Audit current repo state
5. Identify current phase
6. Identify incomplete items in the current phase
7. Implement the next **smallest coherent slice**
8. Verify no previous slice broke
9. Update docs/comments/tests where needed

## Critical rule
Hermes must not jump ahead to polish or advanced AI features if the platform foundations are incomplete.

---

# 1. Phase 1 — Platform Foundation

## Objective
Establish the stable platform core for a white-label, enterprise-safe, self-hostable app.

## Checklist
- [ ] Monorepo scaffold exists and is cleanly organized
- [ ] `apps/`, `services/`, `packages/`, `infra/`, `docs/` structure exists
- [ ] Shared TypeScript config is set up
- [ ] Shared package management is working
- [ ] Environment variable strategy exists
- [ ] Local dev scripts exist
- [ ] Root README explains how to run the platform

## Auth + org foundation
- [ ] Organization model exists
- [ ] Membership model exists
- [ ] Role model exists (`org_owner`, `admin`, `designer`, `reviewer`, `viewer`)
- [ ] Current organization resolution logic exists
- [ ] Basic auth/session handling exists
- [ ] Route/API access can resolve org safely

## White-label foundation
- [ ] Branding model exists
- [ ] Feature flag model exists
- [ ] Provider config model exists
- [ ] AI data policy model exists
- [ ] Organization tool overrides exist

## Done means done
Phase 1 is complete only when:
- an organization can exist
- a user can belong to an organization
- the app can resolve active org context
- branding/features/provider config have a persistent home
- local dev bootstraps without manual hacks

---

# 2. Phase 2 — Storage, Files, and Operational Backbone

## Objective
Create the infrastructure layer the whole app relies on.

## Checklist
- [ ] PostgreSQL integration is working
- [ ] Redis integration is working
- [ ] MinIO/S3-compatible storage integration is working
- [ ] Shared file path builder exists
- [ ] File asset DB model is integrated
- [ ] Presign/register file flow exists
- [ ] Private/public bucket logic exists

## Jobs backbone
- [ ] `ai_jobs` model is integrated
- [ ] Queue factory exists
- [ ] Worker can consume jobs
- [ ] Job states are standardized
- [ ] Job polling API exists
- [ ] Retry logic exists
- [ ] Dead-letter handling exists or is scaffolded

## Observability foundation
- [ ] Structured logging exists
- [ ] Request IDs are supported
- [ ] Correlation IDs are supported
- [ ] Job IDs are logged consistently

## Done means done
Phase 2 is complete only when:
- files can be uploaded and registered
- jobs can be created and polled
- workers can process a no-op or test job
- storage + DB + queue work together locally

---

# 3. Phase 3 — Tool Registry + Platform Routing

## Objective
Make the platform extensible for many tools beyond design.

## Checklist
- [ ] Tool registry package exists
- [ ] Tool definition schema exists
- [ ] Tool categories exist
- [ ] Capability vocabulary exists
- [ ] Feature-flag-aware tool lookup exists
- [ ] Permission-aware tool metadata exists
- [ ] Org overrides can enable/disable tools
- [ ] API route discovery can map tools cleanly

## Frontend routing
- [ ] `/app/tools` shell exists
- [ ] Tool pages can resolve from registry metadata
- [ ] Hidden tools do not show when disabled

## Done means done
Phase 3 is complete only when:
- tools are definable through registry, not hardcoded page logic
- org-specific tool visibility is possible
- the platform is no longer design-only in structure

---

# 4. Phase 4 — Core API and Domain Structure

## Objective
Establish clean domain boundaries in API/backend.

## Checklist
- [ ] API app modules are split by domain
- [ ] Platform APIs exist for auth/orgs/users/files/jobs/tools
- [ ] Design domain namespace exists
- [ ] Catalog namespace exists
- [ ] Aura namespace exists
- [ ] Shared schema validation exists
- [ ] Request/response contracts are typed
- [ ] Permissions are enforced via reusable helpers/guards
- [ ] Audit log writes exist for critical mutations

## Done means done
Phase 4 is complete only when:
- backend modules are no longer ad hoc
- platform and domain APIs are clearly separated
- validation is consistent
- audit logging exists for important operations

---

# 5. Phase 5 — Vision Service Foundation

## Objective
Build deterministic floorplan intelligence before any generative enhancement.

## Checklist
- [ ] FastAPI vision service exists
- [ ] Health endpoint exists
- [ ] `/preprocess` endpoint exists
- [ ] `/analyze` endpoint exists
- [ ] `/validate-enhanced` endpoint exists

## Processing modules
- [ ] preprocess module exists
- [ ] OCR module exists
- [ ] line extraction module exists
- [ ] wall inference module exists
- [ ] openings module exists
- [ ] symbol/fixed-element module exists
- [ ] room segmentation module exists
- [ ] manifest builder exists
- [ ] geometry validation exists

## Done means done
Phase 5 is complete only when:
- a floorplan can be processed into a structured manifest
- confidence/ambiguity can be surfaced
- the service can run locally and be called from worker/API

---

# 6. Phase 6 — Design Domain Data Flow

## Objective
Make projects and floorplans flow through the system correctly.

## Checklist
- [ ] Projects CRUD exists
- [ ] Project assets linkage exists
- [ ] Layout analysis persistence exists
- [ ] Layout overrides persistence exists
- [ ] Zones persistence exists
- [ ] Detected objects persistence exists
- [ ] Style preferences persistence exists
- [ ] Design plans persistence exists
- [ ] Product assignments persistence exists
- [ ] Render history persistence exists
- [ ] Render edits persistence exists

## Done means done
Phase 6 is complete only when:
- project -> analysis -> zones -> plans -> renders have DB support
- no core design workflow step is relying on temporary in-memory state

---

# 7. Phase 7 — Canonical Deterministic Renderer

## Objective
Build the geometry-safe, deterministic plan renderer.

## Checklist
- [ ] Canonical top-view renderer exists
- [ ] Renderer accepts layout manifest input
- [ ] SVG output works
- [ ] PNG output works
- [ ] View presets exist (`technical_clean`, `presentation_minimal`, `soft_zoning`)
- [ ] Outputs are stored in object storage
- [ ] Project/layout records link to output assets
- [ ] Compare mode with original plan is feasible in UI

## Done means done
Phase 7 is complete only when:
- the app can produce a trustworthy cleaned plan without AI generation
- this canonical output is usable as a fallback and as a product output itself

---

# 8. Phase 8 — AURA Core Integration

## Objective
Create the structured intelligence layer for planning and critique.

## Checklist
- [ ] `aura-core` package exists
- [ ] `aura_client.ts` exists
- [ ] `aura_prompts.ts` exists
- [ ] `aura_schemas.ts` exists
- [ ] `aura_memory.ts` exists
- [ ] `aura_feedback.ts` exists
- [ ] `aura_eval.ts` exists

## Module checklist
- [ ] `room_semantics.ts`
- [ ] `style_recommender.ts`
- [ ] `zone_design_planner.ts`
- [ ] `render_prompt_composer.ts`
- [ ] `render_critic.ts`

## Rules checklist
- [ ] Outputs are JSON-only
- [ ] Outputs are schema validated
- [ ] Retry on malformed model output exists
- [ ] Uncertainty is preserved
- [ ] `must_keep` and `must_avoid` are required where relevant

## Done means done
Phase 8 is complete only when:
- AURA can be invoked through typed service methods
- each major AURA task has a schema and prompt path
- outputs are stored/logged reproducibly

---

# 9. Phase 9 — Inference Gateway + Provider Routing

## Objective
Centralize all provider/model interactions safely.

## Checklist
- [ ] Inference gateway exists
- [ ] Capability-based routing exists
- [ ] Provider adapter structure exists
- [ ] Circuit breaker logic exists or is scaffolded
- [ ] Fallback chains exist
- [ ] Provider config lookup by org exists
- [ ] Local model support is possible
- [ ] AURA tasks route through gateway
- [ ] Image generation/edit/upscale can route through gateway

## Done means done
Phase 9 is complete only when:
- no domain service calls external AI providers directly
- provider failures can be isolated and rerouted safely

---

# 10. Phase 10 — Design Workflow Jobs

## Objective
Turn the design workflow into a durable async system.

## Checklist
- [ ] `layout_preprocess` job works
- [ ] `layout_analyze` job works
- [ ] `canonical_render` job works
- [ ] `enhance_topview` job works
- [ ] `validate_enhanced` job works
- [ ] `aura_room_semantics` job works
- [ ] `aura_zone_design_plan` job works
- [ ] `quick_render` job works
- [ ] `detailed_render` job works
- [ ] `inpaint_render` job works
- [ ] `upscale_render` job works

## Done means done
Phase 10 is complete only when:
- major user-facing design actions are fully async and stateful
- job progress is persistently visible
- failures don’t corrupt project state

---

# 11. Phase 11 — Premium App Shell + Global UI System

## Objective
Build the visual foundation of the product before over-building individual pages.

## Checklist
- [ ] App shell exists
- [ ] Left rail exists
- [ ] Top context bar exists
- [ ] Workspace frame exists
- [ ] Theme provider exists
- [ ] White-label branding integration exists
- [ ] Typography system exists
- [ ] Token system exists (colors, spacing, radius, shadows, motion)
- [ ] Basic status/feedback components exist

## Required components
- [ ] `AppShell`
- [ ] `LeftRail`
- [ ] `TopContextBar`
- [ ] `WorkspaceFrame`
- [ ] `StatusPill`
- [ ] `ConfidenceBadge`
- [ ] `ValidationBadge`
- [ ] `FeatureGate`
- [ ] `PremiumEmptyState`
- [ ] `StructuredErrorState`
- [ ] `LoadingSkeletonSurface`

## Done means done
Phase 11 is complete only when:
- the app no longer looks like scaffolding
- all later pages can build on a premium shell
- tenant branding can affect the UI safely

---

# 12. Phase 12 — Upload / Processing / Analysis UX

## Objective
Create the first polished user-facing workflow.

## Checklist
- [ ] Project creation/upload screen exists
- [ ] Processing status screen exists
- [ ] Analysis review screen exists
- [ ] Compare view between original and interpreted output exists
- [ ] Confidence + ambiguity surfacing exists
- [ ] CTA path to correction exists

## UX quality checks
- [ ] upload feels premium
- [ ] processing is not spinner-only
- [ ] analysis review is understandable in <10 seconds
- [ ] warnings are visible but not chaotic

## Done means done
Phase 12 is complete only when:
- a user can upload a floorplan and understand what the system found

---

# 13. Phase 13 — Correction Workspace UX

## Objective
Create the precision editing studio for floorplan correction.

## Checklist
- [ ] correction canvas exists
- [ ] tool modes exist
- [ ] relabel room interaction exists
- [ ] calibration tool exists
- [ ] draw wall interaction exists
- [ ] opening adjustment exists
- [ ] merge/split room flow exists
- [ ] inspector panel exists
- [ ] undo/redo exists

## UX quality checks
- [ ] tool switching is smooth
- [ ] interactions feel precise
- [ ] keyboard shortcuts exist for core tools
- [ ] correction state is recoverable

## Done means done
Phase 13 is complete only when:
- the user can confidently fix analysis mistakes without developer intervention

---

# 14. Phase 14 — Canonical + Enhanced Top-View UX

## Objective
Create the trust + wow moments for plan outputs.

## Checklist
- [ ] canonical top-view page exists
- [ ] enhanced top-view page exists
- [ ] compare slider exists
- [ ] side-by-side compare exists
- [ ] validation pass/fail badge exists
- [ ] retry/revert/accept flows exist
- [ ] enhancement metadata is visible

## UX quality checks
- [ ] canonical plan feels trustworthy
- [ ] enhanced reveal feels premium
- [ ] fallback to canonical is clean when enhancement fails

## Done means done
Phase 14 is complete only when:
- the user can clearly compare and trust plan outputs

---

# 15. Phase 15 — Zone Browser + Design Planning UX

## Objective
Make zones feel like intelligent design scenes.

## Checklist
- [ ] zone browser exists
- [ ] zone thumbnails exist
- [ ] mini plan navigator exists
- [ ] zone selection state exists
- [ ] zone design planning workspace exists
- [ ] AURA recommendations are rendered in structured cards
- [ ] must_keep / must_avoid are visible
- [ ] palette/material/product guidance is visible

## Done means done
Phase 15 is complete only when:
- a zone can be selected and meaningfully planned before rendering

---

# 16. Phase 16 — Quick Render UX + Pipeline

## Objective
Enable fast ideation with controlled outputs.

## Checklist
- [ ] quick render API/job works
- [ ] quick render workspace exists
- [ ] reference inputs work
- [ ] gallery of outputs works
- [ ] accept candidate action exists
- [ ] send-to-detailed action exists
- [ ] render history integration exists

## Done means done
Phase 16 is complete only when:
- users can ideate visually with fast render cycles and save outcomes

---

# 17. Phase 17 — Detailed Render UX + Pipeline

## Objective
Create the premium control-room rendering experience.

## Checklist
- [ ] detailed render API/job works
- [ ] detailed render workspace exists
- [ ] material/product refs can be attached
- [ ] camera controls exist
- [ ] plan/design context inspector exists
- [ ] AURA prompt composition is integrated
- [ ] render result persists cleanly

## Done means done
Phase 17 is complete only when:
- users can generate higher-quality room outputs with explicit context and control

---

# 18. Phase 18 — Inpaint / Edit / Upscale UX + Pipeline

## Objective
Enable localized, branch-safe refinements.

## Checklist
- [ ] inpaint/edit workspace exists
- [ ] mask tools exist
- [ ] edit types exist (swap/replace/add/remove/lighting)
- [ ] inpaint job works
- [ ] upscale job works
- [ ] branch render/version flow exists
- [ ] parent-child render lineage works

## Done means done
Phase 18 is complete only when:
- users can refine a render locally without full rerender dependence

---

# 19. Phase 19 — Critique + Version Timeline

## Objective
Make the system intelligently evaluative and traceable.

## Checklist
- [ ] render critic service works
- [ ] critique result is visible in UI
- [ ] version browser exists
- [ ] version timeline exists
- [ ] compare versions exists
- [ ] branch lineage exists
- [ ] version restore flow exists

## Done means done
Phase 19 is complete only when:
- users can understand quality, lineage, and iteration history clearly

---

# 20. Phase 20 — Catalog Integration

## Objective
Connect planning and rendering to real product/material data.

## Checklist
- [ ] catalog products CRUD exists
- [ ] catalog materials CRUD exists
- [ ] product images/material images work
- [ ] search/filter exists
- [ ] product assignment flow exists
- [ ] AURA can use catalog context
- [ ] render prompt composition can use selected references

## Done means done
Phase 20 is complete only when:
- the app can use real org-specific product/material context in planning and rendering

---

# 21. Phase 21 — AURA Feedback + Self-Improvement Layer

## Objective
Capture the data needed for safe continuous improvement.

## Checklist
- [ ] `aura_tasks` logging works
- [ ] `aura_feedback` capture works
- [ ] `aura_prompt_versions` is in use
- [ ] `aura_training_candidates` curation flow exists
- [ ] `aura_eval_cases` and `aura_eval_runs` are usable
- [ ] `aura_preferences` retrieval works
- [ ] memory item storage works
- [ ] org AI data policy is enforced

## Done means done
Phase 21 is complete only when:
- AURA outputs are traceable, rated, versioned, and curation-ready

---

# 22. Phase 22 — Hardening & Reliability

## Objective
Make the platform robust enough for enterprise trust.

## Checklist
- [ ] fallback chains are implemented for key capabilities
- [ ] provider circuit breakers exist
- [ ] health endpoints exist for all services
- [ ] storage failures degrade safely
- [ ] provider failures degrade safely
- [ ] vision failures degrade safely
- [ ] destructive mutations are audited
- [ ] restore/retry flows exist for jobs
- [ ] error states are polished in UI

## Done means done
Phase 22 is complete only when:
- failures are isolated and recoverable
- the app does not catastrophically break from one subsystem failure

---

# 23. Phase 23 — Testing & Verification

## Objective
Reduce regressions and fragile behavior.

## Checklist
- [ ] unit tests for schemas and critical service logic
- [ ] integration tests for file/job/storage flows
- [ ] integration tests for project -> manifest -> canonical path
- [ ] smoke tests for AURA output parsing
- [ ] tests for provider routing
- [ ] tests for org scoping
- [ ] tests for feature gate behavior
- [ ] tests for render lineage

## Done means done
Phase 23 is complete only when:
- major workflows can be verified automatically
- schema regressions and auth leaks are unlikely

---

# 24. Phase 24 — Documentation & Operational Readiness

## Objective
Make the system maintainable beyond the build phase.

## Checklist
- [ ] architecture docs exist
- [ ] service boundaries doc exists
- [ ] local dev runbook exists
- [ ] deployment runbook exists
- [ ] incident response basics exist
- [ ] provider failover doc exists
- [ ] AURA usage/limitations doc exists
- [ ] tool registry doc exists
- [ ] data retention / AI policy doc exists

## Done means done
Phase 24 is complete only when:
- another engineer can run, reason about, and maintain the platform

---

# 25. “Never Break” Quality Gate

Before Hermes marks the platform as mature, it must verify:

- [ ] every major tool can fail independently without collapsing the app
- [ ] every major AI output is schema validated
- [ ] every long-running task is job-based
- [ ] every important artifact is versioned
- [ ] every org-sensitive flow respects organization scoping
- [ ] every core UI flow has empty/loading/error states
- [ ] every major screen meets the premium UI bar from the UI spec
- [ ] AURA is structured, not chat-spaghetti
- [ ] local dev setup works from clean state
- [ ] docs are usable by a real team

---

# 26. Definition of “Full Fledged App”

Hermes may consider the platform “full fledged” only when all of the following are true:

## Platform
- [ ] org-aware
- [ ] white-label capable
- [ ] self-hostable
- [ ] tool-registry-driven
- [ ] operationally observable

## Design vertical
- [ ] floorplan upload -> analysis -> correction -> canonical -> enhancement -> zones -> planning -> render -> edit -> history works end-to-end

## AURA
- [ ] supports semantics, planning, prompt composition, critique, feedback, and eval readiness

## UI
- [ ] the app feels premium, distinctive, and presentation-worthy

## Reliability
- [ ] core failures degrade gracefully
- [ ] jobs, providers, and outputs are traceable

## Maintainability
- [ ] docs, types, schemas, and tests are in place

---

# 27. Hermes Daily Prompt Template

Use this at the start of each working session:

```text
Read:
1. HERMES_ULTIMATE_BUILD_SPEC.md
2. HERMES_ULTIMATE_UI_SPEC.md
3. HERMES_EXECUTION_CHECKLIST.md

Then:
- inspect the current repo
- identify the current phase from the checklist
- list incomplete items in that phase
- pick the next smallest complete vertical slice
- implement it without breaking previous work
- keep architecture, reliability, and premium UI standards aligned to the specs
```

---

# 28. Final Instruction

Hermes must continue iterating until:
- foundational architecture is correct
- premium UI is achieved
- AURA is integrated safely
- the design workflow is end-to-end functional
- the platform can expand cleanly to additional tools

If there is ever a tradeoff between:
- speed vs correctness
- flashiness vs premium clarity
- AI shortcut vs deterministic safety
- local hack vs scalable structure

Hermes must choose:
- correctness
- premium clarity
- deterministic safety
- scalable structure

---

# End of Execution Checklist
