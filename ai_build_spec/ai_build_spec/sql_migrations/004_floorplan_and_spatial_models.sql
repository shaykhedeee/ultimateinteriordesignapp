CREATE TABLE IF NOT EXISTS floor_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_asset_id UUID NOT NULL REFERENCES project_assets(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  interpretation_status TEXT NOT NULL CHECK (interpretation_status IN ('draft','review_required','approved','superseded')) DEFAULT 'draft',
  overall_confidence NUMERIC(6,5),
  scale_unit TEXT NOT NULL DEFAULT 'mm',
  scale_factor NUMERIC(12,5),
  interpretation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_floor_plan_current_per_project ON floor_plan_versions(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS floor_plan_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_version_id UUID NOT NULL REFERENCES floor_plan_versions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('room','wall','opening','dimension','symbol')),
  item_ref TEXT NOT NULL,
  confidence NUMERIC(6,5),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  status TEXT NOT NULL CHECK (status IN ('open','accepted','corrected','ignored')) DEFAULT 'open',
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
CREATE UNIQUE INDEX IF NOT EXISTS ux_spatial_model_current_per_project ON spatial_model_versions(project_id) WHERE is_current = TRUE;
