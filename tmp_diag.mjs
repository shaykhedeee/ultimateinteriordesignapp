import db from './server/database/database.js';
const d = db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id=?').get('proj_1');
const f = JSON.parse(d.furniture_json || '[]');
console.log('furniture count:', f.length);
import fitz from 'fitz';
const doc = fitz.open('/tmp/signoff_d.pdf');
for (let i = 0; i < doc.page_count; i++) {
  const t = doc[i].get_text();
  console.log('page', i+1, 'chars', t.length);
}
