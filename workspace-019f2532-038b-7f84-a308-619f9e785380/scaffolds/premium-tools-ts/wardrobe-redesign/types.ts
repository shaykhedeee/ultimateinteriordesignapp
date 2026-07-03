import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type WardrobeRedesignSubjectType = 'finish_refresh' | 'shutter_redesign' | 'mirror_variant' | 'premium_concept' | 'unknown';

export type WardrobeRedesignConfiguration = {
  redesignMode: 'finish_refresh' | 'shutter_redesign' | 'mirror_variant' | 'premium_concept';
shutterStyle?: 'flat' | 'fluted' | 'framed' | 'mirrored' | 'panel_rhythm';
finishMaterial?: MaterialReference;
handleStrategy?: 'profile' | 'bar' | 'push_to_open' | 'handleless';
mirrorCoverage?: 'none' | 'partial' | 'full';
};

export type WardrobeRedesignRequest = BaseEditRequest & {
  toolSlug: 'wardrobe-redesign';
  subjectType: WardrobeRedesignSubjectType;
  configuration: WardrobeRedesignConfiguration;
};

export type WardrobeRedesignAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type WardrobeRedesignPlan = BaseEditPlan & {
  wardrobeSummary: string;
panelRhythmNotes: string[];
paletteFitNotes: string[];
};

export type WardrobeRedesignCritique = BaseCritique & {
  joineryBelievability: number; styleAlignment: number;
};

export type WardrobeRedesignPreview = {
  request: WardrobeRedesignRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type WardrobeRedesignResult = BaseEditResult & {
  subjectType: WardrobeRedesignSubjectType;
};
