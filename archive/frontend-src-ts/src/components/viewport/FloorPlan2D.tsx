import React, { useState } from 'react';
import { RoomData, PlacedItem } from '../../types/aura';
import { 
  Ruler, 
  Scan, 
  Compass, 
  Activity, 
  Layers, 
  Pencil
} from 'lucide-react';

interface FloorPlan2DProps {
  rooms: RoomData[];
  placedItems: PlacedItem[];
  onSelectRoom: (roomId: string) => void;
  activeRoomId: string;
}

export const FloorPlan2D: React.FC<FloorPlan2DProps> = ({
  rooms,
  placedItems,
  onSelectRoom,
  activeRoomId
}) => {
  const [showTrafficHeatmap, setShowTrafficHeatmap] = useState(false);
  const [showVastu, setShowVastu] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'wall' | 'door' | 'measure'>('select');

  return (
    <div className="flex-1 relative flex flex-col blueprint-bg overflow-hidden select-none text-slate-200">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-blue-900/40 bg-slate-950/80 backdrop-blur flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono text-blue-400 mr-2 flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-400" /> 2D CAD ENGINE
          </span>

          {(['select', 'wall', 'door', 'measure'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTool(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition flex items-center gap-1.5 ${
                activeTool === t 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {t === 'wall' && <Pencil className="w-3.5 h-3.5" />}
              {t === 'door' && <span className="text-base leading-none">🚪</span>}
              {t === 'measure' && <Ruler className="w-3.5 h-3.5" />}
              <span>{t}</span>
            </button>
          ))}
        </div>

        {/* AI Capabilities & Compliance Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowTrafficHeatmap(!showTrafficHeatmap)}
            className={`px-2.5 py-1 rounded-lg font-mono transition flex items-center gap-1.5 ${
              showTrafficHeatmap ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Traffic Flow Heatmap</span>
          </button>

          <button
            onClick={() => setShowVastu(!showVastu)}
            className={`px-2.5 py-1 rounded-lg font-mono transition flex items-center gap-1.5 ${
              showVastu ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Vastu/Feng Shui</span>
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1 rounded-lg font-mono transition flex items-center gap-1.5 ${
              showDimensions ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Auto-Dimensions</span>
          </button>
        </div>
      </div>

      {/* Main Vector Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        {/* SVG Blueprint Board */}
        <svg 
          viewBox="0 0 1000 800" 
          className="w-full max-w-[950px] max-h-[100%] border-2 border-blue-500/30 rounded-2xl bg-[#091124]/90 shadow-2xl transition"
        >
          <defs>
            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
            </pattern>
            <radialGradient id="trafficGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
              <stop offset="50%" stopColor="rgba(245, 158, 11, 0.3)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
            </radialGradient>
          </defs>

          <rect width="1000" height="800" fill="url(#cadGrid)" />

          {/* Rooms Rendering */}
          {rooms.map((room) => {
            const isSelected = room.id === activeRoomId;
            const pointsStr = room.polygon.map(p => `${p.x},${p.y}`).join(' ');
            const minX = Math.min(...room.polygon.map(p => p.x));
            const minY = Math.min(...room.polygon.map(p => p.y));
            const maxX = Math.max(...room.polygon.map(p => p.x));
            const maxY = Math.max(...room.polygon.map(p => p.y));
            const widthCm = room.dimensions.width * 100;
            const lengthCm = room.dimensions.length * 100;

            return (
              <g 
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="cursor-pointer transition duration-300"
              >
                {/* Room Fill */}
                <polygon
                  points={pointsStr}
                  fill={isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 58, 138, 0.15)'}
                  stroke={isSelected ? '#60a5fa' : 'rgba(96, 165, 250, 0.4)'}
                  strokeWidth={isSelected ? '4' : '2'}
                  className="hover:fill-blue-500/30 transition-all"
                />

                {/* Structural Walls representation */}
                <polyline
                  points={pointsStr + ` ${room.polygon[0].x},${room.polygon[0].y}`}
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* Auto-Dimensions */}
                {showDimensions && (
                  <>
                    <text 
                      x={(minX + maxX) / 2} 
                      y={minY - 12} 
                      fill="#60a5fa" 
                      fontSize="13" 
                      fontFamily="JetBrains Mono" 
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {widthCm} cm
                    </text>
                    <text 
                      x={maxX + 15} 
                      y={(minY + maxY) / 2} 
                      fill="#60a5fa" 
                      fontSize="13" 
                      fontFamily="JetBrains Mono" 
                      textAnchor="start"
                    >
                      {lengthCm} cm
                    </text>
                  </>
                )}

                {/* Room Label */}
                <text
                  x={(minX + maxX) / 2}
                  y={(minY + maxY) / 2 - 10}
                  fill="#ffffff"
                  fontSize="16"
                  fontFamily="Plus Jakarta Sans"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {room.name}
                </text>
                <text
                  x={(minX + maxX) / 2}
                  y={(minY + maxY) / 2 + 12}
                  fill="#93c5fd"
                  fontSize="12"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {(room.dimensions.width * room.dimensions.length).toFixed(1)} m²
                </text>
              </g>
            );
          })}

          {/* Placed Furniture Items representation in 2D vector space */}
          {placedItems.map((item, idx) => {
            const x = 300 + item.position.x * 60;
            const y = 280 + item.position.z * 60;
            return (
              <g key={item.id || idx} transform={`translate(${x}, ${y}) rotate(${item.rotation.y})`}>
                <rect
                  x="-25"
                  y="-15"
                  width="50"
                  height="30"
                  rx="4"
                  fill="rgba(255, 255, 255, 0.15)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle cx="0" cy="0" r="3" fill="#60a5fa" />
              </g>
            );
          })}

          {/* Traffic Flow Heatmap if toggled */}
          {showTrafficHeatmap && (
            <g opacity="0.85" className="pointer-events-none animate-pulse">
              <circle cx="300" cy="280" r="140" fill="url(#trafficGradient)" />
              <circle cx="650" cy="230" r="120" fill="url(#trafficGradient)" />
            </g>
          )}

          {/* Vastu / Feng Shui compliance indicator */}
          {showVastu && (
            <g transform="translate(820, 680)" className="pointer-events-none">
              <rect x="-80" y="-45" width="160" height="75" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#a855f7" strokeWidth="2" />
              <text x="0" y="-20" fill="#c084fc" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
                🔮 VASTU CHECK
              </text>
              <text x="0" y="2" fill="#4ade80" fontSize="10" fontFamily="Plus Jakarta Sans" textAnchor="middle">
                ✔ North Entrance 98%
              </text>
              <text x="0" y="18" fill="#4ade80" fontSize="10" fontFamily="Plus Jakarta Sans" textAnchor="middle">
                ✔ NE Living Light OK
              </text>
            </g>
          )}
        </svg>

        {/* Floating Input Simulator Card on right */}
        <div className="absolute bottom-6 right-6 w-72 glass-panel p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs space-y-3 shadow-2xl">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
            <Scan className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Smart AI Floor Plan Vectorizer</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Trained on 2M+ floor plans. Upload a photo or sketch to auto-extract walls, openings, and structural boundaries.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => alert("Simulated: Uploaded sketch vectorized into 2D CAD walls.")}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-center font-mono text-[11px] text-slate-200 transition"
            >
              ✏️ Sketch Input
            </button>
            <button 
              onClick={() => alert("Simulated: LiDAR Point Cloud converted to 3D room rooms.")}
              className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/50 text-center font-mono text-[11px] text-indigo-300 transition"
            >
              📱 LiDAR Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
