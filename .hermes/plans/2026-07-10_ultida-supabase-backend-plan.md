# ULTIDA — Supabase / Hosted Postgres Backend Plan

> **Status:** PLAN ONLY. No code edits. Requires user decisions + a real Supabase
> project (URL + anon key + service role key) before Task 1 can start.

## Why this exists
User asked to "scan the new plan to implement supabase." No Supabase plan exists in
the repo yet. The backend already has a *partial* Postgres scaffold
(`server/database/db-client.js`) but it is NOT wired to the app: the app uses the
synchronous `db.prepare()` API in **279 call sites** (index.js=184, cutlist=19,
visualizer=15, database.js=12, + 80 more). In `db-client.js` postgres mode, every
`.prepare()` call throws "Synchronous database query is not supported." So the
scaffold is a stub — flipping `DATABASE_PROVIDER=postgres` today breaks the server
on the first query.

## Reality check (verified)
- `db-client.js`: has `query/queryOne/execute` (async, Postgres-safe) + `prepare` (sync, sqlite-only). Postgres branch is real but unused.
- `pg` is NOT installed (`await import('pg')` will fail → pool null → every async call throws "pool not initialized").
- App code uses sync `db.prepare(sql).get/all/run(...)` almost everywhere → must be migrated to `await db.query/queryOne/execute`.
- SQLite schema lives in `database.js` (`CREATE TABLE IF NOT EXISTS ...`) + many inline `CREATE TABLE` in `index.js`. No `.sql` migration file exists for Postgres.
- No auth layer (Supabase Auth), no Storage bucket wiring, no multi-tenant `org_id`/`user_id` columns. Currently single-user local tool.
- Tests run against SQLite (`storage/ultimate_interior.db` WAL).

## DECISIONS NEEDED FROM USER (block Task 1)
1. **Do you actually want Supabase, or just "hosted Postgres so it can deploy"?**
   Supabase = Postgres + Auth + Storage + Realtime in one. If you only need a durable
   cloud DB, a plain Postgres URL (Neon/Supabase/RDS) works and skips Auth.
2. **Do you have a Supabase project?** Need: `DATABASE_URL` (postgres://...),
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Without these,
   Task 1 cannot be executed — only written.
3. **Multi-tenancy scope:** is this a single-firm tool you host (one DB, one login)
   or a real multi-client SaaS (per-firm isolation, signup, billing)? This decides
   whether we add `org_id` everywhere + Supabase Auth now or defer.
4. **Storage:** renders/DXF/PDF currently live on local disk (`storage/`). Supabase
   means moving blobs to a Storage bucket and serving via signed URLs. Confirm.

## PROPOSED APPROACH (migrate, don't rewrite)
Goal: make `DATABASE_PROVIDER=postgres` actually work, with zero behavior change on
SQLite, so the app can be hosted. Keep SQLite as the local/dev default forever.

### Phase 0 — Prereqs (user provides keys)
- Create Supabase project; paste keys into `.env` (DATABASE_URL, SUPABASE_*).
- `npm install pg` (add to package.json).
- Decision on multi-tenancy (D3) recorded.

### Phase 1 — Schema migration (Postgres DDL)
- Extract every `CREATE TABLE` from `database.js` + `index.js` into
  `server/database/migrations/0001_init.sql` (Postgres syntax: `SERIAL` PKs,
  `TEXT`, `REAL`, `TIMESTAMP DEFAULT now()`, `JSONB` for `*_json` columns).
- Add `org_id`/`user_id` columns IF multi-tenant (D3).
- `scripts/run-migration.mjs` applies it via `pg` (idempotent `CREATE TABLE IF NOT EXISTS`).
- Verify: tables exist in Supabase.

### Phase 2 — Async DB client hardening
- In `db-client.js`: install `pg`; make `query/queryOne/execute` the ONLY path in postgres mode.
- Keep `prepare` returning a real better-sqlite3 statement in sqlite mode (already does).
- Add `exec` sync-vs-async already handled.

### Phase 3 — Migrate 279 sync call sites → async (THE WORK)
- Pattern: `db.prepare(sql).get(a,b)` → `await db.queryOne(sql,[a,b])`
            `db.prepare(sql).all(a)`  → `await db.query(sql,[a])`
            `db.prepare(sql).run(a,b)`→ `await db.execute(sql,[a,b])`
- This touches `index.js` (184) + 20 services. Must convert each route handler to `async`
  and `await` the DB calls. High blast radius → do behind feature flag `DATA_MODE`.
- Add a lint/assert: in postgres mode, `prepare()` throws (already does) → catches misses in CI.
- Tests: add a postgres test mode (`DATABASE_PROVIDER=postgres DATABASE_URL=... node --test`)
  running against a throwaway Supabase branch DB.

### Phase 4 — Storage + Auth (if D1/D4 = Supabase)
- `server/storage/` files → Supabase Storage bucket; `uploadFile`/`getSignedUrl` wrappers.
- `POST /api/auth/*` → Supabase Auth (session cookies / JWT verify middleware).
- `org_id` injected from session into every query (RLS or app-level filter).

### Phase 5 — Deploy readiness
- `npm run build` + `node server/index.js` on a host; `DATABASE_PROVIDER=postgres`.
- Smoke: every `/api/*` 200 against Supabase; DXF/PDF still generate; 114/114 tests on SQLite.

## What is ALREADY working (do NOT touch)
- SQLite local app, DXF/PDF, renders, BYOK, 114/114 tests.
- The async `db-client` API signature (reuse it).
- `convertPlaceholders` ? → $n (reuse it).

## Risks
- 279-call migration is the dominant cost; errors surface only at runtime per-route.
- Local dev stays SQLite; postgres path is untested until keys + migration land.
- If multi-tenant, RLS vs app-level filtering is a security decision (use RLS).
- Supabase free tier row limits / egress — fine for a single firm.

## Recommended trigger
Do NOT start until D1–D4 answered AND Supabase keys present. Otherwise this plan is
speculation. Until then, keep shipping on SQLite (the local tool is the sellable MVP).
