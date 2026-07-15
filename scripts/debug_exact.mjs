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
const EPS = 12;
const key = (x, y) => `${Math.round(x / EPS) * EPS},${Math.round(y / EPS) * EPS}`;
const segs = plan.walls.map((w,i)=>({x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2,id:'w'+i}));
const segs2 = [];
for (let i = 0; i < segs.length; i++) {
  const a = { x: segs[i].x1, y: segs[i].y1 };
  const b = { x: segs[i].x2, y: segs[i].y2 };
  const cuts = [0, 1];
  for (let j = 0; j < segs.length; j++) {
    if (j === i) continue;
    const c = { x: segs[j].x1, y: segs[j].y1 };
    const d = { x: segs[j].x2, y: segs[j].y2 };
    const p = segIntersect(a, b, c, d);
    if (p && p.t > 1e-6 && p.t < 1 - 1e-6) cuts.push(p.t);
  }
  cuts.sort((x,y)=>x-y);
  let prev = a;
  for (let k = 1; k < cuts.length; k++) {
    const t = cuts[k];
    const cur = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (Math.hypot(cur.x - prev.x, cur.y - prev.y) > 1) segs2.push({ x1: prev.x, y1: prev.y, x2: cur.x, y2: cur.y });
    prev = cur;
  }
}
const nodes = new Map();
const nodeId = (x,y)=>{const k=key(x,y); if(!nodes.has(k)) nodes.set(k,{x,y,out:[]}); return nodes.get(k);};
const half = [];
for (const s of segs2) {
  const A = nodeId(s.x1,s.y1), B = nodeId(s.x2,s.y2);
  A.out.push({from:A,to:B,used:false}); B.out.push({from:B,to:A,used:false});
}
console.log('segs2:', segs2.length, '| nodes:', nodes.size, '| deg>1:', [...nodes.values()].filter(n=>n.out.length>1).length);
console.log('deg dist:', [...nodes.values()].map(n=>n.out.length).sort().join(','));
