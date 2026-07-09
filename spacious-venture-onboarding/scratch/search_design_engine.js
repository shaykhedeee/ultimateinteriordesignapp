import fs from 'fs';
const content = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/server/services/design-engine.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('upsertFloorPlan') || line.includes('function upsertFloorPlan')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
