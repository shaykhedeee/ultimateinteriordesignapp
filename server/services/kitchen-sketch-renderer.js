const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

const out = (process.env.OUT || path.resolve(__dirname, '../../storage'));
const imgPath = path.join(out, 'kitchen-elevation.png');
const dxfPath = path.join(out, 'kitchen-elevation.dxf');

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

function drawElevation(canvas, ctx, modules, originX, originY, title) {
  ctx.save();
  ctx.translate(originX, originY);

  const totalWidth = modules.reduce((s, m) => s + m.w, 0);
  const maxHeight = modules.reduce((m, v) => Math.max(m, v.h), 0);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-10, -40, totalWidth + 20, maxHeight + 60);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px ui-monospace, Menlo, monospace';
  ctx.fillText(title, 0, -16);

  let cx = 0;
  modules.forEach((m, i) => {
    const shade = i % 2 === 0 ? '#1e293b' : '#334155';
    ctx.fillStyle = shade;
    ctx.fillRect(cx, 0, m.w, m.h);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, 0, m.w, m.h);

    if (m.label.includes('GLAZED')) {
      ctx.fillStyle = 'rgba(56,189,248,0.08)';
      ctx.fillRect(cx + 6, 10, m.w - 12, m.h - 20);
      ctx.strokeStyle = 'rgba(56,189,248,0.4)';
      ctx.strokeRect(cx + 6, 10, m.w - 12, m.h - 20);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 14px ui-monospace, Menlo, monospace';
    const lines = [`${m.w}x${m.h}`, m.label];
    lines.forEach((line, idx) => ctx.fillText(line, cx + 10, 24 + idx * 18));

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText(`idx:${i + 1}`, cx + m.w - 60, m.h - 10);

    cx += m.w;
  });

  ctx.restore();
}

function buildDxf() {
  const lines = [
    '0',
    'SECTION',
    '2',
    'HEADER',
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

  // Elevation A
  let x = 0;
  elevationA.forEach((m, i) => {
    addRect(x, 1600, m.w, m.h, 'ELEVATION_A');
    addText(x + 10, 1580, `${m.label} ${m.w}x${m.h}`);
    x += m.w;
  });

  // Elevation B
  x = 0;
  elevationB.forEach((m, i) => {
    addRect(x, 2600, m.w, m.h, 'ELEVATION_B');
    addText(x + 10, 2580, `${m.label} ${m.w}x${m.h}`);
    x += m.w;
  });

  lines.push('0', 'ENDSEC', '0', 'EOF');

  return lines.join('\n');
}

(function main() {
  try {
    const width = 2400;
    const height = 3600;

    if (typeof createCanvas === 'function') {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      drawElevation(canvas, ctx, elevationA, 60, 60, 'KITCHEN ELEVATION A');
      drawElevation(canvas, ctx, elevationB, 60, 900, 'KITCHEN ELEVATION B');

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imgPath, buffer);
    } else {
      throw new Error('canvas package unavailable');
    }

    const dxf = buildDxf();
    fs.writeFileSync(dxfPath, dxf, 'utf8');

    console.log(JSON.stringify({ ok: true, imgPath, dxfPath, elevationA: elevationA.length, elevationB: elevationB.length }));
  } catch (err) {
    console.log('ERR ' + err.message);
  }
}());
