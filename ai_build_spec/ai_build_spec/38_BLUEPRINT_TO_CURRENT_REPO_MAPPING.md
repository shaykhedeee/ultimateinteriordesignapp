# 38 — AURA Blueprint to Current Repo Mapping

## Purpose

This document maps the major blueprint concepts to the current StudioOS scaffold so future AI coders and engineers know where each idea should live.

---

## 1. Client Layer Mapping

### Blueprint idea
- web app
- desktop app
- mobile app
- AR/VR layer

### Current repo mapping
- `apps/web` = current primary product surface
- desktop/mobile/AR remain future layers, not current blockers

### Decision
Keep current focus on web. Add wrappers later.

---

## 2. Real-Time Engine Mapping

### Blueprint idea
- 3D viewport
- physics engine
- collaborative engine

### Current repo mapping
- `apps/web/components/design2d/*`
- `apps/web/components/design3d/*`
- `apps/web/components/designstudio/*`
- `apps/api/src/modules/*` for state mutation and versioning

### Decision
The collaboration engine remains a later addition after editor correctness is proven.

---

## 3. AI Orchestration Mapping

### Blueprint idea
- design AI
- spatial AI
- style transfer
- NLP command engine
- vision analysis
- learning loop

### Current repo mapping
- `ai_build_spec/23_AGENTIC_OS_OODA_INFINITE_BRAIN_INTEGRATION.md`
- future `services/cv-intelligence`
- future `services/ai-inference`
- current inbox and event foundation for future routing

### Decision
Build agentic OS as a platform layer, not a gimmick, and not before core workflows are stable.

---

## 4. Backend Services Mapping

### Blueprint idea
- API gateway
- asset management
- render farm
- user management
- payment engine

### Current repo mapping
- `apps/api/src/modules/*`
- `apps/api/src/repositories/mock/*`
- migrations in `apps/api/db/migrations`
- render and finance mocks already in place

### Decision
Current modular Express structure is the right interim implementation.

---

## 5. Data & Storage Mapping

### Blueprint idea
- PostgreSQL + PostGIS + vector DB + cache
- object storage
- AI data layer

### Current repo mapping
- `10_EXACT_DATABASE_SCHEMA_POSTGRES.sql`
- `sql_migrations/*`
- shared contracts under `packages/contracts`
- rules under `packages/rules`

### Decision
Keep Postgres as canonical future system of record. Do not explode into too many databases prematurely.

---

## 6. Rendering Mapping

### Blueprint idea
- real-time preview
- AI-enhanced render
- path-traced render
- cinematic/immersive output

### Current repo mapping
- `apps/web/components/design3d/*` = lightweight preview
- render route/service/output repositories = orchestration foundation
- `30_WEBGL_REACT_THREE_FIBER_UPGRADE_PATH.md` = future R3F path

### Decision
Current staged rendering path is correct.

---

## 7. Catalog Mapping

### Blueprint idea
- huge product/material library with metadata

### Current repo mapping
- `apps/api/src/lib/furniture-catalog.ts`
- `apps/api/src/repositories/mock/materials.repository.ts`
- `apps/web/components/designstudio/FurnitureCatalogPanel.tsx`
- `apps/web/components/screens/MaterialsCatalogScreen.tsx`

### Decision
Grow these catalog layers aggressively; this is one of the highest-value product areas.

---

## 8. Final Mapping Rule

> Every good idea in the blueprint should map to an existing or future module in the current StudioOS architecture. If an idea does not fit the current geometry-first, version-safe architecture, adapt it before implementation rather than forcing it in literally.
