# Data Model And API Plan

## Existing Models To Keep

Keep and evolve:

- `client_projects`
- `floor_plans`
- `laminate_products`
- `inspiration_references`

Use `design_packages`, `moodboards`, and `generated_assets` as optional/future modules rather than core deliverables.

## New Database Tables

### intake_briefs

Stores the generated structured brief before PDF export.

Fields:

- `id`
- `project_id`
- `revision`
- `payload`
- `status`
- `created_at`
- `updated_at`

Payload should include:

- summary
- room briefs
- floor plan notes
- material assumptions
- module schedule
- designer notes
- signoff state

### pdf_exports

Tracks generated PDFs.

Fields:

- `id`
- `project_id`
- `brief_id`
- `type` (`onboarding-brief`, `cutlist`, `combined`)
- `revision`
- `file_path`
- `created_at`

### cutlist_projects

Fields:

- `id`
- `project_id`
- `name`
- `status`
- `settings`
- `created_at`
- `updated_at`

Settings JSON:

- kerfMm
- trimMm
- defaultBoardThicknessMm
- defaultBackThicknessMm
- allowRotation
- reuseOffcuts

### cutlist_modules

Fields:

- `id`
- `cutlist_project_id`
- `room`
- `module_type`
- `name`
- `width_mm`
- `height_mm`
- `depth_mm`
- `quantity`
- `payload`

Payload:

- shelfCount
- drawerCount
- shutterCount
- hasBackPanel
- hasLoft
- visibleSides
- materialRefs
- edgeRules
- hardwareNotes

### material_sheets

Fields:

- `id`
- `cutlist_project_id`
- `name`
- `material_type`
- `thickness_mm`
- `width_mm`
- `height_mm`
- `cost`
- `grain_direction`
- `payload`

### cutlist_parts

Fields:

- `id`
- `cutlist_project_id`
- `module_id`
- `part_code`
- `part_name`
- `material_sheet_id`
- `width_mm`
- `height_mm`
- `quantity`
- `grain_direction`
- `edge_top`
- `edge_right`
- `edge_bottom`
- `edge_left`
- `notes`

### nesting_layouts

Fields:

- `id`
- `cutlist_project_id`
- `material_sheet_id`
- `payload`
- `efficiency`
- `waste_percent`
- `created_at`

Payload:

- sheets
- placements
- unplacedParts
- cutLines
- warnings

## API Routes

### Projects

Existing:

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/floor-plan`
- `GET /api/projects/:id/floor-plan`

Add:

- `PATCH /api/projects/:id`
- `POST /api/projects/:id/status`

### Briefs

Add:

- `POST /api/projects/:id/briefs`
- `GET /api/projects/:id/briefs`
- `GET /api/briefs/:briefId`
- `PATCH /api/briefs/:briefId`
- `POST /api/briefs/:briefId/pdf`

### Cutlists

Add:

- `POST /api/projects/:id/cutlists`
- `GET /api/projects/:id/cutlists`
- `GET /api/cutlists/:cutlistId`
- `PATCH /api/cutlists/:cutlistId/settings`
- `POST /api/cutlists/:cutlistId/modules`
- `PATCH /api/cutlists/:cutlistId/modules/:moduleId`
- `DELETE /api/cutlists/:cutlistId/modules/:moduleId`
- `POST /api/cutlists/:cutlistId/generate-parts`
- `POST /api/cutlists/:cutlistId/optimize`
- `POST /api/cutlists/:cutlistId/pdf`
- `GET /api/cutlists/:cutlistId/csv`

### Materials

Existing:

- `GET /api/materials/laminates`

Add:

- `GET /api/materials/sheets`
- `POST /api/materials/sheets`
- `GET /api/materials/edge-banding`
- `GET /api/materials/hardware`

## PDF Contracts

### Onboarding Brief PDF Contract

Input:

- Project
- Floor plan
- Intake brief
- Room schedule
- Module schedule
- Materials

Output:

- PDF file path
- revision
- generatedAt

### Cutlist PDF Contract

Input:

- Cutlist project
- Modules
- Parts
- Sheet layouts

Output pages:

1. Cutlist cover
2. Project and settings summary
3. Module summary
4. Part list
5. Edge banding list
6. Sheet layout diagrams
7. Unplaced/warning page
8. Workshop sign-off

## Cutlist CSV Columns

- Project No
- Room
- Module
- Part Code
- Part Name
- Material
- Thickness
- Length
- Width
- Quantity
- Grain
- Edge Top
- Edge Right
- Edge Bottom
- Edge Left
- Notes

