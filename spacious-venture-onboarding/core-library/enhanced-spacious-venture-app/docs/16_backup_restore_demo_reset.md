# Backup, Restore, And Demo Reset

Date: 2026-06-04

## Purpose

This pass makes the app safer to sell, demo, and hand over by adding a proper studio maintenance workflow:

- full backup export
- backup import/restore
- guarded sample demo reset
- Settings-screen controls for non-technical operators

The implementation protects the core client scope: onboarding, PDF brief, floor-plan records, reusable assets, material libraries, and cutlist project data.

## Implemented

Backend:

- Added `server/services/backup-service.js`.
- Upgraded `GET /api/library/export` to backup schema `version: 2`.
- Added `GET /api/library/export?files=metadata` for lightweight metadata-only backup checks.
- Kept default `GET /api/library/export` as a full backup including storage file payloads.
- Reworked `POST /api/library/import` to support:
  - merge mode
  - replace mode
  - projects
  - space profiles with relational `projectId`
  - design packages
  - moodboards
  - floor plans
  - generated assets
  - cutlist projects, modules, and parts
  - laminate products
  - inspiration references
  - storage files under `storage/assets`, `storage/uploads`, `storage/floor-plans`, and `storage/proposals`
- Added `POST /api/admin/demo-reset`.
- Protected demo reset with confirmation phrase `RESET DEMO`.
- Demo reset rebuilds:
  - sample Iyer residence project
  - SVG floor plan preview
  - manual room zones and component markers
  - generated PDF brief package data
  - cutlist project
  - seeded laminate and inspiration libraries

Frontend:

- Added backup/restore/demo-reset controls to `Studio Settings`.
- Added `Export Full Backup`.
- Added JSON backup import.
- Added merge/replace import option.
- Added guarded reset input requiring `RESET DEMO`.
- Added maintenance busy state and status messages.
- Added responsive dark/gold command-center styling for desktop and mobile.

## QA Evidence

API checks:

- `GET /api/library/export?files=metadata` returned `version=2`.
- Metadata export reported:
  - `projects=38`
  - `floorPlans=4`
  - `cutlists=1`
  - `storageFiles=0`
- Full export reported:
  - `includesFiles=true`
  - `storageFiles=736`
  - `totalFileBytes=284076822`
- Wrong demo reset phrase returned HTTP `400`, proving the guard is active.
- Slim merge import using an existing project returned `imported=true` without creating duplicate test projects.

Build and syntax:

- `node --check server/services/backup-service.js` passed.
- `node --check server/routes/library.js` passed.
- `node --check server/routes/admin.js` passed.
- `npx.cmd vite build frontend --outDir ..\qa-artifacts\build-out --emptyOutDir` passed.

Browser QA:

- Playwright fallback with installed Chrome verified `Studio Settings`.
- Desktop:
  - 10 identity inputs
  - 5 proposal/handover text areas
  - 5 provider rows
  - backup/export/import/reset controls present
  - no console errors
  - no horizontal overflow
- Mobile:
  - settings page stacks cleanly
  - backup/import/reset controls visible
  - no horizontal overflow

Screenshots:

- `qa-artifacts/settings-v6-maintenance-desktop.png`
- `qa-artifacts/settings-v6-maintenance-mobile.png`
- `qa-artifacts/settings-v6-maintenance-panel-fixed.png`

## Important QA Note

The destructive happy path for `POST /api/admin/demo-reset` was not executed during this pass to avoid wiping the user's existing 38-project local workspace. The route guard, service syntax, startup, and surrounding backup/import flows were verified. A real reset should be tested after exporting and saving a full backup.

## Remaining Sale-Ready Work

Recommended next pass:

- Add a visible backup history table with file size, created date, and restore action.
- Add PDF thumbnail/history cards for exported briefs and cutlist PDFs.
- Add first-run setup wizard for studio branding.
- Add authentication and role permissions before multi-user resale.
- Add a packaged installer/deployment guide for Windows studio systems.
