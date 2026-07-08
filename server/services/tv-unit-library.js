import db from '../database/database.js';

/**
 * Vast modular TV-unit library (canonical flow step 8).
 * Each entry: id, name, style, widthMm/heightMm/depthMm, color, finish, materials[].
 * `applyTvUnit` inserts the chosen style into the project's living space.
 */

export const TV_UNIT_LIBRARY = [
  { id: 'tv_louvered_walnut',  name: 'Louvered Walnut TV Wall',   style: 'Louvered',   widthMm: 2400, heightMm: 2100, depthMm: 450, color: '#8B6F47', finish: 'Woodgrain', materials: ['MDF', 'Laminate'] },
  { id: 'tv_cnc_teak',         name: 'CNC Teak Mandir-style TV',  style: 'CNC',        widthMm: 2200, heightMm: 2000, depthMm: 400, color: '#8B7A60', finish: 'Matte',     materials: ['Plywood', 'Laminate'] },
  { id: 'tv_fluted_oak',       name: 'Fluted Oak Floating TV',    style: 'Fluted',     widthMm: 2000, heightMm: 1800, depthMm: 350, color: '#C4B49D', finish: 'Woodgrain', materials: ['MDF', 'Veneer'] },
  { id: 'tv_floating_white',    name: 'Floating White Minimal',    style: 'Floating',   widthMm: 1800, heightMm: 1600, depthMm: 300, color: '#F5F5F0', finish: 'Matte',     materials: ['MDF', 'Acrylic'] },
  { id: 'tv_japandi',           name: 'Japandi Oak + Linen',       style: 'Japandi',    widthMm: 2100, heightMm: 1850, depthMm: 400, color: '#D8CBB8', finish: 'Matte',     materials: ['Plywood', 'Laminate'] },
  { id: 'tv_high_gloss_black',  name: 'High-Gloss Black Statement',style: 'High Gloss', widthMm: 2400, heightMm: 2100, depthMm: 450, color: '#1A1A1A', finish: 'High Gloss', materials: ['MDF', 'Acrylic'] },
  { id: 'tv_emerald_velvet',    name: 'Emerald Velvet Panel',      style: 'Upholstered',widthMm: 2200, heightMm: 1950, depthMm: 420, color: '#1F6F5C', finish: 'Matte',     materials: ['MDF', 'Fabric'] },
  { id: 'tv_sage_modular',      name: 'Sage Green Modular',        style: 'Modular',    widthMm: 2300, heightMm: 2000, depthMm: 430, color: '#9CAF88', finish: 'Matte',     materials: ['MDF', 'Laminate'] },
  { id: 'tv_brass_inlay',       name: 'Brass-Inlay Luxe',          style: 'Inlay',      widthMm: 2400, heightMm: 2100, depthMm: 450, color: '#B88A2F', finish: 'Gloss',     materials: ['Plywood', 'Acrylic'] },
  { id: 'tv_crockery_combo',    name: 'TV + Crockery Combo',       style: 'Combined',   widthMm: 3000, heightMm: 2100, depthMm: 450, color: '#8B6F47', finish: 'Woodgrain', materials: ['Plywood', 'Laminate'] },
  { id: 'tv_arched_marble',     name: 'Arched Marble Backdrop',    style: 'Arched',     widthMm: 2200, heightMm: 2200, depthMm: 400, color: '#E8E4DC', finish: 'Matte',     materials: ['MDF', 'Marble'] },
  { id: 'tv_two_tone',          name: 'Two-Tone W/B Knobs',        style: 'Two-Tone',   widthMm: 2400, heightMm: 2050, depthMm: 440, color: '#2B2B2B', finish: 'Matte',     materials: ['MDF', 'Laminate'] },
  { id: 'tv_industrial',        name: 'Industrial Loft',           style: 'Industrial', widthMm: 2000, heightMm: 1750, depthMm: 380, color: '#4A4A4A', finish: 'Matte',     materials: ['Plywood', 'Metal'] },
  { id: 'tv_led_cove',          name: 'Cove-LED Warm Glow',        style: 'LED Cove',   widthMm: 2400, heightMm: 2100, depthMm: 450, color: '#D8CBB8', finish: 'Gloss',     materials: ['MDF', 'Acrylic'] },
];

export function getTvUnitLibrary() {
  return TV_UNIT_LIBRARY;
}

export function getTvUnit(unitId) {
  return TV_UNIT_LIBRARY.find(u => u.id === unitId) || null;
}

/**
 * Insert the chosen TV unit into the project's living space (cad_drawings.furniture_json).
 * Replaces any existing tv-unit so re-picking swaps cleanly.
 */
export function applyTvUnit(projectId, unitId) {
  const unit = getTvUnit(unitId);
  if (!unit) return { ok: false, reason: 'UNKNOWN_TV_UNIT' };
  const cad = db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const next = furniture.filter(f => (f.type || '').toLowerCase() !== 'tv-unit' && (f.libraryId || '').toLowerCase() !== 'tvunit');
  // place in living room if known, else a sensible default
  const living = JSON.parse(cad.rooms_json || '[]').find(r => /living|hall|drawing/i.test(r.name || r.type || ''));
  const x = living ? Math.round((living.points?.[0]?.x ?? 300) + 40) : 300;
  const y = living ? Math.round((living.points?.[0]?.y ?? 300) + 40) : 400;
  next.push({
    id: 'f_tvunit_' + unit.id,
    libraryId: unit.id,
    name: unit.name,
    type: 'tv-unit',
    x, y,
    width: Math.round(unit.widthMm / 10),
    height: Math.round(unit.heightMm / 10),
    depth: Math.round(unit.depthMm / 10),
    color: unit.color,
    finish: unit.finish,
    materials: unit.materials,
  });
  db.prepare('UPDATE cad_drawings SET furniture_json = ? WHERE project_id = ?').run(JSON.stringify(next), projectId);
  return { ok: true, applied: unit, count: next.length };
}

export default { TV_UNIT_LIBRARY, getTvUnitLibrary, getTvUnit, applyTvUnit };
