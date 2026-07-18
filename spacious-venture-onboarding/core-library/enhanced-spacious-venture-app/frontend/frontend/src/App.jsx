import React, { useEffect, useMemo, useState } from 'react';
import { api, API_BASE, assetUrl } from './api/client.js';
import { StudioShell } from './components/StudioShell.jsx';
import { defaultStudioSettings, emptyClientProject, workflowSteps } from './data/studioData.js';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import {
  AdminDashboardScreen,
  BriefsScreen,
  CutlistsScreen,
  HelpScreen,
  LibraryScreen,
  MaterialsScreen,
  PackagesScreen,
  ProjectsScreen,
  RendersScreen,
  SettingsScreen
} from './screens/ManagementScreens.jsx';

const emptyFloorPlanDraft = {
  file: null,
  fileName: '',
  fileType: '',
  previewUrl: '',
  annotations: { zones: [], markers: [] },
  analysis: { zoneCount: 0, markerCount: 0, rooms: [], components: [], furnitureRequirements: [] }
};

export function App() {
  const [activeNav, setActiveNav] = useState('admin');
  const [form, setForm] = useState(emptyClientProject);
  const [activeStep, setActiveStep] = useState(0);
  const [activeRoom, setActiveRoom] = useState('living');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [floorPlanDraft, setFloorPlanDraft] = useState(emptyFloorPlanDraft);
  const [project, setProject] = useState(null);
  const [designPackage, setDesignPackage] = useState(null);
  const [laminates, setLaminates] = useState([]);
  const [library, setLibrary] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [cutlist, setCutlist] = useState(null);
  const [providerStatus, setProviderStatus] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cutlistLoading, setCutlistLoading] = useState(false);
  const [status, setStatus] = useState('No active client. Start with Add Client.');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/materials/laminates')
      .then((data) => setLaminates(data.items))
      .catch((err) => setError(err.message));
    refreshLibrary().catch(() => {});
    refreshProjects().catch(() => {});
    refreshProviders().catch(() => {});
    refreshAdminSummary().catch(() => {});
  }, []);

  const activeMoodboard = useMemo(() => {
    if (!designPackage) return null;
    if (activeRoom === 'whole-home') return designPackage.moodboards.find((item) => item.room === 'whole-home');
    return designPackage.moodboards.find((item) => item.room === activeRoom);
  }, [activeRoom, designPackage]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArray(field, value) {
    setForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  function startNewClient() {
    setForm(emptyClientProject);
    setFloorPlanDraft(emptyFloorPlanDraft);
    setActiveStep(0);
    setActiveRoom('living');
    setIsIntakeOpen(true);
    setProject(null);
    setDesignPackage(null);
    setCutlist(null);
    setError('');
    setStatus('New client onboarding started. Capture project scope, floor plan, materials, and production notes.');
    setActiveNav('dashboard');
    setTimeout(() => {
      document.querySelector('.intake-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  function clearAll() {
    setForm(emptyClientProject);
    setFloorPlanDraft(emptyFloorPlanDraft);
    setActiveStep(0);
    setActiveRoom('living');
    setIsIntakeOpen(false);
    setProject(null);
    setDesignPackage(null);
    setCutlist(null);
    setError('');
    setStatus('Cleared. No active client.');
    setActiveNav('admin');
  }

  async function refreshLibrary() {
    const data = await api('/api/library/assets');
    setLibrary(data.items || []);
  }

  async function refreshProjects() {
    const data = await api('/api/projects');
    setProjectList(data.items || []);
  }

  async function refreshProviders() {
    const data = await api('/api/providers/status');
    setProviderStatus(data);
  }

  async function refreshAdminSummary() {
    const data = await api('/api/admin/summary');
    setAdminSummary(data);
  }

  async function refreshCutlist(projectId = project?.id) {
    if (!projectId) {
      setCutlist(null);
      return null;
    }
    const data = await api(`/api/projects/${projectId}/cutlists`);
    setCutlist(data.cutlist || null);
    return data.cutlist || null;
  }

  async function uploadFloorPlan(projectId) {
    const hasAnnotations = Boolean(floorPlanDraft.annotations?.zones?.length || floorPlanDraft.annotations?.markers?.length);
    if (!floorPlanDraft.file && !hasAnnotations) return null;
    const body = new FormData();
    if (floorPlanDraft.file) body.append('file', floorPlanDraft.file);
    body.append('annotations', JSON.stringify(floorPlanDraft.annotations || { zones: [], markers: [] }));
    body.append('analysis', JSON.stringify(floorPlanDraft.analysis || {}));
    const result = await api(`/api/projects/${projectId}/floor-plan`, { method: 'POST', body });
    setFloorPlanDraft((prev) => ({
      ...prev,
      stored: result.floorPlan,
      annotations: result.floorPlan.annotations || prev.annotations,
      analysis: result.floorPlan.analysis || prev.analysis
    }));
    return result.floorPlan;
  }

  async function createPackage() {
    const clientName = form.clientName.trim();
    if (!clientName) {
      setError('Add the client name before generating the PDF brief.');
      setActiveStep(0);
      setIsIntakeOpen(true);
      return;
    }
    if (!form.selectedSpaces.length) {
      setError('Select at least one room or space before generating.');
      setActiveStep(2);
      setIsIntakeOpen(true);
      return;
    }
    setGenerating(true);
    setError('');
    setStatus('Creating project, saving floor plan, matching materials, and preparing the PDF brief package...');
    try {
      const activeProject = project || (await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify(form)
      })).project;
      setProject(activeProject);
      setCutlist(null);
      await uploadFloorPlan(activeProject.id);
      const generated = await api(`/api/projects/${activeProject.id}/generate-package`, { method: 'POST' });
      setDesignPackage(generated.designPackage);
      setIsIntakeOpen(true);
      setStatus('PDF brief package generated. Review scope, floor plan constraints, materials, and export the client brief.');
      setActiveRoom(form.selectedSpaces.includes('living') ? 'living' : 'whole-home');
      setActiveStep(workflowSteps.length - 1);
      setActiveNav('briefs');
      await refreshLibrary();
      await refreshProjects();
      await refreshAdminSummary();
      setTimeout(() => {
        document.querySelector('.intake-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } catch (err) {
      setError(err.message);
      setStatus('Generation failed.');
    } finally {
      setGenerating(false);
      refreshProviders().catch(() => {});
    }
  }

  async function regenerateRoom(room) {
    if (!project) {
      await createPackage();
      return;
    }
    setGenerating(true);
    setStatus(`Refreshing ${room} visual/reference variation for the brief...`);
    try {
      const generated = await api(`/api/projects/${project.id}/generate-room/${room}`, { method: 'POST' });
      setDesignPackage(generated.designPackage);
      setActiveRoom(room);
      setStatus(`Fresh ${room} reference variation stored for the brief and future reuse.`);
      await refreshLibrary();
      await refreshProjects();
      await refreshAdminSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function uploadReferences(event) {
    if (!project || !event.target.files.length) {
      setError(project ? '' : 'Create a project package before uploading references.');
      return;
    }
    setUploading(true);
    const body = new FormData();
    Array.from(event.target.files).forEach((file) => body.append('assets', file));
    body.append('room', activeRoom);
    body.append('style', form.primaryStyle);
    body.append('budgetTier', form.budgetTier);
    try {
      const data = await api(`/api/projects/${project.id}/assets`, { method: 'POST', body });
      setLibrary(data.items);
      setStatus('Reference images uploaded and indexed for future reuse.');
      await refreshProjects();
      await refreshAdminSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function downloadProposal() {
    if (!project) return;
    setStatus('Building PDF brief...');
    try {
      const blob = await api(`/api/proposals/${project.id}/pdf`, { method: 'POST' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.clientName.replace(/\s+/g, '-')}-design-brief.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('PDF brief generated with floor plan, scope, materials, checks, and sign-off.');
      await refreshProjects();
      await refreshAdminSummary();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openProject(projectId) {
    setError('');
    setStatus('Opening saved project and restoring the design desk...');
    try {
      const data = await api(`/api/projects/${projectId}`);
      const loadedProject = data.project;
      setProject(loadedProject);
      setDesignPackage(loadedProject.designPackage || null);
      refreshCutlist(loadedProject.id).catch(() => setCutlist(null));
      setForm({ ...emptyClientProject, ...projectToForm(loadedProject) });
      setFloorPlanDraft(floorPlanToDraft(loadedProject.floorPlan));
      setActiveRoom(loadedProject.selectedSpaces?.[0] || 'whole-home');
      setActiveStep(loadedProject.designPackage ? workflowSteps.length - 1 : 0);
      setIsIntakeOpen(true);
      setActiveNav('dashboard');
      setStatus(`${loadedProject.clientName} project opened. Continue onboarding, review the PDF brief, or create a cutlist project.`);
    } catch (err) {
      setError(err.message);
      setStatus('Could not open the saved project.');
    }
  }

  function exportBackup() {
    window.open(`${API_BASE}/api/library/export`, '_blank', 'noopener,noreferrer');
  }

  async function createCutlistProject() {
    if (!project) {
      setError('Create or open a project before starting a cutlist project.');
      setActiveNav('dashboard');
      return;
    }
    setCutlistLoading(true);
    setError('');
    setStatus('Creating cutlist project from the approved PDF brief...');
    try {
      const data = await api(`/api/projects/${project.id}/cutlists`, { method: 'POST' });
      setCutlist(data.cutlist);
      setStatus(`Cutlist project ready: ${data.cutlist.modules.length} modules and ${data.cutlist.parts.length} generated parts.`);
      setActiveNav('cutlists');
      await refreshProjects();
      await refreshAdminSummary();
    } catch (err) {
      setError(err.message);
      setStatus('Could not create cutlist project.');
    } finally {
      setCutlistLoading(false);
    }
  }

  function downloadCutlistCsv() {
    if (!cutlist) {
      setError('Create a cutlist project before exporting CSV.');
      return;
    }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/csv`, '_blank', 'noopener,noreferrer');
  }

  const screenProps = {
    form,
    floorPlanDraft,
    setFloorPlanDraft,
    activeStep,
    isIntakeOpen,
    setActiveStep,
    updateForm,
    toggleArray,
    startNewClient,
    clearAll,
    createPackage,
    onGenerate: createPackage,
    createCutlistProject,
    onCreateCutlistProject: createCutlistProject,
    onDownloadCutlistCsv: downloadCutlistCsv,
    generating,
    error,
    status,
    activeRoom,
    setActiveRoom,
    activeMoodboard,
    providerStatus,
    adminSummary,
    laminates,
    library,
    projectList,
    cutlist,
    cutlistLoading,
    uploading,
    project,
    designPackage,
    regenerateRoom,
    uploadReferences,
    downloadProposal,
    onDownloadProposal: downloadProposal,
    refreshLibrary,
    refreshProjects,
    openProject,
    exportBackup,
    onExportBackup: exportBackup
  };

  return (
    <StudioShell
      activeNav={activeNav}
      onNavChange={setActiveNav}
      form={form}
      project={project}
      designPackage={designPackage}
      providerStatus={providerStatus}
      onBudgetChange={(budgetTier) => updateForm('budgetTier', budgetTier)}
      onStartClient={startNewClient}
      onClearAll={clearAll}
    >
      {renderScreen(activeNav, screenProps)}
    </StudioShell>
  );
}

function projectToForm(project) {
  const {
    spaces,
    floorPlan,
    designPackage,
    createdAt,
    updatedAt,
    ...formFields
  } = project;
  return formFields;
}

function floorPlanToDraft(floorPlan) {
  if (!floorPlan) return emptyFloorPlanDraft;
  return {
    ...emptyFloorPlanDraft,
    fileName: floorPlan.filePath?.split('/').pop() || 'Stored floor plan',
    previewUrl: assetUrl(floorPlan.previewPath || floorPlan.filePath),
    annotations: floorPlan.annotations || emptyFloorPlanDraft.annotations,
    analysis: floorPlan.analysis || emptyFloorPlanDraft.analysis,
    stored: floorPlan
  };
}

function renderScreen(activeNav, props) {
  if (activeNav === 'admin') return <AdminDashboardScreen {...props} />;
  if (activeNav === 'projects') return <ProjectsScreen {...props} />;
  if (activeNav === 'briefs') return <BriefsScreen {...props} />;
  if (activeNav === 'cutlists') return <CutlistsScreen {...props} />;
  if (activeNav === 'library') return <LibraryScreen {...props} />;
  if (activeNav === 'materials') return <MaterialsScreen {...props} />;
  if (activeNav === 'renders') return <RendersScreen {...props} />;
  if (activeNav === 'packages') return <PackagesScreen {...props} />;
  if (activeNav === 'settings') return <SettingsScreen {...props} />;
  if (activeNav === 'help') return <HelpScreen />;
  return <DashboardScreen {...props} />;
}
