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
CREATE UNIQUE INDEX IF NOT EXISTS ux_intake_current_per_project ON intake_packages(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS site_capture_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  capture_mode TEXT NOT NULL CHECK (capture_mode IN ('plan_upload','scan','lidar','manual_trace','hybrid')),
  notes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  issues_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_site_capture_current_per_project ON site_capture_packages(project_id) WHERE is_current = TRUE;

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
CREATE INDEX IF NOT EXISTS ix_assets_project_type ON project_assets(project_id, asset_type);
