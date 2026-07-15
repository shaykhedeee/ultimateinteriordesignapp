import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ code: res.statusCode, body: Buffer.concat(chunks), ctype: res.headers['content-type'] || '' }));
    }).on('error', reject);
  });
}

let buf = '';
child.stdout.on('data', d => { buf += d.toString(); });
child.stderr.on('data', d => { buf += d.toString(); });

(async () => {
  // wait for boot + seed
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (buf.includes('running at')) break;
  }
  const seedLine = buf.match(/\[seed\] loaded (\d+) laminates/);
  console.log('SEED:', seedLine ? seedLine[1] + ' laminates' : 'NOT-SEEDED (table may already be populated)');

  const cat = await get('/api/material-catalog');
  const catJson = JSON.parse(cat.body.toString());
  const byBrand = catJson.reduce((a, x) => (a[x.brand] = (a[x.brand]||0)+1, a), {});
  console.log(`MATERIAL-CATALOG: ${cat.code} ${catJson.length} items`, byBrand);

  const broch = await get('/api/catalogue/brochures');
  const brochJson = JSON.parse(broch.body.toString());
  console.log(`BROCHURES: ${broch.code} ${brochJson.length} catalogues; first cover=${brochJson[0]?.cover}`);

  const lib = await get('/api/design-library');
  const libJson = JSON.parse(lib.body.toString());
  const total = libJson.reduce((a, g) => a + g.count, 0);
  console.log(`DESIGN-LIBRARY: ${lib.code} ${libJson.length} groups, ${total} images; first=${libJson[0]?.category}`);

  // static assets
  const cover = await get('/catalogues/grande.png');
  console.log(`STATIC cover /catalogues/grande.png: ${cover.code} ${cover.ctype}`);
  const img = await get('/reference-library/bedrooms/bedroom-01.jpg');
  console.log(`STATIC img /reference-library/bedrooms/bedroom-01.jpg: ${img.code} ${img.ctype}`);
  const pdf = await get('/storage/reference-library/laminates/Hanex.pdf');
  console.log(`STATIC pdf /storage/reference-library/laminates/Hanex.pdf: ${pdf.code} ${pdf.ctype}`);

  child.kill('SIGTERM');
  process.exit(0);
})().catch(e => { console.error('ERR', e); child.kill('SIGTERM'); process.exit(1); });
