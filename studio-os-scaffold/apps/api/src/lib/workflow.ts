import type { ProjectRecord } from './mock-store';
import type { ProjectStage } from '@studio/contracts';

export const stageOrder: ProjectStage[] = [
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

export const stageNextAction: Record<ProjectStage, string> = {
  draft: 'qualify_lead',
  lead_qualified: 'start_intake',
  intake_in_progress: 'complete_intake',
  intake_complete: 'start_site_capture',
  site_capture: 'upload_plan',
  plan_analysis_review: 'resolve_review_items',
  scene_ready: 'start_design',
  design_in_progress: 'generate_renders_and_estimates',
  render_review: 'shortlist_render_variant',
  proposal_review: 'generate_final_quote_and_proposal',
  client_approval_pending: 'collect_client_approval',
  design_approved: 'prepare_production_basis',
  production_preparation: 'issue_purchase_orders_and_bom',
  production_ready: 'complete_installation_and_handover',
  delivered: 'collect_testimonial_and_warranty_activation',
};

export function calculateReadiness(project: ProjectRecord): ProjectRecord['readiness'] {
  const checks = {
    intakeComplete: stageOrder.indexOf(project.stage) >= stageOrder.indexOf('intake_complete'),
    siteCaptureComplete: stageOrder.indexOf(project.stage) >= stageOrder.indexOf('site_capture'),
    planReviewed: stageOrder.indexOf(project.stage) >= stageOrder.indexOf('scene_ready'),
    sceneReady: stageOrder.indexOf(project.stage) >= stageOrder.indexOf('scene_ready'),
    hasEstimate: (project.counts?.estimates ?? 0) > 0,
    hasDrawings: (project.counts?.drawings ?? 0) > 0,
    hasRenders: (project.counts?.renders ?? 0) > 0,
  };

  const score = Math.min(
    100,
    Object.values(checks).filter(Boolean).length * 12 + stageOrder.indexOf(project.stage) * 2
  );

  return {
    stage: project.stage,
    score,
    checks,
    nextRequiredAction: stageNextAction[project.stage],
  };
}

export function canTransition(current: ProjectStage, next: ProjectStage) {
  return stageOrder.indexOf(next) >= stageOrder.indexOf(current);
}
