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
const segs2 = [];
for (let i = 0; i < plan.walls.length; i++) {
  const a = { x: sn(plan.walls[i].x1), y: sn(plan.walls[i].y1) };
  const b = { x: sn(plan.walls[i].x2), y: sn(plan.walls[i].y2) };
  const cuts = [0, 1];
  for (let j = 0; j < plan.walls.length; j++) {
    if (j === i) continue;
    const c = { x: sn(plan.walls[j].x1), y: sn(plan.walls[j].y1) };
    const d = { x: sn(plan.walls[j].x2), y: sn(plan.walls[j].y2) };
    const p = segIntersect(a, b, c, d);
    if (p && p.t > 1e-6 && p.t < 1 - 1e-6) cuts.push(p.t);
  }
  cuts.sort((x, y) => x - y);
  let prev = a;
  for (let k = 1; k < cuts.length; k++) {
    const t = cuts[k];
    const cur = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (Math.hypot(cur.x - prev.x, cur.y - prev.y) > 1) segs2.push({ x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y });
    prev = cur;
  }
}
const key = (x, y) => `${Math.round(x)},${Math.round(y)}`;
const nodes = new Map();
const nodeId = (x, y) => { const k = key(x, y); if (!nodes.has(k)) nodes.set(k, { x, y, out: [] }); return nodes.get(k); };
const half = [];
for (const s of segs2) {
  const a = nodeId(s.x1, s.y1), b = nodeId(s.x2, s.y2);
  a.out.push({ from: a, to: b, used: false });
  b.out.push({ from: b, to: a, used: false });
}
console.log('after split: segs', segs2.length, '| nodes', nodes.size, '| deg>1', [...nodes.values()].filter(n => n.out.length > 1).length);
console.log('deg dist:', [...nodes.values()].map(n => n.out.length).sort().join(','));
