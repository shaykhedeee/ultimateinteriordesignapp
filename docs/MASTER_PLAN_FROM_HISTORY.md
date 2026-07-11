# ULTIDA Master Plan — Consolidated From All Chat Prompts

> **Source:** Every verbatim user prompt extracted from the ULTIDA session history
> (session `20260707_210513_fc7f2d` "Code review and implementation plan", 187 msgs).
> The `20260702` session is a *different product* (Whole Lot of Nature e-commerce) and is excluded.
> **Status:** This plan was NOT previously consolidated — produced now per the request
> "scan my entire history of chat and take all my prompts and work on them and make a plan out of them."

---

## 1. Every Prompt, Grouped by Theme

### A. "Make it sellable / production-grade" (the overriding directive)
- *"Treat ULTIDA as a commercial product to sell to interior design firms… enhance all features to outperform competitors (especially Agent B Studio Bella-class), fix all broken tools, deep scan repo for gaps, make the app fully functional, maximize time savings for designers."*
- *"scan fully and read the history fully and enhance my app. MAKE IT WORK VERY WELL, DO EVERYTHING NEEDED TO MAKE THE APP IN SELLING CONDITION."*
- *"ENHANCE THE APP FULLY"*
- *"ENAHCNE THE APP, MAKE IT BETTER"*
- *"keep enhancing my app to the fullest, go beyond your capabilities and learn everything you can you need for this app and interior designer app thing"*

### B. "Scan the repo deeply, fix everything, keep going"
- *"Please review this for bugs, regressions, and missing tests. Please make a concise implementation plan before changing code. SCAN DEEPLY AND PLAN WHAT TO DO NEXT"*
- *"SCan through the repo and understand deeply how to enhance my app and keep working till you find a solid way of fixing everything needed"*
- *"ENHANCE MY DESIGN TOOLS FEATURES AND ANALYSRS TO THE FULLEST, THEY NEED TO BE THE BEST IN THE MARKET. DEEPSCAN THE REPO AND FIND OUT THE ULTIMATE PLAN TO REACH THE FINAL VERSION OF ULTIDA. ENHANCE EVERYTHING NEEDED. FIX ALL BROKEN TOOLS"*
- *"use all your skills to understand where the app is at and finish it fully keep working till you find the best possible app for interior design"*
- *"UPDATE THE PLAN AND KEEP ADDING TASKS AS YOU FIND ANY FIXES OR CHANCE OF ENHANCEMENT — KEEP DOING TASKS"*

### C. "UI / UX must be premium, luxurious, consistent"
- *"GO THROUGH THE ENTIRE DESIGN AND UI AND UX OF THE ENTIRE APP, USE CHADSN OR SOME ULTIMATE DESIGN LIGHTWEIGHT TOOL TO ENHANCE THE DESIGN AND UI UX, PLEASE ADD PROPER SPACING, HARMONIZE THE DESIGN, MAKE IT LUXURIOUS, ADD LOADING SCREENS ONLY WHERE NECESSARY, MAKE IT ENHANCED, MAKE ALL THE FEATURES WORK FOR THE APP"*
- *"AURA SHOULD BE THE ULTIMATE BOT FOR ANYTHING RELATED TO INTERIOR DESIGNERS, ENHANCE THE DESIGN THE FEEL THE SUBTLE ANIMATION, THE INTERIOR DESIGNER RELIEF FEELING FROM THE APP, IT SHOULD BE WELL DESIGNED"*
- *"continue fixing the app and enhancing the ui ux. please add premium spacing and stuff"*
- *"ENhance the design and ui ux"*
- *"RESEARCH DEEPLY WHAT IS THE BEST WAY TO KEEP THIS WHITE LABEL APP THE BEST POSSIBLE ONE IN THE MARKET, RESEARCH WHAT KIND OF SETTINGS THEY HAVE, HOW TO ACHIEVE ULTRA CLEAN UI AND EVERYTHING A PREMIUM WHITE LABEL APP NEEDS, KEEP CONTINUING WITH THE PHASES"*

### D. "AURA = the ultimate interior-design co-pilot"
- *"AURA SHOULD BE THE ULTIMATE BOT FOR ANYTHING RELATED TO INTERIOR DESIGNERS"*
- *"use all your skills… finish it fully"* (overarching, includes AURA)
- (Implied) AURA must work with **zero config** — the white-label/offline selling point.

### E. "Read the latest MD docs and turn them into a working plan"
- *"REAd the latest md files and enhance the plans and make my app function alike that please"*
- *"SCAN THROUGH THE LATEST MD FILES AND UNDERSTAND WHAT I WANT TO ENHANCE IN THE APP AND MAKE IT FUNCTIONS"*
- *"read all the latest md files and please make them into a plan and keep executing"* (from attached roadmap docs: future_roadmap_and_next_steps.md, implementation_plan.md, task.md, walkthrough.md)
- *"do the next best steps"*

### F. "How do I run it?" (ops)
- *"Hand over a concise command list for server boot and npm test that any terminal can run"*
- *"copies share the same proved suite. Hand over a concise command list… Continue with backend frontend fixes, scene route fixes, or more business-logic implementation next."*

### G. "What's the best way to proceed?" (strategy)
- *"whats the bes twa y to proceed"*

---

## 2. What Is DONE (verified, not claimed)

| Area | Status | Proof |
|---|---|---|
| Build (vite) | ✅ clean | `npm run build` exits 0, ~10s, 150+ modules |
| Unit tests (node:test) | ✅ **136 pass** (118 original + 18 added this/last sessions) | ran `node --test tests/dimension-validator.test.js tests/aura-knowledge.test.js tests/smoke-runtime.mjs` → 18/18; earlier 118 |
| Smoke (live API) | ✅ 25/25 | `scripts/smoke-test.mjs` |
| Journey (live) | ✅ 11/11 | `scripts/journey-test.mjs` |
| Crash probe (white-screen guard) | ✅ 0 HTML-500 across 139 routes | `scripts/probe-html-500.mjs` |
| Backend routes | ✅ 143 routes live on :8787 | `/api/projects` 200, `/api/diagnostics/api-health` 200 |
| BYOK + Whitelabel UI/backend | ✅ wired + resolver bridge fixed | `SettingsWorkspace`, `/api/settings/api-keys` |
| **Dimension Validation Pipeline** (this session) | ✅ new `server/services/dimension-validator.js` + `GET /api/projects/:id/validate` | 9 unit tests pass |
| **Zero-config AURA knowledge brain** (this session) | ✅ `server/services/aura-knowledge.js` + wired into `aura-orchestrator.js` | 6 unit tests + 2 runtime tests pass |
| UI/UX gold unification + premium spacing | ✅ all 12 screens + App.jsx | commit `811c74c`, `56004d2` |
| Live Dashboard screen | ✅ real KPIs, honest AI-provider health | commit `30fffd6` |
| Full drawing-set route (hidden feature exposed) | ✅ `GET /api/projects/:id/drawings` | commit `30fffd6` |
| DXF elevation writer (AutoCAD-valid) | ✅ enriched with layers/schedules | commit `43fbcc9` |
| Client PDF packs (brief/signoff/quotation) | ✅ `pdf-builder.js` + PresentationStudio | verified live |

---

## 3. What IS NOT DONE (open from the prompts)

| # | Open item (from which prompt) | Why it's still open | Blocker |
|---|---|---|---|
| 1 | **AURA real LLM brain** (prompts A, D) — runs in `offline-rule-engine` fallback | No API key configured in this sandbox | **Needs you:** drop OpenAI/OpenRouter/Gemini key in `.env`. BYOK bridge already routes it everywhere. |
| 2 | **3D material selector** (roadmap Horizon-2, prompt C implied) | Not built | Code — pure frontend + texture wiring |
| 3 | **Persisted overlay review** (roadmap Horizon-1) — draggable/renamable room nodes in CAD | Not built | Code — frontend InteractiveCADScreen |
| 4 | **Unified client presentation PDF pack** (roadmap Horizon-3) — single sheet set (title block + floor plan w/ Vastu + elevations + renders + BOQ) | Brief/signoff/quotation exist separately; unified "one-click client pack" not assembled | Code — `pdf-builder.js` orchestration |
| 5 | **White-label client portal** (roadmap Horizon-3) — white-labeled share link w/ 3D + materials + e-sign | Not built | Code + key |
| 6 | **Vendor-linked catalog metadata** (roadmap Horizon-2) — Hafele/Hettich/Merino/Greenlam | Not built | Data entry |
| 7 | **Photo → elevation accuracy** (prompt B "best in market") | Basic pipeline exists; accuracy unverified | Code + sample images |
| 8 | **Production cutlist/nesting exporter** (prompt B) | Engine exists; export-to-CAM not wired | Code |

---

## 4. Recommended Execution Order (the "best way to proceed")

The prompts all point the same direction: **finish to a sellable v1.0, then layer the revenue features.** Sequence:

**Phase 0 — Lock the foundation (DONE, keep green)**
- Keep the test gate green (unit + smoke + journey + crash probe).
- Keep AURA's zero-config knowledge fallback (so a demo never goes silent).

**Phase 1 — Close the 3 named roadmap items that are demoable THIS week**
1. **3D material selector** (Horizon-2) — directly answers "make all features work" + "best in market".
2. **Persisted overlay review** (Horizon-1) — the "AI-detected vs user-corrected wall" diff.
3. **Unified client presentation PDF pack** (Horizon-3) — the #1 close-the-sale artifact.

**Phase 2 — Revenue / white-label depth**
4. Vendor-linked catalog metadata.
5. White-label client portal with e-sign.

**Phase 3 — You provide the key, we flip AURA to real LLM**
6. Drop API key in `.env` → AURA becomes the "ultimate bot" (Tier-B). Everything else already routes through `resolveKey`.

---

## 5. One-Command Run Sheet (prompt F)

```bash
npm ci                                   # install deps (or: npm install)
node server/index.js > server.log 2>&1 & # boot API on :8787
sleep 3
curl -s -o /dev/null -w "api %{http_code}\n" http://127.0.0.1:8787/api/projects
npm test                                 # node --test (unit)
node scripts/smoke-test.mjs              # live API smoke
node scripts/journey-test.mjs            # live journey
node scripts/probe-html-500.mjs          # white-screen guard
```

---

## 6. Bottom Line for "what's the best way to proceed"
The app is already in **selling condition** on the engineering side (136 tests, 0 white-screen routes, real DXF/PDF/Render/Cutlist/CRM/AURA pipelines, premium UI). The remaining work is **feature completeness**, not bug-fixing. Build the 3 roadmap items in Phase 1 next — they are the difference between "impressive demo" and "signed contract." AURA becomes truly best-in-class the moment you add one API key.

**Next concrete action I will take if you say "go":** implement the **3D material selector** (wires catalog cards in `Render3DStudio.jsx` to live model textures) — it's the highest-leverage Horizon-2 item and is fully testable without a key.
