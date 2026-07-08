import db from '../database/database.js';

/**
 * Auto-Vastu: mutates a project's cad_drawings to comply with Vastu
 *  - Inserts a Pooja (mandir) unit in the North-East if none exists
 *  - Repositions bed modules to South / West walls if they sit in forbidden zones
 * Returns a structured diff (preview or applied) so the UI can show what changed.
 */

const VASTU = {
  poojaZone: 'NE',
  bedAllowedZones: ['S', 'W', 'SW'],
  bedForbiddenZones: ['N', 'E', 'NE', 'NW', 'SE'],
};

function loadCad(projectId) {
  return db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get(projectId);
}

function hasPooja(furniture) {
  return furniture.some(f => (f.type || '').toLowerCase().includes('pooja') || (f.libraryId || '').toLowerCase().includes('pooja') || (f.name || '').toLowerCase().includes('mandir'));
}

function bedItems(furniture) {
  return furniture.filter(f => (f.type || '').toLowerCase().includes('bed') || (f.libraryId || '').toLowerCase().includes('bed'));
}

/**
 * Compute the Vastu diff WITHOUT writing to the DB (dry run for the UI preview).
 */
export function previewVastu(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');

  const changes = [];
  const poojaPresent = hasPooja(furniture);
  if (!poojaPresent) {
    // Place a mandir in the NE-most room (or a default NE coordinate)
    const neRoom = rooms.find(r => (r.constraints?.vastuZone || r.vastuZone) === 'NE')
      || rooms.slice().sort((a, b) => (a.y || 0) - (b.y || 0))[0];
    const px = neRoom ? Math.round((neRoom.points?.[0]?.x ?? 150) + 30) : 150;
    const py = neRoom ? Math.round((neRoom.points?.[0]?.y ?? 200) + 30) : 250;
    changes.push({
      kind: 'add_pooja',
      zone: 'NE',
      x: px, y: py,
      summary: 'Added Pooja mandir in North-East (NE) per Vastu — none found in plan.',
    });
  }

  for (const bed of bedItems(furniture)) {
    const zone = bed.vastuZone || bed.zone;
    if (zone && VASTU.bedForbiddenZones.includes(zone)) {
      changes.push({
        kind: 'move_bed',
        id: bed.id,
        fromZone: zone,
        toZone: 'SW',
        summary: `Moved bed "${bed.name || bed.id}" from ${zone} (inauspicious) to South-West (SW).`,
      });
    }
  }

  return { ok: true, poojaPresent, changes, needsApply: changes.length > 0 };
}

/**
 * Apply the Vastu fixes to cad_drawings.furniture_json.
 */
export function applyVastu(projectId) {
  const cad = loadCad(projectId);
  if (!cad) return { ok: false, reason: 'NO_CAD' };
  const furniture = JSON.parse(cad.furniture_json || '[]');
  const rooms = JSON.parse(cad.rooms_json || '[]');
  const preview = previewVastu(projectId);
  if (!preview.ok) return preview;
  if (!preview.needsApply) return { ok: true, applied: [], changes: [] };

  const next = furniture.map(f => ({ ...f }));
  const applied = [];

  if (!preview.poojaPresent) {
    const add = preview.changes.find(c => c.kind === 'add_pooja');
    next.push({
      id: 'f_pooja_auto_' + Date.now().toString(36),
      libraryId: 'pooja_mandir',
      name: 'Pooja Mandir (Auto-Vastu)',
      type: 'pooja',
      x: add.x, y: add.y, width: 60, height: 90, rotation: 0,
      color: '#B88A2F', vastuZone: 'NE',
    });
    applied.push(add);
  }

  for (const ch of preview.changes.filter(c => c.kind === 'move_bed')) {
    const bed = next.find(f => f.id === ch.id);
    if (bed) {
      bed.vastuZone = 'SW';
      bed.zone = 'SW';
      // nudge toward SW corner of its room if coords known
      if (bed.x != null) bed.y = (bed.y ?? 0) + 40;
      applied.push(ch);
    }
  }

  db.prepare('UPDATE cad_drawings SET furniture_json = ? WHERE project_id = ?')
    .run(JSON.stringify(next), projectId);

  return { ok: true, applied, changes: preview.changes };
}

export default { previewVastu, applyVastu, VASTU };
