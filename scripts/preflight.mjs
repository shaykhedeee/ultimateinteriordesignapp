import http from 'http';

const PORT = process.env.PORT || 8787;
const BASE = `http://127.0.0.1:${PORT}`;

function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get(BASE + pathname, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, json: null }); }
      });
    }).on('error', reject);
  });
}

(async () => {
  let ok = true;
  try {
    const r = await get('/api/system/preflight');
    if (r.status !== 200 || !r.json) { console.log('PREFLIGHT: cannot reach API'); process.exit(1); }
    const { ready, checks } = r.json;
    console.log('\n=== ULTIDA Preflight ===');
    for (const c of checks) {
      console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  (' + c.detail + ')' : ''}`);
    }
    console.log(ready ? '\nREADY — safe to demo.\n' : '\nNOT READY — fix the FAIL items above.\n');
    ok = ready;
  } catch (e) {
    console.log('PREFLIGHT: API not running on', BASE, '— start the server first (npm start).');
    ok = false;
  }
  process.exit(ok ? 0 : 1);
})();
