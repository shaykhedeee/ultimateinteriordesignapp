-- ============================================================================
-- ULTIDA — Postgres / Supabase schema migration (0001_init.sql)
-- Generated from the canonical SQLite schema in server/database/database.js +
-- server/index.js + server/services/aura-orchestrator.js.
-- Apply with:  node server/database/run-migration.mjs
-- Idempotent: every table uses CREATE TABLE IF NOT EXISTS; safe to re-run.
-- ============================================================================
-- Type mapping (SQLite -> Postgres):
--   TEXT / TIMESTAMP      -> TEXT / TIMESTAMP
--   REAL                  -> DOUBLE PRECISION
--   INTEGER / BOOLEAN     -> BOOLEAN / INTEGER
--   *_json / *_json TEXT  -> JSONB   (enables queries + RLS later)
--   AUTOINCREMENT INTEGER -> SERIAL
-- NOTE: multi-tenancy columns (org_id / user_id) are added by migration 0002
--       only if D3 (multi-tenant) is chosen. Kept out here to stay 1:1 with
--       the working SQLite schema.

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  budget DOUBLE PRECISION,
  area DOUBLE PRECISION,
  requirements TEXT,
  score INTEGER DEFAULT 0,
  voice_status TEXT DEFAULT 'new',
  call_transcript TEXT,
  call_recording TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  budget DOUBLE PRECISION,
  unit_system TEXT DEFAULT 'metric',
  status TEXT DEFAULT 'closed',
  current_step TEXT DEFAULT 'brief',
  advance_paid_amount DOUBLE PRECISION DEFAULT 0,
  total_cost DOUBLE PRECISION DEFAULT 0,
  client_brief_json JSONB,
  quotation_json JSONB,
  stale_renders INTEGER DEFAULT 0,
  stale_drawings INTEGER DEFAULT 0,
  stale_pricing INTEGER DEFAULT 0,
  active_floor_plan_version_id TEXT,
  active_spatial_model_version_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cad_drawings (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE REFERENCES projects(id),
  walls_json JSONB,
  openings_json JSONB,
  furniture_json JSONB,
  rooms_json JSONB,
  measures_json JSONB,
  pixels_per_meter DOUBLE PRECISION DEFAULT 40.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_selections (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE REFERENCES projects(id),
  laminates_json JSONB,
  hardware_json JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_renders (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  image_url TEXT,
  sketchup_script_txt TEXT,
  room TEXT,
  prompt TEXT,
  review_status TEXT DEFAULT 'unreviewed',
  review_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  invoice_number TEXT NOT NULL,
  description TEXT,
  amount DOUBLE PRECISION,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_cutlists (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE REFERENCES projects(id),
  cutlist_data_json JSONB,
  optimized_sheets_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS render_corrections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  asset_id TEXT,
  room TEXT NOT NULL,
  mistake TEXT NOT NULL,
  correction TEXT NOT NULL,
  prompt_patch TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS render_variants (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  render_id TEXT,
  variant_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  component_masks JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS component_color_changes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  variant_key TEXT NOT NULL,
  component_type TEXT NOT NULL,
  previous_color TEXT,
  new_color TEXT NOT NULL,
  applied_to_all BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  metadata_json JSONB,
  ai_training_ready BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'upload',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generation_costs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  asset_id TEXT,
  source_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  unit_cost DOUBLE PRECISION NOT NULL,
  total_cost DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS render_generation_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  room TEXT NOT NULL,
  provider TEXT NOT NULL,
  quality_mode TEXT NOT NULL,
  spend_mode TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scene_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  version_number INTEGER NOT NULL,
  branch_name TEXT NOT NULL DEFAULT 'main',
  parent_scene_version_id TEXT,
  is_current INTEGER DEFAULT 1,
  is_locked INTEGER DEFAULT 0,
  lock_reason TEXT,
  scene_json JSONB NOT NULL,
  scene_hash TEXT NOT NULL,
  summary_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, branch_name, version_number)
);

CREATE TABLE IF NOT EXISTS material_catalog (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  code TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  finish TEXT,
  color TEXT,
  price_per_sqft DOUBLE PRECISION DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 5.0,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS render_color_preferences (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  render_id TEXT,
  component_type TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laminate_swap_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  render_id TEXT,
  component_type TEXT NOT NULL,
  new_material TEXT,
  new_color TEXT,
  laminate_code TEXT,
  laminate_brand TEXT,
  result_file_path TEXT,
  source_type TEXT,
  prompt TEXT,
  approved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  source_entity_type TEXT,
  source_entity_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  version_number INTEGER DEFAULT 1,
  is_current INTEGER DEFAULT 1,
  budget_band TEXT,
  target_budget DOUBLE PRECISION,
  max_budget DOUBLE PRECISION,
  scope_type TEXT,
  priorities_json JSONB,
  preferences_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimate_sets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  scene_version_id TEXT,
  budget_profile_id TEXT,
  estimate_type TEXT,
  version_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  totals_json JSONB,
  items_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_plans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  estimate_set_id TEXT,
  name TEXT,
  version_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  total_contract_value DOUBLE PRECISION,
  milestones_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  payment_plan_id TEXT,
  amount DOUBLE PRECISION,
  payment_method TEXT,
  payment_date TEXT,
  status TEXT DEFAULT 'cleared',
  allocations_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS variation_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  source_estimate_set_id TEXT,
  variation_code TEXT,
  status TEXT DEFAULT 'priced',
  reason_category TEXT,
  description TEXT,
  cost_delta DOUBLE PRECISION DEFAULT 0,
  timeline_delta_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  vendor_name TEXT,
  po_number TEXT,
  category TEXT,
  status TEXT DEFAULT 'issued',
  expected_delivery_date TEXT,
  subtotal DOUBLE PRECISION DEFAULT 0,
  tax_total DOUBLE PRECISION DEFAULT 0,
  grand_total DOUBLE PRECISION DEFAULT 0,
  lines_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floor_plan_versions (
  id TEXT PRIMARY KEY,
  studio_id TEXT,
  project_id TEXT REFERENCES projects(id),
  source_asset_id TEXT,
  version_number INTEGER,
  is_current INTEGER DEFAULT 1,
  interpretation_status TEXT,
  overall_confidence DOUBLE PRECISION,
  scale_unit TEXT DEFAULT 'mm',
  scale_factor DOUBLE PRECISION,
  interpretation_json JSONB,
  reviewed_json JSONB,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floor_plan_review_items (
  id TEXT PRIMARY KEY,
  floor_plan_version_id TEXT REFERENCES floor_plan_versions(id),
  item_type TEXT,
  item_ref TEXT,
  confidence DOUBLE PRECISION,
  severity TEXT,
  status TEXT DEFAULT 'open',
  suggested_value_json JSONB,
  resolved_value_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spatial_model_versions (
  id TEXT PRIMARY KEY,
  studio_id TEXT,
  project_id TEXT REFERENCES projects(id),
  floor_plan_version_id TEXT REFERENCES floor_plan_versions(id),
  version_number INTEGER,
  is_current INTEGER DEFAULT 1,
  model_json JSONB,
  summary_json JSONB,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS furniture_catalog (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  style_tags TEXT,
  trend_tags TEXT,
  room_types TEXT,
  params_json JSONB,
  gltf_asset_path TEXT,
  preview_color TEXT,
  preview_label TEXT,
  placement_type TEXT DEFAULT 'floor',
  snap_origin TEXT DEFAULT 'center',
  material_zones TEXT,
  price_band TEXT DEFAULT 'standard',
  price DOUBLE PRECISION DEFAULT 0,
  dimensions_json JSONB,
  thumbnail TEXT
);

CREATE TABLE IF NOT EXISTS detected_furniture (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT,
  type TEXT,
  x_mm DOUBLE PRECISION,
  y_mm DOUBLE PRECISION,
  width_mm DOUBLE PRECISION,
  height_mm DOUBLE PRECISION,
  source_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photo_elevations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  wall_id TEXT,
  wall_name TEXT,
  wall_json JSONB,
  model_json JSONB,
  dims_json JSONB,
  material TEXT,
  notes TEXT,
  source TEXT,
  confidence DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  key_enc TEXT NOT NULL,
  key_value TEXT,
  label TEXT,
  last_error TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_models (
  id TEXT PRIMARY KEY,
  models_json JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whitelabel_settings (
  id TEXT PRIMARY KEY,
  studio_name TEXT,
  tagline TEXT,
  logo_text TEXT,
  accent_color TEXT,
  hero_image_url TEXT,
  surface_color TEXT,
  text_color TEXT,
  muted_color TEXT,
  font_display TEXT,
  support_phone TEXT,
  social_links_json JSONB,
  terms_url TEXT,
  privacy_url TEXT,
  show_powered_by INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  studio_name TEXT,
  tagline TEXT,
  logo_text TEXT,
  accent_color TEXT DEFAULT '#C9A84C',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_links (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aura_memory (
  id SERIAL PRIMARY KEY,
  project_id TEXT,
  role TEXT,
  text TEXT,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---- Indexes (helpful on Postgres; harmless on small dbs) ----
CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_cad_drawings_project ON cad_drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_design_renders_project ON design_renders(project_id);
CREATE INDEX IF NOT EXISTS idx_photo_elevations_project ON photo_elevations(project_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_versions_project ON floor_plan_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_aura_memory_project ON aura_memory(project_id);
