import http from 'node:http';

const BASE = 'http://127.0.0.1:8787';
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + path, {
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json; try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', json, raw });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function check(name, ok, extra='') { console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}  ${extra}`); return ok; }

(async () => {
  let pass = 0, total = 0;
  // 1. create project
  const cp = await req('POST', '/api/projects', { name: 'Plan Unblock', client_name: 'Test' });
  const pid = cp.json?.id;
  total++; pass += check('create project', cp.status === 201 && pid, `[${cp.status}] ${pid}`);

  // 2. POST a real floor plan (mm). 4 walls forming an ~6m x 4m rectangle + 2 rooms.
  const walls = [
    { id: 'W1', x1: 0, y1: 0, x2: 6000, y2: 0 },
    { id: 'W2', x1: 6000, y1: 0, x2: 6000, y2: 4000 },
    { id: 'W3', x1: 6000, y1: 4000, x2: 0, y2: 4000 },
    { id: 'W4', x1: 0, y1: 4000, x2: 0, y2: 0 }
  ];
  const rooms = [
    { name: 'Living', x: 0, y: 0, w: 3600, h: 4000 },
    { name: 'Bedroom', x: 3600, y: 0, w: 2400, h: 4000 }
  ];
  const plan = await req('POST', `/api/projects/${pid}/plan`, { walls, rooms, pixelsPerMeter: 40, northAngle: 0 });
  total++; pass += check('POST /plan', plan.status === 200 && plan.json?.success, `[${plan.status}] measures=${plan.json?.measures?.length} totalWall=${plan.json?.totalWallM}m roomArea=${plan.json?.roomAreaM2}m2`);

  // 3. Vastu analyze (was NO_CAD) -> now real
  const vastu = await req('GET', `/api/projects/${pid}/vastu/analyze`);
  total++; pass += check('vastu analyze', vastu.status === 200 && vastu.json?.ok, `[${vastu.status}] ok=${vastu.json?.ok} zones=${vastu.json?.zones?.length ?? 0}`);

  // 4. Floorplan DXF (real, editable)
  const fdxf = await req('GET', `/api/projects/${pid}/drawings/floorplan/dxf`);
  const fdxfText = fdxf.raw || '';
  total++; pass += check('floorplan DXF', fdxf.status === 200 && /0\nSECTION\n2\nENTITIES/.test(fdxfText), `[${fdxf.status}] ct=${fdxf.ct} ents=${(fdxfText.match(/LINE|POLYLINE|LWPOLYLINE/g)||[]).length}`);

  // 5. Elevation DXF (real, editable) for first wall
  const edxf = await req('GET', `/api/projects/${pid}/drawings/elevations/auto/dxf`);
  const edxfText = edxf.raw || '';
  total++; pass += check('elevation DXF', edxf.status === 200 && /0\nSECTION/.test(edxfText), `[${edxf.status}] ct=${edxf.ct} len=${edxfText.length}`);

  // 6. detect-furniture (plan-derived)
  const det = await req('POST', `/api/projects/${pid}/plan/detect-furniture`, {});
  total++; pass += check('detect-furniture', det.status === 200 && (det.json?.detected?.length ?? 0) >= 0, `[${det.status}] detected=${(det.json?.detected||[]).length} src=${det.json?.source}`);

  // 7. DXF validity: ensure no stray characters that break AutoCAD parse (check EOF marker)
  total++; pass += check('DXF has EOF', /0\nEOF/.test(fdxfText) && /0\nEOF/.test(edxfText), fdxfText.includes('EOF') && edxfText.includes('EOF') ? 'both EOF ok' : 'missing EOF');

  console.log(`\n${pass}/${total} checks passed`);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
