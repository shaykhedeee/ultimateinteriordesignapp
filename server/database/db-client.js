import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../storage');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ultimate_interior.db');
const sqliteDb = new Database(dbPath);
sqliteDb.pragma('journal_mode = WAL');

const provider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();
let pgPool = null;

if (provider === 'postgres') {
  console.log('[db-client] PostgreSQL database provider selected. Loading pool...');
  // Lazy-load pg to avoid breaking environments where pg is not installed yet
  try {
    const pg = await import('pg');
    pgPool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
  } catch (err) {
    console.error('[db-client] Failed to load pg module. Please run: npm install pg');
    console.error(err.message);
  }
}

/**
 * Utility to convert SQLite parameterized query placeholder '?' to PostgreSQL '$1', '$2', etc.
 */
function convertPlaceholders(sql) {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

/**
 * Database client wrapper that mimics better-sqlite3 API for legacy compatibility,
 * while offering promise-based operations for unified cloud execution.
 */
class DbClient {
  constructor() {
    this.provider = provider;
    this.sqlite = sqliteDb;
    this.pg = pgPool;
  }

  // --- Promise-based Unified API (Recommended for new SaaS/Cloud features) ---

  async query(sql, params = []) {
    if (this.provider === 'postgres') {
      if (!this.pg) throw new Error('[db-client] PostgreSQL pool not initialized.');
      const pgSql = convertPlaceholders(sql);
      const res = await this.pg.query(pgSql, params);
      return res.rows;
    } else {
      return this.sqlite.prepare(sql).all(...params);
    }
  }

  async queryOne(sql, params = []) {
    if (this.provider === 'postgres') {
      if (!this.pg) throw new Error('[db-client] PostgreSQL pool not initialized.');
      const pgSql = convertPlaceholders(sql);
      const res = await this.pg.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      return this.sqlite.prepare(sql).get(...params);
    }
  }

  async execute(sql, params = []) {
    if (this.provider === 'postgres') {
      if (!this.pg) throw new Error('[db-client] PostgreSQL pool not initialized.');
      const pgSql = convertPlaceholders(sql);
      const res = await this.pg.query(pgSql, params);
      return { changes: res.rowCount, lastInsertRowid: null };
    } else {
      const info = this.sqlite.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }

  // --- Legacy Synchronous better-sqlite3 Mocking ---

  prepare(sql) {
    // Return standard better-sqlite3 statement when running locally
    if (this.provider === 'sqlite' || !this.pg) {
      return this.sqlite.prepare(sql);
    }

    // In Postgres mode, we provide a warning/fallback wrapper.
    // NOTE: Synchronous executions will throw in postgres mode. Endpoints must be migrated to async query/execute.
    return {
      get: (...args) => {
        console.warn(`[db-client] Sync get() called on Postgres: "${sql}". Use queryOne() instead.`);
        throw new Error('Synchronous database query is not supported in Postgres cloud mode.');
      },
      all: (...args) => {
        console.warn(`[db-client] Sync all() called on Postgres: "${sql}". Use query() instead.`);
        throw new Error('Synchronous database query is not supported in Postgres cloud mode.');
      },
      run: (...args) => {
        console.warn(`[db-client] Sync run() called on Postgres: "${sql}". Use execute() instead.`);
        throw new Error('Synchronous database execute is not supported in Postgres cloud mode.');
      }
    };
  }

  exec(sql) {
    if (this.provider === 'postgres') {
      if (!this.pg) throw new Error('[db-client] PostgreSQL pool not initialized.');
      // Execute asynchronously on the pool
      this.pg.query(sql).catch(err => console.error('[db-client] async exec failed:', err.message));
      return this;
    } else {
      this.sqlite.exec(sql);
      return this;
    }
  }
}

const dbClient = new DbClient();
export default dbClient;
