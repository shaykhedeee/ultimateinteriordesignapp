const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('/tmp/brief.pdf');
const s = buf.toString('latin1');
// Find FlateDecode streams: between "stream\r\n" and "\r\nendstream"
const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let m, text = '';
while ((m = re.exec(s))) {
  try {
    const data = Buffer.from(m[1], 'latin1');
    const inf = zlib.inflateSync(data);
    text += inf.toString('latin1');
  } catch (e) { /* not flate or already raw */ }
}
// Also catch uncompressed text
text += s;
const want = ['2D Floor Plan', 'Vastu Compliance', 'Client Design Brief', 'Material', '3D Renders', 'Budget Estimate'];
for (const w of want) console.log(w.padEnd(20), text.includes(w) ? 'FOUND' : 'absent');
console.log('--- page count (Type/Page) ---', (text.match(/\/Type\s*\/Page[^s]/g) || []).length);
