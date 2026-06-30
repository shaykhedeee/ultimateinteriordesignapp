# 18 — Cost, Timeline, Scalability, and Fastest Execution Plan

## 1. Purpose

This document defines the fastest realistic path to building the app with the strongest cost-to-value ratio.

It includes:
- recommended phased build strategy
- team assumptions
- rough cost ranges
- hosting/scaling direction
- fastest execution sequence

---

## 2. Cheapest Correct Strategy

The cheapest wrong strategy is:
- use only AI image generation
- fake editability
- do no canonical modeling
- add quote features later

That will produce a demo, not a business platform.

The cheapest correct strategy is:
1. build canonical schema and scene versioning first
2. use open-source planning/editor references to accelerate UI/editor work
3. use draft/review/final output tiers to control compute cost
4. build budget/quotation logic early so design is commercially grounded
5. delay full advanced CV/scan accuracy until human-review loop is stable

---

## 3. Recommended Team Shape

### Small but serious build team
- 1 product/solution architect
- 1 strong full-stack engineer
- 1 frontend/3D engineer
- 1 Python/CV engineer
- 1 designer/product QA (shared or part-time)

### Lean AI-assisted mode
With strong AI coding support, a smaller human team can move faster, but only if the architecture and contracts are explicit.

---

## 4. Realistic Build Phases

## Phase 1 — Core Foundations (4 to 6 weeks)
- schema
- contracts
- project/lead/intake flow
- floor plan upload
- scene shell
- first design studio scaffold
- budget profile and first estimate logic

## Phase 2 — Design Core (6 to 8 weeks)
- linked 2D/3D editing
- module templates
- rule engine v1
- materials and budget engine
- concept estimate and BOQ engine

## Phase 3 — Output Core (5 to 7 weeks)
- render studio
- drawing/elevation studio
- proposal generation
- approval workflow
- payment plan and invoice engine

## Phase 4 — Production Bridge (4 to 6 weeks)
- BOM
- cutlists
- procurement module
- variation orders
- handover/warranty flow

## Phase 5 — Intelligence and Optimization (ongoing)
- better CV models
- similarity reuse
- client portals
- richer catalogs
- analytics

---

## 5. Rough Build Timelines

### Fastest serious MVP
12 to 16 weeks

### Strong market-ready V1
20 to 28 weeks

### Robust scale-ready V2
30 to 40+ weeks

These depend heavily on:
- team size
- reuse of open-source editor concepts
- how much CV accuracy is expected in V1
- whether execution/billing/procurement is included from start

---

## 6. Rough Cost Estimate to Produce the App

These are **build estimates**, not public vendor pricing facts.

## Lean AI-assisted prototype build
- if using a small high-skill team: moderate cost, suitable for strong MVP
- likely range: low seven figures INR to mid seven figures INR depending on speed and team seniority

## More complete productized V1
- includes editor, render, drawings, commercial, and production bridge
- likely range: several million INR depending on in-house vs agency vs hybrid

## Cost drivers
- 3D/editor engineering
- CV/floor plan intelligence
- polished proposal/document generation
- render infrastructure
- QA across the full workflow

---

## 7. Ongoing Operating Cost Model

## Low-cost development mode
- Postgres on managed small instance
- object storage for assets
- Next.js web hosting
- API on modest container
- render workers on-demand only
- no always-on GPU

## Cost control levers
1. draft previews from web viewer, not GPU render
2. review renders on CPU-friendly or lower-cost workers where possible
3. final hero renders only on-demand
4. reuse templates and prior scenes aggressively
5. use human review before costly regeneration loops

---

## 8. Scalability Plan

## Stage A — Single Studio / Pilot
- one Postgres instance
- one API service
- one web app
- one worker queue
- object storage
- manual or low-volume render jobs

## Stage B — Multi-Project Studio
- Redis-backed queues
- isolated worker processes
- background render orchestration
- asset CDN
- commercial/report exports separated into jobs

## Stage C — Multi-Studio / SaaS
- tenant isolation
- RBAC hardening
- rate limiting
- audit trails
- multi-region object delivery if needed
- GPU render pool on demand

---

## 9. Fastest Execution Plan

### Week 1–2
- freeze contracts and migrations
- stand up repo scaffold
- implement project/lead/intake
- implement budget profile + first estimate objects

### Week 3–4
- implement floor plan ingestion API and review flow
- implement scene model and immutable versioning
- implement design studio wireframe with static data

### Week 5–6
- implement module templates and rules
- implement materials catalog + budget filters
- implement concept estimate and quote generation core

### Week 7–8
- implement render set API and draft UI
- implement drawing set API and floor plan/elevation shell
- implement payment plan, invoice, payment records

### Week 9–10
- implement approval packages
- implement procurement and variation flow
- implement deliverables vault

### Week 11–12+
- harden scene patch engine
- improve CV accuracy
- improve proposal PDFs and production exports

---

## 10. Best-Result / Least-Money Stack Decision

For the best result at the lowest sensible cost, use:

### Frontend
- Next.js
- React
- TypeScript
- Three.js / react-three-fiber

### Backend
- TypeScript + modular Express or NestJS
- Postgres
- Redis
- BullMQ

### Intelligence
- Python + FastAPI
- OpenCV + OCR + selective model experiments

### Output
- browser preview for draft
- Blender for final visuals
- SVG/PDF for drawings and docs

### Storage
- S3/R2-compatible object storage

This gives better economics than trying to force everything through paid image-generation APIs.

---

## 11. Final Recommendation

> The fastest and cheapest path that still produces a real product is to build the business and geometry backbone first, use open-source editor/CV patterns selectively, keep expensive rendering on-demand, and make budget/quotation logic a first-class system from the beginning.
