/**
 * dimension-validator.js — ULTIDA Dimension Validation Pipeline
 *
 * Beats competitors (Infurnia / Coohom / Magicplan) by catching ergonomic
 * and code clashes BEFORE export, with precise Indian-residential standards.
 *
 * Pure, deterministic logic — fully unit-testable with no DB or network.
 * Standards referenced: Indian residential carpentry norms, BIS soft-furniture
 * clearances, and common interior-studio SOPs.
 */

// Ergonomic / code thresholds (millimetres unless noted)
const STANDARDS = {
  counter_height_min: 850,
  counter_height_max: 920,
  counter_clearance_front: 1200,      // walkway in front of a counter
  wall_cabinet_bottom_min: 1500,      // bottom of overheads above counter
  wall_cabinet_height: 720,
  wardrobe_depth_min: 560,            // hang space needs >= 560
  wardrobe_depth_max: 650,
  tv_unit_height_max: 550,            // comfortable viewing deck height
  tv_viewing_distance_min: 2000,      // distance sofa -> screen
  aisle_walkway_min: 900,             // circulation between furniture
  door_swing_clearance: 450,          // space a door leaf needs
  plinth_height: 100,                 // standard plinth/kick
  headroom_min: 2100                  // clear headroom
};

const MODULE_RULES = {
  kitchen_base: {
    label: 'Kitchen Base Cabinet',
    height: { min: STANDARDS.counter_height_min, max: STANDARDS.counter_height_max, ideal: 900 },
    depth: { min: 560, max: 650, ideal: 600 },
    notes: 'Counter working height should sit 850–920mm. Standard Indian counter = 900mm.'
  },
  counter: {
    label: 'Counter / Island',
    height: { min: STANDARDS.counter_height_min, max: STANDARDS.counter_height_max, ideal: 900 },
    depth: { min: 560, max: 650, ideal: 600 },
    notes: 'Same as kitchen base; ensure >=1200mm front clearance for circulation.'
  },
  tv_unit: {
    label: 'TV Unit / Console',
    height: { min: 400, max: STANDARDS.tv_unit_height_max, ideal: 450 },
    depth: { min: 350, max: 500, ideal: 400 },
    notes: 'Keep deck <=550mm so the screen centre lands near seated eye level (~1050mm).'
  },
  wardrobe: {
    label: 'Wardrobe',
    height: { min: 2100, max: 2700, ideal: 2400 },
    depth: { min: STANDARDS.wardrobe_depth_min, max: STANDARDS.wardrobe_depth_max, ideal: 600 },
    notes: 'Depth <560mm cannot hang shirts/dresses; >650mm wastes room.'
  },
  pooja: {
    label: 'Pooja Unit',
    height: { min: 900, max: 1200, ideal: 1050 },
    depth: { min: 300, max: 450, ideal: 350 },
    notes: 'Mandir seat/altar commonly 900–1050mm (comfortable puja height).'
  },
  vanity: {
    label: 'Bathroom Vanity',
    height: { min: 800, max: 900, ideal: 850 },
    depth: { min: 450, max: 600, ideal: 500 },
    notes: 'Counter basin height 800–900mm; pair with 1500mm+ mirror above.'
  }
};

/**
 * Validate a single module against ergonomic standards.
 * @param {{moduleType:string,widthMm?:number,heightMm?:number,depthMm?:number,x?:number,y?:number,name?:string}} m
 * @returns {{moduleType:string,label:string,errors:string[],warnings:string[],passed:boolean}}
 */
export function validateModule(m) {
  const key = (m.moduleType || '').toLowerCase();
  const rule = MODULE_RULES[key];
  const errors = [];
  const warnings = [];
  const label = rule ? rule.label : (m.name || key || 'Module');

  if (!rule) {
    warnings.push(`No ergonomic profile for "${key}" — skipped dimension checks.`);
    return { moduleType: key, label, errors, warnings, passed: true };
  }

  const h = Number(m.heightMm);
  const d = Number(m.depthMm);

  if (h && rule.height) {
    if (h < rule.height.min) errors.push(`${label} height ${h}mm is below minimum ${rule.height.min}mm.`);
    else if (h > rule.height.max) errors.push(`${label} height ${h}mm exceeds max ${rule.height.max}mm.`);
    else if (Math.abs(h - rule.height.ideal) > 60) warnings.push(`${label} height ${h}mm differs from ideal ${rule.height.ideal}mm.`);
  }
  if (d && rule.depth) {
    if (d < rule.depth.min) errors.push(`${label} depth ${d}mm is shallow (min ${rule.depth.min}mm).`);
    else if (d > rule.depth.max) warnings.push(`${label} depth ${d}mm is deep (max ${rule.depth.max}mm) — verify room clearance.`);
  }
  return { moduleType: key, label, errors, warnings, passed: errors.length === 0 };
}

/**
 * Spatial clash detection between placed modules on a 2D floor.
 * @param {Array} modules list of {moduleType,widthMm,depthMm,x,y,name}
 * @param {{widthMm:number,heightMm:number}} room optional room bounds
 * @returns {Array<{type:string,severity:'error'|'warning',message:string}>}
 */
export function detectClashes(modules, room = null) {
  const clashes = [];
  const rects = modules
    .map((m, i) => ({
      i,
      x: Number(m.x ?? 0),
      y: Number(m.y ?? 0),
      w: Number(m.widthMm ?? 600),
      d: Number(m.depthMm ?? 500),
      type: (m.moduleType || '').toLowerCase(),
      name: m.name || m.moduleType || `M${i}`
    }))
    .filter(r => r.w > 0 && r.d > 0);

  // Out-of-bounds check
  if (room && room.widthMm && room.heightMm) {
    for (const r of rects) {
      if (r.x < 0 || r.y < 0 || r.x + r.w > room.widthMm || r.y + r.d > room.heightMm) {
        clashes.push({ type: 'bounds', severity: 'error', message: `${r.name} extends outside the room footprint.` });
      }
    }
  }

  // Pairwise overlap (axis-aligned bounding box)
  for (let a = 0; a < rects.length; a++) {
    for (let b = a + 1; b < rects.length; b++) {
      const A = rects[a], B = rects[b];
      const overlapX = A.x < B.x + B.w && A.x + A.w > B.x;
      const overlapY = A.y < B.y + B.d && A.y + A.d > B.y;
      if (overlapX && overlapY) {
        const gap = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)) ;
        // True interpenetration (not just touching)
        clashes.push({
          type: 'overlap',
          severity: 'error',
          message: `${A.name} and ${B.name} overlap/interpenetrate — modules must not share footprint.`
        });
      }
    }
  }

  // Counter vs walkway clearance (any counter needs >=1200mm front clearance)
  for (const r of rects) {
    if (r.type === 'kitchen_base' || r.type === 'counter') {
      const frontClearOk = rects.some(o => o !== r && o.y > r.y + r.d && (o.y - (r.y + r.d)) >= STANDARDS.counter_clearance_front);
      // Soft check: only warn if another module sits directly in front within the zone
      const blocker = rects.find(o => o !== r && Math.abs((o.y + o.d / 2) - (r.y + r.d)) < STANDARDS.counter_clearance_front && (o.x < r.x + r.w && o.x + o.w > r.x));
      if (blocker) clashes.push({ type: 'clearance', severity: 'warning', message: `${r.name} front clearance blocked by ${blocker.name} (<${STANDARDS.counter_clearance_front}mm walkway).` });
    }
  }
  return clashes;
}

/**
 * Full validation pass for a project layout.
 * @param {{modules?:Array, room?:{widthMm,heightMm}}} input
 * @returns {{passed:boolean, score:number, modules:Array, clashes:Array, summary:string}}
 */
export function validateLayout(input = {}) {
  const modules = Array.isArray(input.modules) ? input.modules : [];
  const moduleResults = modules.map(validateModule);
  const clashes = detectClashes(modules, input.room || null);

  const errorCount = moduleResults.reduce((n, r) => n + r.errors.length, 0) + clashes.filter(c => c.severity === 'error').length;
  const warnCount = moduleResults.reduce((n, r) => n + r.warnings.length, 0) + clashes.filter(c => c.severity === 'warning').length;

  const total = modules.length || 1;
  const passed = errorCount === 0;
  // Score: 100 minus penalties, clamped 0..100
  const score = Math.max(0, Math.min(100, Math.round(100 - errorCount * 12 - warnCount * 4)));

  let summary;
  if (modules.length === 0) summary = 'No modules placed yet — draw cabinets to run validation.';
  else if (passed && warnCount === 0) summary = `All ${total} module(s) pass Indian ergonomic standards. Score ${score}/100.`;
  else if (passed) summary = `${total} module(s) pass hard limits with ${warnCount} advisory warning(s). Score ${score}/100.`;
  else summary = `${errorCount} blocking issue(s) found across ${total} module(s). Fix before export. Score ${score}/100.`;

  return { passed, score, modules: moduleResults, clashes, summary };
}

export { STANDARDS, MODULE_RULES };
export default { validateModule, detectClashes, validateLayout, STANDARDS, MODULE_RULES };
