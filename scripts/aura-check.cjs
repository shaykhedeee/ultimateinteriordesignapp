const http = require('http');
const d = JSON.stringify({ message: 'Analyse my living room for vastu', projectId: null });
const r = http.request('http://127.0.0.1:5055/api/aura/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, x => {
  let c = []; x.on('data', y => c.push(y)); x.on('end', () => {
    const j = JSON.parse(Buffer.concat(c).toString());
    const reply = (j.reply || j.message || JSON.stringify(j)).toString();
    console.log('status', x.statusCode, '| llmPowered', j.llmPowered, '| reply len', reply.length);
    console.log('reply:', reply.slice(0, 200));
  });
});
r.on('error', e => console.log('ERR', e.message));
r.write(d); r.end();
