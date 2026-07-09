/**
 * prompt-harness.js — Canonical prompt engineering for interior AI.
 *
 * Single source of truth for all prompt variants. Each entry is a parameterized
 * template that returns a structured prompt payload for AI providers. This keeps
 * prompt quality consistent across AURA, render generation, photo analysis, and
 * client-share copy generation.
 */

const STYLE_GUIDE = {
  modern: 'Minimal modern: clean lines, neutral palette, functional forms, matte finishes, subtle texture.',
  scandinavian: 'Scandinavian: light woods, whites, cozy textiles, hygro focus, organic curves, natural light.',
  japandi: 'Japandi: Wabi-sabi warmth + modern minimalism, oak, linen, tatami tones, low contrast, shadow detail.',
  industrial: 'Industrial: exposed structure, metal, reclaimed wood, leather, Edison bulbs, monochrome with rust accents.',
  bohemian: 'Bohemian: layered rugs, plants, warm tones, rattan, brass, global textiles, artisanal feel.',
  classic: 'Classic: Mouldings, symmetry, brass, marble, heritage timbers, balanced proportions, refined ornament.'
};

const ROOM_GUIDE = {
  living: 'Living room: seating groups, coffee table height 450–480mm, TV console 400–500mm above floor, rug under legs, ambient + task + accent lighting, 2700–3000K.',
  bedroom: 'Bedroom: centered king/queen bed, bedside tables 500–560mm high, wardrobe depth 550–600mm, task reading light, full-length mirror, linens focus.',
  kitchen: 'Kitchen: work triangle distances 3.6m max, counter height 900mm, overhead cabinet at 1500–1800mm, under-cabinet task light, ventilation clearances, appliance adjacency.',
  bathroom: 'Bathroom: vanity 750–850mm high, minimum 600mm clearances, shower 900x900mm, ventilation, slip rating, storage near water.',
  balcony: 'Balcony: durable outdoor materials, drainage fall, wind-resistant plants, low-maintenance finishes, weatherproof storage.',
  study: 'Study: desk 700–750mm high, 700mm depth, monitor at eye level, task lighting 300–500 lux, acoustic treatment optional.'
};

// ULTIDA signature interior language — extracted from the studio's approved
// reference renders (wardrobes, living, pooja, kitchen, foyer). Injected into
// every AURA + render prompt so generated output matches the premium system.
const ULTIDA_SIGNATURE = [
  'ULTIDA luxury Indian-modern signature:',
  'warm-white/cream plaster walls, large-format beige marble-vein floors with soft reflection,',
  'two-tone cabinetry — warm walnut/teak veneer + matte cream + charcoal ribbed/fluted panels, slim black bar handles,',
  'integrated warm 2700K LED: cove perimeter strip, under-cabinet glow, arched-mirror halo backlight, hidden glow behind wood slats,',
  'channel-tufted sage/seafoam or deep-teal headboard, black-and-white houndstooth throw, brass accents,',
  'glass-front display cabinets with internal warm light; Hindu pooja niche with brass Ganesha idol + lit diyas when applicable;',
  'editorial, uncluttered styling, photoreal PBR materials, corrected perspective, straight verticals, no cold corporate palette.'
].join(' ');

export function buildRoomStylePayload({ roomType = 'living', style = 'modern', budgetTier = 'standard', provider = 'pollinations', aspectRatio = '16:9', customInstruction = '', count = 1 } = {}) {
  const roomText = ROOM_GUIDE[roomType] || ROOM_GUIDE.living;
  const styleText = STYLE_GUIDE[style] || STYLE_GUIDE.modern;

  const positive = [
    `${roomType} optimized interior`,
    `${style} design language`,
    budgetTier === 'premium' ? 'premium materials, elevated joinery, high-gloss finishes' : 'standard laminate, melamine board, cost-effective fittings',
    'professional photograph, 8K interior magazine',
    'soft shadows, global illumination, depth of field, architectural photography',
    'warm ambient light, balanced exposure, natural materials'
  ].join(', ');

  const guidance = [
    `[ROOM RULES] ${roomText}`,
    `[STYLE RULES] ${styleText}`,
    `[ULTIDA SIGNATURE] ${ULTIDA_SIGNATURE}`,
    '[COMPOSITION] Follow rule of thirds, focal point on primary furniture group, 24–35mm lens equivalent feel, low angle, eye-level horizon.',
    '[LIGHTING] Warm white 2700–3000K, layered: ambient + task + accent.',
    '[MATERIALS] Realistic PBR: matte, satin, brushed metal, oak grain, marble veining.',
    '[NEGATIVE PROMPT] cartoon, illustration, watermark, text, blurry, distorted, dollhouse, toy, poster, drawings of furniture instead of real objects.',
    budgetTier === 'luxury' ? '[BUDGET SIGNAL] Luxury tier — marble, brass, leather, curated art.' : budgetTier === 'economy' ? '[BUDGET SIGNAL] Economy tier — laminate, standard hardware, no exotic materials.' : '[BUDGET SIGNAL] Standard tier — mid-range laminates, basic hardware.'
  ].join(' | ');

  const prompt = `${positive}. Strictly follow: ${guidance}${customInstruction ? ' Additional instructions: ' + String(customInstruction).slice(0, 500) : '' }.`;

  return {
    provider,
    payload: {
      prompt: prompt.slice(0, 1200),
      aspectRatio,
      n: Math.min(4, Math.max(1, Number(count) || 1))
    },
    meta: { roomType, style, budgetTier, provider }
  };
}

export function buildVisionPayload({ source = 'elevation', scaleRef = null } = {}) {
  const text = [
    '[VISION TASK] Interior wall elevation analysis.',
    'Identify: room type, window/door openings, electrical points, Plumbing/shower points if bathroom, furniture heights, floor material.',
    'Return structured JSON with categories: roomProposal, openings, components, finishes, layout, confidence per item.',
    'Do not invent if unknown. Use null with confidence 0 instead.'
  ].join(' ');

  return {
    source,
    prompt: text,
    attachments: scaleRef ? [{ type: 'scale_reference', data: scaleRef }] : []
  };
}

export function buildCutlistGenerationPayload({ drawing, materials = [], defaults = {} } = {}) {
  const panelThickness = defaults.panelThicknessMm || 18;
  const overlap = defaults.stepOverlapMm || 100;
  const kerf = defaults.kerfMm || 3;

  return {
    prompt: `[CUTLIST RULES] Optimize panel nesting from cabinet geometry with kerf ${kerf}mm, panel thickness ${panelThickness}mm. Use standard sheet sizes 2440x1220mm and 2100x900mm. Prioritize grain continuity for faces.`,
    drawing,
    materials,
    rules: { panelThicknessMm: panelThickness, stepOverlapMm: overlap, kerfMm: kerf }
  };
}

export function buildFloorplanTextInterpretationPrompt({ scaleRef = null, language = 'en' } = {}) {
  const scale = scaleRef ? `Scale reference: ${JSON.stringify(scaleRef)}.` : 'No explicit scale.';
  return {
    prompt: [
      '[FLOORPLAN TASK] Read the provided plan image and extract: rooms, walls, openings (doors/windows), dimensions, labels.',
      `${scale}`,
      'Return JSON with keys: rooms, walls, openings, dimensionNotes. Do not invent coordinates if text is unclear.'
    ].join(' '),
    language
  };
}

export function buildClientCopyPayload({ type = 'brief', project = {} } = {}) {
  const firm = project.firmName || 'Studio';
  const client = project.clientName || 'Client';
  const projectName = project.name || 'Project';

  const prefixes = {
    brief: 'Design Brief',
    signoff: 'Client Sign-off',
    quotation: 'Quotation / Estimate',
    presentation: 'Presentation'
  };

  return {
    prompt: `[CLIENT COPY] ${prefixes[type] || 'Brief'} for ${firm}: ${projectName}. Tone: confident, calm, premium. First line addresses ${client}. Include scope summary, key selections, room-wise deliverable list, timeline, and next step.`,
    meta: { type, firm, client, projectName }
  };
}
