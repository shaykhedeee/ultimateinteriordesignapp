import React from 'react';
import {
  Inbox, FileText, Compass, Palette, Sparkles, Scissors,
  BarChart3, Users, CheckSquare, LayoutDashboard, Scan,
  FolderOpen, ChevronDown, Activity, TrendingUp, Zap,
  CheckCircle2, Circle, Clock, AlertCircle, Kanban, Layers, IndianRupee, Monitor, Store, Shield, BrainCircuit
} from 'lucide-react';
import AuraBrainChat from '../layout/AuraBrainChat';
import { useAppStore } from '../../stores/appStore';

const TAB_TITLES = {
  dashboard: 'Command Center & Workspace Hub',
  crm: 'CRM & Outbound Calling System',
  projects: 'Project Pipeline & Kanban Board',
  brief: 'Client Onboarding Brief Studio',
  cad: '2D Blueprint Drafting Workspace',
  studio: '3D Linked Furnishing Studio',
  drawings: 'Wall Elevations & Architectural Drafting',
  materials: 'Finishes, Swatches & Hardware Catalog',
  renders: '3D AI Render Extrusion Engine',
  cutlist: 'Precision Slicing Cutlist Nesting',
  ceiling: 'False Ceiling Generator',
  tvunit: 'TV Unit Generator',
  finance: 'Commerce, Estimates & Quotations',
  timeline: 'Project Activity & Event Log',
  jobs: 'Background Jobs & Rendering Pipeline Monitor',
  settings: 'Settings & Providers'
};

const NAV_SECTIONS = [
  {
    title: 'Client Acquisition',
    items: [
      { id: 'crm', label: 'CRM & Call Board', icon: <Inbox className="w-4 h-4" /> },
      { id: 'projects', label: 'Project Pipeline', icon: <BarChart3 className="w-4 h-4" /> }
    ]
  },
  {
    title: 'Design Studio',
    items: [
      { id: 'brief', label: 'Client Brief Intake', icon: <FileText className="w-4 h-4" /> },
      { id: 'cad', label: '2D Blueprint Drafting', icon: <Compass className="w-4 h-4" /> },
      { id: 'floorplan', label: 'AI Floorplan Analyzer', icon: <Scan className="w-4 h-4" /> },
      { id: 'studio', label: '3D Furnishing Studio', icon: <Layers className="w-4 h-4" /> },
      { id: 'drawings', label: 'Wall Elevations', icon: <CheckSquare className="w-4 h-4" /> },
      { id: 'ceiling', label: 'False Ceiling Generator', icon: <Layers className="w-4 h-4" /> },
      { id: 'tvunit', label: 'TV Unit Generator', icon: <Monitor className="w-4 h-4" /> }
    ]
  },
  {
    title: 'AI Visualization',
    items: [
      { id: 'renders', label: '3D Render Studio', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'render-edit', label: 'Render Edit Suite', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'jobs', label: 'Background Jobs', icon: <Clock className="w-4 h-4" /> },
      { id: 'orchestrator', label: 'Orchestrator Studio', icon: <BrainCircuit className="w-4 h-4" /> }
    ]
  },
  {
    title: 'Production & Commerce',
    items: [
      { id: 'materials', label: 'Materials Catalog', icon: <Palette className="w-4 h-4" /> },
      { id: 'cutlist', label: 'Cutlist & Nesting', icon: <Scissors className="w-4 h-4" /> },
      { id: 'vendor', label: 'Vendor Intelligence', icon: <Store className="w-4 h-4" /> },
      { id: 'pinterest', label: 'Pinterest Learning', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'finance', label: 'Commerce & Quotes', icon: <IndianRupee className="w-4 h-4" /> },
      { id: 'timeline', label: 'Project Timeline', icon: <Activity className="w-4 h-4" /> },
      { id: 'system-admin', label: 'System Admin', icon: <Shield className="w-4 h-4" /> },
      { id: 'settings', label: 'Providers & Settings', icon: <span className="w-4 h-4 inline-flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-700 rounded">S</span> }
    ]
  }
];

const NAV_ITEMS = NAV_SECTIONS.flatMap(sec => sec.items);

export default function AppShell({ activeTab, onNavigate, currentTime, children }) {
  const {
    selectedProjectId,
    selectedProject,
    stats,
    showProjectDropdown,
    activeJobs,
    orchestrationChips,
    isAuraFloatingOpen,
    isAuraOpen,
    chatMessages,
    setShowProjectDropdown,
    setIsAuraFloatingOpen,
    setIsAuraOpen
  } = useAppStore();
  const [connectivity, setConnectivity] = React.useState('checking');
  const [apiBase, setApiBase] = React.useState(() => apiUrl(''));

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`, { method: 'GET', cache: 'no-store' });
        if (!cancelled) setConnectivity(res.ok ? 'online' : 'error');
      } catch {
        if (!cancelled) setConnectivity('offline');
      }
    };
    check();
    const id = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiBase]);

  const statusOrder = ['brief', 'cad_approved', 'materials_selected', 'renders_approved', 'production', 'billing'];
  const projectStepIndex = selectedProject
    ? Math.max(0, statusOrder.indexOf(selectedProject.status || '') + 2)
    : 0;

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-100 flex overflow-hidden font-sans">
      {/* Skip link + live region */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[999] focus:bg-[#D4AF37] focus:text-slate-950 focus:px-3 focus:py-2 focus:rounded-lg focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>
      <div aria-live="polite" aria-atomic="true" id="app-root-live" className="sr-only">
        <span id="app-root-status">Ready</span>
      </div>
      <div
        id="app-fallback"
        className="fixed inset-0 z-[200] hidden items-center justify-center bg-[#020617] text-slate-100"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-lg w-full mx-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h1 className="text-sm font-black uppercase tracking-widest text-red-400">App error</h1>
          <pre id="app-fallback-message" className="text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto whitespace-pre-wrap" />
          <button
            type="button"
            onClick={() => {
              const fb = document.getElementById('app-fallback');
              if (fb) fb.classList.add('hidden');
              if (fb) fb.classList.remove('flex');
              window.__reloadApp && window.__reloadApp();
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 hover:border-[#D4AF37]"
          >
            Retry
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <aside
        aria-label="Primary navigation"
        role="navigation"
        className="w-60 bg-[#080d18] border-r border-slate-800/60 flex flex-col justify-between shrink-0"
        style={{ background: 'linear-gradient(180deg, #070c17 0%, #040810 100%)' }}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <LayoutDashboard className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-slate-100 uppercase">ULTIDA</h1>
              <span className="text-[8px] font-bold text-[#D4AF37]/60 uppercase tracking-widest block">
                Ultimate Interior Design OS
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-2xl grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Leads', value: stats.totalLeads, color: 'text-slate-300' },
              { label: 'Projects', value: stats.activeProjects, color: 'text-[#D4AF37]' },
              { label: 'Qualified', value: stats.qualifiedLeads, color: 'text-emerald-400' },
              { label: 'Win %', value: `${stats.conversionPct}%`, color: 'text-blue-400' }
            ].map((s, i) => (
              <div key={i} className="bg-slate-950/50 px-2 py-1.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-600 block font-bold uppercase tracking-wider">{s.label}</span>
                <strong className={`text-sm ${s.color}`}>{s.value}</strong>
              </div>
            ))}
          </div>

          <div className="space-y-4 flex-grow overflow-y-auto pr-1 scrollbar-thin">
            <nav aria-label="Workflow stages" className="space-y-0.5">
              {NAV_SECTIONS.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="text-[8.5px] font-extrabold uppercase tracking-widest text-[#8A8899]/70 px-3 py-0.5">
                    {sec.title}
                  </h3>
                  <nav aria-label={`${sec.title} tools`} className="space-y-0.5">
                    {sec.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const navIndex = NAV_ITEMS.findIndex((n) => n.id === item.id);
                      const isComplete =
                        item.id !== 'crm' &&
                        item.id !== 'dashboard' &&
                        selectedProjectId &&
                        projectStepIndex >= navIndex;
                      const isDisabled = item.disabled && !selectedProjectId;

                      return (
                        <button
                          key={item.id}
                          onClick={() => !isDisabled && onNavigate(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          disabled={isDisabled}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${
                            isActive
                              ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#C9A84C]/30 shadow-md shadow-[#C9A84C]/5'
                              : isDisabled
                                ? 'text-slate-700 cursor-not-allowed opacity-40'
                                : 'text-[#8A8899] hover:bg-[#1E1E24]/30 hover:text-slate-200'
                          }`}
                        >
                          <span className={isActive ? 'text-[#C9A84C]' : 'text-slate-600'}>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                          {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </nav>
          </div>

          {selectedProject && (
            <div className="bg-[#1E1E24]/50 border border-slate-800/60 rounded-2xl p-3 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#8A8899] uppercase tracking-wider">Project Progress</span>
                <span className="text-[9px] font-bold text-[#C9A84C]">
                  {Math.round(Math.min((projectStepIndex / 7) * 100, 100))}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] transition-all duration-700"
                  style={{ width: `${Math.min((projectStepIndex / 7) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-[#F0EEE8]/80 font-medium truncate">📁 {selectedProject.name}</div>
              <div className="text-[9px] text-[#8A8899]">
                Status: <span className="text-[#C9A84C] font-bold capitalize">{selectedProject.status?.replace('_', ' ') || 'Onboarding'}</span>
              </div>
            </div>
          )}

          {selectedProject && activeJobs.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                  Live Workshop Queue
                </span>
                <span className="text-[8px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">{activeJobs.length} Job(s)</span>
              </div>
              <div className="space-y-2.5">
                {activeJobs.map((job) => (
                  <div key={job.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-300 truncate font-semibold uppercase tracking-wider">
                        {job.job_type?.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 font-bold font-mono">{job.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orchestrationChips.length > 0 && (
            <div aria-live="polite" aria-atomic="true" className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#D4AF37]" />
                  Orchestration Status
                </span>
                <button
                  onClick={() => useAppStore.getState().setOrchestrationChips([])}
                  className="text-[8px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {orchestrationChips.map((chip) => (
                  <div
                    key={chip.id}
                    className={`flex items-center gap-1.5 text-[9px] font-mono border rounded-lg px-2.5 py-1.5 ${
                      chip.type === 'success'
                        ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                        : 'border-red-900/60 bg-red-950/40 text-red-300'
                    }`}
                  >
                    <span className="shrink-0">{chip.type === 'success' ? '●' : '✖'}</span>
                    <span className="truncate">{chip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-semibold">Sharma Workshop · Online</span>
          </div>
          <div className="text-[8px] font-mono text-[#D4AF37]/40 uppercase tracking-widest">Antigravity Core v2.0</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="bg-[#080d18] border-b border-slate-800/60 px-6 py-3.5 flex justify-between items-center flex-shrink-0" style={{ background: 'linear-gradient(90deg, #070c17, #06090f)' }}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">{TAB_TITLES[activeTab] || ''}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                {activeTab === 'crm' ? 'Manage leads, qualify via AI calling, and close deals' :
                 activeTab === 'brief' ? 'Capture client design preferences and floor plan upload' :
                 activeTab === 'cad' ? 'Draw walls, openings, and furniture on the 2D canvas' :
                 activeTab === 'materials' ? 'Select laminates, hardware fittings, and estimate costs' :
                 activeTab === 'renders' ? 'Generate AI-powered 3D interior renders with Vastu insights' :
                 activeTab === 'cutlist' ? 'Calculate precise panel cuts and optimize sheet nesting' : ''}
              </p>
            </div>

            {useAppStore.getState().projectsList.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  aria-haspopup="listbox"
                  aria-expanded={showProjectDropdown}
                  aria-label="Select active project"
                  className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 hover:border-[#D4AF37]/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="max-w-[140px] truncate">{selectedProject?.name || 'Select Project'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <button
              onClick={() => setIsAuraFloatingOpen(true)}
              aria-label="Open AURA assistant"
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] text-slate-950 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
            >
              <Sparkles className="w-6 h-6" />
            </button>
            <AuraBrainChat
              messages={chatMessages}
              onSendMessage={useAppStore.getState().handleSendMessage}
              onExecuteAction={useAppStore.getState().handleExecuteAction}
              onRetryMessage={useAppStore.getState().handleRetryMessage}
              project={selectedProject}
              isOpen={isAuraFloatingOpen}
              onClose={() => setIsAuraFloatingOpen(false)}
            />
            <span className="w-px h-4 bg-slate-800" />
            <button
              onClick={() => window.location.reload()}
              className={`flex items-center gap-1.5 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${connectivity === 'online' ? 'text-emerald-400' : 'text-red-400'}`}
              aria-label="Retry backend connection"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{connectivity === 'online' ? 'API Online' : connectivity === 'offline' ? 'Offline' : 'API Error'}</span>
            </button>
            <span className="w-px h-4 bg-slate-800" />
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="w-px h-4 bg-slate-800" />
            <span>Admin</span>
          </div>
        </header>

        <div id="main-content" className="flex-grow overflow-hidden relative bg-[#020617]">
          {children}
        </div>
      </main>

      {/* Side AURA panel */}
      <AuraBrainChat
        messages={chatMessages}
        onSendMessage={useAppStore.getState().handleSendMessage}
        onExecuteAction={useAppStore.getState().handleExecuteAction}
        onRetryMessage={useAppStore.getState().handleRetryMessage}
        project={selectedProject}
        isOpen={isAuraOpen}
        onClose={() => setIsAuraOpen(false)}
      />
    </div>
  );
}
