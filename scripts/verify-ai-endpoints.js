import http from 'http';
const base = 'http://127.0.0.1:5055';

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
    { path: '/api/diagnostics/api-keys', method: 'GET', body: {} }
  ];
  for (const check of checks) {
    try {
      const result = await call(check.path, check.method, check.body);
      console.log(`${check.method} ${check.path} | ${result.status} | ${JSON.stringify(result.data).slice(0, 240)}`);
    } catch (e) {
      console.log(`${check.method} ${check.path} | ERR | ${e.message}`);
    }
  }
}

run();
