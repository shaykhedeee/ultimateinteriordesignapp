export type FurnitureCatalogItem = {
  key: string;
  label: string;
  category: 'bed' | 'sofa' | 'tv_unit' | 'dresser' | 'wardrobe' | 'mandir' | 'study' | 'storage' | 'kitchen_base_cabinet' | 'kitchen_wall_cabinet' | 'pendant_light';
  styleTags: string[];
  trendTags: string[];
  roomTypes: string[];
  params: Record<string, unknown>;
  gltfAssetPath?: string;
  previewColor?: string;
  previewLabel?: string;
  notes?: string;
  
  // AURA metadata extension
  placementType?: 'floor' | 'wall' | 'ceiling';
  snapOrigin?: 'back' | 'center' | 'bottom';
  materialZones?: string[];
  priceBand?: 'economy' | 'standard' | 'premium';
  dimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minDepth?: number;
    maxDepth?: number;
  };
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
    placementType: 'floor',
    snapOrigin: 'bottom',
    materialZones: ['headboard', 'frame', 'legs'],
    priceBand: 'premium',
    dimensions: { minWidth: 1500, maxWidth: 2000, minHeight: 900, maxHeight: 1300 }
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
    placementType: 'floor',
    snapOrigin: 'bottom',
    materialZones: ['frame', 'headboard', 'internal_storage'],
    priceBand: 'standard',
    dimensions: { minWidth: 1500, maxWidth: 2000 }
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
    placementType: 'floor',
    snapOrigin: 'bottom',
    materialZones: ['upholstery', 'legs'],
    priceBand: 'premium'
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
    placementType: 'floor',
    snapOrigin: 'bottom',
    materialZones: ['upholstery', 'legs'],
    priceBand: 'standard'
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
    placementType: 'wall',
    snapOrigin: 'back',
    materialZones: ['console_body', 'fluted_backdrop', 'marble_panel', 'led_strip'],
    priceBand: 'premium',
    dimensions: { minWidth: 1800, maxWidth: 3000 }
  },
  {
    key: 'tv_unit_minimal_wood',
    label: 'Minimalist Wood Slats TV Unit',
    category: 'tv_unit',
    styleTags: ['minimalist', 'warm-oak', 'clean-lines'],
    trendTags: ['wood-slats', 'neutral-wood'],
    roomTypes: ['living_room', 'bedroom'],
    params: { widthMm: 2000, heightMm: 450, depthMm: 400, panelType: 'slatted', consoleType: 'floor_mount', finishTier: 'laminate_matte' },
    gltfAssetPath: '/models/furniture/tv_unit_feature_lowpoly.gltf',
    previewColor: '#d2b48c',
    previewLabel: 'Low-poly slatted wood TV unit',
    placementType: 'floor',
    snapOrigin: 'bottom',
    materialZones: ['console_body', 'slats_panel'],
    priceBand: 'standard',
    dimensions: { minWidth: 1600, maxWidth: 2400 }
  },
  {
    key: 'tv_unit_marble_floating',
    label: 'Luxurious Marble Floating Console',
    category: 'tv_unit',
    styleTags: ['luxury', 'marble', 'sophisticated'],
    trendTags: ['calacatta-marble', 'led-underglow'],
    roomTypes: ['living_room'],
    params: { widthMm: 2800, heightMm: 600, depthMm: 450, panelType: 'marble_slab', consoleType: 'floating', finishTier: 'acrylic_high_gloss' },
    gltfAssetPath: '/models/furniture/tv_unit_feature_lowpoly.gltf',
    previewColor: '#ffffff',
    previewLabel: 'Luxury floating marble media wall',
    placementType: 'wall',
    snapOrigin: 'back',
    materialZones: ['console_body', 'marble_cladding', 'led_glow'],
    priceBand: 'premium',
    dimensions: { minWidth: 2200, maxWidth: 3200 }
  },
  {
    key: 'tv_unit_compact_apartment',
    label: 'Compact Apartment Media Unit',
    category: 'tv_unit',
    styleTags: ['compact', 'space-saving', 'practical'],
    trendTags: ['shelving-towers', 'multi-functional'],
    roomTypes: ['living_room', 'bedroom', 'kids_bedroom'],
    params: { widthMm: 1500, heightMm: 1800, depthMm: 380, panelType: 'shelf_towers', consoleType: 'floor_mount', finishTier: 'pre_lam_particle' },
    gltfAssetPath: '/models/furniture/tv_unit_feature_lowpoly.gltf',
    previewColor: '#c0c0c0',
    previewLabel: 'Compact shelving TV unit',
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['shelving_body', 'base_console'],
    priceBand: 'economy',
    dimensions: { minWidth: 1200, maxWidth: 1800 }
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
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['carcass', 'shutter', 'mirror_frame'],
    priceBand: 'standard'
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
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['carcass', 'glass_shutters', 'metal_profiles', 'internal_led'],
    priceBand: 'premium',
    dimensions: { minDepth: 650, maxDepth: 700 }
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
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['carcass', 'laminate_shutter', 'handles'],
    priceBand: 'standard',
    dimensions: { minDepth: 600, maxDepth: 650 }
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
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['tabletop', 'legs', 'drawer_shutter'],
    priceBand: 'economy'
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
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['body', 'jali_backplate', 'lighting_fixtures', 'base_cabinets'],
    priceBand: 'premium'
  },
  {
    key: 'kitchen_base_cabinet_laminate',
    label: 'Kitchen Base Cabinet Run',
    category: 'kitchen_base_cabinet',
    styleTags: ['kitchen', 'modular'],
    trendTags: ['efficient-storage'],
    roomTypes: ['kitchen', 'utility'],
    params: { widthMm: 2400, heightMm: 850, depthMm: 600, drawerCount: 3, doorCount: 2 },
    gltfAssetPath: '/models/furniture/generic_cuboid.gltf',
    previewColor: '#7dbb74',
    previewLabel: 'Base cabinet preview',
    placementType: 'floor',
    snapOrigin: 'back',
    materialZones: ['carcass', 'shutter_finish', 'countertop', 'handles'],
    priceBand: 'standard',
    dimensions: { minHeight: 800, maxHeight: 900, minDepth: 560, maxDepth: 620 }
  },
  {
    key: 'kitchen_wall_cabinet_acrylic',
    label: 'Kitchen Acrylic Wall Cabinet',
    category: 'kitchen_wall_cabinet',
    styleTags: ['kitchen', 'modular', 'glossy'],
    trendTags: ['reflective-acrylic'],
    roomTypes: ['kitchen'],
    params: { widthMm: 2400, heightMm: 600, depthMm: 350, doorCount: 4 },
    gltfAssetPath: '/models/furniture/generic_cuboid.gltf',
    previewColor: '#bfd9e2',
    previewLabel: 'Wall cabinet preview',
    placementType: 'wall',
    snapOrigin: 'back',
    materialZones: ['carcass', 'shutter_finish', 'handles'],
    priceBand: 'premium',
    dimensions: { minHeight: 500, maxHeight: 750, minDepth: 300, maxDepth: 380 }
  },
  {
    key: 'pendant_light_brass',
    label: 'Modern Brass Pendant Light',
    category: 'pendant_light',
    styleTags: ['lighting', 'contemporary'],
    trendTags: ['brass-accents'],
    roomTypes: ['dining_room', 'kitchen', 'foyer'],
    params: { widthMm: 300, heightMm: 800, depthMm: 300, bulbCount: 1 },
    gltfAssetPath: '/models/furniture/generic_cuboid.gltf',
    previewColor: '#ffd700',
    previewLabel: 'Pendant light preview',
    placementType: 'ceiling',
    snapOrigin: 'center',
    materialZones: ['fixture_body', 'diffuser'],
    priceBand: 'premium'
  }
];
