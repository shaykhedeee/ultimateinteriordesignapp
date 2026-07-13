import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const require = createRequire(import.meta.url);

const storageDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'storage');
const dbPath = path.join(storageDir, 'ultimate_interior.db');

function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); }

// Build a full backup ZIP: the SQLite db (with -wal checkpoint) + all storage files.
// Uses adm-zip (already a dependency) to avoid archiver stream hangs on large trees.
export function buildBackup(destPath) {
  // Checkpoint WAL so the .db file is current.
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) {}
  const AdmZip = (require('adm-zip'));
  const zip = new AdmZip();

  // DB files (db + -wal + -shm if present)
  for (const suffix of ['', '-wal', '-shm']) {
    const p = dbPath + suffix;
    if (fs.existsSync(p)) zip.addLocalFile(p, 'database', 'ultimate_interior.db' + suffix);
  }

  // Storage tree (skip backups dir + pid/log metadata)
  if (fs.existsSync(storageDir)) {
    const skip = (name) => name === 'backups' || name.endsWith('.pid') || name.endsWith('.log');
    const walk = (dir, rel) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip(ent.name)) continue;
        const abs = path.join(dir, ent.name);
        const r = path.join(rel, ent.name);
        if (ent.isDirectory()) walk(abs, r);
        else if (ent.isFile()) zip.addLocalFile(abs, path.dirname(r), ent.name);
      }
    };
    walk(storageDir, 'storage');
  }

  zip.writeZip(destPath);
  const bytes = fs.statSync(destPath).size;
  return { path: destPath, bytes };
}

// Restore: unzip into storage + replace db. mode='replace'|'merge'.
export function restoreBackup(zipPath, { mode = 'replace' } = {}) {
  const AdmZip = (require('adm-zip'));
  const zip = new AdmZip(zipPath);
  const tmp = path.join(storageDir, '..', '_restore_tmp_' + Date.now());
  zip.extractAllTo(tmp, true);
  // DB
  const srcDb = path.join(tmp, 'database', 'ultimate_interior.db');
  if (fs.existsSync(srcDb)) {
    for (const suffix of ['', '-wal', '-shm']) {
      const s = srcDb + suffix;
      if (fs.existsSync(s)) fs.copyFileSync(s, dbPath + suffix);
    }
  }
  // Storage
  const srcStorage = path.join(tmp, 'storage');
  if (fs.existsSync(srcStorage)) {
    for (const ent of fs.readdirSync(srcStorage, { withFileTypes: true })) {
      const from = path.join(srcStorage, ent.name);
      const to = path.join(storageDir, ent.name);
      if (mode === 'replace') {
        fs.cpSync(from, to, { recursive: true, force: true });
      } else {
        if (ent.isDirectory()) {
          fs.cpSync(from, to, { recursive: true, force: false });
        } else if (!fs.existsSync(to)) {
          fs.copyFileSync(from, to);
        }
      }
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) {}
  return { ok: true, mode };
}

export default { buildBackup, restoreBackup };
