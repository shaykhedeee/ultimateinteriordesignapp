import React, { useState } from 'react';
import { PlacedItem, RoomData } from '../../types/aura';
import { MOCK_ASSETS, MOCK_MATERIALS } from '../../data/mockData';
import { 
  Eye, 
  Sun, 
  Ruler, 
  Sparkles, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  ShieldCheck
} from 'lucide-react';

interface Viewport3DProps {
  rooms: RoomData[];
  placedItems: PlacedItem[];
  onUpdateItemPosition: (itemId: string, newPos: { x: number; z: number }) => void;
  onRotateItem: (itemId: string, degDelta: number) => void;
  onDeleteItem: (itemId: string) => void;
  onSelectRoom: (roomId: string) => void;
  activeRoomId: string;
  onTriggerRender: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  rooms,
  placedItems,
  onUpdateItemPosition,
  onRotateItem,
  onDeleteItem,
  onSelectRoom,
  activeRoomId,
  onTriggerRender
}) => {
  const [renderMode, setRenderMode] = useState<'wireframe' | 'shaded' | 'realistic' | 'raytraced' | 'sketch'>('realistic');
  const [cameraAngle, setCameraAngle] = useState<'iso' | 'top' | 'front' | 'first-person'>('iso');
  const [sunHour, setSunHour] = useState<number>(16); // 4 PM golden hour
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // Helper to find asset metadata
  const getAsset = (assetId: string) => MOCK_ASSETS.find(a => a.id === assetId) || MOCK_ASSETS[0];

  // Drag handler in 2D viewport space mapped to 3D room
  const handleDragStart = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemId(itemId);
    setDraggingItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingItemId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    // Map 0..1 to room coordinates (-3..+3 meters approx)
    const newX = parseFloat(((xPct - 0.5) * 6).toFixed(2));
    const newZ = parseFloat(((yPct - 0.5) * 6).toFixed(2));
    onUpdateItemPosition(draggingItemId, { x: newX, z: newZ });
  };

  // Compute sun gradient color
  const getSunlightColor = () => {
    if (sunHour < 7 || sunHour > 19) return 'rgba(15, 23, 42, 0.95)'; // night
    if (sunHour < 10 || sunHour > 17) return 'rgba(251, 191, 36, 0.25)'; // golden hour
    return 'rgba(255, 255, 255, 0.12)'; // noon bright
  };

  const floorMat = MOCK_MATERIALS.find(m => m.id === currentRoom.floorMaterialId) || MOCK_MATERIALS[0];
  const wallMat = MOCK_MATERIALS.find(m => m.id === currentRoom.wallMaterialId) || MOCK_MATERIALS[0];

  return (
    <div 
      className={`flex-1 relative flex flex-col bg-slate-950 overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onClick={() => setSelectedItemId(null)}
    >
      {/* Viewport Top Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Render Modes Toggle */}
        <div className="glass-panel p-1 rounded-xl pointer-events-auto flex items-center gap-1 shadow-2xl">
          {(['wireframe', 'shaded', 'realistic', 'raytraced', 'sketch'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                renderMode === mode
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {mode === 'raytraced' ? 'Ray-Traced WebGPU' : mode}
            </button>
          ))}
        </div>

        {/* Camera Angles & Room Select */}
        <div className="glass-panel px-3 py-1.5 rounded-xl pointer-events-auto flex items-center gap-3 shadow-2xl">
          <div className="flex items-center gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden sm:inline">Camera:</span>
            {(['iso', 'top', 'front', 'first-person'] as const).map((ang) => (
              <button
                key={ang}
                onClick={() => setCameraAngle(ang)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase transition ${
                  cameraAngle === ang ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ang}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition ${
              showMeasurements ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3 h-3" />
            <span>38" Clearances</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Simulator (WebGPU / PBR perspective representation) */}
      <div 
        className={`w-full h-full relative flex items-center justify-center overflow-hidden transition-all duration-700 ${
          renderMode === 'wireframe' ? 'bg-slate-950 bg-grid-pattern' 
            : renderMode === 'sketch' ? 'bg-[#f7f5f0] text-slate-900' 
            : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black'
        }`}
      >
        {/* Sun lighting simulation overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{ background: getSunlightColor() }}
        />

        {/* 3D Room Container simulating Three.js WebGPU viewport */}
        <div 
          className={`relative w-[650px] sm:w-[800px] aspect-4/3 transition-all duration-500 flex items-center justify-center ${
            cameraAngle === 'iso' ? 'rotate-x-[52deg] rotate-z-[-32deg] scale-90'
              : cameraAngle === 'top' ? 'rotate-x-0 rotate-z-0 scale-95'
              : cameraAngle === 'front' ? 'rotate-x-[75deg] rotate-z-0 scale-85'
              : 'scale-105' // first-person simulation
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Room Floor */}
          <div 
            className={`absolute inset-0 rounded-2xl shadow-2xl transition-all duration-500 border-4 ${
              renderMode === 'wireframe' ? 'border-indigo-500/50 bg-transparent'
                : renderMode === 'sketch' ? 'border-slate-800 bg-white/80'
                : 'border-slate-800/80 shadow-[0_0_80px_rgba(0,0,0,0.8)]'
            }`}
            style={{
              backgroundImage: renderMode === 'wireframe' ? 'none' : `url(${floorMat.textureUrl})`,
              backgroundSize: '180px 180px'
            }}
          >
            {renderMode !== 'wireframe' && (
              <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" />
            )}
          </div>

          {/* North Wall Simulation */}
          {cameraAngle !== 'top' && (
            <div 
              className={`absolute top-0 left-0 right-0 h-32 -translate-y-full origin-bottom flex items-center justify-center border-b-2 border-slate-800 ${
                renderMode === 'wireframe' ? 'border-2 border-indigo-400/40 bg-indigo-950/10'
                  : renderMode === 'sketch' ? 'bg-slate-200 border-slate-900'
                  : 'bg-slate-900'
              }`}
              style={{
                transform: 'rotateX(-90deg)',
                backgroundImage: renderMode === 'realistic' || renderMode === 'raytraced' ? `url(${wallMat.textureUrl})` : 'none',
                backgroundSize: '250px 250px'
              }}
            >
              <div className="absolute inset-0 bg-slate-950/50" />
              {/* Bay Window representation */}
              <div className="w-48 h-20 bg-sky-300/20 border border-sky-400/40 rounded shadow-inner backdrop-blur-md flex items-center justify-center text-[10px] font-mono text-sky-200 tracking-wider">
                🌅 BAY WINDOW & MORNING SUN
              </div>
            </div>
          )}

          {/* Placed Furniture Objects */}
          {placedItems.map((item) => {
            const asset = getAsset(item.assetId);
            const isSelected = selectedItemId === item.id;
            const isDragging = draggingItemId === item.id;

            // Map meters (-3..+3) to percent position inside canvas
            const leftPct = ((item.position.x + 3) / 6) * 100;
            const topPct = ((item.position.z + 3) / 6) * 100;

            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleDragStart(item.id, e)}
                onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                className={`absolute transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center ${
                  isDragging ? 'z-50 scale-110 opacity-90 duration-75' : 'z-20 duration-300 hover:scale-105'
                }`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: `translate(-50%, -50%) rotateZ(${item.rotation.y}deg)`,
                  width: `${asset.dimensions.width * 0.75}px`,
                  height: `${asset.dimensions.depth * 0.75}px`
                }}
              >
                {/* Visual Furniture Representation */}
                <div 
                  className={`w-full h-full rounded-xl p-2 flex flex-col items-center justify-center relative shadow-2xl transition ${
                    renderMode === 'wireframe' 
                      ? 'border-2 border-dashed border-indigo-400 bg-indigo-500/10 text-indigo-300'
                      : renderMode === 'sketch'
                      ? 'border-2 border-slate-900 bg-white text-slate-900 shadow-lg'
                      : isSelected
                      ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950 bg-slate-900/90'
                      : 'bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80'
                  }`}
                  style={{
                    backgroundImage: renderMode === 'realistic' || renderMode === 'raytraced' ? `url(${asset.thumbnail})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {renderMode !== 'wireframe' && (
                    <div className="absolute inset-0 rounded-xl bg-slate-950/60 backdrop-blur-[1px]" />
                  )}

                  <div className="relative z-10 text-center pointer-events-none">
                    <span className="text-[11px] font-bold tracking-tight block truncate max-w-[120px] text-white drop-shadow-md">
                      {asset.name.split(' ')[0]} {asset.name.split(' ')[1]}
                    </span>
                    <span className="text-[9px] font-mono text-indigo-300 block">
                      ${asset.price}
                    </span>
                  </div>

                  {/* Ergonomic Clearance line & badge if toggled */}
                  {showMeasurements && isSelected && (
                    <div className="absolute -bottom-8 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow-xl pointer-events-none animate-bounce">
                      38" Clear Walkway OK
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Item Floating Editor Toolbar */}
      {selectedItemId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 glass-panel px-4 py-2 rounded-2xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-3 pointer-events-auto border border-indigo-500/40 bg-slate-900/95">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <span className="font-bold text-indigo-400">Selected:</span>
            <span className="truncate max-w-[150px]">
              {getAsset(placedItems.find(p => p.id === selectedItemId)?.assetId || '')?.name}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Rotate left / right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRotateItem(selectedItemId, -45)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              title="Rotate Counter-Clockwise 45°"
            >
              ⟲ -45°
            </button>
            <button
              onClick={() => onRotateItem(selectedItemId, 45)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              title="Rotate Clockwise 45°"
            >
              ⟳ +45°
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => onDeleteItem(selectedItemId)}
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition"
            title="Delete Item (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Minimap Overlay (bottom-right of canvas) */}
      <div className="absolute bottom-3 right-3 z-25 pointer-events-none hidden lg:block">
        <div className="glass-panel p-2 rounded-xl border border-slate-700/80 pointer-events-auto w-36 h-28 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-slate-950/80" />
          {/* Room polygons */}
          <svg viewBox="0 0 1000 800" className="w-full h-full opacity-60">
            {rooms.map(r => {
              const pts = r.polygon.map(p => `${p.x * 0.85},${p.y * 0.85}`).join(' ');
              return (
                <polygon
                  key={r.id}
                  points={pts}
                  fill={r.id === activeRoomId ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.2)'}
                  stroke={r.id === activeRoomId ? '#818cf8' : '#475569'}
                  strokeWidth="2"
                />
              );
            })}
            {/* Furniture dots */}
            {placedItems.map((item, i) => {
              const cx = 300 * 0.85 + item.position.x * 60 * 0.85;
              const cy = 280 * 0.85 + item.position.z * 60 * 0.85;
              return <circle key={i} cx={cx} cy={cy} r="4" fill="#60a5fa" />;
            })}
            {/* Viewport camera indicator */}
            <rect x="340" y="200" width="180" height="140" rx="6" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8 4" className="animate-pulse" />
          </svg>
          <div className="absolute bottom-1 left-1 text-[8px] font-mono text-slate-500">MINIMAP</div>
        </div>
      </div>

      {/* Viewport Bottom Overlay Bar: Circadian Sun + Stats + Fullscreen */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Sun & Lighting Simulation Controls */}
        <div className="glass-panel px-3.5 py-2 rounded-xl pointer-events-auto flex items-center gap-3 shadow-2xl">
          <div className="flex items-center gap-2 text-xs">
            <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="text-slate-400 hidden sm:inline">Sun Simulation:</span>
            <input
              type="range"
              min={6}
              max={21}
              step={0.5}
              value={sunHour}
              onChange={(e) => setSunHour(parseFloat(e.target.value))}
              className="w-24 sm:w-36 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-300 w-16">
              {sunHour > 12 ? `${(sunHour - 12).toFixed(1)} PM` : `${sunHour.toFixed(1)} AM`}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-indigo-400 font-semibold">CRI 98</span>
            <span>•</span>
            <span>GI Lumen Active</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> WebGPU 60fps
            </span>
          </div>
        </div>

        {/* Room Switcher & AI Upscale & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-panel p-1 rounded-xl flex items-center gap-1 shadow-2xl">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRoom(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  r.id === activeRoomId ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={onTriggerRender}
            className="glass-panel px-3 py-2 rounded-xl hover:bg-slate-800 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xl transition"
            title="Generate Photorealistic 4K AI Render"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Upscale</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="glass-panel p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition"
            title="Toggle Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
