'use client';

import { useMemo } from 'react';
import type { SceneVersionDto } from '@studio/contracts';
import { useDesignEditorStore } from '../../stores/designEditorStore';
import { getModules, getRooms, getSceneBounds, getWalls } from '../../lib/scene/selectors';

function isoProject(x: number, y: number, z: number) {
  return {
    x: (x - y) * 0.2,
    y: (x + y) * 0.1 - z * 0.18,
  };
}

export function IsoScenePreview3D({ compareScene, baseScene }: { compareScene?: SceneVersionDto | null; baseScene?: SceneVersionDto | null }) {
  const storeSceneVersion = useDesignEditorStore((state) => state.sceneVersion);
  const sceneVersion = baseScene ?? storeSceneVersion;
  const selection = useDesignEditorStore((state) => state.selection);
  const setSelection = useDesignEditorStore((state) => state.setSelection);

  const rooms = useMemo(() => getRooms(sceneVersion), [sceneVersion]);
  const walls = useMemo(() => getWalls(sceneVersion), [sceneVersion]);
  const modules = useMemo(() => getModules(sceneVersion), [sceneVersion]);
  const compareModules = useMemo(() => getModules(compareScene), [compareScene]);
  const bounds = useMemo(() => getSceneBounds(sceneVersion), [sceneVersion]);

  const projectedBounds = useMemo(() => {
    const corners = [
      isoProject(bounds.minX, bounds.minY, 0),
      isoProject(bounds.maxX, bounds.minY, 0),
      isoProject(bounds.maxX, bounds.maxY, 0),
      isoProject(bounds.minX, bounds.maxY, 0),
    ];
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    return {
      minX: Math.min(...xs) - 600,
      minY: Math.min(...ys) - 600,
      width: Math.max(...xs) - Math.min(...xs) + 1200,
      height: Math.max(...ys) - Math.min(...ys) + 1200,
    };
  }, [bounds]);

  return (
    <svg
      className="canvasMock"
      viewBox={`${projectedBounds.minX} ${projectedBounds.minY} ${projectedBounds.width} ${projectedBounds.height}`}
      style={{ width: '100%', height: '100%', minHeight: 360 }}
    >
      {rooms.map((room) => {
        const floorPath = room.polygon2d.map((point) => {
          const p = isoProject(point.x, point.y, 0);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon
            key={room.roomId}
            points={floorPath}
            fill={selection.entityType === 'room' && selection.entityId === room.roomId ? 'rgba(200,155,69,0.28)' : 'rgba(255,255,255,0.05)'}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={20}
            onClick={() => setSelection('room', room.roomId)}
          />
        );
      })}

      {walls.map((wall) => {
        const a = isoProject(wall.start.x, wall.start.y, 0);
        const b = isoProject(wall.end.x, wall.end.y, 0);
        const c = isoProject(wall.end.x, wall.end.y, wall.heightMm);
        const d = isoProject(wall.start.x, wall.start.y, wall.heightMm);
        return (
          <polygon
            key={wall.wallId}
            points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`}
            fill={selection.entityType === 'wall' && selection.entityId === wall.wallId ? 'rgba(225,191,114,0.28)' : 'rgba(180,180,180,0.10)'}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={10}
            onClick={() => setSelection('wall', wall.wallId)}
          />
        );
      })}

      {compareModules.map((module) => {
        const { x, y, z } = module.geometry.anchor;
        const { widthMm, depthMm, heightMm } = module.geometry.size;
        const halfW = widthMm / 2;
        const halfD = depthMm / 2;
        const corners = [
          { x: x - halfW, y: y - halfD, z },
          { x: x + halfW, y: y - halfD, z },
          { x: x + halfW, y: y + halfD, z },
          { x: x - halfW, y: y + halfD, z },
        ];
        const topCorners = corners.map((corner) => ({ ...corner, z: heightMm }));
        const top = topCorners.map((corner) => isoProject(corner.x, corner.y, corner.z));
        const front = [corners[0], corners[1], topCorners[1], topCorners[0]].map((corner) => isoProject(corner.x, corner.y, corner.z));
        const side = [corners[1], corners[2], topCorners[2], topCorners[1]].map((corner) => isoProject(corner.x, corner.y, corner.z));
        return (
          <g key={`compare-${module.moduleId}`}>
            <polygon points={top.map((p) => `${p.x},${p.y}`).join(' ')} fill={'rgba(196,106,74,0.18)'} />
            <polygon points={front.map((p) => `${p.x},${p.y}`).join(' ')} fill={'rgba(196,106,74,0.12)'} />
            <polygon points={side.map((p) => `${p.x},${p.y}`).join(' ')} fill={'rgba(196,106,74,0.09)'} />
          </g>
        );
      })}

      {modules.map((module) => {
        const { x, y, z } = module.geometry.anchor;
        const { widthMm, depthMm, heightMm } = module.geometry.size;
        const halfW = widthMm / 2;
        const halfD = depthMm / 2;

        const corners = [
          { x: x - halfW, y: y - halfD, z },
          { x: x + halfW, y: y - halfD, z },
          { x: x + halfW, y: y + halfD, z },
          { x: x - halfW, y: y + halfD, z },
        ];
        const topCorners = corners.map((corner) => ({ ...corner, z: heightMm }));
        const top = topCorners.map((corner) => isoProject(corner.x, corner.y, corner.z));
        const front = [corners[0], corners[1], topCorners[1], topCorners[0]].map((corner) => isoProject(corner.x, corner.y, corner.z));
        const side = [corners[1], corners[2], topCorners[2], topCorners[1]].map((corner) => isoProject(corner.x, corner.y, corner.z));

        const selected = selection.entityType === 'module' && selection.entityId === module.moduleId;

        return (
          <g key={module.moduleId} onClick={() => setSelection('module', module.moduleId)}>
            <polygon points={top.map((p) => `${p.x},${p.y}`).join(' ')} fill={selected ? 'rgba(125,187,116,0.45)' : 'rgba(125,187,116,0.25)'} />
            <polygon points={front.map((p) => `${p.x},${p.y}`).join(' ')} fill={selected ? 'rgba(90,150,90,0.45)' : 'rgba(90,150,90,0.25)'} />
            <polygon points={side.map((p) => `${p.x},${p.y}`).join(' ')} fill={selected ? 'rgba(60,110,60,0.45)' : 'rgba(60,110,60,0.25)'} />
          </g>
        );
      })}
    </svg>
  );
}
