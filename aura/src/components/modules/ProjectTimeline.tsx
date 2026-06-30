import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  GanttChart,
  ChevronRight,
  Users,
  FileCheck,
  Truck,
  Camera,
  Wrench,
  Sparkles
} from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
  assignee: string;
  type: 'design' | 'procurement' | 'construction' | 'review' | 'render';
}

const INITIAL_PHASES: Phase[] = [
  { id: 'ph1', name: 'Client Brief & Style DNA Quiz', start: 'Jan 5', end: 'Jan 8', progress: 100, status: 'completed', assignee: 'AI Agent + Lead Designer', type: 'design' },
  { id: 'ph2', name: '2D Floor Plan Vectorization', start: 'Jan 8', end: 'Jan 12', progress: 100, status: 'completed', assignee: 'AURA Spatial AI (GNN)', type: 'design' },
  { id: 'ph3', name: 'AI Design Generation (3 Options)', start: 'Jan 12', end: 'Jan 15', progress: 100, status: 'completed', assignee: 'AURA Design Agent 70B', type: 'design' },
  { id: 'ph4', name: 'Client Review & Design Refinement', start: 'Jan 16', end: 'Jan 22', progress: 85, status: 'in-progress', assignee: 'Maya Vance (Client)', type: 'review' },
  { id: 'ph5', name: 'Parametric Kitchen & Wardrobe Config', start: 'Jan 22', end: 'Jan 28', progress: 40, status: 'in-progress', assignee: 'Vikram S. (MEP)', type: 'design' },
  { id: 'ph6', name: 'Cloud GPU Photorealistic Renders', start: 'Jan 28', end: 'Feb 2', progress: 0, status: 'pending', assignee: 'AURA Render Farm (H100)', type: 'render' },
  { id: 'ph7', name: 'BOQ Finalization & Vendor PO', start: 'Feb 2', end: 'Feb 8', progress: 0, status: 'pending', assignee: 'Commerce Agent', type: 'procurement' },
  { id: 'ph8', name: 'Contractor Handoff Package', start: 'Feb 5', end: 'Feb 10', progress: 0, status: 'pending', assignee: 'Lead Designer', type: 'construction' },
  { id: 'ph9', name: 'Furniture Procurement & Delivery', start: 'Feb 10', end: 'Feb 25', progress: 0, status: 'pending', assignee: 'Multi-Vendor Cart', type: 'procurement' },
  { id: 'ph10', name: 'Site Execution & AI Supervision', start: 'Feb 25', end: 'Mar 15', progress: 0, status: 'pending', assignee: 'Contractor + AI Photo Compare', type: 'construction' },
];

const STATUS_CONFIG = {
  'completed': { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  'in-progress': { icon: <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />, bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  'pending': { icon: <Circle className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-800/50', border: 'border-slate-700', text: 'text-slate-500' },
  'delayed': { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'design': <Sparkles className="w-3 h-3" />,
  'procurement': <Truck className="w-3 h-3" />,
  'construction': <Wrench className="w-3 h-3" />,
  'review': <FileCheck className="w-3 h-3" />,
  'render': <Camera className="w-3 h-3" />
};

export const ProjectTimeline: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'kanban' | 'list'>('gantt');

  const overallProgress = Math.round(
    phases.reduce((acc, p) => acc + p.progress, 0) / phases.length
  );

  const togglePhaseStatus = (id: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next: Phase['status'][] = ['pending', 'in-progress', 'completed'];
      const idx = next.indexOf(p.status);
      const newStatus = next[(idx + 1) % 3];
      return { ...p, status: newStatus, progress: newStatus === 'completed' ? 100 : newStatus === 'in-progress' ? 50 : 0 };
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100 select-none">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" /> Project Execution Timeline
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Phase Tracking & AI-Predicted Schedule</h1>
          <p className="text-slate-400 text-xs">10 phases from design concept to final handover. AI predicts delays and auto-adjusts milestones.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-400 font-mono">{overallProgress}%</div>
            <div className="text-[10px] text-slate-400 font-mono">Overall Progress</div>
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['gantt', 'kanban', 'list'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  viewMode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'gantt' && <GanttChart className="w-3.5 h-3.5 inline mr-1" />}
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt View */}
      {viewMode === 'gantt' && (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Gantt Header - Months */}
              <div className="flex border-b border-slate-800 bg-slate-900/40">
                <div className="w-56 shrink-0 p-3 font-mono text-[10px] text-slate-400 uppercase font-bold border-r border-slate-800">
                  Phase / Milestone
                </div>
                <div className="flex-1 flex">
                  {['Jan 1-7', 'Jan 8-14', 'Jan 15-21', 'Jan 22-28', 'Jan 29-Feb 4', 'Feb 5-11', 'Feb 12-18', 'Feb 19-25', 'Feb 26-Mar 4', 'Mar 5-15'].map((week, i) => (
                    <div key={i} className="flex-1 p-2 text-center text-[9px] font-mono text-slate-500 border-r border-slate-800/50">
                      {week}
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Rows */}
              {phases.map((phase) => {
                const config = STATUS_CONFIG[phase.status];
                const startIdx = phases.findIndex(p => p.id === phase.id);
                return (
                  <div
                    key={phase.id}
                    className={`flex border-b border-slate-800/50 hover:bg-slate-900/30 transition cursor-pointer ${
                      selectedPhase === phase.id ? 'bg-indigo-950/20' : ''
                    }`}
                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  >
                    <div className="w-56 shrink-0 p-3 border-r border-slate-800 flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); togglePhaseStatus(phase.id); }}>
                        {config.icon}
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{phase.name}</div>
                        <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-2.5 h-2.5" /> {phase.assignee}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center relative py-2">
                      {/* Gantt Bar spanning appropriate columns */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-full ${config.bg} border ${config.border} flex items-center px-3 transition-all`}
                        style={{
                          left: `${(startIdx / (phases.length - 1)) * 85}%`,
                          width: `${Math.max(8, 100 / phases.length)}%`
                        }}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 absolute left-0 top-0 transition-all duration-700"
                          style={{ width: `${phase.progress}%`, opacity: 0.6 }}
                        />
                        <span className="relative z-10 text-[9px] font-mono font-bold text-white">
                          {phase.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['pending', 'in-progress', 'review', 'completed'] as const).map((col) => {
            const colPhases = phases.filter(p => {
              if (col === 'review') return p.type === 'review';
              return p.status === col;
            });
            const colLabel = col === 'review' ? 'Client Review' : col.replace('-', ' ');
            return (
              <div key={col} className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-300 capitalize flex items-center gap-2">
                    {STATUS_CONFIG[col === 'review' ? 'in-progress' : col]?.icon}
                    {colLabel}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">{colPhases.length}</span>
                </div>
                <div className="space-y-2">
                  {colPhases.map(phase => {
                    const config = STATUS_CONFIG[phase.status];
                    return (
                      <div
                        key={phase.id}
                        className={`p-3 rounded-xl border ${config.border} ${config.bg} cursor-pointer hover:scale-[1.02] transition`}
                        onClick={() => togglePhaseStatus(phase.id)}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-950/50 text-slate-300 flex items-center gap-1">
                            {TYPE_ICONS[phase.type]} {phase.type}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{phase.name}</div>
                        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                          <span>{phase.start} → {phase.end}</span>
                          <span className="font-bold text-indigo-400">{phase.progress}%</span>
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${phase.progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {colPhases.length === 0 && (
                    <div className="p-4 text-center text-[10px] text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                      No phases
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          {phases.map((phase, idx) => {
            const config = STATUS_CONFIG[phase.status];
            return (
              <div
                key={phase.id}
                className={`p-4 flex items-center gap-4 border-b border-slate-800/50 hover:bg-slate-900/30 transition cursor-pointer ${
                  idx === 0 ? 'rounded-t-3xl' : ''
                }`}
                onClick={() => togglePhaseStatus(phase.id)}
              >
                <div className={`w-8 h-8 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-200">{phase.name}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                      {phase.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                    <span>{phase.start} → {phase.end}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {phase.assignee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${phase.progress}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 w-8 text-right">{phase.progress}%</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Delay Prediction */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-xs font-bold text-amber-300">AI Delay Prediction Engine</div>
            <p className="text-[11px] text-slate-400">
              Phase 5 (Parametric Config) may slip 2 days due to pending MEP load calculations. 
              <span className="text-indigo-400 font-semibold ml-1 cursor-pointer hover:underline">Auto-reschedule downstream phases?</span>
            </p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition shrink-0 cursor-pointer">
          Auto-Optimize Schedule
        </button>
      </div>
    </div>
  );
};
