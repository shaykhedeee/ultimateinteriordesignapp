import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type FlooringChangerSubjectType = 'wood_plank' | 'herringbone' | 'stone_slab' | 'porcelain_tile' | 'microcement' | 'carpet_field' | 'unknown';

export type FlooringChangerConfiguration = {
  flooringFamily: 'wood_plank' | 'herringbone' | 'stone_slab' | 'porcelain_tile' | 'microcement' | 'carpet_field';
targetMaterial: MaterialReference;
plankOrTileDirection?: 'parallel' | 'perpendicular' | 'diagonal' | 'herringbone';
tileSizeMm?: number;
groutColor?: string;
preserveSkirting?: boolean;
};

export type FlooringChangerRequest = BaseEditRequest & {
  toolSlug: 'flooring-changer';
  subjectType: FlooringChangerSubjectType;
  configuration: FlooringChangerConfiguration;
};

export type FlooringChangerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type FlooringChangerPlan = BaseEditPlan & {
  flooringSummary: string;
perspectiveRisk: 'low' | 'medium' | 'high';
continuityNotes: string[];
};

export type FlooringChangerCritique = BaseCritique & {
  perspectiveIntegrity: number; scaleBelievability: number;
};

export type FlooringChangerPreview = {
  request: FlooringChangerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type FlooringChangerResult = BaseEditResult & {
  subjectType: FlooringChangerSubjectType;
};
