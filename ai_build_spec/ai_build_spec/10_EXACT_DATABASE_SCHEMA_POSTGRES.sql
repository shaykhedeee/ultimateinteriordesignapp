-- 10_EXACT_DATABASE_SCHEMA_POSTGRES.sql
-- PostgreSQL schema for StudioOS for Interiors
-- This schema is optimized for a geometry-first, revision-safe interior design platform.
-- NOTE: for the latest commercial/billing/procurement extension, also use the split migration pack
-- in sql_migrations/, especially 009_billing_procurement_and_variations.sql and
-- 010_finalize_constraints_and_indexes.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- CORE IDENTITY
-- =========================================================

CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  locale TEXT NOT NULL DEFAULT 'en-IN',
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'admin', 'owner', 'designer', 'sales_designer', 'estimator',
    'production_manager', 'site_exec', 'client_viewer'
  )),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  auth_subject TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (studio_id, email)
);

-- =========================================================
-- CRM / CLIENT / PROJECTS
-- =========================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'qualified', 'lost', 'converted')) DEFAULT 'new',
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  project_type TEXT,
  budget_band TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes TEXT,
  converted_project_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  primary_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  alternate_contacts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  city TEXT,
  address_text TEXT,
  gst_or_tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  property_type TEXT,
  project_type TEXT,
  stage TEXT NOT NULL CHECK (stage IN (
    'draft', 'lead_qualified', 'intake_in_progress', 'intake_complete',
    'site_capture', 'plan_analysis_review', 'scene_ready', 'design_in_progress',
    'render_review', 'proposal_review', 'client_approval_pending',
    'design_approved', 'production_preparation', 'production_ready', 'delivered'
  )) DEFAULT 'draft',
  status TEXT NOT NULL CHECK (status IN ('active', 'on_hold', 'completed', 'archived')) DEFAULT 'active',
  budget_band TEXT,
  target_timeline_text TEXT,
  site_city TEXT,
  site_address_text TEXT,
  readiness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  active_scene_version_id UUID,
  active_floor_plan_version_id UUID,
  active_proposal_set_id UUID,
  active_approval_package_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INTAKE / CAPTURE / ASSETS
-- =========================================================

CREATE TABLE IF NOT EXISTS intake_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  payload_json JSONB NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_steps_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_intake_current_per_project
  ON intake_packages(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS site_capture_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  capture_mode TEXT NOT NULL CHECK (capture_mode IN ('plan_upload', 'scan', 'lidar', 'manual_trace', 'hybrid')),
  notes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  issues_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_site_capture_current_per_project
  ON site_capture_packages(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  room_ref TEXT,
  wall_ref TEXT,
  source_entity_type TEXT,
  source_entity_id UUID,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  thumbnail_url TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- FLOOR PLAN INTELLIGENCE
-- =========================================================

CREATE TABLE IF NOT EXISTS floor_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_asset_id UUID NOT NULL REFERENCES project_assets(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  interpretation_status TEXT NOT NULL CHECK (interpretation_status IN ('draft', 'review_required', 'approved', 'superseded')) DEFAULT 'draft',
  overall_confidence NUMERIC(6,5),
  scale_unit TEXT NOT NULL DEFAULT 'mm',
  scale_factor NUMERIC(12,5),
  interpretation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_floor_plan_current_per_project
  ON floor_plan_versions(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS floor_plan_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_version_id UUID NOT NULL REFERENCES floor_plan_versions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('room', 'wall', 'opening', 'dimension', 'symbol')),
  item_ref TEXT NOT NULL,
  confidence NUMERIC(6,5),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'corrected', 'ignored')) DEFAULT 'open',
  suggested_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS spatial_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  floor_plan_version_id UUID NOT NULL REFERENCES floor_plan_versions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  model_json JSONB NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_spatial_model_current_per_project
  ON spatial_model_versions(project_id) WHERE is_current = TRUE;

-- =========================================================
-- SCENE / DESIGN CORE
-- =========================================================

CREATE TABLE IF NOT EXISTS scene_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  spatial_model_version_id UUID NOT NULL REFERENCES spatial_model_versions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  branch_name TEXT NOT NULL DEFAULT 'main',
  parent_scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  lock_reason TEXT,
  scene_json JSONB NOT NULL,
  scene_hash TEXT NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, branch_name, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_scene_current_per_project_branch
  ON scene_versions(project_id, branch_name) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS ix_scene_project_created_at ON scene_versions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS room_design_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  room_ref TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  variant_type TEXT NOT NULL CHECK (variant_type IN ('layout', 'finish', 'lighting', 'mixed')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'shortlisted', 'approved', 'rejected')) DEFAULT 'draft',
  patch_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- MODULES / RULES / TEMPLATES
-- =========================================================

CREATE TABLE IF NOT EXISTS module_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL,
  module_type TEXT NOT NULL,
  name TEXT NOT NULL,
  definition_json JSONB NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  room_ref TEXT NOT NULL,
  wall_ref TEXT,
  module_type TEXT NOT NULL,
  template_id UUID REFERENCES module_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'validated', 'approved', 'locked_for_production')) DEFAULT 'draft',
  geometry_json JSONB NOT NULL,
  params_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  material_assignment_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  production_mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  rule_result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_modules_project_scene ON modules(project_id, scene_version_id);
CREATE INDEX IF NOT EXISTS ix_modules_room_ref ON modules(project_id, room_ref);

CREATE TABLE IF NOT EXISTS rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'room_type', 'module_type', 'production')),
  version_number INTEGER NOT NULL DEFAULT 1,
  rules_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rule_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID REFERENCES scene_versions(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  room_ref TEXT,
  evaluation_scope TEXT NOT NULL CHECK (evaluation_scope IN ('scene', 'room', 'module', 'production')),
  rule_set_id UUID NOT NULL REFERENCES rule_sets(id) ON DELETE RESTRICT,
  result_json JSONB NOT NULL,
  score NUMERIC(8,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- MATERIALS / PRICING
-- =========================================================

CREATE TABLE IF NOT EXISTS material_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  code TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_material_catalog_category ON material_catalog_items(category, subcategory);

CREATE TABLE IF NOT EXISTS vendor_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  effective_from DATE NOT NULL,
  rates_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  pricing_json JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pricing_current_per_project ON pricing_sets(project_id) WHERE is_current = TRUE;

-- =========================================================
-- RENDERING
-- =========================================================

CREATE TABLE IF NOT EXISTS camera_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT,
  preset_json JSONB NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lighting_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT,
  preset_json JSONB NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS render_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  room_ref TEXT,
  set_name TEXT NOT NULL,
  render_tier TEXT NOT NULL CHECK (render_tier IN ('draft', 'review', 'final')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'ready', 'failed', 'approved', 'stale')) DEFAULT 'queued',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_render_sets_project_scene_status ON render_sets(project_id, scene_version_id, status);

CREATE TABLE IF NOT EXISTS render_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_set_id UUID NOT NULL REFERENCES render_sets(id) ON DELETE CASCADE,
  camera_ref TEXT NOT NULL,
  lighting_preset_ref TEXT NOT NULL,
  style_preset_ref TEXT,
  asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'shortlisted', 'approved', 'rejected')) DEFAULT 'pending',
  score_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- DRAWINGS / PROPOSALS
-- =========================================================

CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  drawing_scope TEXT NOT NULL CHECK (drawing_scope IN ('room', 'full_project', 'production')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'ready', 'failed', 'stale')) DEFAULT 'queued',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_drawing_sets_project_scene_status ON drawing_sets(project_id, scene_version_id, status);

CREATE TABLE IF NOT EXISTS drawing_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_set_id UUID NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  drawing_type TEXT NOT NULL CHECK (drawing_type IN ('floor_plan', 'elevation', 'ceiling_plan', 'schedule_sheet', 'section')),
  room_ref TEXT,
  wall_ref TEXT,
  asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  render_set_id UUID REFERENCES render_sets(id) ON DELETE SET NULL,
  drawing_set_id UUID REFERENCES drawing_sets(id) ON DELETE SET NULL,
  pricing_set_id UUID REFERENCES pricing_sets(id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'exported', 'approved', 'stale')) DEFAULT 'draft',
  asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE INDEX IF NOT EXISTS ix_proposal_sets_project_scene_status ON proposal_sets(project_id, scene_version_id, status);

-- =========================================================
-- APPROVALS / COMMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS approval_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  proposal_set_id UUID REFERENCES proposal_sets(id) ON DELETE SET NULL,
  render_set_id UUID REFERENCES render_sets(id) ON DELETE SET NULL,
  drawing_set_id UUID REFERENCES drawing_sets(id) ON DELETE SET NULL,
  pricing_set_id UUID REFERENCES pricing_sets(id) ON DELETE SET NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('concept', 'client_approval', 'production_lock')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')) DEFAULT 'pending',
  approved_by_client_name TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'client_guest')),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'archived')) DEFAULT 'open',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_comments_project_target ON comments(project_id, target_type, target_id);

-- =========================================================
-- PRODUCTION / BOM / CUTLIST
-- =========================================================

CREATE TABLE IF NOT EXISTS production_settings_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings_json JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'approved', 'stale')) DEFAULT 'draft',
  bom_json JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE TABLE IF NOT EXISTS cutlist_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  bom_set_id UUID NOT NULL REFERENCES bom_sets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'exported', 'stale')) DEFAULT 'draft',
  cutlist_json JSONB NOT NULL,
  csv_asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  pdf_asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

-- =========================================================
-- WORKFLOW / JOBS / AUDIT / REUSE
-- =========================================================

CREATE TABLE IF NOT EXISTS project_stage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS async_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'waiting_for_input', 'succeeded', 'failed', 'canceled', 'stale')) DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 5,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_count INTEGER NOT NULL DEFAULT 0,
  source_entity_type TEXT,
  source_entity_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_async_jobs_project_type_status ON async_jobs(project_id, job_type, status);

CREATE TABLE IF NOT EXISTS reusable_design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('room_template', 'module_template', 'render_reference', 'finish_pack', 'camera_pack')),
  name TEXT NOT NULL,
  tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mistakes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('detection', 'layout', 'render', 'drawing', 'production', 'workflow')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  problem_code TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause_text TEXT,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  resolution_text TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- PROJECT FK ADDITIONS AFTER TABLE CREATION
-- =========================================================

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_active_scene_version
  FOREIGN KEY (active_scene_version_id) REFERENCES scene_versions(id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_active_floor_plan_version
  FOREIGN KEY (active_floor_plan_version_id) REFERENCES floor_plan_versions(id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_active_proposal_set
  FOREIGN KEY (active_proposal_set_id) REFERENCES proposal_sets(id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_active_approval_package
  FOREIGN KEY (active_approval_package_id) REFERENCES approval_packages(id) ON DELETE SET NULL;

ALTER TABLE leads
  ADD CONSTRAINT fk_leads_converted_project
  FOREIGN KEY (converted_project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- =========================================================
-- USEFUL INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_projects_studio_stage_status ON projects(studio_id, stage, status);
CREATE INDEX IF NOT EXISTS ix_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS ix_floor_plan_versions_project_current ON floor_plan_versions(project_id, is_current);
CREATE INDEX IF NOT EXISTS ix_scene_versions_project_current ON scene_versions(project_id, branch_name, is_current);
CREATE INDEX IF NOT EXISTS ix_render_sets_project_status ON render_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_drawing_sets_project_status ON drawing_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_proposal_sets_project_status ON proposal_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_approval_packages_project_status ON approval_packages(project_id, status);
CREATE INDEX IF NOT EXISTS ix_bom_sets_project_scene ON bom_sets(project_id, scene_version_id);
CREATE INDEX IF NOT EXISTS ix_cutlist_sets_project_scene ON cutlist_sets(project_id, scene_version_id);
CREATE INDEX IF NOT EXISTS ix_assets_project_type ON project_assets(project_id, asset_type);
CREATE INDEX IF NOT EXISTS ix_reuse_assets_kind ON reusable_design_assets(studio_id, asset_kind);
CREATE INDEX IF NOT EXISTS ix_mistakes_log_problem_code ON mistakes_log(studio_id, problem_code);

-- =========================================================
-- HELPER COMMENTS
-- =========================================================

COMMENT ON TABLE scene_versions IS 'Canonical source of truth for editable design scenes. All renders, drawings, proposals, BOMs and cutlists must link to a scene version.';
COMMENT ON TABLE floor_plan_versions IS 'AI/CV interpreted plan versions with review workflow.';
COMMENT ON TABLE modules IS 'Placed parametric module instances, production-aware.';
COMMENT ON TABLE approval_packages IS 'Version-safe approval bundles that lock a scene revision for client signoff or production basis.';
COMMENT ON TABLE async_jobs IS 'All heavy work must be queued and traceable.';
