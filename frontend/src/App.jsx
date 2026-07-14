import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  Inbox, FileText, Compass, Palette, Sparkles, Scissors,
  BarChart3, LayoutDashboard,
  FolderOpen, ChevronDown, Activity, Zap,
  CheckCircle2, Clock, Layers, IndianRupee, BookOpen,
  TrendingUp, ArrowRight, Bell, Award, Paintbrush, Wand2,
  Archive, Database, Download, Upload, RefreshCw, ShieldCheck,
  Ruler, Box, PencilRuler, Workflow
} from 'lucide-react';

// Import Screens
import ClientBoard              from './screens/CRMLeadDashboard.jsx';
import ClientBriefStudio      from './screens/ClientBriefStudio.jsx';
import InteractiveCADScreen   from './screens/InteractiveCADScreen.jsx';
import ProjectManagementScreen from './screens/ProjectManagementScreen.jsx';
import FinanceScreen          from './screens/FinanceScreen.jsx';
import TimelineScreen         from './screens/TimelineScreen.jsx';
import JobsScreen             from './screens/JobsScreen.jsx';
import DashboardScreen          from './screens/DashboardScreen.jsx';
import AuraBrainChat          from './components/layout/AuraBrainChat.jsx';
import AiStatusBanner         from './components/shell/AiStatusBanner.jsx';
import PipelineRail           from './components/PipelineRail.jsx';

// Heavy screens are code-split (lazy) so the initial bundle stays small and fast.
const DrawingsElevationsStudio = lazy(() => import('./screens/DrawingsElevationsStudio.jsx'));
const MaterialCatalogScreen    = lazy(() => import('./screens/MaterialCatalogScreen.jsx'));
const Render3DStudio           = lazy(() => import('./screens/Render3DStudio.jsx'));
const CutlistNestingScreen     = lazy(() => import('./screens/CutlistNestingScreen.jsx'));
const DesignStudioScreen       = lazy(() => import('./screens/DesignStudioScreen.jsx'));
const VastuStudioScreen        = lazy(() => import('./screens/VastuStudioScreen.jsx'));
const DesignLibraryScreen      = lazy(() => import('./screens/DesignLibraryScreen.jsx'));
import PresentationStudio       from './screens/PresentationStudio.jsx';
import PipelineStudio            from './screens/PipelineStudio.jsx';
import DeliverablesVault         from './screens/DeliverablesVault.jsx';
import MaintenanceScreen         from './screens/MaintenanceScreen.jsx';
import CommandCenterScreen       from './screens/CommandCenterScreen.jsx';
const WhiteLabelStudio          = lazy(() => import('./screens/WhiteLabelStudio.jsx'));
const LandingPage               = lazy(() => import('./components/landing/LandingPage.jsx'));
import FloorPlanEnhancerScreen from './screens/FloorPlanEnhancerScreen.jsx';



class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Screen error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: 'var(--text-primary)', maxWidth: 640 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>Something broke on this screen</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            The panel hit a runtime error but the rest of ULTIDA is still running. You can switch tabs safely.
          </div>
          <pre style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 8, fontSize: 11, overflow: 'auto', color: '#fca5a5' }}>{String(this.state.error && this.state.error.stack || this.state.error)}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px', background: 'var(--gold)', color: '#111', border: 0, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Retry screen</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const STATUS_ORDER = ['brief','plan_review','cad_approved','scene_ready','materials_selected','renders_approved','signoff','production','billing'];

// Map a backend status (lifecycle stage) to a 0-100 progress position. Unknown
// statuses fall back to the last known stage so the bar never jumps to 0.
const STATUS_PROGRESS = {
  brief: 5,
  plan_review: 18,
  cad_approved: 30,
  scene_ready: 45,
  materials_selected: 60,
  renders_approved: 72,
  signoff: 82,
  production: 90,
  billing: 100
};

const NAV_CONFIG = [
  {
    title: 'Studio Control',
    items: [
      { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, shortcut: '⌘1', alwaysOn: true }
    ]
  },
  {
    title: 'Client Acquisition',
    items: [
      { id: 'crm',      label: 'Client Board',      icon: Inbox,     shortcut: '⌘2', alwaysOn: true },
      { id: 'projects', label: 'Project Pipeline',     icon: BarChart3, shortcut: '⌘3', alwaysOn: true }
    ]
  },
  {
    title: 'Spatial Design',
    items: [
      { id: 'brief',    label: 'Client Intake',        icon: FileText,    shortcut: null },
      { id: 'cad',      label: 'Plan Intelligence',    icon: Ruler,       shortcut: null },
      { id: 'studio',   label: 'Editable 3D Scene',    icon: Box,         shortcut: null },
      { id: 'vastu',    label: 'Vastu Studio',         icon: Compass,     shortcut: null },
      { id: 'enhancer', label: 'Floor Plan Enhancer',  icon: Wand2,       shortcut: null },
      { id: 'drawings', label: 'Drawings & Elevations', icon: PencilRuler, shortcut: null, staleFlag: 'stale_drawings' }
    ]
  },
  {
    title: 'Visualization',
    items: [
      { id: 'renders',  label: 'Render Studio',        icon: Sparkles,    shortcut: null, staleFlag: 'stale_renders' },
      { id: 'designlib',label: 'Design Library',       icon: BookOpen,    shortcut: null, alwaysOn: true },
      { id: 'jobs',     label: 'Background Jobs',      icon: Clock,       shortcut: null }
    ]
  },
  {
    title: 'Production & Commerce',
    items: [
      { id: 'materials',     label: 'Materials Catalog',   icon: Palette,      shortcut: null, staleFlag: 'stale_pricing' },
      { id: 'cutlist',       label: 'Cutlist & Nesting',   icon: Scissors,     shortcut: null },
      { id: 'finance',       label: 'Commerce & Quotes',   icon: IndianRupee,  shortcut: null },
      { id: 'timeline',      label: 'Project Timeline',    icon: Activity,     shortcut: null }
    ]
  },
  {
    title: 'Client Delivery',
    items: [
      { id: 'presentation',  label: 'Presentation Pack',   icon: Award,        shortcut: null },
      { id: 'pipeline',      label: 'Pipeline Studio',     icon: Workflow,    shortcut: null },
      { id: 'vault',         label: 'Deliverables Vault',  icon: Archive,      shortcut: null },
      { id: 'brand',         label: 'Brand Studio',        icon: Paintbrush,   shortcut: null }
    ]
  },
  {
    title: 'Studio Ops',
    items: [
      { id: 'maintenance',   label: 'Backup & Restore',    icon: Database,     shortcut: null }
    ]
  }
];

const ALL_NAV_ITEMS = NAV_CONFIG.flatMap(s => s.items);

const WORKFLOW_SPINE = [
  { id: 'brief', label: 'Intake', detail: 'Client questions' },
  { id: 'cad', label: 'Plan', detail: 'Floor plan model' },
  { id: 'studio', label: 'Scene', detail: 'Editable 3D truth' },
  { id: 'drawings', label: 'Docs', detail: 'Elevations' },
  { id: 'renders', label: 'Renders', detail: 'Client visuals' },
  { id: 'materials', label: 'Budget', detail: 'Materials + quote' },
  { id: 'cutlist', label: 'Production', detail: 'Cutlist + nesting' }
];

const WORKFLOW_SPECIALISTS = {
  brief: [
    { key: 'cad_ingest', name: 'Plan Ingest Interpreter' },
    { key: 'swatch_match', name: 'AI Swatch Matcher' }
  ],
  cad: [
    { key: 'ortho_calibrate', name: 'Auto Scale Calibrator' },
    { key: 'vastu_annotate', name: 'Vastu & Room Annotator' }
  ],
  studio: [
    { key: 'extruder_3d', name: '2D-to-3D Extruder' }
  ],
  drawings: [
    { key: 'elevation_draft', name: '2D Elevation Drafter' },
    { key: 'rcp_planner', name: 'RCP Planner' },
    { key: 'dxf_compiler', name: 'DXF Exporter' }
  ],
  renders: [
    { key: 'render_concept', name: 'Concept Generator' },
    { key: 'camera_director', name: 'Camera Planner' },
    { key: 'material_swapper', name: 'Material Swapper' },
    { key: 'ambient_lighting', name: 'Ambient Vector Shifter' },
    { key: 'walkthrough_animator', name: 'Walkthrough Animator' }
  ],
  materials: [
    { key: 'swatch_match', name: 'AI Swatch Matcher' },
    { key: 'carcass_config', name: 'BOM Calculator' }
  ],
  cutlist: [
    { key: 'carcass_config', name: 'Parametric Cabinet Builder' },
    { key: 'hardware_spec', name: 'Hardware Allocator' },
    { key: 'nesting_calc', name: 'Nesting Calculator' }
  ]
};

const TAB_META = {
  dashboard: { title: 'Command Center',    sub: 'Workspace overview & AI orchestration hub' },
  crm:       { title: 'Client Board',  sub: 'Track every client through the deal pipeline — designs sent, tokens paid, closing' },
  projects:  { title: 'Project Pipeline',  sub: 'Active projects, kanban workflow & status tracking' },
  brief:     { title: 'Client Intake',      sub: 'Capture lifestyle, budget, rooms, references and floor plan uploads' },
  cad:       { title: 'Plan Intelligence', sub: 'Review rooms, walls, openings, scale, services and confidence' },
  studio:    { title: 'Editable 3D Scene', sub: 'Place parametric modules from one spatial source of truth' },
  vastu:     { title: 'Vastu Studio',       sub: 'Scan the floor plan & auto-suggest compliant placement for every furniture item' },
  drawings:  { title: 'Drawings & Elevations', sub: 'Annotated wall drawings, cabinet elevations and DXF exports' },
  materials: { title: 'Materials Catalog', sub: 'Select laminates, hardware fittings & estimate costs' },
  renders:   { title: '3D AI Render Studio', sub: 'Generate photorealistic renders with Vastu insights' },
  cutlist:   { title: 'Cutlist & Nesting', sub: 'Calculate precise panel cuts & optimise sheet nesting' },
  finance:       { title: 'Commerce & Quotes',   sub: 'Proposals, GST invoices, payment tracking' },
  timeline:      { title: 'Project Timeline',    sub: 'Activity log, milestone events & audit trail' },
  jobs:          { title: 'Background Jobs',     sub: 'Rendering pipeline monitor & async job queue' },
  presentation:  { title: 'Presentation Pack',   sub: 'Client-ready delivery package and narrative' },
  pipeline:      { title: 'Pipeline Studio',     sub: 'End-to-end sequential generation per your required flow' },
  vault:         { title: 'Deliverables Vault',  sub: 'Every brief, cutlist, DXF and render — reopen, audit, download' },
  maintenance:   { title: 'Backup & Restore',    sub: 'Full studio backup, restore, preflight and demo reset' }
};

// ── Status color map ──
const STATUS_COLOR = {
  brief:             '#60A5FA',
  cad_approved:      '#34D399',
  materials_selected:'#A78BFA',
  renders_approved:  '#F59E0B',
  production:        '#F97316',
  billing:           '#C9A84C'
};

export function App() {
  const [view, setView] = useState(() => (location.hash === '#view=landing' ? 'landing' : 'studio'));
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('ultida_tab') || 'dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('ultida_project') || null);
  const [projectsList, setProjectsList]   = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAuraOpen, setIsAuraOpen]       = useState(false);
  const [isAuraThinking, setIsAuraThinking] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [currentTime, setCurrentTime]     = useState(new Date());
  const [activeJobs, setActiveJobs]       = useState([]);
  const [prevJobCount, setPrevJobCount]   = useState(0);
  const [apiOnline, setApiOnline]         = useState(true);
  const [stats, setStats] = useState({ totalLeads:0, qualifiedLeads:0, activeProjects:0, conversionPct:0 });
  const [chatMessages, setChatMessages] = useState([{
    id:'1', sender:'aura',
    text:"Hello! I am AURA — your AI design co-pilot. I can help with elevations, renders, floorplan detection, cutlist, budget optimisation, and client handoff. Pick a project and choose an action to execute directly.",
    timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  }]);
  // AURA structured design proposals (rules-engine, /api/aura/propose) — surfaced
  // as cards so the user sees concrete, grounded actions (sofa sizing, mesh-basket
  // ordering, Vastu, elevation standard, correction reverts) per the AURA plan.
  const [auraProposals, setAuraProposals] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ── Lightweight toast (replaces 100+ native alert/confirm calls) ─────────
  const toast = useRef(null);
  const showToast = (text, kind = 'info') => {
    if (!toast.current) {
      toast.current = document.createElement('div');
      toast.current.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:99999;min-width:240px;max-width:420px;';
      const inner = document.createElement('div');
      inner.style.cssText = `margin-top:8px;padding:10px 14px;border-radius:12px;font:12px/1.45 system-ui,-apple-system,sans-serif;color:#fff;background:rgba(17,24,39,0.95);border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(8px);box-shadow:0 12px 30px rgba(0,0,0,0.35);display:flex;align-items:center;gap:10px;`;
      toast.current.appendChild(inner);
      document.body.appendChild(toast.current);
      toast.current._inner = inner;
    }
    const colors = {error:'#EF4444', warn:'#F59E0B', info:'#6366f1', success:'#10B981'};
    const dot = document.createElement('span'); dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:'+(colors[kind]||colors.info)+';flex-shrink:0;';
    const msg = document.createElement('span'); msg.style.cssText = 'flex:1;';
    const btn = document.createElement('button'); btn.textContent='✕'; btn.style.cssText='opacity:.7;background:none;border:none;color:#fff;cursor:pointer;font-size:12px;padding:0 2px;';
    btn.onclick = () => {(toast.current._inner.innerHTML=''); toast.current._inner.style.opacity='0'; setTimeout(()=>toast.current?.remove(),240);};
    const w = toast.current._inner; w.innerHTML=''; w.appendChild(dot); w.appendChild(msg); w.appendChild(btn);
    msg.textContent = text;
    toast.current._inner.style.opacity='1';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {(toast.current._inner.innerHTML=''); toast.current._inner.style.opacity='0'; setTimeout(()=>toast.current?.remove(),240);}, 3800);
  };

  // Tear down helper
  const mixer = { info: showToast, error: (m)=>showToast(m,'error'), warn: (m)=>showToast(m,'warn'), success: (m)=>showToast(m,'success') };

  // Inject global listeners so legacy code can still call native helpers but get non-blocking UI
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => { mixer.error(typeof msg === 'string' ? msg : String(msg)); };
    const confirm = (title, message) => new Promise((resolve)=>{
      const root = document.getElementById('root');
      const el = document.createElement('div');
      el.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70';
      el.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl w-full max-w-sm m-4"><div class="text-sm font-bold text-slate-100">${title}</div><div class="text-xs text-slate-400 mt-1">${message}</div><div class="mt-4 flex gap-2 justify-end"><button id="aura-confirm-yes" class="px-3 py-1.5 bg-[var(--gold)] text-slate-950 font-black text-xs rounded-lg">Confirm</button><button id="aura-confirm-no" class="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">Cancel</button></div></div>`;
      root?.appendChild(el);
      el.querySelector('#aura-confirm-yes')?.addEventListener('click', () => { el.remove(); resolve(true); });
      el.querySelector('#aura-confirm-no')?.addEventListener('click', () => { el.remove(); resolve(false); });
    });
    window.__auraConfirm = { confirm, open: (title, message, callback) => new Promise((resolve) => {
      const fallback = typeof callback === 'function' ? () => callback('') : null;
      const input = document.createElement('input');
      input.value = '';
      input.placeholder = message || title || '';
      input.className = 'w-full mt-2 p-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-[var(--gold)]';
      const close = () => { root?.contains(el) && root.removeChild(el); resolve(fallback ? fallback(input.value) : input.value); };
      const root = document.getElementById('root');
      const el = document.createElement('div');
      el.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70';
      el.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl w-full max-w-sm m-4"><div class="text-sm font-bold text-slate-100">${title}</div><div class="text-xs text-slate-400 mt-1">${message}</div>${input.outerHTML}<div class="mt-4 flex gap-2 justify-end"><button id="aura-open-ok" class="px-3 py-1.5 bg-[var(--gold)] text-slate-950 font-black text-xs rounded-lg">Continue</button><button id="aura-open-cancel" class="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">Cancel</button></div></div>`;
      root?.appendChild(el);
      setTimeout(() => input.focus(), 0);
      el.querySelector('#aura-open-ok')?.addEventListener('click', () => close());
      el.querySelector('#aura-open-cancel')?.addEventListener('click', () => { root?.contains(el) && root.removeChild(el); resolve(fallback ? fallback('') : ''); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(); if (e.key === 'Escape') { root?.contains(el) && root.removeChild(el); resolve(fallback ? fallback('') : ''); } });
    }) };
    window.__toast = mixer;
    return () => { window.alert = originalAlert; delete window.__toast; delete window.__auraConfirm; };
  }, []);

  const pickerRef = useRef(null);

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Persist tab / project ──
  useEffect(() => { localStorage.setItem('ultida_tab', activeTab); }, [activeTab]);
  useEffect(() => {
    if (selectedProjectId) localStorage.setItem('ultida_project', selectedProjectId);
    else localStorage.removeItem('ultida_project');
  }, [selectedProjectId]);

  // ── Hash routing (landing vs studio) ──
  useEffect(() => {
    const sync = () => {
      const h = location.hash;
      if (h === '#view=landing') setView('landing');
      else if (h === '#view=studio') setView('studio');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const goLanding = (v) => { setView(v); location.hash = v === 'landing' ? '#view=landing' : '#view=studio'; };

  // ── Global nav event ──
  useEffect(() => {
    const fn = e => e.detail && setActiveTab(e.detail);
    window.addEventListener('navigate-to-tab', fn);
    return () => window.removeEventListener('navigate-to-tab', fn);
  }, []);

  // ── Global project selection event ──
  useEffect(() => {
    const fn = e => e.detail && setSelectedProjectId(e.detail);
    window.addEventListener('select-project', fn);
    return () => window.removeEventListener('select-project', fn);
  }, []);

  // ── Global whitelabel/branding event ──
  useEffect(() => {
    const fn = async () => {
      try {
        const [settingsRes, brandRaw] = await Promise.all([
          fetch('/api/settings/app-settings'),
          fetch('/api/settings/app-settings')
        ]);
        const settings = (await settingsRes.json())?.settings || {};
        const b = {
          studioName: settings.studio_name || localStorage.getItem('ultida_whitelabel') ? JSON.parse(localStorage.getItem('ultida_whitelabel') || '{}').studioName || '' : '',
          tagline: settings.tagline || '',
          logoText: settings.logo_text || '',
          accentColor: settings.accent_color || '#C9A84C'
        };
        window.__ultidaBrand = b;
        localStorage.setItem('ultida_whitelabel', JSON.stringify(b));
        window.dispatchEvent(new CustomEvent('ultida-update-branding', { detail: b }));
      } catch {
        localStorage.removeItem('ultida_whitelabel');
      }
    };
    fn();
    const onUpdate = () => fn();
    window.addEventListener('ultida-update-branding', onUpdate);
    return () => window.removeEventListener('ultida-update-branding', onUpdate);
  }, []);

  // ── Close picker on outside click ──
  useEffect(() => {
    const fn = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowProjectPicker(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Resolve selectedProject from list ──
  useEffect(() => {
    if (selectedProjectId && projectsList.length > 0) {
      setSelectedProject(projectsList.find(p => p.id === selectedProjectId) || null);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, projectsList]);

  // ── Data fetch ──
  useEffect(() => { fetchData(); }, [activeTab, selectedProjectId]);

  // ── Background jobs poll ──
  useEffect(() => {
    if (!selectedProjectId) { setActiveJobs([]); return; }
    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/jobs`);
        if (res.ok) { const d = await res.json(); const jobs = Array.isArray(d) ? d : Array.isArray(d?.jobs) ? d.jobs : []; setActiveJobs(jobs.filter(j => j.status === 'running')); }
      } catch {}
    };
    fetchJobs();
    const id = setInterval(fetchJobs, 3500);
    return () => clearInterval(id);
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeJobs.length === 0 && prevJobCount > 0) fetchData();
    setPrevJobCount(activeJobs.length);
  }, [activeJobs]);

  const fetchData = async () => {
    try {
      const [leadsRes, projRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/projects')
      ]);
      setApiOnline(leadsRes.ok);
      const leads    = leadsRes.ok ? await leadsRes.json() : [];
      const projects = projRes.ok  ? await projRes.json()  : [];
      setProjectsList(projects);
      if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
      const closed = leads.filter(l => l.voice_status === 'human_closed').length;
      setStats({
        totalLeads:     leads.length,
        qualifiedLeads: leads.filter(l => ['qualified','human_closed'].includes(l.voice_status)).length,
        activeProjects: projects.length,
        conversionPct:  leads.length > 0 ? ((closed / leads.length)*100).toFixed(0) : 0
      });
    } catch { setApiOnline(false); }
  };

  // ── Project progress ──
  const getStepIndex = (proj) => {
    if (!proj) return 0;
    return STATUS_PROGRESS[proj.status] ?? STATUS_PROGRESS.brief;
  };
  const stepIndex = getStepIndex(selectedProject);
  const stepPct   = Math.min(stepIndex, 100);

  // ── AURA chat ──
  const AURA_API = '/api/aura/chat';
  const handleSendMessage = async (text) => {
    const userMsg = { id:`u-${Date.now()}`, sender:'user', text, timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) };
    setChatMessages(p => [...p, userMsg]);
    setIsAuraThinking(true);
    try {
      const res = await fetch(AURA_API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text, projectId: selectedProjectId }) });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'AURA request failed');
      const reply = data.reply || { text: 'No response', toolCalls: [] };
      setChatMessages(p => [...p, { id: reply.id || `a-${Date.now()}`, sender:'aura', timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), text: reply.text, toolCalls: reply.toolCalls || [], intent: reply.intent || null, llmPowered: Boolean(reply.llmPowered), model: reply.model || null }]);
      // Keep the structured proposal panel in sync — re-run the rules engine for
      // the active project after each turn (grounded, never invents dimensions).
      handlePropose(text);
    } catch (err) {
      setChatMessages(p => [...p, { id:`a-${Date.now()}`, sender:'aura', timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), text:`AURA is temporarily unreachable: ${err.message}. Using offline mode.`, toolCalls:[], intent:null }]);
      window.__toast?.warn(err.message || 'AURA offline');
    } finally {
      setIsAuraThinking(false);
    }
  };

  const handleExecuteAction = async (actionId, preview) => {
    if (preview?.costImpact && selectedProject) setSelectedProject(p => ({...p, total_cost: Math.max(0,(p.total_cost||0)+preview.costImpact)}));
    try { window.__toast?.success(`AURA → ${preview?.title || actionId}`); } catch {}
    const navMap = { openElevationGenerator:'drawings', generateFromLastWall:'drawings', openRenderStudio:'renders', regenerateLastRender:'renders', renderFromAngle:'renders', runAiDetect:'cad', runCvTrace:'cad', refreshCutlist:'cutlist', openCutlist:'cutlist', openPresentation:'presentation', generateQuotation:'presentation', openMaterials:'materials', optimizeCutlist:'cutlist', openJobs:'jobs', openVastu:'vastu', openCad:'cad', applyVastuFixes:'vastu' };
    const target = navMap[actionId];
    if (['generateFromLastWall','runAiDetect','runCvTrace','refreshCutlist','generateQuotation','optimizeCutlist'].includes(actionId)) {
      // Map to REAL backend routes (verified against server/index.js).
      const routeMap = {
        generateFromLastWall: `/api/projects/${selectedProjectId}/drawings/elevations/auto/dxf`, // GET download
        runAiDetect:         `/api/projects/${selectedProjectId}/cad/ai-detect`,                  // POST
        runCvTrace:          `/api/projects/${selectedProjectId}/cad/ai-detect`,                  // POST (cv-trace → ai-detect)
        refreshCutlist:      `/api/projects/${selectedProjectId}/cutlist/refresh`,                // POST
        generateQuotation:   `/api/projects/${selectedProjectId}/client-share?pack=quotation`,   // POST
        optimizeCutlist:     `/api/projects/${selectedProjectId}/cutlist/calculate`              // POST
      };
      const route = routeMap[actionId];
      if (!route) { if (target) setActiveTab(target); return; }
      const isGet = actionId === 'generateFromLastWall';
      if (isGet) {
        // File-download actions (e.g. DXF) should open the URL so the browser
        // saves the file rather than having fetch consume the bytes silently.
        const a = document.createElement('a');
        a.href = `${route}`;
        a.download = '';
        document.body.appendChild(a); a.click(); a.remove();
        window.__toast?.success(`AURA → ${preview?.title || actionId} — download started`);
        if (target) setActiveTab(target);
        return;
      }
      const opts = { method: 'POST', headers:{'Content-Type':'application/json'} };
      try {
        const res = await fetch(`${route}`, opts);
        if (!res.ok) {
          let msg = `${res.status} on ${route}`;
          try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
          window.__toast?.error(`AURA action failed: ${msg}`);
        } else {
          window.__toast?.success(`AURA → ${preview?.title || actionId} done`);
          if (target) setActiveTab(target);
        }
      } catch (e) {
        window.__toast?.error(e.message || 'AURA action failed');
      }
      return;
    }
    if (target) setActiveTab(target);
    window.dispatchEvent(new CustomEvent('aura-execute-action', { detail: { actionId, preview } }));
  };

  // AURA structured proposal engine — calls /api/aura/propose (rules + retrieval)
  // and stores grounded design actions for the active project. Trigger explicitly
  // via "propose / review / check my design", or after any chat turn so the panel
  // stays current. Never invents dimensions — actions derive from the real scene.
  const handlePropose = async (message = '') => {
    if (!selectedProjectId) { setAuraProposals(null); return; }
    try {
      const res = await fetch('/api/aura/propose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, message })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setAuraProposals({
          actions: Array.isArray(data.actions) ? data.actions : [],
          rules: Array.isArray(data.rules) ? data.rules : [],
          retrieved: data.retrieved || {},
          generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch { /* non-fatal — proposals are best-effort */ }
  };

  // Route a structured AURA proposal to the relevant screen (no geometry authoring —
  // AURA only proposes; the user executes in the real editor).
  const handleProposalAction = (proposal) => {
    const map = {
      regenerate_elevation: 'drawings',
      revert_material:      'materials',
      resize_furniture:     'cad',
      reposition_component:  'cad',
      move_room:            'cad',
    };
    const target = map[proposal.action];
    window.__toast?.success(`AURA proposes: ${proposal.reasoning || proposal.action}`);
    if (target) setActiveTab(target);
  };

  useEffect(() => {
    const handler = (e) => {
      const { actionId } = e.detail || {};
      handleExecuteAction(actionId, {});
    };
    window.addEventListener('aura-execute-action', handler);
    return () => window.removeEventListener('aura-execute-action', handler);
  }, []);

  const handleProjectClosed = (projectId) => {
    setSelectedProjectId(projectId);
    fetchData();
    setTimeout(() => setActiveTab('brief'), 700);
  };

  // Canonical workflow spine — every "Complete" button advances here AND syncs
  // the backend current_step so the progress bar + AI co-pilot stay coherent.
  const NEXT_TAB = { brief:'cad', cad:'studio', studio:'drawings', drawings:'renders', renders:'materials', materials:'cutlist', cutlist:'finance', finance:'presentation', presentation:'presentation' };
  const advance = (tab) => {
    if (selectedProjectId && tab) {
      fetch(`/api/projects/${selectedProjectId}/advance-step`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ step: tab })
      }).catch(()=>{});
    }
    setActiveTab(tab);
  };

  // ── Screen router ──
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <CommandCenterScreen projectId={selectedProjectId} onNavigateToTab={setActiveTab} />;
      case 'crm':       return <ClientBoard onProjectCreated={handleProjectClosed} />;
      case 'projects':  return <ProjectManagementScreen onNavigateToProject={(id) => { setSelectedProjectId(id); setActiveTab('brief'); }} />;
      case 'brief':     return <ClientBriefStudio projectId={selectedProjectId} onBriefSaved={() => advance('cad')} />;
      case 'cad':       return <InteractiveCADScreen projectId={selectedProjectId} onComplete={() => advance('studio')} />;
      case 'studio':    return <DesignStudioScreen projectId={selectedProjectId} onComplete={() => advance('drawings')} />;
      case 'vastu':     return <VastuStudioScreen projectId={selectedProjectId} onApplyDone={() => advance('cad')} />;
      case 'enhancer': return <FloorPlanEnhancerScreen projectId={selectedProjectId} onApplied={() => fetchData()} />;
      case 'drawings':  return <DrawingsElevationsStudio projectId={selectedProjectId} onComplete={() => advance('renders')} />;
      case 'materials': return <MaterialCatalogScreen projectId={selectedProjectId} onComplete={() => advance('cutlist')} />;
      case 'renders':   return <Render3DStudio projectId={selectedProjectId} onComplete={() => advance('materials')} />;
      case 'designlib':  return <DesignLibraryScreen onUseInspiration={(cat) => { setActiveTab('renders'); }} />;
      case 'cutlist':   return <CutlistNestingScreen projectId={selectedProjectId} onComplete={() => advance('finance')} />;
      case 'finance':       return <FinanceScreen projectId={selectedProjectId} onComplete={() => advance('presentation')} />;
      case 'timeline':      return <TimelineScreen projectId={selectedProjectId} />;
      case 'jobs':          return <JobsScreen projectId={selectedProjectId} />;
      case 'presentation':  return <PresentationStudio projectId={selectedProjectId} />;
      case 'pipeline':      return <PipelineStudio projectId={selectedProjectId} />;
      case 'brand':         return <WhiteLabelStudio onBack={() => setActiveTab('dashboard')} />;
      case 'vault':         return <DeliverablesVault />;
      case 'maintenance':   return <MaintenanceScreen />;
      default:              return <ClientBoard onProjectCreated={handleProjectClosed} />;
    }
  };

  // ── Landing (public marketing surface) ──
  if (view === 'landing') {
    return (
      <Suspense fallback={<div style={{ padding:40, color:'var(--text-secondary)' }}>Loading…</div>}>
        <LandingPage onEnterApp={() => goLanding('studio')} />
      </Suspense>
    );
  }

  const meta = TAB_META[activeTab] || {};

  // ── STAT CONFIG ──
  const statConfig = [
    { label:'Leads',     value: stats.totalLeads,     color:'#9896A8' },
    { label:'Projects',  value: stats.activeProjects,  color:'#C9A84C' },
    { label:'Qualified', value: stats.qualifiedLeads,  color:'#2DD4AA' },
    { label:'Win %',     value:`${stats.conversionPct}%`, color:'#60A5FA' }
  ];

  return (
    <div className="h-screen w-screen text-slate-100 flex overflow-hidden font-sans" style={{ background:'var(--base-100)' }}>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className="sidebar-chrome">

        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(8,8,8,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <div className="sidebar-logo-wordmark">
            <span className="sidebar-logo-title">ULTIDA</span>
            <span className="sidebar-logo-sub">Interior Design OS</span>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="sidebar-stats">
          {statConfig.map((s, i) => (
            <div key={i} className="sidebar-stat-cell">
              <span className="sidebar-stat-label">{s.label}</span>
              <strong className="sidebar-stat-value" style={{ color: s.color }}>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">
          {NAV_CONFIG.map((section, si) => {
            const needsProject = section.items.some(item => !item.alwaysOn);
            return (
              <div key={si}>
                <div className="nav-section-title">{section.title}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                  {section.items.map(item => {
                    const Icon     = item.icon;
                    const disabled = !item.alwaysOn && !selectedProjectId;
                    const isActive = activeTab === item.id;
                    const isStale  = item.staleFlag && selectedProject?.[item.staleFlag] === 1;
                    const navIdx   = ALL_NAV_ITEMS.findIndex(n => n.id === item.id);
                    const isDone   = !disabled && item.id !== 'crm' && item.id !== 'dashboard' && stepIndex > navIdx;

                    return (
                      <button
                        key={item.id}
                        data-testid={`nav-${item.id}`}
                        disabled={disabled}
                        onClick={() => !disabled && setActiveTab(item.id)}
                        className={`nav-item${isActive ? ' active' : ''}`}
                      >
                        <span className="nav-icon-chip"><Icon className="nav-icon" style={{ width:14, height:14 }} /></span>
                        <span style={{ flex:1, textAlign:'left', fontSize:'11px', fontWeight: isActive ? 700 : 600 }}>
                          {item.label}
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                          {isStale && (
                            <span className="badge-stale">Stale</span>
                          )}
                          {isDone && !isStale && (
                            <CheckCircle2 style={{ width:11, height:11, color:'var(--emerald)', opacity:0.8 }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Project Progress ── */}
        {selectedProject && (
          <div className="sidebar-project-card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontSize:'8px', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' }}>
                Active Project
              </span>
              <span style={{ fontSize:'10px', fontWeight:800, color:'var(--gold)' }}>{stepPct}%</span>
            </div>
            <div className="progress-bar-track" style={{ marginBottom:'8px' }}>
              <div className="progress-bar-fill" style={{ width:`${stepPct}%` }} />
            </div>
            <div style={{ fontSize:'11px', fontWeight:700, color:'var(--text-primary)', marginBottom:'2px' }} className="truncate">
              {selectedProject.name}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: STATUS_COLOR[selectedProject.status] || 'var(--gold)', display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:'9.5px', color:'var(--text-muted)', fontWeight:600, textTransform:'capitalize' }}>
                {(selectedProject.status||'Onboarding').replace(/_/g,' ')}
              </span>
            </div>
          </div>
        )}

        {/* ── Live Jobs ── */}
        {activeJobs.length > 0 && (
          <div className="sidebar-project-card" style={{ marginTop:0, background:'rgba(201,168,76,0.04)', borderColor:'rgba(201,168,76,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', animation:'pulse 1.5s infinite', display:'inline-block' }} />
              <span style={{ fontSize:'8px', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)' }}>
                Live Jobs
              </span>
              <span style={{ marginLeft:'auto', fontSize:'9px', fontWeight:800, color:'var(--text-muted)' }}>{activeJobs.length}</span>
            </div>
            {activeJobs.slice(0,3).map(job => (
              <div key={job.id} style={{ marginBottom:'6px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', fontWeight:700, color:'var(--text-secondary)', marginBottom:'3px' }}>
                  <span className="truncate" style={{ maxWidth:'80%' }}>{(job.job_type||'').replace(/_/g,' ')}</span>
                  <span style={{ color:'var(--gold)', fontFamily:'monospace' }}>{job.progress}%</span>
                </div>
                <div className="progress-bar-track" style={{ height:'2px' }}>
                  <div className="progress-bar-fill" style={{ width:`${job.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pipeline Rail: the whole design→delivery journey, always visible ── */}
        {selectedProject && (
          <PipelineRail activeTab={activeTab} stepIndex={stepIndex} onNavigate={(id) => setActiveTab(id)} />
        )}

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: apiOnline ? 'var(--emerald)' : '#f87171', flexShrink:0 }} />
            <span style={{ fontSize:'9.5px', fontWeight:600, color:'var(--text-muted)' }}>
              {apiOnline ? 'Sharma Workshop · Online' : 'API Offline'}
            </span>
          </div>
          <div style={{ fontSize:'8px', fontFamily:'monospace', color:'rgba(201,168,76,0.3)', letterSpacing:'0.15em', textTransform:'uppercase' }}>
            ULTIDA Core v3.0
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* ── Top Header ── */}
        <header className="app-header">
          {/* Left: Title + Project Picker */}
          <div className="app-header-left" style={{ display:'flex', alignItems:'center', gap:'16px', minWidth:0 }}>
            <div>
              <div className="header-title">{meta.title || ''}</div>
              {meta.sub && <div className="header-subtitle">{meta.sub}</div>}
            </div>

            {projectsList.length > 0 && (
              <div style={{ position:'relative' }} ref={pickerRef}>
                <button
                  onClick={() => setShowProjectPicker(v => !v)}
                  className="project-selector-btn"
                >
                  <FolderOpen style={{ width:13, height:13, color:'var(--gold)', flexShrink:0 }} />
                  <span style={{ maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selectedProject?.name || 'Select Project'}
                  </span>
                  <ChevronDown style={{ width:12, height:12, flexShrink:0, transition:'transform 0.2s', transform: showProjectPicker ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {showProjectPicker && (
                  <div className="project-dropdown">
                    <div style={{ padding:'8px 14px 6px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:'9px', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>
                        {projectsList.length} Projects
                      </span>
                    </div>
                    {projectsList.map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => { setSelectedProjectId(proj.id); setShowProjectPicker(false); }}
                        className={`project-dropdown-item${proj.id === selectedProjectId ? ' selected' : ''}`}
                      >
                        <div style={{ width:8, height:8, borderRadius:'50%', background: STATUS_COLOR[proj.status] || '#5C5C72', flexShrink:0 }} />
                        <div style={{ minWidth:0 }}>
                          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{proj.name}</div>
                          <div style={{ fontSize:'9px', color:'var(--text-muted)', fontWeight:500, marginTop:'1px', textTransform:'capitalize' }}>
                            {(proj.status||'onboarding').replace(/_/g,' ')}
                          </div>
                        </div>
                        {proj.id === selectedProjectId && (
                          <CheckCircle2 style={{ width:12, height:12, color:'var(--gold)', marginLeft:'auto', flexShrink:0 }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="app-header-actions" style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            {/* Public-site pill */}
            <button
              onClick={() => goLanding('landing')}
              title="View public marketing site"
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 10px', borderRadius:9, border:'1px solid rgba(255,255,255,0.10)', color:'var(--text-secondary)', fontSize:'11px', fontWeight:600, cursor:'pointer', background:'transparent' }}
            >
              <ArrowRight style={{ width:12, height:12 }} /> Public site
            </button>

            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.07)' }} />

            {/* AURA toggle */}
            <button
              onClick={() => setIsAuraOpen(v => !v)}
              aria-label="Open AURA AI assistant"
              title="AURA AI assistant"
              className={`aura-btn ${isAuraOpen ? 'aura-btn-active' : 'aura-btn-idle'}`}
            >
              <Zap style={{ width:14, height:14 }} />
              <span>AURA AI</span>
              {isAuraOpen && <span style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.6)', display:'inline-block' }} />}
            </button>

            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.07)' }} />

            {/* API status */}
            <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <Activity style={{ width:13, height:13, color: apiOnline ? 'var(--emerald)' : '#f87171' }} />
              <span style={{ fontSize:'11px', fontWeight:600, color: apiOnline ? 'var(--emerald)' : '#f87171' }}>
                {apiOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.07)' }} />

            {/* Date / time */}
            <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>
              {currentTime.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
            </span>

            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.07)' }} />

            {/* Avatar */}
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'11px', fontWeight:900, color:'#060609',
              boxShadow:'0 0 0 2px rgba(201,168,76,0.25)',
              cursor:'pointer', flexShrink:0
            }}>
              A
            </div>
          </div>
        </header>

        {/* ── Screen + AURA Panel ── */}
        <div
          style={{ flex:1, display:'flex', overflow:'hidden', background:'var(--base-100)' }}
          onClick={() => showProjectPicker && setShowProjectPicker(false)}
        >
          <div style={{ flex:1, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
            <div className="workflow-spine">
              {WORKFLOW_SPINE.map((step, index) => {
                const active = activeTab === step.id;
                const visited = WORKFLOW_SPINE.findIndex(s => s.id === activeTab) >= index;
                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!selectedProjectId}
                    onClick={() => selectedProjectId && setActiveTab(step.id)}
                    className={`workflow-spine-step${active ? ' active' : ''}${visited ? ' visited' : ''}`}
                  >
                    <span className="workflow-spine-index">{index + 1}</span>
                    <span className="workflow-spine-copy">
                      <strong>{step.label}</strong>
                      <small>{step.detail}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="workflow-screen">
              {/* Dynamic Specialist Tool Suggestions */}
              {WORKFLOW_SPECIALISTS[activeTab] && selectedProjectId && (
                <div className="mb-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--gold)] text-xs">✨</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Recommended for this step:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {WORKFLOW_SPECIALISTS[activeTab].map(tool => (
                      <button
                        key={tool.key}
                        onClick={() => {
                          setActiveTab('dashboard');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('open-specialist-tool', { detail: tool.key }));
                          }, 100);
                        }}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-[var(--gold)]/50 text-[9px] font-extrabold uppercase text-slate-300 hover:text-[var(--gold)] rounded-lg transition"
                      >
                        ⚡ {tool.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading…</div>}>
                <ErrorBoundary>
                {renderScreen()}
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>

          <AuraBrainChat
            messages={chatMessages}
            proposals={auraProposals}
            onSendMessage={handleSendMessage}
            onExecuteAction={handleExecuteAction}
            onProposalAction={handleProposalAction}
            project={selectedProject}
            isOpen={isAuraOpen}
            onClose={() => setIsAuraOpen(false)}
            isThinking={isAuraThinking}
          />
        </div>

        {/* ── AI status banner (honest live/render-readiness) ── */}
        <AiStatusBanner onOpenSetup={() => setActiveTab('brand')} />
      </main>
    </div>
  );
}
