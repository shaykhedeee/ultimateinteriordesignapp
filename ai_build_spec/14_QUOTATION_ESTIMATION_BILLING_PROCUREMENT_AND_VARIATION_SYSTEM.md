# 14 — Quotation, Estimation, Billing, Procurement, and Variation System

## 1. Purpose

This document defines the full commercial operating system for the app.

It covers:
- rough estimates
- budget-fit estimates
- final BOQ quotation
- contract/payment schedules
- invoices and receipts
- procurement and purchase orders
- variation orders
- execution-linked billing
- final closure and handover billing

---

## 2. Core Commercial Philosophy

The commercial system must be:
- **versioned**
- **transparent**
- **budget-aware**
- **stage-aware**
- **approval-aware**
- **scope-aware**

### Golden rule
No quote, invoice, purchase order, or billing milestone may exist without traceability to:
- project
- scope version
- scene/design version where applicable
- commercial version

---

## 3. Commercial Objects

The product must model these explicitly:

1. Budget Profile
2. Estimate Set
3. Estimate Line Items
4. Quote Set / BOQ
5. Quote Line Items
6. Quote Options / Alternates
7. Payment Plan
8. Payment Milestones
9. Invoices
10. Receipts / Payments
11. Change Orders / Variation Orders
12. Purchase Orders
13. Vendor Deliveries / GRNs
14. Final Account Closure

---

## 4. Budget Profile

This should be created immediately after discovery.

### Fields
- target budget
- hard cap budget
- scope type: full home / room package / modular only / turnkey
- preferred investment areas
- areas to economise
- financing needed?
- move-in deadline
- contingency allowance

### Why
This object controls design decisions, recommended materials, and upgrade/downgrade logic.

---

## 5. Estimate Types

The app must support multiple commercial stages, not one single “quote.”

## 5.1 Rough Estimate
Used early.

### Characteristics
- low detail
- quick budget fit
- based on rules, project size, room count, scope, and material assumptions
- clearly marked non-final

## 5.2 Concept Estimate
Used after first concept direction.

### Characteristics
- room-level summary
- selected modules included
- optional upgrades separated
- still subject to detailed design and site validation

## 5.3 Final BOQ Quote
Used after scope and material freeze.

### Characteristics
- module-level detail
- services included/excluded
- taxes
- optional extras
- payment schedule
- validity period
- revision-safe

---

## 6. Estimate/Quote Versioning Rules

Every commercial revision must create a new version.

### Triggers for new estimate/quote version
- scene changes affecting quantities
- room/module scope changes
- material band changes
- additional civil work inclusion
- variation request
- tax/price revision
- vendor-driven rate update before final approval

### Mandatory comparison view
The app must show:
- previous total
- new total
- delta amount
- delta percentage
- reason for change

---

## 7. BOQ / Quote Structure

## 7.1 Internal Commercial Structure
The quote engine must internally understand:

### Section A — Design & PM
- design fee
- project management fee

### Section B — Modular Woodwork
- kitchen
- wardrobes
- TV units
- crockery
- mandir
- storage units

### Section C — Civil / MEP
- electrical
- plumbing
- tiling
- false ceiling
- painting

### Section D — Loose Furniture / Decor
- sofas
- dining
- curtains
- decor packages

### Section E — Appliances / Third-Party Items
- chimney
- hob
- oven
- dishwasher
- mirrors / bath accessories

### Section F — Delivery / Installation / Logistics
- transport
- installation
- site protection / cleanup if applicable

### Section G — Taxes
- GST
- other statutory fields if applicable

## 7.2 Presentation Modes
- summary quote
- room-wise breakdown
- module-wise breakdown
- internal costing sheet
- client-facing BOQ PDF

---

## 8. Itemization Rules

Each commercial line item should support:
- item code
- room
- module group
- line description
- quantity
- UOM
- base rate
- markup/margin
- taxability
- vendor/source link optional
- design version reference
- notes

### Line Item Categories
- design_service
- modular_unit
- civil_scope
- electrical_scope
- plumbing_scope
- ceiling_scope
- painting_scope
- hardware_package
- appliance
- loose_furniture
- decor
- delivery_installation
- discount
- tax
- contingency

---

## 9. Budget-Driven Material Recommendation Engine

The app must recommend materials based on:
- budget profile
- room type
- maintenance preference
- climate suitability
- client likes/dislikes

### Example matrix
#### Economy
- commercial ply / MR options only if acceptable
- laminates over PU/veneer
- standard hardware brands

#### Standard
- BWR/BWP or HDHMR in moisture-sensitive zones
- laminates/acrylic mix
- selected better hardware

#### Premium
- higher board grades
- acrylic/veneer/PU options
- premium channels/hinges
- better lighting packages

#### Luxury
- advanced finishes
- bespoke paneling
- premium glass/stone/veneer/PU combinations
- high-end fittings

### Required behavior
When client exceeds budget, app must suggest:
- cheaper finish alternatives
- modular simplification
- scope reduction options
- phased implementation option

---

## 10. Optional vs Core Scope

Quotes must distinguish clearly between:
- included core scope
- optional upgrades
- excluded work
- assumed future scope

### This matters because
organized interior companies often sell a base package but allow stepwise upgrades; the app must make these visible and comparable.[3](https://www.homelane.com/cities/interior-designers-hyderabad) [4](https://www.homelane.com/cities/interior-designers-bangalore/harlur)

---

## 11. Payment Plan Engine

## 11.1 Requirements
A payment plan must be generated per quote or contract.

### It must support
- fixed percentages
- fixed amount milestones
- milestone due on event
- milestone due on date
- EMI/finance linked flag
- release conditions

## 11.2 Standard Milestone Template
A typical studio may use:
- Booking / Token
- Design Sign-off / Scope Freeze
- Production Start
- Dispatch / Pre-Installation
- Handover / Completion

### Observed market patterns
- Livspace publicly describes booking, cumulative payment after design finalization, and full payment by execution milestone.[1](https://www.livspace.com/in/interiors/service/service-designing-my-dream-home)
- HomeLane publicly describes milestone-linked payments, with some flows exposing booking, design sign-off, manufacturing/production, and dispatch-linked payment stages.[5](https://www.homelane.com/cities/interior-designers-ahmedabad/bodakdev) [10](https://www.homelane.com/cities/interior-designers-kolkata)

### Product requirement
The app must support studio-configurable payment templates instead of hardcoding any one company’s structure.

---

## 12. Invoice System

## 12.1 Invoice Types
- proforma invoice
- tax invoice
- advance invoice
- milestone invoice
- final invoice
- credit note
- debit note

## 12.2 Invoice Content
Must include:
- customer details
- project details
- invoice number
- quote reference
- milestone reference
- taxable line items
- tax summary
- total due
- paid amount
- balance amount
- due date

## 12.3 Invoice Rules
- invoice lines must reconcile to quote or approved variation
- invoice cannot exceed approved billable scope without variation approval
- invoice status must drive finance visibility

---

## 13. Payment Tracking

## 13.1 Payment States
- unpaid
- partially paid
- paid
- overdue
- refunded
- waived

## 13.2 Payment Sources
- bank transfer
- cheque
- cash (if enabled)
- card
- UPI
- EMI partner
- financing partner

## 13.3 Allocation Logic
One payment may cover:
- one invoice fully
- multiple invoices partially
- one milestone partially

The app must support payment allocations.

---

## 14. Variation / Change Order System

This is one of the most critical missing flows in most design tools.

## 14.1 Variation Triggers
- client changes finish after sign-off
- client adds modules
- site measurement difference changes quantity
- hidden civil issue discovered on site
- brand substitution / hardware upgrade
- schedule-driven redesign

## 14.2 Variation Object Must Include
- change request source
- description
- impacted rooms/modules
- design impact
- cost impact
- timeline impact
- approval state
- linked revised estimate/quote

## 14.3 Rules
- no variation should execute without status and audit trail
- commercial impact must be explicit
- payment plan may need revision

HomeLane’s public pricing explanations repeatedly emphasize that cost changes happen only in defined cases such as design changes after sign-off or genuine site-condition changes, and that revised costs must be communicated before proceeding.[5](https://www.homelane.com/cities/interior-designers-ahmedabad/bodakdev) [3](https://www.homelane.com/cities/interior-designers-hyderabad)

---

## 15. Procurement System

## 15.1 Purchase Orders
The system must support POs for:
- boards
- laminates
- hardware
- appliances
- decor
- subcontractor scopes

### PO fields
- vendor
- expected date
- quantity
- rate
- tax
- linked quote/BOQ section
- linked room/module optional

## 15.2 Goods Receipt / Delivery Capture
Track:
- ordered quantity
- received quantity
- rejected quantity
- dispatch date
- delivery date
- issue notes

## 15.3 Procurement States
- planned
- requested
- approved
- ordered
- partially received
- fully received
- installed/consumed
- closed

---

## 16. Execution-Linked Commercial Controls

The product must support gated releases such as:
- do not start production until booking/design milestone paid
- do not dispatch until dispatch milestone paid
- do not handover until final balance rules checked

These rules must be configurable.

---

## 17. Final Billing Closure

At closure, app must support:
- all approved scope summarized
- all variations summarized
- all invoices summarized
- all payments summarized
- final balance or refund
- handover sign-off
- warranty start date

---

## 18. Required Commercial Dashboard Views

## 18.1 Project Commercial Summary
Show:
- initial estimate
- current approved quote
- total billed
- total received
- outstanding balance
- approved variations
- procurement exposure

## 18.2 Collections Dashboard
Show:
- due this week
- overdue invoices
- project-level collection risk

## 18.3 Procurement Dashboard
Show:
- pending POs
- delayed receipts
- dispatch blockers

---

## 19. Mandatory Product Flows to Add

1. Initial estimate flow
2. Budget-fit warning flow
3. Scope freeze flow
4. Final quote/BOQ generation flow
5. Payment plan flow
6. Invoice generation flow
7. Payment receipt flow
8. Variation order flow
9. Vendor PO flow
10. Final billing closure flow

---

## 20. Final Commercial System Statement

> The app must behave like a real interior design company’s commercial backbone. It must distinguish between rough estimates, budget-fit proposals, final BOQs, invoices, payments, and change orders, while keeping all pricing, billing, and procurement linked to approved scope, materials, and design versions.
