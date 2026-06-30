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
CREATE UNIQUE INDEX IF NOT EXISTS ux_scene_current_per_project_branch ON scene_versions(project_id, branch_name) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS room_design_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  room_ref TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  variant_type TEXT NOT NULL CHECK (variant_type IN ('layout','finish','lighting','mixed')),
  status TEXT NOT NULL CHECK (status IN ('draft','shortlisted','approved','rejected')) DEFAULT 'draft',
  patch_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  status TEXT NOT NULL CHECK (status IN ('draft','validated','approved','locked_for_production')) DEFAULT 'draft',
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

CREATE TABLE IF NOT EXISTS rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global','room_type','module_type','production')),
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
  evaluation_scope TEXT NOT NULL CHECK (evaluation_scope IN ('scene','room','module','production')),
  rule_set_id UUID NOT NULL REFERENCES rule_sets(id) ON DELETE RESTRICT,
  result_json JSONB NOT NULL,
  score NUMERIC(8,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
