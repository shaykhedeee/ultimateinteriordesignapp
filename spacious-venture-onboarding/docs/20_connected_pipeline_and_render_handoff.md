# Connected Pipeline And Render Handoff

## Implemented Scope

The app now treats Spacious Venture work as one connected studio pipeline instead of separate pages.

The operating flow is:

1. Client Intake
2. Floor Plan
3. AI Render Review
4. PDF Brief
5. Cutlist
6. Deliverables

## Backend Changes

- Project summaries now include render review counts:
  - `reviewedRenderCount`
  - `approvedRenderCount`
- Project stage calculation now understands:
  - `Render Review`
  - `Render Approved`
  - `PDF Brief`
  - `Cutlist Project`
- Admin summary now exposes a `workflow` object for dashboard and pipeline screens:
  - intake totals
  - render generation, review, and approval counts
  - PDF proposal export counts
  - cutlist and production import counts
  - deliverable document counts

## Frontend Changes

- Added a new `Pipeline` sidebar page.
- Added a connected kanban board with columns for intake, floor plan, renders, PDF brief, cutlist, and deliverables.
- Project rows now open to the correct next screen instead of always opening onboarding.
- CRM rows include quick actions for Intake, Renders, and Cutlist.
- Command Center readiness now includes approved AI renders and imported production standards.
- AI Render Studio now has a connected handoff panel:
  - approved renders unlock PDF brief generation
  - approved renders unlock cutlist project creation

## Product Reasoning

Spacious Venture needs a sellable internal tool that quickly converts onboarding information into accurate first-reveal visuals, a PDF brief, and a production cutlist. The key product risk was disconnected modules. This pass makes the system feel like one app by forcing every project to show:

- current stage
- readiness score
- missing operational step
- next screen/action
- downstream handoff path

## Next Build Priorities

1. Add per-project owners and due dates to the pipeline board.
2. Add render approval gating in PDF export, so the PDF can warn when no client-ready image is approved.
3. Add a client-share package screen with expiring local links or ZIP export.
4. Add a production checklist on cutlist projects before CSV/PDF export.
5. Add PDF preview thumbnails for all deliverables in the document vault.
