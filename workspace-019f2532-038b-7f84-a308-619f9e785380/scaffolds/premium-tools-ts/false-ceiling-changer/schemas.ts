import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const FalseCeilingChangerSubjectTypeSchema = z.enum(["finish_change", "minimal_cove", "luxury_cove", "slat_ceiling", "shadow_gap", "unknown"]);

export const FalseCeilingChangerConfigurationSchema = z.object({
  ceilingStyle: z.enum(['finish_change', 'minimal_cove', 'luxury_cove', 'slat_ceiling', 'shadow_gap']),
  finishMaterial: MaterialReferenceSchema.optional(),
  coveLightingMode: z.enum(['off', 'warm_ambient', 'neutral_ambient']).optional(),
  keepFixtureLayout: z.boolean().default(true),
  redesignIntensity: z.enum(['subtle', 'moderate', 'dramatic']).default('subtle'),
});

export const FalseCeilingChangerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('false-ceiling-changer'),
  subjectType: FalseCeilingChangerSubjectTypeSchema,
  configuration: FalseCeilingChangerConfigurationSchema,
});

export const FalseCeilingChangerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const FalseCeilingChangerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  ceilingSummary: z.string().min(1),
  spatialRisk: z.enum(['low', 'medium', 'high']),
  fixtureNotes: z.array(z.string()),
});

export const FalseCeilingChangerCritiqueSchema = BaseCritiqueSchema.extend({
  architecturalPlausibility: z.number().min(0).max(1),
  lightingIntegration: z.number().min(0).max(1),
});

export const FalseCeilingChangerPreviewSchema = z.object({
  request: FalseCeilingChangerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const FalseCeilingChangerResultSchema = BaseEditResultSchema.extend({
  subjectType: FalseCeilingChangerSubjectTypeSchema,
});

export type FalseCeilingChangerRequestInput = z.infer<typeof FalseCeilingChangerRequestSchema>;
export type FalseCeilingChangerAnalysisOutput = z.infer<typeof FalseCeilingChangerAnalysisSchema>;
export type FalseCeilingChangerPlanOutput = z.infer<typeof FalseCeilingChangerPlanSchema>;
export type FalseCeilingChangerCritiqueOutput = z.infer<typeof FalseCeilingChangerCritiqueSchema>;
export type FalseCeilingChangerResultOutput = z.infer<typeof FalseCeilingChangerResultSchema>;
