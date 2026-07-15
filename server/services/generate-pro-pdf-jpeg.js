/**
 * generate-pro-pdf-jpeg.js
 * ──────────────────────────────────────────────────────────────────
 * Generates an ultra-detailed, professional A3 Landscape PDF and a
 * high-resolution JPEG representation of the floor plan for UNIT PLAN C009.
 *
 * Direct pdfkit rendering is used for the PDF drawing.
 * Playwright is used to screenshot a pixel-perfect HTML/SVG representation for the JPEG.
 */
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { chromium } from 'playwright';

const M = 1000;
const WT = 150; // wall thickness

// Room definitions (real-world mm)
const rooms = [
  { name: 'M. BEDROOM - 01', x: 0, y: 0, w: 3003, h: 3490, color: '#f8fafc', fill: 'rgba(59, 130, 246, 0.05)', area: '10.5 sq.m' },
  { name: 'BEDROOM - 03', x: 6700, y: 0, w: 3210, h: 3005, color: '#f8fafc', fill: 'rgba(16, 185, 129, 0.05)', area: '9.6 sq.m' },
  { name: 'TOILET', x: 3003, y: 850, w: 1524, h: 2155, color: '#f8fafc', fill: 'rgba(245, 158, 11, 0.05)', area: '3.3 sq.m' },
  { name: 'STAIRCASE', x: 4527, y: 0, w: 2173, h: 3005, color: '#f8fafc', fill: 'rgba(107, 114, 128, 0.05)', area: '6.5 sq.m' },
  { name: 'LIVING / DINING', x: 0, y: 3490, w: 9910, h: 3255, color: '#f8fafc', fill: 'rgba(139, 92, 246, 0.05)', area: '32.3 sq.m' },
  { name: 'UTILITY', x: 0, y: 6745, w: 1800, h: 1458, color: '#f8fafc', fill: 'rgba(236, 72, 153, 0.05)', area: '2.6 sq.m' },
  { name: 'KITCHEN', x: 2705, y: 6745, w: 2386, h: 2948, color: '#f8fafc', fill: 'rgba(239, 68, 68, 0.05)', area: '7.0 sq.m' },
  { name: 'TOILET', x: 5091, y: 6745, w: 1304, h: 2164, color: '#f8fafc', fill: 'rgba(245, 158, 11, 0.05)', area: '2.8 sq.m' },
  { name: 'BEDROOM - 02', x: 6395, y: 6745, w: 3560, h: 3000, color: '#f8fafc', fill: 'rgba(16, 185, 129, 0.05)', area: '10.7 sq.m' },
  { name: 'BALCONY', x: 7800, y: 3490, w: 2110, h: 2394, color: '#f8fafc', fill: 'rgba(234, 179, 8, 0.05)', area: '5.0 sq.m' }
];

const doors = [
  { hx: 0, hy: 5000, w: 1000, dir: 'right' },
  { hx: 3003, hy: 3200, w: 900, dir: 'left' },
  { hx: 3003, hy: 1200, w: 750, dir: 'left' },
  { hx: 6700, hy: 2800, w: 900, dir: 'left' },
  { hx: 6500, hy: 6745, w: 900, dir: 'right' },
  { hx: 5200, hy: 6745, w: 750, dir: 'right' },
  { hx: 3500, hy: 6745, w: 900, dir: 'up' }
];

const windows = [
  { x1: 0, y1: 800, x2: 0, y2: 2200 },
  { x1: 9910, y1: 800, x2: 9910, y2: 2200 },
  { x1: 7000, y1: 9745, x2: 8500, y2: 9745 },
  { x1: 3200, y1: 9693, x2: 4400, y2: 9693 }
];

// Horizontal bottom chains
const bottomDime = [
  { x1: 0, x2: 3003, label: '3003', offset: -450 },
  { x1: 3003, x2: 4527, label: '1524', offset: -450 },
  { x1: 4527, x2: 6700, label: '2173', offset: -450 },
  { x1: 6700, x2: 9910, label: '3210', offset: -450 },
  { x1: 0, x2: 9910, label: '9910', offset: -850 }
];

// Left vertical chains
const leftDime = [
  { y1: 0, y2: 3490, label: '3490', offset: -450 },
  { y1: 3490, y2: 6745, label: '3255', offset: -450 },
  { y1: 6745, y2: 8203, label: '1458', offset: -450 },
  { y1: 0, y2: 9745, label: '9745', offset: -850 }
];

// Overall bounds in mm (enclosing rect)
const minX = -1000, maxX = 11000, minY = -1500, maxY = 11000;
const planW = maxX - minX;
const planH = maxY - minY;

/* ═══════════════════════════════════════════════════════════════════════
 *  1. GENERATE A3 LANDSCAPE PDF (Using pdfkit)
 * ═══════════════════════════════════════════════════════════════════════ */
async function generatePDF() {
  const doc = new PDFDocument({
    size: 'A3',
    layout: 'landscape',
    margins: { top: 30, bottom: 30, left: 30, right: 30 }
  });

  const destPath = path.join(process.cwd(), 'UNIT_PLAN_C009.pdf');
  const stream = fs.createWriteStream(destPath);
  doc.pipe(stream);

  // A3 dimensions: 1190.55 x 841.89 points
  const canvasW = 1190.55 - 60;
  const canvasH = 841.89 - 60;

  // Scale calculations (fit coordinates into canvas)
  const sc = Math.min(canvasW / planW, canvasH / planH);
  
  // Transform mm to PDF coordinates (Y flipped, centered)
  const tx = (x) => 30 + (x - minX) * sc;
  const ty = (y) => 841.89 - 30 - (y - minY) * sc;
  const ts = (mm) => mm * sc;

  // Draw background border
  doc.rect(30, 30, canvasW, canvasH).strokeColor('#8a8899').lineWidth(1.5).stroke();

  // Draw room fills
  rooms.forEach(r => {
    doc.rect(tx(r.x), ty(r.y + r.h), ts(r.w), ts(r.h))
       .fillColor(r.fill || 'rgba(0,0,0,0.02)')
       .fill();
  });

  // Draw walls with thickness WT (double lines)
  rooms.forEach(r => {
    // Outer walls
    doc.lineWidth(1.5).strokeColor('#111113');
    doc.rect(tx(r.x), ty(r.y + r.h), ts(r.w), ts(r.h)).stroke();
    // Inner wall lines
    doc.lineWidth(0.8).strokeColor('#8a8899');
    doc.rect(tx(r.x + WT/2), ty(r.y + r.h - WT/2), ts(r.w - WT), ts(r.h - WT)).stroke();
  });

  // Draw doors (openings)
  doors.forEach(d => {
    const rx = tx(d.hx);
    const ry = ty(d.hy);
    const rw = ts(d.w);

    doc.lineWidth(1).strokeColor('#C9A84C');
    if (d.dir === 'left') {
      doc.moveTo(rx, ry).lineTo(rx - rw, ry).stroke();
      doc.arc(rx, ry, rw, Math.PI, 1.5 * Math.PI, false).stroke();
    } else if (d.dir === 'right') {
      doc.moveTo(rx, ry).lineTo(rx + rw, ry).stroke();
      doc.arc(rx, ry, rw, 0, 0.5 * Math.PI, true).stroke();
    } else if (d.dir === 'up') {
      doc.moveTo(rx, ry).lineTo(rx, ry - rw).stroke();
      doc.arc(rx, ry, rw, 1.5 * Math.PI, 2.0 * Math.PI, false).stroke();
    }
  });

  // Draw windows
  windows.forEach(w => {
    doc.lineWidth(2).strokeColor('#38bdf8');
    doc.moveTo(tx(w.x1), ty(w.y1)).lineTo(tx(w.x2), ty(w.y2)).stroke();
    // Glass double lines
    const off = 25;
    doc.lineWidth(0.5).strokeColor('#e2e8f0');
    doc.moveTo(tx(w.x1), ty(w.y1) - off * sc).lineTo(tx(w.x2), ty(w.y2) - off * sc).stroke();
    doc.moveTo(tx(w.x1), ty(w.y1) + off * sc).lineTo(tx(w.x2), ty(w.y2) + off * sc).stroke();
  });

  // Draw room labels
  rooms.forEach(r => {
    const cx = tx(r.x + r.w / 2);
    const cy = ty(r.y + r.h / 2);
    
    doc.fillColor('#111113').font('Helvetica-Bold').fontSize(11).text(r.name, cx - 100, cy - 8, { width: 200, align: 'center' });
    doc.fillColor('#8a8899').font('Helvetica').fontSize(8.5).text(`${Math.round(r.w)} x ${Math.round(r.h)} mm (${r.area})`, cx - 100, cy + 8, { width: 200, align: 'center' });
  });

  // Draw dimension chains
  doc.lineWidth(1).strokeColor('#C9A84C');
  // Horizontal Bottom
  bottomDime.forEach(d => {
    const x1 = tx(d.x1);
    const x2 = tx(d.x2);
    const y = ty(0) - d.offset * sc;
    // extension lines
    doc.moveTo(x1, ty(0)).lineTo(x1, y).stroke();
    doc.moveTo(x2, ty(0)).lineTo(x2, y).stroke();
    // main dimension line
    doc.moveTo(x1, y).lineTo(x2, y).stroke();
    // ticks
    const tick = 6 * sc;
    doc.moveTo(x1 - tick, y - tick).lineTo(x1 + tick, y + tick).stroke();
    doc.moveTo(x2 - tick, y - tick).lineTo(x2 + tick, y + tick).stroke();
    // label text
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(9).text(d.label, (x1 + x2)/2 - 20, y - 12, { width: 40, align: 'center' });
  });

  // Left Vertical
  leftDime.forEach(d => {
    const y1 = ty(d.y1);
    const y2 = ty(d.y2);
    const x = tx(0) + d.offset * sc;
    // extension lines
    doc.moveTo(tx(0), y1).lineTo(x, y1).stroke();
    doc.moveTo(tx(0), y2).lineTo(x, y2).stroke();
    // main dimension line
    doc.moveTo(x, y1).lineTo(x, y2).stroke();
    // ticks
    const tick = 6 * sc;
    doc.moveTo(x - tick, y1 - tick).lineTo(x + tick, y1 + tick).stroke();
    doc.moveTo(x - tick, y2 - tick).lineTo(x + tick, y2 + tick).stroke();
    // label text
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(9).text(d.label, x - 35, (y1 + y2)/2 - 5, { width: 30, align: 'right' });
  });

  // Title block (bottom right of page)
  const bx = 1190.55 - 30 - 320;
  const by = 841.89 - 30 - 120;
  doc.rect(bx, by, 320, 120).strokeColor('#8a8899').lineWidth(1.5).stroke();
  doc.fillColor('#0A0A0B').rect(bx + 1, by + 1, 318, 118).fill();
  
  // Re-fill text
  doc.fillColor('#E8C97A').font('Helvetica-Bold').fontSize(14).text('UNIT PLAN C 009', bx + 15, by + 20);
  doc.fillColor('#F0EEE8').font('Helvetica').fontSize(9).text('SCALE: 1:100 @ A3', bx + 15, by + 45);
  doc.fillColor('#8a8899').font('Helvetica').fontSize(9).text(`DATE: ${new Date().toISOString().slice(0, 10)}`, bx + 15, by + 65);
  doc.fillColor('#E8C97A').font('Helvetica-Bold').fontSize(12).text('GRID OS', bx + 220, by + 20);
  doc.fillColor('#8a8899').font('Helvetica').fontSize(8.5).text('ALL DIMS IN MM', bx + 220, by + 85);

  // Draw North Arrow
  const nax = 1190.55 - 80;
  const nay = 80;
  doc.circle(nax, nay, 22).strokeColor('#C9A84C').lineWidth(1).stroke();
  doc.polygon([nax, nay - 15], [nax - 8, nay + 10], [nax, nay + 2], [nax + 8, nay + 10]).fillColor('#C9A84C').fill();
  doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(9).text('N', nax - 10, nay - 28, { width: 20, align: 'center' });

  doc.end();
  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`✅ A3 Landscape PDF generated at: ${destPath}`);
      resolve(destPath);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
 *  2. GENERATE HIGH-RESOLUTION JPEG (Using Playwright viewport capture)
 * ═══════════════════════════════════════════════════════════════════════ */
async function generateJPEG() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // HTML containing a high-resolution SVG of the exact layout
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0A0A0B;
        font-family: 'Inter', system-ui, sans-serif;
        color: #F0EEE8;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 2400px;
        height: 1800px;
      }
      svg {
        width: 2200px;
        height: 1600px;
        border: 2px solid #8a8899;
        background-color: #111113;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .wall-outer { stroke: #F0EEE8; stroke-width: 8; fill: none; }
      .wall-inner { stroke: #8a8899; stroke-width: 2; fill: none; }
      .room-fill { stroke: none; }
      .label-title { fill: #F0EEE8; font-size: 24px; font-weight: 800; text-anchor: middle; }
      .label-detail { fill: #8a8899; font-size: 16px; font-weight: 500; text-anchor: middle; }
      .dimension-line { stroke: #E8C97A; stroke-width: 2; fill: none; }
      .dimension-tick { stroke: #E8C97A; stroke-width: 3; }
      .dimension-text { fill: #E8C97A; font-size: 20px; font-weight: bold; text-anchor: middle; }
      .door { stroke: #C9A84C; stroke-width: 3; fill: none; }
      .window { stroke: #38bdf8; stroke-width: 6; }
      .window-pane { stroke: #e2e8f0; stroke-width: 1.5; }
      .title-block { fill: #0A0A0B; stroke: #8a8899; stroke-width: 3; }
    </style>
  </head>
  <body>
    <svg viewBox="-1200 -2000 13000 13500">
      <!-- Room fills -->
      ${rooms.map(r => `
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" class="room-fill" />
      `).join('')}

      <!-- Wall structures (double line) -->
      ${rooms.map(r => `
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="wall-outer" />
        <rect x="${r.x + WT}" y="${r.y + WT}" width="${r.w - WT*2}" height="${r.h - WT*2}" class="wall-inner" />
      `).join('')}

      <!-- Doors -->
      ${doors.map(d => {
        let path = '';
        if (d.dir === 'left') {
          path = `<line x1="${d.hx}" y1="${d.hy}" x2="${d.hx - d.w}" y2="${d.hy}" class="door" />
                  <path d="M ${d.hx - d.w} ${d.hy} A ${d.w} ${d.w} 0 0 1 ${d.hx} ${d.hy - d.w}" class="door" />`;
        } else if (d.dir === 'right') {
          path = `<line x1="${d.hx}" y1="${d.hy}" x2="${d.hx + d.w}" y2="${d.hy}" class="door" />
                  <path d="M ${d.hx + d.w} ${d.hy} A ${d.w} ${d.w} 0 0 0 ${d.hx} ${d.hy - d.w}" class="door" />`;
        } else if (d.dir === 'up') {
          path = `<line x1="${d.hx}" y1="${d.hy}" x2="${d.hx}" y2="${d.hy - d.w}" class="door" />
                  <path d="M ${d.hx} ${d.hy - d.w} A ${d.w} ${d.w} 0 0 1 ${d.hx + d.w} ${d.hy}" class="door" />`;
        }
        return path;
      }).join('')}

      <!-- Windows -->
      ${windows.map(w => `
        <line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" class="window" />
        <line x1="${w.x1}" y1="${w.y1 - 40}" x2="${w.x2}" y2="${w.y2 - 40}" class="window-pane" />
        <line x1="${w.x1}" y1="${w.y1 + 40}" x2="${w.x2}" y2="${w.y2 + 40}" class="window-pane" />
        <line x1="${w.x1 - 80}" y1="${w.y1 - 80}" x2="${w.x1 + 80}" y2="${w.y1 + 80}" class="window-pane" />
        <line x1="${w.x2 - 80}" y1="${w.y2 - 80}" x2="${w.x2 + 80}" y2="${w.y2 + 80}" class="window-pane" />
      `).join('')}

      <!-- Room Labels -->
      ${rooms.map(r => `
        <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 20}" class="label-title">${r.name}</text>
        <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 40}" class="label-detail">${Math.round(r.w)} x ${Math.round(r.h)} mm (${r.area})</text>
      `).join('')}

      <!-- Dimension Lines (Horizontal Bottom) -->
      ${bottomDime.map(d => `
        <line x1="${d.x1}" y1="${d.offset}" x2="${d.x2}" y2="${d.offset}" class="dimension-line" />
        <line x1="${d.x1}" y1="0" x2="${d.x1}" y2="${d.offset}" class="wall-inner" style="stroke-dasharray: 10,10;" />
        <line x1="${d.x2}" y1="0" x2="${d.x2}" y2="${d.offset}" class="wall-inner" style="stroke-dasharray: 10,10;" />
        <!-- Slashes -->
        <line x1="${d.x1 - 100}" y1="${d.offset - 100}" x2="${d.x1 + 100}" y2="${d.offset + 100}" class="dimension-tick" />
        <line x1="${d.x2 - 100}" y1="${d.offset - 100}" x2="${d.x2 + 100}" y2="${d.offset + 100}" class="dimension-tick" />
        <text x="${(d.x1 + d.x2)/2}" y="${d.offset - 40}" class="dimension-text">${d.label}</text>
      `).join('')}

      <!-- Dimension Lines (Left Vertical) -->
      ${leftDime.map(d => `
        <line x1="${d.offset}" y1="${d.y1}" x2="${d.offset}" y2="${d.y2}" class="dimension-line" />
        <line x1="0" y1="${d.y1}" x2="${d.offset}" y2="${d.y1}" class="wall-inner" style="stroke-dasharray: 10,10;" />
        <line x1="0" y1="${d.y2}" x2="${d.offset}" y2="${d.y2}" class="wall-inner" style="stroke-dasharray: 10,10;" />
        <!-- Slashes -->
        <line x1="${d.offset - 100}" y1="${d.y1 - 100}" x2="${d.offset + 100}" y2="${d.y1 + 100}" class="dimension-tick" />
        <line x1="${d.offset - 100}" y1="${d.y2 - 100}" x2="${d.offset + 100}" y2="${d.y2 + 100}" class="dimension-tick" />
        <text x="${d.offset - 150}" y="${(d.y1 + d.y2)/2 + 8}" class="dimension-text" style="text-anchor: end;">${d.label}</text>
      `).join('')}

      <!-- Title Block -->
      <g transform="translate(6800, -1800)">
        <rect x="0" y="0" width="3000" height="1000" class="title-block" />
        <line x1="2000" y1="0" x2="2000" y2="1000" style="stroke: #8a8899; stroke-width: 3;" />
        <text x="100" y="300" fill="#E8C97A" font-size="90" font-weight="bold">UNIT PLAN C 009</text>
        <text x="100" y="550" fill="#F0EEE8" font-size="60">SCALE: 1:100 @ A3</text>
        <text x="100" y="750" fill="#8a8899" font-size="60">DATE: ${new Date().toISOString().slice(0, 10)}</text>
        <text x="2100" y="350" fill="#E8C97A" font-size="80" font-weight="bold">GRID OS</text>
        <text x="2100" y="750" fill="#8a8899" font-size="55">ALL DIMS IN MM</text>
      </g>

      <!-- North Arrow -->
      <g transform="translate(10300, 9300)">
        <circle cx="0" cy="0" r="250" style="stroke: #E8C97A; stroke-width: 4; fill: none;" />
        <polygon points="0,200 -80,-100 0,-20 80,-100" fill="#E8C97A" />
        <text x="0" y="380" fill="#E8C97A" font-size="90" font-weight="bold" text-anchor="middle">N</text>
      </g>
    </svg>
  </body>
  </html>
  `;

  await page.setContent(htmlContent);
  await page.setViewportSize({ width: 2400, height: 1800 });

  const destPath = path.join(process.cwd(), 'UNIT_PLAN_C009.jpg');
  await page.screenshot({ path: destPath, type: 'jpeg', quality: 95 });
  console.log(`✅ High-resolution JPEG generated at: ${destPath}`);
  
  await browser.close();
  return destPath;
}

async function main() {
  await generatePDF();
  await generateJPEG();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
