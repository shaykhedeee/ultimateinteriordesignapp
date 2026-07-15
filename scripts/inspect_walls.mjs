import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const db = require('better-sqlite3')(path.join(process.cwd(), 'storage/ultimate_interior.db'));
const cad = db.prepare('SELECT walls_json, openings_json FROM cad_drawings WHERE project_id = ?').get('proj_1');
const walls = JSON.parse(cad.walls_json || '[]');
console.log('wall count:', walls.length);
// print unique x and y of endpoints to see grid
const xs = new Set(), ys = new Set();
for (const w of walls) { xs.add(w.x1); xs.add(w.x2); ys.add(w.y1); ys.add(w.y2); }
console.log('unique X:', [...xs].sort((a,b)=>a-b));
console.log('unique Y:', [...ys].sort((a,b)=>a-b));
// build node connectivity at integer grid
const key=(x,y)=>`${Math.round(x)},${Math.round(y)}`;
const adj=new Map();
for(const w of walls){const a=key(w.x1,w.y1),b=key(w.x2,w.y2); if(!adj.has(a))adj.set(a,[]); if(!adj.has(b))adj.set(b,[]); adj.get(a).push(b); adj.get(b).push(a);}
console.log('nodes:', adj.size, '| degree>1:', [...adj.values()].filter(a=>a.length>1).length);
// check if any node has degree that suggests interior junctions
console.log('sample degrees:', [...adj.entries()].slice(0,12).map(([k,v])=>`${k}:${v.length}`).join('  '));
