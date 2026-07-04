# 29 — Phase 2D Implementation Status

## Scope completed in scaffold

### 1. Materials catalog CRUD + material assignment UI
Implemented:
- mock materials repository
- materials service and routes
- GET /material-catalog with filtering
- POST /material-catalog
- PATCH /material-catalog/:materialId
- Materials catalog screen
- material quick picker inside design studio
- material assignment patch flow from selected module

### 2. Output invalidation UX
Implemented:
- stale-state engine for project outputs
- stale notices in design studio, render studio, drawings, and proposal screens
- topbar output current/stale badge
- right rail stale summary

### 3. Activity timeline / project event stream
Implemented:
- timeline event store
- timeline logger helper
- logging from project, intake, scene, estimate, invoice, payment, PO, variation, output generation, approval decisions
- GET /projects/:projectId/timeline
- timeline screen
- recent activity in right rail

### 4. Jobs monitoring screen
Implemented:
- jobs seeded in mock store
- render generation and floor plan interpretation job creation hooks
- GET /projects/:projectId/jobs
- jobs monitor screen

### 5. Finance screens
Implemented:
- finance overview screen
- payment plans list
- invoices list
- payments list
- commercial screen still supports creation flows for estimate/payment plan/invoice/payment/variation/PO

### 6. Scene branch switcher UI
Implemented:
- scene branch creation endpoint
- branch switcher in design studio
- active scene/branch selection UI

### 7. Approval lock/unlock direction
Current scaffold state:
- approval creation and decision flow implemented
- approval decision can move project state
- lock semantics still need deeper enforcement and explicit unlock UI in later phase

## Recommended next phase
- hard lock semantics on approved scenes
- richer materials filtering and room-specific recommendations
- proposal invalidation and regeneration controls
- activity filtering and actor attribution
- branch compare view
- finance create/edit forms on dedicated finance screens
