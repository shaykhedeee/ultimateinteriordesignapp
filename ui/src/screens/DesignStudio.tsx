import { Layers, Box, Grid, Camera, RotateCcw, Save, Maximize2, Monitor, Move, CornerUpLeft, CornerUpRight } from 'lucide-react';

const modules = [
  { id: 'M1', name: 'L-Shape Kitchen', dims: '3.2m × 2.8m', mat: 'White Laminate', count: 12, status: 'placed', color: '#4A7CFF' },
  { id: 'M2', name: 'Island Counter', dims: '1.8m × 0.9m', mat: 'Quartz Top', count: 1, status: 'placed', color: '#4A7CFF' },
  { id: 'M3', name: 'Wardrobe 3-door', dims: '2.4m × 0.6m', mat: 'Sand Oak', count: 8, status: 'placed', color: '#8B5CF6' },
  { id: 'M4', name: 'TV Unit', dims: '2.1m × 0.45m', mat: 'Dark Wenge', count: 4, status: 'placed', color: '#C9A84C' },
  { id: 'M5', name: 'Bed Frame (King)', dims: '1.8m × 2.0m', mat: 'Upholstered', count: 1, status: 'placed', color: '#F43F5E' },
  { id: 'M6', name: 'Bookshelf Unit', dims: '1.2m × 0.3m', mat: 'Light Oak', count: 3, status: 'suggested', color: '#2DD4BF' },
];

const rooms = ['Living Room', 'Master Bedroom', 'Kitchen', 'Bedroom 2'];

const materials = [
  { name: 'White Matte', type: 'Laminate', hex: '#F5F4F0' },
  { name: 'Sand Oak', type: 'Veneer', hex: '#C9A87A' },
  { name: 'Dark Wenge', type: 'Laminate', hex: '#3D2B1F' },
  { name: 'Sage Green', type: 'Matte Paint', hex: '#8FAB8B' },
  { name: 'Charcoal', type: 'Matte Paint', hex: '#3A3A3A' },
  { name: 'Marble White', type: 'Quartz', hex: '#EEEAE4' },
];

const tools = [
  { icon: <Move size={14} />, label: 'Move' },
  { icon: <CornerUpLeft size={14} />, label: 'Rotate' },
  { icon: <Maximize2 size={14} />, label: 'Scale' },
  { icon: <CornerUpRight size={14} />, label: 'Snap' },
  { icon: <Grid size={14} />, label: 'Grid' },
  { icon: <Layers size={14} />, label: 'Layers' },
];

export default function DesignStudio() {
  return (
    <div className="flex h-full overflow-hidden bg-[#0A0A0B]">

      {/* Left: Module Palette */}
      <div className="w-[230px] min-w-[230px] border-r border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-3 border-b border-[#2A2A35]">
          <div className="text-[11px] text-[#555566] uppercase tracking-widest font-bold mb-2">Rooms</div>
          <div className="space-y-0.5">
            {rooms.map((r, i) => (
              <button key={r} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${i === 0 ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899] hover:bg-[#141418]'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-b border-[#2A2A35]">
          <div className="text-[11px] text-[#555566] uppercase tracking-widest font-bold mb-2">Modules</div>
          <div className="space-y-1.5">
            {modules.map((m) => (
              <div key={m.id} className="flex items-start gap-2 p-2 rounded-xl bg-[#111113] border border-[#2A2A35] hover:border-[#3A3A48] cursor-pointer transition-all group">
                <div className="w-5 h-5 rounded-md shrink-0 mt-0.5" style={{ background: m.color + '28', border: `1px solid ${m.color}44` }}>
                  <Box size={9} className="m-auto mt-[3px]" style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-[#F0EEE8] truncate">{m.name}</div>
                  <div className="text-[9px] text-[#555566]">{m.dims}</div>
                  <div className="text-[9px] text-[#555566]">{m.mat}</div>
                </div>
                {m.status === 'suggested' && (
                  <div className="shrink-0 text-[8px] text-[#8B5CF6] border border-[#8B5CF633] bg-[#8B5CF618] px-1 py-0.5 rounded font-bold">AI</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="p-3 flex-1">
          <div className="text-[11px] text-[#555566] uppercase tracking-widest font-bold mb-2">Materials</div>
          <div className="grid grid-cols-3 gap-1.5">
            {materials.map((mat) => (
              <div key={mat.name} className="flex flex-col items-center cursor-pointer group">
                <div className="w-full aspect-square rounded-lg border border-[#2A2A35] group-hover:border-[#C9A84C66] transition-colors"
                  style={{ background: mat.hex }} />
                <span className="text-[9px] text-[#555566] mt-1 text-center leading-tight">{mat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center: 3D Viewport */}
      <div className="flex-1 flex flex-col">
        {/* Viewport Toolbar */}
        <div className="h-11 flex items-center gap-2 px-4 border-b border-[#2A2A35] bg-[#0D0D10]">
          {/* Tools */}
          <div className="flex items-center gap-0.5">
            {tools.map((t, i) => (
              <button key={t.label} title={t.label}
                className={`p-2 rounded-lg transition-colors ${i === 0 ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899] hover:bg-[#141418]'}`}>
                {t.icon}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#2A2A35]" />

          {/* View modes */}
          <div className="flex items-center gap-1">
            {[
              { label: '3D', icon: <Box size={11} /> },
              { label: '2D', icon: <Grid size={11} /> },
              { label: 'Split', icon: <Monitor size={11} /> },
            ].map((v) => (
              <button key={v.label} className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${v.label === '3D' ? 'text-[#C9A84C] bg-[#C9A84C14] border border-[#C9A84C33]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#2A2A35]" />

          <div className="flex items-center gap-1.5">
            {['Perspective', 'Top', 'Front', 'Right'].map((c, i) => (
              <button key={c} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${i === 0 ? 'text-[#F0EEE8] bg-[#1E1E24] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#8A8899]">
              <RotateCcw size={11} />
              Undo
            </button>
            <button className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#8A8899]">
              <Save size={11} />
              Save v3
            </button>
            <button className="btn-gold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold">
              <Camera size={11} />
              Generate Render
            </button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 relative bg-[#0A0A0B] flex items-center justify-center overflow-hidden">
          {/* Room grid floor */}
          <div className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 80%, #1A1520 0%, #0A0A0B 60%)',
            }}
          />
          {/* Perspective grid */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3"
            style={{
              backgroundImage: `
                linear-gradient(rgba(50,50,70,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(50,50,70,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: 'perspective(400px) rotateX(55deg)',
              transformOrigin: 'bottom',
              opacity: 0.5,
            }}
          />

          {/* Isometric 3D Room Mockup */}
          <div className="relative z-10 select-none">
            <svg width="560" height="380" viewBox="0 0 560 380">
              {/* Room shell — isometric walls */}
              {/* Floor */}
              <polygon points="140,260 280,340 420,260 280,180" fill="#1A1922" stroke="#3A3A48" strokeWidth="1" />

              {/* Back wall left */}
              <polygon points="140,100 140,260 280,180 280,20" fill="#151420" stroke="#3A3A48" strokeWidth="1" />

              {/* Back wall right */}
              <polygon points="280,20 280,180 420,260 420,100" fill="#181722" stroke="#3A3A48" strokeWidth="1" />

              {/* Ceiling (ghost) */}
              <polygon points="140,100 280,20 420,100 280,180" fill="none" stroke="#2A2A35" strokeWidth="0.5" strokeDasharray="4,3" />

              {/* Kitchen Units on left wall */}
              <polygon points="145,200 145,245 195,268 195,223" fill="#2A2830" stroke="#4A7CFF44" strokeWidth="1" />
              <polygon points="145,155 145,200 195,223 195,178" fill="#252333" stroke="#4A7CFF66" strokeWidth="1" />
              <polygon points="145,155 195,178 220,165 170,142" fill="#302E3D" stroke="#4A7CFF44" strokeWidth="1" />
              <text x="155" y="215" fill="#4A7CFF88" fontSize="7" fontFamily="DM Sans">Lower Unit</text>

              {/* Wardrobe on right wall */}
              <polygon points="360,200 360,245 410,222 410,177" fill="#2A2430" stroke="#8B5CF666" strokeWidth="1" />
              <polygon points="360,155 360,200 410,177 410,132" fill="#252030" stroke="#8B5CF666" strokeWidth="1" />
              <polygon points="360,155 410,132 435,145 385,168" fill="#2E2838" stroke="#8B5CF644" strokeWidth="1" />
              <line x1="385" y1="166" x2="385" y2="243" stroke="#8B5CF644" strokeWidth="0.5" />
              <text x="368" y="200" fill="#8B5CF688" fontSize="7" fontFamily="DM Sans">Wardrobe</text>

              {/* TV Unit on back wall */}
              <polygon points="220,130 220,155 340,140 340,115" fill="#201E2A" stroke="#C9A84C55" strokeWidth="1" />
              <rect x="230" y="108" width="90" height="55" rx="2" fill="#111020" stroke="#C9A84C44" strokeWidth="0.5" />
              <rect x="232" y="110" width="86" height="51" rx="1" fill="#0A0815" />
              <text x="275" y="139" fill="#C9A84C44" fontSize="6" textAnchor="middle" fontFamily="DM Sans">TV</text>

              {/* Sofa on floor */}
              <polygon points="195,240 195,268 255,296 255,268" fill="#252333" stroke="#C9A84C33" strokeWidth="1" />
              <polygon points="195,220 195,240 255,268 255,248" fill="#2E2B3E" stroke="#C9A84C44" strokeWidth="1" />
              <polygon points="195,220 255,248 275,238 215,210" fill="#32303E" stroke="#C9A84C33" strokeWidth="0.5" />

              {/* Coffee table */}
              <polygon points="250,262 250,275 290,292 290,279" fill="#1E1C28" stroke="#3A3A48" strokeWidth="0.5" />
              <polygon points="250,255 250,262 290,279 290,272" fill="#28262E" stroke="#3A3A48" strokeWidth="0.5" />
              <polygon points="250,255 290,272 310,264 270,247" fill="#2C2A34" stroke="#3A3A48" strokeWidth="0.5" />

              {/* Ceiling light */}
              <ellipse cx="280" cy="50" rx="15" ry="8" fill="#C9A84C11" stroke="#C9A84C44" strokeWidth="0.5" />
              <line x1="280" y1="20" x2="280" y2="42" stroke="#C9A84C33" strokeWidth="0.5" />
              <ellipse cx="280" cy="50" rx="8" ry="4" fill="#C9A84C33" />

              {/* Light rays */}
              {[...Array(8)].map((_, i) => (
                <line key={i}
                  x1="280" y1="55"
                  x2={280 + Math.cos((i * 45 * Math.PI) / 180) * 80}
                  y2={55 + Math.sin((i * 45 * Math.PI) / 180) * 60}
                  stroke="#C9A84C" strokeWidth="0.3" opacity="0.15"
                />
              ))}

              {/* Module labels overlay */}
              <rect x="170" y="60" width="60" height="16" rx="3" fill="#4A7CFF18" />
              <text x="200" y="71" fill="#4A7CFF" fontSize="8" textAnchor="middle" fontFamily="DM Sans" fontWeight="600">Kitchen</text>
              <rect x="340" y="80" width="60" height="16" rx="3" fill="#8B5CF618" />
              <text x="370" y="91" fill="#8B5CF6" fontSize="8" textAnchor="middle" fontFamily="DM Sans" fontWeight="600">Wardrobe</text>

              {/* Selection indicator */}
              <rect x="190" y="110" width="100" height="75" rx="2" fill="none" stroke="#C9A84C" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
              <circle cx="190" cy="110" r="3" fill="#C9A84C" />
              <circle cx="290" cy="110" r="3" fill="#C9A84C" />
              <circle cx="190" cy="185" r="3" fill="#C9A84C" />
              <circle cx="290" cy="185" r="3" fill="#C9A84C" />
            </svg>
          </div>

          {/* Floating Dimension Labels */}
          <div className="absolute top-4 left-4 bg-[#111113dd] border border-[#2A2A35] rounded-xl px-4 py-3 backdrop-blur-xl">
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Scene Info</div>
            <div className="space-y-1">
              {[
                { k: 'Room', v: 'Living Room' },
                { k: 'Area', v: '24.5 m²' },
                { k: 'Height', v: '2.8m' },
                { k: 'Modules', v: '5 placed' },
                { k: 'Version', v: 'v3 · Draft' },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-center justify-between gap-6 text-[11px]">
                  <span className="text-[#555566]">{k}</span>
                  <span className="text-[#F0EEE8] font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 ai-badge rounded-full px-4 py-2 flex items-center gap-2 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            AI suggests: Add bookshelf to North wall for better space utilization
            <button className="text-[#C9A84C] font-semibold ml-1">Apply</button>
            <button className="text-[#555566] ml-1">Dismiss</button>
          </div>
        </div>
      </div>

      {/* Right: Properties Panel */}
      <div className="w-[220px] min-w-[220px] border-l border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-3 border-b border-[#2A2A35]">
          <div className="text-[11px] text-[#555566] uppercase tracking-widest font-bold mb-0.5">Properties</div>
          <div className="text-[12px] font-semibold text-[#F0EEE8]">TV Unit — Living Room</div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Dimensions */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Dimensions</div>
            <div className="space-y-2">
              {[
                { label: 'Width', value: '2100', unit: 'mm' },
                { label: 'Depth', value: '450', unit: 'mm' },
                { label: 'Height', value: '520', unit: 'mm' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#555566] w-12 shrink-0">{d.label}</span>
                  <div className="flex-1 flex items-center bg-[#1E1E24] border border-[#2A2A35] rounded-lg px-2 py-1.5">
                    <input className="flex-1 bg-transparent text-[11px] text-[#F0EEE8] outline-none w-full" defaultValue={d.value} />
                    <span className="text-[9px] text-[#555566] ml-1">{d.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Material</div>
            <div className="space-y-1.5">
              {['Dark Wenge Lam.', 'White Acrylic', 'Sand Oak Ven.'].map((m, i) => (
                <button key={m} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${i === 0 ? 'bg-[#C9A84C18] border border-[#C9A84C44] text-[#C9A84C]' : 'text-[#555566] hover:bg-[#141418] hover:text-[#8A8899] border border-transparent'}`}>
                  <div className="w-4 h-4 rounded-sm" style={{ background: i === 0 ? '#3D2B1F' : i === 1 ? '#F5F5F5' : '#C9A87A' }} />
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Validation */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Rule Checks</div>
            <div className="space-y-1.5">
              {[
                { rule: 'Wall clearance 150mm', pass: true },
                { rule: 'Min walkway 900mm', pass: true },
                { rule: 'TV unit depth ≤ 500mm', pass: true },
                { rule: 'Vastu — South wall TV', pass: false },
              ].map((r) => (
                <div key={r.rule} className="flex items-center gap-2 text-[10px]">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.pass ? 'bg-[#2DD4BF]' : 'bg-[#F43F5E]'}`} />
                  <span className={r.pass ? 'text-[#555566]' : 'text-[#F43F5E]'}>{r.rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Position</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ l: 'X', v: '0.0' }, { l: 'Y', v: '0.0' }, { l: 'Rot', v: '0°' }, { l: 'Wall', v: 'North' }].map((p) => (
                <div key={p.l} className="bg-[#1E1E24] border border-[#2A2A35] rounded-lg px-2 py-1.5">
                  <div className="text-[9px] text-[#555566]">{p.l}</div>
                  <div className="text-[11px] text-[#F0EEE8] font-medium">{p.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#2A2A35] space-y-1.5">
          <button className="w-full btn-gold px-3 py-2 rounded-lg text-[11px] font-semibold">Apply Changes</button>
          <button className="w-full btn-ghost px-3 py-2 rounded-lg text-[11px] text-[#8A8899]">Duplicate Module</button>
        </div>
      </div>
    </div>
  );
}
