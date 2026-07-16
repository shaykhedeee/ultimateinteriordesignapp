import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type FalseCeilingChangerSubjectType = 'finish_change' | 'minimal_cove' | 'luxury_cove' | 'slat_ceiling' | 'shadow_gap' | 'unknown';

export type FalseCeilingChangerConfiguration = {
  ceilingStyle: 'finish_change' | 'minimal_cove' | 'luxury_cove' | 'slat_ceiling' | 'shadow_gap';
finishMaterial?: MaterialReference;
coveLightingMode?: 'off' | 'warm_ambient' | 'neutral_ambient';
keepFixtureLayout?: boolean;
redesignIntensity?: 'subtle' | 'moderate' | 'dramatic';
};

export type FalseCeilingChangerRequest = BaseEditRequest & {
  toolSlug: 'false-ceiling-changer';
  subjectType: FalseCeilingChangerSubjectType;
  configuration: FalseCeilingChangerConfiguration;
};

export type FalseCeilingChangerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type FalseCeilingChangerPlan = BaseEditPlan & {
  ceilingSummary: string;
spatialRisk: 'low' | 'medium' | 'high';
fixtureNotes: string[];
};

export type FalseCeilingChangerCritique = BaseCritique & {
  architecturalPlausibility: number; lightingIntegration: number;
};

export type FalseCeilingChangerPreview = {
  request: FalseCeilingChangerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type FalseCeilingChangerResult = BaseEditResult & {
  subjectType: FalseCeilingChangerSubjectType;
};
