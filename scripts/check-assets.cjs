const http = require('http');
const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(m => m[1]))];
(async () => {
  let bad = 0;
  for (const a of assets) {
    await new Promise(r => {
      http.get('http://127.0.0.1:5055' + a, res => {
        if (res.statusCode >= 400) { bad++; console.log('MISSING', a, res.statusCode); }
        res.resume(); r();
      }).on('error', () => { bad++; console.log('ERR', a); r(); });
    });
  }
  console.log(bad ? (bad + ' assets missing/failed') : ('ALL ' + assets.length + ' referenced local assets return 200'));
})();
