import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, CheckCircle2, ClipboardCheck, DatabaseBackup, Download, FileText, Filter, Gauge, GitBranch, Hammer, ImagePlus, KeyRound, Layers3, MapPinned, Palette, PencilLine, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, Users, X, XCircle } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { briefSections, cutlistTemplates, designGalleryItems, projectStages, renderPromptPresets, getPromptPresetsForRoom, roomOptions, styleOptions } from '../data/studioData.js';

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

const connectedWorkflowStages = [
  {
    id: 'intake',
    label: 'Client Intake',
    nav: 'dashboard',
    icon: ClipboardCheck,
    description: 'Client profile, rooms, budget, Vastu, production notes, and references.'
  },
  {
    id: 'floor-plan',
    label: 'Floor Plan',
    nav: 'dashboard',
    icon: MapPinned,
    description: 'Upload plan, mark room zones, and place TV units, wardrobes, kitchens, mandir, and custom furniture.'
  },
  {
    id: 'renders',
    label: 'AI Render Review',
    nav: 'renders',
    icon: ImagePlus,
    description: 'Generate floor-plan-aware variants, approve client-ready images, and save correction memory.'
  },
  {
    id: 'brief',
    label: 'PDF Brief',
    nav: 'briefs',
    icon: FileText,
    description: 'Package approved visuals, layout details, floor-plan notes, materials, and sign-off pages.'
  },
  {
    id: 'cutlist',
    label: 'Cutlist',
    nav: 'cutlists',
    icon: Hammer,
    description: 'Convert approved brief details into modules, parts, sheets, and production exports.'
  },
  {
    id: 'deliverables',
    label: 'Deliverables',
    nav: 'packages',
    icon: Layers3,
    description: 'Store PDFs, cutlists, backups, image metadata, and client handover files.'
  }
];

export function AdminDashboardScreen({ adminSummary, library = [], laminates = [], providerStatus, startNewClient, exportBackup, projectList = [], openProject }) {
  const kpis = adminSummary?.kpis || {};
  const pipeline = adminSummary?.pipeline || [];
  const recentProjects = adminSummary?.recentProjects || [];
  const sourceMix = adminSummary?.sourceMix || [];
  const roomMix = adminSummary?.roomMix || [];
  const featureIntelligence = adminSummary?.featureIntelligence;
  const commandProjects = ((projectList && projectList.length) ? projectList : recentProjects || []).slice(0, 6);
  const heroGallery = [...designGalleryItems, ...(library || []).map((asset) => ({
    id: asset.id,
    title: asset.title || asset.room,
    room: asset.room,
    style: asset.style,
    budgetTier: asset.budgetTier,
    image: assetUrl(asset.url),
    source: asset.sourceType || asset.provider || 'generated',
    tags: asset.tags || [],
    conversionNote: 'Reusable generated asset from the studio library.'
  }))].slice(0, 8);

  // Reference library state
  const [refLibrary, setRefLibrary] = useState([]);
  const [showAllImages, setShowAllImages] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [refFilter, setRefFilter] = useState('all');
  const [editingRefId, setEditingRefId] = useState('');
  const [refDraft, setRefDraft] = useState({});
  const refInputRef = useRef(null);

  const loadRefLibrary = useCallback(() => {
    api('/api/newinfo-library')
      .then(data => { if (data.success) setRefLibrary(data.images || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRefLibrary();
  }, [loadRefLibrary]);

  const filteredRefImages = refFilter === 'all'
    ? refLibrary
    : refLibrary.filter(img => img.category === refFilter);

  const topRefImages = refLibrary.slice(0, 3);

  const handleUploadRef = async (file) => {
    if (!file) return;
    setUploadingRef(true);
    try {
      const formData = new FormData();
      formData.append('referenceImage', file);
      const result = await api('/api/reference-library/upload', { method: 'POST', body: formData });
      if (result.success) {
        setRefLibrary(prev => [{ ...result, id: result.id || result.url }, ...prev]);
      }
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploadingRef(false);
    }
  };

  const refCategories = ['all', ...new Set(refLibrary.map(img => img.category))];

  const startEditReference = (img) => {
    setEditingRefId(img.id);
    setRefDraft({
      title: img.title || '',
      category: img.category || 'uploaded',
      style: img.style || 'reference',
      budgetTier: img.budgetTier || 'premium',
      source: img.source || 'upload',
      tags: (img.tags || []).join(', ')
    });
  };

  const saveReference = async (id) => {
    const result = await api(`/api/reference-library/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(refDraft)
    });
    if (result.success) {
      setRefLibrary((prev) => prev.map((img) => (img.id === id ? result.image : img)));
      setEditingRefId('');
      setRefDraft({});
    }
  };

  const deleteReference = async (id) => {
    if (!window.confirm('Delete this reference image from the library?')) return;
    const result = await api(`/api/reference-library/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (result.success) {
      setRefLibrary((prev) => prev.filter((img) => img.id !== id));
      if (editingRefId === id) setEditingRefId('');
    }
  };

  const readinessItems = [
    { label: 'Client Intake Complete', done: (kpis.projects || 0) > 0, detail: `${kpis.projects || 0} projects captured` },
    { label: 'Floor Plan Annotated', done: (kpis.floorPlans || 0) > 0, detail: `${kpis.floorPlanCoverage || 0}% coverage` },
    { label: 'AI Renders Approved', done: (kpis.approvedRenders || 0) > 0, detail: `${kpis.approvedRenders || 0} client-ready images` },
    { label: 'PDF Brief Ready', done: (kpis.packagedProjects || 0) > 0, detail: `${kpis.packagedProjects || 0} brief-ready projects` },
    { label: 'Proposal PDF Exported', done: (kpis.proposals || 0) > 0, detail: `${kpis.proposals || 0} exported PDFs` },
    { label: 'Cutlist Project Created', done: (kpis.cutlists || 0) > 0, detail: `${kpis.cutlists || 0} production handoffs` },
    { label: 'Production Standards Imported', done: (kpis.productionImports || 0) > 0, detail: `${kpis.productionImports || 0} learned workbooks` }
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
          <button className="btn btn-gold btn-md" onClick={startNewClient}><Plus size={16} /> Add Client</button>
          <button className="secondary-light-button" onClick={exportBackup}><Download size={16} /> Export Backup</button>
        </div>
      </section>

      <div className="admin-kpi-grid">
        <KpiCard label="Active projects" value={kpis.projects || 0} detail={`Brief-ready: ${kpis.conversionRate || 0}%`} />
        <KpiCard label="PDF briefs" value={kpis.proposals || 0} detail={`Prepared packages: ${kpis.packages || 0}`} />
        <KpiCard label="AI render approvals" value={kpis.approvedRenders || 0} detail={`Reviewed renders: ${kpis.reviewedRenders || 0}`} />
        <KpiCard label="Floor-plan coverage" value={`${kpis.floorPlanCoverage || 0}%`} detail={`Mapped: ${kpis.floorPlans || 0}`} />
      </div>

      <FeatureCommandCenter intelligence={featureIntelligence} />

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
                {((roomMix && roomMix.length) ? roomMix : roomOptions.slice(0, 5).map((room) => ({ room: room.id, count: 0 }))).slice(0, 5).map((row) => (
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
              <div className="screen-section-title">Priority next actions</div>
              <strong className={`feature-score-pill ${featureIntelligence?.overallTone || 'watch'}`}>{featureIntelligence?.overallScore || overallReadiness}%</strong>
            </div>
            <div className="approval-list command-readiness-list">
              {(featureIntelligence?.priorityActions?.length ? featureIntelligence.priorityActions : readinessItems.map((item) => ({
                id: item.label,
                label: item.label,
                score: item.done ? 100 : 35,
                action: item.detail
              }))).map((item) => (
                <article key={item.id || item.label} className={item.score >= 80 ? 'done' : ''}>
                  {item.score >= 80 ? <CheckCircle2 size={16} /> : <Gauge size={16} />}
                  <span>{item.label}<small>{item.action}</small></span>
                </article>
              ))}
            </div>
            <div className="overall-readiness">
              <span>Overall readiness</span>
              <i><b style={{ width: `${clampPercent(overallReadiness)}%` }} /></i>
              <strong>{overallReadiness}%</strong>
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="command-panel-header compact-header">
              <div className="screen-section-title">Top reusable image matches</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="secondary-light-button"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => refInputRef.current?.click()}
                  disabled={uploadingRef}
                >
                  <Upload size={12} style={{ marginRight: 4 }} />
                  {uploadingRef ? 'Uploading…' : 'Upload Reference'}
                </button>
                <input
                  ref={refInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => e.target.files[0] && handleUploadRef(e.target.files[0])}
                />
                <button type="button" onClick={() => setShowAllImages(true)}>View All</button>
              </div>
            </div>
            <div className="command-image-matches">
              {(topRefImages.length > 0 ? topRefImages : heroGallery.slice(0, 3)).map((item, index) => (
                <article key={item.id}>
                  <img src={item.url ? assetUrl(item.url) : item.image} alt={item.title} />
                  <b>{91 - index * 4}% Match</b>
                  <span>{item.title}</span>
                  <small style={{ color: '#c89b45', fontSize: '10px' }}>Source: {item.source || item.sourceType || 'reference'}</small>
                </article>
              ))}
              {topRefImages.length === 0 && heroGallery.length === 0 && (
                <p style={{ color: '#888', fontSize: '13px', padding: '12px 0' }}>No reference images yet. Upload to get started.</p>
              )}
            </div>
          </section>

          <section className="surface-panel admin-panel">
            <div className="command-panel-header compact-header">
              <div className="screen-section-title">Material confidence</div>
              <button type="button">View All</button>
            </div>
            <div className="command-material-confidence">
              {(laminates || []).slice(0, 4).map((item, index) => (
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
              <button onClick={() => commandProjects[0] && openProject?.(commandProjects[0].id, nextNavForProject(commandProjects[0]))}><GitBranch size={15} /> Continue Top Project</button>
            </div>
          </section>
          <section className="surface-panel admin-panel">
            <div className="screen-section-title">Quick stats</div>
            <div className="provider-readiness compact command-quick-stats">
              <article><KeyRound size={18}/><strong>{providerStatus?.activeLabel || 'library-reuse'}</strong><span>Active source</span></article>
              <article><Layers3 size={18}/><strong>{sourceMix.length || 1}</strong><span>Source types</span></article>
              <article><Users size={18}/><strong>{commandProjects.length}</strong><span>Visible clients</span></article>
            </div>
          </section>
        </aside>
      </div>

      {/* Reference Library Full View Modal */}
      {showAllImages && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 28px', borderBottom: '1px solid rgba(200,155,69,0.2)',
            background: '#0e100f'
          }}>
            <div>
              <h2 style={{ margin: 0, color: '#f4f0e8', fontSize: '20px', fontWeight: 700 }}>
                Reference Image Library
              </h2>
              <p style={{ margin: '4px 0 0', color: '#aaa49a', fontSize: '13px' }}>
                {filteredRefImages.length} images · Sources: {sourceMix.length || 1}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={refFilter}
                onChange={e => setRefFilter(e.target.value)}
                style={{
                  background: '#1a1c1b', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f4f0e8', borderRadius: '6px', padding: '6px 12px', fontSize: '13px'
                }}
              >
                {refCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All categories' : cat.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => refInputRef.current?.click()}
                disabled={uploadingRef}
                style={{
                  background: 'rgba(200,155,69,0.15)', border: '1px solid #c89b45',
                  color: '#c89b45', borderRadius: '6px', padding: '6px 14px',
                  cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Upload size={14} /> {uploadingRef ? 'Uploading…' : 'Upload Image'}
              </button>
              <button
                onClick={() => setShowAllImages(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f4f0e8', borderRadius: '6px', padding: '6px 14px',
                  cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 28px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'
          }}>
            {filteredRefImages.map((img, i) => (
              <div key={img.id} style={{
                borderRadius: '10px', overflow: 'hidden',
                background: '#1a1c1b', border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <img
                  src={assetUrl(img.url)}
                  alt={img.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <ReferenceCardControls
                  img={img}
                  editing={editingRefId === img.id}
                  draft={refDraft}
                  setDraft={setRefDraft}
                  onEdit={() => startEditReference(img)}
                  onCancel={() => {
                    setEditingRefId('');
                    setRefDraft({});
                  }}
                  onSave={() => saveReference(img.id)}
                  onDelete={() => deleteReference(img.id)}
                />
                <div style={{ display: 'none' }}>
                  <p style={{ margin: 0, color: '#f4f0e8', fontSize: '12px', fontWeight: 600 }}>
                    {img.title}
                  </p>
                <p style={{ margin: '3px 0 0', color: '#c89b45', fontSize: '10px' }}>
                    Source: {img.source || 'reference'} · {img.category?.replace(/-/g, ' ')}
                  </p>
                </div>
              </div>
            ))}
            {filteredRefImages.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#888' }}>
                <ImagePlus size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p>No reference images found. Upload some to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}


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

export function PipelineScreen({ adminSummary, projectList = [], startNewClient, openProject, exportBackup }) {
  const workflow = adminSummary?.workflow || {};
  const renderStats = workflow.renderStudio || {};
  const proposalStats = workflow.proposalDesk || {};
  const productionStats = workflow.production || {};
  const activeProjects = projectList.slice(0, 18);
  const columns = connectedWorkflowStages.map((stage) => ({
    ...stage,
    projects: activeProjects.filter((project) => workflowStageForProject(project) === stage.id)
  }));

  return (
    <ScreenFrame title="Connected Studio Pipeline" subtitle="One operating flow from client onboarding to render approval, PDF brief, cutlist, and deliverables" tone="command">
      <section className="pipeline-command-hero surface-panel">
        <div>
          <span>Studio workflow</span>
          <h2>Every project has one visible next step.</h2>
          <p>Use this board as the sales and production bridge so no client gets stuck between layout, AI render review, proposal export, and factory handoff.</p>
        </div>
        <div className="pipeline-hero-actions">
          <button className="btn btn-gold btn-md" onClick={startNewClient}><Plus size={16} /> Add Client</button>
          <button className="secondary-light-button" onClick={exportBackup}><Download size={16} /> Export Backup</button>
        </div>
      </section>

      <div className="pipeline-metric-row">
        <MiniMetric icon={ImagePlus} label="Generated renders" value={renderStats.generated || 0} />
        <MiniMetric icon={CheckCircle2} label="Approved renders" value={renderStats.approved || 0} />
        <MiniMetric icon={FileText} label="PDF exports" value={proposalStats.exported || 0} />
        <MiniMetric icon={Hammer} label="Cutlists" value={productionStats.cutlists || 0} />
      </div>

      <section className="connected-flow-strip">
        {connectedWorkflowStages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <article key={stage.id}>
              <Icon size={17} />
              <div>
                <strong>{index + 1}. {stage.label}</strong>
                <span>{stage.description}</span>
              </div>
              {index < connectedWorkflowStages.length - 1 && <ArrowRight size={15} />}
            </article>
          );
        })}
      </section>

      <div className="workflow-kanban">
        {columns.map((column) => {
          const Icon = column.icon;
          return (
            <section key={column.id} className="workflow-column">
              <div className="workflow-column-head">
                <Icon size={16} />
                <strong>{column.label}</strong>
                <span>{column.projects.length}</span>
              </div>
              <p>{column.description}</p>
              <div className="workflow-card-list">
                {column.projects.map((item) => (
                  <article key={item.id} className="workflow-project-card">
                    <div>
                      <strong>{item.clientName || 'New client'}</strong>
                      <span>{item.city || 'City pending'} - {styleLabel(item.primaryStyle)}</span>
                    </div>
                    <small>{(item.selectedSpaces || []).slice(0, 3).map(roomLabel).join(', ') || 'Rooms pending'}</small>
                    <div className="workflow-card-meta">
                      <b>{item.readinessScore || 0}% ready</b>
                      <span>{item.approvedRenderCount || 0} approved renders</span>
                    </div>
                    <button onClick={() => openProject?.(item.id, nextNavForProject(item))}>
                      {item.nextAction || `Open ${column.label}`}
                    </button>
                  </article>
                ))}
                {!column.projects.length && <div className="workflow-empty">No projects waiting here.</div>}
              </div>
            </section>
          );
        })}
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
          <option value="Render Review">Render Review</option>
          <option value="Render Approved">Render Approved</option>
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
        <button className="btn btn-gold btn-md" onClick={startNewClient}><Plus size={16} /> Add Client</button>
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
              <span>Details</span>
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
                  <i><b style={{ width: `${clampPercent(item.readinessScore)}%` }} /></i>
                </div>
                <div className="crm-action-cell">
                  <span>{item.nextAction}</span>
                  <button className="secondary-light-button" onClick={() => openProject(item.id, nextNavForProject(item))}>Continue</button>
                  <div className="crm-mini-actions">
                    <button onClick={() => openProject(item.id, 'dashboard')}>Intake</button>
                    <button onClick={() => openProject(item.id, 'renders')}>Renders</button>
                    <button onClick={() => openProject(item.id, 'cutlists')}>Cutlist</button>
                  </div>
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
              <button className="btn btn-gold btn-md" onClick={onGenerate} disabled={generating}>
                <Sparkles size={16} /> Generate / Refresh PDF Brief
              </button>
            </>
          ) : (
            <>
              <h2>No active client</h2>
              <p>Open a saved project or start a new intake before generating a PDF brief.</p>
              <button className="btn btn-gold btn-md" onClick={startNewClient}><Plus size={16} /> Add Client</button>
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
    { label: 'Floor plan details', detail: 'Plan preview, room zones, markers, placement notes' },
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
              <h3>Floor Plan & Layout</h3>
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
          <button className="btn btn-gold btn-md" onClick={onGenerate} disabled={generating || !form.clientName || !selectedRooms.length}>
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
  onDownloadMaxCutCsv,
  onDownloadJobLayoutPdf,
  onDownloadCutlistXlsx,
  onDownloadJobSummaryPdf,
  onDownloadPanelLabelsPdf,
  onDownloadCutlistPdf,
  onRegenerateCutlistParts,
  onUpdateCutlistModule,
  onAddCutlistModule,
  onDeleteCutlistModule,
  onImportProductionWorkbook,
  onUploadCutlistRawFiles,
  onRefreshProductionImports,
  productionImports = [],
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
  const accuracyAudit = cutlist?.accuracyAudit || {};
  const rawSources = cutlist?.rawSources || [];
  const accuracyScore = clampPercent(accuracyAudit.score);
  const activeEditModule = modules.find((item) => item.id === editingModuleId);
  const latestImport = productionImports[0] || null;
  const productionLearning = cutlist?.productionLearning || {};
  const hasVerifiedModuleDimensions = modules.length > 0 && modules.every((item) => Number(item.widthMm) > 0 && Number(item.heightMm) > 0 && Number(item.depthMm) > 0);
  const approvedBriefRecorded = cutlist
    ? !(accuracyAudit.blockingIssues || []).some((issue) => String(issue).toLowerCase().includes('approve the pdf brief'))
    : Boolean(project && designPackage);
  const productionExportReady = Boolean(project && designPackage && cutlist && parts.length > 0 && hasVerifiedModuleDimensions && accuracyAudit.productionGrade);
  const productionReadiness = [
    { label: 'Approved PDF brief', done: approvedBriefRecorded, detail: approvedBriefRecorded ? 'Client sign-off is recorded' : 'Generate and approve the PDF brief first' },
    { label: 'Modules generated', done: modules.length > 0, detail: `${modules.length} module records` },
    { label: 'Required dimensions', done: hasVerifiedModuleDimensions, detail: hasVerifiedModuleDimensions ? 'Width, height, and depth present' : 'Add verified module dimensions' },
    { label: 'Raw sources attached', done: rawSources.length > 0, detail: rawSources.length ? `${rawSources.length} source files attached` : 'Attach plan, photo, drawing, or measurement files' },
    { label: 'Part list ready', done: parts.length > 0, detail: `${parts.length} part rows` },
    { label: 'Sheet preview ready', done: Boolean(sheetLayout?.sheets?.length), detail: `${sheetLayout?.sheets?.length || 0} sheet previews` },
    { label: 'Accuracy audit passed', done: Boolean(accuracyAudit.productionGrade), detail: accuracyAudit.productionGrade ? `${accuracyScore}% production confidence` : `${accuracyScore || 0}% - resolve audit warnings before factory export` },
    { label: 'Machine export ready', done: productionExportReady, detail: productionExportReady ? 'MaxCut/XLSX exports unlocked' : 'Verified brief, dimensions, and raw sources required' }
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

  async function handleProductionImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImportProductionWorkbook?.(file);
    event.target.value = '';
  }

  async function handleRawSourceUpload(event) {
    const files = event.target.files;
    if (!files?.length || !cutlist) return;
    await onUploadCutlistRawFiles?.(files, cutlist.id);
    event.target.value = '';
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
            <button className="btn btn-gold btn-md" onClick={project ? onCreateCutlistProject : startNewClient} disabled={cutlistLoading}>
              <Layers3 size={16} /> {project ? (cutlist ? 'Refresh Cutlist' : 'Create Cutlist Project') : 'Add Client'}
            </button>
          </div>

          <section className="production-import-panel">
            <div>
              <span>Finished project learning</span>
              <strong>{latestImport ? `${latestImport.projectCode} imported` : 'Import a completed Spacious Venture cutlist'}</strong>
              <p>{latestImport ? `${latestImport.summary.moduleCount} modules, ${latestImport.summary.partRowCount} part rows, ${latestImport.summary.totalPanelQuantity} panels learned from ${latestImport.originalFileName}.` : 'Upload C1301-style Excel workbooks so the app learns module naming, formulas, edge-banding, materials, panel quantities, and factory package expectations.'}</p>
            </div>
            <label className="secondary-light-button production-upload-button">
              <Upload size={16} /> Import Workbook
              <input type="file" accept=".xlsx,.xlsm,.xls,.csv" onChange={handleProductionImport} disabled={cutlistLoading} />
            </label>
          </section>

          {cutlist && (
            <section className="raw-source-panel">
              <div>
                <span>Raw measurement sources</span>
                <strong>{rawSources.length ? `${rawSources.length} files attached` : 'Attach the files behind the cutlist'}</strong>
                <p>Upload site photos, JPEG/PNG/WebP plans, PDFs, DXF/DWG/SVG drawings, spreadsheets, or measurement notes. These files improve the production-confidence audit and keep the factory review traceable.</p>
              </div>
              <label className="secondary-light-button production-upload-button">
                <Upload size={16} /> Upload Raw Files
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.dxf,.dwg,.svg,.csv,.xlsx,.xlsm,.xls,.txt,.json"
                  onChange={handleRawSourceUpload}
                  disabled={cutlistLoading}
                />
              </label>
            </section>
          )}

          {cutlist && (
            <section className={`cutlist-accuracy-panel ${accuracyAudit.productionGrade ? 'ready' : 'review'}`}>
              <div className="accuracy-meter">
                <div>
                  <span>Production confidence</span>
                  <strong>{accuracyScore}%</strong>
                </div>
                <i><b style={{ width: `${accuracyScore}%` }} /></i>
              </div>
              <div className="accuracy-copy">
                <strong>{accuracyAudit.productionGrade ? 'Factory export unlocked after final human check' : 'Factory export locked until source checks pass'}</strong>
                <p>{accuracyAudit.note || 'Cutlists are generated from available project data and must be checked against site measurements before cutting.'}</p>
              </div>
              <div className="accuracy-findings">
                {(accuracyAudit.blockingIssues || []).slice(0, 4).map((item) => <span key={item} className="blocked">{item}</span>)}
                {(accuracyAudit.warnings || []).slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                {accuracyAudit.productionGrade && (accuracyAudit.strengths || []).slice(0, 3).map((item) => <span key={item} className="ready">{item}</span>)}
              </div>
            </section>
          )}

          {latestImport && (
            <div className="production-intelligence-grid">
              <article><strong>{latestImport.summary.materialCount}</strong><span>Material groups</span></article>
              <article><strong>{latestImport.summary.edgeBandCount}</strong><span>Edge-band types</span></article>
              <article><strong>{latestImport.modules?.filter((item) => item.room === 'kitchen').length || 0}</strong><span>Kitchen sections</span></article>
              <article><strong>{latestImport.qualityFindings?.[2] || '0 oversized pieces'}</strong><span>Factory review</span></article>
            </div>
          )}

          {cutlist && (
            <div className="cutlist-summary-row">
              <article><strong>{modules.length}</strong><span>Modules</span></article>
              <article><strong>{parts.length}</strong><span>Part rows</span></article>
              <article><strong>{totals.partQuantity || 0}</strong><span>Total parts</span></article>
              <article><strong>{totals.boardAreaSqM || 0} sqm</strong><span>Board area</span></article>
              <article><strong>{totals.sheetCount || totals.estimatedSheets || 0}</strong><span>Sheets</span></article>
              <article><strong>{accuracyScore}%</strong><span>Confidence</span></article>
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
                {sheetLayout.sheets.map((sheet) => (
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

          {cutlist && Boolean(productionLearning?.matchedPatterns?.length) && (
            <section className="cutlist-sheet-section">
              <div className="screen-section-title">Previous project matches used</div>
              <p className="screen-note">These imported patterns are now attached to this cutlist for designer review before factory export.</p>
              <div className="production-pattern-list">
                {productionLearning.matchedPatterns.slice(0, 8).map((pattern, index) => (
                  <article key={`${pattern.moduleName}-${index}`}>
                    <strong>{pattern.moduleName}</strong>
                    <span>{roomLabel(pattern.room)} - {pattern.moduleType} - {pattern.partCount} rows / {pattern.pieceQuantity} panels</span>
                    <small>{pattern.commonRoles?.slice(0, 5).join(', ')}</small>
                  </article>
                ))}
              </div>
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
                {parts.map((part) => (
                  <article key={part.id}>
                    <strong>{part.partCode}</strong>
                    <span>{part.name}<small>{part.material}</small></span>
                    <span>{part.lengthMm} x {part.widthMm} x {part.thicknessMm} mm</span>
                    <b>{part.quantity}</b>
                    <span>{part.edgeBand}<small>{part.grain}</small></span>
                  </article>
                ))}
              </div>
              <p className="screen-note">The full workshop part list is shown here. Export CSV/XLSX for machine imports and shop-floor use.</p>
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

          {cutlist && (
            <>
              <div className="screen-section-title">Raw source files</div>
              <div className="raw-source-list">
                {rawSources.length ? rawSources.slice(0, 8).map((source) => (
                  <article key={source.id || source.fileName}>
                    <FileText size={14} />
                    <div>
                      <strong>{source.originalName || source.fileName}</strong>
                      <span>{source.extension?.replace('.', '').toUpperCase() || 'FILE'} - {Math.max(1, Math.round((source.sizeBytes || 0) / 1024))} KB</span>
                    </div>
                  </article>
                )) : (
                  <article className="empty">
                    <Upload size={14} />
                    <div>
                      <strong>No source files yet</strong>
                      <span>Upload plans, photos, drawings, or measurement notes.</span>
                    </div>
                  </article>
                )}
              </div>
            </>
          )}

          <div className="screen-section-title">Actions</div>
          {cutlist && (
            <label className="secondary-light-button production-upload-button">
              <Upload size={16} /> Upload Raw Sources
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.dxf,.dwg,.svg,.csv,.xlsx,.xlsm,.xls,.txt,.json"
                onChange={handleRawSourceUpload}
                disabled={cutlistLoading}
              />
            </label>
          )}
          <label className="secondary-light-button production-upload-button">
            <Upload size={16} /> Import Previous Project
            <input type="file" accept=".xlsx,.xlsm,.xls,.csv" onChange={handleProductionImport} disabled={cutlistLoading} />
          </label>
          <button className="secondary-light-button" onClick={onCreateCutlistProject} disabled={!project || cutlistLoading}>
            <Layers3 size={16} /> {cutlist ? 'Refresh From Brief' : 'Create Cutlist Project'}
          </button>
          <button className="secondary-light-button" onClick={onRefreshProductionImports} disabled={cutlistLoading}>
            <RotateCcw size={16} /> Refresh Imports
          </button>
          <button className="secondary-light-button" onClick={onRegenerateCutlistParts} disabled={!cutlist || cutlistLoading}>
            <RotateCcw size={16} /> Regenerate Parts
          </button>
          <button className="secondary-light-button" onClick={onDownloadCutlistCsv} disabled={!cutlist}>
            <Download size={16} /> Export Workshop CSV
          </button>
          <button className="secondary-light-button" onClick={onDownloadMaxCutCsv} disabled={!productionExportReady}>
            <Download size={16} /> Export MaxCut CSV
          </button>
          <button className="secondary-light-button" onClick={onDownloadCutlistXlsx} disabled={!productionExportReady}>
            <Download size={16} /> Export Production XLSX
          </button>
          <button className="secondary-light-button" onClick={onDownloadJobSummaryPdf} disabled={!cutlist}>
            <FileText size={16} /> Export Job Summary PDF
          </button>
          <button className="secondary-light-button" onClick={onDownloadJobLayoutPdf} disabled={!cutlist}>
            <FileText size={16} /> Export Job Layout PDF
          </button>
          <button className="secondary-light-button" onClick={onDownloadPanelLabelsPdf} disabled={!productionExportReady}>
            <FileText size={16} /> Export Panel Labels PDF
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
        <button className="btn btn-gold btn-md" type="button" onClick={onSave} disabled={saving}>Save & Regenerate</button>
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
  const [referenceImages, setReferenceImages] = useState([]);
  const [editingRefId, setEditingRefId] = useState('');
  const [refDraft, setRefDraft] = useState({});
  const loadReferenceImages = useCallback(() => {
    api('/api/newinfo-library')
      .then((data) => setReferenceImages(data.success ? (data.images || []) : []))
      .catch(() => setReferenceImages([]));
  }, []);

  useEffect(() => {
    loadReferenceImages();
  }, [loadReferenceImages]);

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
  const references = useMemo(() => referenceImages.filter((asset) => {
    const search = query.trim().toLowerCase();
    const text = [asset.title, asset.category, asset.style, asset.budgetTier, asset.source, ...(asset.tags || [])].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (styleFilter !== 'all' && asset.style !== styleFilter) return false;
    if (budgetFilter !== 'all' && asset.budgetTier !== budgetFilter) return false;
    return true;
  }).slice(0, 80), [budgetFilter, query, referenceImages, styleFilter]);

  const startEditReference = (img) => {
    setEditingRefId(img.id);
    setRefDraft({
      title: img.title || '',
      category: img.category || 'uploaded',
      style: img.style || 'reference',
      budgetTier: img.budgetTier || 'premium',
      source: img.source || 'upload',
      tags: (img.tags || []).join(', ')
    });
  };

  const saveReference = async (id) => {
    const result = await api(`/api/reference-library/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(refDraft)
    });
    if (result.success) {
      setReferenceImages((prev) => prev.map((img) => (img.id === id ? result.image : img)));
      setEditingRefId('');
      setRefDraft({});
    }
  };

  const deleteReference = async (id) => {
    if (!window.confirm('Delete this reference image from the library?')) return;
    const result = await api(`/api/reference-library/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (result.success) {
      setReferenceImages((prev) => prev.filter((img) => img.id !== id));
      if (editingRefId === id) setEditingRefId('');
    }
  };

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
        <span><DatabaseBackup size={15} /> {references.length} managed references</span>
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

      <div className="screen-toolbar generated-toolbar"><ImagePlus size={16} /> Reusable generated assets · AI/provider indexed</div>
      <div className="asset-library-grid">
        {generated.map((asset) => (
          <article key={asset.id}>
            <img src={assetUrl(asset.url)} alt={asset.title || asset.room} />
            <strong>{asset.title || asset.room}</strong>
            <span>{asset.room} - {asset.style} - <span style={{ color: '#c89b45' }}>{asset.sourceType || 'generated'}</span></span>
          </article>
        ))}
        {generated.length === 0 && <p className="screen-note">No generated assets yet. Create a PDF brief from Onboarding to populate this optional reference library.</p>}
      </div>

      <div className="screen-toolbar generated-toolbar"><DatabaseBackup size={16} /> Managed reference image library</div>
      <div className="asset-library-grid managed-reference-grid">
        {references.map((img) => (
          <article key={img.id}>
            <img src={assetUrl(img.url)} alt={img.title} />
            <ReferenceCardControls
              img={img}
              editing={editingRefId === img.id}
              draft={refDraft}
              setDraft={setRefDraft}
              onEdit={() => startEditReference(img)}
              onCancel={() => {
                setEditingRefId('');
                setRefDraft({});
              }}
              onSave={() => saveReference(img.id)}
              onDelete={() => deleteReference(img.id)}
            />
          </article>
        ))}
        {references.length === 0 && <p className="screen-note">No managed reference images match the filters. Upload or generate references from the dashboard and AI render workflow.</p>}
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
  const brands = useMemo(() => {
    const names = new Set(['Merino', 'Greenlam', 'Royale Touche', 'CenturyLaminates', 'Airolam']);
    (items || laminates || []).forEach((item) => item?.brand && names.add(item.brand));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [items, laminates]);

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
            <span className={`material-swatch ${materialTextureClass(item)}`} style={{ backgroundColor: item.hex }} />
            <div>
              <strong>{item.brand} {item.collection}</strong>
              <small>{item.finish} - {item.texture} - {item.budgetTier}</small>
              <p>{item.maintenance}</p>
              <em>{(item.bestFor || []).join(' / ')}</em>
              <a className="material-source-link" href={assetUrl(item.sourceUrl || '')} target="_blank" rel="noreferrer">Open source catalogue</a>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="screen-note">No laminate products match these filters.</p>}
      </div>
    </ScreenFrame>
  );
}

export function RendersScreen({ project, form, floorPlanDraft, providerStatus, library = [], startNewClient, projectList = [], openProject, onDownloadProposal, createCutlistProject }) {
  const projectFloorPlan = project?.floorPlan || floorPlanDraft?.stored || null;
  const annotations = projectFloorPlan?.annotations || floorPlanDraft?.annotations || { zones: [], markers: [] };
  const roomChoices = useMemo(() => roomsForRenderStudio(project, form, annotations), [project, form, annotations]);
  const [room, setRoom] = useState(roomChoices[0]?.id || 'living');
  const [style, setStyle] = useState(form?.primaryStyle || project?.primaryStyle || 'indian-contemporary');
  const [budgetTier, setBudgetTier] = useState(form?.budgetTier || project?.budgetTier || 'premium');
  const [modelTier, setModelTier] = useState('precision');
  const [spendMode, setSpendMode] = useState(providerStatus?.spendMode || 'smart-cost');
  const [reuseFirst, setReuseFirst] = useState(true);
  const [cameraAngle, setCameraAngle] = useState('diagonal');
  const [variantCount, setVariantCount] = useState(4);
  const roomPresets = useMemo(() => getPromptPresetsForRoom(room), [room]);
  const [renders, setRenders] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedRender, setSelectedRender] = useState(null);
  const [renderPlan, setRenderPlan] = useState(null);
  const [reuseMatches, setReuseMatches] = useState([]);
  const [visualMatchImages, setVisualMatchImages] = useState([]);
  const [uploadingVisual, setUploadingVisual] = useState(false);
  const visualUploadRef = useRef(null);
  const [removePeople, setRemovePeople] = useState(true);
  const [furnitureRequirement, setFurnitureRequirement] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [revisionRequest, setRevisionRequest] = useState('');
  const [correctionMistake, setCorrectionMistake] = useState('');
  const [correctionRule, setCorrectionRule] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [uploads, setUploads] = useState({
    sitePhoto: null,
    stylePhoto: null,
    zoomedFloorPlan: null,
    fullFloorPlan: null
  });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [projectCost, setProjectCost] = useState({ totalCost: 0, byProvider: [] });
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
    const roomItems = current.length ? current : renders;
    return reviewFilter === 'all'
      ? roomItems
      : roomItems.filter((item) => (item.reviewStatus || 'unreviewed') === reviewFilter);
  }, [renders, reviewFilter, room]);

  const reviewCounts = useMemo(() => ({
    approved: renders.filter((item) => item.reviewStatus === 'approved').length,
    'needs-revision': renders.filter((item) => item.reviewStatus === 'needs-revision').length,
    rejected: renders.filter((item) => item.reviewStatus === 'rejected').length,
    unreviewed: renders.filter((item) => !item.reviewStatus || item.reviewStatus === 'unreviewed').length
  }), [renders]);

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

  // Load reference images for visual matches
  useEffect(() => {
    api('/api/newinfo-library')
      .then(data => { if (data.success) setVisualMatchImages(data.images?.slice(0, 6) || []); })
      .catch(() => {});
  }, []);

  async function handleVisualUpload(file) {
    if (!file) return;
    setUploadingVisual(true);
    try {
      const formData = new FormData();
      formData.append('referenceImage', file);
      const result = await api('/api/reference-library/upload', { method: 'POST', body: formData });
      if (result.success) {
        setVisualMatchImages(prev => [{ ...result, id: result.url, score: 88 }, ...prev]);
      }
    } catch (e) {
      console.error('Visual upload failed:', e);
    } finally {
      setUploadingVisual(false);
    }
  }

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
      const [renderData, correctionData, costData] = await Promise.all([
        api(`/api/projects/${project.id}/renders`),
        api(`/api/projects/${project.id}/renders/mistakes`),
        api(`/api/projects/${project.id}/costs`)
      ]);
      const nextRenders = renderData.items || [];
      setRenders(nextRenders);
      setCorrections(correctionData.items || []);
      setProjectCost(costData || { totalCost: 0, byProvider: [] });
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
      body.append('qualityMode', modelTier);
      body.append('spendMode', spendMode);
      body.append('reuseFirst', String(reuseFirst));
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
      if (result.reused) {
        setReuseMatches(result.reuseMatches || []);
        setRenderPlan(result.renderPlan || null);
      }
      const nextVariants = (result.variants?.length ? result.variants : result.asset ? [result.asset] : [])
        .filter(isClientSafeRenderAsset);
      setRenders((prev) => mergeUniqueRenders([...nextVariants, ...prev]));
      setSelectedRender(nextVariants.find((item) => !item.isReferenceOption && item.sourceType !== 'library-reference') || nextVariants[0] || selectedRender);
      setRenderPlan(result.renderPlan || null);
      setReuseMatches(result.reuseMatches || []);
      setCorrections(result.correctionsApplied || corrections);
      setCustomInstruction('');
      setFurnitureRequirement('');
      setReviewFilter('all');
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

  async function handleReview(status) {
    if (!project?.id || !selectedRender) return;
    setBusy(status === 'approved' ? 'Approving render for client brief...' : 'Saving render review...');
    try {
      const result = await api(`/api/projects/${project.id}/renders/${selectedRender.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, note: reviewNote })
      });
      const review = result.review;
      setRenders((prev) => prev.map((item) => item.id === selectedRender.id
        ? { ...item, reviewStatus: review.status, reviewNote: review.note, reviewedAt: review.updatedAt }
        : item));
      setSelectedRender((prev) => prev ? { ...prev, reviewStatus: review.status, reviewNote: review.note, reviewedAt: review.updatedAt } : prev);
      setReviewNote('');
    } catch (err) {
      alert(`Could not save review: ${err.message}`);
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
          <button className="btn btn-gold btn-md" onClick={startNewClient}><Plus size={16} /> Add Client</button>
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
            <article><strong>{reviewCounts.approved}</strong><span>approved</span></article>
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
            <label>Spend mode<select value={spendMode} onChange={(event) => setSpendMode(event.target.value)}>
              <option value="smart-cost">Smart Cost</option>
              <option value="demo-saver">Demo Saver</option>
              <option value="premium-quality">Premium Quality</option>
            </select></label>
            <label className="render-inline-check"><input type="checkbox" checked={reuseFirst} onChange={(event) => setReuseFirst(event.target.checked)} /> Reuse matching library before spending credits</label>
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
            <button className="btn btn-gold btn-md" onClick={handleGenerateRender} disabled={Boolean(busy)}>
              <Sparkles size={16} /> Generate Render Variants
            </button>
          </div>
        </aside>

        <main className="surface-panel render-preview-panel">
          <div className="render-preview-header">
            <div>
              <span>{busy || 'Ready to generate'}</span>
              <h2>{roomLabel(room)} render options</h2>
              <p>{renderPlan?.modelPlan?.note || 'Each run returns one saved reference match plus fresh AI render options for this room.'} Prompt: {renderPlan?.promptRefinement?.provider || (providerStatus?.promptRefinement?.configured ? 'Gemini ready' : 'deterministic compiler')}.</p>
            </div>
            <div className="render-preview-actions">
              <button className="btn btn-gold btn-md" onClick={handleGenerateRender} disabled={Boolean(busy)}>
                <Sparkles size={15} /> Generate Variants
              </button>
              {busy && <div className="render-busy-pulse" />}
            </div>
          </div>

          {selectedRender ? (
            <div className="render-main-frame">
              <img src={assetUrl(selectedRender.url)} alt={selectedRender.title} />
              <div className="render-main-badge">{renderSourceLabel(selectedRender)}</div>
              <div className={`render-review-badge ${selectedRender.reviewStatus || 'unreviewed'}`}>
                {reviewStatusLabel(selectedRender.reviewStatus)}
              </div>
            </div>
          ) : (
            <div className="render-main-placeholder">
              <ImagePlus size={52} />
              <strong>No render generated yet</strong>
              <span>Choose a room, confirm layout constraints, and generate variants.</span>
            </div>
          )}

          {selectedRender && (
            <div className="render-review-toolbar">
              <div>
                <strong>Designer review</strong>
                <span>Approve only client-ready renders. Approved images are carried into the PDF brief.</span>
              </div>
              <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Optional review note" />
              <div className="render-review-actions">
                <button className="approve" onClick={() => handleReview('approved')} disabled={Boolean(busy)}><CheckCircle2 size={15} /> Approve for Brief</button>
                <button onClick={() => handleReview('needs-revision')} disabled={Boolean(busy)}><RotateCcw size={15} /> Needs Revision</button>
                <button className="reject" onClick={() => handleReview('rejected')} disabled={Boolean(busy)}><XCircle size={15} /> Reject</button>
              </div>
            </div>
          )}

          <div className="render-review-filters">
            {[
              ['all', `All ${renders.length}`],
              ['approved', `Approved ${reviewCounts.approved}`],
              ['needs-revision', `Needs revision ${reviewCounts['needs-revision']}`],
              ['unreviewed', `Unreviewed ${reviewCounts.unreviewed}`],
              ['rejected', `Rejected ${reviewCounts.rejected}`]
            ].map(([value, label]) => (
              <button key={value} className={reviewFilter === value ? 'active' : ''} onClick={() => setReviewFilter(value)}>{label}</button>
            ))}
          </div>

          <div className="render-variant-strip">
            {gallery.slice(0, 8).map((item) => (
              <button key={item.id} className={`${selectedRender?.id === item.id ? 'active' : ''} ${item.isReferenceOption || item.sourceType === 'library-reference' ? 'reference-option' : 'fresh-option'}`} onClick={() => setSelectedRender(item)}>
                <img src={assetUrl(item.url)} alt={item.title} />
                <em>{renderSourceLabel(item)}</em>
                <span>{item.title}</span>
                <b className={item.reviewStatus || 'unreviewed'}>{reviewStatusLabel(item.reviewStatus)}</b>
              </button>
            ))}
            {!gallery.length && <p className="screen-note">No renders match this review filter.</p>}
          </div>

          {selectedRender && (
            <div className="render-revision-bar">
              <input value={revisionRequest} onChange={(event) => setRevisionRequest(event.target.value)} placeholder="Refine selected render, e.g. make TV wall warmer and keep sofa placement same" />
              <button className="btn btn-gold btn-md" onClick={handleEditRender} disabled={Boolean(busy) || !revisionRequest.trim()}><Sparkles size={15} /> Revise</button>
            </div>
          )}

          <div className="render-prompt-panel">
            <strong>Compiled prompt</strong>
            <p>{renderPlan?.prompt || selectedRender?.prompt || 'The generated prompt will appear here after you run the render.'}</p>
          </div>
        </main>

        <aside className="surface-panel render-inspector-panel">
          <div className="screen-section-title">Brief approval</div>
          <div className="render-approval-summary">
            <article><CheckCircle2 size={16} /><strong>{reviewCounts.approved}</strong><span>Approved renders</span></article>
            <article><RotateCcw size={16} /><strong>{reviewCounts['needs-revision']}</strong><span>Needs revision</span></article>
            <article><XCircle size={16} /><strong>{reviewCounts.rejected}</strong><span>Rejected</span></article>
          </div>

          <div className="render-handoff-panel">
            <strong>Connected next steps</strong>
            <span>{reviewCounts.approved ? 'Approved visuals can move into the PDF brief and production cutlist.' : 'Approve at least one render before locking the client-facing brief.'}</span>
            <button className="btn btn-gold btn-md" onClick={onDownloadProposal} disabled={!reviewCounts.approved || Boolean(busy)}>
              <FileText size={15} /> Generate PDF Brief
            </button>
            <button className="secondary-light-button" onClick={createCutlistProject} disabled={!reviewCounts.approved || Boolean(busy)}>
              <Hammer size={15} /> Create Cutlist Project
            </button>
          </div>

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
            {layoutConstraints.cameraDirection && (
              <article>
                <strong>Camera direction</strong>
                <span>{layoutConstraints.cameraDirection}</span>
              </article>
            )}
            {layoutConstraints.materialPlanSummary && (
              <article>
                <strong>Materialized 2D plan</strong>
                <span>{layoutConstraints.materialPlanSummary}</span>
              </article>
            )}
            {layoutConstraints.markers.map((marker, index) => (
              <article key={`${marker.type}-${index}`}>
                <strong>{marker.type}</strong>
                <span>{[marker.wallSide, marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join(' - ') || `x${marker.x} y${marker.y}`}</span>
              </article>
            ))}
            {!layoutConstraints.zones.length && !layoutConstraints.markers.length && (
              <article><strong>Prompt-only layout</strong><span>Add markers in onboarding for better spatial adherence.</span></article>
            )}
          </div>

          <div className="screen-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Visual Matches</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="secondary-light-button"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => visualUploadRef.current?.click()}
                disabled={uploadingVisual}
              >
                <Upload size={11} style={{ marginRight: 3 }} />
                {uploadingVisual ? 'Uploading…' : 'Upload'}
              </button>
              <input
                ref={visualUploadRef}
                type="file"
                accept="image/*"
                hidden
                onChange={e => e.target.files[0] && handleVisualUpload(e.target.files[0])}
              />
            </div>
          </div>
          <div className="render-match-grid">
            {[...reuseMatches, ...matchedLibrary, ...visualMatchImages].slice(0, 4).map((item, i) => (
              <article key={item.id || i}>
                <img src={assetUrl(item.url)} alt={item.title} />
                <strong>{item.matchScore || item.score || item.reusableScore || 82}%</strong>
                <span>{item.title}</span>
                <small style={{ color: '#c89b45', fontSize: '10px' }}>{item.sourceType || item.source || item.provider || 'reference'}</small>
              </article>
            ))}
            {!reuseMatches.length && !matchedLibrary.length && !visualMatchImages.length && <p className="screen-note">No matching library images yet. Generated variants will build the library.</p>}
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

function isClientSafeRenderAsset(item = {}) {
  const path = String(item.url || item.filePath || item.imagePath || item.path || '').toLowerCase().split('?')[0];
  if (item.sourceType === 'mock-generated') return false;
  if (path.endsWith('.svg')) return false;
  return Boolean(path) || item.isReferenceOption || item.sourceType === 'library-reference';
}

function reviewStatusLabel(status = 'unreviewed') {
  if (status === 'approved') return 'Approved';
  if (status === 'needs-revision') return 'Needs revision';
  if (status === 'rejected') return 'Rejected';

  return 'Unreviewed';
}

function renderSourceLabel(item = {}) {
  if (item.isReferenceOption || item.sourceType === 'library-reference') return 'Reference match';
  if (item.provider || item.sourceType === 'generated') return 'Fresh AI render';
  return 'Generated render';
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

  const packageReadiness = [
    { label: 'Client PDF brief', done: Boolean(designPackage), detail: designPackage ? 'Ready to export for client review' : 'Generate after intake and renders' },
    { label: 'Approved visuals', done: Boolean(designPackage?.moodboards?.length), detail: `${designPackage?.moodboards?.length || 0} room directions available` },
    { label: 'Floor-plan story', done: Boolean(project?.floorPlan || project?.floorPlanNotes), detail: project?.floorPlan ? 'Plan and annotations attached' : 'Add plan notes for stronger brief' },
    { label: 'Material shortlist', done: Boolean(designPackage?.laminateMatches?.length), detail: `${designPackage?.laminateMatches?.length || 0} material choices` },
    { label: 'Production handoff', done: Boolean(cutlist), detail: cutlist ? `${cutlist.modules?.length || 0} modules in cutlist draft` : 'Create after client approval' }
  ];
  const clientReadyScore = Math.round((packageReadiness.filter((item) => item.done).length / packageReadiness.length) * 100);

  return (
    <ScreenFrame title="Client-Ready Package" subtitle="Export the clean client brief first, then move approved scope into production handoff" tone="command">
      <div className="deliverables-command-grid">
        <section className="surface-panel deliverables-overview-panel">
          <div className="command-panel-header">
            <div>
              <div className="screen-section-title">Client package readiness</div>
              <p>Keep this screen client-facing: brief, visuals, floor-plan explanation, materials, and next-step handoff are grouped into one package.</p>
            </div>
            <button className="secondary-light-button" onClick={refreshDocuments}><RotateCcw size={15} /> Refresh</button>
          </div>

          <div className="client-package-score">
            <strong>{clientReadyScore}%</strong>
            <div>
              <span>client-ready</span>
              <p>{project?.clientName || 'Select or add a client'} - {project?.city || 'City pending'}</p>
            </div>
          </div>

          <div className="client-package-checks">
            {packageReadiness.map((item) => (
              <article key={item.label} className={item.done ? 'done' : ''}>
                <CheckCircle2 size={15} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="deliverable-kpis">
            <article><FileText size={18} /><strong>{documents.filter((item) => item.type === 'proposal-brief').length}</strong><span>PDF briefs</span></article>
            <article><Layers3 size={18} /><strong>{documents.filter((item) => item.type === 'cutlist-pdf').length}</strong><span>Cutlist PDFs</span></article>
            <article><BriefcaseBusiness size={18} /><strong>{projectDocuments.length}</strong><span>Active project files</span></article>
            <article><DatabaseBackup size={18} /><strong>{documents.length}</strong><span>Total stored docs</span></article>
          </div>

          <div className="deliverable-actions">
            <button className="btn btn-gold btn-md" onClick={onDownloadProposal} disabled={!project}>
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
          <div className="screen-section-title">Package filters</div>
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
            <article><CheckCircle2 size={16} /><span>Client sees the PDF brief, approved visuals, material logic, and sign-off.</span></article>
            <article><CheckCircle2 size={16} /><span>Studio keeps production files, MaxCut exports, and backups behind the handoff step.</span></article>
            <article><CheckCircle2 size={16} /><span>Every exported file remains stored locally for future reference.</span></article>
          </div>
        </aside>
      </div>

      <section className="surface-panel document-vault-panel">
        <div className="command-panel-header">
          <div>
            <div className="screen-section-title">Stored package files</div>
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
    <ScreenFrame title="Studio Settings" subtitle="Branding, proposal copy, provider readiness, and local workspace maintenance" tone="command">
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
            <strong>Client brief footer</strong>
            <span>{studioSettings?.proposalFooter}</span>
          </div>
        </aside>

        <section className="surface-panel settings-handover-panel">
          <div className="screen-section-title">Proposal and handover copy</div>
          <div className="settings-copy-grid">
            {handoverFields.map(([field, label]) => (
              <label key={field}>
                {label}
                <textarea rows={4} value={studioSettings?.[field] || ''} onChange={(event) => updateStudioSettings(field, event.target.value)} />
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
            <button className="btn btn-gold btn-md" onClick={onExportBackup} disabled={maintenanceBusy}>
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
          <div className="provider-health-grid">
            {providerHealthRows(providerStatus).map((item) => (
              <article key={item.id}>
                <strong>{item.label}</strong>
                <span className={`provider-badge ${item.tone}`}>{item.status}</span>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
          <div className="settings-handover-checks">
            <article><CheckCircle2 size={16} /><span>Local SQLite project storage</span></article>
            <article><CheckCircle2 size={16} /><span>Filesystem asset and PDF storage</span></article>
            <article><CheckCircle2 size={16} /><span>Backup export/import available</span></article>
            <article><CheckCircle2 size={16} /><span>Guarded demo reset available</span></article>
          </div>
          <p className="screen-note">Use `.env` for fresh provider keys. Active provider path: {providerStatus?.activeLabel || 'library-reuse'} · spend mode {providerStatus?.spendMode || 'smart-cost'}.</p>
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
        <article><strong>2. PDF Brief</strong><span>Create a client-ready brief with floor plan preview, room details, checks, and sign-off.</span></article>
        <article><strong>3. Approval</strong><span>Review the brief, confirm layout details, and keep material assumptions visible.</span></article>
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

function FeatureCommandCenter({ intelligence }) {
  const features = intelligence?.features || [];
  if (!features.length) return null;

  return (
    <section className="surface-panel feature-command-center">
      <div className="feature-command-header">
        <div>
          <div className="screen-section-title">Feature command center</div>
          <p>{intelligence.summary || 'Track each studio capability from intake through deliverables.'}</p>
        </div>
        <div className={`feature-overall-score ${intelligence.overallTone || 'watch'}`}>
          <strong>{intelligence.overallScore || 0}%</strong>
          <span>overall</span>
        </div>
      </div>
      <div className="feature-command-grid">
        {features.map((feature) => (
          <article key={feature.id} className={`feature-command-card ${feature.tone || 'watch'}`}>
            <div>
              <strong>{feature.label}</strong>
              <span>{feature.status}</span>
            </div>
            <b>{feature.score}%</b>
            <i><em style={{ width: `${clampPercent(feature.score)}%` }} /></i>
            <small>{feature.metric}</small>
            <p>{feature.nextAction}</p>
          </article>
        ))}
      </div>
    </section>
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
        <button type="button" onClick={() => onOpen?.(item.id, nextNavForProject(item))}>{item.nextAction || 'Open project'}</button>
      </div>
      <div className="command-confidence">
        <strong>{readiness}%</strong>
        <i><b style={{ width: `${clampPercent(readiness)}%` }} /></i>
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

function materialTextureClass(item = {}) {
  const text = `${item.texture || ''} ${item.finish || ''} ${item.collection || ''}`.toLowerCase();
  if (/wood|teak|walnut|oak|veneer|fabwood/.test(text)) return 'wood';
  if (/stone|marble|quartz|granite|slab|travertine/.test(text)) return 'stone';
  if (/fluted|ribbed|groove|linear/.test(text)) return 'fluted';
  if (/metal|brass|champagne/.test(text)) return 'metal';
  if (/fabric|linen|textile/.test(text)) return 'fabric';
  if (/gloss|acrylic|solid surface|hanex/.test(text)) return 'gloss';
  return 'matte';
}

function ReferenceCardControls({ img, editing, draft, setDraft, onEdit, onCancel, onSave, onDelete }) {
  if (editing) {
    return (
      <div className="reference-edit-form">
        <input
          value={draft.title || ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Reference title"
        />
        <div className="reference-edit-row">
          <select
            value={draft.category || 'uploaded'}
            onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
          >
            <option value="uploaded">Uploaded</option>
            <option value="gemini-api">Gemini API</option>
            <option value="ai-generated">AI generated</option>
            <option value="curated">Curated</option>
            <option value="living-room">Living room</option>
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
            <option value="pooja">Pooja</option>
            <option value="materials">Materials</option>
          </select>
          <select
            value={draft.source || 'upload'}
            onChange={(event) => setDraft((prev) => ({ ...prev, source: event.target.value }))}
          >
            <option value="upload">Upload</option>
            <option value="gemini-api">Gemini API</option>
            <option value="ai-generated">AI generated</option>
            <option value="curated">Curated</option>
            <option value="client-reference">Client reference</option>
          </select>
        </div>
        <input
          value={draft.style || ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, style: event.target.value }))}
          placeholder="Style, e.g. Indian Contemporary"
        />
        <select
          value={draft.budgetTier || 'premium'}
          onChange={(event) => setDraft((prev) => ({ ...prev, budgetTier: event.target.value }))}
        >
          <option value="value">Essential</option>
          <option value="comfort">Comfort</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
        <input
          value={draft.tags || ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
          placeholder="Tags separated by commas"
        />
        <div className="reference-card-actions">
          <button type="button" className="secondary-light-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-gold btn-sm" onClick={onSave}><Check size={13} /> Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reference-card-controls">
      <strong>{img.title || 'Untitled reference'}</strong>
      <span>{img.source || 'upload'} - {(img.category || 'reference').replace(/-/g, ' ')} - {img.budgetTier || 'premium'}</span>
      {!!img.tags?.length && <small>{img.tags.slice(0, 4).join(' / ')}</small>}
      <div className="reference-card-actions">
        <button type="button" className="secondary-light-button" onClick={onEdit}><PencilLine size={13} /> Rename</button>
        <button type="button" className="secondary-light-button danger-action" onClick={onDelete}><Trash2 size={13} /> Delete</button>
      </div>
    </div>
  );
}

function providerHealthRows(providerStatus = {}) {
  const providers = providerStatus.providers || {};
  const openAiType = providerStatus.openai?.configuredKeyType || '';
  const rows = [
    {
      id: 'library-reuse',
      label: 'Reusable library',
      status: 'Fallback active',
      tone: 'ready',
      detail: `${providerStatus.reuseThreshold || 86}% match threshold before spending credits.`
    },
    {
      id: 'gemini-imagen',
      label: 'Gemini / Imagen',
      status: providers.geminiImagen ? 'Ready' : 'Missing key',
      tone: providers.geminiImagen ? 'ready' : 'missing',
      detail: providerStatus.geminiImagen?.model || 'Add GEMINI_API_KEY or GOOGLE_AI_STUDIO_KEY for image generation.'
    },
    {
      id: 'gemini-vision',
      label: 'Gemini vision/text',
      status: providers.gemini ? 'Ready' : 'Missing key',
      tone: providers.gemini ? 'ready' : 'missing',
      detail: providerStatus.promptRefinement?.configured ? `Prompt refinement via ${providerStatus.promptRefinement.model}` : 'Used for floor-plan advisory vision and prompt refinement.'
    },
    {
      id: 'openai',
      label: 'OpenAI images',
      status: providers.openai || providers['openai-gpt-image-1'] ? 'Ready' : openAiType ? 'Text-only key' : 'Missing key',
      tone: providers.openai || providers['openai-gpt-image-1'] ? 'ready' : openAiType ? 'text-only' : 'missing',
      detail: openAiType ? 'Configured key is not a native OpenAI image key. Add a true OpenAI Platform key for image fallback.' : 'Optional premium fallback for production reliability.'
    },
    {
      id: 'huggingface',
      label: 'Hugging Face FLUX',
      status: providers.huggingface ? 'Ready' : 'Missing key',
      tone: providers.huggingface ? 'ready' : 'missing',
      detail: providerStatus.huggingface?.models?.join(', ') || 'Smart Cost render fallback.'
    },
    {
      id: 'freepik-vyro-pexels',
      label: 'Freepik / Vyro / Pexels',
      status: providers.freepik || providers.vyro || providers.pexels ? 'Fallback active' : 'Missing key',
      tone: providers.freepik || providers.vyro || providers.pexels ? 'ready' : 'missing',
      detail: 'Used for lower-cost fallback and reference discovery when live generation is unavailable.'
    },
    {
      id: 'pollinations',
      label: 'Pollinations draft renders',
      status: providers.pollinations ? 'Fallback active' : 'Disabled',
      tone: providers.pollinations ? 'ready' : 'missing',
      detail: providerStatus.pollinations?.note || 'Zero-cost public fallback for draft renders. Keep premium providers for final client images.'
    }
  ];
  return rows;
}

function workflowStageForProject(project = {}) {
  if (project.hasCutlist || project.cutlistCount) return 'cutlist';
  if (project.hasProposal) return 'deliverables';
  if (project.approvedRenderCount) return 'brief';
  if (project.assetCount || project.packageCount) return 'renders';
  if (project.hasFloorPlan) return 'renders';
  if (project.selectedSpaces?.length) return 'floor-plan';
  return 'intake';
}

function nextNavForProject(project = {}) {
  const stage = workflowStageForProject(project);
  return connectedWorkflowStages.find((item) => item.id === stage)?.nav || 'dashboard';
}

function pipelineHint(stage) {
  if (stage.includes('Lead')) return 'Needs intake + rooms';
  if (stage.includes('Floor')) return 'Layout source of truth';
  if (stage.includes('Render')) return 'Approve client-ready images';
  if (stage.includes('Approved')) return 'Ready for proposal export';
  if (stage.includes('Onboarding')) return 'Questionnaire quality';
  if (stage.includes('Brief')) return 'Client-ready PDF';
  if (stage.includes('Exported')) return 'Signed document trail';
  if (stage.includes('Cutlist')) return 'Production handoff queue';
  if (stage.includes('Production')) return 'Learned factory standards';
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
  if (stage === 'Brief Ready' || stage === 'Render Review' || stage === 'Render Approved') return 'design';
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
