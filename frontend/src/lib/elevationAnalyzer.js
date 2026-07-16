/**
 * elevationAnalyzer.js  (browser-safe copy)
 * ---------------------------------------------------------------------------
 * Pure geometry engine for the 3D → 2D elevation pipeline.
 * Zero Node.js / server dependencies — safe to import in any React component.
 *
 * This is a verbatim copy of server/services/elevation-analyzer.js.
 * Do NOT import from the server path directly — that file uses Node APIs
 * and cannot be bundled by Vite for the browser.
 *
 * KEEP IN SYNC: if you update server/services/elevation-analyzer.js, mirror
 * the logic here (or refactor to a shared /shared/lib/ that both sides import).
 */

const DEFAULT_CEILING_MM = 2700;
const DEFAULT_PPM = 40.0; // 40 plan-pixels == 1000mm
const STANDARD_SILL_MM = 900;
const STANDARD_HEAD_MM = 2100;
const STANDARD_DOOR_MM = 2100;

// --- Robust field normalisers (the legacy data uses inconsistent names) ---
function num(v, fallback = 0) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

function normOpening(o, wallLengthMm) {
  const type = (o.openingType || o.type || 'door').toLowerCase();
  const offset = num(o.offsetFromStartMm ?? o.offsetMm ?? o.offset ?? 0);
  const width = num(o.widthMm ?? o.width ?? (type === 'door' ? 900 : 1200));
  const sill = num(
    o.sillHeightMm ?? o.sillMm ?? o.sill,
    type === 'window' ? STANDARD_SILL_MM : 0
  );
  const head = num(
    o.headHeightMm ?? o.headMm ?? o.head,
    type === 'door' ? STANDARD_DOOR_MM : STANDARD_HEAD_MM
  );
  const offsetMm = Math.max(0, Math.min(offset, wallLengthMm - width));
  return {
    id: o.openingId || o.id,
    type, // 'door' | 'window'
    offsetMm,
    widthMm: width,
    sillMm: sill,
    headMm: head,
    sillHeightMm: sill,
    headHeightMm: head,
    centerMm: offsetMm + width / 2
  };
}

function normCabinet(f, wallLengthMm) {
  const type = (f.type || 'base').toLowerCase();
  const width = num(f.widthMm ?? f.width ?? 600);
  const height = num(f.heightMm ?? f.height ?? (type === 'base' ? 720 : type === 'wall' ? 600 : 2100));
  const depth = num(f.depthMm ?? f.depth ?? 560);
  const xOffset = num(f.xOffsetWall ?? f.xOffset ?? 0);
  let zOffset = f.zOffsetMm ?? f.zOffset;
  if (zOffset == null) {
    zOffset = type === 'base' ? 100
      : type === 'wall' ? 1400
      : type === 'loft' ? 2100
      : 0;
  } else {
    zOffset = num(zOffset);
  }
  const finishRaw = (f.customization?.shutterFinish || f.finish || '').toString().toLowerCase();
  const isGlass   = /\b(glass|mirror|acrylic)\b/i.test(finishRaw);
  const isFluted  = /fluted|groov|rib/i.test(finishRaw);
  const isGranite = /granite|stone|quartz/i.test(finishRaw);
  const isPaint   = /\b(paint|matte|pu|duco)\b/i.test(finishRaw);

  let tag = 'CAB';
  if (type === 'drawer') tag = 'DRAWER';
  else if (isGlass || f.hasShutter || /shutter/i.test(f.name || '')) tag = 'SHUTTER';
  else if (type === 'open' || /open unit|ledge|shelf/i.test(f.name || '')) tag = 'OPEN UNIT';
  else if (type === 'base') tag = 'BASE';
  else if (type === 'wall') tag = 'WALL';
  else if (type === 'tall' || type === 'loft') tag = 'TALL';

  const shelfTag = f.shelfType ? (f.shelfType.toUpperCase() === 'FS' ? 'FS' : f.shelfType.toUpperCase() === 'AS' ? 'AS' : f.shelfType.toUpperCase()) : null;

  return {
    id: f.id,
    name: f.name || `${type} unit`,
    type,
    widthMm: width,
    heightMm: height,
    depthMm: depth,
    xOffsetMm: Math.max(0, Math.min(xOffset, wallLengthMm - width)),
    zOffsetMm: zOffset,
    endMm: Math.max(0, Math.min(xOffset, wallLengthMm - width)) + width,
    centerMm: Math.max(0, Math.min(xOffset, wallLengthMm - width)) + width / 2,
    tag,
    shelfTag,
    finish: f.customization?.shutterFinish || f.finish || 'Laminate',
    material: {
      glass: isGlass, fluted: isFluted, granite: isGranite, paint: isPaint,
      callout: isGlass ? 'FLUTED GLASS'
        : isFluted ? '4MM GROOVING WITH BLACK PAINT'
        : isGranite ? 'GRANITE'
        : isPaint ? 'PU PAINTED FINISH'
        : null
    },
    handle: f.handleType || '45 DEGREE FINGER GROOVING',
    lighting: f.lighting || (f.hasLight ? 'SPOT LIGHT' : null)
  };
}

/**
 * Analyze a single wall into an ElevationModel.
 * @param {object} opts
 * @param {object} opts.wall            { id, x1,y1,x2,y2, thicknessMm?, heightMm? }
 * @param {Array}  opts.openings        raw opening rows (any field naming)
 * @param {Array}  opts.furniture       raw furniture rows (any field naming)
 * @param {number} opts.pixelsPerMeter
 * @param {number} opts.wallHeightMm
 * @param {string} opts.projectId
 * @param {string} opts.sheetName
 */
export function analyzeWallElevation({
  wall,
  openings = [],
  furniture = [],
  pixelsPerMeter = DEFAULT_PPM,
  wallHeightMm = DEFAULT_CEILING_MM,
  projectId = '',
  sheetName = 'WALL ELEVATION'
}) {
  const ppm = pixelsPerMeter > 0 ? pixelsPerMeter : DEFAULT_PPM;

  const dx = num(wall.x2) - num(wall.x1);
  const dy = num(wall.y2) - num(wall.y1);
  const pxLen = Math.hypot(dx, dy);
  let lengthMm = Math.round((pxLen / ppm) * 1000);
  const MAX_WALL_MM = 20000;
  let lengthClamped = false;
  if (!Number.isFinite(lengthMm) || lengthMm <= 0) { lengthMm = 1; lengthClamped = true; }
  else if (lengthMm > MAX_WALL_MM) { lengthMm = MAX_WALL_MM; lengthClamped = true; }
  const heightMm = num(wall.heightMm ?? wallHeightMm, DEFAULT_CEILING_MM);
  const thicknessMm = num(wall.thicknessMm ?? 75);

  const wallOpenings = openings
    .filter(o => (o.wallId || o.wallID) === wall.id)
    .map(o => normOpening(o, lengthMm))
    .sort((a, b) => a.offsetMm - b.offsetMm);

  const wallCabinets = furniture
    .filter(f => (f.wallId || f.cabinetId) === wall.id)
    .map(f => normCabinet(f, lengthMm))
    .sort((a, b) => a.xOffsetMm - b.xOffsetMm);

  const usedMm = wallCabinets.reduce((s, c) => s + c.widthMm, 0);
  const freeMm = lengthMm - usedMm;
  const utilizationPct = lengthMm > 0 ? Math.round((usedMm / lengthMm) * 100) : 0;
  const overflow = wallCabinets.some(c => c.endMm > lengthMm + 1);
  const gaps = [];
  let cursor = 0;
  for (const c of wallCabinets) {
    if (c.xOffsetMm - cursor > 5) gaps.push({ fromMm: cursor, toMm: c.xOffsetMm, sizeMm: c.xOffsetMm - cursor });
    cursor = Math.max(cursor, c.endMm);
  }
  if (lengthMm - cursor > 5) gaps.push({ fromMm: cursor, toMm: lengthMm, sizeMm: lengthMm - cursor });

  let signals = 0, present = 0;
  const check = (cond) => { signals++; if (cond) present++; };
  check(ppm > 0);
  check(pxLen > 0);
  check(lengthMm > 0);
  check(wallCabinets.length > 0 || wallOpenings.length > 0);
  wallCabinets.forEach(c => check(c.widthMm > 0 && c.heightMm > 0));
  wallOpenings.forEach(o => check(o.widthMm > 0));
  const confidence = (wallCabinets.length === 0 && wallOpenings.length === 0)
    ? 0
    : (signals > 0 ? +(present / signals).toFixed(2) : 0);

  const notes = [];
  if (overflow) notes.push('Cabinetry exceeds wall length — overflow detected.');
  if (freeMm < 0) notes.push('Negative free space: reduce a module width.');
  if (wallCabinets.length === 0 && wallOpenings.length === 0)
    notes.push('No openings or cabinetry placed on this wall yet.');

  return {
    wallId: wall.id,
    wallName: sheetName,
    projectId,
    lengthMm,
    heightMm,
    ceilingHeightMm: heightMm,
    thicknessMm,
    pixelsPerMeter: ppm,
    openings: wallOpenings,
    cabinets: wallCabinets,
    coverage: { usedMm, freeMm, utilizationPct, overflow, gaps },
    confidence,
    notes,
    lengthClamped
  };
}

/**
 * Analyze every wall and produce a full project elevation report.
 * @param {object} cad  { walls_json, openings_json, furniture_json, pixels_per_meter }
 */
export function analyzeProjectElevations(cad, opts = {}) {
  const walls    = JSON.parse(cad.walls_json    || '[]');
  const openings = JSON.parse(cad.openings_json || '[]');
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const ppm = num(cad.pixels_per_meter, DEFAULT_PPM);

  const models = walls.map((w, i) =>
    analyzeWallElevation({
      wall: w,
      openings,
      furniture,
      pixelsPerMeter: ppm,
      wallHeightMm: opts.wallHeightMm,
      projectId: opts.projectId,
      sheetName: `ELEVATION ${String.fromCharCode(65 + i)}`
    })
  );

  const topView = {
    bounds: walls.reduce((b, w) => ({
      minX: Math.min(b.minX, w.x1, w.x2),
      minY: Math.min(b.minY, w.y1, w.y2),
      maxX: Math.max(b.maxX, w.x1, w.x2),
      maxY: Math.max(b.maxY, w.y1, w.y2)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }),
    walls: walls.map(w => ({
      id: w.id,
      x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2,
      lengthMm: Math.round((Math.hypot(w.x2 - w.x1, w.y2 - w.y1) / ppm) * 1000),
      thicknessMm: num(w.thicknessMm, 75)
    })),
    openings: openings.map(o => normOpening(o, 999999)),
    furniture: furniture.map(f => normCabinet(f, 999999))
  };

  const schedule = furniture.map((f, i) => {
    const c = normCabinet(f, 999999);
    return {
      serialNo: i + 1,
      id: c.id,
      name: c.name,
      category: (f.libraryId || c.type).toUpperCase(),
      widthMm: c.widthMm,
      heightMm: c.heightMm,
      depthMm: c.depthMm,
      finish: f.customization?.shutterFinish || 'Laminate'
    };
  });

  const totalUsed = models.reduce((s, m) => s + m.coverage.usedMm, 0);
  const totalLen  = models.reduce((s, m) => s + m.lengthMm, 0);

  return {
    success: true,
    projectId: opts.projectId || '',
    generatedAt: new Date().toISOString(),
    walls: models,
    topView,
    schedule,
    report: {
      wallCount: models.length,
      totalWallLengthMm: totalLen,
      totalCabinetryMm: totalUsed,
      overallUtilizationPct: totalLen > 0 ? Math.round((totalUsed / totalLen) * 100) : 0,
      avgConfidence: models.length
        ? +(models.reduce((s, m) => s + m.confidence, 0) / models.length).toFixed(2)
        : 0
    }
  };
}

export default { analyzeWallElevation, analyzeProjectElevations };
