import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, ClipboardCheck, DatabaseBackup, Download, FileText, Filter, Gauge, ImagePlus, KeyRound, Layers3, MapPinned, Palette, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Upload, Users } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { briefSections, cutlistTemplates, designGalleryItems, phaseOnePricing, projectStages, roomOptions, styleOptions } from '../data/studioData.js';

export function AdminDashboardScreen({ adminSummary, library, laminates, providerStatus, startNewClient, exportBackup, projectList = [], openProject }) {
  const kpis = adminSummary?.kpis || {};
  const pipeline = adminSummary?.pipeline || [];
  const recentProjects = adminSummary?.recentProjects || [];
  const sourceMix = adminSummary?.sourceMix || [];
  const roomMix = adminSummary?.roomMix || [];
  const commandProjects = (projectList.length ? projectList : recentProjects).slice(0, 6);
  const heroGallery = [...designGalleryItems, ...library.map((asset) => ({
    id: asset.id,
    title: asset.title || asset.room,
    room: asset.room,
    style: asset.style,
    budgetTier: asset.budgetTier,
    image: assetUrl(asset.url),
    tags: asset.tags || [],
    conversionNote: 'Reusable generated asset from the studio library.'
  }))].slice(0, 8);
  const readinessItems = [
    { label: 'Client Intake Complete', done: (kpis.projects || 0) > 0, detail: `${kpis.projects || 0} projects captured` },
    { label: 'Floor Plan Annotated', done: (kpis.floorPlans || 0) > 0, detail: `${kpis.floorPlanCoverage || 0}% coverage` },
    { label: 'PDF Brief Ready', done: (kpis.packagedProjects || 0) > 0, detail: `${kpis.packagedProjects || 0} brief-ready projects` },
    { label: 'Proposal PDF Exported', done: (kpis.proposals || 0) > 0, detail: `${kpis.proposals || 0} exported PDFs` },
    { label: 'Cutlist Project Created', done: (kpis.cutlists || 0) > 0, detail: `${kpis.cutlists || 0} production handoffs` }
  ];
  const overallReadiness = readinessItems.length
    ? Math.round((readinessItems.filter((item) => item.done).length / readinessItems.length) * 100)
    : 0;

  return (
    <ScreenFrame title="Project CRM & Pipeline" subtitle="Track all client projects, PDF briefs, and cutlist readiness in one place" tone="command">
      <section className="admin-command-hero">
        <div>
          <h2>Run every Spacious Venture client from intake to production handoff.</h2>
          <p>Client onboarding, floor-plan annotation, PDF brief export, and cutlist readiness stay visible before the team commits production time.</p>
        </div>
        <div className="admin-command-actions">
          <button className="gold-button" onClick={startNewClient}><Plus size={16} /> Add Client</button>
          <button className="secondary-light-button" onClick={exportBackup}><Download size={16} /> Export Backup</button>
        </div>
      </section>

      <div className="admin-kpi-grid">
        <KpiCard label="Active projects" value={kpis.projects || 0} detail={`Brief-ready: ${kpis.conversionRate || 0}%`} />
        <KpiCard label="PDF briefs" value={kpis.proposals || 0} detail={`Prepared packages: ${kpis.packages || 0}`} />
        <KpiCard label="Reusable standards" value={kpis.reusableAssets || 0} detail={`Indexed references: ${kpis.assets || 0}`} />
        <KpiCard label="Floor-plan coverage" value={`${kpis.floorPlanCoverage || 0}%`} detail={`Mapped: ${kpis.floorPlans || 0}`} />
      </div>

      <div className="command-desk-grid">
        <section className="command-main-stack">
          <section className="surface-panel admin-panel command-table-panel">
            <div className="command-panel-header">
              <div>
                <div className="screen-section-title">Active project pipeline</div>
                <p>Open a client to continue onboarding, export the PDF brief, or create the cutlist project.</p>
              </div>
              <button className="secondary-light-button" onClick={startNewClient}><Plus size={15} /> Add Client</button>
            </div>
            <div className="command-project-table">
              <div className="command-project-head">
                <span>Client / Project</span>
                <span>Budget</span>
                <span>Rooms</span>
                <span>Package Status</span>
                <span>Floor Plan</span>
                <span>Proposal</span>
                <span>Next Action</span>
                <span>Confidence</span>
              </div>
              {commandProjects.map((item) => (
                <CommandProjectRow key={item.id} item={item} onOpen={openProject} />
              ))}
              {commandProjects.length === 0 && (
                <div className="crm-empty-state dark-empty">
                  <ClipboardCheck size={22} />
                  <strong>No projects yet.</strong>
                  <span>Add a client to start the onboarding and PDF brief workflow.</span>
                </div>
              )}
            </div>
          </section>

          <div className="command-bottom-grid">
            <section className="surface-panel admin-panel">
              <div className="screen-section-title">Pipeline health</div>
              <div className="pipeline-board">
                {pipeline.map((stage) => (
                  <article key={stage.stage} className={`pipeline-card ${stage.tone}`}>
                    <span>{stage.count}</span>
                    <strong>{stage.stage}</strong>
                    <small>{pipelineHint(stage.stage)}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-panel admin-panel">
              <div className="screen-section-title">Rooms entering production</div>
              <div className="mix-list dense-mix-list">
                {(roomMix.length ? roomMix : roomOptions.slice(0, 5).map((room) => ({ room: room.id, count: 0 }))).slice(0, 5).map((row) => (
                  <article key={row.room}>
                    <span>{roomOptions.find((room) => room.id === row.room)?.label || row.room}</span>
                    <strong>{row.count}</strong>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="command-right-rail">
          <section className="surface-panel admin-panel">
            <div className="command-panel-header compact-header">
              <div className="screen-section-title">Sales readiness checklist</div>
              <button type="button">View All</button>
            </div>
            <div className="approval-list command-readiness-list">
              {readinessItems.map((item) => (
                <article key={item.label} className={item.done ? 'done' : ''}>
                  <CheckCircle2 size={16} />
                  <span>{item.label}<small>{item.detail}</small></span>
                </article>
              ))}
            </div>
            <div className="overall-readiness">
              <span>Overall readiness</span>
              <i><b style={{ width: `${overallReadiness}%` }} /></i>
              <strong>{overallReadiness}%</strong>
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="command-panel-header compact-header">
              <div className="screen-section-title">Top reusable image matches</div>
              <button type="button">View All</button>
            </div>
            <div className="command-image-matches">
              {heroGallery.slice(0, 3).map((item, index) => (
                <article key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <b>{91 - index * 4}% Match</b>
                  <span>{item.title}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="command-panel-header compact-header">
              <div className="screen-section-title">Material confidence</div>
              <button type="button">View All</button>
            </div>
            <div className="command-material-confidence">
              {laminates.slice(0, 4).map((item, index) => (
                <article key={item.id}>
                  <span style={{ background: item.hex }} />
                  <b>{92 - index * 4}%</b>
                  <small>{item.collection}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="screen-section-title">Proposal actions</div>
            <div className="command-action-list">
              <button onClick={startNewClient}><Plus size={15} /> Add Client</button>
              <button onClick={exportBackup}><Download size={15} /> Export Backup</button>
              <button><FileText size={15} /> PDF Brief Queue</button>
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="screen-section-title">Quick stats</div>
            <div className="provider-readiness compact command-quick-stats">
              <article><KeyRound size={18} /><strong>{providerStatus?.activeLabel || 'curated'}</strong><span>Asset source</span></article>
              <article><Layers3 size={18} /><strong>{sourceMix.length || 1}</strong><span>Source types</span></article>
              <article><Users size={18} /><strong>{commandProjects.length}</strong><span>Visible clients</span></article>
            </div>
          </section>
        </aside>
      </div>

      <section className="surface-panel admin-panel command-gallery-panel">
        <div className="screen-section-title">Reference and material intelligence</div>
        <div className="admin-gallery-strip">
          {heroGallery.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt={item.title} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.room} - {styleLabel(item.style)} - {item.budgetTier}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ScreenFrame>
  );
}

export function ProjectsScreen({ form, project, designPackage, onGenerate, generating, startNewClient, clearAll, projectList = [], openProject }) {
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const activeProjectId = project?.id;
  const activeClient = Boolean(form.clientName.trim() || project || designPackage);

  const filteredProjects = useMemo(() => {
    const search = query.trim().toLowerCase();
    return projectList.filter((item) => {
      const text = [
        item.clientName,
        item.city,
        item.homeType,
        item.budgetTier,
        item.primaryStyle,
        item.stage,
        ...(item.selectedSpaces || [])
      ].join(' ').toLowerCase();
      if (search && !text.includes(search)) return false;
      if (stageFilter !== 'all' && item.stage !== stageFilter) return false;
      if (budgetFilter !== 'all' && item.budgetTier !== budgetFilter) return false;
      if (styleFilter !== 'all' && item.primaryStyle !== styleFilter) return false;
      return true;
    });
  }, [budgetFilter, projectList, query, stageFilter, styleFilter]);

  const crmStats = useMemo(() => {
    const proposals = projectList.filter((item) => item.hasProposal).length;
    const floorPlans = projectList.filter((item) => item.hasFloorPlan).length;
    const avgReadiness = projectList.length
      ? Math.round(projectList.reduce((sum, item) => sum + (item.readinessScore || 0), 0) / projectList.length)
      : 0;
    return { proposals, floorPlans, avgReadiness };
  }, [projectList]);

  return (
    <ScreenFrame title="Project CRM & Pipeline" subtitle="Client pipeline, PDF brief readiness, cutlist status, and next action control" tone="command">
      <section className="crm-commandbar">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, city, style, room" />
        </label>
        <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
          <option value="all">All stages</option>
          <option value="Intake">Intake</option>
          <option value="Brief Ready">Brief Ready</option>
          <option value="PDF Brief">PDF Brief</option>
          <option value="Cutlist Project">Cutlist Project</option>
        </select>
        <select value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value)}>
          <option value="all">All budgets</option>
          <option value="value">Essential</option>
          <option value="comfort">Comfort</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
        <select value={styleFilter} onChange={(event) => setStyleFilter(event.target.value)}>
          <option value="all">All styles</option>
          {styleOptions.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
        </select>
        <button className="gold-button" onClick={startNewClient}><Plus size={16} /> Add Client</button>
      </section>

      <div className="crm-kpi-row">
        <MiniMetric icon={BriefcaseBusiness} label="Projects" value={projectList.length} />
        <MiniMetric icon={Gauge} label="Avg readiness" value={`${crmStats.avgReadiness}%`} />
        <MiniMetric icon={MapPinned} label="Floor plans" value={crmStats.floorPlans} />
        <MiniMetric icon={FileText} label="PDF briefs" value={crmStats.proposals} />
      </div>

      <div className="crm-layout">
        <section className="surface-panel crm-list-panel">
          <div className="screen-section-title">Client pipeline</div>
          <div className="crm-table">
            <div className="crm-table-head">
              <span>Client</span>
              <span>Status</span>
              <span>Scope</span>
              <span>Readiness</span>
              <span>Next</span>
            </div>
            {filteredProjects.map((item) => (
              <article key={item.id} className={activeProjectId === item.id ? 'crm-row active' : 'crm-row'}>
                <div className="crm-client-cell">
                  <strong>{item.clientName}</strong>
                  <span>{item.city || 'City pending'} - {item.homeType?.toUpperCase()} - {formatDate(item.createdAt)}</span>
                </div>
                <div className="crm-status-cell">
                  <b className={`stage-chip ${stageTone(item.stage)}`}>{item.stage}</b>
                  <small>{item.hasFloorPlan ? 'Floor plan mapped' : 'Floor plan pending'}</small>
                  <small>{item.hasProposal ? 'PDF brief exported' : 'PDF brief pending'}</small>
                </div>
                <div className="crm-scope-cell">
                  <strong>{styleLabel(item.primaryStyle)}</strong>
                  <span>{(item.selectedSpaces || []).slice(0, 4).map(roomLabel).join(', ') || 'Rooms pending'}</span>
                  <small>{item.budgetTier} - {item.assetCount || 0} assets</small>
                </div>
                <div className="readiness-cell">
                  <strong>{item.readinessScore || 0}%</strong>
                  <i><b style={{ width: `${item.readinessScore || 0}%` }} /></i>
                </div>
                <div className="crm-action-cell">
                  <span>{item.nextAction}</span>
                  <button className="secondary-light-button" onClick={() => openProject(item.id)}>Open</button>
                </div>
              </article>
            ))}
            {filteredProjects.length === 0 && (
              <div className="crm-empty-state">
                <ClipboardCheck size={22} />
                <strong>No projects match these filters.</strong>
                <span>Clear filters or add a fresh client to start the consultation workflow.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="surface-panel crm-side-panel">
          <div className="screen-section-title">Active design desk</div>
          {activeClient ? (
            <>
              <h2>{form.clientName || 'Walk-in Client'}</h2>
              <p>{form.city || 'City pending'} - {form.homeType.toUpperCase()} - {styleLabel(form.primaryStyle)}</p>
              <div className="stage-list compact-stage-list">
                {projectStages.map((stage, index) => (
                  <article key={stage.label} className={index < (designPackage ? 3 : 1) ? 'done' : ''}>
                    <span>{index + 1}</span>
                    <strong>{stage.label}<small>{stage.status}</small></strong>
                  </article>
                ))}
              </div>
              <button className="gold-button" onClick={onGenerate} disabled={generating}>
                <Sparkles size={16} /> Generate / Refresh PDF Brief
              </button>
            </>
          ) : (
            <>
              <h2>No active client</h2>
              <p>Open a saved project or start a new intake before generating a PDF brief.</p>
              <button className="gold-button" onClick={startNewClient}><Plus size={16} /> Add Client</button>
            </>
          )}
          <button className="secondary-light-button" onClick={clearAll}><RotateCcw size={16} /> Clear Desk</button>
        </aside>
      </div>
    </ScreenFrame>
  );
}

export function BriefsScreen({
  form,
  project,
  designPackage,
  floorPlanDraft,
  onGenerate,
  generating,
  onDownloadProposal,
  onCreateCutlistProject,
  projectList = []
}) {
  const selectedRooms = form.selectedSpaces || [];
  const floorPlanReady = Boolean(
    floorPlanDraft?.fileName ||
    floorPlanDraft?.stored?.filePath ||
    floorPlanDraft?.annotations?.zones?.length ||
    floorPlanDraft?.annotations?.markers?.length
  );
  const readiness = [
    { label: 'Client profile', done: Boolean(form.clientName || project?.clientName), detail: form.clientName || project?.clientName || 'Pending' },
    { label: 'Rooms and modules', done: selectedRooms.length > 0, detail: `${selectedRooms.length} spaces selected` },
    { label: 'Floor plan', done: floorPlanReady, detail: floorPlanReady ? 'Plan or annotations available' : 'Upload or mark floor plan' },
    { label: 'Material preferences', done: Boolean(form.finishTolerance?.length || form.dislikedMaterials), detail: `${form.finishTolerance?.length || 0} finish signals` },
    { label: 'PDF brief package', done: Boolean(designPackage), detail: designPackage ? 'Generated and ready to export' : 'Generate from onboarding' },
    { label: 'Cutlist handoff', done: Boolean(project && designPackage), detail: project && designPackage ? 'Ready to create cutlist project' : 'Needs project and brief' }
  ];
  const complete = readiness.filter((item) => item.done).length;
  const score = Math.round((complete / readiness.length) * 100);
  const briefContents = [
    { label: 'Client summary', detail: 'Project, city, home type, budget, designer ownership' },
    { label: 'Floor plan scope', detail: 'Plan preview, room zones, markers, placement notes' },
    { label: 'Room requirements', detail: 'Selected spaces, modules, storage, furniture notes' },
    { label: 'Material direction', detail: 'Finish tolerance, laminate logic, dislikes, budget assumptions' },
    { label: 'Sign-off', detail: 'Approval note and cutlist handoff confirmation' }
  ];

  return (
    <ScreenFrame title="PDF Briefs" subtitle="Generate, review, and export the client-facing onboarding design brief" tone="command">
      <div className="brief-builder-grid">
        <section className="surface-panel brief-preview-panel">
          <div className="brief-preview-header">
            <div>
              <span>Client-ready document</span>
              <h2>{form.clientName || project?.clientName || 'New Client'} PDF Brief</h2>
              <p>{form.city || project?.city || 'City pending'} - {form.homeType?.toUpperCase() || 'Home pending'} - {styleLabel(form.primaryStyle)}</p>
            </div>
            <strong className="brief-ready-score"><b>{score}%</b><small>ready</small></strong>
          </div>

          <div className="brief-page-stack">
            <article className="brief-page hero-brief-page">
              <span>Spacious Venture</span>
              <h3>Design Brief & Production Handoff</h3>
              <p>{form.notes || 'Structured brief will summarize client requirements, floor plan constraints, material direction, and sign-off.'}</p>
            </article>
            <article className="brief-page">
              <h3>Floor Plan & Scope</h3>
              <div className="brief-stat-row">
                <span>{floorPlanDraft?.annotations?.zones?.length || 0}<small>Room zones</small></span>
                <span>{floorPlanDraft?.annotations?.markers?.length || 0}<small>Markers</small></span>
                <span>{selectedRooms.length}<small>Spaces</small></span>
              </div>
              <p>{form.floorPlanNotes || 'Floor plan notes and marked component placements will appear here.'}</p>
            </article>
            <article className="brief-page">
              <h3>Brief Sections</h3>
              <div className="brief-section-list">
                {briefSections.map((section) => (
                  <div key={section.title}>
                    <strong>{section.title}</strong>
                    <span>{section.detail}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <aside className="surface-panel brief-control-panel">
          <div className="screen-section-title">Brief readiness checklist</div>
          <div className="readiness-checklist">
            {readiness.map((item) => (
              <article key={item.label} className={item.done ? 'done' : ''}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>
          <button className="gold-button" onClick={onGenerate} disabled={generating || !form.clientName || !selectedRooms.length}>
            <Sparkles size={16} /> Generate / Refresh PDF Brief
          </button>
          <button className="secondary-light-button" onClick={onDownloadProposal} disabled={!project}>
            <FileText size={16} /> Export PDF Brief
          </button>
          <button className="secondary-light-button" onClick={onCreateCutlistProject} disabled={!project || !designPackage}>
            <Layers3 size={16} /> Create Cutlist Project
          </button>
          <div className="brief-mini-summary">
            <strong>{projectList.length} saved projects</strong>
            <span>Use Projects to open prior clients and regenerate/export their briefs.</span>
          </div>
          <div className="brief-deliverable-list">
            <div className="screen-section-title">Brief document contents</div>
            {briefContents.map((item) => (
              <article key={item.label}>
                <FileText size={15} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </ScreenFrame>
  );
}

export function CutlistsScreen({
  form,
  project,
  designPackage,
  cutlist,
  cutlistLoading,
  laminates,
  onCreateCutlistProject,
  onDownloadProposal,
  onDownloadCutlistCsv,
  onDownloadCutlistPdf,
  onRegenerateCutlistParts,
  onUpdateCutlistModule,
  onAddCutlistModule,
  onDeleteCutlistModule,
  onExportBackup,
  startNewClient
}) {
  const [editingModuleId, setEditingModuleId] = useState('');
  const [moduleDraft, setModuleDraft] = useState({});
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleDraft, setNewModuleDraft] = useState(() => emptyModuleDraft(form.selectedSpaces?.[0] || 'living'));
  const selectedRooms = form.selectedSpaces || [];
  const activeTemplates = cutlistTemplates.filter((template) => {
    if (selectedRooms.length === 0) return true;
    const room = template.room.toLowerCase();
    return selectedRooms.some((item) => room.includes(item) || item.includes(room));
  });
  const visibleTemplates = activeTemplates.length ? activeTemplates : cutlistTemplates;
  const modules = cutlist?.modules || [];
  const parts = cutlist?.parts || [];
  const totals = cutlist?.totals || {};
  const sheetLayout = cutlist?.sheetLayout;
  const activeEditModule = modules.find((item) => item.id === editingModuleId);
  const productionReadiness = [
    { label: 'Approved PDF brief', done: Boolean(project && designPackage), detail: designPackage ? 'Brief package generated' : 'Generate brief first' },
    { label: 'Modules generated', done: modules.length > 0, detail: `${modules.length} module records` },
    { label: 'Part list ready', done: parts.length > 0, detail: `${parts.length} part rows` },
    { label: 'Sheet preview ready', done: Boolean(sheetLayout?.sheets?.length), detail: `${sheetLayout?.sheets?.length || 0} sheet previews` },
    { label: 'Workshop PDF ready', done: Boolean(cutlist), detail: cutlist ? 'Export available' : 'Create cutlist first' }
  ];

  useEffect(() => {
    setEditingModuleId('');
    setModuleDraft({});
    setAddingModule(false);
  }, [cutlist?.id]);

  function startEditModule(module) {
    setAddingModule(false);
    setEditingModuleId(module.id);
    setModuleDraft(moduleDraftFrom(module));
  }

  function updateModuleDraft(field, value) {
    setModuleDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateNewModuleDraft(field, value) {
    setNewModuleDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function saveModule() {
    if (!activeEditModule) return;
    await onUpdateCutlistModule(activeEditModule.id, moduleDraft);
    setEditingModuleId('');
    setModuleDraft({});
  }

  async function addModule() {
    await onAddCutlistModule(newModuleDraft);
    setAddingModule(false);
    setNewModuleDraft(emptyModuleDraft(newModuleDraft.room));
  }

  return (
    <ScreenFrame title="Cutlists" subtitle="Create workshop-ready module planning from the approved PDF brief" tone="command">
      <div className="cutlist-board-grid">
        <section className="surface-panel cutlist-main-panel">
          <div className="cutlist-board-header">
            <div>
              <span>{cutlist ? `Revision ${cutlist.revision}` : 'Cutlist foundation'}</span>
              <h2>{project ? `${form.clientName || project.clientName} Cutlist Project` : 'No active cutlist project'}</h2>
              <p>{cutlist ? `${modules.length} modules, ${parts.length} part rows, ${totals.estimatedSheets || 0} estimated sheets, ${totals.estimatedEdgeBandM || 0}m edge banding.` : 'Create a cutlist from the approved brief to generate module schedules, production assumptions, parts, and CSV export.'}</p>
            </div>
            <button className="gold-button" onClick={project ? onCreateCutlistProject : startNewClient} disabled={cutlistLoading}>
              <Layers3 size={16} /> {project ? (cutlist ? 'Refresh Cutlist' : 'Create Cutlist Project') : 'Add Client'}
            </button>
          </div>

          {cutlist && (
            <div className="cutlist-summary-row">
              <article><strong>{modules.length}</strong><span>Modules</span></article>
              <article><strong>{parts.length}</strong><span>Part rows</span></article>
              <article><strong>{totals.partQuantity || 0}</strong><span>Total parts</span></article>
              <article><strong>{totals.boardAreaSqM || 0} sqm</strong><span>Board area</span></article>
              <article><strong>{totals.sheetCount || totals.estimatedSheets || 0}</strong><span>Sheets</span></article>
            </div>
          )}

          <div className="cutlist-module-grid">
            {(cutlist ? modules : visibleTemplates).map((item) => (
              <article key={item.id} className={cutlist ? 'generated' : ''}>
                <strong>{cutlist ? item.name : item.title}</strong>
                <span>{cutlist ? item.roomLabel || roomLabel(item.room) : item.room}</span>
                <p>{cutlist ? `${item.widthMm} x ${item.heightMm} x ${item.depthMm} mm - ${item.finish}` : item.defaults}</p>
                <small>{cutlist ? item.material : designPackage ? 'Ready to map from brief' : 'Generate brief first'}</small>
                {cutlist && (
                  <div className="cutlist-card-actions">
                    <button type="button" onClick={() => startEditModule(item)}>Edit</button>
                    <button type="button" onClick={() => onDeleteCutlistModule(item.id)} disabled={cutlistLoading || modules.length <= 1}>Remove</button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {cutlist && (
            <section className="cutlist-editor-section">
              <div className="cutlist-editor-toolbar">
                <div>
                  <div className="screen-section-title">Module editor</div>
                  <p>Change sizes, finish, material, placement notes, and furniture requirements. Saving regenerates dependent parts and sheet preview.</p>
                </div>
                <button className="secondary-light-button" onClick={() => { setAddingModule(true); setEditingModuleId(''); }}>
                  <Plus size={16} /> Add Module
                </button>
              </div>
              {activeEditModule && (
                <ModuleDraftForm
                  title={`Editing ${activeEditModule.name}`}
                  draft={moduleDraft}
                  onChange={updateModuleDraft}
                  onCancel={() => setEditingModuleId('')}
                  onSave={saveModule}
                  saving={cutlistLoading}
                />
              )}
              {addingModule && (
                <ModuleDraftForm
                  title="Add manual module"
                  draft={newModuleDraft}
                  onChange={updateNewModuleDraft}
                  onCancel={() => setAddingModule(false)}
                  onSave={addModule}
                  saving={cutlistLoading}
                />
              )}
            </section>
          )}

          {cutlist && sheetLayout && (
            <section className="cutlist-sheet-section">
              <div className="screen-section-title">Sheet layout preview</div>
              <p className="screen-note">{sheetLayout.note}</p>
              <div className="sheet-preview-grid">
                {sheetLayout.sheets.slice(0, 4).map((sheet) => (
                  <article key={sheet.sheetNo} className="sheet-preview-card">
                    <SheetPreview sheet={sheet} />
                    <div>
                      <strong>Sheet {sheet.sheetNo}</strong>
                      <span>{sheet.usedAreaSqM} sqm used - {sheet.wastePercent}% waste - {sheet.pieces.length} pieces</span>
                    </div>
                  </article>
                ))}
              </div>
              {sheetLayout.unplaced?.length > 0 && (
                <div className="cutlist-warning">
                  <strong>{sheetLayout.unplaced.length} pieces need manual review</strong>
                  <span>{sheetLayout.unplaced.slice(0, 4).map((piece) => piece.partCode).join(', ')} may need splitting, special sheets, or drawing revision.</span>
                </div>
              )}
            </section>
          )}

          {cutlist && (
            <section className="cutlist-parts-section">
              <div className="screen-section-title">Generated part list</div>
              <div className="cutlist-parts-table">
                <div className="cutlist-parts-head">
                  <span>Part code</span>
                  <span>Part</span>
                  <span>Size</span>
                  <span>Qty</span>
                  <span>Edge / Grain</span>
                </div>
                {parts.slice(0, 18).map((part) => (
                  <article key={part.id}>
                    <strong>{part.partCode}</strong>
                    <span>{part.name}<small>{part.material}</small></span>
                    <span>{part.lengthMm} x {part.widthMm} x {part.thicknessMm} mm</span>
                    <b>{part.quantity}</b>
                    <span>{part.edgeBand}<small>{part.grain}</small></span>
                  </article>
                ))}
              </div>
              {parts.length > 18 && <p className="screen-note">Showing first 18 part rows. Export CSV for the full workshop list.</p>}
            </section>
          )}
        </section>

        <aside className="surface-panel cutlist-side-panel">
          <div className="screen-section-title">Production readiness</div>
          <div className="readiness-checklist compact-production-checklist">
            {productionReadiness.map((item) => (
              <article key={item.label} className={item.done ? 'done' : ''}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="screen-section-title">Production defaults</div>
          <div className="cutlist-defaults-grid">
            <article><strong>Board</strong><span>18mm carcass, 6mm/8mm back panel, BWP for wet zones.</span></article>
            <article><strong>Edgeband</strong><span>2mm visible edges, 0.8mm internal edges, grain direction marked.</span></article>
            <article><strong>Hardware</strong><span>Soft-close channels/hinges by budget tier with site-specific notes.</span></article>
            <article><strong>Sheets</strong><span>8x4 ft sheet basis, trim/kerf to be finalized in Phase 2 optimizer.</span></article>
          </div>

          <div className="screen-section-title">Material confidence</div>
          <div className="material-mini-list compact-material-confidence">
            {(laminates || []).slice(0, 4).map((item) => (
              <article key={item.id}>
                <span style={{ background: item.hex }} />
                <strong>{item.brand}<small>{item.collection} - {item.finish}</small></strong>
              </article>
            ))}
          </div>

          <div className="screen-section-title">Actions</div>
          <button className="secondary-light-button" onClick={onCreateCutlistProject} disabled={!project || cutlistLoading}>
            <Layers3 size={16} /> {cutlist ? 'Refresh From Brief' : 'Create Cutlist Project'}
          </button>
          <button className="secondary-light-button" onClick={onRegenerateCutlistParts} disabled={!cutlist || cutlistLoading}>
            <RotateCcw size={16} /> Regenerate Parts
          </button>
          <button className="secondary-light-button" onClick={onDownloadCutlistCsv} disabled={!cutlist}>
            <Download size={16} /> Export Workshop CSV
          </button>
          <button className="secondary-light-button" onClick={onDownloadCutlistPdf} disabled={!cutlist}>
            <FileText size={16} /> Export Cutlist PDF
          </button>
          <button className="secondary-light-button" onClick={onDownloadProposal} disabled={!project}>
            <FileText size={16} /> Export PDF Brief First
          </button>
          <button className="secondary-light-button" onClick={onExportBackup}>
            <Download size={16} /> Export Backup
          </button>
        </aside>
      </div>

      <section className="surface-panel pricing-panel">
        <div>
          <span>Commercial scope</span>
          <h2>{phaseOnePricing.amount}</h2>
          <p>{phaseOnePricing.cap}. Includes dashboard, onboarding, PDF brief workflow, cutlist foundation, materials, local storage, QA, and handover docs.</p>
        </div>
        <div className="pricing-milestones">
          {phaseOnePricing.milestones.map((item) => (
            <article key={item.label}>
              <strong>{item.amount}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>
    </ScreenFrame>
  );
}

function ModuleDraftForm({ title, draft, onChange, onCancel, onSave, saving }) {
  return (
    <div className="module-edit-form">
      <div className="module-edit-header">
        <strong>{title}</strong>
        <span>Workshop dimensions in millimetres</span>
      </div>
      <label>
        Room
        <select value={draft.room || 'living'} onChange={(event) => onChange('room', event.target.value)}>
          {roomOptions.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
          <option value="custom">Custom</option>
        </select>
      </label>
      <label>
        Module
        <input value={draft.name || ''} onChange={(event) => onChange('name', event.target.value)} placeholder="TV unit, wardrobe, island..." />
      </label>
      <label>
        Type
        <input value={draft.moduleType || ''} onChange={(event) => onChange('moduleType', event.target.value)} placeholder="tv-unit" />
      </label>
      <div className="module-dimension-row">
        <label>
          Width
          <input type="number" min="100" max="6000" value={draft.widthMm || 0} onChange={(event) => onChange('widthMm', event.target.value)} />
        </label>
        <label>
          Height
          <input type="number" min="100" max="6000" value={draft.heightMm || 0} onChange={(event) => onChange('heightMm', event.target.value)} />
        </label>
        <label>
          Depth
          <input type="number" min="100" max="6000" value={draft.depthMm || 0} onChange={(event) => onChange('depthMm', event.target.value)} />
        </label>
      </div>
      <label>
        Material
        <input value={draft.material || ''} onChange={(event) => onChange('material', event.target.value)} placeholder="BWP plywood 18mm" />
      </label>
      <label>
        Finish
        <input value={draft.finish || ''} onChange={(event) => onChange('finish', event.target.value)} placeholder="Matte laminate, veneer, acrylic..." />
      </label>
      <label className="module-form-wide">
        Placement / site note
        <textarea rows="3" value={draft.placementNote || ''} onChange={(event) => onChange('placementNote', event.target.value)} placeholder="Wall, clearance, appliance, service or Vastu note" />
      </label>
      <label className="module-form-wide">
        Furniture requirement
        <textarea rows="3" value={draft.furnitureRequirement || ''} onChange={(event) => onChange('furnitureRequirement', event.target.value)} placeholder="Floating walnut TV unit with fluted backing..." />
      </label>
      <div className="module-edit-actions">
        <button className="secondary-light-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="gold-button" type="button" onClick={onSave} disabled={saving}>Save & Regenerate</button>
      </div>
    </div>
  );
}

function SheetPreview({ sheet }) {
  const colors = ['#c49a52', '#8d6f4d', '#6d7755', '#b9a58a', '#d8c7a7', '#9b6b43', '#76827b'];
  return (
    <svg className="sheet-preview-svg" viewBox={`0 0 ${sheet.lengthMm} ${sheet.widthMm}`} role="img" aria-label={`Sheet ${sheet.sheetNo} layout`}>
      <rect x="0" y="0" width={sheet.lengthMm} height={sheet.widthMm} rx="34" fill="#0d1110" stroke="#b88a2f" strokeWidth="12" />
      {sheet.pieces.slice(0, 90).map((piece, index) => (
        <g key={`${piece.id}-${index}`}>
          <rect
            x={piece.x}
            y={piece.y}
            width={Math.max(piece.w, 16)}
            height={Math.max(piece.h, 16)}
            fill={colors[index % colors.length]}
            stroke="#f6efe1"
            strokeWidth="4"
          />
          {piece.w > 280 && piece.h > 90 && (
            <text x={piece.x + 18} y={piece.y + 42} fill="#171b18" fontSize="42" fontWeight="700">{piece.partCode}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function moduleDraftFrom(module) {
  return {
    name: module.name || '',
    room: module.room || 'living',
    moduleType: module.moduleType || '',
    widthMm: module.widthMm || 1200,
    heightMm: module.heightMm || 1800,
    depthMm: module.depthMm || 450,
    material: module.material || '',
    finish: module.finish || '',
    placementNote: module.placementNote || '',
    furnitureRequirement: module.furnitureRequirement || '',
    sizeNote: module.sizeNote || '',
    hardware: module.hardware || ''
  };
}

function emptyModuleDraft(room = 'living') {
  return {
    room,
    name: 'Custom Storage Module',
    moduleType: 'custom-storage',
    widthMm: 1200,
    heightMm: 1800,
    depthMm: 450,
    material: 'BWR/HDMR plywood 18mm',
    finish: 'Durable matte laminate',
    placementNote: 'Manual module added during cutlist review.',
    furnitureRequirement: ''
  };
}

export function LibraryScreen({ library }) {
  const [roomFilter, setRoomFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [query, setQuery] = useState('');
  const gallery = useMemo(() => designGalleryItems.filter((item) => {
    const search = query.trim().toLowerCase();
    const text = [item.title, item.room, item.style, item.budgetTier, item.conversionNote, ...(item.tags || [])].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (roomFilter !== 'all' && item.room !== roomFilter) return false;
    if (styleFilter !== 'all' && item.style !== styleFilter) return false;
    if (budgetFilter !== 'all' && item.budgetTier !== budgetFilter) return false;
    return true;
  }), [budgetFilter, query, roomFilter, styleFilter]);
  const generated = useMemo(() => library.filter((asset) => {
    const search = query.trim().toLowerCase();
    const text = [asset.title, asset.room, asset.style, asset.budgetTier, asset.sourceType, ...(asset.tags || [])].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (roomFilter !== 'all' && asset.room !== roomFilter) return false;
    if (styleFilter !== 'all' && asset.style !== styleFilter) return false;
    if (budgetFilter !== 'all' && asset.budgetTier !== budgetFilter) return false;
    return true;
  }).slice(0, 48), [budgetFilter, library, query, roomFilter, styleFilter]);

  return (
    <ScreenFrame title="Design & Image Gallery" subtitle="Curated design directions plus generated, uploaded, and reusable client assets">
      <div className="screen-toolbar gallery-toolbar">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search room, style, material, use case" />
        </label>
        <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)}>
          <option value="all">All rooms</option>
          {roomOptions.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
        </select>
        <select value={styleFilter} onChange={(event) => setStyleFilter(event.target.value)}>
          <option value="all">All styles</option>
          {styleOptions.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
        </select>
        <select value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value)}>
          <option value="all">All budgets</option>
          <option value="value">Essential</option>
          <option value="comfort">Comfort</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      <div className="gallery-meta-row">
        <span><Filter size={15} /> {gallery.length} curated design directions</span>
        <span><ImagePlus size={15} /> {generated.length} reusable generated assets</span>
      </div>

      <section className="design-gallery-grid">
        {gallery.map((item) => (
          <article key={item.id}>
            <img src={item.image} alt={item.title} />
            <div>
              <strong>{item.title}</strong>
              <span>{roomOptions.find((room) => room.id === item.room)?.label || item.room} - {styleLabel(item.style)} - {item.budgetTier}</span>
              <p>{item.conversionNote}</p>
              <small>{item.tags.join(' / ')}</small>
            </div>
          </article>
        ))}
        {gallery.length === 0 && <p className="screen-note">No curated gallery cards match the current filters.</p>}
      </section>

      <div className="screen-toolbar generated-toolbar"><ImagePlus size={16} /> Reusable generated assets - room - style - budget - source</div>
      <div className="asset-library-grid">
        {generated.map((asset) => (
          <article key={asset.id}>
            <img src={assetUrl(asset.url)} alt={asset.title || asset.room} />
            <strong>{asset.title || asset.room}</strong>
            <span>{asset.room} - {asset.style} - {asset.sourceType}</span>
          </article>
        ))}
        {generated.length === 0 && <p className="screen-note">No generated assets yet. Create a PDF brief from Onboarding to populate this optional reference library.</p>}
      </div>
    </ScreenFrame>
  );
}

export function MaterialsScreen({ laminates }) {
  const [items, setItems] = useState(laminates || []);
  const [brandFilter, setBrandFilter] = useState('all');
  const [finishFilter, setFinishFilter] = useState('all');
  const [useCaseFilter, setUseCaseFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('premium');
  const [loading, setLoading] = useState(false);
  const brands = ['Merino', 'Greenlam', 'Royale Touche', 'CenturyLaminates', 'Airolam'];

  useEffect(() => {
    const params = new URLSearchParams();
    if (brandFilter !== 'all') params.set('brand', brandFilter);
    if (finishFilter !== 'all') params.set('finish', finishFilter);
    if (useCaseFilter !== 'all') params.set('useCase', useCaseFilter);
    if (budgetFilter !== 'all') params.set('budget', budgetFilter);
    setLoading(true);
    api(`/api/materials/laminates?${params.toString()}`)
      .then((data) => setItems(data.items || []))
      .catch(() => setItems(laminates || []))
      .finally(() => setLoading(false));
  }, [brandFilter, budgetFilter, finishFilter, laminates, useCaseFilter]);

  return (
    <ScreenFrame title="Materials & Laminates" subtitle="Selective Indian laminate intelligence for budget, room, and maintenance needs">
      <div className="material-filterbar">
        <span><SlidersHorizontal size={16} /> Laminate selector</span>
        <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
          <option value="all">All brands</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">All finishes</option>
          <option value="matte">Matte</option>
          <option value="gloss">High gloss</option>
          <option value="fingerprint">Anti-fingerprint</option>
          <option value="fluted">Fluted</option>
          <option value="wood">Woodgrain</option>
          <option value="acrylic">Acrylic</option>
        </select>
        <select value={useCaseFilter} onChange={(event) => setUseCaseFilter(event.target.value)}>
          <option value="all">All use cases</option>
          <option value="kitchen">Kitchen</option>
          <option value="wardrobe">Wardrobe</option>
          <option value="tv-unit">TV unit</option>
          <option value="pooja">Pooja</option>
        </select>
        <select value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value)}>
          <option value="all">All budgets</option>
          <option value="value">Essential</option>
          <option value="comfort">Comfort</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>
      {loading && <p className="screen-note">Refreshing laminate matches...</p>}
      <div className="material-catalog-grid">
        {items.map((item) => (
          <article key={item.id}>
            <span style={{ background: item.hex }} />
            <div>
              <strong>{item.brand} {item.collection}</strong>
              <small>{item.finish} - {item.texture} - {item.budgetTier}</small>
              <p>{item.maintenance}</p>
              <em>{(item.bestFor || []).join(' / ')}</em>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="screen-note">No laminate products match these filters.</p>}
      </div>
    </ScreenFrame>
  );
}

export function RendersScreen({ project, form, floorPlanDraft, providerStatus, library = [], startNewClient, projectList = [], openProject }) {
  const projectFloorPlan = project?.floorPlan || floorPlanDraft?.stored || null;
  const annotations = projectFloorPlan?.annotations || floorPlanDraft?.annotations || { zones: [], markers: [] };
  const roomChoices = useMemo(() => roomsForRenderStudio(project, form, annotations), [project, form, annotations]);
  const [renders, setRenders] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedRender, setSelectedRender] = useState(null);
  const [renderPlan, setRenderPlan] = useState(null);
  const [reuseMatches, setReuseMatches] = useState([]);
  const [room, setRoom] = useState(roomChoices[0]?.id || 'living');
  const [style, setStyle] = useState(form?.primaryStyle || project?.primaryStyle || 'indian-contemporary');
  const [budgetTier, setBudgetTier] = useState(form?.budgetTier || project?.budgetTier || 'premium');
  const [modelTier, setModelTier] = useState('precision');
  const [cameraAngle, setCameraAngle] = useState('diagonal');
  const [variantCount, setVariantCount] = useState(4);
  const [removePeople, setRemovePeople] = useState(true);
  const [furnitureRequirement, setFurnitureRequirement] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [revisionRequest, setRevisionRequest] = useState('');
  const [correctionMistake, setCorrectionMistake] = useState('');
  const [correctionRule, setCorrectionRule] = useState('');
  const [busy, setBusy] = useState('');
  const [uploads, setUploads] = useState({
    sitePhoto: null,
    stylePhoto: null,
    zoomedFloorPlan: null,
    fullFloorPlan: null
  });
  const [kitchenRules, setKitchenRules] = useState({
    hobSinkSwapped: false,
    chimneyOverHob: true,
    loftAligned: true,
    uniformLoftHeight: true
  });
  const [livingRules, setLivingRules] = useState({
    concealedRafterDoors: true,
    raftersEndFirstDoor: true,
    backPanelMaterial: 'marble',
    sofaShape: 'L-shaped'
  });

  const layoutConstraints = useMemo(
    () => extractRenderLayoutConstraints(annotations, room, project?.floorPlanNotes || form?.floorPlanNotes || ''),
    [annotations, form?.floorPlanNotes, project?.floorPlanNotes, room]
  );
  const floorPlanAvailable = Boolean(projectFloorPlan?.filePath || floorPlanDraft?.fileName || layoutConstraints.hasFloorPlan);

  const gallery = useMemo(() => {
    const current = renders.filter((item) => !room || matchesRenderRoom(item.room, room));
    return current.length ? current : renders;
  }, [renders, room]);

  const matchedLibrary = useMemo(() => {
    const tags = new Set([
      room,
      style,
      budgetTier,
      ...layoutConstraints.markers.map((marker) => marker.type?.toLowerCase())
    ].filter(Boolean));
    return library
      .filter((item) => item.room === room || item.style === style || item.budgetTier === budgetTier)
      .map((item) => ({
        ...item,
        score: 76 + (item.tags || []).filter((tag) => tags.has(String(tag).toLowerCase())).length * 5
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [budgetTier, layoutConstraints.markers, library, room, style]);

  useEffect(() => {
    if (!roomChoices.some((item) => item.id === room)) {
      setRoom(roomChoices[0]?.id || 'living');
    }
  }, [roomChoices, room]);

  useEffect(() => {
    setStyle(form?.primaryStyle || project?.primaryStyle || 'indian-contemporary');
    setBudgetTier(form?.budgetTier || project?.budgetTier || 'premium');
  }, [form?.budgetTier, form?.primaryStyle, project?.budgetTier, project?.primaryStyle]);

  useEffect(() => {
    if (!project?.id) return;
    refreshRenderDesk();
  }, [project?.id]);

  async function refreshRenderDesk() {
    if (!project?.id) return;
    try {
      const [renderData, correctionData] = await Promise.all([
        api(`/api/projects/${project.id}/renders`),
        api(`/api/projects/${project.id}/renders/mistakes`)
      ]);
      const nextRenders = renderData.items || [];
      setRenders(nextRenders);
      setCorrections(correctionData.items || []);
      setSelectedRender((prev) => nextRenders.find((item) => item.id === prev?.id) || nextRenders[0] || null);
    } catch (err) {
      console.error('Render desk refresh failed:', err);
    }
  }

  function handleUpload(key, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploads((prev) => ({
        ...prev,
        [key]: {
          file,
          name: file.name,
          preview: event.target?.result || ''
        }
      }));
    };
    reader.readAsDataURL(file);
  }

  function clearUpload(key) {
    setUploads((prev) => ({ ...prev, [key]: null }));
  }

  async function handleGenerateRender() {
    if (!project?.id) return;
    setBusy('Compiling floor-plan-aware render prompts and generating variants...');
    try {
      const body = new FormData();
      body.append('room', room);
      body.append('style', style);
      body.append('budgetTier', budgetTier);
      body.append('modelTier', modelTier);
      body.append('variantCount', String(variantCount));
      body.append('cameraAngle', cameraAngle);
      body.append('removePeople', String(removePeople));
      body.append('furnitureRequirement', furnitureRequirement);
      body.append('customInstruction', customInstruction);
      body.append('layoutAnnotations', JSON.stringify(annotations));
      body.append('floorPlanNotes', project?.floorPlanNotes || form?.floorPlanNotes || '');
      body.append('hobSinkSwapped', String(kitchenRules.hobSinkSwapped));
      body.append('chimneyOverHob', String(kitchenRules.chimneyOverHob));
      body.append('loftAligned', String(kitchenRules.loftAligned));
      body.append('uniformLoftHeight', String(kitchenRules.uniformLoftHeight));
      body.append('concealedRafterDoors', String(livingRules.concealedRafterDoors));
      body.append('raftersEndFirstDoor', String(livingRules.raftersEndFirstDoor));
      body.append('backPanelMaterial', livingRules.backPanelMaterial);
      body.append('sofaShape', livingRules.sofaShape);
      Object.entries(uploads).forEach(([key, value]) => {
        if (value?.file) body.append(key, value.file);
      });

      const result = await api(`/api/projects/${project.id}/renders/generate`, { method: 'POST', body });
      const nextVariants = result.variants?.length ? result.variants : result.asset ? [result.asset] : [];
      setRenders((prev) => mergeUniqueRenders([...nextVariants, ...prev]));
      setSelectedRender(nextVariants[0] || selectedRender);
      setRenderPlan(result.renderPlan || null);
      setReuseMatches(result.reuseMatches || []);
      setCorrections(result.correctionsApplied || corrections);
      setCustomInstruction('');
      setFurnitureRequirement('');
    } catch (err) {
      alert(`Render generation failed: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function handleEditRender() {
    if (!selectedRender || !revisionRequest.trim() || !project?.id) return;
    setBusy('Creating revision from the selected render...');
    try {
      const result = await api(`/api/projects/${project.id}/renders/edit`, {
        method: 'POST',
        body: JSON.stringify({ assetId: selectedRender.id, revisionRequest })
      });
      setRenders((prev) => mergeUniqueRenders([result.asset, ...prev]));
      setSelectedRender(result.asset);
      setRevisionRequest('');
    } catch (err) {
      alert(`Render revision failed: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function handleSaveCorrection() {
    if (!project?.id || !selectedRender || !correctionMistake.trim() || !correctionRule.trim()) return;
    setBusy('Saving correction rule for future renders...');
    try {
      await api(`/api/projects/${project.id}/renders/mistake`, {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedRender.id,
          mistakeDescription: correctionMistake,
          correction: correctionRule
        })
      });
      setCorrectionMistake('');
      setCorrectionRule('');
      await refreshRenderDesk();
    } catch (err) {
      alert(`Could not save correction: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  if (!project) {
    return (
      <ScreenFrame title="AI Render Studio" subtitle="Fast, accurate onboarding renders require an active client project" tone="command">
        <section className="surface-panel render-empty-state">
          <ImagePlus size={42} />
          <h2>No active client selected</h2>
          <p>Start from Add Client, capture rooms and floor plan markers, then generate four room-specific render options for the onboarding brief.</p>
          <button className="gold-button" onClick={startNewClient}><Plus size={16} /> Add Client</button>
          {projectList.length > 0 && (
            <div className="render-open-project-list">
              <strong>Continue saved project</strong>
              {projectList.slice(0, 4).map((item) => (
                <button key={item.id} onClick={() => openProject?.(item.id, 'renders')}>
                  <span>{item.clientName || 'Saved client'}</span>
                  <small>{item.city || 'City pending'} - {item.stage || 'Intake'}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame title="AI Render Studio" subtitle="Generate floor-plan-aware render variants for client onboarding, correction memory, and reusable library growth" tone="command">
      <div className="render-studio-shell">
        <aside className="surface-panel render-control-panel">
          <div className="render-project-card">
            <span>Active client</span>
            <strong>{project.clientName}</strong>
            <small>{project.city || 'India'} - {project.homeType?.toUpperCase()} - {styleLabel(style)}</small>
          </div>

          <div className="render-mini-metrics">
            <article><strong>{providerStatus?.activeLabel || 'curated'}</strong><span>image source</span></article>
            <article><strong>{layoutConstraints.markers.length}</strong><span>markers</span></article>
            <article><strong>{corrections.length}</strong><span>rules</span></article>
          </div>

          <div className="render-section">
            <div className="screen-section-title">Room and theme</div>
            <div className="render-room-grid">
              {roomChoices.map((item) => (
                <button key={item.id} className={room === item.id ? 'active' : ''} onClick={() => setRoom(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <label>Theme<select value={style} onChange={(event) => setStyle(event.target.value)}>
              {styleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select></label>
            <label>Budget tier<select value={budgetTier} onChange={(event) => setBudgetTier(event.target.value)}>
              <option value="value">Essential</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
            </select></label>
          </div>

          <div className="render-section">
            <div className="screen-section-title">Generation mode</div>
            <div className="render-tier-toggle">
              {[
                ['quick', 'Quick'],
                ['standard', 'Balanced'],
                ['precision', 'Precision']
              ].map(([value, label]) => (
                <button key={value} className={modelTier === value ? 'active' : ''} onClick={() => setModelTier(value)}>{label}</button>
              ))}
            </div>
            <div className="render-two-fields">
              <label>Variants<select value={variantCount} onChange={(event) => setVariantCount(Number(event.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select></label>
              <label>Camera<select value={cameraAngle} onChange={(event) => setCameraAngle(event.target.value)}>
                <option value="diagonal">Diagonal</option>
                <option value="elevation">Elevation</option>
                <option value="wide">Wide angle</option>
              </select></label>
            </div>
            <label className="render-inline-check"><input type="checkbox" checked={removePeople} onChange={(event) => setRemovePeople(event.target.checked)} /> Remove people</label>
          </div>

          {room === 'kitchen' && (
            <div className="render-section">
              <div className="screen-section-title">Kitchen accuracy rules</div>
              {Object.entries({
                hobSinkSwapped: 'Hob left, sink under window',
                chimneyOverHob: 'Chimney directly over hob',
                loftAligned: 'Lofts stop at window',
                uniformLoftHeight: 'Uniform loft height'
              }).map(([key, label]) => (
                <label key={key} className="render-inline-check">
                  <input type="checkbox" checked={kitchenRules[key]} onChange={(event) => setKitchenRules((prev) => ({ ...prev, [key]: event.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
          )}

          {room === 'living' && (
            <div className="render-section">
              <div className="screen-section-title">Living / TV wall rules</div>
              <label>Back panel<select value={livingRules.backPanelMaterial} onChange={(event) => setLivingRules((prev) => ({ ...prev, backPanelMaterial: event.target.value }))}>
                <option value="marble">Backlit marble</option>
                <option value="wood">Walnut veneer</option>
                <option value="quartz">Fluted quartz</option>
                <option value="plain">Plain wall</option>
              </select></label>
              <label>Sofa<select value={livingRules.sofaShape} onChange={(event) => setLivingRules((prev) => ({ ...prev, sofaShape: event.target.value }))}>
                <option value="L-shaped">L-shaped sectional</option>
                <option value="straight">Straight sofa</option>
                <option value="none">No sofa in view</option>
              </select></label>
              <label className="render-inline-check"><input type="checkbox" checked={livingRules.concealedRafterDoors} onChange={(event) => setLivingRules((prev) => ({ ...prev, concealedRafterDoors: event.target.checked }))} /> Concealed rafter door</label>
              <label className="render-inline-check"><input type="checkbox" checked={livingRules.raftersEndFirstDoor} onChange={(event) => setLivingRules((prev) => ({ ...prev, raftersEndFirstDoor: event.target.checked }))} /> Rafters end at first door</label>
            </div>
          )}

          <div className="render-section">
            <div className="screen-section-title">Inputs for accuracy</div>
            <UploadSlot label="Site photo" accept="image/*" value={uploads.sitePhoto} onPick={(file) => handleUpload('sitePhoto', file)} onClear={() => clearUpload('sitePhoto')} />
            <UploadSlot label="Style reference" accept="image/*" value={uploads.stylePhoto} onPick={(file) => handleUpload('stylePhoto', file)} onClear={() => clearUpload('stylePhoto')} />
            <UploadSlot label="Zoomed plan/control image" accept="image/*,application/pdf" value={uploads.zoomedFloorPlan} onPick={(file) => handleUpload('zoomedFloorPlan', file)} onClear={() => clearUpload('zoomedFloorPlan')} />
            <UploadSlot label="Full floor plan" accept="image/*,application/pdf" value={uploads.fullFloorPlan} onPick={(file) => handleUpload('fullFloorPlan', file)} onClear={() => clearUpload('fullFloorPlan')} />
          </div>

          <div className="render-section">
            <div className="screen-section-title">Exact furniture requirement</div>
            <textarea rows="3" value={furnitureRequirement} onChange={(event) => setFurnitureRequirement(event.target.value)} placeholder="Example: floating walnut TV unit with fluted backing, beige marble slab, brass profile, concealed wiring" />
            <textarea rows="3" value={customInstruction} onChange={(event) => setCustomInstruction(event.target.value)} placeholder="Extra instruction for this generation only" />
            <button className="gold-button" onClick={handleGenerateRender} disabled={Boolean(busy)}>
              <Sparkles size={16} /> Generate Render Variants
            </button>
          </div>
        </aside>

        <main className="surface-panel render-preview-panel">
          <div className="render-preview-header">
            <div>
              <span>{busy || 'Ready to generate'}</span>
              <h2>{roomLabel(room)} render options</h2>
              <p>{renderPlan?.modelPlan?.note || 'Four variants are saved to the project and reusable image library.'}</p>
            </div>
            <div className="render-preview-actions">
              <button className="gold-button" onClick={handleGenerateRender} disabled={Boolean(busy)}>
                <Sparkles size={15} /> Generate Variants
              </button>
              {busy && <div className="render-busy-pulse" />}
            </div>
          </div>

          {selectedRender ? (
            <div className="render-main-frame">
              <img src={assetUrl(selectedRender.url)} alt={selectedRender.title} />
              <div className="render-main-badge">{selectedRender.sourceType || 'render'}</div>
            </div>
          ) : (
            <div className="render-main-placeholder">
              <ImagePlus size={52} />
              <strong>No render generated yet</strong>
              <span>Choose a room, confirm layout constraints, and generate variants.</span>
            </div>
          )}

          <div className="render-variant-strip">
            {gallery.slice(0, 8).map((item) => (
              <button key={item.id} className={selectedRender?.id === item.id ? 'active' : ''} onClick={() => setSelectedRender(item)}>
                <img src={assetUrl(item.url)} alt={item.title} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>

          {selectedRender && (
            <div className="render-revision-bar">
              <input value={revisionRequest} onChange={(event) => setRevisionRequest(event.target.value)} placeholder="Refine selected render, e.g. make TV wall warmer and keep sofa placement same" />
              <button className="gold-button" onClick={handleEditRender} disabled={Boolean(busy) || !revisionRequest.trim()}><Sparkles size={15} /> Revise</button>
            </div>
          )}

          <div className="render-prompt-panel">
            <strong>Compiled prompt</strong>
            <p>{renderPlan?.prompt || selectedRender?.prompt || 'The generated prompt will appear here after you run the render.'}</p>
          </div>
        </main>

        <aside className="surface-panel render-inspector-panel">
          <div className="screen-section-title">Layout constraints used</div>
          <div className="render-constraint-list">
            <article>
              <strong>{floorPlanAvailable ? 'Floor plan available' : 'No floor plan file'}</strong>
              <span>{projectFloorPlan?.filePath || floorPlanDraft?.fileName || 'Upload through onboarding or this studio.'}</span>
            </article>
            {layoutConstraints.zones.map((zone) => (
              <article key={`${zone.room}-${zone.x}-${zone.y}`}>
                <strong>{zone.label}</strong>
                <span>x{zone.x} y{zone.y} w{zone.w} h{zone.h}</span>
              </article>
            ))}
            {layoutConstraints.markers.map((marker, index) => (
              <article key={`${marker.type}-${index}`}>
                <strong>{marker.type}</strong>
                <span>{[marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join(' - ') || `x${marker.x} y${marker.y}`}</span>
              </article>
            ))}
            {!layoutConstraints.zones.length && !layoutConstraints.markers.length && (
              <article><strong>Prompt-only layout</strong><span>Add markers in onboarding for better spatial adherence.</span></article>
            )}
          </div>

          <div className="screen-section-title">Reusable matches</div>
          <div className="render-match-grid">
            {[...reuseMatches, ...matchedLibrary].slice(0, 4).map((item) => (
              <article key={item.id}>
                <img src={assetUrl(item.url)} alt={item.title} />
                <strong>{item.matchScore || item.score || item.reusableScore || 82}%</strong>
                <span>{item.title}</span>
              </article>
            ))}
            {!reuseMatches.length && !matchedLibrary.length && <p className="screen-note">No matching library images yet. Generated variants will build the library.</p>}
          </div>

          <div className="screen-section-title">Correction memory</div>
          <div className="render-correction-list">
            {corrections.slice(0, 5).map((item, index) => (
              <article key={item.id || index}>
                <strong>{item.room || 'room'} rule</strong>
                <span>{item.avoidance_instruction || item.correction}</span>
              </article>
            ))}
            {!corrections.length && <p className="screen-note">Save failed render corrections here so future prompts inherit them.</p>}
          </div>

          <div className="render-correction-form">
            <input value={correctionMistake} onChange={(event) => setCorrectionMistake(event.target.value)} placeholder="What went wrong?" />
            <textarea rows="3" value={correctionRule} onChange={(event) => setCorrectionRule(event.target.value)} placeholder="Exact future rule, e.g. wall cabinets must stay white below beige lofts" />
            <button className="secondary-light-button" onClick={handleSaveCorrection} disabled={!selectedRender || !correctionMistake.trim() || !correctionRule.trim() || Boolean(busy)}>
              Save Correction Rule
            </button>
          </div>
        </aside>
      </div>
    </ScreenFrame>
  );
}

function UploadSlot({ label, accept, value, onPick, onClear }) {
  return (
    <div className="render-upload-slot">
      <label>
        <Upload size={14} />
        <span>{value?.name || label}</span>
        <input type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0])} />
      </label>
      {value?.preview && value.file?.type?.startsWith('image/') && <img src={value.preview} alt={label} />}
      {value && <button type="button" onClick={onClear}>Clear</button>}
    </div>
  );
}

function roomsForRenderStudio(project, form, annotations = { zones: [], markers: [] }) {
  const ids = new Set([
    ...(project?.selectedSpaces || []),
    ...(form?.selectedSpaces || []),
    ...(annotations.zones || []).map((zone) => zone.room),
    ...(annotations.markers || []).map((marker) => marker.room)
  ].filter(Boolean));
  if (!ids.size) ['living', 'kitchen', 'master', 'pooja'].forEach((id) => ids.add(id));
  return Array.from(ids)
    .map((id) => roomOptions.find((room) => room.id === id) || { id, label: roomLabel(id) })
    .slice(0, 8);
}

function extractRenderLayoutConstraints(annotations = { zones: [], markers: [] }, room, notes = '') {
  const zones = (annotations.zones || [])
    .filter((zone) => matchesRenderRoom(zone.room, room))
    .map((zone) => ({
      room: zone.room,
      label: zone.label || roomLabel(zone.room),
      x: normalizedPercent(zone.x),
      y: normalizedPercent(zone.y),
      w: normalizedPercent(zone.w ?? zone.width),
      h: normalizedPercent(zone.h ?? zone.height),
      note: zone.note || ''
    }));
  const markers = (annotations.markers || [])
    .filter((marker) => matchesRenderRoom(marker.room, room))
    .map((marker) => ({
      room: marker.room,
      type: marker.type || 'Component',
      x: normalizedPercent(marker.x),
      y: normalizedPercent(marker.y),
      placementNote: marker.placementNote || '',
      sizeNote: marker.sizeNote || '',
      furnitureRequirement: marker.furnitureRequirement || ''
    }));
  return {
    hasFloorPlan: zones.length > 0 || markers.length > 0,
    notes,
    zones,
    markers
  };
}

function matchesRenderRoom(value, room) {
  if (!value || !room) return false;
  if (value === room) return true;
  const aliases = {
    master: ['masterBed'],
    masterBed: ['master'],
    pooja: ['temple'],
    temple: ['pooja'],
    dining: ['crockery'],
    crockery: ['dining']
  };
  return aliases[room]?.includes(value) || false;
}

function normalizedPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(Math.max(0, Math.min(100, number)));
}

function mergeUniqueRenders(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function LegacyRendersScreen({ project, form, providerStatus, generating: appGenerating }) {
  const [renders, setRenders] = useState([]);
  const [selectedRender, setSelectedRender] = useState(null);
  const [loadingRenders, setLoadingRenders] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState('');

  // Mistakes log state
  const [mistakes, setMistakes] = useState([]);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [mistakeDescription, setMistakeDescription] = useState('');
  const [mistakeCorrection, setMistakeCorrection] = useState('');

  // Compare layout state
  const [compareMode, setCompareMode] = useState(false);

  // Form states
  const [room, setRoom] = useState('kitchen');
  const [style, setStyle] = useState(form?.primaryStyle || 'indian-contemporary');
  const [budgetTier, setBudgetTier] = useState(form?.budgetTier || 'premium');
  const [cameraAngle, setCameraAngle] = useState('diagonal');
  const [removePeople, setRemovePeople] = useState(true);
  
  // Kitchen states
  const [hobSinkSwapped, setHobSinkSwapped] = useState(false);
  const [chimneyOverHob, setChimneyOverHob] = useState(true);
  const [loftAligned, setLoftAligned] = useState(false);
  const [uniformLoftHeight, setUniformLoftHeight] = useState(true);

  // TV Wall states
  const [concealedRafterDoors, setConcealedRafterDoors] = useState(false);
  const [raftersEndFirstDoor, setRaftersEndFirstDoor] = useState(false);
  const [backPanelMaterial, setBackPanelMaterial] = useState('marble');
  const [sofaShape, setSofaShape] = useState('L-shaped');

  // Custom detail state
  const [customInstruction, setCustomInstruction] = useState('');

  // File Upload states (4 inputs!)
  const [sitePhotoPreview, setSitePhotoPreview] = useState('');
  const [sitePhotoFile, setSitePhotoFile] = useState(null);
  const [sitePhotoFileName, setSitePhotoFileName] = useState('');

  const [stylePhotoPreview, setStylePhotoPreview] = useState('');
  const [stylePhotoFile, setStylePhotoFile] = useState(null);
  const [stylePhotoFileName, setStylePhotoFileName] = useState('');

  const [zoomedPlanPreview, setZoomedPlanPreview] = useState('');
  const [zoomedPlanFile, setZoomedPlanFile] = useState(null);
  const [zoomedPlanFileName, setZoomedPlanFileName] = useState('');

  const [fullPlanPreview, setFullPlanPreview] = useState('');
  const [fullPlanFile, setFullPlanFile] = useState(null);
  const [fullPlanFileName, setFullPlanFileName] = useState('');

  // Fetch renders & mistakes for this project
  const refreshRendersAndMistakes = () => {
    if (project?.id) {
      setLoadingRenders(true);
      Promise.all([
        api(`/api/projects/${project.id}/renders`),
        api(`/api/projects/${project.id}/renders/mistakes`)
      ])
        .then(([rendersData, mistakesData]) => {
          setRenders(rendersData.items || []);
          setMistakes(mistakesData.items || []);
          if (rendersData.items?.length > 0) {
            setSelectedRender(rendersData.items[0]);
          } else {
            setSelectedRender(null);
          }
        })
        .catch((err) => console.error("Error fetching studio data:", err))
        .finally(() => setLoadingRenders(false));
    }
  };

  useEffect(() => {
    refreshRendersAndMistakes();
  }, [project?.id]);

  if (!project) {
    return (
      <ScreenFrame title="3D Render Visualizer Studio" subtitle="Generate professional and structural 3D renders matching client specifications">
        <div className="surface-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <ImagePlus size={48} style={{ color: 'var(--gold)', opacity: 0.6, marginBottom: '16px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', marginBottom: '8px' }}>No Active Project</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '380px', margin: '0 auto' }}>
            Please select an existing project from the Dashboard or create a new client project to start synthesizing 3D renders.
          </p>
        </div>
      </ScreenFrame>
    );
  }

  const handleFileChange = (e, setFile, setFileName, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (e, setFile, setFileName, setPreview) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setFile(null);
    setFileName('');
    setPreview('');
  };

  const handleGenerateRender = async () => {
    setIsGenerating(true);
    const stages = [
      "Uploading assets and floor plan blueprints...",
      "Running multimodal vision spatial checks...",
      "Resolving Vastu alignment constraints...",
      "Checking design standards and mistakes logs..."
    ];
    if (room === 'kitchen') {
      if (hobSinkSwapped) stages.push("Swapping Hob and Sink coordinates...");
      if (loftAligned || uniformLoftHeight) stages.push("Applying horizontal overhead loft boundaries...");
    } else if (room === 'living') {
      if (concealedRafterDoors) stages.push("Concealing doorway leaf into wood rafters...");
      if (sofaShape === 'L-shaped') stages.push("Aligning L-shaped sofa to main wall...");
    }
    stages.push("Applying premium laminates and stone textures...");
    stages.push("Executing Visual Validator Agent check (Agent 3)...");
    stages.push("Calculating photorealistic path-traced lighting...");
    stages.push("Rendering final professional CGI output...");

    let stageIdx = 0;
    setLoadingStatus(stages[0]);
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStatus(stages[stageIdx]);
      }
    }, 1100);

    try {
      const formData = new FormData();
      formData.append('room', room);
      formData.append('style', style);
      formData.append('budgetTier', budgetTier);
      formData.append('cameraAngle', cameraAngle);
      formData.append('removePeople', String(removePeople));
      formData.append('hobSinkSwapped', String(hobSinkSwapped));
      formData.append('chimneyOverHob', String(chimneyOverHob));
      formData.append('loftAligned', String(loftAligned));
      formData.append('uniformLoftHeight', String(uniformLoftHeight));
      formData.append('concealedRafterDoors', String(concealedRafterDoors));
      formData.append('raftersEndFirstDoor', String(raftersEndFirstDoor));
      formData.append('backPanelMaterial', backPanelMaterial);
      formData.append('sofaShape', sofaShape);
      formData.append('customInstruction', customInstruction);

      if (sitePhotoFile) formData.append('sitePhoto', sitePhotoFile);
      if (stylePhotoFile) formData.append('stylePhoto', stylePhotoFile);
      if (zoomedPlanFile) formData.append('zoomedFloorPlan', zoomedPlanFile);
      if (fullPlanFile) formData.append('fullFloorPlan', fullPlanFile);

      const result = await api(`/api/projects/${project.id}/renders/generate`, {
        method: 'POST',
        body: formData
      });

      setRenders((prev) => [result.asset, ...prev]);
      setSelectedRender(result.asset);

      // Clear temp files
      clearFile(null, setSitePhotoFile, setSitePhotoFileName, setSitePhotoPreview);
      clearFile(null, setStylePhotoFile, setStylePhotoFileName, setStylePhotoPreview);
      clearFile(null, setZoomedPlanFile, setZoomedPlanFileName, setZoomedPlanPreview);
      clearFile(null, setFullPlanFile, setFullPlanFileName, setFullPlanPreview);
      setCustomInstruction('');
    } catch (err) {
      alert(`Visualizer Error: ${err.message}`);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleEditRender = async () => {
    if (!selectedRender || !revisionRequest.trim()) return;
    setIsRevising(true);
    try {
      const result = await api(`/api/projects/${project.id}/renders/edit`, {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedRender.id,
          revisionRequest: revisionRequest
        })
      });
      setRenders((prev) => [result.asset, ...prev]);
      setSelectedRender(result.asset);
      setRevisionRequest('');
    } catch (err) {
      alert(`Revision Error: ${err.message}`);
    } finally {
      setIsRevising(false);
    }
  };

  const handleLogMistake = async () => {
    if (!selectedRender || !mistakeDescription.trim() || !mistakeCorrection.trim()) return;
    setShowMistakeModal(false);
    setIsGenerating(true);
    setLoadingStatus("Logging design mistake & teaching visualizer...");
    try {
      await api(`/api/projects/${project.id}/renders/mistake`, {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedRender.id,
          mistakeDescription,
          correction: mistakeCorrection
        })
      });

      const mistakesData = await api(`/api/projects/${project.id}/renders/mistakes`);
      setMistakes(mistakesData.items || []);

      setCustomInstruction(mistakeCorrection);
      setMistakeDescription('');
      setMistakeCorrection('');
      
      handleGenerateRender();
    } catch (err) {
      alert(`Error logging correction: ${err.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <ScreenFrame title="3D Render Visualizer Studio" subtitle="Generate professional and structural 3D renders matching client specifications" tone="design">
      
      {showMistakeModal && (
        <div className="modal-overlay active" style={{ zIndex: 600 }}>
          <div className="modal-content" style={{ maxWidth: '500px', background: '#0b0c13', border: '1px solid var(--gold)' }}>
            <h3 className="modal-title" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>Teach AI (Log Render Correction)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Describe what the AI rendered incorrectly (e.g. color bleeding) and write the exact rule it must follow to avoid it.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                What went wrong in the render?
                <input 
                  type="text" 
                  value={mistakeDescription} 
                  onChange={(e) => setMistakeDescription(e.target.value)} 
                  placeholder="e.g. AI colored both the top lofts and wall cabinets beige."
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(189, 147, 74, 0.2)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Correct instruction to follow
                <textarea 
                  rows="3"
                  value={mistakeCorrection} 
                  onChange={(e) => setMistakeCorrection(e.target.value)} 
                  placeholder="e.g. Keep top 3ft lofts beige, but wall cabinets around the chimney MUST be white. No beige bleeding."
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(189, 147, 74, 0.2)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none', resize: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="secondary-light-button" onClick={() => setShowMistakeModal(false)}>Cancel</button>
              <button className="gold-button" onClick={handleLogMistake} disabled={!mistakeDescription.trim() || !mistakeCorrection.trim()}>
                <Sparkles size={14} /> Save & Re-synthesize
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="visualizer-container">
        
        {/* Left column: Parameters and files */}
        <div className="visualizer-form">
          
          <div className="visualizer-group">
            <div className="visualizer-group-title">1. Room Context</div>
            <div className="visualizer-tabs">
              <button className={`visualizer-tab-btn ${room === 'kitchen' ? 'active' : ''}`} onClick={() => setRoom('kitchen')}>
                <span>🍳</span> Kitchen
              </button>
              <button className={`visualizer-tab-btn ${room === 'living' ? 'active' : ''}`} onClick={() => setRoom('living')}>
                <span>🛋️</span> TV Wall
              </button>
              <button className={`visualizer-tab-btn ${room === 'crockery' ? 'active' : ''}`} onClick={() => setRoom('crockery')}>
                <span>🍽️</span> Crockery
              </button>
              <button className={`visualizer-tab-btn ${room === 'temple' ? 'active' : ''}`} onClick={() => setRoom('temple')}>
                <span>🙏</span> Mandir
              </button>
              <button className={`visualizer-tab-btn ${room === 'masterBed' ? 'active' : ''}`} onClick={() => setRoom('masterBed')}>
                <span>🛏️</span> Bedroom
              </button>
            </div>
          </div>

          <div className="visualizer-group">
            <div className="visualizer-group-title">2. Visual Inputs</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Site Photo */}
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Site Photo (Room context)
                {!sitePhotoPreview ? (
                  <div className="visualizer-dropzone" style={{ padding: '10px' }}>
                    <Upload size={14} style={{ color: 'var(--gold)' }} />
                    <span>Upload site photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSitePhotoFile, setSitePhotoFileName, setSitePhotoPreview)} />
                  </div>
                ) : (
                  <div className="visualizer-preview-container" style={{ padding: '4px 8px' }}>
                    <div className="visualizer-preview-info">
                      <img src={sitePhotoPreview} alt="Site" />
                      <span>{sitePhotoFileName}</span>
                    </div>
                    <button className="visualizer-preview-remove" onClick={(e) => clearFile(e, setSitePhotoFile, setSitePhotoFileName, setSitePhotoPreview)}>✕</button>
                  </div>
                )}
              </label>

              {/* Style Reference */}
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Style Reference (Inspiration)
                {!stylePhotoPreview ? (
                  <div className="visualizer-dropzone" style={{ padding: '10px' }}>
                    <ImagePlus size={14} style={{ color: 'var(--gold)' }} />
                    <span>Upload style reference</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setStylePhotoFile, setStylePhotoFileName, setStylePhotoPreview)} />
                  </div>
                ) : (
                  <div className="visualizer-preview-container" style={{ padding: '4px 8px' }}>
                    <div className="visualizer-preview-info">
                      <img src={stylePhotoPreview} alt="Style" />
                      <span>{stylePhotoFileName}</span>
                    </div>
                    <button className="visualizer-preview-remove" onClick={(e) => clearFile(e, setStylePhotoFile, setStylePhotoFileName, setStylePhotoPreview)}>✕</button>
                  </div>
                )}
              </label>

              {/* Zoomed Floor Plan */}
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Zoomed Floor Plan snippet (Precision coords)
                {!zoomedPlanPreview ? (
                  <div className="visualizer-dropzone" style={{ padding: '10px' }}>
                    <MapPinned size={14} style={{ color: 'var(--gold)' }} />
                    <span>Upload zoomed blueprint snippet</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setZoomedPlanFile, setZoomedPlanFileName, setZoomedPlanPreview)} />
                  </div>
                ) : (
                  <div className="visualizer-preview-container" style={{ padding: '4px 8px' }}>
                    <div className="visualizer-preview-info">
                      <img src={zoomedPlanPreview} alt="Zoomed Plan" />
                      <span>{zoomedPlanFileName}</span>
                    </div>
                    <button className="visualizer-preview-remove" onClick={(e) => clearFile(e, setZoomedPlanFile, setZoomedPlanFileName, setZoomedPlanPreview)}>✕</button>
                  </div>
                )}
              </label>

              {/* Full Floor Plan */}
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Full Floor Plan (Vastu orientation)
                {!fullPlanPreview ? (
                  <div className="visualizer-dropzone" style={{ padding: '10px' }}>
                    <MapPinned size={14} style={{ color: 'var(--gold)' }} />
                    <span>Upload full floor plan</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFullPlanFile, setFullPlanFileName, setFullPlanPreview)} />
                  </div>
                ) : (
                  <div className="visualizer-preview-container" style={{ padding: '4px 8px' }}>
                    <div className="visualizer-preview-info">
                      <img src={fullPlanPreview} alt="Full Plan" />
                      <span>{fullPlanFileName}</span>
                    </div>
                    <button className="visualizer-preview-remove" onClick={(e) => clearFile(e, setFullPlanFile, setFullPlanFileName, setFullPlanPreview)}>✕</button>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="visualizer-group">
            <div className="visualizer-group-title">3. General Settings</div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Camera Perspective
              <select className="visualizer-select" value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)}>
                <option value="diagonal">Diagonal Perspective (Standard)</option>
                <option value="elevation">Straight Elevation View</option>
                <option value="wide">Wide Angle View</option>
              </select>
            </label>

            <div className="visualizer-checkbox-grid" style={{ marginTop: '6px' }}>
              <label className="visualizer-checkbox-label">
                <input type="checkbox" checked={removePeople} onChange={(e) => setRemovePeople(e.target.checked)} />
                Remove people from render
              </label>
            </div>
          </div>

          {/* Contextual parameters */}
          {room === 'kitchen' && (
            <div className="visualizer-group">
              <div className="visualizer-group-title">4. Modular Kitchen Specs</div>
              <div className="visualizer-checkbox-grid">
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={hobSinkSwapped} onChange={(e) => setHobSinkSwapped(e.target.checked)} />
                  Swap Hob & Sink (Hob left, Sink under window)
                </label>
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={chimneyOverHob} onChange={(e) => setChimneyOverHob(e.target.checked)} />
                  Mount chimney directly over Hob
                </label>
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={loftAligned} onChange={(e) => setLoftAligned(e.target.checked)} />
                  Lofts end where window starts
                </label>
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={uniformLoftHeight} onChange={(e) => setUniformLoftHeight(e.target.checked)} />
                  Enforce uniform height for all lofts
                </label>
              </div>
            </div>
          )}

          {room === 'living' && (
            <div className="visualizer-group">
              <div className="visualizer-group-title">4. TV Elevation Specs</div>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                TV Backdrop Panel Finish
                <select className="visualizer-select" value={backPanelMaterial} onChange={(e) => setBackPanelMaterial(e.target.value)}>
                  <option value="marble">Book-matched Statutario Marble (Backlit)</option>
                  <option value="wood">Warm Walnut wood veneer panel</option>
                  <option value="quartz">Fluted quartz stone panel</option>
                  <option value="none">No decorative backpanel (Plain Wall)</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Sofa Configuration
                <select className="visualizer-select" value={sofaShape} onChange={(e) => setSofaShape(e.target.value)}>
                  <option value="L-shaped">L-shaped Sectional sofa (aligned to wall)</option>
                  <option value="straight">Straight 3-Seater Sofa</option>
                  <option value="none">Exclude sofa from view</option>
                </select>
              </label>

              <div className="visualizer-checkbox-grid" style={{ marginTop: '10px' }}>
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={concealedRafterDoors} onChange={(e) => setConcealedRafterDoors(e.target.checked)} />
                  Conceal doors in wooden rafter wrap
                </label>
                <label className="visualizer-checkbox-label">
                  <input type="checkbox" checked={raftersEndFirstDoor} onChange={(e) => setRaftersEndFirstDoor(e.target.checked)} />
                  Wood rafters end at first door frame
                </label>
              </div>
            </div>
          )}

          <div className="visualizer-group">
            <div className="visualizer-group-title">5. Custom Design Instructions</div>
            <textarea 
              rows="3" 
              placeholder="e.g. Use beige laminates for lofts and white laminate for wall units..." 
              value={customInstruction} 
              onChange={(e) => setCustomInstruction(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(189, 147, 74, 0.2)',
                color: '#fff',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button className="gold-button" style={{ width: '100%', padding: '12px' }} onClick={handleGenerateRender} disabled={isGenerating || isRevising}>
            <Sparkles size={16} /> Synthesize 3D Render
          </button>
        </div>

        {/* Right column: Interactive Visualizer viewport */}
        <div className="visualizer-showcase">
          
          {/* Active Generation Loading Indicator */}
          {isGenerating && (
            <div className="visualizer-loading-overlay">
              <div className="visualizer-spinner-ring"></div>
              <p>{loadingStatus}</p>
              <span className="visualizer-loading-subtitle">
                Synthesizing photorealistic 3D interior textures based on site coordinates...
              </span>
            </div>
          )}

          {/* Active Revision Loading Indicator */}
          {isRevising && (
            <div className="visualizer-loading-overlay">
              <div className="visualizer-spinner-ring"></div>
              <p>Revising 3D render composition...</p>
              <span className="visualizer-loading-subtitle">
                Editing materials and updating layout bounds according to comments...
              </span>
            </div>
          )}

          {/* Viewport Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="screen-section-title" style={{ margin: 0 }}>AI Viewport</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedRender && sitePhotoPreview && (
                <button 
                  className={`secondary-light-button ${compareMode ? 'active' : ''}`}
                  onClick={() => setCompareMode(!compareMode)}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  {compareMode ? 'Show Full Render' : 'Compare Before/After'}
                </button>
              )}
              {selectedRender && (
                <button 
                  className="secondary-light-button danger-action"
                  onClick={() => setShowMistakeModal(true)}
                  style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'rgba(234, 84, 85, 0.4)', color: '#ea5455' }}
                >
                  Teach AI / Log Mistake
                </button>
              )}
            </div>
          </div>

          {/* Main Showcase Viewport */}
          {selectedRender ? (
            <>
              {compareMode && sitePhotoPreview ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>
                  <div className="visualizer-main-image-wrapper">
                    <img src={sitePhotoPreview} alt="Before: Site" className="visualizer-main-image" />
                    <div className="visualizer-image-tag" style={{ background: 'rgba(234, 84, 85, 0.9)', borderColor: '#ea5455', color: '#fff' }}>
                      Before (Site)
                    </div>
                  </div>
                  <div className="visualizer-main-image-wrapper">
                    <img src={assetUrl(selectedRender.url)} alt="After: Render" className="visualizer-main-image" />
                    <div className="visualizer-image-tag">
                      After (3D Render)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="visualizer-main-image-wrapper">
                  <img src={assetUrl(selectedRender.url)} alt="Main 3D Render Viewport" className="visualizer-main-image" />
                  <div className="visualizer-image-tag">
                    <Sparkles size={12} /> {selectedRender.sourceType?.replace('-image', '').replace('-visualizer', '')}
                  </div>
                </div>
              )}

              {/* Render Metadata */}
              <div className="visualizer-prompt-info">
                <strong>Visualizer Prompt Metadata</strong>
                <span>{selectedRender.prompt}</span>
              </div>

              {/* Revision Request Input */}
              <div className="visualizer-edit-bar">
                <input 
                  type="text" 
                  placeholder="Instruct AI to refine this render (e.g. Change the cabinets to grey, make rafters end at window)..." 
                  value={revisionRequest}
                  onChange={(e) => setRevisionRequest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditRender();
                  }}
                  disabled={isGenerating || isRevising}
                />
                <button className="visualizer-edit-btn" onClick={handleEditRender} disabled={isGenerating || isRevising || !revisionRequest.trim()}>
                  <Sparkles size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="visualizer-placeholder">
              <ImagePlus size={64} />
              <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', margin: 0 }}>Visualizer Viewport Empty</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '360px', margin: 0 }}>
                Adjust the design parameter controls on the left, upload under-construction site photos, and click Synthesize to generate visual support.
              </p>
            </div>
          )}

          {/* AI Knowledge & Mistakes Log Panel */}
          {mistakes.length > 0 && (
            <div className="visualizer-group" style={{ background: 'rgba(189, 147, 74, 0.03)', borderColor: 'rgba(189, 147, 74, 0.15)' }}>
              <div className="visualizer-group-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📖</span> AI Obsidian Learning Log (Corrections Applied)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {mistakes.map((m, idx) => (
                  <div key={idx} style={{ fontSize: '11px', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', borderLeft: '2.5px solid var(--gold)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: '2px' }}>
                      {m.room?.toUpperCase()} - Learned Correction:
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {m.avoidance_instruction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous renders gallery */}
          {renders.length > 0 && (
            <div className="visualizer-gallery-section">
              <div className="screen-section-title" style={{ margin: 0, fontSize: '12px' }}>Project Render History ({renders.length})</div>
              <div className="visualizer-gallery-grid">
                {renders.map((item) => (
                  <div 
                    key={item.id} 
                    className={`visualizer-thumb-card ${selectedRender?.id === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedRender(item)}
                  >
                    <img src={assetUrl(item.url)} alt={item.title} />
                    <div className="visualizer-thumb-label">{item.room === 'kitchen' ? 'Kitchen' : item.room === 'living' ? 'TV Wall' : item.room}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </ScreenFrame>
  );
}

export function PackagesScreen({
  project,
  designPackage,
  cutlist,
  documents = [],
  onDownloadProposal,
  onDownloadCutlistPdf,
  onExportBackup,
  refreshDocuments
}) {
  const [typeFilter, setTypeFilter] = useState('all');
  const filteredDocuments = documents.filter((item) => typeFilter === 'all' || item.type === typeFilter);
  const projectDocuments = project ? documents.filter((item) => item.projectId === project.id) : [];
  const latestDocuments = filteredDocuments.slice(0, 18);

  return (
    <ScreenFrame title="Deliverables Vault" subtitle="Stored PDF briefs, cutlist handoffs, backups, and client-ready export history" tone="command">
      <div className="deliverables-command-grid">
        <section className="surface-panel deliverables-overview-panel">
          <div className="command-panel-header">
            <div>
              <div className="screen-section-title">Export readiness</div>
              <p>Every exported PDF becomes visible here so the studio can reopen, share, back up, or audit handoff files.</p>
            </div>
            <button className="secondary-light-button" onClick={refreshDocuments}><RotateCcw size={15} /> Refresh</button>
          </div>

          <div className="deliverable-kpis">
            <article><FileText size={18} /><strong>{documents.filter((item) => item.type === 'proposal-brief').length}</strong><span>PDF briefs</span></article>
            <article><Layers3 size={18} /><strong>{documents.filter((item) => item.type === 'cutlist-pdf').length}</strong><span>Cutlist PDFs</span></article>
            <article><BriefcaseBusiness size={18} /><strong>{projectDocuments.length}</strong><span>Active project files</span></article>
            <article><DatabaseBackup size={18} /><strong>{documents.length}</strong><span>Total stored docs</span></article>
          </div>

          <div className="deliverable-actions">
            <button className="gold-button" onClick={onDownloadProposal} disabled={!project}>
              <FileText size={16} /> Export Active PDF Brief
            </button>
            <button className="secondary-light-button" onClick={onDownloadCutlistPdf} disabled={!cutlist}>
              <Layers3 size={16} /> Export Active Cutlist PDF
            </button>
            <button className="secondary-light-button" onClick={onExportBackup}>
              <Download size={16} /> Export Full Backup
            </button>
          </div>
        </section>

        <aside className="surface-panel deliverables-side-panel">
          <div className="screen-section-title">Vault filters</div>
          <div className="deliverable-filter-stack">
            {[
              ['all', 'All documents'],
              ['proposal-brief', 'PDF briefs'],
              ['cutlist-pdf', 'Cutlist PDFs']
            ].map(([value, label]) => (
              <button key={value} className={typeFilter === value ? 'active' : ''} onClick={() => setTypeFilter(value)}>
                {label}
              </button>
            ))}
          </div>
          <div className="settings-handover-checks">
            <article><CheckCircle2 size={16} /><span>PDF brief exports saved under `storage/proposals`</span></article>
            <article><CheckCircle2 size={16} /><span>Cutlist PDFs saved under `storage/cutlists`</span></article>
            <article><CheckCircle2 size={16} /><span>Full backup now includes stored PDF files</span></article>
          </div>
        </aside>
      </div>

      <section className="surface-panel document-vault-panel">
        <div className="command-panel-header">
          <div>
            <div className="screen-section-title">Stored deliverables</div>
            <p>{latestDocuments.length ? `Showing ${latestDocuments.length} of ${filteredDocuments.length} stored files.` : 'Export a PDF brief or cutlist PDF to populate the vault.'}</p>
          </div>
        </div>
        <div className="document-vault-grid">
          {latestDocuments.map((doc) => (
            <article key={doc.id} className="document-card">
              <div className="document-thumb">
                <FileText size={28} />
                <span>{doc.type === 'cutlist-pdf' ? 'CUTLIST' : 'BRIEF'}</span>
              </div>
              <div className="document-body">
                <div>
                  <strong>{doc.title}</strong>
                  <span>{doc.clientName} - {formatDate(doc.updatedAt)}</span>
                </div>
                <p>{doc.status}</p>
                <div className="document-meta">
                  <small>{doc.label}</small>
                  <small>{formatBytes(doc.size)}</small>
                  {(doc.meta || []).slice(0, 3).map((item) => <small key={item}>{item}</small>)}
                </div>
              </div>
              <div className="document-actions">
                <a href={assetUrl(doc.url)} target="_blank" rel="noreferrer"><ArrowUpRight size={14} /> Open</a>
                <a href={assetUrl(doc.url)} download><Download size={14} /> Download</a>
              </div>
            </article>
          ))}
          {!latestDocuments.length && (
            <div className="empty-command-state">
              <FileText size={22} />
              <strong>No stored deliverables yet.</strong>
              <span>Generate and export a PDF brief or cutlist PDF to create the first document record.</span>
            </div>
          )}
        </div>
      </section>
    </ScreenFrame>
  );
}

export function SettingsScreen({
  providerStatus,
  studioSettings,
  updateStudioSettings,
  resetStudioSettings,
  onExportBackup,
  onImportBackup,
  onResetDemoWorkspace,
  maintenanceBusy
}) {
  const [replaceOnImport, setReplaceOnImport] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const profileFields = [
    ['brandName', 'Brand name'],
    ['brandLine', 'Brand line'],
    ['logoPrimary', 'Logo primary'],
    ['logoSecondary', 'Logo secondary'],
    ['studioAdmin', 'Studio admin'],
    ['leadDesigner', 'Lead designer'],
    ['leadRole', 'Lead role'],
    ['city', 'Studio city'],
    ['contactEmail', 'Contact email'],
    ['contactPhone', 'Contact phone']
  ];
  const handoverFields = [
    ['proposalFooter', 'Proposal footer'],
    ['commercialScope', 'Commercial scope'],
    ['commercialFee', 'One-time fee'],
    ['paymentTerms', 'Payment terms'],
    ['handoverNote', 'Handover note']
  ];
  const canResetDemo = resetPhrase.trim() === 'RESET DEMO';

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (file) {
      onImportBackup?.(file, { replace: replaceOnImport });
    }
    event.target.value = '';
  }

  return (
    <ScreenFrame title="Studio Settings" subtitle="Branding, proposal copy, commercial terms, and provider readiness for a client handover" tone="command">
      <div className="settings-command-grid">
        <section className="surface-panel settings-brand-panel">
          <div className="command-panel-header">
            <div>
              <div className="screen-section-title">Studio brand profile</div>
              <p>These values are stored locally and reflected in the app shell for demos and handover.</p>
            </div>
            <button className="secondary-light-button" onClick={resetStudioSettings}><RotateCcw size={15} /> Reset</button>
          </div>
          <div className="settings-form-grid">
            {profileFields.map(([field, label]) => (
              <label key={field}>
                {label}
                <input value={studioSettings?.[field] || ''} onChange={(event) => updateStudioSettings(field, event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <aside className="surface-panel settings-preview-panel">
          <div className="screen-section-title">Live brand preview</div>
          <div className="settings-brand-preview">
            <div className="studio-flower" aria-hidden="true" />
            <div>
              <strong>{studioSettings?.logoPrimary || 'SPACIOUS'}</strong>
              <span>{studioSettings?.logoSecondary || 'VENTURE'}</span>
            </div>
          </div>
          <div className="settings-preview-card">
            <strong>{studioSettings?.brandName}</strong>
            <span>{studioSettings?.brandLine} - {studioSettings?.city}</span>
            <small>{studioSettings?.leadDesigner} / {studioSettings?.leadRole}</small>
          </div>
          <div className="settings-preview-card">
            <strong>{studioSettings?.commercialFee}</strong>
            <span>{studioSettings?.paymentTerms}</span>
          </div>
        </aside>

        <section className="surface-panel settings-handover-panel">
          <div className="screen-section-title">Proposal and handover copy</div>
          <div className="settings-copy-grid">
            {handoverFields.map(([field, label]) => (
              <label key={field}>
                {label}
                <textarea rows={field === 'commercialFee' ? 2 : 4} value={studioSettings?.[field] || ''} onChange={(event) => updateStudioSettings(field, event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section className="surface-panel settings-maintenance-panel">
          <div className="command-panel-header">
            <div>
              <div className="screen-section-title">Backup, restore, and demo reset</div>
              <p>Protect the studio library before demos, transfers, and production handovers.</p>
            </div>
            <DatabaseBackup size={20} />
          </div>

          <div className="settings-maintenance-grid">
            <div className="settings-maintenance-copy">
              <ShieldCheck size={18} />
              <div>
                <strong>Full backup package</strong>
                <span>Exports projects, floor plans, generated assets, cutlists, PDFs, laminate data, references, and storage files as JSON.</span>
              </div>
            </div>
            <button className="gold-button" onClick={onExportBackup} disabled={maintenanceBusy}>
              <Download size={16} /> Export Full Backup
            </button>

            <label className="settings-import-drop">
              <Upload size={18} />
              <span>Import backup JSON</span>
              <small>{replaceOnImport ? 'Replace current data before import' : 'Merge into current workspace'}</small>
              <input type="file" accept="application/json,.json" onChange={handleImportFile} disabled={maintenanceBusy} />
            </label>

            <label className="settings-inline-check">
              <input type="checkbox" checked={replaceOnImport} onChange={(event) => setReplaceOnImport(event.target.checked)} />
              Replace current workspace during import
            </label>
          </div>

          <div className="settings-reset-zone">
            <div>
              <strong>Rebuild sample demo workspace</strong>
              <span>Creates the Iyer residence sample with floor plan annotations, generated brief data, reusable assets, cutlist modules, and seeded libraries.</span>
            </div>
            <input value={resetPhrase} onChange={(event) => setResetPhrase(event.target.value)} placeholder="Type RESET DEMO" />
            <button className="secondary-light-button danger-action" onClick={onResetDemoWorkspace} disabled={!canResetDemo || maintenanceBusy}>
              <RotateCcw size={15} /> Reset Demo
            </button>
          </div>
        </section>

        <aside className="surface-panel settings-provider-panel">
          <div className="screen-section-title">Provider and storage readiness</div>
          <div className="settings-list">
            {Object.entries(providerStatus?.providers || { mock: true }).map(([name, enabled]) => (
              <article key={name}>
                <strong>{name}</strong>
                <span className={enabled ? 'ready' : ''}>{enabled ? 'Configured' : 'Missing key'}</span>
              </article>
            ))}
          </div>
          <div className="settings-handover-checks">
            <article><CheckCircle2 size={16} /><span>Local SQLite project storage</span></article>
            <article><CheckCircle2 size={16} /><span>Filesystem asset and PDF storage</span></article>
            <article><CheckCircle2 size={16} /><span>Backup export/import available</span></article>
            <article><CheckCircle2 size={16} /><span>Guarded demo reset available</span></article>
            <article><CheckCircle2 size={16} /><span>One-time fee below INR 1.5 lakh</span></article>
          </div>
          <p className="screen-note">Use `.env` for fresh provider keys. Active provider: {providerStatus?.activeLabel || 'mock'}.</p>
        </aside>
      </div>
    </ScreenFrame>
  );
}

export function HelpScreen() {
  return (
    <ScreenFrame title="Studio User Flow" subtitle="How the app should be used from client intake to workshop handoff">
      <div className="flow-board">
        <article><strong>1. Add Client</strong><span>Capture client profile, budget, rooms, floor plan, materials, and production notes.</span></article>
        <article><strong>2. PDF Brief</strong><span>Create a client-ready brief with floor plan preview, room scope, checks, and sign-off.</span></article>
        <article><strong>3. Approval</strong><span>Review the brief, confirm scope, and keep material assumptions visible.</span></article>
        <article><strong>4. Cutlist</strong><span>Create the production project for modules, parts, sheet planning, and workshop exports.</span></article>
      </div>
    </ScreenFrame>
  );
}

function ScreenFrame({ title, subtitle, children, tone = 'light' }) {
  return (
    <>
      <main className={`screen-workspace ${tone === 'command' ? 'command-screen' : ''}`}>
        <header className="screen-hero">
          <span>Spacious Venture Studio OS</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
      </main>
      <footer className="bottom-progress">
        <span>Structured studio workflow</span>
        <i><b /></i>
        <button>Ready</button>
      </footer>
    </>
  );
}

function ActionPanel({ title, desc, icon: Icon, disabled, onClick }) {
  return (
    <button className="surface-panel action-panel" disabled={disabled} onClick={onClick}>
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{desc}</span>
    </button>
  );
}

function CommandProjectRow({ item, onOpen }) {
  const readiness = item.readinessScore || 0;
  const rooms = (item.selectedSpaces || []).slice(0, 4).map(roomLabel).join(', ') || 'Rooms pending';
  const budgetLabel = item.budgetTier ? `${item.budgetTier[0]?.toUpperCase()}${item.budgetTier.slice(1)}` : 'Budget pending';
  return (
    <article className="command-project-row">
      <div className="command-client-cell">
        <span>{initials(item.clientName)}</span>
        <div>
          <strong>{item.clientName || 'New Client'}</strong>
          <small>{item.id ? `SV-${item.id.slice(0, 8).toUpperCase()}` : 'Draft'} - {item.city || 'City pending'}</small>
        </div>
      </div>
      <div>
        <strong>{budgetLabel}</strong>
        <small>{item.homeType?.toUpperCase() || 'Home type pending'}</small>
      </div>
      <div>
        <strong>{(item.selectedSpaces || []).length || 0}</strong>
        <small>{rooms}</small>
      </div>
      <div>
        <b className={`stage-chip ${stageTone(item.stage)}`}>{item.stage || 'Intake'}</b>
        <small>{item.cutlistCount ? `${item.cutlistCount} cutlist` : 'Brief/cutlist pending'}</small>
      </div>
      <div>
        <strong className={item.hasFloorPlan ? 'good-text' : 'warn-text'}>{item.hasFloorPlan ? 'Annotated' : 'Pending'}</strong>
        <small>{item.hasFloorPlan ? 'Ready for layout' : 'Needs upload'}</small>
      </div>
      <div>
        <strong className={item.hasProposal ? 'good-text' : 'warn-text'}>{item.hasProposal ? 'Exported' : 'Draft'}</strong>
        <small>{item.packageCount ? `${item.packageCount} package` : 'Not generated'}</small>
      </div>
      <div className="command-next-action">
        <button type="button" onClick={() => onOpen?.(item.id)}>{item.nextAction || 'Open project'}</button>
      </div>
      <div className="command-confidence">
        <strong>{readiness}%</strong>
        <i><b style={{ width: `${readiness}%` }} /></i>
      </div>
    </article>
  );
}

function KpiCard({ label, value, detail }) {
  return (
    <article className="admin-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <ArrowUpRight size={16} />
    </article>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <article className="mini-metric">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function pipelineHint(stage) {
  if (stage.includes('Lead')) return 'Needs intake + rooms';
  if (stage.includes('Onboarding')) return 'Questionnaire quality';
  if (stage.includes('Brief')) return 'Client-ready PDF';
  if (stage.includes('Exported')) return 'Signed document trail';
  if (stage.includes('Cutlist')) return 'Production handoff queue';
  return 'Operational follow-up';
}

function styleLabel(style = '') {
  return style.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function roomLabel(roomId) {
  return roomOptions.find((room) => room.id === roomId)?.label || roomId;
}

function stageTone(stage = '') {
  if (stage === 'Cutlist Project') return 'closed';
  if (stage === 'PDF Brief') return 'proposal';
  if (stage === 'Brief Ready') return 'design';
  return 'intake';
}

function formatDate(value) {
  if (!value) return 'Date pending';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function formatBytes(value = 0) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(value = '') {
  const parts = String(value || 'SV').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SV';
}
