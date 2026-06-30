# SQL Migration Pack

This folder contains a split Postgres migration pack for StudioOS for Interiors.

## Order

1. `000_extensions.sql`
2. `001_core_identity.sql`
3. `002_crm_projects.sql`
4. `003_intake_capture_assets.sql`
5. `004_floorplan_and_spatial_models.sql`
6. `005_scene_modules_rules.sql`
7. `006_materials_pricing_and_commercial.sql`
8. `007_renders_drawings_proposals.sql`
9. `008_approvals_production_jobs_reuse.sql`
10. `009_billing_procurement_and_variations.sql`
11. `010_finalize_constraints_and_indexes.sql`

## Notes

- The combined schema file remains available at `../10_EXACT_DATABASE_SCHEMA_POSTGRES.sql`.
- This migration pack is easier for AI agents and developers to execute incrementally.
- Commercial operations such as estimates, quotations, billing, payments, procurement, and change orders are added in migration `009`.
