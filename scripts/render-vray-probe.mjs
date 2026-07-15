const http = require('http');
function req(m, p, b) {
  return new Promise((res, rej) => {
    const d = b ? JSON.stringify(b) : null;
    const r = http.request('http://127.0.0.1:8787' + p, { method: m, headers: d ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } : {} }, x => {
      let c = []; x.on('data', y => c.push(y)); x.on('end', () => { let j; try { j = JSON.parse(Buffer.concat(c).toString()); } catch { j = null; } res({ s: x.statusCode, j }); });
    });
    r.on('error', rej); if (d) r.write(d); r.end();
  });
}
(async () => {
  const cp = await req('POST', '/api/projects', { name: 'RenderVRay', client_name: 'X' });
  const pid = cp.j.id;
  console.log('project', cp.s, pid);
  // generate a render with studio quality (2x upscale)
  const gen = await req('POST', `/api/projects/${pid}/renders/generate`, {
    room: 'living', style: 'indian-contemporary', budgetTier: 'premium',
    qualityMode: 'ultra', variantCount: 1,
    customInstruction: 'Luxury Indian modern living room, walnut TV wall, marble floor, warm LED.'
  });
  console.log('render gen', gen.s, 'success:', gen.j.success);
  const v = gen.j.variants && gen.j.variants[0];
  console.log('variant:', v && { id: v.id, filePath: v.filePath, upscaled: v.upscaled, w: v.width, h: v.height, src: v.sourceType, score: v.reusableScore });
  // fetch provider status to confirm priority
  const ps = await req('GET', '/api/provider-status');
  console.log('provider-status activeLabel:', ps.j && ps.j.activeLabel, '| liveReady:', ps.j && ps.j.liveImageGenReady);
})();
