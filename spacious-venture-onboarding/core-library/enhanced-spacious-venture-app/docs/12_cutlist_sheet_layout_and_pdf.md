# Cutlist Sheet Layout And PDF V2

Date: 2026-06-02

## What Changed

The Cutlists screen is now a practical production workspace, not only a generated summary.

Implemented:

- Editable module dimensions, room, type, material, finish, placement notes, and furniture requirements.
- Manual add/remove module controls.
- Backend part regeneration from saved modules.
- V1 sheet layout preview using 2440mm x 1220mm sheets, trim, kerf, and rotation fit checks.
- Oversize/manual-review warnings for parts that do not fit on the default sheet.
- Workshop cutlist PDF export with cover, module schedule, part list, sheet diagrams, warnings, and sign-off.
- CSV export remains available for spreadsheet/workshop handoff.

## API Added

- `PATCH /api/cutlists/:cutlistId/modules/:moduleId`
- `POST /api/cutlists/:cutlistId/modules`
- `DELETE /api/cutlists/:cutlistId/modules/:moduleId`
- `POST /api/cutlists/:cutlistId/generate-parts`
- `GET /api/cutlists/:cutlistId/sheets`
- `GET /api/cutlists/:cutlistId/pdf`
- `POST /api/cutlists/:cutlistId/pdf`

## Sheet Preview Rules

The layout preview is intentionally conservative:

- Default sheet: 2440mm x 1220mm.
- Trim: 10mm.
- Kerf: 3mm.
- Pieces are expanded by quantity.
- Larger pieces are placed first.
- Pieces can rotate when they fit better.
- Oversize pieces are not hidden; they are flagged for manual review.

This is suitable for proposal-stage workshop planning. It is not CNC nesting.

## PDF Contents

The cutlist PDF includes:

- Project/cutlist cover and revision summary.
- Module schedule with dimensions and finishes.
- Part list preview.
- Sheet layout diagrams.
- Oversize/manual-review list.
- Workshop verification and sign-off page.

## QA Evidence

Verified on 2026-06-02:

- `npm run build` passed.
- API edit/regenerate route saved a module and moved cutlist `j-Mq5FCHz7HM` to revision 2.
- API returned 8 modules, 68 part rows, 79 total parts, 40 sheet-preview sheets, and 10 manual-review pieces.
- PDF exported successfully:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2.pdf`
- Browser QA against `http://127.0.0.1:5175/` passed with no console errors.
- Visual screenshots:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-dashboard.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-editor-sheet.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-sheet-layout.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\cutlist-v2-mobile.png`

## Remaining Production Work

Next improvements:

- Site-measurement revision workflow.
- Board stock library with vendor sheet sizes and material SKUs.
- Better nesting with offcut reuse.
- Per-module drawing attachments.
- Approval trail before production release.
- Optional CNC/export format after working drawing validation.
