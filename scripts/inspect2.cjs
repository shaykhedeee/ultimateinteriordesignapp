const D = require('better-sqlite3');
const db = new D('storage/ultimate_interior.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log('all tables:', tables.join(', '));
for (const t of ['design_renders', 'quotations', 'quotes', 'project_quotations', 'budgets', 'cost_items']) {
  if (tables.includes(t)) {
    try { const r = db.prepare('SELECT * FROM ' + t + ' LIMIT 1').get(); console.log('==', t, '=>', r ? Object.keys(r).join(', ') : '(empty)'); }
    catch (e) { console.log(t, 'ERR', e.message); }
  } else { console.log(t, '=> (no such table)'); }
}
// sample design_renders columns
try { const r = db.prepare('SELECT * FROM design_renders LIMIT 1').get(); if (r) console.log('design_renders sample:', JSON.stringify(Object.keys(r))); } catch (e) { console.log('design_renders:', e.message); }
