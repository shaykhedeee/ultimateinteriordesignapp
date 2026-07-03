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

export const EditSelectionModeSchema = z.enum([
  'manual_mask',
  'lasso',
  'rectangle',
  'auto_detect',
  'detected_surface',
  'whole_room',
  'whole_scene',
]);

export const ToolRiskLevelSchema = z.enum(['low', 'medium', 'high']);

export const ToolSurfaceCandidateSchema = z.object({
  id: z.string(),
  label: z.string(),
  bounds: SurfaceBoundsSchema,
  polygon: z.array(SurfacePointSchema).optional(),
  category: z.string(),
  confidence: z.number().min(0).max(1),
  notes: z.array(z.string()).optional(),
});

export const MaterialReferenceSchema = z.object({
  materialId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  finish: z.string().optional(),
  colorFamily: z.string().optional(),
  textureImageUrl: z.string().url().optional(),
  swatchImageUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ProductReferenceSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  widthCm: z.number().positive().optional(),
  depthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const DesignContextSnapshotSchema = z.object({
  styleName: z.string().nullable().optional(),
  styleKeywords: z.array(z.string()).optional(),
  materialPalette: z.array(z.string()).optional(),
  mustKeep: z.array(z.string()).optional(),
  mustAvoid: z.array(z.string()).optional(),
  roomType: z.string().nullable().optional(),
});

export const BaseEditRequestSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  renderId: z.string().uuid(),
  sourceAssetId: z.string().uuid().optional(),
  selectionMode: EditSelectionModeSchema,
  selectedCandidateId: z.string().optional(),
  maskAssetId: z.string().uuid().optional(),
  maskPolygon: z.array(SurfacePointSchema).optional(),
  styleIntent: z.string().optional(),
  notes: z.string().optional(),
  requestedBy: z.string().uuid(),
  preserveGeometry: z.boolean().default(true),
  preserveLighting: z.boolean().default(true),
  preserveNeighboringObjects: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const BaseCritiqueSchema = z.object({
  score: z.number().min(0).max(100),
  geometryConsistency: z.number().min(0).max(1),
  realismScore: z.number().min(0).max(1),
  issues: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
  approve: z.boolean(),
});

export const BaseEditResultSchema = z.object({
  outputAssetId: z.string().uuid().optional(),
  outputImageUrl: z.string().url().optional(),
  childRenderId: z.string().uuid().optional(),
  validationScore: z.number().min(0).max(1).optional(),
  critiqueScore: z.number().min(0).max(100).optional(),
  warnings: z.array(z.string()),
  acceptedBySystem: z.boolean(),
});
