function generateElevationFromRender({ sceneDoc, render, wallFace, userMeasurements }) {
  const level = sceneDoc?.levels?.[0] || {};
  const rooms = level.rooms || [];
  const walls = level.walls || [];
  const openings = level.openings || [];
  const furniture = level.furniture || [];
  const cad = render?.cad_drawing_json || render?.cadSnapshot || null;
  const wallLengthMm = Number(userMeasurements?.wallLengthMm || render?.wallLengthMm || 0);
  const ceilingHeightMm = Number(userMeasurements?.ceilingHeightMm || render?.ceilingHeightMm || 2700);
  const selectedRoom = rooms[0] || {};
  const selectedWall = (cad?.walls || walls).find(w => w.face === wallFace) || (cad?.walls || walls)[0] || null;
  const wallOpenings = openings.filter(o => o.wallId === selectedWall?.id || o.wallId === selectedWall?.wallId);
  const wallFurniture = furniture.filter(f => f.wallId === selectedWall?.id || f.wallId === selectedWall?.wallId || (selectedWall && Math.hypot((f.x||0) - (selectedWall.x1||0), (f.y||0) - (selectedWall.y1||0)) < 1));
  const elements = wallFurniture.map(item => {
    const width = Number(item.width || userMeasurements?.moduleWidthMm || 900);
    const height = Number(item.height || userMeasurements?.moduleHeightMm || 720);
    const depth = Number(item.depth || userMeasurements?.moduleDepthMm || 600);
    const x = Number(item.xOffset || item.x || 0);
    const y = item.libraryId?.includes('wall') ? Number(userMeasurements?.wallUnitHeightMm || 1400) : 0;
    return { id: item.id, name: item.name, x, y, width, height, depth, type: item.libraryId?.includes('wall') ? 'wall' : 'base' };
  });
  const viewName = selectedWall?.face || wallFace || 'Front';
  const actualWallLengthMm = wallLengthMm || selectedWall?.lengthMm || Math.hypot((selectedWall?.x2||0) - (selectedWall?.x1||0), (selectedWall?.y2||0) - (selectedWall?.y1||0)) || 3000;
  const scale = Math.min(1200 / actualWallLengthMm, 800 / ceilingHeightMm, 1);
  const svgW = Math.max(400, Math.round(actualWallLengthMm * scale) + 160);
  const svgH = Math.max(400, Math.round(ceilingHeightMm * scale) + 160);
  const startX = 80;
  const startY = svgH - 80 - Math.round(ceilingHeightMm * scale);
  const wallW = Math.round(actualWallLengthMm * scale);
  const wallH = Math.round(ceilingHeightMm * scale);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8fafc"/>\n`;
  svg += `<rect x="${startX}" y="${startY}" width="${wallW}" height="${wallH}" fill="#ffffff" stroke="#334155" stroke-width="1.5"/>\n`;
  wallOpenings.forEach(op => {
    const opWidthPx = Math.round((Number(op.width) || 900) * scale);
    const opHeightPx = Math.round((Number(op.height) || 2100) * scale);
    const opX = startX + Math.round((Number(op.xOffset) || 0) * scale);
    const opY = startY + Math.round((Number(op.yOffset) || 0) * scale);
    svg += `<rect x="${opX}" y="${opY}" width="${opWidthPx}" height="${opHeightPx}" fill="#e2e8f0" stroke="#64748b" stroke-width="1"/>\n`;
  });
  elements.forEach(el => {
    const ex = startX + Math.round(el.x * scale);
    const ey = startY + Math.round(el.y * scale);
    const ew = Math.round(el.width * scale);
    const eh = Math.round(el.height * scale);
    const fill = el.type === 'wall' ? '#dbeafe' : '#fef9c3';
    svg += `<rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" fill="${fill}" stroke="#334155" stroke-width="1"/>\n`;
    svg += `<text x="${ex + ew/2}" y="${ey + eh/2 + 4}" text-anchor="middle" font-size="9" fill="#0f172a">${escapeXml(el.name)}</text>\n`;
  });
  svg += `<line x1="${startX}" y1="${startY - 12}" x2="${startX + wallW}" y2="${startY - 12}" stroke="#475569" stroke-width="0.8" marker-start="url(#arrow)" marker-end="url(#arrow)"/>\n`;
  svg += `<text x="${startX + wallW/2}" y="${startY - 14}" text-anchor="middle" font-size="9" fill="#475569">${actualWallLengthMm} mm</text>\n`;
  svg += `<line x1="${startX + wallW + 10}" y1="${startY}" x2="${startX + wallW + 10}" y2="${startY + wallH}" stroke="#475569" stroke-width="0.8" marker-start="url(#arrow)" marker-end="url(#arrow)"/>\n`;
  svg += `<text x="${startX + wallW + 14}" y="${startY + wallH/2 + 4}" font-size="9" fill="#475569">${ceilingHeightMm} mm</text>\n`;
  svg += `<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#475569"/></marker></defs>\n`;
  svg += `<text x="12" y="${svgH - 12}" font-size="8" fill="#64748b">ELEVATION • ${escapeXml(viewName)} • SCALE ${scale.toFixed(3)}</text>\n`;
  svg += `</svg>`;
  return {
    success: true,
    viewName,
    wallFace,
    wallLengthMm: actualWallLengthMm,
    ceilingHeightMm,
    scale,
    elements,
    openings: wallOpenings,
    dimensions: {
      widthText: `${actualWallLengthMm} mm`,
      heightText: `${ceilingHeightMm} mm`,
      areaText: `${((actualWallLengthMm * ceilingHeightMm) / 1_000_000).toFixed(2)} m²`
    },
    svg,
    pngBuffer: svgToPngBuffer(svg, svgW, svgH),
    editable: true,
    userMeasurementOverrides: userMeasurements || {}
  };
}
function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'"]+/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch] || ch));
}
function svgToPngBuffer(svg, width, height) {
  try {
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const data = Buffer.from(svg, 'utf8');
    return loadImage(data).then(() => canvas.toBuffer('image/png'));
  } catch (e) {
    return null;
  }
}
