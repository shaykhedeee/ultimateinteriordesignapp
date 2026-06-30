# Cutlist Engine V1

Date: 2026-06-02

## Purpose

The Cutlist Engine V1 turns an approved Spacious Venture PDF brief into a workshop-facing production draft.

It is intentionally practical and conservative:

- It creates module schedules from selected rooms and floor-plan markers.
- It generates part rows with dimensions, quantity, material, edge banding, grain, and notes.
- It estimates board area, sheet count, and edge-banding length.
- It exports a workshop CSV.
- It now supports editable modules, regenerated part rows, sheet preview cards, and cutlist PDF export.

It does not yet perform CNC-grade nesting or exact site-verified production drawings.

## Implemented Backend

### Tables

- `cutlist_projects`
- `cutlist_modules`
- `cutlist_parts`

### API

- `POST /api/projects/:id/cutlists`
  - Creates or refreshes the active cutlist project for a client project.
  - Uses selected rooms, floor-plan markers, laminate matches, and project budget.

- `GET /api/projects/:id/cutlists`
  - Returns the active cutlist for a project.

- `GET /api/cutlists/:cutlistId`
  - Returns a cutlist by id.

- `GET /api/cutlists/:cutlistId/csv`
  - Exports the workshop CSV.

- `PATCH /api/cutlists/:cutlistId/modules/:moduleId`
  - Updates module dimensions, finish, material, room, placement notes, and furniture requirements.
  - Regenerates dependent part rows and sheet previews.

- `POST /api/cutlists/:cutlistId/modules`
  - Adds a manual module to an existing cutlist project.

- `DELETE /api/cutlists/:cutlistId/modules/:moduleId`
  - Removes a module and regenerates the part list.

- `POST /api/cutlists/:cutlistId/generate-parts`
  - Regenerates part rows from the current saved modules.

- `GET /api/cutlists/:cutlistId/sheets`
  - Returns the V1 sheet layout preview and waste/unplaced-piece summary.

- `GET /api/cutlists/:cutlistId/pdf`
  - Exports a workshop-facing cutlist PDF.

## Implemented Frontend

The `Cutlists` screen now supports:

- Real cutlist creation.
- Refreshing generated parts.
- Module cards with dimensions and finish.
- Summary cards:
  - modules
  - part rows
  - total parts
  - board area
  - estimated sheets
- Generated part table.
- CSV export action.
- Editable module form.
- Manual module add/remove.
- Regenerate parts action.
- Sheet layout preview cards.
- Oversize/unplaced piece warnings.
- Cutlist PDF export action.
- PDF brief export action.
- Production defaults inspector.
- Material confidence list.
- Commercial pricing block.

## V1 Module Templates

- Living TV Unit
- Kitchen Base Units
- Kitchen Wall Units
- Bedroom Wardrobe
- Mandir / Pooja Unit
- Foyer Shoe Storage
- Study Desk + Overhead
- Dining Crockery Unit
- Utility Storage
- Custom Storage

## Production Defaults

- Sheet basis: 2440mm x 1220mm.
- Carcass board: 18mm.
- Back panel: 6mm.
- Wet-zone board: BWP plywood.
- Dry-zone board: BWR/HDMR plywood.
- Visible edge band: 2mm PVC.
- Internal edge band: 0.8mm PVC.
- Kerf assumption: 3mm.
- Trim assumption: 10mm.

## Part Generation Logic

Each module produces a practical V1 part set:

- left side panel
- right side panel
- top panel
- bottom panel
- back panel
- adjustable shelves
- shutter/drawer fascia
- module-specific service/plinth parts where applicable

The part generator uses room/module defaults and can override dimensions from floor-plan marker size notes when the note contains values like `2400 x 2100 x 450`.

## Verification

Verified on 2026-06-02:

- `npm run build` passed.
- API created and edited a cutlist for project `Nw6CK2vUfGh3`.
- Generated result:
  - 8 modules
  - 68 part rows
  - 79 total parts
  - 90.48 sqm board area estimate
  - 31 area-estimated sheets
  - 40 V1 sheet-preview sheets after placement pass
  - 10 oversize/manual-review pieces
  - 322.7m estimated edge banding
- CSV exported to:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1.csv`
- PDF exported to:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2.pdf`
- Browser screenshot:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1-ui.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1-parts.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-dashboard.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-editor-sheet.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-sheet-layout.png`

## Known Limits

- Sheet layout is a V1 workshop planning preview, not CNC-grade nesting.
- Large back panels and tall surfaces can be flagged for manual split/special sheet review.
- It does not yet generate machine-ready CNC files.
- It does not yet manage vendor-specific board stock libraries or laminate catalogue codes.
- Final measurements still need site verification before cutting.

## Next Phase

Next phase should add:

- sheet stock library
- better nesting strategy with offcut reuse
- vendor material SKU/code selection
- per-room working drawing attachments
- cutlist revision approval trail
- production checklist by room/module
