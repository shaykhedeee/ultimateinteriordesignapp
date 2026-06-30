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

CREATE INDEX IF NOT EXISTS ix_floor_plan_versions_project_current ON floor_plan_versions(project_id, is_current);
CREATE INDEX IF NOT EXISTS ix_scene_versions_project_current ON scene_versions(project_id, branch_name, is_current);
CREATE INDEX IF NOT EXISTS ix_render_sets_project_status ON render_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_drawing_sets_project_status ON drawing_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_proposal_sets_project_status ON proposal_sets(project_id, status);
CREATE INDEX IF NOT EXISTS ix_approval_packages_project_status ON approval_packages(project_id, status);
CREATE INDEX IF NOT EXISTS ix_bom_sets_project_scene ON bom_sets(project_id, scene_version_id);
CREATE INDEX IF NOT EXISTS ix_cutlist_sets_project_scene ON cutlist_sets(project_id, scene_version_id);
CREATE INDEX IF NOT EXISTS ix_comments_project_target ON comments(project_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS ix_async_jobs_project_type_status ON async_jobs(project_id, job_type, status);
CREATE INDEX IF NOT EXISTS ix_reuse_assets_kind ON reusable_design_assets(studio_id, asset_kind);
CREATE INDEX IF NOT EXISTS ix_mistakes_log_problem_code ON mistakes_log(studio_id, problem_code);
CREATE INDEX IF NOT EXISTS ix_estimate_sets_project_type_status ON estimate_sets(project_id, estimate_type, status);
CREATE INDEX IF NOT EXISTS ix_invoices_project_status ON invoices(project_id, status, due_date);
CREATE INDEX IF NOT EXISTS ix_payments_project_date ON payments(project_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS ix_variation_orders_project_status ON variation_orders(project_id, status);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_project_status ON vendor_purchase_orders(project_id, status);
