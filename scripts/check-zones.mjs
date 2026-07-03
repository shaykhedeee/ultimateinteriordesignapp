import { extractZonesFromManifest } from '../server/services/zone-service.js';
import { buildZoneDesignPlan } from '../server/services/zone-design-planner.js';

const manifest = {
  rooms: [
    { id: 'r1', name: 'Living Room', type: 'living', points: [{x:0,y:0},{x:4000,y:0},{x:4000,y:3000},{x:0,y:3000}], confidence: 0.92 },
    { id: 'r2', name: 'Kitchen', type: 'kitchen', points: [{x:4000,y:0},{x:7000,y:0},{x:7000,y:2500},{x:4000,y:2500}], confidence: 0.88 }
  ],
  walls: [
    { x1:0,y1:0,x2:4000,y2:0 },
    { x1:4000,y1:0,x2:4000,y2:3000 }
  ],
  openings: [
    { id:'o1', roomId:'r1', type:'door', x:2000, y:0, width:900, height:2100 },
    { id:'o2', roomId:'r1', type:'window', x:1000, y:3000, width:1200, height:900 }
  ],
  symbols: [],
  dimensions: []
};

const extracted = extractZonesFromManifest(manifest);
console.log('ZONES=', extracted.zones.length, JSON.stringify(extracted.zones.map(z=>({id:z.id,name:z.name,type:z.type,area_sqft:z.area_sqft})), null, 2));

const plan = buildZoneDesignPlan({ zone: extracted.zones[0], budgetTier: 'premium', styleBrief: 'corner window', organizationPreferences: 'Hettich+Ebco', climateInfo: 'tropical' });
console.log('PLAN_KEYS=', Object.keys(plan).join(','));
console.log('CONSTRAINTS=', JSON.stringify(plan.constraints, null, 2).slice(0, 800));
