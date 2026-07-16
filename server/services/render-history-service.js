import db from '../database/database.js';

export function listRenderHistory({ projectId, renderId, parentRenderId }) {
  let sql = 'SELECT * FROM render_history WHERE project_id = ?';
  const params = [projectId];
  if (renderId) {
    sql += ' AND id = ?';
    params.push(renderId);
  }
  if (parentRenderId) {
    sql += ' AND parent_render_id = ?';
    params.push(parentRenderId);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

export function getLatestRenderId(projectId) {
  const row = db.prepare('SELECT id FROM design_renders WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
  return row ? row.id : null;
}
