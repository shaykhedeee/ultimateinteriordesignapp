import { TrendingUp, Clock, Users, Star, ArrowUpRight, ArrowRight, Zap, CheckCircle, Circle, AlertCircle, MoreHorizontal, Play, Eye } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const revenueData = [
  { m: 'Aug', v: 280 }, { m: 'Sep', v: 390 }, { m: 'Oct', v: 340 },
  { m: 'Nov', v: 520 }, { m: 'Dec', v: 480 }, { m: 'Jan', v: 610 },
  { m: 'Feb', v: 590 }, { m: 'Mar', v: 740 },
];

const activeProjects = [
  {
    id: 'P-2401',
    client: 'Mehta Residence',
    location: 'Bandra, Mumbai',
    stage: 'Design Studio',
    stageColor: '#8B5CF6',
    progress: 65,
    value: '₹18.4L',
    designer: 'Priya S.',
    rooms: 4,
    daysLeft: 8,
    avatar: 'MS',
    avatarColor: '#4A7CFF',
    urgent: false,
  },
  {
    id: 'P-2398',
    client: 'Kapoor Villa',
    location: 'Juhu, Mumbai',
    stage: 'Approval Pending',
    stageColor: '#F59E0B',
    progress: 82,
    value: '₹32.1L',
    designer: 'Rahul M.',
    rooms: 7,
    daysLeft: 2,
    avatar: 'KV',
    avatarColor: '#C9A84C',
    urgent: true,
  },
  {
    id: 'P-2394',
    client: 'Sharma 3BHK',
    location: 'Powai, Mumbai',
    stage: 'Renders Done',
    stageColor: '#2DD4BF',
    progress: 90,
    value: '₹11.2L',
    designer: 'Anita R.',
    rooms: 3,
    daysLeft: 1,
    avatar: 'SH',
    avatarColor: '#2DD4BF',
    urgent: true,
  },
  {
    id: 'P-2389',
    client: 'Jain Penthouse',
    location: 'Lower Parel, Mumbai',
    stage: 'Floor Plan AI',
    stageColor: '#4A7CFF',
    progress: 28,
    value: '₹54.0L',
    designer: 'Sneha A.',
    rooms: 9,
    daysLeft: 21,
    avatar: 'JP',
    avatarColor: '#F43F5E',
    urgent: false,
  },
];

const aiActivity = [
  { time: '2m ago', action: 'Floor plan extracted', project: 'Jain Penthouse', type: 'ai', icon: <Zap size={11} /> },
  { time: '18m ago', action: 'Render completed', project: 'Sharma 3BHK — Master Bedroom', type: 'render', icon: <CheckCircle size={11} /> },
  { time: '45m ago', action: 'Approval received', project: 'Mehta Residence — Living Room', type: 'approval', icon: <CheckCircle size={11} /> },
  { time: '1h ago', action: 'Revision requested', project: 'Kapoor Villa — Kitchen', type: 'revision', icon: <AlertCircle size={11} /> },
  { time: '2h ago', action: 'BOM generated', project: 'Gupta Apartment', type: 'production', icon: <CheckCircle size={11} /> },
  { time: '3h ago', action: 'New lead captured', project: 'Patel — 4BHK Concept', type: 'lead', icon: <Circle size={11} /> },
];

const activityColors: Record<string, string> = {
  ai: 'text-[#8B5CF6]',
  render: 'text-[#2DD4BF]',
  approval: 'text-[#2DD4BF]',
  revision: 'text-[#F43F5E]',
  production: 'text-[#C9A84C]',
  lead: 'text-[#4A7CFF]',
};

const metrics = [
  {
    label: 'Active Projects',
    value: '12',
    sub: '+2 this week',
    trend: 'up',
    color: '#C9A84C',
    icon: <Star size={15} />,
  },
  {
    label: 'Pipeline Value',
    value: '₹2.4Cr',
    sub: '+18% MoM',
    trend: 'up',
    color: '#4A7CFF',
    icon: <TrendingUp size={15} />,
  },
  {
    label: 'Renders Queued',
    value: '7',
    sub: '~40min avg',
    trend: 'neutral',
    color: '#8B5CF6',
    icon: <Clock size={15} />,
  },
  {
    label: 'Pending Approvals',
    value: '3',
    sub: '1 overdue',
    trend: 'down',
    color: '#F43F5E',
    icon: <Users size={15} />,
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1E1E24] border border-[#2A2A35] rounded-lg px-3 py-2 text-[12px]">
        <div className="text-[#555566] mb-1">{label}</div>
        <div className="text-[#C9A84C] font-semibold">₹{payload[0].value}K</div>
      </div>
    );
  }
  return null;
};

export default function CommandCenter() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0A0A0B]">
      <div className="p-6 space-y-5 max-w-[1400px] w-full mx-auto">

        {/* Welcome Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#F0EEE8] tracking-tight">
              Good morning, <span className="gold-gradient">Sneha</span> ✦
            </h2>
            <p className="text-[13px] text-[#555566] mt-0.5">Thursday, 20 March 2025 · 3 projects need your attention today</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-4 py-2 rounded-lg text-[12px] font-medium text-[#8A8899]">
              View Schedule
            </button>
            <button className="btn-gold px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-2">
              <Play size={12} fill="currentColor" />
              Start Session
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="metric-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: m.color + '18', color: m.color }}>
                  {m.icon}
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-medium ${
                  m.trend === 'up' ? 'text-[#2DD4BF]' : m.trend === 'down' ? 'text-[#F43F5E]' : 'text-[#555566]'
                }`}>
                  {m.trend === 'up' && <ArrowUpRight size={12} />}
                  {m.sub}
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#F0EEE8] tracking-tight">{m.value}</div>
              <div className="text-[11px] text-[#555566] mt-0.5 font-medium uppercase tracking-wide">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Active Projects — spans 2 cols */}
          <div className="col-span-2 bg-[#111113] border border-[#2A2A35] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E24]">
              <div>
                <h3 className="text-[13px] font-semibold text-[#F0EEE8]">Active Projects</h3>
                <p className="text-[11px] text-[#555566]">12 ongoing · 4 need action</p>
              </div>
              <button className="text-[11px] text-[#C9A84C] hover:text-[#E8C97A] flex items-center gap-1 font-medium transition-colors">
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-[#1A1A20]">
              {activeProjects.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#16161C] transition-colors cursor-pointer group">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: p.avatarColor + '33', border: `1px solid ${p.avatarColor}44`, color: p.avatarColor }}>
                    {p.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#F0EEE8] truncate">{p.client}</span>
                      {p.urgent && (
                        <span className="tag bg-[#F43F5E18] text-[#F43F5E] border border-[#F43F5E33] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Urgent</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#555566] mt-0.5">{p.location} · {p.rooms} rooms · {p.designer}</div>
                  </div>

                  {/* Stage */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.stageColor }} />
                    <span className="text-[11px] font-medium" style={{ color: p.stageColor }}>{p.stage}</span>
                  </div>

                  {/* Progress */}
                  <div className="w-20 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#555566]">{p.progress}%</span>
                      <span className="text-[10px] text-[#555566]">{p.daysLeft}d left</span>
                    </div>
                    <div className="progress-bar h-1">
                      <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.stageColor }} />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-[13px] font-semibold text-[#C9A84C] shrink-0 w-16 text-right">{p.value}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button className="p-1.5 hover:bg-[#252530] rounded-lg transition-colors">
                      <Eye size={13} className="text-[#555566]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#252530] rounded-lg transition-colors">
                      <MoreHorizontal size={13} className="text-[#555566]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            {/* Revenue Chart */}
            <div className="bg-[#111113] border border-[#2A2A35] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[11px] text-[#555566] uppercase tracking-widest font-medium">Revenue</div>
                  <div className="text-[22px] font-bold text-[#F0EEE8] mt-0.5">₹74.2L</div>
                  <div className="text-[11px] text-[#2DD4BF] flex items-center gap-1 mt-0.5">
                    <ArrowUpRight size={11} /> +22% vs last quarter
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#555566' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="v" stroke="#C9A84C" strokeWidth={1.5} fill="url(#goldGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 bg-[#111113] border border-[#2A2A35] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E24]">
                <h3 className="text-[12px] font-semibold text-[#F0EEE8]">Live Activity</h3>
                <span className="flex items-center gap-1 text-[10px] text-[#2DD4BF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                  Live
                </span>
              </div>
              <div className="px-4 py-2 space-y-0">
                {aiActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-[#1A1A20] last:border-0">
                    <span className={`mt-0.5 ${activityColors[a.type]}`}>{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] text-[#D0CECC] font-medium leading-snug">{a.action}</div>
                      <div className="text-[10px] text-[#555566] mt-0.5 truncate">{a.project}</div>
                    </div>
                    <div className="text-[10px] text-[#3A3A48] shrink-0">{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'New Client', sub: 'Start lead capture', color: '#C9A84C', bg: '#C9A84C12' },
            { label: 'Upload Floor Plan', sub: 'Run AI extraction', color: '#4A7CFF', bg: '#4A7CFF12' },
            { label: 'Open Design Studio', sub: '3D editor', color: '#8B5CF6', bg: '#8B5CF612' },
            { label: 'Generate Renders', sub: 'Queue photoreal job', color: '#2DD4BF', bg: '#2DD4BF12' },
            { label: 'Export Production', sub: 'BOM & cutlists', color: '#F59E0B', bg: '#F59E0B12' },
          ].map((q) => (
            <button key={q.label} className="text-left p-4 rounded-xl border border-[#2A2A35] hover:border-[#3A3A48] bg-[#111113] hover:bg-[#141418] transition-all group">
              <div className="w-7 h-7 rounded-lg mb-3 flex items-center justify-center" style={{ background: q.bg }}>
                <ArrowRight size={13} style={{ color: q.color }} />
              </div>
              <div className="text-[12.5px] font-semibold text-[#F0EEE8] leading-snug">{q.label}</div>
              <div className="text-[11px] text-[#555566] mt-0.5">{q.sub}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
