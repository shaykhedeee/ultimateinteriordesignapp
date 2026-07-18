import React from 'react';
import {
  Archive, Boxes, CheckCircle2, FileText, Layers3, Loader2,
  Palette, Search, Sparkles, Upload, BarChart3, FolderOpen,
  ClipboardList, ImagePlus, Settings, Info, User, Home,
  AlertTriangle
} from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { floorPlanComponentTypes } from '../data/studioData.js';
import { Button, Badge, Card, CardHeader } from './ui/index.js';

export function InspectorPanel({
  activeNav = 'dashboard',
  activeMoodboard,
  activeImages,
  providerStatus,
  form,
  floorPlanDraft,
  floorPlanAnalysis,
  laminates,
  library,
  generating,
  uploading,
  project,
  canGenerate = true,
  onGenerate,
  onRegenerate,
  onUploadReferences,
  onDownloadProposal,
  onCreateCutlistProject,
  onRefreshLibrary,
  onExportBackup,
  cutlist,
  adminSummary,
  projectList
}) {
  const generateAction = () => {
    if (activeMoodboard?.room && activeMoodboard.room !== 'whole-home') {
      onRegenerate(activeMoodboard.room);
      return;
    }
    onGenerate();
  };

  return (
    <aside className="inspector">
      <div className="inspector-scroll">
        {renderPanelContent(activeNav, {
          activeMoodboard, activeImages, providerStatus, form,
          floorPlanDraft, floorPlanAnalysis, laminates, library,
          generating, uploading, project, canGenerate, generateAction,
          onUploadReferences, onDownloadProposal, onCreateCutlistProject,
          onRefreshLibrary, onExportBackup, cutlist, adminSummary, projectList
        })}
      </div>
    </aside>
  );
}

function renderPanelContent(activeNav, ctx) {
  switch (activeNav) {
    case 'admin':
      return <AdminPanel {...ctx} />;
    case 'projects':
      return <ProjectsPanel {...ctx} />;
    case 'pipeline':
      return <PipelinePanel />;
    case 'dashboard':
      return <OnboardingPanel {...ctx} />;
    case 'renders':
      return <RendersPanel {...ctx} />;
    case 'briefs':
      return <BriefsPanel {...ctx} />;
    case 'cutlists':
      return <CutlistPanel {...ctx} />;
    case 'materials':
      return <MaterialsPanel {...ctx} />;
    case 'settings':
      return <SettingsPanel />;
    default:
      return <OnboardingPanel {...ctx} />;
  }
}

/* ───── Admin Panel ───── */
function AdminPanel({ adminSummary, projectList, library, providerStatus }) {
  const stats = adminSummary?.stats;
  return (
    <>
      <Card>
        <CardHeader>Studio Overview</CardHeader>
        <div className="admin-stats">
          <article><strong>{stats?.totalProjects || projectList?.length || 0}</strong><span>Projects</span></article>
          <article><strong>{stats?.generatedAssets || library?.length || 0}</strong><span>Assets</span></article>
          <article><strong>{stats?.pendingBriefs || 0}</strong><span>Pending</span></article>
          <article><strong>{stats?.activeCutlists || 0}</strong><span>Cutlists</span></article>
        </div>
        {providerStatus && (
          <div className="inspector-note">
            <Info size={14} /> Provider: Gemini API
          </div>
        )}
      </Card>
      <Card>
        <CardHeader>Quick Actions</CardHeader>
        <Button variant="gold" size="sm" fullWidth onClick={() => {}}>
          <BarChart3 size={14} /> View Full Report
        </Button>
      </Card>
    </>
  );
}

/* ───── Projects Panel ───── */
function ProjectsPanel({ projectList }) {
  return (
    <Card>
      <CardHeader>{projectList?.length || 0} Projects</CardHeader>
      <div className="inspector-mini-list">
        {(projectList || []).slice(0, 6).map((p) => (
          <article key={p.id} className="inspector-mini-row">
            <FolderOpen size={14} />
            <span>{p.clientName}</span>
            <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
          </article>
        ))}
        {(!projectList || projectList.length === 0) && (
          <p className="muted">No projects yet</p>
        )}
      </div>
    </Card>
  );
}

/* ───── Pipeline Panel ───── */
function PipelinePanel() {
  return (
    <Card>
      <CardHeader>Pipeline</CardHeader>
      <div className="empty-state-sm">
        <Info size={20} />
        <p className="muted">Pipeline visualization coming soon</p>
      </div>
    </Card>
  );
}

/* ───── Onboarding / Dashboard Panel ───── */
function OnboardingPanel({
  activeMoodboard, activeImages, providerStatus, form,
  floorPlanDraft, floorPlanAnalysis, laminates, library,
  generating, uploading, project, canGenerate, generateAction,
  onUploadReferences, onDownloadProposal, onRefreshLibrary, onExportBackup, onCreateCutlistProject
}) {
  const layout = activeMoodboard
    ? summarizePromptLayout(activeMoodboard.prompt)
    : floorPlanDraft?.analysis;
  const markedComponents = [
    ...(layout?.components || []),
    ...(floorPlanDraft?.analysis?.components || [])
  ].filter((value, index, items) => value && items.indexOf(value) === index);

  return (
    <>
      <Card>
        <CardHeader><Sparkles size={15} /> Brief Visual Support</CardHeader>
        <div className="provider-status">
          <span>Source: Gemini API</span>
        </div>
        <label className="inspector-label">Brief rationale
          <textarea rows={3} value={activeMoodboard?.prompt || form.notes || 'Add Client to begin.'} readOnly />
        </label>
        <Button variant="gold" size="sm" fullWidth onClick={generateAction} loading={generating} disabled={!canGenerate}>
          <Sparkles size={14} /> {generating ? 'Generating...' : 'Refresh Visuals'}
        </Button>
        {activeImages.length > 0 && (
          <div className="mini-renders">
            {activeImages.slice(0, 3).map((image, i) => <img key={i} src={image} alt="" />)}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader><Layers3 size={15} /> Floor Plan</CardHeader>
        <div className="layout-constraint-list">
          <article><strong>{floorPlanDraft?.fileName || 'Not uploaded'}</strong><span>Source</span></article>
          <article><strong>{layout?.zoneCount || floorPlanDraft?.annotations?.zones?.length || 0}</strong><span>Zones</span></article>
          <article><strong>{layout?.markerCount || floorPlanDraft?.annotations?.markers?.length || 0}</strong><span>Markers</span></article>
          <article><strong>{(markedComponents.slice(0, 3).join(', ') || 'Pending')}</strong><span>Components</span></article>
        </div>
        {floorPlanAnalysis && (
          <div className="inspector-analysis-note">
            <strong>{floorPlanAnalysis.confidence}% confidence</strong>
            <span>{floorPlanAnalysis.whatAiUnderstood}</span>
          </div>
        )}
      </Card>

      {laminates.length > 0 && (
        <Card>
          <CardHeader><Palette size={15} /> Materials</CardHeader>
          <div className="material-list">
            {laminates.slice(0, 5).map((item) => (
              <article key={item.id} className="material-row">
                <span style={{ background: item.hex }} />
                <div>
                  <strong>{item.brand} {item.collection}</strong>
                  <small>{item.finish}</small>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {library.length > 0 && (
        <Card>
          <CardHeader><Archive size={15} /> Library matches</CardHeader>
          <div className="library-grid">
            {library.slice(0, 4).map((asset) => (
              <article key={asset.id} className="library-card">
                <img src={assetUrl(asset.url)} alt={asset.title || asset.room} />
                <span>{asset.room}</span>
              </article>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader><Boxes size={15} /> Actions</CardHeader>
        <label className={`upload-label ${!project ? 'disabled' : ''}`}>
          <Upload size={14} />
          {uploading ? 'Uploading...' : 'Upload references'}
          <input type="file" multiple accept="image/*" onChange={onUploadReferences} disabled={!project} hidden />
        </label>
        <Button variant="secondary" size="sm" fullWidth onClick={onDownloadProposal} disabled={!project}>
          <FileText size={14} /> Export PDF
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={onCreateCutlistProject} disabled={!project}>
          <Boxes size={14} /> Create Cutlist
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={onRefreshLibrary}>
          <Search size={14} /> Refresh library
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={onExportBackup}>
          <Archive size={14} /> Export backup
        </Button>
      </Card>

      <Card>
        <CardHeader><CheckCircle2 size={15} /> Built-in checks</CardHeader>
        <p className="muted">Vastu, kitchen chimney route, work triangle, wardrobe hanging, wet-zone carcass, and family safety checks.</p>
      </Card>
    </>
  );
}

/* ───── Renders Panel ───── */
function RendersPanel({ generating, project, activeMoodboard, library }) {
  return (
    <>
      <Card>
        <CardHeader><ImagePlus size={15} /> Render Settings</CardHeader>
        <div className="inspector-note">
          <Info size={14} /> Generate AI visuals per room
        </div>
        {project && (
          <Badge variant="success">Project active</Badge>
        )}
      </Card>
      <Card>
        <CardHeader>Room Assets</CardHeader>
        <div className="library-grid">
          {(activeMoodboard?.assets || library || []).slice(0, 4).map((asset, i) => (
            <article key={asset.id || i} className="library-card">
              <img src={assetUrl(asset.url)} alt="" />
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ───── Briefs Panel ───── */
function BriefsPanel({ project, form, floorPlanDraft }) {
  const steps = [
    { label: 'Client profile', done: Boolean(form.clientName) },
    { label: 'Scope & rooms', done: form.selectedSpaces?.length > 0 },
    { label: 'Floor plan', done: Boolean(floorPlanDraft?.fileName) },
    { label: 'Materials selected', done: Boolean(form.primaryStyle) },
    { label: 'Budget set', done: Boolean(form.budgetTier) }
  ];

  return (
    <>
      <Card>
        <CardHeader><FileText size={15} /> Brief Checklist</CardHeader>
        <div className="inspector-checklist">
          {steps.map((s, i) => (
            <div key={i} className={`check-item ${s.done ? 'done' : ''}`}>
              <CheckCircle2 size={14} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        {project && (
          <div className="inspector-note">
            <Badge variant="success">{project.clientName}</Badge>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader>Export</CardHeader>
        <Button variant="gold" size="sm" fullWidth disabled={!project}>
          <FileText size={14} /> Download PDF Brief
        </Button>
      </Card>
    </>
  );
}

/* ───── Cutlist Panel ───── */
function CutlistPanel({ cutlist, project, floorPlanDraft }) {
  const moduleCount = cutlist?.modules?.length || 0;
  const partCount = cutlist?.parts?.length || 0;

  return (
    <>
      <Card>
        <CardHeader><ClipboardList size={15} /> Cutlist Summary</CardHeader>
        {cutlist ? (
          <div className="admin-stats">
            <article><strong>{moduleCount}</strong><span>Modules</span></article>
            <article><strong>{partCount}</strong><span>Parts</span></article>
            <article><strong>{cutlist.revision || 1}</strong><span>Revision</span></article>
          </div>
        ) : (
          <div className="empty-state-sm">
            <p className="muted">{project ? 'Create cutlist from brief' : 'Open a project first'}</p>
          </div>
        )}
      </Card>
      {cutlist && (
        <Card>
          <CardHeader>Quick Actions</CardHeader>
          <Button variant="secondary" size="sm" fullWidth>
            <FileText size={14} /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            <FileText size={14} /> Export PDF
          </Button>
        </Card>
      )}
    </>
  );
}

/* ───── Materials Panel ───── */
function MaterialsPanel({ laminates }) {
  return (
    <Card>
      <CardHeader><Palette size={15} /> Laminate Library</CardHeader>
      <div className="material-list">
        {(laminates || []).slice(0, 10).map((item) => (
          <article key={item.id} className="material-row">
            <span style={{ background: item.hex }} />
            <div>
              <strong>{item.brand} {item.collection}</strong>
              <small>{item.finish} - {item.category}</small>
            </div>
          </article>
        ))}
        {(!laminates || laminates.length === 0) && (
          <p className="muted">No materials loaded</p>
        )}
      </div>
    </Card>
  );
}

/* ───── Settings Panel ───── */
function SettingsPanel() {
  return (
    <Card>
      <CardHeader><Settings size={15} /> Settings</CardHeader>
      <p className="muted">Configure studio branding, defaults, and preferences from the Settings screen.</p>
    </Card>
  );
}

/* ───── Helpers ───── */
function summarizePromptLayout(prompt = '') {
  if (!prompt.includes('Floor-plan constraints')) return null;
  return {
    zoneCount: 'Used',
    markerCount: 'Used',
    components: floorPlanComponentTypes.filter((type) => prompt.includes(type))
  };
}
