'use client';

import { type MouseEvent, useEffect, useMemo, useState } from 'react';

type Point = { x: number; y: number };
type Marker = {
  id: string;
  markerType: 'room' | 'module' | 'reference';
  x: number;
  y: number;
  label: string;
  color: string;
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
  const [annotationMode, setAnnotationMode] = useState<'measure' | 'room' | 'module' | 'reference'>('measure');

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

  function emitOverlay(nextPoints: Point[], nextMarkers: Marker[]) {
    onOverlayChange?.({ calibrationPoints: nextPoints, markers: nextMarkers });
  }

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

    const config = {
      room: { label: 'Room', color: '#e1bf72' },
      module: { label: 'Module', color: '#7dbb74' },
      reference: { label: 'Ref', color: '#6fa8ff' },
    }[annotationMode];

    const nextMarkers = [
      ...markers,
      {
        id: crypto.randomUUID(),
        markerType: annotationMode,
        x,
        y,
        label: config.label,
        color: config.color,
      },
    ];
    setMarkers(nextMarkers);
    emitOverlay(points, nextMarkers);
  }

  function clearOverlay() {
    setPoints([]);
    setMarkers([]);
    emitOverlay([], []);
  }

  return (
    <div className="panel">
      <h3>Uploaded Floor Plan Overlay Editor</h3>
      <div className="listMock" style={{ marginBottom: 12 }}>
        <div className="rowMock">Step 1: upload a floor plan image and use Measure mode to click any one known dimension.</div>
        <div className="rowMock">Step 2: switch to Room / Module / Ref mode to place human+AI review markers over the real plan.</div>
        <div className="rowMock">Overlay entities are now persisted in the floor-plan version so the designer can reopen and continue review later.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setAnnotationMode('measure')}>Measure</button>
          <button onClick={() => setAnnotationMode('room')}>Mark Room</button>
          <button onClick={() => setAnnotationMode('module')}>Mark Module</button>
          <button onClick={() => setAnnotationMode('reference')}>Mark Reference</button>
          <button onClick={clearOverlay}>Clear Overlay</button>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="canvasMock"
        style={{ width: '100%', minHeight: 320, background: '#0d1110' }}
        onClick={handleClick}
      >
        {backgroundImageUrl ? (
          <image href={backgroundImageUrl} x="0" y="0" width={viewWidth} height={viewHeight} preserveAspectRatio="xMidYMid meet" opacity={0.9} />
        ) : (
          <>
            <rect x="40" y="40" width={viewWidth - 80} height={viewHeight - 80} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
            <rect x="80" y="80" width={viewWidth * 0.38} height={viewHeight * 0.35} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <rect x={viewWidth * 0.52} y="80" width={viewWidth * 0.32} height={viewHeight * 0.35} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <rect x="80" y={viewHeight * 0.58} width={viewWidth * 0.78} height={viewHeight * 0.22} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <text x={viewWidth / 2} y={viewHeight / 2} textAnchor="middle" fill="#8c8c8c" fontSize={18}>
              Upload a real floor plan to calibrate and annotate over it.
            </text>
          </>
        )}

        <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="rgba(0,0,0,0.02)" />

        {points.length === 2 ? (
          <>
            <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke="#e1bf72" strokeWidth={4} />
            <rect
              x={Math.min(points[0].x, points[1].x)}
              y={Math.min(points[0].y, points[1].y) - 28}
              width={140}
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
        {markers.map((marker) => (
          <g key={marker.id}>
            <circle cx={marker.x} cy={marker.y} r={10} fill={marker.color} />
            <text x={marker.x + 12} y={marker.y - 12} fill={marker.color} fontSize={18}>{marker.label}</text>
          </g>
        ))}
      </svg>
      <div className="rowMock" style={{ marginTop: 12 }}>
        Overlay mode: <strong style={{ marginLeft: 4 }}>{annotationMode}</strong>
        <span className="muted" style={{ marginLeft: 10 }}>Current pixel distance: {distance || 'click two points'}</span>
        <span className="muted" style={{ marginLeft: 10 }}>Persisted markers: {markers.length}</span>
      </div>
    </div>
  );
}
