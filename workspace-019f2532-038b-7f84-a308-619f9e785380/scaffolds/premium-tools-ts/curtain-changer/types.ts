import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type CurtainChangerSubjectType = 'sheer_curtain' | 'blackout_drape' | 'ripple_fold' | 'roman_blind' | 'roller_blind' | 'venetian_blind' | 'unknown';

export type CurtainChangerConfiguration = {
  curtainType: 'sheer_curtain' | 'blackout_drape' | 'ripple_fold' | 'roman_blind' | 'roller_blind' | 'venetian_blind';
fabricMaterial: MaterialReference;
opacityLevel?: 'light' | 'medium' | 'heavy';
openState?: 'open' | 'closed' | 'half_open';
preserveRodOrTrack?: boolean;
};

export type CurtainChangerRequest = BaseEditRequest & {
  toolSlug: 'curtain-changer';
  subjectType: CurtainChangerSubjectType;
  configuration: CurtainChangerConfiguration;
};

export type CurtainChangerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type CurtainChangerPlan = BaseEditPlan & {
  curtainSummary: string;
daylightImpact: string[];
foldBehaviorNotes: string[];
};

export type CurtainChangerCritique = BaseCritique & {
  fabricBelievability: number; daylightConsistency: number;
};

export type CurtainChangerPreview = {
  request: CurtainChangerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type CurtainChangerResult = BaseEditResult & {
  subjectType: CurtainChangerSubjectType;
};
