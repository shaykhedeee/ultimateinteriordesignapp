# 08 — Competitive Platform Reverse Engineering and Superset Strategy

## 1. Purpose

This document goes beyond simple feature comparison.

It analyzes the **platform patterns** behind top competitors and defines how the Ultimate Interior Designer App should be architected to surpass them.

Important note:
- this document does **not** claim access to competitors’ private source code or internal infrastructure
- it is an **observed capability analysis** and **likely platform architecture inference** based on official product surfaces, features, pricing pages, workflows, and integrations

---

## 2. Executive Insight

The strongest products in this category are not winning because they have “nice renders.”
They are winning because each one solves one or two core workflow layers extremely well:

- **Foyr** wins on speed, cloud rendering, asset richness, and fast interior sales workflow
- **RoomSketcher** wins on approachable floor-plan editing, AI convert, LiDAR capture, and polished plans
- **Cedreo** wins on synchronized plans/elevations/renderings/presentation documents
- **Matterport** wins on reality capture, digital twins, downstream CAD/BIM/export integrations, and property-context persistence

The opportunity is to build a **superset product** that unifies:

1. reality capture
2. floor-plan intelligence
3. editable 2D/3D modeling
4. client visualization
5. synchronized documentation
6. Indian modular interior intelligence
7. production continuity

---

## 3. Foyr — Product Pattern and Likely Platform Model

## 3.1 What Foyr clearly offers
From Foyr’s product and pricing pages:
- browser-based interior design workflow
- upload and trace / true-to-scale plan creation
- floor-plan export and true-to-scale elevation export
- 60,000+ 3D furniture models, 10,000+ textures/materials, kitchen catalog, AI search, and custom model import support
- 4K renders, walkthroughs, render presets, auto illumination, and server-side rendering
- unlimited projects and storage on paid plans
- AR view and QR-sharing features on higher plans.[1](https://foyr.com/neo-interior-design-software/) [2](https://foyr.com/pricing/)

## 3.2 Likely platform architecture
Foyr most likely relies on these layers:

### A. Browser-based 2D/3D editor
Observed from:
- no download required positioning
- drag/drop modeling
- texture editing
- plan creation and 3D design in one interface

Likely implies:
- client-side scene editor
- object transform tools
- parametric wall/room primitives
- scene serialization to cloud storage

### B. Cloud asset and catalog service
Observed from:
- 60,000+ ready-made models
- AI image search
- custom library
- import of FBX/OBJ and custom textures

Likely implies:
- searchable catalog index
- asset metadata service
- CDN-backed object thumbnails/previews
- category + material + dimensions metadata

### C. Server-side render farm
Observed from:
- rendering happens on their servers
- multiple render resolutions
- walkthrough generation
- render credits

Likely implies:
- scene export pipeline
- job queue
- render preset system
- worker-based GPU/cloud rendering

### D. Workspace and subscription control
Observed from:
- render credits
- unlimited storage/projects
- multi-user plans
- onboarding/training

Likely implies:
- subscription entitlement service
- credits meter
- project storage limits and policy layer

## 3.3 Foyr’s architectural strength
Its strength is **fast concept-to-visual output in-browser** without requiring heavy hardware.[1](https://foyr.com/neo-interior-design-software/) [2](https://foyr.com/pricing/)

## 3.4 Foyr’s likely weakness for your use case
Foyr’s surface is optimized for speed and presentation, but your app must go deeper into:
- Indian modular logic
- room-specific rules
- version-safe drawings and approvals
- production/BOM/cutlist continuity

## 3.5 What to build better than Foyr
- deeper scene-to-elevation continuity
- more deterministic modular carcass logic
- Indian design and production rules as first-class logic
- approval-safe downstream documentation and manufacturing outputs

---

## 4. RoomSketcher — Product Pattern and Likely Platform Model

## 4.1 What RoomSketcher clearly offers
From RoomSketcher’s official site and features pages:
- editable floor plans and polished visuals
- AI Convert from image/PDF/scan into editable plans
- FloorCapture with LiDAR-enabled iPhone/iPad capture
- 2D/3D floor plans, 3D photos, 360 views, Live 3D walkthroughs
- measurements, total area, branding, replace materials, print to scale
- cloud storage and cross-device project access
- a web portal plus app workflow, with project ordering / managed redraw services.[3](https://www.roomsketcher.com/) [4](https://www.roomsketcher.com/features/) [5](https://www.roomsketcher.com/features/ai-convert/) [6](https://www.roomsketcher.com/features/roomsketcher-app/)

## 4.2 Likely platform architecture

### A. Hybrid app + web portal architecture
Observed from:
- web portal used for project management, AI Convert, ordering, downloads
- RoomSketcher App used for editing/drawing
- cloud-saved projects across devices

Likely implies:
- dedicated editor application shell or rich client
- separate account/project management portal
- project sync service
- server-side conversion/output generation

### B. Plan-conversion service
Observed from:
- AI Convert under five seconds claim on product pages
- trained on 50,000+ real floor plans
- converts walls/doors/windows into editable layout
- preview-before-credit-spend workflow.[5](https://www.roomsketcher.com/features/ai-convert/)

Likely implies:
- asynchronous or fast AI/CV pipeline
- confidence-based mapping of plan primitives
- a validation layer before final project commit
- credit consumption only after preview confirmation

### C. Capture-to-plan mobile pipeline
Observed from:
- FloorCapture with LiDAR on iPhone/iPad
- AI turns captures into editable floor plans

Likely implies:
- mobile scan data ingestion
- geometry reconstruction service
- calibration + simplification to floor-plan model

### D. Output-credit system
Observed from:
- credits for outputs and AI features
- plan generation, 3D photos, 360 views, etc.

Likely implies:
- output service abstraction
- pricing/credits middleware
- output manifest and entitlement gating

## 4.3 RoomSketcher’s architectural strength
Its strength is a **clean plan-first workflow** with approachable editing, AI-assisted conversion, and multi-format outputs.[3](https://www.roomsketcher.com/) [4](https://www.roomsketcher.com/features/)

## 4.4 RoomSketcher’s likely weakness for your use case
It appears strongest for plan visualization, not full interior production intelligence. You need more:
- room-specific modular logic
- wall elevations with interior detailing depth
- commercial proposal intelligence
- modular production and BOM continuity

## 4.5 What to build better than RoomSketcher
- stronger parametric module engine
- better render realism for final client approvals
- deeper production linkage
- more sophisticated room-rule QA
- stronger Indian-market templates and standards

---

## 5. Cedreo — Product Pattern and Likely Platform Model

## 5.1 What Cedreo clearly offers
From Cedreo’s home, elevation, floor-plan, and presentation-document pages:
- cloud-based home design platform
- complete packages in under two hours / renderings in minutes
- floor plans, site plans, cross sections, elevations, roof plans, surface area tables
- photorealistic 3D interior and exterior renderings
- automatic elevation/section generation and automatic updates when design changes
- branded presentation documents that stay synchronized with project graphics
- terrain/site context tools and collaboration around shared project graphics.[7](https://cedreo.com/) [8](https://cedreo.com/floor-plan-software/cross-section-elevation-plans/) [9](https://cedreo.com/presentation-documents/) [10](https://cedreo.com/floor-plan-software/)

## 5.2 Likely platform architecture

### A. Parametric building model core
Observed from:
- one model driving plans, sections, elevations, surface tables, 3D visuals, and presentations
- automatic updates to inserted graphics when plan changes

Likely implies:
- parametric model backbone
- coordinated document graph
- derived views generated from a single source of truth

### B. Output synchronization engine
Observed from:
- plans and visuals in presentation docs auto-refresh
- sections/elevations auto-update from project changes

Likely implies:
- asset referencing system inside document composer
- projection/render/drawing regenerators tied to the model revision
- output invalidation and replacement system

### C. Browser-first CAD-lite + presentation stack
Observed from:
- no-download cloud positioning
- drag-and-drop ease
- strong emphasis on proposal-ready documentation

Likely implies:
- thin-client model editor
- server-backed render and document generation
- template-based branded document composer

## 5.3 Cedreo’s architectural strength
Its biggest strength is **model-to-document synchronization**. That is extremely important for your app.[8](https://cedreo.com/floor-plan-software/cross-section-elevation-plans/) [9](https://cedreo.com/presentation-documents/)

## 5.4 Cedreo’s likely weakness for your use case
Cedreo is broader across house/building concept design. Your product can beat it by being better in:
- Indian interiors
- kitchen/wardrobe/TV/mandir specificity
- room-level design intelligence
- client-facing interior design variants
- modular BOM/cutlist bridge

## 5.5 What to build better than Cedreo
- interior-specific wall elevations, not just generic building elevations
- room-specific furniture/module standards engine
- stronger material/product/vendor pricing logic
- production and factory readiness for modular interiors

---

## 6. Matterport — Product Pattern and Likely Platform Model

## 6.1 What Matterport clearly offers
From Matterport’s home, plans, and design/construction pages:
- digital twins as the core product concept
- multi-camera/mobile capture workflows
- immersive 3D tours, floor plans, print-quality photos
- CAD/BIM file generation from digital twins
- integrations with Autodesk and Procore
- design & construction positioning around documentation, collaboration, and project delivery
- support for tags, analytics, and portfolio-scale use cases.[11](https://matterport.com/) [12](https://matterport.com/plans) [13](https://matterport.com/solutions/design-construction)

## 6.2 Likely platform architecture

### A. Capture client + cloud reconstruction pipeline
Observed from:
- hardware/mobile capture support
- digital twin generation
- asset creation after capture

Likely implies:
- device capture apps
- cloud photogrammetry/spatial reconstruction
- point-cloud/mesh processing
- panorama alignment and model hosting

### B. Hosted spatial viewer platform
Observed from:
- 3D tours, annotations/tags, collaboration, shareability

Likely implies:
- web viewer engine
- spatial navigation model
- annotation/metadata layers
- embeddable link/share infrastructure

### C. Export and integration layer
Observed from:
- CAD/BIM add-ons
- Autodesk/Procore integrations
- technical file add-ons

Likely implies:
- conversion/export jobs
- third-party integration APIs
- enterprise-scale asset manifests

## 6.3 Matterport’s architectural strength
Its strength is **capture-to-digital-twin infrastructure** and downstream technical exportability.[12](https://matterport.com/plans) [13](https://matterport.com/solutions/design-construction)

## 6.4 Matterport’s likely weakness for your use case
Matterport is not an interior modular design operating system. It is stronger at:
- existing condition capture
- digital twin hosting
- as-built context

But weaker for your purpose in:
- editable interior module design
- Indian interior logic
- proposal-to-cutlist continuity

## 6.5 What to build better than Matterport
- make reality capture feed directly into editable room and wall entities
- bridge as-built capture into design and production decisions
- allow existing vs proposed comparison inside one project timeline

---

## 7. Platform Pattern Summary

## 7.1 Common Architectural Building Blocks Across Competitors
The competitor landscape strongly suggests the most successful platforms all rely on some combination of these building blocks:

1. **scene/model representation**
2. **asset/catalog service**
3. **cloud output generation**
4. **project/document storage**
5. **derived output services**
6. **sync between editable model and outputs**
7. **capture/ingestion pipeline**

## 7.2 What Almost None of Them Combine Perfectly
Very few combine all of the following in one seamless product:
- editable scene graph
- deep room-specific rules
- synchronized drawings and proposals
- modular production outputs
- localized interior standards

That gap is your opening.

---

## 8. Required Superset Architecture for Your App

Your app should combine the strongest platform patterns into this stack:

## Layer A — Capture and Input Layer
Inspired by Matterport + RoomSketcher
- plan upload
- scan upload
- LiDAR/mobile capture later
- wall photo attachment
- site notes
- measurement verification

## Layer B — Spatial Intelligence Layer
Inspired by RoomSketcher AI Convert + your own vision
- wall/opening/room extraction
- OCR dimensions
- scale detection
- confidence scoring
- review package

## Layer C — Canonical Scene Graph Layer
This is your core moat.
- editable rooms/walls/openings
- materials/lights/cameras
- module placement
- room-specific metadata
- revision graph

## Layer D — Parametric Interior Layer
This is the major differentiator no generic tool owns strongly for India.
- kitchen templates
- wardrobe templates
- TV wall templates
- mandir templates
- room-specific rules
- production-aware module metadata

## Layer E — Output Sync Layer
Inspired heavily by Cedreo
- render sets
- wall elevations
- drawings
- pricing summaries
- proposal docs
- automatic stale detection

## Layer F — Production Layer
Your biggest edge over competitors.
- module schedule
- BOM
- cutlist
- workshop exports
- production presets

---

## 9. Superset Feature Strategy

## 9.1 Build the Foyr-level experience for speed
Need:
- browser-first fast design experience
- huge-feeling catalog
- high-speed review renders
- presets and templates

## 9.2 Build the RoomSketcher-level experience for plan capture/edit
Need:
- AI plan convert
- manual tracing fallback
- LiDAR/scan ingestion roadmap
- crisp plans and measurements

## 9.3 Build the Cedreo-level experience for coordinated outputs
Need:
- one model feeding drawings, proposals, and visuals
- automatic updates to derived outputs
- branded presentation packages

## 9.4 Build the Matterport-level experience for existing-condition capture
Need:
- room/wall-level photo capture
- digital record of existing conditions
- potential scan merging into room shells
- existing vs proposed states

## 9.5 Add what none of them do well enough together
Need:
- Indian modular interior rule engine
- scene-to-render-to-cutlist continuity
- room-type intelligence
- production-safe module locking
- studio memory and design reuse

---

## 10. Exact Strategic Decisions

### Decision 1 — Geometry-First, Not Image-First
Competitors that provide editable value all preserve some editable project structure. Your app must do this as a first principle.

### Decision 2 — Derived Outputs Must Stay in Sync
Cedreo shows the value of synchronized documents; your app must do the same for interiors, not just houses.[8](https://cedreo.com/floor-plan-software/cross-section-elevation-plans/) [9](https://cedreo.com/presentation-documents/)

### Decision 3 — Capture Must Feed Design
Matterport and RoomSketcher show that capture matters; your app must translate capture into editable design truth, not just store photos.[4](https://www.roomsketcher.com/features/) [13](https://matterport.com/solutions/design-construction)

### Decision 4 — Cloud Outputs Are Essential
Foyr, Cedreo, and Matterport all rely on cloud-side heavy lifting for rendering or reconstruction. Your app should too for scale and hardware independence.[1](https://foyr.com/neo-interior-design-software/) [7](https://cedreo.com/) [11](https://matterport.com/)

### Decision 5 — Interior Production Is the Gap
Your app must win on the transition from approved interior design to practical modular production — the area most competitors do not deeply own.

---

## 11. Final Superset Positioning

> Build a platform that has:
> - Foyr’s speed
> - RoomSketcher’s plan capture clarity
> - Cedreo’s synchronized documents
> - Matterport’s reality-capture mindset
> - and a deeper Indian modular rule engine plus production bridge than any of them.

That is the platform strategy that can make this the best interior design app in your market.
