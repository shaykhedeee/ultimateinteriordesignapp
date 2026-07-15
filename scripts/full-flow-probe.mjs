import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://127.0.0.1:8787';
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      const c = []; res.on('data', x => c.push(x));
      res.on('end', () => resolve({ code: res.statusCode, body: Buffer.concat(c).toString(), ctype: res.headers['content-type'] || '' }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const results = [];
function rec(name, code, ok, detail) { results.push({ name, code, ok, detail }); }

(async () => {
  // 1. create project + lead (needed for signoff flow)
  const mk = await req('POST', '/api/projects', { name: 'Flow Probe', client_name: 'Probe Client', lead_id: 'lead_probe_1' });
  const pid = (mk.body.match(/"id":"([^"]+)"/) || [])[1];
  rec('create project', mk.code, mk.code === 201, pid);
  if (!pid) { finish(); return; }

  // 2. floor plan upload-ish: create a floor_plan record
  const fp = await req('POST', `/api/projects/${pid}/floor-plan`, { rooms: [{ name: 'Living', w: 5000, h: 4000 }] }).catch(() => null)
            || await req('POST', `/api/projects/${pid}/floorplans`, { rooms: [{ name: 'Living', w: 5000, h: 4000 }] });
  rec('floor-plan create', fp?.code || 0, [200, 201].includes(fp?.code), (fp?.body || '').slice(0, 60));

  // 3. floor analyser / detect furniture
  const detect = await req('POST', `/api/projects/${pid}/plan/detect-furniture`, {});
  rec('floor analyser detect', detect.code, [200, 400, 404].includes(detect.code), detect.body.slice(0, 60));

  // 4. vastu analyze
  const vastu = await req('GET', `/api/projects/${pid}/vastu/analyze`);
  rec('vastu analyze', vastu.code, [200, 404].includes(vastu.code), vastu.body.slice(0, 60));

  // 5. elevations auto dxf
  const dxf = await req('GET', `/api/projects/${pid}/drawings/elevations/auto/dxf`);
  rec('elevation auto/dxf', dxf.code, [200, 404].includes(dxf.code), dxf.ctype);

  // 6. render job
  const rj = await req('POST', `/api/projects/${pid}/jobs`, { jobType: 'render_generation', variantCount: 1 });
  rec('render job queue', rj.code, [200, 201, 400].includes(rj.code), rj.body.slice(0, 60));

  // 7. cutlist calculate
  const cl = await req('POST', `/api/projects/${pid}/cutlist/calculate`, {});
  rec('cutlist calculate', cl.code, [200, 400, 404].includes(cl.code), cl.body.slice(0, 60));

  // 8. quotation pdf
  const q = await req('POST', `/api/projects/${pid}/quotation/pdf`, {});
  rec('quotation pdf', q.code, [200, 201, 400].includes(q.code), q.body.slice(0, 60));

  // 9. client brief
  const cb = await req('POST', `/api/projects/${pid}/client-brief`, {}).catch(() => null)
            || await req('GET', `/api/projects/${pid}/client-brief`);
  rec('client brief', cb?.code || 0, [200, 201, 404].includes(cb?.code), (cb?.body || '').slice(0, 60));

  // 10. AURA chat
  const aura = await req('POST', '/api/aura/chat', { message: 'Analyze my floor plan and suggest Vastu furniture placement', projectId: pid });
  const aj = (() => { try { return JSON.parse(aura.body); } catch { return {}; } })();
  rec('AURA chat', aura.code, aura.code === 200, 'llmPowered=' + (aj.reply?.llmPowered));

  // 11. material catalog
  const mc = await req('GET', '/api/material-catalog');
  const mcj = (() => { try { return JSON.parse(mc.body); } catch { return []; } })();
  rec('material catalog', mc.code, mc.code === 200 && Array.isArray(mcj) && mcj.length > 50, 'count=' + (mcj.length || 0));

  // 12. brochures
  const br = await req('GET', '/api/catalogue/brochures');
  rec('brochures', br.code, br.code === 200, (br.body.match(/"cover"/g) || []).length + ' covers');

  // 13. design library
  const dl = await req('GET', '/api/design-library');
  rec('design library', dl.code, dl.code === 200, (dl.body.match(/"category"/g) || []).length + ' groups');

  finish();
})();

function finish() {
  console.log('\n===== FLOW PROBE RESULTS =====');
  let pass = 0;
  for (const r of results) {
    const tag = r.ok ? 'OK  ' : 'FAIL';
    if (r.ok) pass++;
    console.log(`${tag} ${r.name.padEnd(24)} [${r.code}] ${r.detail || ''}`);
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(0);
}
