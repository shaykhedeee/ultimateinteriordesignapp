'use client';

import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Point = { x: number; y: number };
type Marker = {
  id: string;
  markerType: 'room' | 'module' | 'reference' | 'opening' | 'wall';
  x: number;
  y: number;
  label: string;
  color: string;
  note?: string;
  linkedEntityRef?: string;
};

type OverlayPayload = {
  calibrationPoints: Point[];
  markers: Marker[];
};

const MARKER_FILTER_OPTIONS: Array<{ value: Marker['markerType'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'room', label: 'Rooms' },
  { value: 'module', label: 'Modules' },
  { value: 'reference', label: 'References' },
  { value: 'opening', label: 'Openings' },
  { value: 'wall', label: 'Walls' },
];

const MARKER_TYPE_CONFIG: Record<Marker['markerType'], { label: string; color: string }> = {
  room: { label: 'Room', color: '#e1bf72' },
  module: { label: 'Module', color: '#7dbb74' },
  reference: { label: 'Ref', color: '#6fa8ff' },
  opening: { label: 'Opening', color: '#f4c2a1' },
  wall: { label: 'Wall', color: '#d2a9f9' },
};

export function FloorPlanCalibrationCanvas({
  onDistanceMeasured,
  backgroundImageUrl,
  backgroundWidth = 1000,
  backgroundHeight = 700,
  initialPoints = [],
  initialMarkers = [],
  onOverlayChange,
}: {
  onDistanceMeasured: (pixelDistance: number) => void;
  backgroundImageUrl?: string;
  backgroundWidth?: number;
  backgroundHeight?: number;
  initialPoints?: Point[];
  initialMarkers?: Marker[];
  onOverlayChange?: (payload: OverlayPayload) => void;
}) {
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers);
  const [annotationMode, setAnnotationMode] = useState<'measure' | 'room' | 'module' | 'reference' | 'opening' | 'wall'>('measure');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<Marker['markerType'] | 'all'>('all');
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  useEffect(() => {
    setMarkers(initialMarkers);
  }, [initialMarkers]);

  const viewWidth = Math.max(backgroundWidth, 1000);
  const viewHeight = Math.max(backgroundHeight, 700);

  const distance = useMemo(() => {
    if (points.length !== 2) return 0;
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }, [points]);

  const visibleMarkers = useMemo(() => {
    if (filterType === 'all') return markers;
    return markers.filter((m) => m.markerType === filterType);
  }, [markers, filterType]);

  const emitOverlay = useCallback(
    (nextPoints: Point[], nextMarkers: Marker[]) => {
      onOverlayChange?.({ calibrationPoints: nextPoints, markers: nextMarkers });
    },
    [onOverlayChange]
  );

  function toCanvasPoint(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewWidth,
      y: ((event.clientY - rect.top) / rect.height) * viewHeight,
    };
  }

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    const { x, y } = toCanvasPoint(event);

    if (annotationMode === 'measure') {
      const next = [...points, { x, y }].slice(-2);
      setPoints(next);
      emitOverlay(next, markers);
      if (next.length === 2) {
        const dx = next[1].x - next[0].x;
        const dy = next[1].y - next[0].y;
        const pixelDistance = Math.round(Math.sqrt(dx * dx + dy * dy));
        onDistanceMeasured(pixelDistance);
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

  function handleMarkerDragStart(event: MouseEvent<SVGGElement>, markerId: string) {
    event.stopPropagation();
    if (annotationMode !== 'measure') return;
    setSelectedMarkerId(markerId);
  }

  useEffect(() => {
    if (!selectedMarkerId) return;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let markerStartX = 0;
    let markerStartY = 0;

    function onMouseMove(ev: globalThis.MouseEvent) {
      const svg = document.getElementById('overlay-svg-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * viewWidth;
      const y = ((ev.clientY - rect.top) / rect.height) * viewHeight;
      if (!moved) {
        const current = markers.find((m) => m.id === selectedMarkerId);
        if (!current) return;
        moved = true;
        startX = x;
        startY = y;
        markerStartX = current.x;
        markerStartY = current.y;
      }
      const dx = x - startX;
      const dy = y - startY;
      setMarkers((prev) => {
        const next = prev.map((m) => (m.id === selectedMarkerId ? { ...m, x: markerStartX + dx, y: markerStartY + dy } : m));
        emitOverlay(points, next);
        return next;
      });
    }

    function onMouseUp() {
      setSelectedMarkerId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [selectedMarkerId, markers, points, viewWidth, viewHeight, emitOverlay]);

  function deleteSelectedMarker() {
    if (!selectedMarkerId) return;
    const next = markers.filter((m) => m.id !== selectedMarkerId);
    setMarkers(next);
    emitOverlay(points, next);
    setSelectedMarkerId(null);
  }

  function clearOverlay() {
    setPoints([]);
    setMarkers([]);
    emitOverlay([], []);
    setSelectedMarkerId(null);
  }

  function updateSelectedMarker(note: string, linkedEntityRef: string) {
    if (!selectedMarkerId) return;
    const next = markers.map((m) =>
      m.id === selectedMarkerId ? { ...m, note, linkedEntityRef } : m
    );
    setMarkers(next);
    emitOverlay(points, next);
  }

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  return (
    <div className="panel">
      <h3>Uploaded Floor Plan Overlay Editor</h3>
      <div className="listMock" style={{ marginBottom: 12 }}>
        <div className="rowMock">
          Step 1: upload a floor plan image and use Measure mode to click any one known dimension.
        </div>
        <div className="rowMock">
          Step 2: switch to Room / Module / Opening / Wall / Ref mode to place review markers over the real plan.
        </div>
        <div className="rowMock">Overlay entities are persisted in the floor-plan version for later review continuation.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setAnnotationMode('measure')}>Measure</button>
          <button onClick={() => setAnnotationMode('room')}>Mark Room</button>
          <button onClick={() => setAnnotationMode('module')}>Mark Module</button>
          <button onClick={() => setAnnotationMode('opening')}>Mark Opening</button>
          <button onClick={() => setAnnotationMode('wall')}>Mark Wall</button>
          <button onClick={() => setAnnotationMode('reference')}>Mark Reference</button>
          <button onClick={clearOverlay}>Clear Overlay</button>
          <button onClick={deleteSelectedMarker} disabled={!selectedMarkerId}>Delete Selected</button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as Marker['markerType'] | 'all')}
            aria-label="Filter overlay markers"
          >
            {MARKER_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="muted">Mode: {annotationMode} · Selected: {selectedMarkerId ? 'yes' : 'no'}</span>
        </div>
      </div>

      <svg
        id="overlay-svg-canvas"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="canvasMock"
        style={{ width: '100%', minHeight: 360, background: '#0d1110', cursor: annotationMode === 'measure' ? 'crosshair' : 'pointer' }}
        onClick={handleClick}
        role="img"
        aria-label="Floor plan overlay canvas"
      >
        {backgroundImageUrl ? (
          <image href={backgroundImageUrl} x="0" y="0" width={viewWidth} height={viewHeight} preserveAspectRatio="xMidYMid meet" opacity={0.92} />
        ) : (
          <rect x="40" y="40" width={viewWidth - 80} height={viewHeight - 80} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
        )}

        {points.length === 2 ? (
          <>
            <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke="#e1bf72" strokeWidth={4} />
            <rect
              x={Math.min(points[0].x, points[1].x)}
              y={Math.min(points[0].y, points[1].y) - 28}
              width={160}
              height={22}
              rx={6}
              fill="rgba(0,0,0,0.72)"
            />
            <text x={Math.min(points[0].x, points[1].x) + 8} y={Math.min(points[0].y, points[1].y) - 12} fill="#e1bf72" fontSize={14}>
              {distance}px measured
            </text>
          </>
        ) : null}

        {points.map((point, index) => (
          <circle key={`point-${index}`} cx={point.x} cy={point.y} r={8} fill="#e1bf72" />
        ))}

        {visibleMarkers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId;
          const isHovered = marker.id === hoveredMarkerId;
          return (
            <g
              key={marker.id}
              onMouseDown={(e) => handleMarkerDragStart(e, marker.id)}
              onMouseEnter={() => setHoveredMarkerId(marker.id)}
              onMouseLeave={() => setHoveredMarkerId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarkerId(marker.id);
              }}
              style={{ cursor: annotationMode === 'measure' ? 'grab' : 'pointer' }}
              role="button"
              aria-label={`${MARKER_TYPE_CONFIG[marker.markerType].label} marker ${marker.label}`}
            >
              <circle
                cx={marker.x}
                cy={marker.y}
                r={isSelected ? 14 : isHovered ? 12 : 10}
                fill={marker.color}
                stroke={isSelected ? '#ffffff' : 'transparent'}
                strokeWidth={isSelected ? 3 : 0}
              />
              <text x={marker.x + 14} y={marker.y - 14} fill={marker.color} fontSize={18} fontWeight={isSelected ? 700 : 400}>
                {marker.label}
              </text>
              {marker.note ? (
                <text x={marker.x + 14} y={marker.y + 6} fill="#cbd5e1" fontSize={12}>
                  {marker.note}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="rowMock" style={{ marginTop: 12 }}>
        Overlay mode: <strong style={{ marginLeft: 4 }}>{annotationMode}</strong>
        <span className="muted" style={{ marginLeft: 10 }}>Px distance: {distance || 'click two points'}</span>
        <span className="muted" style={{ marginLeft: 10 }}>Markers: {markers.length} · Showing: {visibleMarkers.length}</span>
      </div>

      {selectedMarker ? (
        <div className="panel" style={{ marginTop: 12, padding: 12 }}>
          <div className="rowMock"><strong>Edit marker: {selectedMarker.label}</strong></div>
          <label>
            Note
            <input
              value={selectedMarker.note ?? ''}
              onChange={(e) => updateSelectedMarker(e.target.value, selectedMarker.linkedEntityRef ?? '')}
              placeholder="Optional note"
            />
          </label>
          <label>
            Linked entity ref
            <input
              value={selectedMarker.linkedEntityRef ?? ''}
              onChange={(e) => updateSelectedMarker(selectedMarker.note ?? '', e.target.value)}
              placeholder="e.g. room_living_1, wall_l1"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
