/**
 * Zone Design Planner
 *
 * Produces structured JSON design plans from zone metadata.
 * This runs deterministically in-process and does not call image providers here.
 */

const STYLE_TEMPLATES = {
  living: { direction: 'Warm minimalism with balanced seating', keywords: ['mid-century', 'neutral', 'textured'], palette: ['#7a4c2a', '#b88a2f', '#f4efe3', '#26312d'], lighting: 'Layered ambient with localized task light' },
  kitchen: { direction: 'Clean workflow-forward kitchen', keywords: ['handleless', 'stone', 'matte'], palette: ['#8da48c', '#f5f0df', '#2f6f61', '#3f4742'], lighting: 'Under-cabinet plus ceiling wash' },
  master: { direction: 'Calm luxury retreat', keywords: ['moody', 'fabric', 'warm timber'], palette: ['#2b2d2b', '#b88a2f', '#ded2bc', '#6f7269'], lighting: 'Dimmable bedside and floor lamps' },
  pooja: { direction: 'Traditional calm with contemporary restraint', keywords: ['brass', 'wood', 'latte'], palette: ['#8b5c35', '#f7f2e8', '#b88a2f', '#6f2f1e'], lighting: 'Warm focused shrine lighting' },
  foyer: { direction: 'High-impact arrival space', keywords: ['art', 'stone', 'graphic'], palette: ['#1d211d', '#f5f0df', '#7a4c2a', '#b88a2f'], lighting: 'Statement fixture plus indirect cove' },
  generic: { direction: 'Balanced residential design', keywords: ['neutral', 'functional', 'light'], palette: ['#5c4f38', '#f4f0e6', '#2f2f2f', '#dcd6c8'], lighting: 'Balanced ceiling and accent' }
};

const BUDGET_SIGNALS = {
  economy: { markups: 'value-focused laminates and modular mix', avoid: ['stone veneer', 'full-height solid panels'] },
  standard: { markups: 'good-quality laminates with select solid panels', avoid: ['rare stone', 'complex mechanical automation'] },
  premium: { markups: 'premium laminates with solid-wood accents and stone', avoid: ['gold leaf', 'museum lighting'] },
  luxury: { markups: 'custom joinery, stone, brass, and designer fixtures', avoid: [] }
};

const CIRCULATION_DEFAULTS = {
  hallway: ['min 900 mm clearance', 'avoid projecting shelves'],
  corner: ['avoid deep units in tight corner', 'prefer flat-panel or open shelf'],
  window_front: ['avoid tall units blocking light', 'prefer low console or open shelf'],
  door_front: ['leave clear door swing', 'prefer floating or shallow silhouette'],
  generic: ['maintain 600 mm circulation frontage', 'keep lower zone airy']
};

export function buildZoneDesignPlan({ zone, styleBrief = '', budgetTier = 'standard', catalogProducts = [], organizationPreferences = '', climateInfo = '' }) {
  const typeKey = String(zone.type || '').toLowerCase();
  const roomType = Object.keys(STYLE_TEMPLATES).find((key) => typeKey.includes(key)) || 'generic';
  const template = STYLE_TEMPLATES[roomType];
  const budget = BUDGET_SIGNALS[budgetTier] || BUDGET_SIGNALS.standard;
  const circulationKey = (styleBrief ? styleBrief.toLowerCase() : typeKey).includes('corner') ? 'corner' : (styleBrief ? styleBrief.toLowerCase() : typeKey).includes('window') ? 'window_front' : (styleBrief ? styleBrief.toLowerCase() : typeKey).includes('door') ? 'door_front' : (styleBrief ? styleBrief.toLowerCase() : typeKey).includes('hall') ? 'hallway' : 'generic';
  const circulationRules = CIRCULATION_DEFAULTS[circulationKey] || CIRCULATION_DEFAULTS.generic;

  const designDirection = [template.direction, budget.markups, climateInfo ? `Climate-appropriate material: ${climateInfo}` : ''].filter(Boolean).join('; ');
  const styleKeywords = [...template.keywords, ...styleBrief.split(/[,\s]+/).filter(Boolean).slice(0, 4), `budget-${budgetTier}`].filter((item, idx, arr) => arr.indexOf(item) === idx && item);
  const palette = template.palette.map((color) => color);

  const baseMaterial = [roomType, 'laminate', 'metal'];
  const regionHint = (organizationPreferences || zone.metadata?.climate_zone || '').toString();
  const materials = [
    { code: `${budgetTier.slice(0,3).toUpperCase()}-LAM-01`, name: `Primary Laminate`, finish: budgetTier === 'luxury' ? 'High-gloss acrylic' : 'Matte/Texture', budget_tier: budgetTier, region_hint: regionHint || null },
    { code: `${budgetTier.slice(0,3).toUpperCase()}-MET-01`, name: 'Framing Metal', finish: 'Anodised aluminium', budget_tier: budgetTier, region_hint: regionHint || null }
  ];

  const lightingStrategy = [
    template.lighting,
    'Maintain even tonal fill; avoid glare sources directly in view'
  ];

  const placementNotes = [
    ...circulationRules,
    zone.aspect_ratio ? `Aspect ratio ${zone.aspect_ratio}: ${+zone.aspect_ratio < 1 ? 'vertical form favored' : 'horizontal form favored'}` : 'Balance volume and negative space equally'
  ];

  const suggestedProducts = catalogProducts.slice(0, 6);
  if (!suggestedProducts.length) {
    suggestedProducts.push(
      { name: 'Modular Low Credenza', category: 'storage', preview_color: palette[0], preferred: true },
      { name: 'Recessed LED Strip System', category: 'lighting', preview_color: palette[1], preferred: true },
      { name: 'Ceramic Table Lamp', category: 'lighting', preview_color: palette[2], preferred: false }
    );
  }

  const renderingConstraints = [
    'Keep major geometry from source manifest.',
    'Do not introduce dramatic perspective change.',
    'Keep labels and annotations minimal.',
    'Minimize occlusion of openings and fixed elements.'
  ];

  const promptReadyInstructions = [
    `Top-view ${roomType} design plan.`,
    designDirection,
    `Palette: ${palette.join(', ')}`,
    `Keywords: ${styleKeywords.join(', ')}`,
    'Preserve existing room polygon, walls, openings, and symbols.',
    ...circulationRules,
    ...(zone.metadata?.climate_zone ? [`Climate: ${zone.metadata.climate_zone}`] : [])
  ]
    .filter(Boolean)
    .join('\n- ');

  const plan = {
    zone_id: zone.id,
    room_type: roomType,
    design_direction: designDirection,
    style_keywords: styleKeywords,
    palette,
    materials,
    lighting_strategy: lightingStrategy,
    placement_notes: placementNotes,
    suggested_products: suggestedProducts,
    rendering_constraints: renderingConstraints,
    prompt_ready_instructions: promptReadyInstructions,
    constraints: {
      must_keep: [
        'Source polygon topology',
        'Opening centroid and type',
        'Existing symbols and labels'
      ],
      should_use: [
        'Palette-matched finishes',
        'Modular pieces respecting circulation zones',
        'Coherent lighting scale'
      ],
      should_avoid: [...budget.avoid, 'generic white-only styling', 'unreadable overlays'],
      circulation_constraints: circulationRules,
      realism_risks: [
        'Extreme aspect-ratio distortion',
        'Perspective drift from top view',
        'Heavy occlusion blocking room identity'
      ]
    },
    metadata: {
      area_sqft: zone.area_sqft || null,
      window_to_wall_ratio: zone.window_to_wall_ratio || null,
      budget_tier: budgetTier,
      climate_info: climateInfo || null,
      organization_preferences: organizationPreferences || null
    }
  };

  return plan;
}
