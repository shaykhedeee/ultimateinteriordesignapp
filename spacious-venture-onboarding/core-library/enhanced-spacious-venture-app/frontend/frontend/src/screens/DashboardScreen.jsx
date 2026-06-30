import React from 'react';
import { Plus, RotateCcw, Sparkles } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { FloorPlanScene } from '../components/FloorPlanScene.jsx';
import { InspectorPanel } from '../components/InspectorPanel.jsx';
import { MoodboardCanvas } from '../components/MoodboardCanvas.jsx';
import { OnboardingPanel } from '../components/OnboardingPanel.jsx';
import { roomOptions, showcaseImages, workflowSteps } from '../data/studioData.js';

export function DashboardScreen(props) {
  const {
    form,
    floorPlanDraft,
    activeStep,
    isIntakeOpen,
    setActiveStep,
    setFloorPlanDraft,
    updateForm,
    toggleArray,
    startNewClient,
    clearAll,
    createPackage,
    generating,
    error,
    status,
    activeRoom,
    setActiveRoom,
    activeMoodboard,
    providerStatus,
    laminates,
    library,
    uploading,
    project,
    designPackage,
    regenerateRoom,
    uploadReferences,
    downloadProposal,
    createCutlistProject,
    refreshLibrary,
    exportBackup
  } = props;

  const generatedImages = activeMoodboard?.assets?.map((asset) => assetUrl(asset.url)) || [];
  const activeImages = [...generatedImages, ...(showcaseImages[activeRoom] || showcaseImages.living)].slice(0, 4);
  const progress = Math.round(((activeStep + 1) / workflowSteps.length) * 100);
  const canGenerate = Boolean(form.clientName.trim() && form.selectedSpaces.length);
  const isFloorPlanStep = workflowSteps[activeStep]?.id === 'floor-plan' && !designPackage;
  const goNextStep = () => setActiveStep(Math.min(activeStep + 1, workflowSteps.length - 1));
  const footerAction = designPackage
    ? { label: 'Export PDF Brief', onClick: downloadProposal, disabled: !project }
    : activeStep < workflowSteps.length - 1
      ? { label: 'Next Step ->', onClick: goNextStep, disabled: false }
      : canGenerate
      ? { label: 'Generate PDF Brief', onClick: createPackage, disabled: generating }
      : { label: 'Complete Required Fields', onClick: goNextStep, disabled: true };

  if (!isIntakeOpen && !project && !designPackage) {
    return (
      <>
        <main className="workspace">
          <StartClientCanvas
            providerStatus={providerStatus}
            library={library}
            onStartClient={startNewClient}
            onClearAll={clearAll}
          />
          <InspectorPanel
            activeMoodboard={activeMoodboard}
            activeImages={showcaseImages.living}
            providerStatus={providerStatus}
            form={form}
            floorPlanDraft={floorPlanDraft}
            laminates={laminates}
            library={library}
            generating={generating}
            uploading={uploading}
            project={project}
            canGenerate={false}
            onGenerate={createPackage}
            onRegenerate={regenerateRoom}
            onUploadReferences={uploadReferences}
            onDownloadProposal={downloadProposal}
            onCreateCutlistProject={createCutlistProject}
            onRefreshLibrary={refreshLibrary}
            onExportBackup={exportBackup}
          />
        </main>

        <footer className="bottom-progress">
          <span>{status}</span>
          <i><b style={{ width: '0%' }} /></i>
          <button onClick={startNewClient}>Add Client</button>
        </footer>
      </>
    );
  }

  React.useEffect(() => {
    const resizer = document.getElementById('react-sidebar-resizer-right');
    const workspace = document.querySelector('.design-workspace');
    if (!resizer || !workspace) return;
    
    let isDragging = false;
    
    // Load from localStorage
    const savedRightWidth = localStorage.getItem('sv_react_right_width') || '350';
    workspace.style.gridTemplateColumns = `minmax(0, 1fr) 6px ${savedRightWidth}px`;
    
    function onMouseDown() {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    function onMouseMove(e) {
      if (!isDragging) return;
      const rect = workspace.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      if (newWidth >= 280 && newWidth <= 650) {
        workspace.style.gridTemplateColumns = `minmax(0, 1fr) 6px ${newWidth}px`;
      }
    }
    
    function onMouseUp() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const columns = workspace.style.gridTemplateColumns.split(' ');
        const width = columns[columns.length - 1].replace('px', '');
        localStorage.setItem('sv_react_right_width', width);
      }
    }
    
    resizer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Touch support
    function onTouchStart() {
      isDragging = true;
    }
    function onTouchMove(e) {
      if (!isDragging) return;
      const rect = workspace.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const newWidth = rect.right - clientX;
      if (newWidth >= 280 && newWidth <= 650) {
        workspace.style.gridTemplateColumns = `minmax(0, 1fr) 6px ${newWidth}px`;
      }
    }
    
    resizer.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onMouseUp);
    
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      resizer.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <>
      <main className="workspace design-workspace">
        <OnboardingPanel
          form={form}
          activeStep={activeStep}
          floorPlanDraft={floorPlanDraft}
          onStepChange={setActiveStep}
          onUpdate={updateForm}
          onToggleArray={toggleArray}
          onGenerate={createPackage}
          onClearAll={clearAll}
          generating={generating}
          canGenerate={canGenerate}
          error={error}
        />
        {isFloorPlanStep ? (
          <FloorPlanScene
            form={form}
            floorPlanDraft={floorPlanDraft}
            onFloorPlanChange={setFloorPlanDraft}
            onUpdateForm={updateForm}
          />
        ) : (
          <MoodboardCanvas
            form={form}
            activeRoom={activeRoom}
            setActiveRoom={setActiveRoom}
            activeMoodboard={activeMoodboard}
          />
        )}
        
        {/* Right resizer splitter */}
        <div className="sidebar-resizer-right" id="react-sidebar-resizer-right" style={{ width: '6px', cursor: 'col-resize', zIndex: 10, background: 'rgba(0,0,0,0.03)', borderLeft: '1px solid var(--line)', position: 'relative' }}></div>

        <InspectorPanel
          activeMoodboard={activeMoodboard}
          activeImages={activeImages}
          providerStatus={providerStatus}
          form={form}
          floorPlanDraft={floorPlanDraft}
          laminates={laminates}
          library={library}
          generating={generating}
          uploading={uploading}
          project={project}
          canGenerate={canGenerate}
          onGenerate={createPackage}
          onRegenerate={regenerateRoom}
          onUploadReferences={uploadReferences}
          onDownloadProposal={downloadProposal}
          onCreateCutlistProject={createCutlistProject}
          onRefreshLibrary={refreshLibrary}
          onExportBackup={exportBackup}
        />
      </main>

      <footer className="bottom-progress">
        <span>{designPackage ? 'Review PDF brief and create cutlist project' : status || `Onboarding progress ${progress}%`}</span>
        <i><b style={{ width: `${progress}%` }} /></i>
        <button onClick={footerAction.onClick} disabled={footerAction.disabled}>{footerAction.label}</button>
      </footer>
    </>
  );
}

export function activeRoomTitle(activeRoom) {
  if (activeRoom === 'whole-home') return 'Whole Home';
  return roomOptions.find((room) => room.id === activeRoom)?.label || 'Room';
}

function StartClientCanvas({ providerStatus, library, onStartClient, onClearAll }) {
  const libraryPreview = library.slice(0, 3);

  return (
    <section className="canvas-zone start-client-screen">
      <div className="start-hero">
        <div>
          <span>Spacious Venture Studio OS</span>
          <h1>Start every project from Add Client</h1>
          <p>Begin with a structured client onboarding, capture the home, scope, floor plan, materials, and production notes, then generate a client-ready PDF brief and cutlist project foundation.</p>
        </div>
        <div className="start-actions">
          <button className="gold-button" onClick={onStartClient}><Plus size={17} /> Add Client</button>
          <button className="secondary-light-button" onClick={onClearAll}><RotateCcw size={16} /> Clear All</button>
        </div>
      </div>

      <div className="start-flow">
        <article><Sparkles size={18} /><strong>1. Onboarding</strong><span>Client profile, scope, floor plan, rooms, materials, site checks, and production notes.</span></article>
        <article><Sparkles size={18} /><strong>2. PDF Brief</strong><span>Client-ready document with floor plan preview, room scope, materials, checks, and sign-off.</span></article>
        <article><Sparkles size={18} /><strong>3. Cutlist</strong><span>Approved scope becomes module planning, material defaults, parts, and workshop exports.</span></article>
      </div>

      <section className="start-preview">
        <div>
          <span>Provider</span>
          <strong>{providerStatus?.activeLabel || 'curated'} references</strong>
          <p>{providerStatus?.priority?.join(' -> ') || 'openai -> freepik -> pexels -> curated -> mock'} available as optional visual support.</p>
        </div>
        <div>
          <span>Reusable library</span>
          <strong>{library.length} indexed assets</strong>
          <p>Accepted references, uploads, and generated assets stay searchable for future briefs.</p>
        </div>
      </section>

      {libraryPreview.length > 0 && (
        <div className="start-library-strip">
          {libraryPreview.map((asset) => (
            <article key={asset.id}>
              <img src={assetUrl(asset.url)} alt={asset.title || asset.room} />
              <span>{asset.room} - {asset.style}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
