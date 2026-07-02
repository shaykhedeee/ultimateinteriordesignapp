'use client';

import { type PointerEvent, type MouseEvent, useEffect, useMemo, useState, useRef } from 'react';

type Point = { x: number; y: number };
type Marker = {
  id: string;
  markerType: 'room' | 'module' | 'opening' | 'wall' | 'reference';
  x: number;
  y: number;
  label: string;
  color: string;
  linkedEntityId?: string;
};

type OverlayPayload = {
  calibrationPoints: Point[];
  markers: Marker[];
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
  const [annotationMode, setAnnotationMode] = useState<'measure' | 'room' | 'module' | 'opening' | 'wall' | 'reference'>('measure');
  const [filterType, setFilterType] = useState<string>('all');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Dragging state
  const [activeDrag, setActiveDrag] = useState<{
    type: 'point' | 'marker';
    index: number;
    id?: string;
  } | null>(null);

  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

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

  const filteredMarkers = useMemo(() => {
    if (filterType === 'all') return markers;
    return markers.filter((m) => m.markerType === filterType);
  }, [markers, filterType]);

  const selectedMarker = useMemo(() => {
    return markers.find((m) => m.id === selectedMarkerId) ?? null;
  }, [markers, selectedMarkerId]);

  function emitOverlay(nextPoints: Point[], nextMarkers: Marker[]) {
    onOverlayChange?.({ calibrationPoints: nextPoints, markers: nextMarkers });
  }

  function toCanvasPoint(clientX: number, clientY: number) {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * viewWidth,
      y: ((clientY - rect.top) / rect.height) * viewHeight,
    };
  }

  function handlePointerDown(event: PointerEvent<any>, dragInfo: { type: 'point' | 'marker'; index: number; id?: string }) {
    event.stopPropagation();
    const canvasPt = toCanvasPoint(event.clientX, event.clientY);
    setActiveDrag(dragInfo);
    setDragStartPos(canvasPt);
    setHasDragged(false);

    if (dragInfo.type === 'marker' && dragInfo.id) {
      setSelectedMarkerId(dragInfo.id);
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!activeDrag || !dragStartPos) return;
    event.preventDefault();
    const currentPt = toCanvasPoint(event.clientX, event.clientY);
    const dx = currentPt.x - dragStartPos.x;
    const dy = currentPt.y - dragStartPos.y;

    if (Math.sqrt(dx * dx + dy * dy) > 3) {
      setHasDragged(true);
    }

    let targetX = currentPt.x;
    let targetY = currentPt.y;

    if (snapToGrid) {
      targetX = Math.round(targetX / 25) * 25;
      targetY = Math.round(targetY / 25) * 25;
    }

    if (activeDrag.type === 'point') {
      const nextPoints = [...points];
      const otherIndex = activeDrag.index === 0 ? 1 : 0;

      // Snapping to horizontal/vertical align
      if (points[otherIndex]) {
        const other = points[otherIndex];
        const angleDiffX = Math.abs(targetX - other.x);
        const angleDiffY = Math.abs(targetY - other.y);
        if (angleDiffX < 20) {
          targetX = other.x;
        }
        if (angleDiffY < 20) {
          targetY = other.y;
        }
      }

      nextPoints[activeDrag.index] = { x: targetX, y: targetY };
      setPoints(nextPoints);
    } else if (activeDrag.type === 'marker') {
      const nextMarkers = markers.map((m) =>
        m.id === activeDrag.id ? { ...m, x: targetX, y: targetY } : m
      );
      setMarkers(nextMarkers);
    }
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (activeDrag) {
      emitOverlay(points, markers);
      setActiveDrag(null);
      setDragStartPos(null);
      return;
    }

    // Click to place
    const canvasPt = toCanvasPoint(event.clientX, event.clientY);
    let targetX = canvasPt.x;
    let targetY = canvasPt.y;

    if (snapToGrid) {
      targetX = Math.round(targetX / 25) * 25;
      targetY = Math.round(targetY / 25) * 25;
    }

    if (annotationMode === 'measure') {
      const next = [...points, { x: targetX, y: targetY }].slice(-2);
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

    const config = {
      room: { label: 'Room', color: '#e1bf72' },
      module: { label: 'Module', color: '#7dbb74' },
      opening: { label: 'Opening', color: '#ff6f6f' },
      wall: { label: 'Wall', color: '#bdc5cd' },
      reference: { label: 'Ref', color: '#6fa8ff' },
    }[annotationMode];

    const nextMarkers: Marker[] = [
      ...markers,
      {
        id: crypto.randomUUID(),
        markerType: annotationMode,
        x: targetX,
        y: targetY,
        label: `${config.label} #${markers.length + 1}`,
        color: config.color,
      },
    ];
    setMarkers(nextMarkers);
    emitOverlay(points, nextMarkers);
  }

  function updateSelectedMarker(updates: Partial<Marker>) {
    if (!selectedMarkerId) return;
    const nextMarkers = markers.map((m) =>
      m.id === selectedMarkerId ? { ...m, ...updates } : m
    );
    setMarkers(nextMarkers);
    emitOverlay(points, nextMarkers);
  }

  function deleteSelectedMarker() {
    if (!selectedMarkerId) return;
    const nextMarkers = markers.filter((m) => m.id !== selectedMarkerId);
    setMarkers(nextMarkers);
    setSelectedMarkerId(null);
    emitOverlay(points, nextMarkers);
  }

  function clearOverlay() {
    setPoints([]);
    setMarkers([]);
    setSelectedMarkerId(null);
    emitOverlay([], []);
  }

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Uploaded Floor Plan Calibration Canvas</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f4f0e8' }}>
            <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
            Snap to 25mm grid
          </label>
        </div>
      </div>

      <div className="listMock">
        <div className="rowMock">
          <strong>Interactive Tools:</strong> Select a mode, then click on the canvas to place nodes or drag them to relocate.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['measure', 'room', 'module', 'opening', 'wall', 'reference'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAnnotationMode(mode)}
              style={{
                backgroundColor: annotationMode === mode ? '#e1bf72' : 'transparent',
                color: annotationMode === mode ? '#0d1110' : '#f4f0e8',
                border: '1px solid #e1bf72',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {mode === 'measure' ? '📐 Measure Mode' : `Mark ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
            </button>
          ))}
          <button onClick={clearOverlay} style={{ border: '1px solid #ff6f6f', color: '#ff6f6f', backgroundColor: 'transparent' }}>
            Clear All
          </button>
        </div>
      </div>

      <div className="listMock">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span><strong>Filter Display:</strong></span>
          {['all', 'room', 'module', 'opening', 'wall', 'reference'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                borderRadius: 4,
                backgroundColor: filterType === type ? '#6fa8ff' : '#232927',
                color: '#f4f0e8',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            className="canvasMock"
            style={{ width: '100%', minHeight: 400, background: '#0d1110', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'crosshair', userSelect: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {backgroundImageUrl ? (
              <image href={backgroundImageUrl} x="0" y="0" width={viewWidth} height={viewHeight} preserveAspectRatio="xMidYMid meet" opacity={0.9} />
            ) : (
              <>
                <rect x="40" y="40" width={viewWidth - 80} height={viewHeight - 80} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
                <text x={viewWidth / 2} y={viewHeight / 2} textAnchor="middle" fill="#8c8c8c" fontSize={18}>
                  Upload a floor plan to calibrate and edit.
                </text>
              </>
            )}

            {/* Grid overlay when enabled */}
            {snapToGrid && (
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            )}
            <rect width={viewWidth} height={viewHeight} fill="url(#grid)" pointerEvents="none" />

            {/* Calibration measurement line */}
            {points.length === 2 ? (
              <>
                <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke="#e1bf72" strokeWidth={4} />
                <rect
                  x={Math.min(points[0].x, points[1].x)}
                  y={Math.min(points[0].y, points[1].y) - 28}
                  width={140}
                  height={22}
                  rx={6}
                  fill="rgba(0,0,0,0.85)"
                />
                <text x={Math.min(points[0].x, points[1].x) + 8} y={Math.min(points[0].y, points[1].y) - 12} fill="#e1bf72" fontSize={12} fontWeight="bold">
                  {distance}px calibrated
                </text>
              </>
            ) : null}

            {/* Calibration Points handles */}
            {points.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r={10}
                fill="#e1bf72"
                stroke="#0d1110"
                strokeWidth={2}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => handlePointerDown(e, { type: 'point', index })}
              />
            ))}

            {/* Draggable Markers */}
            {filteredMarkers.map((marker) => {
              const isSelected = marker.id === selectedMarkerId;
              return (
                <g
                  key={marker.id}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => handlePointerDown(e, { type: 'marker', id: marker.id, index: -1 })}
                >
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={isSelected ? 14 : 10}
                    fill={marker.color}
                    stroke={isSelected ? '#f4f0e8' : '#0d1110'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  {isSelected && (
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={20}
                      fill="none"
                      stroke={marker.color}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  )}
                  <rect
                    x={marker.x + 16}
                    y={marker.y - 12}
                    width={marker.label.length * 8 + 12}
                    height={20}
                    rx={4}
                    fill="rgba(16, 20, 19, 0.85)"
                    stroke="rgba(255,255,255,0.08)"
                    pointerEvents="none"
                  />
                  <text x={marker.x + 22} y={marker.y + 2} fill="#f4f0e8" fontSize={11} pointerEvents="none" fontWeight="500">
                    {marker.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Marker Detail / Edit panel */}
        {selectedMarker && (
          <div className="panel" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#131918', border: '1px solid rgba(255,255,255,0.1)', padding: 16, borderRadius: 8 }}>
            <h4>Edit Marker Details</h4>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Label Name</label>
              <input
                value={selectedMarker.label}
                onChange={(e) => updateSelectedMarker({ label: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', background: '#0d1110', border: '1px solid #2f3e39', color: '#f4f0e8', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Marker Category</label>
              <select
                value={selectedMarker.markerType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  const colorMap: Record<string, string> = {
                    room: '#e1bf72',
                    module: '#7dbb74',
                    opening: '#ff6f6f',
                    wall: '#bdc5cd',
                    reference: '#6fa8ff',
                  };
                  updateSelectedMarker({ markerType: val, color: colorMap[val] ?? '#6fa8ff' });
                }}
                style={{ width: '100%', padding: '6px 10px', background: '#0d1110', border: '1px solid #2f3e39', color: '#f4f0e8', borderRadius: 4 }}
              >
                <option value="room">Room Area</option>
                <option value="module">Furniture Module</option>
                <option value="opening">Opening (Door/Window)</option>
                <option value="wall">Structural Wall</option>
                <option value="reference">Image Reference</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Link to Entity Ref</label>
              <input
                value={selectedMarker.linkedEntityId ?? ''}
                placeholder="e.g. room_living_1, wall_l1"
                onChange={(e) => updateSelectedMarker({ linkedEntityId: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', background: '#0d1110', border: '1px solid #2f3e39', color: '#f4f0e8', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Coordinates</label>
              <span style={{ fontSize: 12, color: '#f4f0e8' }}>X: {Math.round(selectedMarker.x)}px, Y: {Math.round(selectedMarker.y)}px</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={deleteSelectedMarker}
                style={{ flex: 1, padding: '8px', border: 'none', backgroundColor: '#a63e3e', color: '#f4f0e8', borderRadius: 4, cursor: 'pointer' }}
              >
                Delete Marker
              </button>
              <button
                onClick={() => setSelectedMarkerId(null)}
                style={{ flex: 1, padding: '8px', border: 'none', backgroundColor: '#2f3e39', color: '#f4f0e8', borderRadius: 4, cursor: 'pointer' }}
              >
                Close Editor
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rowMock" style={{ marginTop: 4 }}>
        Overlay mode: <strong style={{ marginLeft: 4, color: '#e1bf72' }}>{annotationMode}</strong>
        <span className="muted" style={{ marginLeft: 12 }}>Calibrated pixel distance: {distance || 'draw scale line'}</span>
        <span className="muted" style={{ marginLeft: 12 }}>Persisted markers count: {markers.length}</span>
      </div>
    </div>
  );
}
