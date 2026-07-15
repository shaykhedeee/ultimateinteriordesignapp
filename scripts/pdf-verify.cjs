const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('/tmp/brief.pdf');
const s = buf.toString('latin1');
const re = /stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
let m, text = '';
while ((m = re.exec(s))) {
  try { text += zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (e) {}
}
// Decode hex-string PDF text: <hex> -> ascii
function decodeHexStrings(t) {
  return (t.match(/<([0-9A-Fa-f]+)>/g) || []).map(h => {
    const hex = h.slice(1, -1);
    let o = '';
    for (let i = 0; i < hex.length; i += 2) o += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return o;
  }).join(' ');
}
const decoded = decodeHexStrings(text);
for (const w of ['2D Floor Plan', 'Vastu', 'CLIENT DESIGN BRIEF', 'Material', 'Budget', 'Renders']) {
  console.log(w.padEnd(20), (decoded.includes(w) || text.includes(w)) ? 'FOUND' : 'absent');
}
console.log('--- pages ---', (text.match(/\/Type \/Page[^s]/g) || []).length);
console.log('decoded sample (first 300):', decoded.slice(0, 300));
