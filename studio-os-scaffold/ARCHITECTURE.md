# StudioOS Scaffold Architecture

## Runtime Strategy

This scaffold supports two execution modes:

1. `DATA_MODE=memory`
   - fastest development mode
   - seeded mock data
   - real CRUD flows without requiring Postgres
   - ideal for validating UX, workflows, contracts, and orchestration

2. `DATA_MODE=postgres`
   - long-term production mode
   - Postgres-backed persistence using the migration pack in `apps/api/db/migrations`

## Current Phase

This scaffold is in **Phase 2B**:
- full mock repositories
- CRUD-capable services and routes
- workflow state transitions
- frontend screens consuming real API endpoints

## Backend Layers

- `src/lib/mock-store.ts` — in-memory state and seed data
- `src/repositories/mock/*` — repository abstraction over in-memory entities
- `src/modules/*` — service + route modules by domain
- `src/lib/workflow.ts` — stage order, readiness, and next-action logic

## Frontend Layers

- `app/(studio)` — route screens
- `components/layout` — shell, sidebar, topbar, right rail
- `components/screens` — workflow screens with API integration
- `lib/api.ts` — minimal API client helpers

## Why This Approach Is Cost-Effective

This approach proves product correctness before expensive investment in:
- advanced CV
- always-on GPU rendering
- full production deployment
- complex auth and tenancy

It is the fastest way to validate the system logic while preserving the final architecture.
