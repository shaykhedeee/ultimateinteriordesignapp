import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function request(opts, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function smoke() {
  const base = { hostname: '127.0.0.1', port: 5055 };

  // Create/get project
  const projectRes = await request({ ...base, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { name: 'Kitchen Sketch Test', clientName: 'QA', stage: 'intake' });
  console.log('/api/projects POST', projectRes.status, JSON.stringify(projectRes.data).slice(0, 200));
  const projectId = projectRes.data?.id || 'demo_proj_1';

  // CAD save
  const cadRes = await request({ ...base, path: `/api/projects/${projectId}/cad`, method: 'POST', headers: { 'Content-Type': 'application/json' } }, {
    walls: [{ x: 0, y: 0, w: 3000, h: 150 }],
    openings: [],
    furniture: [{ type: 'kitchen_elevation_a', x: 0, y: 0, w: 1800, h: 700 }],
    rooms: [{ name: 'Kitchen', x: 0, y: 0, w: 3000, h: 1500 }],
    measures: [{ label: 'Sketch module widths', value: '900+700+250 / 400+400+450+450+500+250', unit: 'mm' }],
    pixelsPerMeter: 100
  });
  console.log('/api/projects/:id/cad POST', cadRes.status, JSON.stringify(cadRes.data).slice(0, 200));

  // Cutlist/DXF export
  const dxfRes = await request({ ...base, path: `/api/projects/${projectId}/cutlist/dxf`, method: 'GET' });
  console.log('/api/projects/:id/cutlist/dxf GET', dxfRes.status, typeof dxfRes.data === 'string' ? `${dxfRes.data.length} chars` : JSON.stringify(dxfRes.data).slice(0, 200));

  // AI loop + memory
  const loopRes = await request({ ...base, path: '/api/ai/loop/start', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { sessionId: 'sketch-test-1', projectId, goal: 'Sketch-to-2D verification', successCriteria: ['cutlist'] });
  console.log('/api/ai/loop/start POST', loopRes.status, JSON.stringify(loopRes.data).slice(0, 220));

  const memRes = await request({ ...base, path: `/api/projects/${projectId}/memory/render`, method: 'POST', headers: { 'Content-Type': 'application/json' } }, { provider: 'verifier', source: 'sketch-test' });
  console.log('/api/projects/:id/memory/render POST', memRes.status, JSON.stringify(memRes.data).slice(0, 220));
}

smoke().catch((err) => console.error('smoke ERR', err));
