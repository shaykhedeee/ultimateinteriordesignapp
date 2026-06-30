import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, ClipboardCheck, Download, FileText, Filter, Gauge, ImagePlus, KeyRound, Layers3, MapPinned, Palette, Plus, RotateCcw, Search, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { adminPlaybook, approvalChecklist, briefSections, cutlistTemplates, designGalleryItems, phaseOnePricing, projectStages, roomOptions, styleOptions, workflowSteps } from '../data/studioData.js';

export function AdminDashboardScreen({ adminSummary, library, laminates, providerStatus, startNewClient, exportBackup }) {
  const kpis = adminSummary?.kpis || {};
  const pipeline = adminSummary?.pipeline || [];
  const recentProjects = adminSummary?.recentProjects || [];
  const sourceMix = adminSummary?.sourceMix || [];
  const roomMix = adminSummary?.roomMix || [];
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

  return (
    <ScreenFrame title="Command Center" subtitle="Operational dashboard for onboarding, PDF briefs, cutlist readiness, and studio handoff">
      <section className="admin-command-hero">
        <div>
          <h2>Run every client from intake to PDF brief to cutlist.</h2>
          <p>Track onboarding quality, floor-plan readiness, brief exports, cutlist handoff, and material confidence from one operational screen.</p>
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

      <div className="admin-layout-grid">
        <section className="surface-panel admin-panel span-2">
          <div className="screen-section-title">Client pipeline</div>
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
          <div className="screen-section-title">Provider readiness</div>
          <div className="provider-readiness compact">
            <article><KeyRound size={18} /><strong>{providerStatus?.activeLabel || 'curated'}</strong><span>Image source</span></article>
            <article><Layers3 size={18} /><strong>{sourceMix.length || 1}</strong><span>Source types</span></article>
            <article><Users size={18} /><strong>{recentProjects.length}</strong><span>Recent clients</span></article>
          </div>
        </section>

        <section className="surface-panel admin-panel span-2">
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

        <section className="surface-panel admin-panel">
          <div className="screen-section-title">Approval readiness</div>
          <div className="approval-list">
            {approvalChecklist.map((item, index) => (
              <article key={item} className={index < Math.min(kpis.packages || 0, approvalChecklist.length) ? 'done' : ''}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel admin-panel">
          <div className="screen-section-title">Rooms entering production scope</div>
          <div className="mix-list">
            {(roomMix.length ? roomMix : roomOptions.slice(0, 6).map((room) => ({ room: room.id, count: 0 }))).map((row) => (
              <article key={row.room}>
                <span>{roomOptions.find((room) => room.id === row.room)?.label || row.room}</span>
                <strong>{row.count}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel admin-panel">
          <div className="screen-section-title">Material intelligence</div>
          <div className="material-mini-list">
            {laminates.slice(0, 6).map((item) => (
              <article key={item.id}>
                <span style={{ background: item.hex }} />
                <strong>{item.brand} {item.collection}<small>{item.finish}</small></strong>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel admin-panel">
          <div className="screen-section-title">Sellable product playbook</div>
          <div className="playbook-list">
            {adminPlaybook.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
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
    <ScreenFrame title="Project CRM & Pipeline" subtitle="Client pipeline, PDF brief readiness, cutlist status, and next action control">
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

  return (
    <ScreenFrame title="PDF Briefs" subtitle="Generate, review, and export the client-facing onboarding design brief">
      <div className="brief-builder-grid">
        <section className="surface-panel brief-preview-panel">
          <div className="brief-preview-header">
            <div>
              <span>Client-ready document</span>
              <h2>{form.clientName || project?.clientName || 'New Client'} PDF Brief</h2>
              <p>{form.city || project?.city || 'City pending'} - {form.homeType?.toUpperCase() || 'Home pending'} - {styleLabel(form.primaryStyle)}</p>
            </div>
            <strong>{score}% ready</strong>
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
  onExportBackup,
  startNewClient
}) {
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

  return (
    <ScreenFrame title="Cutlists" subtitle="Create workshop-ready module planning from the approved PDF brief">
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
              <article><strong>{totals.estimatedSheets || 0}</strong><span>Sheets</span></article>
            </div>
          )}

          <div className="cutlist-module-grid">
            {(cutlist ? modules : visibleTemplates).map((item) => (
              <article key={item.id} className={cutlist ? 'generated' : ''}>
                <strong>{cutlist ? item.name : item.title}</strong>
                <span>{cutlist ? item.roomLabel || roomLabel(item.room) : item.room}</span>
                <p>{cutlist ? `${item.widthMm} x ${item.heightMm} x ${item.depthMm} mm - ${item.finish}` : item.defaults}</p>
                <small>{cutlist ? item.material : designPackage ? 'Ready to map from brief' : 'Generate brief first'}</small>
              </article>
            ))}
          </div>

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
            <Layers3 size={16} /> {cutlist ? 'Refresh Parts' : 'Create Cutlist Project'}
          </button>
          <button className="secondary-light-button" onClick={onDownloadCutlistCsv} disabled={!cutlist}>
            <Download size={16} /> Export Workshop CSV
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

export function RendersScreen({ form, activeMoodboard, providerStatus, onGenerate, generating }) {
  const canGenerate = Boolean(form.clientName.trim() && form.selectedSpaces.length);

  return (
    <ScreenFrame title="AI Studio" subtitle="Optional visual support for references, prompts, and generated room images">
      <div className="screen-grid two">
        <section className="surface-panel">
          <div className="screen-section-title">Prompt Builder</div>
          <textarea rows="10" value={activeMoodboard?.prompt || form.notes} readOnly />
          <button className="gold-button" onClick={onGenerate} disabled={generating || !canGenerate}>
            <ImagePlus size={16} /> Generate visual references
          </button>
        </section>
        <section className="surface-panel">
          <div className="screen-section-title">Provider Chain</div>
          <div className="provider-readiness">
            <article><KeyRound size={18} /><strong>Active</strong><span>{providerStatus?.activeLabel || 'mock'}</span></article>
            <article><Layers3 size={18} /><strong>Priority</strong><span>{providerStatus?.priority?.join(' -> ')}</span></article>
            <article><Palette size={18} /><strong>Rooms</strong><span>{roomOptions.filter((room) => form.selectedSpaces.includes(room.id)).length} selected</span></article>
          </div>
        </section>
      </div>
    </ScreenFrame>
  );
}

export function PackagesScreen({ project, designPackage, onDownloadProposal, onExportBackup }) {
  return (
    <ScreenFrame title="Packages & Deliverables" subtitle="Legacy deliverables surface; use PDF Briefs and Cutlists for the core workflow">
      <div className="screen-grid three">
        <ActionPanel title="PDF Brief" desc="Client summary, floor plan, rooms, materials, checks, sign-off." icon={FileText} disabled={!project} onClick={onDownloadProposal} />
        <ActionPanel title="Library Backup" desc="Export project, image, laminate, and moodboard metadata." icon={Download} onClick={onExportBackup} />
        <ActionPanel title="Cutlist Handoff" desc={designPackage ? 'Brief is ready for production planning.' : 'Generate a PDF brief first.'} icon={Sparkles} disabled={!designPackage} />
      </div>
    </ScreenFrame>
  );
}

export function SettingsScreen({ providerStatus }) {
  return (
    <ScreenFrame title="Settings" subtitle="Provider status and studio configuration">
      <section className="surface-panel">
        <div className="screen-section-title">Image Generation Providers</div>
        <div className="settings-list">
          {Object.entries(providerStatus?.providers || { mock: true }).map(([name, enabled]) => (
            <article key={name}>
              <strong>{name}</strong>
              <span className={enabled ? 'ready' : ''}>{enabled ? 'Configured' : 'Missing key'}</span>
            </article>
          ))}
        </div>
        <p className="screen-note">Use `.env` for fresh provider keys. Active provider: {providerStatus?.activeLabel || 'mock'}.</p>
      </section>
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

function ScreenFrame({ title, subtitle, children }) {
  return (
    <>
      <main className="screen-workspace">
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
