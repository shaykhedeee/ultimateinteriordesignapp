import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const LightingMoodChangerSubjectTypeSchema = z.enum(["natural_daylight", "warm_evening", "luxury_ambient", "soft_hospitality", "cool_gallery", "cinematic_dramatic"]);

export const LightingMoodChangerConfigurationSchema = z.object({
  moodPreset: z.enum(['natural_daylight', 'warm_evening', 'luxury_ambient', 'soft_hospitality', 'cool_gallery', 'cinematic_dramatic']),
  intensityLevel: z.number().min(0).max(1).optional(),
  warmthLevel: z.number().min(0).max(1).optional(),
  keepNaturalWindowLogic: z.boolean().default(true),
  preserveFixtureVisibility: z.boolean().default(true),
});

export const LightingMoodChangerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('lighting-mood-changer'),
  subjectType: LightingMoodChangerSubjectTypeSchema,
  configuration: LightingMoodChangerConfigurationSchema,
});

export const LightingMoodChangerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const LightingMoodChangerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  lightingSummary: z.string().min(1),
  moodShiftNotes: z.array(z.string()),
  materialImpactNotes: z.array(z.string()),
});

export const LightingMoodChangerCritiqueSchema = BaseCritiqueSchema.extend({
  lightingConsistency: z.number().min(0).max(1),
  moodClarity: z.number().min(0).max(1),
});

export const LightingMoodChangerPreviewSchema = z.object({
  request: LightingMoodChangerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const LightingMoodChangerResultSchema = BaseEditResultSchema.extend({
  subjectType: LightingMoodChangerSubjectTypeSchema,
});

export type LightingMoodChangerRequestInput = z.infer<typeof LightingMoodChangerRequestSchema>;
export type LightingMoodChangerAnalysisOutput = z.infer<typeof LightingMoodChangerAnalysisSchema>;
export type LightingMoodChangerPlanOutput = z.infer<typeof LightingMoodChangerPlanSchema>;
export type LightingMoodChangerCritiqueOutput = z.infer<typeof LightingMoodChangerCritiqueSchema>;
export type LightingMoodChangerResultOutput = z.infer<typeof LightingMoodChangerResultSchema>;
