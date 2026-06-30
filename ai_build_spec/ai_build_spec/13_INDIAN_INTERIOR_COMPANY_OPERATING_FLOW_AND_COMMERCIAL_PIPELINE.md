# 13 — Indian Interior Company Operating Flow and Commercial Pipeline

## 1. Purpose

This document defines the **real operating pipeline** of an interior design company in India and converts it into product requirements.

It focuses on:
- lead flow
- design flow
- quotation flow
- payment flow
- procurement flow
- execution flow
- handover flow
- after-sales and warranty flow

This is the missing business-operating layer that must exist in the app if it is meant to run a real design company, not just create visual designs.

---

## 2. Market Operating Pattern Observed in India

Across major Indian organized interior brands, a repeated pattern is visible:

- free or low-friction consultation entry
- floor plan and requirement collection
- 3D design / concept presentation
- estimate or itemised quotation
- design sign-off before execution
- milestone-based payments
- factory production or centralized procurement for modular items
- project manager or execution lead oversight
- delivery, installation, handover, and warranty/service support

Examples from official company surfaces:
- Livspace describes a free design consultation, a design proposal with estimated cost, final quotation after design/material decisions, and milestone-based payments tied to project progress.[1](https://www.livspace.com/in/interiors/service/service-designing-my-dream-home) [2](https://www.livspace.com/in/how-it-works)
- HomeLane repeatedly emphasizes 3D design first, transparent itemised quotations, scope lock before production, and milestone-based payments tied to booking, design finalisation, production, dispatch, and installation.[3](https://www.homelane.com/cities/interior-designers-hyderabad) [4](https://www.homelane.com/cities/interior-designers-bangalore/harlur) [5](https://www.homelane.com/cities/interior-designers-ahmedabad/bodakdev)
- DesignCafe describes a process involving consultation, ideation, design selection, detailed planning, material sourcing, execution, and project management, and explicitly references final quotations via BOQ/Bill of Quantities after ideas and styles are finalised.[6](https://www.designcafe.com/cities/interior-designers-surat/) [7](https://www.designcafe.com/blog/home-interiors/hiring-interior-designers-in-mumbai/)
- Organized brands also commonly position warranties, phased payments, and end-to-end execution as trust-building differentiators.[3](https://www.homelane.com/cities/interior-designers-hyderabad) [4](https://www.homelane.com/cities/interior-designers-bangalore/harlur) [8](https://www.livspace.com/in/interiors/bengaluru)

---

## 3. The Real End-to-End Interior Design Business Pipeline

The app must support this exact pipeline:

```text
Lead Capture
  → Lead Qualification
  → Discovery Consultation
  → Floor Plan / Site Capture
  → Initial Budget Fit Estimate
  → Concept Design / 3D Direction
  → Scope Freeze
  → Detailed Design + Materials Selection
  → Final BOQ / Final Quotation
  → Contract / Payment Plan
  → Production Planning / Procurement
  → Site Prep / Civil / MEP
  → Manufacturing / Dispatch
  → Installation
  → QC / Snag List
  → Handover
  → Final Billing Closure
  → Warranty / Service / Referrals
```

---

## 4. Pipeline Stages the App Must Add or Strengthen

## 4.1 Lead Qualification Stage
Current design apps often ignore serious qualification.
Your app must capture:
- source
- urgency
- property possession date
- home type
- room count
- rough budget range
- design-only vs turnkey vs modular-only
- decision-maker identity
- financing/EMI interest
- move-in deadline

### Outputs
- lead score
- recommended consultation type
- recommended budget path
- probability of conversion

---

## 4.2 Discovery Consultation Stage
Must capture:
- family profile
- lifestyle habits
- rooms required
- work-from-home needs
- storage priorities
- kitchen usage style
- vastu preference
- maintenance preference
- must-haves / no-go items
- preferred materials
- disliked finishes
- target budget and hard ceiling budget

### Output
A structured design brief and a **budget-fit brief**.

---

## 4.3 Initial Estimate Stage
This must happen **before** detailed design is over-developed.

### Purpose
Provide a quick commercial direction to avoid designing something unaffordable.

### Inputs
- room count
- scope type
- budget band
- property size
- material grade assumptions
- custom vs modular ratio

### Outputs
- rough order-of-magnitude estimate
- room-wise estimate buckets
- budget-fit score
- “too low / aligned / premium stretch” guidance
- recommended material band

### Why this matters
Livspace explicitly distinguishes the early estimated cost from the later final quotation, which changes after material/design decisions.[1](https://www.livspace.com/in/interiors/service/service-designing-my-dream-home)

Your app must formalize that difference.

---

## 4.4 Concept Design Stage
This is where:
- layout direction
- style direction
- first 3D direction
- rough room concepts
- early materials direction

are created.

### Commercial rule
At this stage, the app should not produce a locked final quote.
It should produce:
- initial estimate versions
- optional concept-level BOQ snapshot
- pricing assumptions disclosure

---

## 4.5 Scope Freeze Stage
This is a critical business stage and must be explicit.

### Scope freeze means:
- rooms included are locked
- modules included are locked
- civil work inclusion is defined
- MEP inclusion is defined
- materials are narrowed to approved bands
- optional items are separated

### App behavior
No final quotation should be generated unless:
- scope is frozen
- design version is identifiable
- material selection level is sufficient

---

## 4.6 Detailed Design + Material Selection Stage
This stage must be budget-aware.

### Product requirement
The app must build the project **by budget**, not ignore budget until the end.

### That means
- material catalogs filtered by budget band
- default module specs suggested by budget band
- design suggestions limited or flagged if they exceed budget
- budget drift visible live during material changes

### Example
If client budget is “standard”:
- suggest laminate before premium veneer/PU unless explicitly upgraded
- suggest practical hardware tiers
- suggest modular repeatability before excessive custom carpentry

HomeLane’s public materials/pricing explanations consistently link material choice, modular scope, and finish selections to final price clarity.[3](https://www.homelane.com/cities/interior-designers-hyderabad) [9](https://www.homelane.com/interior-design/modular-kitchen-design/bangalore)

---

## 4.7 Final Quotation / BOQ Stage
This is one of the most important missing systems.

### Final quotation must include
- itemised module list
- itemised material specs
- room-wise cost
- optional add-ons
- exclusions
- taxes
- services included
- delivery/installation notes
- payment plan
- timeline assumptions
- warranty terms

### BOQ structure should support
- lump-sum presentation
- room-wise itemisation
- module-wise itemisation
- line-item internal costing

DesignCafe explicitly references the final quotation being presented as a BOQ after ideas/styles are finalized.[7](https://www.designcafe.com/blog/home-interiors/hiring-interior-designers-in-mumbai/)

---

## 4.8 Contract / Booking / Payment Plan Stage
This stage is usually underbuilt in design software, but in real business it is essential.

### Support required
- booking amount / token
- design sign-off payment
- production start payment
- dispatch payment
- installation/handover balance
- EMI/financing metadata
- payment due dates
- payment status tracking

### Market signals
- Livspace describes staggered payments: booking, cumulative payment after design finalization, and full payment by execution milestone.[1](https://www.livspace.com/in/interiors/service/service-designing-my-dream-home) [2](https://www.livspace.com/in/how-it-works)
- HomeLane describes milestone-linked payments tied to design sign-off, production, dispatch, and installation, and in some flows exposes percentages for booking / sign-off / manufacturing / dispatch.[5](https://www.homelane.com/cities/interior-designers-ahmedabad/bodakdev) [10](https://www.homelane.com/cities/interior-designers-kolkata)

### Product requirement
Payment plans must be configurable by studio and project type.

---

## 4.9 Procurement and Production Planning Stage
A real interior company does not jump from quote to installation.

The app must support:
- vendor selection
- purchase orders
- board/laminate/hardware planning
- lead times
- factory vs site-built separation
- production readiness checks
- dependencies on client approvals and site readiness

### Common separation to model
- factory-made modular units
- on-site civil and MEP work
- site-purchased loose items
- decor/furnishing items

---

## 4.10 Site Prep / Civil / MEP Stage
This is often a cause of delay.

The app must support:
- civil scope approval
- plumbing points
- electrical points
- ceiling work
- painting/tiling status
- site readiness checklist
- dependency to installation dates

This matches the organized-brand pattern where civil work and modular work run in a structured parallel sequence.[2](https://www.livspace.com/in/magazine/livspace101-livspace-interiors-process) [4](https://www.homelane.com/cities/interior-designers-bangalore/harlur)

---

## 4.11 Installation / QC / Snagging Stage
App must support:
- installation milestone tracking
- delivered vs installed quantities
- QC checks
- snag list capture
- rectification status
- client provisional sign-off

---

## 4.12 Handover / Final Billing / Warranty Stage
App must support:
- final handover checklist
- final invoice
- balance due
- warranty start date
- service visit log
- defect ticketing
- referrals/testimonials capture

Organized brands frequently use warranty/service as a trust differentiator, especially on modular work.[4](https://www.homelane.com/cities/interior-designers-bangalore/harlur) [10](https://www.homelane.com/cities/interior-designers-kolkata)

---

## 5. Product Modules Required to Cover the Full Commercial Pipeline

The product must add or strengthen these modules:

1. Lead Qualification Engine
2. Budget Fit Engine
3. Initial Estimate Engine
4. Scope Freeze Manager
5. Final Quotation / BOQ Engine
6. Payment Plan Engine
7. Invoice & Payment Tracker
8. Change Order / Variation Manager
9. Procurement / PO Manager
10. Site Readiness Tracker
11. Execution Milestone Tracker
12. Handover and Warranty Module

---

## 6. Budget-First Design Requirement

This is a core product principle.

### Rule
The project must be built by budget.

### The app must do this:
- classify client budget band early
- recommend room scope based on budget
- recommend material band based on budget
- flag budget overrun in real time
- classify modules as essential / stretch / premium optional
- offer downgrade and upgrade alternatives automatically

### Budget bands to support
- economy
- standard
- premium
- luxury
- bespoke ultra-premium

### Design behavior by budget band
#### Economy
- prioritize essential storage and functionality
- practical laminate / budget boards
- minimal custom complexity

#### Standard
- good modular finish options
- selected premium highlights only
- controlled customization

#### Premium
- broader material and hardware options
- stronger lighting/detailing allowance
- more customized feature units

#### Luxury
- high customization
- premium veneers/PU/glass/stone/lighting packages
- richer detailing and more site-specific design decisions

---

## 7. Commercial Document Types the App Must Support

1. Rough Estimate
2. Initial Design Proposal
3. Concept Estimate
4. Scope Freeze Summary
5. Final BOQ / Quotation
6. Payment Schedule
7. Tax Invoice
8. Receipt
9. Change Order / Variation Order
10. Purchase Order
11. Work Order
12. Handover Report
13. Warranty Certificate

---

## 8. Required Commercial States

### Estimate State
- draft
- shared
- revised
- approved
- superseded

### Quote State
- draft
- internal_review
- shared_with_client
- negotiation
- approved
- rejected
- superseded

### Payment State
- not_due
- due
- overdue
- partially_paid
- paid
- waived

### Procurement State
- planned
- po_issued
- in_production
- dispatched
- received
- installed

### Variation State
- proposed
- priced
- awaiting_client_approval
- approved
- rejected
- executed

---

## 9. Critical Missing Flows the Product Must Explicitly Cover

### Flow A — Initial Estimate → Final Quote Drift
Track and explain:
- why the price changed
- what changed in material, scope, quantity, or customisation

### Flow B — Client-Requested Scope Change
Support:
- change request
- revised price
- revised timeline
- impact on payment plan

### Flow C — Design Approval vs Budget Approval
These are not the same event.
Support separate approvals for:
- design concept
- commercial quote
- production release

### Flow D — Site Change During Execution
If site measurement changes or hidden conditions appear:
- raise issue
- revise scope
- issue variation order
- reprice affected items

### Flow E — Payment Collection and Dispatch Gating
Production / dispatch may depend on payment milestones.
Support configurable release rules.

---

## 10. Final Operating Requirement

> The app must not stop at design. It must support the full Indian interior company operating lifecycle — from first consultation to estimate, quotation, contracting, milestone billing, procurement, execution, handover, and warranty — while keeping budget, materials, and approvals connected to the same project truth.
