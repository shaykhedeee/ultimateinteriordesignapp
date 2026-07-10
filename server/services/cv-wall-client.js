/**
 * cv-wall-client.js — Node wrapper around the offline Python wall detector.
 * Spawns server/services/cv-wall-detect.py (fitz + numpy, no cloud) and
 * returns sanitized wall segments + openings in IMAGE PIXELS.
 *
 * Sanitization: a furnished-room photo produces noisy edges. We keep only a
 * clean, usable trace:
 *  - if CV returns a tidy rectangular room (4 walls forming a closed box), use it;
 *  - otherwise derive the ROOM OUTLINE from the bounding box of the outermost
 *    detected walls, and keep any clearly-internal partition lines.
 * This guarantees "Detect Walls From Image" always yields a drawable room.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'cv-wall-detect.py');

export function runCvWallDetect(imagePath) {
  return new Promise((resolve, reject) => {
    const p = spawn('python3', [SCRIPT, imagePath], { windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (err += d));
    p.on('error', reject);
    p.on('close', code => {
      if (code !== 0 || !out.trim()) return reject(new Error(err || 'cv exited ' + code));
      try {
        const raw = JSON.parse(out);
        if (!raw.success) return reject(new Error('cv failed'));
        resolve(sanitize(raw));
      } catch (e) {
        reject(new Error('cv output parse: ' + e.message + ' | ' + out.slice(0, 200)));
      }
    });
    // guard against hang
    setTimeout(() => p.kill('SIGKILL'), 25000).unref?.();
  });
}

/** Convert raw CV output into a clean, drawable room trace. */
export function sanitize(raw) {
  const walls = raw.walls || [];
  const W = raw.imageWidth, H = raw.imageHeight;
  if (!walls.length) return { walls: [], openings: [], source: raw.source || 'local-cv', imageWidth: W, imageHeight: H };

  const xs = walls.map(w => Math.min(w.x1, w.x2));
  const xe = walls.map(w => Math.max(w.x1, w.x2));
  const ys = walls.map(w => Math.min(w.y1, w.y2));
  const ye = walls.map(w => Math.max(w.y1, w.y2));
  const minX = Math.min(...xs), maxX = Math.max(...xe);
  const minY = Math.min(...ys), maxY = Math.max(...ye);

  // vertical lines grouped by x; horizontal by y
  const vByX = groupBy(walls.filter(w => w.axis === 'v'), w => Math.round((w.x1) / 12) * 12);
  const hByY = groupBy(walls.filter(w => w.axis === 'h'), w => Math.round((w.y1) / 12) * 12);

  // A "real" partition line: spans > 60% of the room dimension
  const vPart = pickLong(vByX, H, 0.6);
  const hPart = pickLong(hByY, W, 0.6);

  const cleaned = [];
  // room outline (always)
  cleaned.push({ x1: minX, y1: minY, x2: minX, y2: maxY, thicknessMm: 230 });
  cleaned.push({ x1: maxX, y1: minY, x2: maxX, y2: maxY, thicknessMm: 230 });
  cleaned.push({ x1: minX, y1: minY, x2: maxX, y2: minY, thicknessMm: 230 });
  cleaned.push({ x1: minX, y1: maxY, x2: maxX, y2: maxY, thicknessMm: 230 });
  // internal partitions
  for (const x of vPart) if (x > minX + 30 && x < maxX - 30) cleaned.push({ x1: x, y1: minY, x2: x, y2: maxY, thicknessMm: 230 });
  for (const y of hPart) if (y > minY + 30 && y < maxY - 30) cleaned.push({ x1: minX, y1: y, x2: maxX, y2: y, thicknessMm: 230 });

  return { walls: cleaned, openings: raw.openings || [], source: raw.source || 'local-cv', imageWidth: W, imageHeight: H };
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const w of arr) {
    const k = keyFn(w);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(w);
  }
  return m;
}

function pickLong(groups, dim, frac) {
  const out = [];
  for (const [, items] of groups) {
    // longest span among items at this coordinate
    let best = 0;
    for (const it of items) best = Math.max(best, Math.abs(it.y2 - it.y1));
    if (best >= frac * dim) {
      // representative coordinate = median x of items
      const xs = items.map(i => i.x1).sort((a, b) => a - b);
      out.push(xs[Math.floor(xs.length / 2)]);
    }
  }
  return out;
}

export default { runCvWallDetect, sanitize };
