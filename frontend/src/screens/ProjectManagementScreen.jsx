import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, TrendingUp, CheckCircle2, Circle, Clock, 
  User, MapPin, IndianRupee, Calendar, BarChart3,
  Inbox, FileText, Compass, Palette, Sparkles, Scissors,
  ArrowRight, RefreshCw, Plus, ChevronLeft, ChevronRight,
  ShieldAlert, Star, DollarSign, Activity, Trash2
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'brief', label: 'Brief', icon: <FileText className="w-3 h-3" />, color: '#0891b2' },
  { id: 'cad_approved', label: 'CAD', icon: <Compass className="w-3 h-3" />, color: '#D4AF37' },
  { id: 'materials_selected', label: 'Materials', icon: <Palette className="w-3 h-3" />, color: '#a855f7' },
  { id: 'renders_approved', label: 'Renders', icon: <Sparkles className="w-3 h-3" />, color: '#f97316' },
  { id: 'production', label: 'Production', icon: <Scissors className="w-3 h-3" />, color: '#10b981' },
];

const STATUS_TO_STAGE_IDX = {
  '': 0,
  'brief': 0,
  'cad_approved': 1,
  'materials_selected': 2,
  'renders_approved': 3,
  'production': 4,
  'billing': 4,
};

export default function ProjectManagementScreen({ onNavigateToProject }) {
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showKanban, setShowKanban] = useState(true);
  const [readinessData, setReadinessData] = useState(null);
  const [isReadinessLoading, setIsReadinessLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReadiness(selectedProject.id);
    } else {
      setReadinessData(null);
    }
  }, [selectedProject]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProj, resLeads] = await Promise.all([
        fetch('http://127.0.0.1:5055/api/projects'),
        fetch('http://127.0.0.1:5055/api/leads')
      ]);
      const projs = await resProj.json();
      const leadsData = await resLeads.json();
      setProjects(projs);
      setLeads(leadsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadiness = async (projId) => {
    setIsReadinessLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projId}/readiness`);
      const data = await res.json();
      setReadinessData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReadinessLoading(false);
    }
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveProjectStage = async (project, direction) => {
    const currentStageId = project.status || 'brief';
    const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStageId);
    let newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < WORKFLOW_STAGES.length) {
      const newStage = WORKFLOW_STAGES[newIndex].id;
      await handleUpdateStatus(project.id, newStage);
    }
  };

  const getStageIndex = (project) => {
    return STATUS_TO_STAGE_IDX[project.status || ''] || 0;
  };

  // Pipeline stats
  const totalRevenue = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const avgBudget = projects.length > 0 ? totalRevenue / projects.length : 0;
  const stageBreakdown = WORKFLOW_STAGES.map(stage => ({
    ...stage,
    count: projects.filter(p => {
      const idx = getStageIndex(p);
      const sIdx = WORKFLOW_STAGES.findIndex(s => s.id === stage.id);
      return idx === sIdx;
    }).length
  }));

  // Group projects by stage for Kanban view
  const kanbanColumns = WORKFLOW_STAGES.map(stage => ({
    ...stage,
    projects: projects.filter(p => {
      const idx = getStageIndex(p);
      const sIdx = WORKFLOW_STAGES.findIndex(s => s.id === stage.id);
      return idx === sIdx;
    })
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* ── Stats Strip ── */}
      <div className="flex-shrink-0 flex gap-3 px-6 pt-4 pb-3 border-b border-slate-800/50">
        {[
          { label: 'Active Projects', value: projects.length, color: 'text-[#D4AF37]' },
          { label: 'Total Pipeline', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: 'text-emerald-400' },
          { label: 'Avg Project Value', value: `₹${(avgBudget / 100000).toFixed(1)}L`, color: 'text-blue-400' },
          { label: 'CRM Leads', value: leads.length, color: 'text-purple-400' },
          { label: 'Qualified Leads', value: leads.filter(l => l.voice_status === 'qualified' || l.voice_status === 'human_closed').length, color: 'text-rose-400' },
        ].map((stat, i) => (
          <div key={i} className="flex-1 bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
            <div className={`text-xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
        <button
          onClick={fetchData}
          className="bg-slate-900/70 border border-slate-800 px-3 py-3 rounded-xl text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Stage Pipeline Bar ── */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-800/50">
        <div className="flex gap-2">
          {stageBreakdown.map((stage, i) => (
            <div key={stage.id} className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-slate-500 font-semibold uppercase tracking-wide">{stage.label}</span>
                <span className="font-bold" style={{ color: stage.color }}>{stage.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${projects.length > 0 ? (stage.count / projects.length * 100) : 0}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── View Switcher ── */}
      <div className="flex-shrink-0 px-6 py-2 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">View:</span>
          <button
            onClick={() => setShowKanban(false)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition ${!showKanban ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Project List
          </button>
          <button
            onClick={() => setShowKanban(true)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition ${showKanban ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Kanban Pipeline
          </button>
        </div>
        {selectedProject && (
          <button 
            onClick={() => setSelectedProject(null)}
            className="text-[10px] font-bold text-red-400 bg-red-950/20 border border-red-900/40 hover:bg-red-950/40 px-2.5 py-1 rounded-lg transition"
          >
            Clear Selected Project
          </button>
        )}
      </div>

      {/* ── Main Content Area split ── */}
      <div className="flex-grow flex overflow-hidden p-6 gap-6">
        
        {/* Left Side: Pipeline Board/List */}
        <div className={`flex-1 overflow-hidden flex flex-col ${selectedProject ? 'w-2/3' : 'w-full'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-400">No Projects Yet</h3>
                <p className="text-sm text-slate-600 mt-2">Close a deal in CRM to create your first project workspace</p>
              </div>
            </div>
          ) : !showKanban ? (
            /* ── Project List View ── */
            <div className="h-full overflow-y-auto space-y-3 pt-2">
              {projects.map(project => {
                const stageIdx = getStageIndex(project);
                const currentStage = WORKFLOW_STAGES[stageIdx] || WORKFLOW_STAGES[0];
                const progress = Math.round((stageIdx / (WORKFLOW_STAGES.length - 1)) * 100);
                const isSelected = selectedProject?.id === project.id;
                
                return (
                  <div
                    key={project.id}
                    className={`bg-slate-900/80 border p-4 flex gap-4 rounded-2xl transition cursor-pointer slide-up ${
                      isSelected ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5 bg-[#0b1329]' : 'border-slate-800 hover:border-[#D4AF37]/30'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-200">{project.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{project.client_name}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString('en-IN')}</span>
                            <span className="font-mono text-[#D4AF37]/70">{project.id}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-[#D4AF37] font-mono">
                            ₹{project.budget ? (project.budget / 100000).toFixed(1) + 'L' : '—'}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Budget</div>
                        </div>
                      </div>

                      {/* Stage Progress Bar */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider" style={{ color: currentStage.color }}>
                            {currentStage.icon} {currentStage.label}
                          </span>
                          <span className="text-slate-500">{progress}% complete</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%`, backgroundColor: currentStage.color }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigateToProject && onNavigateToProject(project.id); }}
                        className="bg-[#D4AF37] hover:bg-[#AA8C2C] text-slate-950 text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-1 transition whitespace-nowrap"
                      >
                        Open Workspace <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Kanban Pipeline View (Drag-and-Drop Button styled actions) ── */
            <div className="h-full overflow-x-auto">
              <div className="flex gap-4 h-full pt-2 min-w-max">
                {kanbanColumns.map(col => (
                  <div key={col.id} className="w-60 flex flex-col gap-3 h-full">
                    {/* Column Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 rounded-xl border" style={{ borderColor: col.color + '40', backgroundColor: col.color + '0c' }}>
                      <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: col.color }}>
                        {col.icon} {col.label}
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.color + '20', color: col.color }}>
                        {col.projects.length}
                      </span>
                    </div>

                    {/* Project Cards */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-10">
                      {col.projects.map(project => {
                        const isSelected = selectedProject?.id === project.id;
                        return (
                          <div
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className={`bg-slate-900 border p-3.5 rounded-2xl cursor-pointer transition select-none flex flex-col gap-2.5 ${
                              isSelected ? 'border-[#D4AF37] bg-[#0b1329] shadow-lg shadow-[#D4AF37]/5' : 'border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-black text-slate-200 leading-snug">{project.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-bold flex items-center gap-1"><User className="w-3 h-3 text-[#D4AF37]" />{project.client_name}</p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] border-t border-slate-800/40 pt-2 shrink-0">
                              <span className="text-[#D4AF37] font-mono font-extrabold">
                                ₹{project.budget ? (project.budget / 100000).toFixed(1) + 'L' : '—'}
                              </span>
                              <span className="text-slate-600 font-mono text-[9px]">{project.id}</span>
                            </div>

                            {/* Drag-and-drop replacement controls */}
                            <div className="flex gap-1 border-t border-slate-800/40 pt-2 shrink-0 justify-between items-center no-print">
                              <button 
                                title="Move Stage Back"
                                onClick={(e) => { e.stopPropagation(); moveProjectStage(project, -1); }}
                                className="bg-slate-950 border border-slate-850 hover:bg-slate-800 p-1.5 rounded-lg text-slate-400 transition"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Move Stage</span>
                              <button 
                                title="Move Stage Forward"
                                onClick={(e) => { e.stopPropagation(); moveProjectStage(project, 1); }}
                                className="bg-slate-950 border border-slate-850 hover:bg-slate-800 p-1.5 rounded-lg text-slate-400 transition"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {col.projects.length === 0 && (
                        <div className="text-center py-12 text-slate-700 text-[10px] font-semibold border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                          No projects in this stage
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sales Readiness KPI Checklist Drawer */}
        {selectedProject && (
          <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 h-[70vh] shrink-0 overflow-y-auto slide-left">
            <div>
              <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">Project Command Panel</span>
              <h3 className="text-sm font-extrabold text-slate-100 truncate">{selectedProject.name}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">ID: {selectedProject.id}</p>
            </div>

            {/* Quick CTAs */}
            <div className="space-y-2">
              <button
                onClick={() => onNavigateToProject && onNavigateToProject(selectedProject.id)}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#AA8C2C] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xl transition shadow-lg shadow-[#D4AF37]/5"
              >
                Open Workspace <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Selector */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-2 text-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Update Pipeline Stage</label>
              <select
                value={selectedProject.status || 'brief'}
                onChange={(e) => handleUpdateStatus(selectedProject.id, e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-semibold cursor-pointer outline-none focus:border-[#D4AF37]/50"
              >
                {WORKFLOW_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Sales Readiness KPI Checklist */}
            <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Sales Readiness KPI</h4>
                {isReadinessLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                ) : (
                  <strong className="text-sm font-extrabold text-[#D4AF37] font-mono">
                    {readinessData?.score || 0}%
                  </strong>
                )}
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${readinessData?.score || 0}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-3 mt-1">
                {readinessData && Object.entries(readinessData.stages).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    {value.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`font-semibold block truncate leading-tight ${value.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                        {value.label}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Weight: {value.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Detail Card */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-xs space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Metadata</h4>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold">{selectedProject.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="truncate max-w-[150px] font-semibold">{selectedProject.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold">{selectedProject.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget:</span>
                  <span className="font-mono text-[#D4AF37] font-bold">₹{selectedProject.budget?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {selectedProject && (
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                  <div>
                    <h4 className="text-[10px] font-bold text-[#F0EEE8] uppercase tracking-widest">Project quote</h4>
                    <p className="text-[9px] text-slate-500">Linked estimate, milestones, and payment state.</p>
                  </div>
                </div>
                <PaymentMilestoneChips projectId={selectedProject.id} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const MS_COLORS = {
  paid: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  awaiting: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  pending: 'bg-slate-800 border-slate-700 text-slate-400',
};

function PaymentMilestoneChips({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [planRes, paymentsRes] = await Promise.all([
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/payment-plans`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/payments`),
      ]);
      const planData = planRes.ok ? await planRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const list = Array.isArray(planData)
        ? planData
        : Array.isArray(planData?.milestones)
          ? planData.milestones
          : planData?.items || [];
      setMilestones(list);
      setPayments(paymentsData);
      setError('');
    } catch (e) {
      setError('Unable to load payment milestones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const paidTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const milestoneTotal = milestones.reduce((sum, m) => sum + (Number(m.amount) || Number(m.value) || 0), 0);
  const paidPct = milestoneTotal > 0 ? Math.min(100, Math.round((paidTotal / milestoneTotal) * 100)) : 0;

  const getStatus = (m) => {
    const pct = Number(m.percentage || m.pct || 0);
    if (!pct) return 'pending';
    return paidPct >= pct ? 'paid' : 'awaiting';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Milestone Payments</div>
        <div className="text-[10px] font-mono text-slate-400">{paidPct}% funded</div>
      </div>

      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] transition-all duration-700"
          style={{ width: `${paidPct}%` }}
        />
      </div>

      {error && <p className="text-[11px] text-rose-400 font-semibold">{error}</p>}
      {!error && milestones.length === 0 && (
        <p className="text-[10px] text-slate-500">No payment milestones yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {milestones.map((m, idx) => {
          const status = getStatus(m);
          const label = m.stage || m.title || `Milestone ${idx + 1}`;
          const pct = Number(m.percentage || m.pct || 0);
          return (
            <div key={m.id || idx} className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${MS_COLORS[status] || MS_COLORS.pending}`}>
              <div className="leading-tight">{label}</div>
              <div className="text-[9px] font-mono mt-0.5">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VendorApprovalFlow({ vendor }) {
  const [status, setStatus] = useState(vendor?.status || 'proposed');
  const [note, setNote] = useState('');
  const [local, setLocal] = useState(vendor || null);

  const submit = async (next) => {
    setStatus(next);
    setLocal((prev) => ({ ...(prev || {}), status: next }));
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/catalog/vendors/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor?.id, status: next, note })
      });
      if (res.ok) {
        setStatus(next);
      }
    } catch (e) {
      console.warn('Vendor approval failed', e);
    }
  };

  if (!local) return null;

  return (
    <div className="mt-3 border border-slate-800 rounded-xl p-3 space-y-2 bg-slate-950/60">
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Vendor Approval</div>
      <div className="text-[11px] text-slate-400">Status: <span className="font-bold text-[#F0EEE8]">{status}</span></div>

      {status === 'proposed' && (
        <div className="flex gap-2">
          <button onClick={() => submit('approved')} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">Approve</button>
          <button onClick={() => submit('rejected')} className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase">Reject</button>
        </div>
      )}
      {status === 'approved' && (
        <div className="text-[10px] text-emerald-400 font-bold">Approved for procurement.</div>
      )}
      {status === 'rejected' && (
        <div className="text-[10px] text-rose-400 font-bold">Rejected. Update vendor or select another.</div>
      )}
    </div>
  );
}

function BOMAttachPanel({ projectId }) {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const addLine = () => setLines((prev) => [...prev, { id: 'bom-' + Date.now(), description: '', quantity: 1, unit: 'pcs', rate: 0 }]);

  const remove = (id) => setLines((prev) => prev.filter((line) => line.id !== id));

  const total = lines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.rate) || 0)), 0);

  const save = async () => {
    if (!mounted || !projectId) return;
    setStatus('Saving BOM...');
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cutlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panels_json: JSON.stringify(lines) })
      });
      if (res.ok) {
        setStatus(`Saved. Total ₹${total.toLocaleString?.('en-IN') || total}`);
        setTimeout(() => setStatus(''), 2400);
      } else {
        setStatus('Save failed.');
      }
    } catch (e) {
      setStatus('Save failed.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">BOM Lines</h4>
          <p className="text-[9px] text-slate-500">Attach quantities and unit rates for production handoff.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addLine} className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-slate-200 hover:border-[#D4AF37]/50">Add Line</button>
          <button onClick={save} className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] text-slate-950 text-[10px] font-black">Save</button>
        </div>
      </div>

      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div key={line.id} className="grid grid-cols-12 gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <input
              value={line.description}
              onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, description: e.target.value } : l)))}
              placeholder="Description"
              className="col-span-5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            />
            <input
              value={line.quantity}
              onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, quantity: Number(e.target.value) || 0 } : l)))}
              placeholder="Qty"
              className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            />
            <input
              value={line.unit}
              onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, unit: e.target.value } : l)))}
              placeholder="Unit"
              className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            />
            <input
              value={line.rate}
              onChange={(e) => setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, rate: Number(e.target.value) || 0 } : l)))}
              placeholder="Rate"
              className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            />
            <button onClick={() => remove(line.id)} className="col-span-1 flex items-center justify-center text-rose-400 hover:text-rose-300">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {lines.length === 0 && (
          <p className="text-[10px] text-slate-500">No BOM lines yet.</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black text-[#D4AF37]">Total: ₹{total.toLocaleString?.('en-IN') || total}</div>
        {status && <div className="text-[10px] text-emerald-300">{status}</div>}
      </div>
    </div>
  );
}

function TimelineAttachPanel({ projectId }) {
  const [note, setNote] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoaded(true);
  }, [projectId]);

  const attach = async () => {
    if (!projectId || !note.trim()) return;
    try {
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'design.note', title: 'Agent B Studio Flow Attach', detail: note, source: 'agent-b-flow' })
      });
      setNote('');
    } catch (e) {
      console.warn('Timeline attach failed', e);
    }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950/60">
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Attach to Timeline</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add workflow note, change note, or approval context..."
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
      />
      <button onClick={attach} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-black uppercase text-slate-200 hover:border-[#D4AF37]/40">Attach Note</button>
    </div>
  );
}
