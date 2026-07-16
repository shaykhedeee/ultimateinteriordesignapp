import http from 'http';

function call(path, method = 'GET', body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5055, path, method, headers: { 'Content-Type': 'application/json' } }, res => {
      let out = '';
      res.on('data', chunk => { out += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(out); } catch { parsed = out.slice(0, 300); }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (method === 'POST') req.write(data);
    req.end();
  });
}

async function run() {
  const checks = [
    { path: '/api/health', method: 'GET', body: {} },
    { path: '/api/ready', method: 'GET', body: {} },
    { path: '/api/live', method: 'GET', body: {} },
    { path: '/api/providers/status', method: 'GET', body: {} },
    { path: '/api/tools', method: 'GET', body: {} },
    { path: '/api/diagnostics/api-keys', method: 'GET', body: {} },
    { path: '/api/ai/interiors/orchestrate', method: 'POST', body: { projectId: 'demo', userStyle: 'modern', rooms: ['living'], maxRooms: 1 } }
  ];
  let pass = 0;
  let fail = 0;
  for (const check of checks) {
    try {
      const result = await call(check.path, check.method, check.body);
      if (result.status >= 200 && result.status < 500) {
        pass++;
        console.log(`${check.method} ${check.path} | ${result.status} | ${JSON.stringify(result.data).slice(0, 120)}`);
      } else {
        fail++;
        console.log(`${check.method} ${check.path} | ${result.status} | FAIL | ${JSON.stringify(result.data).slice(0, 120)}`);
      }
    } catch (e) {
      fail++;
      console.log(`${check.method} ${check.path} | ERR | ${e.message}`);
    }
  }
  console.log(`\nResults: ${pass} passed, ${fail} failed`);
}

run();
