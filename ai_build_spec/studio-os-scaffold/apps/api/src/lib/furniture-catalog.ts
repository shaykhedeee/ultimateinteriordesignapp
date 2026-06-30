export type FurnitureCatalogItem = {
  key: string;
  label: string;
  category: 'bed' | 'sofa' | 'tv_unit' | 'dresser' | 'wardrobe' | 'mandir' | 'study' | 'storage';
  styleTags: string[];
  trendTags: string[];
  roomTypes: string[];
  params: Record<string, unknown>;
  gltfAssetPath?: string;
  previewColor?: string;
  previewLabel?: string;
  notes?: string;
};

export const furnitureCatalog: FurnitureCatalogItem[] = [
  {
    key: 'bed_queen_upholstered',
    label: 'Queen Upholstered Bed',
    category: 'bed',
    styleTags: ['modern', 'soft-curved', 'comfort-first'],
    trendTags: ['curved', 'warm-neutral'],
    roomTypes: ['master_bedroom', 'bedroom', 'guest_bedroom'],
    params: { widthMm: 1800, heightMm: 1100, depthMm: 2100, headboardType: 'upholstered' },
    gltfAssetPath: '/models/furniture/bed_lowpoly.gltf',
    previewColor: '#8ea6c9',
    previewLabel: 'Low-poly bed family preview',
  },
  {
    key: 'bed_storage_laminate',
    label: 'Storage Bed Laminate',
    category: 'bed',
    styleTags: ['practical', 'family-storage'],
    trendTags: ['storage-first'],
    roomTypes: ['master_bedroom', 'bedroom'],
    params: { widthMm: 1800, heightMm: 1050, depthMm: 2100, storageBase: 'yes' },
    gltfAssetPath: '/models/furniture/bed_lowpoly.gltf',
    previewColor: '#9bb087',
    previewLabel: 'Low-poly bed family preview',
  },
  {
    key: 'sofa_l_shape_curved',
    label: 'L-Shape Curved Sofa',
    category: 'sofa',
    styleTags: ['modern', 'comfort-first'],
    trendTags: ['curved', 'deep-seating'],
    roomTypes: ['living_room'],
    params: { widthMm: 2800, heightMm: 850, depthMm: 1700, sofaType: 'l_shape' },
    gltfAssetPath: '/models/furniture/sofa_lshape_lowpoly.gltf',
    previewColor: '#c79574',
    previewLabel: 'Low-poly sofa L-shape preview',
  },
  {
    key: 'sofa_three_seater_linear',
    label: '3-Seater Linear Sofa',
    category: 'sofa',
    styleTags: ['modern', 'minimal'],
    trendTags: ['neutral-base'],
    roomTypes: ['living_room'],
    params: { widthMm: 2200, heightMm: 850, depthMm: 950, sofaType: 'linear' },
    gltfAssetPath: '/models/furniture/sofa_linear_lowpoly.gltf',
    previewColor: '#bf9f7f',
    previewLabel: 'Low-poly sofa linear preview',
  },
  {
    key: 'tv_unit_fluted_backlit',
    label: 'Fluted Backlit TV Unit',
    category: 'tv_unit',
    styleTags: ['premium', 'feature-wall'],
    trendTags: ['textured-casegoods', 'warm-lighting'],
    roomTypes: ['living_room'],
    params: { widthMm: 2400, heightMm: 500, depthMm: 420, panelType: 'fluted', consoleType: 'floating', finishTier: 'veneer_premium' },
    gltfAssetPath: '/models/furniture/tv_unit_feature_lowpoly.gltf',
    previewColor: '#7aa884',
    previewLabel: 'Low-poly TV feature wall preview',
  },
  {
    key: 'dresser_clean_mirror_unit',
    label: 'Dresser + Mirror Unit',
    category: 'dresser',
    styleTags: ['modern', 'bedroom'],
    trendTags: ['warm-wood'],
    roomTypes: ['master_bedroom', 'bedroom'],
    params: { widthMm: 1200, heightMm: 780, depthMm: 500, mirrorType: 'round' },
    gltfAssetPath: '/models/furniture/dresser_mirror_lowpoly.gltf',
    previewColor: '#b79bca',
    previewLabel: 'Low-poly dresser preview',
  },
  {
    key: 'wardrobe_aristo_glass',
    label: 'Aristo Glass Wardrobe',
    category: 'wardrobe',
    styleTags: ['premium', 'glass'],
    trendTags: ['dark-glass', 'slim-frame'],
    roomTypes: ['master_bedroom'],
    params: { widthMm: 2400, heightMm: 2700, depthMm: 650, doorCount: 3, wardrobeSystem: 'aristo_glass' },
    gltfAssetPath: '/models/furniture/wardrobe_tall_lowpoly.gltf',
    previewColor: '#6f88a8',
    previewLabel: 'Low-poly wardrobe preview',
  },
  {
    key: 'wardrobe_laminate_swing',
    label: 'Laminate Swing Wardrobe',
    category: 'wardrobe',
    styleTags: ['standard', 'practical'],
    trendTags: ['warm-wood', 'storage-first'],
    roomTypes: ['master_bedroom', 'bedroom', 'kids_bedroom'],
    params: { widthMm: 2400, heightMm: 2700, depthMm: 600, doorCount: 4, wardrobeSystem: 'laminate_swing' },
    gltfAssetPath: '/models/furniture/wardrobe_tall_lowpoly.gltf',
    previewColor: '#7c9e67',
    previewLabel: 'Low-poly wardrobe preview',
  },
  {
    key: 'study_desk_compact',
    label: 'Compact Study Desk',
    category: 'study',
    styleTags: ['compact', 'functional'],
    trendTags: ['work-from-home'],
    roomTypes: ['study', 'master_bedroom', 'bedroom'],
    params: { widthMm: 1400, heightMm: 760, depthMm: 550 },
    gltfAssetPath: '/models/furniture/study_desk_lowpoly.gltf',
    previewColor: '#c3a46f',
    previewLabel: 'Low-poly study desk preview',
  },
  {
    key: 'mandir_backlit_jali',
    label: 'Backlit Jali Mandir',
    category: 'mandir',
    styleTags: ['spiritual', 'premium'],
    trendTags: ['jali', 'backlit-panel'],
    roomTypes: ['mandir_room', 'living_room'],
    params: { widthMm: 900, heightMm: 1800, depthMm: 450, backPanelType: 'jali', storageBase: 'yes' },
    gltfAssetPath: '/models/furniture/mandir_compact_lowpoly.gltf',
    previewColor: '#d5b56b',
    previewLabel: 'Low-poly mandir preview',
  }
];
