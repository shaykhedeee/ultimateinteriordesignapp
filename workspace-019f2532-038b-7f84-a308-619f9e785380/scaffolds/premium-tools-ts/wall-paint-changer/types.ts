import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type WallPaintChangerSubjectType = 'accent_wall' | 'all_walls' | 'wall_panel_zone' | 'trimmed_wall' | 'unknown';

export type WallPaintChangerConfiguration = {
  paintName: string;
colorHex?: string;
undertone?: 'warm' | 'cool' | 'neutral';
finishType?: 'matte' | 'eggshell' | 'satin';
scopeMode?: 'single_wall' | 'whole_room';
protectTrim?: boolean;
};

export type WallPaintChangerRequest = BaseEditRequest & {
  toolSlug: 'wall-paint-changer';
  subjectType: WallPaintChangerSubjectType;
  configuration: WallPaintChangerConfiguration;
};

export type WallPaintChangerAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type WallPaintChangerPlan = BaseEditPlan & {
  paintSummary: string;
brightnessImpact: 'lighter' | 'darker' | 'balanced';
roomMoodShift: string[];
};

export type WallPaintChangerCritique = BaseCritique & {
  toneBalance: number; daylightConsistency: number;
};

export type WallPaintChangerPreview = {
  request: WallPaintChangerRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type WallPaintChangerResult = BaseEditResult & {
  subjectType: WallPaintChangerSubjectType;
};
