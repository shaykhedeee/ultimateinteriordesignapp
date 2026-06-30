# 04 — API Contracts, Pipeline States, and Jobs

## 1. Purpose

This document defines:

- API structure
- route conventions
- workflow states
- async job contracts
- approval gates
- invalidation rules

The goal is to make backend implementation deterministic and frontend integration predictable.

---

## 2. API Design Rules

## 2.1 Protocol and Format
- REST JSON for main application operations
- multipart upload only for file uploads
- signed asset URLs for private blobs when needed
- all timestamps ISO 8601
- all units in `mm` unless explicitly stated otherwise

## 2.2 Versioning
Use versioned routes:

```text
/api/v1/...
```

## 2.3 Response Envelope
All responses should use a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "SCENE_LOCKED",
    "message": "The scene version is locked and cannot be edited.",
    "details": {}
  }
}
```

## 2.4 Idempotency
Use idempotency keys for:
- proposal export requests
- render set creation
- drawing set generation
- BOM/cutlist generation
- approval submission

---

## 3. Primary Workflow Stages

Use this canonical project stage enum:

```ts
type ProjectStage =
  | 'draft'
  | 'lead_qualified'
  | 'intake_in_progress'
  | 'intake_complete'
  | 'site_capture'
  | 'plan_analysis_review'
  | 'scene_ready'
  | 'design_in_progress'
  | 'render_review'
  | 'proposal_review'
  | 'client_approval_pending'
  | 'design_approved'
  | 'production_preparation'
  | 'production_ready'
  | 'delivered';
```

### Stage Gate Rules

| from | to | required condition |
|---|---|---|
| draft | lead_qualified | lead qualifies |
| lead_qualified | intake_in_progress | project created |
| intake_in_progress | intake_complete | required intake fields complete |
| intake_complete | site_capture | capture started |
| site_capture | plan_analysis_review | plan or scan ingested |
| plan_analysis_review | scene_ready | floor plan review accepted |
| scene_ready | design_in_progress | base scene created |
| design_in_progress | render_review | render set requested and generated |
| render_review | proposal_review | at least one valid shortlisted/approved variant |
| proposal_review | client_approval_pending | proposal set exported |
| client_approval_pending | design_approved | approval package approved |
| design_approved | production_preparation | BOM/cutlist flow started |
| production_preparation | production_ready | production outputs generated |
| production_ready | delivered | deliverables exported and packaged |

---

## 4. Auth and Context Endpoints

## 4.1 GET /api/v1/me
Returns current user context.

## 4.2 GET /api/v1/studio
Returns current studio settings.

## 4.3 PATCH /api/v1/studio
Updates studio settings.

---

## 5. CRM and Project Endpoints

## 5.1 POST /api/v1/leads
Create lead.

### Request
```json
{
  "contactName": "Raghav Iyer",
  "phone": "+91...",
  "city": "Bengaluru",
  "source": "walk_in",
  "projectType": "residential",
  "budgetBand": "premium"
}
```

## 5.2 POST /api/v1/projects
Create project from lead or directly.

## 5.3 GET /api/v1/projects
List projects with filters.

## 5.4 GET /api/v1/projects/:projectId
Get project summary.

### Must include
- current stage
- readiness score
- current versions
- counts of outputs
- stale output flags
- next actions

## 5.5 PATCH /api/v1/projects/:projectId
Update high-level project metadata.

## 5.6 GET /api/v1/projects/:projectId/timeline
Returns event timeline and stage events.

---

## 6. Intake Endpoints

## 6.1 GET /api/v1/projects/:projectId/intake/current
Returns current intake package.

## 6.2 POST /api/v1/projects/:projectId/intake
Creates or versions intake package.

### Request
```json
{
  "payload": {
    "clientProfile": {},
    "projectScope": {},
    "rooms": [],
    "stylePreferences": {},
    "functionalNeeds": {},
    "commercial": {}
  },
  "isAutosave": true
}
```

## 6.3 POST /api/v1/projects/:projectId/intake/complete
Marks intake as completed after validation.

### Validation must ensure
- project scope exists
- at least one room exists
- budget band or commercial band exists

---

## 7. Site Capture and Upload Endpoints

## 7.1 POST /api/v1/projects/:projectId/assets/upload
Multipart asset upload.

### Required form fields
- `assetType`
- `roomRef` optional
- `wallRef` optional
- `sourceEntityType` optional
- `sourceEntityId` optional
- `file`

## 7.2 POST /api/v1/projects/:projectId/site-capture
Creates site capture package version.

## 7.3 GET /api/v1/projects/:projectId/site-capture/current
Returns current capture package.

## 7.4 POST /api/v1/projects/:projectId/site-capture/verify-measurement
Verifies or corrects dimension data.

---

## 8. Floor Plan Intelligence Endpoints

## 8.1 POST /api/v1/projects/:projectId/floor-plan/interpret
Starts floor plan interpretation job.

### Request
```json
{
  "sourceAssetId": "uuid",
  "mode": "image",
  "options": {
    "preferMetric": true,
    "inferRoomLabels": true,
    "inferOpenings": true
  }
}
```

### Response
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "queued"
  },
  "meta": {},
  "error": null
}
```

## 8.2 GET /api/v1/projects/:projectId/floor-plan/versions
List interpretation versions.

## 8.3 GET /api/v1/floor-plan-versions/:versionId
Get interpretation payload, confidence, review items.

## 8.4 POST /api/v1/floor-plan-versions/:versionId/review
Submit reviewed corrections.

### Request
```json
{
  "corrections": [
    {
      "itemType": "room",
      "itemRef": "room_tmp_1",
      "action": "correct",
      "resolvedValue": {
        "name": "Living Room",
        "roomType": "living_room"
      }
    }
  ],
  "acceptRemainingHighConfidence": true
}
```

## 8.5 POST /api/v1/floor-plan-versions/:versionId/finalize
Creates reviewed spatial model version.

### Must fail if
- critical review items remain unresolved

---

## 9. Spatial Model and Scene Endpoints

## 9.1 POST /api/v1/projects/:projectId/scenes/from-spatial-model
Creates base scene shell from spatial model.

## 9.2 GET /api/v1/projects/:projectId/scenes
List scene versions and branches.

## 9.3 GET /api/v1/scenes/:sceneVersionId
Get scene document.

## 9.4 POST /api/v1/scenes/:sceneVersionId/branch
Create new branch.

### Request
```json
{
  "branchName": "option_b",
  "reason": "alternate TV wall layout"
}
```

## 9.5 POST /api/v1/scenes/:sceneVersionId/patch
Applies mutation patch and returns new current scene version.

### Request contract
```json
{
  "operations": [
    {
      "op": "update_module_params",
      "moduleId": "uuid",
      "params": {
        "finishPackId": "oak_premium_01"
      }
    }
  ],
  "reason": "Changed wardrobe finish"
}
```

### Mandatory Behavior
- scene patch creates a new scene version
- old version remains immutable
- downstream outputs may become stale

## 9.6 POST /api/v1/scenes/:sceneVersionId/lock
Locks scene for approval or production.

## 9.7 POST /api/v1/scenes/:sceneVersionId/unlock
Restricted action with audit log.

---

## 10. Module and Rule Endpoints

## 10.1 GET /api/v1/module-templates
List templates with filters by room type / module type.

## 10.2 POST /api/v1/scenes/:sceneVersionId/modules
Place a new module instance.

### Request
```json
{
  "templateKey": "wardrobe_sliding_3_panel",
  "roomRef": "room_mbr_1",
  "wallRef": "wall_mbr_w2",
  "anchor": { "x": 4200, "y": 0, "z": 0 },
  "params": {
    "widthMm": 2400,
    "heightMm": 2700,
    "depthMm": 650
  }
}
```

## 10.3 PATCH /api/v1/modules/:moduleId
Update params / materials / metadata.

## 10.4 POST /api/v1/modules/:moduleId/validate
Run rules for that module.

## 10.5 POST /api/v1/scenes/:sceneVersionId/validate
Run room and scene-wide rules.

### Response must include
- pass/warn/fail counts
- per-room results
- per-module results
- hard-rule failures
- override requirements

---

## 11. Material, Catalog, and Pricing Endpoints

## 11.1 GET /api/v1/material-catalog
Filter by category, brand, color family, room type.

## 11.2 POST /api/v1/scenes/:sceneVersionId/material-assignments
Bulk assign finishes.

## 11.3 POST /api/v1/scenes/:sceneVersionId/pricing/generate
Creates pricing set.

### Request options
```json
{
  "rateCardId": "uuid",
  "pricingMode": "estimate",
  "includeLabor": true,
  "includeHardware": true
}
```

## 11.4 GET /api/v1/projects/:projectId/pricing-sets
List pricing versions.

---

## 12. Render Endpoints

## 12.1 POST /api/v1/scenes/:sceneVersionId/render-sets
Create render set.

### Request
```json
{
  "roomRef": "room_living_1",
  "renderTier": "review",
  "variantCount": 4,
  "cameraPresetIds": ["cam_living_diag_01", "cam_living_elev_01"],
  "lightingPresetIds": ["day_soft_01", "evening_warm_01"],
  "stylePresetId": "modern_premium_01"
}
```

## 12.2 GET /api/v1/render-sets/:renderSetId
Get set and variants.

## 12.3 POST /api/v1/render-variants/:variantId/approve
Approve single variant.

## 12.4 POST /api/v1/render-variants/:variantId/reject
Reject with reason.

## 12.5 POST /api/v1/render-sets/:renderSetId/mark-shortlist
Shortlist variants.

## 12.6 POST /api/v1/render-variants/:variantId/request-edit
Creates an edit task or new render revision request.

### Mandatory Behavior
- render approval cannot occur if source scene is stale or superseded unless explicitly allowed in readonly review mode

---

## 13. Drawing Endpoints

## 13.1 POST /api/v1/scenes/:sceneVersionId/drawing-sets
Generate drawings.

### Request
```json
{
  "drawingScope": "room",
  "roomRefs": ["room_kitchen_1"],
  "include": ["floor_plan", "elevations", "ceiling_plan", "module_schedule"]
}
```

## 13.2 GET /api/v1/drawing-sets/:drawingSetId
Get outputs and metadata.

## 13.3 GET /api/v1/projects/:projectId/drawing-sets
List drawing generations.

---

## 14. Proposal Endpoints

## 14.1 POST /api/v1/projects/:projectId/proposal-sets
Create proposal set.

### Request
```json
{
  "sceneVersionId": "uuid",
  "renderSetId": "uuid",
  "drawingSetId": "uuid",
  "pricingSetId": "uuid",
  "sections": [
    "cover",
    "summary",
    "requirements",
    "floor_plan",
    "room_visuals",
    "room_briefs",
    "module_schedule",
    "pricing_summary",
    "signoff"
  ]
}
```

## 14.2 POST /api/v1/proposal-sets/:proposalSetId/export
Generate final PDF.

## 14.3 GET /api/v1/projects/:projectId/proposal-sets
List proposals.

### Mandatory Behavior
- proposal export must fail or warn if linked render/drawing/pricing sets are stale

---

## 15. Approval Endpoints

## 15.1 POST /api/v1/projects/:projectId/approval-packages
Create approval package.

## 15.2 GET /api/v1/approval-packages/:approvalPackageId
Get approval package details.

## 15.3 POST /api/v1/approval-packages/:approvalPackageId/submit-client-decision
Submit approve/reject decision.

### Request
```json
{
  "decision": "approved",
  "approvedByName": "Client Name",
  "comments": "Proceed with option B and walnut finish"
}
```

## 15.4 POST /api/v1/approval-packages/:approvalPackageId/request-revision
Request revision.

### Mandatory Behavior
- design approval must lock source scene version
- if later unlocked and changed, approval package becomes superseded

---

## 16. BOM and Cutlist Endpoints

## 16.1 POST /api/v1/scenes/:sceneVersionId/bom-sets
Generate BOM from approved or draft scene.

### Request
```json
{
  "productionPresetId": "uuid",
  "mode": "draft"
}
```

## 16.2 POST /api/v1/bom-sets/:bomSetId/cutlist-sets
Generate cutlist.

## 16.3 GET /api/v1/cutlist-sets/:cutlistSetId
Get part rows, warnings, exports.

## 16.4 POST /api/v1/cutlist-sets/:cutlistSetId/export
Generate CSV/PDF package.

### Mandatory Behavior
- generation from unapproved scene must be clearly marked `draft_production`
- generation from approved scene may be marked `approved_production_basis`

---

## 17. Deliverables and Vault Endpoints

## 17.1 GET /api/v1/projects/:projectId/deliverables
List all outputs.

## 17.2 GET /api/v1/projects/:projectId/share-package
Get export/share package metadata.

## 17.3 POST /api/v1/projects/:projectId/share-package
Create ZIP/share package.

---

## 18. Comment and Collaboration Endpoints

## 18.1 POST /api/v1/comments
Create comment on room/module/render/wall/drawing.

## 18.2 GET /api/v1/projects/:projectId/comments
List project comments.

## 18.3 POST /api/v1/comments/:commentId/resolve
Resolve comment.

### Mandatory Behavior
- comments on entity IDs must survive scene versioning through reference mapping where possible

---

## 19. Job Endpoints

## 19.1 GET /api/v1/jobs/:jobId
Get job status.

### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "jobType": "render_generation",
    "status": "running",
    "progress": 62,
    "result": null,
    "error": null
  },
  "meta": {},
  "error": null
}
```

## 19.2 GET /api/v1/projects/:projectId/jobs
List jobs by project.

---

## 20. Canonical Job Types

```ts
type JobType =
  | 'floor_plan_interpretation'
  | 'floor_plan_review_package'
  | 'scene_shell_generation'
  | 'scene_validation'
  | 'pricing_generation'
  | 'render_generation'
  | 'drawing_generation'
  | 'proposal_export'
  | 'bom_generation'
  | 'cutlist_generation'
  | 'deliverables_packaging'
  | 'similarity_indexing';
```

## Canonical Job Status

```ts
type JobStatus =
  | 'queued'
  | 'running'
  | 'waiting_for_input'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'stale';
```

---

## 21. Invalidation Rules

These are mandatory.

### 21.1 Scene Changes Must Invalidate Outputs
If a scene changes materially, the following become stale unless regenerated:
- render sets tied to old scene version
- drawing sets tied to old scene version
- proposal sets tied to old scene version
- pricing sets tied to old scene version
- BOM/cutlist sets tied to old scene version

### 21.2 Material Changes
If materials change:
- renders stale
- pricing stale
- material schedules stale
- proposals stale if visuals/costing depend on changed items

### 21.3 Geometry Changes
If walls/openings/modules change:
- everything downstream stale

### 21.4 Comment Persistence
Comments linked to superseded outputs remain visible in history, not active current review state.

---

## 22. Required Domain Errors

At minimum implement these error codes:

- `PROJECT_NOT_FOUND`
- `SCENE_NOT_FOUND`
- `SCENE_LOCKED`
- `SCENE_STALE`
- `INVALID_STAGE_TRANSITION`
- `REVIEW_ITEMS_PENDING`
- `APPROVAL_REQUIRES_LOCKED_SCENE`
- `OUTPUT_SET_STALE`
- `RULE_VALIDATION_FAILED`
- `PRODUCTION_EXPORT_REQUIRES_MODULES`
- `PERMISSION_DENIED`
- `JOB_ALREADY_RUNNING`
- `IDEMPOTENCY_CONFLICT`

---

## 23. Readiness Score Contract

Expose a computed readiness object:

```json
{
  "stage": "proposal_review",
  "score": 72,
  "checks": {
    "intakeComplete": true,
    "siteCaptureComplete": true,
    "planReviewed": true,
    "sceneReady": true,
    "hasRenderShortlist": true,
    "hasCurrentDrawings": false,
    "hasCurrentPricing": true,
    "hasApprovalPackage": false
  },
  "nextRequiredAction": "generate_current_drawings"
}
```

---

## 24. API Guardrails

1. no endpoint may mutate locked scene data silently
2. no endpoint may approve stale outputs without explicit override path
3. no endpoint may generate production exports without recording scene version linkage
4. no endpoint may return ambiguous units
5. all write endpoints must validate request DTOs against shared schemas
6. all endpoints touching model revisions must produce audit events

---

## 25. Final Contract Rule

> Every API action must either create, review, version, validate, approve, or export a known piece of project truth. If an endpoint creates side effects without traceable version linkage, it is incorrectly designed.
