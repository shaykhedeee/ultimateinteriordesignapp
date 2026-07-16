
-- =========================================================
-- 001_init.sql
-- Foundational schema for:
-- - platform core
-- - white-label / org-aware architecture
-- - design domain
-- - AURA domain
-- - catalog domain
-- - jobs / files / audit / tools
-- =========================================================

begin;

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists vector;

-- =========================================================
-- Schemas
-- =========================================================
create schema if not exists platform;
create schema if not exists catalog;
create schema if not exists design;
create schema if not exists aura;

-- =========================================================
-- Enum Types
-- =========================================================

-- PLATFORM
create type platform.membership_role_enum as enum (
  'org_owner',
  'admin',
  'designer',
  'reviewer',
  'viewer'
);

create type platform.file_visibility_enum as enum (
  'private',
  'org',
  'public'
);

create type platform.provider_kind_enum as enum (
  'llm',
  'vision',
  'image',
  'audio',
  'embedding',
  'ocr',
  'custom'
);

create type platform.provider_mode_enum as enum (
  'platform_managed',
  'byok',
  'local',
  'custom_http'
);

create type platform.job_status_enum as enum (
  'queued',
  'running',
  'waiting_provider',
  'validating',
  'completed',
  'failed',
  'cancelled',
  'dead_letter'
);

create type platform.tool_run_mode_enum as enum (
  'sync',
  'async'
);

-- DESIGN
create type design.project_status_enum as enum (
  'draft',
  'analyzing',
  'ready',
  'failed',
  'archived'
);

create type design.zone_status_enum as enum (
  'draft',
  'ready',
  'excluded',
  'archived'
);

create type design.render_status_enum as enum (
  'draft',
  'generating',
  'ready',
  'failed',
  'archived'
);

-- AURA
create type aura.task_type_enum as enum (
  'room_semantics',
  'style_recommend',
  'zone_design_plan',
  'render_prompt_compose',
  'render_critic'
);

create type aura.feedback_type_enum as enum (
  'accepted',
  'rejected',
  'lightly_edited',
  'heavily_edited',
  'flagged',
  'approved',
  'misclassified',
  'reviewer_override',
  'render_outcome'
);

create type aura.training_candidate_type_enum as enum (
  'sft',
  'preference_pair',
  'critique',
  'repair',
  'eval'
);

create type aura.eval_case_source_enum as enum (
  'synthetic',
  'human_curated',
  'production_derived'
);

-- =========================================================
-- Helper Function: updated_at trigger
-- =========================================================
create or replace function platform.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- PLATFORM CORE
-- =========================================================

-- ---------------------------------
-- organizations
-- ---------------------------------
create table platform.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  plan_type text not null default 'enterprise',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------
-- organization_branding
-- ---------------------------------
create table platform.organization_branding (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references platform.organizations(id) on delete cascade,
  app_name text,
  logo_asset_id uuid,
  favicon_asset_id uuid,
  primary_color text,
  secondary_color text,
  background_color text,
  font_heading text,
  font_body text,
  custom_domain citext,
  theme_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_org_branding_custom_domain
  on platform.organization_branding(custom_domain)
  where custom_domain is not null;

-- ---------------------------------
-- feature_flags (global registry)
-- ---------------------------------
create table platform.feature_flags (
  key text primary key,
  name text not null,
  description text,
  category text not null default 'general',
  enabled_by_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------
-- organization_features (per-org override)
-- ---------------------------------
create table platform.organization_features (
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  feature_key text not null references platform.feature_flags(key) on delete cascade,
  enabled boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, feature_key)
);

-- ---------------------------------
-- organization_provider_configs
-- ---------------------------------
create table platform.organization_provider_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  provider_name text not null,
  provider_kind platform.provider_kind_enum not null,
  provider_mode platform.provider_mode_enum not null default 'platform_managed',
  capability_keys text[] not null default '{}'::text[],
  is_active boolean not null default true,
  is_default boolean not null default false,
  secret_ref text,
  endpoint_url text,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_provider_configs_org
  on platform.organization_provider_configs(organization_id);

create index if not exists idx_org_provider_configs_kind
  on platform.organization_provider_configs(provider_kind);

-- ---------------------------------
-- organization_ai_data_policy
-- ---------------------------------
create table platform.organization_ai_data_policy (
  organization_id uuid primary key references platform.organizations(id) on delete cascade,
  allow_logging boolean not null default true,
  allow_training_candidates boolean not null default false,
  allow_anonymized_platform_learning boolean not null default false,
  retention_days integer not null default 90 check (retention_days >= 0),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------
-- users
-- ---------------------------------
create table platform.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  full_name text,
  avatar_asset_id uuid,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended', 'archived')),
  auth_provider text not null default 'password',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------
-- memberships
-- ---------------------------------
create table platform.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  user_id uuid not null references platform.users(id) on delete cascade,
  role platform.membership_role_enum not null,
  is_active boolean not null default true,
  permissions_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_memberships_org
  on platform.memberships(organization_id);

create index if not exists idx_memberships_user
  on platform.memberships(user_id);

-- ---------------------------------
-- audit_logs
-- ---------------------------------
create table platform.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  actor_user_id uuid references platform.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  correlation_id text,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created
  on platform.audit_logs(organization_id, created_at desc);

create index if not exists idx_audit_logs_entity
  on platform.audit_logs(entity_type, entity_id);

-- ---------------------------------
-- tool_definitions
-- ---------------------------------
create table platform.tool_definitions (
  slug text primary key,
  name text not null,
  category text not null,
  description text,
  route text not null,
  api_namespace text not null,
  run_mode platform.tool_run_mode_enum not null default 'async',
  capabilities jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  feature_flags jsonb not null default '[]'::jsonb,
  health_dependencies_json jsonb not null default '{}'::jsonb,
  ownership_domain text not null,
  service_owner text not null,
  config_json jsonb not null default '{}'::jsonb,
  enabled_by_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------
-- organization_tool_overrides
-- ---------------------------------
create table platform.organization_tool_overrides (
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  tool_slug text not null references platform.tool_definitions(slug) on delete cascade,
  enabled boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, tool_slug)
);

-- ---------------------------------
-- file_assets
-- ---------------------------------
create table platform.file_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  uploaded_by uuid references platform.users(id) on delete set null,

  storage_provider text not null default 'minio',
  bucket text not null,
  object_key text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,

  visibility platform.file_visibility_enum not null default 'private',
  is_deleted boolean not null default false,

  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (bucket, object_key)
);

create index if not exists idx_file_assets_org
  on platform.file_assets(organization_id);

create index if not exists idx_file_assets_uploaded_by
  on platform.file_assets(uploaded_by);

-- ---------------------------------
-- ai_jobs
-- ---------------------------------
create table platform.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,

  tool_slug text references platform.tool_definitions(slug) on delete set null,

  project_id uuid,
  zone_id uuid,
  render_id uuid,

  job_type text not null,
  status platform.job_status_enum not null default 'queued',
  stage text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),

  provider_name text,
  provider_job_id text,
  model_backend text,
  model_version text,

  queue_name text not null default 'default',
  correlation_id text,
  request_id text,

  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 3 check (max_retries >= 0),

  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_jobs_org_status
  on platform.ai_jobs(organization_id, status, created_at desc);

create index if not exists idx_ai_jobs_tool_slug
  on platform.ai_jobs(tool_slug);

create index if not exists idx_ai_jobs_project
  on platform.ai_jobs(project_id);

create index if not exists idx_ai_jobs_zone
  on platform.ai_jobs(zone_id);

-- =========================================================
-- CATALOG DOMAIN
-- =========================================================

-- ---------------------------------
-- categories
-- ---------------------------------
create table catalog.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  parent_id uuid references catalog.categories(id) on delete set null,
  kind text not null check (kind in ('product', 'material')),
  name text not null,
  slug citext not null,
  sort_order integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, kind, slug)
);

create index if not exists idx_catalog_categories_org_kind
  on catalog.categories(organization_id, kind);

-- ---------------------------------
-- products
-- ---------------------------------
create table catalog.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  category_id uuid references catalog.categories(id) on delete set null,

  name text not null,
  slug citext not null,
  sku text,
  brand text,

  width_cm numeric,
  depth_cm numeric,
  height_cm numeric,

  price_amount numeric,
  price_currency text default 'USD',
  pricing_visibility text default 'internal' check (pricing_visibility in ('hidden', 'internal', 'public')),

  description text,
  tags text[] not null default '{}'::text[],
  attributes_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, slug)
);

create index if not exists idx_catalog_products_org
  on catalog.products(organization_id);

create index if not exists idx_catalog_products_category
  on catalog.products(category_id);

create index if not exists idx_catalog_products_tags_gin
  on catalog.products using gin(tags);

-- ---------------------------------
-- product_images
-- ---------------------------------
create table catalog.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references catalog.products(id) on delete cascade,
  asset_id uuid not null references platform.file_assets(id) on delete cascade,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  angle_label text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (product_id, asset_id)
);

create index if not exists idx_product_images_product
  on catalog.product_images(product_id);

-- ---------------------------------
-- materials
-- ---------------------------------
create table catalog.materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  category_id uuid references catalog.categories(id) on delete set null,

  name text not null,
  slug citext not null,
  material_family text,
  finish text,
  color_name text,

  unit text,
  unit_rate numeric,
  currency text default 'USD',

  description text,
  tags text[] not null default '{}'::text[],
  attributes_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, slug)
);

create index if not exists idx_catalog_materials_org
  on catalog.materials(organization_id);

create index if not exists idx_catalog_materials_category
  on catalog.materials(category_id);

create index if not exists idx_catalog_materials_tags_gin
  on catalog.materials using gin(tags);

-- ---------------------------------
-- material_images
-- ---------------------------------
create table catalog.material_images (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references catalog.materials(id) on delete cascade,
  asset_id uuid not null references platform.file_assets(id) on delete cascade,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (material_id, asset_id)
);

create index if not exists idx_material_images_material
  on catalog.material_images(material_id);

-- =========================================================
-- DESIGN DOMAIN
-- =========================================================

-- ---------------------------------
-- projects
-- ---------------------------------
create table design.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,

  name text not null,
  status design.project_status_enum not null default 'draft',

  project_type text,
  source_image_asset_id uuid references platform.file_assets(id) on delete set null,

  scale_value numeric,
  scale_unit text check (scale_unit is null or scale_unit in ('mm', 'cm', 'm', 'in', 'ft')),
  source_image_url text,

  canonical_topview_asset_id uuid references platform.file_assets(id) on delete set null,
  enhanced_topview_asset_id uuid references platform.file_assets(id) on delete set null,

  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_design_projects_org
  on design.projects(organization_id);

create index if not exists idx_design_projects_status
  on design.projects(status);

-- ---------------------------------
-- project_assets
-- ---------------------------------
create table design.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references design.projects(id) on delete cascade,
  asset_id uuid not null references platform.file_assets(id) on delete cascade,
  role text not null,
  sort_order integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, asset_id, role)
);

create index if not exists idx_project_assets_project
  on design.project_assets(project_id);

-- ---------------------------------
-- layout_analyses
-- ---------------------------------
create table design.layout_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,

  version_no integer not null default 1,
  status text not null default 'ready' check (status in ('draft', 'ready', 'failed', 'archived')),

  manifest_json jsonb not null,
  confidence numeric,

  canonical_asset_id uuid references platform.file_assets(id) on delete set null,
  enhanced_asset_id uuid references platform.file_assets(id) on delete set null,

  validation_json jsonb not null default '{}'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,

  source_job_id uuid references platform.ai_jobs(id) on delete set null,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id, version_no)
);

create index if not exists idx_layout_analyses_project
  on design.layout_analyses(project_id, version_no desc);

-- ---------------------------------
-- layout_overrides
-- ---------------------------------
create table design.layout_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  analysis_id uuid references design.layout_analyses(id) on delete set null,

  override_type text not null,
  patch_json jsonb not null,
  notes text,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_layout_overrides_project
  on design.layout_overrides(project_id, created_at desc);

-- ---------------------------------
-- zones
-- ---------------------------------
create table design.zones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  analysis_id uuid references design.layout_analyses(id) on delete set null,

  name text,
  room_type text,
  status design.zone_status_enum not null default 'draft',

  polygon_json jsonb not null,
  bbox_json jsonb not null,

  estimated_width_cm numeric,
  estimated_depth_cm numeric,

  thumbnail_asset_id uuid references platform.file_assets(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,

  sort_order integer not null default 0,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_zones_project
  on design.zones(project_id, sort_order, created_at);

create index if not exists idx_zones_status
  on design.zones(status);

-- ---------------------------------
-- detected_objects
-- ---------------------------------
create table design.detected_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  zone_id uuid references design.zones(id) on delete cascade,

  label text not null,
  category text not null,
  subtype text,
  confidence numeric,

  bbox_json jsonb not null,
  polygon_json jsonb,
  orientation text,

  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_detected_objects_zone
  on design.detected_objects(zone_id);

create index if not exists idx_detected_objects_project
  on design.detected_objects(project_id);

-- ---------------------------------
-- style_preferences
-- ---------------------------------
create table design.style_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid references design.projects(id) on delete cascade,
  zone_id uuid references design.zones(id) on delete cascade,

  style_text text,
  palette_json jsonb not null default '[]'::jsonb,
  reference_asset_ids jsonb not null default '[]'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_style_preferences_project
  on design.style_preferences(project_id);

create index if not exists idx_style_preferences_zone
  on design.style_preferences(zone_id);

-- ---------------------------------
-- design_plans
-- ---------------------------------
create table design.design_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  zone_id uuid not null references design.zones(id) on delete cascade,

  version_no integer not null default 1,
  is_active boolean not null default true,

  source_task_id uuid,
  plan_json jsonb not null,
  confidence numeric,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (zone_id, version_no)
);

create index if not exists idx_design_plans_zone
  on design.design_plans(zone_id, version_no desc);

-- ---------------------------------
-- product_assignments
-- ---------------------------------
create table design.product_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  zone_id uuid references design.zones(id) on delete cascade,
  detected_object_id uuid references design.detected_objects(id) on delete cascade,

  product_id uuid references catalog.products(id) on delete set null,
  material_id uuid references catalog.materials(id) on delete set null,

  assignment_source text not null default 'manual' check (assignment_source in ('manual', 'aura', 'vision', 'imported')),
  confidence numeric,

  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_assignments_zone
  on design.product_assignments(zone_id);

create index if not exists idx_product_assignments_detected_object
  on design.product_assignments(detected_object_id);

-- ---------------------------------
-- render_history
-- ---------------------------------
create table design.render_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  project_id uuid not null references design.projects(id) on delete cascade,
  zone_id uuid references design.zones(id) on delete cascade,

  parent_render_id uuid references design.render_history(id) on delete set null,

  status design.render_status_enum not null default 'draft',
  render_type text not null,
  source_tool_slug text references platform.tool_definitions(slug) on delete set null,

  asset_id uuid references platform.file_assets(id) on delete set null,
  thumbnail_asset_id uuid references platform.file_assets(id) on delete set null,

  prompt_pack_json jsonb not null default '{}'::jsonb,
  prompt_text text,
  negative_prompt_text text,

  model_backend text,
  model_version text,
  provider_name text,

  source_job_id uuid references platform.ai_jobs(id) on delete set null,

  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_render_history_project
  on design.render_history(project_id, created_at desc);

create index if not exists idx_render_history_zone
  on design.render_history(zone_id, created_at desc);

create index if not exists idx_render_history_parent
  on design.render_history(parent_render_id);

-- ---------------------------------
-- render_edits
-- ---------------------------------
create table design.render_edits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  render_id uuid not null references design.render_history(id) on delete cascade,

  edit_type text not null,
  mask_asset_id uuid references platform.file_assets(id) on delete set null,

  input_json jsonb not null default '{}'::jsonb,
  result_render_id uuid references design.render_history(id) on delete set null,

  source_job_id uuid references platform.ai_jobs(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_render_edits_render
  on design.render_edits(render_id, created_at desc);

-- =========================================================
-- AURA DOMAIN
-- =========================================================

-- ---------------------------------
-- prompt_versions
-- ---------------------------------
create table aura.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_family text not null,
  version_name text not null,
  system_prompt text not null,
  developer_prompt text,
  response_schema_json jsonb not null,
  is_active boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prompt_family, version_name)
);

-- ---------------------------------
-- tasks
-- ---------------------------------
create table aura.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,

  project_id uuid references design.projects(id) on delete cascade,
  zone_id uuid references design.zones(id) on delete cascade,
  render_id uuid references design.render_history(id) on delete cascade,

  task_type aura.task_type_enum not null,

  model_backend text not null,
  model_version text not null,
  prompt_version_id uuid references aura.prompt_versions(id) on delete set null,

  input_json jsonb not null,
  raw_output_text text,
  parsed_output_json jsonb,
  parse_valid boolean not null default false,

  confidence_score numeric,
  latency_ms integer,
  token_input integer,
  token_output integer,

  source_job_id uuid references platform.ai_jobs(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_aura_tasks_org_type
  on aura.tasks(organization_id, task_type, created_at desc);

create index if not exists idx_aura_tasks_project
  on aura.tasks(project_id);

create index if not exists idx_aura_tasks_zone
  on aura.tasks(zone_id);

create index if not exists idx_aura_tasks_render
  on aura.tasks(render_id);

-- ---------------------------------
-- feedback
-- ---------------------------------
create table aura.feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  aura_task_id uuid not null references aura.tasks(id) on delete cascade,

  feedback_type aura.feedback_type_enum not null,
  actor_type text not null check (actor_type in ('user', 'reviewer', 'admin', 'system')),
  actor_id uuid references platform.users(id) on delete set null,

  rating_overall integer check (rating_overall between 1 and 5),
  rating_accuracy integer check (rating_accuracy between 1 and 5),
  rating_style integer check (rating_style between 1 and 5),
  rating_usefulness integer check (rating_usefulness between 1 and 5),

  feedback_notes text,
  diff_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_aura_feedback_task
  on aura.feedback(aura_task_id);

create index if not exists idx_aura_feedback_org_created
  on aura.feedback(organization_id, created_at desc);

-- ---------------------------------
-- training_candidates
-- ---------------------------------
create table aura.training_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references platform.organizations(id) on delete set null,
  source_task_id uuid references aura.tasks(id) on delete set null,

  candidate_type aura.training_candidate_type_enum not null,
  task_type aura.task_type_enum not null,

  input_json jsonb not null,
  target_json jsonb,
  rejected_json jsonb,

  quality_score numeric,
  curation_status text not null default 'pending' check (curation_status in ('pending', 'approved', 'rejected', 'redacted')),

  notes text,
  curated_by uuid references platform.users(id) on delete set null,

  created_at timestamptz not null default now(),
  curated_at timestamptz
);

create index if not exists idx_aura_training_candidates_status
  on aura.training_candidates(curation_status, created_at desc);

-- ---------------------------------
-- eval_cases
-- ---------------------------------
create table aura.eval_cases (
  id uuid primary key default gen_random_uuid(),
  task_type aura.task_type_enum not null,
  input_json jsonb not null,
  expected_output_json jsonb not null,
  rubric_json jsonb not null default '{}'::jsonb,
  difficulty text,
  tags text[] not null default '{}'::text[],
  source aura.eval_case_source_enum not null default 'human_curated',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_aura_eval_cases_task_type
  on aura.eval_cases(task_type);

create index if not exists idx_aura_eval_cases_tags
  on aura.eval_cases using gin(tags);

-- ---------------------------------
-- eval_runs
-- ---------------------------------
create table aura.eval_runs (
  id uuid primary key default gen_random_uuid(),
  model_backend text not null,
  model_version text not null,
  prompt_version_id uuid references aura.prompt_versions(id) on delete set null,
  run_label text,
  summary_json jsonb not null,
  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------
-- eval_results
-- ---------------------------------
create table aura.eval_results (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid not null references aura.eval_runs(id) on delete cascade,
  eval_case_id uuid not null references aura.eval_cases(id) on delete cascade,
  output_json jsonb,
  score numeric,
  passed boolean,
  failure_modes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  unique (eval_run_id, eval_case_id)
);

create index if not exists idx_aura_eval_results_run
  on aura.eval_results(eval_run_id);

-- ---------------------------------
-- preferences
-- ---------------------------------
create table aura.preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  scope text not null check (scope in ('org', 'user', 'workspace')),
  scope_id uuid,
  preference_type text not null,
  preference_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aura_preferences_org_scope
  on aura.preferences(organization_id, scope, preference_type);

-- ---------------------------------
-- critique_results
-- ---------------------------------
create table aura.critique_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,
  render_id uuid not null references design.render_history(id) on delete cascade,
  source_task_id uuid references aura.tasks(id) on delete set null,
  critique_json jsonb not null,
  approved boolean,
  human_override boolean not null default false,
  created_at timestamptz not null default now(),
  unique (render_id, source_task_id)
);

create index if not exists idx_aura_critique_results_render
  on aura.critique_results(render_id);

-- ---------------------------------
-- memory_items
-- ---------------------------------
create table aura.memory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references platform.organizations(id) on delete cascade,

  scope text not null check (scope in ('org', 'project', 'zone', 'render', 'global')),
  scope_id uuid,

  source_kind text not null,
  title text,
  content_text text not null,
  metadata_json jsonb not null default '{}'::jsonb,

  embedding vector(1024),

  is_active boolean not null default true,

  created_by uuid references platform.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aura_memory_items_org_scope
  on aura.memory_items(organization_id, scope, source_kind);

create index if not exists idx_aura_memory_items_embedding
  on aura.memory_items
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- =========================================================
-- Foreign Keys requiring later tables
-- =========================================================

alter table platform.organization_branding
  add constraint fk_org_branding_logo_asset
  foreign key (logo_asset_id) references platform.file_assets(id) on delete set null;

alter table platform.organization_branding
  add constraint fk_org_branding_favicon_asset
  foreign key (favicon_asset_id) references platform.file_assets(id) on delete set null;

alter table platform.users
  add constraint fk_users_avatar_asset
  foreign key (avatar_asset_id) references platform.file_assets(id) on delete set null;

alter table design.design_plans
  add constraint fk_design_plans_source_task
  foreign key (source_task_id) references aura.tasks(id) on delete set null;

-- =========================================================
-- GIN indexes on jsonb where useful
-- =========================================================
create index if not exists idx_tool_definitions_capabilities_gin
  on platform.tool_definitions using gin(capabilities);

create index if not exists idx_tool_definitions_permissions_gin
  on platform.tool_definitions using gin(permissions);

create index if not exists idx_ai_jobs_input_json_gin
  on platform.ai_jobs using gin(input_json);

create index if not exists idx_ai_jobs_output_json_gin
  on platform.ai_jobs using gin(output_json);

create index if not exists idx_layout_analyses_manifest_gin
  on design.layout_analyses using gin(manifest_json);

create index if not exists idx_design_plans_plan_gin
  on design.design_plans using gin(plan_json);

create index if not exists idx_aura_tasks_parsed_output_gin
  on aura.tasks using gin(parsed_output_json);

-- =========================================================
-- updated_at triggers
-- =========================================================

create trigger trg_organizations_updated_at
before update on platform.organizations
for each row execute function platform.touch_updated_at();

create trigger trg_org_branding_updated_at
before update on platform.organization_branding
for each row execute function platform.touch_updated_at();

create trigger trg_organization_features_updated_at
before update on platform.organization_features
for each row execute function platform.touch_updated_at();

create trigger trg_org_provider_configs_updated_at
before update on platform.organization_provider_configs
for each row execute function platform.touch_updated_at();

create trigger trg_org_ai_data_policy_updated_at
before update on platform.organization_ai_data_policy
for each row execute function platform.touch_updated_at();

create trigger trg_users_updated_at
before update on platform.users
for each row execute function platform.touch_updated_at();

create trigger trg_memberships_updated_at
before update on platform.memberships
for each row execute function platform.touch_updated_at();

create trigger trg_tool_definitions_updated_at
before update on platform.tool_definitions
for each row execute function platform.touch_updated_at();

create trigger trg_org_tool_overrides_updated_at
before update on platform.organization_tool_overrides
for each row execute function platform.touch_updated_at();

create trigger trg_file_assets_updated_at
before update on platform.file_assets
for each row execute function platform.touch_updated_at();

create trigger trg_ai_jobs_updated_at
before update on platform.ai_jobs
for each row execute function platform.touch_updated_at();

create trigger trg_catalog_categories_updated_at
before update on catalog.categories
for each row execute function platform.touch_updated_at();

create trigger trg_catalog_products_updated_at
before update on catalog.products
for each row execute function platform.touch_updated_at();

create trigger trg_catalog_materials_updated_at
before update on catalog.materials
for each row execute function platform.touch_updated_at();

create trigger trg_design_projects_updated_at
before update on design.projects
for each row execute function platform.touch_updated_at();

create trigger trg_layout_analyses_updated_at
before update on design.layout_analyses
for each row execute function platform.touch_updated_at();

create trigger trg_zones_updated_at
before update on design.zones
for each row execute function platform.touch_updated_at();

create trigger trg_detected_objects_updated_at
before update on design.detected_objects
for each row execute function platform.touch_updated_at();

create trigger trg_style_preferences_updated_at
before update on design.style_preferences
for each row execute function platform.touch_updated_at();

create trigger trg_design_plans_updated_at
before update on design.design_plans
for each row execute function platform.touch_updated_at();

create trigger trg_product_assignments_updated_at
before update on design.product_assignments
for each row execute function platform.touch_updated_at();

create trigger trg_render_history_updated_at
before update on design.render_history
for each row execute function platform.touch_updated_at();

create trigger trg_prompt_versions_updated_at
before update on aura.prompt_versions
for each row execute function platform.touch_updated_at();

create trigger trg_aura_preferences_updated_at
before update on aura.preferences
for each row execute function platform.touch_updated_at();

create trigger trg_aura_memory_items_updated_at
before update on aura.memory_items
for each row execute function platform.touch_updated_at();

commit;
