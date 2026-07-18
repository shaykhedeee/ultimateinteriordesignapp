import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const WardrobeRedesignSubjectTypeSchema = z.enum(["finish_refresh", "shutter_redesign", "mirror_variant", "premium_concept", "unknown"]);

export const WardrobeRedesignConfigurationSchema = z.object({
  redesignMode: z.enum(['finish_refresh', 'shutter_redesign', 'mirror_variant', 'premium_concept']),
  shutterStyle: z.enum(['flat', 'fluted', 'framed', 'mirrored', 'panel_rhythm']).optional(),
  finishMaterial: MaterialReferenceSchema.optional(),
  handleStrategy: z.enum(['profile', 'bar', 'push_to_open', 'handleless']).optional(),
  mirrorCoverage: z.enum(['none', 'partial', 'full']).optional(),
});

export const WardrobeRedesignRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('wardrobe-redesign'),
  subjectType: WardrobeRedesignSubjectTypeSchema,
  configuration: WardrobeRedesignConfigurationSchema,
});

export const WardrobeRedesignAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const WardrobeRedesignPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  wardrobeSummary: z.string().min(1),
  panelRhythmNotes: z.array(z.string()),
  paletteFitNotes: z.array(z.string()),
});

export const WardrobeRedesignCritiqueSchema = BaseCritiqueSchema.extend({
  joineryBelievability: z.number().min(0).max(1),
  styleAlignment: z.number().min(0).max(1),
});

export const WardrobeRedesignPreviewSchema = z.object({
  request: WardrobeRedesignRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const WardrobeRedesignResultSchema = BaseEditResultSchema.extend({
  subjectType: WardrobeRedesignSubjectTypeSchema,
});

export type WardrobeRedesignRequestInput = z.infer<typeof WardrobeRedesignRequestSchema>;
export type WardrobeRedesignAnalysisOutput = z.infer<typeof WardrobeRedesignAnalysisSchema>;
export type WardrobeRedesignPlanOutput = z.infer<typeof WardrobeRedesignPlanSchema>;
export type WardrobeRedesignCritiqueOutput = z.infer<typeof WardrobeRedesignCritiqueSchema>;
export type WardrobeRedesignResultOutput = z.infer<typeof WardrobeRedesignResultSchema>;
