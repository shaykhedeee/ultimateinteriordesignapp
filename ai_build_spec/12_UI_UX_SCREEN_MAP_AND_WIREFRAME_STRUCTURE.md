# 12 — UI/UX Screen Map and Wireframe Structure

## 1. Purpose

This document defines the full UI/UX structure for the app so an AI coding agent or design team can implement screens with minimal ambiguity.

The goal is not just attractive UI.
The goal is a UI that correctly expresses the product’s workflow, geometry-first design model, versioning, review states, and production continuity.

---

## 2. Design Principles

1. premium dark interface
2. command-center density with clarity
3. stage-aware workflow everywhere
4. critical actions always visible
5. geometry and outputs must feel connected
6. client-facing outputs must look polished
7. stale / approved / locked states must be visually unmistakable

---

## 3. Global Layout Framework

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                     │
│ Studio Switcher | Search | Project Selector | Notifications | User Menu     │
├───────────────┬──────────────────────────────────────────────┬───────────────┤
│ LEFT SIDEBAR  │ MAIN CONTENT                                 │ RIGHT RAIL    │
│ 220–240 px    │ responsive workspace                          │ 300–360 px    │
│               │                                              │ context panel │
└───────────────┴──────────────────────────────────────────────┴───────────────┘
```

## 3.1 Left Sidebar
Items:
- Command Center
- Leads / CRM
- Onboarding
- Site Capture
- Plan Review
- Design Studio
- Render Studio
- Drawings
- Materials & Budget
- Proposal
- Approvals
- Production
- Deliverables
- Settings

## 3.2 Top Bar
Always include:
- project selector
- stage badge
- current scene version badge
- stale warning if applicable
- quick action button

## 3.3 Right Rail Behavior
Context-aware; shows:
- readiness checks
- validation warnings
- approval state
- comments
- next action
- entity metadata

---

## 4. Global Status and Badge System

### Required Badges
- Draft
- Review Needed
- Ready
- Approved
- Locked
- Stale
- Failed
- Exported
- Production Basis

### Required Colors
- approved = green
- warning/review = amber
- stale = orange/red
- locked = gold
- failed = red
- active = premium gold

---

## 5. Screen Map

1. Command Center
2. Leads / CRM
3. Onboarding Wizard
4. Site Capture
5. Floor Plan Intelligence Review
6. Design Studio
7. Render Studio
8. Drawings & Elevations Studio
9. Materials / Catalog / Budgeting
10. Proposal Builder
11. Approvals & Revisions
12. Production Workspace
13. Deliverables Vault
14. Settings / Rule Engine / Admin

---

## 6. Command Center

## Purpose
Studio-wide dashboard for pipeline visibility and immediate action.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ KPI STRIP                                                                 │
│ Leads | Active Projects | Review Pending | Approvals Pending | Production  │
├────────────────────────────────────────────────────────────────────────────┤
│ PIPELINE TABLE / KANBAN                                                   │
│ Client | Project | Stage | Readiness | Current Risk | Next Action         │
├───────────────────────────────────────────────────────┬────────────────────┤
│ LEFT/MAIN                                            │ RIGHT RAIL         │
│ - pipeline board                                     │ - readiness legend │
│ - recent activity                                    │ - urgent blockers  │
│ - upcoming approvals                                 │ - quick actions    │
└───────────────────────────────────────────────────────┴────────────────────┘
```

## Must Have Widgets
- pipeline table
- stage counts
- blocked items
- recent proposals
- recent approvals
- recent production exports

## Primary Actions
- Add Lead
- Add Project
- Resume Plan Review
- Resume Design
- Generate Proposal
- Open Production Basis

---

## 7. Leads / CRM

## Purpose
Track leads and convert them into projects.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ FILTER BAR                                                                │
│ Source | Status | Budget | City | Search                                  │
├────────────────────────────────────────────────────────────────────────────┤
│ LEADS TABLE                                                               │
│ Lead | Source | City | Budget | Status | Last Contact | Convert CTA       │
├───────────────────────────────────────────────┬────────────────────────────┤
│ DETAIL DRAWER                                 │ RIGHT RAIL                 │
│ lead details                                  │ lead score / notes / next │
└───────────────────────────────────────────────┴────────────────────────────┘
```

## Key UX Requirements
- quick lead entry
- convert-to-project modal
- note timeline
- qualification fields

---

## 8. Onboarding Wizard

## Purpose
Capture all structured client discovery data.

## Layout
```text
┌──────────────┬───────────────────────────────────────────┬─────────────────┐
│ STEP NAV     │ FORM CONTENT                              │ SUMMARY RAIL    │
│ vertical     │ current step                              │ completion %    │
│ 1..8         │                                           │ readiness       │
└──────────────┴───────────────────────────────────────────┴─────────────────┘
```

## Steps
1. Client Profile
2. Project Scope
3. Rooms & Priorities
4. Budget & Timeline
5. Style Preferences
6. Functional Needs
7. Vastu / Constraints
8. References

## UX Rules
- autosave every step
- required-field validation
- visible completion tracker
- summary updates live on right rail

---

## 9. Site Capture

## Purpose
Collect floor plans, photos, measurements, and existing-condition notes.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ INPUT MODE TABS                                                           │
│ Upload Plan | Scan / LiDAR | Manual Trace | Room Photos | Wall Photos     │
├───────────────────────────────────────────────┬────────────────────────────┤
│ MAIN CANVAS / UPLOAD AREA                     │ RIGHT RAIL                 │
│ - plan preview                                │ - capture checklist        │
│ - room photo grid                             │ - site issues              │
│ - measurement forms                           │ - verification status      │
└───────────────────────────────────────────────┴────────────────────────────┘
```

## Required Interactions
- upload plan
- attach room photos
- attach wall photos to specific wall refs later
- add measurement notes
- flag issues like beams/ducts/plumbing/electrical constraints

---

## 10. Floor Plan Intelligence Review

## Purpose
Review AI interpretation and turn it into trusted spatial truth.

## Layout
```text
┌─────────────────┬────────────────────────────────────────┬─────────────────┐
│ REVIEW LIST     │ PLAN CANVAS                            │ CONFIDENCE RAIL │
│ rooms/walls/... │ overlays: walls, openings, labels      │ summary scores   │
│ low→high conf   │ click item to accept/correct           │ warnings         │
└─────────────────┴────────────────────────────────────────┴─────────────────┘
```

## Main Panels
### Left
- review items grouped by type
- unresolved critical items at top

### Center
- floor plan image/PDF preview
- overlays for detected walls/openings/rooms
- correction tools

### Right
- room confidence summary
- scale confidence
- unresolved issues
- finalize spatial model CTA

## Critical Buttons
- Accept
- Correct
- Ignore
- Accept all high confidence
- Finalize Spatial Model

## UX Rules
- unresolved critical issues block finalization
- corrected items should visibly move to resolved state
- user must understand what AI is uncertain about

---

## 11. Design Studio

## Purpose
Core editable design environment. Most important screen in the product.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR: Room | Variant | Undo | Redo | Save Version | Validate | Preview │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ LEFT PANEL    │ CANVAS AREA                              │ RIGHT INSPECTOR │
│ room tree     │ split view: 2D plan + 3D preview         │ entity details  │
│ module lib    │ or toggle full 2D/full 3D                │ rules/warnings  │
│ templates     │                                          │ materials/props │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## 11.1 Left Panel Tabs
- Rooms
- Module Library
- Template Packs
- Saved Reuse Assets

## 11.2 Canvas Modes
- Split: 2D + 3D
- 2D Focus
- 3D Focus
- Elevation Previews mini-strip optional

## 11.3 Right Inspector Contexts
### when room selected
- room type
- dimensions
- ceiling style
- floor finish
- notes
- room score

### when wall selected
- wall length
- height
- openings list
- wall finish
- wall photos
- elevation quick actions

### when module selected
- parameters
- finish slots
- production mapping summary
- validation results
- duplicate/replace actions

## 11.4 Mandatory Toolbar Actions
- Save Version
- Branch Variant
- Validate Scene
- Open Render Studio
- Open Drawings Studio

## 11.5 UX Rules
- no hidden unsaved work ambiguity
- every meaningful edit creates a patchable version
- locked scenes open readonly unless explicitly branched
- validation warnings always visible

---

## 12. Render Studio

## Purpose
Generate and approve visuals from the exact scene.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP: Room | Scene Version | Render Tier | Status | Generate CTA           │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ INPUT PANEL   │ RENDER VIEWER                            │ APPROVAL RAIL   │
│ camera presets│ selected render                          │ shortlist       │
│ lighting      │ variants strip below                     │ comments        │
│ style presets │ compare mode                             │ stale state     │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## Left Panel Inputs
- room selection
- camera presets
- lighting presets
- style presets
- variant count
- render tier

## Center
- large selected render
- variant thumbnails
- compare mode 2-up or 4-up

## Right
- approval controls
- comments linked to variant
- linked scene version metadata
- stale warning if scene changed

## Buttons
- Generate Set
- Approve Variant
- Reject Variant
- Shortlist
- Request Edit
- Use in Proposal

---

## 13. Drawings & Elevations Studio

## Purpose
Generate, review, and export floor plans, wall elevations, ceiling plans, and schedules.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP: Scene Version | Drawing Scope | Regenerate | Export                  │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ NAV PANEL     │ MAIN PREVIEW                              │ DETAILS RAIL    │
│ floor plan    │ selected drawing preview                  │ scale/notes     │
│ room elevs    │ zoom/pan                                  │ annotations     │
│ ceiling plan  │                                           │ stale state     │
│ schedules     │                                           │ linked entities │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## Navigation Tree Example
- Full Floor Plan
- Living Room
  - Wall A Elevation
  - Wall B Elevation
  - Wall C Elevation
  - Wall D Elevation
  - Ceiling Plan
  - Module Schedule
- Kitchen
  - Wall A ...

## UX Rules
- stale state clearly visible
- each drawing shows source scene version
- room and wall labels consistent with design studio

---

## 14. Materials / Catalog / Budgeting

## Purpose
Select real materials/products and generate cost views.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ FILTERS: category | brand | color family | room | budget                  │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ CATALOG PANEL │ MATERIAL GRID / PRODUCT GRID             │ COST RAIL       │
│ categories    │ swatches, cards, previews                │ room totals      │
│ saved packs   │ apply to module/room/all                 │ module totals    │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## Must Support
- catalog browsing
- finish packs
- apply to scene entities
- rate card selection
- room/module cost breakdown
- budget warnings

---

## 15. Proposal Builder

## Purpose
Create the client-facing package from current valid outputs.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP: Scene Version | Render Set | Pricing Set | Drawing Set | Export PDF  │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ SECTION LIST  │ PROPOSAL PAGE PREVIEW                    │ PACKAGE RAIL    │
│ cover         │ selected page preview                    │ validity checks │
│ summary       │ reorder sections                         │ stale warnings  │
│ visuals       │ edit notes/labels                        │ export status   │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## Sections
- Cover
- Project Summary
- Client Requirements
- Site/Floor Plan Summary
- Room Visuals
- Room Briefs
- Materials Direction
- Module Schedule
- Pricing Summary
- Sign-off

## UX Rules
- block or warn export if dependent outputs stale
- allow section reorder
- allow studio branding controls

---

## 16. Approvals & Revisions

## Purpose
Manage client review, approval, rejection, and revision history.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ APPROVAL PACKAGE HEADER                                                   │
│ package type | scene version | status | created date                      │
├───────────────────────────────────────────────┬────────────────────────────┤
│ LEFT: PACKAGE CONTENT                         │ RIGHT: ACTIONS / COMMENTS  │
│ linked renders, drawings, proposal, pricing  │ approve / reject / comment │
│ compare with previous package                 │ revision request summary   │
└───────────────────────────────────────────────┴────────────────────────────┘
```

## Must Support
- approval package detail
- comments list
- rejection reasons
- revision requests
- lock/unlock history

---

## 17. Production Workspace

## Purpose
Bridge approved design into production outputs.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP: Approved Scene | Production Preset | BOM | Cutlist | Export          │
├───────────────┬──────────────────────────────────────────┬─────────────────┤
│ MODULE LIST   │ PARTS / BOM / SHEET VIEW                 │ WARNINGS RAIL   │
│ approved mods │ tabs: BOM | Parts | Sheet Layout         │ missing mapping │
│ status chips  │ room/module grouping                     │ rule issues     │
└───────────────┴──────────────────────────────────────────┴─────────────────┘
```

## Tabs
- Module Schedule
- BOM Summary
- Part List
- Sheet Layouts
- Export Package

## UX Rules
- clearly mark draft vs approved production basis
- show warnings before export
- no silent generation from stale/old scene

---

## 18. Deliverables Vault

## Purpose
Store and retrieve all outputs.

## Layout
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ FILTERS: all | renders | drawings | proposals | bom | cutlists            │
├────────────────────────────────────────────────────────────────────────────┤
│ DOCUMENT GRID / TABLE                                                     │
│ file card | source scene | status | version | created date | open/export  │
└────────────────────────────────────────────────────────────────────────────┘
```

## Must Support
- per-project history
- open/download
- latest vs historical indicators
- share package creation

---

## 19. Settings / Rule Engine / Admin

## Sections
- Studio Branding
- Team & Roles
- Rate Cards
- Production Presets
- Rule Sets
- Catalog Sources
- Integrations
- Backup / Restore
- AI Provider Settings

## Rule Set UI
Must allow:
- activate/deactivate rule sets
- room/module scoped rule editing
- severity choice
- override policies

---

## 20. Entity Drawers and Modals

## 20.1 Standard Entity Drawer
Use for:
- room detail
- wall detail
- module detail
- asset detail
- comment detail

## 20.2 Required Modals
- Create Lead
- Convert Lead to Project
- Confirm Stage Transition
- Save New Scene Version
- Create Variant Branch
- Override Hard Rule
- Create Approval Package
- Export Proposal
- Export Production Package

---

## 21. Global Interaction Patterns

## 21.1 Stale State Pattern
Whenever a scene changes and downstream outputs become stale:
- show orange stale badge on affected tabs/screens
- show “Regenerate” CTA
- prevent mistaken approval/export of stale outputs unless explicit override

## 21.2 Locked State Pattern
When a scene version is locked:
- show lock badge in header
- disable direct editing
- show “Create Branch” CTA instead

## 21.3 Version Context Pattern
On design/render/drawing/proposal/production screens, always show:
- project code
- scene version number
- branch name
- locked/stale status

---

## 22. Mobile / Tablet Strategy

### Mobile priority screens
- CRM / leads
- intake summary
- site capture
- comment review
- dashboard

### Tablet priority screens
- 2D editor
- room preview
- client walkthrough review

### Desktop priority screens
- full design studio
- render studio
- drawings studio
- production workspace

---

## 23. Accessibility and Usability Rules

- keyboard shortcuts in design studio
- large click targets for plan items
- clear labels for room/module states
- high contrast in dark UI
- avoid hiding critical state only in color; use icons/labels

---

## 24. Suggested Wireframe Priorities for First Design Pass

Priority 1:
- Command Center
- Onboarding Wizard
- Floor Plan Review
- Design Studio

Priority 2:
- Render Studio
- Drawings Studio
- Proposal Builder

Priority 3:
- Production Workspace
- Deliverables Vault
- Settings / Rules

---

## 25. Final UI/UX Statement

> The UI must make the system feel like one connected premium studio operating environment. Every major screen must clearly express the current project stage, source scene version, output validity, and next action. The user should never wonder what is current, what is approved, what is stale, or what happens next.
