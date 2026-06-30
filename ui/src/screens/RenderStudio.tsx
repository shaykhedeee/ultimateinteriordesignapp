import { Sparkles, Clock, CheckCircle, Plus, Play, Download, Share2, Eye, Zap, Camera, SlidersHorizontal } from 'lucide-react';

const renders = [
  {
    id: 'R001',
    name: 'Living Room — North View',
    project: 'Mehta Residence',
    status: 'completed',
    quality: 'Photoreal',
    time: '8m 22s',
    date: '2h ago',
    resolution: '4K · 3840×2160',
    approved: true,
    version: 'v3',
    gradient: 'from-[#1a1830] via-[#1e2040] to-[#151530]',
  },
  {
    id: 'R002',
    name: 'Kitchen — Island Angle',
    project: 'Kapoor Villa',
    status: 'rendering',
    quality: 'Photoreal',
    time: '~12m left',
    date: 'In progress',
    resolution: '4K · 3840×2160',
    approved: false,
    version: 'v2',
    progress: 67,
    gradient: 'from-[#1a2030] via-[#1e2840] to-[#151825]',
  },
  {
    id: 'R003',
    name: 'Master Bedroom — Dusk',
    project: 'Mehta Residence',
    status: 'completed',
    quality: 'Premium',
    time: '5m 44s',
    date: '5h ago',
    resolution: '2K · 2560×1440',
    approved: false,
    version: 'v1',
    gradient: 'from-[#201820] via-[#281830] to-[#180f20]',
  },
  {
    id: 'R004',
    name: 'Bathroom — Marble View',
    project: 'Sharma 3BHK',
    status: 'queued',
    quality: 'Preview',
    time: 'Waiting',
    date: 'Queued',
    resolution: '1080p',
    approved: false,
    version: 'v1',
    gradient: 'from-[#141820] via-[#181e28] to-[#101520]',
  },
  {
    id: 'R005',
    name: 'Foyer — Grand Entrance',
    project: 'Jain Penthouse',
    status: 'completed',
    quality: 'Photoreal',
    time: '14m 5s',
    date: '1d ago',
    resolution: '4K · 3840×2160',
    approved: true,
    version: 'v4',
    gradient: 'from-[#201a10] via-[#281e12] to-[#181208]',
  },
  {
    id: 'R006',
    name: 'Wardrobe Interior',
    project: 'Kapoor Villa',
    status: 'queued',
    quality: 'Preview',
    time: 'Waiting',
    date: 'Queued',
    resolution: '1080p',
    approved: false,
    version: 'v1',
    gradient: 'from-[#141A18] via-[#182018] to-[#101510]',
  },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  completed: { color: '#2DD4BF', bg: '#2DD4BF12', border: '#2DD4BF33', label: 'Completed' },
  rendering: { color: '#8B5CF6', bg: '#8B5CF612', border: '#8B5CF633', label: 'Rendering' },
  queued: { color: '#555566', bg: '#25253044', border: '#3A3A4844', label: 'Queued' },
};

const cameraPresets = [
  'Eye Level — Natural', 'Low Angle — Drama', 'Bird\'s Eye — Plan',
  'Corner — Wide', 'Vignette — Close', 'Walkthrough — Door'
];

const lightPresets = [
  { name: 'Golden Hour', icon: '☀️' },
  { name: 'Overcast Day', icon: '⛅' },
  { name: 'Studio Light', icon: '💡' },
  { name: 'Evening Warm', icon: '🌇' },
  { name: 'Moonlight', icon: '🌙' },
];

export default function RenderStudio() {
  return (
    <div className="flex h-full overflow-hidden bg-[#0A0A0B]">

      {/* Left: Render Settings */}
      <div className="w-[230px] min-w-[230px] border-r border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <h3 className="text-[13px] font-semibold text-[#F0EEE8] mb-1">Render Settings</h3>
          <div className="flex items-center gap-1.5 ai-badge rounded-lg px-2.5 py-1.5 text-[10px] font-medium">
            <Zap size={10} fill="currentColor" />
            AI-Optimized Settings
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quality */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Quality</div>
            <div className="space-y-1">
              {[
                { q: 'Preview', time: '~30s', col: '#555566' },
                { q: 'Standard', time: '~3min', col: '#C9A84C' },
                { q: 'Premium', time: '~8min', col: '#8B5CF6' },
                { q: 'Photoreal', time: '~15min', col: '#2DD4BF' },
              ].map((q, i) => (
                <button key={q.q} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-colors ${i === 3 ? 'bg-[#2DD4BF12] border border-[#2DD4BF33] text-[#2DD4BF]' : 'text-[#555566] hover:bg-[#141418] hover:text-[#8A8899] border border-transparent'}`}>
                  <span>{q.q}</span>
                  <span className="text-[9px]" style={{ color: q.col }}>{q.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Resolution</div>
            <div className="space-y-1">
              {['4K — 3840×2160', '2K — 2560×1440', '1080p — 1920×1080'].map((r, i) => (
                <button key={r} className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors ${i === 0 ? 'text-[#C9A84C] bg-[#C9A84C12] border border-[#C9A84C33]' : 'text-[#555566] hover:bg-[#141418] border border-transparent'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Camera */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Camera Preset</div>
            <div className="space-y-1">
              {cameraPresets.slice(0, 4).map((c, i) => (
                <button key={c} className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors flex items-center gap-2 ${i === 0 ? 'text-[#F0EEE8] bg-[#1E1E24] border border-[#3A3A48]' : 'text-[#555566] hover:bg-[#141418] border border-transparent'}`}>
                  <Camera size={10} className="shrink-0" />
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Lighting */}
          <div>
            <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2">Lighting</div>
            <div className="grid grid-cols-1 gap-1">
              {lightPresets.map((l, i) => (
                <button key={l.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${i === 0 ? 'text-[#F0EEE8] bg-[#1E1E24] border border-[#3A3A48]' : 'text-[#555566] hover:bg-[#141418] border border-transparent'}`}>
                  <span>{l.icon}</span>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#2A2A35] space-y-2">
          <button className="w-full btn-gold px-4 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2">
            <Play size={12} fill="currentColor" />
            Queue Render
          </button>
          <button className="w-full btn-ghost px-4 py-2 rounded-xl text-[11px] text-[#8A8899] flex items-center justify-center gap-2">
            <Sparkles size={11} />
            AI Auto-Settings
          </button>
        </div>
      </div>

      {/* Main: Render Gallery */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-11 flex items-center justify-between px-5 border-b border-[#2A2A35] bg-[#0D0D10] shrink-0">
          <div className="flex items-center gap-2">
            {['All Renders', 'Completed', 'In Progress', 'Approved'].map((t, i) => (
              <button key={t} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${i === 0 ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#555566]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
              1 rendering · 2 queued
            </div>
            <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
              <SlidersHorizontal size={12} />
              Sort
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-4">
            {renders.map((r) => {
              const sc = statusConfig[r.status];
              return (
                <div key={r.id} className="group bg-[#111113] border border-[#2A2A35] rounded-2xl overflow-hidden hover:border-[#3A3A48] transition-all cursor-pointer hover:shadow-2xl">
                  {/* Render Preview */}
                  <div className={`relative h-44 bg-gradient-to-br ${r.gradient} flex items-center justify-center overflow-hidden`}>
                    {/* Abstract render preview */}
                    <div className="absolute inset-0 opacity-40"
                      style={{
                        background: `radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(201,168,76,0.08) 0%, transparent 50%)`,
                      }}
                    />
                    {/* Floor line */}
                    <div className="absolute bottom-8 left-0 right-0 h-px bg-white opacity-5" />
                    {/* Furniture silhouettes */}
                    <div className="absolute bottom-8 left-8 w-24 h-14 bg-white opacity-[0.03] rounded-sm" />
                    <div className="absolute bottom-8 right-12 w-16 h-20 bg-white opacity-[0.04] rounded-sm" />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-white opacity-[0.06]" />

                    {r.status === 'rendering' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B88]">
                        <div className="w-10 h-10 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin mb-2" />
                        <div className="text-[11px] text-[#8B5CF6] font-medium">{r.progress}% complete</div>
                        <div className="text-[10px] text-[#555566] mt-1">{r.time}</div>
                        <div className="mt-2 w-32 progress-bar h-1">
                          <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${r.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {r.status === 'queued' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B88]">
                        <Clock size={18} className="text-[#555566] mb-2" />
                        <div className="text-[11px] text-[#555566]">Queued</div>
                      </div>
                    )}

                    {r.status === 'completed' && (
                      <>
                        {/* Overlay on hover */}
                        <div className="room-overlay absolute inset-0 bg-[#0A0A0B88] flex items-center justify-center gap-2">
                          <button className="p-2 rounded-xl bg-[#1E1E24] border border-[#3A3A48] hover:border-[#C9A84C66] transition-colors">
                            <Eye size={14} className="text-[#F0EEE8]" />
                          </button>
                          <button className="p-2 rounded-xl bg-[#1E1E24] border border-[#3A3A48]">
                            <Download size={14} className="text-[#F0EEE8]" />
                          </button>
                          <button className="p-2 rounded-xl bg-[#1E1E24] border border-[#3A3A48]">
                            <Share2 size={14} className="text-[#F0EEE8]" />
                          </button>
                        </div>
                        {r.approved && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 status-approved text-[10px] font-bold px-2 py-1 rounded-lg">
                            <CheckCircle size={10} />
                            Approved
                          </div>
                        )}
                      </>
                    )}

                    {/* Quality badge */}
                    <div className="absolute top-3 left-3 text-[9px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {r.quality}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#F0EEE8] truncate">{r.name}</div>
                        <div className="text-[11px] text-[#555566] mt-0.5">{r.project} · {r.version}</div>
                      </div>
                      {r.status === 'completed' && !r.approved && (
                        <button className="btn-gold px-2 py-1 rounded-lg text-[10px] font-bold shrink-0">
                          Approve
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-[#555566]">
                      <span className="flex items-center gap-1"><Clock size={9} />{r.time}</span>
                      <span>{r.resolution}</span>
                      <span className="ml-auto">{r.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New Render Card */}
            <button className="h-full min-h-[240px] rounded-2xl border-2 border-dashed border-[#2A2A35] hover:border-[#C9A84C55] transition-colors flex flex-col items-center justify-center gap-3 text-[#555566] hover:text-[#8A8899] group">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E24] group-hover:bg-[#252530] flex items-center justify-center transition-colors">
                <Plus size={16} />
              </div>
              <span className="text-[12px] font-medium">New Render Job</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
