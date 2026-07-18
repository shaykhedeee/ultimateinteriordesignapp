import type { BaseCritique, BaseEditPlan, BaseEditRequest, BaseEditResult, DesignContextSnapshot, MaterialReference, ProductReference, ToolSurfaceCandidate } from '../shared/common-types';

export type ModularKitchenConfiguratorSubjectType = 'finish_only' | 'finish_stack' | 'layout_aware_concept' | 'island_variant' | 'unknown';

export type ModularKitchenConfiguratorConfiguration = {
  mode: 'finish_only' | 'finish_stack' | 'layout_aware_concept' | 'island_variant';
cabinetFinish?: MaterialReference;
countertopFinish?: MaterialReference;
backsplashFinish?: MaterialReference;
handleStrategy?: 'profile' | 'knob' | 'bar' | 'handleless';
applianceStrategy?: 'retain' | 'integrate' | 'upgrade_visual_only';
};

export type ModularKitchenConfiguratorRequest = BaseEditRequest & {
  toolSlug: 'modular-kitchen-configurator';
  subjectType: ModularKitchenConfiguratorSubjectType;
  configuration: ModularKitchenConfiguratorConfiguration;
};

export type ModularKitchenConfiguratorAnalysis = {
  selectedCandidate: ToolSurfaceCandidate | null;
  candidateSubjects: ToolSurfaceCandidate[];
  contextNotes: string[];
  neighboringObjects: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
};

export type ModularKitchenConfiguratorPlan = BaseEditPlan & {
  kitchenSummary: string;
finishStackNotes: string[];
ergonomicsWarnings: string[];
};

export type ModularKitchenConfiguratorCritique = BaseCritique & {
  finishCoherence: number; kitchenPlausibility: number;
};

export type ModularKitchenConfiguratorPreview = {
  request: ModularKitchenConfiguratorRequest;
  designContext?: DesignContextSnapshot | null;
  warnings: string[];
  recommendedNextStep: 'preview' | 'manual_confirm' | 'queue';
};

export type ModularKitchenConfiguratorResult = BaseEditResult & {
  subjectType: ModularKitchenConfiguratorSubjectType;
};
