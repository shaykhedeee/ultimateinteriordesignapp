# Research And Market Analysis

## Sources Reviewed

Competitor and process references:

- Livspace full-home interiors: https://www.livspace.com/in/interiors/offerings/full-home-interiors
- HomeLane interior designer/SpaceCraft-style flow: https://www.homelane.com/cities/interior-designers-hyderabad
- Bonito Designs process: https://bonito.in/how-it-works/

Cutlist and production workflow references:

- MaxCut panel optimization/cutting software: https://www.maxcutsoftware.com/
- CutList Plus: https://cutlistplus.com/
- OptiCut panel cutting optimization: https://www.boole.eu/en/opticoupe-coupe-panneaux-bois-verre-metal/
- SketchList cabinet/cutlist concepts: https://sketchlist.com/

Material and laminate references already used in the app:

- Merino laminates: https://www.merinolaminates.com/en/product-category/laminates/
- Greenlam laminates: https://www.greenlamindustries.com/what-we-do/laminates.html
- Royale Touche products: https://royaletouche.com/products/
- Century Acrylo: https://www.centuryply.com/acrylo/cl/
- Airolam anti-fingerprint laminates: https://airolam.com/product-listing/anti-finger-print-laminates

## Competitor Flow Takeaways

### Livspace

Livspace positions the journey around consultation, design, catalogue/material selection, project management, and full-home delivery. The key lesson is that clients need a managed process, not just visual inspiration. A dashboard should show stage, selections, and deliverables clearly.

Implication for Spacious Venture:

- Intake should produce a structured brief.
- The brief should become the internal project handoff.
- Material selections need source, finish, use case, and maintenance rationale.
- Project status should be visible in an admin/CRM table.

### HomeLane

HomeLane's public positioning emphasizes floor-plan intake, 3D visualization, real-time design changes, and budget clarity.

Implication for Spacious Venture:

- Floor plan upload should remain.
- V1 should not promise exact CAD rendering.
- The app should convert floor plan + room requirements into:
  - room list
  - furniture/unit schedule
  - brief notes
  - cutlist-ready unit assumptions

### Bonito

Bonito sells a premium consultation experience with a quick first design presentation, moodboards, space planning, and estimate direction.

Implication for Spacious Venture:

- The UI should feel premium and consultative.
- The PDF brief should look like a polished studio deliverable.
- The first deliverable should be fast and credible: client brief + selections + next steps, not a huge open-ended AI gallery.

## Cutlist Product Research Takeaways

Cutlist and panel optimization tools generally include:

- Project/job records.
- Material/sheet library.
- Part list input.
- Cabinet or assembly templates.
- Board dimensions.
- Kerf thickness.
- Edge trim margin.
- Grain direction.
- Rotation permissions.
- Edge banding per side.
- Quantity and labels.
- Optimization/nesting.
- Waste percentage.
- Cut diagrams.
- Printable reports.
- CSV export for production teams.

## What Spacious Venture Should Build

The app should not try to become a full CAD system in V1.

It should become a structured operating system for:

1. Capturing the client's design and production requirements.
2. Producing a polished PDF onboarding/design brief.
3. Creating a cutlist project from rooms/modules.
4. Producing workshop-ready part lists and sheet plans.

## Differentiation

Most interior platforms optimize for visual sales. Most cutlist tools optimize for workshop math. Spacious Venture can sit between both:

- Design intake speaks the client's language.
- PDF brief speaks the designer/client handoff language.
- Cutlist speaks the workshop/fabrication language.

That bridge is the sellable value.

## Product Risks

- Overbuilding AI image generation before the PDF/cutlist core is stable.
- Claiming exact floor-plan intelligence without enough CAD/vision support.
- Generating cutlists from vague design data without explicit unit dimensions.
- Failing to separate client-facing brief language from workshop cutlist language.
- Missing material constraints such as sheet thickness, grain, edge banding, and hardware allowances.

## Recommended Scope Boundary

MVP should include:

- Manual/project intake.
- Floor plan upload and markup.
- Room/module schedule.
- PDF brief.
- Cutlist module input.
- Part generation from templates.
- CSV/PDF cutlist export.
- Simple guillotine-style sheet layout.

Post-MVP should include:

- AI floor plan extraction.
- Advanced nesting optimization.
- Vendor catalogue sync.
- BOQ/pricing.
- Multi-team scheduling.
- AI image generation as an optional sales add-on.

