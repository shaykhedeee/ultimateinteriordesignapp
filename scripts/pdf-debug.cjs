const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('/tmp/brief.pdf');
const s = buf.toString('latin1');
const re = /stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
let m, n = 0, sample = '';
while ((m = re.exec(s))) {
  try {
    const data = Buffer.from(m[1], 'latin1');
    const inf = zlib.inflateSync(data);
    const t = inf.toString('latin1');
    n++;
    if (n <= 3) sample += '\n--- stream ' + n + ' ---\n' + t.slice(0, 400);
  } catch (e) {}
}
console.log('inflated streams:', n);
console.log('sample:', sample.slice(0, 1200));
// also search raw for any text in parentheses (pdf text)
const texts = s.match(/\(([^)]*)\)/g) || [];
console.log('raw paren-texts:', texts.slice(0, 10));
