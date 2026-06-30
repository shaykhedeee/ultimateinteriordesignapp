# Command Center Visual Polish

Date: 2026-06-02

## Purpose

Move the sellable Spacious Venture app closer to the supplied dark/gold command-center target while keeping the actual client scope focused on:

- client onboarding
- PDF design brief output
- cutlist project workflow
- admin/project readiness tracking

## Implemented

- Dark command-center treatment for `Command Center`.
- Dark CRM treatment for `Projects`.
- Dense project pipeline table with real project data:
  - client/project
  - budget
  - room count
  - stage
  - floor-plan status
  - proposal status
  - next action
  - readiness confidence
- Right-side sales readiness rail:
  - intake
  - floor plan
  - PDF brief
  - proposal export
  - cutlist project
- Reusable image-match panel.
- Material confidence panel.
- Proposal action panel.
- Cutlist Project stage filter.
- Mobile collapse for command-table rows.

## Design Direction

The dashboard now follows the reference direction more closely:

- black/near-black workspace
- gold active states and action buttons
- compact data density
- left vertical navigation
- dark bordered panels
- table-first CRM layout
- right rail for readiness and actions

The PDF Briefs and Cutlists screens were darkened in the next pass; see `14_dark_briefs_cutlists_polish.md`.

## QA Evidence

Verified on 2026-06-02:

- `npm run build` passed.
- Command Center browser QA:
  - 6 command project rows rendered.
  - right rail rendered.
  - sales readiness checklist rendered.
  - no console errors.
- Projects browser QA:
  - 38 CRM rows rendered.
  - Cutlist Project filter rendered.
  - no console errors.
- Screenshots:
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\command-center-v3-dark-fixed.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\command-center-v3-mobile.png`
  - `C:\Users\USER\AppData\Local\Temp\spacious-venture-qa\projects-v3-dark-fixed.png`

## Remaining Visual Work

Next pass:

- Add print-preview thumbnails for generated PDF brief and cutlist PDF.
- Add studio branding settings for logo, proposal footer, and commercial handover details.
- Add deployment/handover packaging for a client demo.
