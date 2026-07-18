/**
 * floorplan-analysis.js — REAL floor-plan analysis pipeline.
 * --------------------------------------------------------------------------
 * Produces an honest, geometry-derived report from an uploaded floorplan /
 * room image WITHOUT inventing data:
 *
 *   1. Offline CV (cv-wall-detect.py) traces axis-aligned wall segments in
 *      image pixels (no cloud, no API key required).
 *   2. We auto-estimate a scale (or honour a supplied pixels-per-metre) and
 *      feed the traced walls to planIntelligenceCore.interpretFloorPlan, which
 *      runs real planar-face detection to recover enclosed rooms + dimensions.
 *   3. Rooms are classified (living / kitchen / bedroom / bathroom …) from
 *      real geometry (area, aspect, adjacency).
 *   4. Optionally, Gemini vision is used ONLY to enrich labels / read
 *      handwritten notes. If the API is unavailable (e.g. quota 429) the
 *      geometry report stands on its own — we NEVER fabricate dimensions.
 *
 * Every absolute measurement is flagged as scale-estimated so the user knows
 * to confirm with the Auto Scale Calibrator.
 */
import fs from 'fs';
import { getGeminiStatus } from './gemini-service.js';
import planIntelligenceCore from './plan-intelligence-core.js';
import { runCvWallDetect } from './cv-wall-client.js';

const DEFAULT_PPM = 40.0; // app default: 40 plan-px == 1000mm

const num = (v, fb = 0) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fb;
};

/** Reasonable auto-scale: assume the longer bounding-box side ≈ a typical
 *  Indian apartment footprint so reported mm are plausible. Flagged estimated. */
function estimatePpm(walls, imageW, imageH) {
  if (!walls.length) return DEFAULT_PPM;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, num(w.x1), num(w.x2));
    maxX = Math.max(maxX, num(w.x1), num(w.x2));
    minY = Math.min(minY, num(w.y1), num(w.y2));
    maxY = Math.max(maxY, num(w.y1), num(w.y2));
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const longer = Math.max(bw, bh);
  // Typical apartment plan longer side: ~10m (single home) → 14m (large).
  const assumedMeters = 11;
  return longer / assumedMeters;
}

/** Classify + name rooms from real geometry. AI labels (if any) override. */
function classifyRooms(rooms, aiLabels = []) {
  if (!rooms.length) return rooms;
  const sorted = [...rooms].sort((a, b) => b.areaMm2 - a.areaMm2);
  const totalAreaM2 = rooms.reduce((s, r) => s + r.areaMm2, 0) / 1e6;

  // AI labels by lowercased type/label, for matching our real rooms by area order.
  const aiByArea = [...aiLabels]
    .map(l => ({ type: (l.type || '').toLowerCase(), label: l.label || '', measurements: l.measurements || '' }))
    .sort((a, b) => {
      const areaA = parseAreaM2(a.measurements);
      const areaB = parseAreaM2(b.measurements);
      return areaB - areaA;
    });

  let livingAssigned = false;
  let kitchenAssigned = false;
  let bedNo = 0;
  const out = rooms.map((r, idx) => {
    const areaM2 = r.areaMm2 / 1e6;
    const aspect = (r.widthMm && r.heightMm) ? Math.max(r.widthMm, r.heightMm) / Math.max(1, Math.min(r.widthMm, r.heightMm)) : 1;
    let type = 'other';
    let name = r.name || `Room ${idx + 1}`;

    if (!livingAssigned && areaM2 >= 12) { type = 'living'; name = 'Living Room'; livingAssigned = true; }
    else if (!kitchenAssigned && areaM2 >= 6 && areaM2 <= 16 && aspect <= 1.6) { type = 'kitchen'; name = 'Kitchen'; kitchenAssigned = true; }
    else if (areaM2 < 6) { type = 'bathroom'; name = 'Bathroom'; }
    else { bedNo += 1; type = 'bedroom'; name = `Bedroom ${bedNo}`; }

    // AI override by area-proximity (only when AI actually returned labels)
    if (aiByArea.length) {
      const best = aiByArea.reduce((best, l) => {
        const la = parseAreaM2(l.measurements);
        const d = Math.abs(la - areaM2);
        return (la > 0 && d < (best.d ?? Infinity) && d < 6) ? { l, d } : best;
      }, {});
      if (best.l) {
        if (/kitchen/.test(best.l.type)) { type = 'kitchen'; name = best.l.label || 'Kitchen'; }
        else if (/liv|hall|draw|dining/.test(best.l.type)) { type = 'living'; name = best.l.label || 'Living Room'; }
        else if (/bath|toilet|wc/.test(best.l.type)) { type = 'bathroom'; name = best.l.label || 'Bathroom'; }
        else if (/bed|sleep|master/.test(best.l.type)) { type = 'bedroom'; name = best.l.label || name; }
        else if (/pooja|mandir/.test(best.l.type)) { type = 'pooja'; name = best.l.label || 'Pooja Room'; }
        else if (/balcony|terrace/.test(best.l.type)) { type = 'balcony'; name = best.l.label || 'Balcony'; }
        else if (best.l.label) name = best.l.label;
      }
    }
    return { ...r, type, name };
  });
  return out;
}

function parseAreaM2(text) {
  if (!text) return 0;
  const m = String(text).match(/([\d.]+)\s*(m|ft|')/gi);
  if (!m) return 0;
  let sqm = 0;
  for (const tok of m) {
    const v = parseFloat(tok);
    if (/ft|'/.test(tok)) sqm += (v * v) / 10.764; // crude sqft contribution
    else sqm += v * v; // assume metres-as-side
  }
  return sqm / Math.max(1, m.length);
}

/** Build the human-readable short report object. */
function buildReport({ rooms, openings, dimensions, ppm, scaleEstimated, aiNotes = [], aiUsed = false }) {
  const totalAreaM2 = rooms.reduce((s, r) => s + (r.areaMm2 || 0), 0) / 1e6;
  const bedrooms = rooms.filter(r => r.type === 'bedroom').length;
  const kitchens = rooms.filter(r => r.type === 'kitchen').length;
  const baths = rooms.filter(r => r.type === 'bathroom').length;
  const living = rooms.filter(r => r.type === 'living').length;
  const other = rooms.length - bedrooms - kitchens - baths - living;

  let layoutType = 'APARTMENT';
  if (rooms.length === 0) layoutType = 'NO ROOMS DETECTED';
  else if (bedrooms >= 4) layoutType = `${bedrooms}BHK Layout`;
  else if (bedrooms === 3) layoutType = '3BHK Layout';
  else if (bedrooms === 2) layoutType = '2BHK Layout';
  else if (bedrooms === 1) layoutType = '1BHK Layout';

  const doors = openings.filter(o => (o.type || 'door') === 'door').length;
  const windows = openings.filter(o => (o.type || '') === 'window').length;

  const notes = [];
  if (scaleEstimated) notes.push('Scale auto-estimated from plan footprint — use the Auto Scale Calibrator to set a known wall length for exact mm.');
  if (rooms.length && rooms.every(r => r.type === 'other')) notes.push('Room functions inferred from size only; trace interior partitions for accurate zoning.');
  if (openings.length === 0) notes.push('No door/window openings detected — verify wall gaps exist or trace openings manually.');
  if (aiNotes && aiNotes.length) notes.push(...aiNotes);
  if (aiUsed) notes.push('AI vision used to name rooms / read annotations where confident.');

  const confidence = rooms.length
    ? Math.max(0.4, Math.min(scaleEstimated ? 0.75 : 1, 0.6 + 0.1 * Math.min(rooms.length, 4) - (scaleEstimated ? 0.1 : 0)))
    : 0;

  const roomSummary = rooms.map(r => ({
    name: r.name,
    type: r.type,
    widthM: +(r.widthMm / 1000).toFixed(2),
    heightM: +(r.heightMm / 1000).toFixed(2),
    areaM2: +(r.areaMm2 / 1e6).toFixed(2)
  }));

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    scaleEstimated,
    ppm: +ppm.toFixed(2),
    layoutType,
    totalAreaM2: +totalAreaM2.toFixed(2),
    counts: { rooms: rooms.length, bedrooms, kitchens, bathrooms: baths, living, other },
    openings: { doors, windows, total: openings.length },
    confidence: +confidence.toFixed(2),
    rooms: roomSummary,
    dimensions: (dimensions || []).slice(0, 12),
    notes
  };
}

/** Attempt a real Gemini vision read of the image. Returns null on any failure
 *  (unconfigured / quota / unparseable) — caller treats null as "no AI". */
async function tryAiEnrichment(imagePath) {
  const status = getGeminiStatus();
  if (!status.configured || !status.enabled) return null;
  let parsed = null;
  try {
    const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';
    const prompt = [
      'You are reading a top-down architectural floor plan. Identify only what is visibly supported by the drawing.',
      'Return ONLY valid JSON. Coordinates are normalized 0 to 1000 across the full image. Do not invent dimensions.',
      '{"detectedRooms":[{"id":"room_1","type":"living|bedroom|kitchen|bathroom|balcony|utility|other","label":"visible label or Room 1","bounds":{"x":0,"y":0,"width":0,"height":0},"measurements":"visible text or null","confidence":0}],"walls":[{"x1":0,"y1":0,"x2":0,"y2":0,"confidence":0}],"openings":[{"type":"door|window","x":0,"y":0,"width":0,"confidence":0}],"handwrittenNotes":["only text clearly visible"],"overallDimensions":"visible overall dimension or null"}',
      'Use room bounds only when the complete room boundary is visible. Keep uncertain items below 0.7 confidence.'
    ].join('\n');
    const ext = String(imagePath).toLowerCase();
    const mimeType = /\.jpe?g$/.test(ext) ? 'image/jpeg' : /\.webp$/.test(ext) ? 'image/webp' : 'image/png';
    const parts = [{ text: prompt }, { inline_data: { mime_type: mimeType, data: fs.readFileSync(imagePath).toString('base64') } }];
    const keys = [process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY, process.env.GOOGLE_AI_STUDIO_KEY_1, process.env.GOOGLE_AI_STUDIO_KEY_2].filter(Boolean);
    for (const key of keys) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 2048 } })
      });
      if (!res.ok) continue;
      const payload = await res.json();
      const text = payload?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      const jm = text.match(/\{[\s\S]*\}/);
      if (jm) { parsed = JSON.parse(jm[0]); break; }
    }
  } catch (e) {
    console.warn('[floorplan-analysis] AI enrichment skipped:', e.message);
  }
  return parsed;
}

function normalizedAiGeometry(ai) {
  const candidates = Array.isArray(ai?.detectedRooms) ? ai.detectedRooms : [];
  const rooms = candidates.map((room, index) => {
    const bounds = room?.bounds || {};
    const x = num(bounds.x, -1), y = num(bounds.y, -1);
    const w = num(bounds.width, 0), h = num(bounds.height, 0);
    if (x < 0 || y < 0 || w < 40 || h < 40) return null;
    // 12 mm per normalized pixel is intentionally an estimate. The review
    // gate requires calibration before the proposal can drive production.
    const factor = 12;
    const xMm = Math.round(x * factor), yMm = Math.round(y * factor);
    const widthMm = Math.round(w * factor), heightMm = Math.round(h * factor);
    return {
      id: room.id || `ai_room_${index + 1}`,
      name: room.label || `Room ${index + 1}`,
      type: String(room.type || 'other').toLowerCase(),
      x: xMm, y: yMm, widthMm, heightMm, areaMm2: widthMm * heightMm,
      confidence: Math.min(0.65, Math.max(0.2, num(room.confidence, 0.45))),
      points: [
        { x: xMm, y: yMm }, { x: xMm + widthMm, y: yMm },
        { x: xMm + widthMm, y: yMm + heightMm }, { x: xMm, y: yMm + heightMm }
      ]
    };
  }).filter(Boolean);
  if (!rooms.length) return null;

  const walls = [];
  for (const room of rooms) {
    const [a, b, c, d] = room.points;
    walls.push(
      { x1: a.x, y1: a.y, x2: b.x, y2: b.y, thicknessMm: 150, source: 'ai-vision-proposal' },
      { x1: b.x, y1: b.y, x2: c.x, y2: c.y, thicknessMm: 150, source: 'ai-vision-proposal' },
      { x1: c.x, y1: c.y, x2: d.x, y2: d.y, thicknessMm: 150, source: 'ai-vision-proposal' },
      { x1: d.x, y1: d.y, x2: a.x, y2: a.y, thicknessMm: 150, source: 'ai-vision-proposal' }
    );
  }
  return { rooms, walls, openings: [] };
}

/**
 * analyzeFloorplanImage — the REAL entry point used by the UI.
 * @param {string} projectId
 * @param {string} imagePath   absolute path to the underlay image
 * @param {object} [opts]      { ppmHint, knownRealMm }
 * @returns analysis object with traced walls, detected rooms, and a report.
 */
export async function analyzeFloorplanImage(projectId, imagePath, opts = {}) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return { success: false, error: 'NO_IMAGE', message: 'No floorplan image supplied. Upload a plan or attach one to the project brief.' };
  }

  // 1. Offline CV wall trace (no API).
  let cv;
  let cvError = null;
  try {
    cv = await runCvWallDetect(imagePath);
  } catch (cvErr) {
    cvError = cvErr;
  }

  // Vision is a semantic and last-resort geometry proposal layer. It never
  // becomes approved geometry: all output is marked estimated and requires
  // calibration plus designer review.
  // Keep private plan uploads local-first. Vision enrichment is opt-in and
  // remains an editable proposal layer, never an approval or geometry source.
  const ai = process.env.FLOORPLAN_VISION_ENRICHMENT === 'true'
    ? await tryAiEnrichment(imagePath).catch(() => null)
    : null;
  const aiGeometry = normalizedAiGeometry(ai);
  if (!cv?.walls?.length && aiGeometry) {
    const report = buildReport({
      rooms: aiGeometry.rooms,
      openings: aiGeometry.openings,
      dimensions: [],
      ppm: DEFAULT_PPM,
      scaleEstimated: true,
      aiNotes: ['AI vision supplied an editable room-boundary proposal. Confirm every wall and dimension before scene generation.'],
      aiUsed: true
    });
    return {
      success: true,
      source: 'ai-vision-proposal',
      imageWidth: 0,
      imageHeight: 0,
      scaleEstimated: true,
      ppm: DEFAULT_PPM,
      walls: aiGeometry.walls,
      openings: aiGeometry.openings,
      rooms: aiGeometry.rooms,
      report,
      aiUsed: true,
      cvError: cvError?.message || null
    };
  }
  if (!cv?.walls?.length) {
    return {
      success: false,
      error: cvError ? 'CV_AND_VISION_FAILED' : 'NO_WALLS',
      message: cvError
        ? `Wall detection is unavailable (${cvError.message}). AI could not establish complete room boundaries from this image.`
        : 'No walls detected in the image. Try a higher-contrast plan or trace walls manually.',
      aiUsed: Boolean(ai)
    };
  }

  // 2. Scale.
  let ppm = opts.ppmHint || DEFAULT_PPM;
  let scaleEstimated = !opts.ppmHint;
  if (opts.knownRealMm && opts.knownRealMm > 0 && cv.imageWidth) {
    ppm = (cv.imageWidth / opts.knownRealMm) * 1000;
    scaleEstimated = false;
  } else if (scaleEstimated) {
    ppm = estimatePpm(cv.walls, cv.imageWidth, cv.imageHeight);
  }

  // 3. Real planar room detection via the geometry interpreter.
  const traced = {
    walls: cv.walls.map(w => ({
      x1: num(w.x1), y1: num(w.y1), x2: num(w.x2), y2: num(w.y2),
      thicknessMm: num(w.thicknessMm, 150), axis: w.axis
    })),
    openings: (cv.openings || []).map(o => ({ x: num(o.x), y: num(o.y), widthMm: num(o.width, 900), type: o.type || 'door', axis: o.axis })),
    ppm
  };
  const interp = planIntelligenceCore.interpretFloorPlan(projectId || 'analyze', null, { traced });
  if (!interp.success) {
    return { success: false, error: interp.error, message: interp.message };
  }
  const interpretedRooms = interp.interpretation.rooms || [];
  // Text, dimensions and furniture symbols can form accidental tiny faces in
  // a scanned drawing. A crowded graph is not a trustworthy room proposal.
  // Keep the detected walls for designer correction, but never label a dense
  // grid as dozens of real rooms.
  const fragmentedGeometry = interpretedRooms.length > 20;
  const rawRooms = fragmentedGeometry ? [] : interpretedRooms;

  // 4. AI enrichment (honest, optional). Never blocks the geometry report.
  let aiLabels = [];
  let aiNotes = [];
  let aiUsed = false;
  if (ai && Array.isArray(ai.detectedRooms)) {
    aiLabels = ai.detectedRooms;
    aiUsed = true;
    if (Array.isArray(ai.handwrittenNotes)) aiNotes = ai.handwrittenNotes.map(n => 'Plan note: ' + n);
  }

  // 5. Classify + name + report.
  const rooms = classifyRooms(rawRooms, aiLabels);
  if (fragmentedGeometry) {
    aiNotes.unshift('Wall lines were detected, but the scan produced too many small enclosed regions. Review wall joins and room boundaries before approval.');
  }
  const report = buildReport({
    rooms,
    openings: traced.openings,
    dimensions: interp.interpretation.dimensions || [],
    ppm, scaleEstimated, aiNotes, aiUsed
  });

  return {
    success: true,
    source: 'offline-cv + planar-rooms' + (aiUsed ? ' + ai-labels' : ''),
    imageWidth: cv.imageWidth,
    imageHeight: cv.imageHeight,
    scaleEstimated,
    ppm: +ppm.toFixed(2),
    walls: traced.walls,
    openings: traced.openings,
    rooms,
    report,
    aiUsed,
    fragmentedGeometry
  };
}

/**
 * analyzeTracedPlan — build the report from already-traced walls (manual trace
 * or a previous CV pass) WITHOUT needing an image. Used by "Run AI Auto-Detect"
 * when walls already exist.
 */
export function analyzeTracedPlan(projectId, { walls = [], openings = [], ppm = DEFAULT_PPM } = {}) {
  const traced = {
    walls: walls.map(w => ({
      x1: num(w.x1 ?? w.x ?? 0), y1: num(w.y1 ?? w.y ?? 0),
      x2: num(w.x2 ?? (w.x + (w.w || 0)) ?? 0), y2: num(w.y2 ?? (w.y + (w.h || 0)) ?? 0),
      thicknessMm: num(w.thicknessMm ?? w.thickness ?? 150), axis: w.axis
    })),
    openings: (openings || []).map(o => ({ x: num(o.x), y: num(o.y), widthMm: num(o.widthMm ?? o.width ?? 900), type: o.type || 'door', axis: o.axis })),
    ppm: num(ppm, DEFAULT_PPM)
  };
  if (!traced.walls.length) {
    return { success: false, error: 'NO_TRACED_WALLS', message: 'No traced walls found. Trace walls or upload a floorplan image first.' };
  }
  const interp = planIntelligenceCore.interpretFloorPlan(projectId || 'analyze', null, { traced });
  if (!interp.success) return { success: false, error: interp.error, message: interp.message };
  const rooms = classifyRooms(interp.interpretation.rooms || []);
  const report = buildReport({
    rooms, openings: traced.openings,
    dimensions: interp.interpretation.dimensions || [],
    ppm: traced.ppm, scaleEstimated: false, aiUsed: false
  });
  return { success: true, source: 'traced-vectors', walls: traced.walls, openings: traced.openings, rooms, report, aiUsed: false };
}

export default { analyzeFloorplanImage, analyzeTracedPlan };
