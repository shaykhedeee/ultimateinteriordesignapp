-- ============================================================
-- SPACIOUS VENTURE STUDIO OS
-- Migration 004: Workflow & Approval Gating Enhancements
-- ============================================================

-- 1. Workspace Sign-offs table
CREATE TABLE IF NOT EXISTS workspace_signoffs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  notes TEXT,
  checklist_json TEXT,
  status TEXT DEFAULT 'signed' CHECK(status IN ('signed', 'pending', 'revoked')),
  signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_signoff_project ON workspace_signoffs(project_id);

-- 2. Render Variant Approvals (extend existing table with approval fields)
ALTER TABLE render_variants ADD COLUMN approved_at DATETIME;
ALTER TABLE render_variants ADD COLUMN approved_by TEXT;
ALTER TABLE render_variants ADD COLUMN rejection_reason TEXT;

-- 3. Audit Trail for all gate actions
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT DEFAULT 'system',
  details TEXT,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_trail(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);

-- 4. Project Stage History (track every stage transition)
CREATE TABLE IF NOT EXISTS project_stage_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  triggered_by TEXT DEFAULT 'system',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_psh_project ON project_stage_history(project_id);

-- 5. Flux/ControlNet cache for generated renders
CREATE TABLE IF NOT EXISTS render_provider_cache (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_hash TEXT,
  control_image_hash TEXT,
  result_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_rpc_project ON render_provider_cache(project_id);

-- ============================================================
-- UPDATE CLIENT PROJECTS with workflow tracking fields
-- ============================================================
ALTER TABLE client_projects ADD COLUMN workflow_readiness INTEGER DEFAULT 0;
ALTER TABLE client_projects ADD COLUMN current_blocking_gate TEXT;
ALTER TABLE client_projects ADD COLUMN last_gate_check DATETIME;

-- ============================================================
-- TRIGGER: Auto-update readiness when stage changes
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_project_stage_readiness
AFTER UPDATE OF current_stage ON client_projects
BEGIN
  UPDATE client_projects SET 
    workflow_readiness = 
      CASE NEW.current_stage
        WHEN 'onboarding' THEN 10
        WHEN 'floor-plan' THEN 25
        WHEN 'render-review' THEN 40
        WHEN 'render-approved' THEN 55
        WHEN 'pdf-brief' THEN 65
        WHEN 'brief-approved' THEN 75
        WHEN 'cutlist' THEN 85
        WHEN 'cutlist-ready' THEN 92
        WHEN 'delivered' THEN 100
        ELSE 0
      END,
    last_gate_check = datetime('now')
  WHERE id = NEW.id;
END;

-- ============================================================
-- TRIGGER: Log stage changes to history
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_project_stage_history
AFTER UPDATE OF current_stage ON client_projects
WHEN OLD.current_stage IS NOT NULL AND OLD.current_stage != NEW.current_stage
BEGIN
  INSERT INTO project_stage_history (id, project_id, from_stage, to_stage, triggered_by, notes, created_at)
  VALUES (
    'psh-' || lower(hex(randomblob(8))),
    NEW.id,
    OLD.current_stage,
    NEW.current_stage,
    'system',
    'Automatic stage transition',
    datetime('now')
  );
END;