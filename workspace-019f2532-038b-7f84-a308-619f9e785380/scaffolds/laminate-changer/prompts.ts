import type { LaminateChangeRequest, SurfaceAnalysis } from './types';

export function buildLaminatePlanSystemPrompt() {
  return [
    'You are AURA, an interior-finish edit planner specialized in laminate, veneer, panel, and cladding changes.',
    'Your task is to create a safe and realistic edit plan for changing one surface finish inside a rendered interior scene.',
    'You must preserve geometry, lighting logic, panel lines, room style, and neighboring materials.',
    'You are not doing exact geometry extraction. You are planning a realistic visual edit.',
    'Output strict JSON only.',
    'Always include explicit mustKeep and mustAvoid arrays.',
    'Prefer uncertainty over hallucination.',
  ].join(' ');
}

export function buildLaminatePlanUserPrompt(input: {
  request: LaminateChangeRequest;
  surfaceAnalysis: SurfaceAnalysis;
  roomStyleSummary?: string;
  designPlanSummary?: string;
}) {
  const { request, surfaceAnalysis, roomStyleSummary, designPlanSummary } = input;

  return {
    requestContext: {
      selectionMode: request.selectionMode,
      requestedSurfaceType: request.surfaceType ?? 'unknown',
      selectedSurfaceId: request.selectedSurfaceId ?? null,
      preserveHardware: request.preserveHardware ?? true,
      preserveSeams: request.preserveSeams ?? true,
      preserveShadows: request.preserveShadows ?? true,
      preserveReflections: request.preserveReflections ?? true,
      notes: request.notes ?? null,
      styleIntent: request.styleIntent ?? null,
    },
    selectedMaterial: request.material,
    surfaceAnalysis,
    roomStyleSummary: roomStyleSummary ?? null,
    designPlanSummary: designPlanSummary ?? null,
    outputSchema: {
      editIntent: 'string',
      targetSurfaceType: 'enum',
      materialSummary: 'string',
      grainDirection: 'enum',
      finishType: 'enum',
      preserveInstructions: ['string'],
      mustKeep: ['string'],
      mustAvoid: ['string'],
      roomConsistencyNotes: ['string'],
      riskFlags: ['string'],
      editPrompt: 'string',
      negativePrompt: 'string',
      confidence: '0..1',
      uncertainties: ['string'],
    },
    constraints: [
      'Do not change room geometry.',
      'Do not invent new joinery or panel segmentation unless required by visible seam logic.',
      'Do not alter surrounding walls, flooring, handles, or mirrors unless requested.',
      'Respect vertical/horizontal grain cues when visible.',
      'If lighting mismatch is likely, mention it in riskFlags.',
    ],
  };
}

export function buildLaminateCritiquePrompt(input: {
  planSummary: string;
  roomContext?: string;
  materialContext?: string;
}) {
  return {
    system: [
      'You are AURA Critic, an interior-finish realism reviewer.',
      'Evaluate whether a laminate change looks believable, aligned with the requested style, and respectful of geometry and panel logic.',
      'Return strict JSON only.',
    ].join(' '),
    user: {
      planSummary: input.planSummary,
      roomContext: input.roomContext ?? null,
      materialContext: input.materialContext ?? null,
      rubric: {
        score: '0..100',
        realismScore: '0..1',
        materialBelievability: '0..1',
        geometryConsistency: '0..1',
        issues: ['string'],
        suggestedFixes: ['string'],
        approve: 'boolean',
      },
      rules: [
        'Call out fake grain direction, stretched texture, broken panel seams, mismatched reflections, or unrealistic gloss.',
        'Do not approve if the changed surface spills into adjacent geometry.',
      ],
    },
  };
}
