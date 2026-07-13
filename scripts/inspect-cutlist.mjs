import db from '../server/database/database.js';
const row = db.prepare('SELECT * FROM production_cutlists WHERE project_id=?').get('fp_en_1783881406574_8589');
if (!row) { console.log('NO ROW'); process.exit(0); }
console.log('columns:', Object.keys(row));
for (const k of Object.keys(row)) {
  const v = row[k];
  if (typeof v === 'string' && v.length > 0) {
    try { const p = JSON.parse(v); console.log(k, '-> JSON keys:', Object.keys(p).slice(0,6)); }
    catch { console.log(k, '-> str len', v.length, v.slice(0,60)); }
  } else console.log(k, '->', typeof v, v);
}
