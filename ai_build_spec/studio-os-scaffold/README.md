# StudioOS Scaffold

Implementation-grade starter scaffold for the Ultimate Interior Designer App / StudioOS for Interiors.

## Packages
- `apps/api` — modular Express + TypeScript API scaffold
- `apps/web` — Next.js App Router frontend scaffold
- `packages/contracts` — shared TypeScript contracts and zod validators
- `packages/rules` — rule seeds and JSON loaders

## Quick Start
```bash
pnpm install
pnpm dev:api
pnpm dev:web
```

## Default Runtime Mode
The API scaffold defaults to:
- `DATA_MODE=memory`

This makes the system runnable immediately with seeded mock data and real CRUD behavior in memory.
Switch to `DATA_MODE=postgres` when you are ready to wire the services to Postgres.

## Migrations
SQL migrations live in:
- `apps/api/db/migrations`

## OpenAPI
Contracts live in:
- `apps/api/openapi/openapi-core.yaml`
- `apps/api/openapi/openapi-commercial.yaml`

## Important
This is a scaffold, not the finished product. It is designed to align with the full spec in `/home/user/ai_build_spec`.
