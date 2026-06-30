# 01 — Competitor Feature Superset and Differentiation

## 1. Purpose

This document defines exactly what to borrow from top products in the market and how to build a product that is stronger than all of them in a single connected workflow.

The objective is **not** to clone any tool.
The objective is to build a **superset product** with:

- better continuity
- better editability
- better production logic
- better India-specific logic
- better confidence and validation
- better proposal-to-production connectivity

## 2. Key Competitor Categories

The market can be grouped into seven product categories:

1. plan-to-3D design tools
2. render-first visualization tools
3. catalog and commerce-oriented interior tools
4. plan clarity / drawing tools
5. documentation and presentation tools
6. scan / as-built capture tools
7. production-aware design bridges

Your app must combine the best of all seven.

---

## 3. Borrowed Features by Benchmark Product

## 3.1 Planner 5D — What to Borrow

### Borrow
- floor plan to editable 3D workflow
- low-friction user experience
- simple drag-and-edit interactions
- 360 walkthroughs
- CAD export pathway
- flexible concepting for non-CAD users

### Build Better
- support stricter room/wall/opening confidence review
- preserve exact wall and opening data as first-class entities
- make module placement more production-aware
- allow room template generation based on Indian modular logic
- support design-to-elevation continuity from the same model
- support scene-to-cutlist continuity, which Planner-style tools typically do not prioritize

### Non-Negotiable Upgrade
The output must not just be an editable room shell.
It must become a **production-aware scene graph**.

---

## 3.2 Coohom — What to Borrow

### Borrow
- very fast render workflow
- strong furniture/catalog browsing feel
- budget widget / cost tracking
- 360 client links
- comments and share workflow
- presentation-friendly speed
- visual material and product exploration

### Build Better
- support local modular product systems, not only furniture objects
- make cost estimates room-wise, module-wise, and revision-aware
- connect itemized costing to actual module geometry and finish quantities
- support BOM/cutlist handoff from approved modules
- support role-based pricing visibility
- support configurable vendor catalogs, Indian laminate catalogs, hardware catalogs, and board catalogs

### Non-Negotiable Upgrade
Budgeting must not be cosmetic.
It must derive from:
- modules
- finishes
- quantity formulas
- vendor rate cards
- design version

---

## 3.3 Foyr — What to Borrow

### Borrow
- fast interior presentation flow
- fast concept-to-render feel
- straightforward 2D-to-3D workflow
- polished interior visualization path
- quick walkthrough generation
- ease of use in client-facing sessions

### Build Better
- separate draft renders from final approved renders
- include geometry-aware review gates
- add stronger room module intelligence
- connect approved design to drawings, proposals, and production
- preserve exact camera and scene versions tied to approvals
- support more deterministic lighting and elevation generation

### Non-Negotiable Upgrade
The app must feel as fast as a sales tool but remain traceable like a production tool.

---

## 3.4 Homestyler — What to Borrow

### Borrow
- ease of use
- large asset library feel
- drag-and-drop friendliness
- fast browser-based 3D visualization
- image / plan upload to 3D conversion
- quick iteration workflow
- high perceived accessibility for non-technical users

### Build Better
- make room/module libraries production-intelligent rather than purely visual
- allow controlled libraries: generic, curated, and studio-approved
- support Indian furniture, appliances, cabinetry, pooja units, crockery units, and localized material systems
- connect furniture/assets to actual dimensions, budgets, and room rules
- prevent visual changes from breaking production assumptions

### Non-Negotiable Upgrade
The asset library must be **semantically meaningful**, not just visually large.
Every important placed object should know:
- what it is
- where it belongs
- whether it affects production
- what category it maps to
- what rules apply

---

## 3.5 RoomSketcher — What to Borrow

### Borrow
- clarity of 2D plan outputs
- measurements and area calculations
- understandable walkthrough mode
- practical drawing readability
- blueprint-to-plan utility
- simplicity for non-experts

### Build Better
- make drawings more interior-production specific
- generate wall elevations automatically from the same room scene
- support dimensioned module schedules
- generate finish annotations and lighting annotations
- generate room-level measurement confidence and verification workflows
- connect plan clarity to modular interior production workflows

### Non-Negotiable Upgrade
The app must not only generate clean plans.
It must generate **design-aware plans**, **interior elevations**, and **module-aware schedules**.

---

## 3.6 Cedreo — What to Borrow

### Borrow
- presentation documents
- sections/elevations mentality
- proposal-oriented outputs
- all-in-one document packaging
- client-ready branded exports
- full-project storytelling from plan to visual

### Build Better
- make outputs interior-design-specific rather than generic building-plan outputs
- include room-wise finishes, module schedule, materials, and production assumptions
- bind every document to exact model revision IDs
- support proposal-to-approval-to-production continuity
- allow client comments directly against room, wall, module, or render

### Non-Negotiable Upgrade
Documents must be generated from the same source model as renders and modules.
No parallel manual document-building workflow should exist.

---

## 3.7 magicplan / Matterport — What to Borrow

### Borrow
- scan/as-built capture mentality
- mobile-first site intake
- room measurement assistance
- photo and documentation attachment to spatial locations
- digital twin / current-condition capture workflow
- field-to-office continuity

### Build Better
- capture room photos wall-by-wall and link them to wall entities
- support measurement verification against plan interpretation
- let site executives flag ducts, beams, niches, plumbing, electrical constraints, and obstructions
- merge scan/as-built data into the design scene graph
- support “existing condition” vs “proposed condition” states
- allow version comparison between as-built and design proposal

### Non-Negotiable Upgrade
The scan/as-built capture system must not stay isolated.
It must become part of the project truth and design engine.

---

## 4. Required Superset Experience

The final product must provide the following combined experience:

### From Lead to Design
- lead capture
- qualification
- discovery intake
- requirements structuring
- references and dislikes

### From Plan to Editable Design
- floor plan upload / scan / trace / CAD bridge
- CV-assisted wall/opening/room extraction
- confidence review
- 3D shell generation
- room-wise template suggestions

### From Design to Presentation
- linked 2D and 3D editing
- material and lighting changes
- walkthroughs
- camera presets
- fast preview and premium renders
- side-by-side variants

### From Design to Documentation
- annotated plan
- wall elevations
- ceiling plans
- module schedules
- finish schedules
- lighting schedules
- PDF brief / proposal

### From Design to Production
- module locking
- rate and quantity calculation
- BOM
- cutlist generation
- workshop exports
- deliverables vault

---

## 5. What the App Must Do Better Than All Competitors

## 5.1 Indian Modular Interior Logic

The app must deeply understand Indian interior realities:

- modular kitchen logic
- wardrobe carcass logic
- lofts and overhead storage
- TV wall systems with paneling and floating units
- pooja / mandir placement logic
- crockery and dining niche logic
- utility/balcony usage patterns
- appliance and hob/sink/chimney positioning norms
- laminate and board specification patterns
- common hardware and edge banding logic
- vastu-aware optional rules

### Required Enhancements
- built-in Indian room/module templates
- Indian material and brand catalogs
- Indian budget band presets
- local unit systems and sheet sizes
- production naming conventions compatible with workshop practices

---

## 5.2 Room-Specific Rule Engine

The app must evaluate rooms differently based on room type.

### Example
#### Kitchen
- base depth range
- wall cabinet depth range
- loft alignment
- sink-under-window preference
- hob/chimney relationship
- circulation clearances

#### Wardrobe
- swing clearance
- sliding depth rules
- walk-in passage rules
- internal segmentation logic

#### TV Wall
- centered composition
- backdrop finish logic
- paneling termination logic
- floating console rules
- backlighting logic

#### Mandir
- preferred orientation
- platform height range
- storage base logic
- screen/jali/backlit stone options

### Required Enhancements
- auto-detect room type from plan + user inputs
- show rule warnings and design-score feedback
- never silently violate hard rules without user override and audit trail

---

## 5.3 Floor Plan Accuracy Confidence

Most tools either over-automate or under-explain.
This product must support:

- per-room confidence score
- per-wall confidence score
- per-opening confidence score
- per-dimension confidence score
- per-component detection confidence

### Required Enhancements
- show AI inference reasons
- flag ambiguous rooms
- ask for user confirmation where confidence is low
- support hybrid manual correction workflows
- store every correction for future model improvement

---

## 5.4 Scene-to-Render-to-Cutlist Continuity

This is a major differentiator.

The app must guarantee:

- every render references a scene revision
- every drawing references a scene revision
- every proposal references a scene revision
- every BOM references a scene revision
- every cutlist references a locked approved design revision

### Required Enhancements
- stale outputs must be marked outdated when scene changes
- approvals must be invalidated when locked geometry changes
- user must see exactly what is current and what is stale

---

## 5.5 Production-Ready Modular Outputs

The app must go beyond pretty visuals.

### Required Capabilities
- module schedules
- materials and finishes schedule
- part formulas
- BOM
- edge-band rules
- board thickness logic
- workshop PDF/CSV outputs
- per-room and per-module production notes

### Required Enhancements
- formula-driven carcass generation
- customizable production presets per studio
- revision-safe export packaging
- QA warnings for impossible / unsafe / inconsistent modules

---

## 5.6 Better Client Collaboration Than Most Competitors

The client experience should be superior to static PDF handoffs.

### Required Capabilities
- secure share links
- room-by-room comments
- compare options A/B
- request revision on a specific wall / render / module
- approval signatures or confirm actions
- client-facing story mode presentation

### Required Enhancements
- comments attached to model entities
- client comment to designer task conversion
- revision requests preserved against version history

---

## 5.7 Better Reusability Than Most Competitors

The app must become smarter with use.

### Required Memory Systems
- approved room templates
- approved finish packs
- accepted camera presets
- accepted lighting moods
- accepted module layouts
- rejected designs and reasons
- studio best-sellers by budget/style/room

### Required Enhancements
- recommend reuse based on project similarity
- enable “start from best prior match” flow
- build studio intelligence over time

---

## 6. Feature Superset Matrix

| Category | Minimum Competitor Pattern | Required Superset |
|---|---|---|
| Floor Plan → 3D | editable shell | editable shell + confidence review + rule engine + scene graph |
| Renders | fast images | fast preview + revision-safe premium render pipeline |
| Walkthroughs | generic 360 | scene-linked walkthroughs + room comments + approvals |
| Plans | simple 2D plan | dimensioned design-aware plan + room metadata |
| Elevations | limited or separate | auto-generated wall-by-wall elevations from scene |
| Catalog | large visual library | curated visual + modular + production-aware catalog |
| Budget | visual estimate | module-linked cost engine + room-wise pricing + revisions |
| Proposal | presentation doc | proposal from exact approved model + room content |
| Scan Capture | room measurement | as-built wall/photo/constraint-linked capture |
| Production | weak or absent | BOM + cutlist + workshop outputs from approved modules |
| Reuse | manual inspiration reuse | structured design memory + rule-aware reuse |
| AI | styling or detection | explainable AI + confidence + hybrid review + memory |

---

## 7. Foolproof Product Rules

To prevent building a shallow clone, the following must be enforced:

### Rule 1
No feature may be added as a disconnected page if it does not read from and write to the canonical project model.

### Rule 2
No render may be considered approved unless it is tied to a scene revision.

### Rule 3
No budget summary may exist without traceability to modules/materials/quantities.

### Rule 4
No production export may be created from a draft or unapproved model unless explicitly marked “working draft.”

### Rule 5
No AI-generated result may bypass user review when confidence is below threshold.

### Rule 6
No asset library item that impacts production may be “visual only.”
It must carry real metadata.

---

## 8. Final Competitive Positioning

The final app should feel like:

- as easy to start as the best browser-based design tools
- as persuasive in sales as fast render tools
- as clear in plans as drawing-first tools
- as polished in proposals as presentation-first tools
- as useful in field capture as scan tools
- and more production-aware than almost all of them

## 9. One-Line Differentiator

> The app must be the only interior design platform in its category that turns floor plans and site data into an editable, rule-aware, Indian modular design model that powers renders, wall elevations, proposals, budgets, and production outputs from one connected source of truth.
