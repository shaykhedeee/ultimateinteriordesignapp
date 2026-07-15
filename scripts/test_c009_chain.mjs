import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const plan = require(path.join(process.cwd(), 'output/c009_plan.json'));
const core = await import('../server/services/plan-intelligence-core.js');
const m = core.default || core;
// build traced walls from C009 plan (axis-aligned segs)
const traced = { walls: plan.walls.map((w,i)=>({x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2,thicknessMm:plan.wallThickness||150,id:'w'+i})),
  openings: (plan.doors||[]).map((d,i)=>({x:d.hx,y:d.hy,widthMm:d.width||900,type:'door',id:'d'+i})),
  ppm: 1.0 }; // 1 plan-unit = 1 mm already
const r = m.interpretFloorPlan('c009-test', null, { traced });
console.log('C009 interpret success:', r.success, '| rooms:', (r.interpretation?.rooms||[]).length, '| walls:', (r.interpretation?.walls||[]).length);
console.log('rooms:');
for (const rm of (r.interpretation?.rooms||[])) console.log('  ', rm.name, Math.round(rm.widthMm||rm.widthMm||0)+'x'+Math.round(rm.heightMm||0), 'centroid', Math.round(rm.cx||0)+','+Math.round(rm.cy||0));
// furniture from plan
const proposal = m.generateAutoLayoutProposal({ levels:[{ rooms:r.interpretation.rooms, walls:r.interpretation.walls, openings:r.interpretation.openings }] }, {});
console.log('FURNITURE items:', (proposal?.levels?.[0]?.furniture||[]).length);
console.log((proposal?.levels?.[0]?.furniture||[]).slice(0,12).map(f=>f.name+'('+Math.round(f.widthMm||0)+'x'+Math.round(f.heightMm||0)+')').join(', '));
