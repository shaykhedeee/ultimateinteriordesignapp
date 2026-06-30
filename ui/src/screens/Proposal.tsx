import { FileText, Download, Send, Eye, Plus, CheckCircle, Share2 } from 'lucide-react';

const sections = [
  { id: 'cover', label: 'Cover Page', status: 'done', pages: 1 },
  { id: 'scope', label: 'Scope of Work', status: 'done', pages: 2 },
  { id: 'concepts', label: 'Design Concepts', status: 'done', pages: 6 },
  { id: 'renders', label: 'Renders & Visuals', status: 'done', pages: 12 },
  { id: 'elevations', label: 'Wall Elevations', status: 'done', pages: 8 },
  { id: 'materials', label: 'Material Palette', status: 'done', pages: 4 },
  { id: 'schedule', label: 'Module Schedule', status: 'done', pages: 3 },
  { id: 'budget', label: 'Commercial Summary', status: 'done', pages: 2 },
  { id: 'timeline', label: 'Timeline & Milestones', status: 'review', pages: 1 },
  { id: 'terms', label: 'Terms & Conditions', status: 'review', pages: 2 },
];

const proposals = [
  {
    name: 'Mehta Residence — Full Proposal v3',
    client: 'Vikram & Nisha Mehta',
    created: '18 Mar 2025',
    pages: 41,
    size: '18.4 MB',
    status: 'sent',
    viewed: true,
    viewedAt: '19 Mar, 11:42am',
  },
  {
    name: 'Kapoor Villa — Concept Brief v1',
    client: 'Arjun Kapoor',
    created: '12 Mar 2025',
    pages: 24,
    size: '11.2 MB',
    status: 'approved',
    viewed: true,
    viewedAt: '13 Mar, 3:15pm',
  },
  {
    name: 'Sharma 3BHK — Sales Deck',
    client: 'Divya Sharma',
    created: '8 Mar 2025',
    pages: 16,
    size: '7.8 MB',
    status: 'draft',
    viewed: false,
    viewedAt: null,
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sent: { label: 'Sent', color: '#4A7CFF', bg: '#4A7CFF12', border: '#4A7CFF33' },
  approved: { label: 'Approved', color: '#2DD4BF', bg: '#2DD4BF12', border: '#2DD4BF33' },
  draft: { label: 'Draft', color: '#F59E0B', bg: '#F59E0B12', border: '#F59E0B33' },
};

const sectionStatus: Record<string, string> = {
  done: '#2DD4BF',
  review: '#F59E0B',
  pending: '#555566',
};

export default function Proposal() {
  return (
    <div className="flex h-full overflow-hidden bg-[#0A0A0B]">

      {/* Left: Proposal Builder */}
      <div className="w-[240px] min-w-[240px] border-r border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <div className="text-[11px] text-[#555566] uppercase tracking-widest font-bold mb-1">Active Proposal</div>
          <div className="text-[13px] font-semibold text-[#F0EEE8]">Mehta Residence v3</div>
          <div className="text-[11px] text-[#555566] mt-0.5">41 pages · 18.4 MB</div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] ai-badge px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            AI-generated from Scene v3
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] text-[#555566] uppercase tracking-widest font-bold mb-2 px-1">Sections</div>
          {sections.map((s, i) => (
            <div key={s.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors group ${i === 0 ? 'bg-[#1E1E24] border border-[#3A3A48]' : 'hover:bg-[#141418] border border-transparent'}`}>
              <CheckCircle size={12} style={{ color: sectionStatus[s.status] }} />
              <span className={`flex-1 text-[11.5px] font-medium ${i === 0 ? 'text-[#F0EEE8]' : 'text-[#8A8899]'}`}>{s.label}</span>
              <span className="text-[9px] text-[#555566]">{s.pages}p</span>
            </div>
          ))}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-[#141418] text-[#555566] hover:text-[#8A8899] transition-colors border border-dashed border-[#2A2A35] mt-2">
            <Plus size={12} />
            <span className="text-[11.5px]">Add Section</span>
          </div>
        </div>

        <div className="p-3 border-t border-[#2A2A35] space-y-2">
          <button className="w-full btn-gold px-4 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2">
            <Send size={12} />
            Send to Client
          </button>
          <button className="w-full btn-ghost px-4 py-2 rounded-xl text-[11px] text-[#8A8899] flex items-center justify-center gap-2">
            <Download size={11} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Center: PDF Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-11 flex items-center justify-between px-5 border-b border-[#2A2A35] bg-[#0D0D10] shrink-0">
          <div className="flex items-center gap-2">
            {['Preview', 'Edit', 'Compare'].map((t, i) => (
              <button key={t} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${i === 0 ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#3A3A48]' : 'text-[#555566] hover:text-[#8A8899]'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#555566]">Page 1 of 41</span>
            <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
              <Share2 size={12} /> Share Link
            </button>
          </div>
        </div>

        {/* PDF Page Preview */}
        <div className="flex-1 overflow-y-auto bg-[#141418] p-8 flex flex-col items-center gap-6">

          {/* Cover Page */}
          <div className="w-full max-w-[580px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0A0810 0%, #12101E 50%, #0A0A0B 100%)', border: '1px solid #2A2A35' }}>
            <div className="relative p-12 text-center min-h-[400px] flex flex-col items-center justify-center overflow-hidden">
              {/* Gold geometric accent */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, #C9A84C 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }} />
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C44, transparent)' }} />

              <div className="relative z-10">
                <div className="text-[10px] text-[#C9A84C] uppercase tracking-[0.3em] font-bold mb-6">Interior Design Proposal</div>
                <h1 className="text-[32px] font-bold text-[#F0EEE8] mb-2 tracking-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Mehta Residence
                </h1>
                <div className="text-[14px] text-[#8A8899] mb-8">3BHK Full Home Design · Bandra West, Mumbai</div>
                <div className="w-16 h-px mx-auto mb-8" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
                <div className="grid grid-cols-3 gap-8 text-center">
                  {[
                    { label: 'Total Scope', value: '4 Rooms' },
                    { label: 'Investment', value: '₹18.4L' },
                    { label: 'Timeline', value: '45 Days' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-[18px] font-bold gold-gradient">{stat.value}</div>
                      <div className="text-[10px] text-[#555566] mt-1 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 text-[11px] text-[#555566]">
                  Prepared by <span className="text-[#C9A84C] font-medium">Arya Interiors</span> · March 2025
                </div>
              </div>
            </div>
          </div>

          {/* Scope Page */}
          <div className="w-full max-w-[580px] rounded-2xl overflow-hidden shadow-xl bg-[#111113] border border-[#2A2A35]">
            <div className="p-8">
              <div className="text-[10px] text-[#C9A84C] uppercase tracking-[0.2em] font-bold mb-4">02 — Scope of Work</div>
              <h2 className="text-[22px] font-bold text-[#F0EEE8] mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>What We're Designing</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { room: 'Living Room', scope: ['TV Unit', 'Sofa Backdrop', 'False Ceiling', 'Lighting Design'], color: '#4A7CFF' },
                  { room: 'Kitchen', scope: ['L-Shape Modular', 'Island Counter', 'Utility Cabinet', 'Dado Tiles'], color: '#C9A84C' },
                  { room: 'Master Bedroom', scope: ['3-Door Wardrobe', 'Bed Backdrop', 'Dressing Unit', 'Lighting'], color: '#8B5CF6' },
                  { room: 'Bedroom 2', scope: ['2-Door Wardrobe', 'Study Unit', 'Kids Storage'], color: '#2DD4BF' },
                ].map((r) => (
                  <div key={r.room} className="p-4 rounded-xl border border-[#2A2A35] bg-[#0D0D10]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
                      <span className="text-[12px] font-semibold text-[#F0EEE8]">{r.room}</span>
                    </div>
                    <ul className="space-y-1">
                      {r.scope.map((s) => (
                        <li key={s} className="text-[11px] text-[#555566] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#3A3A48]" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#3A3A48] pb-4">
            · Scroll to view full proposal · 41 pages total ·
          </div>
        </div>
      </div>

      {/* Right: Proposals List */}
      <div className="w-[240px] min-w-[240px] border-l border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <h3 className="text-[13px] font-semibold text-[#F0EEE8]">All Proposals</h3>
          <p className="text-[11px] text-[#555566] mt-0.5">3 documents</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {proposals.map((p, i) => {
            const sc = statusConfig[p.status];
            return (
              <div key={i} className={`p-3 rounded-xl border cursor-pointer hover:bg-[#141418] transition-colors ${i === 0 ? 'bg-[#1E1E24] border-[#3A3A48]' : 'border-[#2A2A35] bg-[#111113]'}`}>
                <div className="flex items-start gap-2">
                  <FileText size={13} className="text-[#555566] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] font-semibold text-[#F0EEE8] leading-snug">{p.name}</div>
                    <div className="text-[10px] text-[#555566] mt-0.5">{p.client}</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sc.label}
                      </span>
                      {p.viewed && (
                        <span className="text-[9px] text-[#555566] flex items-center gap-1">
                          <Eye size={9} /> Viewed
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#555566] mt-1.5">{p.pages}p · {p.size} · {p.created}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-[#2A2A35]">
          <button className="w-full btn-gold px-4 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2">
            <Plus size={13} />
            New Proposal
          </button>
        </div>
      </div>
    </div>
  );
}
