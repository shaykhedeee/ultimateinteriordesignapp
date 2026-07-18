import {
  BarChart3,
  ClipboardList,
  FileText,
  FolderOpen,
  GitBranch,
  Grid2X2,
  HelpCircle,
  ImagePlus,
  NotebookTabs,
  PackageCheck,
  Settings
} from 'lucide-react';
import { API_BASE } from '../api/client.js';

export const roomOptions = [
  { id: 'living', label: 'Living / TV Wall' },
  { id: 'kitchen', label: 'Modular Kitchen' },
  { id: 'master', label: 'Master Suite' },
  { id: 'kids', label: 'Kids Bedroom' },
  { id: 'pooja', label: 'Pooja / Mandir' },
  { id: 'foyer', label: 'Foyer Storage' },
  { id: 'dining', label: 'Dining / Crockery' },
  { id: 'guest', label: 'Guest Bedroom' },
  { id: 'study', label: 'Study / WFH' },
  { id: 'balcony', label: 'Balcony Sit-out' },
  { id: 'utility', label: 'Utility / Laundry' }
];

export const studioNav = [
  { id: 'admin', label: 'Command Center', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'dashboard', label: 'Onboarding', icon: Grid2X2 },
  { id: 'renders', label: 'AI Renders', icon: ImagePlus },
  { id: 'library', label: 'Image Library', icon: ImagePlus },
  { id: 'briefs', label: 'PDF Briefs', icon: FileText },
  { id: 'cutlists', label: 'Cutlists', icon: ClipboardList },
  { id: 'packages', label: 'Deliverables', icon: PackageCheck },
  { id: 'materials', label: 'Materials', icon: NotebookTabs },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle, dock: 'bottom' }
];

export const workflowSteps = [
  { id: 'profile', title: 'Client Profile', subtitle: 'Contact, family, usage' },
  { id: 'budget', title: 'Budget & Timeline', subtitle: 'Investment and delivery' },
  { id: 'spaces', title: 'Rooms & Layout', subtitle: 'Rooms, modules, site type' },
  { id: 'floor-plan', title: 'Floor Plan & Measurements', subtitle: 'Upload, zone, mark units' },
  { id: 'style', title: 'Materials & Finish', subtitle: 'Look, laminates, tolerance' },
  { id: 'vastu', title: 'Site Checks', subtitle: 'Vastu and practical notes' },
  { id: 'cooking', title: 'Production Notes', subtitle: 'Kitchen, storage, carcass' },
  { id: 'references', title: 'Review & Brief Notes', subtitle: 'References and final brief' }
];

export const styleOptions = [
  { value: 'indian-contemporary', label: 'Indian Contemporary' },
  { value: 'modern-luxury', label: 'Modern Luxury' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'warm-minimal', label: 'Warm Minimal' },
  { value: 'rustic', label: 'Rustic' },
  { value: 'japandi', label: 'Japandi' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'scandinavian-minimal', label: 'Scandinavian Minimal' },
  { value: 'bohemian-chic', label: 'Bohemian Chic' },
  { value: 'contemporary-classic', label: 'Contemporary Classic' },
  { value: 'art-deco', label: 'Art Deco' },
  { value: 'indian-heritage', label: 'Indian Heritage' },
  { value: 'tropical-modern', label: 'Tropical Modern' },
  { value: 'mid-century-modern', label: 'Mid-century Modern' },
  { value: 'maximalist-indian', label: 'Maximalist Indian' },
  { value: 'wabi-sabi', label: 'Wabi-sabi' }
];

export const floorPlanComponentTypes = [
  'TV Unit',
  'Sofa',
  'Bed',
  'Wardrobe',
  'Kitchen Run',
  'Island',
  'Dining',
  'Mandir',
  'Study Desk',
  'Shoe Rack',
  'Window',
  'Door',
  'Custom'
];

export const categoryTabs = [
  'All Elements',
  'Walls',
  'TV Wall',
  'Ceiling',
  'Sofa & Seating',
  'Storage',
  'Decor & Lighting',
  'Flooring',
  'Pooja Option'
];

export const showcaseImages = {
  living: [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/reference-library/indian-interiors/living-rooms/modern-living-01.jpg`,
    `${API_BASE}/reference-library/indian-interiors/living-rooms/indian-modern-living-room.jpg`
  ],
  kitchen: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/reference-library/indian-interiors/kitchens/indian-modular-kitchen.jpg`,
    `${API_BASE}/reference-library/indian-interiors/kitchens/kitchen-01.jpg`
  ],
  master: [
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/reference-library/indian-interiors/bedrooms/indian-master-bedroom.jpg`,
    `${API_BASE}/reference-library/indian-interiors/bedrooms/bedroom-01.jpg`
  ],
  kids: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/kids-bedroom-3d-01.jpg`,
    `${API_BASE}/reference-library/indian-interiors/bedrooms/bedroom-02.jpg`
  ],
  pooja: [
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/reference-library/indian-interiors/pooja-units/modern-pooja-unit.jpg`,
    `${API_BASE}/reference-library/indian-interiors/pooja-units/pooja-01.jpg`
  ],
  foyer: [
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/exterior-facade-3d-01.jpg`
  ],
  dining: [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/dining-room-3d-01.jpg`
  ],
  guest: [
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/master-bedroom-3d-01.jpg`
  ],
  study: [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/reference-library/indian-interiors/study-home-office/study-01.jpg`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/study-home-office-3d-01.jpg`
  ],
  balcony: [
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/balcony-3d-01.jpg`
  ],
  utility: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/modern-kitchen-3d-01.jpg`
  ],
  'whole-home': [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/modern-living-3d-01.jpg`,
    `${API_BASE}/reference-library/indian-interiors/renders-3d/living-room-evening-3d-01.jpg`
  ]
};

export const referenceGalleryItems = [
  `${API_BASE}/reference-library/floor-plans/3bhk/3bhk-sample-floorplan.jpg`,
  `${API_BASE}/reference-library/indian-interiors/living-rooms/modern-living-01.jpg`,
  `${API_BASE}/reference-library/indian-interiors/living-rooms/modern-living-02.jpg`,
  `${API_BASE}/reference-library/indian-interiors/living-rooms/indian-modern-living-room.jpg`,
  `${API_BASE}/reference-library/indian-interiors/kitchens/indian-modular-kitchen.jpg`,
  `${API_BASE}/reference-library/indian-interiors/bedrooms/indian-master-bedroom.jpg`,
  `${API_BASE}/reference-library/indian-interiors/pooja-units/modern-pooja-unit.jpg`,
  `${API_BASE}/reference-library/indian-interiors/study-home-office/study-01.jpg`
];

export const materialStrip = [
  { label: 'Fluted Panel', sub: 'Teak Finish', color: '#8a5a33' },
  { label: 'Italian Marble', sub: 'Crema Delicato', color: '#e8ddca' },
  { label: 'Sage Green', sub: 'Matte Acrylic', color: '#808767' },
  { label: 'Fabric', sub: 'Olive Weave', color: '#777b62' },
  { label: 'Antique Brass', sub: 'Brushed', color: '#b58a43' },
  { label: 'Wallpaper', sub: 'Textured Grasscloth', color: '#c8bca8' },
  { label: 'TV Unit', sub: 'Walnut Veneer', color: '#6f4426' }
];

export const designGalleryItems = [
  {
    id: 'g-living-teak',
    title: 'Warm Teak TV Wall',
    room: 'living',
    style: 'indian-contemporary',
    budgetTier: 'premium',
    image: `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    tags: ['fluted', 'teak', 'brass', 'tv-unit'],
    conversionNote: 'Strong first-presentation visual for 3BHK living rooms.'
  },
  {
    id: 'g-pooja-jali',
    title: 'Boutique Mandir Niche',
    room: 'pooja',
    style: 'indian-heritage',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    tags: ['mandir', 'jali', 'brass', 'warm-light'],
    conversionNote: 'Useful when clients ask for spiritual focal points without heavy ornament.'
  },
  {
    id: 'g-living-modern-01',
    title: 'Modern Indian Living Room',
    room: 'living',
    style: 'modern-luxury',
    budgetTier: 'premium',
    image: `${API_BASE}/reference-library/indian-interiors/living-rooms/modern-living-01.jpg`,
    tags: ['living-room', 'reference', 'indian', 'warm-neutral'],
    conversionNote: 'Good supporting reference when the client wants a cleaner modern living language.'
  },
  {
    id: 'g-kitchen-reference',
    title: 'Indian Modular Kitchen Reference',
    room: 'kitchen',
    style: 'minimalist',
    budgetTier: 'premium',
    image: `${API_BASE}/reference-library/indian-interiors/kitchens/indian-modular-kitchen.jpg`,
    tags: ['kitchen', 'reference', 'modular', 'easy-clean'],
    conversionNote: 'Useful for demonstrating modular kitchen discipline and practical storage.'
  },
  {
    id: 'g-kitchen-sage',
    title: 'Sage Modular Kitchen',
    room: 'kitchen',
    style: 'warm-minimal',
    budgetTier: 'premium',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['anti-fingerprint', 'sage', 'quartz', 'heavy-cooking'],
    conversionNote: 'Good for Indian cooking briefs needing easy-clean matte finishes.'
  },
  {
    id: 'g-master-reference',
    title: 'Indian Master Bedroom Reference',
    room: 'master',
    style: 'warm-minimal',
    budgetTier: 'premium',
    image: `${API_BASE}/reference-library/indian-interiors/bedrooms/indian-master-bedroom.jpg`,
    tags: ['bedroom', 'reference', 'wardrobe', 'warm-wood'],
    conversionNote: 'Supports a calm bedroom language with realistic storage proportions.'
  },
  {
    id: 'g-master-smoked',
    title: 'Smoked Glass Wardrobe',
    room: 'master',
    style: 'modern-luxury',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    tags: ['wardrobe', 'bronze', 'profile-shutters', 'sensor-light'],
    conversionNote: 'Luxury anchor for master suites and walk-in wardrobe briefs.'
  },
  {
    id: 'g-pooja-reference',
    title: 'Modern Pooja Room Reference',
    room: 'pooja',
    style: 'indian-heritage',
    budgetTier: 'premium',
    image: `${API_BASE}/reference-library/indian-interiors/pooja-units/modern-pooja-unit.jpg`,
    tags: ['mandir', 'reference', 'jali', 'brass'],
    conversionNote: 'Improves the intake gallery for clients who want a more contemporary devotional look.'
  },
  {
    id: 'g-living-marble',
    title: 'Marble Feature Wall',
    room: 'living',
    style: 'contemporary-classic',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['marble', 'quiet-luxury', 'storage', 'feature-wall'],
    conversionNote: 'Works for premium clients who want polish without too much colour.'
  },
  {
    id: 'g-foyer-storage',
    title: 'Foyer Storage Moment',
    room: 'foyer',
    style: 'indian-contemporary',
    budgetTier: 'premium',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['shoe-rack', 'mirror', 'console', 'stone'],
    conversionNote: 'Helps sell small but high-impact entry storage upgrades.'
  },
  {
    id: 'g-study-walnut',
    title: 'Walnut WFH Wall',
    room: 'study',
    style: 'mid-century-modern',
    budgetTier: 'premium',
    image: `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    tags: ['work-desk', 'bookshelf', 'walnut', 'concealed-wires'],
    conversionNote: 'Use for professionals needing a camera-ready work zone.'
  },
  {
    id: 'g-kids-soft',
    title: 'Soft Kids Storage',
    room: 'kids',
    style: 'scandinavian-minimal',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['washable', 'rounded-edges', 'toy-storage', 'pastel'],
    conversionNote: 'Shows parents that child-safe finishes can still look designed.'
  },
  {
    id: 'g-dining-brass',
    title: 'Dining Crockery Accent',
    room: 'dining',
    style: 'art-deco',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    tags: ['crockery', 'brass', 'glass', 'ambient-light'],
    conversionNote: 'A conversion-friendly upsell for dining walls and open-plan homes.'
  },
  {
    id: 'g-balcony-tropical',
    title: 'Tropical Balcony Sit-out',
    room: 'balcony',
    style: 'tropical-modern',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['outdoor-fabric', 'plants', 'weather-safe', 'tiles'],
    conversionNote: 'Makes balconies feel like part of the home, not leftover space.'
  },
  {
    id: 'g-guest-japandi',
    title: 'Japandi Guest Suite',
    room: 'guest',
    style: 'japandi',
    budgetTier: 'premium',
    image: `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    tags: ['light-wood', 'calm', 'wardrobe', 'neutral'],
    conversionNote: 'Good fallback for clients who want warmth but dislike ornate design.'
  },
  {
    id: 'g-utility-clean',
    title: 'Clean Utility Wall',
    room: 'utility',
    style: 'minimalist',
    budgetTier: 'value',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['laundry', 'broom-storage', 'wet-zone', 'easy-clean'],
    conversionNote: 'Turns practical service areas into a visible specification benefit.'
  },
  {
    id: 'g-living-rustic-lime',
    title: 'Rustic Limewash Living',
    room: 'living',
    style: 'rustic',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    tags: ['limewash', 'terracotta', 'wood', 'soft-light'],
    conversionNote: 'A warmer alternative for clients who reject glossy, showroom-heavy interiors.'
  },
  {
    id: 'g-kitchen-gloss',
    title: 'Gloss Accent Kitchen',
    room: 'kitchen',
    style: 'modern-luxury',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['acrylic', 'high-gloss', 'chimney', 'profile-handle'],
    conversionNote: 'Useful when clients want a sharper luxury kitchen while keeping Indian cooking practical.'
  },
  {
    id: 'g-master-wabi',
    title: 'Wabi-sabi Master Calm',
    room: 'master',
    style: 'wabi-sabi',
    budgetTier: 'premium',
    image: `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    tags: ['lime-plaster', 'ash-wood', 'calm', 'wardrobe'],
    conversionNote: 'Positions premium design as calm, tactile, and mature rather than shiny.'
  },
  {
    id: 'g-pooja-compact',
    title: 'Compact Apartment Mandir',
    room: 'pooja',
    style: 'indian-contemporary',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    tags: ['compact', 'mandir', 'storage', 'warm-led'],
    conversionNote: 'Solves the common apartment need for a visible mandir without losing storage.'
  },
  {
    id: 'g-foyer-mirror',
    title: 'Mirror Foyer Console',
    room: 'foyer',
    style: 'contemporary-classic',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['mirror', 'shoe-storage', 'console', 'brass'],
    conversionNote: 'A simple upgrade that makes small entryways feel intentional during the first reveal.'
  },
  {
    id: 'g-dining-minimal',
    title: 'Warm Minimal Dining Wall',
    room: 'dining',
    style: 'warm-minimal',
    budgetTier: 'premium',
    image: `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    tags: ['crockery-unit', 'oak', 'linen', 'ambient-light'],
    conversionNote: 'Works well for open-plan homes where dining should support the living palette.'
  },
  {
    id: 'g-study-industrial',
    title: 'Industrial Study Niche',
    room: 'study',
    style: 'industrial',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    tags: ['black-metal', 'walnut', 'desk', 'bookshelf'],
    conversionNote: 'A focused direction for young professionals who want an edgier work zone.'
  },
  {
    id: 'g-kids-boho',
    title: 'Boho Kids Activity Wall',
    room: 'kids',
    style: 'bohemian-chic',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['washable-paint', 'cane', 'toy-storage', 'activity-wall'],
    conversionNote: 'Adds personality while keeping cleaning and storage in the discussion.'
  },
  {
    id: 'g-guest-classic',
    title: 'Contemporary Classic Guest Room',
    room: 'guest',
    style: 'contemporary-classic',
    budgetTier: 'premium',
    image: `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    tags: ['neutral', 'wardrobe', 'wall-panel', 'soft-light'],
    conversionNote: 'A safe, premium guest-room option for multigenerational Indian homes.'
  },
  {
    id: 'g-balcony-japandi',
    title: 'Japandi Balcony Tea Corner',
    room: 'balcony',
    style: 'japandi',
    budgetTier: 'comfort',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['tea-corner', 'planter', 'outdoor-finish', 'wood-slat'],
    conversionNote: 'Turns a small balcony into a lifestyle image clients can immediately understand.'
  },
  {
    id: 'g-utility-premium',
    title: 'Premium Utility Storage',
    room: 'utility',
    style: 'indian-contemporary',
    budgetTier: 'premium',
    image: `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    tags: ['laundry', 'broom-unit', 'loft', 'wet-zone'],
    conversionNote: 'Shows operational discipline: every service area has storage, finish, and maintenance logic.'
  },
  {
    id: 'g-living-artdeco',
    title: 'Art Deco Brass TV Wall',
    room: 'living',
    style: 'art-deco',
    budgetTier: 'luxury',
    image: `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    tags: ['brass-inlay', 'emerald', 'marble', 'statement-wall'],
    conversionNote: 'A high-conversion option for clients asking for a luxurious but still Indian living room.'
  }
];

export const adminPlaybook = [
  { title: 'Client intake discipline', detail: 'Capture client, city, budget, rooms, floor plan, site notes, and production requirements before exporting.' },
  { title: 'Brief-first workflow', detail: 'Use the PDF brief as the approval document before moving the project into production planning.' },
  { title: 'Production confidence', detail: 'Keep material assumptions, measurements, board thickness, edge banding, and hardware notes visible.' },
  { title: 'Sellable handoff', detail: 'Move approved rooms into a cutlist project so the design team and workshop use the same source data.' }
];

export const approvalChecklist = [
  'Client profile complete',
  'Floor plan uploaded or annotated',
  'Room and module details confirmed',
  'Material preferences reviewed',
  'PDF brief generated',
  'Cutlist project created'
];

export const briefSections = [
  { title: 'Cover & Client Summary', detail: 'Client, project code, city, budget, timeline, and designer ownership.' },
  { title: 'Floor Plan Preview', detail: 'Uploaded plan, room zones, component markers, and placement notes.' },
  { title: 'Room Details', detail: 'Selected spaces, required units, furniture notes, storage needs, and site constraints.' },
  { title: 'Materials & Finish', detail: 'Laminate/finish direction, maintenance tolerance, dislikes, and budget assumptions.' },
  { title: 'Practical Checks', detail: 'Vastu notes, kitchen cooking intensity, safety, wet-zone, and service constraints.' },
  { title: 'Approval Sign-off', detail: 'Client approval, change-control note, and production handoff confirmation.' }
];

export const cutlistTemplates = [
  { id: 'tv-unit', title: 'TV Unit', room: 'Living', defaults: '18mm carcass, fluted/laminate fascia, cable void, wall backing.' },
  { id: 'base-kitchen', title: 'Kitchen Base Units', room: 'Kitchen', defaults: '710mm base body, 100mm plinth, BWP wet-zone carcass, edge banding.' },
  { id: 'wall-kitchen', title: 'Kitchen Wall Units', room: 'Kitchen', defaults: '720mm wall body, chimney clearances, lift-up/shutter hardware notes.' },
  { id: 'wardrobe', title: 'Wardrobe', room: 'Bedroom', defaults: '2100mm body, loft optional, hanging/drawer mix, visible-side marking.' },
  { id: 'mandir', title: 'Mandir / Pooja', room: 'Pooja', defaults: 'Jali/shutter notes, lighting channel, drawer/storage below, ventilation note.' },
  { id: 'foyer-storage', title: 'Foyer Storage', room: 'Foyer', defaults: 'Shoe ventilation, mirror/backing option, seat height, daily-use shelves.' }
];

export const defaultStudioSettings = {
  brandName: 'Spacious Venture',
  brandLine: 'Studio OS',
  logoPrimary: 'SPACIOUS',
  logoSecondary: 'VENTURE',
  studioAdmin: 'Spacious Venture',
  leadDesigner: 'Muskan P',
  leadRole: 'Lead Designer',
  contactEmail: 'studio@spaciousventure.in',
  contactPhone: '+91 98765 43210',
  city: 'Bengaluru',
  proposalFooter: 'This PDF brief records client requirements, floor-plan constraints, material assumptions, and approval notes before production handoff.',
  serviceScope: 'Client intake, render-backed PDF brief, material shortlist, and cutlist-ready production handoff.',
  paymentTerms: 'Configured by studio admin.',
  handoverNote: 'Final site measurements, working drawings, and production approvals must be verified before cutting.'
};

export const emptyClientProject = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  city: '',
  homeType: '3bhk',
  budgetTier: 'premium',
  timeline: '48-hour first design presentation',
  primaryStyle: 'indian-contemporary',
  luxuryLevel: 'warm-luxury',
  selectedSpaces: [],
  floorPlanNotes: '',
  familyProfile: [],
  cookingStyle: 'heavy-indian',
  poojaNeed: 'living-niche',
  storageHabits: '',
  finishTolerance: ['anti-fingerprint', 'easy-clean'],
  dislikedMaterials: '',
  notes: '',
  referenceLinks: ''
};

export const starterProject = {
  clientName: 'Aarav & Meera Shah',
  clientEmail: 'client@example.com',
  clientPhone: '+91 98765 43210',
  city: 'Mumbai',
  homeType: '3bhk',
  budgetTier: 'premium',
  timeline: '48-hour first design presentation',
  primaryStyle: 'indian-contemporary',
  luxuryLevel: 'warm-luxury',
  selectedSpaces: ['living', 'kitchen', 'master', 'kids', 'pooja'],
  floorPlanNotes: 'Living TV unit on longest uninterrupted wall, pooja close to living, kitchen work triangle to respect window and chimney wall.',
  familyProfile: ['Kids', 'Parents visiting', 'Hosting guests'],
  cookingStyle: 'heavy-indian',
  poojaNeed: 'dedicated-pooja',
  storageHabits: 'Floor-to-ceiling wardrobes, lofts for suitcases, saree hanging, toy storage, ventilated shoe rack.',
  finishTolerance: ['anti-fingerprint', 'easy-clean', 'child-safe', 'matte-plus-accent-gloss'],
  dislikedMaterials: 'No all-white glossy kitchen, avoid cold hotel-like grey everywhere.',
  notes:
    'Warm Indian contemporary home with teak, brass, sage, terracotta, fluted TV wall, washable kids room finishes, high-suction chimney, and a mandir that feels premium but not overly traditional.',
  referenceLinks:
    'Curated Pinterest board: Indian contemporary teak TV walls, sage modular kitchen, pooja jali, boutique hotel bedrooms.'
};

export const projectStages = [
  { label: 'Intake', status: 'Complete' },
  { label: 'PDF Brief', status: 'Ready for export' },
  { label: 'Client Approval', status: 'Pending sign-off' },
  { label: 'Cutlist Project', status: 'Next production step' }
];

export function classNames(...names) {
  return names.filter(Boolean).join(' ');
}

export const renderPromptPresets = [
  {
    id: 'kitchen-precision',
    label: 'Precision Kitchen (Beige Lofts + White Wall Units)',
    room: 'kitchen',
    description: 'Beige upper lofts, pure white wall cabinets around chimney, hob left / sink right under window, lofts stop at window frame',
    promptAdditions: [
      'Upper loft cabinets in warm beige laminate, terminating precisely at window frame edge',
      'Wall cabinets directly below lofts around chimney area in pure white laminate — NO beige color bleed',
      'Cooking hob (gas stove) on left counter, under-counter sink on right counter under window',
      'Chimney hood centered directly over hob, stainless steel with glass visor',
      'All top lofts touching ceiling have uniform height, aligned sightlines',
      'Counter: Calcutta gold marble look, backsplash matching counter'
    ]
  },
  {
    id: 'living-tv-wall',
    label: 'TV Wall with Concealed Rafter Door',
    room: 'living',
    description: 'Fluted rafters end at first door frame, backlit marble backpanel, flush door hidden behind slats',
    promptAdditions: [
      'Full-height fluted teak/oak rafters covering TV wall',
      'Rafters terminate cleanly at first door frame, transitioning to backlit Statuario marble backpanel',
      'Concealed flush door panel completely invisible when closed, wrapped in matching vertical wood slats',
      'Floating walnut TV console with brass profile, hidden cable management',
      'L-shaped sectional sofa against main wall, ending at room boundary',
      'Warm indirect cove lighting behind rafters and marble panel'
    ]
  },
  {
    id: 'master-wardrobe',
    label: 'Master Wardrobe Suite',
    room: 'master',
    description: 'Floor-to-ceiling wardrobes with smoked glass shutters, saree hanging, loft storage',
    promptAdditions: [
      'Floor-to-ceiling wardrobe system with smoked glass sliding shutters',
      'Dedicated saree hanging section with pull-out rods, brass hardware',
      'Upper loft storage for suitcases with pull-down mechanism',
      'Integrated dressing table with backlit mirror, warm LED',
      'Veneer finish in teak/walnut, matte anti-fingerprint laminate',
      'Soft-close drawers with velvet-lined jewelry inserts'
    ]
  },
  {
    id: 'pooja-mandir',
    label: 'Pooja Mandir with CNC Jali',
    room: 'pooja',
    description: 'CNC-cut teak mandir with backlit jali, brass bell, floating shelf for idols',
    promptAdditions: [
      'Custom CNC-cut teak mandir with intricate traditional jali pattern',
      'Backlit jali panel with warm amber LED, creating divine glow',
      'Floating shelf for deity idols in brass/bronze, proper vastu orientation',
      'Brass bell hanging from carved bracket, small drawer for incense',
      'Raised platform with white marble top, brass kalash',
      'Surrounding wall in warm terracotta or sage matte finish'
    ]
  },
  {
    id: 'kids-playful',
    label: 'Kids Room — Playful & Practical',
    room: 'kids',
    description: 'Bunk bed with storage stairs, study nook, toy rotation bins, washable finishes',
    promptAdditions: [
      'Custom bunk bed with built-in storage stairs, safety railings',
      'Study nook with floating desk, pegboard organizer, task lighting',
      'Toy rotation system: low open bins with picture labels',
      'Washable laminate finishes: sage green + warm wood accents',
      'Ceiling-mounted projector screen for learning/entertainment',
      'Blackout roller blinds, soft carpet tiles for play area'
    ]
  },
  {
    id: 'whole-home-flow',
    label: 'Whole Home — Cohesive Flow',
    room: 'whole-home',
    description: 'Unified palette across rooms: teak, brass, sage, terracotta, marble transitions',
    promptAdditions: [
      'Cohesive material palette flowing room to room: teak wood, brushed brass, sage green, terracotta, Statuario marble',
      'Consistent door hardware, switch plates, skirting profile throughout',
      'Flooring: large-format matte porcelain in warm greige, seamless across rooms',
      'Lighting: 2700K warm white, dimmable zones, consistent fixture family',
      'Transition thresholds: brass inlay at room boundaries',
      'Vastu-compliant furniture placement, clear circulation paths'
    ]
  }
];

export function getPromptPreset(id) {
  return renderPromptPresets.find(p => p.id === id);
}

export function getPromptPresetsForRoom(room) {
  return renderPromptPresets.filter(p => p.room === room || p.room === 'whole-home');
}
