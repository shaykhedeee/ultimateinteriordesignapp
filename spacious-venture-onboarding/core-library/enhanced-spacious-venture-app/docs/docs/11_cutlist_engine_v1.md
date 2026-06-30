# Cutlist Engine V1

Date: 2026-06-02

## Purpose

The Cutlist Engine V1 turns an approved Spacious Venture PDF brief into a workshop-facing production draft.

It is intentionally practical and conservative:

- It creates module schedules from selected rooms and floor-plan markers.
- It generates part rows with dimensions, quantity, material, edge banding, grain, and notes.
- It estimates board area, sheet count, and edge-banding length.
- It exports a workshop CSV.

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
- API created a cutlist for project `Nw6CK2vUfGh3`.
- Generated result:
  - 8 modules
  - 68 part rows
  - 79 total parts
  - 90.48 sqm board area estimate
  - 31 estimated sheets
  - 322.7m estimated edge banding
- CSV exported to:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1.csv`
- Browser screenshot:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1-ui.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v1-parts.png`

## Known Limits

- Sheet count is area-based, not optimized nesting.
- It does not yet generate SVG sheet layouts.
- It does not yet support manual module editing in the UI.
- It does not yet export cutlist PDF.
- Final measurements still need site verification before cutting.

## Next Phase

Phase 4 should add:

- editable module dimensions
- manual add/remove module
- regenerate parts after edits
- sheet stock library
- guillotine-friendly layout optimizer
- SVG sheet diagrams
- cutlist PDF export
- unplaced part warnings

