# Current App Scan

## Repository Shape

The workspace currently contains two generations of the app:

- Static prototype files at the root:
  - `index.html`
  - `app.js`
  - `data.js`
  - `style.css`
  - `ai-engine.js`
  - `floorplan-canvas.js`
  - `standards.js`
- Current backend-backed app:
  - `frontend/` React + Vite app.
  - `server/` Node/Express API.
  - `storage/` SQLite database, generated assets, floor plans, and proposal PDFs.
  - `client-brief/` static HTML proposal documents.

The current production direction should be based on the React/Express app. The older static files are useful as migration references for existing brief/cutlist copy and standards, but should not remain the active architecture.

## Current Frontend

Main files:

- `frontend/src/App.jsx`
  - Holds global state for active nav, intake form, floor plan draft, selected project, design package, library, laminates, provider status, and admin/project lists.
  - Handles project creation, package generation, floor-plan upload, reference upload, proposal PDF export, and opening saved projects.
- `frontend/src/components/StudioShell.jsx`
  - Premium sidebar/topbar wrapper.
  - Left/right splitter behavior.
- `frontend/src/screens/DashboardScreen.jsx`
  - Main design desk with onboarding panel, canvas/moodboard area, and inspector.
- `frontend/src/screens/ManagementScreens.jsx`
  - Admin dashboard, Project CRM, Gallery, Materials, Renders, Packages, Settings, Help.
- `frontend/src/components/OnboardingPanel.jsx`
  - Current intake steps:
    - Lifestyle
    - Budget
    - Rooms & Spaces
    - Floor Plan & Layout
    - Style Preferences
    - Vastu & Orientation
    - Cooking Habits
    - References
- `frontend/src/components/FloorPlanScene.jsx`
  - Upload and annotate floor plans.
  - Supports zones and markers.
- `frontend/src/data/studioData.js`
  - Rooms, styles, nav, showcase images, gallery items, playbook, starter project, and workflow definitions.

## Current Backend

Main files:

- `server/index.js`
  - Express app, static storage/image serving, API route mounting.
- `server/services/database.js`
  - SQLite schema:
    - `client_projects`
    - `space_profiles`
    - `design_packages`
    - `moodboards`
    - `floor_plans`
    - `generated_assets`
    - `laminate_products`
    - `inspiration_references`
- `server/services/design-engine.js`
  - Project normalization, design package generation, laminate matching, prompt construction, reusable asset matching.
- `server/routes/projects.js`
  - Project create/get/list.
  - Floor-plan upload/get.
  - Generate package/room.
  - Uploaded assets.
- `server/routes/proposals.js`
  - PDF proposal generation through PDFKit.
- `server/routes/materials.js`
  - Laminate filtering.
- `server/routes/library.js`
  - Reusable generated asset library and backup import/export.
- `server/routes/admin.js`
  - Admin metrics.

## Current Deliverable Gap

The app currently behaves more like an AI moodboard/design package tool than a focused client deliverable tool.

What exists:

- Good onboarding foundation.
- Floor-plan upload and annotation.
- Project records.
- PDF proposal export.
- Laminate/material shortlist.
- Admin/CRM shell.
- Reusable asset library.

What is missing for the narrowed client request:

- A dedicated "Brief Builder" model separate from AI moodboards.
- A PDF brief template designed as the primary output, not a secondary package export.
- A cutlist project model.
- Cabinet/unit definitions.
- Part generation rules for carcass, shutters, shelves, backs, drawers, fillers, skirting, panels, and edge banding.
- Sheet stock/material inventory.
- Kerf, trim, grain, rotation, banding, and nesting rules.
- Cutlist export PDF/CSV/SVG labels.
- Clear project lifecycle from intake to final brief and cutlist sign-off.

## Static Proposal Assets

The `client-brief/` folder contains two large static HTML proposal documents:

- `spacious-venture-proposal.html`
  - General AI design studio proposal.
  - Useful for PDF brief copy, onboarding narrative, BOQ/material discussion, and client-facing tone.
- `spacious-venture-cutlist-proposal.html`
  - AI modular cutlist and nesting optimizer proposal.
  - Useful for cutlist scope:
    - panel layout
    - guillotine cutting
    - kerf and trim
    - grain alignment
    - carcass presets
    - cutting maps
    - cost/waste tracking

These should be converted from static proposal documents into functional product specs and PDF templates.

## Architecture Direction

Keep:

- React + Vite frontend.
- Express API.
- SQLite for local-first MVP.
- Filesystem storage for PDFs, uploaded floor plans, and generated cutlist diagrams.

Refocus:

- Replace moodboard-first navigation with project-deliverable navigation.
- Make "Add Client" the only start point.
- Make "PDF Brief" and "Cutlist" the main outputs.
- Make AI image generation optional/future.

