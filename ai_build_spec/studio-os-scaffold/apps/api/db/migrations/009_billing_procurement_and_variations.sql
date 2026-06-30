CREATE TABLE IF NOT EXISTS budget_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  target_budget NUMERIC(14,2),
  max_budget NUMERIC(14,2),
  budget_band TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  financing_needed BOOLEAN NOT NULL DEFAULT FALSE,
  priority_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_budget_profile_current_per_project ON budget_profiles(project_id) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS estimate_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  budget_profile_id UUID REFERENCES budget_profiles(id) ON DELETE SET NULL,
  estimate_type TEXT NOT NULL CHECK (estimate_type IN ('rough','budget_fit','concept','boq_quote','final_quote','variation_quote')),
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','shared','revised','approved','rejected','superseded')) DEFAULT 'draft',
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  assumptions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  totals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, estimate_type, version_number)
);

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_set_id UUID NOT NULL REFERENCES estimate_sets(id) ON DELETE CASCADE,
  line_code TEXT NOT NULL,
  room_ref TEXT,
  module_ref TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'nos',
  base_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  margin_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_set_id UUID REFERENCES estimate_sets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','active','superseded','closed')) DEFAULT 'draft',
  total_contract_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE TABLE IF NOT EXISTS payment_plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  milestone_label TEXT NOT NULL,
  due_type TEXT NOT NULL CHECK (due_type IN ('event','date')),
  due_event TEXT,
  due_date DATE,
  percent_of_total NUMERIC(8,4),
  fixed_amount NUMERIC(14,2),
  sequence_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_due','due','overdue','partially_paid','paid','waived')) DEFAULT 'not_due',
  release_gate_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_set_id UUID REFERENCES estimate_sets(id) ON DELETE SET NULL,
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES payment_plan_milestones(id) ON DELETE SET NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('proforma','advance','milestone','tax','final','credit_note','debit_note')),
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','issued','partially_paid','paid','overdue','void')) DEFAULT 'draft',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_code TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'nos',
  taxable_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer','cheque','cash','card','upi','emi_partner','finance_partner','other')),
  payment_date DATE NOT NULL,
  reference_no TEXT,
  status TEXT NOT NULL CHECK (status IN ('recorded','cleared','bounced','reversed','refunded')) DEFAULT 'recorded',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variation_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_version_id UUID REFERENCES scene_versions(id) ON DELETE SET NULL,
  source_estimate_set_id UUID REFERENCES estimate_sets(id) ON DELETE SET NULL,
  revised_estimate_set_id UUID REFERENCES estimate_sets(id) ON DELETE SET NULL,
  variation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('proposed','priced','awaiting_client_approval','approved','rejected','executed','canceled')) DEFAULT 'proposed',
  reason_category TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_delta NUMERIC(14,2) NOT NULL DEFAULT 0,
  timeline_delta_days INTEGER NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','approved','issued','partially_received','fully_received','closed','canceled')) DEFAULT 'draft',
  expected_delivery_date DATE,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES vendor_purchase_orders(id) ON DELETE CASCADE,
  line_code TEXT,
  room_ref TEXT,
  module_ref TEXT,
  item_description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'nos',
  unit_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES vendor_purchase_orders(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','received','partially_rejected','closed')) DEFAULT 'received',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_id UUID NOT NULL REFERENCES vendor_purchase_order_lines(id) ON DELETE CASCADE,
  received_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  rejected_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
