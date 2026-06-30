import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspirationSeed, laminateSeed } from '../data/seed-data.js';
import { catalogLaminateSeed } from '../data/catalog-laminate-seed.js';
import { hardwareRules } from './cutlist-standards-service.js';

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
  fs.mkdirSync(path.join(storageDir, 'cutlists'), { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'cutlists', 'raw-sources'), { recursive: true });
  fs.mkdirSync(path.join(storageDir, 'production-imports'), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS client_projects (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      current_stage TEXT DEFAULT 'onboarding',
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

    CREATE TABLE IF NOT EXISTS render_corrections (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      asset_id TEXT,
      room TEXT NOT NULL,
      mistake TEXT NOT NULL,
      correction TEXT NOT NULL,
      prompt_patch TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS render_asset_reviews (
      asset_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      room TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(asset_id) REFERENCES generated_assets(id),
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
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
      edge_l1 TEXT,
      edge_l2 TEXT,
      edge_w1 TEXT,
      edge_w2 TEXT,
      grain TEXT NOT NULL,
      formula_length TEXT,
      formula_width TEXT,
      notes TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(cutlist_project_id) REFERENCES cutlist_projects(id),
      FOREIGN KEY(module_id) REFERENCES cutlist_modules(id)
    );

    CREATE TABLE IF NOT EXISTS production_project_imports (
      id TEXT PRIMARY KEY,
      project_code TEXT NOT NULL,
      source_file TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS floor_plan_analyses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      original_filename TEXT,
      analysis_json TEXT NOT NULL,
      rooms_count INTEGER DEFAULT 0,
      walls_count INTEGER DEFAULT 0,
      components_count INTEGER DEFAULT 0,
      confidence REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS render_generation_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      room TEXT NOT NULL,
      provider TEXT NOT NULL,
      quality_mode TEXT NOT NULL,
      spend_mode TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS brief_approvals (
      project_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS technical_drawings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      drawing_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS cutlist_standards (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hardware_rules (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generation_costs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      asset_id TEXT,
      source_type TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES client_projects(id)
    );

    CREATE TABLE IF NOT EXISTS render_generations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
      style TEXT DEFAULT 'modern',
      budget TEXT DEFAULT 'standard',
      quality TEXT DEFAULT 'balanced',
      variant_count INTEGER DEFAULT 4,
      rooms_data TEXT NOT NULL,
      total_variants INTEGER DEFAULT 0,
      selected_variant TEXT,
      status TEXT DEFAULT 'pending-review',
      accuracy_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS render_variants (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES render_generations(id) ON DELETE CASCADE,
      variant_key TEXT NOT NULL,
      name TEXT,
      prompt_used TEXT,
      image_path TEXT,
      image_svg TEXT,
      component_masks TEXT,
      spatial_validation TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS component_color_changes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
      generation_id TEXT REFERENCES render_generations(id),
      variant_key TEXT,
      component_type TEXT NOT NULL,
      previous_color TEXT,
      previous_material TEXT,
      new_color TEXT NOT NULL,
      new_material TEXT,
      new_color_hex TEXT,
      applied_to_all_variants BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reference_library (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      style TEXT,
      budget_tier TEXT,
      image_path TEXT NOT NULL,
      thumbnail_path TEXT,
      metadata_json TEXT,
      ai_training_ready BOOLEAN DEFAULT 1,
      source TEXT DEFAULT 'upload',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);

  // Run dynamic migrations to ensure existing tables have the new columns
  const columns = ['edge_l1', 'edge_l2', 'edge_w1', 'edge_w2', 'formula_length', 'formula_width'];
  columns.forEach((col) => {
    try {
      db.exec(`ALTER TABLE cutlist_parts ADD COLUMN ${col} TEXT;`);
    } catch (err) {
      // Column might already exist
    }
  });

  ['updated_at', 'deleted_at'].forEach((col) => {
    try {
      db.exec(`ALTER TABLE reference_library ADD COLUMN ${col} DATETIME;`);
    } catch (err) {
      // Column might already exist
    }
  });

  [
    "ALTER TABLE client_projects ADD COLUMN floor_plan_analysis_id TEXT",
    "ALTER TABLE client_projects ADD COLUMN active_render_generation_id TEXT",
    "ALTER TABLE client_projects ADD COLUMN render_approved BOOLEAN DEFAULT 0",
    "ALTER TABLE client_projects ADD COLUMN approved_render_note TEXT"
  ].forEach((sql) => {
    try {
      db.exec(sql);
    } catch (err) {
      // Column might already exist
    }
  });

  seedStaticData();
}

function seedStaticData() {
  const insertLaminate = db.prepare('INSERT OR REPLACE INTO laminate_products (id, payload) VALUES (?, ?)');
  [...laminateSeed, ...catalogLaminateSeed].forEach((item, index) => {
    const id = item.id || `lam-${index + 1}`;
    insertLaminate.run(id, JSON.stringify({ id, ...item }));
  });

  const insertInspiration = db.prepare('INSERT OR REPLACE INTO inspiration_references (id, payload) VALUES (?, ?)');
  inspirationSeed.forEach((item, index) => {
    const id = item.id || `insp-${index + 1}`;
    insertInspiration.run(id, JSON.stringify({ id, consent: 'curated-link-only', ...item }));
  });

  const hardwareCount = db.prepare('SELECT COUNT(*) AS count FROM hardware_rules').get().count;
  if (hardwareCount === 0) {
    const insertHardware = db.prepare('INSERT INTO hardware_rules (id, payload) VALUES (?, ?)');
    hardwareRules.forEach((item) => insertHardware.run(item.id, JSON.stringify(item)));
  }

  const standardCount = db.prepare('SELECT COUNT(*) AS count FROM cutlist_standards').get().count;
  if (standardCount === 0) {
    const insertStandard = db.prepare('INSERT INTO cutlist_standards (id, payload) VALUES (?, ?)');
    [
      { id: 'indian-modular-8x4', sheet: { lengthMm: 2440, widthMm: 1220 }, kerfMm: 3, trimMm: 10, boardThicknessMm: 18, backPanelThicknessMm: 6 },
      { id: 'standard-base-cabinet', heightMm: 720, depthMm: 560, railWidthMm: 100, note: 'Indian base carcass height excluding plinth and counter.' },
      { id: 'standard-wardrobe', heightMm: 2100, depthMm: 600, shutterGapMm: 3, note: 'Wardrobe defaults before site-specific loft/split adjustments.' }
    ].forEach((item) => insertStandard.run(item.id, JSON.stringify(item)));
  }
}

export function rowToJson(row) {
  return row ? JSON.parse(row.payload) : null;
}

export function rowsToJson(rows) {
  return rows.map(rowToJson);
}

export { rootDir, storageDir };
