# ULTIDA — Fix API-Key Linking + Stabilize Core (Plan)

> **For Hermes:** Plan only. No code edits yet. User must confirm before P0 execution.

**Goal:** Make API-key linking actually work end-to-end (BYOK UI + `.env` + main render pipeline), kill the silent "mock instead of real render" failure, and harden the few real risks found in the deep scan.

**Architecture reality-check (verified, not assumed):**
- Repo is ESM. Server boots on **PORT 8787** (`.env` PORT=8787), NOT 5055. Frontend hardcodes `http://127.0.0.1:5055/...` in many screens → mismatch. (Frontend was built against 5055.)
- `dotenv` v17.4.2 is installed and loads **46 keys** fine. Env infra works.
- Two parallel key systems exist:
  - `server/services/image-provider.js` → `resolveKey(provider)` reads BOTH `process.env.*` AND the `api_keys` DB table. ✅ Modern, correct.
  - `server/services/visualizer-engine.js` (≈2000-line main render pipeline) → reads `process.env.OPENAI_API_KEY` **directly** in ~12 places, never calls `resolveKey()`. ❌ This is the linking break.
- The BYOK UI (`SettingsWorkspace` in `CommandCenterScreen.jsx`) POSTs to `/api/settings/api-keys` → writes `api_keys` table. Works (verified 200). But `visualizer-engine` ignores that table.

---

## VERIFIED FINDINGS (evidence-backed)

### 🔴 P0 — Root cause: API key linking is broken
1. **`OPENAI_API_KEY` is EMPTY in `.env`** (only 1 of 46 keys empty). `LIVE_IMAGE_GEN=true` is set, but `visualizer-engine.js` gates ALL live gen on `isNativeOpenAiKey(process.env.OPENAI_API_KEY)`. With it empty → every photoreal render silently falls back to mock/placeholder. Diagnostics confirms: `OPENAI_API_KEY: "Missing", canGenerateImages: false`.
   - *Evidence:* `node` parse of `.env` → `EMPTY values (1): OPENAI_API_KEY`. Server runtime → `OPENAI_API_KEY present: false`. `/api/diagnostics/api-keys` → `"OPENAI_API_KEY":{"status":"Missing"...}`.
2. **`visualizer-engine.js` never reads the `api_keys` DB table.** Even if a user links a key via the BYOK UI, the main pipeline ignores it (only checks `process.env.OPENAI_API_KEY`). So "I linked my key but nothing changed" = real and expected with current code.
   - *Evidence:* `visualizer-engine.js` imports `isNativeOpenAiKey` + `generateInteriorAsset` from `image-provider.js` (line 7) but uses `isNativeOpenAiKey(process.env.OPENAI_API_KEY)` directly (lines 210,283,328,348,554,646,728,837,874,1755,1889). Zero `resolveKey()` calls.

### 🟠 P1 — Config / connectivity mismatches
3. **Frontend↔server port mismatch (5055 vs 8787).** `frontend/src` screens hardcode `http://127.0.0.1:5055/api/...`. Server listens on `8787`. Any screen not overridden by a config will fail to reach the API → could white-screen or show empty data. The 3 screens we fixed earlier (Command Center upload, Drawings) used 5055 and worked because the server was on 5055 then; now it's 8787.
   - *Evidence:* running server log → `running at http://127.0.0.1:8787`. `grep` of frontend → many `127.0.0.1:5055` literals.
4. **Stale garbage row in `api_keys` table:** `key_Ymlb6DoYwr`, provider `test-live`, `key_value` length = 1. Leftover test data; harmless but pollutes the UI list and could confuse the "test" route.
5. **`/api/pipeline/providers` and `/api/render/providers` → 404.** Either dead frontend calls or missing routes. Need to confirm if any screen calls them; if not, remove the dead calls; if yes, add the routes.

### 🟡 P2 — Hygiene / hardening
6. **No global security headers / CORS issues at a glance**, but the error handler (line 3113) exists and is last → good. The `api-keys` POST stores `key_value` in plaintext (`key_enc` and `key_value` both = raw). Not encrypted at rest. Acceptable for a local single-firm tool, but flag: the `key_enc` column is misleading (it's plaintext). Add a note or basic obfuscation if shipping to clients.
7. **`LIVE_IMAGE_GEN=true` with no OpenAI key**: when true, `image-provider.liveEnabled()` returns true via Freepik/HF (those work), so partial live gen works. But `visualizer-engine` dead-ends on the OpenAI check. Should fall through to the working providers instead of bailing to mock.

---

## PROPOSED APPROACH (fix the linking, don't rebuild)

The pragmatic fix is a **single bridge function**, not a rewrite:
- Make `visualizer-engine.js` resolve its key via `resolveKey('openai')` (which already checks env AND the `api_keys` DB table) instead of reading `process.env.OPENAI_API_KEY` directly.
- Add a fallback chain in `visualizer-engine`: if OpenAI key absent, use the next working provider (Freepik/HF/Imagine.Art) per `image-provider`'s already-working priority list — so live gen fires even without OpenAI.
- Set `OPENAI_API_KEY` properly in `.env` (or document that it's optional and the app uses Freepik/HF instead). The app is ALREADY `readyForRealImages: true` via Freepik/HF — so the "linking" fix is mostly about making `visualizer-engine` honor the same providers `image-provider` already uses.
- Unify the frontend port to one source of truth (env-driven base URL) so 5055/8787 drift can't recur.

---

## STEP-BY-STEP PLAN

### Task 1 — Bridge `visualizer-engine` to `resolveKey()` (THE fix)
**Files:** `server/services/visualizer-engine.js` (imports at line 7; ~12 call sites)
- Step 1: Add `resolveKey` to the import from `./image-provider.js`.
- Step 2: Replace each `isNativeOpenAiKey(process.env.OPENAI_API_KEY)` with a local helper `const openAiKey = () => resolveKey('openai'); const hasOpenAi = () => isNativeOpenAiKey(openAiKey());` and use `hasOpenAi()` / `openAiKey()`.
- Step 3: Where the code currently `return`s mock on "no native key", instead fall through to the next provider (Freepik/HF) using the existing `generationProviderPriority()` from `image-provider.js`.
- Test: `node` script hitting `/api/diagnostics/api-keys` shows `OPENAI_API_KEY` resolved from DB; a render call with `LIVE_IMAGE_GEN=true` returns a real (non-mock) asset URL.
- Verify: live render returns 200 + a real image URL, not a placeholder.

### Task 2 — Set/verify `.env` OpenAI key + document optional providers
**Files:** `.env` (one line), `.env.example` (comment)
- Step 1: If you have a real `sk-proj-...` OpenAI key, write it to `OPENAI_API_KEY=...` via the secure `.env` write (never commit). If not, leave empty and rely on Freepik/HF (already working).
- Step 2: Update `.env.example` comment: "OPENAI_API_KEY optional — app uses Freepik/HuggingFace/Imagine.Art for live gen when absent."
- Test: `node -e "import('dotenv')..."` → `OPENAI_API_KEY` len matches input.
- Verify: diagnostics `OPENAI_API_KEY.status` becomes `Active` (if key added) or stays `Missing` but `readyForRealImages` remains `true`.

### Task 3 — Unify frontend API base URL (kill 5055/8787 drift)
**Files:** `frontend/src` (all `127.0.0.1:5055` literals), add `frontend/src/config.js` exporting `API_BASE` from `import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787'`.
- Step 1: Create `config.js` with `export const API_BASE = ...`.
- Step 2: Replace `http://127.0.0.1:5055` literals across screens with `API_BASE`.
- Step 3: Add `VITE_API_URL` to `.env.example` (default 8787).
- Test: `vite build` succeeds; grep confirms 0 remaining `:5055` literals.
- Verify: app loads against the running 8787 server; a fetch in dev tools shows 200s.

### Task 4 — Clean stale `api_keys` row + harden test route
**Files:** `server/index.js` (lines 2913-2967), one-time DB cleanup
- Step 1: Delete the `test-live` garbage row.
- Step 2: In `POST /api-keys/test`, reject keys with length < 8 as `invalid_format` early (so garbage isn't "valid").
- Test: `curl` test route with `sk-test-123` → `invalid_format`; real Freepik key → `live_ok`.
- Verify: `GET /api/settings/api-keys` returns only real rows.

### Task 5 — Resolve the 404 provider routes
**Files:** `frontend/src` (find callers of `/api/pipeline/providers`, `/api/render/providers`), `server/index.js`
- Step 1: grep frontend for those paths. If no caller → remove dead code. If caller exists → add the route returning `image-provider`'s `providerPriority()`.
- Test: no 404s for any route the UI actually calls.

### Task 6 — Final gate
- Step 1: Restart server on 8787. Run `node --test tests/*.test.js` → 114/114.
- Step 2: Runtime probe: hit every `/api/*` route → 0 HTML-500s.
- Step 3: `vite build` clean.
- Step 4: Commit (`fix: API-key linking bridge + frontend port unification + BYOK hardening`).

---

## DECISIONS NEEDED FROM USER (block P0)
1. **Do you have a real OpenAI `sk-proj-...` key to add, or should the app run on Freepik/HuggingFace/Imagine.Art (already working, `readyForRealImages=true`)?** Either way the linking fix works — I just need to know whether to populate `.env` or leave OpenAI optional.
2. **Frontend port:** server is 8787. Should I (a) point frontend to 8787 (recommended, matches running server) or (b) change server `.env` PORT back to 5055 (matches current frontend literals)? I recommend (a) + a single `API_BASE` config so it never drifts again.

## WHAT IS ALREADY WORKING (don't touch)
- DXF + 2D PDF generation (ezdxf-valid, 78 files clean) ✅
- Floorplan upload (fixed) ✅
- BYOK UI + `/api/settings/api-keys` CRUD + `/test` route ✅
- Freepik / HuggingFace / Imagine.Art live image gen ✅ (`readyForRealImages: true`)
- 114/114 backend tests ✅
- Global JSON error handler (no HTML-500 white-screen) ✅
