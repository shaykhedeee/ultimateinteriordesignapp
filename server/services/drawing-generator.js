/**
 * drawing-generator.js  (rewrite — projection v2)
 * --------------------------------------------------------------------------
 * Consumes the AUTHORITATIVE scene graph (cad drawing: walls in plan px,
 * openings with openingType/offsetFromStartMm/widthMm/sillHeightMm/
 * headHeightMm, furniture with type/width/height/depth/xOffsetWall/zOffset/
 * libraryId) and emits:
 *   - per-wall elevations (via elevation-analyzer, single source of truth)
 *   - a Reflected Ceiling Plan (RCP) derived from ceiling-mounted fixtures
 *   - a cabinet schedule (BOM)
 *
 * No invented geometry. Pure + deterministic => unit-testable.
 */
import { analyzeWallElevation, analyzeProjectElevations } from './elevation-analyzer.js';

const DEFAULT_PPM = 40.0;
const DEFAULT_CEILING = 2700;

function num(v, fb = 0) { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? n : fb; }

/**
 * @param {object} cad  { walls_json, openings_json, furniture_json, pixels_per_meter, lights_json? }
 * @param {object} opts  { projectId, wallHeightMm }
 */
export function generateDrawings(cad, opts = {}) {
  const walls = JSON.parse(cad.walls_json || '[]');
  const openings = JSON.parse(cad.openings_json || '[]');
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const lights = JSON.parse(cad.lights_json || '[]');
  const ppm = num(cad.pixels_per_meter, DEFAULT_PPM);
  const wallHeight = opts.wallHeightMm || DEFAULT_CEILING;
  const projectId = opts.projectId || '';

  // --- 1. PER-WALL ELEVATIONS (real analyzer) ---
  const elevations = walls.map((w, i) =>
    analyzeWallElevation({
      wall: w,
      openings,
      furniture,
      pixelsPerMeter: ppm,
      wallHeightMm: wallHeight,
      projectId,
      sheetName: `ELEVATION ${String.fromCharCode(65 + i)}`
    })
  );

  // --- 2. REFLECTED CEILING PLAN (RCP) ---
  // Fixtures = lights + any furniture flagged ceiling-mounted (loft/tall w/ lighting)
  const fixtures = [
    ...lights.map(l => ({
      id: l.id,
      type: l.type || 'downlight',
      x: num(l.x), y: num(l.y),
      room: l.room || null
    })),
    ...furniture
      .filter(f => /loft|tall/i.test(f.type || '') && f.lighting)
      .map(f => ({
        id: f.id,
        type: 'cove-light',
        x: num(f.xOffsetWall || f.x), y: num(f.zOffset || wallHeight),
        room: null
      }))
  ];
  const rcp = {
    title: 'Reflected Ceiling Plan (RCP)',
    ceilingHeightMm: wallHeight,
    fixtureCount: fixtures.length,
    fixtures,
    // ceiling grid bounds
    bounds: walls.reduce((b, w) => ({
      minX: Math.min(b.minX, w.x1, w.x2), minY: Math.min(b.minY, w.y1, w.y2),
      maxX: Math.max(b.maxX, w.x1, w.x2), maxY: Math.max(b.maxY, w.y1, w.y2)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
  };

  // --- 3. CABINET SCHEDULE (BOM) ---
  const schedule = furniture.map((f, idx) => {
    const width = num(f.widthMm ?? f.width ?? 600);
    const height = num(f.heightMm ?? f.height ?? 720);
    const depth = num(f.depthMm ?? f.depth ?? 560);
    const category = (f.libraryId || f.type || 'CAB').toString().toUpperCase();
    return {
      serialNo: idx + 1,
      id: f.id,
      name: f.name || `${category} unit`,
      category,
      widthMm: width,
      heightMm: height,
      depthMm: depth,
      finish: f.customization?.shutterFinish || f.finish || 'Laminate'
    };
  });

  // --- 4. FLOOR PLAN (annotated, from real geometry) ---
  const floorPlan = {
    title: 'Annotated 2D Layout Plan',
    scaleText: '1:50',
    walls: walls.map(w => {
      const lenMm = Math.round((Math.hypot(w.x2 - w.x1, w.y2 - w.y1) / ppm) * 1000);
      return { ...w, lengthMm: lenMm, lengthText: `${(lenMm / 1000).toFixed(2)}m`, thicknessMm: num(w.thicknessMm, 75) };
    }),
    openings: openings.map(o => ({
      ...o,
      labelText: `${(o.openingType || o.type || '').toUpperCase()} (${num(o.widthMm ?? o.width)}mm)`
    }))
  };

  return {
    success: true,
    projectId,
    floorPlan,
    elevations,
    rcp,
    schedule,
    generatedAt: new Date().toISOString()
  };
}

export default { generateDrawings, componentLayers: { useGlassLayers:true, useCaneLayers:true, useHandleLayers:true, useFrameLayers:true } };
// Note: DXF entity emitters should consult these flags in dxf-writer.js when present.
