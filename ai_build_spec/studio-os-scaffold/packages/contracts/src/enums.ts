export const USER_ROLES = [
  'admin',
  'owner',
  'designer',
  'sales_designer',
  'estimator',
  'production_manager',
  'site_exec',
  'client_viewer',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_STAGES = [
  'draft',
  'lead_qualified',
  'intake_in_progress',
  'intake_complete',
  'site_capture',
  'plan_analysis_review',
  'scene_ready',
  'design_in_progress',
  'render_review',
  'proposal_review',
  'client_approval_pending',
  'design_approved',
  'production_preparation',
  'production_ready',
  'delivered',
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const BUDGET_BANDS = ['economy', 'standard', 'premium', 'luxury', 'ultra_luxury_bespoke'] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export const ROOM_TYPES = [
  'foyer',
  'living_room',
  'dining_room',
  'kitchen',
  'utility',
  'master_bedroom',
  'bedroom',
  'kids_bedroom',
  'guest_bedroom',
  'study',
  'balcony',
  'bathroom',
  'powder_room',
  'mandir_room',
  'passage',
  'office_cabin',
  'workstation_area',
  'reception',
  'showroom_zone',
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const MODULE_TYPES = [
  'kitchen_base_run',
  'kitchen_wall_run',
  'kitchen_tall_unit',
  'kitchen_sink_unit',
  'kitchen_hob_unit',
  'kitchen_island',
  'wardrobe_swing',
  'wardrobe_sliding',
  'loft_storage',
  'tv_unit',
  'feature_wall_panel_system',
  'mandir_floor_unit',
  'mandir_wall_unit',
  'crockery_unit',
  'study_desk',
  'shoe_rack',
  'vanity_unit',
  'utility_storage',
  'false_ceiling_system',
] as const;
export type ModuleType = (typeof MODULE_TYPES)[number];

export const SCENE_BRANCHES = ['main'] as const;
export type SceneBranch = string;

export const RENDER_TIERS = ['draft', 'review', 'final'] as const;
export type RenderTier = (typeof RENDER_TIERS)[number];

export const APPROVAL_STATUS = ['pending', 'shortlisted', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUS)[number];

export const DRAWING_TYPES = ['floor_plan', 'elevation', 'ceiling_plan', 'schedule_sheet', 'section'] as const;
export type DrawingType = (typeof DRAWING_TYPES)[number];

export const RULE_SEVERITIES = ['hard', 'soft', 'advisory', 'score'] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const RULE_STATUSES = ['pass', 'warn', 'fail'] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export const ESTIMATE_TYPES = ['rough', 'budget_fit', 'concept', 'boq_quote', 'final_quote', 'variation_quote'] as const;
export type EstimateType = (typeof ESTIMATE_TYPES)[number];

export const ESTIMATE_STATUSES = ['draft', 'shared', 'revised', 'approved', 'rejected', 'superseded'] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const INVOICE_TYPES = ['proforma', 'advance', 'milestone', 'tax', 'final', 'credit_note', 'debit_note'] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'cash', 'card', 'upi', 'emi_partner', 'finance_partner', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['recorded', 'cleared', 'bounced', 'reversed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VARIATION_STATUSES = ['proposed', 'priced', 'awaiting_client_approval', 'approved', 'rejected', 'executed', 'canceled'] as const;
export type VariationStatus = (typeof VARIATION_STATUSES)[number];

export const PURCHASE_ORDER_STATUSES = ['draft', 'approved', 'issued', 'partially_received', 'fully_received', 'closed', 'canceled'] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const JOB_STATUSES = ['queued', 'running', 'waiting_for_input', 'succeeded', 'failed', 'canceled', 'stale'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = [
  'floor_plan_interpretation',
  'floor_plan_review_package',
  'scene_shell_generation',
  'scene_validation',
  'pricing_generation',
  'render_generation',
  'drawing_generation',
  'proposal_export',
  'bom_generation',
  'cutlist_generation',
  'deliverables_packaging',
  'similarity_indexing',
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;
