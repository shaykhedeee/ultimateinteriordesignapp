import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const plan = require(path.join(process.cwd(), 'output/c009_plan.json'));
// replicate detectRooms locally to debug
const TOL = 6;
const key = (x, y) => `${Math.round(x / TOL) * TOL},${Math.round(y / TOL) * TOL}`;
const nodes = new Map();
const nodeId = (x, y) => { const k = key(x, y); if (!nodes.has(k)) nodes.set(k, { x, y, id: 'n' + nodes.size, out: [] }); return nodes.get(k); };
const half = [];
for (const s of plan.walls) {
  const a = nodeId(s.x1, s.y1), b = nodeId(s.x2, s.y2);
  const h1 = { from: a, to: b, used: false, rev: false };
  const h2 = { from: b, to: a, used: false, rev: true };
  a.out.push(h1); b.out.push(h2); half.push(h1, h2);
}
for (const n of nodes.values()) n.out.sort((p, q) => Math.atan2(p.to.y - n.y, p.to.x - n.x) - Math.atan2(q.to.y - n.y, q.to.x - n.x));
console.log('nodes:', nodes.size, '| half-edges:', half.length);
const faces = [];
let faceCount = 0;
for (const h of half) {
  if (h.used) continue;
  const face = []; let cur = h; let guard = 0;
  do {
    cur.used = true; face.push(cur.from);
    const node = cur.to;
    const idx = node.out.indexOf(cur.rev ? node.out.find(e => e.to === cur.from) : cur);
    const nextIdx = (idx + 1) % node.out.length;
    cur = node.out[nextIdx];
    if (++guard > 10000) break;
  } while (cur !== h && !cur.used);
  if (face.length >= 3) {
    let area = 0;
    for (let i = 0; i < face.length; i++) { const p = face[i], q = face[(i + 1) % face.length]; area += p.x * q.y - q.x * p.y; }
    area = Math.abs(area) / 2;
    if (area > 0) faces.push({ n: face.length, area: Math.round(area) });
  }
}
faces.sort((a,b)=>b.area-a.area);
console.log('raw faces found:', faces.length);
console.log(faces.slice(0,12).map(f=>`${f.n}pts/area${f.area}`).join('  '));
console.log('degree distribution:', [...nodes.values()].map(n=>n.out.length).sort().join(','));
