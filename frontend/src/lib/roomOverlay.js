// Pure helpers for the persisted Room Overlay Review layer in InteractiveCADScreen.
// Kept dependency-free + exported so the drag/shift math is unit-testable.

/**
 * Resolve a room's display centroid in world (SVG) coordinates.
 * - AI-detected rooms carry explicit x/y.
 * - Seed/legacy rooms carry a `points` polygon.
 * - Fallback: a deterministic grid slot so nodes are always placeable.
 * @param {{x?:number,y?:number,points?:Array<{x:number,y:number}>}} room
 * @param {number} [idx] index used only for the fallback slot
 */
export function roomCentroid(room, idx = 0) {
  if (typeof room.x === 'number' && typeof room.y === 'number') return { x: room.x, y: room.y };
  if (Array.isArray(room.points) && room.points.length) {
    const sx = room.points.reduce((s, p) => s + (p.x || 0), 0);
    const sy = room.points.reduce((s, p) => s + (p.y || 0), 0);
    return { x: sx / room.points.length, y: sy / room.points.length };
  }
  return { x: 200 + idx * 220, y: 200 };
}

/**
 * Translate a room by (dx, dy) for a drag, returning a NEW room object.
 * If the room has explicit x/y they are moved; if it has a `points`
 * polygon, every point is shifted by the same delta (so the polygon follows).
 */
export function shiftRoom(room, dx, dy) {
  const next = { ...room, x: (room.x ?? 0) + dx, y: (room.y ?? 0) + dy };
  if (Array.isArray(room.points)) {
    next.points = room.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
  }
  return next;
}
