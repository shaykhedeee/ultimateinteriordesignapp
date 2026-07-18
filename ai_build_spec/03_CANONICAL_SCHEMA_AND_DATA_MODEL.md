# 03 — Canonical Schema and Data Model

## 1. Purpose

This document defines the canonical schema and data model for the app.

It is intentionally explicit so that an AI coding agent can implement:

- database tables
- shared DTOs
- scene graph types
- API contracts
- validation rules
- versioning logic

without inventing hidden structures.

---

## 2. Modeling Strategy

Use a hybrid data model:

- **normalized relational tables** for identity, permissions, workflow, approvals, outputs, and reporting
- **JSONB documents** for flexible scene graphs, rule results, and AI interpretation payloads
- **version tables** for immutable snapshots

### Core Rule
The product truth must be represented by:

1. relational identity and workflow records
2. canonical scene graph documents
3. immutable revision snapshots

---

## 3. Global Conventions

## 3.1 Primary Keys
All entities use:
- `id UUID PRIMARY KEY`

## 3.2 Timestamps
All tables include:
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

Version/snapshot tables also include:
- `version_number INTEGER`
- `source_version_id UUID NULL`
- `is_current BOOLEAN`

## 3.3 Soft Delete
Where needed:
- `archived_at TIMESTAMPTZ NULL`
- `deleted_at TIMESTAMPTZ NULL`

## 3.4 User Auditing
Most important entities include:
- `created_by UUID`
- `updated_by UUID`

## 3.5 Multi-Tenant Readiness
All business tables include:
- `studio_id UUID`

---

## 4. Primary Domain Model

```text
Studio
  Users
  Projects
    Lead
    Client
    IntakePackage
    SiteCapturePackage
    FloorPlanPackage
    SpatialModelVersion
    SceneVersion
    RoomDesignVariants
    Modules
    Materials
    RenderSets
    DrawingSets
    ProposalSets
    ApprovalPackages
    PricingSets
    BOMSets
    CutlistSets
    Deliverables
    Comments
    Tasks
    ReuseMemoryLinks
```

---

## 5. Core Identity Tables

## 5.1 studios

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| name | text | studio brand name |
| slug | text unique | public/internal identifier |
| timezone | text | default timezone |
| currency_code | text | INR default |
| locale | text | en-IN default |
| settings_json | jsonb | high-level studio settings |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 5.2 users

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | FK studios |
| role | text | admin, owner, designer, estimator, production_manager, site_exec, client_viewer |
| full_name | text | |
| email | text | nullable for some local-only modes |
| phone | text | |
| auth_provider | text | local / oauth / magic-link |
| auth_subject | text | external ID |
| is_active | boolean | |
| preferences_json | jsonb | UI/editor prefs |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 6. CRM and Project Tables

## 6.1 leads

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | FK |
| source | text | walk-in, referral, instagram, website, builder, etc |
| status | text | new, qualified, lost, converted |
| contact_name | text | |
| phone | text | |
| email | text | |
| city | text | |
| project_type | text | residential, commercial, renovation |
| budget_band | text | economy, standard, premium, luxury |
| urgency_level | text | low, medium, high |
| notes | text | |
| converted_project_id | uuid | nullable |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 6.2 clients

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | FK |
| primary_name | text | |
| phone | text | |
| email | text | |
| alternate_contacts_json | jsonb | family / partner / coordinator |
| city | text | |
| address_text | text | |
| gst_or_tax_id | text | nullable |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 6.3 projects

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | FK |
| lead_id | uuid | nullable FK |
| client_id | uuid | FK |
| project_code | text unique | human-readable code |
| name | text | project display name |
| property_type | text | apartment, villa, office, showroom, etc |
| project_type | text | new home, renovation, office fitout |
| stage | text | draft, intake, plan_review, design, render_review, approved, production, delivered |
| status | text | active, on_hold, completed, archived |
| budget_band | text | current commercial band |
| target_timeline_text | text | |
| site_city | text | |
| site_address_text | text | |
| readiness_score | numeric | 0–100 |
| active_scene_version_id | uuid | nullable |
| active_floor_plan_version_id | uuid | nullable |
| active_proposal_set_id | uuid | nullable |
| active_approval_package_id | uuid | nullable |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 7. Intake and Requirements Tables

## 7.1 intake_packages
Stores the structured discovery data.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | FK |
| version_number | integer | immutable versioning |
| is_current | boolean | |
| payload_json | jsonb | full intake data |
| summary_json | jsonb | normalized summary for quick queries |
| completion_percent | numeric | |
| completed_steps_json | jsonb | step completion map |
| created_by | uuid | |
| created_at | timestamptz | |

### intake payload structure
```ts
interface IntakePackage {
  clientProfile: {
    familyType?: string;
    occupants?: number;
    kids?: boolean;
    seniorCitizens?: boolean;
    pets?: boolean;
  };
  projectScope: {
    propertyType: string;
    bhkType?: string;
    areaSqft?: number;
    renovationType?: string;
  };
  rooms: Array<{
    tempId: string;
    requestedName: string;
    required: boolean;
    notes?: string;
    priority?: 'must_have' | 'good_to_have' | 'optional';
  }>;
  stylePreferences: {
    styles: string[];
    likedColors: string[];
    dislikedColors: string[];
    likedMaterials: string[];
    dislikedMaterials: string[];
    references: Array<{ type: 'image' | 'link'; ref: string }>;
  };
  functionalNeeds: {
    storagePriority?: string;
    cookingHabits?: string;
    applianceList?: string[];
    workFromHome?: boolean;
  };
  vastuConstraints?: {
    enabled: boolean;
    notes?: string;
    preferredDirections?: string[];
  };
  commercial: {
    budgetBand?: string;
    idealBudget?: number;
    maxBudget?: number;
    timelineText?: string;
  };
}
```

---

## 8. Site Capture Tables

## 8.1 site_capture_packages

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | FK |
| version_number | integer | |
| is_current | boolean | |
| capture_mode | text | plan_upload, scan, lidar, manual_trace, hybrid |
| notes_json | jsonb | room and wall notes |
| measurements_json | jsonb | captured dimensions |
| issues_json | jsonb | site constraints / red flags |
| created_by | uuid | |
| created_at | timestamptz | |

## 8.2 project_assets
Generic file registry.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| asset_type | text | floor_plan_original, room_photo, wall_photo, scan_file, render_output, drawing_pdf, proposal_pdf, cutlist_csv, etc |
| room_id | uuid | nullable |
| wall_id | uuid | nullable |
| source_entity_type | text | scene_version, render_set, drawing_set, etc |
| source_entity_id | uuid | nullable |
| file_name | text | |
| mime_type | text | |
| storage_key | text | |
| public_url | text | nullable |
| thumbnail_url | text | nullable |
| metadata_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

---

## 9. Floor Plan Intelligence Tables

## 9.1 floor_plan_versions
This stores each interpreted floor plan package.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| source_asset_id | uuid | FK project_assets |
| version_number | integer | |
| is_current | boolean | |
| interpretation_status | text | draft, review_required, approved, superseded |
| overall_confidence | numeric | 0-1 |
| scale_unit | text | mm default |
| scale_factor | numeric | pixel-to-unit or normalized factor |
| interpretation_json | jsonb | full CV/OCR payload |
| reviewed_json | jsonb | user corrections |
| created_by | uuid | |
| created_at | timestamptz | |

### interpretation_json structure
```ts
interface FloorPlanInterpretation {
  source: {
    fileAssetId: string;
    mode: 'image' | 'pdf' | 'scan' | 'hybrid';
  };
  rooms: RoomDetection[];
  walls: WallDetection[];
  openings: OpeningDetection[];
  dimensions: DimensionDetection[];
  symbols: SymbolDetection[];
  textLabels: OCRLabel[];
  graph: SpatialGraph;
  warnings: string[];
}
```

## 9.2 floor_plan_review_items
Stores actionable review issues.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| floor_plan_version_id | uuid | FK |
| item_type | text | room, wall, opening, dimension, symbol |
| item_ref | text | stable reference ID in interpretation |
| confidence | numeric | |
| severity | text | info, warning, critical |
| status | text | open, accepted, corrected, ignored |
| suggested_value_json | jsonb | |
| resolved_value_json | jsonb | |
| created_at | timestamptz | |
| resolved_at | timestamptz | nullable |

---

## 10. Spatial Model Tables

## 10.1 spatial_model_versions
This is the reviewed, structured architectural shell after plan interpretation.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| floor_plan_version_id | uuid | FK |
| version_number | integer | |
| is_current | boolean | |
| model_json | jsonb | reviewed spatial model |
| summary_json | jsonb | counts and metrics |
| created_by | uuid | |
| created_at | timestamptz | |

### spatial model JSON
```ts
interface SpatialModel {
  units: 'mm';
  levels: Array<{
    levelId: string;
    name: string;
    elevationMm: number;
    rooms: RoomNode[];
    walls: WallNode[];
    openings: OpeningNode[];
  }>;
  adjacency: Array<{ fromRoomId: string; toRoomId: string; relation: 'door' | 'open' | 'visual' }>;
  orientation?: {
    northAngleDeg?: number;
  };
}
```

---

## 11. Scene Graph Tables

## 11.1 scene_versions
This is the most important table in the system.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| spatial_model_version_id | uuid | FK |
| version_number | integer | immutable scene version |
| branch_name | text | main, option_a, option_b, client_rev_2 |
| parent_scene_version_id | uuid | nullable |
| is_current | boolean | |
| is_locked | boolean | approved versions locked |
| lock_reason | text | nullable |
| scene_json | jsonb | full scene graph |
| scene_hash | text | deterministic checksum |
| summary_json | jsonb | counts, room states, module states |
| created_by | uuid | |
| created_at | timestamptz | |

### scene_json top-level structure
```ts
interface SceneDocument {
  schemaVersion: string;
  projectId: string;
  units: 'mm';
  levels: SceneLevel[];
  materials: SceneMaterialRef[];
  lights: SceneLight[];
  cameras: SceneCamera[];
  settings: {
    defaultRenderPresetId?: string;
    defaultLightingPresetId?: string;
  };
  ruleResults: RuleEvaluationSummary;
}
```

### room node structure
```ts
interface SceneRoom {
  roomId: string;
  roomType: string;
  name: string;
  polygon2d: Array<{ x: number; y: number }>;
  heightMm: number;
  floorFinishId?: string;
  ceilingStyleId?: string;
  walls: string[];
  modules: string[];
  furniture: string[];
  photos: string[];
  constraints?: {
    vastuZone?: string;
    daylightFaces?: string[];
  };
}
```

### wall node structure
```ts
interface SceneWall {
  wallId: string;
  roomIdPrimary: string;
  roomIdSecondary?: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thicknessMm: number;
  heightMm: number;
  openings: string[];
  finishInnerId?: string;
  finishOuterId?: string;
  photos: string[];
}
```

### opening structure
```ts
interface SceneOpening {
  openingId: string;
  wallId: string;
  openingType: 'door' | 'window' | 'arch' | 'niche';
  offsetFromStartMm: number;
  widthMm: number;
  sillHeightMm?: number;
  headHeightMm?: number;
}
```

---

## 12. Design Variants and Room Packages

## 12.1 room_design_variants
Allows room-level branching while retaining a scene-level backbone.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| room_id | uuid/text reference | logical room reference |
| variant_name | text | option_a, premium_1, dark_1 |
| variant_type | text | layout, finish, lighting, mixed |
| status | text | draft, shortlisted, approved, rejected |
| patch_json | jsonb | delta patch against parent scene |
| summary_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

---

## 13. Parametric Module Tables

## 13.1 modules
One record per placed module instance.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| room_ref | text | room ID inside scene |
| wall_ref | text | nullable if free-standing |
| module_type | text | kitchen_base_run, wardrobe_swing, tv_unit, mandir, etc |
| template_id | uuid | nullable |
| name | text | user-friendly name |
| status | text | draft, validated, approved, locked_for_production |
| geometry_json | jsonb | location and size |
| params_json | jsonb | template parameters |
| material_assignment_json | jsonb | board/finish mapping |
| production_mapping_json | jsonb | carcass/parts settings |
| rule_result_json | jsonb | validation outcomes |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### module geometry
```ts
interface ModuleGeometry {
  anchor: {
    roomId: string;
    wallId?: string;
    x: number;
    y: number;
    z: number;
  };
  size: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
  };
  rotationDeg: number;
}
```

## 13.2 module_templates

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid nullable | null for system templates |
| template_key | text unique | stable programmatic key |
| room_type | text | |
| module_type | text | |
| name | text | |
| definition_json | jsonb | parameters, defaults, formulas |
| is_system | boolean | |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 14. Rules and Standards Tables

## 14.1 rule_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid nullable | null for default system rules |
| name | text | |
| scope | text | global, room_type, module_type, production |
| version_number | integer | |
| rules_json | jsonb | executable constraints |
| is_active | boolean | |
| created_at | timestamptz | |

## 14.2 rule_evaluations

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | nullable |
| module_id | uuid | nullable |
| room_ref | text | nullable |
| evaluation_scope | text | scene, room, module |
| rule_set_id | uuid | FK |
| result_json | jsonb | pass/warn/fail details |
| score | numeric | optional composite score |
| created_at | timestamptz | |

---

## 15. Catalog, Material, and Pricing Tables

## 15.1 material_catalog_items

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid nullable | null for system items |
| category | text | laminate, board, stone, hardware, light, fabric, paint |
| subcategory | text | |
| code | text | vendor/system code |
| name | text | |
| brand | text | |
| metadata_json | jsonb | color family, thickness, texture, finish, image refs |
| pricing_json | jsonb | optional standard rates |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 15.2 vendor_rate_cards

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| vendor_name | text | |
| category | text | boards, laminates, hardware, labor |
| currency_code | text | INR |
| effective_from | date | |
| rates_json | jsonb | rate lookup rules |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 15.3 pricing_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| version_number | integer | |
| is_current | boolean | |
| pricing_json | jsonb | totals, room summaries, module summaries |
| created_by | uuid | |
| created_at | timestamptz | |

---

## 16. Render and Visualization Tables

## 16.1 render_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| room_ref | text | nullable for whole-home set |
| set_name | text | |
| render_tier | text | draft, review, final |
| status | text | queued, processing, ready, failed, approved, stale |
| summary_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

## 16.2 render_variants

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| render_set_id | uuid | FK |
| camera_ref | text | |
| lighting_preset_ref | text | |
| style_preset_ref | text | nullable |
| asset_id | uuid | FK project_assets |
| approval_status | text | pending, shortlisted, approved, rejected |
| score_json | jsonb | QC and subjective scoring |
| metadata_json | jsonb | provider, time, seed, etc |
| created_at | timestamptz | |

## 16.3 camera_presets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid nullable | |
| name | text | |
| room_type | text | nullable |
| preset_json | jsonb | FOV, position rules, target rules |
| is_system | boolean | |
| created_at | timestamptz | |

## 16.4 lighting_presets
Similar structure to camera presets.

---

## 17. Drawing and Documentation Tables

## 17.1 drawing_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| drawing_scope | text | room, full_project, production |
| status | text | queued, ready, failed, stale |
| summary_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

## 17.2 drawing_outputs

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| drawing_set_id | uuid | FK |
| drawing_type | text | floor_plan, elevation, ceiling_plan, schedule_sheet |
| room_ref | text | nullable |
| wall_ref | text | nullable |
| asset_id | uuid | FK project_assets |
| metadata_json | jsonb | title block, scale, annotations |
| created_at | timestamptz | |

## 17.3 proposal_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| render_set_id | uuid | nullable |
| pricing_set_id | uuid | nullable |
| drawing_set_id | uuid | nullable |
| version_number | integer | |
| status | text | draft, exported, approved, stale |
| asset_id | uuid | FK project_assets for PDF |
| summary_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

---

## 18. Approval and Collaboration Tables

## 18.1 approval_packages

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| proposal_set_id | uuid | nullable |
| render_set_id | uuid | nullable |
| drawing_set_id | uuid | nullable |
| pricing_set_id | uuid | nullable |
| package_type | text | concept, client_approval, production_lock |
| status | text | pending, approved, rejected, superseded |
| approved_by_client_name | text | nullable |
| approved_at | timestamptz | nullable |
| notes | text | |
| created_by | uuid | |
| created_at | timestamptz | |

## 18.2 comments

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| author_user_id | uuid | nullable for client guest flow |
| author_type | text | user, client_guest |
| target_type | text | project, room, wall, module, render_variant, drawing_output, proposal_set |
| target_id | uuid/text | stable target reference |
| body | text | |
| status | text | open, resolved, archived |
| metadata_json | jsonb | screen coords, wall ref, client share ref |
| created_at | timestamptz | |
| resolved_at | timestamptz | nullable |

---

## 19. Production Tables

## 19.1 bom_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| version_number | integer | |
| status | text | draft, ready, approved, stale |
| bom_json | jsonb | aggregated materials, parts, hardware |
| created_by | uuid | |
| created_at | timestamptz | |

## 19.2 cutlist_sets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| scene_version_id | uuid | FK |
| bom_set_id | uuid | FK |
| version_number | integer | |
| status | text | draft, ready, exported, stale |
| cutlist_json | jsonb | part rows, sheets, warnings |
| csv_asset_id | uuid | nullable |
| pdf_asset_id | uuid | nullable |
| created_by | uuid | |
| created_at | timestamptz | |

## 19.3 production_settings_presets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| name | text | |
| settings_json | jsonb | board thickness, kerf, trim, edge defaults |
| is_default | boolean | |
| created_at | timestamptz | |

---

## 20. Workflow and Jobs Tables

## 20.1 project_stage_events

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | |
| from_stage | text | |
| to_stage | text | |
| reason | text | |
| metadata_json | jsonb | |
| created_by | uuid | |
| created_at | timestamptz | |

## 20.2 async_jobs

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | nullable |
| job_type | text | plan_analysis, render, drawing_generation, proposal_export, cutlist_generation |
| status | text | queued, running, waiting_for_input, succeeded, failed, canceled, stale |
| priority | integer | |
| payload_json | jsonb | |
| result_json | jsonb | |
| error_json | jsonb | |
| retry_count | integer | |
| source_entity_type | text | |
| source_entity_id | uuid | nullable |
| created_by | uuid | |
| created_at | timestamptz | |
| started_at | timestamptz | nullable |
| finished_at | timestamptz | nullable |

---

## 21. Memory and Reuse Tables

## 21.1 reusable_design_assets

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| asset_kind | text | room_template, module_template, render_reference, finish_pack, camera_pack |
| name | text | |
| tags_json | jsonb | style, budget, room type, brand tags |
| source_project_id | uuid | nullable |
| source_scene_version_id | uuid | nullable |
| payload_json | jsonb | reusable content |
| status | text | active, archived |
| created_at | timestamptz | |

## 21.2 mistakes_log

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| studio_id | uuid | |
| project_id | uuid | nullable |
| scene_version_id | uuid | nullable |
| category | text | detection, layout, render, drawing, production |
| severity | text | low, medium, high, critical |
| problem_code | text | stable key |
| description | text | |
| root_cause_text | text | nullable |
| linked_entity_type | text | room, wall, module, render, drawing, cutlist |
| linked_entity_id | text | |
| resolution_text | text | nullable |
| created_by | uuid | |
| created_at | timestamptz | |

---

## 22. Required Indexes

At minimum add indexes for:

- `projects(studio_id, stage, status)`
- `floor_plan_versions(project_id, is_current)`
- `scene_versions(project_id, is_current)`
- `modules(project_id, scene_version_id)`
- `render_sets(project_id, scene_version_id, status)`
- `drawing_sets(project_id, scene_version_id, status)`
- `proposal_sets(project_id, scene_version_id, status)`
- `approval_packages(project_id, status)`
- `async_jobs(project_id, job_type, status)`
- `comments(project_id, target_type)`

---

## 23. Required Invariants

The system must enforce the following:

1. only one current intake package per project
2. only one current floor plan version per project
3. only one current scene version per active branch
4. approved approval packages must reference a locked scene version
5. cutlist sets must reference a BOM set and scene version
6. proposal sets must reference the exact render/drawing/pricing sets used
7. stale outputs must not be shown as current approval candidates

---

## 24. Recommended Event Model

Emit events for:

- project.created
- intake.updated
- floor_plan.uploaded
- floor_plan.interpreted
- floor_plan.reviewed
- scene.created
- scene.updated
- scene.locked
- module.validated
- render_set.requested
- render_set.ready
- drawing_set.ready
- proposal_set.exported
- approval_package.approved
- bom_set.ready
- cutlist_set.exported
- output.marked_stale

---

## 25. Final Schema Rule

> If a feature cannot be represented in the canonical schema with revision-safe traceability to project, room, scene, and output entities, it is not ready to be implemented.
