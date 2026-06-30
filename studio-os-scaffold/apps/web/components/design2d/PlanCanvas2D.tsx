'use client';

import { PointerEvent, useMemo, useRef, useState } from 'react';
import type { SceneVersionDto } from '@studio/contracts';
import { useDesignEditorStore } from '../../stores/designEditorStore';
import { getModules, getRooms, getSceneBounds, getWalls } from '../../lib/scene/selectors';
import { createUpdateModuleParamsPatch } from '../../lib/scene/patches';

type Props = {
  onCommitPatch: (patch: ReturnType<typeof createUpdateModuleParamsPatch>) => Promise<void>;
  readonly?: boolean;
  baseScene?: SceneVersionDto | null;
  compareScene?: SceneVersionDto | null;
};

export function PlanCanvas2D({ onCommitPatch, readonly, baseScene, compareScene }: Props) {
  const storeSceneVersion = useDesignEditorStore((state) => state.sceneVersion);
  const sceneVersion = baseScene ?? storeSceneVersion;
  const selection = useDesignEditorStore((state) => state.selection);
  const setSelection = useDesignEditorStore((state) => state.setSelection);
  const optimisticMoveModule = useDesignEditorStore((state) => state.optimisticMoveModule);

  const rooms = useMemo(() => getRooms(sceneVersion), [sceneVersion]);
  const walls = useMemo(() => getWalls(sceneVersion), [sceneVersion]);
  const modules = useMemo(() => getModules(sceneVersion), [sceneVersion]);
  const compareModules = useMemo(() => getModules(compareScene), [compareScene]);
  const bounds = useMemo(() => getSceneBounds(sceneVersion), [sceneVersion]);

  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  function toSvgPoint(event: PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * bounds.width + bounds.minX;
    const y = ((event.clientY - rect.top) / rect.height) * bounds.height + bounds.minY;
    return { x, y };
  }

  async function handlePointerUp() {
    if (!draggingModuleId) return;
    const mod = modules.find((item) => item.moduleId === draggingModuleId);
    if (mod) {
      await onCommitPatch(
        createUpdateModuleParamsPatch(draggingModuleId, {
          widthMm: mod.geometry.size.widthMm,
          heightMm: mod.geometry.size.heightMm,
          depthMm: mod.geometry.size.depthMm,
          x: mod.geometry.anchor.x,
          y: mod.geometry.anchor.y,
        }, 'Move module in 2D plan')
      );
    }
    setDraggingModuleId(null);
  }

  return (
    <svg
      ref={svgRef}
      className="canvasMock"
      viewBox={`${bounds.minX} ${bounds.minY} ${Math.max(bounds.width, 5000)} ${Math.max(bounds.height, 4000)}`}
      onPointerMove={(event) => {
        if (!draggingModuleId || readonly) return;
        const point = toSvgPoint(event);
        optimisticMoveModule(draggingModuleId, point.x, point.y);
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ width: '100%', height: '100%', minHeight: 360 }}
    >
      {rooms.map((room) => (
        <polygon
          key={room.roomId}
          points={room.polygon2d.map((point) => `${point.x},${point.y}`).join(' ')}
          fill={selection.entityType === 'room' && selection.entityId === room.roomId ? 'rgba(200,155,69,0.22)' : 'rgba(255,255,255,0.05)'}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={20}
          onClick={() => setSelection('room', room.roomId)}
        />
      ))}

      {walls.map((wall) => (
        <line
          key={wall.wallId}
          x1={wall.start.x}
          y1={wall.start.y}
          x2={wall.end.x}
          y2={wall.end.y}
          stroke={selection.entityType === 'wall' && selection.entityId === wall.wallId ? '#e1bf72' : '#c7c7c7'}
          strokeWidth={wall.thicknessMm / 12}
          onClick={() => setSelection('wall', wall.wallId)}
        />
      ))}

      {compareModules.map((module) => {
        const { x, y } = module.geometry.anchor;
        const { widthMm, depthMm } = module.geometry.size;
        return (
          <g key={`compare-${module.moduleId}`} transform={`translate(${x}, ${y})`}>
            <rect
              x={-widthMm / 2}
              y={-depthMm / 2}
              width={widthMm}
              height={depthMm}
              fill="rgba(196,106,74,0.10)"
              stroke="rgba(196,106,74,0.7)"
              strokeDasharray="30 20"
              strokeWidth={12}
              rx={40}
            />
          </g>
        );
      })}

      {modules.map((module) => {
        const { x, y } = module.geometry.anchor;
        const { widthMm, depthMm } = module.geometry.size;
        return (
          <g
            key={module.moduleId}
            transform={`translate(${x}, ${y})`}
            onPointerDown={() => {
              setSelection('module', module.moduleId);
              if (!readonly) setDraggingModuleId(module.moduleId);
            }}
            onClick={() => setSelection('module', module.moduleId)}
            style={{ cursor: readonly ? 'default' : 'move' }}
          >
            <rect
              x={-widthMm / 2}
              y={-depthMm / 2}
              width={widthMm}
              height={depthMm}
              fill={selection.entityType === 'module' && selection.entityId === module.moduleId ? 'rgba(125,187,116,0.35)' : 'rgba(125,187,116,0.18)'}
              stroke="rgba(125,187,116,0.8)"
              strokeWidth={16}
              rx={40}
            />
            <text x={0} y={0} fill="#f4f0e8" textAnchor="middle" fontSize={120}>{module.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
