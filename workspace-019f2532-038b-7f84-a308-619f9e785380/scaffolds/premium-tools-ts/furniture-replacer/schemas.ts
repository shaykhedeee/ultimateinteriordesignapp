import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const FurnitureReplacerSubjectTypeSchema = z.enum(["sofa", "chair", "coffee_table", "dining_table", "bed", "side_table", "console", "storage_unit", "unknown"]);

export const FurnitureReplacerConfigurationSchema = z.object({
  replacementProduct: ProductReferenceSchema,
  currentObjectHint: z.string().optional(),
  fitPriority: z.enum(['style', 'scale', 'circulation']).default('scale'),
  preservePlacement: z.boolean().default(true),
  allowRepositionWithinZone: z.boolean().default(false),
});

export const FurnitureReplacerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('furniture-replacer'),
  subjectType: FurnitureReplacerSubjectTypeSchema,
  configuration: FurnitureReplacerConfigurationSchema,
});

export const FurnitureReplacerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const FurnitureReplacerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  replacementSummary: z.string().min(1),
  fitNotes: z.array(z.string()),
  circulationNotes: z.array(z.string()),
});

export const FurnitureReplacerCritiqueSchema = BaseCritiqueSchema.extend({
  scaleFit: z.number().min(0).max(1),
  styleAlignment: z.number().min(0).max(1),
  circulationSafety: z.number().min(0).max(1),
});

export const FurnitureReplacerPreviewSchema = z.object({
  request: FurnitureReplacerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const FurnitureReplacerResultSchema = BaseEditResultSchema.extend({
  subjectType: FurnitureReplacerSubjectTypeSchema,
});

export type FurnitureReplacerRequestInput = z.infer<typeof FurnitureReplacerRequestSchema>;
export type FurnitureReplacerAnalysisOutput = z.infer<typeof FurnitureReplacerAnalysisSchema>;
export type FurnitureReplacerPlanOutput = z.infer<typeof FurnitureReplacerPlanSchema>;
export type FurnitureReplacerCritiqueOutput = z.infer<typeof FurnitureReplacerCritiqueSchema>;
export type FurnitureReplacerResultOutput = z.infer<typeof FurnitureReplacerResultSchema>;
