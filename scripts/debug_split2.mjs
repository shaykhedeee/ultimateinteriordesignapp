import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const plan = require(path.join(process.cwd(), 'output/c009_plan.json'));

function segIntersect(p, p2, q, q2) {
  const r = { x: p2.x - p.x, y: p2.y - p.y };
  const s = { x: q2.x - q.x, y: q2.y - q.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / denom;
  const u = ((q.x - p.x) * r.y - (q.y - p.y) * r.x) / denom;
  if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) return null;
  return { x: p.x + t * r.x, y: p.y + t * r.y, t };
}
const SNAP = 20, sn = v => Math.round(v / SNAP) * SNAP;
const W = plan.walls.map(w => ({ a: { x: sn(w.x1), y: sn(w.y1) }, b: { x: sn(w.x2), y: sn(w.y2) } }));
let totalCuts = 0;
for (let i = 0; i < W.length; i++) {
  const a = W[i].a, b = W[i].b;
  const cuts = [0, 1];
  for (let j = 0; j < W.length; j++) {
    if (j === i) continue;
    const c = W[j].a, d = W[j].b;
    const p = segIntersect(a, b, c, d);
    if (p && p.t > 1e-6 && p.t < 1 - 1e-6) { cuts.push(p.t); totalCuts++; }
  }
  if (cuts.length > 2) console.log(`wall ${i} (${a.x},${a.y})-(${b.x},${b.y}) -> ${cuts.length - 2} cut(s) at t=${cuts.slice(2).map(t=>t.toFixed(3))}`);
}
console.log('total interior cuts found:', totalCuts);
