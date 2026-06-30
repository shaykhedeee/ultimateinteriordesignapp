import React from 'react';
import { Archive, Boxes, CheckCircle2, FileText, Layers3, Loader2, Palette, Search, Share2, Sparkles, Upload } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { floorPlanComponentTypes } from '../data/studioData.js';

export function InspectorPanel({
  activeMoodboard,
  activeImages,
  providerStatus,
  form,
  floorPlanDraft,
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
  onExportBackup
}) {
  const generateAction = () => {
    if (activeMoodboard?.room && activeMoodboard.room !== 'whole-home') {
      onRegenerate(activeMoodboard.room);
      return;
    }
    onGenerate();
  };
  const layout = activeMoodboard
    ? summarizePromptLayout(activeMoodboard.prompt)
    : floorPlanDraft?.analysis;
  const markedComponents = [
    ...(layout?.components || []),
    ...(floorPlanDraft?.analysis?.components || [])
  ].filter((value, index, items) => value && items.indexOf(value) === index);

  return (
    <aside className="inspector">
      <section className="inspector-card">
        <div className="inspector-title"><Sparkles size={17} /> Brief Visual Support</div>
        <div className="provider-status">
          <span>Active source: {providerStatus?.activeLabel || 'mock'}</span>
          <strong>{providerStatus?.priority?.join(' -> ') || 'openai -> freepik -> pexels -> mock'}</strong>
        </div>
        <label>Brief prompt / rationale<textarea rows="5" value={activeMoodboard?.prompt || form.notes || 'Click Add Client to begin a fresh intake. The brief will be built from project scope, floor plan, rooms, materials, site checks, and references.'} onChange={() => {}} readOnly /></label>
        <div className="prompt-tags">
          <span>Warm</span><span>Contemporary</span><span>Indian</span><button>+ Add</button>
        </div>
        <button className="gold-button" onClick={generateAction} disabled={generating || !canGenerate}>
          {generating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />} Refresh Brief Visuals
        </button>
        <div className="mini-renders">
          {activeImages.slice(0, 3).map((image) => <img key={image} src={image} alt="variation" />)}
        </div>
      </section>

      <section className="inspector-card">
        <div className="inspector-title"><Layers3 size={17} /> Layout constraints used</div>
        <div className="layout-constraint-list">
          <article><strong>{floorPlanDraft?.fileName || floorPlanDraft?.stored?.filePath || 'No floor plan uploaded'}</strong><span>Plan source</span></article>
          <article><strong>{layout?.zoneCount || floorPlanDraft?.annotations?.zones?.length || 0}</strong><span>Room zones</span></article>
          <article><strong>{layout?.markerCount || floorPlanDraft?.annotations?.markers?.length || 0}</strong><span>Component markers</span></article>
          <article><strong>{markedComponents.slice(0, 4).join(', ') || 'Pending'}</strong><span>Marked components</span></article>
        </div>
      </section>

      <section className="inspector-card">
        <div className="inspector-title"><Palette size={17} /> Material / Laminate Shortlist <button>View All</button></div>
        <div className="material-list">
          {laminates.slice(0, 8).map((item) => (
            <article key={item.id} className="material-row">
              <span style={{ background: item.hex }} />
              <div>
                <strong>{item.brand} {item.collection}</strong>
                <small>{item.finish} - {item.bestFor.join(', ')}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="inspector-card">
        <div className="inspector-title"><Archive size={17} /> Reuse library matches</div>
        <div className="library-grid">
          {library.slice(0, 6).map((asset) => (
            <article key={asset.id} className="library-card">
              <img src={assetUrl(asset.url)} alt={asset.title || asset.room} />
              <span>{asset.room} - {asset.style}</span>
            </article>
          ))}
          {library.length === 0 && <p className="muted">Generated and uploaded assets will appear here for similar future clients.</p>}
        </div>
      </section>

      <section className="inspector-card">
        <div className="inspector-title"><Layers3 size={17} /> Brief & Cutlist Actions</div>
        <label className={`upload-button ${!project ? 'disabled-upload' : ''}`}>
          {uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
          Upload client references
          <input type="file" multiple accept="image/*" onChange={onUploadReferences} disabled={!project} />
        </label>
        <button className="secondary-button" onClick={onDownloadProposal} disabled={!project}>
          <FileText size={16} /> Export PDF Brief
        </button>
        <button className="secondary-button" onClick={onCreateCutlistProject} disabled={!project}>
          <Boxes size={16} /> Create Cutlist Project
        </button>
        <button className="secondary-button" disabled={!project}>
          <Share2 size={16} /> Share With Client
        </button>
        <button className="secondary-button" onClick={onRefreshLibrary}>
          <Search size={16} /> Refresh library
        </button>
        <button className="secondary-button" onClick={onExportBackup}>
          <Boxes size={16} /> Export backup
        </button>
      </section>

      <section className="inspector-card compact-card">
        <div className="inspector-title"><CheckCircle2 size={17} /> Built-in checks</div>
        <p>Vastu, kitchen chimney route, work triangle, wardrobe hanging, wet-zone carcass, and family safety checks are captured for the PDF brief and cutlist handoff.</p>
      </section>
    </aside>
  );
}

function summarizePromptLayout(prompt = '') {
  if (!prompt.includes('Floor-plan constraints')) return null;
  return {
    zoneCount: 'Used',
    markerCount: 'Used',
    components: floorPlanComponentTypes.filter((type) => prompt.includes(type))
  };
}
