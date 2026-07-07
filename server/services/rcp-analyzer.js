/**
 * rcp-analyzer.js  (REAL Reflected Ceiling Plan)
 * --------------------------------------------------------------------------
 * Produces a top-down reflected ceiling plan: light fixtures with real
 * x/y (mm) positions, grouped by switch circuit, plus ceiling height.
 * Pure + deterministic. Reuses cad_drawings coordinates via px->mm.
 */
// Local defaults (mirror elevation-analyzer so these services stay self-contained)
const DEFAULT_PPM = 40.0;
const DEFAULT_CEILING_MM = 2700;

const num = (v, fb = 0) => { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? n : fb; };

export function analyzeRCP({ lights = [], pixelsPerMeter = DEFAULT_PPM, ceilingHeightMm = DEFAULT_CEILING_MM, rooms = [] }) {
  const ppm = pixelsPerMeter > 0 ? pixelsPerMeter : DEFAULT_PPM;
  const toMm = (px) => Math.round((px / ppm) * 1000);

  const fixtures = lights
    .map((l, i) => {
      const x = num(l.x), y = num(l.y);
      return {
        id: l.id || `light_${i}`,
        type: (l.type || 'downlight').toLowerCase(),
        xMm: toMm(x),
        yMm: toMm(y),
        circuit: l.circuit || (i % 2 === 0 ? 'A' : 'B'), // alternate switch groups
        intensity: num(l.intensity ?? 800),
        confidence: 1
      };
    })
    .sort((a, b) => (a.circuit < b.circuit ? -1 : 1));

  const circuits = [...new Set(fixtures.map(f => f.circuit))];
  const coverage = fixtures.length; // fixtures count is the real coverage signal

  return {
    ceilingHeightMm: num(ceilingHeightMm, DEFAULT_CEILING_MM),
    fixtures,
    circuits: circuits.map(c => ({ circuit: c, fixtures: fixtures.filter(f => f.circuit === c).length })),
    roomCount: rooms.length,
    coverage,
    confidence: fixtures.length > 0 ? 1 : 0
  };
}

export default { analyzeRCP };
