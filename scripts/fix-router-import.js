import fs from 'fs';
const target = 'server/services/provider-router.js';
const content = fs.readFileSync(target, 'utf8');
const fixed = content.replace(
  "import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';\nimport { generateInteriorAsset } from './image-provider.js';",
  "import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';\nimport { generateInteriorAsset } from './image-provider.js';"
);
// Force clean bytes for the corrupted import block by rewriting whole file.
const desired = `import {
  buildEnhancementPlan,
  ENHANCEMENT_MODES
} from './enhancement-planner.js';\nimport { generateInteriorAsset } from './image-provider.js';\n` + content.split("import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';\nimport { generateInteriorAsset } from './image-provider.js';")[1];
fs.writeFileSync(target, desired, 'utf8');
console.log('wrote', target);
const out = fs.readFileSync(target, 'utf8');
console.log('has_clean_import=', out.includes("buildEnhancementPlan, ENHANCEMENT_MODES") && out.includes("generateInteriorAsset"));
