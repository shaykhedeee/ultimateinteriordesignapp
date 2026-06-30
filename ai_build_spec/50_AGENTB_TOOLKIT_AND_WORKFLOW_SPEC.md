# 50 — Agent B Inspired Toolkit and Workflow Specification for StudioOS

## Purpose

This document specifies the exact toolkit, workflow system, and public feature architecture StudioOS should expose in order to match and surpass the public experience pattern shown by Agent B.

---

## 1. StudioOS Top Navigation / Entry System

StudioOS should expose two parallel access patterns:

### A. Workflow-first entry
For users who think in end-to-end tasks.

### B. Tool-first entry
For users who want a specialist capability quickly.

This mirrors the strongest lesson from Agent B’s public UX.

---

## 2. Required Workflow-First Entry Points

## 2.1 Smart Project
Tagline:
- end-to-end plan to design to render to drawings to BOM

### Stages
1. Upload plan
2. Interpret and enhance
3. Calibrate and review
4. Zone and annotate
5. Build editable scene
6. Style room-by-room
7. Generate renders and cameras
8. Generate drawings and elevations
9. Generate BOM / quote basis
10. Present and approve

## 2.2 Quick Generate
Tagline:
- references + room geometry + style → fast concept render

### Stages
1. choose room or scene
2. add style prompt / moodboard / references
3. generate quick variants
4. refine materials / camera / lighting
5. shortlist and branch

## 2.3 Photo Edit
Tagline:
- edit room photos and design references instantly

### Stages
1. upload photo
2. target elements or zones
3. swap materials / colors / lighting
4. store accepted results as references or room inspiration

## 2.4 Design Product
Tagline:
- generate and refine modular or custom products with production continuity

### Stages
1. choose module family or custom product
2. set dimensions and style
3. refine materials and details
4. generate product drawings
5. generate BOM / cost basis

## 2.5 Quick Layout
Tagline:
- draw a room fast and turn it into a scene starter

### Stages
1. draw walls / openings
2. place furniture blocks
3. save / lock sketch
4. generate top view
5. promote into scene if needed

---

## 3. Required Tool-First Entry Points

## 3.1 Layout and plan tools
- Upload Plan
- Edit Uploaded Plan
- New Quick Layout
- Edit Quick Layout
- Plan Calibration
- Plan Annotation Review
- Layout to 3D

## 3.2 Render tools
- Quick Render
- Camera Angle Adjustment
- Material Change
- Mood / Time-of-Day Change
- Render Refine
- Walkthrough Preview

## 3.3 Product tools
- Product Builder
- Product Customize
- Product Angles
- Product Drawings
- Product BOM Calculator

## 3.4 Reference and style tools
- Moodboard Builder
- Room Style Presets
- Reference Library
- Material Match

## 3.5 Drawing/documentation tools
- Elevation Generator
- RCP Generator
- Drawing Pack Builder
- Exploded Diagram
- CAD-like Output Tools

---

## 4. Tool Taxonomy Specification

Every tool must be tagged by:
- capability group
- input type
- output type
- geometry fidelity
- whether it updates canonical scene truth or only generates references

### Example metadata
- tool key
- display name
- category
- input requirements
- update behavior
- downstream compatible outputs

This lets the product scale cleanly without becoming a random collection of AI buttons.

---

## 5. Workflow Routing Rules

The app should intelligently route user prompts such as:
- “I have a floor plan. Generate render.”
- “Change the sofa in this room photo.”
- “Modify the style of the room to classic Indian.”
- “I have a room photo and want a 2D layout.”
- “Design a walnut dining table with brass legs.”

### Required routing behavior

#### If prompt references floor plan + rendering
Route to:
- Smart Project or Quick Generate depending on whether editable geometry exists

#### If prompt references photo edits
Route to:
- Photo Edit workflow

#### If prompt references new product generation
Route to:
- Design Product workflow

#### If prompt references new/drawn layout
Route to:
- Quick Layout

#### If prompt references room photo to layout
Route to:
- Photo-to-layout conversion + review flow

---

## 6. Public Dashboard / Workspace Requirements

The top-level dashboard should eventually support counters similar in spirit to competitors:
- projects
- renders
- products/modules
- drawings
- BOMs
- quotations
- approvals

But StudioOS should add deeper operational counters:
- floor plan versions needing review
- stale scenes
- render memory signals
- drawing readiness
- production readiness

---

## 7. “AI Studio” Equivalent for StudioOS

StudioOS should expose an AI Studio or Tools Hub, but it must be connected to real data.

### Required groups
- Plan Intelligence
- Scene Generation
- Photo Editing
- Product/Module Design
- Materials & Styling
- Rendering & Walkthroughs
- Drawings & Documents
- Commercial & Production

### Strong rule
No tool should feel disconnected from the project system.
If used inside a project, outputs must be attachable to that project.

---

## 8. Public-Surface Experience Improvements StudioOS Should Add

To improve on competitors, StudioOS should expose:
- clearer “what happens next” workflow guidance
- more obvious calibration/review checkpoints
- stronger scene version traceability
- module-linked drawing visibility
- BOM previews before approval lock
- Indian room/module starter packs

---

## 9. Final Requirement

StudioOS should implement a workflow and toolkit system that is:
- broad enough to match public competitors
- structured enough to stay coherent
- connected enough to preserve scene truth
- deep enough to carry the user from first input to production handoff
