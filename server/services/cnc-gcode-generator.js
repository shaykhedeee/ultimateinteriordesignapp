/**
 * cnc-gcode-generator.js
 * --------------------------------------------------------------------------
 * Emits REAL, machine-ready G-code from a cut plan produced by
 * cnc-cut-generator.js (or jali-gcode-generator for carved panels).
 *
 * The output is a standard ISO G-code program with:
 *   - Setup block: G21 (mm), G90 (absolute), G17 (XY plane), G40 (cancel
 *     cutter comp), G94 (feed per minute).
 *   - A tool table comment block (T1..T5) describing each bit.
 *   - Material-specific feeds & speeds (spindle RPM, plunge / cut / traverse).
 *   - Per-part sequencing: rapid to part, tool change (M6) when the bit
 *     changes, plunge to depth, cutting moves, retract to safe-Z.
 *   - Outlines: G1 profile cut at full material thickness (through-cut).
 *   - Pockets (dados): G1 rectangle, stepped down if deeper than one pass.
 *   - Drills (shelf pins): G81 boring cycle.
 *   - Hinge cups (35mm): G81 blind bore to 13mm depth with the 35mm bit.
 *   - Engrave: shallow V-bit center cross + a comment with the part label.
 *   - Footer: G0 Z safe, spindle stop (M5), program end (M30).
 *
 * The geometry comes straight from the cut plan's `toolpaths[]`, so the G-code
 * and the DXF are guaranteed to describe the same parts.
 *
 * Pure + dependency-free => unit-testable.
 */

// Feeds & speeds by stock material (mm/min + RPM). Conservative for
// wood-composite on a 3-axis router.
const MATERIALS = {
  mdf:        { rpm: 18000, plunge: 600,  cut: 3000,  traverse: 8000, passDepth: 4 },
  plywood:    { rpm: 16000, plunge: 500,  cut: 2800,  traverse: 8000, passDepth: 4 },
  'particle': { rpm: 15000, plunge: 500,  cut: 2500,  traverse: 7000, passDepth: 4 },
  solidwood:  { rpm: 14000, plunge: 400,  cut: 2200,  traverse: 6000, passDepth: 3 },
  default:    { rpm: 16000, plunge: 500,  cut: 2600,  traverse: 7000, passDepth: 4 }
};

const SAFE_Z = 25;     // retract / traverse plane (mm above stock)
const ENGRAVE_Z = -0.6; // shallow label etch depth

function material(name) {
  const key = (name || '').toLowerCase();
  if (MATERIALS[key]) return MATERIALS[key];
  if (/mdf/.test(key)) return MATERIALS.mdf;
  if (/plywood|ply/.test(key)) return MATERIALS.plywood;
  if (/particle|chip/.test(key)) return MATERIALS['particle'];
  if (/solid|teak|oak|wood/.test(key)) return MATERIALS.solidwood;
  return MATERIALS.default;
}

/**
 * generateCNCGCode(plan, opts)
 *   plan: { toolpaths: [...], sheet: {w,h,stock}, partCount, stock }
 *   opts: { material, thicknessMm, fileName }
 * returns: { gcode: string, fileName, toolpaths: n, lines: n }
 */
export function generateCNCGCode(plan, opts = {}) {
  const toolpaths = Array.isArray(plan.toolpaths) ? plan.toolpaths : [];
  const mat = material(opts.material || plan.material);
  const thickness = Number(opts.thicknessMm) || Number(plan.thicknessMm) || 18;
  const cutDepth = -Math.abs(thickness); // through-cut goes to full thickness
  const fileName = (opts.fileName || 'cnc-cut').replace(/[^A-Za-z0-9_-]/g, '_');

  const L = [];
  const nl = (s = '') => L.push(s);

  // ---- Header / setup ----
  nl('%;');
  nl(`(ULTIDA CNC CUT PROGRAM — ${fileName})`);
  nl(`(Material: ${opts.material || plan.material || 'default'} | Stock: ${plan.stock || 'n/a'} | Thickness: ${thickness}mm)`);
  nl(`(Parts: ${plan.partCount || toolpaths.length} | Toolpaths: ${toolpaths.length})`);
  nl('(TOOL TABLE:)');
  nl('( T1 = 6mm upcut spiral  — through-cut outlines )');
  nl('( T2 = 6mm upcut spiral  — dados / pockets )');
  nl('( T3 = 5mm brad-point    — shelf-pin bores )');
  nl('( T4 = 35mm hinge bit    — concealed hinge cups )');
  nl('( T5 = 3mm V-bit         — part labels )');
  nl('G21 ; mm');
  nl('G90 ; absolute');
  nl('G17 ; XY plane');
  nl('G40 ; cancel cutter comp');
  nl('G94 ; feed per minute');
  nl(`G54 ; work offset`);
  nl(`M3 S${mat.rpm} ; spindle on`);
  nl(`G0 Z${SAFE_Z} ; safe plane`);

  let currentTool = null;
  const selectTool = (toolId, comment) => {
    if (currentTool !== toolId) {
      nl(`G0 Z${SAFE_Z}`);
      nl(`T${toolId} ; ${comment}`);
      nl('M6 ; tool change');
      currentTool = toolId;
    }
  };

  // Group toolpaths by cutting order: outlines -> pockets -> drills -> hinges -> engrave.
  const orderRank = { outline: 0, circle: 0, line: 0, pocket: 1, drill: 2, hinge: 3, engrave: 4 };
  const ordered = toolpaths.slice().sort((a, b) => (orderRank[a.type] ?? 9) - (orderRank[b.type] ?? 9));

  let processed = 0;
  for (const tp of ordered) {
    if (tp.type === 'outline') {
      selectTool(1, '6mm through-cut');
      const pts = tp.points;
      if (!pts || pts.length < 2) continue;
      nl(`( Part: ${tp.part} — outline )`);
      nl(`G0 X${fmt(pts[0][0])} Y${fmt(pts[0][1])}`);
      nl(`G1 Z${fmt(cutDepth)} F${mat.plunge} ; plunge through`);
      for (let i = 1; i < pts.length; i++) {
        nl(`G1 X${fmt(pts[i][0])} Y${fmt(pts[i][1])} F${mat.cut}`);
      }
      nl(`G1 X${fmt(pts[0][0])} Y${fmt(pts[0][1])} F${mat.cut} ; close`);
      nl(`G0 Z${SAFE_Z}`);
      processed++;
    } else if (tp.type === 'pocket') {
      selectTool(2, '6mm pocket/dado');
      const pts = tp.points;
      if (!pts || pts.length < 4) continue;
      const depth = -Math.abs(tp.depth || thickness);
      nl(`( Part: ${tp.part} — pocket/dado depth ${Math.abs(depth)}mm )`);
      // step down if deeper than one pass
      const passes = Math.max(1, Math.ceil(Math.abs(depth) / mat.passDepth));
      for (let p = 1; p <= passes; p++) {
        const z = -(Math.abs(depth) / passes) * p;
        nl(`G0 X${fmt(pts[0][0])} Y${fmt(pts[0][1])}`);
        nl(`G1 Z${fmt(z)} F${mat.plunge}`);
        for (let i = 1; i < pts.length; i++) {
          nl(`G1 X${fmt(pts[i][0])} Y${fmt(pts[i][1])} F${mat.cut}`);
        }
        nl(`G1 X${fmt(pts[0][0])} Y${fmt(pts[0][1])} F${mat.cut} ; close pass ${p}/${passes}`);
      }
      nl(`G0 Z${SAFE_Z}`);
      processed++;
    } else if (tp.type === 'drill') {
      selectTool(3, '5mm shelf-pin bore');
      nl(`( Bore: ${tp.part} @ X${fmt(tp.x)} Y${fmt(tp.y)} )`);
      nl(`G0 X${fmt(tp.x)} Y${fmt(tp.y)}`);
      nl(`G99 G81 Z${fmt(cutDepth)} R${SAFE_Z - 5} F${mat.plunge} ; bore through`);
      nl('G80 ; cancel drill cycle');
      processed++;
    } else if (tp.type === 'hinge') {
      selectTool(4, '35mm hinge cup');
      const depth = -Math.abs(tp.depth || 13);
      nl(`( Hinge cup: ${tp.part} @ X${fmt(tp.x)} Y${fmt(tp.y)} )`);
      nl(`G0 X${fmt(tp.x)} Y${fmt(tp.y)}`);
      nl(`G99 G81 Z${fmt(depth)} R${SAFE_Z - 5} F${mat.plunge} ; blind 35mm cup`);
      nl('G80 ; cancel drill cycle');
      processed++;
    } else if (tp.type === 'engrave') {
      selectTool(5, '3mm V-bit label');
      const x = tp.x, y = tp.y;
      nl(`( Label: ${tp.text || tp.part} )`);
      // shallow center cross as a position marker (true font engraving is
      // post-processed by the controller's lettering module).
      nl(`G0 X${fmt(x - 8)} Y${fmt(y)}`);
      nl(`G1 Z${fmt(ENGRAVE_Z)} F${mat.plunge}`);
      nl(`G1 X${fmt(x + 8)} Y${fmt(y)} F${mat.cut}`);
      nl(`G0 Z${SAFE_Z}`);
      nl(`G0 X${fmt(x)} Y${fmt(y - 8)}`);
      nl(`G1 Z${fmt(ENGRAVE_Z)} F${mat.plunge}`);
      nl(`G1 X${fmt(x)} Y${fmt(y + 8)} F${mat.cut}`);
      nl(`G0 Z${SAFE_Z}`);
      processed++;
    } else if (tp.type === 'circle') {
      selectTool(1, '6mm through-cut');
      const { cx, cy, r } = tp;
      if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) continue;
      nl(`( Cut circle R${fmt(r)} @ X${fmt(cx)} Y${fmt(cy)} )`);
      // approach start point at (cx+r, cy), plunge, full clockwise loop with G2
      nl(`G0 X${fmt(cx + r)} Y${fmt(cy)}`);
      nl(`G1 Z${fmt(cutDepth)} F${mat.plunge} ; plunge through`);
      nl(`G2 X${fmt(cx + r)} Y${fmt(cy)} I${fmt(-r)} J0 F${mat.cut} ; full circle`);
      nl(`G0 Z${SAFE_Z}`);
      processed++;
    } else if (tp.type === 'line') {
      selectTool(1, '6mm through-cut');
      const { x1, y1, x2, y2 } = tp;
      if ([x1, y1, x2, y2].some(v => !Number.isFinite(v))) continue;
      nl(`( Cut line X${fmt(x1)} Y${fmt(y1)} -> X${fmt(x2)} Y${fmt(y2)} )`);
      nl(`G0 X${fmt(x1)} Y${fmt(y1)}`);
      nl(`G1 Z${fmt(cutDepth)} F${mat.plunge}`);
      nl(`G1 X${fmt(x2)} Y${fmt(y2)} F${mat.cut}`);
      nl(`G0 Z${SAFE_Z}`);
      processed++;
    }
  }

  // ---- Footer ----
  nl(`G0 Z${SAFE_Z}`);
  nl('M5 ; spindle stop');
  nl('G91 G28 Z0 ; return Z home');
  nl('G90');
  nl('M30 ; program end');

  const gcode = L.join('\n');
  return {
    gcode,
    fileName: `${fileName}.gcode`,
    toolpaths: processed,
    totalToolpaths: toolpaths.length,
    lines: L.length
  };
}

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0.000';
  return (Math.round(v * 1000) / 1000).toFixed(3);
}
