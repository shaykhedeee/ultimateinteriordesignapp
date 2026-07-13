import db from '../server/database/database.js';
const rows = db.prepare('SELECT project_id, length(walls_json) AS wlen FROM cad_drawings WHERE walls_json IS NOT NULL AND walls_json != \'[]\' AND walls_json != \'null\' ORDER BY created_at DESC LIMIT 20').all();
console.log('cad rows with walls:', JSON.stringify(rows));
const cnt = db.prepare('SELECT COUNT(*) c FROM cad_drawings').get();
console.log('total cad_drawings:', cnt.c);
