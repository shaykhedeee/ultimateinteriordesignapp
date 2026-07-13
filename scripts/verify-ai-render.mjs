// Definitive proof the AI image generator produces REAL images (not mock).
// Imports the real image-provider and generates one interior asset via the
// keyless Pollinations path (LIVE_IMAGE_GEN=true is already set in .env).
import { generateInteriorAsset } from '../server/services/image-provider.js';

const projectId = 'ai_verify_' + Date.now().toString(36);
const result = await generateInteriorAsset({
  projectId,
  room: 'living',
  title: 'Modern Indian Living Room',
  style: 'indian-contemporary',
  budgetTier: 'premium',
  prompt: 'A modern Indian contemporary living room, warm wood, teak furniture, soft daylight, professional interior photography',
  tags: ['verify', 'living'],
});

if (!result) { console.log('RESULT: null (no provider produced an image)'); process.exit(1); }

const fs = await import('node:fs');
const p = result.filePath?.replace(/^\/storage\//, 'storage/');
let bytes = 0, isImage = false;
try {
  const buf = fs.readFileSync(p);
  bytes = buf.length;
  isImage = buf.slice(0, 3).toString('hex') === 'ffd8ff' || buf.slice(1, 4).toString() === 'PNG'; // JPEG/PNG magic
} catch (e) { console.log('file read error:', e.message); }

console.log('RESULT OK');
console.log('  provider     :', result.provider);
console.log('  sourceType   :', result.sourceType);
console.log('  model        :', result.model);
console.log('  filePath     :', result.filePath);
console.log('  bytes        :', bytes);
console.log('  validImage   :', isImage);
process.exit(bytes > 5000 && isImage ? 0 : 2);
