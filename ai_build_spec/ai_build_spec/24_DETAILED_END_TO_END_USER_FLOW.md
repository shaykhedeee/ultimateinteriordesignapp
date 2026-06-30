# 24 — Detailed End-to-End User Flow

## 1. Purpose

This document defines the **full real-world user flow** for the Ultimate Interior Designer App.

It is written for:
- product design
- UI/UX design
- engineering
- AI coding agents
- business process alignment

The flow is designed to cover the entire lifecycle:

- lead capture
- consultation
- budget fit
- floor plan understanding
- 2D design
- 3D design
- renders
- elevations
- quotation
- billing
- procurement
- execution
- handover
- warranty

---

## 2. Core Product Principle

The user flow must always respect this sequence:

```text
Business Input
  → Spatial Truth
  → Editable Design
  → Visual Output
  → Commercial Output
  → Approval
  → Production
  → Handover
```

This means:
- no design should start without basic commercial context
- no render should exist without a scene version
- no quote should exist without scope clarity
- no production output should exist without approved geometry

---

## 3. Primary Personas in the Flow

### 3.1 Sales Designer
- captures lead
- qualifies project
- guides consultation
- creates first direction

### 3.2 Interior Designer
- converts client needs into actual room and module designs
- works in 2D and 3D
- selects materials and finishes

### 3.3 Estimator / Commercial Manager
- creates estimates / BOQ / payment plans
- aligns design with budget

### 3.4 Project Manager / Execution Lead
- tracks site readiness, production, procurement, installation

### 3.5 Client
- reviews visuals, quote, options
- approves design and commercial scope

---

## 4. Detailed User Flow

## STAGE 0 — Lead Capture

### Goal
Create a project candidate with enough information to determine if the opportunity is worth pursuing.

### User
Sales Designer / Admin / Lead Coordinator

### Inputs
- client name
- phone
- email
- city
- property type
- project type
- rough budget range
- source
- expected possession date / urgency

### System actions
- create lead record
- assign lead status = new
- compute initial lead score
- assign suggested next action

### Outputs
- lead card in CRM
- qualification checklist
- consultation-ready record

### Success condition
Lead is captured with enough context to begin qualification.

---

## STAGE 1 — Lead Qualification

### Goal
Determine if the lead is viable and classify likely project direction.

### User
Sales Designer / Business Manager

### Inputs
- room count / BHK
- rough budget
- scope type: full home / modular only / room package / turnkey / renovation
- timeline
- decision-maker present?
- financing interest

### System actions
- classify budget band
- identify risk of poor budget fit
- identify recommended consultation path
- mark lead qualified / disqualified / nurture

### Outputs
- qualified lead
- recommended next action = create project + consultation

### Success condition
Lead moves to project creation only if commercially and operationally viable.

---

## STAGE 2 — Project Creation

### Goal
Turn the qualified lead into a working design project.

### User
Sales Designer / Admin

### Inputs
- selected lead
- client profile
- property metadata
- scope type

### System actions
- create project ID and code
- set stage = draft or lead_qualified
- initialize project timeline

### Outputs
- project record
- empty intake package
- project workspace entry in command center

### Success condition
Project is ready for discovery intake.

---

## STAGE 3 — Discovery Intake / Consultation

### Goal
Capture the client’s lifestyle, priorities, style, and constraints.

### User
Sales Designer / Interior Designer

### Inputs
- family profile
- rooms required
- room priorities
- storage requirements
- cooking habits
- style likes/dislikes
- material likes/dislikes
- maintenance preference
- vastu preference
- work-from-home needs
- must-haves / no-go items
- target budget and hard cap

### System actions
- create intake package version
- build budget profile
- build design brief summary
- score completeness

### Outputs
- structured discovery brief
- room program
- client preference profile
- initial budget-fit context

### Success condition
The app knows **what kind of home** the client wants and **what budget reality** they are operating in.

---

## STAGE 4 — Initial Budget Fit / Rough Estimate

### Goal
Prevent over-designing an unaffordable solution.

### User
Estimator / Sales Designer / Designer

### Inputs
- budget profile
- room count
- scope type
- project size
- material assumptions

### System actions
- create rough estimate
- classify budget alignment:
  - below viable threshold
  - aligned
  - stretch but possible
  - severe mismatch
- suggest scope prioritization

### Outputs
- rough estimate version
- room-wise budget envelope
- recommendation on material band

### Success condition
Design begins with budget alignment, not afterthought costing.

---

## STAGE 5 — Site Capture / Floor Plan Upload

### Goal
Turn the physical space into digital input.

### User
Designer / Site Executive / Client-assisted upload

### Inputs
- image / PDF floor plan
- scan / LiDAR capture later
- room photos
- wall photos
- measurement notes
- structural constraints

### System actions
- store all assets
- attach photos to room/wall references when possible
- create site capture package

### Outputs
- floor plan source asset
- room photo set
- wall photo set
- site issue list

### Success condition
The app has enough raw spatial input to attempt plan intelligence.

---

## STAGE 6 — Floor Plan Intelligence Review

### Goal
Convert raw floor plan input into a reviewed spatial model.

### User
Designer / Design Lead

### Inputs
- uploaded floor plan
- optional OCR and AI detection outputs
- human corrections

### System actions
- detect walls
- detect openings
- detect room labels
- infer room types
- infer scale
- generate review items with confidence

### Outputs
- floor plan interpretation version
- review queue
- finalized spatial model version after review

### Success condition
The floor plan is no longer just an image; it is a structured model.

---

## STAGE 7 — Base Scene Generation

### Goal
Create the editable shell for design.

### User
System + Designer review

### Inputs
- approved spatial model

### System actions
- generate scene graph shell
- create rooms, walls, openings, floor/ceiling defaults
- set room metadata
- create first scene version

### Outputs
- scene version 1 (or latest branch root)
- editable 2D/3D base environment

### Success condition
The designer can now edit the project in 2D and 3D from the same source of truth.

---

## STAGE 8 — 2D Design Studio

### Goal
Create layout logic and room-level planning in 2D.

### User
Interior Designer

### Actions
- inspect wall lengths and openings
- place module footprints
- assign room uses
- fine-tune circulation
- test alternate layouts
- align room with Vastu preference mode if selected
- branch variants if needed

### Outputs
- room layout decisions
- module footprints
- updated scene versions

### Success condition
2D layout is spatially valid, circulation-aware, and commercially sensible.

---

## STAGE 9 — 3D Design Studio

### Goal
Turn 2D planning into fully editable 3D interior design.

### User
Interior Designer

### Actions
- place parametric modules
- place furniture
- assign materials
- assign lighting
- edit dimensions
- apply template packs
- check budget impact live
- validate room/module rules

### Outputs
- richer scene versions
- room variants
- material assignments
- rule validation results

### Success condition
The project is both spatially editable and commercially grounded.

---

## STAGE 10 — Budget-First Material Selection

### Goal
Select materials and module specs according to budget and client taste.

### User
Designer + Client + Estimator

### Actions
- choose material family by room
- compare standard vs premium vs luxury finishes
- see live budget impact
- value-engineer expensive selections
- classify core vs optional upgrades

### Outputs
- budget-consistent material package
- material schedule draft
- refined concept estimate

### Success condition
The design direction remains within acceptable financial bounds.

---

## STAGE 11 — Concept Design Review

### Goal
Show client a believable, editable concept before freezing scope.

### User
Designer + Client

### Actions
- show 2D layout
- show 3D design previews
- compare options A/B/C
- collect design feedback
- collect commercial reactions

### Outputs
- shortlisted concept variant(s)
- client notes
- pre-freeze review outcome

### Success condition
Client direction is clear enough to freeze scope.

---

## STAGE 12 — Scope Freeze

### Goal
Lock what is included and excluded before final pricing.

### User
Designer + Estimator + Client

### Actions
- lock room scope
- lock module scope
- define included civil/MEP items
- define optional add-ons
- define exclusions

### Outputs
- scope freeze package
- quote-ready project state

### Success condition
Final quote can be built from a stable scope.

---

## STAGE 13 — Final BOQ / Final Quote

### Goal
Generate a final commercial package.

### User
Estimator / Commercial Manager

### Actions
- create itemized BOQ
- create optional upgrades list
- create taxes and inclusions
- create payment plan
- create validity notes and timeline assumptions

### Outputs
- final quote version
- final BOQ
- payment schedule draft

### Success condition
The commercial offer is detailed, transparent, and approval-ready.

---

## STAGE 14 — Render Studio

### Goal
Generate client-ready visual outputs from the same scene.

### User
Designer

### Actions
- create render sets
- pick camera presets
- pick lighting presets
- compare variants
- approve / shortlist renders

### Outputs
- render sets linked to scene version
- approved visual set

### Success condition
Client visuals are consistent with the actual design scene.

---

## STAGE 15 — Drawings & Elevations Studio

### Goal
Generate floor plans, wall elevations, ceiling plans, and schedules from the same source model.

### User
Designer / Production Coordinator

### Actions
- create drawing set
- review elevations wall by wall
- annotate if needed
- verify dimensions and module splits

### Outputs
- drawing set
- elevation set
- room/module schedules

### Success condition
The same approved design now has formal documentation.

---

## STAGE 16 — Proposal Package

### Goal
Assemble visuals + drawings + quote into one client package.

### User
Designer / Sales Designer

### Actions
- assemble sections
- include approved renders only
- include current quote only
- include summary and sign-off

### Outputs
- proposal set
- client-facing PDF package

### Success condition
Proposal accurately reflects the current approved design and scope.

---

## STAGE 17 — Client Approval

### Goal
Capture design and commercial approval explicitly.

### User
Client + Designer

### Actions
- review package
- approve / reject / request revision
- comment room-by-room if needed

### Outputs
- approval package result
- approved scene version
- approved quote version

### Success condition
A specific scene version and commercial version are formally approved.

---

## STAGE 18 — Production Preparation

### Goal
Turn approved design into production-ready scope.

### User
Production Manager / Estimator / Procurement

### Actions
- generate BOM
- generate cutlists
- generate purchase requirements
- check payment release gates
- verify site readiness

### Outputs
- BOM set
- cutlist set
- procurement list
- production release state

### Success condition
The approved design can safely move into production.

---

## STAGE 19 — Procurement and Billing Milestones

### Goal
Handle money and procurement correctly.

### User
Commercial Manager / Admin / PM

### Actions
- issue milestone invoices
- record payments
- raise vendor POs
- track receipts and pending procurement
- hold or release dispatch based on configured commercial gates

### Outputs
- invoices
- payment records
- PO records
- collections view

### Success condition
Commercial and supply-chain execution stay synchronized.

---

## STAGE 20 — Installation / Site Execution

### Goal
Deliver the approved design on site.

### User
Project Manager / Site Team

### Actions
- install modular units
- manage site tasks
- log issues/snags
- update execution progress

### Outputs
- execution progress updates
- snag list
- QC status

### Success condition
Installation reaches QC and handover readiness.

---

## STAGE 21 — Handover

### Goal
Close the project with client sign-off.

### User
PM + Client

### Actions
- final QC
- snag closure
- final balance confirmation
- handover checklist completion

### Outputs
- handover report
- final delivery state
- warranty activation

### Success condition
Project is marked delivered and operationally complete.

---

## STAGE 22 — After-Sales / Warranty / Service

### Goal
Retain trust and support long-term service.

### User
Support / PM / Client Care

### Actions
- track warranty start date
- record service requests
- schedule care visits
- capture testimonial / referral

### Outputs
- service tickets
- warranty record
- reusable customer memory

### Success condition
The app supports the full lifecycle, not just the sale.

---

## 5. High-Risk Failure Points the App Must Prevent

1. designing before budget-fit validation
2. quoting before scope freeze
3. approving stale visuals or drawings
4. producing cutlists from unapproved geometry
5. material changes not updating price impact
6. revisions not creating new versions
7. site changes not triggering variation workflows

---

## 6. Final User Flow Statement

> The best interior design app must feel like one continuous guided journey from lead to handover. Every stage must feed the next, and every major decision — design, material, commercial, approval, and production — must be traceable to a single version-safe project truth.
