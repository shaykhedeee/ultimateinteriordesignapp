// server/database/run-migration.mjs
// Applies the Postgres schema in migrations/ against DATABASE_URL.
// Usage:  node server/database/run-migration.mjs
// Safe to re-run (every statement is CREATE TABLE/INDEX IF NOT EXISTS).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migrate] DATABASE_URL is not set. Add it to .env (Supabase/Postgres connection string).');
  process.exit(1);
}

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.sql'))
  .sort(); // 0001_init.sql, 0002_..., applied in order

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  console.error('[migrate] "pg" is not installed. Run: npm install pg');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`[migrate] applying ${file} ...`);
    await pool.query(sql);
    console.log(`[migrate]   ok: ${file}`);
  }
  console.log('[migrate] ALL MIGRATIONS APPLIED ✅');
} catch (e) {
  console.error('[migrate] FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
