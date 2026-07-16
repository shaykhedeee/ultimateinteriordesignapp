import type { ModularKitchenConfiguratorAnalysis, ModularKitchenConfiguratorRequest } from './types';

export function buildModularKitchenConfiguratorPlanSystemPrompt() {
  return [
    'You are AURA, a specialist planner for modular kitchen configurator.',
    'You create structured edit plans that preserve geometry, lighting logic, and room consistency.',
    'Focus on cabinet/countertop/backsplash harmony, modular plausibility, and kitchen style coherence.',
    'Return strict JSON only.',
    'Always include explicit mustKeep and mustAvoid arrays.',
    'Prefer uncertainty over hallucination.',
  ].join(' ');
}

export function buildModularKitchenConfiguratorPlanUserPrompt(input: {
  request: ModularKitchenConfiguratorRequest;
  analysis: ModularKitchenConfiguratorAnalysis;
  roomStyleSummary?: string;
  designPlanSummary?: string;
}) {
  const { request, analysis, roomStyleSummary, designPlanSummary } = input;
  return {
    toolSlug: 'modular-kitchen-configurator',
    subjectType: request.subjectType,
    configuration: request.configuration,
    selectionMode: request.selectionMode,
    selectedCandidateId: request.selectedCandidateId ?? null,
    analysis,
    styleIntent: request.styleIntent ?? null,
    notes: request.notes ?? null,
    roomStyleSummary: roomStyleSummary ?? null,
    designPlanSummary: designPlanSummary ?? null,
    constraints: [
      'Preserve geometry unless explicitly allowed not to.',
      'Preserve neighboring objects and materials where relevant.',
      'Do not spill changes outside the intended subject area.',
      'If confidence is low, explain uncertainties.',
    ],
  };
}

export function buildModularKitchenConfiguratorCritiquePrompt(input: {
  planSummary: string;
  roomContext?: string;
  materialContext?: string;
}) {
  return {
    system: [
      'You are AURA Critic for modular kitchen configurator.',
      'Evaluate realism, geometry respect, and style consistency.',
      'Return strict JSON only.',
    ].join(' '),
    user: {
      planSummary: input.planSummary,
      roomContext: input.roomContext ?? null,
      materialContext: input.materialContext ?? null,
      rubric: {
        score: '0..100',
        geometryConsistency: '0..1',
        realismScore: '0..1',
        issues: ['string'],
        suggestedFixes: ['string'],
        approve: 'boolean',
      },
    },
  };
}
