# 00 — Master Product Vision and Non-Negotiables

## 1. Product Name

Working name:
**Ultimate Interior Designer App**

Recommended platform name:
**StudioOS for Interiors**

## 2. Product Mission

Build the strongest interior design product in the market by combining:

- CRM and lead qualification
- client onboarding and design discovery
- floor plan intelligence and scan ingestion
- editable 2D and 3D design
- photoreal renders and walkthroughs
- wall elevations and room drawings
- material, budget, and cost planning
- proposal / PDF brief generation
- approval and revision management
- BOM, cutlists, and production handoff
- reusable design memory and studio intelligence

This app must help a business:

- close clients faster
- reduce manual design effort
- visualize designs more accurately
- reduce render iterations
- reduce documentation rework
- reduce production mistakes
- reuse knowledge across projects
- scale studio throughput without scaling chaos

## 3. What the Product Is

This product is:

- a **design operating system**
- a **geometry-first interior design platform**
- a **workflow-connected studio tool**
- a **proposal + visualization + production bridge**
- an **AI-assisted but not AI-dependent system**

## 4. What the Product Is Not

This product is **not**:

- only an AI image generator
- only a moodboard app
- only a CRM
- only a floor plan viewer
- only a render gallery
- only a cutlist tool
- only a CAD replacement
- only a virtual staging tool

## 5. Core Product Thesis

### Non-Negotiable Thesis

The app must be built on a **canonical spatial model**.

That means:

- floor plans are converted into structured room/wall/opening data
- a persistent scene graph stores the editable design state
- all outputs derive from that scene graph
- AI enhances workflow but does not replace deterministic geometry

### Why This Matters

If the product is image-first, it will fail on:

- editability
- exact revisions
- wall elevations
- 2D drawings
- quantity estimation
- BOM / cutlist generation
- approval consistency
- production handoff

If the product is scene-first, it can support:

- editable 3D design
- wall-by-wall elevations
- module schedules
- cost estimation
- cutlists
- versioning
- material swaps without full regeneration
- client walkthroughs
- AI enhancement without losing geometry fidelity

## 6. Product Pillars

## Pillar 1 — Floor Plan to Truth
The app must deeply understand a floor plan or scan, and convert it into an editable, reviewable structure.

## Pillar 2 — Editable 2D/3D Design
The app must allow designers to work directly in 2D and 3D using linked editing and parametric modules.

## Pillar 3 — Controlled Visualization
The app must generate fast preview and premium-quality outputs while maintaining spatial accuracy.

## Pillar 4 — Auto Documentation
The app must generate drawings, elevations, schedules, proposals, and room packages from the same source model.

## Pillar 5 — Production Continuity
The app must bridge the approved design into BOM, cutlists, material schedules, and workshop outputs.

## Pillar 6 — Indian Modular Intelligence
The app must be better than Western tools for Indian modular interiors, cabinetry logic, spatial constraints, vastu considerations, and local production workflows.

## Pillar 7 — Studio Memory
The app must learn from accepted designs, rejected variants, successful modules, budget choices, and quality failures.

## 7. Target Users

### Primary Users
- studio owner
- interior designer
- modular kitchen/wardrobe specialist
- client-facing sales designer
- design manager
- production manager

### Secondary Users
- estimator
- project coordinator
- factory supervisor
- site measurement executive
- client / homeowner

### Future Users
- dealers / franchises
- developers / builders
- furniture catalogs / vendor partners
- multi-branch design networks

## 8. Primary Use Cases

### Use Case A — Walk-in Client to Proposal
1. capture lead
2. qualify budget and scope
3. capture needs and preferences
4. upload floor plan or sketch
5. generate editable concept
6. show live 3D and renders
7. export proposal / PDF brief
8. collect comments and approval

### Use Case B — Floor Plan to Design Pack
1. upload floor plan
2. extract space structure
3. review rooms/walls/openings
4. generate room templates
5. edit design interactively
6. generate elevations and schedules
7. export deliverables

### Use Case C — Approved Design to Production
1. freeze approved room/module geometry
2. lock materials and hardware choices
3. generate module schedules
4. generate part formulas and BOM
5. generate cutlists and workshop exports
6. store final deliverables

### Use Case D — Fast Sales Design Session
1. open client profile
2. load existing plan or scan
3. auto-suggest room layouts
4. modify finishes and modules live
5. show fast preview and cost range
6. share link or proposal immediately

## 9. Core Screens

The product must include these primary screens:

1. Command Center
2. Leads / CRM
3. Onboarding / Discovery Wizard
4. Site Capture
5. Floor Plan Intelligence Review
6. Design Studio (2D + 3D editor)
7. Render Studio
8. Drawings & Elevations Studio
9. Materials / Catalog / Budgeting
10. Proposal / PDF Brief
11. Approval & Revisions
12. Production / BOM / Cutlist
13. Deliverables Vault
14. Settings / Rules / Admin

## 10. Non-Negotiable Product Requirements

## 10.1 Geometry First
- the source of truth must be structured scene data
- images can never be the only design record
- wall/opening positions must be stored numerically
- every placed module must have dimensions and rules

## 10.2 Linked 2D and 3D
- all design edits must reflect in both plan and 3D view
- changes in module dimensions must update downstream outputs
- room labels, wall lengths, and openings must stay synchronized

## 10.3 Approval Integrity
- approved outputs must be tied to exact scene/model versions
- no hidden drift between approved render and production geometry
- all approvals must be versioned

## 10.4 Rule Engine
- Indian modular interior standards must be executable logic
- kitchen, wardrobe, TV unit, mandir, lighting, and clearance rules must be validated automatically

## 10.5 Confidence-Driven AI
- floor plan interpretation must include confidence scores
- low-confidence AI outputs must require review
- AI should suggest, not silently overwrite deterministic data

## 10.6 Modular Production Continuity
- approved design modules must map to BOM/cutlist logic
- module templates must be production-aware
- schedules and cutlists must derive from the same approved scene

## 10.7 Reuse and Memory
- accepted render settings must be reusable
- accepted module templates must be reusable
- accepted material combinations must be reusable
- rejection patterns must feed a mistake-memory system

## 11. Product Principles

### Principle 1 — Fast Enough for Sales
The app must work in real meetings. No slow CAD-only experience.

### Principle 2 — Accurate Enough for Production
The app must not produce visually convincing but production-useless outputs.

### Principle 3 — Explainable AI
Every AI-detected room, wall, or component must be reviewable.

### Principle 4 — Deterministic Where It Matters
Geometry, dimensions, rules, formulas, approvals, and exports must be deterministic.

### Principle 5 — Human-Controlled Autonomy
The app should automate aggressively, but always leave the user in control.

### Principle 6 — Premium but Practical
The UI should feel premium, but the architecture must support speed, clarity, and low friction.

## 12. Competitive End State

The finished product must beat common interior tools by being:

- more editable than AI-only tools
- more presentation-ready than basic floor-plan tools
- more production-aware than render-first tools
- more India-specific than generic Western tools
- more connected than disconnected CRM/render/CAD stacks

## 13. Success Metrics

The product should improve these metrics:

### Sales Metrics
- time from walk-in to first visual
- proposal turnaround time
- conversion rate after first consultation
- number of revisions before approval

### Design Metrics
- time to first room concept
- floor plan detection accuracy
- render-to-approval rate
- percentage of module reuse

### Production Metrics
- error rate in handoff
- time from approval to BOM
- time from approval to cutlist
- quantity of manual corrections after documentation export

### Platform Metrics
- render turnaround time
- floor plan job completion time
- drawing generation success rate
- scene save/load reliability

## 14. Golden User Experience

### The Ideal Flow
A studio user should be able to:

1. add a client in under 2 minutes
2. capture core design requirements in under 10 minutes
3. upload a floor plan and review AI interpretation in under 5 minutes
4. open an editable 3D shell instantly
5. apply room templates and module suggestions quickly
6. adjust finishes live with the client present
7. generate fast visual outputs in-session
8. produce a proposal and drawings from the same design state
9. lock an approved version for production
10. export cutlists and workshop documents without rebuilding data

## 15. Highest-Level Functional Modules

### Intake Layer
- CRM
- qualification
- discovery
- references
- preferences

### Intelligence Layer
- OCR
- CV / floor plan detection
- spatial graph creation
- room inference
- rule engine

### Design Layer
- 2D editor
- 3D editor
- scene graph
- parametric modules
- materials and lights

### Presentation Layer
- render engine
- camera engine
- walkthroughs
- 360 views
- proposals

### Production Layer
- drawings
- elevations
- schedules
- BOM
- cutlists
- deliverables

### Memory Layer
- approvals memory
- materials memory
- prompt / render memory
- mistakes memory
- design pattern reuse

## 16. Strict Product Constraints

The build must never allow these anti-patterns:

- render approval without scene version tracking
- cutlist generation from unapproved geometry
- material changes that do not update schedules
- module placement without wall/room association
- AI geometry overwrite without review state
- scene edits that do not invalidate stale renders/drawings
- drawings and renders generated from different model revisions

## 17. Mandatory Versioning Rules

Every major asset must be versioned:

- project intake
- floor plan interpretation
- scene graph
- room design variant
- render set
- drawing set
- proposal
- BOM
- cutlist
- approval package

## 18. Minimum Delight Features

Even the first serious version must feel superior by supporting:

- fast floor-plan-to-3D conversion
- live material swapping
- room-by-room design variants
- quick elevations per wall
- premium dark studio UI
- client share links
- side-by-side comparison
- approval locking
- template reuse

## 19. Long-Term Vision

Over time, the product should evolve into:

- a multi-studio platform
- a vendor/catalog ecosystem
- a production intelligence system
- a design memory engine
- a guided AI copilot for design and sales
- a localized interior BIM-lite platform for modular interiors

## 20. Final Product Definition

> The product to build is a geometry-first, AI-assisted, Indian modular interior design operating system that converts floor plans, scans, and design requirements into editable 2D/3D scenes, client-ready visualizations, auto-generated drawings, commercial proposals, and production-ready outputs from one connected source of truth.
