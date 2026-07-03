export type EditSelectionMode =
  | 'manual_mask'
  | 'lasso'
  | 'rectangle'
  | 'auto_detect'
  | 'detected_surface'
  | 'whole_room'
  | 'whole_scene';

export type ToolRiskLevel = 'low' | 'medium' | 'high';

export type SurfacePoint = { x: number; y: number };

export type SurfaceBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ToolSurfaceCandidate = {
  id: string;
  label: string;
  bounds: SurfaceBounds;
  polygon?: SurfacePoint[];
  category: string;
  confidence: number;
  notes?: string[];
};

export type MaterialReference = {
  materialId?: string;
  productId?: string;
  name: string;
  brand?: string;
  finish?: string;
  colorFamily?: string;
  textureImageUrl?: string;
  swatchImageUrl?: string;
  metadata?: Record<string, unknown>;
};

export type ProductReference = {
  productId?: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  widthCm?: number;
  depthCm?: number;
  heightCm?: number;
  metadata?: Record<string, unknown>;
};

export type DesignContextSnapshot = {
  styleName?: string | null;
  styleKeywords?: string[];
  materialPalette?: string[];
  mustKeep?: string[];
  mustAvoid?: string[];
  roomType?: string | null;
};

export type BaseEditRequest = {
  organizationId: string;
  projectId: string;
  zoneId?: string;
  renderId: string;
  sourceAssetId?: string;
  selectionMode: EditSelectionMode;
  selectedCandidateId?: string;
  maskAssetId?: string;
  maskPolygon?: SurfacePoint[];
  styleIntent?: string;
  notes?: string;
  requestedBy: string;
  preserveGeometry?: boolean;
  preserveLighting?: boolean;
  preserveNeighboringObjects?: boolean;
  metadata?: Record<string, unknown>;
};

export type BaseEditPlan = {
  editIntent: string;
  preserveInstructions: string[];
  mustKeep: string[];
  mustAvoid: string[];
  riskFlags: string[];
  editPrompt: string;
  negativePrompt: string;
  confidence: number;
  uncertainties: string[];
};

export type BaseCritique = {
  score: number;
  geometryConsistency: number;
  realismScore: number;
  issues: string[];
  suggestedFixes: string[];
  approve: boolean;
};

export type BaseEditResult = {
  outputAssetId?: string;
  outputImageUrl?: string;
  childRenderId?: string;
  validationScore?: number;
  critiqueScore?: number;
  warnings: string[];
  acceptedBySystem: boolean;
};
