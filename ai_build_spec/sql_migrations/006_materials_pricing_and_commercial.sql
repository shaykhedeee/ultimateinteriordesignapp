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
