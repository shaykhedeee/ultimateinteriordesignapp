import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, TrendingUp, IndianRupee, FolderKanban, UserPlus,
  Sparkles, CheckCircle2, Circle, AlertTriangle, ArrowUpRight, ArrowRight,
  Cpu, Wifi, WifiOff, Clock, Briefcase, Plus, Gauge, Activity, Zap,
  Building2, FileText, Layers, Scissors, Award
} from 'lucide-react';

const API = '';

/* Stage funnel order (matches backend readiness weights) */
const FUNNEL = [
  { key: 'intake',    label: 'Intake',    icon: FileText, weight: 15 },
  { key: 'floorplan', label: 'Floorplan', icon: Layers,   weight: 15 },
  { key: 'renders',   label: 'Renders',   icon: Sparkles, weight: 20 },
  { key: 'proposal',  label: 'Proposal',  icon: Award,    weight: 20 },
  { key: 'cutlist',   label: 'Cutlist',   icon: Scissors, weight: 20 },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, weight: 10 }
];

const STATUS_COLOR = {
  brief:             '#60A5FA',
  cad_approved:      '#34D399',
  scene_ready:       '#22D3EE',
  materials_selected:'#A78BFA',
  renders_approved:  '#F59E0B',
  production:        '#F97316',
  billing:           '#C9A84C',
  final:             '#10B981'
};

const fmtINR = (n) => {
  const v = Number(n || 0);
  if (!v) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)} K`;
  return `₹${v.toLocaleString('en-IN')}`;
};

const STATUS_LABEL = {
  brief: 'Brief', cad_approved: 'CAD Approved', scene_ready: 'Scene Ready',
  materials_selected: 'Materials', renders_approved: 'Renders', production: 'Production',
  billing: 'Billing', final: 'Final'
};

/* ───────────────────────────────────────────────────────────
   Reusable bits
─────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent = 'var(--gold)', trend }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-[var(--gold)]/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        <span className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, ' + accent + ' 14%, transparent)', color: accent }}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="text-2xl font-extrabold leading-none text-slate-100">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 flex items-center gap-1">{sub}</div>}
    </div>
  );
}

function HealthBar({ score }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = pct >= 75 ? '#10B981' : pct >= 40 ? 'var(--gold)' : '#F97316';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Readiness</span>
        <span className="text-xs font-extrabold" style={{ color: tone }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: tone }} />
      </div>
    </div>
  );
}

function FunnelCell({ stage, data }) {
  const Icon = stage.icon;
  const done = data?.completed;
  return (
    <div className={`flex-1 rounded-xl border p-2.5 flex flex-col items-center gap-1.5 text-center transition-all ${done ? 'border-[var(--gold)]/40 bg-[var(--gold)]/5' : 'border-slate-800 bg-slate-950/30'}`}>
      {done ? <CheckCircle2 className="w-4 h-4 text-[var(--gold)]" /> : <Icon className="w-4 h-4 text-slate-600" />}
      <span className={`text-[10px] font-bold ${done ? 'text-slate-200' : 'text-slate-500'}`}>{stage.label}</span>
      <span className="text-[9px] text-slate-600 font-mono">{stage.weight}%</span>
    </div>
  );
}

function ProviderPill({ name, status }) {
  const ok = status === 'pass';
  const skip = status === 'skipped';
  const color = ok ? '#10B981' : skip ? '#64748B' : '#EF4444';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/40">
      {ok ? <Wifi className="w-3.5 h-3.5" style={{ color }} /> : <WifiOff className="w-3.5 h-3.5" style={{ color }} />}
      <span className="text-xs font-bold text-slate-200">{name}</span>
      <span className="text-[10px] font-mono ml-auto" style={{ color }}>{skip ? 'BYOK' : ok ? 'LIVE' : 'DOWN'}</span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Main Dashboard
─────────────────────────────────────────────────────────── */
export default function DashboardScreen({ projectId, onNavigateToTab }) {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [health, setHealth] = useState(null);
  const [readinessMap, setReadinessMap] = useState({});
  const [quotationMap, setQuotationMap] = useState({});
  const [now, setNow] = useState(new Date());

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, lRes, hRes] = await Promise.all([
        fetch(`${API}/api/projects`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/leads`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/diagnostics/api-health`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      setProjects(Array.isArray(pRes) ? pRes : []);
      setLeads(Array.isArray(lRes) ? lRes : []);
      setHealth(hRes);

      // Per-project readiness + quotation (only for first 8 to stay snappy)
      const top = (Array.isArray(pRes) ? pRes : []).slice(0, 8);
      const [read, quot] = await Promise.all([
        Promise.all(top.map(p =>
          fetch(`${API}/api/projects/${p.id}/readiness`).then(r => r.ok ? r.json() : null).then(d => [p.id, d]).catch(() => [p.id, null])
        )),
        Promise.all(top.map(p =>
          fetch(`${API}/api/projects/${p.id}/quotation`).then(r => r.ok ? r.json() : null).then(d => [p.id, d]).catch(() => [p.id, null])
        ))
      ]);
      setReadinessMap(Object.fromEntries(read));
      setQuotationMap(Object.fromEntries(quot));
    } catch (e) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => {
    const projCount = projects.length;
    const wonLeads = leads.filter(l => l.voice_status === 'human_closed');
    const wonCount = wonLeads.length;
    const totalLeadVal = leads.reduce((s, l) => s + (Number(l.budget) || 0), 0);
    const wonVal = wonLeads.reduce((s, l) => s + (Number(l.budget) || 0), 0);
    const pipelineVal = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
    const avgReadiness = (() => {
      const vals = Object.values(readinessMap).filter(Boolean).map(r => Number(r.score) || 0);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();
    const winRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0;
    return { projCount, wonCount, totalLeadVal, wonVal, pipelineVal, avgReadiness, winRate, leadCount: leads.length };
  }, [projects, leads, readinessMap]);

  const sortedProjects = useMemo(() =>
    [...projects].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [projects]
  );

  const recentLeads = useMemo(() =>
    [...leads].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5),
    [leads]
  );

  const navigate = (tab) => { if (onNavigateToTab) onNavigateToTab(tab); };

  return (
    <div className="h-full overflow-y-auto px-6 py-5 text-slate-100">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)]"><LayoutDashboard className="w-5 h-5" /></span>
            <h1 className="text-2xl font-extrabold tracking-tight">Studio Command Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Live workspace overview · {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('brief')} className="btn-gold px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard icon={FolderKanban} label="Active Projects" value={loading ? '…' : kpis.projCount} accent="#C9A84C" sub={<><Building2 className="w-3 h-3" /> Pipeline</>} />
        <KpiCard icon={UserPlus} label="Leads" value={loading ? '…' : kpis.leadCount} accent="#60A5FA" sub={<><Briefcase className="w-3 h-3" /> Captured</>} />
        <KpiCard icon={CheckCircle2} label="Won Deals" value={loading ? '…' : kpis.wonCount} accent="#10B981" sub={<>Win rate {kpis.winRate}%</>} />
        <KpiCard icon={IndianRupee} label="Pipeline Value" value={loading ? '…' : fmtINR(kpis.pipelineVal)} accent="#A78BFA" sub="From project budgets" />
        <KpiCard icon={TrendingUp} label="Weighted Won" value={loading ? '…' : fmtINR(kpis.wonVal)} accent="#34D399" sub="Closed-lead budget" />
        <KpiCard icon={Gauge} label="Avg Readiness" value={loading ? '…' : (kpis.avgReadiness == null ? '—' : kpis.avgReadiness + '%')} accent="var(--gold)" sub="Across open projects" />
      </div>

      {/* Active project status: stage / next step / blocked — surfaces the workflow state */}
      {projectId && readinessMap[projectId] && (() => {
        const r = readinessMap[projectId];
        const active = r.activeStage || { label: '—', tab: 'cad' };
        const blocked = r.blocked || [];
        return (
          <div className="panel mb-6">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <h2 className="panel-head flex items-center gap-2"><Activity className="ph-icon" /> Active Project Status</h2>
              <span className="text-[10px] font-mono text-slate-500">{projectId}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Active Stage</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: active.completed ? '#10B981' : 'var(--gold)' }} />
                  <span className="text-lg font-extrabold text-slate-100">{active.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Readiness {r.score}%</div>
                <button onClick={() => navigate(active.tab)} className="mt-3 text-[11px] font-bold text-[var(--gold)] hover:text-[var(--gold-bright)] flex items-center gap-1">
                  Open {active.label} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 md:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Next Step</div>
                <div className="text-sm text-slate-200 flex items-start gap-2">
                  <ArrowUpRight className="w-4 h-4 text-[var(--gold)] mt-0.5 shrink-0" />
                  <span>{r.nextStep || 'All steps complete.'}</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-4 mb-1">Blocked / Needs Attention</div>
                {blocked.length === 0 ? (
                  <div className="text-[12px] text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Nothing blocking — downstream outputs are in sync.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {blocked.map((b, i) => (
                      <li key={i} className="text-[12px] flex items-start gap-2">
                        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${b.kind === 'review' ? 'text-orange-400' : 'text-amber-400'}`} />
                        <span className="text-slate-300">{b.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Middle grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Pipeline funnel (aggregate) */}
        <div className="lg:col-span-2 panel">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h2 className="panel-head flex items-center gap-2"><Activity className="ph-icon" /> Delivery Pipeline Funnel</h2>
            <span className="text-[10px] text-slate-500 font-mono">weighted % complete</span>
          </div>
          {/* aggregate funnel computed from readinessMap */}
          {loading ? (
            <div className="text-slate-500 text-sm py-8 text-center">Loading pipeline…</div>
          ) : Object.keys(readinessMap).length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">No projects yet — create one to populate the funnel.</div>
          ) : (
            <FunnelAggregate readinessMap={readinessMap} />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <QuickLink tab="brief"     label="Capture Intake"   onNav={navigate} />
            <QuickLink tab="cad"       label="Plan Intelligence" onNav={navigate} />
            <QuickLink tab="renders"   label="Render Studio"    onNav={navigate} />
            <QuickLink tab="cutlist"   label="Cutlist & Nesting" onNav={navigate} />
          </div>
        </div>

        {/* AI / provider status */}
        <div className="panel flex flex-col justify-between">
          <div>
            <h2 className="panel-head flex items-center gap-2 mb-4 border-b border-white/5 pb-3"><Cpu className="ph-icon" /> Engine & Provider Health</h2>
          {health ? (
            <div className="space-y-2">
              <ProviderPill name="Freepik"    status={health.freepik?.status} />
              <ProviderPill name="HuggingFace" status={health.huggingface?.status} />
              <ProviderPill name="OpenRouter" status={health.openrouter?.status} />
              <div className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-[var(--gold)] mt-0.5 shrink-0" />
                <span>BYOK = provider key not set. AURA falls back to the local rule engine; renders use offline fallbacks. Add keys in Settings to go live.</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm py-6 text-center">Health service unreachable.</div>
          )}
          <button onClick={() => navigate('brand')} className="mt-4 w-full btn-ghost py-2.5 flex justify-center items-center">
            Configure Providers
          </button>
          </div>
        </div>
      </div>

      {/* Project health table */}
      <div className="panel mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h2 className="panel-head flex items-center gap-2"><Building2 className="ph-icon" /> Project Health</h2>
          <button onClick={() => navigate('projects')} className="text-[11px] text-[var(--gold)] hover:text-[var(--gold-bright)] flex items-center gap-1 font-bold">View all <ArrowRight className="w-3 h-3" /></button>
        </div>
        {sortedProjects.length === 0 ? (
          <div className="text-slate-500 text-sm py-8 text-center">No projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 text-left">
                  <th className="pb-2 pr-4 font-bold">Project</th>
                  <th className="pb-2 pr-4 font-bold">Client</th>
                  <th className="pb-2 pr-4 font-bold">Stage</th>
                  <th className="pb-2 pr-4 font-bold">Budget</th>
                  <th className="pb-2 pr-4 font-bold">Quotation</th>
                  <th className="pb-2 font-bold w-40">Readiness</th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.slice(0, 8).map(p => {
                  const rd = readinessMap[p.id];
                  const qt = quotationMap[p.id];
                  let quoteVal = null;
                  try { const q = qt?.quotation_json ? JSON.parse(qt.quotation_json) : null; quoteVal = q?.total ?? q?.grandTotal ?? q?.totalCost ?? null; } catch {}
                  const status = p.status || 'brief';
                  return (
                    <tr key={p.id} className="border-t border-slate-800/70 hover:bg-slate-950/30 cursor-pointer" onClick={() => { if (onNavigateToTab) onNavigateToTab('projects'); }}>
                      <td className="py-3 pr-4 font-bold text-slate-100 max-w-[180px] truncate">{p.name}</td>
                      <td className="py-3 pr-4 text-slate-400 truncate max-w-[140px]">{p.client_name || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: (STATUS_COLOR[status] || '#64748B') + '22', color: STATUS_COLOR[status] || '#94A3B8' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] || '#94A3B8' }} />{STATUS_LABEL[status] || status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300 font-mono text-xs">{fmtINR(p.budget)}</td>
                      <td className="py-3 pr-4 text-slate-300 font-mono text-xs">{quoteVal ? fmtINR(quoteVal) : '—'}</td>
                      <td className="py-3"><HealthBar score={rd?.score} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent leads */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><UserPlus className="w-4 h-4 text-[var(--gold)]" /> Recent Leads</h2>
          <button onClick={() => navigate('crm')} className="text-[11px] text-slate-400 hover:text-[var(--gold)] flex items-center gap-1">Open CRM <ArrowRight className="w-3 h-3" /></button>
        </div>
        {recentLeads.length === 0 ? (
          <div className="text-slate-500 text-sm py-6 text-center">No leads captured yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {recentLeads.map(l => {
              const status = l.voice_status || 'new';
              const tone = status === 'human_closed' ? '#10B981' : status === 'qualified' ? '#34D399' : status === 'human_lost' ? '#EF4444' : '#64748B';
              return (
                <div key={l.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100 truncate">{l.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: tone + '22', color: tone }}>{status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="font-mono">{fmtINR(l.budget)}</span>
                    {l.area ? <span>{l.area} sqft</span> : null}
                    {l.score != null ? <span className="ml-auto text-[var(--gold)] font-bold">Score {l.score}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-600 text-center py-6 font-mono">
        GRID OS · ULTIDA Interior Design OS — live data from workspace database · {loading ? 'syncing…' : 'connected'}
      </div>
    </div>
  );
}

function FunnelAggregate({ readinessMap }) {
  // For each funnel stage, compute % of projects that completed it
  const stats = FUNNEL.map(stage => {
    const entries = Object.values(readinessMap).filter(Boolean);
    if (!entries.length) return { ...stage, pct: 0, count: 0, total: 0 };
    const done = entries.filter(e => e.stages?.[stage.key]?.completed).length;
    return { ...stage, count: done, total: entries.length, pct: Math.round((done / entries.length) * 100) };
  });
  const max = Math.max(1, ...stats.map(s => s.pct));
  return (
    <div className="space-y-2.5">
      {stats.map(s => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="w-20 text-[11px] font-bold text-slate-300 shrink-0">{s.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all duration-700" style={{ width: (s.pct / max * 100) + '%' }} />
          </div>
          <span className="w-14 text-right text-[10px] font-mono text-slate-400">{s.count}/{s.total}</span>
        </div>
      ))}
    </div>
  );
}

function QuickLink({ tab, label, onNav }) {
  return (
    <button onClick={() => onNav(tab)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-300 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] transition">
      {label} <ArrowUpRight className="w-3 h-3" />
    </button>
  );
}
