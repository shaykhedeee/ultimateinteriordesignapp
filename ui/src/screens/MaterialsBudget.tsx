import { Search, Filter, Plus, ChevronDown, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const budgetData = [
  { cat: 'Kitchen', budget: 580000, actual: 610000 },
  { cat: 'Wardrobes', budget: 320000, actual: 295000 },
  { cat: 'Living', budget: 240000, actual: 260000 },
  { cat: 'Beds', budget: 180000, actual: 165000 },
  { cat: 'Lighting', budget: 120000, actual: 98000 },
  { cat: 'Flooring', budget: 200000, actual: 220000 },
];

const materials = [
  {
    code: 'LAM-001',
    name: 'Fenix White Matte',
    brand: 'Greenlam',
    type: 'Laminate',
    finish: 'Matte',
    thickness: '1mm',
    cost: '₹380/sq.ft',
    inUse: 4,
    hex: '#F5F4F0',
    tags: ['Kitchen', 'Wardrobe'],
  },
  {
    code: 'VNR-014',
    name: 'American Walnut',
    brand: 'Merino',
    type: 'Veneer',
    finish: 'Semi-Gloss',
    thickness: '0.5mm',
    cost: '₹620/sq.ft',
    inUse: 2,
    hex: '#5C3D2E',
    tags: ['TV Unit', 'Study'],
  },
  {
    code: 'QTZ-008',
    name: 'Statuario Marble',
    brand: 'Compac',
    type: 'Quartz',
    finish: 'Polished',
    thickness: '20mm',
    cost: '₹1,200/sq.ft',
    inUse: 3,
    hex: '#EEEAE4',
    tags: ['Kitchen', 'Bathroom'],
  },
  {
    code: 'LAM-022',
    name: 'Forest Green',
    brand: 'Century',
    type: 'Laminate',
    finish: 'Matte',
    thickness: '1mm',
    cost: '₹290/sq.ft',
    inUse: 1,
    hex: '#3D5A44',
    tags: ['Wardrobe'],
  },
  {
    code: 'HDW-034',
    name: 'Aluminium Profile',
    brand: 'Hafele',
    type: 'Hardware',
    finish: 'Anodized',
    thickness: '—',
    cost: '₹185/rft',
    inUse: 6,
    hex: '#B8B8B8',
    tags: ['Kitchen', 'Wardrobe', 'TV Unit'],
  },
  {
    code: 'FLR-005',
    name: 'Herringbone Oak',
    brand: 'Quick-Step',
    type: 'Flooring',
    finish: 'AC4',
    thickness: '12mm',
    cost: '₹245/sq.ft',
    inUse: 2,
    hex: '#C4A882',
    tags: ['Living', 'Bedroom'],
  },
];

const budgetSummary = [
  { label: 'Total Budget', value: '₹18.4L', trend: null },
  { label: 'Spent / Committed', value: '₹14.8L', trend: '+4.2%', up: true },
  { label: 'Remaining', value: '₹3.6L', trend: null },
  { label: 'Variance', value: '+₹1.6L', trend: 'Over budget', up: false },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1E1E24] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-[11px]">
        <div className="text-[#555566] mb-1.5 font-medium">{label}</div>
        <div className="flex gap-3">
          <div>Budget: <span className="text-[#C9A84C] font-semibold">₹{(payload[0]?.value / 100000).toFixed(1)}L</span></div>
          <div>Actual: <span className="text-[#4A7CFF] font-semibold">₹{(payload[1]?.value / 100000).toFixed(1)}L</span></div>
        </div>
      </div>
    );
  }
  return null;
};

export default function MaterialsBudget() {
  return (
    <div className="flex h-full overflow-y-auto bg-[#0A0A0B]">
      <div className="flex-1 p-6 space-y-5 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#F0EEE8]">Materials & Budget</h2>
            <p className="text-[12px] text-[#555566] mt-0.5">Mehta Residence · 3BHK Full Home · v3 Design</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8A8899]">
              <Filter size={13} />
              Filter
            </button>
            <button className="btn-gold flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold">
              <Plus size={13} />
              Add Material
            </button>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          {budgetSummary.map((b) => (
            <div key={b.label} className="metric-card rounded-xl p-4">
              <div className="text-[11px] text-[#555566] uppercase tracking-widest font-medium mb-2">{b.label}</div>
              <div className="text-[22px] font-bold text-[#F0EEE8]">{b.value}</div>
              {b.trend && (
                <div className={`flex items-center gap-1 text-[11px] mt-1 font-medium ${b.up ? 'text-[#F43F5E]' : 'text-[#F59E0B]'}`}>
                  <ArrowUpRight size={11} />
                  {b.trend}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Budget Chart + Categories */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-[#111113] border border-[#2A2A35] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Budget vs Actual by Category</h3>
                <p className="text-[11px] text-[#555566] mt-0.5">Mehta Residence · All rooms</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#C9A84C44]" /><span className="text-[#555566]">Budget</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#4A7CFF]" /><span className="text-[#555566]">Actual</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetData} barCategoryGap="30%">
                <XAxis dataKey="cat" tick={{ fontSize: 10, fill: '#555566' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#555566' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="budget" fill="#C9A84C" opacity={0.3} radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" radius={[2, 2, 0, 0]}>
                  {budgetData.map((entry, i) => (
                    <Cell key={i} fill={entry.actual > entry.budget ? '#F43F5E' : '#4A7CFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#111113] border border-[#2A2A35] rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-[#F0EEE8] mb-3">Material Usage</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Laminate', pct: 42, col: '#C9A84C', val: '₹4.8L' },
                { name: 'Quartz/Stone', pct: 18, col: '#4A7CFF', val: '₹2.1L' },
                { name: 'Hardware', pct: 15, col: '#8B5CF6', val: '₹1.7L' },
                { name: 'Veneer', pct: 12, col: '#2DD4BF', val: '₹1.4L' },
                { name: 'Flooring', pct: 13, col: '#F59E0B', val: '₹1.5L' },
              ].map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="text-[#8A8899]">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: m.col }}>{m.pct}%</span>
                      <span className="text-[#555566]">{m.val}</span>
                    </div>
                  </div>
                  <div className="progress-bar h-1">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.col }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Material Catalog */}
        <div className="bg-[#111113] border border-[#2A2A35] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E24]">
            <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Material Schedule</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E1E24] border border-[#2A2A35]">
                <Search size={12} className="text-[#555566]" />
                <input className="bg-transparent text-[11px] text-[#F0EEE8] outline-none w-28 placeholder:text-[#555566]"
                  placeholder="Search..." />
              </div>
              <button className="btn-ghost px-2.5 py-1.5 rounded-lg text-[11px] text-[#8A8899] flex items-center gap-1.5">
                Type <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-8 px-5 py-2.5 bg-[#0D0D10] text-[10px] font-bold uppercase tracking-widest text-[#3A3A48]">
            <div className="col-span-2">Material</div>
            <div>Brand</div>
            <div>Type</div>
            <div>Finish</div>
            <div>Cost</div>
            <div>Used In</div>
            <div>Tags</div>
          </div>

          <div className="divide-y divide-[#1A1A20]">
            {materials.map((m) => (
              <div key={m.code} className="grid grid-cols-8 px-5 py-3 hover:bg-[#16161C] transition-colors cursor-pointer items-center">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[#2A2A35] shrink-0" style={{ background: m.hex }} />
                  <div>
                    <div className="text-[12.5px] font-medium text-[#F0EEE8]">{m.name}</div>
                    <div className="text-[10px] text-[#555566]">{m.code} · {m.thickness}</div>
                  </div>
                </div>
                <div className="text-[11px] text-[#8A8899]">{m.brand}</div>
                <div className="text-[11px] text-[#8A8899]">{m.type}</div>
                <div className="text-[11px] text-[#8A8899]">{m.finish}</div>
                <div className="text-[12px] font-semibold text-[#C9A84C]">{m.cost}</div>
                <div className="text-[11px] text-[#555566]">{m.inUse} modules</div>
                <div className="flex flex-wrap gap-1">
                  {m.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252530] text-[#555566] border border-[#2A2A35]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
