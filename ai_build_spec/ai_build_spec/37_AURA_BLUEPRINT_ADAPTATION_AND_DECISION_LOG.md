# 37 — AURA Blueprint Adaptation and Decision Log

## Purpose

This document scans the supplied AURA blueprint and translates it into practical build decisions for the current StudioOS codebase.

The goal is **not** to copy the blueprint literally.
The goal is to:
- keep the strongest ideas
- reject over-engineered choices that slow execution
- preserve cost efficiency
- preserve the geometry-first product strategy

---

## 1. High-Level Verdict

The AURA blueprint contains many strong product ideas, especially around:
- AI-assisted floor plan understanding
- editable 2D/3D design
- materials and catalog systems
- rendering tiers
- room and module automation
- documentation generation
- collaboration
- commerce/procurement integration

However, the exact proposed implementation stack is **too large and too expensive for the current phase** if adopted literally.

Examples of over-scope for the current build:
- switching core backend immediately to Rust/Axum
- introducing Neo4j + MongoDB + PostgreSQL + Redis + Qdrant simultaneously
- building WebGPU-first rendering before validating product workflows
- adding desktop/mobile/VR/AR all at once
- building full render-farm complexity before the editor, drawing, and commercial backbone are complete

### Correct decision
Adopt the **product ideas** and **layering concepts**, but keep the current staged implementation strategy.

---

## 2. What to Adopt from the Blueprint Immediately

### Adopt now
- floor plan → calibrated spatial model → editable 3D as the core magic
- rendering in tiers: draft, review, final
- room and module automation
- stronger furniture and material catalog
- real commerce and procurement linkage
- auto-documentation vision
- collaboration and comments philosophy

### Adopt later
- optional desktop wrapper
- optional mobile AR portal
- optional richer WebGL/R3F preview mode
- optional cloud render farm scaling
- optional advanced multi-agent orchestration

### Do not adopt yet
- giant multi-database architecture
- high-cost AI serving stack before workflows are proven
- WebGPU-only dependency
- enterprise-only deployment complexity

---

## 3. Stack Decision vs Blueprint

## Current build direction (recommended)
- Next.js + React + TypeScript
- modular Node/Express backend
- Postgres-ready schema
- memory-mode dev runtime first
- lightweight 2D SVG editor
- lightweight 3D preview first
- staged R3F upgrade path
- Python CV/AI service later

## Blueprint stack (too aggressive for now)
- Next.js + WebGPU + custom WASM CAD + Rust API + Python AI + multiple DB systems at once

## Decision
Stay with the current staged architecture until:
1. editor workflows are stable
2. output consistency is stable
3. budget/quote/proposal/approval logic is stable
4. BOM/cutlist logic is stable

Then selectively upgrade.

---

## 4. Product Ideas from the Blueprint Already Aligned with StudioOS

The following AURA concepts are already aligned with the StudioOS plan:
- multi-stage rendering
- AI-assisted layout generation
- parametric room/module systems
- product/material matching
- auto-documentation
- commerce + procurement awareness
- collaboration and revision flow
- room-specific knowledge and constraints

So the blueprint is useful as reinforcement, not as a reason to reset architecture.

---

## 5. What the Blueprint Changes in StudioOS Priorities

The blueprint reinforces that the strongest differentiators should now be:

1. floorplan-to-editable-3D workflow
2. furniture + materials catalog richness
3. room templates + module configurators
4. quick AI renders
5. wall elevations and documentation from approved model
6. design-to-commerce-to-production continuity

This means future phases should prioritize:
- richer catalog and asset management
- stronger floor plan calibration + annotation UX
- faster scene-to-render workflows
- deeper drawing generation quality

---

## 6. Final Adaptation Rule

> Treat the AURA blueprint as a product ambition layer, not a reason to restart the codebase. Keep the current execution strategy, absorb the strongest design and platform ideas, and only adopt heavier technical complexity when it directly improves validated product workflows.
