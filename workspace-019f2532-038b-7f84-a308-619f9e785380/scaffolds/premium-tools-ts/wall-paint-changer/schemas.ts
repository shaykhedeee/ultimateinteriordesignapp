import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const WallPaintChangerSubjectTypeSchema = z.enum(["accent_wall", "all_walls", "wall_panel_zone", "trimmed_wall", "unknown"]);

export const WallPaintChangerConfigurationSchema = z.object({
  paintName: z.string().min(1),
  colorHex: z.string().regex(/^#?[0-9A-Fa-f]{6}$/).optional(),
  undertone: z.enum(['warm', 'cool', 'neutral']).optional(),
  finishType: z.enum(['matte', 'eggshell', 'satin']).optional(),
  scopeMode: z.enum(['single_wall', 'whole_room']).default('single_wall'),
  protectTrim: z.boolean().default(true),
});

export const WallPaintChangerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('wall-paint-changer'),
  subjectType: WallPaintChangerSubjectTypeSchema,
  configuration: WallPaintChangerConfigurationSchema,
});

export const WallPaintChangerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const WallPaintChangerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  paintSummary: z.string().min(1),
  brightnessImpact: z.enum(['lighter', 'darker', 'balanced']),
  roomMoodShift: z.array(z.string()),
});

export const WallPaintChangerCritiqueSchema = BaseCritiqueSchema.extend({
  toneBalance: z.number().min(0).max(1),
  daylightConsistency: z.number().min(0).max(1),
});

export const WallPaintChangerPreviewSchema = z.object({
  request: WallPaintChangerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const WallPaintChangerResultSchema = BaseEditResultSchema.extend({
  subjectType: WallPaintChangerSubjectTypeSchema,
});

export type WallPaintChangerRequestInput = z.infer<typeof WallPaintChangerRequestSchema>;
export type WallPaintChangerAnalysisOutput = z.infer<typeof WallPaintChangerAnalysisSchema>;
export type WallPaintChangerPlanOutput = z.infer<typeof WallPaintChangerPlanSchema>;
export type WallPaintChangerCritiqueOutput = z.infer<typeof WallPaintChangerCritiqueSchema>;
export type WallPaintChangerResultOutput = z.infer<typeof WallPaintChangerResultSchema>;
