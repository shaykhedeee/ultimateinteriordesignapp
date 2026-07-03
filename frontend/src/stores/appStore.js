import { apiUrl, getApiBase } from '../utils/api.js';
import { create } from 'zustand';

const API_BASE = getApiBase();

export const useAppStore = create((set, get) => ({
  activeTab: localStorage.getItem('spacetrace_active_tab') || 'dashboard',
  selectedProjectId: localStorage.getItem('spacetrace_project_id') || null,
  projectsList: [],
  selectedProject: null,
  chatMessages: [
    {
      id: '1',
      sender: 'aura',
      text: "Hello! I am AURA. I have loaded your workspace and stand ready to assist. You can ask me to Restyle rooms, suggest lighting configurations, or optimize your modular cabinet budget.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  stats: { totalLeads: 0, qualifiedLeads: 0, activeProjects: 0, conversionPct: 0 },
  showProjectDropdown: false,
  currentTime: new Date(),
  activeJobs: [],
  prevActiveJobsCount: 0,
  orchestrationChips: [],
  lastUserText: '',
  isAuraOpen: false,
  isAuraFloatingOpen: false,
  auraStatus: '',
  orchestratorMode: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setProjectsList: (projectsList) => set({ projectsList }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  setStats: (stats) => set({ stats }),
  setShowProjectDropdown: (showProjectDropdown) => set({ showProjectDropdown }),
  setActiveJobs: (activeJobs) => set({ activeJobs }),
  setOrchestrationChips: (orchestrationChips) => set({ orchestrationChips }),
  setLastUserText: (lastUserText) => set({ lastUserText }),
  setIsAuraOpen: (isAuraOpen) => set({ isAuraOpen }),
  setIsAuraFloatingOpen: (isAuraFloatingOpen) => set({ isAuraFloatingOpen }),
  setAuraStatus: (auraStatus) => set({ auraStatus }),
  setOrchestratorMode: (orchestratorMode) => set({ orchestratorMode }),

  fetchStatsAndProjects: async () => {
    try {
      const [leadsRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads`),
        fetch(`${API_BASE}/api/projects`)
      ]);
      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const qualified = leads.filter(l => l.voice_status === 'qualified' || l.voice_status === 'human_closed').length;
      const closed = leads.filter(l => l.voice_status === 'human_closed').length;
      const rate = leads.length > 0 ? ((closed / leads.length) * 100).toFixed(0) : 0;
      set({
        projectsList: projects,
        stats: {
          totalLeads: leads.length,
          qualifiedLeads: qualified,
          activeProjects: projects.length,
          conversionPct: rate
        }
      });
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    }
  },

  fetchActiveJobs: async (projectId) => {
    if (!projectId) return set({ activeJobs: [] });
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/jobs`);
      if (!res.ok) return;
      const data = await res.json();
      const running = data.filter(j => j.status === 'running');
      set({ activeJobs: running });
    } catch (e) {
      console.error('Failed to fetch running jobs:', e);
    }
  },

  ensureProject: async () => {
    const { selectedProjectId, projectsList, setSelectedProjectId } = get();
    if (!selectedProjectId && projectsList.length > 0) {
      setSelectedProjectId(projectsList[0].id);
      return projectsList[0].id;
    }
    return selectedProjectId;
  },

  // Port of existing App.jsx AURA behavior into the store so the shell/routes can reuse it.
  handleSendMessage: async (text, retryingForId) => {
    const { setChatMessages, setLastUserText } = get();
    setLastUserText(text);
    const userMsg = {
      id: retryingForId || `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      status: 'sending',
      originalText: text
    };
    setChatMessages((prev) =>
      retryingForId
        ? prev.map((m) => (m.id === retryingForId ? { ...m, status: 'sending', text, originalText: text } : m))
        : [...prev, userMsg]
    );

    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        const projectId = await get().ensureProject();
        const res = await fetch(`${API_BASE}/api/projects/${projectId || 'demo'}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, projectId })
        });
        if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : { reply: await res.text(), provider: 'text' };

        const auraMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'aura',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.reply || data.message || 'AURA is re-evaluating that request.',
          provider: data.provider || 'llm',
          actionPreview: data.actionPreview || null,
          actions: data.actions || null,
          status: 'sent'
        };

        setChatMessages((prev) =>
          retryingForId
            ? prev.map((m) => (m.id === retryingForId ? { ...m, status: 'sent' } : m))
            : prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'sent' } : m))
        );
        setChatMessages((prev) => [...prev, auraMsg]);
        return;
      } catch (err) {
        console.warn(`[AURA] Request failed ${attempts}/${maxAttempts}:`, err);
        if (attempts >= maxAttempts) {
          const auraMsg = {
            id: `msg-${Date.now() + 1}`,
            sender: 'aura',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `I hit a snag processing: "${text}". Tap Retry or try a shorter instruction.`,
            provider: 'fallback-error',
            actionPreview: null,
            actions: null,
            status: 'error'
          };
          setChatMessages((prev) =>
            retryingForId
              ? prev.map((m) => (m.id === retryingForId ? { ...m, status: 'error' } : m))
              : prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'error' } : m))
          );
          setChatMessages((prev) => [...prev, auraMsg]);
        }
      }
    }
  },

  handleRetryMessage: async (text, failedId) => {
    await get().handleSendMessage(text || '', failedId);
  },

  handleExecuteAction: async (actionId, preview) => {
    const {
      setSelectedProject,
      setOrchestrationChips,
      navigateTab,
      fetchStatsAndProjects
    } = get();

    if (preview?.costImpact && get().selectedProject) {
      setSelectedProject((prev) => {
        if (!prev) return prev;
        const updatedCost = Math.max(0, (prev.total_cost || 0) + preview.costImpact);
        return { ...prev, total_cost: updatedCost };
      });
    }

    const projectId = await get().ensureProject();
    if (!projectId) {
      setOrchestrationChips((prev) => [
        ...prev,
        { id: `chip-${Date.now()}`, type: 'error', text: 'No project selected. Open a project first.' }
      ]);
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
    } else if (actionId === 'act-restyle') {
      tab = 'studio';
    } else if (actionId === 'act-render') {
      tab = 'renders';
      jobType = 'render_generation';
    } else if (actionId?.startsWith('aura:')) {
      tab = actionId.includes('render') ? 'renders' :
           actionId.includes('palette') || actionId.includes('budget') ? 'materials' :
           actionId.includes('layout') || actionId.includes('restyle') ? 'studio' :
           actionId.includes('drawing') || actionId.includes('export') ? 'drawings' : 'dashboard';
    } else {
      tab = 'dashboard';
    }

    if (tab) get().navigateTab(tab);

    if (status && projectId) {
      try {
        await fetch(`${API_BASE}/api/projects/${projectId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, currentStep: status })
        });
      } catch (e) {
        console.warn('Status update failed:', e);
      }
    }

    if (jobType && projectId) {
      try {
        const res = await fetch(`${API_BASE}/api/projects/${projectId}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobType, sourceEntityType: 'aura_orchestrator', sourceEntityId: projectId })
        });
        if (!res.ok) throw new Error('Job dispatch failed');
      } catch (e) {
        setOrchestrationChips((prev) => [
          ...prev,
          { id: `chip-${Date.now()}`, type: 'error', text: `Job start failed: ${e.message}` }
        ]);
      }
    }

    setOrchestrationChips((prev) => [
      ...prev,
      {
        id: `chip-${Date.now()}`,
        type: 'success',
        text: `Executed: ${preview?.title || actionId}. ${tab ? `Navigated to ${tab}.` : ''}${jobType ? 'Render job queued.' : ''}`
      }
    ]);

    fetchStatsAndProjects();
  },
  
  handleAuraAutoExecute: async (actionId, preview) => {
    await get().handleExecuteAction(actionId, preview);
  },

  navigateTab: (tab) => {
    const { setActiveTab } = get();
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: tab }));
  },

  auraCommands: [
    { id: 'aura:render-living', label: 'Generate Living Render', tab: 'renders', status: null, jobType: 'render_generation' },
    { id: 'aura:apply-palette', label: 'Apply Warm Japandi Palette', tab: 'materials', status: 'materials_selected', jobType: null },
    { id: 'aura:optimize-budget', label: 'Optimize Hardwares & Budget', tab: 'finance', status: null, jobType: null },
    { id: 'aura:align-layout', label: 'Align Sofa + Walkways', tab: 'studio', status: null, jobType: null },
    { id: 'aura:export-drawings', label: 'Export Elevation DXF', tab: 'drawings', status: null, jobType: null },
  ],

  handleAuraCommand: async (cmd) => {
    const { orchestrationChips, fetchStatsAndProjects, navigateTab } = get();
    const projectId = await get().ensureProject();
    if (!projectId) {
      setOrchestrationChips((prev) => [...prev, { id: `chip-${Date.now()}`, type: 'error', text: 'No project selected. Open a project first.' }]);
      return;
    }

    if (cmd.tab) navigateTab(cmd.tab);

    try {
      if (cmd.status && projectId) {
        await fetch(`${API_BASE}/api/projects/${projectId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: cmd.status, currentStep: cmd.status })
        });
      }
      if (cmd.jobType && projectId) {
        const res = await fetch(`${API_BASE}/api/projects/${projectId}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobType: cmd.jobType, sourceEntityType: 'aura_orchestrator', sourceEntityId: projectId })
        });
        if (!res.ok) throw new Error('Job dispatch failed');
      }
    } catch (e) {
      setOrchestrationChips((prev) => [...prev, { id: `chip-${Date.now()}`, type: 'error', text: `Job start failed: ${e.message}` }]);
      return;
    }

    setOrchestrationChips((prev) => [...prev, { id: `chip-${Date.now()}`, type: 'success', text: `AURA executed: ${cmd.label}` }]);
    setAuraStatus(`Executed: ${cmd.label}`);
    setOrchestratorMode(true);
    fetchStatsAndProjects();
  }
}));
