import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type LightingMoodChangerSubjectType = 'natural_daylight' | 'warm_evening' | 'luxury_ambient' | 'soft_hospitality' | 'cool_gallery' | 'cinematic_dramatic';

export type LightingMoodChangerConfiguration = {
  moodPreset: 'natural_daylight' | 'warm_evening' | 'luxury_ambient' | 'soft_hospitality' | 'cool_gallery' | 'cinematic_dramatic';
intensityLevel?: number;
warmthLevel?: number;
keepNaturalWindowLogic?: boolean;
preserveFixtureVisibility?: boolean;
};

export type LightingMoodChangerRequest = BaseEditRequest & {
  toolSlug: 'lighting-mood-changer';
  subjectType: LightingMoodChangerSubjectType;
  configuration: LightingMoodChangerConfiguration;
};

export type LightingMoodChangerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type LightingMoodChangerPlan = BaseEditPlan & {
  lightingSummary: string;
moodShiftNotes: string[];
materialImpactNotes: string[];
};

export type LightingMoodChangerCritique = BaseCritique & {
  lightingConsistency: number; moodClarity: number;
};

export type LightingMoodChangerPreview = {
  request: LightingMoodChangerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type LightingMoodChangerResult = BaseEditResult & {
  subjectType: LightingMoodChangerSubjectType;
};
