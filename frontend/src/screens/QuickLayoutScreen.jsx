import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Image as ImageIcon,
  Layout,
  Move,
  Plus,
  Save,
  Scissors,
  ShieldAlert,
  Trash2,
  Upload,
  Wand2,
  MousePointer2,
  Box,
  DoorOpen,
  Type
} from 'lucide-react';

const SNAP = 20;
const GRID_SIZE = 1000;

function snap(val) {
  return Math.round(val / SNAP) * SNAP;
}

export default function QuickLayoutScreen({ projectId, onComplete }) {
  const [walls, setWalls] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [tool, setTool] = useState('wall'); // wall | door | window | furniture | select
  const [selectedId, setSelectedId] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [underlay, setUnderlay] = useState(null);
  const svgRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setHistory(prev => {
      if (!prev.length) return [{ walls: [], openings: [], furniture: [] }];
      return prev;
    });
  }, []);

  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState('');
  const [promoteSuccess, setPromoteSuccess] = useState('');
  const [hoveredCanvas, setHoveredCanvas] = useState(false);

  const toolGroups = [
    {
      key: 'edit',
      label: 'Edit',
      items: [
        { key: 'select', label: 'Select / Move', hint: 'V', icon: MousePointer2 },
        { key: 'pan', label: 'Pan Canvas', hint: 'Middle-click', icon: Move },
      ]
    },
    {
      key: 'build',
      label: 'Build',
      items: [
        { key: 'wall', label: 'Wall', hint: 'W', icon: Layout },
        { key: 'door', label: 'Door', hint: 'D', icon: DoorOpen },
        { key: 'window', label: 'Window', hint: 'Win', icon: ShieldAlert },
        { key: 'furniture', label: 'Furniture Block', hint: 'G', icon: Box },
      ]
    }
  ];

  const isToolActive = (key) => tool === key;

  const deleteSelected = () => {
    if (!selectedId) return;
    const nextWalls = walls.filter((w) => w.id !== selectedId);
    const nextOpenings = openings.filter((o) => o.id !== selectedId);
    const nextFurniture = furniture.filter((f) => f.id !== selectedId);
    setWalls(nextWalls);
    setOpenings(nextOpenings);
    setFurniture(nextFurniture);
    pushHistory(nextWalls, nextOpenings, nextFurniture);
    setSelectedId(null);
  };

  const pushHistory = (nextWalls, nextOpenings, nextFurniture) => {
    setHistory(prev => {
      const next = [...prev.slice(0, historyIndex + 1), { walls: nextWalls, openings: nextOpenings, furniture: nextFurniture }];
      return next.slice(-30);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setWalls(prev.walls);
    setOpenings(prev.openings);
    setFurniture(prev.furniture);
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setWalls(next.walls);
    setOpenings(next.openings);
    setFurniture(next.furniture);
    setHistoryIndex(historyIndex + 1);
  };
  const exportImage = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quick-layout.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const promoteToScene = async () => {
    if (!projectId) return;
    setPromoting(true);
    setPromoteError('');
    try {
      const svgEl = svgRef.current;
      const topViewSvg = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
      const all = [...walls, ...openings, ...furniture];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const item of all) {
        const xs = [item.x1, item.x2, item.x - (item.width || 0) / 2, item.x + (item.width || 0) / 2].filter((v) => Number.isFinite(v));
        const ys = [item.y1, item.y2, item.y - (item.depth || item.height || 0) / 2, item.y + (item.depth || item.height || 0) / 2].filter((v) => Number.isFinite(v));
        if (!xs.length || !ys.length) continue;
        minX = Math.min(minX, ...xs);
        minY = Math.min(minY, ...ys);
        maxX = Math.max(maxX, ...xs);
        maxY = Math.max(maxY, ...ys);
      }
      const widthMm = Number.isFinite(maxX - minX) ? Math.max(0, maxX - minX) : 0;
      const depthMm = Number.isFinite(maxY - minY) ? Math.max(0, maxY - minY) : 0;
      const payload = {
        topViewSvg,
        widthMm,
        depthMm,
        roomType: 'room',
      };
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/layout/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(text || `HTTP ${res.status}`);
      }
      setPromoteSuccess('Layout promoted to scene.');
      onComplete?.('cad');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to promote layout.';
      setPromoteError(message);
    } finally {
      setPromoting(false);
      setTimeout(() => setPromoteSuccess(''), 3000);
    }
  };

  const handleUploadUnderlay = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUnderlay(reader.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName?.toLowerCase() === 'input') return;
        deleteSelected();
      }
      if (e.key === 'v') setTool('select');
      if (e.key === 'w') setTool('wall');
      if (e.key === 'd') setTool('door');
      if (e.key === 'g') setTool('furniture');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, selectedId, tool, walls, openings, furniture, history, historyIndex]);

  return (
    <div className="h-full w-full flex flex-col text-left">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Quick Layout Sketch</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Draw walls, doors, windows, and furniture blocks. Promote into the main design scene when ready.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={undo} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:text-white">Undo</button>
          <button onClick={redo} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:text-white">Redo</button>
          <button onClick={exportImage} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:text-white flex items-center gap-1"><Download className="w-3 h-3"/>Export SVG</button>
          {projectId && (
            <button 
              onClick={promoteToScene} 
              disabled={promoting} 
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 disabled:opacity-60"
            >
              <Wand2 className="w-3 h-3"/>{promoting ? 'Promoting...' : 'Promote to Scene'}
            </button>
          )}
          {promoteError && (
            <span className="text-[10px] text-red-400 font-mono" role="alert">{promoteError}</span>
          )}
          {!promoteError && promoteSuccess && (
            <span className="text-[10px] text-emerald-400 font-mono" aria-live="polite">Layout promoted successfully.</span>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <div className="w-56 space-y-2">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-3 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tools</div>
            {[
              { key: 'select', label: 'Select / Move (V)', icon: Move },
              { key: 'wall', label: 'Wall (W)', icon: Layout },
              { key: 'door', label: 'Door (D)', icon: Plus },
              { key: 'window', label: 'Window', icon: Plus },
              { key: 'furniture', label: 'Furniture Block (G)', icon: Layout },
              { key: 'pan', label: 'Pan', icon: Move },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className={`w-full py-2 px-3 rounded-xl text-[11px] font-bold flex items-center gap-2 transition border ${
                  tool === t.key ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-800'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
            <button onClick={deleteSelected} disabled={!selectedId} className="w-full py-2 px-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-black uppercase text-red-300 hover:text-red-200 disabled:opacity-40 flex items-center gap-2 justify-center"><Trash2 className="w-3.5 h-3.5"/>Delete Selected</button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-3 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Underlay</div>
            <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-2 justify-center"><Upload className="w-3.5 h-3.5"/>Upload Plan Image</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadUnderlay} />
            {underlay && <img src={underlay} alt="underlay" className="w-full h-24 object-cover rounded-lg border border-slate-800" />}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-3 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stats</div>
            <div className="text-[10px] text-slate-500">Walls: {walls.length}</div>
            <div className="text-[10px] text-slate-500">Openings: {openings.length}</div>
            <div className="text-[10px] text-slate-500">Furniture blocks: {furniture.length}</div>
            <div className="text-[10px] text-slate-500">Selected: {selectedId || 'none'}</div>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            className="w-full h-[520px] bg-slate-950"
            style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <defs>
                <pattern id="grid" width={SNAP} height={SNAP} patternUnits="userSpaceOnUse">
                  <path d={`M ${SNAP} 0 L 0 0 0 ${SNAP}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={GRID_SIZE} height={GRID_SIZE} fill="url(#grid)" />
              {underlay && (
                <image href={underlay} x="0" y="0" width={GRID_SIZE} height={GRID_SIZE} opacity="0.35" preserveAspectRatio="xMidYMid meet" />
              )}
              {walls.map((w) => (
                <line key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={selectedId === w.id ? '#D4AF37' : '#cbd5e1'} strokeWidth={selectedId === w.id ? 6 : 4} />
              ))}
              {openings.map((o) => (
                <rect key={o.id} x={o.x - o.width / 2} y={o.y - 20} width={o.width / 5} height={40} fill={o.type === 'door' ? '#7dbb74' : '#6fa8ff'} opacity="0.9" />
              ))}
              {furniture.map((f) => (
                <rect key={f.id} x={f.x - f.width / 2} y={f.y - f.depth / 2} width={f.width / 5} height={f.depth / 5} fill={selectedId === f.id ? '#D4AF37' : '#94a3b8'} opacity="0.85" />
              ))}
            </g>
          </svg>
          <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded text-[8px] text-slate-500 font-mono pointer-events-none select-none">
            W=Wall · D=Door · G=Furniture · V=Select · Del=Delete · Ctrl+Z/Y
          </div>
        </div>
      </div>
    </div>
  );
}
