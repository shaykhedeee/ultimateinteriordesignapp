import { z } from 'zod';

export const SurfacePointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SurfaceBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const LaminateSelectionModeSchema = z.enum([
  'manual_mask',
  'lasso',
  'rectangle',
  'auto_detect',
  'detected_surface',
]);

export const LaminateSurfaceTypeSchema = z.enum([
  'wardrobe_shutter',
  'cabinet_front',
  'tv_panel',
  'wall_panel',
  'vanity_shutter',
  'partition_cladding',
  'headboard_panel',
  'shelf_panel',
  'laminate_floor',
  'unknown',
]);

export const GrainDirectionSchema = z.enum(['vertical', 'horizontal', 'diagonal', 'auto']);
export const FinishTypeSchema = z.enum(['matte', 'satin', 'semi_gloss', 'gloss', 'textured', 'suede', 'auto']);

export const SurfaceCandidateSchema = z.object({
  id: z.string(),
  surfaceType: LaminateSurfaceTypeSchema,
  label: z.string(),
  bounds: SurfaceBoundsSchema,
  polygon: z.array(SurfacePointSchema).optional(),
  confidence: z.number().min(0).max(1),
  orientationHint: GrainDirectionSchema.optional(),
  notes: z.array(z.string()).optional(),
});

export const LaminateMaterialRefSchema = z.object({
  materialId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  finish: FinishTypeSchema.optional(),
  colorFamily: z.string().optional(),
  grainDirection: GrainDirectionSchema.optional(),
  tone: z.enum(['light', 'mid', 'dark', 'mixed']).optional(),
  textureAssetId: z.string().uuid().optional(),
  textureImageUrl: z.string().url().optional(),
  swatchAssetId: z.string().uuid().optional(),
  swatchImageUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const LaminateChangeRequestSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  renderId: z.string().uuid(),
  sourceAssetId: z.string().uuid().optional(),
  selectionMode: LaminateSelectionModeSchema,
  selectedSurfaceId: z.string().optional(),
  maskAssetId: z.string().uuid().optional(),
  maskPolygon: z.array(SurfacePointSchema).optional(),
  surfaceType: LaminateSurfaceTypeSchema.optional(),
  material: LaminateMaterialRefSchema,
  preserveHardware: z.boolean().default(true),
  preserveSeams: z.boolean().default(true),
  preserveShadows: z.boolean().default(true),
  preserveReflections: z.boolean().default(true),
  grainDirection: GrainDirectionSchema.optional(),
  finishOverride: FinishTypeSchema.optional(),
  styleIntent: z.string().optional(),
  notes: z.string().optional(),
  requestedBy: z.string().uuid(),
}).superRefine((value, ctx) => {
  const manualModes = ['manual_mask', 'lasso', 'rectangle'];
  if (manualModes.includes(value.selectionMode) && !value.maskAssetId && !value.maskPolygon) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maskAssetId'],
      message: 'Manual selection modes require a maskAssetId or maskPolygon.',
    });
  }
  if (value.selectionMode === 'detected_surface' && !value.selectedSurfaceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['selectedSurfaceId'],
      message: 'detected_surface mode requires selectedSurfaceId.',
    });
  }
});

export const SurfaceAnalysisSchema = z.object({
  selectedSurface: SurfaceCandidateSchema.nullable(),
  candidateSurfaces: z.array(SurfaceCandidateSchema),
  lightingNotes: z.array(z.string()),
  neighboringMaterials: z.array(z.string()),
  riskFlags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const AuraLaminatePlanSchema = z.object({
  editIntent: z.string().min(1),
  targetSurfaceType: LaminateSurfaceTypeSchema,
  materialSummary: z.string().min(1),
  grainDirection: GrainDirectionSchema,
  finishType: FinishTypeSchema,
  preserveInstructions: z.array(z.string()).min(1),
  mustKeep: z.array(z.string()).min(1),
  mustAvoid: z.array(z.string()).min(1),
  roomConsistencyNotes: z.array(z.string()),
  riskFlags: z.array(z.string()),
  editPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()),
});

export const LaminateCritiqueSchema = z.object({
  score: z.number().min(0).max(100),
  realismScore: z.number().min(0).max(1),
  materialBelievability: z.number().min(0).max(1),
  geometryConsistency: z.number().min(0).max(1),
  issues: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
  approve: z.boolean(),
});

export const LaminateEditResultSchema = z.object({
  outputAssetId: z.string().uuid().optional(),
  outputImageUrl: z.string().url().optional(),
  childRenderId: z.string().uuid().optional(),
  validationScore: z.number().min(0).max(1).optional(),
  critiqueScore: z.number().min(0).max(100).optional(),
  warnings: z.array(z.string()),
  acceptedBySystem: z.boolean(),
});

export type LaminateChangeRequestInput = z.infer<typeof LaminateChangeRequestSchema>;
export type SurfaceAnalysisOutput = z.infer<typeof SurfaceAnalysisSchema>;
export type AuraLaminatePlanOutput = z.infer<typeof AuraLaminatePlanSchema>;
export type LaminateCritiqueOutput = z.infer<typeof LaminateCritiqueSchema>;
export type LaminateEditResultOutput = z.infer<typeof LaminateEditResultSchema>;
