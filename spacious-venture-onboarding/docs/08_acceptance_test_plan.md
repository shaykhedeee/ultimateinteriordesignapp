# Acceptance Test Plan

## App Load

- Open `http://127.0.0.1:5175/`.
- Confirm Command Center loads.
- Confirm no framework overlay.
- Confirm no console errors.
- Confirm Add Client button is visible.

## Onboarding Test

Scenario:

- Client: Raghav & Meera Iyer.
- City: Bengaluru.
- Home: 3BHK.
- Rooms: Living, Kitchen, Master, Kids, Pooja.
- Budget: Premium.

Steps:

1. Click Add Client.
2. Fill profile.
3. Select rooms.
4. Upload floor plan image/PDF.
5. Draw zones and markers.
6. Add material preferences.
7. Add production notes.
8. Save project.

Expected:

- Project record is created.
- Floor plan is stored.
- Intake completion/readiness updates.

## PDF Brief Test

Steps:

1. Generate PDF Brief.
2. Open exported PDF.
3. Confirm pages:
   - cover
   - client summary
   - floor plan
   - room scope
   - module schedule
   - materials
   - sign-off

Expected:

- PDF file is stored in `storage/proposals` or future `storage/briefs`.
- PDF includes current project data.
- Revision number increments if regenerated.

## Cutlist Module Test

Create:

- Kitchen base cabinet 600W x 720H x 560D.
- Wardrobe 1800W x 2400H x 600D.
- TV unit 2400W x 450H x 400D.

Expected:

- Parts generated:
  - side panels
  - top/bottom
  - shelves
  - back
  - shutters/fronts
  - fillers if configured
- Quantities match module quantity.
- Edge banding is assigned.

## Sheet Optimizer Test

Settings:

- Sheet: 2440 x 1220 mm.
- Board thickness: 18 mm.
- Back panel: 8 mm.
- Kerf: 3 mm.
- Trim: 10 mm.
- Grain: vertical for shutters, free rotation for carcass.

Expected:

- Parts are grouped by material/thickness/grain.
- Sheet layouts are generated.
- Waste percentage is calculated.
- Unplaced parts are flagged.

## Cutlist Export Test

Steps:

1. Export Cutlist CSV.
2. Export Workshop PDF.

Expected CSV columns:

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

Expected PDF:

- project summary
- module summary
- part list
- sheet diagrams
- waste summary
- workshop sign-off

## Visual QA

Desktop:

- 1600 x 1000.
- Sidebar visible.
- Table fits.
- Right inspector visible.
- No text clipping.

Mobile:

- 390 x 900.
- Sidebar hidden.
- Table becomes cards.
- Actions remain reachable.
- No horizontal overflow.

## Regression Tests

- Existing projects open.
- Backups export.
- Floor-plan uploads still work.
- Material filters still work.
- PDF export still works.

