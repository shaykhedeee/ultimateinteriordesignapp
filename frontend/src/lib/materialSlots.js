// Material slot model shared between store, inspector, and 3D viewport.
// Pure, framework-free, fully unit-tested so the "3D material selector" is verifiable
// without a browser.
//
// Each placed module exposes one or more material SLOTS. The allowed slots depend on
// the module type (kitchen units have a countertop; TV units have a back panel; etc).
// A slot maps to a material id (e.g. 'lam_1') resolved against the catalog.

export const SLOT_LABELS = {
  carcass: 'Carcass (Interior)',
  shutter: 'Shutter Finish (Facade)',
  countertop: 'Countertop Stone',
  backPanel: 'Back Panel',
  hardware: 'Hardware'
};

// Slots defined per module type. Keys must match materialAssignments keys.
export const MODULE_SLOTS = {
  kitchen_base: ['carcass', 'shutter', 'countertop', 'hardware'],
  kitchen_hob: ['carcass', 'shutter', 'countertop', 'hardware'],
  kitchen_wall: ['carcass', 'shutter', 'hardware'],
  kitchen_tall: ['carcass', 'shutter', 'hardware'],
  kitchen_island: ['carcass', 'shutter', 'countertop', 'hardware'],
  wardrobe_swing: ['carcass', 'shutter', 'hardware'],
  wardrobe_slider: ['carcass', 'shutter', 'hardware'],
  tv_unit: ['carcass', 'shutter', 'backPanel', 'hardware'],
  mandir_pooja: ['carcass', 'shutter', 'backPanel', 'hardware'],
  cabinet: ['carcass', 'shutter', 'hardware'],
  generic: ['carcass', 'shutter', 'hardware']
};

const DEFAULT_SLOTS = ['carcass', 'shutter', 'hardware'];

// Return the ordered list of material slot keys for a given module type.
export function getSlotsForModuleType(moduleType) {
  if (!moduleType || typeof moduleType !== 'string') return [...DEFAULT_SLOTS];
  // Try exact match, then prefix match (e.g. 'kitchen_l_shape' -> 'kitchen_base' slots).
  if (MODULE_SLOTS[moduleType]) return [...MODULE_SLOTS[moduleType]];
  const prefix = moduleType.split('_')[0];
  const byPrefix = Object.keys(MODULE_SLOTS).find(k => k.startsWith(prefix + '_'));
  if (byPrefix) return [...MODULE_SLOTS[byPrefix]];
  return [...DEFAULT_SLOTS];
}

// Produce a complete materialAssignments object for a freshly placed module,
// defaulting every slot to 'lam_1' (or a sensible per-slot default).
export function defaultMaterialAssignments(moduleType) {
  const slots = getSlotsForModuleType(moduleType);
  const out = {};
  for (const slot of slots) {
    out[slot] = slot === 'hardware' ? 'hw_1' : 'lam_1';
  }
  return out;
}

// Resolve a slot's material id to a catalog entry, falling back to a static palette.
const FALLBACK_PALETTE = [
  { id: 'lam_1', code: 'SF-9120', name: 'Premium Frosty White SF', brand: 'CenturyPly', finish: 'Suede Matte', color: '#f3f4f6' },
  { id: 'lam_2', code: 'SF-9210', name: 'Classic Warm Oak Woodgrain', brand: 'Greenlam', finish: 'Textured Wood', color: '#c29a6b' },
  { id: 'lam_3', code: 'SF-9300', name: 'Charcoal Matte Acrylic', brand: 'Merino', finish: 'Acrylic Gloss', color: '#1e293b' },
  { id: 'lam_4', code: 'SF-9400', name: 'Light Beige Gloss SF', brand: 'CenturyPly', finish: 'Gloss', color: '#e5e5e0' }
];

export function resolveMaterial(materialId, catalog = []) {
  if (!materialId) return null;
  const list = Array.isArray(catalog) && catalog.length ? catalog : FALLBACK_PALETTE;
  return list.find(m => m.id === materialId || m.code === materialId) || null;
}

// Human-readable summary used by the inspector + 3D viewport labels.
export function describeAssignment(materialId, catalog = []) {
  const mat = resolveMaterial(materialId, catalog);
  if (!mat) return 'Default';
  return `${mat.brand} · ${mat.name}`;
}
