/**
 * floorplan-dxf-generator.js — Professional 2D Floor-Plan DXF Generator
 * ──────────────────────────────────────────────────────────────────────
 * Generates an AutoCAD R2010 ASCII DXF using the robust DXF class
 * from server/services/dxf-writer.js to ensure full compatibility,
 * correct handles (5), layers, and AcDb subclass markers.
 *
 * Coordinates are in millimetres (1 unit = 1mm).
 *
 * @param {object} plan  FloorPlanModel
 * @param {object} opts  { scale, projectName, sheetName }
 * @returns {string} DXF ASCII text
 */
import { DXF } from './dxf-writer.js';

export function generateFloorPlanDXF(plan, opts = {}) {
  const dxf = new DXF();
  const scale = opts.scale || '1:100';
  const projectName = opts.projectName || 'GROUND FLOOR PLAN';
  const sheetName = opts.sheetName || 'A-001';
  const wallThk = plan.wallThickness || 150; // mm

  // 1. Draw all walls as double-line polylines (true thickness)
  for (const w of (plan.walls || [])) {
    const t = (w.thickness || wallThk) / 2;
    const x1 = w.x1, y1 = w.y1, x2 = w.x2, y2 = w.y2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * t, ny = (dx / len) * t; // normal offset
    
    // Draw outer boundary as polyline
    dxf.poly([
      [x1 + nx, y1 + ny],
      [x2 + nx, y2 + ny],
      [x2 - nx, y2 - ny],
      [x1 - nx, y1 - ny]
    ], 'WALL_OUTLINE', true);
  }

  // 2. Draw all rooms (polygons + labels)
  for (const r of (plan.rooms || [])) {
    if (r.polygon) {
      dxf.poly(r.polygon.map(p => [p.x, p.y]), 'WALL_OUTLINE', true);
    }
    const cx = r.cx || (r.x + (r.w || 0) / 2);
    const cy = r.cy || (r.y + (r.h || 0) / 2);
    
    // Room title text
    dxf.text(cx, cy + 100, r.label, 120, 'ANNOTATIONS', 'MIDDLE');
    if (r.areaText) {
      dxf.text(cx, cy - 80, r.areaText, 80, 'ANNOTATIONS', 'MIDDLE');
    }
  }

  // 3. Draw doors (wing + swing quarter arc)
  for (const d of (plan.doors || [])) {
    const w = d.width || 900;
    const hx = d.hx, hy = d.hy;
    
    let dx = 0, dy = 0, startA = 0, endA = 90;
    if (d.direction === 'right') { dx = w; startA = 90; endA = 180; }
    else if (d.direction === 'left') { dx = -w; startA = 0; endA = 90; }
    else if (d.direction === 'up') { dy = w; startA = 270; endA = 360; }
    else if (d.direction === 'down') { dy = -w; startA = 0; endA = 90; }

    dxf.line(hx, hy, hx + dx, hy + dy, 'OPENINGS');
    dxf.arc(hx, hy, w, startA, endA, 'OPENINGS');
  }

  // 4. Draw windows
  for (const win of (plan.windows || [])) {
    const x1 = win.x1, y1 = win.y1, x2 = win.x2, y2 = win.y2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 60;
    const ny = (dx / len) * 60;

    dxf.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny, 'OPENINGS');
    dxf.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny, 'OPENINGS');
    dxf.line(x1, y1, x2, y2, 'OPENINGS');

    // Cross ticks at end of window frame
    const bs = 40;
    dxf.line(x1 - bs, y1 - bs, x1 + bs, y1 + bs, 'OPENINGS');
    dxf.line(x2 - bs, y2 - bs, x2 + bs, y2 + bs, 'OPENINGS');
  }

  // 5. Draw stairs
  for (const stair of (plan.stairs || [])) {
    const x = stair.x, y = stair.y, w = stair.w, h = stair.h;
    dxf.rect(x, y, w, h, 'FURNITURE');
    
    const steps = stair.steps || 12;
    const stepH = h / steps;
    for (let i = 1; i < steps; i++) {
      dxf.line(x, y + stepH * i, x + w, y + stepH * i, 'FURNITURE');
    }
    
    const cx = x + w / 2;
    dxf.line(cx, y + 100, cx, y + h - 100, 'FURNITURE');
    dxf.text(cx, y + h / 2, 'UP', 80, 'ANNOTATIONS', 'MIDDLE');
  }

  // 6. Draw dimension lines with oblique slashes
  for (const dim of (plan.dimensions || [])) {
    const x1 = dim.x1, y1 = dim.y1, x2 = dim.x2, y2 = dim.y2;
    if (dim.dir === 'h') {
      const ey = y1 + dim.offset;
      dxf.line(x1, y1, x1, ey, 'DIMENSIONS');
      dxf.line(x2, y2, x2, ey, 'DIMENSIONS');
      dxf.line(x1, ey, x2, ey, 'DIMENSIONS');
      
      // Oblique ticks (45-degree slashes)
      const ts = 60;
      dxf.line(x1 - ts, ey - ts, x1 + ts, ey + ts, 'DIMENSIONS');
      dxf.line(x2 - ts, ey - ts, x2 + ts, ey + ts, 'DIMENSIONS');
      dxf.text((x1 + x2) / 2, ey + (dim.offset > 0 ? 80 : -160), dim.label, 80, 'DIMENSIONS', 'MIDDLE');
    } else {
      const ex = x1 + dim.offset;
      dxf.line(x1, y1, ex, y1, 'DIMENSIONS');
      dxf.line(x2, y2, ex, y2, 'DIMENSIONS');
      dxf.line(ex, y1, ex, y2, 'DIMENSIONS');
      
      // Oblique ticks
      const ts = 60;
      dxf.line(ex - ts, y1 - ts, ex + ts, y1 + ts, 'DIMENSIONS');
      dxf.line(ex - ts, y2 - ts, ex + ts, y2 + ts, 'DIMENSIONS');
      dxf.text(ex + (dim.offset > 0 ? 80 : -160), (y1 + y2) / 2, dim.label, 80, 'DIMENSIONS', 'MIDDLE');
    }
  }

  // 7. Draw title block and north arrow
  const bx = plan.titleBlock?.x || 0;
  const by = plan.titleBlock?.y || -1600;
  const bw = 4000, bh = 1000;
  
  dxf.rect(bx, by, bw, bh, 'TITLEBLOCK');
  dxf.line(bx + bw - 1600, by, bx + bw - 1600, by + bh, 'TITLEBLOCK');
  dxf.text(bx + 80, by + 800, projectName, 90, 'TITLEBLOCK', 'LEFT');
  dxf.text(bx + 80, by + 650, `SHEET: ${sheetName}`, 65, 'TITLEBLOCK', 'LEFT');
  dxf.text(bx + 80, by + 520, `SCALE: ${scale}`, 65, 'TITLEBLOCK', 'LEFT');
  dxf.text(bx + bw - 1520, by + 800, 'AURABRAIN', 80, 'TITLEBLOCK', 'LEFT');
  dxf.text(bx + bw - 1520, by + 650, `DATE: ${new Date().toISOString().slice(0, 10)}`, 55, 'TITLEBLOCK', 'LEFT');
  dxf.text(bx + bw - 1520, by + 520, 'ALL DIMS IN MM', 55, 'TITLEBLOCK', 'LEFT');

  // North Arrow
  const nax = plan.northArrow?.x || (bx + bw + 600);
  const nay = plan.northArrow?.y || (by + 500);
  dxf.circle(nax, nay, 300, 'ANNOTATIONS');
  dxf.poly([[nax, nay + 250], [nax - 100, nay - 150], [nax, nay - 50], [nax + 100, nay - 150]], 'ANNOTATIONS', true);
  dxf.text(nax, nay + 350, 'N', 100, 'ANNOTATIONS', 'MIDDLE');

  return dxf.toString();
}

export default { generateFloorPlanDXF };
