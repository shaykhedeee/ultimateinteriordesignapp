import React, { useState, useEffect } from 'react';
import { 
  Inbox, FileText, Compass, Palette, Sparkles, Scissors,
  BarChart3, Users, CheckSquare, LayoutDashboard,
  FolderOpen, ChevronDown, Activity, TrendingUp, Zap,
  CheckCircle2, Circle, Clock, Kanban, Layers, IndianRupee
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

const WORKFLOW_STEPS = [
  { id: 'crm', label: 'Lead CRM', icon: <Inbox className="w-3.5 h-3.5" />, statusField: null },
  { id: 'brief', label: 'Client Brief', icon: <FileText className="w-3.5 h-3.5" />, statusField: 'brief' },
  { id: 'cad', label: '2D CAD', icon: <Compass className="w-3.5 h-3.5" />, statusField: 'cad_approved' },
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

  const handleSendMessage = (text) => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };
    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let auraMsg;

      if (lower.includes('color') || lower.includes('palette') || lower.includes('paint') || lower.includes('floor') || lower.includes('wood') || lower.includes('chevron')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I suggest a warm Japandi scheme for this bedroom: Chevron Herringbone Oak flooring combined with Warm Alabaster walls and Brushed Antique Brass hardware accents.',
          actionPreview: {
            title: 'Apply Warm Chevron Flooring',
            changes: ['Flooring → Chevron Herringbone Oak (+₹16/sqft)', 'Walls → Warm Wabi Alabaster paint', 'Style Cohesion score: 98/100'],
            costImpact: 6500,
            visualQualityImpact: 5.0
          },
          actions: [{ label: 'Apply Finishes Globally', actionId: 'act-palette-apply', variant: 'primary' }]
        };
      } else if (lower.includes('budget') || lower.includes('cost') || lower.includes('optimize') || lower.includes('cheap') || lower.includes('save')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Optimizing carcass and hardware specs. Swapping high gloss acrylic to premium textured matte laminates and Blum Aventos lift systems to soft-close hinges, saving ₹42,000.',
          actionPreview: {
            title: 'Optimize Wardrobe & Cabinet Budget',
            changes: ['Acrylic shutters → Suede Matte Laminate (-₹18,000)', 'Aventos horizontal lift-up → Clip-Top standard hinges (-₹24,000)'],
            costImpact: -42000,
            visualQualityImpact: 4.8
          },
          actions: [{ label: 'Apply Optimization', actionId: 'act-budget-cut', variant: 'primary' }]
        };
      } else if (lower.includes('layout') || lower.includes('sofa') || lower.includes('rotate')) {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Repositioning sofa block to clear 38" walkways and aligning it 45 degrees towards the main morning lighting vector.',
          actionPreview: {
            title: 'Align Sofa to Morning Vector',
            changes: ['Sofa rotated 45°', 'Spatial planning GNN clearance: 97%'],
            costImpact: 0,
            visualQualityImpact: 4.9
          },
          actions: [{ label: 'Execute Move', actionId: 'act-restyle', variant: 'primary' }]
        };
      } else {
        auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Understood: "${text}". I have mapped this prompt to the active design agent. Let me know if you would like me to generate renders or optimize the budget.`,
        };
      }
      setChatMessages(prev => [...prev, auraMsg]);
    }, 1200);
  };

  const handleExecuteAction = (actionId, preview) => {
    if (preview && preview.costImpact) {
      if (selectedProject) {
        const updatedCost = Math.max(0, (selectedProject.total_cost || 0) + preview.costImpact);
        setSelectedProject(prev => ({ ...prev, total_cost: updatedCost }));
      }
    }
    alert(`AURA Action Executed: ${preview?.title || actionId}`);
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
        return <InteractiveCADScreen projectId={selectedProjectId} onComplete={() => setActiveTab('drawings')} />;
      case 'drawings':
        return <DrawingsElevationsStudio projectId={selectedProjectId} onComplete={() => setActiveTab('materials')} />;
      case 'materials':
        return <MaterialCatalogScreen projectId={selectedProjectId} onComplete={() => setActiveTab('renders')} />;
      case 'renders':
        return <Render3DStudio projectId={selectedProjectId} onComplete={() => setActiveTab('cutlist')} />;
      case 'cutlist':
        return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => setActiveTab('crm')} />;
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

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'crm', label: 'CRM & Call Board', icon: <Inbox className="w-4 h-4" /> },
    { id: 'projects', label: 'Project Pipeline', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'brief', label: 'Client Brief Intake', icon: <FileText className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'cad', label: '2D/3D Design Studio', icon: <Compass className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'drawings', label: 'Wall Elevations', icon: <Layers className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'materials', label: 'Materials Catalog', icon: <Palette className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'renders', label: '3D Render Studio', icon: <Sparkles className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'cutlist', label: 'Cutlist & Nesting', icon: <Scissors className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'finance', label: 'Commerce & Quotes', icon: <IndianRupee className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'timeline', label: 'Project Timeline', icon: <Activity className="w-4 h-4" />, disabled: !selectedProjectId },
    { id: 'jobs', label: 'Background Jobs', icon: <Clock className="w-4 h-4" />, disabled: !selectedProjectId },
  ];

  const TAB_TITLES = {
    dashboard: 'Command Center & Workspace Hub',
    crm: 'CRM & Outbound Calling System',
    projects: 'Project Pipeline & Kanban Board',
    brief: 'Client Onboarding Brief Studio',
    cad: '2D/3D Linked Design Studio',
    drawings: 'Wall Elevations & Architectural Drafting',
    materials: 'Finishes, Swatches & Hardware Catalog',
    renders: '3D AI Render Extrusion Engine',
    cutlist: 'Precision Slicing Cutlist Nesting',
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

          {/* Navigation */}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(tab => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-2.5 transition text-left ${
                  activeTab === tab.id
                    ? 'active-nav-btn'
                    : tab.disabled
                      ? 'text-slate-700 cursor-not-allowed opacity-40'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-[#D4AF37]' : 'text-slate-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                
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

          {/* Project Workflow Progress (if project selected) */}
          {selectedProject && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Progress</span>
                <span className="text-[9px] font-bold text-[#D4AF37]">{Math.round(Math.min((projectStepIndex / 7) * 100, 100))}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] transition-all duration-700"
                  style={{ width: `${Math.min((projectStepIndex / 7) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-400 font-medium truncate">
                📁 {selectedProject.name}
              </div>
              <div className="text-[9px] text-slate-500">
                Status: <span className="text-[#D4AF37] font-bold capitalize">{selectedProject.status?.replace('_', ' ') || 'Onboarding'}</span>
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
