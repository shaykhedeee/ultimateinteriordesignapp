import { useEffect, useMemo, useState } from 'react';
import { api, API_BASE, assetUrl } from '../api/client.js';
import { defaultStudioSettings, emptyClientProject, workflowSteps } from '../data/studioData.js';

const emptyFloorPlanDraft = {
  file: null, fileName: '', fileType: '', previewUrl: '',
  annotations: { zones: [], markers: [] },
  analysis: { zoneCount: 0, markerCount: 0, rooms: [], components: [], furnitureRequirements: [] }
};
const studioSettingsKey = 'spacious_venture_studio_settings';

export function useStudioApp() {
  const [activeNav, setActiveNav] = useState('admin');
  const [form, setForm] = useState(emptyClientProject);
  const [studioSettings, setStudioSettings] = useState(loadStudioSettings);
  const [activeStep, setActiveStep] = useState(0);
  const [activeRoom, setActiveRoom] = useState('living');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [floorPlanDraft, setFloorPlanDraft] = useState(emptyFloorPlanDraft);
  const [floorPlanAnalysis, setFloorPlanAnalysis] = useState(null);
  const [workflowReadiness, setWorkflowReadiness] = useState(null);
  const [technicalDrawings, setTechnicalDrawings] = useState([]);
  const [project, setProject] = useState(null);
  const [designPackage, setDesignPackage] = useState(null);
  const [laminates, setLaminates] = useState([]);
  const [library, setLibrary] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [cutlist, setCutlist] = useState(null);
  const [productionImports, setProductionImports] = useState([]);
  const [providerStatus, setProviderStatus] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cutlistLoading, setCutlistLoading] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
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
    refreshDocuments().catch(() => {});
    refreshProductionImports().catch(() => {});
  }, []);

  const activeMoodboard = useMemo(() => {
    if (!designPackage) return null;
    if (activeRoom === 'whole-home') return designPackage.moodboards.find((item) => item.room === 'whole-home');
    return designPackage.moodboards.find((item) => item.room === activeRoom);
  }, [activeRoom, designPackage]);

  const canGenerate = Boolean(form.clientName.trim() && form.selectedSpaces.length);

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

  function updateStudioSettings(field, value) {
    setStudioSettings((prev) => {
      const next = { ...prev, [field]: value };
      localStorage.setItem(studioSettingsKey, JSON.stringify(next));
      return next;
    });
  }

  function resetStudioSettings() {
    setStudioSettings(defaultStudioSettings);
    localStorage.setItem(studioSettingsKey, JSON.stringify(defaultStudioSettings));
    setStatus('Studio branding settings reset to Spacious Venture defaults.');
  }

  function startNewClient() {
    setForm(emptyClientProject);
    setFloorPlanDraft(emptyFloorPlanDraft);
    setFloorPlanAnalysis(null);
    setWorkflowReadiness(null);
    setTechnicalDrawings([]);
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

  function resetLocalProjectState() {
    setForm(emptyClientProject);
    setFloorPlanDraft(emptyFloorPlanDraft);
    setFloorPlanAnalysis(null);
    setWorkflowReadiness(null);
    setTechnicalDrawings([]);
    setActiveStep(0);
    setActiveRoom('living');
    setIsIntakeOpen(false);
    setProject(null);
    setDesignPackage(null);
    setCutlist(null);
    setError('');
  }

  function clearAll() {
    resetLocalProjectState();
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

  async function refreshDocuments() {
    const data = await api('/api/admin/documents');
    setDocuments(data.items || []);
    return data.items || [];
  }

  async function refreshProductionImports() {
    const data = await api('/api/cutlists/imports');
    setProductionImports(data.items || []);
    return data.items || [];
  }

  async function refreshCutlist(projectId = project?.id) {
    if (!projectId) { setCutlist(null); return null; }
    const data = await api(`/api/projects/${projectId}/cutlists`);
    setCutlist(data.cutlist || null);
    return data.cutlist || null;
  }

  async function refreshWorkflowReadiness(projectId = project?.id) {
    if (!projectId) { setWorkflowReadiness(null); return null; }
    const data = await api(`/api/projects/${projectId}/workflow-readiness`);
    setWorkflowReadiness(data);
    if (data.analysis) setFloorPlanAnalysis(data.analysis);
    return data;
  }

  async function analyzeFloorPlan() {
    const activeProject = project || (form.clientName.trim() ? (await api('/api/projects', {
      method: 'POST', body: JSON.stringify(form)
    })).project : null);
    if (!activeProject) {
      setError('Add the client name before analysing the floor plan.');
      setActiveStep(3);
      setIsIntakeOpen(true);
      return null;
    }
    setProject(activeProject);
    setStatus('Saving annotations and analysing floor-plan understanding...');
    setError('');
    try {
      await uploadFloorPlan(activeProject.id);
      const data = await api(`/api/projects/${activeProject.id}/floor-plan/analyze`, {
        method: 'POST',
        body: JSON.stringify({ annotations: floorPlanDraft.annotations, calibration: floorPlanDraft.analysis?.calibration || {} })
      });
      setFloorPlanAnalysis(data.analysis);
      setFloorPlanDraft((prev) => ({ ...prev, analysis: { ...(prev.analysis || {}), ...data.analysis } }));
      await refreshWorkflowReadiness(activeProject.id);
      await refreshProjects();
      await refreshAdminSummary();
      setStatus(`Floor plan analysed: ${data.analysis.confidence}% confidence.`);
      return data.analysis;
    } catch (err) {
      setError(err.message);
      setStatus('Floor-plan analysis failed.');
      return null;
    }
  }

  async function uploadFloorPlan(projectId) {
    if (!floorPlanDraft.file && !floorPlanDraft.annotations?.zones?.length) return null;
    const body = new FormData();
    if (floorPlanDraft.file) body.append('file', floorPlanDraft.file);
    body.append('annotations', JSON.stringify(floorPlanDraft.annotations || { zones: [], markers: [] }));
    body.append('analysis', JSON.stringify(floorPlanDraft.analysis || {}));
    const result = await api(`/api/projects/${projectId}/floor-plan`, { method: 'POST', body });
    setFloorPlanDraft((prev) => ({
      ...prev, stored: result.floorPlan,
      annotations: result.floorPlan.annotations || prev.annotations,
      analysis: result.floorPlan.analysis || prev.analysis
    }));
    return result.floorPlan;
  }

  async function createPackage() {
    const clientName = form.clientName.trim();
    if (!clientName) { setError('Add the client name.'); setActiveStep(0); setIsIntakeOpen(true); return; }
    if (!form.selectedSpaces.length) { setError('Select spaces.'); setActiveStep(2); setIsIntakeOpen(true); return; }
    setGenerating(true);
    setError('');
    setStatus('Creating project...');
    try {
      const activeProject = project || (await api('/api/projects', { method: 'POST', body: JSON.stringify(form) })).project;
      setProject(activeProject);
      setCutlist(null);
      await uploadFloorPlan(activeProject.id);
      const generated = await api(`/api/projects/${activeProject.id}/generate-package`, { method: 'POST' });
      setDesignPackage(generated.designPackage);
      setIsIntakeOpen(true);
      setStatus('PDF brief package generated.');
      setActiveRoom(form.selectedSpaces.includes('living') ? 'living' : 'whole-home');
      setActiveStep(workflowSteps.length - 1);
      setActiveNav('briefs');
      await refreshLibrary();
      await refreshProjects();
      await refreshAdminSummary();
      setTimeout(() => document.querySelector('.intake-panel')?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } catch (err) { setError(err.message); setStatus('Generation failed.'); }
    finally { setGenerating(false); refreshProviders().catch(() => {}); }
  }

  async function regenerateRoom(room) {
    if (!project) { await createPackage(); return; }
    setGenerating(true);
    setStatus(`Refreshing ${room}...`);
    try {
      const generated = await api(`/api/projects/${project.id}/generate-room/${room}`, { method: 'POST' });
      setDesignPackage(generated.designPackage);
      setActiveRoom(room);
      setStatus(`Fresh ${room} variation stored.`);
      await refreshLibrary(); await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); }
    finally { setGenerating(false); }
  }

  async function uploadReferences(event) {
    if (!project || !event.target.files.length) { setError(project ? '' : 'Create a project first.'); return; }
    setUploading(true);
    const body = new FormData();
    Array.from(event.target.files).forEach((file) => body.append('assets', file));
    body.append('room', activeRoom); body.append('style', form.primaryStyle); body.append('budgetTier', form.budgetTier);
    try {
      const data = await api(`/api/projects/${project.id}/assets`, { method: 'POST', body });
      setLibrary(data.items);
      setStatus('Reference images uploaded.');
      await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }

  async function downloadProposal() {
    if (!project) return;
    setStatus('Building PDF brief...');
    try {
      const blob = await api(`/api/proposals/${project.id}/pdf`, { method: 'POST', body: JSON.stringify({ studioSettings }) });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.clientName.replace(/\s+/g, '-')}-design-brief.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('PDF brief downloaded.');
      await refreshProjects(); await refreshAdminSummary(); await refreshDocuments();
    } catch (err) { setError(err.message); }
  }

  async function openProject(projectId, nextNav = 'dashboard') {
    setError(''); setStatus('Opening project...');
    try {
      const data = await api(`/api/projects/${projectId}`);
      const loadedProject = data.project;
      setProject(loadedProject);
      setDesignPackage(loadedProject.designPackage || null);
      refreshCutlist(loadedProject.id).catch(() => setCutlist(null));
      setForm({ ...emptyClientProject, ...projectToForm(loadedProject) });
      setFloorPlanDraft(floorPlanToDraft(loadedProject.floorPlan));
      setFloorPlanAnalysis(null); setWorkflowReadiness(null); setTechnicalDrawings([]);
      refreshWorkflowReadiness(loadedProject.id).catch(() => {});
      setActiveRoom(loadedProject.selectedSpaces?.[0] || 'whole-home');
      setActiveStep(loadedProject.designPackage ? workflowSteps.length - 1 : 0);
      setIsIntakeOpen(true);
      setActiveNav(nextNav);
      setStatus(`${loadedProject.clientName} opened.`);
    } catch (err) { setError(err.message); setStatus('Could not open project.'); }
  }

  function exportBackup() {
    setStatus('Downloading backup...');
    window.open(`${API_BASE}/api/library/export`, '_blank', 'noopener,noreferrer');
  }

  async function importBackupFile(file, options = {}) {
    if (!file) return;
    setMaintenanceBusy(true); setError('');
    setStatus(options.replace ? 'Restoring backup...' : 'Importing backup...');
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await api('/api/library/import', { method: 'POST', body: JSON.stringify({ backup, replace: Boolean(options.replace) }) });
      resetLocalProjectState();
      await refreshLibrary(); await refreshProjects(); await refreshAdminSummary(); await refreshDocuments();
      setActiveNav('settings');
      setStatus('Backup import complete.');
    } catch (err) { setError(err.message); setStatus('Backup import failed.'); }
    finally { setMaintenanceBusy(false); }
  }

  async function resetDemoWorkspace() {
    setMaintenanceBusy(true); setError(''); setStatus('Rebuilding demo...');
    try {
      await api('/api/admin/demo-reset', { method: 'POST', body: JSON.stringify({ confirm: 'RESET DEMO' }) });
      resetLocalProjectState();
      await refreshLibrary(); await refreshProjects(); await refreshAdminSummary(); await refreshDocuments();
      setActiveNav('admin');
      setStatus('Demo workspace rebuilt.');
    } catch (err) { setError(err.message); setStatus('Demo reset failed.'); }
    finally { setMaintenanceBusy(false); }
  }

  async function createCutlistProject() {
    if (!project) { setError('Create a project first.'); setActiveNav('dashboard'); return; }
    setCutlistLoading(true); setError('');
    setStatus('Creating cutlist project...');
    try {
      const data = await api(`/api/projects/${project.id}/cutlists`, { method: 'POST' });
      setCutlist(data.cutlist);
      setStatus(`Cutlist ready: ${data.cutlist.modules.length} modules.`);
      setActiveNav('cutlists');
      await refreshProjects(); await refreshAdminSummary(); await refreshProductionImports();
    } catch (err) { setError(err.message); setStatus('Could not create cutlist.'); }
    finally { setCutlistLoading(false); }
  }

  async function approveBrief() {
    if (!project) { setError('Open a project first.'); return null; }
    setStatus('Approving brief...');
    try {
      const data = await api(`/api/projects/${project.id}/brief/approve`, { method: 'POST', body: JSON.stringify({ status: 'approved', approvedBy: project.clientName }) });
      await refreshWorkflowReadiness(project.id);
      setStatus('Brief approved.');
      return data.approval;
    } catch (err) { setError(err.message); setStatus('Brief approval failed.'); return null; }
  }

  async function generateTechnicalDrawingsForProject() {
    if (!project) { setError('Open a project first.'); return []; }
    setStatus('Generating technical drawings...');
    try {
      const data = await api(`/api/projects/${project.id}/technical-drawings/generate`, { method: 'POST' });
      setTechnicalDrawings(data.items || []);
      await refreshWorkflowReadiness(project.id);
      setStatus(`Generated ${data.items?.length || 0} drawings.`);
      return data.items || [];
    } catch (err) { setError(err.message); setStatus('Drawing generation failed.'); return []; }
  }

  async function importProductionWorkbook(file) {
    if (!file) return null;
    setCutlistLoading(true); setError(''); setStatus('Importing workbook...');
    try {
      const body = new FormData(); body.append('workbook', file);
      const data = await api('/api/cutlists/imports', { method: 'POST', body });
      setProductionImports(data.items || []);
      setStatus(`Imported ${data.import.projectCode}.`);
      return data.import;
    } catch (err) { setError(err.message); setStatus('Import failed.'); return null; }
    finally { setCutlistLoading(false); }
  }

  async function uploadCutlistRawFiles(files, cutlistId = cutlist?.id) {
    const selectedFiles = Array.from(files || []);
    if (!cutlistId || selectedFiles.length === 0) return null;
    setCutlistLoading(true); setError(''); setStatus('Uploading cutlist source files...');
    try {
      const body = new FormData();
      selectedFiles.forEach((file) => body.append('rawFiles', file));
      const data = await api(`/api/cutlists/${cutlistId}/raw-files`, { method: 'POST', body });
      setCutlist(data.cutlist);
      setStatus(`Attached ${data.uploaded?.length || 0} raw source file(s).`);
      await refreshProjects(); await refreshAdminSummary();
      return data;
    } catch (err) { setError(err.message); setStatus('Raw source upload failed.'); return null; }
    finally { setCutlistLoading(false); }
  }

  function downloadCutlistCsv() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/csv`, '_blank', 'noopener,noreferrer');
  }

  function downloadMaxCutCsv() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/maxcut-csv`, '_blank', 'noopener,noreferrer');
    setStatus('MaxCut CSV exported.');
  }

  function downloadJobLayoutPdf() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/pdf/job-layout`, '_blank', 'noopener,noreferrer');
    setStatus('Job layout PDF exported.');
  }

  function downloadCutlistXlsx() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/xlsx`, '_blank', 'noopener,noreferrer');
    setStatus('Cutlist XLSX exported.');
  }

  function downloadJobSummaryPdf() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/pdf/summary`, '_blank', 'noopener,noreferrer');
    setStatus('Job summary PDF exported.');
  }

  function downloadPanelLabelsPdf() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/pdf/labels`, '_blank', 'noopener,noreferrer');
    setStatus('Panel labels PDF exported.');
  }

  function downloadCutlistPdf() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    window.open(`${API_BASE}/api/cutlists/${cutlist.id}/pdf`, '_blank', 'noopener,noreferrer');
    setStatus('Cutlist PDF exported.');
    setTimeout(() => { refreshDocuments().catch(() => {}); refreshAdminSummary().catch(() => {}); }, 1200);
  }

  async function regenerateCutlistParts() {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    setCutlistLoading(true); setStatus('Regenerating parts...');
    try {
      const data = await api(`/api/cutlists/${cutlist.id}/generate-parts`, { method: 'POST' });
      setCutlist(data.cutlist);
      setStatus(`Parts regenerated: ${data.cutlist.parts.length} rows.`);
      await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); setStatus('Regeneration failed.'); }
    finally { setCutlistLoading(false); }
  }

  async function updateCutlistModule(moduleId, patch) {
    if (!cutlist) return;
    setCutlistLoading(true); setStatus('Saving module...');
    try {
      const data = await api(`/api/cutlists/${cutlist.id}/modules/${moduleId}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setCutlist(data.cutlist);
      setStatus(`Module updated. Rev ${data.cutlist.revision}.`);
      await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); setStatus('Could not update module.'); }
    finally { setCutlistLoading(false); }
  }

  async function addCutlistModule(patch) {
    if (!cutlist) { setError('Create a cutlist first.'); return; }
    setCutlistLoading(true); setStatus('Adding module...');
    try {
      const data = await api(`/api/cutlists/${cutlist.id}/modules`, { method: 'POST', body: JSON.stringify(patch) });
      setCutlist(data.cutlist);
      setStatus('Module added.');
      await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); setStatus('Could not add module.'); }
    finally { setCutlistLoading(false); }
  }

  async function deleteCutlistModule(moduleId) {
    if (!cutlist) return;
    setCutlistLoading(true); setStatus('Removing module...');
    try {
      const data = await api(`/api/cutlists/${cutlist.id}/modules/${moduleId}`, { method: 'DELETE' });
      setCutlist(data.cutlist);
      setStatus('Module removed.');
      await refreshProjects(); await refreshAdminSummary();
    } catch (err) { setError(err.message); setStatus('Could not remove module.'); }
    finally { setCutlistLoading(false); }
  }

  const screenProps = {
    form, studioSettings, updateStudioSettings, resetStudioSettings,
    floorPlanDraft, setFloorPlanDraft, floorPlanAnalysis, workflowReadiness,
    technicalDrawings, activeStep, isIntakeOpen, setActiveStep, updateForm,
    toggleArray, startNewClient, clearAll, createPackage, analyzeFloorPlan,
    approveBrief, generateTechnicalDrawingsForProject,
    onGenerate: createPackage, createCutlistProject, onCreateCutlistProject: createCutlistProject,
    onDownloadCutlistCsv: downloadCutlistCsv, onDownloadMaxCutCsv: downloadMaxCutCsv, onDownloadJobLayoutPdf: downloadJobLayoutPdf,
    onDownloadCutlistXlsx: downloadCutlistXlsx, onDownloadJobSummaryPdf: downloadJobSummaryPdf, onDownloadPanelLabelsPdf: downloadPanelLabelsPdf,
    onDownloadCutlistPdf: downloadCutlistPdf,
    onRegenerateCutlistParts: regenerateCutlistParts, onUpdateCutlistModule: updateCutlistModule,
    onAddCutlistModule: addCutlistModule, onDeleteCutlistModule: deleteCutlistModule,
    onImportProductionWorkbook: importProductionWorkbook, onRefreshProductionImports: refreshProductionImports,
    onUploadCutlistRawFiles: uploadCutlistRawFiles,
    generating, error, status, activeRoom, setActiveRoom, setActiveNav,
    activeMoodboard, providerStatus, adminSummary, laminates, library,
    projectList, documents, cutlist, productionImports, cutlistLoading,
    uploading, project, designPackage, regenerateRoom, uploadReferences,
    downloadProposal, onDownloadProposal: downloadProposal, refreshLibrary,
    refreshProjects, refreshDocuments, openProject, exportBackup,
    onExportBackup: exportBackup, onImportBackup: importBackupFile,
    onResetDemoWorkspace: resetDemoWorkspace, maintenanceBusy
  };

  return {
    activeNav, setActiveNav, form, project, designPackage, providerStatus,
    studioSettings, updateStudioSettings, startNewClient, clearAll,
    laminates, library, generating, uploading,
    activeMoodboard, floorPlanDraft, floorPlanAnalysis,
    canGenerate, cutlist, adminSummary, projectList,
    screenProps, status, error, activeRoom
  };
}

function loadStudioSettings() {
  try {
    const stored = localStorage.getItem(studioSettingsKey);
    const next = stored ? { ...defaultStudioSettings, ...JSON.parse(stored) } : defaultStudioSettings;
    if (!next.leadDesigner || next.leadDesigner === 'Ananya S.') next.leadDesigner = defaultStudioSettings.leadDesigner;
    if (!next.leadRole) next.leadRole = defaultStudioSettings.leadRole;
    return next;
  } catch { return defaultStudioSettings; }
}

function projectToForm(project) {
  const { spaces, floorPlan, designPackage, createdAt, updatedAt, ...formFields } = project;
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
