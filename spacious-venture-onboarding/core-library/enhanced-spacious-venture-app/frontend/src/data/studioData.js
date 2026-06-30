import {
  BarChart3,
  ClipboardList,
  FileText,
  FolderOpen,
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
  { id: 'dashboard', label: 'Onboarding', icon: Grid2X2 },
  { id: 'renders', label: 'AI Renders', icon: ImagePlus },
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
  { id: 'spaces', title: 'Scope & Rooms', subtitle: 'Rooms, modules, site type' },
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
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`
  ],
  kitchen: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`
  ],
  master: [
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`
  ],
  kids: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`
  ],
  pooja: [
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`
  ],
  foyer: [
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`
  ],
  dining: [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`
  ],
  guest: [
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`
  ],
  study: [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`,
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`
  ],
  balcony: [
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`
  ],
  utility: [
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/statutario_marble_tv_1779969617129.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`
  ],
  'whole-home': [
    `${API_BASE}/images/louvered_walnut_tv_1779969578489.png`,
    `${API_BASE}/images/cnc_teak_mandir_1779969965502.png`,
    `${API_BASE}/images/acrylic_lshape_kitchen_1779969662380.png`,
    `${API_BASE}/images/smoked_glass_wardrobe_1779969938746.png`
  ]
};

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
  { title: 'Client intake discipline', detail: 'Capture client, city, budget, rooms, floor plan, site notes, and production scope before exporting.' },
  { title: 'Brief-first workflow', detail: 'Use the PDF brief as the approval document before moving the project into production planning.' },
  { title: 'Production confidence', detail: 'Keep material assumptions, measurements, board thickness, edge banding, and hardware notes visible.' },
  { title: 'Sellable handoff', detail: 'Move approved rooms into a cutlist project so the design team and workshop use the same source data.' }
];

export const approvalChecklist = [
  'Client profile complete',
  'Floor plan uploaded or annotated',
  'Room and module scope confirmed',
  'Material preferences reviewed',
  'PDF brief generated',
  'Cutlist project created'
];

export const briefSections = [
  { title: 'Cover & Client Summary', detail: 'Client, project code, city, budget, timeline, and designer ownership.' },
  { title: 'Floor Plan Preview', detail: 'Uploaded plan, room zones, component markers, and placement notes.' },
  { title: 'Room Scope', detail: 'Selected spaces, required units, furniture notes, storage needs, and site constraints.' },
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

export const phaseOnePricing = {
  amount: 'INR 1,45,000',
  cap: 'Below INR 1.5 lakh one-time fee',
  milestones: [
    { label: 'Advance', amount: 'INR 58,000' },
    { label: 'Working Phase 1 build', amount: 'INR 58,000' },
    { label: 'Final handover', amount: 'INR 29,000' }
  ]
};

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
  proposalFooter: 'This PDF brief records client requirements, floor-plan constraints, material assumptions, and approval scope before production handoff.',
  commercialScope: 'One-time Phase 1 implementation for onboarding, PDF brief workflow, cutlist project, dashboard, materials, local storage, QA, and handover.',
  commercialFee: 'INR 1,45,000',
  paymentTerms: 'INR 58,000 advance, INR 58,000 working build, INR 29,000 final handover.',
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
