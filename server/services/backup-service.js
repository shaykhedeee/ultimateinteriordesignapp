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

  // DB files (only the .db — WAL is transient and syncs on checkpoint)
  if (fs.existsSync(dbPath)) zip.addLocalFile(dbPath, 'database', 'ultimate_interior.db');

  // Storage tree (skip backups dir + pid/log metadata + the live db files,
  // which are already captured under /database)
  if (fs.existsSync(storageDir)) {
    const skip = (name) => name === 'backups' || name.endsWith('.pid') || name.endsWith('.log') || name === 'ultimate_interior.db' || name.endsWith('-wal') || name.endsWith('-shm');
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
  // DB: write to a PENDING file (ultimate_interior.db.new). The live server
  // holds the .db open (WAL lock) so we can't overwrite it directly on Windows.
  // On next server restart, database.js promotes .new -> .db automatically.
  const srcDb = path.join(tmp, 'database', 'ultimate_interior.db');
  let dbPending = false;
  if (fs.existsSync(srcDb)) {
    fs.copyFileSync(srcDb, dbPath + '.new');
    dbPending = true;
  }
  // Storage
  const srcStorage = path.join(tmp, 'storage');
  if (fs.existsSync(srcStorage)) {
    for (const ent of fs.readdirSync(srcStorage, { withFileTypes: true })) {
      const from = path.join(srcStorage, ent.name);
      const to = path.join(storageDir, ent.name);
      if (mode === 'replace' || ent.name === 'database' || ent.name === 'proposals' || ent.name === 'uploads') {
        // Explicitly skip SQLite WAL journal files on Windows
        if (ent.name.endsWith('-wal') || ent.name.endsWith('-shm')) { continue; }
        fs.cpSync(from, to, { recursive: true, force: true });
      } else {
        // merge: only copy non-existing dirs, skip existing files
        if (ent.isDirectory() && !fs.existsSync(to)) {
          fs.cpSync(from, to, { recursive: true, force: false });
        }
      }
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) {}
  return { ok: true, mode, dbPending, note: dbPending ? 'Storage restored. Database will be swapped on next server restart (ultimate_interior.db.new promoted automatically).' : 'Storage restored.' };
}

export default { buildBackup, restoreBackup };
