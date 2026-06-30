CREATE TABLE IF NOT EXISTS approval_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL REFERENCES scene_versions(id) ON DELETE CASCADE,
  proposal_set_id UUID REFERENCES proposal_sets(id) ON DELETE SET NULL,
  render_set_id UUID REFERENCES render_sets(id) ON DELETE SET NULL,
  drawing_set_id UUID REFERENCES drawing_sets(id) ON DELETE SET NULL,
  pricing_set_id UUID REFERENCES pricing_sets(id) ON DELETE SET NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('concept','client_approval','production_lock')),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','superseded')) DEFAULT 'pending',
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
  author_type TEXT NOT NULL CHECK (author_type IN ('user','client_guest')),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','resolved','archived')) DEFAULT 'open',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

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
  status TEXT NOT NULL CHECK (status IN ('draft','ready','approved','stale')) DEFAULT 'draft',
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
  status TEXT NOT NULL CHECK (status IN ('draft','ready','exported','stale')) DEFAULT 'draft',
  cutlist_json JSONB NOT NULL,
  csv_asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  pdf_asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

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
  status TEXT NOT NULL CHECK (status IN ('queued','running','waiting_for_input','succeeded','failed','canceled','stale')) DEFAULT 'queued',
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

CREATE TABLE IF NOT EXISTS reusable_design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('room_template','module_template','render_reference','finish_pack','camera_pack')),
  name TEXT NOT NULL,
  tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active','archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mistakes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('detection','layout','render','drawing','production','workflow')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  problem_code TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause_text TEXT,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  resolution_text TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
