'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { FloorPlanCalibrationCanvas } from './FloorPlanCalibrationCanvas';
import { ReferenceImageLibraryPanel } from './ReferenceImageLibraryPanel';

type Project = { id: string; name: string };

type OverlayPoint = { x: number; y: number };
type OverlayMarker = {
  id: string;
  markerType: 'room' | 'module' | 'opening' | 'wall' | 'reference';
  x: number;
  y: number;
  label: string;
  color: string;
  linkedEntityId?: string;
};

const EMPTY_POINTS: OverlayPoint[] = [];
const EMPTY_MARKERS: OverlayMarker[] = [];

type FloorPlanVersion = {
  id: string;
  versionNumber: number;
  interpretationStatus: string;
  overallConfidence: number;
  interpretation?: { mode?: string; roomsDetected?: number; wallsDetected?: number };
  source?: {
    assetName: string;
    imageDataUrl: string;
    widthPx: number;
    heightPx: number;
    uploadedAt: string;
  };
  overlay?: {
    calibrationPoints: OverlayPoint[];
    markers: OverlayMarker[];
    updatedAt: string;
  };
  calibration?: { referenceName: string; knownDistanceMm: number; pixelDistance: number; scaleMmPerPixel: number };
  annotations?: {
    rooms: Array<{ roomRef: string; roomType: string; label: string; bounds?: Array<{ x: number; y: number }> }>;
    modules: Array<{ moduleType: string; roomRef: string; wallRef?: string; note?: string }>;
    references: Array<{ roomRef: string; imageLabel: string; styleNote?: string }>;
  };
  northAngleDeg?: number;
};

export function PlanReviewScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<FloorPlanVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [referenceName, setReferenceName] = useState('Living room wall');
  const [knownDistanceMm, setKnownDistanceMm] = useState('4500');
  const [pixelDistance, setPixelDistance] = useState('1200');
  const [roomLabel, setRoomLabel] = useState('Living Room');
  const [roomType, setRoomType] = useState('living_room');
  const [moduleType, setModuleType] = useState('tv_unit');
  const [referenceImageLabel, setReferenceImageLabel] = useState('Modern warm living room reference');
  const [uploadStatus, setUploadStatus] = useState('No floor plan uploaded yet.');

  // Spatial Review Maturity States
  const [northAngleDeg, setNorthAngleDeg] = useState<number>(0);
  const [editingRoomVertices, setEditingRoomVertices] = useState<string>('');

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const data = await apiGet<FloorPlanVersion[]>(`/projects/${selected}/floor-plan/versions`);
    setVersions(data);
    if (data[0] && !selectedVersionId) {
      setSelectedVersionId(data[0].id);
      setNorthAngleDeg(data[0].northAngleDeg ?? 0);
    }
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id);
      })
      .catch(console.error);
  }, []);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null,
    [versions, selectedVersionId]
  );

  useEffect(() => {
    if (selectedVersion) {
      setNorthAngleDeg(selectedVersion.northAngleDeg ?? 0);
    }
    if (selectedVersion?.source?.assetName) {
      setUploadStatus(`Loaded ${selectedVersion.source.assetName} · ${selectedVersion.source.widthPx}×${selectedVersion.source.heightPx}`);
    }
  }, [selectedVersion]);

  // discrepancy calculation
  const detectedRooms = selectedVersion?.interpretation?.roomsDetected ?? 0;
  const humanRooms = selectedVersion?.overlay?.markers?.filter(m => m.markerType === 'room').length ?? 0;
  const hasDiscrepancy = detectedRooms > 0 && detectedRooms !== humanRooms;

  async function createMockInterpretation() {
    if (!project) return;
    await apiPost(`/projects/${project.id}/floor-plan/interpret`, {
      sourceAssetId: crypto.randomUUID(),
      mode: 'image',
      options: { preferMetric: true, inferRoomLabels: true, inferOpenings: true },
    });
    await load(project.id);
  }

  async function approveVersion(versionId: string) {
    await apiPost(`/floor-plan-versions/${versionId}/review`, {
      acceptRemainingHighConfidence: true,
      corrections: [{ itemType: 'room', itemRef: 'room_tmp_1', action: 'accept' }],
    });
    await load(project?.id);
  }

  async function calibrateVersion() {
    if (!selectedVersion) return;
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/calibrate`, {
      referenceName,
      knownDistanceMm: Number(knownDistanceMm),
      pixelDistance: Number(pixelDistance),
    });
    await load(project?.id);
  }

  async function annotateVersion() {
    if (!selectedVersion) return;
    
    // Boundary coordinates parser if specified
    const bounds = editingRoomVertices
      ? editingRoomVertices.split(';').map((coord) => {
          const [x, y] = coord.split(',').map(Number);
          return { x: x || 0, y: y || 0 };
        })
      : undefined;

    await apiPost(`/floor-plan-versions/${selectedVersion.id}/annotate`, {
      rooms: [{ roomRef: 'room_living_1', roomType, label: roomLabel, bounds }],
      modules: [{ moduleType, roomRef: 'room_living_1', wallRef: 'wall_l1', note: 'Planned by user + AI assist' }],
      references: [{ roomRef: 'room_living_1', imageLabel: referenceImageLabel, styleNote: 'Use as style and material reference' }],
    });
    await load(project?.id);
  }

  async function finalizeVersion() {
    if (!selectedVersion) return;
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/finalize`, {});
    alert('Plan successfully finalized to 3D spatial model. You can now place furniture in the Design Studio!');
  }

  async function updateNorthAngle(angle: number) {
    if (!selectedVersion) return;
    setNorthAngleDeg(angle);
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/overlay`, {
      calibrationPoints: selectedVersion.overlay?.calibrationPoints ?? [],
      markers: selectedVersion.overlay?.markers ?? [],
      northAngleDeg: angle,
    });
  }

  async function addReference(entry: { roomRef: string; imageLabel: string; styleNote?: string; imageUrl?: string }) {
    if (!selectedVersion) return;
    const annotations = selectedVersion.annotations ?? { rooms: [], modules: [], references: [] };
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/annotate`, {
      rooms: annotations.rooms,
      modules: annotations.modules,
      references: [...annotations.references, entry],
    });
    await load(project?.id);
  }

  async function saveOverlay(payload: { calibrationPoints: OverlayPoint[]; markers: OverlayMarker[] }) {
    if (!selectedVersion) return;
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/overlay`, {
      ...payload,
      northAngleDeg,
    });
    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersion.id
          ? {
              ...version,
              overlay: {
                calibrationPoints: payload.calibrationPoints,
                markers: payload.markers,
                updatedAt: new Date().toISOString(),
              },
            }
          : version
      )
    );
  }

  async function handlePlanUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedVersion) return;
    setUploadStatus(`Reading ${file.name}...`);
    const dataUrl = await readFileAsDataUrl(file);
    const dimensions = await getImageDimensions(dataUrl);

    // Check if it is a PDF vs Image and call proper endpoint/normalization
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    await apiPost(`/floor-plan-versions/${selectedVersion.id}/source`, {
      assetName: file.name,
      imageDataUrl: dataUrl,
      widthPx: dimensions.width,
      heightPx: dimensions.height,
      isPdf,
    });

    setUploadStatus(`Uploaded ${file.name} · ${dimensions.width}×${dimensions.height}`);
    await load(project?.id);
  }

  return (
    <div className="workspace3">
      <Panel title="Review Items">
        <div className="listMock">
          <button onClick={createMockInterpretation}>Create Mock Interpretation</button>
          <select value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)}>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                Version {version.versionNumber} · {version.interpretationStatus} · confidence {version.overallConfidence}
              </option>
            ))}
          </select>
          {versions.map((version) => (
            <div className="rowMock" key={version.id}>
              Version {version.versionNumber} · {version.interpretationStatus} · confidence {version.overallConfidence}
              <div className="muted" style={{ marginTop: 6 }}>
                Source overlay: {version.source?.assetName ?? 'not attached'}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Persisted overlay markers: {version.overlay?.markers.length ?? 0}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => approveVersion(version.id)}>Approve Review</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Spatial review discrepancy banner */}
        {hasDiscrepancy && (
          <div className="panel" style={{ borderLeft: '4px solid #ff6f6f', padding: '12px 16px', background: 'rgba(255, 111, 111, 0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 600, color: '#ff6f6f' }}>⚠️ AI vs. Human Reviewed Discrepancy Detected</span>
            <span className="muted" style={{ fontSize: 13 }}>
              AI detected <strong>{detectedRooms}</strong> rooms, but you have placed <strong>{humanRooms}</strong> room markers. Please check the overlay layout before finalization.
            </span>
          </div>
        )}

        <Panel title="Uploaded Plan Source">
          <div className="listMock">
            <div className="rowMock">Use a plan image or PDF drawing. The system handles normalization pipelines internally.</div>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" onChange={handlePlanUpload} disabled={!selectedVersion} />
            <div className="rowMock">{uploadStatus}</div>
          </div>
        </Panel>

        <FloorPlanCalibrationCanvas
          onDistanceMeasured={(pixels) => setPixelDistance(String(pixels))}
          backgroundImageUrl={selectedVersion?.source?.imageDataUrl}
          backgroundWidth={selectedVersion?.source?.widthPx}
          backgroundHeight={selectedVersion?.source?.heightPx}
          initialPoints={selectedVersion?.overlay?.calibrationPoints ?? EMPTY_POINTS}
          initialMarkers={selectedVersion?.overlay?.markers ?? EMPTY_MARKERS}
          onOverlayChange={(payload) => {
            void saveOverlay(payload);
          }}
        />

        <Panel title="Plan Calibration & Boundary Controls">
          <div className="listMock">
            <div className="rowMock">The user defines one known measurement so the floor plan can be scaled accurately and downstream 2D/3D stays dimensionally consistent.</div>
            
            <div className="workspaceSplit">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label>
                  Reference Measurement Name
                  <input value={referenceName} onChange={(e) => setReferenceName(e.target.value)} />
                </label>
                <label>
                  Known Distance (mm)
                  <input value={knownDistanceMm} onChange={(e) => setKnownDistanceMm(e.target.value)} />
                </label>
                <label>
                  Pixel Distance (from clicks)
                  <input value={pixelDistance} onChange={(e) => setPixelDistance(e.target.value)} />
                </label>
                <button onClick={calibrateVersion} style={{ marginTop: 8 }}>Apply Scale Calibration</button>
              </div>

              {/* Spatial review adjustments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label>
                  North Angle Orientation (Degrees)
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="range" min="0" max="360" value={northAngleDeg} onChange={(e) => updateNorthAngle(Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={{ minWidth: 40 }}>{northAngleDeg}°</span>
                  </div>
                </label>

                <label>
                  Room boundary coordinates (x,y; x,y; ...)
                  <input
                    value={editingRoomVertices}
                    onChange={(e) => setEditingRoomVertices(e.target.value)}
                    placeholder="e.g. 100,100; 100,5000; 4500,5000; 4500,100"
                  />
                </label>
                <span className="muted" style={{ fontSize: 11 }}>Optionally customize boundary points for the room footprint.</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0 0', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="rowMock"><strong>Annotation Presets</strong></div>
              <div className="workspaceSplit">
                <label>
                  Room Label
                  <input value={roomLabel} onChange={(e) => setRoomLabel(e.target.value)} />
                </label>
                <label>
                  Room Type
                  <input value={roomType} onChange={(e) => setRoomType(e.target.value)} />
                </label>
              </div>
              <div className="workspaceSplit">
                <label>
                  Module Type
                  <input value={moduleType} onChange={(e) => setModuleType(e.target.value)} />
                </label>
                <label>
                  Reference Image Note
                  <input value={referenceImageLabel} onChange={(e) => setReferenceImageLabel(e.target.value)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={annotateVersion} style={{ flex: 1 }}>Save Human + AI Annotation</button>
                <button onClick={finalizeVersion} style={{ flex: 1, backgroundColor: '#7dbb74', color: '#0d1110', fontWeight: 600 }}>Finalize to Spatial Model</button>
              </div>
            </div>
          </div>
        </Panel>
        <ReferenceImageLibraryPanel entries={selectedVersion?.annotations?.references ?? []} onAdd={addReference} />
      </div>
      <Panel title="Confidence & Actions">
        <div className="listMock">
          <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
          <div className="rowMock">Interpretations: {versions.length}</div>
          <div className="rowMock">Overlay source: {selectedVersion?.source?.assetName ?? 'Not uploaded'}</div>
          <div className="rowMock">Persisted overlay markers: {selectedVersion?.overlay?.markers.length ?? 0}</div>
          <div className="rowMock">Calibration points stored: {selectedVersion?.overlay?.calibrationPoints.length ?? 0}</div>
          <div className="rowMock">Calibration: {selectedVersion?.calibration ? `${selectedVersion.calibration.referenceName} · ${selectedVersion.calibration.scaleMmPerPixel.toFixed(3)} mm/pixel` : 'Not set'}</div>
          <div className="rowMock">Annotated Rooms: {selectedVersion?.annotations?.rooms.length ?? 0}</div>
          <div className="rowMock">Annotated Modules: {selectedVersion?.annotations?.modules.length ?? 0}</div>
          <div className="rowMock">Reference Images: {selectedVersion?.annotations?.references.length ?? 0}</div>
          <div className="rowMock">Use plan review before generating the spatial model.</div>
        </div>
      </Panel>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error('Failed to measure image'));
    image.src = dataUrl;
  });
}
