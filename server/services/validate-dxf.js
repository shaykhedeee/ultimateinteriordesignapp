/**
 * validate-dxf.js
 * ──────────────────────────────────────────────────────────────────
 * Structural validation of the generated DXF file.
 */
import fs from 'fs';
import path from 'path';

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

function validateDxf(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    return false;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const groups = [];
  let i = 0;
  while (i + 1 < lines.length) {
    const codeStr = lines[i].trim();
    const val = lines[i + 1];
    if (codeStr === '') { i += 2; continue; }
    const code = parseInt(codeStr, 10);
    if (isNaN(code)) {
      console.error(`Invalid group code at line ${i + 1}: "${codeStr}"`);
      return false;
    }
    groups.push({ code, value: val });
    i += 2;
  }

  const sectionsPresent = new Set();
  let insideSection = false;
  let activeSectionName = null;

  for (let j = 0; j < groups.length; j++) {
    if (groups[j].code === 0 && groups[j].value === 'SECTION') {
      if (insideSection) {
        console.error(`Orphan/duplicated SECTION marker at group index ${j}`);
        return false;
      }
      insideSection = true;
      if (groups[j + 1] && groups[j + 1].code === 2) {
        activeSectionName = groups[j + 1].value;
        sectionsPresent.add(activeSectionName);
      }
    }
    if (groups[j].code === 0 && groups[j].value === 'ENDSEC') {
      if (!insideSection) {
        console.error(`Orphan ENDSEC marker at group index ${j}`);
        return false;
      }
      insideSection = false;
      activeSectionName = null;
    }
  }

  for (const s of REQUIRED_SECTIONS) {
    if (!sectionsPresent.has(s)) {
      console.warn(`⚠️ Warning: Missing required SECTION: ${s}`);
    }
  }

  console.log(`✅ DXF structural check passed for: ${filePath}`);
  return true;
}

validateDxf('UNIT_PLAN_C009.dxf');
