import { z } from 'zod';
import { BaseCritiqueSchema, BaseEditRequestSchema, BaseEditResultSchema, DesignContextSnapshotSchema, MaterialReferenceSchema, ProductReferenceSchema, ToolRiskLevelSchema, ToolSurfaceCandidateSchema } from '../shared/common-schemas';

export const FlooringChangerSubjectTypeSchema = z.enum(["wood_plank", "herringbone", "stone_slab", "porcelain_tile", "microcement", "carpet_field", "unknown"]);

export const FlooringChangerConfigurationSchema = z.object({
  flooringFamily: z.enum(['wood_plank', 'herringbone', 'stone_slab', 'porcelain_tile', 'microcement', 'carpet_field']),
  targetMaterial: MaterialReferenceSchema,
  plankOrTileDirection: z.enum(['parallel', 'perpendicular', 'diagonal', 'herringbone']).optional(),
  tileSizeMm: z.number().positive().optional(),
  groutColor: z.string().optional(),
  preserveSkirting: z.boolean().default(true),
});

export const FlooringChangerRequestSchema = BaseEditRequestSchema.extend({
  toolSlug: z.literal('flooring-changer'),
  subjectType: FlooringChangerSubjectTypeSchema,
  configuration: FlooringChangerConfigurationSchema,
});

export const FlooringChangerAnalysisSchema = z.object({
  selectedCandidate: ToolSurfaceCandidateSchema.nullable(),
  candidateSubjects: z.array(ToolSurfaceCandidateSchema),
  contextNotes: z.array(z.string()),
  neighboringObjects: z.array(z.string()),
  riskLevel: ToolRiskLevelSchema,
  confidence: z.number().min(0).max(1),
});

export const FlooringChangerPlanSchema = z.object({
  editIntent: z.string().min(1),
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
  flooringSummary: z.string().min(1),
  perspectiveRisk: z.enum(['low', 'medium', 'high']),
  continuityNotes: z.array(z.string()),
});

export const FlooringChangerCritiqueSchema = BaseCritiqueSchema.extend({
  perspectiveIntegrity: z.number().min(0).max(1),
  scaleBelievability: z.number().min(0).max(1),
});

export const FlooringChangerPreviewSchema = z.object({
  request: FlooringChangerRequestSchema,
  designContext: DesignContextSnapshotSchema.nullable().optional(),
  warnings: z.array(z.string()),
  recommendedNextStep: z.enum(['preview', 'manual_confirm', 'queue']),
});

export const FlooringChangerResultSchema = BaseEditResultSchema.extend({
  subjectType: FlooringChangerSubjectTypeSchema,
});

export type FlooringChangerRequestInput = z.infer<typeof FlooringChangerRequestSchema>;
export type FlooringChangerAnalysisOutput = z.infer<typeof FlooringChangerAnalysisSchema>;
export type FlooringChangerPlanOutput = z.infer<typeof FlooringChangerPlanSchema>;
export type FlooringChangerCritiqueOutput = z.infer<typeof FlooringChangerCritiqueSchema>;
export type FlooringChangerResultOutput = z.infer<typeof FlooringChangerResultSchema>;
