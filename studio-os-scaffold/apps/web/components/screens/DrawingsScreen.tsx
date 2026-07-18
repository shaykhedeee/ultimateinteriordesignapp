'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; activeSceneVersionId?: string; staleFlags?: Record<string, boolean> };
type DrawingSet = { id: string; drawingScope: string; status: string; outputs: Array<{ id: string; drawingType: string; roomRef?: string; wallRef?: string }> };
type DrawingQuality = { drawingSetId: string; status: string; checks: { hasFloorPlan: boolean; hasElevation: boolean; hasRoomLinkage: boolean }; note: string };

type ElevationWallSheet = {
  wallId: string;
  roomRef: string;
  roomName: string;
  side: 'internal' | 'external';
  wallLengthMm: number;
  wallHeightMm: number;
  moduleCount: number;
  sheetNumber: number;
  svg: string;
  modules: Array<{ moduleId: string; name: string; moduleType: string; widthMm: number; heightMm: number; depthMm: number }>;
};

type ElevationPack = {
  sceneVersionId: string;
  roomCount: number;
  wallCount: number;
  totalSheets: number;
  walls: ElevationWallSheet[];
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
  
  // Selection state for sheets
  const [selectedSheetNumber, setSelectedSheetNumber] = useState<number>(1);

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

  const currentSheet = elevationPack?.walls.find((w) => w.sheetNumber === selectedSheetNumber) ?? elevationPack?.walls[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.drawings ? <StaleNotice label="Drawing outputs are stale because the scene changed." /> : null}
      <div className="workspace3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Drawing Tree">
            <div className="listMock">
              <button onClick={createDrawingSet}>Create Drawing Set</button>
              {drawingSets.map((set) => (
                <div className="rowMock" key={set.id}>
                  {set.drawingScope.toUpperCase()} SCOPE · {set.status}
                  {set.outputs.map((output) => (
                    <div key={output.id} className="muted">{output.drawingType} · {output.roomRef ?? output.wallRef ?? 'global'}</div>
                  ))}
                </div>
              ))}
            </div>
          </Panel>

          {/* Sheet Index Page */}
          <Panel title="📖 Document Pack Sheet Index">
            <div className="listMock">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px 4px' }}>Sheet No</th>
                    <th>Drawing Title</th>
                    <th>Scope</th>
                    <th>Scale</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 4px', color: '#e1bf72' }}>FP-01</td>
                    <td>Main Layout Floor Plan</td>
                    <td>Ground Floor</td>
                    <td>Scale 1:50</td>
                    <td><span style={{ color: '#7dbb74' }}>Ready</span></td>
                  </tr>
                  {(elevationPack?.walls ?? []).map((sheet) => (
                    <tr
                      key={sheet.sheetNumber}
                      onClick={() => setSelectedSheetNumber(sheet.sheetNumber)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        backgroundColor: selectedSheetNumber === sheet.sheetNumber ? 'rgba(225,191,114,0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 4px', color: '#e1bf72' }}>EL-{String(sheet.sheetNumber).padStart(2, '0')}</td>
                      <td>{sheet.roomName} · {sheet.wallId} Elevation ({sheet.side})</td>
                      <td>{sheet.side.toUpperCase()}</td>
                      <td>Scale NTS</td>
                      <td><span style={{ color: '#7dbb74' }}>Ready</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Wall/Module Schedule */}
          <Panel title="📊 Structural Wall & Module Schedule">
            <div className="listMock">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '6px 4px' }}>Wall ID</th>
                    <th>Length</th>
                    <th>Height</th>
                    <th>Modules Placed</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(elevationPack?.walls ?? [])
                    .filter((item, index, self) => self.findIndex((w) => w.wallId === item.wallId) === index)
                    .map((item) => (
                      <tr key={item.wallId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{item.wallId}</td>
                        <td>{item.wallLengthMm} mm</td>
                        <td>{item.wallHeightMm} mm</td>
                        <td>{item.moduleCount} modules</td>
                        <td>
                          {item.modules.map((m) => `${m.name} (${m.widthMm}x${m.heightMm}mm)`).join(', ') || 'No modules'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title={`Elevation Sheet Preview: EL-${String(selectedSheetNumber).padStart(2, '0')}`}>
            {currentSheet ? (
              <div className="listMock">
                <div className="rowMock" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{currentSheet.roomName} · {currentSheet.wallId} · {currentSheet.side}</strong>
                    <div className="muted" style={{ marginTop: 4 }}>
                      Dimensions: {currentSheet.wallLengthMm} mm × {currentSheet.wallHeightMm} mm · modules: {currentSheet.moduleCount}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(elevationPack?.walls ?? []).map((w) => (
                      <button
                        key={w.sheetNumber}
                        onClick={() => setSelectedSheetNumber(w.sheetNumber)}
                        style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          backgroundColor: selectedSheetNumber === w.sheetNumber ? '#e1bf72' : '#232927',
                          color: selectedSheetNumber === w.sheetNumber ? '#0d1110' : '#f4f0e8',
                          border: 'none',
                          borderRadius: 4,
                        }}
                      >
                        EL-{String(w.sheetNumber).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="drawingPreview" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: currentSheet.svg }} />
              </div>
            ) : (
              <div className="rowMock">No sheets generated yet. Add modules to walls in the Design Studio to generate elevation pages.</div>
            )}
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
                  <div className="muted">Board Spec: {card.boardSpec}</div>
                  <div className="muted">Edge Spec: {card.edgeSpec}</div>
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
            <div className="rowMock">All sheets compile to high-resolution CAD vector graphics. Handoff package locks all drawings dynamically.</div>
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
