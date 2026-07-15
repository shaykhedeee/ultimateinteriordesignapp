# ULTIDA — Gap Analysis & Roadmap to the "Achieved Flow"

> Goal: reach Agent B Studio's achieved flow (intake → 2D → stage → render → product/BOM → client/commerce → workspace) on ULTIDA's GEOMETRY-FIRST foundation, and beat it where it's weak.
> Status legend: ✅ done · 🟡 partial · 🔴 missing.

## 0. Current Verified State (2026-07-15)
- ✅ Offline room detection FIXED: 1 → 8 rooms on C009; 22 typed furniture items (was 8 generic).
- ✅ Build green, 407 tests / 0 fail (after stale-test fix).
- ✅ AC1009 premium DXF, scene→Blender export script, elevations studio, cutlist, GST invoice, payment plan modules exist.
- 🔴 Cloud AI (Gemini/OpenAI) 429-quota-blocked → render polish + live enrichment offline.
- 🔴 Blender not installed locally (Three.js scene renders; Cycles base render deferred).

## 1. Capability Gap Matrix (vs Agent B function matrix)

### RENDERS
| Capability | State | Note |
|---|---|---|
| Layout to Render | 🟡 | geometry→scene works; polish blocked by quota |
| Space Render | 🟡 | Three.js scene render exists |
| Studio Render | 🔴 | need lighting/env preset |
| Cinematic Render | 🔴 | post/FX preset |
| Smart Fill Render | 🔴 | inpaint-style fill (needs AI or matte-pass) |
| Render Angles | 🟡 | camera presets exist, not surfaced |
| Video generation | 🔴 | sequence frames → mp4 (ffmpeg) |

### LAYOUT & SPACE PLANNING
| Capability | State | Note |
|---|---|---|
| Layout Builder (2D) | ✅ | InteractiveCADScreen, traced walls |
| Layout Top View gen | ✅ | plan JSON → top view |
| Smart Staging | ✅ | auto furniture from rooms (FIXED) |
| Layout gen from render | 🔴 | reverse: render→plan (low priority) |
| RCP generation | 🟡 | measurePlan; expose as named tool |
| Elevation generation | ✅ | DrawingsElevationsStudio |

### PRODUCT & BOM
| Capability | State | Note |
|---|---|---|
| Product Creator | 🟡 | material_slot + laminate swap; needs catalog object creator |
| Product Customization + Angles | 🟡 | material_slot present |
| Product Drawings | 🔴 | dimensioned product sheet from 3D |
| BOM Calculator | ✅ | cutlist-engine + BOQ |

### AI TOOLS & EDITING
| Capability | State | Note |
|---|---|---|
| Moodboard Creator | 🟡 | exists, under-wired |
| Photo Edit | 🔴 | needs inpaint/adjust |
| AI Director – Inpaint | 🔴 | depends on cloud AI |
| Lighting Change | 🟡 | Three.js light rig swap |
| Detection / Object ID | ✅ | furniture detection (FIXED) |
| AI Tool (Std/Pro) | 🟡 | route exists, quota-blocked |

### CLIENT & COMMERCE
| Capability | State | Note |
|---|---|---|
| Brand catalog access | 🟡 | catalog exists, staging weak |
| Request quotations | ✅ | quotation endpoint |
| Client presentations | 🔴 | need presentation/export view |
| Download quotations | ✅ | PDF/JSON |
| Create project profiles | ✅ | projects |
| Automated PI generation | 🔴 | brand-side PI (reuse quotation+GST) |

### WORKSPACE & TEAM
| Capability | State | Note |
|---|---|---|
| Seats / Multi-seat | 🟡 | workspace exists |
| Role-based access | 🔴 | RBAC |
| Per-member render visibility | 🔴 | |
| Consolidated billing | 🔴 | |
| Custom branding | 🔴 | |

## 2. Prioritized Roadmap (achieve the flow, win on truth)

### Phase A — Close the Agent B moat ON GEOMETRY (weeks 1–2)
**A1. Catalog → Stage → Quotation loop (HIGH).**
- Surface product catalog in the 3D/scene stage view; place catalog items into rooms (reuse smart-staging + material_slot).
- On "Generate Quotation", aggregate placed items + BOQ + GST → PDF/PI (reuse existing quotation + invoice modules).
- Verify live on proj_1. *This is the single feature that makes ULTIDA "sellable to firms" like Agent B.*

**A2. Expose RCP + Elevation + BOM as named, prominent tools (MED).**
- Add top-level nav entries "RCP", "Elevation", "BOM" that call existing engines. Match Agent B's matrix names so side-by-side favors ULTIDA on accuracy.

**A3. Render Studio surface (HIGH, perception).**
- One screen: choose Space/Studio/Cinematic + angle presets + "Export". Backed by Three.js now; Blender Cycles when available. Never blocks on 429 — falls back to deterministic scene render.

### Phase B — Depth & polish (weeks 3–4)
**B1. Material/finish live swap in render** (reuse material_slot + laminate_swap_history) → matches "Real-time Customization".
**B2. Lighting Change + Render Angles presets** (Three.js rigs).
**B3. Video generation** from render frames via ffmpeg (low-cost, high-perceived-value).
**B4. Client presentation export** (bundle plan + elevations + render + quotation into one shareable view/PDF).

### Phase C — Commerce & workspace (weeks 5–6, B2B route)
**C1. Brand storefront / catalog manager** (multi-tenant-lite): brands upload products, designers stage them.
**C2. INR pricing page + seat tiers** mirroring Agent B bands.
**C3. RBAC + consolidated billing + custom branding** (lightweight, from existing workspace).

### Phase D — Resilience
**D1. Cloud-AI graceful degradation** everywhere (already have starter-layout fallback; extend to render polish + enrichment). 429 must NEVER hard-fail a user action.
**D2. Optional Blender host** (render on a Blender machine; script already exported).

## 3. What NOT to build (per competitive analysis)
- 20 stub tools. Ship ~12 REAL ones.
- Villa/Restoration/Mixed-Use vertical demos.
- Chase "0.5s latency" marketing number.

## 4. Definition of Done (the "achieved flow")
A user can: upload/trace a plan → get accurate rooms + furniture → swap materials live → render Space/Studio/Cinematic at chosen angles → auto-generate RCP + Elevation + BOM → stage brand catalog items → export a client-ready presentation + GST quotation/PI — all on real, contractor-safe geometry, INR-priced, working even when cloud AI quota is dead.
