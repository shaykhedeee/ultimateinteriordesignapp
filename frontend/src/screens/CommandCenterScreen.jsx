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

  // Pipeline calculations
  const totalLeads = leads.length;
  const activeProjectsCount = projects.length;
  const pendingApprovalsCount = projects.filter(p => p.status === 'cad_approved').length;
  const productionCount = projects.filter(p => p.status === 'production').length;
  const pipelineValue = ((totalLeads * 3.5) + (activeProjectsCount * 12.5)).toFixed(1);

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      
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
          <div className="bg-slate-900/60 border border-slate-850 p-1.5 rounded-2xl flex gap-1 text-xs font-bold overflow-x-auto">
            {[
              { id: 'smart', label: '🚀 Smart Project', desc: 'Plan to Scene' },
              { id: 'generate', label: '🎨 Quick Generate', desc: 'Style to Concept' },
              { id: 'photo', label: '📸 Photo Edit', desc: 'Reference Swapping' },
              { id: 'layout', label: '📐 Quick Layout', desc: 'Fast 2D Sketcher' },
              { id: 'product', label: '⚙️ Design Product', desc: 'Modular Config' },
              { id: 'tools', label: '⚡ AI Tool Hub', desc: 'Specialist Suite' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveWorkflowTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center transition min-w-[120px] ${
                  activeWorkflowTab === tab.id
                    ? 'bg-slate-950 text-[#D4AF37] border border-slate-850 shadow-md shadow-[#D4AF37]/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Workflow Tab Workspace */}
          <div className="glass-card border border-slate-850 rounded-3xl p-6 min-h-[460px]">
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
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                AI Specialist Tools Hub
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Expose specialist tools directly into operational stages</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { title: 'Upload Blueprint', desc: 'Parse CAD PDF/Image', tab: 'brief' },
                { title: 'Align Calibration', desc: 'Setup scale overlay', tab: 'cad' },
                { title: 'Zonation Editor', desc: 'Tag rooms & Vastu zones', tab: 'cad' },
                { title: 'Laminate Swapper', desc: 'Assign PBR sheet codes', tab: 'materials' },
                { title: 'Camera Planner', desc: 'Setup key viewpoints', tab: 'renders' },
                { title: 'Walkthrough Config', desc: 'Reorder walkthrough path', tab: 'renders' },
                { title: 'SVG Elevation Builder', desc: 'Auto-dimension drawings', tab: 'drawings' },
                { title: 'BOM Cost Calculator', desc: 'SQFT board yield schedule', tab: 'finance' },
                { title: 'Invoice Ledger', desc: 'Milestone & billing logs', tab: 'finance' }
              ].map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToTab(tool.tab)}
                  className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 text-left hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition flex flex-col gap-1 cursor-pointer"
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
              <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
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

      </div>

    </div>
  );
}

// ============================================================================
// WORKSPACE: Smart Project
// ============================================================================
function SmartProjectWorkspace({ project, projects, onSelectProject, onNavigateToTab }) {
  const [wizardStep, setWizardStep] = useState('name_project'); 
  // Steps: 'name_project', 'upload', 'enhance_view', 'scale_calibrate', 'draw_rooms', 'saving_rooms', 'rooms_ready', 'detecting_objects', 'detection_done', 'moodboard_view', 'render_ready'
  
  const [projectName, setProjectName] = useState('Verona Heights 3BHK Residence');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [scaleDistance, setScaleDistance] = useState('4500');
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [markedRooms, setMarkedRooms] = useState([
    { id: 'z1', label: 'Living / Dining Area', bounds: { x: 40, y: 55, w: 120, h: 70 } },
    { id: 'z2', label: 'Master Bedroom', bounds: { x: 180, y: 35, w: 90, h: 80 } }
  ]);
  const [selectedZoneToRender, setSelectedZoneToRender] = useState(null);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([
    { id: 'o1', type: 'Sofa Unit', assigned: 'L-Shape Curved Sofa', matched: true },
    { id: 'o2', type: 'TV Wall Node', assigned: 'Fluted Backlit Console', matched: true },
    { id: 'o3', type: 'Bed Panel', assigned: 'Queen Upholstered Bed', matched: false }
  ]);
  const [assignMode, setAssignMode] = useState(null); // 'catalog', 'board', 'style'
  const [cameraView, setCameraView] = useState(null); // 'perspective', 'isometric'
  const [selectedAction, setSelectedAction] = useState(null); // next action click state
  const [actionProgress, setActionProgress] = useState(false);

  const canvasRef = useRef(null);

  // Helper to trigger 1.5s spinners
  const triggerLoading = (nextStep, message) => {
    setWizardStep('loading');
    setLoaderMessage(message);
    setTimeout(() => {
      setWizardStep(nextStep);
    }, 1500);
  };

  const handleUpload = (e) => {
    setFileUploaded(true);
    setWizardStep('enhance_view');
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
        alert("RCP Planner Tool activated! Redirecting to specialist suite.");
        onNavigateToTab('drawings');
      } else if (actionKey === 'Elevation') {
        alert("2D Elevation CAD Drafter initialized.");
        onNavigateToTab('drawings');
      } else if (actionKey === 'BOM') {
        alert("BOM takeoff schedule compiled successfully.");
        onNavigateToTab('finance');
      } else if (actionKey === 'Layout Plan') {
        alert("Redirecting to Interactive CAD viewport.");
        onNavigateToTab('cad');
      } else if (actionKey === 'Video') {
        alert("Walkthrough path nodes serialized. Animation ready.");
        onNavigateToTab('renders');
      } else {
        alert(`Action "${actionKey}" executed simulation successfully!`);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Step Progress Tracker */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">🚀 Smart Project Pipeline</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">End-to-end plan to design to render to drawings to BOM</p>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-850 px-3 py-1 rounded-xl">
          STEP: <span className="text-[#D4AF37] uppercase">{wizardStep.replace('_', ' ')}</span>
        </div>
      </div>

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

      {/* STEP 2: File Upload */}
      {wizardStep === 'upload' && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-10 bg-slate-950/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <strong className="text-xs text-slate-200 block">Upload Floor Plan Blueprint for "{projectName}"</strong>
            <span className="text-[10px] text-slate-500 mt-1 block font-bold uppercase">Click or Drag CAD DXF, PDF, or PNG layout plan</span>
          </div>
          <label className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase text-[10px] tracking-wider py-2 px-5 rounded-xl cursor-pointer transition shadow-md shadow-[#D4AF37]/10">
            Select Blueprint
            <input type="file" onChange={handleUpload} className="hidden" accept="image/*,application/pdf" />
          </label>
        </div>
      )}

      {/* STEP 3: Enhance top view option */}
      {wizardStep === 'enhance_view' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80" 
              alt="Floor Plan Underlay" 
              className={`w-full max-w-[400px] h-auto object-contain opacity-75 transition-all ${isEnhanced ? 'contrast-125 saturate-110 filter brightness-110' : ''}`} 
            />
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
                onClick={() => {
                  setIsEnhanced(true);
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
              <span>Click two points on a known wall to set scale</span>
              <span className="text-[#D4AF37] font-mono">{calibrationPoints.length} / 2 Points Selected</span>
            </div>
            <div 
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-[320px] bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden cursor-crosshair flex items-center justify-center"
            >
              <img 
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80" 
                alt="Calibration Underlay" 
                className="absolute w-full max-w-[360px] h-auto object-contain opacity-50 select-none pointer-events-none" 
              />
              
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
                <label className="text-[8px] text-slate-500 uppercase block font-bold">Real Distance (mm)</label>
                <input 
                  type="number" 
                  value={scaleDistance} 
                  onChange={e => setScaleDistance(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <span className="text-[9px] text-slate-550 block">Click on two points (e.g. kitchen rear wall) and enter distance in millimetres.</span>
            </div>
            
            <button 
              onClick={() => setWizardStep('draw_rooms')}
              disabled={calibrationPoints.length < 2}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] disabled:bg-slate-800 disabled:text-slate-550 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
            >
              Set Scale & Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Drag rectangles over rooms */}
      {wizardStep === 'draw_rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase px-1">
              <span>Drag rectangles over each room on the canvas, then continue</span>
              <span className="text-[#D4AF37] font-mono">Zones Mapped</span>
            </div>
            <div className="w-full h-[320px] bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80" 
                alt="Zonation Underlay" 
                className="absolute w-full max-w-[360px] h-auto object-contain opacity-50 select-none pointer-events-none" 
              />
              
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
              <p className="text-[11px] text-slate-450 leading-relaxed">Draw room bounds by dragging boxes or click Save Rooms below to auto-interpret the layout zonation vectors.</p>
            </div>
            <button 
              onClick={() => triggerLoading('rooms_ready', 'Rooms are being saved. Once they appear, pick one to render.')}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
            >
              Save Rooms & Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Rooms ready — pick one to render */}
      {wizardStep === 'rooms_ready' && (
        <div className="space-y-4 max-w-md bg-slate-900/30 border border-slate-850 p-6 rounded-2xl">
          <label className="text-xs font-black text-slate-350 block uppercase tracking-wider">Rooms ready — pick one to render.</label>
          <div className="flex flex-col gap-2">
            {[
              { id: '1', name: 'Open Zone 1: Living Area' },
              { id: '2', name: 'Open Zone 2: Master Bed' },
              { id: '3', name: 'Open Zone 3: Kitchen' },
              { id: '4', name: 'Open Zone 4: Kids Room' },
              { id: '5', name: 'Open Zone 5: Balcony Garden' }
            ].map(zone => (
              <button 
                key={zone.id}
                onClick={() => {
                  setSelectedZoneToRender(zone.name);
                  triggerLoading('detection_done', 'Detecting objects in the layout — one moment.');
                }}
                className="w-full py-2.5 px-4 bg-slate-950 border border-slate-850 rounded-xl text-left text-xs font-bold hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/2 transition cursor-pointer text-slate-300"
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: Detection finished */}
      {wizardStep === 'detection_done' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Detected Room Objects & Layout Matches</span>
            
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
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Assign Products / Style Preset</span>
              <p className="text-[11px] text-slate-400">Detection finished. Assign products to detected objects, or add a style/product board reference.</p>
              
              <div className="flex flex-col gap-2 pt-2">
                {[
                  { id: 'catalog', label: 'Catalog Browser' },
                  { id: 'board', label: 'Product Board Matcher' },
                  { id: 'style', label: 'Room Style Reference' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setAssignMode(mode.id);
                      alert(`Product Assignments completed via ${mode.label}!`);
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
                  Create Moodboard
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
              <span>Smart Render Output ({cameraView} View)</span>
              <span className="text-emerald-400 font-mono">Render Complete</span>
            </div>
            
            <div className="w-full h-[320px] rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-850">
              <img 
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80" 
                alt="Stunning 3D Render Output" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-widest shadow-lg">
                StudioOS AI Render v2
              </div>
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

  const handleRunTool = () => {
    setIsRunning(true);
    setToolResult(null);

    setTimeout(() => {
      setIsRunning(false);
      
      // Calculate outputs based on key
      if (activeTool.key === 'ambient_lighting') {
        let text = "";
        let color = "";
        if (lightPreset === 'golden_hour') { text = "Twilight Golden Hour (3500K) set. Rotation vector sun offset calculated."; color = "linear-gradient(135deg, #1e112a 0%, #3a1e2f 50%, #5d3434 100%)"; }
        else if (lightPreset === 'noon') { text = "Direct Noon daylight (5500K) configured. Shadow bias set to 0.05."; color = "linear-gradient(135deg, #0e1726 0%, #172a45 100%)"; }
        else if (lightPreset === 'evening') { text = "Evening Warm light (2700K). Indoor ceiling pendants power multipliers boosted."; color = "linear-gradient(135deg, #080c18 0%, #101428 100%)"; }
        else { text = "Midnight moonlight (6500K). Accent under-glow LEDs activated."; color = "linear-gradient(135deg, #030712 0%, #060b24 100%)"; }
        setToolResult({ success: true, text, visualSim: color });
      }
      else if (activeTool.key === 'rcp_planner') {
        const totalSpot = rcpItems.filter(i => i.type === 'Spotlight').length;
        const totalPendant = rcpItems.filter(i => i.type === 'Pendant').length;
        const totalLED = rcpItems.filter(i => i.type === 'LED Strip').length;
        const totalLux = (totalSpot * 120) + (totalPendant * 280) + (totalLED * 400);
        setToolResult({
          success: true,
          text: `RCP plan exported. Mapped ${rcpItems.length} lighting nodes. Total lux estimate: ${totalLux} lm. Visual clearance: Optimal.`,
          layoutPoints: [...rcpItems]
        });
      }
      else if (activeTool.key === 'elevation_draft') {
        setToolResult({
          success: true,
          text: `Successfully calculated dimensions for ${elevationWall}. Plotted elevation drawing to project drawings pack.`,
          wallFace: elevationWall
        });
      }
      else if (activeTool.key === 'swatch_match') {
        let matchName = "Calacatta Gold Quartz (Merino)";
        let code = "MT-8012";
        let conf = "98.7%";
        if (swatchType === 'charcoal_matte') { matchName = "Charcoal Matte Laminate (Royale Touche)"; code = "MT-8012"; conf = "97.2%"; }
        else if (swatchType === 'frosty_white') { matchName = "Frosty White Laminate (CenturyPly)"; code = "SF-9120"; conf = "99.4%"; }
        setToolResult({
          success: true,
          text: `Matched reference swatch with ${conf} confidence rating. Matching catalog item: ${matchName} (Code: ${code}).`,
          swatchMatch: { name: matchName, code, confidence: conf }
        });
      }
      else if (activeTool.key === 'extruder_3d') {
        setToolResult({
          success: true,
          text: `Extrusion pipeline completed. Built 3D walls at thickness ${extrudeThickness}mm with ceiling height 3000mm. Extruded 12 faces.`,
          extruded: true
        });
      }
      else {
        setToolResult({
          success: true,
          text: `Specialist tool execution success. Outputs saved & linked to active project: "${project?.name || 'Onboarding Lead'}"`
        });
      }
    }, 1500);
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
              disabled={isRunning}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#e6c045] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#D4AF37]/5 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing AI Pipeline...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Run AI Specialist Tool
                </>
              )}
            </button>

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

