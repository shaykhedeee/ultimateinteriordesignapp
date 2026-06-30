import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspirationSeed, laminateSeed } from '../data/seed-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const storageDir = path.join(rootDir, 'storage');
const dbPath = path.join(storageDir, 'spacious-venture.sqlite');

let db;

export function getDb() {
  if (!db) {
    ensureDatabase();
  }
  return db;
}

export function ensureDatabase() {
  fs.mkdirSync(storageDir, { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'floor-plans'), { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'proposals'), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS client_projects (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS space_profiles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      room TEXT NOT NULL,
      payload TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS design_packages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS moodboards (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      room TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(package_id) REFERENCES design_packages(id)
    );

    CREATE TABLE IF NOT EXISTS floor_plans (
      project_id TEXT PRIMARY KEY,
      file_path TEXT,
      preview_path TEXT,
      annotations TEXT NOT NULL,
      analysis TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS generated_assets (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      room TEXT NOT NULL,
      style TEXT NOT NULL,
      budget_tier TEXT NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      negative_prompt TEXT,
      file_path TEXT NOT NULL,
      tags TEXT NOT NULL,
      source_type TEXT NOT NULL,
      reusable_score INTEGER NOT NULL DEFAULT 80,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS laminate_products (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspiration_references (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cutlist_projects (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS cutlist_modules (
      id TEXT PRIMARY KEY,
      cutlist_project_id TEXT NOT NULL,
      room TEXT NOT NULL,
      module_type TEXT NOT NULL,
      name TEXT NOT NULL,
      width_mm INTEGER NOT NULL,
      height_mm INTEGER NOT NULL,
      depth_mm INTEGER NOT NULL,
      material TEXT NOT NULL,
      finish TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(cutlist_project_id) REFERENCES cutlist_projects(id)
    );

    CREATE TABLE IF NOT EXISTS cutlist_parts (
      id TEXT PRIMARY KEY,
      cutlist_project_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      part_code TEXT NOT NULL,
      name TEXT NOT NULL,
      material TEXT NOT NULL,
      length_mm INTEGER NOT NULL,
      width_mm INTEGER NOT NULL,
      thickness_mm INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      edge_band TEXT NOT NULL,
      grain TEXT NOT NULL,
      notes TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(cutlist_project_id) REFERENCES cutlist_projects(id),
      FOREIGN KEY(module_id) REFERENCES cutlist_modules(id)
    );
  `);

  seedStaticData();
}

function seedStaticData() {
  const laminateCount = db.prepare('SELECT COUNT(*) AS count FROM laminate_products').get().count;
  if (laminateCount === 0) {
    const insert = db.prepare('INSERT INTO laminate_products (id, payload) VALUES (?, ?)');
    laminateSeed.forEach((item, index) => {
      insert.run(`lam-${index + 1}`, JSON.stringify({ id: `lam-${index + 1}`, ...item }));
    });
  }

  const inspirationCount = db.prepare('SELECT COUNT(*) AS count FROM inspiration_references').get().count;
  if (inspirationCount === 0) {
    const insert = db.prepare('INSERT INTO inspiration_references (id, payload) VALUES (?, ?)');
    inspirationSeed.forEach((item, index) => {
      insert.run(`insp-${index + 1}`, JSON.stringify({ id: `insp-${index + 1}`, consent: 'curated-link-only', ...item }));
    });
  }
}

export function rowToJson(row) {
  return row ? JSON.parse(row.payload) : null;
}

export function rowsToJson(rows) {
  return rows.map(rowToJson);
}

export { rootDir, storageDir };
