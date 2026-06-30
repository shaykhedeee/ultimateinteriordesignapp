'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; activeSceneVersionId?: string; staleFlags?: Record<string, boolean> };
type DrawingSet = { id: string; drawingScope: string; status: string; outputs: Array<{ id: string; drawingType: string; roomRef?: string; wallRef?: string }> };
type DrawingQuality = { drawingSetId: string; status: string; checks: { hasFloorPlan: boolean; hasElevation: boolean; hasRoomLinkage: boolean }; note: string };
type ElevationPack = {
  sceneVersionId: string;
  roomCount: number;
  wallCount: number;
  totalSheets: number;
  walls: Array<{
    wallId: string;
    roomRef: string;
    roomName: string;
    side: 'internal' | 'external';
    wallLengthMm: number;
    wallHeightMm: number;
    moduleCount: number;
    svg: string;
  }>;
};
type BomPreview = {
  sceneVersionId: string;
  projectName?: string;
  generatedAt: string;
  summary: {
    totalModules: number;
    totalCarcassBoardAreaSqft: number;
    totalShutterAreaSqft: number;
    totalEdgeBandRm: number;
    totalHardwareUnits: number;
    totalEstimatedPanels: number;
  };
  moduleCards: Array<{
    moduleId: string;
    moduleName: string;
    moduleType: string;
    roomRef: string;
    wallRef?: string;
    boardSpec: string;
    edgeSpec: string;
    carcassBoardAreaSqft: number;
    shutterAreaSqft: number;
    edgeBandRm: number;
    hardwareUnits: number;
    estimatedPanels: number;
    notes: string[];
  }>;
};

export function DrawingsScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [drawingSets, setDrawingSets] = useState<DrawingSet[]>([]);
  const [quality, setQuality] = useState<DrawingQuality[]>([]);
  const [elevationPack, setElevationPack] = useState<ElevationPack | null>(null);
  const [bomPreview, setBomPreview] = useState<BomPreview | null>(null);

  async function load(projectId?: string, sceneVersionId?: string) {
    const selected = projectId ?? project?.id;
    const activeSceneVersionId = sceneVersionId ?? project?.activeSceneVersionId;
    if (!selected) return;
    const [data, qualityData] = await Promise.all([
      apiGet<DrawingSet[]>(`/projects/${selected}/drawing-sets`),
      apiGet<DrawingQuality[]>(`/projects/${selected}/drawing-quality`),
    ]);
    setDrawingSets(data);
    setQuality(qualityData);
    if (activeSceneVersionId) {
      const [pack, bom] = await Promise.all([
        apiGet<ElevationPack>(`/scenes/${activeSceneVersionId}/elevation-pack`),
        apiGet<BomPreview>(`/scenes/${activeSceneVersionId}/bom-preview`),
      ]);
      setElevationPack(pack);
      setBomPreview(bom);
    }
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id, first.activeSceneVersionId);
      })
      .catch(console.error);
  }, []);

  async function createDrawingSet() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/scenes/${project.activeSceneVersionId}/drawing-sets`, {
      drawingScope: 'room',
      roomRefs: ['room_living_1'],
      include: ['floor_plan', 'elevations', 'ceiling_plan'],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.drawings ? <StaleNotice label="Drawing outputs are stale because the scene changed." /> : null}
      <div className="workspace3">
        <Panel title="Drawing Tree">
          <div className="listMock">
            <button onClick={createDrawingSet}>Create Drawing Set</button>
            {drawingSets.map((set) => (
              <div className="rowMock" key={set.id}>
                {set.drawingScope} · {set.status}
                {set.outputs.map((output) => (
                  <div key={output.id} className="muted">{output.drawingType} · {output.roomRef ?? output.wallRef ?? 'global'}</div>
                ))}
              </div>
            ))}
          </div>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Elevation Pack Preview">
            <div className="listMock">
              <div className="rowMock">
                Sheets: {elevationPack?.totalSheets ?? 0} · Relevant walls: {elevationPack?.wallCount ?? 0} · Rooms: {elevationPack?.roomCount ?? 0}
              </div>
              {elevationPack?.walls.length ? elevationPack.walls.map((wall) => (
                <div key={`${wall.wallId}-${wall.side}`} className="rowMock">
                  <strong>{wall.roomName} · {wall.wallId} · {wall.side}</strong>
                  <div className="muted" style={{ margin: '6px 0 10px' }}>
                    {wall.wallLengthMm} mm × {wall.wallHeightMm} mm · modules {wall.moduleCount}
                  </div>
                  <div className="drawingPreview" dangerouslySetInnerHTML={{ __html: wall.svg }} />
                </div>
              )) : <div className="rowMock">No module-bearing walls yet. Place modules in the scene to generate room-specific elevation sheets.</div>}
            </div>
          </Panel>
          <Panel title="BOM Preview From Scene Geometry">
            <div className="kpiGrid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div className="kpiCard"><div className="muted">Modules</div><div>{bomPreview?.summary.totalModules ?? 0}</div></div>
              <div className="kpiCard"><div className="muted">Carcass Area</div><div>{bomPreview?.summary.totalCarcassBoardAreaSqft ?? 0} sqft</div></div>
              <div className="kpiCard"><div className="muted">Shutter Area</div><div>{bomPreview?.summary.totalShutterAreaSqft ?? 0} sqft</div></div>
              <div className="kpiCard"><div className="muted">Edge Band</div><div>{bomPreview?.summary.totalEdgeBandRm ?? 0} rm</div></div>
              <div className="kpiCard"><div className="muted">Hardware Units</div><div>{bomPreview?.summary.totalHardwareUnits ?? 0}</div></div>
              <div className="kpiCard"><div className="muted">Estimated Panels</div><div>{bomPreview?.summary.totalEstimatedPanels ?? 0}</div></div>
            </div>
            <div className="listMock" style={{ marginTop: 12 }}>
              {(bomPreview?.moduleCards ?? []).map((card) => (
                <div key={card.moduleId} className="rowMock">
                  <strong>{card.moduleName}</strong>
                  <div className="muted">{card.moduleType} · {card.roomRef} · {card.wallRef ?? 'no wall ref'}</div>
                  <div className="muted">Board: {card.boardSpec}</div>
                  <div className="muted">Edge: {card.edgeSpec}</div>
                  <div className="muted">Carcass {card.carcassBoardAreaSqft} sqft · Shutter {card.shutterAreaSqft} sqft · Edge {card.edgeBandRm} rm</div>
                  <div className="muted">Hardware {card.hardwareUnits} · Panels {card.estimatedPanels}</div>
                  {card.notes.length ? <div className="muted">Notes: {card.notes.join(', ')}</div> : null}
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Drawing Details">
          <div className="listMock">
            <div className="rowMock">Source Scene: {project?.activeSceneVersionId ?? 'n/a'}</div>
            <div className="rowMock">Stale Drawing Flag: {project?.staleFlags?.drawings ? 'Yes' : 'No'}</div>
            <div className="rowMock">BOM preview is heuristic and geometry-derived. Next phase should bind it to exact rate card + cutlist logic.</div>
            {quality.map((item) => (
              <div key={item.drawingSetId} className="rowMock">
                Set {item.drawingSetId.slice(0, 8)} · floor plan: {item.checks.hasFloorPlan ? 'yes' : 'no'} · elevation: {item.checks.hasElevation ? 'yes' : 'no'} · room linkage: {item.checks.hasRoomLinkage ? 'yes' : 'no'}
                <div className="muted">{item.note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
