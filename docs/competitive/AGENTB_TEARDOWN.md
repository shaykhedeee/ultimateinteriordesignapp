# Agent B Studio — Deep Teardown (live scan 2026-07-15)

> Source of truth: https://agentb.studio (home, /designer → redirects to /login, /brand, /real-estate, /pricing).
> Everything below was read live from the rendered site. Where a page is auth-gated (/designer app), the public marketing copy + pricing feature matrix is used as the function-level proxy.

## 1. Positioning & One-Liner
- "AI-Powered Space & Product Visualization" — a **unified environment for elite designers and global brands** that visualizes **both spaces and products in a single tool**.
- Three buyer verticals (top nav): **Designer**, **Brand**, **Real Estate** + a **Catalog** + **Pricing**.
- Tagline flow: *idea → client-ready render*.

## 2. Information Architecture (IA)
```
agentb.studio/
├── /                Home: hero + 4 solutions + 5 core workflows + AI Studio (20 tools)
├── /designer        SOLUTION (auth-gated app behind /login)
├── /brand           SOLUTION (enterprise furniture/decor brands)
├── /real-estate     SOLUTION (developers / property marketers)
├── /pricing         Plans + FULL FEATURE COMPARISON table (function-level goldmine)
└── /login,/signup   App entry (gated)
```
Note: `/designer` deep-links to `/login` — the actual product UI is behind auth. The marketing site + pricing table are the most reliable public signal of capability depth.

## 3. The 3 Solution Verticals (narrative flows)

### 3.1 Designer (target: design studios & freelance creatives)
- Inferred from pricing "Designers" toggle + core workflows.
- Full render suite, 2D layout builder, RCP + elevation generation, moodboard, photo edit, BOM, client presentations.

### 3.2 Brand (target: furniture & material manufacturers)
Published 4-step flows:
- **Product Customization Flow**: 01 Build Digital Library → 02 Real-time Customization (swap finishes/fabrics/materials) → 03 Bespoke Creation (by exact spec + dimensional constraints) → 04 Sell Globally (reach architects/designers).
- **Space Visualization Flow**: 01 Upload Client Layouts (floor plan/CAD → digital twin) → 02 Create Moodboards (branded catalog only) → 03 Generate Real-time Renders → 04 Automated PI Generation (branded Proforma Invoice with all products, ready for approval).
- Storefront + catalog management, custom price calculator, invoice customization, quotation requests.

### 3.3 Real Estate (target: developers & property marketers)
Published 4-step "Blueprint to Buyer":
- 01 Upload Unit Layouts (2D plan/CAD → interactive 3D digital twin) → 02 Customize Finishes (real-time material swaps, sun paths) → 03 Generate Photorealistic Renders (seconds, global illumination) → 04 Present & Close Sales (interactive presentations, instant proposals).
- Differentiators claimed: **0.5s render latency**, **BIM-ready integration**, **AI Material Synthesis** (prompt-to-texture), object-level control (select any furniture/finish in a render → swap from catalog or generate new material via prompt), custom dashboards (portfolio/status/progress monitoring).

## 4. The 5 Core Workflows (top of funnel)
| Workflow | Promise |
|---|---|
| **Quick Generate** | Turn moodboards & layouts into renders |
| **Smart Project** | End-to-end layout → render with styling |
| **Design Product** | Create & customize new products |
| **Quick Layout** | Draw & generate floor plans |
| (catalog implied) | Browse curated products & materials |

## 5. AI Studio — the 20 "purpose-built tools"
Confirmed tool names (from home + pricing matrix). Grouped by category the site uses:

**VISUALIZATION**
- Photo Edit (edit renders & room photos instantly)
- Moodboard (curate textures & inspiration)
- Facade Rendering (building viz with material palette)
- Under Construction Villa (structural → finished luxury render)
- Buildings Restoration (dilapidated → restored viz)
- Mixed-Use District (master plan → urban render)

**CONVERSION**
- Sketch to 3D Model (hand-drawn → photorealistic)
- Real Life to 3D Model (photo → physical model style)

**SPACE / STRUCTURAL (from pricing matrix)**
- Layout Builder (2D)
- Layout Top View generation
- Smart Staging
- Layout generation from render
- RCP generation  ← electrical/ceiling plan
- Elevation generation

**PRODUCT / BOM**
- Product Creator
- Product Customization + Angles
- Product Drawings
- BOM Calculator

**AI TOOLS / EDITING**
- Moodboard Creator
- Photo Edit
- AI Director – Inpaint
- Lighting Change
- Detection / Object ID
- AI Tool (Standard) / AI Tool (Pro)

**CLIENT & COMMERCE**
- Brand catalog access
- Request quotations from brands
- Client presentations
- Download quotations
- Create project profiles
- Automated PI (Proforma Invoice) generation

(The "20 tools" headline; the naming above covers the visible set. Remainder are likely per-vertical variants of the above.)

## 6. Pricing (INR — same market as ULTIDA)
Designer plans (Monthly / Annual = save 25%):
| Plan | ₹/mo | Renders | Notes |
|---|---|---|---|
| Individual | 2,999 | 100/mo | getting started |
| **Designer Pro** | **6,999** | 250/mo | MOST POPULAR, active professionals |
| Unlimited Pro | 11,999 | Unlimited | power users |
| Business Pro | 26,999 | Unlimited · 5 seats | studios & teams |

Brand plans:
| Plan | ₹/mo | Seats | Max products |
|---|---|---|---|
| Brand Starter | 19,999 | 3 designers · 2 catalog mgr | 500 |
| **Brand Pro** | **29,999** | 5 designers · 3 catalog mgr | 1,500 |

Key pricing signals: **credit/metered renders** (100/250 tiers), **seat-based** for teams, **annual discount 25%**, **video generation metered** (5/10 per mo), enterprise = "talk to us".

## 7. Function-Level Feature Matrix (from FULL FEATURE COMPARISON)
Categories Agent B exposes (this is the real competitive spec sheet):
1. **RENDERS** — Layout to Render, Space Renders, Studio Render, Cinematic Render, Smart Fill Render, Render Angles, Video generation.
2. **LAYOUT & SPACE PLANNING** — Layout Builder (2D), Layout Top View gen, Smart Staging, Layout gen from render, **RCP gen**, **Elevation gen**.
3. **PRODUCT & BOM** — Product Creator, Product Customization + Angles, Product Drawings, **BOM Calculator**.
4. **AI TOOLS & EDITING** — Moodboard Creator, Photo Edit, AI Director–Inpaint, Lighting Change, Detection/Object ID, AI Tool (Std/Pro).
5. **CLIENT & COMMERCE** — Brand catalog access, Request quotations, Client presentations, Download quotations, Create project profiles.
6. **WORKSPACE & TEAM** — Seats, Multi-seat workspace, Role-based access, Per-member render visibility, Consolidated billing, Custom workspace branding.
7. **SUPPORT** — Email / Priority / Dedicated.

Brand-side extras: Brand & vendor storefront, Product/material library, Catalogue upload, Custom price calculator, Invoice customization, Customised quotations, Photo Studio, RCP+Elevation gen, Product Drawings+BOM, Video gen (5/15 per mo/user).

## 8. The "Achieved Flow" (the thing to replicate)
```
[intake: floor plan / CAD / sketch / room photo / moodboard]
   ↓
[2D Layout Builder + Quick Layout → traced walls, rooms, RCP, Elevation]
   ↓
[Smart Staging / auto furniture + material assignment (catalog-backed)]
   ↓
[Render engine: Space / Studio / Cinematic / Smart Fill, multiple angles, video]
   ↓
[Product & BOM: Product Creator, Product Drawings, BOM Calculator]
   ↓
[Client & Commerce: moodboard, client presentation, quotation / PI export]
   ↓
[Workspace: seats, roles, branding, consolidated billing]
```
Agent B's moat is the **catalog ↔ render ↔ quotation loop** (especially Brand/Real-Estate: upload layout → stage with YOUR products → render → auto PI/quotation). That closed loop is what makes it sellable to firms, not just a render toy.

## 9. What is NOT visible / assumed
- Actual render engine internals (they claim "proprietary cloud-compute", "global illumination", "0.5s latency") — unverified, likely a hosted diffusion/NeRF pipeline.
- Whether geometry is truly editable (CAD-grade) or diffusion-only. The presence of "Layout Builder (2D)", "RCP", "Elevation", "BOM" suggests a real geometry layer, but depth unknown without app access.
- Auth-gated Designer app UI not inspected (login wall).
