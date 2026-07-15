import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { buildPremiumFloorPlanDXF } from '../server/services/premium-dxf.js';

mkdirSync('output', { recursive: true });
const plan = JSON.parse(readFileSync('output/c009_plan.json', 'utf-8'));
const dxf = buildPremiumFloorPlanDXF(plan, { projectName: 'RECONSTRUCTED FLOOR PLAN C009' });
writeFileSync('output/ground-floor-plan-reconstructed.dxf', dxf, 'utf-8');
console.log('Premium R12 DXF written: output/ground-floor-plan-reconstructed.dxf  bytes=', dxf.length);
