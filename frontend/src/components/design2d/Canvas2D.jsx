import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { selectRooms, selectWalls, selectOpenings, selectModules } from '../../lib/selectors/editorSelectors';
import { ZoomIn, ZoomOut, Move, Eye } from 'lucide-react';

export default function Canvas2D() {
  const rooms = useEditorStore(selectRooms);
  const walls = useEditorStore(selectWalls);
  const openings = useEditorStore(selectOpenings);
  const modules = useEditorStore(selectModules);
  
  const selectedId = useEditorStore(state => state.selectedId);
  const selectedType = useEditorStore(state => state.selectedType);
  const activeTool = useEditorStore(state => state.activeTool);
  const activeRoomId = useEditorStore(state => state.activeRoomId);
  
  const selectEntity = useEditorStore(state => state.selectEntity);
  const applyPatch = useEditorStore(state => state.applyPatch);
  const pixelsPerMeter = useEditorStore(state => state.pixelsPerMeter);
  const isLocked = useEditorStore(state => state.isLocked);

  // --- Pan & Zoom ---
  const [zoom, setZoom] = useState(0.85);
  const [panX, setPanX] = useState(120);
  const [panY, setPanY] = useState(120);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const [snapToGrid, setSnapToGrid] = useState(true);

  // --- Drag Module State ---
  const [draggedModuleId, setDraggedModuleId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // --- Helper to convert SVG screen coordinate to Workspace coordinate ---
  const getWorkspaceCoords = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Accounts for translation and scale zoom factor
    return {
      x: (x - panX) / zoom,
      y: (y - panY) / zoom
    };
  };

  // --- Mouse / Touch Handlers ---
  const handleMouseDown = (e) => {
    // Middle click or space key or 'pan' tool triggers canvas panning
    if (e.button === 1 || activeTool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const coords = getWorkspaceCoords(e);
    
    // Check if clicked on a module footprint first
    const moduleElement = e.target.closest('.module-footprint');
    if (moduleElement) {
      const id = moduleElement.getAttribute('data-id');
      const mod = modules.find(m => m.moduleId === id);
      if (mod) {
        selectEntity(id, 'module');
        if (!isLocked) {
          setDraggedModuleId(id);
          // Store offset from module center
          dragOffsetRef.current = {
            x: coords.x - mod.geometry.anchor.x,
            y: coords.y - mod.geometry.anchor.y
          };
        }
        return;
      }
    }

    // Check if clicked on a wall
    const wallElement = e.target.closest('.wall-line');
    if (wallElement) {
      const id = wallElement.getAttribute('data-id');
      selectEntity(id, 'wall');
      return;
    }

    // Check if clicked inside a room label
    const roomElement = e.target.closest('.room-label');
    if (roomElement) {
      const id = roomElement.getAttribute('data-id');
      selectEntity(id, 'room');
      return;
    }

    // Deselect if clicked blank background
    if (e.target === svgRef.current || e.target.classList.contains('canvas-background')) {
      selectEntity(null, null);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (draggedModuleId) {
      const coords = getWorkspaceCoords(e);
      let targetX = coords.x - dragOffsetRef.current.x;
      let targetY = coords.y - dragOffsetRef.current.y;

      // Apply Snaps: Snap to 50mm grid increments if enabled
      if (snapToGrid) {
        const snapGrid = 50; 
        targetX = Math.round(targetX / snapGrid) * snapGrid;
        targetY = Math.round(targetY / snapGrid) * snapGrid;
      }

      // Realtime patch update in store. ThreeJS will update in sync.
      applyPatch({
        op: 'update_module_params',
        payload: {
          moduleId: draggedModuleId,
          geometry: {
            anchor: { x: targetX, y: targetY }
          }
        }
      });
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    if (draggedModuleId) {
      setDraggedModuleId(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev * zoomFactor, 4.0));
    } else {
      setZoom(prev => Math.max(prev / zoomFactor, 0.15));
    }
  };

  // --- Dimension Label Helper ---
  const formatMeters = (mm) => {
    return `${(mm / 1000).toFixed(2)}m`;
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#070c14] border border-slate-800 rounded-2xl flex flex-col">
      
      {/* Mini toolbar Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-1.5 rounded-xl flex gap-1 shadow-lg shadow-black/40">
        <button
          onClick={() => setZoom(prev => Math.min(prev * 1.2, 4.0))}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.15))}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setPanX(120); setPanY(120); setZoom(0.85); }}
          title="Reset View"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#C9A84C] transition text-xs font-semibold"
        >
          FIT
        </button>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"}
          className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition border ${
            snapToGrid 
              ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-[#C9A84C]' 
              : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {snapToGrid ? "🧲 Snap" : "🔓 Free"}
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg text-[9px] font-bold text-slate-400 tracking-wider uppercase">
        <Eye className="w-3.5 h-3.5 text-[var(--gold)]" />
        <span>2D Floorplan layout</span>
      </div>

      {/* SVG Canvas Workspace */}
      <svg
        ref={svgRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none select-none"
      >
        {/* Infinite Grid Background */}
        <defs>
          <pattern id="minorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#111827" strokeWidth="0.5" />
          </pattern>
          <pattern id="majorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f2937" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Workspace Translation Container */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Background Grid */}
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#minorGrid)" className="canvas-background" />
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#majorGrid)" fillOpacity="0.4" className="canvas-background" />
          
          {/* Axis origin indicators */}
          <line x1="-150" y1="0" x2="150" y2="0" stroke="#374151" strokeWidth="0.8" strokeDasharray="3,3" />
          <line x1="0" y1="-150" x2="0" y2="150" stroke="#374151" strokeWidth="0.8" strokeDasharray="3,3" />

          {/* 1. ROOM POLYGON SHAPES */}
          {rooms.map(room => {
            if (!room.polygon2d || room.polygon2d.length < 3) return null;
            const pointsStr = room.polygon2d.map(p => `${p.x},${p.y}`).join(' ');
            const isSelected = selectedId === room.roomId && selectedType === 'room';
            const isActive = activeRoomId === room.roomId;

            return (
              <g key={room.roomId} className="room-shape">
                <polygon
                  points={pointsStr}
                  fill={isActive ? 'rgba(212, 175, 55, 0.02)' : 'transparent'}
                  stroke={isSelected ? 'var(--gold)' : isActive ? 'rgba(212, 175, 55, 0.2)' : 'transparent'}
                  strokeWidth="1.5"
                  className="transition"
                />
              </g>
            );
          })}

          {/* 2. WALL MESH OUTLINES */}
          {walls.map(wall => {
            const isSelected = selectedId === wall.wallId && selectedType === 'wall';
            const dx = wall.end.x - wall.start.x;
            const dy = wall.end.y - wall.start.y;
            const length = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            
            // Draw wall as a rectangular block based on thickness
            const t = wall.thicknessMm;
            const px = Math.sin(angle) * (t / 2);
            const py = -Math.cos(angle) * (t / 2);

            const corners = [
              { x: wall.start.x + px, y: wall.start.y + py },
              { x: wall.end.x + px, y: wall.end.y + py },
              { x: wall.end.x - px, y: wall.end.y - py },
              { x: wall.start.x - px, y: wall.start.y - py }
            ];
            const cornersStr = corners.map(c => `${c.x},${c.y}`).join(' ');

            return (
              <g key={wall.wallId} className="wall-line" data-id={wall.wallId} style={{ cursor: 'pointer' }}>
                {/* Thick wall fill */}
                <polygon
                  points={cornersStr}
                  fill="#334155"
                  stroke={isSelected ? 'var(--gold)' : '#64748b'}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                
                {/* Dimension label above wall line */}
                {length > 600 && (
                  <text
                    x={(wall.start.x + wall.end.x) / 2}
                    y={(wall.start.y + wall.end.y) / 2 - 12}
                    transform={`rotate(${(angle * 180) / Math.PI}, ${(wall.start.x + wall.end.x) / 2}, ${(wall.start.y + wall.end.y) / 2})`}
                    fill="#94a3b8"
                    fontSize="10px"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {formatMeters(length)}
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. WALL OPENINGS (Doors and Windows) */}
          {openings.map(op => {
            // Find parent wall to compute angle
            const wall = walls.find(w => w.wallId === op.wallId);
            if (!wall) return null;

            const dx = wall.end.x - wall.start.x;
            const dy = wall.end.y - wall.start.y;
            const wallLen = Math.hypot(dx, dy);
            if (wallLen === 0) return null;
            
            const wallAngle = Math.atan2(dy, dx);
            
            // Compute coordinate position along the wall length
            const ratio = op.offsetFromStartMm / wallLen;
            const opX = wall.start.x + dx * ratio;
            const opY = wall.start.y + dy * ratio;

            return (
              <g
                key={op.openingId}
                transform={`translate(${opX}, ${opY}) rotate(${(wallAngle * 180) / Math.PI})`}
              >
                {op.openingType === 'window' ? (
                  // Window symbol: double narrow parallel lines
                  <rect
                    x={-op.widthMm / 2}
                    y={-10}
                    width={op.widthMm}
                    height={20}
                    fill="#1e293b"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                ) : (
                  // Door symbol: quarter-circle arc swing
                  <g>
                    <rect x={-op.widthMm / 2} y={-8} width={op.widthMm} height={16} fill="#0f172a" />
                    {/* Door swing arc */}
                    <path
                      d={`M ${-op.widthMm / 2} 0 A ${op.widthMm} ${op.widthMm} 0 0 1 ${op.widthMm / 2} ${-op.widthMm}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    {/* Door slab */}
                    <line
                      x1={-op.widthMm / 2}
                      y1={0}
                      x2={-op.widthMm / 2}
                      y2={-op.widthMm}
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* 4. PLACED PARAMETRIC MODULES FOOTPRINTS */}
          {modules.map(mod => {
            const isSelected = selectedId === mod.moduleId && selectedType === 'module';
            const { x, y } = mod.geometry.anchor;
            const { widthMm, depthMm } = mod.geometry.size;
            const rotationDeg = mod.geometry.rotationDeg || 0;

            return (
              <g
                key={mod.moduleId}
                data-id={mod.moduleId}
                className="module-footprint"
                transform={`translate(${x}, ${y}) rotate(${rotationDeg})`}
                style={{ cursor: isLocked ? 'default' : 'move' }}
              >
                {/* Clearance zone safety halo (inspired by underlay) */}
                {isSelected && (
                  <g>
                    <rect
                      x={-widthMm / 2 - 300}
                      y={-depthMm / 2 - 300}
                      width={widthMm + 600}
                      height={depthMm + 600}
                      fill="rgba(251, 191, 36, 0.02)"
                      stroke="rgba(251, 191, 36, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      rx="6"
                      pointerEvents="none"
                    />
                    <text
                      x="0"
                      y={-depthMm / 2 - 10}
                      fill="#fbbf24"
                      fontSize="7px"
                      fontWeight="bold"
                      textAnchor="middle"
                      pointerEvents="none"
                      className="font-mono tracking-wider uppercase"
                    >
                      +300mm Clearance Buffer
                    </text>
                  </g>
                )}

                {/* Module outer box carcass bounding footprint */}
                <rect
                  x={-widthMm / 2}
                  y={-depthMm / 2}
                  width={widthMm}
                  height={depthMm}
                  fill={isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(15, 23, 42, 0.65)'}
                  stroke={isSelected ? 'var(--gold)' : '#94a3b8'}
                  strokeWidth={isSelected ? 2 : 1.2}
                  rx="4"
                />

                {/* Shutter front line (double line to indicate cabinet front direction) */}
                <line
                  x1={-widthMm / 2 + 3}
                  y1={depthMm / 2 - 6}
                  x2={widthMm / 2 - 3}
                  y2={depthMm / 2 - 6}
                  stroke={isSelected ? 'var(--gold)' : '#64748b'}
                  strokeWidth="1"
                />
                
                {/* Text Label */}
                <text
                  x="0"
                  y="-4"
                  fill={isSelected ? 'var(--gold)' : '#cbd5e1'}
                  fontSize="9px"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {mod.name?.substring(0, 14)}
                </text>

                {/* Dimensions labels */}
                <text
                  x="0"
                  y="12"
                  fill="#64748b"
                  fontSize="8px"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {widthMm}x{depthMm}
                </text>
              </g>
            );
          })}

          {/* 5. ROOM LABELS */}
          {rooms.map(room => {
            if (!room.polygon2d || room.polygon2d.length === 0) return null;
            
            // Compute room centroid / center position for label placement
            let cx = 0;
            let cy = 0;
            room.polygon2d.forEach(p => {
              cx += p.x;
              cy += p.y;
            });
            cx /= room.polygon2d.length;
            cy /= room.polygon2d.length;

            const isSelected = selectedId === room.roomId && selectedType === 'room';

            return (
              <g
                key={`label_${room.roomId}`}
                className="room-label"
                data-id={room.roomId}
                style={{ cursor: 'pointer' }}
                transform={`translate(${cx}, ${cy})`}
              >
                <rect
                  x="-75"
                  y="-16"
                  width="150"
                  height="32"
                  rx="6"
                  fill="#0b0f19"
                  fillOpacity="0.8"
                  stroke={isSelected ? 'var(--gold)' : 'rgba(51, 65, 85, 0.4)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="-3"
                  fill="#f8fafc"
                  fontSize="10px"
                  fontWeight="black"
                  textAnchor="middle"
                >
                  {room.name}
                </text>
                <text
                  x="0"
                  y="9"
                  fill="#94a3b8"
                  fontSize="8px"
                  fontWeight="semibold"
                  textAnchor="middle"
                  className="uppercase tracking-wider"
                >
                  {room.roomType?.replace('_', ' ')}
                </text>
              </g>
            );
          })}

        </g>
      </svg>

      {/* Grid snaps indicator bar */}
      <div className="p-2 bg-slate-950/80 border-t border-slate-850/80 text-[9px] font-bold text-[#8A8899] font-mono flex justify-between items-center shrink-0">
        <span>GRID SNAPS: {snapToGrid ? "50mm (ACTIVE)" : "OFF"}</span>
        <span>DRAG TO ROTATE/MOVE MODULES</span>
      </div>
    </div>
  );
}
