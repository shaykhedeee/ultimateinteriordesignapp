# 22 — Expanded Master Architecture for Everything

## 1. Purpose

This is the consolidated architecture map for the full product.

It covers all major domains:
- CRM
- intake
- plan intelligence
- scene graph
- 2D/3D editor
- rule engine
- Vastu / Indian interiors layer
- materials and budget engine
- estimate / quotation / billing
- procurement
- render pipeline
- drawing pipeline
- approvals
- production outputs
- warranty / service
- memory and analytics

---

## 2. Full System Map

```text
Lead + CRM
  ↓
Qualification + Budget Fit
  ↓
Discovery Intake
  ↓
Site Capture + Floor Plan Upload + Photos + Measurements
  ↓
Plan Intelligence + Review
  ↓
Spatial Model
  ↓
Scene Graph
  ↓
Design Studio (2D/3D + Modules + Rules + Vastu + Budget)
  ↓
├── Render Studio
├── Drawings Studio
├── Pricing / Estimate Engine
├── Proposal Builder
└── Approval Packages
  ↓
Approved Scene Lock
  ↓
├── BOM / Cutlist
├── Procurement / PO
├── Site Execution Tracking
└── Billing / Collections / Variations
  ↓
Installation / QC / Handover
  ↓
Warranty / Service / Reuse / Analytics
```

---

## 3. Architecture Domains

## Domain A — Customer Acquisition
- leads
- qualification
- consultation scheduling
- experience centre / online consultation origin
- lead scoring

## Domain B — Design Discovery
- client profile
- room brief
- style brief
- budget brief
- Vastu preference profile
- maintenance preference profile

## Domain C — Spatial Intelligence
- floor plan ingestion
- OCR and room detection
- wall/opening inference
- measurement review
- confidence scoring

## Domain D — Editable Design Core
- spatial model
- scene graph
- room and wall entities
- parametric modules
- material assignments
- camera and light presets

## Domain E — Decision Intelligence
- room rules
- Vastu rules
- budget-fit rules
- material suitability rules
- production feasibility rules

## Domain F — Commercial Engine
- rough estimate
- concept estimate
- final BOQ quote
- scope freeze
- payment plan
- invoices
- receipts
- variation orders

## Domain G — Execution and Production
- BOM
- cutlists
- procurement
- dispatch readiness
- site readiness
- installation tracking
- snagging

## Domain H — Output and Presentation
- renders
- walkthroughs
- drawings
- proposals
- approval packages
- deliverables vault

## Domain I — Post-Handover
- warranty tracking
- service tickets
- care visits
- referral/testimonial capture

---

## 4. Non-Negotiable Cross-Cutting Rules

1. Everything must be version-linked.
2. Every major output must reference a source scene version.
3. Commercial documents must be scope-aware.
4. Production outputs must be approval-aware.
5. Budget and material logic must influence design, not only reporting.
6. Indian interior and Vastu logic must be configurable and explainable.

---

## 5. Final Statement

> The complete architecture is not just a design stack, not just a quote stack, and not just a production stack. It is one connected operating system where spatial truth, commercial truth, approval truth, and production truth all remain synchronized.
