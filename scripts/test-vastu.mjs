import { analyzeVastuPlan } from '../server/services/vastu-auto.js';
const pid = 'proj_nM4uV3eeMM';
const r = analyzeVastuPlan(pid);
console.log('ok:', r.ok, 'reason:', r.reason);
console.log('keys:', Object.keys(r));
console.log('score:', r.score, 'issues:', (r.issues || []).length, 'findings:', (r.findings || []).length);
console.log('sample:', JSON.stringify(r).slice(0, 500));
