/**
 * aura-design-rules.js — AURA design-rules + retrieval + structured-action proposer
 *
 * Per the AURA Tiny Model Plan (orchestrator-first, NO trained model yet):
 *   - RULES: kitchen, wardrobe, vastu, lighting, sofa sizing, elevation standards
 *   - RETRIEVAL: material catalogs, prior corrections (laminate_swap_history),
 *     approved designs (scene_versions), product specs
 *   - TOOLS: the proposals reference real backend actions (scene edit, elevation
 *     generator, cutlist, render) so the frontend can execute them.
 *
 * Output contract (the plan's exit criteria): structured JSON actions with
 * confidence + reasoning — NEVER free-form design claims.
 *
 *   { action, params, confidence, reasoning, source }
 *
 * Examples it MUST be able to produce:
 *   - "resize sofa to 2600 mm for 3800 mm wall"  (sofa sizing rule)
 *   - "move mesh basket below rolling shutter"    (kitchen work-zone rule)
 */

import db from '../database/database.js';

const getDb = () => db;

// ── Rule catalog (transparent, auditable) ──────────────────────────────────
export const DESIGN_RULES = [
  { id: 'sofa_sizing_by_wall', domain: 'furniture', label: 'Sofa width derived from wall length',
    detail: 'Sofa width = wallLength - 2×600mm circulation, clamped 1800–3400mm, not exceeding 85% of wall. Round to nearest 100mm.' },
  { id: 'kitchen_mesh_below_shutter', domain: 'kitchen', label: 'Mesh basket sits below rolling shutter',
    detail: 'When a module has both a rolling shutter and a mesh basket, the basket must be lower (greater y) than the shutter.' },
  { id: 'kitchen_work_clearance', domain: 'kitchen', label: 'Minimum 900mm work clearance',
    detail: 'Walking clearance in front of a counter run must be ≥ 900mm; hob/sink/fridge form the work triangle.' },
  { id: 'vastu_pooja_ne', domain: 'vastu', label: 'Pooja/mandir in North-East',
    detail: 'Pooja unit placed in NE zone; kitchen in SE; master bedroom in SW.' },
  { id: 'lighting_from_brief', domain: 'lighting', label: 'Lighting follows client brief',
    detail: 'False ceiling / strip lights only when the brief selects them; otherwise warm cove lighting.' },
  { id: 'elevation_sheet_standard', domain: 'elevation', label: 'A3 landscape, white background, chained dims',
    detail: 'Elevations must be A3 landscape, white background, clean tags, chained + overall dimensions, no viewport clutter.' }
];

// ── Retrieval: pull real project context so proposals are grounded ──────────
export function retrieveContext(projectId) {
  const d = getDb();
  const ctx = { materialCatalog: [], corrections: [], approvedDesigns: [], productSpecs: [] };
  try {
    ctx.materialCatalog = d.prepare(
      "SELECT code, name, category, brand, finish, price_per_sqft FROM material_catalog WHERE is_active = 1 ORDER BY rating DESC LIMIT 25"
    ).all();
  } catch {}
  try {
    ctx.corrections = d.prepare(
      "SELECT component_type, material_slot, new_material, before_material, approved FROM laminate_swap_history WHERE project_id = ? ORDER BY created_at DESC LIMIT 25"
    ).all(projectId);
  } catch {}
  try {
    ctx.approvedDesigns = d.prepare(
      "SELECT id, version_number, scene_json FROM scene_versions WHERE project_id = ? AND is_current = 1 ORDER BY version_number DESC LIMIT 1"
    ).all(projectId);
  } catch {}
  try {
    ctx.productSpecs = d.prepare(
      "SELECT code, name, category, brand, finish FROM material_catalog WHERE category IN ('hardware','handle','hinge','basket','channel') LIMIT 40"
    ).all();
  } catch {}
  return ctx;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round100 = (v) => Math.round(v / 100) * 100;

// Parse a wall length in mm from free text like "3800 mm wall" or "wall is 3.8m".
function parseWallMm(text) {
  if (!text) return null;
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(mm|m|cm)\b/i);
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 'm') return Math.round(val * 1000);
  if (unit === 'cm') return Math.round(val * 10);
  return Math.round(val);
}

// Sofa sizing rule -> structured action for a given wall length (mm).
function sofaSizingAction(wallMm) {
  const sofa = clamp(round100(wallMm - 1200), 1800, 3400);
  const maxByPct = round100(wallMm * 0.85);
  const finalSofa = Math.min(sofa, maxByPct);
  return {
    action: 'resize_furniture',
    params: { componentType: 'sofa', widthMm: finalSofa, wallMm, clearanceMm: wallMm - finalSofa },
    confidence: 0.92,
    reasoning: `Sofa width = wall ${wallMm}mm − 2×600mm circulation = ${wallMm - 1200}mm, clamped to ≤85% wall (${maxByPct}mm) and within 1800–3400mm → ${finalSofa}mm.`,
    source: 'rule:sofa_sizing_by_wall'
  };
}

// Kitchen work-zone rule -> detect rolling shutter + mesh basket ordering.
function kitchenMeshAction(modules) {
  const actions = [];
  for (const mod of (modules || [])) {
    const hasShutter = /rolling\s*shutter|roller\s*shutter/i.test(mod.type || mod.name || '');
    const hasBasket = /mesh\s*basket|basket/i.test(mod.type || mod.name || '');
    if (hasShutter && hasBasket) {
      const shutterY = Number(mod.shutterY ?? mod.y ?? 0);
      const basketY = Number(mod.basketY ?? (Number(mod.y ?? 0) + 400));
      if (basketY <= shutterY) {
        actions.push({
          action: 'reposition_component',
          params: { moduleId: mod.id, component: 'mesh_basket', below: 'rolling_shutter', targetYMm: shutterY + 350 },
          confidence: 0.9,
          reasoning: `Module "${mod.name || mod.type}" has a rolling shutter and a mesh basket, but the basket is not below the shutter. Move mesh basket below the rolling shutter (target y ≈ ${shutterY + 350}mm).`,
          source: 'rule:kitchen_mesh_below_shutter'
        });
      }
    }
  }
  return actions;
}

// Vastu rule -> propose pooja in NE if a pooja component exists elsewhere.
function vastuAction(rooms) {
  const actions = [];
  const pooja = (rooms || []).find((r) => /pooja|mandir|temple/i.test(r.type || r.name || ''));
  if (pooja && !(pooja.zone === 'NE' || pooja.direction === 'north-east' || pooja.x < 0.4 * (pooja.maxX || 1) && pooja.y < 0.4 * (pooja.maxY || 1))) {
    actions.push({
      action: 'move_room',
      params: { room: pooja.name || pooja.type, toZone: 'NE' },
      confidence: 0.8,
      reasoning: 'Vastu: pooja/mandir should be placed in the North-East zone. Current placement does not satisfy this.',
      source: 'rule:vastu_pooja_ne'
    });
  }
  return actions;
}

// Elevation standard rule -> flag non-compliant elevations for re-export.
function elevationStandardAction(projectId) {
  const d = getDb();
  try {
    const rows = d.prepare(
      "SELECT id, room FROM design_renders WHERE project_id = ? AND review_status = 'unreviewed' LIMIT 10"
    ).all(projectId);
    if (rows.length) {
      return [{
        action: 'regenerate_elevation',
        params: { standard: 'A3-landscape-white-chained-dims', pendingRenders: rows.length },
        confidence: 0.75,
        reasoning: `${rows.length} elevation/render item(s) are still unreviewed. Re-export to A3 landscape, white background, chained + overall dimensions before client handoff.`,
        source: 'rule:elevation_sheet_standard'
      }];
    }
  } catch {}
  return [];
}

/**
 * Main entry: propose structured design actions from a scene + optional free-text.
 * @param {Object} opts
 * @param {string} opts.projectId
 * @param {Object} [opts.scene]  scene graph JSON (rooms/walls/furniture/modules)
 * @param {string} [opts.message] free-text that may carry dimensions / intent
 * @returns {{actions:Array, rules:Array, retrieved:{materials:number,corrections:number,approvedDesigns:number}}}
 */
export function proposeDesignActions({ projectId, scene, message } = {}) {
  const actions = [];
  const ctx = retrieveContext(projectId || '');

  // 1) Free-text wall dimension -> sofa sizing (matches plan exit-criteria example)
  const wallMm = parseWallMm(message);
  if (wallMm && wallMm >= 1500) {
    actions.push(sofaSizingAction(wallMm));
  }

  const s = scene || (ctx.approvedDesigns && ctx.approvedDesigns[0] && safeParse(ctx.approvedDesigns[0].scene_json)) || {};
  const modules = Array.isArray(s.modules) ? s.modules
    : Array.isArray(s.furniture) ? s.furniture
    : (Array.isArray(s.rooms) ? s.rooms.flatMap((r) => r.modules || []) : []);
  const rooms = Array.isArray(s.rooms) ? s.rooms
    : Array.isArray(s.levels) ? (s.levels[0]?.rooms || []) : [];

  // 2) Kitchen work-zone (mesh basket vs rolling shutter)
  actions.push(...kitchenMeshAction(modules));

  // 3) Vastu
  actions.push(...vastuAction(rooms));

  // 4) Elevation standard (project-level)
  if (projectId) actions.push(...elevationStandardAction(projectId));

  // 5) Correction-driven suggestion: if a laminate swap was rejected/unapproved,
  //    suggest re-applying the before material (retrieval of prior corrections).
  for (const c of (ctx.corrections || [])) {
    if (c.approved === 0 && c.before_material && c.new_material) {
      actions.push({
        action: 'revert_material',
        params: { component: c.component_type, materialSlot: c.material_slot, toMaterial: c.before_material },
        confidence: 0.7,
        reasoning: `Prior swap to "${c.new_material}" on ${c.component_type} was never approved. Suggest reverting to "${c.before_material}" or re-reviewing.`,
        source: 'retrieval:laminate_swap_history'
      });
    }
  }

  return {
    actions,
    rules: DESIGN_RULES,
    retrieved: {
      materials: ctx.materialCatalog.length,
      corrections: ctx.corrections.length,
      approvedDesigns: ctx.approvedDesigns.length
    }
  };
}

function safeParse(json) {
  try { return JSON.parse(json); } catch { return {}; }
}

export default { proposeDesignActions, DESIGN_RULES, retrieveContext };
