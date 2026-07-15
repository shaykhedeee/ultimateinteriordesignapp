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
    ? Math.max(0.4, Math.min(1, 0.6 + 0.1 * Math.min(rooms.length, 4) - (scaleEstimated ? 0.1 : 0)))
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
      'Detect rooms, walls, openings, and scale from the uploaded plan. Mark uncertain areas for review instead of guessing.',
      'Return ONLY valid JSON: { "overallDimensions": "...", "detectedRooms": [{"type":..., "label":..., "measurements":...}], "openingsCount": {"doors": n, "windows": n}, "handwrittenNotes": [...] }'
    ].join('\n');
    const parts = [{ text: prompt }, { inline_data: { mime_type: 'image/png', data: fs.readFileSync(imagePath).toString('base64') } }];
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
  try {
    cv = await runCvWallDetect(imagePath);
  } catch (cvErr) {
    return { success: false, error: 'CV_FAILED', message: 'Wall detection failed: ' + cvErr.message + '. Trace manually in the editor.' };
  }
  if (!cv.walls || cv.walls.length === 0) {
    return { success: false, error: 'NO_WALLS', message: 'No walls detected in the image. Try a higher-contrast plan or trace walls manually.' };
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
  const rawRooms = interp.interpretation.rooms || [];

  // 4. AI enrichment (honest, optional). Never blocks the geometry report.
  let aiLabels = [];
  let aiNotes = [];
  let aiUsed = false;
  const ai = await tryAiEnrichment(imagePath).catch(() => null);
  if (ai && Array.isArray(ai.detectedRooms)) {
    aiLabels = ai.detectedRooms;
    aiUsed = true;
    if (Array.isArray(ai.handwrittenNotes)) aiNotes = ai.handwrittenNotes.map(n => 'Plan note: ' + n);
  }

  // 5. Classify + name + report.
  const rooms = classifyRooms(rawRooms, aiLabels);
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
    aiUsed
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
