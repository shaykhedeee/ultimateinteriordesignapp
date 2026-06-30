# Ultimate Interior Designer App — AI Build Spec Index

This folder defines the exact app to build.

It is written so an AI coding agent, engineering team, or technical architect can implement the product with minimal ambiguity.

## Build Objective

Build the **best interior design operating system in the market** for Indian modular interiors and premium residential/commercial interior workflows.

This product is **not** just a render generator.
It is a **geometry-first, workflow-connected, production-aware design platform** that turns:

- lead capture
- client discovery
- floor plan uploads / scans
- room intelligence
- editable 2D / 3D design
- renders and walkthroughs
- wall elevations and drawings
- budgets and proposals
- approvals and revisions
- BOM / cutlists / production handoff

into **one connected system**.

## Non-Negotiable Product Truth

The source of truth for the app must be a **canonical spatial model / scene graph**, not an AI image.

That means:

- AI images are outputs, not the design truth.
- All renders, drawings, elevations, schedules, and cutlists must come from the same scene data.
- Every room, wall, opening, module, material, and camera must be persistable and editable.
- Indian modular interior rules must be first-class system logic.

## Files in This Spec

### 00_MASTER_PRODUCT_VISION_AND_NON_NEGOTIABLES.md
Defines the exact product vision, market position, non-negotiable constraints, user roles, and success criteria.

### 01_COMPETITOR_FEATURE_SUPERSET_AND_DIFFERENTIATION.md
Defines what to borrow from Planner 5D, Coohom, Foyr, Homestyler, RoomSketcher, Cedreo, magicplan, and Matterport — and how to build a product that surpasses them.

### 02_SYSTEM_ARCHITECTURE_AND_SERVICE_MAP.md
Defines the exact technical architecture, services, processing pipelines, queues, storage, rendering stack, AI stack, and deployment shape.

### 03_CANONICAL_SCHEMA_AND_DATA_MODEL.md
Defines the canonical data model, database schema, key entities, relations, JSON payloads, and scene graph structures.

### 04_API_CONTRACTS_PIPELINE_STATES_AND_JOBS.md
Defines the API contracts, job lifecycle, workflow stages, approval gates, async processing, and event-driven behaviors.

### 05_RULE_ENGINE_PARAMETRIC_MODULES_AND_INDIAN_STANDARDS.md
Defines the rule engine, module logic, Indian design standards, validations, and parametric module contracts.

### 06_AI_AGENT_BUILD_RULES_AND_IMPLEMENTATION_GUARDRAILS.md
Defines exact build instructions for AI coding agents, folder structure, engineering rules, failure prevention, testing expectations, and definition of done.

### 07_IMPLEMENTATION_BACKLOG_AND_ACCEPTANCE_CRITERIA.md
Defines milestone-by-milestone implementation backlog and acceptance criteria.

### 08_COMPETITIVE_PLATFORM_REVERSE_ENGINEERING_AND_SUPERSET_STRATEGY.md
Deep competitor scan and inferred platform architecture analysis for Foyr, RoomSketcher, Cedreo, and Matterport, plus the exact superset strategy.

### 09_FULL_PRODUCT_REQUIREMENTS_DOCUMENT_PRD.md
Full PRD with product goals, personas, scope, functional requirements, non-functional requirements, release plan, metrics, and acceptance criteria.

### 10_EXACT_DATABASE_SCHEMA_POSTGRES.sql
Exact Postgres schema for the core platform.

### 11_OPENAPI_CONTRACTS.yaml
OpenAPI contract for the core application API.

### 12_UI_UX_SCREEN_MAP_AND_WIREFRAME_STRUCTURE.md
Detailed UI/UX screen map, layout logic, wireframe structures, and interaction rules.

### 13_INDIAN_INTERIOR_COMPANY_OPERATING_FLOW_AND_COMMERCIAL_PIPELINE.md
Deep India-specific interior company pipeline covering estimate, quote, payment, execution, handover, and warranty.

### 14_QUOTATION_ESTIMATION_BILLING_PROCUREMENT_AND_VARIATION_SYSTEM.md
Detailed commercial-system design for estimates, BOQ quotes, invoices, milestone billing, procurement, and variations.

### 15_BUDGET_FIRST_DESIGN_ENGINE_AND_MATERIAL_SELECTION_SYSTEM.md
Defines the budget-first design engine and material recommendation logic.

### sql_migrations/
Split migration pack, including commercial tables.

### typescript_contracts/
Implementation-grade TypeScript contract pack with interfaces, enums, DTOs, and zod validators.

### rule_seeds/
Initial JSON rule seed files for global, kitchen, wardrobe, TV, mandir, lighting, Vastu, production preset, and budget policies.

### 16_COMMERCIAL_API_EXTENSION.yaml
Commercial API extension for budgets, estimates, invoices, payments, purchase orders, and variations.

### 17_OPEN_SOURCE_FOUNDATIONS_AND_REUSE_STRATEGY.md
Open-source reuse strategy for editor, CV, commercial, and rendering foundations.

### 18_COST_TIMELINE_SCALABILITY_AND_FASTEST_EXECUTION_PLAN.md
Recommended execution plan, cost structure, scalability shape, and fastest realistic rollout plan.

### 19_COMPETITOR_STRENGTH_TO_BUILD_DECISIONS.md
Maps competitor strengths directly into build decisions.

### 20_FACT_CHECKED_COMPETITOR_AND_OSS_RESEARCH_NOTES.md
Short fact-checked research notes summarizing official competitor surfaces and open-source building block findings.

### 21_VASTU_AND_INDIAN_INTERIORS_KNOWLEDGE_BASE.md
Deeper India-specific knowledge base for Vastu-sensitive and Indian modular interior logic.

### 22_EXPANDED_MASTER_ARCHITECTURE_FOR_EVERYTHING.md
Consolidated architecture map across design, commercial, execution, and post-handover systems.

### 23_AGENTIC_OS_OODA_INFINITE_BRAIN_INTEGRATION.md
Platform-agnostic agentic OS architecture for ingestion, orientation, routing, wagers, verdicts, and mission control.

### 24_DETAILED_END_TO_END_USER_FLOW.md
Detailed step-by-step user flow from lead to warranty and after-sales support.

### 25_AI_CODER_MASTER_PROMPT_FOR_2D_3D_DESIGN_ENGINE.md
Copy-paste master prompt for an AI coding system to build the 2D/3D design engine properly.

### 26_LIGHTWEIGHT_WEB_2D_3D_IMPLEMENTATION_PLAYBOOK.md
Implementation best practices for fast, lightweight web-based 2D/3D design editing.

### 27_IMPLEMENTED_2D_3D_EDITOR_ARCHITECTURE_NOTES.md
Notes describing the actual implemented editor architecture in the scaffold.

### 28_PHASE_2C_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2C in the scaffold.

### 29_PHASE_2D_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2D in the scaffold.

### 30_WEBGL_REACT_THREE_FIBER_UPGRADE_PATH.md
Full upgrade path from lightweight 3D preview to performant react-three-fiber architecture.

### 31_ADVANCED_MODULE_CONFIGURATOR_ARCHITECTURE.md
Architecture for advanced interior-specific module configurators.

### 32_PHASE_2E_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2E in the scaffold.

### 33_PHASE_2F_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2F in the scaffold.

### 34_PHASE_2G_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2G in the scaffold.

### 35_FURNITURE_AND_ROOM_OBJECT_CATALOG_STRATEGY.md
Furniture and room object catalog strategy for design-usable assets.

### 36_FLOORPLAN_TO_EDITABLE_3D_MAIN_EXPERIENCE.md
Defines the main floorplan → calibration → annotation → editable 3D → render → drawing → production loop.

### 37_AURA_BLUEPRINT_ADAPTATION_AND_DECISION_LOG.md
Decision log translating the supplied AURA blueprint into practical implementation choices.

### 38_BLUEPRINT_TO_CURRENT_REPO_MAPPING.md
Maps the large AURA blueprint ideas to the current StudioOS repository structure.

### 39_PHASE_2H_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2H in the scaffold.

### 40_AURA_IMPLEMENTATION_PACK_DEEP_ANALYSIS_AND_ADAPTATION.md
Deep scan of the later AURA implementation pack and exact StudioOS adaptation decisions.

### 41_PHASE_2J_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2J in the scaffold.

### 42_NEXT_UPGRADE_PATH_FOR_PLAN_OVERLAY_GLTF_RENDER_MEMORY_AND_ELEVATIONS.md
Direct next-step plan after Phase 2J for stronger plan overlay persistence, richer GLTFs, render memory, walkthroughs, and drawing professionalism.

### 43_AI_BRAIN_TRACK_ADAPTATION_AND_AGENT_PROMPT_STRATEGY.md
Deep adaptation of the supplied AI Brain / prompt / orchestration material into StudioOS.

### 44_3D_CORE_TRACK_ADAPTATION_AND_ASSET_PIPELINE_STRATEGY.md
Deep adaptation of the supplied 3D core / WebGPU / asset-pipeline material into StudioOS.

### 45_PHASE_2K_IMPLEMENTATION_STATUS.md
Current implementation status of Phase 2K in the scaffold.

### 46_NEXT_UPGRADE_PATH_AFTER_PHASE_2K.md
Direct next-step execution plan after Phase 2K.

### 48_AGENTB_PUBLIC_SURFACE_COMPETITIVE_SCAN.md
Public-surface competitive scan of Agent B Studio and its implications for StudioOS.

### 49_AGENTB_TO_STUDIOOS_SUPERSET_IMPLEMENTATION_PRD.md
Implementation PRD for building Agent-B-parity-plus capability inside StudioOS.

### 50_AGENTB_TOOLKIT_AND_WORKFLOW_SPEC.md
Workflow and AI tool system spec inspired by Agent B’s public toolkit structure.

### 51_AGENTB_REQUIRED_SCHEMA_API_AND_UI_EXPANSIONS.md
Concrete schema, API, job-system, and UI expansions required for implementation.

### 52_AGENTB_EXECUTION_BACKLOG_AND_SUCCESS_METRICS.md
Phased implementation backlog and measurable success criteria.

### 53_AGENTB_PRICING_PACKAGING_AND_GO_TO_MARKET_RESPONSE.md
Pricing, packaging, and GTM response guidance derived from the competitor surface.

### 54_ULTIMATE_AI_CODER_PROMPT_STUDIOOS_AURA_AGENTB.md
Single master AI coder prompt combining StudioOS continuation rules, AURA adaptation, and Agent B workflow parity into one implementation command file.

### 55_MULTI_COMPETITOR_PUBLIC_SURFACE_SCAN_AND_FEATURE_SELECTION.md
Feature-selection framework based on the newly scanned competitor set.

### 56_SMART_IMPLEMENTATION_PLAN_FROM_COOHOM_BUILDFLOW_NAADI_AND_SERVICE_STUDIOS.md
Smart phased implementation plan based on the strongest ideas from Coohom, BuildFlow, Naadi, and service studios.

### 57_FEATURE_IMPLEMENTATION_PRIORITY_MATRIX_FROM_ALL_NEW_SCANS.md
Priority matrix for what to build now, next, later, or reject.

### 58_AI_CODER_ADDENDUM_FOR_NEW_COMPETITOR_SET.md
Addendum prompt for AI coders to absorb the newly scanned competitor set intelligently.

## Build Order

The implementation order is:

1. canonical schema
2. rule engine
3. floor plan intelligence pipeline
4. editable 2D / 3D scene core
5. parametric module system
6. drawings / elevations
7. rendering pipeline
8. approvals / proposal / budgeting
9. BOM / cutlist / production exports
10. collaboration / optimization / memory systems

## Product Positioning in One Line

> A geometry-first, AI-assisted, Indian modular interior design operating system that converts floor plans and site inputs into editable 3D designs, client-ready visualizations, wall elevations, proposals, and production-ready outputs.

## Mandatory Reading Order for Any AI Coding Agent

Read these files in this exact order before writing code:

1. README.md
2. 00_MASTER_PRODUCT_VISION_AND_NON_NEGOTIABLES.md
3. 08_COMPETITIVE_PLATFORM_REVERSE_ENGINEERING_AND_SUPERSET_STRATEGY.md
4. 09_FULL_PRODUCT_REQUIREMENTS_DOCUMENT_PRD.md
5. 02_SYSTEM_ARCHITECTURE_AND_SERVICE_MAP.md
6. 03_CANONICAL_SCHEMA_AND_DATA_MODEL.md
7. 10_EXACT_DATABASE_SCHEMA_POSTGRES.sql
8. 13_INDIAN_INTERIOR_COMPANY_OPERATING_FLOW_AND_COMMERCIAL_PIPELINE.md
9. 14_QUOTATION_ESTIMATION_BILLING_PROCUREMENT_AND_VARIATION_SYSTEM.md
10. 15_BUDGET_FIRST_DESIGN_ENGINE_AND_MATERIAL_SELECTION_SYSTEM.md
11. 04_API_CONTRACTS_PIPELINE_STATES_AND_JOBS.md
12. 11_OPENAPI_CONTRACTS.yaml
13. 05_RULE_ENGINE_PARAMETRIC_MODULES_AND_INDIAN_STANDARDS.md
14. 12_UI_UX_SCREEN_MAP_AND_WIREFRAME_STRUCTURE.md
15. 06_AI_AGENT_BUILD_RULES_AND_IMPLEMENTATION_GUARDRAILS.md
16. 07_IMPLEMENTATION_BACKLOG_AND_ACCEPTANCE_CRITERIA.md
17. 16_COMMERCIAL_API_EXTENSION.yaml
18. 17_OPEN_SOURCE_FOUNDATIONS_AND_REUSE_STRATEGY.md
19. 18_COST_TIMELINE_SCALABILITY_AND_FASTEST_EXECUTION_PLAN.md
20. 19_COMPETITOR_STRENGTH_TO_BUILD_DECISIONS.md
21. 20_FACT_CHECKED_COMPETITOR_AND_OSS_RESEARCH_NOTES.md
22. 21_VASTU_AND_INDIAN_INTERIORS_KNOWLEDGE_BASE.md
23. 22_EXPANDED_MASTER_ARCHITECTURE_FOR_EVERYTHING.md
24. 23_AGENTIC_OS_OODA_INFINITE_BRAIN_INTEGRATION.md
25. 24_DETAILED_END_TO_END_USER_FLOW.md
26. 25_AI_CODER_MASTER_PROMPT_FOR_2D_3D_DESIGN_ENGINE.md
27. 26_LIGHTWEIGHT_WEB_2D_3D_IMPLEMENTATION_PLAYBOOK.md
28. 27_IMPLEMENTED_2D_3D_EDITOR_ARCHITECTURE_NOTES.md
29. 28_PHASE_2C_IMPLEMENTATION_STATUS.md
30. 29_PHASE_2D_IMPLEMENTATION_STATUS.md
31. 30_WEBGL_REACT_THREE_FIBER_UPGRADE_PATH.md
32. 31_ADVANCED_MODULE_CONFIGURATOR_ARCHITECTURE.md
33. 32_PHASE_2E_IMPLEMENTATION_STATUS.md
34. 33_PHASE_2F_IMPLEMENTATION_STATUS.md
35. 34_PHASE_2G_IMPLEMENTATION_STATUS.md
36. 35_FURNITURE_AND_ROOM_OBJECT_CATALOG_STRATEGY.md
37. 36_FLOORPLAN_TO_EDITABLE_3D_MAIN_EXPERIENCE.md
38. 37_AURA_BLUEPRINT_ADAPTATION_AND_DECISION_LOG.md
39. 38_BLUEPRINT_TO_CURRENT_REPO_MAPPING.md
40. 39_PHASE_2H_IMPLEMENTATION_STATUS.md
41. 40_AURA_IMPLEMENTATION_PACK_DEEP_ANALYSIS_AND_ADAPTATION.md
42. 41_PHASE_2J_IMPLEMENTATION_STATUS.md
43. 42_NEXT_UPGRADE_PATH_FOR_PLAN_OVERLAY_GLTF_RENDER_MEMORY_AND_ELEVATIONS.md
44. 43_AI_BRAIN_TRACK_ADAPTATION_AND_AGENT_PROMPT_STRATEGY.md
45. 44_3D_CORE_TRACK_ADAPTATION_AND_ASSET_PIPELINE_STRATEGY.md
46. 45_PHASE_2K_IMPLEMENTATION_STATUS.md
47. 46_NEXT_UPGRADE_PATH_AFTER_PHASE_2K.md
48. 48_AGENTB_PUBLIC_SURFACE_COMPETITIVE_SCAN.md
49. 49_AGENTB_TO_STUDIOOS_SUPERSET_IMPLEMENTATION_PRD.md
50. 50_AGENTB_TOOLKIT_AND_WORKFLOW_SPEC.md
51. 51_AGENTB_REQUIRED_SCHEMA_API_AND_UI_EXPANSIONS.md
52. 52_AGENTB_EXECUTION_BACKLOG_AND_SUCCESS_METRICS.md
53. 53_AGENTB_PRICING_PACKAGING_AND_GO_TO_MARKET_RESPONSE.md
54. 54_ULTIMATE_AI_CODER_PROMPT_STUDIOOS_AURA_AGENTB.md
55. 55_MULTI_COMPETITOR_PUBLIC_SURFACE_SCAN_AND_FEATURE_SELECTION.md
56. 56_SMART_IMPLEMENTATION_PLAN_FROM_COOHOM_BUILDFLOW_NAADI_AND_SERVICE_STUDIOS.md
57. 57_FEATURE_IMPLEMENTATION_PRIORITY_MATRIX_FROM_ALL_NEW_SCANS.md
58. 58_AI_CODER_ADDENDUM_FOR_NEW_COMPETITOR_SET.md
59. sql_migrations/README.md
60. typescript_contracts/README.md
61. rule_seeds/budget_material_policies.json

No implementation should begin until the coding agent understands and accepts all constraints in these documents.
