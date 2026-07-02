import React, { useState, useEffect } from 'react';
import { 
  Inbox, FileText, Compass, Palette, Sparkles, Scissors,
  BarChart3, Users, CheckSquare, LayoutDashboard,
  FolderOpen, ChevronDown, Activity, TrendingUp, Zap,
  CheckCircle2, Circle, Clock, Kanban, Layers, IndianRupee, Monitor
} from 'lucide-react';

// Import Screens
import CRMLeadDashboard from './screens/CRMLeadDashboard.jsx';
import ClientBriefStudio from './screens/ClientBriefStudio.jsx';
import InteractiveCADScreen from './screens/InteractiveCADScreen.jsx';
import DrawingsElevationsStudio from './screens/DrawingsElevationsStudio.jsx';
import MaterialCatalogScreen from './screens/MaterialCatalogScreen.jsx';
import Render3DStudio from './screens/Render3DStudio.jsx';
import CutlistNestingScreen from './screens/CutlistNestingScreen.jsx';
import ProjectManagementScreen from './screens/ProjectManagementScreen.jsx';
import DesignStudioScreen from './screens/DesignStudioScreen.jsx';
import FinanceScreen from './screens/FinanceScreen.jsx';
import TimelineScreen from './screens/TimelineScreen.jsx';
import JobsScreen from './screens/JobsScreen.jsx';
import CommandCenterScreen from './screens/CommandCenterScreen.jsx';
import AuraBrainChat from './components/layout/AuraBrainChat.jsx';
import CeilingStudio from './screens/CeilingStudio.jsx';
import TvUnitGenerator from './screens/TvUnitGenerator.jsx';

const WORKFLOW_STEPS = [
  { id: 'crm', label: 'Lead CRM', icon: <Inbox className="w-3.5 h-3.5" />, statusField: null },
  { id: 'brief', label: 'Client Brief', icon: <FileText className="w-3.5 h-3.5" />, statusField: 'brief' },
  { id: 'cad', label: '2D CAD', icon: <Compass className="w-3.5 h-3.5" />, statusField: 'cad_approved' },
  { id: 'studio', label: '3D Studio', icon: <Layers className="w-3.5 h-3.5" />, statusField: 'cad_approved' },
  { id: 'materials', label: 'Materials', icon: <Palette className="w-3.5 h-3.5" />, statusField: 'materials_selected' },
  { id: 'renders', label: '3D Renders', icon: <Sparkles className="w-3.5 h-3.5" />, statusField: 'renders_approved' },
  { id: 'cutlist', label: 'Cutlist', icon: <Scissors className="w-3.5 h-3.5" />, statusField: 'production' },
];

const STATUS_ORDER = ['brief', 'cad_approved', 'materials_selected', 'renders_approved', 'production', 'billing'];

export function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('spacetrace_active_tab') || 'dashboard';
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('spacetrace_project_id') || null;
  });
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'aura', text: "Hello! I am AURA. I have loaded your workspace and stand ready to assist. You can ask me to Restyle rooms, suggest lighting configurations, or optimize your modular cabinet budget.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    activeProjects: 0,
    conversionPct: 0
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeJobs, setActiveJobs] = useState([]);
  const [prevActiveJobsCount, setPrevActiveJobsCount] = useState(0);
  const [orchestrationChips, setOrchestrationChips] = useState([]);
  const [lastUserText, setLastUserText] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('spacetrace_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('spacetrace_project_id', selectedProjectId);
    } else {
      localStorage.removeItem('spacetrace_project_id');
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchStatsAndProjects();
  }, [activeTab, selectedProjectId]);

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('navigate-to-tab', handleNav);
    return () => window.removeEventListener('navigate-to-tab', handleNav);
  }, []);

  useEffect(() => {
    if (selectedProjectId && projectsList.length > 0) {
      const proj = projectsList.find(p => p.id === selectedProjectId);
      setSelectedProject(proj || null);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, projectsList]);

  useEffect(() => {
    let interval;
    if (selectedProjectId) {
      const fetchActiveJobs = async () => {
        try {
          const res = await fetch(`http://127.0.0.1:5055/api/projects/${selectedProjectId}/jobs`);
          if (res.ok) {
            const data = await res.json();
            const running = data.filter(j => j.status === 'running');
            setActiveJobs(running);
          }
        } catch (e) {
          console.error("Failed to fetch running jobs:", e);
        }
      };
      fetchActiveJobs();
      interval = setInterval(fetchActiveJobs, 3000);
    } else {
      setActiveJobs([]);
    }
    return () => clearInterval(interval);
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeJobs.length === 0 && prevActiveJobsCount > 0) {
      fetchStatsAndProjects();
    }
    setPrevActiveJobsCount(activeJobs.length);
  }, [activeJobs]);

  const fetchStatsAndProjects = async () => {
    try {
      const resLeads = await fetch('http://127.0.0.1:5055/api/leads');
      const leads = await resLeads.json();
      
      const resProj = await fetch('http://127.0.0.1:5055/api/projects');
      const projects = await resProj.json();
      setProjectsList(projects);

      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }

      const qualified = leads.filter(l => l.voice_status === 'qualified' || l.voice_status === 'human_closed').length;
      const closed = leads.filter(l => l.voice_status === 'human_closed').length;
      const rate = leads.length > 0 ? ((closed / leads.length) * 100).toFixed(0) : 0;

      setStats({
        totalLeads: leads.length,
        qualifiedLeads: qualified,
        activeProjects: projects.length,
        conversionPct: rate
      });
    } catch (err) {
      console.error("Error loading dashboard statistics:", err);
    }
  };

  const [auraStatus, setAuraStatus] = useState(''); 
  const [orchestratorMode, setOrchestratorMode] = useState(false); 

  // AURA Command Surface inside CommandCenter brain panel (reuse mode inside CommandCenterScreen)
  const auraCommands = [
    { id: 'aura:render-living', label: 'Generate Living Render', tab: 'renders', status: null, jobType: 'render_generation' },
    { id: 'aura:apply-palette', label: 'Apply Warm Japandi Palette', tab: 'materials', status: 'materials_selected', jobType: null },
    { id: 'aura:optimize-budget', label: 'Optimize Hardwares & Budget', tab: 'finance', status: null, jobType: null },
    { id: 'aura:align-layout', label: 'Align Sofa + Walkways', tab: 'studio', status: null, jobType: null },
    { id: 'aura:export-drawings', label: 'Export Elevation DXF', tab: 'drawings', status: null, jobType: null },
  ];

  const handleAuraCommand = async (cmd) => {
    const projectId = await ensureProject();
    if (!projectId) {
      setOrchestrationChips(prev => [...prev, { id: `chip-${Date.now()}`, type: 'error', text: 'No project selected. Open a project first.' }]);
      return;
    }

    if (cmd.tab) navigateTab(cmd.tab);

    try {
      if (cmd.status && projectId) {
        await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: cmd.status, currentStep: cmd.status })
        });
      }

      if (cmd.jobType && projectId) {
        const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobType: cmd.jobType, sourceEntityType: 'aura_orchestrator', sourceEntityId: projectId })
        });
        if (!res.ok) throw new Error('Job dispatch failed');
      }
    } catch (e) {
      setOrchestrationChips(prev => [...prev, { id: `chip-${Date.now()}`, type: 'error', text: `Job start failed: ${e.message}` }]);
      return;
    }

    setOrchestrationChips(prev => [...prev, { id: `chip-${Date.now()}`, type: 'success', text: `AURA executed: ${cmd.label}` }]);
    setAuraStatus(`Executed: ${cmd.label}`);
    setOrchestratorMode(true);
    fetchStatsAndProjects();
  };

  // Listen for render job updates and surface status chips
  useEffect(() => {
    const handler = () => {
      if (selectedProjectId) {
        fetch(`http://127.0.0.1:5055/api/projects/${selectedProjectId}/jobs`)
          .then(r => r.json())
          .then(rows => {
            const active = rows.filter(j => j.status === 'running' || j.status === 'queued').length;
            if (active !== prevActiveJobsCount) {
              setPrevActiveJobsCount(active);
              if (active > 0) {
                setAuraStatus(`AURA: ${active} active job(s) running`);
                setOrchestratorMode(true);
              } else if (active === 0 && orchestratorMode) {
                setAuraStatus('AURA: job queue clear');
                setTimeout(() => {
                  setOrchestratorMode(false);
                }, 2500);
              }
            }
          })
          .catch(() => {});
      }
    };

    const interval = setInterval(handler, 3000);
    return () => clearInterval(interval);
  }, [selectedProjectId, prevActiveJobsCount, orchestratorMode]);

  const handleSendMessage = async (text) => {
    setLastUserText(text);
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      status: 'sending'
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${selectedProjectId || 'demo'}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, projectId: selectedProjectId })
      });
      const data = await res.json();
      const auraMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'aura',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.reply || data.message || 'AURA is re-evaluating that request.',
        provider: data.provider || 'llm',
        actionPreview: data.actionPreview,
        actions: data.actions
      };
      setChatMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: 'sent' } : m));
      setChatMessages(prev => [...prev, auraMsg]);
    } catch (err) {
      const auraMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'aura',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Understood: "${text}". I have mapped this prompt to the active design agent. Let me know if you would like me to generate renders or optimize the budget.`,
        provider: 'fallback-deterministic'
      };
      setChatMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: 'sent' } : m));
      setChatMessages(prev => [...prev, auraMsg]);
    }
  };

  const navigateTab = (tab) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: tab }));
  };

  const ensureProject = async () => {
    if (!selectedProjectId && projectsList.length > 0) {
      setSelectedProjectId(projectsList[0].id);
      return projectsList[0].id;
    }
    return selectedProjectId;
  };

  const handleExecuteAction = async (actionId, preview) => {
    // Update local cost estimation if applicable
    if (preview && preview.costImpact) {
      setSelectedProject(prev => {
        if (!prev) return prev;
        const updatedCost = Math.max(0, (prev.total_cost || 0) + preview.costImpact);
        return { ...prev, total_cost: updatedCost };
      });
    }

    const projectId = await ensureProject();
    if (!projectId) {
      setOrchestrationChips(prev => [...prev, {
        id: `chip-${Date.now()}`, type: 'error', text: 'No project selected. Open a project first.'
      }]);
      return;
    }

    let tab = null;
    let jobType = null;
    let status = null;

    if (actionId === 'act-palette-apply') {
      tab = 'materials';
      status = 'materials_selected';
    } else if (actionId === 'act-budget-cut') {
      tab = 'finance';
      status = null;
    } else if (actionId === 'act-restyle') {
      tab = 'studio';
      status = null;
    } else if (actionId === 'act-render') {
      tab = 'renders';
      status = null;
      jobType = 'render_generation';
    } else if (actionId?.startsWith('aura:')) {
      const cmd = auraCommands.find(c => c.id === actionId);
      if (cmd) {
        tab = cmd.tab || null;
        status = cmd.status || null;
        jobType = cmd.jobType || null;
      }
    } else {
      tab = 'dashboard';
    }

    if (tab) navigateTab(tab);

    // Attempt to update project status
    if (status && projectId) {
      try {
        await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, currentStep: status })
        });
      } catch (e) {
        console.warn('Status update failed:', e);
      }
    }

    // Spawn a render job if requested
    if (jobType && projectId) {
      try {
        const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobType, sourceEntityType: 'aura_orchestrator', sourceEntityId: projectId })
        });
        if (!res.ok) throw new Error('Job dispatch failed');
      } catch (e) {
        setOrchestrationChips(prev => [...prev, {
          id: `chip-${Date.now()}`, type: 'error', text: `Job start failed: ${e.message}`
        }]);
      }
    }

    setOrchestrationChips(prev => [...prev, {
      id: `chip-${Date.now()}`,
      type: 'success',
      text: `Executed: ${preview?.title || actionId}. ${tab ? `Navigated to ${tab}.` : ''}${jobType ? 'Render job queued.' : ''}`
    }]);

    fetchStatsAndProjects();
  };

  const handleProjectClosed = (projectId) => {
    setSelectedProjectId(projectId);
    fetchStatsAndProjects();
    setTimeout(() => setActiveTab('brief'), 800);
  };

  // Compute project workflow step index
  const getProjectStepIndex = (project) => {
    if (!project) return 0;
    const status = project.status || '';
    const idx = STATUS_ORDER.indexOf(status);
    return idx >= 0 ? idx + 2 : 1; // offset: step 0 = CRM, step 1 = brief, etc.
  };

  const projectStepIndex = getProjectStepIndex(selectedProject);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CommandCenterScreen projectId={selectedProjectId} onNavigateToTab={(tab) => setActiveTab(tab)} />;
      case 'crm':
        return <CRMLeadDashboard onProjectClosed={handleProjectClosed} />;
      case 'projects':
        return <ProjectManagementScreen onNavigateToProject={(projId) => { setSelectedProjectId(projId); setActiveTab('brief'); }} />;
      case 'brief':
        return <ClientBriefStudio projectId={selectedProjectId} onBriefSaved={() => setActiveTab('cad')} />;
      case 'cad':
        return <InteractiveCADScreen projectId={selectedProjectId} onComplete={() => setActiveTab('studio')} />;
      case 'studio':
        return <DesignStudioScreen projectId={selectedProjectId} onComplete={() => setActiveTab('drawings')} />;
      case 'drawings':
        return <DrawingsElevationsStudio projectId={selectedProjectId} onComplete={() => setActiveTab('materials')} />;
      case 'materials':
        return <MaterialCatalogScreen projectId={selectedProjectId} onComplete={() => setActiveTab('renders')} />;
      case 'renders':
        return <Render3DStudio projectId={selectedProjectId} onComplete={() => setActiveTab('cutlist')} />;
      case 'cutlist':
        return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => setActiveTab('crm')} />;
      case 'ceiling':
        return <CeilingStudio projectId={selectedProjectId} />;
      case 'tvunit':
        return <TvUnitGenerator projectId={selectedProjectId} />;
      case 'finance':
        return <FinanceScreen projectId={selectedProjectId} />;
      case 'timeline':
        return <TimelineScreen projectId={selectedProjectId} />;
      case 'jobs':
        return <JobsScreen projectId={selectedProjectId} />;
      default:
        return <CRMLeadDashboard onProjectClosed={handleProjectClosed} />;
    }
  };

  const NAV_SECTIONS = [
    {
      title: "Workspace Hub",
      items: [
        { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: "Client Acquisition",
      items: [
        { id: 'crm', label: 'CRM & Call Board', icon: <Inbox className="w-4 h-4" /> },
        { id: 'projects', label: 'Project Pipeline', icon: <BarChart3 className="w-4 h-4" /> }
      ]
    },
    {
      title: "Design Studio",
      items: [
        { id: 'brief', label: 'Client Brief Intake', icon: <FileText className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'cad', label: '2D Blueprint Drafting', icon: <Compass className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'studio', label: '3D Furnishing Studio', icon: <Layers className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'drawings', label: 'Wall Elevations', icon: <CheckSquare className="w-4 h-4" />, disabled: !selectedProjectId }
      ]
    },
    {
      title: "AI Visualization",
      items: [
        { id: 'renders', label: '3D Render Studio', icon: <Sparkles className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'jobs', label: 'Background Jobs', icon: <Clock className="w-4 h-4" />, disabled: !selectedProjectId }
      ]
    },
    {
      title: "Production & Commerce",
      items: [
        { id: 'materials', label: 'Materials Catalog', icon: <Palette className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'cutlist', label: 'Cutlist & Nesting', icon: <Scissors className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'ceiling', label: 'False Ceiling Generator', icon: <Layers className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'tvunit', label: 'TV Unit Generator', icon: <Monitor className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'finance', label: 'Commerce & Quotes', icon: <IndianRupee className="w-4 h-4" />, disabled: !selectedProjectId },
        { id: 'timeline', label: 'Project Timeline', icon: <Activity className="w-4 h-4" />, disabled: !selectedProjectId }
      ]
    }
  ];

  const NAV_ITEMS = NAV_SECTIONS.flatMap(sec => sec.items);

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
    jobs: 'Background Jobs & Rendering Pipeline Monitor'
  };

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-100 flex overflow-hidden font-sans">
      
      {/* ── Left Sidebar ── */}
      <aside className="w-60 bg-[#080d18] border-r border-slate-800/60 flex flex-col justify-between shrink-0" style={{ background: 'linear-gradient(180deg, #070c17 0%, #040810 100%)' }}>
        <div className="flex flex-col gap-4 p-4">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA8C2C] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <LayoutDashboard className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-slate-100 uppercase">ULTIDA</h1>
              <span className="text-[8px] font-bold text-[#D4AF37]/60 uppercase tracking-widest block">Ultimate Interior Design OS</span>
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-2xl grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Leads', value: stats.totalLeads, color: 'text-slate-300' },
              { label: 'Projects', value: stats.activeProjects, color: 'text-[#D4AF37]' },
              { label: 'Qualified', value: stats.qualifiedLeads, color: 'text-emerald-400' },
              { label: 'Win %', value: `${stats.conversionPct}%`, color: 'text-blue-400' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-950/50 px-2 py-1.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-600 block font-bold uppercase tracking-wider">{s.label}</span>
                <strong className={`text-sm ${s.color}`}>{s.value}</strong>
              </div>
            ))}
          </div>

          {/* Navigation Sections */}
          <div className="space-y-4 flex-grow overflow-y-auto pr-1 scrollbar-thin">
            {NAV_SECTIONS.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="text-[8.5px] font-extrabold uppercase tracking-widest text-[#8A8899]/70 px-3 py-0.5">
                  {sec.title}
                </h3>
                <nav className="space-y-0.5">
                  {sec.items.map(tab => (
                    <button
                      key={tab.id}
                      disabled={tab.disabled}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full py-2 px-3 rounded-xl text-[10.5px] font-semibold flex items-center gap-2.5 transition text-left ${
                        activeTab === tab.id
                          ? 'bg-[#1E1E24] text-[#F0EEE8] border border-[#C9A84C]/30 shadow-md shadow-[#C9A84C]/5'
                          : tab.disabled
                            ? 'text-slate-700 cursor-not-allowed opacity-35'
                            : 'text-[#8A8899] hover:bg-[#1E1E24]/30 hover:text-slate-200'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-[#C9A84C]' : 'text-slate-600'}>
                        {tab.icon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                      
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        {tab.id === 'renders' && selectedProject?.stale_renders === 1 && (
                          <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">Stale</span>
                        )}
                        {tab.id === 'drawings' && selectedProject?.stale_drawings === 1 && (
                          <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">Stale</span>
                        )}
                        {tab.id === 'materials' && selectedProject?.stale_pricing === 1 && (
                          <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">Stale</span>
                        )}

                        {tab.id !== 'crm' && tab.id !== 'dashboard' && selectedProjectId && projectStepIndex >= NAV_ITEMS.findIndex(n => n.id === tab.id) && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Project Workflow Progress (if project selected) */}
          {selectedProject && (
            <div className="bg-[#1E1E24]/50 border border-slate-800/60 rounded-2xl p-3 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#8A8899] uppercase tracking-wider">Project Progress</span>
                <span className="text-[9px] font-bold text-[#C9A84C]">{Math.round(Math.min((projectStepIndex / 7) * 100, 100))}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] transition-all duration-700"
                  style={{ width: `${Math.min((projectStepIndex / 7) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-[#F0EEE8]/80 font-medium truncate">
                📁 {selectedProject.name}
              </div>
              <div className="text-[9px] text-[#8A8899]">
                Status: <span className="text-[#C9A84C] font-bold capitalize">{selectedProject.status?.replace('_', ' ') || 'Onboarding'}</span>
              </div>
            </div>
          )}

          {/* Live Workshop Queue Widget */}
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
                {activeJobs.map(job => (
                  <div key={job.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-300 truncate font-semibold uppercase tracking-wider">
                        {job.job_type?.replace('_', ' ')}
                      </span>
                      <span className="text-slate-450 font-bold font-mono">{job.progress}%</span>
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

          {/* AURA Orchestration Status Chips */}
          {orchestrationChips.length > 0 && (
            <div aria-live="polite" aria-atomic="true" className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#D4AF37]" />
                  Orchestration Status
                </span>
                <button
                  onClick={() => setOrchestrationChips([])}
                  className="text-[8px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {orchestrationChips.map(chip => (
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-semibold">Sharma Workshop · Online</span>
          </div>
          <div className="text-[8px] font-mono text-[#D4AF37]/40 uppercase tracking-widest">
            Antigravity Core v2.0
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-grow flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-[#080d18] border-b border-slate-800/60 px-6 py-3.5 flex justify-between items-center flex-shrink-0" style={{ background: 'linear-gradient(90deg, #070c17, #06090f)' }}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">
                {TAB_TITLES[activeTab] || ''}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                {activeTab === 'crm' ? 'Manage leads, qualify via AI calling, and close deals' :
                 activeTab === 'brief' ? 'Capture client design preferences and floor plan upload' :
                 activeTab === 'cad' ? 'Draw walls, openings, and furniture on the 2D canvas' :
                 activeTab === 'materials' ? 'Select laminates, hardware fittings, and estimate costs' :
                 activeTab === 'renders' ? 'Generate AI-powered 3D interior renders with Vastu insights' :
                 activeTab === 'cutlist' ? 'Calculate precise panel cuts and optimize sheet nesting' : ''}
              </p>
            </div>
            
            {/* Active Project Selector */}
            {projectsList.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 hover:border-[#D4AF37]/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="max-w-[140px] truncate">
                    {selectedProject?.name || 'Select Project'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showProjectDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                    {projectsList.map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => { setSelectedProjectId(proj.id); setShowProjectDropdown(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition flex items-center gap-2 ${
                          proj.id === selectedProjectId
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <FolderOpen className="w-3 h-3 shrink-0 opacity-50" />
                        <div className="min-w-0">
                          <div className="truncate">{proj.name}</div>
                          <div className="text-[9px] text-slate-500 font-normal">{proj.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <button
              onClick={() => setIsAuraOpen(prev => !prev)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isAuraOpen 
                  ? 'bg-indigo-650 text-white shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AURA AI</span>
            </button>
            <span className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">API Online</span>
            </div>
            <span className="w-px h-4 bg-slate-800" />
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="w-px h-4 bg-slate-800" />
            <span>Admin</span>
          </div>
        </header>

        {/* Screen Area & Collapsible AURA Chat Panel */}
        <div className="flex-grow flex overflow-hidden bg-[#020617]" onClick={() => showProjectDropdown && setShowProjectDropdown(false)}>
          <div className="flex-grow overflow-hidden relative">
            {renderActiveScreen()}
          </div>
          <AuraBrainChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onExecuteAction={handleExecuteAction}
            project={selectedProject}
            isOpen={isAuraOpen}
            onClose={() => setIsAuraOpen(false)}
          />
        </div>

      </main>
    </div>
  );
}
