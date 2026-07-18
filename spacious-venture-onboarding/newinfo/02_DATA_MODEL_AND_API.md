# Complete Data Model & API Contracts

## Entity Relationship Diagram (Conceptual)

```
client_projects (1) ────── (N) floor_plans
       │
       ├── (1) ── (N) intake_briefs
       │              └── pdf_exports
       │
       ├── (1) ── (N) cutlist_projects
       │              ├── (N) cutlist_modules
       │              │       └── part generation rules
       │              ├── (N) cutlist_parts
       │              │       └── edge banding per side
       │              ├── (N) material_sheets
       │              └── (N) nesting_layouts
       │
       ├── (1) ── (N) generated_assets (AI renders)
       │              └── render_corrections
       │
       └── (1) ── (N) inspiration_references
```

---

## Table Specifications

### 1. client_projects (Existing - Enhanced)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `client_name` | TEXT | Required |
| `phone` | TEXT | Client phone |
| `email` | TEXT | |
| `city` | TEXT | |
| `property_address` | TEXT | |
| `project_type` | TEXT | New Home / Renovation / Office / Commercial |
| `bhk_type` | TEXT | 1BHK, 2BHK, 3BHK, 4BHK, Villa, Office |
| `property_size_sqft` | NUMBER | |
| `budget_band` | TEXT | Economy / Standard / Premium / Luxury |
| `timeline` | TEXT | Expected timeline |
| `priority` | TEXT | Cost / Speed / Design |
| `style_preferences` | TEXT (JSON) | Array of selected styles |
| `vastu_direction` | TEXT | Facing direction |
| `cooking_habits` | TEXT (JSON) | Cooking preferences |
| `rooms` | TEXT (JSON) | Array of {room_name, size, notes} |
| `intake_completed` | BOOLEAN | Step-by-step completion |
| `current_stage` | TEXT | Onboarding / Floor Plan / Renders / Brief / Cutlist / Delivered |
| `status` | TEXT | Active / On Hold / Completed / Archived |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

### 2. floor_plans (Existing)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `file_path` | TEXT | Storage path |
| `file_type` | TEXT | image / pdf |
| `width_px` | NUMBER | Canvas width |
| `height_px` | NUMBER | Canvas height |
| `zones` | TEXT (JSON) | Array of zone objects with coordinates |
| `markers` | TEXT (JSON) | Array of component markers |
| `notes` | TEXT | Floor plan notes |
| `created_at` | DATETIME | |

### 3. intake_briefs (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `revision` | INTEGER | Auto-incrementing revision |
| `status` | TEXT | Draft / Final / Client Approved |
| `payload` | TEXT (JSON) | Complete brief payload |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**payload JSON structure:**
```json
{
  "summary": "3BHK home for Raghav & Meera Iyer",
  "client": {
    "name": "Raghav Iyer",
    "contact": "...",
    "city": "Bangalore"
  },
  "project": {
    "type": "New Home",
    "bhk": "3BHK",
    "size_sqft": 1500,
    "budget": "Premium",
    "timeline": "4 months"
  },
  "rooms": [
    {
      "name": "Living Room",
      "size": "20x15 ft",
      "modules": [
        {"type": "TV Unit", "width": 2400, "height": 450, "depth": 400, "qty": 1},
        {"type": "Sofa", "notes": "L-shaped, 3-seater"}
      ],
      "style": "Modern",
      "notes": "Open plan with dining"
    }
  ],
  "floor_plan_notes": "South-facing main door. Kitchen on east wall.",
  "materials": {
    "carcass": "18mm BWR plywood",
    "back": "6mm MR",
    "laminates": ["8609 GFP Frosty White", "4211-EH Bourbone Walnut"]
  },
  "designer_notes": "Client wants maximum storage. No open shelves.",
  "signoff_state": "pending"
}
```

### 4. pdf_exports (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `brief_id` | TEXT | FK to intake_briefs (nullable) |
| `cutlist_project_id` | TEXT | FK to cutlist_projects (nullable) |
| `type` | TEXT | onboarding-brief / cutlist / combined |
| `revision` | INTEGER | |
| `file_path` | TEXT | Storage path |
| `file_size_bytes` | NUMBER | |
| `created_at` | DATETIME | |

### 5. cutlist_projects (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `name` | TEXT | Cutlist project name |
| `status` | TEXT | Draft / Modules Defined / Parts Generated / Sheets Optimized / Exported |
| `settings` | TEXT (JSON) | Production settings |
| `revision` | INTEGER | |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**settings JSON:**
```json
{
  "kerfMm": 3,
  "trimMm": 10,
  "defaultBoardThicknessMm": 18,
  "defaultBackThicknessMm": 6,
  "defaultSheetWidthMm": 2440,
  "defaultSheetHeightMm": 1220,
  "allowRotation": true,
  "reuseOffcuts": false,
  "grainDirection": "length",
  "defaultEdgeBandThicknessMm": {
    "visible": 2,
    "internal": 0.8
  }
}
```

### 6. cutlist_modules (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `cutlist_project_id` | TEXT | FK to cutlist_projects |
| `room` | TEXT | Living, Kitchen, MBR, etc. |
| `module_type` | TEXT | base-cabinet / wall-cabinet / tall-unit / wardrobe / tv-unit / shoe-rack / pooja-unit / sink-cabinet / hob-drawer / loft / custom-box / study-desk / dining-crockery / utility-storage |
| `name` | TEXT | User-given name (e.g., "TV-BOX-2") |
| `width_mm` | NUMBER | |
| `height_mm` | NUMBER | |
| `depth_mm` | NUMBER | |
| `quantity` | NUMBER | Default: 1 |
| `sort_order` | INTEGER | Display order |
| `payload` | TEXT (JSON) | Extended config |

**payload JSON:**
```json
{
  "shelfCount": 3,
  "drawerCount": 2,
  "shutterCount": 2,
  "doorCount": 2,
  "hasBackPanel": true,
  "hasLoft": false,
  "visibleSides": ["left", "right"],
  "carcassMaterial": "18mm BWR",
  "shutterFinish": "8609 GFP Frosty White",
  "backPanelMaterial": "6mm MR",
  "edgeRules": {
    "visible": "2mm PVC",
    "internal": "0.8mm PVC"
  },
  "hardwareNotes": "Premium hinges, soft-close drawers",
  "placementNotes": "Between windows, 200mm from left wall",
  "furnitureRequirements": "42\" TV, soundbar shelf"
}
```

### 7. cutlist_parts (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `cutlist_project_id` | TEXT | FK to cutlist_projects |
| `module_id` | TEXT | FK to cutlist_modules |
| `part_code` | TEXT | e.g., "S/P", "TOP", "BTM", "BACK", "V/P", "F/S", "FACIA", "DR-S/P", "DR-BK", "DR-F/T", "SK", "DOOR", "FILLER", "DUMMY" |
| `part_name` | TEXT | Human-readable: "Side Panel", "Top Panel", etc. |
| `material_sheet_id` | TEXT | FK to material_sheets |
| `length_mm` | NUMBER | |
| `width_mm` | NUMBER | |
| `quantity` | NUMBER | |
| `grain_direction` | TEXT | length / width / none |
| `can_rotate` | BOOLEAN | Default: true |
| `edge_top` | TEXT | Edge band code |
| `edge_right` | TEXT | |
| `edge_bottom` | TEXT | |
| `edge_left` | TEXT | |
| `notes` | TEXT | e.g., "Oversize - needs special sheet" |

### 8. material_sheets (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `cutlist_project_id` | TEXT | FK to cutlist_projects |
| `name` | TEXT | e.g., "COM 16MM", "HDHMR 18MM" |
| `material_type` | TEXT | plywood / mdf / hdf / particle-board / laminate |
| `thickness_mm` | NUMBER | |
| `width_mm` | NUMBER | Default: 2440 |
| `height_mm` | NUMBER | Default: 1220 |
| `cost_per_sheet` | NUMBER | |
| `grain_direction` | TEXT | lengthwise / none |
| `finish_code` | TEXT | Laminate code if applicable |
| `payload` | TEXT (JSON) | Vendor info, notes |

### 9. nesting_layouts (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `cutlist_project_id` | TEXT | FK to cutlist_projects |
| `material_sheet_id` | TEXT | FK to material_sheets |
| `payload` | TEXT (JSON) | Full layout data |
| `efficiency` | NUMBER | Percentage 0-100 |
| `waste_percent` | NUMBER | |
| `created_at` | DATETIME | |

**payload JSON:**
```json
{
  "sheets": [
    {
      "sheetIndex": 1,
      "placements": [
        {"partId": "...", "x": 10, "y": 10, "rotated": false, "width": 600, "height": 400}
      ],
      "wastePercent": 22.5
    }
  ],
  "unplacedParts": [
    {"partId": "...", "reason": "Exceeds sheet dimension"}
  ],
  "cutLines": [
    {"type": "guillotine", "x": 610, "y": 0, "length": 1220}
  ],
  "warnings": ["Part BACK-01 exceeds 2440mm length"]
}
```

### 10. generated_assets (Existing)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `type` | TEXT | render / moodboard / curated |
| `room` | TEXT | |
| `style` | TEXT | |
| `file_path` | TEXT | |
| `prompt` | TEXT | Full prompt used |
| `tags` | TEXT (JSON) | Metadata tags |
| `selected` | BOOLEAN | Accepted by designer |
| `created_at` | DATETIME | |

### 11. render_corrections (New)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `project_id` | TEXT | FK to client_projects |
| `room` | TEXT | |
| `style` | TEXT | |
| `original_prompt` | TEXT | |
| `patch_rules` | TEXT (JSON) | Array of correction rules |
| `use_count` | INTEGER | |
| `created_at` | DATETIME | |

---

## API Contract Summary

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/projects` | Create project with onboarding data |
| GET | `/api/projects` | List all projects (with stage/readiness) |
| GET | `/api/projects/:id` | Get project detail |
| PATCH | `/api/projects/:id` | Update project fields |
| POST | `/api/projects/:id/status` | Update project stage/status |
| DELETE | `/api/projects/:id` | Archive/delete project |

### Floor Plans
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/projects/:id/floor-plan` | Upload floor plan image/PDF |
| GET | `/api/projects/:id/floor-plan` | Get floor plan with zones/markers |
| PATCH | `/api/projects/:id/floor-plan` | Update zones, markers, dimensions |

### Briefs
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/projects/:id/briefs` | Generate structured brief from intake |
| GET | `/api/projects/:id/briefs` | List briefs for project |
| GET | `/api/briefs/:briefId` | Get brief payload |
| PATCH | `/api/briefs/:briefId` | Update brief |
| POST | `/api/briefs/:briefId/pdf` | Generate PDF from brief |
| POST | `/api/briefs/:briefId/approve` | Mark brief as client-approved |

### Renders
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/projects/:id/renders/generate` | Generate render variants |
| GET | `/api/projects/:id/renders` | List all renders for project |
| PATCH | `/api/renders/:renderId` | Accept/reject/star render |
| POST | `/api/projects/:id/renders/corrections` | Save render correction |

### Cutlists
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/projects/:id/cutlists` | Create cutlist from approved brief |
| GET | `/api/projects/:id/cutlists` | List cutlist projects |
| GET | `/api/cutlists/:cutlistId` | Get cutlist with modules |
| PATCH | `/api/cutlists/:cutlistId/settings` | Update production settings |
| POST | `/api/cutlists/:cutlistId/modules` | Add module |
| PATCH | `/api/cutlists/:cutlistId/modules/:moduleId` | Update module |
| DELETE | `/api/cutlists/:cutlistId/modules/:moduleId` | Remove module |
| POST | `/api/cutlists/:cutlistId/generate-parts` | Regenerate all parts from modules |
| GET | `/api/cutlists/:cutlistId/parts` | Get all parts |
| POST | `/api/cutlists/:cutlistId/optimize` | Run sheet optimization |
| GET | `/api/cutlists/:cutlistId/sheets` | Get sheet layouts |
| POST | `/api/cutlists/:cutlistId/pdf` | Generate workshop PDF |
| GET | `/api/cutlists/:cutlistId/csv` | Export CSV |
| POST | `/api/cutlists/:cutlistId/labels` | Generate panel labels PDF |

### Materials
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/materials/laminates` | List laminates with filters |
| GET | `/api/materials/sheets` | List sheet types |
| POST | `/api/materials/sheets` | Add sheet type |
| GET | `/api/materials/edge-banding` | List edge banding options |
| GET | `/api/materials/hardware` | List hardware |
| GET | `/api/materials/production-imports` | Get production imports |

### Admin / System
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/summary` | Dashboard KPIs and workflow metrics |
| GET | `/api/admin/documents` | Deliverables vault listing |
| GET | `/api/library/export` | Full backup (JSON + files) |
| POST | `/api/library/import` | Restore from backup |
| POST | `/api/admin/demo-reset` | Reset to sample data |
| GET | `/api/providers/status` | Image generation provider status |

---

## Export File Naming Convention

| Export | Pattern |
|--------|---------|
| PDF Brief | `SV-{projectNo}-{clientName}-brief-r{revision}.pdf` |
| Cutlist PDF | `SV-{projectNo}-{clientName}-cutlist-r{revision}.pdf` |
| Cutlist CSV | `SV-{projectNo}-{clientName}-cutlist-r{revision}.csv` |
| Panel Labels | `SV-{projectNo}-{clientName}-labels-r{revision}.pdf` |
| Job Summary | `SV-{projectNo}-{clientName}-summary-r{revision}.pdf` |
| Full Backup | `SV-backup-{YYYY-MM-DD}.json` |

## CSV Column Contract (Cutlist Export)

```
Project No | Room | Module | Part Code | Part Name | Material | Thickness (mm) | Length (mm) | Width (mm) | Quantity | Grain Direction | Edge Top | Edge Right | Edge Bottom | Edge Left | Notes
```