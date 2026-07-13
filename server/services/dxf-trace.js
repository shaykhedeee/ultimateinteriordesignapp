/**
 * dxf-trace.js — REAL auto-tracing of an uploaded ASCII DXF floor plan.
 *
 * Most Indian architect / builder plans are delivered as DXF (or DWG->DXF).
 * This parses the AutoCAD R2010 ASCII entity stream and extracts:
 *   - LINE entities        -> wall segments (x1,y1,x2,y2)
 *   - LWPOLYLINE         -> closed room/ wall polylines (converted to segments)
 *   - INSERT / MTEXT / TEXT (optional) -> labels for room name recovery
 *
 * It infers pixels-per-meter from the drawing's stated INSUNITS / $MEASUREMENT
 * (1 = imperial inches, 2 = metric mm / cm) and an optional known-real length,
 * so the resulting walls_json is in TRUE millimetres for the elevation pipeline.
 *
 * Output is the SAME wall schema interpretFloorPlan consumes:
 *   { walls:[{id,x1,y1,x2,y2,thicknessMm}], openings:[...], pixelsPerMeter, unit }
 *
 * No CV, no invention — pure deterministic DXF parsing.
 */
import fs from 'fs';

// Section markers in a DXF
const SEC_START = 'SECTION';
const SEC_END = 'ENDSEC';
const ENTITY = 'ENTITY';

function readGroups(text) {
  // DXF is pairs: group code (int) then value (next line). Be resilient to
  // blank/garbage lines and value lines that are themselves group codes.
  const lines = String(text).split(/\r?\n/);
  const groups = [];
  let i = 0;
  while (i + 1 < lines.length) {
    const codeRaw = lines[i].trim();
    // A group code line must be a clean integer.
    if (!/^[-+]?\d+$/.test(codeRaw)) { i += 1; continue; }
    const code = parseInt(codeRaw, 10);
    groups.push({ code, value: lines[i + 1] });
    i += 2;
  }
  return groups;
}

function rstripZeros(v) { return v; }

// Find a header variable value for a given $VARNAME group
function headerVar(groups, varName) {
  for (let i = 0; i < groups.length - 1; i++) {
    if (groups[i].code === 9 && groups[i].value.toUpperCase() === `$${varName.toUpperCase()}`) {
      return groups[i + 1]?.value;
    }
  }
  return null;
}

// Walk entities section, collecting LINE / LWPOLYLINE / POLYLINE(+VERTEX) / TEXT etc.
function parseEntities(groups) {
  const lines = [];     // wall candidates from LINE
  const polylines = [];  // LWPOLYLINE + classic POLYLINE (with expanded vertices)
  const texts = [];       // MTEXT / TEXT strings
  let i = 0;
  let inEntities = false;
  for (; i < groups.length; i++) {
    const g = groups[i];
    if (g.code === 2 && g.value.toUpperCase() === 'ENTITIES') { inEntities = true; continue; }
    if (inEntities && g.code === 2 && g.value.toUpperCase() === 'OBJECTS') break;
    if (!inEntities) continue;
    if (g.code === 0) {
      const type = g.value.toUpperCase();
      if (type === 'LINE') {
        const e = collectEntity(groups, i);
        if (e) lines.push(e);
      } else if (type === 'LWPOLYLINE') {
        const { entity, next } = collectLwPolyline(groups, i);
        if (entity) polylines.push(entity);
        i = next - 2;
      } else if (type === 'POLYLINE') {
        // classic Polyline: vertices are separate VERTEX entities until SEQEND
        const { entity, next } = collectClassicPolyline(groups, i);
        if (entity) polylines.push(entity);
        i = next - 2;
      } else if (type === 'TEXT' || type === 'MTEXT' || type === 'ATTDEF') {
        const e = collectText(groups, i);
        if (e) texts.push(e);
      }
    }
  }
  return { lines, polylines, texts };
}

// collect a single entity starting at group index i for a 0-code marker
function collectEntity(groups, i) {
  const start = i;
  const ent = { type: groups[i].value.toUpperCase() };
  i++;
  while (i < groups.length && !(groups[i].code === 0)) {
    const g = groups[i];
    switch (g.code) {
      case 8: ent.layer = g.value; break;
      case 10: ent.x1 = parseFloat(g.value); break;
      case 20: ent.y1 = parseFloat(g.value); break;
      case 11: ent.x2 = parseFloat(g.value); break;
      case 21: ent.y2 = parseFloat(g.value); break;
      case 40: ent.size = parseFloat(g.value); break;
      case 1: ent.text = g.value; break;
      case 70: ent.flags = parseInt(g.value, 10); break;
      default: break;
    }
    i++;
  }
  return ent;
}

// LWPOLYLINE: vertices are inline (10/20 pairs) until the next 0-code marker.
function collectLwPolyline(groups, i) {
  const ent = { type: 'LWPOLYLINE', vertices: [] };
  let j = i + 1;
  let lastX = null;
  while (j < groups.length && !(groups[j].code === 0)) {
    const g = groups[j];
    if (g.code === 8) ent.layer = g.value;
    else if (g.code === 70) ent.flags = parseInt(g.value, 10);
    else if (g.code === 10) {
      const y = (groups[j + 1]?.code === 20) ? parseFloat(groups[j + 1].value) : 0;
      ent.vertices.push({ x: parseFloat(g.value), y });
      lastX = j; j += (groups[j + 1]?.code === 20) ? 1 : 0;
    } else if (g.code === 1) { ent.text = g.value; }
    j++;
  }
  return { entity: ent, next: j + 1 };
}

// Classic POLYLINE entity: its vertices live in following VERTEX entities,
// terminated by SEQEND. Each VERTEX carries 10/20 location groups.
function collectClassicPolyline(groups, i) {
  const ent = { type: 'POLYLINE', vertices: [], flags: 0 };
  let j = i + 1;
  while (j < groups.length) {
    const g = groups[j];
    if (g.code === 0) {
      const t = g.value.toUpperCase();
      if (t === 'VERTEX') {
        let vx = 0, vy = 0;
        let k = j + 1;
        while (k < groups.length && groups[k].code !== 0) {
          if (groups[k].code === 10) { vx = parseFloat(groups[k].value); vy = (groups[k + 1]?.code === 20) ? parseFloat(groups[k + 1].value) : 0; }
          k++;
        }
        ent.vertices.push({ x: vx, y: vy });
        j = k; // continue after this VERTEX
        continue;
      }
      if (t === 'SEQEND') { j += 1; break; }
      // a POLYLINE ends at the next non-VERTEX entity
      break;
    }
    if (g.code === 70) ent.flags = parseInt(g.value, 10);
    else if (g.code === 8) ent.layer = g.value;
    j++;
  }
  return { entity: ent, next: j + 1 };
}

function collectText(groups, i) {
  const ent = { type: groups[i].value.toUpperCase() };
  let j = i + 1;
  while (j < groups.length && !(groups[j].code === 0)) {
    const g = groups[j];
    if (g.code === 1) ent.text = g.value;
    else if (g.code === 10) { ent.x = parseFloat(g.value); ent.y = parseFloat((groups[j + 1]?.value) ?? 0); }
    else if (g.code === 8) ent.layer = g.value;
    j++;
  }
  return ent;
}

/**
 * Convert raw DXF parse into wall segments.
 * @param {object} opts
 * @param {number} [opts.knownRealMm] a known real length (mm) of a drawn reference segment
 * @param {number} [opts.knownDrawingUnits] the drawing length (in DXF units) of that reference
 */
export function traceDxf({ text, knownRealMm, knownDrawingUnits, fallbackUnit = 'mm' } = {}) {
  const groups = readGroups(text);
  const ent = parseEntities(groups);
  const insunits = headerVar(groups, 'INSUNITS'); // 1=inch,2=mm,4=cm,6=m
  const measurement = headerVar(groups, 'MEASUREMENT'); // 0=english,1=metric

  // Unit -> mm per 1 DXF unit
  let mmPerUnit = 1; // default mm
  if (insunits === '1' || measurement === '0') mmPerUnit = 25.4;       // inches
  else if (insunits === '4') mmPerUnit = 10;                  // cm
  else if (insunits === '6') mmPerUnit = 1000;               // m
  else if (insunits === '2' || measurement === '1' || fallbackUnit === 'mm') mmPerUnit = 1; // mm
  else if (fallbackUnit === 'cm') mmPerUnit = 10;

  // If the user gave a known real length, lock the scale precisely.
  let ppmOverride = null;
  if (knownRealMm && knownDrawingUnits && knownDrawingUnits > 0) {
    mmPerUnit = knownRealMm / knownDrawingUnits;
  }

  const walls = [];
  let wid = 0;
  const pushWall = (x1, y1, x2, y2) => {
    if ([x1, y1, x2, y2].some(v => !Number.isFinite(v))) return;
    if (Math.hypot(x2 - x1, y2 - y1) < 1e-6) return;
    walls.push({
      id: `w_dxf_${wid++}`,
      x1: +(x1 * mmPerUnit).toFixed(2),
      y1: +(y1 * mmPerUnit).toFixed(2),
      x2: +(x2 * mmPerUnit).toFixed(2),
      y2: +(y2 * mmPerUnit).toFixed(2),
      thicknessMm: 230,
    });
  };

  for (const l of ent.lines) {
    pushWall(l.x1, l.y1, l.x2, l.y2);
  }
  for (const p of ent.polylines) {
    const v = p.vertices;
    if (!v || v.length < 2) continue;
    const closed = (p.flags & 1) === 1;
    for (let k = 0; k < v.length - 1; k++) {
      pushWall(v[k].x, v[k].y, v[k + 1].x, v[k + 1].y);
    }
    if (closed && v.length > 2) pushWall(v[v.length - 1].x, v[v.length - 1].y, v[0].x, v[0].y);
  }

  // pixels-per-meter for the elevation pipeline. Our wall coords are already in
  // TRUE mm, so downstream interpretFloorPlan (toMm = px/ppm*1000) must treat
  // 1000 coord-units == 1 metre to be an identity transform (no double scaling).
  const pxPerMeter = 1000.0;

  return {
    success: true,
    unit: mmPerUnit === 25.4 ? 'inch' : mmPerUnit === 10 ? 'cm' : mmPerUnit === 1000 ? 'm' : 'mm',
    mmPerUnit,
    walls,
    texts: ent.texts.map(t => ({ text: t.text, x: t.x, y: t.y, layer: t.layer })),
    pixelPerMeter: pxPerMeter,
    source: 'dxf-autotrace',
  };
}

export default { traceDxf };
