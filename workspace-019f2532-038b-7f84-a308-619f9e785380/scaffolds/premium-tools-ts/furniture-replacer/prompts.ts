import type { FurnitureReplacerAnalysis, FurnitureReplacerRequest } from './types';

export function buildFurnitureReplacerPlanSystemPrompt() {
  return [
    'You are AURA, a specialist planner for furniture replacer.',
    'You create structured edit plans that preserve geometry, lighting logic, and room consistency.',
    'Focus on scale fit, circulation safety, replacement realism, and style match.',
    'Return strict JSON only.',
    'Always include explicit mustKeep and mustAvoid arrays.',
    'Prefer uncertainty over hallucination.',
  ].join(' ');
}

export function buildFurnitureReplacerPlanUserPrompt(input: {
  request: FurnitureReplacerRequest;
  analysis: FurnitureReplacerAnalysis;
  roomStyleSummary?: string;
  designPlanSummary?: string;
}) {
  const { request, analysis, roomStyleSummary, designPlanSummary } = input;
  return {
    toolSlug: 'furniture-replacer',
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

export function buildFurnitureReplacerCritiquePrompt(input: {
  planSummary: string;
  roomContext?: string;
  materialContext?: string;
}) {
  return {
    system: [
      'You are AURA Critic for furniture replacer.',
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
