CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new','qualified','lost','converted')) DEFAULT 'new',
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  project_type TEXT,
  budget_band TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low','medium','high')) DEFAULT 'medium',
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
    'draft','lead_qualified','intake_in_progress','intake_complete','site_capture','plan_analysis_review',
    'scene_ready','design_in_progress','render_review','proposal_review','client_approval_pending',
    'design_approved','production_preparation','production_ready','delivered'
  )) DEFAULT 'draft',
  status TEXT NOT NULL CHECK (status IN ('active','on_hold','completed','archived')) DEFAULT 'active',
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

CREATE INDEX IF NOT EXISTS ix_projects_studio_stage_status ON projects(studio_id, stage, status);
CREATE INDEX IF NOT EXISTS ix_projects_client ON projects(client_id);
