import React, { useEffect, useMemo, useState } from 'react';

type OverlayPoint = { x: number; y: number };
type OverlayMarker = {
  id: string;
  markerType: 'room' | 'module' | 'reference' | 'opening' | 'wall';
  x: number;
  y: number;
  label: string;
  color: string;
  note?: string;
  linkedEntityRef?: string;
};

type FloorPlanVersion = {
  id: string;
  projectId: string;
  versionNumber: number;
  interpretationStatus: string;
  overallConfidence: number;
  sourceAssetId?: string;
  scaleUnit?: string;
  scaleFactor?: number;
  createdAt: string;
  overlay?: {
    calibrationPoints: OverlayPoint[];
    markers: OverlayMarker[];
    updatedAt: string;
  };
  calibration?: {
    referenceName: string;
    knownDistanceMm: number;
    pixelDistance: number;
    scaleMmPerPixel: number;
  };
  interpretation?: Record<string, unknown>;
  reviewItems?: Array<{
    id: string;
    itemType: string;
    itemRef: string;
    confidence: number;
    severity: string;
    status: string;
    suggestedValue: Record<string, unknown>;
    resolvedValue: Record<string, unknown>;
    resolvedAt?: string;
  }>;
};

const MARKER_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'room', label: 'Rooms' },
  { value: 'module', label: 'Modules' },
  { value: 'reference', label: 'References' },
  { value: 'opening', label: 'Openings' },
  { value: 'wall', label: 'Walls' },
];

const MARKER_TYPE_CONFIG: Record<OverlayMarker['markerType'], { label: string; color: string }> = {
  room: { label: 'Room', color: '#e1bf72' },
  module: { label: 'Module', color: '#7dbb74' },
  reference: { label: 'Ref', color: '#6fa8ff' },
  opening: { label: 'Opening', color: '#f4c2a1' },
  wall: { label: 'Wall', color: '#d2a9f9' },
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, PlusCircle, MousePointer2, PencilRuler, Type, Trash2, CheckCircle2, AlertTriangle, GripVertical } from 'lucide-react';

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

export default function PlanReviewScreen({ projectId, onNavigateToTab }) {
  const [versions, setVersions] = useState<FloorPlanVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('No floor plan uploaded yet.');
  const [referenceName, setReferenceName] = useState('Living room wall');
  const [knownDistanceMm, setKnownDistanceMm] = useState('4500');
  const [pixelDistance, setPixelDistance] = useState('1200');
  const [roomLabel, setRoomLabel] = useState('Living Room');
  const [roomType, setRoomType] = useState('living_room');
  const [moduleType, setModuleType] = useState('tv_unit');
  const [referenceImageLabel, setReferenceImageLabel] = useState('Modern warm living room reference');

  const [annotationMode, setAnnotationMode] = useState<'measure' | 'room' | 'module' | 'reference' | 'opening' | 'wall'>('measure');
  const [points, setPoints] = useState<OverlayPoint[]>([]);
  const [markers, setMarkers] = useState<OverlayMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<OverlayMarker['markerType'] | 'all'>('all');
  const [calibrationPoints, setCalibrationPoints] = useState<OverlayPoint[]>([]);
  const [planStatus, setPlanStatus] = useState('');
  const fileInputRef = React.useRef(null);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? null,
    [versions, selectedVersionId]
  );

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet<FloorPlanVersion[]>(`/api/projects/${projectId}/floor-plan-versions`)
      .then((data) => {
        setVersions(data || []);
        const first = (data || [])[0];
        if (first && !selectedVersionId) setSelectedVersionId(first.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    const version = selectedVersion;
    if (version?.sourceAssetId) {
      setUploadStatus(`Loaded floor plan version #${version.versionNumber}`);
    } else {
      setUploadStatus('No floor plan uploaded yet.');
    }
    setPoints(version?.overlay?.calibrationPoints ?? []);
    setMarkers(version?.overlay?.markers ?? []);
    setSelectedMarkerId(null);
  }, [selectedVersion?.id, selectedVersion?.overlay, selectedVersion?.sourceAssetId]);

  async function handlePlanUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;
    setUploadStatus(`Reading ${file.name}...`);
    const form = new FormData();
    form.append('floorplan', file);
    const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/floorplan`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    setUploadStatus(`Uploaded ${file.name}`);
    setVersions((prev) => {
      const next = [...prev];
      const current = next.find((v) => v.id === data.floorPlanVersionId);
      if (current) {
        current.sourceAssetId = data.floorplanUrl;
        current.interpretationStatus = 'draft';
      }
      return next;
    });
  }

  async function createInterpretation() {
    if (!projectId) return;
    const res = await apiPost(`/api/projects/${projectId}/floor-plan/interpret`, {
      sourceAssetId: selectedVersion?.sourceAssetId || crypto.randomUUID(),
      mode: 'image',
      options: { preferMetric: true, inferRoomLabels: true, inferOpenings: true },
    });
    const data = await res.json();
    setUploadStatus(`Interpretation queued: ${data?.data?.overallConfidence ? `${(data.data.overallConfidence * 100).toFixed(1)}%` : 'processing'}`);
  }

  async function calibrateVersion() {
    if (!selectedVersion) return;
    await apiPost(`/api/floor-plan-versions/${selectedVersion.id}/calibrate`, {
      referenceName,
      knownDistanceMm: Number(knownDistanceMm),
      pixelDistance: Number(pixelDistance),
    });
    setPlanStatus('Calibration saved.');
    setTimeout(() => setPlanStatus(''), 2200);
  }

  async function annotateVersion() {
    if (!selectedVersion) return;
    await apiPost(`/api/floor-plan-versions/${selectedVersion.id}/annotate`, {
      rooms: [{ roomRef: 'room_living_1', roomType, label: roomLabel }],
      modules: [{ moduleType, roomRef: 'room_living_1', wallRef: 'wall_l1', note: 'Planned by user + AI assist' }],
      references: [{ roomRef: 'room_living_1', imageLabel: referenceImageLabel, styleNote: 'Use as style and material reference' }],
    });
    setPlanStatus('Annotation saved.');
    setTimeout(() => setPlanStatus(''), 2200);
  }

  async function finalizeVersion() {
    if (!selectedVersion) return;
    await apiPost(`/api/floor-plan-versions/${selectedVersion.id}/finalize`, {});
    setPlanStatus('Finalized. Next step: promote into editable design scene.');
    setTimeout(() => setPlanStatus(''), 2500);
    onNavigateToTab?.('cad');
  }

  async function saveOverlay(payload: { calibrationPoints: OverlayPoint[]; markers: OverlayMarker[] }) {
    if (!selectedVersion) return;
    await apiPost(`/api/floor-plan-versions/${selectedVersion.id}/overlay`, payload);
    setVersions((prev) =>
      prev.map((v) =>
        v.id === selectedVersion.id
          ? {
              ...v,
              overlay: {
                calibrationPoints: payload.calibrationPoints,
                markers: payload.markers,
                updatedAt: new Date().toISOString(),
              },
            }
          : v
      )
    );
  }

  async function approveVersion() {
    if (!selectedVersion) return;
    await apiPost(`/api/floor-plan-versions/${selectedVersion.id}/review`, {
      acceptRemainingHighConfidence: true,
      corrections: [{ itemType: 'room', itemRef: 'room_tmp_1', action: 'accept' }],
    });
    setPlanStatus('Plan review approved.');
    setTimeout(() => setPlanStatus(''), 2500);
  }

  function emitOverlay(nextPoints: OverlayPoint[], nextMarkers: OverlayMarker[]) {
    saveOverlay({ calibrationPoints: nextPoints, markers: nextMarkers });
  }

  function toCanvasPoint(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 1000;
    const height = 700;
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  function handleCanvasClick(event: React.MouseEvent<SVGSVGElement>) {
    const { x, y } = toCanvasPoint(event);
    if (annotationMode === 'measure') {
      const next = [...points, { x, y }].slice(-2);
      setPoints(next);
      emitOverlay(next, markers);
      if (next.length === 2) {
        const dx = next[1].x - next[0].x;
        const dy = next[1].y - next[0].y;
        setPixelDistance(String(Math.round(Math.sqrt(dx * dx + dy * dy))));
      }
      return;
    }
    const config = MARKER_TYPE_CONFIG[annotationMode];
    const nextMarkers = [
      ...markers,
      {
        id: crypto.randomUUID(),
        markerType: annotationMode,
        x,
        y,
        label: `${config.label} ${markers.filter((m) => m.markerType === annotationMode).length + 1}`,
        color: config.color,
        note: '',
        linkedEntityRef: '',
      },
    ];
    setMarkers(nextMarkers);
    emitOverlay(points, nextMarkers);
  }

  function deleteSelectedMarker() {
    if (!selectedMarkerId) return;
    const next = markers.filter((m) => m.id !== selectedMarkerId);
    setMarkers(next);
    emitOverlay(points, next);
    setSelectedMarkerId(null);
  }

  function updateSelectedMarker(note: string, linkedEntityRef: string) {
    if (!selectedMarkerId) return;
    const next = markers.map((m) => (m.id === selectedMarkerId ? { ...m, note, linkedEntityRef } : m));
    setMarkers(next);
    emitOverlay(points, next);
  }

  const visibleMarkers = useMemo(() => {
    if (filterType === 'all') return markers;
    return markers.filter((m) => m.markerType === filterType);
  }, [markers, filterType]);

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  return (
    <div className="h-full w-full overflow-y-auto text-left space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Floor Plan Review & Overlay</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Upload plan, calibrate scale, review AI interpretation, annotate modules, and persist overlay intent.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white">Upload Plan</button>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePlanUpload} />
          <button onClick={createInterpretation} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white">Interpret Plan</button>
          <button onClick={approveVersion} disabled={!selectedVersion} className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase">Approve Review</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['measure', 'room', 'module', 'opening', 'wall', 'reference'] as const).map((mode) => (
                <button key={mode} onClick={() => setAnnotationMode(mode)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${annotationMode === mode ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-300'}`}>
                  {mode === 'measure' ? 'Measure' : MARKER_TYPE_CONFIG[mode].label}
                </button>
              ))}
              <button onClick={deleteSelectedMarker} disabled={!selectedMarkerId} className="px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-red-300 hover:text-red-200 disabled:opacity-40">Delete Selected</button>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-slate-950 border border-slate-850 rounded-lg text-[11px] text-slate-200 px-2 py-1.5">
                {MARKER_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <svg
              viewBox="0 0 1000 700"
              className="w-full h-[380px] bg-slate-950 rounded-xl"
              style={{ cursor: annotationMode === 'measure' ? 'crosshair' : 'pointer' }}
              onClick={handleCanvasClick}
            >
              <rect width="1000" height="700" fill="rgba(0,0,0,0.25)" />
              {selectedVersion?.sourceAssetId ? (
                <image href={selectedVersion.sourceAssetId} x="0" y="0" width="1000" height="700" preserveAspectRatio="xMidYMid meet" opacity="0.9" />
              ) : (
                <text x="500" y="350" textAnchor="middle" fill="#8c8c8c" fontSize={18}>Upload a floor plan to begin review.</text>
              )}

              {points.length === 2 && (
                <>
                  <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke="#e1bf72" strokeWidth={4} />
                  <rect x={Math.min(points[0].x, points[1].x)} y={Math.min(points[0].y, points[1].y) - 28} width={160} height={22} rx={6} fill="rgba(0,0,0,0.72)" />
                  <text x={Math.min(points[0].x, points[1].x) + 8} y={Math.min(points[0].y, points[1].y) - 12} fill="#e1bf72" fontSize={14}>
                    {Math.round(Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2)))}px measured
                  </text>
                </>
              )}
              {points.map((point, index) => (
                <circle key={`point-${index}`} cx={point.x} cy={point.y} r={8} fill="#e1bf72" />
              ))}

              {visibleMarkers.map((marker) => {
                const isSelected = marker.id === selectedMarkerId;
                return (
                  <g key={marker.id} onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(marker.id); }}>
                    <circle cx={marker.x} cy={marker.y} r={isSelected ? 14 : 10} fill={marker.color} stroke={isSelected ? '#ffffff' : 'transparent'} strokeWidth={isSelected ? 3 : 0} />
                    <text x={marker.x + 14} y={marker.y - 14} fill={marker.color} fontSize={18} fontWeight={isSelected ? 700 : 400}>{marker.label}</text>
                    {marker.note ? <text x={marker.x + 14} y={marker.y + 6} fill="#cbd5e1" fontSize={12}>{marker.note}</text> : null}
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
              <span>Mode: <strong className="text-slate-200">{annotationMode}</strong></span>
              <span>Markers: {markers.length}</span>
              <span>Showing: {visibleMarkers.length}</span>
              <span>Calibration: {selectedVersion?.calibration ? `${selectedVersion.calibration.referenceName} · ${selectedVersion.calibration.scaleMmPerPixel.toFixed(3)} mm/px` : 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Calibration</div>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Reference Name</span>
              <input value={referenceName} onChange={(e) => setReferenceName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Known Distance (mm)</span>
              <input value={knownDistanceMm} onChange={(e) => setKnownDistanceMm(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Pixel Distance</span>
              <input value={pixelDistance} onChange={(e) => setPixelDistance(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <button onClick={calibrateVersion} className="w-full py-2 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase">Apply Scale Calibration</button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Annotations</div>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Room Label</span>
              <input value={roomLabel} onChange={(e) => setRoomLabel(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Room Type</span>
              <input value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Module Type</span>
              <input value={moduleType} onChange={(e) => setModuleType(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Reference Note</span>
              <input value={referenceImageLabel} onChange={(e) => setReferenceImageLabel(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
            </label>
            <button onClick={annotateVersion} className="w-full py-2 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Save Annotation</button>
            <button onClick={finalizeVersion} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase">Finalize to Spatial Model</button>
          </div>

          {selectedMarker && (
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Edit Marker</div>
              <label className="block space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Note</span>
                <input value={selectedMarker.note ?? ''} onChange={(e) => updateSelectedMarker(e.target.value, selectedMarker.linkedEntityRef ?? '')} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Linked Entity Ref</span>
                <input value={selectedMarker.linkedEntityRef ?? ''} onChange={(e) => updateSelectedMarker(selectedMarker.note ?? '', e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200" />
              </label>
            </div>
          )}

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Version</div>
            <select value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200">
              {versions.map((v) => (
                <option key={v.id} value={v.id}>Version {v.versionNumber} · {v.interpretationStatus} · confidence {v.overallConfidence}</option>
              ))}
            </select>
            <div className="text-[10px] text-slate-500">Status: <span className="text-slate-200">{selectedVersion?.interpretationStatus ?? 'n/a'}</span></div>
            <div className="text-[10px] text-slate-500">Confidence: <span className="text-slate-200">{selectedVersion ? `${(selectedVersion.overallConfidence * 100).toFixed(1)}%` : 'n/a'}</span></div>
            <div className="text-[10px] text-slate-500">Review items: <span className="text-slate-200">{selectedVersion?.reviewItems?.length ?? 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
