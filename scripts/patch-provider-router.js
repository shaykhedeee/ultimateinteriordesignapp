const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'server/services/provider-router.js');
let content = fs.readFileSync(target, 'utf8');
const old = `import {
  buildEnhancementPlan,
  ENHANCEMENT_MODES
} from './enhancement-planner.js';`;
const rep = `import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';`;
if (!content.includes(rep)) {
  content = content.replace(old, rep);
  fs.writeFileSync(target, content, 'utf8');
  console.log('patched provider-router imports');
} else {
  console.log('provider-router imports already clean');
}
console.log('auth lines in provider-router:', (content.match(/Authorization/g) || []).length);
