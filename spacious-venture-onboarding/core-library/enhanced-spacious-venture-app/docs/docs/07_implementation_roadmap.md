# Implementation Roadmap

## Phase 1: Scope Refactor

Goal:

Make the app match the narrowed product promise.

Tasks:

- Rename navigation around Command Center, Projects, Onboarding, PDF Briefs, Cutlists, Materials.
- De-emphasize AI Renders and Gallery.
- Replace "Generate Full Design Package" with "Generate PDF Brief".
- Keep floor plan and intake flow.
- Add a clear "Create Cutlist Project" action after brief generation.
- Add a PDF Brief screen with brief readiness, section checklist, and export actions.
- Add a Cutlists screen with module schedule, production defaults, and clear Phase 2 placeholders.
- Update dashboard copy from moodboard/package language to brief/cutlist readiness language.
- Keep AI image generation behind future/optional wording only.
- Preserve project data and generated proposals during the refactor.

Acceptance:

- Add Client starts onboarding.
- Onboarding can save a project.
- PDF Brief is the main deliverable.
- Cutlist is visible as the next production step.
- The first viewport reads like an operational admin product.
- Product/pricing docs are ready for a client conversation.

Implementation checkpoints:

1. Create or preserve a clean enhanced source snapshot.
2. Update documentation with design brief and product/pricing brief.
3. Refactor navigation labels and route mapping.
4. Update onboarding button and status copy.
5. Add PDF Briefs and Cutlists screens.
6. Run frontend build.
7. Browser-check dashboard, onboarding, PDF Briefs, and Cutlists.

## Phase 2: Brief Builder

Goal:

Create a structured brief separate from moodboard packages.

Tasks:

- Add `intake_briefs` table.
- Create brief generator service.
- Add brief editor/preview screen.
- Add PDFKit template for the onboarding brief.
- Track brief revisions.

Acceptance:

- A completed intake generates a brief record.
- PDF export includes client data, floor plan, room scope, material assumptions, and sign-off.

## Phase 3: Cutlist Data Model

Goal:

Create functional cutlist projects.

Tasks:

- Add cutlist tables.
- Add material sheet library.
- Add module/unit builder.
- Add part generator from module templates.
- Add CSV export.
- Implement project-to-cutlist creation from the approved PDF brief.
- Show module schedule, part rows, sheet estimate, board area, and edge-band estimate in the Cutlists screen.

Acceptance:

- User can create a wardrobe/base cabinet/TV unit.
- App generates part list with dimensions and quantities.
- App exports CSV.

Current V1 status:

- Implemented SQLite tables: `cutlist_projects`, `cutlist_modules`, `cutlist_parts`.
- Implemented `POST /api/projects/:id/cutlists`.
- Implemented `GET /api/projects/:id/cutlists`.
- Implemented `GET /api/cutlists/:cutlistId/csv`.
- Implemented module templates for TV units, kitchens, wardrobes, mandir, foyer, dining, study, utility, and custom storage.
- Implemented generated part rows and CSV export.
- Sheet optimizer remains Phase 4.

Verification evidence:

- API created an 8-module, 68-part cutlist for project `Nw6CK2vUfGh3`.
- CSV export generated `cutlist-v1.csv`.
- Browser QA verified the Cutlists screen displays modules, part rows, CSV action, and pricing card.


## Phase 4: Sheet Layout V1

Goal:

Add printable sheet plans.

Tasks:

- Implement simple guillotine-friendly placement.
- Respect sheet size, kerf, trim, grain, rotation.
- Generate SVG layout per sheet.
- Calculate waste.
- Add PDF cutlist export.

Acceptance:

- Parts are placed on sheets.
- Waste is calculated.
- PDF includes sheet diagrams and unplaced warnings.

## Phase 5: Dashboard Polish

Goal:

Match the supplied premium dark command-center reference.

Tasks:

- Convert current ivory dashboard screens into dark/gold command center style.
- Create dense project table.
- Add right-side brief/cutlist readiness inspector.
- Add bottom queue panels.
- Improve mobile row-card layout.

Acceptance:

- Command Center visually resembles the reference.
- First viewport is operational, not marketing-style.
- No text overlap on desktop/mobile.

## Phase 6: Reliability And Sale-Ready Packaging

Goal:

Make the app sellable.

Tasks:

- Backup/restore for all projects, briefs, cutlists, PDFs, and material libraries.
- Settings for logo/studio identity.
- Sample project templates.
- Error handling and empty states.
- Documentation and deployment notes.

Acceptance:

- A demo can be run from fresh install.
- Data can be exported.
- PDF/cutlist output survives app restart.

## Recommended Build Order

1. Data model migrations.
2. Brief generator and PDF.
3. Cutlist module builder.
4. Part generator.
5. CSV export.
6. Sheet optimizer.
7. Cutlist PDF.
8. Dark UI refactor.
