# TypeScript Contracts Pack

This folder contains implementation-grade TypeScript contracts for StudioOS for Interiors.

## Files
- `enums.ts` — shared enums and string literal unions
- `scene.ts` — scene graph and spatial model interfaces
- `commercial.ts` — budget, estimate, invoice, payment, procurement, and variation contracts
- `api.ts` — common API DTOs and response envelopes
- `validators.ts` — zod validators for core entities and requests
- `index.ts` — barrel export

## Usage
These contracts are intended to be shared across:
- frontend app
- backend API
- worker services
- test fixtures

## Rules
- keep these files framework-agnostic
- avoid `any`
- treat these as the single typed contract source for API and scene modeling
