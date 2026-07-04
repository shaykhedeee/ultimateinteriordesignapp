const fs = require('fs');
const path = require('path');

const dxfPath = 'X:/OFFLINEGANG/ULTIMATE INTERIOR DESIGN APP/ultimateinteriordesignapp/kitchen-elevation.dxf';

const elevationA = [
  { label: 'UPPER LEFT', w: 900, h: 320, x: 0, y: 0 },
  { label: 'UPPER RIGHT TOP', w: 700, h: 180, x: 900, y: 0 },
  { label: 'UPPER RIGHT BOTTOM', w: 700, h: 140, x: 900, y: 180 },
  { label: 'COUNTERTOP RUN', w: 1000, h: 50, x: 0, y: 320 },
  { label: 'DRAWER STACK', w: 1000, h: 450, x: 0, y: 370 },
  { label: 'RIGHT BASE', w: 250, h: 450, x: 1150, y: 370 }
];

const elevationB = [
  { label: 'GLAZED UNIT 1', w: 375, h: 550, x: 0, y: 0 },
  { label: 'GLAZED UNIT 2', w: 375, h: 550, x: 375, y: 0 },
  { label: 'GLAZED UNIT 3', w: 375, h: 550, x: 750, y: 0 },
  { label: 'SOLID BASE 1', w: 400, h: 550, x: 1125, y: 0 },
  { label: 'SOLID BASE 2', w: 400, h: 550, x: 1525, y: 0 },
  { label: 'END PANEL', w: 250, h: 550, x: 1925, y: 0 }
];

function buildDxf() {
  const lines = [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '$INSUNITS',
    '70',
    '4',
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES'
  ];

  function addRect(x, y, w, h, layer) {
    lines.push('0', 'LWPOLYLINE', '8', layer, '90', '5', '70', '1');
    lines.push('10', String(x));
    lines.push('20', String(y));
    lines.push('10', String(x + w));
    lines.push('20', String(y));
    lines.push('10', String(x + w));
    lines.push('20', String(y + h));
    lines.push('10', String(x));
    lines.push('20', String(y + h));
    lines.push('10', String(x));
    lines.push('20', String(y));
  }

  function addText(x, y, text) {
    lines.push('0', 'TEXT', '8', 'NOTES');
    lines.push('10', String(x));
    lines.push('20', String(y));
    lines.push('40', '80');
    lines.push('1', text);
  }

  let x = 0;
  elevationA.forEach((m, i) => {
    addRect(x, 1600, m.w, m.h, 'ELEVATION_A');
    addText(x + 10, 1580, `${m.label} ${m.w}x${m.h}`);
    x += m.w;
  });

  x = 0;
  elevationB.forEach((m, i) => {
    addRect(x, 2600, m.w, m.h, 'ELEVATION_B');
    addText(x + 10, 2580, `${m.label} ${m.w}x${m.h}`);
    x += m.w;
  });

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

try {
  fs.writeFileSync(dxfPath, buildDxf(), 'utf8');
  console.log(JSON.stringify({ ok: true, dxfPath }));
} catch (err) {
  console.log('ERR ' + err.message);
}
