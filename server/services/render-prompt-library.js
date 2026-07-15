/**
 * render-prompt-library.js — SINGLE SOURCE OF TRUTH for every render/
 * refinement prompt in ULTIDA.
 *
 * Architecture contract (enforced by the prompt text this module emits):
 *   1. Geometry is the source of truth. Exact room dimensions, furniture
 *      scale, cabinet module widths, wall positions, and openings ALWAYS come
 *      from the approved scene graph — never from the AI model.
 *   2. Blender/Cycles produces the deterministic base render from that geometry.
 *   3. AI image generation / editing is ONLY allowed AFTER geometry is locked,
 *      and may improve light, materials, finish, atmosphere — never layout,
 *      wall lengths, cabinet sizes, or furniture placement.
 *
 * Every prompt produced here therefore contains a hard "DO NOT CHANGE"
 * geometry block plus role-specific negative prompts. Downstream flows
 * (laminate swap, render edit, refinement) call buildRenderPrompt() so the
 * rules stay consistent in one place.
 */

// ---------------------------------------------------------------------------
// Shared geometry-preservation block — appended to every prompt.
// ---------------------------------------------------------------------------
const GEOMETRY_LOCK = [
  'Use the approved scene graph as the only layout source. Create a physically realistic base render with accurate dimensions, correct furniture scale, soft natural shadows, and interior-photography composition.',
  'DO NOT change, move, add, remove, rescale, or re-proportion any geometry.',
  'DO NOT change wall positions, wall lengths, ceiling height, or floor area.',
  'DO NOT change cabinet/module widths, shutter lines, drawer divisions, or appliance positions.',
  'DO NOT change furniture placement, furniture scale, or opening (door/window) sizes.',
  'DO NOT alter camera position, focal length, FOV, or framing that was set by the base render.',
  'If the request implies a layout change, REFUSE the layout change and only perform the allowed polish.',
];

// ---------------------------------------------------------------------------
// Per-space themed positive direction (realism/style only, no geometry).
// ---------------------------------------------------------------------------
const SPACE_DIRECTION = {
  kitchen: [
    'Render a professional modular kitchen with exact cabinet modules, realistic worktop proportions, believable appliance scale, accurate backsplash height, and premium Indian residential styling.',
    'Preserve all cabinet module widths, shutter lines, baskets, rolling shutters, hob, sink, and tall units exactly as modeled.',
    'Show realistic laminate sheen, granite/quartz countertop reflection, and soft under-cabinet light spill.',
    'Correct appliance scale (chimney, hob, sink, fridge) matching the modeled dimensions.',
  ],
  wardrobe: [
    'Premium Indian walk-in / fitted wardrobe: clean, calm realism.',
    'Preserve shutter divisions, loft, loft height, handle lines, and internal accessories exactly as modeled.',
    'Show accurate laminate/glass/ Mirror finish response and soft interior lighting.',
  ],
  living: [
    'Warm, high-end Indian residential living room, like professional interior photography.',
    'Preserve sofa scale, TV unit width, pooja/console placement, and rug boundaries exactly as modeled.',
    'Accurate soft contact shadows, realistic fabric and wood response, believable depth of field.',
  ],
  tv: [
    'Feature TV wall / entertainment unit: premium, focused realism.',
    'Preserve TV unit module widths, shutter lines, open shelving, and backlit panel geometry exactly as modeled.',
    'Show correct emissive screen tone, wood/laminate sheen, and accent lighting without blooming.',
  ],
  pooja: [
    'Sacred pooja / mandir unit: serene, devotional realism with warm brass/wood.',
    'Preserve jali pattern, dome/arches, shelf divisions, and diya positions exactly as modeled.',
    'Accurate warm backlight through jali, brass sheen, and marble/wood finish.',
  ],
  bathroom: [
    'Clean, spa-like Indian bathroom realism.',
    'Preserve vanity width, counter, mirror, and fixture positions exactly as modeled.',
    'Accurate tile grout, matte/gloss response, and soft diffused daylight.',
  ],
  elevation: [
    'Produce a measured, production-readable wall elevation with correct dimensions, cabinet tags, and clean drawing hierarchy.',
    'Preserve every cabinet/shutter dimension, material schedule entries, and chained/overall dimensions from the scene.',
    'No invented modules; only restyle line weight, hatch, and annotation clarity.',
  ],
  generic: [
    'Professional interior photography realism with physically-based materials.',
    'Warm 2700K lighting, realistic reflections, soft contact shadows, accurate finishes.',
  ],
};

// ---------------------------------------------------------------------------
// Universal negative prompt — protects geometry + fixes common AI drift.
// ---------------------------------------------------------------------------
const UNIVERSAL_NEGATIVE = [
  'no layout changes',
  'no added or removed furniture',
  'no moved walls or changed room dimensions',
  'no changed cabinet widths or shutter lines',
  'no distorted proportions',
  'no changed camera angle or focal length',
  'no floating objects',
  'no extra doors or windows',
  'no text, watermarks, or logos',
  'no CGI artifacts, no plastic look, no oversaturated colors',
  'no overexposed windows, no blown highlights',
  'no blurry or melted geometry',
];

// ---------------------------------------------------------------------------
// Target lighting/material atmosphere (the polish the AI IS allowed to do).
// ---------------------------------------------------------------------------
const ATMOSPHERE = {
  'warm-2700k': 'Warm 2700K ambient light, soft contact shadows, realistic reflections, accurate laminate/wood/stone finishes, high-end professional interior photography look.',
  'cool-daylight': 'Cool balanced daylight, crisp shadows, neutral material response, architectural visualization look.',
  'evening': 'Low warm evening ambience, gentle lamp glow, long soft shadows, cozy residential mood.',
  'studio': 'Even studio lighting, minimal shadow, product-catalog clarity for cabinetry.',
};

// ---------------------------------------------------------------------------
// Correction prompts for common render issues (still geometry-locked).
// ---------------------------------------------------------------------------
export const CORRECTION_PROMPTS = {
  bad_lighting: {
    label: 'Fix bad lighting',
    positive: 'Rebalance interior lighting: lift shadowed areas, tame harsh hotspots, keep light direction consistent with the base render.',
    negative: 'no changed light fixtures, no moved windows, no altered ceiling height, no overexposed windows',
  },
  wrong_laminate_tone: {
    label: 'Wrong laminate tone',
    positive: 'Recolor the specified laminate/wood to the exact requested tone and sheen; keep all other surfaces unchanged.',
    negative: 'no changed cabinet geometry, no changed shutter lines, no other material changes',
  },
  overexposed_windows: {
    label: 'Overexposed windows',
    positive: 'Recover window highlight detail and exterior view; reduce blow-out while keeping interior exposure.',
    negative: 'no changed window size, no moved window, no altered wall opening',
  },
  weak_shadows: {
    label: 'Weak / missing shadows',
    positive: 'Add believable soft contact shadows under furniture and cabinets; ground objects naturally.',
    negative: 'no moved furniture, no changed furniture scale, no new objects',
  },
  awkward_camera: {
    label: 'Awkward camera angle',
    note: 'Camera changes are NOT permitted after geometry lock. Use only when re-rendering the base from an approved scene-graph camera. Otherwise refuse and keep framing.',
    positive: 'Keep the approved camera framing. If a reshoot is authorized, match the scene-graph camera exactly (same x/y/z, target, FOV).',
    negative: 'no free camera change, no new perspective, no changed FOV',
  },
};

// ---------------------------------------------------------------------------
// Public builder. All flows call this.
// ---------------------------------------------------------------------------
export function buildRenderPrompt({
  space = 'generic',
  atmosphere = 'warm-2700k',
  instruction = '',
  correction = null,
  extraNegative = [],
} = {}) {
  const direction = SPACE_DIRECTION[space] || SPACE_DIRECTION.generic;
  const atmo = ATMOSPHERE[atmosphere] || ATMOSPHERE['warm-2700k'];
  const corr = correction ? CORRECTION_PROMPTS[correction] : null;

  const positive = [
    'REFINEMENT TASK — enhance realism only. Geometry is locked from the approved scene graph.',
    ...direction,
    atmo,
    ...(corr ? [`CORRECTION — ${corr.label}: ${corr.positive}`] : []),
    ...(instruction ? [`Designer instruction: ${instruction}`] : []),
    'Improve realism, lighting balance, reflections, and material response only. Do not change walls, openings, ceiling height, cabinet sizes, furniture placement, or room geometry.',
  ].filter(Boolean);

  const negative = [
    ...UNIVERSAL_NEGATIVE,
    ...(corr ? [corr.negative] : []),
    ...extraNegative,
  ].filter(Boolean);

  const system = [
    'You are ULTIDA’s render refinement engine. You NEVER author geometry.',
    ...GEOMETRY_LOCK,
  ].join('\n');

  return {
    system,
    positive: positive.join('\n'),
    negative: negative.join(', '),
    geometryLocked: true,
    space,
    atmosphere,
    correction,
  };
}

// Convenience: produce a single combined text prompt (for providers that take one string).
export function buildRenderPromptText(opts = {}) {
  const p = buildRenderPrompt(opts);
  return [
    '### SYSTEM',
    p.system,
    '',
    '### POSITIVE PROMPT',
    p.positive,
    '',
    '### NEGATIVE PROMPT',
    p.negative,
  ].join('\n');
}

// Laminate / material swap reuses the same lock (kept compatible with the
// existing visualizer-engine.buildLaminateSwapPrompt contract).
export function buildMaterialSwapPrompt({ componentType, newMaterial, newColor, laminateCode, laminateBrand, instruction, swatchContext = '' } = {}) {
  const base = buildRenderPrompt({ space: 'generic', instruction: '' });
  const parts = [
    'Change only the specified material surfaces. Preserve all geometry, edges, module positions, and object proportions exactly.',
    '',
    'STRICT PRESERVATION RULES — DO NOT CHANGE:',
    '• Camera angle, perspective, focal length, and framing',
    '• Room geometry: walls, ceiling height, floor area, window positions',
    '• Lighting direction, color temperature, and shadow casting',
    '• All other furniture, fixtures, and decor NOT specified for change',
    '• Cabinet/module widths, shutter lines, appliance positions',
    '',
    'SINGLE CHANGE TO MAKE:',
    `• Component: ${componentType}`,
    `• New Material: ${newMaterial || newColor || 'as specified'}${newColor ? ` with exact color tone ${newColor}` : ''}${laminateCode ? ` (product code: ${laminateCode})` : ''}${laminateBrand ? ` by ${laminateBrand}` : ''}`,
    instruction ? `• Designer Instruction: ${instruction}` : '',
    swatchContext,
    '',
    'OUTPUT QUALITY REQUIREMENTS:',
    '• Photorealistic CGI, physically-based materials (correct roughness, reflection, sheen)',
    '• Accurate grain/vein direction, no watermarks, no text, no distortion',
    '• Indian modular interior design standards',
  ].filter(Boolean);
  return { system: base.system, positive: parts.join('\n'), negative: base.negative, geometryLocked: true };
}

// Catalogue of available templates for the UI.
export const PROMPT_LIBRARY_CATALOG = {
  spaces: Object.keys(SPACE_DIRECTION),
  atmospheres: Object.keys(ATMOSPHERE),
  corrections: Object.fromEntries(Object.entries(CORRECTION_PROMPTS).map(([k, v]) => [k, v.label])),
};

export default { buildRenderPrompt, buildRenderPromptText, buildMaterialSwapPrompt, CORRECTION_PROMPTS, PROMPT_LIBRARY_CATALOG };
