import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type FurnitureReplacerSubjectType = 'sofa' | 'chair' | 'coffee_table' | 'dining_table' | 'bed' | 'side_table' | 'console' | 'storage_unit' | 'unknown';

export type FurnitureReplacerConfiguration = {
  replacementProduct: ProductReference;
currentObjectHint?: string;
fitPriority?: 'style' | 'scale' | 'circulation';
preservePlacement?: boolean;
allowRepositionWithinZone?: boolean;
};

export type FurnitureReplacerRequest = BaseEditRequest & {
  toolSlug: 'furniture-replacer';
  subjectType: FurnitureReplacerSubjectType;
  configuration: FurnitureReplacerConfiguration;
};

export type FurnitureReplacerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type FurnitureReplacerPlan = BaseEditPlan & {
  replacementSummary: string;
fitNotes: string[];
circulationNotes: string[];
};

export type FurnitureReplacerCritique = BaseCritique & {
  scaleFit: number; styleAlignment: number; circulationSafety: number;
};

export type FurnitureReplacerPreview = {
  request: FurnitureReplacerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type FurnitureReplacerResult = BaseEditResult & {
  subjectType: FurnitureReplacerSubjectType;
};
