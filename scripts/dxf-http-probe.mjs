import http from 'node:http';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const load = (p) => import(pathToFileURL(path.join(process.cwd(), p)).href);
const { validateDxf } = await load('server/services/dxf-validate.js');
function req(m, p, body) {
  return new Promise((res, rej) => {
    const d = body ? JSON.stringify(body) : null;
    const r = http.request('http://127.0.0.1:8787' + p, { method: m, headers: d ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } : {} }, x => {
      let c = []; x.on('data', y => c.push(y)); x.on('end', () => res({ s: x.statusCode, ct: x.headers['content-type'], body: Buffer.concat(c).toString() }));
    });
    r.on('error', rej); if (d) r.write(d); r.end();
  });
}
const fp = await req('GET', '/api/projects/dxftest1/drawings/floorplan/dxf');
const fv = validateDxf(fp.body);
console.log('FLOORPLAN DXF ->', fp.s, '| ct:', fp.ct, '| valid:', fv.valid, '| errors:', fv.errors.length, '| entities:', JSON.stringify(fv.stats.entityCounts));
const ev = await req('POST', '/api/projects/dxftest1/elevations/from-renders', { units: ['wardrobe', 'kitchen'] });
const ej = JSON.parse(ev.body);
console.log('ELEVATIONS ->', ev.s, '| count:', ej.count);
let allElevValid = true;
for (const f of ej.files || []) {
  const dxfPath = path.join(process.cwd(), 'storage', 'elevations', f.dxf.split('/').pop());
  if (fs.existsSync(dxfPath)) {
    const v = validateDxf(fs.readFileSync(dxfPath, 'utf8'));
    if (!v.valid) allElevValid = false;
    console.log(`  ${f.unit}: valid=${v.valid} errors=${v.errors.length}`);
  }
}
const allOk = fp.s === 200 && fv.valid && ev.s === 200 && ej.count >= 1 && allElevValid;
console.log(allOk ? '\n=== DXF ENDPOINTS FULLY WORKING ===' : '\n=== DXF CHECK FAILED ===');
process.exit(allOk ? 0 : 1);
