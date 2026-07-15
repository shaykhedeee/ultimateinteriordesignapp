const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('/tmp/brief.pdf');
const s = buf.toString('latin1');
const re = /stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
let m, text = '';
while ((m = re.exec(s))) {
  try { text += zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (e) {}
}
function decodeHexStrings(t) {
  return (t.match(/<([0-9A-Fa-f]+)>/g) || []).map(h => {
    const hex = h.slice(1, -1);
    let o = '';
    for (let i = 0; i < hex.length; i += 2) o += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return o;
  }).join('');
}
const decoded = decodeHexStrings(text).replace(/\s+/g, ' ');
console.log('FULL DECODED TEXT:');
console.log(decoded);
