# Feature Enhancement Pass

## What Changed

This pass adds a cross-feature intelligence layer instead of treating each screen as a separate island.

New backend service:

- `server/services/feature-intelligence.js`

New endpoint:

- `GET /api/admin/feature-intelligence`

Admin summary now includes:

- `featureIntelligence.overallScore`
- `featureIntelligence.features`
- `featureIntelligence.priorityActions`
- `featureIntelligence.boundary`

Preflight now verifies that the feature intelligence contract is available.

## Features Covered

- Onboarding
- Floor-plan intelligence
- AI render review
- PDF brief desk
- Cutlist handoff
- Reference and material library
- Multimodal AI layer
- Website/software boundary
- Deliverables vault

## Why This Is The Best Enhancement Path

The app already has the main modules. The weak point was not one missing screen; it was that readiness and next actions were scattered across routes, UI panels, and docs.

The new layer reads real database and provider state, then produces one operator-facing feature map. That lets the Admin dashboard answer:

- what is working,
- what is weak,
- what to do next,
- whether public website and private software are still separated.

## Operating Rule

Do not add public website behavior into Studio OS screens. The public website stays in `public-website/`; the internal software stays in `frontend/`, `server/`, and `storage/`.
