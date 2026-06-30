# C1301 Production Cutlist Learning

## What The CEO Provided

The supplied production package is a completed Spacious Venture/Spacious Interios factory handoff for project `C1301`:

- `Incor C1301.xlsx` - primary MaxCut-style production workbook.
- `Job Summary C1301.Pdf` - optimized-sheet and wastage summary.
- `Panel Labels C1301.Pdf` - sheet/panel labels for workshop handling.
- `Incor_C1301_Working Drawings.pdf` - drawing reference package for measurement validation.
- `Incor C1301_Final Render.pdf` - final visual reference package.

## Workbook Contract Extracted

`Incor C1301.xlsx` is the most important training source because it is structured enough to parse reliably.

- Master sheet: `Sheet1`.
- Master columns: `Type`, `Name`, `Length`, `Width`, `Quantity`, `Notes`, `Can Rotate`, `Material`, four edge-band fields, and extra notes/groups.
- Detected from C1301: `63` module/section headings, `519` part rows, `877` total panel pieces, `32` material groups, and `27` edge-band groups.
- Separate requirement sheets:
  - `PLY`: raw board requirement, including `COM_16.MM`, `COM_6.MM`, `HDHMR_18.MM`.
  - `LAMINATE`: laminate requirement, including `8609 GFP Frosty White`, `4211-EH Bourbone walnut`, `DA 325`, `DA 302`, `UL 688`, `DG 638`, `MR 2164`, `8926 SMT`, `9120 SF`.

## Production Rules Learned

The app must model production cutlists as factory data, not only designer module notes.

- Every module has a heading such as `TV-BOX-2`, `KITCHEN LOFT BOX-26`, `MBR BOX-31`, `SHOE RACK BOX-61`.
- Part names encode role and room: `S/P`, `TOP`, `BTM`, `BACK`, `V/P`, `F/S`, `FACIA`, `DR-S/P`, `DR-BK`, `DR-F/T`, `SK`, `DOOR`, `FILLER`, `DUMMY`.
- Formulas matter: many dimensions are derived from parent cabinet dimensions and production offsets, not typed manually.
- Materials are compound strings such as `16MR F+F`, `16MR 4211 EH+F`, `18HDHMR DA 325+F`, `6MR F+F`.
- Edge banding must be edge-specific: length 1, length 2, width 1, width 2, commonly `0.8MM F`, laminate-code edges, and selected `2MM` visible edges.
- Sheet basis is `2440 x 1220 mm`; C1301 job summary reports `128` optimized sheets, `877` total panels, `23.68%` wastage, `118` unique layouts, and `59` materials.
- Panel labels must include project, sheet number, panel number, part name, material, dimensions, date, and edge labels.

## Implemented In This Pass

- Added a production workbook import pipeline for C1301-style Excel files.
- Added persistent `production_project_imports` storage and backup/export coverage.
- Added `/api/cutlists/imports` endpoints for list/import/detail.
- Added Cutlists screen workbook upload and imported-project intelligence cards.
- Attached imported production patterns to refreshed generated cutlists as `productionLearning`.

## Next Build Sequence

1. **Production Import V2**
   - Add PDF uploads beside Excel imports.
   - Extract Job Summary totals and compare them against workbook totals.
   - Store Panel Label text/indexes as label templates.

2. **Precision Cutlist Engine V2**
   - Replace generic part generation with template-driven formulas learned from imported projects.
   - Add parent module dimensions, formula expressions, offsets, grain lock, edge lock, and role-specific defaults.
   - Add warnings for oversized panels, missing edge bands, missing material codes, and suspicious zero/blank quantities.

3. **Floor Plan Analyzer V2**
   - Use uploaded floor plan plus manual annotations as the source of truth.
   - Add room measurement capture, wall lengths, openings, service points, and component placement.
   - Convert marked components into cutlist modules with required dimensions and placement constraints.

4. **Working Drawing Comparison**
   - Import working drawing PDFs as reference files.
   - Let designers manually map drawing pages to rooms/modules.
   - Compare module schedule against drawing-derived dimensions and show mismatch warnings before export.

5. **Factory Package Export**
   - Generate four deliverables from one approved cutlist:
     - editable workbook/CSV,
     - job summary PDF,
     - panel labels PDF,
     - production sign-off PDF.
   - Keep the current cutlist PDF as an internal review document, not the final factory package.

## Acceptance Target

The app should eventually take a previous finished project like C1301, learn its production structure, then let a designer create a new client project where floor-plan annotations and requirements produce a comparable production package with module sections, formulas, edge bands, material requirement summaries, optimized-sheet summary, and panel labels.
