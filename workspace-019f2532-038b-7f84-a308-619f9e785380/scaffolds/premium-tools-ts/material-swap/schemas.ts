import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const MaterialSwapSubjectTypeSchema = z.enum(["panel_surface", "countertop", "backsplash", "upholstery", "stone_cladding", "metal_detail", "tile_surface", "unknown"]);

export const MaterialSwapConfigurationSchema = z.object({
  targetMaterial: MaterialReferenceSchema,
  currentMaterialHint: z.string().optional(),
  preserveSeams: z.boolean().default(true),
  preserveHardware: z.boolean().default(true),
  preserveReflections: z.boolean().default(true),
  finishBlendMode: z.enum(['strict', 'balanced', 'stylized']).default('balanced'),
});

export const MaterialSwapRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('material-swap'),
  subjectType: MaterialSwapSubjectTypeSchema,
  configuration: MaterialSwapConfigurationSchema,
});

export const MaterialSwapAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const MaterialSwapPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  targetMaterialSummary: z.string().min(1),
  blendingStrategy: z.enum(['strict', 'balanced', 'stylized']),
  compatibilityNotes: z.array(z.string()),
});

export const MaterialSwapCritiqueSchema = BaseCritiqueSchema.extend({
  materialBelievability: z.number().min(0).max(1),
  styleAlignment: z.number().min(0).max(1),
});

export const MaterialSwapPreviewSchema = z.object({
  request: MaterialSwapRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const MaterialSwapResultSchema = BaseEditResultSchema.extend({
  subjectType: MaterialSwapSubjectTypeSchema,
});

export type MaterialSwapRequestInput = z.infer<typeof MaterialSwapRequestSchema>;
export type MaterialSwapAnalysisOutput = z.infer<typeof MaterialSwapAnalysisSchema>;
export type MaterialSwapPlanOutput = z.infer<typeof MaterialSwapPlanSchema>;
export type MaterialSwapCritiqueOutput = z.infer<typeof MaterialSwapCritiqueSchema>;
export type MaterialSwapResultOutput = z.infer<typeof MaterialSwapResultSchema>;
