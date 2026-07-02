export type ViewMode = 'viewport-3d' | 'floorplan-2d' | 'ai-generator' | 'parametric' | 'render-studio' | 'commerce-boq' | 'brain-arch' | 'mood-board' | 'project-timeline';

export type RenderTier = 'tier1-webgpu' | 'tier2-ai-enhance' | 'tier3-pathtrace' | 'tier4-cinematic' | 'tier5-immersive';

export type RoomType = 'Living Room' | 'Master Bedroom' | 'Guest Bedroom' | 'Kitchen' | 'Bathroom' | 'Balcony' | 'Corridor';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface Size3D {
  width: number;
  height: number;
  depth: number;
}

export interface PBRMaterial {
  id: string;
  name: string;
  category: 'Wood' | 'Stone' | 'Tile' | 'Fabric' | 'Metal' | 'Glass' | 'Paint' | 'Wallpaper';
  color: string;
  roughness: number;
  metallic: number;
  textureUrl: string;
  pricePerSqFt: number;
  vendor: string;
}

export interface FurnitureAsset {
  id: string;
  name: string;
  category: 'Furniture' | 'Lighting' | 'Decor' | 'Kitchen' | 'Bathroom' | 'Appliances' | 'Plants';
  subCategory: string;
  brand: string;
  price: number;
  dimensions: Size3D; // in cm
  thumbnail: string;
  modelType: 'sofa' | 'chair' | 'table' | 'bed' | 'lamp' | 'plant' | 'cabinet' | 'rug' | 'decor' | 'tv';
  defaultMaterialId: string;
  styleTags: string[];
  inStock: boolean;
  rating: number;
  buyUrl: string;
}

export interface PlacedItem {
  id: string;
  assetId: string;
  roomId: string;
  position: Position3D; // in meters
  rotation: Rotation3D; // in degrees
  scale: Position3D;
  customColor?: string;
  materialId?: string;
  locked?: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  type: RoomType;
  dimensions: { width: number; length: number; height: number }; // in meters
  colorTemp: number; // e.g. 2700 for warm, 4000 for neutral
  lightIntensity: number; // in Lux
  wallMaterialId: string;
  floorMaterialId: string;
  ceilingMaterialId: string;
  polygon: { x: number; y: number }[]; // 2D points
}

export interface DesignOption {
  id: string;
  name: string;
  styleName: string;
  score: number;
  totalCost: number;
  thumbnail: string;
  description: string;
  highlights: string[];
  vibe: string;
  rooms: {
    roomId: string;
    items: PlacedItem[];
    colorTemp: number;
    wallMaterialId: string;
    floorMaterialId: string;
  }[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  buildingType: string;
  totalAreaSqFt: number;
  budget: { allocated: number; spent: number };
  activeOptionId: string;
  rooms: RoomData[];
  placedItems: PlacedItem[];
  collaborators: {
    id: string;
    name: string;
    role: 'Lead Designer' | 'Client' | 'MEP Engineer' | 'AI Agent';
    avatar: string;
    color: string;
    currentRoom: string;
    cursor?: { x: number; y: number };
  }[];
  historyIndex: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aura' | 'system';
  timestamp: string;
  text: string;
  actionPreview?: {
    title: string;
    changes: string[];
    costImpact: number;
    visualQualityImpact: number; // 1 to 5
    executableActionType?: 'restyle' | 'budget-cut' | 'add-nook' | 'lighting-warm';
  };
  actions?: { label: string; actionId: string; variant: 'primary' | 'secondary' | 'danger' }[];
}

export interface ParametricKitchenConfig {
  layout: 'L-Shaped' | 'U-Shaped' | 'Parallel' | 'Island' | 'G-Shaped';
  countertopMaterial: string;
  cabinetFinish: string;
  handleStyle: string;
  backsplashTile: string;
  applianceBrand: string;
  workTriangleScore: number;
  estimatedCost: number;
}
