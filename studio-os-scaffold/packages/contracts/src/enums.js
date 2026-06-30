export const USER_ROLES = [
    'admin',
    'owner',
    'designer',
    'sales_designer',
    'estimator',
    'production_manager',
    'site_exec',
    'client_viewer',
];
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
];
export const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'archived'];
export const BUDGET_BANDS = ['economy', 'standard', 'premium', 'luxury', 'ultra_luxury_bespoke'];
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
];
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
];
export const SCENE_BRANCHES = ['main'];
export const RENDER_TIERS = ['draft', 'review', 'final'];
export const APPROVAL_STATUS = ['pending', 'shortlisted', 'approved', 'rejected'];
export const DRAWING_TYPES = ['floor_plan', 'elevation', 'ceiling_plan', 'schedule_sheet', 'section'];
export const RULE_SEVERITIES = ['hard', 'soft', 'advisory', 'score'];
export const RULE_STATUSES = ['pass', 'warn', 'fail'];
export const ESTIMATE_TYPES = ['rough', 'budget_fit', 'concept', 'boq_quote', 'final_quote', 'variation_quote'];
export const ESTIMATE_STATUSES = ['draft', 'shared', 'revised', 'approved', 'rejected', 'superseded'];
export const INVOICE_TYPES = ['proforma', 'advance', 'milestone', 'tax', 'final', 'credit_note', 'debit_note'];
export const INVOICE_STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'];
export const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'cash', 'card', 'upi', 'emi_partner', 'finance_partner', 'other'];
export const PAYMENT_STATUSES = ['recorded', 'cleared', 'bounced', 'reversed', 'refunded'];
export const VARIATION_STATUSES = ['proposed', 'priced', 'awaiting_client_approval', 'approved', 'rejected', 'executed', 'canceled'];
export const PURCHASE_ORDER_STATUSES = ['draft', 'approved', 'issued', 'partially_received', 'fully_received', 'closed', 'canceled'];
export const JOB_STATUSES = ['queued', 'running', 'waiting_for_input', 'succeeded', 'failed', 'canceled', 'stale'];
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
];
