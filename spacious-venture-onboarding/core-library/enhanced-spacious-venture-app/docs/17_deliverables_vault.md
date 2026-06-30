# Deliverables Vault

Date: 2026-06-04

## Purpose

This pass turns exported files into visible studio records instead of one-off downloads. It supports the sellable workflow by giving the admin team a single place to reopen, audit, download, and back up client handoff documents.

The vault covers the core client-requested deliverables:

- onboarding PDF brief
- cutlist PDF
- full backup coverage for stored PDF files

## Implemented

Backend:

- Added `server/services/document-vault.js`.
- Added `GET /api/admin/documents`.
- The document API scans:
  - `storage/proposals`
  - `storage/cutlists`
- Each document record includes:
  - type
  - title
  - client name
  - project ID
  - cutlist ID/revision where available
  - file URL
  - file size
  - updated date
  - status summary
  - metadata chips
- Admin summary now includes:
  - proposal PDF count
  - cutlist PDF count
  - total stored document count
- Database setup now ensures `storage/cutlists` exists.
- Full backup now includes `storage/cutlists` files.

Frontend:

- Added `Deliverables` to the left navigation.
- Rebuilt `Packages & Deliverables` as `Deliverables Vault`.
- Added export readiness KPIs:
  - PDF briefs
  - cutlist PDFs
  - active project files
  - total stored documents
- Added document filters:
  - all documents
  - PDF briefs
  - cutlist PDFs
- Added document cards with:
  - PDF-style thumbnail block
  - title/client/date
  - status
  - metadata chips
  - open link
  - download link
- Added vault refresh action.
- Refreshes document state after PDF brief and cutlist PDF exports.

## QA Evidence

API:

- `GET /api/admin/documents` returned:
  - `total=10`
  - `proposalBriefs=9`
  - `cutlistPdfs=1`
- First cutlist document returned:
  - `status="8 modules / 68 part rows"`
  - `url="/storage/cutlists/j-Mq5FCHz7HM-r2.pdf"`
- `GET /api/library/export?files=metadata` still returned backup schema `version=2`.

Build:

- `node --check server/services/document-vault.js` passed.
- `node --check server/routes/admin.js` passed.
- `node --check server/services/backup-service.js` passed.
- `npx.cmd vite build frontend --outDir ..\qa-artifacts\build-out --emptyOutDir` passed.

Browser QA:

- Playwright fallback with installed Chrome verified `Deliverables Vault`.
- Desktop:
  - Deliverables sidebar item opens the vault.
  - 10 document cards render.
  - 3 filters render.
  - export/full-backup actions render.
  - no console errors.
  - no horizontal overflow.
- Mobile:
  - document cards stack cleanly.
  - filters and actions remain visible.
  - no horizontal overflow.

Screenshots:

- `qa-artifacts/deliverables-v7-desktop.png`
- `qa-artifacts/deliverables-v7-mobile.png`

## Remaining Sale-Ready Work

Recommended next pass:

- Add PDF preview thumbnails generated from first page images.
- Add per-project file history on the project detail/brief screens.
- Add a share-with-client workflow with expiring local links or packaged ZIP export.
- Add first-run setup wizard for studio branding.
