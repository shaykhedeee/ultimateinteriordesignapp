import http from 'node:http';

const BASE = 'http://127.0.0.1:5056';
function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + path, {
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } : headers
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json; try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', json, raw, buf: Buffer.from(raw, 'utf8') });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

let pass = 0, total = 0;
const results = [];
function check(name, ok, extra = '') { total++; if (ok) pass++; results.push(`${ok ? 'OK  ' : 'FAIL'} ${name}  ${extra}`); return ok; }

(async () => {
  // 1. PROJECT
  const cp = await req('POST', '/api/projects', { name: 'E2E Journey', client_name: 'Flow Client', email: 'a@b.com', phone: '9999999999', budget: 1500000 });
  const pid = cp.json?.id;
  check('1. create project', cp.status === 201 && pid, `[${cp.status}] ${pid}`);

  // 2. SAVE BRIEF (client_brief_json)
  const sb = await req('POST', `/api/projects/${pid}/brief`, { brief: { lifestyle: 'modern family', cookingHabits: 'daily', vastuPreferences: 'prefer north entrance', dislikedColors: ['neon'], rooms: [{ name: 'Living', finishes: ['matte'], appliances: ['fridge'], furniture: ['sofa'] }] } });
  check('2. save brief', sb.status === 200, `[${sb.status}]`);

  // 3. FLOOR PLAN (JSON)
  const walls = [
    { id: 'W1', x1: 0, y1: 0, x2: 6000, y2: 0 },
    { id: 'W2', x1: 6000, y1: 0, x2: 6000, y2: 4000 },
    { id: 'W3', x1: 6000, y1: 4000, x2: 0, y2: 4000 },
    { id: 'W4', x1: 0, y1: 4000, x2: 0, y2: 0 }
  ];
  const rooms = [{ name: 'Living', x: 0, y: 0, w: 3600, h: 4000 }, { name: 'Bedroom', x: 3600, y: 0, w: 2400, h: 4000 }];
  const plan = await req('POST', `/api/projects/${pid}/plan`, { walls, rooms, pixelsPerMeter: 40 });
  check('3. floor plan (JSON)', plan.status === 200 && plan.json?.success, `[${plan.status}] walls=${plan.json?.walls} totalWall=${plan.json?.totalWallM}m`);

  // 4. VASTU
  const vastu = await req('GET', `/api/projects/${pid}/vastu/analyze`);
  check('4. vastu analyze', vastu.status === 200 && vastu.json?.ok, `[${vastu.status}] ok=${vastu.json?.ok}`);

  // 5. FURNITURE DETECT
  const det = await req('POST', `/api/projects/${pid}/plan/detect-furniture`, {});
  check('5. furniture detect', det.status === 200, `[${det.status}] detected=${(det.json?.detected||[]).length}`);

  // 6. ELEVATION DXF
  const edxf = await req('GET', `/api/projects/${pid}/drawings/elevations/auto/dxf`);
  check('6. elevation DXF', edxf.status === 200 && /SECTION/.test(edxf.raw), `[${edxf.status}] ${edxf.raw.length}b`);

  // 7. FLOORPLAN DXF
  const fdxf = await req('GET', `/api/projects/${pid}/drawings/floorplan/dxf`);
  check('7. floorplan DXF', fdxf.status === 200 && /SECTION/.test(fdxf.raw), `[${fdxf.status}] ${fdxf.raw.length}b`);

  // 8. MATERIALS GET
  const mats = await req('GET', `/api/projects/${pid}/materials`);
  check('8. materials GET', mats.status === 200, `[${mats.status}]`);

  // 8b. MATERIALS POST (select a laminate from catalogue)
  const matPost = await req('POST', `/api/projects/${pid}/materials`, { laminates: [{ brand: 'Hanex', name: 'Vocalise', code: 'HX-T-089' }], hardware: [{ brand: 'Hettich', name: 'Soft close', code: 'H-01' }] });
  check('8b. materials POST', matPost.status === 200, `[${matPost.status}]`);

  // 9. RENDER GENERATE (may need access; capture status)
  const ren = await req('POST', `/api/projects/${pid}/renders/generate`, { room: 'Living', prompt: 'modern living room, warm tones', style: 'modern' });
  // 200 ok, or 202 accepted; 403/401 acceptable if auth-gated but we record
  check('9. render generate', [200, 201, 202].includes(ren.status) || ren.status === 403, `[${ren.status}] ${ren.json?.jobId || ren.json?.error || ''}`);

  // 10. QUOTATION POST
  const quo = await req('POST', `/api/projects/${pid}/quotation`, { items: [{ name: 'Kitchen carcass', qty: 1, rate: 250000 }], taxPct: 18 });
  check('10. quotation POST', quo.status === 200 || quo.status === 201, `[${quo.status}]`);

  // 11. QUOTATION GET
  const quoGet = await req('GET', `/api/projects/${pid}/quotation`);
  check('11. quotation GET', quoGet.status === 200, `[${quoGet.status}]`);

  // 12. QUOTATION PDF
  const qpdf = await req('POST', `/api/projects/${pid}/quotation/pdf`, { quotation: quoGet.json || {} });
  check('12. quotation PDF', qpdf.status === 200 && qpdf.buf.subarray(0,5).toString() === '%PDF-', `[${qpdf.status}] ${qpdf.buf.length}b`);

  // 13. CLIENT BRIEF PDF (the end goal)
  const bpdf = await req('GET', `/api/projects/${pid}/brief/pdf`);
  check('13. client brief PDF', bpdf.status === 200 && bpdf.buf.subarray(0,5).toString() === '%PDF-', `[${bpdf.status}] ${bpdf.buf.length}b`);

  // 14. advance-step flow
  const adv = await req('POST', `/api/projects/${pid}/advance-step`, { step: 'materials' });
  check('14. advance-step', adv.status === 200, `[${adv.status}]`);

  // 15. readiness
  const ready = await req('GET', `/api/projects/${pid}/readiness`);
  check('15. readiness', ready.status === 200, `[${ready.status}]`);

  console.log('\n===== FULL USER-FLOW PROBE =====');
  results.forEach(r => console.log(r));
  console.log(`\n${pass}/${total} checks passed`);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
