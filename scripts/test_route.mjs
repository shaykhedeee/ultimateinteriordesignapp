import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const db = require('better-sqlite3')(path.join(process.cwd(), 'storage/ultimate_interior.db'));
global.__ULTIDA_DB__ = db;
const core = await import('../server/services/plan-intelligence-core.js');
const m = core.default || core;
// reproduce exactly what the route does:
const interp = m.interpretFloorPlan('proj_1', null);
console.log('route-style interpret -> success:', interp.success, '| rooms:', (interp.interpretation?.rooms||[]).length, '| error:', interp.error);
// also what _loadTraced returns:
const cad = db.prepare('SELECT walls_json, openings_json, pixels_per_meter FROM cad_drawings WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get('proj_1');
console.log('loaded walls:', JSON.parse(cad.walls_json||'[]').length, '| ppm:', cad.pixels_per_meter);
