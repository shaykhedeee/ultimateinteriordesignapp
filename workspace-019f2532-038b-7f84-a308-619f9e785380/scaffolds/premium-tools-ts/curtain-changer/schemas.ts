import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const CurtainChangerSubjectTypeSchema = z.enum(["sheer_curtain", "blackout_drape", "ripple_fold", "roman_blind", "roller_blind", "venetian_blind", "unknown"]);

export const CurtainChangerConfigurationSchema = z.object({
  curtainType: z.enum(['sheer_curtain', 'blackout_drape', 'ripple_fold', 'roman_blind', 'roller_blind', 'venetian_blind']),
  fabricMaterial: MaterialReferenceSchema,
  opacityLevel: z.enum(['light', 'medium', 'heavy']).optional(),
  openState: z.enum(['open', 'closed', 'half_open']).default('closed'),
  preserveRodOrTrack: z.boolean().default(true),
});

export const CurtainChangerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('curtain-changer'),
  subjectType: CurtainChangerSubjectTypeSchema,
  configuration: CurtainChangerConfigurationSchema,
});

export const CurtainChangerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const CurtainChangerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  curtainSummary: z.string().min(1),
  daylightImpact: z.array(z.string()),
  foldBehaviorNotes: z.array(z.string()),
});

export const CurtainChangerCritiqueSchema = BaseCritiqueSchema.extend({
  fabricBelievability: z.number().min(0).max(1),
  daylightConsistency: z.number().min(0).max(1),
});

export const CurtainChangerPreviewSchema = z.object({
  request: CurtainChangerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const CurtainChangerResultSchema = BaseEditResultSchema.extend({
  subjectType: CurtainChangerSubjectTypeSchema,
});

export type CurtainChangerRequestInput = z.infer<typeof CurtainChangerRequestSchema>;
export type CurtainChangerAnalysisOutput = z.infer<typeof CurtainChangerAnalysisSchema>;
export type CurtainChangerPlanOutput = z.infer<typeof CurtainChangerPlanSchema>;
export type CurtainChangerCritiqueOutput = z.infer<typeof CurtainChangerCritiqueSchema>;
export type CurtainChangerResultOutput = z.infer<typeof CurtainChangerResultSchema>;
