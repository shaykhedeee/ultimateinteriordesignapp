import db from '../database/database.js';

/**
 * Kitchen template picker (canonical flow step 7): apply U-shape or L-shape.
 * Inserts kitchen modules into cad_drawings.furniture_json for the kitchen room.
 */

function kitchenRoom(cad) {
  const rooms = JSON.parse(cad.rooms_json || '[]');
  return rooms.find(r => /kitchen/i.test(r.name || r.type || ''))
    || { points: [{ x: 600, y: 100 }] };
}

function baseModules(origin, shape) {
  const [ox, oy] = [origin.x, origin.y];
  if (shape === 'U') {
    return [
      { id: 'k_base_L', libraryId: 'kitchen_base', name: 'Kitchen Base (Left)', type: 'kitchen-base', x: ox, y: oy, width: 240, height: 60, depth: 56, color: '#C9A84C' },
      { id: 'k_base_R', libraryId: 'kitchen_base', name: 'Kitchen Base (Right)', type: 'kitchen-base', x: ox + 200, y: oy, width: 240, height: 60, depth: 56, color: '#C9A84C' },
      { id: 'k_base_back', libraryId: 'kitchen_base', name: 'Kitchen Base (Back)', type: 'kitchen-base', x: ox, y: oy - 120, width: 440, height: 56, depth: 56, color: '#C9A84C' },
      { id: 'k_wall', libraryId: 'kitchen_wall', name: 'Kitchen Wall Units', type: 'kitchen-wall', x: ox, y: oy - 200, width: 440, height: 72, depth: 35, color: '#E8E4DC' },
      { id: 'k_tall', libraryId: 'kitchen_tall', name: 'Tall Pantry', type: 'kitchen-tall', x: ox, y: oy + 80, width: 90, height: 200, depth: 60, color: '#8B6F47' },
      { id: 'k_island', libraryId: 'kitchen_island', name: 'Kitchen Island', type: 'kitchen-island', x: ox + 150, y: oy + 120, width: 180, height: 90, depth: 90, color: '#F5F5F0' },
    ];
  }
  // L-shape
  return [
    { id: 'k_base_run', libraryId: 'kitchen_base', name: 'Kitchen Base (Run)', type: 'kitchen-base', x: ox, y: oy, width: 440, height: 60, depth: 56, color: '#C9A84C' },
    { id: 'k_base_return', libraryId: 'kitchen_base', name: 'Kitchen Base (Return)', type: 'kitchen-base', x: ox, y: oy - 120, width: 180, height: 60, depth: 56, color: '#C9A84C' },
    { id: 'k_wall', libraryId: 'kitchen_wall', name: 'Kitchen Wall Units', type: 'kitchen-wall', x: ox, y: oy - 200, width: 440, height: 72, depth: 35, color: '#E8E4DC' },
    { id: 'k_tall', libraryId: 'kitchen_tall', name: 'Tall Pantry', type: 'kitchen-tall', x: ox, y: oy + 80, width: 90, height: 200, depth: 60, color: '#8B6F47' },
  ];
}

export function applyKitchenTemplate(projectId, shape) {
  if (!['U', 'L'].includes(shape)) return { ok: false, reason: 'BAD_SHAPE' };
  const cad = db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const next = furniture.filter(f => !/kitchen/i.test(f.type || '') && !/kitchen/i.test(f.libraryId || ''));
  const room = kitchenRoom(cad);
  const origin = { x: Math.round((room.points?.[0]?.x ?? 600) + 40), y: Math.round((room.points?.[0]?.y ?? 100) + 40) };
  const mods = baseModules(origin, shape);
  next.push(...mods);
  db.prepare('UPDATE cad_drawings SET furniture_json = ? WHERE project_id = ?').run(JSON.stringify(next), projectId);
  return { ok: true, shape, applied: mods.length, count: next.length };
}

export default { applyKitchenTemplate };
