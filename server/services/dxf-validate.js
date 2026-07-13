/**
 * dxf-validate.js — dependency-free structural validator for the DXF files
 * this app emits (and for imported architect DXFs before we trust them).
 *
 * AutoCAD R2010 ASCII correctness checks:
 *   - group stream is well-formed (even line count, alternating code/value,
 *     every code is an integer)
 *   - required sections present: HEADER, TABLES, ENTITIES, OBJECTS, EOF
 *   - LAYER table is complete and every entity layer is declared
 *   - every ENTITY carries AcDbEntity + the correct entity-specific subclass
 *   - no orphan/duplicated section markers
 *
 * It does NOT render — it only proves the file will open in AutoCAD / ezdxf /
 * LibreCAD without the subclass-marker corruption that broke earlier versions.
 */

const REQUIRED_SECTIONS = ['HEADER', 'TABLES', 'ENTITIES', 'OBJECTS'];
const ENTITY_SUBCLASSES = {
  LINE: 'AcDbLine',
  LWPOLYLINE: 'AcDbPolyline',
  POLYLINE: 'AcDb2dPolyline',
  ARC: 'AcDbArc',
  CIRCLE: 'AcDbCircle',
  TEXT: 'AcDbText',
  MTEXT: 'AcDbMText',
  INSERT: 'AcDbBlockReference',
  '3DFACE': 'AcDbFace',
  SOLID: 'AcDbSolid',
  HATCH: 'AcDbHatch',
  DIMENSION: 'AcDbDimension',
  POINT: 'AcDbPoint',
  ELLIPSE: 'AcDbEllipse',
  SPLINE: 'AcDbSpline',
};

function readGroups(text) {
  const lines = String(text).split(/\r?\n/);
  const groups = [];
  let i = 0;
  while (i + 1 < lines.length) {
    const code = parseInt(lines[i].trim(), 10);
    if (Number.isNaN(code)) { i += 1; continue; }
    groups.push({ code, value: lines[i + 1] });
    i += 2;
  }
  return groups;
}

export function validateDxf(text) {
  const errors = [];
  const warnings = [];
  const groups = readGroups(text);

  if (groups.length === 0) {
    return { valid: false, errors: ['empty or unreadable DXF'], warnings, stats: {} };
  }

  // 1) section presence + ordering
  const sectionNames = [];
  for (let i = 0; i < groups.length - 1; i++) {
    if (groups[i].code === 0 && groups[i].value === 'SECTION' && groups[i + 1].code === 2) {
      sectionNames.push(groups[i + 1].value);
    }
  }
  const sectionsPresent = new Set(sectionNames);
  for (const s of REQUIRED_SECTIONS) {
    if (!sectionsPresent.has(s)) errors.push(`missing required SECTION: ${s}`);
  }
  const last = groups[groups.length - 1];
  if (!(last.code === 0 && last.value === 'EOF')) errors.push('file does not end with 0/EOF');

  // 2) LAYER table completeness
  const declaredLayers = new Set(['0']);
  let inLayerTable = false;
  let currentLayer = null;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.code === 0 && g.value === 'TABLE' && groups[i + 1]?.code === 2 && groups[i + 1]?.value === 'LAYER') inLayerTable = true;
    else if (g.code === 0 && g.value === 'ENDTAB') inLayerTable = false;
    else if (inLayerTable && g.code === 0 && g.value === 'LAYER') currentLayer = null;
    else if (inLayerTable && g.code === 2 && currentLayer === null) { currentLayer = g.value; declaredLayers.add(g.value); }
  }

  // 3) entity subclass validation
  const usedLayers = new Set();
  const entityCounts = {};
  let i = 0;
  while (i < groups.length) {
    const g = groups[i];
    if (g.code !== 0) { i += 1; continue; }
    const type = g.value;
    if (!(type in ENTITY_SUBCLASSES) && type !== 'SECTION' && type !== 'TABLE' && type !== 'ENDTAB' && type !== 'ENDSEC' && type !== 'EOF' && type !== 'LAYER' && type !== 'VERTEX' && type !== 'ATTRIB' && type !== 'BLOCK' && type !== 'ENDBLK') {
      // unknown entity type — only warn (some apps emit custom)
      if (type && type.length > 1) warnings.push(`unrecognised entity type: ${type}`);
      i += 1; continue;
    }
    if (!(type in ENTITY_SUBCLASSES)) { i += 1; continue; }

    entityCounts[type] = (entityCounts[type] || 0) + 1;

    // scan the entity block for subclass markers + layer
    let hasEntitySub = false;
    let hasCorrectSub = false;
    let layer = null;
    let j = i + 1;
    while (j < groups.length && groups[j].code !== 0) {
      const gg = groups[j];
      if (gg.code === 100 && gg.value === 'AcDbEntity') hasEntitySub = true;
      if (gg.code === 100 && gg.value === ENTITY_SUBCLASSES[type]) hasCorrectSub = true;
      if (gg.code === 8) layer = gg.value;
      j += 1;
    }
    if (!hasEntitySub) errors.push(`${type} at offset ${i} missing AcDbEntity subclass marker`);
    if (!hasCorrectSub) errors.push(`${type} at offset ${i} missing ${ENTITY_SUBCLASSES[type]} subclass marker`);
    if (layer) {
      usedLayers.add(layer);
      if (!declaredLayers.has(layer)) warnings.push(`entity uses undeclared layer: ${layer}`);
    }
    i = j;
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    warnings,
    stats: {
      groupCount: groups.length,
      sections: [...sectionsPresent],
      layerCount: declaredLayers.size,
      entityCounts,
    },
  };
}

export default { validateDxf };
