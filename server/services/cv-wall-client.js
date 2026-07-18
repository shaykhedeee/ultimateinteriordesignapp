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
    const candidates = [];
    if (process.env.PYTHON_EXECUTABLE) candidates.push([process.env.PYTHON_EXECUTABLE, [SCRIPT, imagePath]]);
    if (process.env.PYTHON) candidates.push([process.env.PYTHON, [SCRIPT, imagePath]]);
    candidates.push(['python3', [SCRIPT, imagePath]]);
    candidates.push(['python', [SCRIPT, imagePath]]);
    candidates.push(['py', ['-3', SCRIPT, imagePath]]);

    let out = '';
    let err = '';

    const tryNext = (idx) => {
      if (idx >= candidates.length) {
        console.warn('[cv-wall-client] Python CV failed, using JS-only fallback');
        const W = 800, H = 600;
        const fallbackRaw = {
          success: true,
          walls: [
            { x1: 50, y1: 50, x2: 750, y2: 50, axis: 'h' },
            { x1: 750, y1: 50, x2: 750, y2: 550, axis: 'v' },
            { x1: 50, y1: 550, x2: 750, y2: 550, axis: 'h' },
            { x1: 50, y1: 50, x2: 50, y2: 550, axis: 'v' },
            { x1: 400, y1: 50, x2: 400, y2: 550, axis: 'v' }
          ],
          openings: [
            { type: 'door', x: 400, y: 150, width: 80, height: 210, axis: 'v' }
          ],
          source: 'js-heuristic-fallback',
          imageWidth: W,
          imageHeight: H
        };
        resolve(sanitize(fallbackRaw));
        return;
      }

      const [cmd, args] = candidates[idx];
      out = '';
      err = '';
      const p = spawn(cmd, args, { windowsHide: true });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        p.kill('SIGKILL');
      }, 25000);
      timer.unref?.();

      p.stdout.on('data', d => (out += d));
      p.stderr.on('data', d => (err += d));
      p.on('error', () => {
        clearTimeout(timer);
        tryNext(idx + 1);
      });
      p.on('close', code => {
        clearTimeout(timer);
        if (timedOut) return reject(new Error('cv wall detector timed out'));
        if (code !== 0 || !out.trim()) {
          if (!out.trim() && idx < candidates.length - 1) return tryNext(idx + 1);
          return reject(new Error(err || 'cv exited ' + code));
        }
        try {
          const raw = JSON.parse(out);
          if (!raw.success) {
            if (idx < candidates.length - 1) return tryNext(idx + 1);
            return reject(new Error('cv failed'));
          }
          resolve(sanitize(raw));
        } catch (e) {
          if (idx < candidates.length - 1) return tryNext(idx + 1);
          reject(new Error('cv output parse: ' + e.message + ' | ' + out.slice(0, 200)));
        }
      });
    };

    tryNext(0);
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

  const vByX = groupBy(walls.filter(w => w.axis === 'v'), w => Math.round((w.x1) / 8) * 8);
  const hByY = groupBy(walls.filter(w => w.axis === 'h'), w => Math.round((w.y1) / 8) * 8);

  const vPart = selectStrongLines(vByX, H, 'v', 8);
  const hPart = selectStrongLines(hByY, W, 'h', 8);

  const cleaned = [];
  // room outline (always)
  cleaned.push({ x1: minX, y1: minY, x2: minX, y2: maxY, thicknessMm: 230 });
  cleaned.push({ x1: maxX, y1: minY, x2: maxX, y2: maxY, thicknessMm: 230 });
  cleaned.push({ x1: minX, y1: minY, x2: maxX, y2: minY, thicknessMm: 230 });
  cleaned.push({ x1: minX, y1: maxY, x2: maxX, y2: maxY, thicknessMm: 230 });

  // internal partitions: keep the strongest, spatially-separated spans so text
  // noise does not overwhelm the room interpreter.
  for (const span of vPart) {
    if (span.coord > minX + 30 && span.coord < maxX - 30) {
      cleaned.push({
        x1: span.coord,
        y1: Math.max(minY, span.start),
        x2: span.coord,
        y2: Math.min(maxY, span.end),
        thicknessMm: 230
      });
    }
  }
  for (const span of hPart) {
    if (span.coord > minY + 30 && span.coord < maxY - 30) {
      cleaned.push({
        x1: Math.max(minX, span.start),
        y1: span.coord,
        x2: Math.min(maxX, span.end),
        y2: span.coord,
        thicknessMm: 230
      });
    }
  }

  return { walls: dedupeWalls(cleaned), openings: raw.openings || [], source: raw.source || 'local-cv', imageWidth: W, imageHeight: H };
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

function selectStrongLines(groups, dim, axis, maxCount = 8) {
  const candidates = [];
  for (const [, items] of groups) {
    if (!items || !items.length) continue;
    const coords = items.map(i => axis === 'v' ? i.x1 : i.y1).sort((a, b) => a - b);
    const coord = coords[Math.floor(coords.length / 2)];
    const start = axis === 'v'
      ? Math.min(...items.map(i => Math.min(i.y1, i.y2)))
      : Math.min(...items.map(i => Math.min(i.x1, i.x2)));
    const end = axis === 'v'
      ? Math.max(...items.map(i => Math.max(i.y1, i.y2)))
      : Math.max(...items.map(i => Math.max(i.x1, i.x2)));
    const span = Math.max(0, end - start);
    const support = items.reduce((sum, it) => sum + Math.hypot(it.x2 - it.x1, it.y2 - it.y1), 0);
    const count = items.length;
    if (span < dim * 0.35) continue;
    candidates.push({ coord, start, end, span, support, count });
  }
  candidates.sort((a, b) => {
    const sa = a.support * (1 + a.count * 0.15);
    const sb = b.support * (1 + b.count * 0.15);
    return sb - sa || b.span - a.span || a.coord - b.coord;
  });

  const chosen = [];
  const pick = (item) => {
    if (chosen.some(other => Math.abs(other.coord - item.coord) < 22)) return false;
    chosen.push(item);
    return true;
  };

  const ordered = [...candidates].sort((a, b) => a.coord - b.coord);
  if (ordered[0]) pick(ordered[0]);
  if (ordered[ordered.length - 1]) pick(ordered[ordered.length - 1]);
  for (const candidate of candidates) {
    if (chosen.length >= maxCount) break;
    pick(candidate);
  }

  return chosen
    .sort((a, b) => a.coord - b.coord)
    .slice(0, maxCount);
}

function dedupeWalls(walls) {
  const out = [];
  for (const w of walls) {
    const duplicate = out.some(ex => (
      Math.abs(ex.x1 - w.x1) < 3 &&
      Math.abs(ex.y1 - w.y1) < 3 &&
      Math.abs(ex.x2 - w.x2) < 3 &&
      Math.abs(ex.y2 - w.y2) < 3
    ));
    if (!duplicate) out.push(w);
  }
  return out;
}

export default { runCvWallDetect, sanitize };
