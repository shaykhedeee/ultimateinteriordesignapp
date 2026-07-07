/**
 * plan-intelligence-core.js  (REAL room detection — no hardcoded geometry)
 * --------------------------------------------------------------------------
 * interpretFloorPlan now derives rooms/walls/openings/dimensions from ACTUALLY
 * TRACED walls (stored in cad_drawings), using planar face detection. It never
 * invents coordinates. If nothing is traced, it returns an explicit "trace first"
 * error instead of a fake plan.
 */
import db from '../database/database.js';
import { nanoid } from 'nanoid';

const DEFAULT_PPM = 40.0; // 40 plan-pixels == 1000mm (matches elevation-analyzer)

const num = (v, fb = 0) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fb;
};

class PlanIntelligenceCore {
  /** 1. Client Intake Normalizer (real — unchanged behaviour) */
  normalizeIntake(briefData) {
    const defaultBrief = briefData || {};
    const rooms = defaultBrief.rooms || [];
    const budgetBand = defaultBrief.budgetBand || 'standard';
    let targetBudget = 500000, maxBudget = 750000;
    if (budgetBand === 'economy') { targetBudget = 300000; maxBudget = 450000; }
    else if (budgetBand === 'premium') { targetBudget = 1000000; maxBudget = 1500000; }
    else if (budgetBand === 'luxury') { targetBudget = 2000000; maxBudget = 3500000; }
    return {
      budget: { band: budgetBand, targetBudget, maxBudget, currency: 'INR' },
      rooms: rooms.map(r => ({ id: r.id || 'room_' + nanoid(4), type: r.type || 'bedroom', name: r.name || 'Room Name', priority: r.priority || 'must_have' })),
      style: {
        preferredStyles: defaultBrief.stylePreferences?.styles || ['modern'],
        colors: { liked: defaultBrief.stylePreferences?.likedColors || [], disliked: defaultBrief.stylePreferences?.dislikedColors || [] },
        materials: { liked: defaultBrief.stylePreferences?.likedMaterials || [], disliked: defaultBrief.stylePreferences?.dislikedMaterials || [] }
      },
      vastu: { enabled: defaultBrief.vastuConstraints?.enabled || false, northAngle: 0, preferredDirections: defaultBrief.vastuConstraints?.preferredDirections || [] },
      appliances: defaultBrief.functionalNeeds?.applianceList || [],
      storage: { priority: defaultBrief.functionalNeeds?.storagePriority || 'medium', loftAlignment: defaultBrief.loftAligned === 'true' },
      materials: { finishes: defaultBrief.rooms?.[0]?.finishes || ['laminate'] }
    };
  }

  /** 2. Floor Plan Ingestion — type detection only (real) */
  ingestFloorPlan(filename, mimeType) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    let detectedType = 'image', layers = ['raw_pixels'];
    if (ext === 'pdf') { detectedType = 'pdf'; layers = ['raster_layer', 'vector_text_layer']; }
    else if (ext === 'dxf' || ext === 'dwg') { detectedType = 'dxf'; layers = ['walls_layer', 'openings_layer', 'furniture_layer', 'text_labels']; }
    return { filename, detectedType, layers, processedAt: new Date().toISOString() };
  }

  /** Load traced walls/openings for a project (same source the analyzer uses) */
  _loadTraced(projectId) {
    const cad = db.prepare("SELECT walls_json, openings_json, pixels_per_meter FROM cad_drawings WHERE project_id = ? ORDER BY created_at DESC LIMIT 1").get(projectId);
    if (!cad) return null;
    let walls = [];
    try { walls = JSON.parse(cad.walls_json || '[]'); } catch { walls = []; }
    let openings = [];
    try { openings = JSON.parse(cad.openings_json || '[]'); } catch { openings = []; }
    const ppm = num(cad.pixels_per_meter, DEFAULT_PPM);
    return { walls, openings, ppm };
  }

  /**
   * 3. Floor Plan Interpretation (REAL)
   * Computes room polygons + dimensions from traced wall segments via planar
   * face detection. Returns an explicit error if nothing was traced.
   */
  interpretFloorPlan(projectId, ingestResult, opts = {}) {
    const traced = opts.traced || this._loadTraced(projectId);
    if (!traced || !Array.isArray(traced.walls) || traced.walls.length === 0) {
      return {
        success: false,
        error: 'NO_TRACED_WALLS',
        message: 'No traced walls found. Trace the floorplan (draw walls + openings) in the CAD editor, then re-run interpretation. No plan was invented.',
        interpretation: null,
        overallConfidence: 0,
        reviewItems: []
      };
    }

    const scale = opts.scaleFactor || traced.ppm || DEFAULT_PPM; // plan-pixels per 1000mm
    const toMm = (px) => (px / scale) * 1000;

    // Build segments from traced walls (support {x1,y1,x2,y2} or {x,y,w,h} or {ax,ay,bx,by})
    const segs = [];
    for (const w of traced.walls) {
      const x1 = num(w.x1 ?? w.x ?? w.ax ?? 0);
      const y1 = num(w.y1 ?? w.y ?? w.ay ?? 0);
      const x2 = num(w.x2 ?? (w.x + (w.w || 0)) ?? w.bx ?? 0);
      const y2 = num(w.y2 ?? (w.y + (w.h || 0)) ?? w.by ?? 0);
      const t = num(w.thicknessMm ?? w.thickness ?? 230);
      segs.push({ x1, y1, x2, y2, t, id: w.id || 'w_' + segs.length });
    }

    const rooms = detectRooms(segs, toMm);
    const dimensions = computeDimensions(segs, toMm);

    // Warnings from real data only
    const reviewItems = [];
    if (rooms.length === 0) {
      reviewItems.push({ id: 'rev_' + nanoid(6), item_type: 'wall', item_ref: 'all', confidence: 0.5, severity: 'warning', suggested_value_json: JSON.stringify({ note: 'No closed rooms detected — check wall endpoints meet.' }) });
    }

    const overallConfidence = rooms.length > 0 ? 1.0 : 0.5;

    const interpretation = {
      source: { mode: 'traced_vectors', tracedWalls: segs.length },
      rooms,
      walls: segs.map(s => ({ id: s.id, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, thicknessMm: s.t, confidence: 1.0 })),
      openings: (traced.openings || []).map(o => ({ id: o.id || 'op_' + nanoid(4), type: o.openingType || o.type, wallId: o.wallId, offsetMm: num(o.offsetFromStartMm ?? o.offset ?? 0), widthMm: num(o.widthMm ?? o.width ?? 900), confidence: 1.0 })),
      dimensions,
      graph: { nodes: rooms.map(r => ({ id: r.id, label: r.name })), edges: [] },
      warnings: rooms.length === 0 ? ['No enclosed rooms — verify traced walls connect end-to-end.'] : []
    };

    return { success: true, overallConfidence, scaleFactor: scale, scaleUnit: 'mm', interpretation, reviewItems };
  }

  /**
   * 4b. Real photo/plan intake -> measured model.
   * Accepts traced walls + an optional scale reference (two points + known real
   * length in mm). Computes the true pixels-per-meter and returns rooms/dims.
   * Never invents — if nothing traced, returns NO_TRACED_WALLS.
   */
  measurePlan({ walls = [], openings = [], rooms = [], scaleRef } = {}) {
    if (!Array.isArray(walls) || walls.length === 0) {
      return { success: false, error: 'NO_TRACED_WALLS', message: 'Trace the walls (and a scale line if no ppm known) before measuring.', interpretation: null, overallConfidence: 0, reviewItems: [] };
    }
    let ppm = DEFAULT_PPM;
    if (scaleRef && Number.isFinite(scaleRef.realMm) && scaleRef.realMm > 0) {
      const lenPx = Math.hypot(num(scaleRef.x2) - num(scaleRef.x1), num(scaleRef.y2) - num(scaleRef.y1));
      if (lenPx > 0) ppm = (lenPx / scaleRef.realMm) * 1000; // px per 1000mm
    }
    const traced = { walls, openings: openings.length ? openings : [], rooms, ppm };
    const r = this.interpretFloorPlan('measure', {}, { traced });
    r.scaleRef = { ppm, realMm: scaleRef ? scaleRef.realMm : null };
    return r;
  }

  /** 5. Auto layout proposal (real — uses computed room polygons) */
  generateAutoLayoutProposal(spatialModel, briefConstraints) {
    const levels = spatialModel.levels || [];
    const rooms = levels[0]?.rooms || [];
    const walls = levels[0]?.walls || [];
    const openings = levels[0]?.openings || [];
    const furniture = [], lights = [];

    rooms.forEach(room => {
      const pts = room.points || [];
      if (pts.length < 3) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;
      const scale = 40.0;
      const roomWidthMm = ((maxX - minX) / scale) * 1000;

      if (room.type === 'kitchen') {
        furniture.push({ id: 'cab_sink_' + nanoid(4), libraryId: 'kitchen_sink_unit', name: 'Modular Sink Cabinet', x: minX + 45, y: minY + 45, widthMm: 900, heightMm: 600, rotation: 0, color: '#38A169', customization: { carcassPly: '18mm waterproof bwr', shutterFinish: 'high gloss acrylic' } });
        furniture.push({ id: 'cab_hob_' + nanoid(4), libraryId: 'kitchen_hob_unit', name: 'Modular Hob Unit', x: minX + 135, y: minY + 45, widthMm: 900, heightMm: 600, rotation: 0, color: '#38A169', customization: { carcassPly: '18mm waterproof bwr', shutterFinish: 'high gloss acrylic' } });
      } else if (room.type === 'living') {
        furniture.push({ id: 'fur_tv_' + nanoid(4), libraryId: 'tv_console', name: 'Floating TV Unit', x: centerX, y: minY + 30, widthMm: 1800, heightMm: 400, rotation: 0, color: '#3182CE' });
        furniture.push({ id: 'fur_sofa_' + nanoid(4), libraryId: 'sofa_3seater', name: 'Luxury 3-Seater Sofa', x: centerX, y: maxY - 80, widthMm: 2100, heightMm: 850, rotation: 180, color: '#3182CE' });
      } else {
        furniture.push({ id: 'fur_bed_' + nanoid(4), libraryId: 'king_bed', name: 'King Bed with Storage', x: centerX, y: centerY, widthMm: 1800, heightMm: 2000, rotation: 0, color: '#D69E2E' });
        furniture.push({ id: 'fur_wardrobe_' + nanoid(4), libraryId: 'sliding_wardrobe', name: 'Modular Sliding Wardrobe', x: minX + 40, y: centerY, widthMm: 1800, heightMm: 600, rotation: 90, color: '#D69E2E' });
      }
      lights.push({ id: 'light_' + nanoid(4), type: 'downlight', x: centerX, y: centerY, intensity: 800, color: '#fffaed' });
    });

    return {
      schemaVersion: '1.0.0', units: 'mm',
      levels: [{ levelId: 'level_0', name: 'Ground Floor', elevationMm: 0, rooms, walls, openings, furniture, lights }],
      materials: [{ id: 'mat_default_carcass', name: 'Frosty White SF-9120', pricePerSqft: 45 }],
      settings: { budgetTier: briefConstraints?.budget?.band || 'standard' }
    };
  }
}

/**
 * Planar face detection — finds enclosed room polygons from wall segments.
 * 1) snap endpoints to a grid tolerance, 2) build half-edge graph,
 * 3) traverse faces (left-hand rule), 4) keep only leaf (non-contained) faces.
 */
function detectRooms(segs, toMm) {
  const TOL = 6; // px snap tolerance
  const key = (x, y) => `${Math.round(x / TOL) * TOL},${Math.round(y / TOL) * TOL}`;
  const nodes = new Map();
  const nodeId = (x, y) => { const k = key(x, y); if (!nodes.has(k)) nodes.set(k, { x, y, id: 'n' + nodes.size, out: [] }); return nodes.get(k); };

  const half = [];
  for (const s of segs) {
    const a = nodeId(s.x1, s.y1), b = nodeId(s.x2, s.y2);
    const h1 = { from: a, to: b, used: false };
    const h2 = { from: b, to: a, used: false };
    a.out.push(h1); b.out.push(h2); half.push(h1, h2);
  }
  // sort outgoing half-edges by angle for face traversal
  for (const n of nodes.values()) n.out.sort((p, q) => Math.atan2(p.to.y - n.y, p.to.x - n.x) - Math.atan2(q.to.y - n.y, q.to.x - n.x));

  const faces = [];
  for (const h of half) {
    if (h.used) continue;
    const face = [];
    let cur = h;
    let guard = 0;
    do {
      cur.used = true;
      face.push(cur.from);
      const node = cur.to;
      // next half-edge: the one immediately clockwise (left-hand traversal)
      const idx = node.out.indexOf(cur.reverse || node.out.find(e => e.to === cur.from));
      const nextIdx = (idx + 1) % node.out.length;
      cur = node.out[nextIdx];
      if (++guard > 10000) break;
    } while (cur !== h && !cur.used);
    if (face.length >= 3) {
      let area = 0;
      for (let i = 0; i < face.length; i++) {
        const p = face[i], q = face[(i + 1) % face.length];
        area += p.x * q.y - q.x * p.y;
      }
      area = Math.abs(area) / 2;
      if (area > 0) faces.push({ pts: face.slice(), area, signedArea: area });
    }
  }

  // keep leaf faces (real rooms): drop any face fully containing another
  faces.sort((a, b) => b.area - a.area);
  const rooms = [];
  const palette = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5'];
  let ri = 0;
  for (const f of faces) {
    const contains = (px, py) => pointInPoly(px, py, f.pts);
    const hasInner = faces.some(other => other !== f && other.area < f.area && f.pts.length && other.pts.length && contains(other.pts[0].x, other.pts[0].y));
    if (hasInner) continue; // super-room, not a real room
    const wMm = toMm(bboxW(f.pts)), hMm = toMm(bboxH(f.pts)), aMm = toMm(Math.sqrt(f.area)) * toMm(Math.sqrt(f.area));
    rooms.push({
      id: 'r_' + nanoid(4),
      name: 'Room ' + (ri + 1),
      type: inferRoomType(wMm, hMm),
      points: f.pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      widthMm: Math.round(wMm),
      heightMm: Math.round(hMm),
      areaMm2: Math.round(aMm),
      color: palette[ri % palette.length],
      confidence: 1.0
    });
    ri++;
  }
  return rooms;
}

function computeDimensions(segs, toMm) {
  const dims = [];
  const seen = new Set();
  for (const s of segs) {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    const k = Math.round(len);
    if (seen.has(k)) continue; seen.add(k);
    dims.push({ id: 'dim_' + dims.length, fromPoint: { x: Math.round(s.x1), y: Math.round(s.y1) }, toPoint: { x: Math.round(s.x2), y: Math.round(s.y2) }, distanceMm: Math.round(toMm(len)), confidence: 1.0 });
  }
  return dims;
}

function inferRoomType(w, h) {
  const a = (w * h) / 1e6; // m²
  if (a < 6) return 'bathroom';
  if (a < 12) return 'bedroom';
  if (a < 20) return 'living';
  return 'hall';
}
function bboxW(pts) { return Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x)); }
function bboxH(pts) { return Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y)); }
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export default new PlanIntelligenceCore();
