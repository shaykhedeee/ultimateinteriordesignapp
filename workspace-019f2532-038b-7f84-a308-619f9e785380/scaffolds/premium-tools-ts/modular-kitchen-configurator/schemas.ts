import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const ModularKitchenConfiguratorSubjectTypeSchema = z.enum(["finish_only", "finish_stack", "layout_aware_concept", "island_variant", "unknown"]);

export const ModularKitchenConfiguratorConfigurationSchema = z.object({
  mode: z.enum(['finish_only', 'finish_stack', 'layout_aware_concept', 'island_variant']),
  cabinetFinish: MaterialReferenceSchema.optional(),
  countertopFinish: MaterialReferenceSchema.optional(),
  backsplashFinish: MaterialReferenceSchema.optional(),
  handleStrategy: z.enum(['profile', 'knob', 'bar', 'handleless']).optional(),
  applianceStrategy: z.enum(['retain', 'integrate', 'upgrade_visual_only']).optional(),
});

export const ModularKitchenConfiguratorRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('modular-kitchen-configurator'),
  subjectType: ModularKitchenConfiguratorSubjectTypeSchema,
  configuration: ModularKitchenConfiguratorConfigurationSchema,
});

export const ModularKitchenConfiguratorAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const ModularKitchenConfiguratorPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  kitchenSummary: z.string().min(1),
  finishStackNotes: z.array(z.string()),
  ergonomicsWarnings: z.array(z.string()),
});

export const ModularKitchenConfiguratorCritiqueSchema = BaseCritiqueSchema.extend({
  finishCoherence: z.number().min(0).max(1),
  kitchenPlausibility: z.number().min(0).max(1),
});

export const ModularKitchenConfiguratorPreviewSchema = z.object({
  request: ModularKitchenConfiguratorRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const ModularKitchenConfiguratorResultSchema = BaseEditResultSchema.extend({
  subjectType: ModularKitchenConfiguratorSubjectTypeSchema,
});

export type ModularKitchenConfiguratorRequestInput = z.infer<typeof ModularKitchenConfiguratorRequestSchema>;
export type ModularKitchenConfiguratorAnalysisOutput = z.infer<typeof ModularKitchenConfiguratorAnalysisSchema>;
export type ModularKitchenConfiguratorPlanOutput = z.infer<typeof ModularKitchenConfiguratorPlanSchema>;
export type ModularKitchenConfiguratorCritiqueOutput = z.infer<typeof ModularKitchenConfiguratorCritiqueSchema>;
export type ModularKitchenConfiguratorResultOutput = z.infer<typeof ModularKitchenConfiguratorResultSchema>;
