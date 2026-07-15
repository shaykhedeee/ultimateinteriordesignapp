# Competitive Analysis — ULTIDA vs Agent B Studio vs the Field

> Date: 2026-07-15. Agent B Studio details are LIVE-scanned (see AGENTB_TEARDOWN.md). Competitor landscape is from established market knowledge (web search was unavailable this session — flagged, not guessed as live).
> Audience: ULTIDA founder (sellable SaaS for Indian interior firms, replace 6-tool stack with one subscription).

## 1. The Competitive Set

| Player | Type | Strength | Weakness | India fit |
|---|---|---|---|---|
| **Agent B Studio** | AI space+product viz, INR pricing | Unified space+product, RCP/Elevation/BOM, brand storefront+PI loop, INR ₹2,999–29,999 | Auth-gated app (not inspectable); render engine internals unknown; likely diffusion-only geometry | **High** — same market, same currency |
| **ULTIDA (us)** | Geometry-first interior OS, offline-CV + Blender/Three.js | Real CAD geometry (DXF AC1009), scene-graph source of truth, offline analyzer, deterministic rooms/furniture, elevations, BOM, quotation | Cloud AI quota-blocked (Gemini/OpenAI 429); Blender not installed locally; UI surface fragmented; discovery weak | **High** — built FOR Indian firms |
| **Interior AI / InteriorAI** | Diffusion render swap | Fast, cheap, huge user base | No real geometry, no BOM/quotation, toyish for pros | Medium |
| **Spacely AI** | AI interior renders + virtual staging | Staging + variations | No CAD/BOM loop | Medium |
| **Reimagine Home** | Free-ish render gen | Zero friction | No pro workflow | Low |
| **Homestyler** | Floor planner + 3D + render (Chinese, free tier) | Real 2D/3D planner, big catalog | Clunky, not India-tuned, weak commerce | Medium |
| **Foyr Neo** | Cloud 3D + render + catalog | Pro 3D, fast, catalog | Subscription-heavy, not India-priced | Medium |
| **Magicplan** | Field capture → floor plan → estimate | Mobile capture, contractor-grade | Not design/render focused | Medium |
| **Infurnia** | India-based cloud interior CAD | India catalog, BOQ, manufacturing | Weak AI renders | **High** (direct rival) |
| **Decoratly / Decor8** | Light render/redo | Cheap | No geometry/commerce | Low |

## 2. Where Agent B Wins (the bar to clear)
1. **Closed commerce loop**: layout → stage with brand products → render → auto Proforma Invoice / quotation. This is the "sellable to firms" killer feature.
2. **Three verticals from ONE engine**: Designer / Brand / Real Estate share the render+layout+BOM core.
3. **RCP + Elevation + BOM** exposed as first-class (not buried) — signals "professional", not "toy".
4. **INR pricing with seat tiers** — speaks directly to Indian studios.
5. **20 named tools** — perceived completeness ("everything in one tab").

## 3. Where ULTIDA Already Beats Agent B (real, defensible)
1. **Geometry is real, not diffusion.** ULTIDA's scene graph is the source of truth; DXF output is AC1009, dimension-accurate, AutoCAD-safe. Agent B's geometry depth is unproven (likely image-only). For Indian firms that submit to contractors/MCV, **dimensional correctness is non-negotiable** — ULTIDA owns this.
2. **Offline-CV analyzer works without cloud quota.** ULTIDA detects rooms/furniture from traced walls locally. (Cloud AI is an enhancement layer, not a dependency.)
3. **Deterministic furniture + Vastu zones + elevations + cutlist + GST invoice + payment plan** — ULTIDA already has the production document spine Agent B markets.
4. **Blender/Three.js scene export** — true 3D, not just a flat render. When Blender is installed, ULTIDA produces Cycles base renders; Agent B's "0.5s" is almost certainly a lighter diffusion pass.

## 4. Where ULTIDA Loses TODAY (gaps vs the achieved flow)
| Gap | Agent B has | ULTIDA state | Severity |
|---|---|---|---|
| Catalog ↔ render ↔ quotation loop | YES (auto PI) | Partial (quotation exists, catalog staging weak) | **High** |
| Real-time material/finish swap in render | YES | Partial (material_slot, not live inpaint) | High |
| Smart Staging / auto furniture from plan | YES | YES (just fixed: 8 rooms → 22 typed items) | Closed |
| RCP generation | YES (named) | Partial (measurePlan exists) | Med |
| Elevation generation | YES (named) | YES (DrawingsElevationsStudio) | OK |
| Video generation from render | YES (metered) | No | Med |
| Brand storefront + catalog mgmt | YES | No (single-tenant) | Med (B2B route) |
| Per-member seats/roles/billing | YES | Partial (workspace exists) | Med |
| Cloud render latency / "Photoreal in seconds" | YES (claimed) | Blocked by 429 quota | High (perception) |
| 20 named tools marketing surface | YES | Fragmented UI | Med (discovery) |

## 5. Strategic Positioning Recommendation
**Do NOT race Agent B on "more AI render toys."** Race them on the axis they are weakest and you are strongest: **geometry-truthful, contractor-ready, India-priced professional OS.**

Positioning line: *"Agent B makes pretty pictures. ULTIDA makes buildable drawings — with the pretty pictures included."*

Three pillars:
1. **Truthful geometry** (DXF/BOM/measurements that survive contact with a contractor) — Agent B cannot credibly claim this.
2. **One subscription replaces the 6-tool stack** (CAD + render + estimate + BOM + quotation + client presentation) — explicit in ULTIDA's existing modules.
3. **India-native**: INR, GST invoices, Vastu, laminate/material catalogs local firms actually use, offline-capable when cloud quota dies.

## 6. Immediate Competitive Moves (next 30 days)
1. **Wire the catalog→stage→quotation loop** end-to-end on proj_1 (proves the Agent B moat, on real geometry).
2. **Expose RCP + Elevation + BOM as named, prominent tools** (match their matrix, win on accuracy).
3. **Add a "Render Studio" surface** that unifies Space/Studio/Cinematic/Smart-Fill angles behind one UI (perception parity) — backed by Three.js now, Blender when available.
4. **INR pricing page + seat tiers** mirroring their bands (₹2,999 / 6,999 / 11,999 / 26,999) so side-by-side comparison favors ULTIDA on capability.
5. **Graceful cloud-AI fallback** so a 429 never blocks a render (already have starter-layout fallback; extend to render polish).

## 7. What to IGNORE (Agent B noise)
- "20 tools" headline padding — depth > count. ULTIDA should surface ~12 REAL working tools, not 20 stubs.
- "0.5s latency" claim — unverified; don't chase a marketing number with a fragile dependency. Deterministic + correct beats fast + wrong.
- Villa/Restoration/Mixed-Use vertical renders — nice demos, not core to Indian interior firms. Deprioritize.
