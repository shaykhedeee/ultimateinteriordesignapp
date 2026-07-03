const API_BASE = 'http://127.0.0.1:5055/api';
const checks = [
  { name: 'health', url: `${API_BASE}/health` },
  { name: 'tools', url: `${API_BASE}/tools` },
  { name: 'supported-tasks', url: `${API_BASE}/providers/supported-tasks` },
  { name: 'settings/providers', url: `${API_BASE}/settings/providers` },
  { name: 'latest render helper', url: `${API_BASE}/projects/1/renders?latest=1` }
];

(async () => {
  for (const c of checks) {
    try {
      const res = await fetch(c.url);
      const json = await res.json();
      console.log(`[OK] ${c.name}:`, JSON.stringify(json).slice(0, 200));
    } catch (err) {
      console.log(`[FAIL] ${c.name}:`, err.message);
    }
  }
})();
