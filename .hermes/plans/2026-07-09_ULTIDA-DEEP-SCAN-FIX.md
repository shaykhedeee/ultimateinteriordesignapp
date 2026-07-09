# ULTIDA Deep-Scan Fix Plan — Make The Whole App Work

> **For Hermes:** Execute task-by-task. Gate every change: `node --test` (93→target), `vite build`, `node scripts/smoke-test.mjs` (25/25), `node scripts/journey-test.mjs` (11/11). Commit after each phase.

**Goal:** Eliminate every live 500 / white-screen in ULTIDA so the app is fully functional end-to-end.

**Architecture:** Two layers of fixes — (A) a global async error wrapper so NO route can ever return an HTML 500 (kills the white-screen class for all 14 HTML-500 routes at once), and (B) targeted bug fixes for the genuine logic/schema defects found by the live probe. Plus (C) frontend `safeParse` to guard the JSON.parse crash sites.

**Tech Stack:** Node/Express (ESM) + better-sqlite3 + React (Vite). Windows/git-bash: `taskkill /PID <pid> /F` to restart server.

---

## Scan findings (authoritative, clean server, real project id)
- **22 live 5xx**, of which **14 return an HTML error page** = unhandled throw = guaranteed client white-screen.
- HTML-500 routes: `POST /api/projects/x/cad`, `/materials`, `/jobs`, `/budget-profiles`, `/estimate-sets`, `/payment-plans`, `/invoices`, `/payments`, `/variation-orders`, `/purchase-orders`; `GET /api/projects/x/scenes`, `/scenes/current`; `POST /api/material-catalog`; `POST /api/settings/app-settings`.
- Real error classes: `RangeError: Too few parameter values` (scenes GET), `NOT NULL job_type` (jobs POST), `FOREIGN KEY` (budget/invoice/payment area + material_selections on bad id), `no column named studio_name` (app_settings schema mismatch).
- Frontend: 34 `JSON.parse(...)` sites, 7 fetch→map without guard. 3 are genuine crash risks (ClientBriefStudio:69, FinanceScreen:165, MaterialCatalogScreen:102 parse `data.x_json` without null guard).

---

### Task 1: Add global async error wrapper (P0 — kills white-screen class)
**Objective:** Ensure any thrown error in a route returns JSON `{success:false,error}`, never the Express HTML page.
**Files:** Modify `server/index.js`
**Step 1:** Near top (after imports), add:
```js
const wrapAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```
**Step 2:** At the very end of `server/index.js` (after all routes, before `app.listen`), add a global error handler:
```js
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('[route error]', req.method, req.originalUrl, '-', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal error' });
});
```
**Step 3:** Wrap the async routes that lack try/catch and currently throw raw: `GET /api/projects/:id/scenes` (1680), `/scenes/current` (1686), `POST /api/projects/:id/jobs` (2462), `POST .../budget-profiles` (~2515), `POST /api/settings/app-settings` (2904), `POST /api/material-catalog` (2241 post), `POST .../payment-plans`, `/invoices`, `/payments`, `/variation-orders`, `/purchase-orders`, `/estimate-sets`. Change `app.post('/api/...', async (req,res)=>{` → `app.post('/api/...', wrapAsync(async (req,res)=>{` and close with `}));` (add the extra `)`). Do ONLY the routes that are `async` and lack their own try/catch.
**Step 4:** Run `node --check server/index.js`.
**Step 5:** Commit.

### Task 2: Fix `GET /api/projects/:id/scenes` RangeError (P1)
**Objective:** Add the missing binding argument.
**Files:** Modify `server/index.js:1681`
**Step:** Change `.all()` → `.all(req.params.id)`. Same for any sibling query in that handler that omitted the arg.
**Step:** Re-probe `GET /api/projects/:id/scenes` → expect JSON 200 (or 404 if no scenes, not HTML 500).
**Step:** Commit.

### Task 3: Validate `POST /api/projects/:id/jobs` (P1)
**Objective:** Return 400 (not 500) when `jobType` missing; guard NOT NULL.
**Files:** Modify `server/index.js:2462`
**Step:** At top of handler add:
```js
if (!jobType) return res.status(400).json({ success:false, error:'jobType is required' });
```
**Step:** Re-probe `POST /api/projects/:id/jobs` with `{}` → expect 400 JSON, not HTML 500.
**Step:** Commit.

### Task 4: Migrate `app_settings` table to new schema (P1 — whitelabel)
**Objective:** Live DB has old `(id, value, updated_at)` schema; code expects columnar. Reconcile.
**Files:** Modify `server/database/database.js` (app_settings CREATE block ~663)
**Step 1:** Replace the `CREATE TABLE IF NOT EXISTS app_settings (...)` block with a create + migrate that copies old `value` JSON into the new columns if present:
```js
db.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY, studio_name TEXT, tagline TEXT, logo_text TEXT,
  accent_color TEXT DEFAULT '#C9A84C', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`).run();
// migrate: if old (id,value,updated_at) shape exists, pull studio_name/tagline out of value JSON
const cols = db.prepare("PRAGMA table_info(app_settings)").all().map(c=>c.name);
if (!cols.includes('studio_name')) {
  const old = db.prepare("SELECT id, value, updated_at FROM app_settings_legacy").get?.() || null;
  db.prepare("ALTER TABLE app_settings RENAME TO app_settings_legacy").run();
  db.prepare(`CREATE TABLE app_settings (id TEXT PRIMARY KEY, studio_name TEXT, tagline TEXT, logo_text TEXT, accent_color TEXT DEFAULT '#C9A84C', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).run();
  const legacy = db.prepare("SELECT id, value, updated_at FROM app_settings_legacy").all();
  const ins = db.prepare("INSERT OR REPLACE INTO app_settings (id, studio_name, tagline, logo_text, accent_color, updated_at) VALUES (?,?,?,?,?,?)");
  for (const row of legacy) {
    let v = {}; try { v = JSON.parse(row.value || '{}'); } catch {}
    ins.run(row.id, v.studio_name || v.studioName || 'ULTIDA', v.tagline || '', v.logo_text || v.logoText || 'U', v.accent_color || v.accentColor || '#C9A84C', row.updated_at || new Date().toISOString());
  }
  db.prepare("DROP TABLE app_settings_legacy").run();
}
```
**Step 2:** Restart server, re-probe `POST /api/settings/app-settings` with `{"studio_name":"Test"}` → expect 200 JSON.
**Step 3:** Commit.

### Task 5: Frontend `safeParse` guard (P2 — kills JSON.parse white-screens)
**Objective:** Add a `safeParse` helper and guard the 3 crash-risk sites.
**Files:** Add helper to `frontend/src/lib/safe.js` (new); modify `ClientBriefStudio.jsx:69`, `FinanceScreen.jsx:165`, `MaterialCatalogScreen.jsx:102`.
**Step 1:** Create `frontend/src/lib/safe.js`:
```js
export function safeParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}
```
**Step 2:** Replace `JSON.parse(data.client_brief_json)` → `safeParse(data?.client_brief_json, {})` in the 3 sites; import `safeParse`.
**Step 3:** `vite build` must pass.
**Step 4:** Commit.

### Task 6: Regression tests for the fixed routes
**Objective:** Lock in the fixes so they can't regress.
**Files:** Create `tests/api-crash-safety.test.js`
**Tests:**
- `GET /api/projects/:id/scenes` returns 200 (array) for a real project.
- `POST /api/projects/:id/jobs` with `{}` returns 400 (not 500/HTML).
- `POST /api/settings/app-settings` with `{"studio_name":"X"}` returns 200.
- A route that throws returns JSON (not HTML): hit an endpoint guaranteed to throw (e.g. `POST /api/projects/badid/scenes` no—) → assert response is JSON and `success:false`.
**Step:** `node --test tests/api-crash-safety.test.js` → all pass.
**Step:** Commit.

### Task 7: Full gate + live re-probe + commit
**Step 1:** `node --test tests/*.test.js` → all pass (was 93, +crash-safety).
**Step 2:** `vite build` → exit 0.
**Step 3:** `node scripts/smoke-test.mjs` → 25/25; `node scripts/journey-test.mjs` → 11/11.
**Step 4:** Re-run the live 127-route probe; assert **0 HTML-500s** (all 5xx either gone or clean JSON `success:false`).
**Step 5:** Commit final.

---

## Risks / Notes
- The 14 HTML-500 routes included several where my probe used bad id `x`; after `wrapAsync`, those return JSON 404/400/500 with `success:false` — acceptable (clean, no white-screen). The genuine logic bugs (scenes arg, jobs validation, app_settings migration) are fixed regardless.
- `budget-profiles`/invoice/payment FOREIGN KEY 500s on bad project id become clean JSON 404 after `wrapAsync` + the existing `if (!project)` checks (verify each has one; add if missing in Task 1 wrap only, deeper validation optional).
- AURA LLM stays BYOK (sandbox keys invalid) — not a code bug.
- Server restart on Windows: `PID=$(netstat -ano|grep :5055|grep LISTENING|awk '{print $NF}'|head -1); taskkill /PID $PID /F` then `exec node server/index.js`.
