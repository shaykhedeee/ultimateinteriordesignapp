export type LaminateSelectionMode =
  | 'manual_mask'
  | 'lasso'
  | 'rectangle'
  | 'auto_detect'
  | 'detected_surface';

export type LaminateSurfaceType =
  | 'wardrobe_shutter'
  | 'cabinet_front'
  | 'tv_panel'
  | 'wall_panel'
  | 'vanity_shutter'
  | 'partition_cladding'
  | 'headboard_panel'
  | 'shelf_panel'
  | 'laminate_floor'
  | 'unknown';

export type GrainDirection = 'vertical' | 'horizontal' | 'diagonal' | 'auto';
export type FinishType = 'matte' | 'satin' | 'semi_gloss' | 'gloss' | 'textured' | 'suede' | 'auto';

export type SurfaceBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SurfacePoint = { x: number; y: number };

export type SurfaceCandidate = {
  id: string;
  surfaceType: LaminateSurfaceType;
  label: string;
  bounds: SurfaceBounds;
  polygon?: SurfacePoint[];
  confidence: number;
  orientationHint?: GrainDirection;
  notes?: string[];
};

export type LaminateMaterialRef = {
  materialId?: string;
  productId?: string;
  name: string;
  brand?: string;
  finish?: FinishType;
  colorFamily?: string;
  grainDirection?: GrainDirection;
  tone?: 'light' | 'mid' | 'dark' | 'mixed';
  textureAssetId?: string;
  textureImageUrl?: string;
  swatchAssetId?: string;
  swatchImageUrl?: string;
  metadata?: Record<string, unknown>;
};

export type LaminateChangeRequest = {
  organizationId: string;
  projectId: string;
  zoneId?: string;
  renderId: string;
  sourceAssetId?: string;
  selectionMode: LaminateSelectionMode;
  selectedSurfaceId?: string;
  maskAssetId?: string;
  maskPolygon?: SurfacePoint[];
  surfaceType?: LaminateSurfaceType;
  material: LaminateMaterialRef;
  preserveHardware?: boolean;
  preserveSeams?: boolean;
  preserveShadows?: boolean;
  preserveReflections?: boolean;
  grainDirection?: GrainDirection;
  finishOverride?: FinishType;
  styleIntent?: string;
  notes?: string;
  requestedBy: string;
};

export type SurfaceAnalysis = {
  selectedSurface: SurfaceCandidate | null;
  candidateSurfaces: SurfaceCandidate[];
  lightingNotes: string[];
  neighboringMaterials: string[];
  riskFlags: string[];
  confidence: number;
};

export type AuraLaminatePlan = {
  editIntent: string;
  targetSurfaceType: LaminateSurfaceType;
  materialSummary: string;
  grainDirection: GrainDirection;
  finishType: FinishType;
  preserveInstructions: string[];
  mustKeep: string[];
  mustAvoid: string[];
  roomConsistencyNotes: string[];
  riskFlags: string[];
  editPrompt: string;
  negativePrompt: string;
  confidence: number;
  uncertainties: string[];
};

export type LaminateEditResult = {
  outputAssetId?: string;
  outputImageUrl?: string;
  childRenderId?: string;
  validationScore?: number;
  critiqueScore?: number;
  warnings: string[];
  acceptedBySystem: boolean;
};

export type LaminateCritique = {
  score: number;
  realismScore: number;
  materialBelievability: number;
  geometryConsistency: number;
  issues: string[];
  suggestedFixes: string[];
  approve: boolean;
};
