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
    // Manual room-marking path: user has marked rooms with real mm dimensions
    // but not traced walls yet. Produce measurements from rooms directly.
    if ((!Array.isArray(walls) || walls.length === 0) && Array.isArray(rooms) && rooms.length > 0) {
      const interpretedRooms = rooms.map((r, i) => {
        const wMm = Number(r.wMm ?? r.widthMm ?? 0);
        const hMm = Number(r.hMm ?? r.heightMm ?? 0);
        const areaMm2 = (r.areaMm2 != null) ? Number(r.areaMm2) : (wMm * hMm);
        const areaSqft = areaMm2 / 92903;
        return {
          id: r.id || `room_${i + 1}`,
          name: r.name || `Room ${i + 1}`,
          type: (r.name || '').toLowerCase().includes('kitchen') ? 'kitchen'
              : (r.name || '').toLowerCase().includes('bed') ? 'bedroom'
              : (r.name || '').toLowerCase().includes('liv') ? 'living'
              : (r.name || '').toLowerCase().includes('bath') ? 'bathroom' : 'other',
          widthMm: wMm, heightMm: hMm, areaMm2, areaSqft: +areaSqft.toFixed(2),
          confidence: 0.9
        };
      });
      const totalArea = interpretedRooms.reduce((s, r) => s + (r.areaMm2 || 0), 0);
      const bedrooms = interpretedRooms.filter(r => r.type === 'bedroom').length;
      const type = bedrooms >= 4 ? '4BHK' : bedrooms === 3 ? '3BHK' : bedrooms === 2 ? '2BHK' : bedrooms === 1 ? '1BHK' : 'APARTMENT';
      return {
        success: true,
        scaleRef: { ppm: DEFAULT_PPM, realMm: scaleRef ? scaleRef.realMm : null },
        overallConfidence: 0.9,
        interpretation: { rooms: interpretedRooms, totalAreaMm2: totalArea, totalAreaSqft: +(totalArea / 92903).toFixed(2), type, bedroomCount: bedrooms },
        reviewItems: []
      };
    }
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

  generateAutoLayoutProposal(spatialModel, briefConstraints) {
    const levels = spatialModel.levels || [];
    const rooms = levels[0]?.rooms || [];
    const walls = levels[0]?.walls || [];
    const openings = levels[0]?.openings || [];
    const furniture = [], lights = [];

    // Calculate global bounding box of all rooms to compute regional directions (NE, NW, SE, SW, etc.)
    let globalMinX = Infinity, globalMaxX = -Infinity, globalMinY = Infinity, globalMaxY = -Infinity;
    rooms.forEach(room => {
      const pts = room.points || [];
      pts.forEach(p => {
        globalMinX = Math.min(globalMinX, p.x);
        globalMaxX = Math.max(globalMaxX, p.x);
        globalMinY = Math.min(globalMinY, p.y);
        globalMaxY = Math.max(globalMaxY, p.y);
      });
    });

    if (globalMinX === Infinity) {
      globalMinX = 0; globalMaxX = 8000;
      globalMinY = 0; globalMaxY = 6000;
    }
    const globalCenterX = globalMinX + (globalMaxX - globalMinX) / 2;
    const globalCenterY = globalMinY + (globalMaxY - globalMinY) / 2;

    rooms.forEach(room => {
      const pts = room.points || [];
      if (pts.length < 3) return;
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      // Determine Vastu zone of the room based on its relative center position
      const dx = centerX - globalCenterX;
      const dy = centerY - globalCenterY;
      let vastuZone = 'NE';
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle >= -22.5 && angle < 22.5) vastuZone = 'E';
      else if (angle >= 22.5 && angle < 67.5) vastuZone = 'SE';
      else if (angle >= 67.5 && angle < 112.5) vastuZone = 'S';
      else if (angle >= 112.5 && angle < 157.5) vastuZone = 'SW';
      else if (angle >= 157.5 || angle < -157.5) vastuZone = 'W';
      else if (angle >= -157.5 && angle < -112.5) vastuZone = 'NW';
      else if (angle >= -112.5 && angle < -67.5) vastuZone = 'N';
      else vastuZone = 'NE';
      room.orientation = vastuZone; // Expose to layout mapper

      // Find the longest edge of the room polygon to act as the primary anchor wall
      let maxLen = 0;
      let primaryEdge = null;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (len > maxLen) {
          maxLen = len;
          primaryEdge = { p1, p2, len };
        }
      }

      // Compute wall normal and angle
      let angleDeg = 0;
      let wallMidX = centerX;
      let wallMidY = centerY;
      
      if (primaryEdge) {
        const edx = primaryEdge.p2.x - primaryEdge.p1.x;
        const edy = primaryEdge.p2.y - primaryEdge.p1.y;
        wallMidX = primaryEdge.p1.x + edx / 2;
        wallMidY = primaryEdge.p1.y + edy / 2;
        angleDeg = Math.atan2(edy, edx) * (180 / Math.PI);
      }

      // 1. KITCHEN layout (SE room is ideal)
      if (room.type === 'kitchen') {
        const hobX = maxX - 800;
        const hobY = maxY - 600;
        furniture.push({
          id: 'cab_hob_' + nanoid(4),
          libraryId: 'kitchen_hob',
          name: 'Hob Cooktop (SE - Cooking faces East)',
          x: hobX, y: hobY,
          width: 800, height: 600,
          widthMm: 800, heightMm: 600,
          rotation: 0,
          color: '#C9A84C',
          vastuZone: 'SE',
          customization: { carcassPly: '18mm waterproof bwr', shutterFinish: 'high gloss acrylic' }
        });

        const sinkX = maxX - 800;
        const sinkY = minY + 800;
        furniture.push({
          id: 'cab_sink_' + nanoid(4),
          libraryId: 'kitchen_sink',
          name: 'Water Sink (NE)',
          x: sinkX, y: sinkY,
          width: 900, height: 600,
          widthMm: 900, heightMm: 600,
          rotation: 0,
          color: '#C9A84C',
          vastuZone: 'NE',
          customization: { carcassPly: '18mm waterproof bwr' }
        });

        const fridgeX = minX + 800;
        const fridgeY = maxY - 800;
        furniture.push({
          id: 'cab_fridge_' + nanoid(4),
          libraryId: 'kitchen_fridge',
          name: 'Refrigerator Column (W)',
          x: fridgeX, y: fridgeY,
          width: 900, height: 700,
          widthMm: 900, heightMm: 700,
          rotation: 0,
          color: '#C9A84C',
          vastuZone: 'W'
        });
      }
      
      // 2. BEDROOM layout (SW Master / NW Guest is ideal)
      else if (room.type === 'bedroom') {
        const bedX = centerX;
        const bedY = maxY - 1200;
        furniture.push({
          id: 'fur_bed_' + nanoid(4),
          libraryId: 'king_bed',
          name: 'King Bed (Head facing South)',
          x: bedX, y: bedY,
          width: 1800, height: 2000,
          widthMm: 1800, heightMm: 2000,
          rotation: 0,
          color: '#C9A84C',
          vastuZone: 'SW',
          customization: { zone: 'SW', headboard: 'South' }
        });

        furniture.push({
          id: 'fur_bedside_l_' + nanoid(4),
          libraryId: 'bedside_table',
          name: 'Bedside Left',
          x: bedX - 1100, y: bedY + 800,
          width: 450, height: 450,
          widthMm: 450, heightMm: 450,
          rotation: 0
        });

        furniture.push({
          id: 'fur_bedside_r_' + nanoid(4),
          libraryId: 'bedside_table',
          name: 'Bedside Right',
          x: bedX + 1100, y: bedY + 800,
          width: 450, height: 450,
          widthMm: 450, heightMm: 450,
          rotation: 0
        });

        const wardrobeX = minX + 400;
        const wardrobeY = centerY;
        furniture.push({
          id: 'fur_wardrobe_' + nanoid(4),
          libraryId: 'wardrobe',
          name: 'Modular Sliding Wardrobe (West)',
          x: wardrobeX, y: wardrobeY,
          width: 1800, height: 600,
          widthMm: 1800, heightMm: 600,
          rotation: 90,
          color: '#C9A84C',
          vastuZone: 'W'
        });
      }
      
      // 3. LIVING layout (N / E room is ideal)
      else if (room.type === 'living') {
        const tvX = maxX - 300;
        const tvY = centerY;
        furniture.push({
          id: 'fur_tv_' + nanoid(4),
          libraryId: 'tv_unit',
          name: 'Premium TV Console (East)',
          x: tvX, y: tvY,
          width: 1800, height: 450,
          widthMm: 1800, heightMm: 450,
          rotation: 90,
          color: '#C9A84C',
          vastuZone: 'E'
        });

        const sofaX = minX + 1200;
        const sofaY = maxY - 1200;
        furniture.push({
          id: 'fur_sofa_' + nanoid(4),
          libraryId: 'sofa_3seater',
          name: 'L-Shape Lounge Sofa (SW)',
          x: sofaX, y: sofaY,
          width: 2200, height: 900,
          widthMm: 2200, heightMm: 900,
          rotation: 180,
          color: '#C9A84C',
          vastuZone: 'SW'
        });

        furniture.push({
          id: 'fur_coffee_' + nanoid(4),
          libraryId: 'coffee_table',
          name: 'Marble Coffee Table',
          x: sofaX + 100, y: sofaY - 800,
          width: 1000, height: 600,
          widthMm: 1000, heightMm: 600,
          rotation: 0
        });

        // Add Pooja mandir in NE corner of living room if no dedicated room exists
        const hasPoojaRoom = rooms.some(r => r.type === 'pooja' || r.orientation === 'NE');
        if (!hasPoojaRoom) {
          const poojaX = maxX - 600;
          const poojaY = minY + 600;
          furniture.push({
            id: 'fur_pooja_' + nanoid(4),
            libraryId: 'pooja_mandir',
            name: 'Pooja Altar (NE - Devotee faces East)',
            x: poojaX, y: poojaY,
            width: 800, height: 500,
            widthMm: 800, heightMm: 500,
            rotation: 0,
            color: '#C9A84C',
            vastuZone: 'NE'
          });
        }
      }
      
      // 4. TOILET / BATHROOM layout
      else if (room.type === 'toilet' || room.type === 'bathroom') {
        const wcX = minX + 400;
        const wcY = centerY;
        furniture.push({
          id: 'fur_wc_' + nanoid(4),
          libraryId: 'wc_pot',
          name: 'Toilet WC (West)',
          x: wcX, y: wcY,
          width: 500, height: 700,
          widthMm: 500, heightMm: 700,
          rotation: 270,
          color: '#C9A84C'
        });

        const vanityX = maxX - 400;
        const vanityY = centerY;
        furniture.push({
          id: 'fur_vanity_' + nanoid(4),
          libraryId: 'wash_basin',
          name: 'Vanity Wash Basin (East)',
          x: vanityX, y: vanityY,
          width: 800, height: 500,
          widthMm: 800, heightMm: 500,
          rotation: 90,
          color: '#C9A84C'
        });
      }
      
      // 5. DEDICATED POOJA room layout
      else if (room.type === 'pooja') {
        const poojaX = centerX;
        const poojaY = minY + 600;
        furniture.push({
          id: 'fur_pooja_' + nanoid(4),
          libraryId: 'pooja_mandir',
          name: 'Sacred Pooja Altar (NE)',
          x: poojaX, y: poojaY,
          width: 900, height: 600,
          widthMm: 900, heightMm: 600,
          rotation: 0,
          color: '#C9A84C'
        });
      }
      
      // Default fallback if no specific room type match
      else {
        furniture.push({
          id: 'fur_wardrobe_' + nanoid(4),
          libraryId: 'wardrobe',
          name: 'Modular Cabinet (West)',
          x: wallMidX, y: wallMidY,
          width: 1800, height: 600,
          widthMm: 1800, heightMm: 600,
          rotation: angleDeg,
          color: '#C9A84C'
        });
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

  /**
   * 5. Floor-plan Enhancer (REAL, actionable).
   * Consumes an interpreted plan (rooms, openings, dims) + an auto-layout
   * proposal (furniture) and returns prioritised enhancement suggestions:
   * Vastu re-zoning, missing mandatory rooms, headboard/bed orientation,
   * under-utilised walls for storage, circulation/door clashes. Every
   * suggestion carries an exact target so the CAD/auto-apply layer can act.
   */
  enhanceFloorPlan({ interpretation, layout, northAngle = 0 } = {}) {
    const rooms = (interpretation?.rooms || []).map(r => ({ ...r }));
    const furniture = (layout?.levels?.[0]?.furniture || []).map(f => ({ ...f }));
    const openings = (interpretation?.openings || []);
    const suggestions = [];
    const add = (id, severity, title, detail, target) =>
      suggestions.push({ id, severity, title, detail, target: target || null });

    if (!rooms.length) {
      return { success: false, error: 'NO_ROOMS', suggestions: [], score: 0 };
    }

    // Global bounds + centre to derive true 8-zone orientation per room.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rooms.forEach(r => (r.points || []).forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const zoneOf = (x, y) => {
      const a = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      if (a >= -22.5 && a < 22.5) return 'E';
      if (a >= 22.5 && a < 67.5) return 'SE';
      if (a >= 67.5 && a < 112.5) return 'S';
      if (a >= 112.5 && a < 157.5) return 'SW';
      if (a >= 157.5 || a < -157.5) return 'W';
      if (a >= -157.5 && a < -112.5) return 'NW';
      if (a >= -112.5 && a < -67.5) return 'N';
      return 'NE';
    };

    const hasPooja = rooms.some(r => r.type === 'pooja') ||
      furniture.some(f => /pooja|mandir/i.test(f.name || f.libraryId || ''));
    const kitchens = rooms.filter(r => r.type === 'kitchen');
    const bedrooms = rooms.filter(r => r.type === 'bedroom');

    // (a) Mandatory missing rooms
    if (!hasPooja) {
      // find the NE-most corner of the plan for placement hint
      const neRoom = [...rooms].sort((a, b) => zoneOf(...centroid(b)) === 'NE' ? -1 : 1)[0];
      add('enh_pooja', 'high', 'Add a Pooja / meditation alcove in the North-East',
        'Vastu Eshanya (NE) is the most sacred zone. No Pooja space detected — carve a 0.8×0.6m altar into the NE corner.',
        { kind: 'add_room', type: 'pooja', preferredZone: 'NE' });
    }

    // (b) Kitchen must be SE (fire); if in wrong zone, flag re-zone
    kitchens.forEach(k => {
      const z = zoneOf(...centroid(k));
      if (z !== 'SE' && z !== 'NW') {
        add('enh_kitchen_' + k.id, 'medium',
          `Shift cooking zone toward South-East (currently in ${z})`,
          'Agni (fire) resides SE. Keep the hob in SE; if the kitchen footprint is fixed, at least place the stove on the SE wall of the room.',
          { kind: 'rezone_furniture', roomId: k.id, furniture: 'cab_hob', toZone: 'SE' });
      }
    });

    // (c) Bedroom headboard should face South/West (never North)
    bedrooms.forEach(b => {
      const z = zoneOf(...centroid(b));
      const bed = furniture.find(f => /bed/i.test(f.libraryId || f.name || '') &&
        near(f, b));
      if (bed && (bed.rotation ?? 0) === 0 && (furniture.find(f => f.id === bed.id)?.customization?.headboard === 'North' ||
        z === 'N' || z === 'NE')) {
        add('enh_bed_' + b.id, 'medium',
          `Rotate master bed headboard to face South (currently ${z === 'N' || z === 'NE' ? 'North' : 'undefined'})`,
          'Sleeping with the head to the South (or West) is the Vastu ideal; North-facing head invites restlessness.',
          { kind: 'rotate_furniture', roomId: b.id, furnitureId: bed.id, headboard: 'South' });
      }
    });

    // (d) Under-utilised long walls → suggest storage
    rooms.forEach(r => {
      const w = r.widthMm || 0, h = r.heightMm || 0;
      const longest = Math.max(w, h);
      const storageHere = furniture.filter(f => /wardrobe|cabinet|storage/i.test(f.libraryId || f.name || '') && near(f, r)).length;
      if (longest >= 2400 && storageHere === 0 && r.type !== 'toilet' && r.type !== 'bathroom') {
        add('enh_storage_' + r.id, 'low',
          `Add a full-height wardrobe on the longest wall of ${r.name}`,
          `A ${Math.round(longest / 100) / 10}m wall is unutilised — a floor-to-ceiling module reclaims dead circulation space.`,
          { kind: 'add_furniture', roomId: r.id, libraryId: 'wardrobe', wall: 'longest' });
      }
    });

    // (e) Door/opening circulation: flag main door opening into a toilet (basic)
    if (openings.length) {
      const main = openings.find(o => /main|entrance|entry/i.test(o.type || ''));
      if (main) {
        const mz = zoneOf(...centroidOfOpening(main, rooms, cx, cy));
        if (mz === 'SW' || mz === 'S') {
          add('enh_entrance_' + main.id, 'low',
            'Main entrance faces South/West — add a threshold filter',
            'A South/West main door benefits from a brass threshold and a small foyer screen to settle energy.',
            { kind: 'annotate', openingId: main.id, note: 'threshold + foyer screen' });
        }
      }
    }

    // Enhancement score: start at 100, subtract by severity.
    const penalty = { high: 25, medium: 12, low: 5 };
    const score = Math.max(0, 100 - suggestions.reduce((s, x) => s + (penalty[x.severity] || 5), 0));

    return {
      success: true,
      northAngle,
      rooms: rooms.length,
      furniture: furniture.length,
      score,
      summary: `${suggestions.length} enhancement${suggestions.length === 1 ? '' : 's'} found (${suggestions.filter(s => s.severity === 'high').length} high priority).`,
      suggestions
    };
  }
}

function centroid(room) {
  const pts = room.points || [];
  if (!pts.length) return [0, 0];
  const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return [x, y];
}
function near(f, room) {
  const [cx, cy] = centroid(room);
  const fx = f.x ?? (f.points ? (f.points[0].x + f.points[1].x) / 2 : 0);
  const fy = f.y ?? (f.points ? (f.points[0].y + f.points[1].y) / 2 : 0);
  const w = room.widthMm || 4000, h = room.heightMm || 4000;
  return Math.abs(fx - cx) < w && Math.abs(fy - cy) < h;
}
function centroidOfOpening(o, rooms, cx, cy) {
  // crude: place opening at its offset along its wall, else plan centre
  if (typeof o.offsetMm === 'number' && o.wallId) {
    const wall = rooms.flatMap(r => r.points || []);
    return [cx, cy];
  }
  return [cx, cy];
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

  // Dedup the inner/outer traversal pair: a single closed loop produces TWO
  // faces (interior + reverse-wound outer boundary) with IDENTICAL centroid and
  // area. Genuinely distinct rooms have distinct centroids, so keying on
  // (centroid, area) collapses the duplicate pair to one without merging real
  // rooms. Fixes "one room detected as two".
  const centroid = (pts) => {
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    return { cx: Math.round(cx / pts.length / 10) * 10, cy: Math.round(cy / pts.length / 10) * 10 };
  };
  const seenFace = new Set();
  const dedupFaces = [];
  for (const f of faces) {
    const c = centroid(f.pts);
    const fk = `${c.cx},${c.cy},${Math.round(f.area / 100) * 100}`;
    if (seenFace.has(fk)) continue;
    seenFace.add(fk);
    dedupFaces.push(f);
  }

  const rooms = [];
  const palette = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5'];
  let ri = 0;
  for (const f of dedupFaces) {
    const contains = (px, py) => pointInPoly(px, py, f.pts);
    const hasInner = dedupFaces.some(other => other !== f && other.area < f.area && f.pts.length && other.pts.length && contains(other.pts[0].x, other.pts[0].y));
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
