const fs = require('fs');
const path = 'frontend/src/components/layout/AuraBrainChat.jsx';
let s = fs.readFileSync(path, 'utf8');
const marker = "  const proactiveSuggestions = [\n";
const idx = s.indexOf(marker);
if (idx < 0) {
  console.log('marker not found');
  process.exit(1);
}
const blockEnd = s.indexOf(';', s.indexOf(']', idx)) + 1;
const replacement = [
  'const deriveSuggestions = () => {',
  '  const last = messages[messages.length - 1];',
  '  const base = [',
  '    "💡 Add a pendant light above dining (+350 Lux, CRI 98)",',
  '    "📊 Optimize kitchen work triangle for faster prep movement",',
  '    "🪴 Add 3 plants for biophilic balance and perceived space +12%"',
  '  ];',
  '  const text = (last?.text || \'\').toLowerCase();',
  '  if (text.includes("wardrobe") || text.includes("storage")) return [...base, "🚪 Upgrade to soft-close wardrobes with mirror + LED pullout"];',
  '  if (text.includes("kitchen") || text.includes("cabinet")) return [...base, "🍳 Choose anti-scratch laminates + Blum InnoTech organizers"];',
  '  if (text.includes("vastu") || text.includes("pooja")) return [...base, "🪔 Relocate mandir to NE corner with East-facing deity"];',
  '  if (text.includes("living") || text.includes("sofa")) return [...base, "🛋️ Upgrade rug to 8x10 and add fluted feature wall"];',
  '  if (text.includes("render") || text.includes("3d") || text.includes("ai")) return [...base, "🎨 Generate Japandi palette with stone + oak + matte black"];',
  '  return base;',
  '};',
  'const proactiveSuggestions = deriveSuggestions();'
].join('\n');
s = s.slice(0, idx) + replacement + s.slice(blockEnd);
fs.writeFileSync(path, s);
console.log('patched proactive suggestions');
