import db from '../database/database.js';

/**
 * Auto-Vastu engine — full knowledge base + floor-plan scanner.
 *
 * Layers:
 *   - LEGACY (back-compat): previewVastu / applyVastu (pooja + bed).
 *   - FULL: analyzeVastuPlan / suggestVastuLayout / applyVastuFull.
 *   - TEXT: interpretVastuText / parsePlanText — reads textual cues ON or ABOUT
 *           the floor plan ("west entrance", "north kitchen", room labels) to
 *           infer the plot orientation and per-room Vastu zones, then realigns
 *           the geometric scan accordingly.
 *
 * Orientation model:
 *   - Geometry gives a bounding box. By default North = up (min-y).
 *   - Entrance direction (derived from door labels / text) rotates the compass
 *     so the analysis matches the REAL cardinal orientation of the plot.
 *   - northAngle (deg, clockwise from "up") is applied before zoning.
 */

const ZONES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'C'];
const DIR_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const VASTU = {
  poojaZone: 'NE',
  bedAllowedZones: ['S', 'W', 'SW'],
  bedForbiddenZones: ['N', 'E', 'NE', 'NW', 'SE'],
};

// ─── Geometry: the floor-plan SCAN ───────────────────────────────────────────

function planBounds(rooms = [], furniture = [], walls = []) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const consider = (x, y) => {
    if (x == null || y == null || !isFinite(x) || !isFinite(y)) return;
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  };
  for (const r of rooms) {
    for (const p of (r.points || [])) consider(p.x, p.y);
    consider(r.x, r.y);
    if (r.bounds) { consider(r.bounds.x, r.bounds.y); consider(r.bounds.x + (r.bounds.w || 0), r.bounds.y + (r.bounds.h || 0)); }
  }
  for (const f of furniture) consider(f.x, f.y);
  for (const w of walls) { consider(w.x1, w.y1); consider(w.x2, w.y2); }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
           w: maxX - minX, h: maxY - minY };
}

function rotate(x, y, cx, cy, deg) {
  if (!deg) return { x, y };
  const a = (deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

// Returns one of N, NE, E, SE, S, SW, W, NW, C (center) for a point.
function zoneOfPoint(x, y, bounds, northAngle = 0) {
  if (!bounds || x == null || y == null) return 'C';
  const p = rotate(x, y, bounds.cx, bounds.cy, northAngle);
  const dx = p.x - bounds.cx, dy = p.y - bounds.cy;
  const coreR = Math.min(bounds.w, bounds.h) * 0.16;
  if (Math.hypot(dx, dy) <= coreR) return 'C';
  let ang = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0=N(up), 90=E(right), 180=S, -90=W
  if (ang < 0) ang += 360;
  if (ang >= 337.5 || ang < 22.5) return 'N';
  if (ang < 67.5) return 'NE';
  if (ang < 112.5) return 'E';
  if (ang < 157.5) return 'SE';
  if (ang < 202.5) return 'S';
  if (ang < 247.5) return 'SW';
  if (ang < 292.5) return 'W';
  return 'NW';
}

function roomCentroid(r) {
  if (r.points && r.points.length) {
    const xs = r.points.map(p => p.x), ys = r.points.map(p => p.y);
    return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }
  return { x: r.x || 0, y: r.y || 0 };
}

function roomBounds(r) {
  if (r.points && r.points.length) {
    const xs = r.points.map(p => p.x), ys = r.points.map(p => p.y);
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }
  if (r.bounds) return { minX: r.bounds.x, minY: r.bounds.y, maxX: r.bounds.x + (r.bounds.w || 0), maxY: r.bounds.y + (r.bounds.h || 0) };
  return { minX: r.x || 0, minY: r.y || 0, maxX: (r.x || 0) + 50, maxY: (r.y || 0) + 50 };
}

function zoneOfRoom(r, bounds, northAngle = 0) {
  const c = roomCentroid(r);
  return zoneOfPoint(c.x, c.y, bounds, northAngle);
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function roomForPoint(x, y, rooms) {
  if (x == null || y == null) return null;
  for (const r of rooms) if (r.points && r.points.length >= 3 && pointInPolygon(x, y, r.points)) return r;
  let best = null, bd = Infinity;
  for (const r of rooms) {
    const c = roomCentroid(r);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

// Point inside the plan for a given zone sector.
function zoneCentroid(zone, b) {
  if (!b) return { x: 0, y: 0 };
  const { minX, minY, maxX, maxY, cx, cy } = b, w = b.w, h = b.h;
  const map = {
    N: [cx, minY + h * 0.15], NE: [maxX - w * 0.15, minY + h * 0.15],
    E: [maxX - w * 0.15, cy], SE: [maxX - w * 0.15, maxY - h * 0.15],
    S: [cx, maxY - h * 0.15], SW: [minX + w * 0.15, maxY - h * 0.15],
    W: [minX + w * 0.15, cy], NW: [minX + w * 0.15, minY + h * 0.15],
    C: [cx, cy],
  };
  const v = map[zone] || [cx, cy];
  return { x: v[0], y: v[1] };
}

// Place an item inside a room, biased toward the ideal zone corner of the plan.
function roomCornerToward(room, zone, bounds) {
  if (!room) return zoneCentroid(zone, bounds);
  const c = roomCentroid(room);
  const zc = zoneCentroid(zone, bounds);
  return { x: c.x * 0.45 + zc.x * 0.55, y: c.y * 0.45 + zc.y * 0.55 };
}

// ─── Furniture → Vastu zone matrix (the full knowledge base) ─────────────────

// ideal = best zones; allowed = acceptable zones. Anything else = violation.
export const VASTU_FURNITURE_RULES = {
  pooja:        { ideal: ['NE'],                allowed: ['NE', 'E'],                 label: 'Pooja Mandir',   place: 'NE corner (Eshanya), idol facing West/East' },
  bed_master:   { ideal: ['SW'],                allowed: ['SW', 'S', 'W'],            label: 'Master Bed',     place: 'SW, head to South or West (never N/NE)' },
  bed_kids:     { ideal: ['SW', 'NW'],          allowed: ['SW', 'NW', 'W'],           label: 'Kids Bed',       place: 'SW or NW' },
  bed_guest:    { ideal: ['NW'],                allowed: ['NW', 'W'],                 label: 'Guest Bed',      place: 'NW' },
  bed:          { ideal: ['SW'],                allowed: ['SW', 'S', 'W'],            label: 'Bed',            place: 'SW, head South/West' },
  stove:        { ideal: ['SE'],                allowed: ['SE'],                      label: 'Stove / Burner', place: 'SE of kitchen, cooking facing East' },
  kitchen:      { ideal: ['SE'],                allowed: ['SE', 'NW'],                label: 'Kitchen',        place: 'SE (Agni); NW acceptable' },
  dining:       { ideal: ['W'],                 allowed: ['W', 'E', 'N'],             label: 'Dining Table',   place: 'West' },
  sofa:         { ideal: ['S', 'W'],            allowed: ['S', 'W', 'SW'],            label: 'Sofa / Seating', place: 'South or West wall' },
  tv_unit:      { ideal: ['S', 'E'],            allowed: ['S', 'E'],                  label: 'TV Unit',        place: 'South or East wall (opposite sofa)' },
  study_desk:   { ideal: ['W', 'N'],            allowed: ['W', 'N', 'NW'],            label: 'Study / Desk',   place: 'West or North, sit facing East/North' },
  wardrobe:     { ideal: ['S', 'W'],            allowed: ['S', 'W', 'SW'],            label: 'Wardrobe',       place: 'South/West wall' },
  safe:         { ideal: ['SW', 'N'],           allowed: ['SW', 'N'],                 label: 'Safe / Locker',  place: 'SW or North, door opening North' },
  mirror:       { ideal: ['N', 'E'],            allowed: ['N', 'E', 'NE'],            label: 'Mirror',         place: 'North or East wall — NEVER South/West' },
  aquarium:     { ideal: ['NE'],                allowed: ['NE', 'E'],                 label: 'Aquarium / Water', place: 'NE' },
  plant:        { ideal: ['NE', 'E'],           allowed: ['NE', 'E', 'N'],            label: 'Plants',         place: 'NE or East (NOT South/West)' },
  toilet:       { ideal: ['NW', 'W'],           allowed: ['NW', 'W'],                 label: 'Bathroom / Toilet', place: 'NW or West — never NE/center' },
  stairs:       { ideal: ['SW', 'S'],           allowed: ['SW', 'S', 'W'],            label: 'Staircase',      place: 'SW/S, ascend clockwise' },
  washing:      { ideal: ['NW'],                allowed: ['NW', 'SE'],                label: 'Washing / Utility', place: 'NW' },
  fridge:       { ideal: ['SW', 'S'],           allowed: ['SW', 'S', 'W'],            label: 'Refrigerator',   place: 'SW/S' },
  computer:     { ideal: ['N', 'E'],            allowed: ['N', 'E', 'NE'],            label: 'Computer / WiFi', place: 'NE (network corner)' },
  heavy_storage:{ ideal: ['SW', 'S'],           allowed: ['SW', 'S', 'W'],            label: 'Heavy Storage',  place: 'SW/S — keep weight in the South' },
};

function isPooja(f) {
  return (f.type || '').toLowerCase().includes('pooja') || (f.libraryId || '').toLowerCase().includes('pooja') || (f.name || '').toLowerCase().includes('mandir');
}
function bedItems(furniture) {
  return furniture.filter(f => (f.type || '').toLowerCase().includes('bed') || (f.libraryId || '').toLowerCase().includes('bed'));
}

// Map a furniture item to a matrix key.
function classify(item) {
  const s = `${item.type || ''} ${item.libraryId || ''} ${item.name || ''}`.toLowerCase();
  const rules = [
    ['pooja', /pooja|mandir|temple|altar|ganesha/],
    ['bed_master', /master\s*bed|bed.*master|main\s*bed/],
    ['bed_kids', /kid.?s?\s*bed|child.*bed/],
    ['bed_guest', /guest.*bed/],
    ['bed', /\bbed\b|bedroom|\bcot\b/],
    ['stove', /stove|burner|chulha|hob|gas\s*stove/],
    ['kitchen', /kitchen|modular/],
    ['dining', /dining|canteen/],
    ['sofa', /sofa|lounge|couch|settee/],
    ['tv_unit', /\btv\b|television|led\s*panel/],
    ['study_desk', /study|desk|office|workstation/],
    ['wardrobe', /wardrobe|almirah|cupboard/],
    ['safe', /safe|locker|vault|strongbox/],
    ['mirror', /mirror|vanity/],
    ['aquarium', /aquarium|fountain|fish|water\s*feature/],
    ['plant', /plant|garden|tulsi|greenery/],
    ['toilet', /toilet|bath|wash|wc|restroom|lavatory/],
    ['stairs', /stair|steps|staircase/],
    ['washing', /washing|washer|laundry|utility/],
    ['fridge', /fridge|refrigerat/],
    ['computer', /computer|wifi|router|server|network|console/],
    ['heavy_storage', /storage|trunk|heavy|box\s*storage/],
  ];
  for (const [key, re] of rules) if (re.test(s)) return key;
  if (item.vastuCategory && VASTU_FURNITURE_RULES[item.vastuCategory]) return item.vastuCategory;
  return 'unknown';
}

function loadCad(projectId) {
  return db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get(projectId);
}

function hasPooja(furniture) {
  return furniture.some(f => (f.type || '').toLowerCase().includes('pooja') || (f.libraryId || '').toLowerCase().includes('pooja') || (f.name || '').toLowerCase().includes('mandir'));
}

// ─── TEXT UNDERSTANDING: read the floor plan's words ─────────────────────────
/**
 * Parse directional cues written ON or ABOUT the plan: room labels, door
 * labels/positions, and a free-text `planText` (e.g. "west entrance, north
 * kitchen, SE toilet"). Returns:
 *   - entrance: 'N'|'NE'|...|null   (main door direction)
 *   - roomHints: { roomId/name -> zone }  (textually implied zone)
 *   - plotNorth: zone at the TOP of the page if text overrides geometry
 *   - tokens: recognized list for transparency
 */
export function parsePlanText({ rooms = [], openings = [], planText = '' } = {}) {
  const text = ` ${planText || ''} `.toLowerCase();
  const find = (re) => { const m = text.match(re); return m ? m[1] : null; };
  const dirFromWord = (w) => {
    if (!w) return null;
    const s = (' ' + ('' + w).toLowerCase().trim() + ' ');
    // Space-bounded so "west" never matches the key "southwest", and "se" matches the abbreviation.
    const DIR_WORDS = [
      ['north', 'N'], ['north-east', 'NE'], ['north east', 'NE'], ['northeast', 'NE'],
      ['east', 'E'], ['south-east', 'SE'], ['south east', 'SE'], ['southeast', 'SE'],
      ['south', 'S'], ['south-west', 'SW'], ['south west', 'SW'], ['southwest', 'SW'],
      ['west', 'W'], ['north-west', 'NW'], ['north west', 'NW'], ['northwest', 'NW'],
      ['ne', 'NE'], ['se', 'SE'], ['sw', 'SW'], ['nw', 'NW'], ['n', 'N'], ['e', 'E'], ['s', 'S'], ['w', 'W'],
    ];
    for (const [kw, z] of DIR_WORDS) {
      if (s === ' ' + kw + ' ' || s.includes(' ' + kw + ' ')) return z;
    }
    return null;
  };

  // 1) Explicit entrance direction: "west entrance", "main door north", "entry east"
  let entrance = find(/(?:main\s+)?(?:entrance|entry|door|main door)\s+(?:is\s+)?(?:in\s+)?(?:the\s+)?(north|north-?east|east|south-?east|south|south-?west|west|north-?west)/)
    || find(/(north|north-?east|east|south-?east|south|south-?west|west|north-?west)\s+(?:facing\s+)?(?:entrance|entry|main door|main entrance)/);

  // 2) Door labels in openings metadata (type/label/side)
  for (const o of openings) {
    const lbl = `${o.label || ''} ${o.name || ''} ${o.type || ''} ${o.side || ''}`.toLowerCase();
    if (/(main|entrance|entry)/.test(lbl)) {
      // Explicit direction field wins; never read "east" out of the word "entrance".
      const d = o.direction ? dirFromWord(o.direction) : dirFromWord(lbl.replace(/\b(entrance|entry|main)\b/g, ''));
      if (d && !entrance) entrance = d;
    }
  }

  // 3) Per-room zone hints from room names ("north kitchen", "SE bedroom")
  const roomHints = {};
  for (const r of rooms) {
    const name = `${r.name || ''} ${r.type || ''}`.toLowerCase();
    const d = dirFromWord(name);
    if (d) roomHints[r.id || r.name] = d;
  }

  // 4) Free-text "zone room" pairs: e.g. "north kitchen", "se toilet", "sw master bedroom"
  const pairs = [...text.matchAll(/(north|north-?east|east|south-?east|south|south-?west|west|north-?west|ne|se|sw|nw|n|e|s|w)\s+([a-z ]+?)(?=\s*,|\s+and|\.|$)/g)];
  for (const m of pairs) {
    const dir = dirFromWord(m[1]);
    const noun = m[2].trim().replace(/\s+/g, ' ');
    if (dir && noun.length > 1) {
      const rc = rooms.find(r => `${r.name || ''} ${r.type || ''}`.toLowerCase().includes(noun.split(' ')[0]));
      if (rc) roomHints[rc.id || rc.name] = dir;
    }
  }

  // 5) Plot orientation override: "north is up / top", "plot faces east"
  let plotNorthTop = true;
  if (/north\s+is\s+(?:at\s+)?(?:the\s+)?bottom|north\s+(?:points|faces)\s+south|rotate.*north.*down/.test(text)) plotNorthTop = false;

  return {
    entrance: dirFromWord(entrance),
    roomHints,
    plotNorthTop,
    tokens: { rooms: rooms.length, openings: openings.length, text: planText ? planText.slice(0, 200) : '' },
  };
}

/**
 * Combine geometry + text understanding into an ORIENTATION decision.
 * Decides northAngle (rotation so the compass matches reality) and an
 * entranceZone, then re-derives room zones from text hints where available.
 */
export function interpretVastuText(projectId, opts = {}) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const openings = JSON.parse(cad.openings_json || '[]');
  const planText = opts.planText || cad.plan_text || '';

  const parsed = parsePlanText({ rooms, openings, planText });

  // Geometry-derived baseline northAngle.
  let northAngle = Number(cad.north_angle || cad.northAngle || 0) || 0;
  if (!parsed.plotNorthTop) northAngle += 180; // text says north is at the bottom

  // If an entrance direction is stated, align that direction to the page's
  // main-entrance edge. We rotate so the stated entrance sits at the
  // geometrically-detected main door edge (bottom-center by default).
  let entranceZone = null;
  if (parsed.entrance) {
    entranceZone = parsed.entrance;
    // Find the geometrically-detected main entrance edge from door positions.
    const mainDoor = openings.find(o => /(main|entrance|entry)/i.test(`${o.label || ''} ${o.type || ''}`)) || openings[0];
    const bounds = planBounds(rooms, [], JSON.parse(cad.walls_json || '[]'));
    if (bounds) {
      let edge = 'S';
      if (mainDoor && mainDoor.x != null) {
        edge = zoneOfPoint(mainDoor.x, mainDoor.y ?? bounds.maxY, bounds, northAngle);
      } else if (openings.length) {
        const ds = openings.map(o => ({ o, z: o.x != null ? zoneOfPoint(o.x, o.y ?? bounds.maxY, bounds, northAngle) : 'S' }));
        const counts = {};
        ds.forEach(d => counts[d.z] = (counts[d.z] || 0) + 1);
        edge = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }
      // Rotate so the detected entrance edge lines up with the stated direction.
      const dirIndex = DIR_ORDER.indexOf(entranceZone);
      const edgeIndex = DIR_ORDER.indexOf(edge);
      if (dirIndex >= 0 && edgeIndex >= 0) northAngle = (northAngle + (edgeIndex - dirIndex) * 45) % 360;
    }
  }

  return {
    ok: true,
    northAngle,
    entranceZone,
    roomHints: parsed.roomHints,
    plotNorthTop: parsed.plotNorthTop,
    parsed,
  };
}

// ─── LEGACY API (unchanged behaviour — preserves existing tests) ─────────────

export function previewVastu(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');

  const changes = [];
  const poojaPresent = hasPooja(furniture);
  if (!poojaPresent) {
    const neRoom = rooms.find(r => (r.constraints?.vastuZone || r.vastuZone) === 'NE')
      || rooms.slice().sort((a, b) => (a.y || 0) - (b.y || 0))[0];
    const px = neRoom ? Math.round((neRoom.points?.[0]?.x ?? 150) + 30) : 150;
    const py = neRoom ? Math.round((neRoom.points?.[0]?.y ?? 200) + 30) : 250;
    changes.push({ kind: 'add_pooja', zone: 'NE', x: px, y: py, summary: 'Added Pooja mandir in North-East (NE) per Vastu — none found in plan.' });
  }

  for (const bed of bedItems(furniture)) {
    const zone = bed.vastuZone || bed.zone;
    if (zone && VASTU.bedForbiddenZones.includes(zone)) {
      changes.push({ kind: 'move_bed', id: bed.id, fromZone: zone, toZone: 'SW', summary: `Moved bed "${bed.name || bed.id}" from ${zone} (inauspicious) to South-West (SW).` });
    }
  }

  return { ok: true, poojaPresent, changes, needsApply: changes.length > 0 };
}

export function applyVastu(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const preview = previewVastu(projectId);
  if (!preview.ok) return preview;
  if (!preview.needsApply) return { ok: true, applied: [], changes: [] };

  const next = furniture.map(f => ({ ...f }));
  const applied = [];

  if (!preview.poojaPresent) {
    const add = preview.changes.find(c => c.kind === 'add_pooja');
    next.push({
      id: 'f_pooja_auto_' + Date.now().toString(36),
      libraryId: 'pooja_mandir', name: 'Pooja Mandir (Auto-Vastu)', type: 'pooja',
      x: add.x, y: add.y, width: 60, height: 90, rotation: 0, color: '#B88A2F', vastuZone: 'NE',
    });
    applied.push(add);
  }

  for (const ch of preview.changes.filter(c => c.kind === 'move_bed')) {
    const bed = next.find(f => f.id === ch.id);
    if (bed) {
      bed.vastuZone = 'SW'; bed.zone = 'SW';
      if (bed.x != null) bed.y = (bed.y ?? 0) + 40;
      applied.push(ch);
    }
  }

  db.prepare('UPDATE cad_drawings SET furniture_json = ? WHERE project_id = ?').run(JSON.stringify(next), projectId);
  return { ok: true, applied, changes: preview.changes };
}

// ─── FULL ENGINE ─────────────────────────────────────────────────────────────

/**
 * Scan the floor plan and report the Vastu compliance of EVERY furniture item,
 * with a precise target coordinate for each misplaced item. Now also folds in
 * text-derived orientation (entrance direction + per-room zone hints) and
 * exposes compass data for illustration.
 */
export function analyzeVastuPlan(projectId, opts = {}) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const walls = JSON.parse(cad.walls_json || '[]');
  const openings = JSON.parse(cad.openings_json || '[]');

  // Orientation: explicit northAngle, else text interpretation.
  let northAngle = Number(cad.north_angle || cad.northAngle || 0) || 0;
  let orientation = null;
  if (opts.useText !== false) {
    const interp = interpretVastuText(projectId, { planText: opts.planText || cad.plan_text || '' });
    if (interp.ok) {
      orientation = { northAngle: interp.northAngle, entranceZone: interp.entranceZone, roomHints: interp.roomHints, plotNorthTop: interp.plotNorthTop };
      northAngle = interp.northAngle;
    }
  }

  const bounds = planBounds(rooms, furniture, walls);

  const roomReports = rooms.map(r => {
    const geomZone = zoneOfRoom(r, bounds, northAngle);
    const textZone = orientation?.roomHints?.[r.id || r.name];
    return {
      id: r.id, name: r.name || r.type || 'Room',
      zone: textZone || geomZone, geomZone, textZone: textZone || null,
      centroid: roomCentroid(r),
    };
  });

  const items = [];
  for (const f of furniture) {
    const key = classify(f);
    if (key === 'unknown') {
      items.push({ id: f.id, name: f.name || f.type, type: f.type, label: f.name || f.type, zone: f.vastuZone || f.zone || '?', status: 'unknown', suggestion: null });
      continue;
    }
    const rule = VASTU_FURNITURE_RULES[key];
    const declaredZone = f.vastuZone || f.zone;
    let zone = declaredZone;
    if (!zone || !rule.allowed.includes(zone)) {
      const room = roomForPoint(f.x, f.y, rooms);
      if (f.x != null && bounds) zone = zoneOfPoint(f.x, f.y, bounds, northAngle);
      else if (room) zone = orientation?.roomHints?.[room.id || room.name] || zoneOfRoom(room, bounds, northAngle);
      else zone = declaredZone || '?';
    }
    const compliant = rule.allowed.includes(zone);
    const status = compliant ? 'compliant' : 'violation';
    let suggestion = null;
    if (!compliant) {
      const targetRoom = roomForPoint(f.x, f.y, rooms)
        || rooms.find(r => rule.allowed.includes(orientation?.roomHints?.[r.id || r.name] || zoneOfRoom(r, bounds, northAngle)))
        || rooms[0];
      const target = roomCornerToward(targetRoom, rule.ideal[0], bounds);
      suggestion = {
        zone: rule.ideal[0],
        target,
        kind: key === 'bed' ? 'move_bed' : 'move_furniture',
        label: rule.label,
        place: rule.place,
        summary: `${rule.label} sits in ${zone} (inauspicious). Move to ${rule.ideal[0]} — ${rule.place}.`,
      };
    }
    items.push({ id: f.id, name: f.name || f.type, type: key, label: rule.label, zone, ideal: rule.ideal, status, suggestion });
  }

  const missingKeyItems = [];
  const poojaItems = furniture.filter(isPooja);
  const nePooja = poojaItems.find(f => {
    const z = f.vastuZone || f.zone;
    if (z) return z === 'NE';
    if (f.x != null && bounds) return zoneOfPoint(f.x, f.y, bounds, northAngle) === 'NE';
    return false;
  });
  if (!nePooja) {
    const neRoom = rooms.find(r => (orientation?.roomHints?.[r.id || r.name] || zoneOfRoom(r, bounds, northAngle)) === 'NE');
    const tgt = neRoom ? roomCornerToward(neRoom, 'NE', bounds) : zoneCentroid('NE', bounds);
    missingKeyItems.push({ key: 'pooja', zone: 'NE', target: tgt, summary: 'No Pooja mandir in North-East (NE). NE is Eshanya — add one there.' });
  }

  const counts = {
    compliant: items.filter(i => i.status === 'compliant').length,
    violation: items.filter(i => i.status === 'violation').length,
    unknown: items.filter(i => i.status === 'unknown').length,
    total: items.length,
  };

  return {
    ok: true,
    northAngle,
    orientation,
    bounds,
    roomReports,
    items,
    missingKeyItems,
    counts,
    needsApply: items.some(i => i.status === 'violation') || missingKeyItems.length > 0,
  };
}

export function suggestVastuLayout(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const northAngle = Number(cad.north_angle || cad.northAngle || 0) || 0;
  const bounds = planBounds(rooms, [], JSON.parse(cad.walls_json || '[]'));

  const perRoom = rooms.map(r => {
    const z = zoneOfRoom(r, bounds, northAngle);
    const suggestions = Object.entries(VASTU_FURNITURE_RULES)
      .filter(([, rule]) => rule.ideal.includes(z))
      .map(([key, rule]) => ({
        category: key, label: rule.label, place: rule.place,
        target: roomCornerToward(r, rule.ideal[0], bounds),
      }));
    return { room: r.name || r.type || r.id, zone: z, suggestions };
  });

  return { ok: true, bounds, northAngle, perRoom };
}

/**
 * Apply the full Vastu plan: reposition every violating item to its ideal
 * coordinate and add missing key items. Superset of applyVastu (legacy).
 */
export function applyVastuFull(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const analysis = analyzeVastuPlan(projectId);
  if (!analysis.ok) return analysis;

  const next = furniture.map(f => ({ ...f }));
  const applied = [];

  for (const it of analysis.items) {
    if (it.status !== 'compliant' && it.suggestion) {
      const t = next.find(f => f.id === it.id);
      if (t) {
        t.x = Math.round(it.suggestion.target.x);
        t.y = Math.round(it.suggestion.target.y);
        t.vastuZone = it.suggestion.zone;
        t.zone = it.suggestion.zone;
        t.vastuSuggestion = null;
        applied.push({ kind: it.suggestion.kind, id: t.id, name: it.name, fromZone: it.zone, toZone: it.suggestion.zone });
      }
    }
  }

  for (const m of analysis.missingKeyItems) {
    if (m.key === 'pooja') {
      next.push({
        id: 'f_pooja_auto_' + Date.now().toString(36),
        libraryId: 'pooja_mandir', name: 'Pooja Mandir (Auto-Vastu)', type: 'pooja',
        x: Math.round(m.target.x), y: Math.round(m.target.y),
        width: 60, height: 90, rotation: 0, color: '#B88A2F', vastuZone: 'NE',
      });
      applied.push({ kind: 'add_pooja', zone: 'NE', x: Math.round(m.target.x), y: Math.round(m.target.y), summary: m.summary });
    }
  }

  db.prepare('UPDATE cad_drawings SET furniture_json = ? WHERE project_id = ?').run(JSON.stringify(next), projectId);
  return { ok: true, applied, analysis: { counts: analysis.counts, needsApply: analysis.needsApply } };
}

export { ZONES, DIR_ORDER };

// Illustration metadata for the front-end compass (9 zones + governing meaning).
export const VastuCompassData = ZONES.map(z => ({
  zone: z,
  label: { N: 'North', NE: 'North-East', E: 'East', SE: 'South-East', S: 'South', SW: 'South-West', W: 'West', NW: 'North-West', C: 'Center' }[z],
  color: { N: '#60A5FA', NE: '#34D399', E: '#A3E635', SE: '#F97316', S: '#EF4444', SW: '#C9A84C', W: '#818CF8', NW: '#22D3EE', C: '#94A3B8' }[z],
  governs: {
    N: 'Wealth · Career · Water', NE: 'Pooja · Clarity · Eshanya', E: 'Health · Social · Solar',
    SE: 'Fire · Kitchen · Agni', S: 'Fame · Rest · Yama', SW: 'Stability · Master bed · Nairutya',
    W: 'Gains · Storage', NW: 'Guests · Air · Vayu', C: 'Brahmasthan · Open & light',
  }[z],
}));

export default { previewVastu, applyVastu, analyzeVastuPlan, suggestVastuLayout, applyVastuFull, VASTU, VASTU_FURNITURE_RULES, parsePlanText, interpretVastuText };
