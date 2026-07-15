# Competitive Intelligence — Full Field (July 2026) + ULTIDA Position

> Source: user-pasted MeltFlexAI 14-tool comparison (July 2026) + Agent B live teardown (this repo, docs/competitive/AGENTB_TEARDOWN.md) + Decorilla/Havenly context. Web search was unavailable this session; the 14-tool table is taken verbatim from the user's paste (treated as provided data, not independently re-scraped).

## 1. The 14-tool landscape (verbatim from MeltFlexAI)
| Tool | From (2026) | Buy the furniture? | Best for |
|---|---|---|---|
| **MeltFlex** | Free | **Yes, built in** | Complete plan-to-purchase workflow |
| HomeDesigns AI | $27/mo | Yes (Furniture Finder) | Shoppable AI redesign |
| Spacely AI | $12.75/mo | No (AI-gen) | Best free tier, fast renders |
| REimagine Home | $14/mo | Partial (Real Products) | Staging w/ real product matching |
| Collov AI | $21/mo | Partial | Real-estate staging |
| RoomGPT | $9/30cr | No | Quick inspiration |
| Interior AI | $29/mo | No | Style variety + staging |
| Coohom | $25/mo | Catalog (real brands) | Full 3D room planning |
| Homestyler | Free | Catalog models | Largest free 3D library |
| Planner 5D | €4.99/mo | Catalog | DIY floor plans |
| Maket AI | $20/mo | N/A (layouts) | Generative floor plans |
| Foyr Neo | $29/mo | Catalog | Pro designers |
| Decorilla | $549/room | Yes (designer) | Full-service high-end |
| Havenly | $199/room | Yes (designer) | Affordable human designer |

**MeltFlex's winning axis (their words):** the ONLY tool that runs the whole job in one place — floor plan → 3D → photo redesign → real furniture placed at TRUE SCALE, so you plan and buy from one screen.

## 2. What this means for ULTIDA
MeltFlex is the real benchmark, not Agent B. Three takeaways:
1. **"Buy the furniture in your design" is the separating column.** ULTIDA already has this via the catalog + quotation loop (just built). We must make it FIRST-CLASS and visible (staging UI + one-click quotation).
2. **True scale matters.** MeltFlex places furniture at true scale. ULTIDA's scene graph IS true scale (mm) — our moat is stronger than MeltFlex's because ours is contractor-verifiable (DXF/BOM), not just visually scaled.
3. **Free tier / generous entry wins adoption.** Spacely's free tier, Homestyler's free 3D library. ULTIDA should expose a free/included tier (our offline analyzer already works without quota — that's a genuine free differentiator).

## 3. ULTIDA's defensible differentiation vs the whole field
| Capability | MeltFlex | Agent B | ULTIDA |
|---|---|---|---|
| Plan→3D→render→buy in one place | ✅ (visual scale) | ✅ (loop) | ✅ (loop) + **geometry-true** |
| Contractor-ready DXF/BOM | ❓ | ❓ | ✅ AC1009, dimension-accurate |
| GST-correct Indian quotation | ❌ | partial | ✅ CGST/SGST |
| Works when cloud AI quota dead | ❌ | ❌ | ✅ deterministic fallback |
| Vastu rules | ❌ | ❌ | ✅ |
| Real 3D (Blender/Cycles) | partial | unproven | ✅ scene export |

**Positioning:** *"MeltFlex plans and buys. ULTIDA plans, builds, and buys — with drawings a contractor will actually accept."*

## 4. Brand direction (from user's logo refs)
- **Trefoil ribbon render** (cyan→violet→indigo glossy knot): a strong candidate for the ULTIDA hero/loading visual — signals "interwoven spaces + materials." Keep as a 3D hero asset.
- **HS hexagon monogram** (dark moss green, black H+S block): a bold, esports-style wordmark direction. Could become the ULTIDA app icon / brand mark (replaces generic). Moss-green + black + gold already matches the app's `--gold` accent.
- **Navy S serif**: too generic; not recommended as primary mark.

**Action:** adopt the HS-hexagon as the ULTIDA logo concept; use the trefoil as the product hero render. (Design task, separate from code.)

## 5. Build priorities (next, ranked)
1. **Make the catalog→stage→quotation loop visible in-UI** (not just API). Add a "Stage & Quote" panel to Render3DStudio / a new Commerce screen linking /catalog, /scene/place, /scene/material-swap, /quotation/from-scene. (API done + verified; UI panel is the gap.)
2. **Free/offline tier messaging** on the Pricing page (already built) — call out "works without cloud quota."
3. **True-scale staging preview** in 3D (furniture from catalog placed at real mm in the Three.js walkthrough).
4. **Client Presentation export** (subagent failed earlier — build it: /presentation route bundling plan+elevations+render+quotation to PDF).
5. Brand mark: implement HS-hexagon logo + trefoil hero.
