const D = require('better-sqlite3');
const db = new D('storage/ultimate_interior.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log('render/quote/brief tables:', tables.filter(t => /render|quote|brief|aura|material|scene/.test(t)).join(', '));
for (const t of ['project_renders', 'ai_renders', 'render_jobs', 'quotes', 'project_quotations', 'client_briefs', 'scene_versions', 'aura_memory']) {
  if (tables.includes(t)) {
    try { const r = db.prepare('SELECT * FROM ' + t + ' LIMIT 1').get(); console.log(t, '=>', r ? Object.keys(r).join(', ') : '(empty)'); }
    catch (e) { console.log(t, 'ERR', e.message); }
  }
}
