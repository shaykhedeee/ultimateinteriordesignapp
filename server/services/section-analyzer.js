/**
 * section-analyzer.js  (REAL vertical building section)
 * --------------------------------------------------------------------------
 * Builds a vertical section through a wall line: floor datum (0), ceiling
 * (heightMm), wall thickness, and true opening voids (sill -> head).
 * Pure + deterministic. Reuses the opening normalisation from elevation-analyzer.
 */
// Local defaults (mirror elevation-analyzer so these services stay self-contained)
const DEFAULT_PPM = 40.0;
const DEFAULT_CEILING_MM = 2700;

const num = (v, fb = 0) => { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? n : fb; };

export function analyzeSection({ wall, openings = [], pixelsPerMeter = DEFAULT_PPM, wallHeightMm = DEFAULT_CEILING_MM }) {
  const ppm = pixelsPerMeter > 0 ? pixelsPerMeter : DEFAULT_PPM;
  const dx = num(wall.x2) - num(wall.x1);
  const dy = num(wall.y2) - num(wall.y1);
  const lengthMm = Math.round((Math.hypot(dx, dy) / ppm) * 1000);
  const heightMm = num(wall.heightMm ?? wallHeightMm, DEFAULT_CEILING_MM);
  const thicknessMm = num(wall.thicknessMm ?? 230);

  const sectionOpenings = openings
    .filter(o => (o.wallId || o.wallID) === wall.id)
    .map(o => {
      const type = (o.openingType || o.type || 'door').toLowerCase();
      const offset = num(o.offsetFromStartMm ?? o.offsetMm ?? o.offset ?? 0);
      const width = num(o.widthMm ?? o.width ?? (type === 'door' ? 900 : 1200));
      const sill = num(o.sillHeightMm ?? o.sillMm ?? o.sill ?? (type === 'window' ? 900 : 0));
      const head = num(o.headHeightMm ?? o.headMm ?? o.head ?? (type === 'door' ? 2100 : 2100));
      return {
        id: o.id, type, offsetMm: Math.max(0, Math.min(offset, lengthMm - width)),
        widthMm: width, sillMm: sill, headMm: head
      };
    })
    .sort((a, b) => a.offsetMm - b.offsetMm);

  return {
    wallId: wall.id,
    lengthMm,
    heightMm,
    ceilingHeightMm: heightMm,
    thicknessMm,
    floorDatumMm: 0,
    openings: sectionOpenings,
    confidence: num(wall.x1) !== num(wall.x2) || num(wall.y1) !== num(wall.y2) ? 1 : 0
  };
}

export default { analyzeSection };
