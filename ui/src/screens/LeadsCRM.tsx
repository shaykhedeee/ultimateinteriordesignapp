import { Plus, Search, Filter, Phone, MapPin, Calendar, ChevronRight } from 'lucide-react';

const stages = [
  { id: 'new', label: 'New Leads', color: '#4A7CFF', count: 5 },
  { id: 'qualified', label: 'Qualified', color: '#8B5CF6', count: 3 },
  { id: 'discovery', label: 'Discovery', color: '#F59E0B', count: 4 },
  { id: 'proposal', label: 'Proposal Sent', color: '#C9A84C', count: 2 },
  { id: 'negotiation', label: 'Negotiation', color: '#F43F5E', count: 1 },
  { id: 'won', label: 'Won', color: '#2DD4BF', count: 8 },
];

const leads = [
  {
    name: 'Vikram & Nisha Patel',
    location: 'Bandra West, Mumbai',
    type: '3BHK Full Home',
    budget: '₹25–35L',
    score: 92,
    stage: 'qualified',
    source: 'Instagram',
    date: '18 Mar',
    phone: '+91 98765 43210',
    tags: ['Modular Kitchen', 'Wardrobe', 'TV Unit'],
    note: 'Wants to move in by June. Very clear on Nordic style.',
  },
  {
    name: 'Rohan Joshi',
    location: 'Andheri East, Mumbai',
    type: '2BHK Renovation',
    budget: '₹12–18L',
    score: 74,
    stage: 'new',
    source: 'Referral',
    date: '19 Mar',
    phone: '+91 99234 56789',
    tags: ['Kitchen', 'Master Bedroom'],
    note: 'Referred by Mehta family. Budget is tight but flexible.',
  },
  {
    name: 'Sunita Agarwal',
    location: 'Powai, Mumbai',
    type: '4BHK New Flat',
    budget: '₹45–60L',
    score: 88,
    stage: 'discovery',
    source: 'Website',
    date: '15 Mar',
    phone: '+91 91234 67890',
    tags: ['Luxury', 'Full Home', 'Smart Home'],
    note: 'Very design-savvy. Has a Pinterest board ready.',
  },
  {
    name: 'Arjun Kapoor',
    location: 'Juhu, Mumbai',
    type: 'Villa Interiors',
    budget: '₹80L–1.2Cr',
    score: 95,
    stage: 'proposal',
    source: 'Walk-in',
    date: '10 Mar',
    phone: '+91 98100 23456',
    tags: ['Villa', 'Luxury', 'Custom Furniture'],
    note: 'Decision maker. Needs 3D walkthrough before signing.',
  },
  {
    name: 'Divya & Manish Shah',
    location: 'Malad West, Mumbai',
    type: '3BHK Modular',
    budget: '₹18–22L',
    score: 65,
    stage: 'new',
    source: 'Housing.com',
    date: '20 Mar',
    phone: '+91 70234 89012',
    tags: ['Modular Kitchen', 'Kids Room'],
    note: 'Price sensitive. Comparing 3 studios.',
  },
];

const scoreColor = (s: number) => s >= 85 ? '#2DD4BF' : s >= 70 ? '#C9A84C' : '#F59E0B';

const stageMap: Record<string, typeof stages[0]> = Object.fromEntries(stages.map(s => [s.id, s]));

export default function LeadsCRM() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0A0A0B]">
      <div className="p-6 space-y-5 max-w-[1400px] w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#F0EEE8]">Leads & CRM</h2>
            <p className="text-[12px] text-[#555566] mt-0.5">23 total contacts · ₹3.2Cr pipeline value</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E1E24] border border-[#2A2A35]">
              <Search size={13} className="text-[#555566]" />
              <input className="bg-transparent text-[12px] text-[#F0EEE8] outline-none w-40 placeholder:text-[#555566]"
                placeholder="Search leads..." />
            </div>
            <button className="btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8A8899]">
              <Filter size={13} />
              Filter
            </button>
            <button className="btn-gold flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold">
              <Plus size={13} strokeWidth={2.5} />
              Add Lead
            </button>
          </div>
        </div>

        {/* Stage Pipeline Overview */}
        <div className="grid grid-cols-6 gap-2">
          {stages.map((s) => (
            <div key={s.id} className="bg-[#111113] border border-[#2A2A35] rounded-xl p-3 cursor-pointer hover:border-[#3A3A48] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[11px] font-semibold text-[#F0EEE8] bg-[#252530] px-1.5 py-0.5 rounded">{s.count}</span>
              </div>
              <div className="progress-bar h-0.5">
                <div className="h-full rounded-full" style={{ width: `${(s.count / 8) * 100}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Lead Cards */}
        <div className="space-y-2">
          {leads.map((lead, i) => {
            const stage = stageMap[lead.stage];
            return (
              <div key={i} className="bg-[#111113] border border-[#2A2A35] rounded-xl p-4 hover:border-[#3A3A48] transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  {/* Score Circle */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: scoreColor(lead.score) + '18', color: scoreColor(lead.score), border: `1px solid ${scoreColor(lead.score)}33` }}>
                    {lead.score}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[14px] font-semibold text-[#F0EEE8]">{lead.name}</span>
                      <span className="tag text-[10px] px-2 py-0.5 rounded"
                        style={{ background: stage.color + '18', color: stage.color, border: `1px solid ${stage.color}33` }}>
                        {stage.label}
                      </span>
                      <span className="text-[11px] text-[#555566] bg-[#1E1E24] px-2 py-0.5 rounded">{lead.source}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#555566]">
                      <span className="flex items-center gap-1"><MapPin size={10} />{lead.location}</span>
                      <span className="flex items-center gap-1"><Phone size={10} />{lead.phone}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} />{lead.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {lead.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#252530] text-[#8A8899] border border-[#2A2A35]">{t}</span>
                      ))}
                    </div>
                    <p className="text-[11.5px] text-[#555566] mt-2 italic">"{lead.note}"</p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-[15px] font-bold text-[#C9A84C]">{lead.budget}</div>
                    <div className="text-[11px] text-[#555566]">{lead.type}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1">
                        <Phone size={11} /> Call
                      </button>
                      <button className="btn-gold px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        Open <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
