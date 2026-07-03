import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const storageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../storage');

export const STYLE_PRESETS = {
  technical_clean: {
    id: 'technical_clean',
    label: 'Technical Clean',
    background: '#ffffff',
    backgroundGrid: false,
    wallExteriorStroke: '#111827',
    wallExteriorWidth: 4,
    wallInteriorStroke: '#4b5563',
    wallInteriorWidth: 2,
    roomFill: 'transparent',
    roomStroke: '#9ca3af',
    roomStrokeWidth: 1,
    roomFillOpacity: 0,
    labelColor: '#111827',
    labelFont: 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 12px;',
    openingColor: '#111827',
    openingWidth: 2,
    symbolColor: '#111827',
    dimensionColor: '#374151',
    dimensionFont: 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 10px;',
    gridStep: 50,
    padding: 60
  },
  presentation_minimal: {
    id: 'presentation_minimal',
    label: 'Presentation Minimal',
    background: '#f8fafc',
    backgroundGrid: false,
    wallExteriorStroke: '#0f172a',
    wallExteriorWidth: 5,
    wallInteriorStroke: '#334155',
    wallInteriorWidth: 2.5,
    roomFill: '#ffffff',
    roomStroke: '#e2e8f0',
    roomStrokeWidth: 1.5,
    roomFillOpacity: 0.85,
    labelColor: '#0f172a',
    labelFont: 'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 13px; font-weight: 600;',
    openingColor: '#0f172a',
    openingWidth: 2.5,
    symbolColor: '#475569',
    dimensionColor: '#64748b',
    dimensionFont: 'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px;',
    gridStep: 0,
    padding: 80
  },
  soft_zoning: {
    id: 'soft_zoning',
    label: 'Soft Zoning',
    background: '#0f172a',
    backgroundGrid: true,
    wallExteriorStroke: '#e2e8f0',
    wallExteriorWidth: 5,
    wallInteriorStroke: '#94a3b8',
    wallInteriorWidth: 2.5,
    roomFill: '#1e293b',
    roomStroke: '#38bdf8',
    roomStrokeWidth: 1.5,
    roomFillOpacity: 0.95,
    labelColor: '#f1f5f9',
    labelFont: 'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 600;',
    openingColor: '#38bdf8',
    openingWidth: 2.5,
    symbolColor: '#7dd3fc',
    dimensionColor: '#94a3b8',
    dimensionFont: 'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px;',
    gridStep: 40,
    padding: 80,
    gridColor: '#334155'
  }
};

/**
 * @typedef {Object} CanonicalRenderOptions
 * @property {any} manifest
 * @property {keyof typeof STYLE_PRESETS} [preset]
 * @property {boolean} [includeDimensions]
 * @property {boolean} [includeFurniturePlaceholders]
 * @property {string} [title]
 */

function computeBounds(manifest) {
  const points = [];

  const addPoint = (x, y) => points.push({ x, y });

  (manifest.rooms || []).forEach((room) => {
    (room.points || []).forEach((p) => addPoint(p.x, p.y));
  });

  (manifest.walls || []).forEach((w) => {
    addPoint(w.x1, w.y1);
    addPoint(w.x2, w.y2);
  });

  (manifest.openings || []).forEach((o) => addPoint(o.x, o.y));

  (manifest.symbols || []).forEach((s) => addPoint(s.x, s.y));

  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };
  }

  const minX = Math.floor(Math.min(...points.map((p) => p.x)));
  const minY = Math.floor(Math.min(...points.map((p) => p.y)));
  const maxX = Math.ceil(Math.max(...points.map((p) => p.x)));
  const maxY = Math.ceil(Math.max(...points.map((p) => p.y)));

  return {
    minX: minX - 40,
    minY: minY - 40,
    maxX: maxX + 40,
    maxY: maxY + 40,
    width: maxX - minX + 80,
    height: maxY - minY + 80
  };
}

function normalize(value, min, max) {
  if (max === min) return 0;
  return value - min;
}

function escapeXml(value) {
  return String(value ?? '')
    .split('&').join('&')
    .split('<').join('<')
    .split('>').join('>')
    .split('"').join('"')
    .split("'").join("'");
}

function toSvgPoint(p, bounds) {
  return {
    x: normalize(p.x, bounds.minX, bounds.maxX),
    y: normalize(p.y, bounds.minY, bounds.maxY)
  };
}

function renderBackground(svg, style, bounds) {
  svg.push(
    `<rect x="0" y="0" width="${bounds.width}" height="${bounds.height}" fill="${style.background}" />`
  );

  if (style.gridStep && style.gridStep > 0) {
    const gridColor = style.gridColor || style.wallInteriorStroke || '#e5e7eb';
    const stepsX = Math.floor(bounds.width / style.gridStep);
    const stepsY = Math.floor(bounds.height / style.gridStep);
    const frags = [];
    for (let i = 1; i < stepsX; i++) {
      const x = +(i * style.gridStep).toFixed(2);
      frags.push(`<line x1="${x}" y1="0" x2="${x}" y2="${bounds.height}" stroke="${gridColor}" stroke-width="0.4" opacity="0.35" />`);
    }
    for (let i = 1; i < stepsY; i++) {
      const y = +(i * style.gridStep).toFixed(2);
      frags.push(`<line x1="0" y1="${y}" x2="${bounds.width}" y2="${y}" stroke="${gridColor}" stroke-width="0.4" opacity="0.35" />`);
    }
    svg.push(`<g id="grid">${frags.join('')}</g>`);
  }
}

function renderWalls(svg, style, manifest, bounds) {
  const walls = manifest.walls || [];
  const exterior = walls.filter((w) => String(w.material || '').toLowerCase() === 'brick');
  const interior = walls.filter((w) => String(w.material || '').toLowerCase() !== 'brick');

  const drawLine = (w, stroke, width) => {
    const a = toSvgPoint({ x: w.x1, y: w.y1 }, bounds);
    const b = toSvgPoint({ x: w.x2, y: w.y2 }, bounds);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${escapeXml(stroke)}" stroke-width="${width}" stroke-linecap="square" data-confidence="${w.confidence ?? ''}" />`;
  };

  if (exterior.length) {
    svg.push(`<g id="exterior-walls">${exterior.map((w) => drawLine(w, style.wallExteriorStroke, style.wallExteriorWidth)).join('')}</g>`);
  }
  if (interior.length) {
    svg.push(`<g id="interior-walls">${interior.map((w) => drawLine(w, style.wallInteriorStroke, style.wallInteriorWidth)).join('')}</g>`);
  }
  if (!exterior.length && walls.length) {
    svg.push(`<g id="walls">${walls.map((w) => drawLine(w, style.wallInteriorStroke, style.wallInteriorWidth)).join('')}</g>`);
  }
}

function renderOpenings(svg, style, manifest, bounds) {
  const openings = manifest.openings || [];
  if (!openings.length) return;

  const parts = openings.map((o) => {
    const p = toSvgPoint({ x: o.x, y: o.y }, bounds);
    const width = Math.max(12, Math.round((o.width / 25) * 2));
    const color = escapeXml(style.openingColor);
    let mark;
    if (o.type === 'door') {
      mark = `<rect x="${p.x - width / 2}" y="${p.y - 1}" width="${width}" height="2" fill="${color}" opacity="0.9" />
              <path d="M ${p.x - width / 2} ${p.y} A ${width} ${width} 0 0 1 ${p.x + width / 2} ${p.y}" fill="none" stroke="${color}" stroke-width="1.2" />`;
    } else {
      mark = `<rect x="${p.x - width / 2}" y="${p.y - 2}" width="${width}" height="4" rx="1" fill="none" stroke="${color}" stroke-width="1.4" />`;
    }
    return `${mark}<title>${escapeXml(o.type || 'opening')}: ${escapeXml(o.style || '')} (${(o.confidence * 100).toFixed(0)}%)</title>`;
  });

  svg.push(`<g id="openings">${parts.join('')}</g>`);
}

function renderRooms(svg, style, manifest, bounds) {
  const rooms = manifest.rooms || [];
  const group = [];

  rooms.forEach((room) => {
    const points = (room.points || []).map((p) => {
      const s = toSvgPoint(p, bounds);
      return `${s.x},${s.y}`;
    });

    if (!points.length) return;

    const fill = style.roomFill === 'transparent' ? 'none' : escapeXml(room.color || style.roomFill);
    const fillOpacity = style.roomFill === 'transparent' ? '0' : `${style.roomFillOpacity ?? 0.08}`;
    const stroke = escapeXml(room.color || style.roomStroke);

    group.push(
      `<polygon points="${points.join(' ')}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${style.roomStrokeWidth}" stroke-linejoin="round" data-confidence="${room.confidence ?? ''}" />`
    );

    if (room.points.length >= 3) {
      const centroid = room.points.reduce(
        (acc, p) => ({ x: acc.x + p.x / room.points.length, y: acc.y + p.y / room.points.length }),
        { x: 0, y: 0 }
      );
      const cp = toSvgPoint(centroid, bounds);
      group.push(
        `<text x="${cp.x}" y="${cp.y}" fill="${escapeXml(style.labelColor)}" text-anchor="middle" dominant-baseline="middle" style="${style.labelFont}">${escapeXml(room.name || room.type || 'Room')}</text>`
      );
    }
  });

  svg.push(`<g id="rooms">${group.join('')}</g>`);
}

function renderFixedElements(svg, style, manifest, bounds) {
  const symbols = manifest.symbols || [];
  if (!symbols.length) return;

  const parts = symbols.map((s) => {
    const p = toSvgPoint({ x: s.x, y: s.y }, bounds);
    const color = escapeXml(style.symbolColor);
    const label = escapeXml([s.type, s.room].filter(Boolean).join(' - '));
    return `<g id="symbol-${escapeXml(s.id || s.type)}">
      <circle cx="${p.x}" cy="${p.y}" r="5" fill="${color}" opacity="0.15" />
      <circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" />
      <text x="${p.x + 7}" y="${p.y + 3}" fill="${color}" font-size="10" style="${style.labelFont}">${label || s.type}</text>
    </g>`;
  });

  svg.push(`<g id="fixed-elements">${parts.join('')}</g>`);
}

function renderFurniturePlaceholders(svg, style, manifest, bounds) {
  const levels = manifest.levels || [];
  const furniture = levels[0]?.furniture || manifest.furniture || [];
  if (!furniture.length) return;

  const parts = furniture.map((f) => {
    const cx = normalize(f.x, bounds.minX, bounds.maxX);
    const cy = normalize(f.y, bounds.minY, bounds.maxY);
    const w = Math.max(8, +(f.width / 25).toFixed(1));
    const h = Math.max(8, +(f.height / 25).toFixed(1));
    const fill = escapeXml(f.color || '#94a3b8');
    const label = escapeXml(f.name || f.libraryId || 'module');
    return `<g id="furniture-${escapeXml(f.id || label)}">
      <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="2" fill="${fill}" fill-opacity="0.25" stroke="${fill}" stroke-width="1" />
      <text x="${cx}" y="${cy}" fill="${escapeXml(style.labelColor)}" text-anchor="middle" dominant-baseline="middle" font-size="9" style="${style.labelFont}">${label}</text>
    </g>`;
  });

  svg.push(`<g id="furniture-placeholders">${parts.join('')}</g>`);
}

function renderDimensions(svg, style, manifest, bounds) {
  const dimensions = manifest.dimensions || [];
  if (!dimensions.length) return;

  const parts = dimensions.map((d) => {
    const a = toSvgPoint(d.fromPoint, bounds);
    const b = toSvgPoint(d.toPoint, bounds);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const distanceMm = typeof d.distanceMm === 'number' ? d.distanceMm : null;
    const text = distanceMm !== null ? `${(distanceMm / 1000).toFixed(2)}m` : '';
    const confidence = typeof d.confidence === 'number' ? ` (${(d.confidence * 100).toFixed(0)}%)` : '';
    return `<g id="dimension-${escapeXml(d.id || 'dim')}">
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${escapeXml(style.dimensionColor)}" stroke-width="1" stroke-dasharray="3 2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
      <rect x="${mx - 22}" y="${my - 9}" width="44" height="18" rx="4" fill="${escapeXml(style.background)}" fill-opacity="0.85" />
      <text x="${mx}" y="${my + 4}" fill="${escapeXml(style.dimensionColor)}" text-anchor="middle" font-size="10" style="${style.dimensionFont}">${escapeXml(text + confidence)}</text>
    </g>`;
  });

  svg.push(`<g id="dimensions">${parts.join('')}</g>`);
}

function buildDefs(style) {
  const markerId = 'arrow';
  const color = escapeXml(style.wallInteriorStroke || '#4b5563');
  return `<defs>
  <marker id="${markerId}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
    <path d="M 0 0 L 6 3 L 0 6 z" fill="${color}" />
  </marker>
</defs>`;
}

export function generateCanonicalSvg(options) {
  const manifest = options.manifest || {};
  const style = STYLE_PRESETS[options.preset || 'technical_clean'] || STYLE_PRESETS.technical_clean;
  const bounds = computeBounds(manifest);

  const svg = [];
  svg.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}" role="img" aria-label="${escapeXml(options.title || 'Canonical floorplan top view')}">`);
  svg.push(buildDefs(style));
  svg.push(`<title>${escapeXml(options.title || 'Canonical floorplan top view')}</title>`);
  renderBackground(svg, style, bounds);
  renderWalls(svg, style, manifest, bounds);
  renderOpenings(svg, style, manifest, bounds);
  renderRooms(svg, style, manifest, bounds);
  renderFixedElements(svg, style, manifest, bounds);

  if (options.includeFurniturePlaceholders) {
    renderFurniturePlaceholders(svg, style, manifest, bounds);
  }

  if (options.includeDimensions) {
    renderDimensions(svg, style, manifest, bounds);
  }

  svg.push(`<text x="${style.padding / 2}" y="${bounds.height - 20}" fill="${escapeXml(style.dimensionColor)}" font-size="10" style="${style.dimensionFont}">Canonical • ${escapeXml(style.id)} • ${new Date().toISOString().slice(0, 10)}</text>`);
  svg.push(`</svg>`);

  return {
    svg: svg.join('\n'),
    bounds,
    preset: style.id
  };
}

export async function writeCanonicalAssets(options) {
  const { svg, bounds, preset } = generateCanonicalSvg(options);

  const presetDir = path.join(storageDir, 'analysis', String(options.projectId || 'unknown'));
  await fs.mkdir(presetDir, { recursive: true });

  const svgPath = path.join(presetDir, 'canonical_topview.svg');
  const pngPath = path.join(presetDir, 'canonical_topview.png');

  await fs.writeFile(svgPath, svg, 'utf8');

  let pngBuffer = null;
  try {
    const sharp = await import('sharp');
    pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    await fs.writeFile(pngPath, pngBuffer);
  } catch (err) {
    console.warn('[canonical-renderer] PNG export skipped:', err.message);
  }

  const makeUrl = (filePath) => `/storage/analysis/${options.projectId}/${path.basename(filePath)}`;

  return {
    svgUrl: makeUrl(svgPath),
    pngUrl: pngBuffer ? makeUrl(pngPath) : null,
    preset,
    bounds
  };
}
