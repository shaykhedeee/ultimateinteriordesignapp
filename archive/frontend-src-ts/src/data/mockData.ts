import { Project, FurnitureAsset, PBRMaterial, DesignOption, ChatMessage } from '../types/aura';

export const MOCK_MATERIALS: PBRMaterial[] = [
  { id: 'mat-oak-warm', name: 'Warm European Oak', category: 'Wood', color: '#b9936c', roughness: 0.6, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 14.50, vendor: 'Porcelanosa' },
  { id: 'mat-walnut-dark', name: 'Smoked American Walnut', category: 'Wood', color: '#5c4033', roughness: 0.5, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 18.00, vendor: 'Armstrong' },
  { id: 'mat-marble-carrara', name: 'Carrara White Marble', category: 'Stone', color: '#f5f5f5', roughness: 0.2, metallic: 0.1, textureUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 42.00, vendor: 'Cosentino' },
  { id: 'mat-quartz-calacatta', name: 'Calacatta Gold Quartz', category: 'Stone', color: '#faf9f6', roughness: 0.15, metallic: 0.05, textureUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 28.50, vendor: 'Caesarstone' },
  { id: 'mat-velvet-emerald', name: 'Emerald Plush Velvet', category: 'Fabric', color: '#046307', roughness: 0.8, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 12.00, vendor: 'Kvadrat' },
  { id: 'mat-leather-camel', name: 'Tuscan Camel Leather', category: 'Fabric', color: '#c19a6b', roughness: 0.4, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 22.00, vendor: 'Moore & Giles' },
  { id: 'mat-brass-brushed', name: 'Brushed Antique Brass', category: 'Metal', color: '#d4af37', roughness: 0.3, metallic: 0.9, textureUrl: 'https://images.unsplash.com/photo-1533090161767-e67946f6839a?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 35.00, vendor: 'Hafele' },
  { id: 'mat-concrete-micro', name: 'Matte Microcement', category: 'Tile', color: '#808080', roughness: 0.7, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 9.50, vendor: 'Topciment' },
  { id: 'mat-paint-japandi', name: 'Warm Wabi Alabaster', category: 'Paint', color: '#eae6df', roughness: 0.9, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1562184552-997c461abbe6?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 4.20, vendor: 'Farrow & Ball' },
  { id: 'mat-herringbone', name: 'Chevron Herringbone Oak', category: 'Tile', color: '#d2b48c', roughness: 0.5, metallic: 0, textureUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80', pricePerSqFt: 16.00, vendor: 'Havwoods' }
];

export const MOCK_ASSETS: FurnitureAsset[] = [
  {
    id: 'ast-sofa-cloud',
    name: 'Cloud Modular Sectional Sofa',
    category: 'Furniture',
    subCategory: 'Sofas & Sectionals',
    brand: 'Restoration Hardware',
    price: 3450,
    dimensions: { width: 280, height: 85, depth: 160 },
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    modelType: 'sofa',
    defaultMaterialId: 'mat-velvet-emerald',
    styleTags: ['Modern Minimalist', 'Japandi', 'Cozy'],
    inStock: true,
    rating: 4.9,
    buyUrl: 'https://www.rh.com'
  },
  {
    id: 'ast-sofa-leather',
    name: 'Hamilton Camel Leather Sofa',
    category: 'Furniture',
    subCategory: 'Sofas & Sectionals',
    brand: 'West Elm',
    price: 2199,
    dimensions: { width: 230, height: 82, depth: 95 },
    thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
    modelType: 'sofa',
    defaultMaterialId: 'mat-leather-camel',
    styleTags: ['Mid-Century Modern', 'Industrial', 'Warm'],
    inStock: true,
    rating: 4.8,
    buyUrl: 'https://www.westelm.com'
  },
  {
    id: 'ast-chair-eames',
    name: 'Eames Lounge Chair & Ottoman',
    category: 'Furniture',
    subCategory: 'Accent Chairs',
    brand: 'Herman Miller',
    price: 1850,
    dimensions: { width: 85, height: 84, depth: 85 },
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    modelType: 'chair',
    defaultMaterialId: 'mat-walnut-dark',
    styleTags: ['Mid-Century Modern', 'Iconic', 'Executive'],
    inStock: true,
    rating: 5.0,
    buyUrl: 'https://www.hermanmiller.com'
  },
  {
    id: 'ast-table-travertine',
    name: 'Tivoli Travertine Coffee Table',
    category: 'Furniture',
    subCategory: 'Coffee Tables',
    brand: 'CB2',
    price: 899,
    dimensions: { width: 120, height: 40, depth: 70 },
    thumbnail: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
    modelType: 'table',
    defaultMaterialId: 'mat-marble-carrara',
    styleTags: ['Modern Minimalist', 'Art Deco', 'Organic'],
    inStock: true,
    rating: 4.7,
    buyUrl: 'https://www.cb2.com'
  },
  {
    id: 'ast-lamp-arc',
    name: 'Flos Arco Floor Lamp',
    category: 'Lighting',
    subCategory: 'Floor Lamps',
    brand: 'Flos',
    price: 1250,
    dimensions: { width: 220, height: 240, depth: 30 },
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    modelType: 'lamp',
    defaultMaterialId: 'mat-marble-carrara',
    styleTags: ['Modern', 'Italian', 'Statement'],
    inStock: true,
    rating: 4.9,
    buyUrl: 'https://flos.com'
  },
  {
    id: 'ast-plant-monstera',
    name: 'XL Monstera Deliciosa in Terracotta',
    category: 'Plants',
    subCategory: 'Indoor Trees',
    brand: 'The Sill',
    price: 195,
    dimensions: { width: 75, height: 160, depth: 75 },
    thumbnail: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    modelType: 'plant',
    defaultMaterialId: 'mat-oak-warm',
    styleTags: ['Biophilic', 'Bohemian', 'Scandi'],
    inStock: true,
    rating: 4.8,
    buyUrl: 'https://www.thesill.com'
  },
  {
    id: 'ast-rug-berber',
    name: 'Handwoven Moroccan Berber Rug (8x10)',
    category: 'Decor',
    subCategory: 'Rugs',
    brand: 'Pottery Barn',
    price: 1100,
    dimensions: { width: 240, height: 2, depth: 300 },
    thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    modelType: 'rug',
    defaultMaterialId: 'mat-paint-japandi',
    styleTags: ['Scandinavian', 'Bohemian', 'Cozy'],
    inStock: true,
    rating: 4.6,
    buyUrl: 'https://www.potterybarn.com'
  },
  {
    id: 'ast-tv-console',
    name: 'Nora Slatted Oak Media Console',
    category: 'Furniture',
    subCategory: 'TV & Media Units',
    brand: 'Article',
    price: 1400,
    dimensions: { width: 200, height: 55, depth: 45 },
    thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    modelType: 'cabinet',
    defaultMaterialId: 'mat-oak-warm',
    styleTags: ['Scandinavian', 'Japandi', 'Modern'],
    inStock: true,
    rating: 4.9,
    buyUrl: 'https://www.article.com'
  },
  {
    id: 'ast-dining-table',
    name: 'Kanto Solid Oak Dining Table (6 Seater)',
    category: 'Furniture',
    subCategory: 'Dining Tables',
    brand: 'IKEA',
    price: 649,
    dimensions: { width: 180, height: 75, depth: 90 },
    thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1c0955213?auto=format&fit=crop&w=600&q=80',
    modelType: 'table',
    defaultMaterialId: 'mat-oak-warm',
    styleTags: ['Scandinavian', 'Minimalist', 'Budget-Friendly'],
    inStock: true,
    rating: 4.7,
    buyUrl: 'https://www.ikea.com'
  },
  {
    id: 'ast-pendant-brass',
    name: 'Sputnik Multi-Globe Pendant Light',
    category: 'Lighting',
    subCategory: 'Pendant Lights',
    brand: 'Rejuvenation',
    price: 720,
    dimensions: { width: 90, height: 80, depth: 90 },
    thumbnail: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=600&q=80',
    modelType: 'lamp',
    defaultMaterialId: 'mat-brass-brushed',
    styleTags: ['Mid-Century Modern', 'Art Deco', 'Glam'],
    inStock: true,
    rating: 4.8,
    buyUrl: 'https://www.rejuvenation.com'
  }
];

export const MOCK_DESIGN_OPTIONS: DesignOption[] = [
  {
    id: 'opt-modern-japandi',
    name: 'Option A (Primary Recommendation)',
    styleName: 'Japandi Wabi-Sabi Sanctuary',
    score: 94,
    totalCost: 14200,
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    description: 'A harmonious blend of Scandinavian functionality and Japanese rustic minimalism. Features warm oak slats, organic stone textures, warm 2700K indirect cove lighting, and biophilic indoor greenery.',
    highlights: ['Warm 2700K circadian lighting scheme', 'Ergonomically spaced 38" walkways', 'Sustainable FSC-certified solid oak wood', 'Acoustic slatted feature wall'],
    vibe: 'Warm, Grounding, Zen, Minimalist',
    rooms: [
      {
        roomId: 'room-living',
        colorTemp: 2700,
        wallMaterialId: 'mat-paint-japandi',
        floorMaterialId: 'mat-herringbone',
        items: [
          { id: 'item-1', assetId: 'ast-sofa-cloud', roomId: 'room-living', position: { x: 0, y: 0, z: -1.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-2', assetId: 'ast-table-travertine', roomId: 'room-living', position: { x: 0, y: 0, z: 0.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-3', assetId: 'ast-tv-console', roomId: 'room-living', position: { x: 0, y: 0, z: 3.2 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-4', assetId: 'ast-plant-monstera', roomId: 'room-living', position: { x: -2.2, y: 0, z: -1.5 }, rotation: { x: 0, y: 45, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-5', assetId: 'ast-lamp-arc', roomId: 'room-living', position: { x: 2.1, y: 0, z: -1.4 }, rotation: { x: 0, y: -30, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-6', assetId: 'ast-rug-berber', roomId: 'room-living', position: { x: 0, y: -0.01, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        ]
      }
    ]
  },
  {
    id: 'opt-midcentury-bold',
    name: 'Option B (Bold Alternative)',
    styleName: 'Mid-Century Modern Luxe',
    score: 91,
    totalCost: 16800,
    thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    description: 'Statement architectural interior emphasizing rich American walnut, camel leather upholstery, brushed antique brass accents, and striking sculptural light fixtures.',
    highlights: ['Iconic Eames lounge chair focal point', 'High contrast walnut against marble', '3000K museum-grade CRI 98 spotlights', 'Custom built-in bar credenza'],
    vibe: 'Sophisticated, Timeless, Executive, Warm',
    rooms: [
      {
        roomId: 'room-living',
        colorTemp: 3000,
        wallMaterialId: 'mat-concrete-micro',
        floorMaterialId: 'mat-walnut-dark',
        items: [
          { id: 'item-1', assetId: 'ast-sofa-leather', roomId: 'room-living', position: { x: 0, y: 0, z: -1.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-2', assetId: 'ast-chair-eames', roomId: 'room-living', position: { x: -1.8, y: 0, z: 0.5 }, rotation: { x: 0, y: 45, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-3', assetId: 'ast-pendant-brass', roomId: 'room-living', position: { x: 0, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        ]
      }
    ]
  },
  {
    id: 'opt-scandi-budget',
    name: 'Option C (Budget-Friendly)',
    styleName: 'Nordic Light Minimalist',
    score: 88,
    totalCost: 11500,
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    description: 'Maximized spaciousness and natural sunlight using smart IKEA modular pieces, light beech/pine wood tones, crisp linen drapes, and high-durability family-proof textiles.',
    highlights: ['Optimized within $12,000 strict cap', 'Multi-functional storage coffee table', 'High light reflectance (LRV 88%) walls', 'Stain-resistant performance fabric'],
    vibe: 'Airy, Clean, Family-Friendly, Bright',
    rooms: [
      {
        roomId: 'room-living',
        colorTemp: 3500,
        wallMaterialId: 'mat-paint-japandi',
        floorMaterialId: 'mat-oak-warm',
        items: [
          { id: 'item-1', assetId: 'ast-dining-table', roomId: 'room-living', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { id: 'item-2', assetId: 'ast-plant-monstera', roomId: 'room-living', position: { x: 2, y: 0, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        ]
      }
    ]
  }
];

export const INITIAL_PROJECT: Project = {
  id: 'prj-sky-penthouse',
  name: 'AURA Sky Penthouse (3BHK)',
  clientName: 'Alexander & Maya Vance',
  buildingType: 'Luxury Apartment',
  totalAreaSqFt: 2450,
  budget: { allocated: 15000, spent: 12450 },
  activeOptionId: 'opt-modern-japandi',
  rooms: [
    {
      id: 'room-living',
      name: 'Living & Dining Great Room',
      type: 'Living Room',
      dimensions: { width: 6.5, length: 8.0, height: 3.2 },
      colorTemp: 2700,
      lightIntensity: 450,
      wallMaterialId: 'mat-paint-japandi',
      floorMaterialId: 'mat-herringbone',
      ceilingMaterialId: 'mat-paint-japandi',
      polygon: [{ x: 100, y: 100 }, { x: 500, y: 100 }, { x: 500, y: 450 }, { x: 100, y: 450 }]
    },
    {
      id: 'room-master-bed',
      name: 'Master Suite & Walk-in',
      type: 'Master Bedroom',
      dimensions: { width: 5.0, length: 5.5, height: 3.2 },
      colorTemp: 2700,
      lightIntensity: 300,
      wallMaterialId: 'mat-paint-japandi',
      floorMaterialId: 'mat-walnut-dark',
      ceilingMaterialId: 'mat-paint-japandi',
      polygon: [{ x: 500, y: 100 }, { x: 800, y: 100 }, { x: 800, y: 350 }, { x: 500, y: 350 }]
    },
    {
      id: 'room-kitchen',
      name: 'Parametric Modular Kitchen',
      type: 'Kitchen',
      dimensions: { width: 4.2, length: 4.8, height: 3.2 },
      colorTemp: 4000,
      lightIntensity: 650,
      wallMaterialId: 'mat-marble-carrara',
      floorMaterialId: 'mat-concrete-micro',
      ceilingMaterialId: 'mat-paint-japandi',
      polygon: [{ x: 100, y: 450 }, { x: 400, y: 450 }, { x: 400, y: 700 }, { x: 100, y: 700 }]
    },
    {
      id: 'room-guest-bed',
      name: 'Guest Bedroom / Office',
      type: 'Guest Bedroom',
      dimensions: { width: 4.0, length: 4.5, height: 3.2 },
      colorTemp: 3000,
      lightIntensity: 400,
      wallMaterialId: 'mat-paint-japandi',
      floorMaterialId: 'mat-oak-warm',
      ceilingMaterialId: 'mat-paint-japandi',
      polygon: [{ x: 400, y: 450 }, { x: 700, y: 450 }, { x: 700, y: 700 }, { x: 400, y: 700 }]
    }
  ],
  placedItems: MOCK_DESIGN_OPTIONS[0].rooms[0].items,
  collaborators: [
    { id: 'c1', name: 'You (Lead Designer)', role: 'Lead Designer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', color: '#6366f1', currentRoom: 'room-living', cursor: { x: 45, y: 55 } },
    { id: 'c2', name: 'Maya Vance', role: 'Client', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', color: '#ec4899', currentRoom: 'room-living', cursor: { x: 68, y: 42 } },
    { id: 'c3', name: 'Vikram S.', role: 'MEP Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', color: '#10b981', currentRoom: 'room-kitchen', cursor: { x: 25, y: 75 } },
    { id: 'c4', name: 'AURA Brain 70B', role: 'AI Agent', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80', color: '#3b82f6', currentRoom: 'room-living', cursor: { x: 50, y: 50 } }
  ],
  historyIndex: 4
};

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'system',
    timestamp: '10:02 AM',
    text: 'AURA Brain Orchestrator connected. Loaded Spatial Planning GNN, Florence-2 Vision, and Pinecone Vector DB context for "AURA Sky Penthouse (3BHK)".'
  },
  {
    id: 'msg-2',
    sender: 'user',
    timestamp: '10:14 AM',
    text: 'Make the living room feel warmer and more inviting for evening gatherings.'
  },
  {
    id: 'msg-3',
    sender: 'aura',
    timestamp: '10:14 AM',
    text: 'Adjusting color temperature of cove lighting from 4000K → 2700K, applying warm herringbone European oak flooring, and swapping the cool gray sofa for rich camel leather.',
    actionPreview: {
      title: 'Warm Evening Gathering Ambiance',
      changes: [
        'Lighting color temperature set to 2700K Warm White',
        'Flooring changed to Chevron Herringbone Oak (+$1,450 value)',
        'Sofa swapped to Hamilton Camel Leather'
      ],
      costImpact: -650,
      visualQualityImpact: 5,
      executableActionType: 'lighting-warm'
    },
    actions: [
      { label: 'Apply Changes', actionId: 'act-warm-apply', variant: 'primary' },
      { label: 'Show Alternatives', actionId: 'act-warm-alt', variant: 'secondary' }
    ]
  },
  {
    id: 'msg-4',
    sender: 'user',
    timestamp: '10:20 AM',
    text: 'Add a reading nook by the window.'
  },
  {
    id: 'msg-5',
    sender: 'aura',
    timestamp: '10:20 AM',
    text: 'I see a 4ft clearance space by the north bay window. I generated a bespoke reading nook configuration with optimal morning light exposure.',
    actionPreview: {
      title: 'Bespoke Bay Window Reading Nook',
      changes: [
        'Built-in oak window bench with soft linen cushion',
        'Wall-mounted brass articulated reading lamp (IES spot)',
        'Floating solid walnut book ledge'
      ],
      costImpact: 1150,
      visualQualityImpact: 4,
      executableActionType: 'add-nook'
    },
    actions: [
      { label: 'Insert into 3D Viewport', actionId: 'act-nook-insert', variant: 'primary' }
    ]
  },
  {
    id: 'msg-6',
    sender: 'user',
    timestamp: '10:25 AM',
    text: 'This is over budget, bring it down by 20% without losing the Japandi vibe.'
  },
  {
    id: 'msg-7',
    sender: 'aura',
    timestamp: '10:25 AM',
    text: 'Optimizing through Cost Optimization Engine... Replacing Carrara marble countertop with high-grade Calacatta Quartz (-$2,400), selecting IKEA Kanto solid oak dining table (-$1,100), and using laminate interior wardrobe panels (-$950).',
    actionPreview: {
      title: 'Smart 20% Budget Optimization',
      changes: [
        'Carrara Marble → Calacatta Gold Quartz (-$2,400)',
        'Designer Dining Table → IKEA Kanto Oak (-$1,100)',
        'Wardrobe Internal Core → Engineered Laminate (-$950)'
      ],
      costImpact: -4450,
      visualQualityImpact: 4.8,
      executableActionType: 'budget-cut'
    },
    actions: [
      { label: 'Accept Optimization', actionId: 'act-budget-accept', variant: 'primary' },
      { label: 'Customize Line Items', actionId: 'act-budget-custom', variant: 'secondary' }
    ]
  }
];
