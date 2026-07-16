/**
 * Deterministic room-type prompt presets.
 *
 * This is the single source of truth for:
 * - base positive prompt structure
 * - style-aware tokens
 * - negative prompts
 * - parameter defaults
 *
 * These are intentionally deterministic, not vague LLM-only prompts.
 */

const STYLE_DEFAULT_TOKENS = {
  modern: ['modern interior design', 'clean lines', 'neutral palette', 'natural light', 'architectural photography', 'wide angle'],
  scandinavian: ['scandinavian interior', 'light oak', 'soft textiles', 'white walls', 'cozy minimalism', 'daylight'],
  industrial: ['industrial interior', 'exposed brick', 'metal accents', 'neutral tones', 'low-profile furniture', 'textured surfaces'],
  japandi: ['japandi interior', 'wabi-sabi', 'minimal calm', 'natural wood', 'muted palette', 'clean composition'],
  luxury: ['luxury interior', 'rich materials', 'layered lighting', 'tailored furniture', 'polished surfaces', 'hotel-like calm']
};

const NEGATIVE_DEFAULT = [
  'blurry',
  'distorted furniture',
  'floating objects',
  'impossible geometry',
  'text overlay',
  'watermark',
  'cropped view',
  'duplicate doors',
  'warped walls'
].join(', ');

const ROOM_PROMPTS = {
  living: {
    base: 'Design a modern living room with balanced seating layout, clear focal point, and natural light from windows.',
    extras: ['sofa set', 'coffee table', 'media wall', 'floor lamp', 'rug']
  },
  bedroom: {
    base: 'Design a calm bedroom with clear circulation, bedside lighting, and wardrobe placement.',
    extras: ['bed', 'nightstands', 'wardrobe', 'reading light', 'soft textiles']
  },
  kitchen: {
    base: 'Design a practical kitchen with efficient work triangle, clear counter zoning, and cabinet alignment.',
    extras: ['countertop', 'chimney', 'sink', 'storage cabinets', 'backsplash']
  },
  dining: {
    base: 'Design a dining area with table centered, clear serving access, and adjacent circulation.',
    extras: ['dining table', 'chairs', 'sideboard', 'pendant light']
  },
  pooja: {
    base: 'Design a compact pooja unit with shelf hierarchy, calm lighting, and back panel detail.',
    extras: ['mandir shelf', 'back panel', 'lamp', 'storage niche']
  },
  study: {
    base: 'Design a focused study nook with desk placement, task lighting, and accessible storage.',
    extras: ['study desk', 'chair', 'bookshelf', 'task lamp', 'cable management']
  },
  balcony: {
    base: 'Design a small balcony with weather-resistant seating, light screen, and airy palette.',
    extras: ['planters', 'lounger', 'screen', 'outdoor rug']
  },
  default: {
    base: 'Design a functional residential room with balanced furniture placement, natural light, and clean composition.',
    extras: ['furniture', 'lighting', 'storage', 'decor']
  }
};

export function buildRoomPrompt({ roomType = 'default', style = 'modern', userCustomPrompt = '', floorPlanConstraints = '' } = {}) {
  const key = String(roomType || 'default').toLowerCase();
  const preset = ROOM_PROMPTS[key] || ROOM_PROMPTS.default;
  const styleTokens = STYLE_DEFAULT_TOKENS[style] || STYLE_DEFAULT_TOKENS.modern;

  const parts = [
    preset.base,
    userCustomPrompt ? `User guidance: ${userCustomPrompt}` : null,
    floorPlanConstraints ? `Floor plan constraints: ${floorPlanConstraints}` : null,
    'Style: ' + styleTokens.join(', ') + '.',
    'Photography: architectural photography, wide angle, realistic materials.'
  ].filter(Boolean);

  return {
    roomType: key,
    prompt: parts.join(' '),
    negativePrompt: NEGATIVE_DEFAULT,
    styleTokens,
    extras: preset.extras
  };
}

export function getAvailableRoomTypes() {
  return Object.keys(ROOM_PROMPTS).filter((key) => key !== 'default');
}

export { STYLE_DEFAULT_TOKENS, NEGATIVE_DEFAULT };
