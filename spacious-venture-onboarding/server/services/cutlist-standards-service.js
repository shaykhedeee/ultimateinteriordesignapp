import { nanoid } from 'nanoid';

export const hardwareRules = [
  { id: 'standard-soft-close-hinge', type: 'hinge', brand: 'Standard/Hettich/Ebco', overlayGapMm: 3, boringNote: 'Confirm hinge cup drilling with selected brand.' },
  { id: 'hettich-innotech-drawer', type: 'drawer', brand: 'Hettich InnoTech', sideClearanceMm: 26, bottomDepthDeductionMm: 24, backWidthDeductionMm: 87 },
  { id: 'blum-tandembox', type: 'drawer', brand: 'Blum Tandembox', sideClearanceMm: 75, bottomDepthDeductionMm: 24, backWidthDeductionMm: 75 },
  { id: 'ebco-tandem', type: 'drawer', brand: 'Ebco Tandem', sideClearanceMm: 26, bottomDepthDeductionMm: 20, backWidthDeductionMm: 54 }
];

const defaults = {
  boardThicknessMm: 18,
  backPanelThicknessMm: 6,
  grooveDepthMm: 8,
  shelfClearanceMm: 2,
  hingeClearanceMm: 20,
  shutterGapMm: 3,
  railWidthMm: 100
};

export function precisionPartsForModule(module, moduleIndex, settings = {}) {
  const cfg = { ...defaults, ...(settings || {}) };
  const type = module.moduleType || '';
  if (type.includes('drawer')) return drawerCabinet(module, moduleIndex, cfg);
  if (type.includes('kitchen-base')) return baseCabinet(module, moduleIndex, cfg, { kitchen: true });
  if (type.includes('kitchen-wall')) return wallCabinet(module, moduleIndex, cfg);
  if (type.includes('wardrobe')) return wardrobe(module, moduleIndex, cfg);
  if (type.includes('blind-corner')) return blindCornerBase(module, moduleIndex, cfg);
  if (type.includes('l-corner')) return lCornerBase(module, moduleIndex, cfg);
  if (type.includes('mandir') || type.includes('tv-unit') || type.includes('study') || type.includes('foyer') || type.includes('crockery')) {
    return storageElevation(module, moduleIndex, cfg);
  }
  return storageElevation(module, moduleIndex, cfg);
}

export function evaluateFormula(formula, vars) {
  if (typeof formula === 'number') return formula;
  if (!formula) return 0;
  
  // Safe math mapping for min/max
  let expression = String(formula)
    .replace(/\bmin\b/g, 'Math.min')
    .replace(/\bmax\b/g, 'Math.max')
    .replace(/\bH\b/g, vars.H)
    .replace(/\bW\b/g, vars.W)
    .replace(/\bD\b/g, vars.D)
    .replace(/\bt\b/g, vars.t)
    .replace(/\bbt\b/g, vars.bt)
    .replace(/\bg\b/g, vars.g);
  try {
    const val = Function(`"use strict"; return (${expression})`)();
    return Math.max(1, Math.round(Number(val) || 0));
  } catch (err) {
    console.error(`Error evaluating formula: ${formula}`, err);
    return 1;
  }
}

function baseCabinet(module, moduleIndex, cfg, options = {}) {
  const prefix = prefixFor(module, moduleIndex);
  const shutters = module.widthMm > 750 ? 2 : 1;
  const parts = [
    part(module, prefix, '01', 'Left side panel', 'H', 'D', cfg.boardThicknessMm, 1, '1L 2mm front', 'vertical', null, cfg),
    part(module, prefix, '02', 'Right side panel', 'H', 'D', cfg.boardThicknessMm, 1, '1L 2mm front', 'vertical', null, cfg),
    part(module, prefix, '03', 'Bottom panel between sides', 'W - 2*t', 'D', cfg.boardThicknessMm, 1, '1L 0.8mm front', 'none', null, cfg),
    part(module, prefix, '04', 'Front top rail', 'W - 2*t', '100', cfg.boardThicknessMm, 1, '1L 0.8mm front', 'none', null, cfg),
    part(module, prefix, '05', 'Back top rail', 'W - 2*t', '100', cfg.boardThicknessMm, 1, 'none', 'none', null, cfg),
    part(module, prefix, '06', 'Recessed back panel', 'W - 2*8', 'H - t + 8', cfg.backPanelThicknessMm, 1, 'none', 'none', null, cfg)
  ];
  if (!options.sink) {
    parts.push(part(module, prefix, '07', 'Adjustable shelf', 'W - 2*t - 2', 'D - 20', cfg.boardThicknessMm, 1, '1L 0.8mm front', 'none', null, cfg));
  }
  parts.push(part(module, prefix, '20', 'Shutter', `(W - ${shutters + 1}*g) / ${shutters}`, 'H - 80', cfg.boardThicknessMm, shutters, '4E 2mm visible', 'vertical', module.finish, cfg));
  if (options.kitchen) parts.push(part(module, prefix, '30', 'PVC/aluminium plinth strip allowance', 'W', '100', cfg.boardThicknessMm, 1, 'top edge', 'none', null, cfg));
  return parts;
}

function wallCabinet(module, moduleIndex, cfg) {
  const parts = baseCabinet(module, moduleIndex, cfg);
  const prefix = prefixFor(module, moduleIndex);
  parts.push(part(module, prefix, '31', 'Wall cabinet bottom light pelmet', 'W - 2*t', '75', cfg.boardThicknessMm, 1, '1L visible', 'none', null, cfg));
  return parts;
}

function drawerCabinet(module, moduleIndex, cfg) {
  const runner = hardwareRules.find((item) => item.id === module.hardwareRuleId) || hardwareRules.find((item) => item.id === 'hettich-innotech-drawer');
  const parts = baseCabinet(module, moduleIndex, cfg, { kitchen: true });
  const prefix = prefixFor(module, moduleIndex);
  const drawerCount = Number(module.drawerCount || 3);
  for (let i = 0; i < drawerCount; i += 1) {
    const frontHFormula = `(H - 90 - ${drawerCount}*g) / ${drawerCount}`;
    parts.push(part(module, prefix, `4${i}`, `Drawer front ${i + 1}`, 'W - 2*g', frontHFormula, cfg.boardThicknessMm, 1, '4E 2mm visible', 'vertical', module.finish, cfg));
    parts.push(part(module, prefix, `5${i}`, `Drawer bottom ${i + 1}`, `W - 2*t - ${runner.sideClearanceMm}`, `D - ${runner.bottomDepthDeductionMm}`, 16, 1, 'none', 'none', null, cfg));
    parts.push(part(module, prefix, `6${i}`, `Drawer back ${i + 1}`, `W - 2*t - ${runner.backWidthDeductionMm}`, '144', 16, 1, '1L front', 'none', null, cfg));
  }
  return parts;
}

function wardrobe(module, moduleIndex, cfg) {
  const prefix = prefixFor(module, moduleIndex);
  const w = module.widthMm;
  const shutters = w > 1050 ? 3 : 2;
  return [
    part(module, prefix, '01', 'Left vertical side', 'H', 'D', cfg.boardThicknessMm, 1, '1L front', 'vertical', null, cfg),
    part(module, prefix, '02', 'Right vertical side', 'H', 'D', cfg.boardThicknessMm, 1, '1L front', 'vertical', null, cfg),
    part(module, prefix, '03', 'Top panel', 'W - 2*t', 'D', cfg.boardThicknessMm, 1, '1L front', 'none', null, cfg),
    part(module, prefix, '04', 'Bottom panel', 'W - 2*t', 'D', cfg.boardThicknessMm, 1, '1L front', 'none', null, cfg),
    part(module, prefix, '05', 'Loft shelf / fixed shelf', 'W - 2*t', 'D - 30', cfg.boardThicknessMm, 2, '1L front', 'none', null, cfg),
    part(module, prefix, '06', 'Vertical partition', 'H - 2*t', 'D - 30', cfg.boardThicknessMm, shutters - 1, '1L front', 'vertical', null, cfg),
    part(module, prefix, '07', 'Back panel split', 'W / 2', 'H', cfg.backPanelThicknessMm, 2, 'none', 'none', null, cfg),
    part(module, prefix, '20', 'Wardrobe shutter', `(W - ${shutters + 1}*g) / ${shutters}`, 'H - 10', cfg.boardThicknessMm, shutters, '4E 2mm visible', 'vertical', module.finish, cfg)
  ];
}

function blindCornerBase(module, moduleIndex, cfg) {
  const parts = baseCabinet(module, moduleIndex, cfg, { kitchen: true });
  const prefix = prefixFor(module, moduleIndex);
  parts.push(part(module, prefix, '70', 'Blind filler panel', '120', 'H', cfg.boardThicknessMm, 1, '2L visible', 'vertical', module.finish, cfg));
  parts.push(part(module, prefix, '71', 'Hinge post spacer', '100', 'H - 60', cfg.boardThicknessMm, 1, '1L visible', 'vertical', null, cfg));
  return parts;
}

function lCornerBase(module, moduleIndex, cfg) {
  const prefix = prefixFor(module, moduleIndex);
  return [
    part(module, prefix, '01', 'L corner bottom square stock', 'min(W, D)', 'min(W, D)', cfg.boardThicknessMm, 1, 'manual after L cutout', 'none', null, cfg),
    part(module, prefix, '02', 'Left side panel', 'H', 'D', cfg.boardThicknessMm, 1, '1L front', 'vertical', null, cfg),
    part(module, prefix, '03', 'Right side panel', 'H', 'D', cfg.boardThicknessMm, 1, '1L front', 'vertical', null, cfg),
    part(module, prefix, '04', 'Corner back panels', 'min(W, D) / 2', 'H', cfg.backPanelThicknessMm, 2, 'none', 'none', null, cfg),
    part(module, prefix, '20', 'Corner shutter pair', 'min(W, D) / 2', 'H - 80', cfg.boardThicknessMm, 2, '4E visible', 'vertical', module.finish, cfg)
  ];
}

function storageElevation(module, moduleIndex, cfg) {
  const parts = baseCabinet(module, moduleIndex, cfg);
  const prefix = prefixFor(module, moduleIndex);
  if ((module.moduleType || '').includes('tv-unit')) {
    parts.push(part(module, prefix, '80', 'TV back feature panel', 'min(W, 2400)', 'min(H, 1800)', cfg.boardThicknessMm, 1, '4E visible', 'vertical', module.finish, cfg));
  }
  return parts;
}

function prefixFor(module, moduleIndex) {
  return `${String(moduleIndex + 1).padStart(2, '0')}-${String(module.moduleType || 'MOD').toUpperCase().slice(0, 4)}`;
}

function part(module, prefix, suffix, name, lengthFormula, widthFormula, thicknessMm, quantity, edgeBandSpec, grain, materialOverride, cfg) {
  const vars = {
    H: module.heightMm,
    W: module.widthMm,
    D: module.depthMm,
    t: cfg.boardThicknessMm || 18,
    bt: cfg.backPanelThicknessMm || 6,
    g: cfg.shutterGapMm || 3
  };

  const lengthMm = evaluateFormula(lengthFormula, vars);
  const widthMm = evaluateFormula(widthFormula, vars);

  // Map human-readable edge bands to individual fields (L1, L2, W1, W2)
  let edge_l1 = null;
  let edge_l2 = null;
  let edge_w1 = null;
  let edge_w2 = null;

  const spec = String(edgeBandSpec || '').toLowerCase();
  if (spec.includes('4e') || spec.includes('all') || spec.includes('visible')) {
    const thickness = spec.includes('0.8mm') ? '0.8mm PVC' : '2mm PVC';
    edge_l1 = thickness;
    edge_l2 = thickness;
    edge_w1 = thickness;
    edge_w2 = thickness;
  } else if (spec.includes('1l')) {
    const thickness = spec.includes('0.8mm') ? '0.8mm PVC' : '2mm PVC';
    edge_l1 = thickness;
  } else if (spec.includes('2l')) {
    const thickness = spec.includes('0.8mm') ? '0.8mm PVC' : '2mm PVC';
    edge_l1 = thickness;
    edge_l2 = thickness;
  } else if (spec.includes('1w')) {
    const thickness = spec.includes('0.8mm') ? '0.8mm PVC' : '2mm PVC';
    edge_w1 = thickness;
  } else if (spec.includes('front') || spec.includes('visible') || spec.includes('top edge')) {
    const thickness = spec.includes('0.8mm') ? '0.8mm PVC' : '2mm PVC';
    edge_l1 = thickness;
  }

  // Clear edges for back panels
  if (name.toLowerCase().includes('back panel')) {
    edge_l1 = null;
    edge_l2 = null;
    edge_w1 = null;
    edge_w2 = null;
  }

  return {
    id: nanoid(12),
    moduleId: module.id,
    partCode: `${prefix}-${suffix}`,
    name,
    material: materialOverride || module.material,
    lengthMm,
    widthMm,
    thicknessMm,
    quantity,
    edgeBand: edgeBandSpec,
    edge_l1,
    edge_l2,
    edge_w1,
    edge_w2,
    grain,
    formula_length: String(lengthFormula),
    formula_width: String(widthFormula),
    notes: module.placementNote || module.furnitureRequirement || 'Generated from approved brief with Indian modular furniture standards.'
  };
}
