import { CheckCircle, XCircle, MessageSquare, Clock, Eye, RotateCcw, ChevronRight } from 'lucide-react';

const approvalItems = [
  {
    id: 'APR-041',
    title: 'Living Room — Render Set v3',
    project: 'Kapoor Villa',
    type: 'Render',
    submittedBy: 'Priya S.',
    submittedAt: '2h ago',
    status: 'pending',
    client: 'Arjun Kapoor',
    comments: 2,
    preview: 'from-[#1a1830] to-[#121020]',
    items: ['North View 4K', 'Corner View 4K', 'Walkthrough Loop'],
  },
  {
    id: 'APR-039',
    title: 'Kitchen Design — Module Schedule',
    project: 'Mehta Residence',
    type: 'Module',
    submittedBy: 'Rahul M.',
    submittedAt: '1d ago',
    status: 'revision',
    client: 'Vikram Mehta',
    comments: 5,
    preview: 'from-[#181522] to-[#100e18]',
    items: ['L-Shape Lower Units', 'Island Counter', 'Wall Units x4'],
  },
  {
    id: 'APR-037',
    title: 'Master Bedroom — Full Room Package',
    project: 'Sharma 3BHK',
    type: 'Room Package',
    submittedBy: 'Anita R.',
    submittedAt: '3d ago',
    status: 'approved',
    client: 'Divya Sharma',
    comments: 1,
    preview: 'from-[#1a1520] to-[#120f1a]',
    items: ['3D Render x2', 'Elevation Drawing', 'Module Schedule'],
  },
  {
    id: 'APR-035',
    title: 'Foyer — Concept v2',
    project: 'Jain Penthouse',
    type: 'Concept',
    submittedBy: 'Sneha A.',
    submittedAt: '4d ago',
    status: 'approved',
    client: 'Ramesh Jain',
    comments: 0,
    preview: 'from-[#201a10] to-[#181005]',
    items: ['Concept Board', 'Moodboard', 'Material Palette'],
  },
];

const revisions = [
  { from: 'Arjun Kapoor', msg: 'The sofa color looks too dark in the corner view. Can we try a beige/cream tone instead?', time: '1h ago', type: 'client' },
  { from: 'Priya S.', msg: 'Noted! I\'ll swap the fabric to Ivory Linen and re-render. Should be ready by tomorrow.', time: '58m ago', type: 'designer' },
  { from: 'Arjun Kapoor', msg: 'Also the TV unit height seems too tall. Can we check clearance?', time: '55m ago', type: 'client' },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { color: '#F59E0B', bg: '#F59E0B12', border: '#F59E0B33', icon: <Clock size={11} /> },
  revision: { color: '#F43F5E', bg: '#F43F5E12', border: '#F43F5E33', icon: <RotateCcw size={11} /> },
  approved: { color: '#2DD4BF', bg: '#2DD4BF12', border: '#2DD4BF33', icon: <CheckCircle size={11} /> },
};

export default function Approval() {
  const selected = approvalItems[0];

  return (
    <div className="flex h-full overflow-hidden bg-[#0A0A0B]">

      {/* Left: Approval Queue */}
      <div className="w-[280px] min-w-[280px] border-r border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Approval Queue</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B12] border border-[#F59E0B33] px-2 py-0.5 rounded-lg font-bold">1 Pending</span>
            <span className="text-[10px] text-[#F43F5E] bg-[#F43F5E12] border border-[#F43F5E33] px-2 py-0.5 rounded-lg font-bold">1 Revision</span>
            <span className="text-[10px] text-[#2DD4BF] bg-[#2DD4BF12] border border-[#2DD4BF33] px-2 py-0.5 rounded-lg font-bold">2 Approved</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {approvalItems.map((a, i) => {
            const sc = statusConfig[a.status];
            return (
              <div key={a.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${i === 0 ? 'bg-[#1E1E24] border-[#3A3A48]' : 'bg-[#111113] border-[#2A2A35] hover:border-[#3A3A48] hover:bg-[#141418]'}`}>
                {/* Preview strip */}
                <div className={`h-16 rounded-lg bg-gradient-to-br ${a.preview} mb-3 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                  <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {a.id}
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-[#F0EEE8] leading-snug mb-1">{a.title}</div>
                <div className="text-[10px] text-[#555566]">{a.project} · {a.submittedAt}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-medium"
                    style={{ color: sc.color }}>
                    {sc.icon}
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                  {a.comments > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-[#555566] ml-auto">
                      <MessageSquare size={9} /> {a.comments}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Approval Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 flex items-center justify-between px-6 border-b border-[#2A2A35] bg-[#0D0D10] shrink-0">
          <div>
            <div className="text-[13px] font-semibold text-[#F0EEE8]">{selected.title}</div>
            <div className="text-[11px] text-[#555566]">{selected.project} · Awaiting client review</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-3 py-2 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
              <Eye size={12} /> Preview
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold bg-[#F43F5E18] border border-[#F43F5E44] text-[#F43F5E] hover:bg-[#F43F5E22] transition-colors">
              <XCircle size={12} /> Request Revision
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold bg-[#2DD4BF18] border border-[#2DD4BF44] text-[#2DD4BF] hover:bg-[#2DD4BF22] transition-colors">
              <CheckCircle size={12} /> Approve & Lock
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Version History */}
          <div className="bg-[#111113] border border-[#2A2A35] rounded-xl p-5">
            <h4 className="text-[12px] font-semibold text-[#F0EEE8] mb-3">Version History</h4>
            <div className="space-y-2">
              {[
                { v: 'v3', date: 'Today 10:22am', by: 'Priya S.', note: 'Final render set — all angles', status: 'current' },
                { v: 'v2', date: '17 Mar 4:15pm', by: 'Priya S.', note: 'Revised sofa color to charcoal', status: 'old' },
                { v: 'v1', date: '15 Mar 2:00pm', by: 'Priya S.', note: 'Initial submission', status: 'old' },
              ].map((v) => (
                <div key={v.v} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${v.status === 'current' ? 'bg-[#1E1E24] border border-[#3A3A48]' : 'hover:bg-[#141418]'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${v.status === 'current' ? 'bg-[#C9A84C] text-[#0A0A0B]' : 'bg-[#252530] text-[#555566]'}`}>
                    {v.v}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] font-medium text-[#F0EEE8]">{v.note}</div>
                    <div className="text-[10px] text-[#555566]">{v.date} · {v.by}</div>
                  </div>
                  {v.status === 'current' && (
                    <span className="text-[10px] font-bold text-[#C9A84C] border border-[#C9A84C44] bg-[#C9A84C12] px-2 py-0.5 rounded">Current</span>
                  )}
                  {v.status === 'old' && (
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-[#252530] rounded transition-colors"><Eye size={11} className="text-[#555566]" /></button>
                      <button className="p-1.5 hover:bg-[#252530] rounded transition-colors"><RotateCcw size={11} className="text-[#555566]" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Items in this submission */}
          <div className="bg-[#111113] border border-[#2A2A35] rounded-xl p-5">
            <h4 className="text-[12px] font-semibold text-[#F0EEE8] mb-3">Submitted Items</h4>
            <div className="space-y-2">
              {selected.items.map((item) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#141418] cursor-pointer transition-colors group">
                  <CheckCircle size={12} className="text-[#2DD4BF]" />
                  <span className="flex-1 text-[12px] text-[#F0EEE8]">{item}</span>
                  <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-[#C9A84C] transition-opacity">
                    View <ChevronRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Type', value: selected.type },
              { label: 'Submitted By', value: selected.submittedBy },
              { label: 'Client', value: selected.client },
            ].map((d) => (
              <div key={d.label} className="bg-[#111113] border border-[#2A2A35] rounded-xl p-4">
                <div className="text-[10px] text-[#555566] uppercase tracking-widest font-medium mb-1">{d.label}</div>
                <div className="text-[13px] font-semibold text-[#F0EEE8]">{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Comments Thread */}
      <div className="w-[280px] min-w-[280px] border-l border-[#2A2A35] flex flex-col bg-[#0D0D10]">
        <div className="p-4 border-b border-[#2A2A35]">
          <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Comments</h3>
          <p className="text-[11px] text-[#555566] mt-0.5">{selected.comments} comments on this version</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {revisions.map((r, i) => (
            <div key={i} className={`flex gap-2.5 ${r.type === 'designer' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${r.type === 'client' ? 'bg-[#4A7CFF44] text-[#4A7CFF]' : 'bg-[#C9A84C44] text-[#C9A84C]'}`}>
                {r.type === 'client' ? 'AK' : 'PS'}
              </div>
              <div className={`flex-1 ${r.type === 'designer' ? 'text-right' : ''}`}>
                <div className="text-[10px] text-[#555566] mb-1">{r.from} · {r.time}</div>
                <div className={`inline-block text-left text-[11.5px] leading-relaxed px-3 py-2 rounded-xl max-w-[200px] ${r.type === 'client' ? 'bg-[#1E1E24] text-[#D0CECC] border border-[#2A2A35]' : 'bg-[#C9A84C18] text-[#E8C97A] border border-[#C9A84C33]'}`}>
                  {r.msg}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#2A2A35]">
          <div className="flex items-center gap-2 bg-[#1E1E24] border border-[#2A2A35] rounded-xl px-3 py-2">
            <input className="flex-1 bg-transparent text-[12px] text-[#F0EEE8] outline-none placeholder:text-[#555566]"
              placeholder="Add a comment..." />
            <button className="w-6 h-6 rounded-lg btn-gold flex items-center justify-center shrink-0">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
