import { pathToFileURL } from 'url';
const projRoot = 'C:/Users/USER/Documents/Muskans autocad solution/THE ULTIMATE INTERIOR DESIGN APPLICATION';
const { runPipeline } = await import(pathToFileURL(projRoot + '/server/services/pipeline-orchestrator.js').href);
const rooms = [
  { name: 'Living Dining', w: 5600, h: 4200, openings: [{ offsetMm: 500, widthMm: 900, sillMm: 900, headMm: 2100, type: 'door' }], cabinets: [{ id: 'c1', type: 'base', widthMm: 600, heightMm: 720, xOffsetMm: 0, zOffsetMm: 0, name: 'Base Drawer', material: { callout: 'PU Paint', glass: false, cane: false }, handleType: 'pull' }] },
  { name: 'Master Bedroom', w: 4200, h: 3600, openings: [], cabinets: [] }
];
try {
  const r = await runPipeline({ projectId: 'test_pl', rooms, projectName: 'ULTIDA Project' });
  console.log('OK', r.dxfs.length, r.pdfs.length, r.images.length);
} catch (e) {
  console.log('CRASH:', e.message);
  console.log(e.stack.split('\n').slice(0, 14).join('\n'));
}
