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
  render_tier TEXT NOT NULL CHECK (render_tier IN ('draft','review','final')),
  status TEXT NOT NULL CHECK (status IN ('queued','processing','ready','failed','approved','stale')) DEFAULT 'queued',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS render_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_set_id UUID NOT NULL REFERENCES render_sets(id) ON DELETE CASCADE,
  camera_ref TEXT NOT NULL,
  lighting_preset_ref TEXT NOT NULL,
  style_preset_ref TEXT,
  asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending','shortlisted','approved','rejected')) DEFAULT 'pending',
  score_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  drawing_scope TEXT NOT NULL CHECK (drawing_scope IN ('room','full_project','production')),
  status TEXT NOT NULL CHECK (status IN ('queued','ready','failed','stale')) DEFAULT 'queued',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drawing_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_set_id UUID NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  drawing_type TEXT NOT NULL CHECK (drawing_type IN ('floor_plan','elevation','ceiling_plan','schedule_sheet','section')),
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
  status TEXT NOT NULL CHECK (status IN ('draft','exported','approved','stale')) DEFAULT 'draft',
  asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
