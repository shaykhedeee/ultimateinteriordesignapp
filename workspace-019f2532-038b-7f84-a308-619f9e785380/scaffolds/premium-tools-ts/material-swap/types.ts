import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type MaterialSwapSubjectType = 'panel_surface' | 'countertop' | 'backsplash' | 'upholstery' | 'stone_cladding' | 'metal_detail' | 'tile_surface' | 'unknown';

export type MaterialSwapConfiguration = {
  targetMaterial: MaterialReference;
currentMaterialHint?: string;
preserveSeams?: boolean;
preserveHardware?: boolean;
preserveReflections?: boolean;
finishBlendMode?: 'strict' | 'balanced' | 'stylized';
};

export type MaterialSwapRequest = BaseEditRequest & {
  toolSlug: 'material-swap';
  subjectType: MaterialSwapSubjectType;
  configuration: MaterialSwapConfiguration;
};

export type MaterialSwapAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type MaterialSwapPlan = BaseEditPlan & {
  targetMaterialSummary: string;
blendingStrategy: 'strict' | 'balanced' | 'stylized';
compatibilityNotes: string[];
};

export type MaterialSwapCritique = BaseCritique & {
  materialBelievability: number; styleAlignment: number;
};

export type MaterialSwapPreview = {
  request: MaterialSwapRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type MaterialSwapResult = BaseEditResult & {
  subjectType: MaterialSwapSubjectType;
};
