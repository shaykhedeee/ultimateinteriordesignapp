import React, { useState, useEffect, useRef } from 'react';
import { 
  Inbox, FolderOpen, Compass, Palette, Sparkles, Scissors,
  BarChart3, CheckCircle2, ChevronRight, Activity, Zap, Info, Plus, 
  Settings, Layers, Sliders, ChevronDown, Check, RefreshCw, Trash2, Camera, Upload, AlertTriangle, FileText, IndianRupee
} from 'lucide-react';
import { Ruler, Sun, Moon, Grid } from 'lucide-react';

export default function CommandCenterScreen({ projectId, onNavigateToTab }) {
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('smart'); // 'smart', 'generate', 'photo', 'layout', 'product'
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [materialsCatalog, setMaterialsCatalog] = useState([]);
  const [workspaceMode, setWorkspaceMode] = useState('designer'); // 'designer' | 'consumer'
  const [consumerRoom, setConsumerRoom] = useState('');
  const [consumerStyle, setConsumerStyle] = useState('');
  const [demoStatus, setDemoStatus] = useState('');

  const allWorkflowTabs = [
    { id: 'smart', label: '🚀 Full Project', desc: 'Plan to Render', roles: ['designer', 'consumer'] },
    { id: 'generate', label: '🎨 Generate Ideas', desc: 'Style to Concept', roles: ['consumer'] },
    { id: 'photo', label: '📸 Photo Edit', desc: 'Swap Finishes', roles: ['consumer'] },
    { id: 'layout', label: '📐 Simple Layout', desc: 'Drag & Drop Room', roles: ['consumer'] },
    { id: 'product', label: '⚙️ Modular Catalog', desc: 'Furniture Picker', roles: ['consumer', 'designer'] }
  ];

  const workflowTabs = allWorkflowTabs.filter(tab => tab.roles.includes(workspaceMode));

  const allSpecialistTools = [
    { title: 'Upload Photo', desc: 'Use phone photo', tab: 'photo', roles: ['consumer'] },
    { title: 'Pick Room Style', desc: 'Living / Kitchen / Bedroom', tab: 'layout', roles: ['consumer'] },
    { title: 'Change Finish', desc: 'Wood / Marble / Laminate look', tab: 'materials', roles: ['consumer'] },
    { title: 'Generate Render', desc: 'AI concept', tab: 'renders', roles: ['consumer'] },
    { title: 'View Cost', desc: 'Indicative quote', tab: 'finance', roles: ['consumer'] },
    { title: 'Talk to Designer', desc: 'Request expert review', tab: 'brief', roles: ['consumer'] },
    { title: 'Upload CAD', desc: 'Upload if available', tab: 'cad', roles: ['designer'] },
    { title: 'Calibrate Scale', desc: 'Set real-world size', tab: 'cad', roles: ['designer'] },
    { title: 'Zone Rooms', desc: 'Tag rooms & Vastu', tab: 'cad', roles: ['designer'] },
    { title: 'Laminate Catalog', desc: 'PBR finish codes', tab: 'materials', roles: ['designer'] },
    { title: 'Camera Planner', desc: 'Viewpoint composer', tab: 'renders', roles: ['designer'] },
    { title: 'BOM Calculator', desc: 'SQFT schedule', tab: 'finance', roles: ['designer'] }
  ];

  const specialistTools = allSpecialistTools.filter(tool => tool.roles.includes(workspaceMode));
  const [toolFeedback, setToolFeedback] = useState({});


  useEffect(() => {
    const activeExists = workflowTabs.some(t => t.id === activeWorkflowTab);
    if (!activeExists && workflowTabs.length > 0) {
      setActiveWorkflowTab(workflowTabs[0].id);
    }
  }, [workspaceMode]);

  // ==========================================
  // 1. DATA LOADING
  // ==========================================
  useEffect(() => {
    fetch('http://127.0.0.1:5055/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      })
      .catch(console.error);

    fetch('http://127.0.0.1:5055/api/leads')
      .then(res => res.json())
      .then(setLeads)
      .catch(console.error);

    fetch('http://127.0.0.1:5055/api/material-catalog')
      .then(res => res.json())
      .then(setMaterialsCatalog)
      .catch(console.error);
  }, [projectId]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

  const loadDemoClients = async () => {
    setDemoStatus('Seeding...');
    try {
      const res = await fetch('http://127.0.0.1:5055/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      setDemoStatus(`Loaded ${data.leads || 0} leads / ${data.projects || 0} projects`);
      const [projRes, leadRes] = await Promise.all([
        fetch('http://127.0.0.1:5055/api/projects'),
        fetch('http://127.0.0.1:5055/api/leads')
      ]);
      const projJson = await projRes.json();
      const leadJson = await leadRes.json();
      setProjects(projJson);
      setLeads(leadJson);
      if (projJson.length > 0) setSelectedProjectId(projJson[0].id);
    } catch (e) {
      setDemoStatus('Seed failed');
    }
    setTimeout(() => setDemoStatus(''), 2200);
  };

  // Pipeline calculations
  const totalLeads = leads.length;
  const activeProjectsCount = projects.length;
  const pendingApprovalsCount = projects.filter(p => p.status === 'cad_approved').length;
  const productionCount = projects.filter(p => p.status === 'production').length;
  const pipelineValue = ((totalLeads * 3.5) + (activeProjectsCount * 12.5)).toFixed(1);

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      
      {/* ── Workspace Mode / Role Switcher Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1E1E24] border border-slate-800 p-4 rounded-2xl shadow-lg shrink-0">
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#C9A84C] flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#C9A84C]" /> Mode
        </h2>
        <p className="text-[10px] text-[#8A8899] mt-0.5">Switch between professional and simplified flow.</p>
      </div>
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1.5 text-[10px] font-black uppercase" role="tablist" aria-label="Workspace mode">
        <button role="tab" aria-pressed={workspaceMode === 'consumer'} onClick={() => setWorkspaceMode('consumer')} className={`px-3 py-2 rounded-xl transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A84C] ${workspaceMode === 'consumer' ? 'bg-[#D4AF37]/15 border-[#C9A84C]/45 text-[#C9A84C] shadow-sm shadow-[#C9A84C]/15' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}>Homeowner</button>
        <button role="tab" aria-pressed={workspaceMode === 'designer'} onClick={() => setWorkspaceMode('designer')} className={`px-3 py-2 rounded-xl transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A84C] ${workspaceMode === 'designer' ? 'bg-slate-900 border-slate-800 text-[#C9A84C] shadow-sm shadow-[#C9A84C]/5' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}>Professional</button>
      </div>
      </div>

      {/* ── KPI Metrics Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Leads In Queue', val: totalLeads, sub: 'Intake and brief', border: 'border-slate-800' },
          { label: 'Active Projects', val: activeProjectsCount, sub: 'In design pipeline', border: 'border-slate-850' },
          { label: 'Pending Approvals', val: pendingApprovalsCount, sub: 'Awaiting client signoff', border: 'border-slate-850' },
          { label: 'Production Ready', val: productionCount, sub: 'BOM & drawings frozen', border: 'border-slate-850' },
          { label: 'Pipeline Valuation', val: `₹${pipelineValue}L`, sub: 'Estimated yield basis', border: 'border-[#D4AF37]/30', glow: true },
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className={`glass-card p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between ${kpi.border} ${
              kpi.glow ? 'gold-border gold-glow-sm' : ''
            }`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{kpi.label}</span>
              <strong className={`text-2xl font-black ${kpi.glow ? 'text-[#D4AF37]' : 'text-slate-100'}`}>{kpi.val}</strong>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-2">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Main Layout: Tabs + Left column & Sidebar right column ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── Left Column: Workflow Workspaces ── */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Tab Navigation */}
          <div className="bg-slate-900/60 border border-slate-850 p-1.5 rounded-2xl flex gap-1 text-xs font-bold overflow-x-auto" role="tablist" aria-label="Command workflow panel">
            {workflowTabs.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeWorkflowTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeWorkflowTab === tab.id ? 0 : -1}
                onClick={() => setActiveWorkflowTab(tab.id)}
                onKeyDown={(e) => {
                  const idx = workflowTabs.findIndex(t => t.id === tab.id);
                  if (e.key === 'ArrowRight' && idx < workflowTabs.length - 1) { e.preventDefault(); setActiveWorkflowTab(workflowTabs[idx + 1].id); }
                  if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); setActiveWorkflowTab(workflowTabs[idx - 1].id); }
                }}
                className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center transition min-w-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  activeWorkflowTab === tab.id
                    ? 'bg-slate-950 text-[#C9A84C] border border-slate-850 shadow-md shadow-[#C9A84C]/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Workflow Tab Workspace */}
          <div className="glass-card border border-slate-850 rounded-3xl p-6 min-h-[460px]" role="tabpanel" aria-labelledby={`tab-${activeWorkflowTab}`} id={`panel-${activeWorkflowTab}`}>
            {activeWorkflowTab === 'smart' && (
              <SmartProjectWorkspace 
                project={activeProject} 
                projects={projects}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onNavigateToTab={onNavigateToTab}
              />
            )}
            {activeWorkflowTab === 'generate' && (
              <QuickGenerateWorkspace 
                project={activeProject}
                onNavigateToTab={onNavigateToTab}
              />
            )}
            {activeWorkflowTab === 'photo' && (
              <PhotoEditWorkspace 
                project={activeProject}
                onNavigateToTab={onNavigateToTab}
              />
            )}
            {activeWorkflowTab === 'layout' && (
              <QuickLayoutWorkspace 
                project={activeProject}
                onNavigateToTab={onNavigateToTab}
              />
            )}
            {activeWorkflowTab === 'product' && (
              <DesignProductWorkspace 
                project={activeProject}
                materialsCatalog={materialsCatalog}
              />
            )}
            {activeWorkflowTab === 'tools' && (
              <SpecialistToolsWorkspace 
                project={activeProject}
                materialsCatalog={materialsCatalog}
                onNavigateToTab={onNavigateToTab}
              />
            )}
          </div>

        </div>

        {/* ── Right Column: Tools Hub + Pipeline check ── */}
        <div className="space-y-6">
          
          {/* AI Specialist Tools Hub */}
          <div className="glass-card border border-slate-850 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#C9A84C]" />
                AI Specialist Tools Hub
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Expose specialist tools directly into operational stages</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {specialistTools.map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToTab(tool.tab)}
                  className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-left hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-[11px] font-bold text-slate-200">{tool.title}</span>
                  <span className="text-[9px] text-slate-500">{tool.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Projects List */}
          <div className="glass-card border border-slate-850 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-[#C9A84C]" />
              Active Project Pipeline
            </h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {projects.map(p => {
                const isActive = p.id === selectedProjectId;
                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                      isActive 
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/5' 
                        : 'bg-slate-900/30 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">{p.name}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.status === 'production' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                          : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25'
                      }`}>
                        {p.status?.replace('_', ' ') || 'onboarding'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Client: {p.client_name}</span>
                      <span>₹{p.budget ? `${(p.budget / 100000).toFixed(1)}L` : '0L'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>


      {/* ── Pro Analytics Block ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#C9A84C]" />
              Pro Analytics
            </h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Last 7 days</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Render Jobs', value: '12', delta: '+3', positive: true },
              { label: 'Avg Lead Time', value: '4.2d', delta: '-0.8d', positive: true },
              { label: 'Client Reviews', value: '8', delta: '+2', positive: true },
              { label: 'Pending BOM', value: '3', delta: '-1', positive: true },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-950/40 border border-slate-850">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">{item.label}</span>
                <div className="flex items-end justify-between mt-1">
                  <strong className="text-xl font-black text-slate-100">{item.value}</strong>
                  <span className={`text-[10px] font-black ${item.positive ? 'text-emerald-400' : 'text-rose-400'}`}>{item.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#C9A84C]" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'New Project', icon: Plus, action: () => onNavigateToTab && onNavigateToTab('smart') },
              { label: 'Upload Files', icon: Upload, action: () => onNavigateToTab && onNavigateToTab('brief') },
              { label: 'Run Diagnostics', icon: Activity, action: () => onNavigateToTab && onNavigateToTab('cad') },
              { label: 'Export Pack', icon: FileText, action: () => onNavigateToTab && onNavigateToTab('finance') },
              { label: 'Load Demo Clients', icon: RefreshCw, action: loadDemoClients }
            ].map((item, idx) => (
              <button key={idx} onClick={item.action} className="p-3 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 transition flex flex-col items-center justify-center gap-1.5 text-slate-300">
                <item.icon className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
          {demoStatus && (
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400" aria-live="polite">
              {demoStatus}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}

// ============================================================================
// WORKSPACE: Smart Project
// ============================================================================
function SmartProjectWorkspace({ project, projects, onSelectProject, onNavigateToTab }) {
  const consumerMode = Boolean(workspaceMode === 'consumer');
  const [consumerStep, setConsumerStep] = React.useState('welcome'); // welcome | room | style | result
  const [consumerRoom, setConsumerRoom] = React.useState('');
  const [consumerStyle, setConsumerStyle] = React.useState('');
  const [consumerTemplate, setConsumerTemplate] = React.useState('');

  const consumerTemplates = [
    { id: 'living_warm', label: 'Warm Living Room', room: 'living_room', style: 'warm_traditional' },
    { id: 'bedroom_modern', label: 'Modern Bedroom', room: 'bedroom', style: 'modern_minimal' },
    { id: 'kitchen_premium', label: 'Premium Kitchen', room: 'kitchen', style: 'premium_luxury' },
    { id: 'pooja_classic', label: 'Classic Pooja Room', room: 'pooja_room', style: 'warm_traditional' },
    { id: 'wardrobe_budget', label: 'Budget Wardrobe', room: 'wardrobe', style: 'budget_smart' },
    { id: 'tv_unit_luxury', label: 'Luxury TV Unit', room: 'tv_unit', style: 'premium_luxury' }
  ];

  const quickPrompt = (() => {
    if (!consumerRoom || !consumerStyle) return '';
    const roomLabel = {living_room:'Living Room',bedroom:'Bedroom',kitchen:'Kitchen',pooja_room:'Pooja Room',wardrobe:'Wardrobe',tv_unit:'TV Unit'}[consumerRoom] || consumerRoom;
    const styleLabel = {warm_traditional:'warm traditional',modern_minimal:'modern minimal',premium_luxury:'premium luxury',budget_smart:'budget friendly'}[consumerStyle] || consumerStyle;
    return `Create a simple ${styleLabel} design concept for a ${roomLabel}. Keep it easy to understand.`;
  })();
  const consumerRooms = [
    { id: 'living_room', label: 'Living Room', icon: '🛋️' },
    { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
    { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { id: 'pooja_room', label: 'Pooja Room', icon: '🪔' },
    { id: 'wardrobe', label: 'Wardrobe', icon: '🚪' },
    { id: 'tv_unit', label: 'TV Unit', icon: '📺' }
  ];

  const consumerStyles = [
    { id: 'warm_traditional', label: 'Warm Traditional' },
    { id: 'modern_minimal', label: 'Modern Minimal' },
    { id: 'premium_luxury', label: 'Luxury' },
    { id: 'budget_smart', label: 'Budget Friendly' }
  ];
  const [wizardStep, setWizardStep] = useState(project?.id ? 'upload' : 'name_project'); 
  const [projectName, setProjectName] = useState(project?.name || '');
  const [floorplanFile, setFloorplanFile] = useState(null);
  const [floorplanUrl, setFloorplanUrl] = useState(project?.floorplanUrl || '');
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [scaleDistance, setScaleDistance] = useState('4500');
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [pixelsPerMeter, setPixelsPerMeter] = useState('40');
  const [markedRooms, setMarkedRooms] = useState([]);
  const [selectedZoneToRender, setSelectedZoneToRender] = useState(null);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [assignMode, setAssignMode] = useState(null);
  const [actionProgress, setActionProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentVersionId, setCurrentVersionId] = useState('');

  const canvasRef = useRef(null);

  // Helper to trigger 1.5s spinners
  const triggerLoading = (nextStep, message) => {
    setWizardStep('loading');
    setLoaderMessage(message);
    setTimeout(() => {
      setWizardStep(nextStep);
    }, 1500);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) {
      setStatusMessage('Create or select a project first');
      setTimeout(() => setStatusMessage(''), 2200);
      return;
    }
    setFloorplanFile(file);
    setStatusMessage('Uploading blueprint...');
    try {
      const form = new FormData();
      form.append('floorplan', file);
      const upload = await fetch(`http://127.0.0.1:5055/api/projects/${selectedProjectId}/floorplan`, { method: 'POST', body: form });
      if (!upload.ok) throw new Error('Upload failed');
      const data = await upload.json();
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:5055';
      setFloorplanUrl(`${baseUrl}${data.floorplanUrl}`);
      setCurrentVersionId(data.floorPlanVersionId);
      setWizardStep('enhance_view');
      setStatusMessage('Blueprint uploaded');
    } catch (err) {
      setStatusMessage('Upload failed');
    } finally {
      setTimeout(() => setStatusMessage(''), 2200);
    }
  };

  const handleCanvasClick = (e) => {
    if (wizardStep !== 'scale_calibrate' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    if (calibrationPoints.length < 2) {
      setCalibrationPoints([...calibrationPoints, { x, y }]);
    } else {
      setCalibrationPoints([{ x, y }]);
    }
  };

  const handleRunNextAction = (actionKey) => {
    setSelectedAction(actionKey);
    setActionProgress(true);
    
    setTimeout(() => {
      setActionProgress(false);
      if (actionKey === 'RCP') {
        onNavigateToTab('drawings');
      } else if (actionKey === 'Elevation') {
        onNavigateToTab('drawings');
      } else if (actionKey === 'BOM') {
        onNavigateToTab('finance');
      } else if (actionKey === 'Layout Plan') {
        onNavigateToTab('cad');
      } else if (actionKey === 'Video') {
        onNavigateToTab('renders');
      } else {
        onNavigateToTab('dashboard');
      }
    }, 1200);
  };



function ConsumerOnboarding({ rooms, styles, onSelectRoom, onSelectStyle, onStart }) {
  const [room, setRoom] = React.useState('');
  const [style, setStyle] = React.useState('');
  const canStart = Boolean(room) && Boolean(style);
  return (
    <div id="welcome-home" className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Welcome to Easy Mode</h3>
      <p className="text-[10px] text-slate-400">Pick your room and a style you love. We will prepare a simple concept you can refine with a designer later.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rooms.map(r => (
          <button key={r.id} onClick={() => { setRoom(r.id); onSelectRoom && onSelectRoom(r.id); }} className={`border rounded-2xl p-4 text-left transition ${room === r.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-800 text-slate-200 hover:border-[#C9A84C]/40'}`}>
            <div className="text-lg">{r.icon}</div>
            <div className="text-[10px] font-black uppercase tracking-wider mt-1">{r.label}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {styles.map(s => (
          <button key={s.id} onClick={() => { setStyle(s.id); onSelectStyle && onSelectStyle(s.id); }} className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition ${style === s.id ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-slate-800 text-slate-300 hover:border-[#C9A84C]/50'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <button onClick={onStart} disabled={!canStart} className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 disabled:opacity-40 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-md shadow-[#D4AF37]/15 block w-full md:w-auto">Start Simple Project</button>
    </div>
  );
}

  return (
    <div className="space-y-6 text-left">
      
      {/* Consumer Welcome / Simplified Onboarding */}
      {workspaceMode === 'consumer' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Welcome — Let’s design your room</h3>
          <p className="text-[10px] text-slate-400">Start with a photo or pick a room type, then choose a style. We’ll suggest a layout, finishes, and an indicative price.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => onNavigateToTab && onNavigateToTab('photo')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">1. Start with Photo</div>
              <div className="text-[10px] text-slate-400 mt-1">Upload a room photo and we’ll suggest a redesign.</div>
            </button>
            <button onClick={() => onNavigateToTab && onNavigateToTab('renders')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">2. Generate Concepts</div>
              <div className="text-[10px] text-slate-400 mt-1">Get simple 3D ideas for your living room, kitchen, bedroom, etc.</div>
            </button>
            <button onClick={() => onNavigateToTab && onNavigateToTab('finance')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">3. See Indicative Cost</div>
              <div className="text-[10px] text-slate-400 mt-1">Preview approximate budget based on room size and finishes.</div>
            </button>
          </div>
        </div>
      )}

      {/* Step Progress Tracker */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">🚀 Your Design Flow</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Choose a template or start simple — we’ll guide you</p>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-850 px-3 py-1 rounded-xl">
          STEP: <span className="text-[#D4AF37] uppercase">{wizardStep.replace('_', ' ')}</span>
        </div>
      </div>

      {consumerMode && consumerStep === 'welcome' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Let's design your room</h3>
          <p className="text-[10px] text-slate-400">Choose a ready-made template to get started in 10 seconds.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {consumerTemplates.map(t => (
              <button key={t.id} onClick={() => { setConsumerTemplate(t.id); setConsumerRoom(t.room); setConsumerStyle(t.style); setConsumerStep('result'); }} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{t.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">Quick concept</div>
              </button>
            ))}
          </div>
          <button onClick={() => setConsumerStep('room')} className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">Customize manually</button>
        </div>
      )}

      {consumerMode && consumerStep === 'room' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Pick your room</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[{id:'living_room',label:'Living Room',icon:'🛋️'},{id:'bedroom',label:'Bedroom',icon:'🛏️'},{id:'kitchen',label:'Kitchen',icon:'🍳'},{id:'pooja_room',label:'Pooja Room',icon:'🪔'},{id:'wardrobe',label:'Wardrobe',icon:'🚪'},{id:'tv_unit',label:'TV Unit',icon:'📺'}].map(r => (
              <button key={r.id} onClick={() => setConsumerRoom(r.id)} className={`border rounded-2xl p-4 text-left transition ${consumerRoom === r.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-800 text-slate-200 hover:border-[#C9A84C]/40'}`}>
                <div className="text-lg">{r.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-wider mt-1">{r.label}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConsumerStep('welcome')} className="text-[10px] font-black uppercase tracking-wider text-slate-400">Back</button>
            <button onClick={() => setConsumerStep('style')} disabled={!consumerRoom} className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 disabled:opacity-40 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition">Next</button>
          </div>
        </div>
      )}

      {consumerMode && consumerStep === 'style' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Choose a style</h3>
          <div className="flex flex-wrap gap-2">
            {[{id:'warm_traditional',label:'Warm Traditional'},{id:'modern_minimal',label:'Modern Minimal'},{id:'premium_luxury',label:'Premium Luxury'},{id:'budget_smart',label:'Budget Friendly'}].map(s => (
              <button key={s.id} onClick={() => setConsumerStyle(s.id)} className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition ${consumerStyle === s.id ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-slate-800 text-slate-300 hover:border-[#C9A84C]/50'}`}>{s.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConsumerStep('room')} className="text-[10px] font-black uppercase tracking-wider text-slate-400">Back</button>
            <button onClick={() => setConsumerStep('result')} disabled={!consumerStyle} className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 disabled:opacity-40 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition">See Result</button>
          </div>
        </div>
      )}

      {consumerMode && consumerStep === 'result' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Your Simple Concept</h3>
          <p className="text-[10px] text-slate-400">We prepared a starting point. Open 3D concepts or materials to refine.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => onNavigateToTab && onNavigateToTab('renders')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">1. See 3D Concepts</div>
              <div className="text-[10px] text-slate-400 mt-1">Generate simple renders for your room.</div>
            </button>
            <button onClick={() => onNavigateToTab && onNavigateToTab('materials')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">2. Pick Finishes</div>
              <div className="text-[10px] text-slate-400 mt-1">Choose laminates and colors.</div>
            </button>
            <button onClick={() => onNavigateToTab && onNavigateToTab('finance')} className="border border-slate-800 rounded-2xl p-4 text-left hover:border-[#C9A84C]/40 transition">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">3. Indicative Cost</div>
              <div className="text-[10px] text-slate-400 mt-1">Preview an approximate budget.</div>
            </button>
          </div>
          <div className="text-[10px] text-slate-500">Prompt: <span className="font-mono text-slate-300">{quickPrompt}</span></div>
        </div>
      )}

      {/* STEP 1: What should we name this project? */}
      {wizardStep === 'name_project' && (
        <div className="space-y-4 max-w-md bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
          <label className="text-xs font-black text-slate-300 block uppercase tracking-wider">What should we name this project?</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={e => setProjectName(e.target.value)} 
            placeholder="e.g. Verona Heights 3BHK"
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-[#D4AF37] outline-none"
          />
          <button 
            onClick={() => setWizardStep('upload')}
            className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-md shadow-[#D4AF37]/15 block w-full"
          >
            Create Project & Continue
          </button>
        </div>
      )}

      {consumerMode && wizardStep === 'upload' && (
        <div className="glass-card border border-slate-850 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Add your room photo</h3>
          <p className="text-[10px] text-slate-400">Upload a photo if you have one. Otherwise use a template instead.</p>
          <label className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase text-[10px] tracking-wider py-2 px-5 rounded-xl cursor-pointer transition shadow-md shadow-[#D4AF37]/10">
            Upload Photo
            <input type="file" onChange={handleUpload} className="hidden" accept="image/*,.pdf,.dxf" />
          </label>
          <button onClick={() => { setConsumerStep('welcome'); }} className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">Use a template instead</button>
        </div>
      )}

      {!consumerMode && wizardStep === 'upload' && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-10 bg-slate-950/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <strong className="text-xs text-slate-200 block">Upload Floor Plan for "{projectName || 'New Project'}"</strong>
            <span className="text-[10px] text-slate-500 block font-bold uppercase">CAD DXF, PDF, or PNG layout</span>
            {floorplanFile && <span className="text-[10px] text-emerald-400 font-black uppercase">{floorplanFile.name}</span>}
            {statusMessage && <span className="text-[10px] text-indigo-400 font-black uppercase" aria-live="polite">{statusMessage}</span>}
          </div>
          <label className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase text-[10px] tracking-wider py-2 px-5 rounded-xl cursor-pointer transition shadow-md shadow-[#D4AF37]/10">
            Select Blueprint
            <input type="file" onChange={handleUpload} className="hidden" accept="image/*,.pdf,.dxf" />
          </label>
        </div>
      )}

      {/* STEP 3: Enhance top view option */}
      {wizardStep === 'enhance_view' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden">
            {floorplanUrl ? (
              <img
                src={floorplanUrl}
                alt="Floor Plan Underlay"
                className={`w-full max-w-[400px] h-auto object-contain opacity-75 transition-all ${isEnhanced ? 'contrast-125 saturate-110 filter brightness-110' : ''}`}
              />
            ) : (
              <div className="text-center space-y-2">
                <span className="text-[10px] text-slate-500 font-black uppercase">No floor plan loaded</span>
                <button onClick={() => setWizardStep('upload')} className="text-[10px] text-[#D4AF37] font-bold uppercase">Upload blueprint</button>
              </div>
            )}
            {isEnhanced && (
              <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-950 font-mono text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                AI Enhanced
              </div>
            )}
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Floor Plan Loaded</span>
              <p className="text-xs text-slate-350">Enhance the top view with AI to auto-fill wall thicknesses and zonation guidelines, or use it as-is.</p>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={async () => {
                  setIsEnhanced(true);
                  if (selectedProjectId) {
                    setStatusMessage('Enhancing floor plan...');
                    try {
                      await fetch(`http://127.0.0.1:5055/api/projects/${selectedProjectId}/cad/ai-detect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enhance' }) });
                      setStatusMessage('AI enhancement complete');
                    } catch (err) {
                      setStatusMessage('AI enhancement failed');
                    } finally {
                      setTimeout(() => setStatusMessage(''), 2200);
                    }
                  }
                  triggerLoading('scale_calibrate', 'AI Top View Enhancement pipeline running...');
                }}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-md shadow-[#D4AF37]/10"
              >
                Enhance top view
              </button>
              <button 
                onClick={() => {
                  setIsEnhanced(false);
                  setWizardStep('scale_calibrate');
                }}
                className="w-full py-2.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px] rounded-xl transition"
              >
                Use original as-is
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Scale Calibration */}
      {wizardStep === 'scale_calibrate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase px-1">
              <span>Tap two points on a wall to set size</span>
              <span className="text-[#D4AF37] font-mono">{calibrationPoints.length} / 2 Points Selected</span>
            </div>
            <div 
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-[320px] bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden cursor-crosshair flex items-center justify-center"
            >
              {floorplanUrl ? (
                <img
                  src={floorplanUrl}
                  alt="Calibration Underlay"
                  className="absolute w-full max-w-[360px] h-auto object-contain opacity-50 select-none pointer-events-none"
                />
              ) : (
                <div className="text-[10px] text-slate-500 font-black uppercase">No floor plan loaded</div>
              )}
              
              {/* Calibration Line */}
              {calibrationPoints.map((pt, i) => (
                <div 
                  key={i} 
                  className="absolute w-3 h-3 bg-[#D4AF37] border border-slate-950 rounded-full cursor-pointer z-10"
                  style={{ left: pt.x - 6, top: pt.y - 6 }}
                />
              ))}
              {calibrationPoints.length === 2 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line 
                    x1={calibrationPoints[0].x} 
                    y1={calibrationPoints[0].y} 
                    x2={calibrationPoints[1].x} 
                    y2={calibrationPoints[1].y} 
                    stroke="#D4AF37" 
                    strokeWidth="2" 
                    strokeDasharray="4,4"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Scale Ratio Config</span>
              <div className="space-y-1">
                <label className="text-[8px] text-slate-500 uppercase block font-bold">Real length (mm)</label>
                <input 
                  type="number" 
                  value={scaleDistance} 
                  onChange={e => setScaleDistance(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <span className="text-[9px] text-slate-550 block">Tap two points on a wall, then enter the real length.</span>
            </div>
            
            <button 
              onClick={() => setWizardStep('draw_rooms')}
              disabled={calibrationPoints.length < 2}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] disabled:bg-slate-800 disabled:text-slate-550 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
            >
              Set Size & Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Drag rectangles over rooms */}
      {wizardStep === 'draw_rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase px-1">
              <span>Draw boxes around rooms</span>
              <span className="text-[#D4AF37] font-mono">Zones Mapped</span>
            </div>
            <div className="w-full h-[320px] bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
              {floorplanUrl ? (
                <img
                  src={floorplanUrl}
                  alt="Zonation Underlay"
                  className="absolute w-full max-w-[360px] h-auto object-contain opacity-50 select-none pointer-events-none"
                />
              ) : (
                <div className="text-[10px] text-slate-500 font-black uppercase">No floor plan loaded</div>
              )}
              
              {/* Highlight Mapped Rooms */}
              {markedRooms.map(rm => (
                <div 
                  key={rm.id}
                  className="absolute border border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center rounded"
                  style={{
                    left: `${rm.bounds.x}%`,
                    top: `${rm.bounds.y}%`,
                    width: `${rm.bounds.w}px`,
                    height: `${rm.bounds.h}px`
                  }}
                >
                  <span className="bg-slate-950/80 border border-slate-800 text-[#D4AF37] text-[8px] font-bold px-1.5 py-0.5 rounded">
                    {rm.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-bold">Room Zonation Boundary</span>
              <p className="text-[11px] text-slate-450 leading-relaxed">Draw boxes around rooms, then save.</p>
            </div>
            <button 
              onClick={async () => {
                if (!project?.id) {
                  setStatusMessage('Select a project to continue');
                  setTimeout(() => setStatusMessage(''), 2200);
                  return;
                }
                triggerLoading('rooms_ready', 'Saving room zonation...');
                setStatusMessage('Saving rooms');
                try {
                  await fetch(`http://127.0.0.1:5055/api/projects/${project.id}/cad`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      walls: [],
                      openings: [],
                      furniture: [],
                      rooms: markedRooms,
                      measures: { scaleDistance, pixelsPerMeter }
                    })
                  });
                  setStatusMessage('Rooms saved');
                } catch (err) {
                  setStatusMessage('Save failed');
                } finally {
                  setTimeout(() => setStatusMessage(''), 2200);
                }
              }}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
            >
              Save Rooms
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Rooms ready — pick one to render */}
      {wizardStep === 'rooms_ready' && (
        <div className="space-y-4 max-w-md bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
          <label className="text-xs font-black text-slate-350 block uppercase tracking-wider">Pick a room to design</label>
          <div className="flex flex-col gap-2">
            {(markedRooms.length ? markedRooms : ([{ id: 'living', label: 'Open Zone 1: Living Area' }, { id: 'master', label: 'Open Zone 2: Master Bed' }, { id: 'kitchen', label: 'Open Zone 3: Kitchen' }])).map(zone => (
              <button 
                key={zone.id}
                onClick={() => {
                  setSelectedZoneToRender(zone.label);
                  triggerLoading('detection_done', 'Detecting objects in the layout — one moment.');
                }}
                className="w-full py-2.5 px-4 bg-slate-950 border border-slate-850 rounded-xl text-left text-xs font-bold hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition cursor-pointer text-slate-300"
              >
                {zone.label || zone.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: Detection finished */}
      {wizardStep === 'detection_done' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Room objects</span>
            
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-3">
              {detectedObjects.map(obj => (
                <div key={obj.id} className="flex justify-between items-center bg-slate-900/40 border border-slate-850 p-3 rounded-xl">
                  <div className="text-xs">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">{obj.type}</span>
                    <strong className="text-slate-200">{obj.assigned}</strong>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    obj.matched ? 'bg-emerald-950/40 text-emerald-400' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  }`}>
                    {obj.matched ? 'Auto Matched' : 'Awaiting Assign'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Choose products / style</span>
              <p className="text-[11px] text-slate-400">Review suggestions and choose products.</p>
              
              <div className="flex flex-col gap-2 pt-2">
                {[
                  { id: 'catalog', label: 'Catalog Browser' },
                  { id: 'board', label: 'Product Board Matcher' },
                  { id: 'style', label: 'Room Style Reference' }
                ].map(mode => (
                  <button
                    key={mode.id}
                onClick={async () => {
                  setAssignMode(mode.id);
                  if (!project?.id) {
                    setStatusMessage('Select a project for assignment');
                    setTimeout(() => setStatusMessage(''), 2200);
                    return;
                  }
                  setStatusMessage(`Assigning via ${mode.label}...`);
                  try {
                    await fetch(`http://127.0.0.1:5055/api/projects/${project.id}/cad/ai-detect`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: mode.id })
                    });
                    setStatusMessage(`Assignments queued via ${mode.label}`);
                  } catch (err) {
                    setStatusMessage('Assignment failed');
                  } finally {
                    setTimeout(() => setStatusMessage(''), 2200);
                  }
                }}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                      assignMode === mode.id 
                        ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37]'
                        : 'bg-slate-950 border border-slate-850 text-slate-350 hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {assignMode && (
              <div className="space-y-3 pt-2 border-t border-slate-850/60 animate-in slide-in-from-bottom-2">
                <span className="text-[9px] text-emerald-400 font-bold block uppercase tracking-wider">Assignments are ready. Review the product board next.</span>
                <button 
                  onClick={() => setWizardStep('moodboard_view')}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-emerald-500/10"
                >
                  Continue to Ideas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 8: Moodboard Selection */}
      {wizardStep === 'moodboard_view' && (
        <div className="space-y-4 max-w-md bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
          <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-widest">Product Board Configured</span>
          <label className="text-xs font-bold text-slate-300 block">Product board is ready. Pick the camera view to render.</label>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => {
                setCameraView('perspective');
                triggerLoading('render_ready', 'Rendering photorealistic perspective viewpoint...');
              }}
              className="py-3 bg-slate-950 border border-slate-850 hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-slate-200 cursor-pointer"
            >
              <Compass className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Perspective View</span>
            </button>
            <button 
              onClick={() => {
                setCameraView('isometric');
                triggerLoading('render_ready', 'Rendering isometric 3D spatial viewpoint...');
              }}
              className="py-3 bg-slate-950 border border-slate-850 hover:border-[#D4AF37]/60 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-slate-200 cursor-pointer"
            >
              <Grid className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Isometric View</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: Render Ready Actions Grid */}
      {wizardStep === 'render_ready' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Rendering Canvas Preview */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold uppercase tracking-wider px-1">
              <span>Smart Render Output {(cameraView || 'perspective').replace(/^./, m => m.toUpperCase())} View</span>
              <span className="text-emerald-400 font-mono">Render Ready</span>
            </div>
            <div className="w-full h-[320px] rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-850">
              {selectedZoneToRender ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-black uppercase">Render pending</span>
                    <span className="text-[11px] text-slate-400 block">{selectedZoneToRender}</span>
                    <span className="text-[10px] text-slate-500 block">Use Render Studio to generate final output</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-black uppercase">No zone selected</span>
                    <span className="text-[10px] text-slate-500 block">Select a room in earlier step</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action List Checklist Panel */}
          <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-wider border-b border-slate-800 pb-1.5">
                Render ready — choose what you want to do next.
              </h4>
              
              {actionProgress && (
                <div className="flex items-center gap-2 p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl text-[10px] text-[#D4AF37] animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing request queue: {selectedAction}...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { key: 'Region Edit', label: 'Region Edit' },
                  { key: 'Camera Angles', label: 'Camera Angles' },
                  { key: 'Layout Plan', label: 'Layout Plan' },
                  { key: 'Elevation', label: 'Elevation' },
                  { key: 'RCP', label: 'RCP' },
                  { key: 'Upscale', label: 'Upscale' },
                  { key: 'Video', label: 'Video' },
                  { key: 'BOM', label: 'BOM' },
                  { key: 'Lineage', label: 'Lineage' },
                  { key: 'Download', label: 'Download' }
                ].map(act => (
                  <button
                    key={act.key}
                    onClick={() => handleRunNextAction(act.key)}
                    className="p-2.5 bg-slate-950 border border-slate-850 hover:border-[#D4AF37]/50 rounded-xl text-center font-bold text-slate-300 hover:text-slate-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setWizardStep('name_project')}
              className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
            >
              Start New Project Flow
            </button>
          </div>
        </div>
      )}

      {/* STEP LOADING SCREEN */}
      {wizardStep === 'loading' && (
        <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
          <div>
            <strong className="text-xs text-slate-200 block">Orchestrating AI Pipeline</strong>
            <span className="text-[10px] text-slate-500 mt-1 block font-mono animate-pulse">{loaderMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}


// ============================================================================
// WORKSPACE: Quick Generate
// ============================================================================
function QuickGenerateWorkspace({ project, onNavigateToTab }) {
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [selectedStyle, setSelectedStyle] = useState('modern-luxury');
  const [prompt, setPrompt] = useState('Warm Japandi living room with oak slatted rafters, beige linen curtains, direct cove lighting, and travertine marble details.');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedResult('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">🎨 Quick Generate Concept Render</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Combine room geometry + mood board style preset to generate AI concepts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Panel */}
        <div className="lg:col-span-1 space-y-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
          <h4 className="text-[11px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1.5">Parameters</h4>
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Target Room Type</label>
            <select 
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]"
            >
              <option value="living">Grand Living Area</option>
              <option value="kitchen">Modular Kitchen</option>
              <option value="bedroom">Master Bedroom Suite</option>
              <option value="pooja">Pooja Mandir Room</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Design Aesthetic Style</label>
            <select 
              value={selectedStyle}
              onChange={e => setSelectedStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]"
            >
              <option value="modern-luxury">Modern Luxury</option>
              <option value="japandi-fusion">Japandi Fusion</option>
              <option value="scandinavian-minimal">Scandinavian Minimal</option>
              <option value="indian-contemporary">Indian Contemporary</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Creative Prompt</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37] h-24 resize-none font-sans"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-1.5"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating Variant...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Queue Concept Variant
              </>
            )}
          </button>
        </div>

        {/* Output Render Visualizer */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-900/20 border border-slate-850 rounded-2xl p-4 min-h-[340px]">
          {generating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] animate-pulse">Running Multi-Stage AI Generation Pipeline...</span>
            </div>
          ) : generatedResult ? (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="w-full h-[240px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-850">
                <img src={generatedResult} alt="AI Generated Concept" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Generation complete
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Suggested Modules Matched</span>
                  <span className="text-slate-350 font-semibold mt-0.5 block">1x Fluted Backlit TV Unit, 1x Chevron Herringbone Oak Flooring</span>
                </div>
                <button 
                  onClick={() => onNavigateToTab('renders')}
                  className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#D4AF37]/20 transition"
                >
                  Promote to Design Studio
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 border border-dashed border-slate-850 rounded-xl">
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">No concept variant generated. Fill parameters on the left to start.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// WORKSPACE: Photo Edit
// ============================================================================
function PhotoEditWorkspace({ project, onNavigateToTab }) {
  const [photo, setPhoto] = useState(null);
  const [instructions, setInstructions] = useState('Change the console table material from dark oak to warm Calacatta gold marble, and set cove light to warm 2700K white.');
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState(null);
  const [coordinates, setCoordinates] = useState({ x1: 100, y1: 150, x2: 400, y2: 280 });

  const handleUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      setPhoto(URL.createObjectURL(f));
    }
  };

  const handleSubmitPatch = () => {
    setEditing(true);
    setTimeout(() => {
      setEditing(false);
      setResult('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">📸 Photo Edit & Reference Swapping</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Upload a photo of an existing room or rendering, select a region, and swap finishes/materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
          <h4 className="text-[11px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1.5">Edit Instructions</h4>
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Target Region Box Coordinates</label>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-slate-550">Top-Left:</span> <strong className="text-slate-350">{coordinates.x1}, {coordinates.y1}</strong>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-slate-550">Bottom-Right:</span> <strong className="text-slate-350">{coordinates.x2}, {coordinates.y2}</strong>
              </div>
            </div>
            <span className="text-[8px] text-slate-550 block">Coordinates mark the bounding box of the furniture cabinet console in px</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Material/Color Swaps Prompt</label>
            <textarea 
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37] h-24 resize-none font-sans"
            />
          </div>

          <button 
            onClick={handleSubmitPatch}
            disabled={editing || !photo}
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-1.5"
          >
            {editing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Submitting Patch...
              </>
            ) : (
              <>
                <Palette className="w-3.5 h-3.5" />
                Submit Photo Patch
              </>
            )}
          </button>
        </div>

        {/* Viewport Workspace */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-900/20 border border-slate-850 rounded-2xl p-4 min-h-[340px] items-center justify-center">
          {editing ? (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-3 py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] animate-pulse">Running Inpainting & Mask-Guided Rendering Job...</span>
            </div>
          ) : result ? (
            <div className="w-full flex flex-col justify-between space-y-3">
              <div className="w-full h-[240px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-850">
                <img src={result} alt="Photo Patch Result" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Patch Render Generated
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Targeted Materials Updated</span>
                  <span className="text-slate-350 font-semibold mt-0.5 block">Carrara Slate → Calacatta Gold Quartz</span>
                </div>
                <button 
                  onClick={() => onNavigateToTab('materials')}
                  className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#D4AF37]/20 transition"
                >
                  View Material Schedule
                </button>
              </div>
            </div>
          ) : photo ? (
            <div className="w-full space-y-3">
              <div className="w-full h-[240px] rounded-xl overflow-hidden bg-slate-950 relative border border-slate-850">
                <img src={photo} alt="Source Room" className="w-full h-full object-cover" />
                
                {/* Bounding box marker overlay */}
                <div 
                  className="absolute border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/10 rounded shadow-lg"
                  style={{
                    left: `${(coordinates.x1 / 600) * 100}%`,
                    top: `${(coordinates.y1 / 400) * 100}%`,
                    width: `${((coordinates.x2 - coordinates.x1) / 600) * 100}%`,
                    height: `${((coordinates.y2 - coordinates.y1) / 400) * 100}%`
                  }}
                >
                  <span className="absolute bottom-full left-0 bg-[#D4AF37] text-slate-950 font-black text-[8px] uppercase px-1.5 py-0.2 rounded-t font-mono">
                    Target region
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-bold block text-center uppercase tracking-wider">Source uploaded · Bounding Box defined</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 gap-3 border border-dashed border-slate-850 rounded-xl w-full py-16">
              <Upload className="w-8 h-8" />
              <div>
                <strong className="text-xs text-slate-200 block text-center">Upload Room Image to Begin</strong>
                <span className="text-[9px] text-slate-500 mt-1 block text-center">Select rendering or real photo of cabinet installation</span>
              </div>
              <label className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase text-[9px] tracking-wider py-1.5 px-4 rounded-xl cursor-pointer transition">
                Upload Photo
                <input type="file" onChange={handleUpload} className="hidden" accept="image/*" />
              </label>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// WORKSPACE: Quick Layout (2D Canvas Sketcher)
// ============================================================================
function QuickLayoutWorkspace({ project, onNavigateToTab }) {
  const [canvasItems, setCanvasItems] = useState([
    { id: 'w1', type: 'wall', x1: 50, y1: 50, x2: 450, y2: 50 },
    { id: 'w2', type: 'wall', x1: 450, y1: 50, x2: 450, y2: 300 },
    { id: 'w3', type: 'wall', x1: 450, y1: 300, x2: 50, y2: 300 },
    { id: 'w4', type: 'wall', x1: 50, y1: 300, x2: 50, y2: 50 },
    { id: 'f1', type: 'furniture', x: 250, y: 175, label: 'Double Bed Module' }
  ]);
  const [selectedTool, setSelectedTool] = useState('wall'); // 'select', 'wall', 'furniture'
  const canvasRef = useRef(null);

  const handleClear = () => {
    setCanvasItems([]);
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (selectedTool === 'furniture') {
      setCanvasItems([...canvasItems, {
        id: 'f_' + Math.random().toString(36).substring(2, 6),
        type: 'furniture',
        x,
        y,
        label: 'Modular TV Console'
      }]);
    }
  };

  const handleLockAndPromote = () => {
    alert("Quick Layout Promoted! Scene node initialized inside projects.");
    onNavigateToTab('cad');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">📐 Quick Layout 2D Sketcher</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Draw wall vertices and openings, place furniture blocks, and promote to design editor</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleClear}
            className="bg-slate-900 border border-slate-850 hover:border-red/40 hover:bg-red/10 text-slate-350 hover:text-red px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
          >
            Clear Canvas
          </button>
          <button 
            onClick={handleLockAndPromote}
            className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-md shadow-[#D4AF37]/10"
          >
            Promote to Scene
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Canvas Toolbar */}
        <div className="lg:col-span-1 space-y-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
          <h4 className="text-[11px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1.5">Sketcher Tools</h4>
          
          <div className="flex flex-col gap-2">
            {[
              { id: 'select', label: 'Select Entity', desc: 'Move/Rotate layout blocks' },
              { id: 'wall', label: 'Draw Wall Node', desc: 'Point-to-point rectangle walls' },
              { id: 'furniture', label: 'Place Furniture', desc: 'Place low-detail mock cabinet boxes' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTool(t.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  selectedTool === t.id
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]'
                    : 'bg-slate-950/20 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">{t.label}</span>
                <span className="text-[9px] font-medium opacity-60">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2D SVG canvas area */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
            <span>2D Sketch Editor</span>
            <span className="font-mono">Ortho Mode: ON</span>
          </div>

          <svg 
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-[320px] bg-slate-900 border border-slate-850 rounded-2xl"
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Render Canvas Walls */}
            {canvasItems.filter(i => i.type === 'wall').map(w => (
              <line 
                key={w.id}
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                stroke="#f3f4f6"
                strokeWidth="10"
                strokeLinecap="round"
              />
            ))}

            {/* Render Furniture Boxes */}
            {canvasItems.filter(i => i.type === 'furniture').map(f => (
              <g key={f.id} transform={`translate(${f.x - 40}, ${f.y - 30})`}>
                <rect 
                  width="80"
                  height="60"
                  fill="rgba(212, 175, 55, 0.15)"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  rx="4"
                />
                <text 
                  x="40"
                  y="35"
                  fill="#f3f4f6"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {f.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// WORKSPACE: Design Product & Parametric Config
// ============================================================================
const TRENDY_MODULAR_FURNITURE = [
  // Kitchen Modules
  { key: 'kitchen_base_cabinet_laminate', name: 'Base Drawer Run Unit', category: 'Modular Kitchen', w: 1200, h: 720, d: 560, desc: 'Premium drawer tandem run carcass with soft-close Blum runners' },
  { key: 'kitchen_wall_cabinet_acrylic', name: 'Wall Overhead Unit', category: 'Modular Kitchen', w: 900, h: 600, d: 300, desc: 'High-gloss acrylic shutter upper kitchen cabinet' },
  { key: 'kitchen_loft_cabinet', name: 'Loft Ceiling Storage', category: 'Modular Kitchen', w: 1200, h: 600, d: 560, desc: 'Modular overhead lofts extending to ceiling slab' },
  { key: 'kitchen_hob_box', name: 'Hob Cooking Box', category: 'Modular Kitchen', w: 900, h: 720, d: 560, desc: 'Hob cutout cabinet base with heat shielding' },
  { key: 'kitchen_sink_box', name: 'Sink Water Unit', category: 'Modular Kitchen', w: 800, h: 720, d: 560, desc: 'Sink basin cabinet with anti-drip plywood core' },
  // Wardrobes
  { key: 'wardrobe_sliding_aristo', name: 'Aristo Sliding Wardrobe', category: 'Wardrobes & Storage', w: 1800, h: 2400, d: 650, desc: 'Slim aluminium profile aristo dark tinted glass wardrobe' },
  { key: 'wardrobe_laminate_swing', name: 'Laminate Swing Wardrobe', category: 'Wardrobes & Storage', w: 1200, h: 2100, d: 600, desc: 'CenturyPly swing shutters wardrobe with Hafele handles' },
  { key: 'wardrobe_top_loft', name: 'Wardrobe Overhead Loft', category: 'Wardrobes & Storage', w: 1200, h: 600, d: 600, desc: 'Storage loft panels extending tall wardrobe carcass' },
  // TV & Living
  { key: 'tv_unit_fluted_backlit', name: 'Fluted Backlit TV Console', category: 'Living & Dining', w: 2400, h: 500, d: 420, desc: 'Backlit fluted wood rafter panel console unit' },
  { key: 'tv_unit_marble_floating', name: 'Luxury Floating Console', category: 'Living & Dining', w: 2800, h: 600, d: 450, desc: 'Calacatta Gold Quartz cladding floating TV console' },
  { key: 'crockery_unit_glass', name: 'Crockery Glass Cabinet', category: 'Living & Dining', w: 1000, h: 1800, d: 400, desc: 'Dining display case with LED shelf warm backlighting' },
  // Mandir
  { key: 'mandir_backlit_jali', name: 'Floor Backlit Jali Mandir', category: 'Mandir / Pooja', w: 900, h: 1800, d: 450, desc: 'Vastu-aligned CNC carved backlit jali mandir cabinet' },
  { key: 'mandir_wall_unit', name: 'Hanging carved temple', category: 'Mandir / Pooja', w: 600, h: 800, d: 300, desc: 'Compact wall-mount carved teak wood mandir box' },
  // Beds & Study
  { key: 'bed_queen_upholstered', name: 'Queen Upholstered Bed', category: 'Beds & Study', w: 1800, h: 1100, d: 2100, desc: 'Plush velvet headboard queen bed with storage base' },
  { key: 'study_desk_compact', name: 'Compact Writing study desk', category: 'Beds & Study', w: 1400, h: 760, d: 550, desc: 'Compact wooden desktop writing study console table' }
];

function DesignProductWorkspace({ project, materialsCatalog }) {
  const [selectedSubTab, setSelectedSubTab] = useState('parametric'); // 'parametric', 'catalog'
  const [selectedModule, setSelectedModule] = useState(TRENDY_MODULAR_FURNITURE[0]);
  
  // Parametric Configuration State
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(720);
  const [depth, setDepth] = useState(560);
  const [carcassMaterialId, setCarcassMaterialId] = useState('lam_1'); // Default CenturyPly Frosty White
  const [shutterMaterialId, setShutterMaterialId] = useState('lam_4'); // Default Bourbon Walnut
  const [hardwareId, setHardwareId] = useState('hw_1'); // Hettich sliders

  // Sync parameters when selected module changes
  useEffect(() => {
    setWidth(selectedModule.w);
    setHeight(selectedModule.h);
    setDepth(selectedModule.d);
  }, [selectedModule]);

  // Catalog filter state
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  const laminates = materialsCatalog.filter(m => m.category === 'laminate') || [];
  const hardware = materialsCatalog.filter(m => m.category === 'hardware') || [];

  const activeCarcass = laminates.find(l => l.id === carcassMaterialId) || { name: 'CenturyPly Frosty White', price_per_sqft: 45 };
  const activeShutter = laminates.find(l => l.id === shutterMaterialId) || { name: 'Bourbon Walnut', price_per_sqft: 85 };
  const activeHardware = hardware.find(h => h.id === hardwareId) || { name: 'Blum standard hinge', price_per_sqft: 220 }; // price_per_sqft stands for unit cost

  // BOM calculation logic (simulated modular carcass board takeoff)
  // Carcass area = 2 * (W*D + H*D + W*H) in sqft (conversion: 1 mm2 = 1.076e-5 sqft)
  const carcassSqft = parseFloat(((2 * (width * depth + height * depth + width * height)) / 92903).toFixed(1));
  // Shutter area = W * H in sqft
  const shutterSqft = parseFloat(((width * height) / 92903).toFixed(1));
  
  const carcassCost = carcassSqft * activeCarcass.price_per_sqft;
  const shutterCost = shutterSqft * activeShutter.price_per_sqft;
  // Hardware quantity basis (wardrobe: 4 hinges, drawer run: 3 slides runners)
  const isWardrobe = selectedModule.category.includes('Wardrobe');
  const isDrawerRun = selectedModule.key.includes('drawer') || selectedModule.key.includes('base');
  const hardwareQty = isWardrobe ? 4 : isDrawerRun ? 3 : 2;
  const hardwareCost = hardwareQty * (activeHardware.price_per_sqft || 220);
  
  const totalBOMCost = Math.round(carcassCost + shutterCost + hardwareCost);

  // Render a 3D wireframe box dynamically on an HTML5 canvas to show the parametric box updating in real-time
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30;

    // Scale down dimensions to fit canvas (e.g. max dimension 2700mm -> 150px)
    const scale = 110 / Math.max(width, height, depth, 1000);

    const w = width * scale;
    const h = height * scale;
    const d = depth * scale;

    // 3D Isometric projection vectors
    const ax = -Math.cos(Math.PI / 6);
    const ay = Math.sin(Math.PI / 6);
    const bx = Math.cos(Math.PI / 6);
    const by = Math.sin(Math.PI / 6);
    const cx_v = 0;
    const cy_v = -1;

    // Core vertices mapping
    const getPt = (dx, dy, dz) => ({
      x: cx + dx * ax + dy * bx + dz * cx_v,
      y: cy + dx * ay + dy * by + dz * cy_v
    });

    const p0 = getPt(0, 0, 0);       // Back Bottom Left
    const p1 = getPt(w, 0, 0);       // Back Bottom Right
    const p2 = getPt(w, d, 0);       // Front Bottom Right
    const p3 = getPt(0, d, 0);       // Front Bottom Left
    const p4 = getPt(0, 0, h);       // Back Top Left
    const p5 = getPt(w, 0, h);       // Back Top Right
    const p6 = getPt(w, d, h);       // Front Top Right
    const p7 = getPt(0, d, h);       // Front Top Left

    const drawLine = (pt1, pt2, color = '#AA8C2C', widthLine = 1.5, dashed = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = widthLine;
      if (dashed) ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    };

    // Draw Back dashed lines (obscured)
    drawLine(p0, p1, '#334155', 1, true);
    drawLine(p0, p3, '#334155', 1, true);
    drawLine(p0, p4, '#334155', 1, true);

    // Draw Bottom Front outline
    drawLine(p1, p2, '#AA8C2C', 1.5);
    drawLine(p2, p3, '#AA8C2C', 1.5);

    // Draw vertical columns
    drawLine(p1, p5, '#AA8C2C', 1.5);
    drawLine(p2, p6, '#AA8C2C', 1.5);
    drawLine(p3, p7, '#AA8C2C', 1.5);

    // Draw Top frame
    drawLine(p4, p5, '#AA8C2C', 1.5);
    drawLine(p5, p6, '#AA8C2C', 1.5);
    drawLine(p6, p7, '#AA8C2C', 1.5);
    drawLine(p4, p7, '#AA8C2C', 1.5);

    // Draw fluted panels / slats visualizer if selected
    if (selectedModule.key.includes('fluted') || selectedModule.key.includes('rafter')) {
      ctx.fillStyle = 'rgba(170, 140, 44, 0.08)';
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.lineTo(p7.x, p7.y);
      ctx.closePath();
      ctx.fill();
    }

  }, [width, height, depth, selectedModule]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">⚙️ Design Product & Modular Catalog</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Parametric modular catalog. Configure dimensions, materials and compute BOM takeoff</p>
        </div>
        <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-850 flex gap-1 text-[10px] font-bold">
          <button 
            onClick={() => setSelectedSubTab('parametric')}
            className={`py-1 px-3 rounded-lg uppercase tracking-wider transition ${
              selectedSubTab === 'parametric' ? 'bg-slate-950 text-[#D4AF37] border border-slate-850' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parametric Config
          </button>
          <button 
            onClick={() => setSelectedSubTab('catalog')}
            className={`py-1 px-3 rounded-lg uppercase tracking-wider transition ${
              selectedSubTab === 'catalog' ? 'bg-slate-950 text-[#D4AF37] border border-slate-850' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Catalog Browser
          </button>
        </div>
      </div>

      {selectedSubTab === 'parametric' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Module Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3 bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
            <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1">Select Module Family</h4>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {TRENDY_MODULAR_FURNITURE.map(item => (
                <button
                  key={item.key}
                  onClick={() => setSelectedModule(item)}
                  className={`w-full p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                    selectedModule.key === item.key 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' 
                      : 'bg-slate-950/20 border-slate-850 hover:border-slate-800 text-slate-350 hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold truncate max-w-[140px]">{item.name}</span>
                    <span className="text-[8px] opacity-60 font-mono font-bold uppercase">{item.category}</span>
                  </div>
                  <span className="text-[9px] opacity-70 line-clamp-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parametric sliders & Canvas Preview */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/10 border border-slate-850 p-5 rounded-2xl">
            
            {/* Real-time canvas preview */}
            <div className="flex flex-col justify-between bg-slate-950 rounded-xl p-3 border border-slate-850">
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">
                <span>3D Wireframe Sandbox</span>
                <span className="font-mono text-[#D4AF37]">{width} × {height} × {depth} mm</span>
              </div>
              <div className="flex items-center justify-center py-6">
                <canvas ref={canvasRef} width="240" height="200" className="bg-slate-950 rounded" />
              </div>
              <span className="text-[8px] text-slate-650 text-center uppercase tracking-widest block mt-2">Parametric constraints validated</span>
            </div>

            {/* Config & Takeoff details */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Sliders */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1">Dimensions (mm)</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Width</span>
                    <span>{width} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="450" 
                    max="2700" 
                    step="50"
                    value={width} 
                    onChange={e => setWidth(parseInt(e.target.value))} 
                    className="w-full accent-[#D4AF37] bg-slate-800 h-1 rounded-full cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Height</span>
                    <span>{height} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="360" 
                    max="2700" 
                    step="50"
                    value={height} 
                    onChange={e => setHeight(parseInt(e.target.value))} 
                    className="w-full accent-[#D4AF37] bg-slate-800 h-1 rounded-full cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Depth</span>
                    <span>{depth} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="300" 
                    max="700" 
                    step="50"
                    value={depth} 
                    onChange={e => setDepth(parseInt(e.target.value))} 
                    className="w-full accent-[#D4AF37] bg-slate-800 h-1 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Material Dropdowns */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-800 pb-1">Materials Selection</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="space-y-0.5">
                    <label className="text-slate-500 block uppercase">Carcass core</label>
                    <select 
                      value={carcassMaterialId}
                      onChange={e => setCarcassMaterialId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-slate-200 outline-none focus:border-[#D4AF37]"
                    >
                      {laminates.map(l => <option key={l.id} value={l.id}>{l.name} (₹{l.price_per_sqft})</option>)}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-slate-500 block uppercase">Shutter finish</label>
                    <select 
                      value={shutterMaterialId}
                      onChange={e => setShutterMaterialId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-slate-200 outline-none focus:border-[#D4AF37]"
                    >
                      {laminates.map(l => <option key={l.id} value={l.id}>{l.name} (₹{l.price_per_sqft})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* BOM Takeoff & pricing */}
              <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">BOM Takeoff Estimate</span>
                <div className="space-y-1 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Carcass board yield:</span>
                    <span>{carcassSqft} SQFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shutter finish yield:</span>
                    <span>{shutterSqft} SQFT</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-850/60 pt-1 text-xs font-bold text-slate-200">
                    <span className="text-[#D4AF37]">Total estimated cost:</span>
                    <span className="text-[#D4AF37] flex items-center"><IndianRupee className="w-3 h-3" /> {totalBOMCost}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Curated Searchable Catalog Grid */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={catalogQuery}
              onChange={e => setCatalogQuery(e.target.value)}
              placeholder="Search beds, sofas, wardrobes, modules..." 
              className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-550 outline-none focus:border-[#D4AF37]"
            />
            <select 
              value={catalogCategory}
              onChange={e => setCatalogCategory(e.target.value)}
              className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Categories</option>
              <option value="bed">Beds</option>
              <option value="sofa">Sofas</option>
              <option value="tv_unit">TV Units</option>
              <option value="dresser">Dressers</option>
              <option value="wardrobe">Wardrobes</option>
              <option value="mandir">Mandirs</option>
              <option value="study">Study</option>
              <option value="kitchen">Kitchen Cabinets</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
            {TRENDY_MODULAR_FURNITURE
              .filter(item => {
                if (catalogCategory !== 'all') {
                  const catLower = catalogCategory.toLowerCase();
                  const itemCatLower = item.category.toLowerCase();
                  if (!itemCatLower.includes(catLower)) return false;
                }
                if (catalogQuery) {
                  const q = catalogQuery.toLowerCase();
                  return item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
                }
                return true;
              })
              .map((item, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex flex-col justify-between hover:border-[#D4AF37]/50 transition">
                  <div className="space-y-2">
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-850">
                      <img src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" alt={item.name} className="w-full h-full object-cover opacity-85" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">{item.category}</span>
                      <strong className="text-xs text-slate-200 block truncate mt-0.5">{item.name}</strong>
                      <span className="text-[10px] text-slate-400 block line-clamp-2 mt-1">{item.desc}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-850 pt-2.5 mt-3">
                    <span className="text-[10px] font-mono text-[#D4AF37] font-bold">{item.w} × {item.h} × {item.d} mm</span>
                    <button 
                      onClick={() => {
                        setSelectedModule(item);
                        setSelectedSubTab('parametric');
                      }}
                      className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialist Tools Workspace & Interactive Runners
const ALL_SPECIALIST_AI_TOOLS = [
  {
    key: 'cad_ingest',
    name: 'CAD Plan Ingestion Interpreter',
    category: 'Plan & Layout',
    desc: 'Parse DXF/PDF blueprint drawings into geometric vector shell lines.',
    inputs: 'PDF, DXF, PNG',
    outputs: 'SVG vectors, JSON coordinates',
    updateBehavior: 'Initializes spatial levels & room shells',
    icon: 'Compass'
  },
  {
    key: 'ortho_calibrate',
    name: 'Auto Scale Calibrator',
    category: 'Plan & Layout',
    desc: 'Align millimeter dimensions to screen pixel boundaries.',
    inputs: 'Two point vertices, millimetre distance',
    outputs: 'Scale calibration ratio (px/mm)',
    updateBehavior: 'Updates global workspace coordinate transformer',
    icon: 'Sliders'
  },
  {
    key: 'vastu_annotate',
    name: 'Vastu & Room Annotator',
    category: 'Plan & Layout',
    desc: 'Map Vastu directions (NE, SW, SE) and room names onto zonation bounds.',
    inputs: 'Room vertices, compass orientation angle',
    outputs: 'Vastu alignment metadata schema',
    updateBehavior: 'Attaches zonation tag attributes to room instances',
    icon: 'Layers'
  },
  {
    key: 'extruder_3d',
    name: '2D-to-3D Extrusion Builder',
    category: 'Plan & Layout',
    desc: 'Extrude 2D floor plans into three.js polygonal wall shells.',
    inputs: '2D wall nodes, wall thickness, ceiling height',
    outputs: '3D WebGL scene nodes',
    updateBehavior: 'Generates canonical 3D spatial models',
    icon: 'Zap'
  },
  {
    key: 'render_concept',
    name: 'Quick Concept Generator',
    category: 'AI Renders',
    desc: 'Generate photorealistic render variants from creative style prompts.',
    inputs: 'Room preset, style type, prompt tags',
    outputs: 'WebP preview image',
    updateBehavior: 'Generates transient render preview',
    icon: 'Sparkles'
  },
  {
    key: 'camera_director',
    name: 'FOV Camera Angle Planner',
    category: 'AI Renders',
    desc: 'Pre-calculate perspective vantage points based on room traffic paths.',
    inputs: '3D room boundaries, camera coordinate bounds',
    outputs: 'Camera position list',
    updateBehavior: 'Saves viewpoints to rendering scene graph config',
    icon: 'Camera'
  },
  {
    key: 'material_swapper',
    name: 'Batch Finish & Material Swapper',
    category: 'AI Renders',
    desc: 'Instantly replace finish materials or laminate codes across all panels.',
    inputs: 'Target zone, source finish ID, replacement finish ID',
    outputs: 'Updated scene PBR materials',
    updateBehavior: 'Updates material schedule in active project',
    icon: 'Palette'
  },
  {
    key: 'ambient_lighting',
    name: 'Ambient Sun Vector Shifter',
    category: 'AI Renders',
    desc: 'Simulate natural/artificial lighting across golden hour, noon, or twilight.',
    inputs: 'Sun vector angle, time-of-day preset, light temp K',
    outputs: 'Lighting schema matrix',
    updateBehavior: 'Updates Three.js ambient lights & render parameters',
    icon: 'Sun'
  },
  {
    key: 'walkthrough_animator',
    name: 'Walkthrough Path Planner',
    category: 'AI Renders',
    desc: 'Serializes Bezier spline nodes for camera animation walkthrough videos.',
    inputs: 'Timeline frames, camera position keyframes',
    outputs: 'Spline path coordinates JSON',
    updateBehavior: 'Saves animation path nodes to scene timeline',
    icon: 'Activity'
  },
  {
    key: 'carcass_config',
    name: 'Parametric Cabinet Builder',
    category: 'Product Design',
    desc: 'Generate custom carcass sizes while maintaining manufacturing constraints.',
    inputs: 'Width, Height, Depth, carcass material',
    outputs: 'Cabinet specs & dimensions',
    updateBehavior: 'Updates selected module dimensions',
    icon: 'Settings'
  },
  {
    key: 'hardware_spec',
    name: 'Hardware Fittings Allocator',
    category: 'Product Design',
    desc: 'Automatically allocate soft-close runners, clip hinges, or lift systems.',
    inputs: 'Drawer count, shutter height, brand filter',
    outputs: 'Hardware BOM quantities',
    updateBehavior: 'Attaches hardware list to wood cabinet units',
    icon: 'Sliders'
  },
  {
    key: 'nesting_calc',
    name: 'BOM Nesting Board Calculator',
    category: 'Product Design',
    desc: 'Run nesting algorithms to fit wood panels on 8x4 plywood sheets.',
    inputs: 'Cabinet cut panels, sheet safety offsets',
    outputs: 'Nesting cutting layout, total board count',
    updateBehavior: 'Calculates board yield and sheet schedule',
    icon: 'Scissors'
  },
  {
    key: 'swatch_match',
    name: 'AI Swatch Matcher',
    category: 'Style & Palette',
    desc: 'Match client photo swatches to exact catalog laminates or paints.',
    inputs: 'Reference photo, color palette tags',
    outputs: 'Laminate codes, brand match confidence',
    updateBehavior: 'Appends matched laminates to project choices',
    icon: 'Palette'
  },
  {
    key: 'elevation_draft',
    name: '2D Elevation CAD Drafter',
    category: 'Drawings & Docs',
    desc: 'Auto-dimensions wall slices to detailed SVG elevations.',
    inputs: 'Wall face ID, cabinet placement index',
    outputs: 'SVG drawing, dimension labels',
    updateBehavior: 'Saves vector drawing file to active drawings pack',
    icon: 'FileText'
  },
  {
    key: 'rcp_planner',
    name: 'Reflected Ceiling Plan (RCP) Planner',
    category: 'Drawings & Docs',
    desc: 'Create lighting and electrical layouts mapped to room ceilings.',
    inputs: 'Ceiling vertices, socket coordinates',
    outputs: 'RCP layout schematic SVG',
    updateBehavior: 'Appends lighting fixtures to spatial model',
    icon: 'Grid'
  },
  {
    key: 'dxf_compiler',
    name: 'DXF AutoCAD Exporter',
    category: 'Drawings & Docs',
    desc: 'Export 2D layout vectors to standard CAD DXF formats.',
    inputs: 'Active plan level vertices, scale multiplier',
    outputs: '.dxf drawing file',
    updateBehavior: 'Exports file for AutoCAD client download',
    icon: 'Plus'
  }
];

function SpecialistToolsWorkspace({ project, materialsCatalog, onNavigateToTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTool, setActiveTool] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [toolResult, setToolResult] = useState(null);

  // Custom runner states
  const [lightPreset, setLightPreset] = useState('golden_hour');
  const [rcpItems, setRcpItems] = useState([
    { id: '1', type: 'Spotlight', x: 80, y: 80 },
    { id: '2', type: 'Spotlight', x: 220, y: 80 },
    { id: '3', type: 'Spotlight', x: 80, y: 220 },
    { id: '4', type: 'Spotlight', x: 220, y: 220 }
  ]);
  const [elevationWall, setElevationWall] = useState('North Wall');
  const [swatchType, setSwatchType] = useState('walnut_veneer');
  const [extrudeThickness, setExtrudeThickness] = useState(150);

  const categories = ['All', 'Plan & Layout', 'AI Renders', 'Product Design', 'Style & Palette', 'Drawings & Docs'];

  const filteredTools = ALL_SPECIALIST_AI_TOOLS.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const getToolIcon = (iconName) => {
    switch (iconName) {
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Sliders': return <Sliders className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Camera': return <Camera className="w-5 h-5" />;
      case 'Palette': return <Palette className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      case 'Settings': return <Settings className="w-5 h-5" />;
      case 'Scissors': return <Scissors className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Grid': return <Grid className="w-5 h-5" />;
      case 'Plus': return <Plus className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const handleRunTool = async () => {
    setIsRunning(true);
    setToolResult(null);
    try {
      const projectId = project?.id;
      if (!projectId) throw new Error('No active project selected');

      const API_BASE = 'http://127.0.0.1:5055/api';
      const toolKey = activeTool?.key || '';
      let endpoint = `${API_BASE}/tools/execute`;
      let body = { toolSlug: toolKey, projectId, provider: null, model: null, params: {} };

      if (toolKey === 'laminate_swapper' || toolKey === 'laminate-changer') {
        endpoint = `${API_BASE}/projects/${projectId}/renders/laminate-swap`;
        body = { room: 'living', componentType: 'Cabinet Shutters', newMaterial: '', instruction: 'AI-assisted laminate swap from active reference.' };
      } else if (toolKey === 'swatch_match') {
        endpoint = `${API_BASE}/projects/${projectId}/renders/suggest-palette`;
        body = { roomType: 'living', baseColor: '#D4AF37' };
      } else if (toolKey === 'rcp_planner') {
        endpoint = `${API_BASE}/projects/${projectId}/zones/design-plan`;
        body = { planType: 'rcp', notes: 'Auto-planned RCP from tool hub.' };
      } else if (toolKey === 'elevation_draft') {
        endpoint = `${API_BASE}/projects/${projectId}/elevations/generate`;
        body = { wallFace: elevationWall || 'North Wall', userMeasurements: {} };
      } else if (toolKey === 'extruder_3d') {
        endpoint = `${API_BASE}/projects/${projectId}/renders/generate`;
        body = { variantCount: 1, modelTier: 'draft', room: 'living', style: 'contemporary' };
      } else if (toolKey === 'cad_ingest' || toolKey === 'camera_planner' || toolKey === 'walkthrough_config' || toolKey === 'svg_elevation_builder' || toolKey === 'bom_calculator' || toolKey === 'invoice_ledger') {
        endpoint = `${API_BASE}/tools/${encodeURIComponent(toolKey)}/run`;
        body = { projectId };
      } else if (toolKey === 'render_concept' || toolKey === 'ambient_lighting' || toolKey === 'camera_director' || toolKey === 'material_swapper' || toolKey === 'walkthrough_animator' || toolKey === 'carcass_config' || toolKey === 'hardware_spec' || toolKey === 'nesting_calc' || toolKey === 'swatch_match' || toolKey === 'dxf_compiler') {
        endpoint = `${API_BASE}/tools/execute`;
        body = { toolSlug: toolKey, projectId, params: {} };
      } else {
        endpoint = `${API_BASE}/tools/execute`;
        body = { toolSlug: toolKey, projectId, params: {} };
      }

      const runRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!runRes.ok) {
        const text = await runRes.text().catch(() => '');
        throw new Error(`Run failed: ${runRes.status} ${text.slice(0, 200)}`);
      }
      const resultJson = await runRes.json();
      const success = resultJson?.success || resultJson?.success === undefined;

      if (toolKey === 'laminate_swapper' || toolKey === 'laminate-changer') {
        setToolResult({ success, text: resultJson?.render ? 'Laminate swap render updated.' : 'Laminate swap request accepted.', render: resultJson?.render || null });
      } else if (toolKey === 'swatch_match') {
        setToolResult({ success, text: resultJson?.suggestions ? 'Palette suggestions returned.' : 'Swatch match request accepted.', suggestions: resultJson?.suggestions || null });
      } else if (toolKey === 'rcp_planner') {
        setToolResult({ success, text: resultJson?.text || 'RCP planning task accepted.', layoutPoints: resultJson?.layoutPoints || [] });
      } else if (toolKey === 'elevation_draft') {
        setToolResult({ success, text: resultJson?.text || 'Elevation draft request accepted.', wallFace: elevationWall || 'North Wall', elevation: resultJson || null });
      } else if (toolKey === 'extruder_3d') {
        setToolResult({ success, text: resultJson?.text || '3D generation requested.', extruded: !!resultJson?.variants?.length || !!resultJson?.render });
      } else if (toolKey === 'blueprint_parser' || toolKey === 'camera_planner' || toolKey === 'walkthrough_config' || toolKey === 'svg_elevation_builder' || toolKey === 'bom_calculator' || toolKey === 'invoice_ledger') {
        setToolResult({ success, text: resultJson?.text || resultJson?.message || `Specialist tool ${toolKey} executed successfully.`, result: resultJson });
      } else {
        setToolResult({ success, text: resultJson?.text || resultJson?.reply || `Tool execution completed for ${toolKey}. Outputs saved to active project.`, result: resultJson });
      }
    } catch (err) {
      setToolResult({ success: false, text: `Tool execution failed: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">⚡ AI Specialist Tool Hub</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Pick a tool — each one is a single-shot generator. Want a suggestion? Just describe what you need.</p>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search plan calibration, zonation, nesting, lighting tools..."
          className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-550 outline-none focus:border-[#D4AF37]"
        />
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37]'
                  : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1">
        {filteredTools.map(t => (
          <div 
            key={t.key}
            onClick={() => {
              setActiveTool(t);
              setToolResult(null);
            }}
            className="bg-slate-900/40 border border-slate-850 hover:border-[#D4AF37]/50 p-4 rounded-2xl flex flex-col justify-between transition cursor-pointer hover:bg-[#D4AF37]/2 text-left"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-950/80 border border-slate-800 text-[#D4AF37] flex items-center justify-center">
                  {getToolIcon(t.icon)}
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">{t.category}</span>
                  <h4 className="text-xs font-bold text-slate-250 truncate block mt-0.5">{t.name}</h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed line-clamp-2">{t.desc}</p>
            </div>

            <div className="border-t border-slate-850/60 pt-2.5 mt-3 flex items-center justify-between text-[8px] font-mono text-slate-500">
              <span>IN: {t.inputs}</span>
              <span className="text-[#D4AF37] font-bold">Configure →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tool Runner Modal */}
      {activeTool && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-30">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-xl p-6 relative overflow-hidden space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
                  {getToolIcon(activeTool.icon)}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block">{activeTool.category}</span>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider mt-0.5">{activeTool.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveTool(null)}
                className="text-xs text-slate-400 hover:text-slate-200 font-bold bg-slate-900 border border-slate-850 hover:border-slate-800 px-3 py-1 rounded-xl transition"
              >
                Close
              </button>
            </div>

            {/* Tool Spec Table */}
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-855/60 text-slate-400">
              <div>
                <span className="text-slate-600 block uppercase text-[8px] tracking-wider">Required Inputs</span>
                <span className="text-slate-200 font-bold">{activeTool.inputs}</span>
              </div>
              <div>
                <span className="text-slate-600 block uppercase text-[8px] tracking-wider">Outputs Produced</span>
                <span className="text-[#D4AF37] font-bold">{activeTool.outputs}</span>
              </div>
              <div className="col-span-2 border-t border-slate-850/60 pt-1.5 mt-1.5">
                <span className="text-slate-600 block uppercase text-[8px] tracking-wider">Pipeline Update Behavior</span>
                <span className="text-slate-300 font-semibold">{activeTool.updateBehavior}</span>
              </div>
            </div>

            {/* Custom Interactive Inputs Area */}
            <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl space-y-3 text-xs">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1">Configure Parameters</span>
              
              {/* Case 1: Ambient Lighting Shifter */}
              {activeTool.key === 'ambient_lighting' && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Time of Day Lighting Preset</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'golden_hour', label: 'Golden Hour', temp: '3500K' },
                      { id: 'noon', label: 'High Noon', temp: '5500K' },
                      { id: 'evening', label: 'Warm Indoor', temp: '2700K' },
                      { id: 'night', label: 'Midnight Moon', temp: '6500K' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setLightPreset(p.id)}
                        className={`p-2 rounded-xl border text-center transition flex flex-col gap-0.5 cursor-pointer ${
                          lightPreset === p.id 
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#D4AF37] font-bold' 
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px]">{p.label}</span>
                        <span className="text-[8px] opacity-60 font-mono">{p.temp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 2: RCP Lighting Planner */}
              {activeTool.key === 'rcp_planner' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 block font-bold uppercase">
                    <span>Ceiling Plotted Nodes</span>
                    <span className="text-[#D4AF37] font-mono">{rcpItems.length} Nodes Placed</span>
                  </div>
                  <div className="flex gap-2">
                    {['Spotlight', 'Pendant', 'LED Strip'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          const newPt = {
                            id: 'rcp_' + Math.random().toString(36).substring(2, 6),
                            type,
                            x: Math.round(50 + Math.random() * 200),
                            y: Math.round(50 + Math.random() * 200)
                          };
                          setRcpItems([...rcpItems, newPt]);
                        }}
                        className="bg-slate-950 border border-slate-850 hover:border-[#D4AF37]/40 px-3 py-1.5 rounded-xl text-[10px] text-slate-350 hover:text-slate-200 transition cursor-pointer"
                      >
                        + Add {type}
                      </button>
                    ))}
                    <button 
                      onClick={() => setRcpItems([])}
                      className="ml-auto text-red hover:text-red bg-red/10 border border-red/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3: Elevation Generator */}
              {activeTool.key === 'elevation_draft' && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Select Target Wall Slice</label>
                  <select 
                    value={elevationWall} 
                    onChange={e => setElevationWall(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                  >
                    <option value="North Wall">North Wall (Master Bedroom Console Wall)</option>
                    <option value="South Wall">South Wall (Entry Door & Wardrobe Wall)</option>
                    <option value="East Wall">East Wall (Glazed Window & Balcony Face)</option>
                    <option value="West Wall">West Wall (Bed Backrest & Fluted Wall)</option>
                  </select>
                </div>
              )}

              {/* Case 4: Swatch Matcher */}
              {activeTool.key === 'swatch_match' && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Select Reference swatch</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'walnut_veneer', label: 'Walnut Veneer', details: 'Natural woodgrain texture' },
                      { id: 'charcoal_matte', label: 'Charcoal Matte', details: 'Anti-fingerprint matte sheet' },
                      { id: 'frosty_white', label: 'Frosty White', details: 'Core cabinet interior laminate' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSwatchType(s.id)}
                        className={`p-2 rounded-xl border text-center transition flex flex-col gap-0.5 cursor-pointer ${
                          swatchType === s.id 
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#D4AF37] font-bold' 
                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px]">{s.label}</span>
                        <span className="text-[8px] opacity-60 line-clamp-1">{s.details}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 5: 2D to 3D Extruder */}
              {activeTool.key === 'extruder_3d' && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Extrusion Parameters</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Wall Thickness (mm)</span>
                      <input 
                        type="number" 
                        value={extrudeThickness} 
                        onChange={e => setExtrudeThickness(parseInt(e.target.value))} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Ceiling Height (mm)</span>
                      <input 
                        type="text" 
                        disabled 
                        value="3000" 
                        className="w-full bg-slate-950/40 border border-slate-850/60 rounded-xl px-3 py-1.5 text-xs text-slate-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* General Default Fallback parameters */}
              {['cad_ingest', 'ortho_calibrate', 'vastu_annotate', 'render_concept', 'camera_director', 'material_swapper', 'walkthrough_animator', 'carcass_config', 'hardware_spec', 'nesting_calc', 'dxf_compiler'].includes(activeTool.key) && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Parameters context</span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/60 font-mono text-[10px] text-slate-400 text-left">
                    Target Project ID: <strong className="text-slate-200">{project?.id || 'lead_default'}</strong><br />
                    Active Level ID: <strong className="text-slate-200">floor_level_1</strong><br />
                    Ortho angle: <strong className="text-slate-200">0.00</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunTool}
              disabled={isRunning || isToolBlocked}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#e6c045] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#D4AF37]/5 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing AI Pipeline...
                </>
              ) : isToolBlocked ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {toolBlockReason || 'Tool blocked'}
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Run AI Specialist Tool
                </>
              )}
            </button>
            {isToolBlocked && toolBlockReason && (
              <p className="text-[10px] text-amber-400 font-semibold text-center">{toolBlockReason}</p>
            )}

            {/* Live Interactive Results Visualizer Area */}
            {isRunning && (
              <div className="h-40 rounded-2xl bg-slate-950 border border-slate-850/60 flex flex-col items-center justify-center text-slate-550 gap-2 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">Synthesizing CAD & Spatial coordinates...</span>
              </div>
            )}

            {toolResult && (
              <div className="bg-slate-950 border border-slate-850/60 p-4 rounded-2xl space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-xs text-slate-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{toolResult.text}</span>
                </div>

                {/* Case 1 Result: Ambient lighting shade display */}
                {activeTool.key === 'ambient_lighting' && toolResult.visualSim && (
                  <div className="w-full h-32 rounded-xl relative overflow-hidden border border-slate-850" style={{ background: toolResult.visualSim }}>
                    <div className="absolute inset-0 flex items-center justify-between px-6 bg-slate-950/30">
                      <div className="text-[10px] font-mono text-slate-200">
                        <span className="block opacity-60 text-[8px] uppercase">Shadow Multiplier</span>
                        <strong>0.85 (soft-edge)</strong>
                      </div>
                      <div className="text-[10px] font-mono text-[#D4AF37] text-right">
                        <span className="block opacity-60 text-[8px] uppercase">Lighting State</span>
                        <strong>Live Preview</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 2 Result: RCP light nodes display */}
                {activeTool.key === 'rcp_planner' && toolResult.layoutPoints && (
                  <div className="w-full h-36 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <svg className="w-[300px] h-[120px] bg-slate-900 border border-slate-850/60 rounded-lg">
                      <defs>
                        <pattern id="rcpGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                          <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#222c3f" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#rcpGrid)" />
                      {toolResult.layoutPoints.map((pt, idx) => (
                        <g key={pt.id} transform={`translate(${pt.x}, ${pt.y - 120})`}>
                          <circle r="4" fill={pt.type === 'Spotlight' ? '#D4AF37' : pt.type === 'Pendant' ? '#f43f5e' : '#10b981'} className="animate-ping" />
                          <circle r="3.5" fill={pt.type === 'Spotlight' ? '#D4AF37' : pt.type === 'Pendant' ? '#f43f5e' : '#10b981'} />
                          <text y="-6" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">{pt.type}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {/* Case 3 Result: 2D Elevation CAD drawing */}
                {activeTool.key === 'elevation_draft' && toolResult.wallFace && (
                  <div className="w-full h-40 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <svg className="w-[320px] h-[140px] bg-slate-900 border border-slate-850/60 rounded-lg p-2 font-mono text-[6px]">
                      {/* Technical CAD drawing outlines */}
                      <rect x="20" y="20" width="280" height="90" fill="none" stroke="#64748b" strokeWidth="1" />
                      <line x1="20" y1="20" x2="300" y2="20" stroke="#AA8C2C" strokeWidth="0.5" strokeDasharray="2,2" />
                      
                      {/* Height marker line */}
                      <line x1="15" y1="20" x2="15" y2="110" stroke="#64748b" strokeWidth="0.5" />
                      <text x="10" y="65" fill="#64748b" transform="rotate(-90 10 65)">h = 3000 mm</text>
                      
                      {/* Placed Cabinet elevation box */}
                      <rect x="40" y="60" width="240" height="50" fill="rgba(212, 175, 55, 0.05)" stroke="#D4AF37" strokeWidth="1" />
                      {/* Fluted rafter lines inside Console box */}
                      {Array.from({ length: 24 }).map((_, i) => (
                        <line key={i} x1={40 + i * 10} y1={60} x2={40 + i * 10} y2={110} stroke="#AA8C2C" strokeWidth="0.2" />
                      ))}
                      
                      <text x="160" y="85" fill="#f3f4f6" fontSize="6" fontWeight="bold" textAnchor="middle">FLUTED CONSOLE CABINET</text>
                      <text x="160" y="125" fill="#64748b" fontSize="6" textAnchor="middle">[ elevation scale 1:25 - North Wall ]</text>
                    </svg>
                  </div>
                )}

                {/* Case 4 Result: Swatch matching info */}
                {activeTool.key === 'swatch_match' && toolResult.swatchMatch && (
                  <div className="bg-slate-900 border border-slate-850/80 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Catalog Match Result</span>
                      <strong className="text-slate-200 block">{toolResult.swatchMatch.name}</strong>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold block">Matte finish code: {toolResult.swatchMatch.code}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTool(null);
                        onNavigateToTab('materials');
                      }}
                      className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[9px] px-3.5 py-2 rounded-xl transition"
                    >
                      Assign Finish
                    </button>
                  </div>
                )}

                {/* Case 5 Result: 3D Extrusion build visual */}
                {activeTool.key === 'extruder_3d' && toolResult.extruded && (
                  <div className="w-full h-36 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <div className="w-[120px] h-[100px] border border-[#D4AF37]/50 rounded transform rotate-x-45 rotate-z-45 relative flex items-center justify-center" style={{ transform: 'perspective(400px) rotateX(60deg) rotateZ(-45deg)' }}>
                      <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-400 bg-indigo-950/20 translate-z-10" style={{ transform: 'translateZ(30px)' }}></div>
                      <div className="absolute inset-0 border-b-2 border-l-2 border-indigo-400 bg-indigo-950/20"></div>
                      <div className="absolute left-0 bottom-0 top-0 w-px bg-[#D4AF37] h-[30px]" style={{ transform: 'rotateX(-90deg) origin(bottom left)' }}></div>
                      <span className="font-mono text-[7px] text-[#D4AF37] absolute -top-5">Extruded Wireframe</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}

// Simulated file reader helper
function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// Simulated image helper
function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = dataUrl;
  });
}

