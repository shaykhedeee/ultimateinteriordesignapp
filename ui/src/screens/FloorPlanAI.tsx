import { Zap, CheckCircle, AlertCircle, Eye, Edit3, RefreshCw, ChevronRight, Info } from 'lucide-react';

const rooms = [
  { id: 'R1', name: 'Living Room', area: '24.5 m²', confidence: 97, walls: 4, openings: 3, status: 'confirmed', color: '#4A7CFF' },
  { id: 'R2', name: 'Master Bedroom', area: '18.2 m²', confidence: 94, walls: 4, openings: 2, status: 'confirmed', color: '#8B5CF6' },
  { id: 'R3', name: 'Kitchen', area: '12.8 m²', confidence: 91, walls: 4, openings: 2, status: 'review', color: '#F59E0B' },
  { id: 'R4', name: 'Bedroom 2', area: '14.1 m²', confidence: 88, walls: 4, openings: 2, status: 'confirmed', color: '#2DD4BF' },
  { id: 'R5', name: 'Bathroom 1', area: '6.4 m²', confidence: 96, walls: 4, openings: 1, status: 'confirmed', color: '#C9A84C' },
  { id: 'R6', name: 'Utility / Balcony', area: '4.2 m²', confidence: 72, walls: 3, openings: 2, status: 'low-confidence', color: '#F43F5E' },
  { id: 'R7', name: 'Bathroom 2', area: '5.1 m²', confidence: 93, walls: 4, openings: 1, status: 'confirmed', color: '#C9A84C' },
  { id: 'R8', name: 'Foyer / Entrance', area: '5.8 m²', confidence: 85, walls: 3, openings: 3, status: 'review', color: '#F59E0B' },
];

const walls = [
  { id: 'W1', room: 'Living Room', side: 'North', length: '5.2m', height: '2.8m', openings: ['Door D1', 'Window W2'] },
  { id: 'W2', room: 'Living Room', side: 'East', length: '4.7m', height: '2.8m', openings: ['Window W3'] },
  { id: 'W3', room: 'Kitchen', side: 'South', length: '3.6m', height: '2.8m', openings: ['Window W1'] },
  { id: 'W4', room: 'Master Bedroom', side: 'West', length: '4.2m', height: '2.8m', openings: ['Door D2', 'Window W4'] },
];

const confColor = (c: number) => c >= 90 ? '#2DD4BF' : c >= 80 ? '#C9A84C' : '#F43F5E';
const statusIcon = (s: string) => {
  if (s === 'confirmed') return <CheckCircle size={12} className="text-[#2DD4BF]" />;
  if (s === 'review') return <AlertCircle size={12} className="text-[#F59E0B]" />;
  return <AlertCircle size={12} className="text-[#F43F5E]" />;
};

export default function FloorPlanAI() {
  return (
    <div className="flex h-full overflow-hidden bg-[#0A0A0B]">

      {/* Left Panel — Room List */}
      <div className="w-[300px] min-w-[300px] border-r border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Extracted Rooms</h3>
            <span className="text-[10px] text-[#555566] bg-[#1E1E24] px-2 py-1 rounded font-medium">8 detected</span>
          </div>
          {/* Confidence summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#2DD4BF12] border border-[#2DD4BF22] rounded-lg p-2 text-center">
              <div className="text-[15px] font-bold text-[#2DD4BF]">6</div>
              <div className="text-[9px] text-[#2DD4BF] uppercase tracking-wide font-medium">Confirmed</div>
            </div>
            <div className="bg-[#F59E0B12] border border-[#F59E0B22] rounded-lg p-2 text-center">
              <div className="text-[15px] font-bold text-[#F59E0B]">2</div>
              <div className="text-[9px] text-[#F59E0B] uppercase tracking-wide font-medium">Review</div>
            </div>
            <div className="bg-[#F43F5E12] border border-[#F43F5E22] rounded-lg p-2 text-center">
              <div className="text-[15px] font-bold text-[#F43F5E]">1</div>
              <div className="text-[9px] text-[#F43F5E] uppercase tracking-wide font-medium">Low Conf.</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {rooms.map((r) => (
            <div key={r.id} className="group flex items-center gap-3 px-3 py-3 rounded-xl bg-[#111113] border border-[#2A2A35] hover:border-[#3A3A48] cursor-pointer transition-all hover:bg-[#141418]">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: r.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {statusIcon(r.status)}
                  <span className="text-[12px] font-medium text-[#F0EEE8] truncate">{r.name}</span>
                </div>
                <div className="text-[10px] text-[#555566] mt-0.5">{r.area} · {r.walls} walls · {r.openings} openings</div>
              </div>
              <div className="text-[11px] font-semibold" style={{ color: confColor(r.confidence) }}>
                {r.confidence}%
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#2A2A35] space-y-2">
          <button className="w-full btn-gold px-4 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2">
            <CheckCircle size={13} />
            Confirm & Build Scene
          </button>
          <button className="w-full btn-ghost px-4 py-2 rounded-xl text-[12px] text-[#8A8899] flex items-center justify-center gap-2">
            <RefreshCw size={12} />
            Re-run AI Extraction
          </button>
        </div>
      </div>

      {/* Center — Floor Plan Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-11 flex items-center gap-3 px-4 border-b border-[#2A2A35] bg-[#0D0D10]">
          <div className="flex items-center gap-1">
            {['Select', 'Pan', 'Measure', 'Annotate'].map((t) => (
              <button key={t} className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${t === 'Select' ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[#2A2A35]" />
          <div className="flex items-center gap-1">
            {['50%', '75%', '100%', '125%'].map((z) => (
              <button key={z} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${z === '100%' ? 'text-[#C9A84C]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {z}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[#2A2A35]" />
          <div className="flex items-center gap-1.5 text-[11px] ai-badge px-2.5 py-1 rounded-lg">
            <Zap size={11} fill="currentColor" />
            AI Extraction Complete · 92% avg confidence
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
              <Eye size={12} />
              Overlay
            </button>
            <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
              <Edit3 size={12} />
              Edit
            </button>
          </div>
        </div>

        {/* Floor Plan Canvas */}
        <div className="flex-1 bg-[#0A0A0B] relative flex items-center justify-center overflow-hidden">
          {/* Grid */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(42,42,53,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,53,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Floor Plan SVG */}
          <div className="relative">
            <svg width="600" height="480" viewBox="0 0 600 480" className="relative z-10">
              {/* Outer boundary */}
              <rect x="40" y="30" width="520" height="420" rx="2" fill="none" stroke="#3A3A48" strokeWidth="2" />

              {/* Living Room */}
              <rect x="40" y="30" width="220" height="180" rx="1" fill="rgba(74,124,255,0.08)" stroke="#4A7CFF" strokeWidth="1.5" />
              <text x="100" y="115" fill="#4A7CFF" fontSize="11" fontWeight="600" fontFamily="DM Sans">Living Room</text>
              <text x="100" y="130" fill="#4A7CFF88" fontSize="9" fontFamily="DM Sans">24.5 m²</text>
              <text x="154" y="115" fill="#2DD4BF" fontSize="9" fontFamily="DM Sans">97%</text>

              {/* Master Bedroom */}
              <rect x="260" y="30" width="180" height="160" rx="1" fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" strokeWidth="1.5" />
              <text x="295" y="108" fill="#8B5CF6" fontSize="11" fontWeight="600" fontFamily="DM Sans">Master Bed</text>
              <text x="310" y="122" fill="#8B5CF688" fontSize="9" fontFamily="DM Sans">18.2 m²</text>

              {/* Bedroom 2 */}
              <rect x="440" y="30" width="120" height="200" rx="1" fill="rgba(45,212,191,0.08)" stroke="#2DD4BF" strokeWidth="1.5" />
              <text x="455" y="128" fill="#2DD4BF" fontSize="11" fontWeight="600" fontFamily="DM Sans">Bed 2</text>
              <text x="460" y="142" fill="#2DD4BF88" fontSize="9" fontFamily="DM Sans">14.1 m²</text>

              {/* Kitchen */}
              <rect x="40" y="210" width="160" height="140" rx="1" fill="rgba(245,158,11,0.08)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,2" />
              <text x="75" y="278" fill="#F59E0B" fontSize="11" fontWeight="600" fontFamily="DM Sans">Kitchen</text>
              <text x="82" y="292" fill="#F59E0B88" fontSize="9" fontFamily="DM Sans">12.8 m² · Review</text>

              {/* Foyer */}
              <rect x="200" y="210" width="120" height="80" rx="1" fill="rgba(245,158,11,0.06)" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3,2" />
              <text x="228" y="253" fill="#F59E0B" fontSize="10" fontWeight="600" fontFamily="DM Sans">Foyer</text>

              {/* Bathroom 1 */}
              <rect x="260" y="190" width="80" height="100" rx="1" fill="rgba(201,168,76,0.08)" stroke="#C9A84C" strokeWidth="1.5" />
              <text x="275" y="242" fill="#C9A84C" fontSize="10" fontWeight="600" fontFamily="DM Sans">Bath 1</text>

              {/* Bathroom 2 */}
              <rect x="340" y="190" width="100" height="100" rx="1" fill="rgba(201,168,76,0.08)" stroke="#C9A84C" strokeWidth="1.5" />
              <text x="363" y="242" fill="#C9A84C" fontSize="10" fontWeight="600" fontFamily="DM Sans">Bath 2</text>

              {/* Utility */}
              <rect x="40" y="350" width="120" height="100" rx="1" fill="rgba(244,63,94,0.06)" stroke="#F43F5E" strokeWidth="1" strokeDasharray="4,3" />
              <text x="62" y="400" fill="#F43F5E" fontSize="10" fontWeight="600" fontFamily="DM Sans">Utility</text>
              <text x="60" y="414" fill="#F43F5E88" fontSize="8" fontFamily="DM Sans">Low Confidence</text>

              {/* Dimensions */}
              <line x1="40" y1="20" x2="560" y2="20" stroke="#3A3A48" strokeWidth="0.5" />
              <text x="290" y="16" fill="#3A3A48" fontSize="8" textAnchor="middle" fontFamily="DM Sans">18.6 m</text>
              <line x1="30" y1="30" x2="30" y2="450" stroke="#3A3A48" strokeWidth="0.5" />
              <text x="16" y="240" fill="#3A3A48" fontSize="8" textAnchor="middle" transform="rotate(-90, 16, 240)" fontFamily="DM Sans">14.2 m</text>

              {/* Doors */}
              <path d="M 40 100 A 25 25 0 0 1 65 125" fill="none" stroke="#4A7CFF" strokeWidth="0.8" />
              <line x1="40" y1="100" x2="40" y2="125" stroke="#4A7CFF" strokeWidth="1" />
              <path d="M 260 120 A 25 25 0 0 0 285 95" fill="none" stroke="#8B5CF6" strokeWidth="0.8" />
              <line x1="260" y1="120" x2="260" y2="95" stroke="#8B5CF6" strokeWidth="1" />

              {/* Confidence badges */}
              <rect x="160" y="30" width="28" height="16" rx="3" fill="#2DD4BF18" />
              <text x="174" y="42" fill="#2DD4BF" fontSize="8" textAnchor="middle" fontWeight="700" fontFamily="DM Sans">97%</text>
              <rect x="340" y="30" width="28" height="16" rx="3" fill="#2DD4BF18" />
              <text x="354" y="42" fill="#2DD4BF" fontSize="8" textAnchor="middle" fontWeight="700" fontFamily="DM Sans">94%</text>
              <rect x="48" y="210" width="28" height="16" rx="3" fill="#F59E0B18" />
              <text x="62" y="222" fill="#F59E0B" fontSize="8" textAnchor="middle" fontWeight="700" fontFamily="DM Sans">91%</text>
              <rect x="48" y="350" width="28" height="16" rx="3" fill="#F43F5E18" />
              <text x="62" y="362" fill="#F43F5E" fontSize="8" textAnchor="middle" fontWeight="700" fontFamily="DM Sans">72%</text>
            </svg>

            {/* Floating tooltip for low confidence */}
            <div className="absolute bottom-0 right-0 bg-[#1E1E24] border border-[#F43F5E44] rounded-xl p-3 max-w-[200px]">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle size={12} className="text-[#F43F5E]" />
                <span className="text-[11px] font-semibold text-[#F43F5E]">Low Confidence</span>
              </div>
              <p className="text-[10px] text-[#8A8899] leading-relaxed">Utility/Balcony boundary unclear. Review and adjust manually before proceeding.</p>
              <button className="mt-2 text-[10px] text-[#C9A84C] font-medium flex items-center gap-1">
                Edit boundaries <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Wall Detail */}
      <div className="w-[260px] min-w-[260px] border-l border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Wall Schedule</h3>
          <p className="text-[11px] text-[#555566] mt-0.5">Click a wall to inspect</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {walls.map((w) => (
            <div key={w.id} className="bg-[#111113] border border-[#2A2A35] rounded-xl p-3 hover:border-[#3A3A48] cursor-pointer transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#F0EEE8]">{w.room}</span>
                <span className="text-[10px] text-[#555566] bg-[#252530] px-1.5 py-0.5 rounded">{w.side}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#555566]">
                <div>Length: <span className="text-[#F0EEE8] font-medium">{w.length}</span></div>
                <div>Height: <span className="text-[#F0EEE8] font-medium">{w.height}</span></div>
              </div>
              {w.openings.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.openings.map((o) => (
                    <span key={o} className="text-[9px] px-1.5 py-0.5 rounded bg-[#4A7CFF18] text-[#4A7CFF] border border-[#4A7CFF33]">{o}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-2 p-3 bg-[#1E1E2488] border border-[#C9A84C22] rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info size={11} className="text-[#C9A84C]" />
              <span className="text-[11px] font-medium text-[#C9A84C]">AI Summary</span>
            </div>
            <p className="text-[10.5px] text-[#8A8899] leading-relaxed">
              3BHK flat · 2 bathrooms · Open kitchen · Balcony facing East. Total area: ~111 m². All structural walls detected. Vastu compliance: North-East entry ✓
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-[#2A2A35]">
          <button className="w-full btn-gold px-4 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2">
            Open in Design Studio
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
