import { CheckCircle, Download, AlertTriangle, Package, FileText, Factory, Lock, ChevronRight, Copy, ExternalLink } from 'lucide-react';

const modules = [
  {
    id: 'MOD-001',
    name: 'L-Shape Kitchen — Lower Units',
    room: 'Kitchen',
    type: 'Kitchen',
    material: 'Fenix White Matte Lam.',
    carcass: '18mm BWP Ply',
    shutter: '18mm + 1mm Lam.',
    hardware: 'Hettich Quadro 4D',
    qty: 12,
    dims: 'Various',
    status: 'approved',
    bom: true,
    cutlist: true,
  },
  {
    id: 'MOD-002',
    name: 'Wardrobe — 3-door Sliding',
    room: 'Master Bedroom',
    type: 'Wardrobe',
    material: 'Sand Oak Veneer',
    carcass: '18mm BWP Ply',
    shutter: '12mm + Track',
    hardware: 'Heron Sliding 80kg',
    qty: 8,
    dims: '2400×600×2200mm',
    status: 'approved',
    bom: true,
    cutlist: true,
  },
  {
    id: 'MOD-003',
    name: 'TV Unit — Wall Mounted',
    room: 'Living Room',
    type: 'TV Unit',
    material: 'Dark Wenge Lam.',
    carcass: '18mm MDF',
    shutter: '18mm MDF + Lam.',
    hardware: 'Sugatsune L-brackets',
    qty: 4,
    dims: '2100×400×520mm',
    status: 'revision',
    bom: false,
    cutlist: false,
  },
  {
    id: 'MOD-004',
    name: 'Kitchen Island Counter',
    room: 'Kitchen',
    type: 'Kitchen',
    material: 'Statuario Quartz Top',
    carcass: '18mm BWP Ply',
    shutter: 'N/A — Open',
    hardware: 'Hafele Tandem Box',
    qty: 1,
    dims: '1800×900×900mm',
    status: 'approved',
    bom: true,
    cutlist: true,
  },
  {
    id: 'MOD-005',
    name: 'Bedroom 2 — Wardrobe 2-door',
    room: 'Bedroom 2',
    type: 'Wardrobe',
    material: 'White Acrylic',
    carcass: '18mm BWP Ply',
    shutter: '18mm MDF + Acrylic',
    hardware: 'Hettich Innotech',
    qty: 6,
    dims: '1600×600×2200mm',
    status: 'pending',
    bom: false,
    cutlist: false,
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: 'Approved', color: '#2DD4BF', bg: '#2DD4BF12', border: '#2DD4BF33' },
  revision: { label: 'Revision Needed', color: '#F43F5E', bg: '#F43F5E12', border: '#F43F5E33' },
  pending: { label: 'Pending Approval', color: '#F59E0B', bg: '#F59E0B12', border: '#F59E0B33' },
};

const bomLines = [
  { item: 'BWP Ply 18mm', size: '8×4 ft', qty: 48, unit: 'sheets', cost: '₹1,200/sheet', total: '₹57,600' },
  { item: 'Fenix White Matte Lam.', size: '8×4 ft', qty: 32, unit: 'sheets', cost: '₹3,200/sheet', total: '₹1,02,400' },
  { item: 'Sand Oak Veneer', size: '8×4 ft', qty: 18, unit: 'sheets', cost: '₹4,800/sheet', total: '₹86,400' },
  { item: 'Statuario Quartz 20mm', size: 'Custom', qty: 42, unit: 'sq.ft', cost: '₹1,200/sq.ft', total: '₹50,400' },
  { item: 'Hettich Quadro 4D', size: 'Full Extension', qty: 48, unit: 'pairs', cost: '₹480/pair', total: '₹23,040' },
  { item: 'Heron Sliding 80kg', size: '—', qty: 16, unit: 'sets', cost: '₹2,200/set', total: '₹35,200' },
  { item: 'Edge Tape 1mm PVC', size: '—', qty: 500, unit: 'rft', cost: '₹12/rft', total: '₹6,000' },
  { item: 'Silicone Sealant', size: '—', qty: 20, unit: 'tubes', cost: '₹180/tube', total: '₹3,600' },
];

export default function Production() {
  return (
    <div className="flex h-full overflow-y-auto bg-[#0A0A0B]">
      <div className="flex-1 p-6 space-y-5 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#F0EEE8]">Production / BOM / Cutlist</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[12px] text-[#555566]">Mehta Residence · Approved Design v3</p>
              <div className="flex items-center gap-1 text-[10px] status-approved px-2 py-0.5 rounded-lg font-bold">
                <Lock size={9} />
                Locked
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8A8899]">
              <Copy size={13} />
              Copy BOM
            </button>
            <button className="btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8A8899]">
              <ExternalLink size={13} />
              Export XLS
            </button>
            <button className="btn-gold flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold">
              <Download size={13} />
              Export Workshop Pack
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Modules Approved', value: '3/5', icon: <CheckCircle size={14} />, color: '#2DD4BF' },
            { label: 'BOM Generated', value: '3', icon: <FileText size={14} />, color: '#C9A84C' },
            { label: 'Cutlists Ready', value: '3', icon: <Factory size={14} />, color: '#4A7CFF' },
            { label: 'Pending Revision', value: '2', icon: <AlertTriangle size={14} />, color: '#F59E0B' },
          ].map((s) => (
            <div key={s.label} className="metric-card rounded-xl p-4">
              <div className="p-2 rounded-lg inline-block mb-3" style={{ background: s.color + '18', color: s.color }}>
                {s.icon}
              </div>
              <div className="text-[22px] font-bold text-[#F0EEE8]">{s.value}</div>
              <div className="text-[11px] text-[#555566] mt-0.5 uppercase tracking-wide font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Module Schedule — 3 cols */}
          <div className="col-span-3 bg-[#111113] border border-[#2A2A35] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E24]">
              <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Module Schedule</h3>
              <span className="text-[11px] text-[#555566]">5 modules · 29 units total</span>
            </div>

            {/* Module List */}
            <div className="divide-y divide-[#1A1A20]">
              {modules.map((m) => {
                const sc = statusConfig[m.status];
                return (
                  <div key={m.id} className="px-5 py-3.5 hover:bg-[#16161C] transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E1E24] border border-[#2A2A35] flex items-center justify-center shrink-0">
                        <Package size={13} className="text-[#555566]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12.5px] font-medium text-[#F0EEE8] truncate">{m.name}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-[#555566] flex-wrap">
                          <span>{m.room}</span>
                          <span className="text-[#3A3A48]">·</span>
                          <span>{m.material}</span>
                          <span className="text-[#3A3A48]">·</span>
                          <span>{m.carcass}</span>
                          <span className="text-[#3A3A48]">·</span>
                          <span className="font-medium text-[#8A8899]">Qty: {m.qty}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.bom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A84C18] text-[#C9A84C] border border-[#C9A84C33] font-bold">BOM</span>
                        )}
                        {m.cutlist && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4A7CFF18] text-[#4A7CFF] border border-[#4A7CFF33] font-bold">CUT</span>
                        )}
                        <ChevronRight size={12} className="text-[#3A3A48]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOM Summary — 2 cols */}
          <div className="col-span-2 bg-[#111113] border border-[#2A2A35] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E24]">
              <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Bill of Materials</h3>
              <button className="text-[11px] text-[#C9A84C] hover:text-[#E8C97A] font-medium">Export</button>
            </div>
            <div className="divide-y divide-[#1A1A20]">
              {bomLines.map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#16161C] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#F0EEE8] truncate">{b.item}</div>
                    <div className="text-[10px] text-[#555566]">{b.size} · {b.qty} {b.unit}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-semibold text-[#C9A84C]">{b.total}</div>
                    <div className="text-[9px] text-[#555566]">{b.cost}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#2A2A35] flex items-center justify-between bg-[#0D0D10]">
              <span className="text-[12px] font-bold text-[#F0EEE8]">Total Material Cost</span>
              <span className="text-[15px] font-bold text-[#C9A84C]">₹3,64,640</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
