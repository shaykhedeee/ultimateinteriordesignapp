import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'database', 'ultima.db');
const BACKUP_DIR = path.join(process.cwd(), 'server', 'database', 'backups');

function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function migrate() {
  ensureDirs();
  const statements = [
    `CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, run_at TEXT)`];
  const db = require('better-sqlite3')(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  const tx = db.transaction(() => {
    statements.forEach(sql => db.exec(sql));
    db.prepare('INSERT OR IGNORE INTO schema_migrations(name, run_at) VALUES (?, ?)').run('base_schema', new Date().toISOString());
  });
  tx();
}

export function backup() {
  ensureDirs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUP_DIR, `ultima-${stamp}.db`);
  if (!fs.existsSync(DB_PATH)) return { ok: false, error: 'Database file missing' };
  fs.copyFileSync(DB_PATH, target);
  return { ok: true, backupPath: target };
}

export function restore(backupPath) {
  if (!fs.existsSync(backupPath)) return { ok: false, error: 'Backup file missing' };
  fs.copyFileSync(backupPath, DB_PATH);
  migrate();
  return { ok: true, restoredFrom: backupPath };
}

if (process.argv.includes('--backup')) {
  console.log(JSON.stringify(backup(), null, 2));
} else if (process.argv.includes('--migrate')) {
  migrate();
  console.log(JSON.stringify({ ok: true, migrated: true }, null, 2));
} else if (process.argv.includes('--restore') && process.argv[2]) {
  console.log(JSON.stringify(restore(process.argv[2]), null, 2));
} else {
  console.log('Usage: node scripts/db-backup.mjs [--backup|--migrate|--restore <path>]');
}
