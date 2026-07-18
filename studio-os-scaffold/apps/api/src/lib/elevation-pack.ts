import type { SceneModule, SceneRoom, SceneVersionDto } from '@studio/contracts';

function getFirstLevel(sceneVersion: SceneVersionDto) {
  return sceneVersion.scene.levels[0] ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getWallLengthMm(wall: { start: { x: number; y: number }; end: { x: number; y: number } }) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  return Math.max(Math.sqrt(dx * dx + dy * dy), 1);
}

function projectAnchorAlongWallMm(
  wall: { start: { x: number; y: number }; end: { x: number; y: number } },
  module: SceneModule
) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = getWallLengthMm(wall);
  const ux = dx / length;
  const uy = dy / length;
  const px = module.geometry.anchor.x - wall.start.x;
  const py = module.geometry.anchor.y - wall.start.y;
  return px * ux + py * uy;
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildWallElevationSvg({
  room,
  wall,
  modules,
  openings = [],
  side,
  projectName,
  sceneVersionNumber,
  sheetNumber,
}: {
  room: SceneRoom;
  wall: {
    wallId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    heightMm: number;
  };
  modules: SceneModule[];
  openings?: any[];
  side: 'internal' | 'external';
  projectName?: string;
  sceneVersionNumber?: number;
  sheetNumber: number;
}) {
  const wallLengthMm = getWallLengthMm(wall);
  const scale = 0.04;
  const widthPx = Math.max(Math.round(wallLengthMm * scale), 460);
  const heightPx = Math.max(Math.round(wall.heightMm * scale), 240);
  const padding = 36;
  const titleBlockHeight = 64;
  const totalWidth = widthPx + padding * 2 + 80;
  const totalHeight = heightPx + padding * 2 + 90 + titleBlockHeight;

  // Render modules
  const rects = modules
    .map((module, index) => {
      const centerAlongWallMm = projectAnchorAlongWallMm(wall, module);
      const widthMm = module.geometry.size.widthMm;
      const heightMm = module.geometry.size.heightMm;
      const leftMm = clamp(centerAlongWallMm - widthMm / 2, 0, Math.max(wallLengthMm - widthMm, 0));
      const topMm = Math.max(wall.heightMm - (module.geometry.anchor.z + heightMm), 0);
      const leftPxRaw = leftMm * scale;
      const widthPxRaw = Math.max(widthMm * scale, 12);
      const leftPx = side === 'external' ? widthPx - leftPxRaw - widthPxRaw : leftPxRaw;
      const topPx = topMm * scale;
      const heightPxRaw = Math.max(heightMm * scale, 16);

      return {
        index: index + 1,
        id: module.moduleId,
        name: module.name,
        leftMm,
        widthMm,
        heightMm,
        leftPx,
        topPx,
        widthPx: widthPxRaw,
        heightPx: heightPxRaw,
      };
    })
    .sort((a, b) => a.leftMm - b.leftMm);

  const moduleSvg = rects
    .map(
      (rect) => `
      <g>
        <rect x="${padding + rect.leftPx}" y="${padding + rect.topPx}" width="${rect.widthPx}" height="${rect.heightPx}" fill="rgba(125,187,116,0.18)" stroke="#7dbb74" stroke-width="2" rx="6" />
        <circle cx="${padding + rect.leftPx + 14}" cy="${padding + rect.topPx + 14}" r="11" fill="#e1bf72" />
        <text x="${padding + rect.leftPx + 14}" y="${padding + rect.topPx + 18}" text-anchor="middle" font-size="11" fill="#0d1110">${rect.index}</text>
        <text x="${padding + rect.leftPx + rect.widthPx / 2}" y="${padding + rect.topPx - 6}" text-anchor="middle" font-size="12" fill="#d9ead3">${escapeText(rect.name)}</text>
      </g>`
    )
    .join('');

  // Render architectural wall openings (doors, windows)
  const openingsSvg = openings
    .map((opening, idx) => {
      const offsetMm = opening.offsetFromStartMm ?? 500;
      const widthMm = opening.widthMm ?? 900;
      const sillHeightMm = opening.sillHeightMm ?? 0;
      const headHeightMm = opening.headHeightMm ?? 2100;
      const heightMm = headHeightMm - sillHeightMm;

      const leftMm = clamp(offsetMm, 0, Math.max(wallLengthMm - widthMm, 0));
      const topMm = Math.max(wall.heightMm - headHeightMm, 0);

      const leftPxRaw = leftMm * scale;
      const widthPxRaw = Math.max(widthMm * scale, 12);
      const leftPx = side === 'external' ? widthPx - leftPxRaw - widthPxRaw : leftPxRaw;
      const topPx = topMm * scale;
      const heightPxRaw = Math.max(heightMm * scale, 16);

      const color = opening.openingType === 'door' ? '#ff6f6f' : '#6fa8ff';
      const label = opening.openingType.toUpperCase();

      return `
      <g key="opening-${idx}">
        <rect x="${padding + leftPx}" y="${padding + topPx}" width="${widthPxRaw}" height="${heightPxRaw}" fill="rgba(255,111,111,0.03)" stroke="${color}" stroke-width="1.8" stroke-dasharray="6 3" />
        <text x="${padding + leftPx + widthPxRaw / 2}" y="${padding + topPx + heightPxRaw / 2}" text-anchor="middle" font-size="10" fill="${color}" font-weight="600">${label} (${Math.round(widthMm)} mm)</text>
        ${
          opening.openingType === 'door'
            ? `<line x1="${padding + leftPx}" y1="${padding + topPx}" x2="${padding + leftPx + widthPxRaw}" y2="${padding + topPx + heightPxRaw}" stroke="${color}" stroke-dasharray="1 3" opacity="0.6" />`
            : `<line x1="${padding + leftPx}" y1="${padding + topPx + heightPxRaw / 2}" x2="${padding + leftPx + widthPxRaw}" y2="${padding + topPx + heightPxRaw / 2}" stroke="${color}" stroke-width="0.8" opacity="0.5" />`
        }
      </g>`;
    })
    .join('');

  const moduleDimensionChains = rects
    .map(
      (rect, index) => {
        const y = padding + heightPx + 28 + index * 18;
        const x1 = padding + rect.leftPx;
        const x2 = padding + rect.leftPx + rect.widthPx;
        return `
        <line x1="${x1}" y1="${padding + heightPx}" x2="${x1}" y2="${y}" stroke="#9b9b9b" stroke-width="1" />
        <line x1="${x2}" y1="${padding + heightPx}" x2="${x2}" y2="${y}" stroke="#9b9b9b" stroke-width="1" />
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#9b9b9b" stroke-width="1" />
        <text x="${(x1 + x2) / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="#cfcfcf">M${rect.index} ${Math.round(rect.widthMm)} mm</text>`;
      }
    )
    .join('');

  const dimensionTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => {
      const x = padding + widthPx * fraction;
      const mm = Math.round(wallLengthMm * fraction);
      return `
      <line x1="${x}" y1="${padding + heightPx + 8}" x2="${x}" y2="${padding + heightPx + 18}" stroke="#8a8a8a" stroke-width="1" />
      <text x="${x}" y="${padding + heightPx + 32}" text-anchor="middle" font-size="10" fill="#8a8a8a">${mm}</text>`;
    })
    .join('');

  const titleY = totalHeight - titleBlockHeight;
  const sheetLabel = `EL-${String(sheetNumber).padStart(2, '0')}`;
  const orientationName = side === 'internal' ? 'INTERNAL ELEVATION' : 'EXTERNAL ELEVATION';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%">
    <rect x="0" y="0" width="100%" height="100%" fill="#0d1110" />
    <rect x="12" y="12" width="${totalWidth - 24}" height="${totalHeight - 24}" fill="none" stroke="#f4f0e8" stroke-width="1.5" />
    <text x="${padding}" y="20" font-size="14" fill="#f4f0e8" font-family="Inter, Arial, sans-serif">${escapeText(room.name)} · ${escapeText(wall.wallId)} · ${orientationName}</text>
    <rect x="${padding}" y="${padding}" width="${widthPx}" height="${heightPx}" fill="none" stroke="#f4f0e8" stroke-width="2" />
    <text x="${padding + widthPx / 2}" y="${padding - 10}" text-anchor="middle" font-size="11" fill="#e1bf72">Overall wall length ${Math.round(wallLengthMm)} mm</text>
    <text x="${padding + widthPx + 18}" y="${padding + heightPx / 2}" font-size="11" fill="#e1bf72" transform="rotate(90 ${padding + widthPx + 18} ${padding + heightPx / 2})">Overall wall height ${Math.round(wall.heightMm)} mm</text>
    
    ${openingsSvg}
    ${moduleSvg}
    
    <line x1="${padding}" y1="${padding + heightPx + 12}" x2="${padding + widthPx}" y2="${padding + heightPx + 12}" stroke="#8a8a8a" stroke-width="1" />
    ${dimensionTicks}
    ${moduleDimensionChains}

    <g>
      <rect x="12" y="${titleY}" width="${totalWidth - 24}" height="${titleBlockHeight - 12}" fill="none" stroke="#f4f0e8" stroke-width="1.2" />
      <line x1="${totalWidth * 0.45}" y1="${titleY}" x2="${totalWidth * 0.45}" y2="${totalHeight - 12}" stroke="#f4f0e8" stroke-width="1" />
      <line x1="${totalWidth * 0.7}" y1="${titleY}" x2="${totalWidth * 0.7}" y2="${totalHeight - 12}" stroke="#f4f0e8" stroke-width="1" />
      <text x="24" y="${titleY + 18}" font-size="11" fill="#e1bf72">PROJECT</text>
      <text x="24" y="${titleY + 36}" font-size="12" fill="#f4f0e8">${escapeText(projectName ?? 'StudioOS Interior Project')}</text>
      <text x="${totalWidth * 0.45 + 12}" y="${titleY + 18}" font-size="11" fill="#e1bf72">DRAWING</text>
      <text x="${totalWidth * 0.45 + 12}" y="${titleY + 36}" font-size="12" fill="#f4f0e8">${escapeText(room.name)} ${escapeText(wall.wallId)} ${orientationName}</text>
      <text x="${totalWidth * 0.7 + 12}" y="${titleY + 18}" font-size="11" fill="#e1bf72">SHEET / SCALE</text>
      <text x="${totalWidth * 0.7 + 12}" y="${titleY + 36}" font-size="12" fill="#f4f0e8">${sheetLabel} · Scale NTS · Scene v${sceneVersionNumber ?? 1}</text>
      <text x="${totalWidth * 0.7 + 12}" y="${titleY + 52}" font-size="10" fill="#cfcfcf">Generated ${new Date().toLocaleDateString('en-IN')}</text>
    </g>
  </svg>`;
}

export function generateElevationPack(
  sceneVersion: SceneVersionDto,
  metadata?: { projectName?: string; sceneVersionNumber?: number }
) {
  const level = getFirstLevel(sceneVersion);
  if (!level) {
    return {
      sceneVersionId: sceneVersion.id,
      roomCount: 0,
      wallCount: 0,
      totalSheets: 0,
      walls: [],
    };
  }

  const roomsById = new Map(level.rooms.map((room) => [room.roomId, room]));
  const relevantWalls = level.walls.filter((wall) =>
    level.modules.some((module) => module.wallRef === wall.wallId || module.geometry.anchor.wallId === wall.wallId)
  );

  let sheetNumber = 1;
  const walls = relevantWalls.flatMap((wall) => {
    const room = roomsById.get(wall.roomIdPrimary);
    if (!room) return [];
    
    const modules = level.modules.filter(
      (module) => module.wallRef === wall.wallId || module.geometry.anchor.wallId === wall.wallId
    );

    const openings = level.openings ? level.openings.filter((o) => o.wallId === wall.wallId) : [];

    return (['internal', 'external'] as const).map((side) => {
      const currentSheet = sheetNumber;
      sheetNumber += 1;
      return {
        wallId: wall.wallId,
        roomRef: room.roomId,
        roomName: room.name,
        side,
        wallLengthMm: Math.round(getWallLengthMm(wall)),
        wallHeightMm: wall.heightMm,
        moduleCount: modules.length,
        sheetNumber: currentSheet,
        modules: modules.map((module) => ({
          moduleId: module.moduleId,
          name: module.name,
          moduleType: module.moduleType,
          widthMm: module.geometry.size.widthMm,
          heightMm: module.geometry.size.heightMm,
          depthMm: module.geometry.size.depthMm,
        })),
        svg: buildWallElevationSvg({
          room,
          wall,
          modules,
          openings,
          side,
          projectName: metadata?.projectName,
          sceneVersionNumber: metadata?.sceneVersionNumber,
          sheetNumber: currentSheet,
        }),
      };
    });
  });

  return {
    sceneVersionId: sceneVersion.id,
    roomCount: new Set(walls.map((item) => item.roomRef)).size,
    wallCount: new Set(walls.map((item) => item.wallId)).size,
    totalSheets: walls.length,
    walls,
  };
}
