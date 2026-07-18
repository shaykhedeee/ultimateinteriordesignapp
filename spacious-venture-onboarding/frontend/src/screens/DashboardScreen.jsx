import React from 'react';
import { Plus, RotateCcw, Sparkles } from 'lucide-react';
import { assetUrl } from '../api/client.js';
import { FloorPlanScene } from '../components/FloorPlanScene.jsx';
import { MoodboardCanvas } from '../components/MoodboardCanvas.jsx';
import { OnboardingPanel } from '../components/OnboardingPanel.jsx';
import { Button } from '../components/ui/index.js';
import { roomOptions, workflowSteps } from '../data/studioData.js';

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function DashboardScreen(props) {
  const {
    form,
    floorPlanDraft,
    floorPlanAnalysis,
    workflowReadiness,
    activeStep,
    isIntakeOpen,
    setActiveStep,
    setFloorPlanDraft,
    updateForm,
    toggleArray,
    startNewClient,
    clearAll,
    createPackage,
    analyzeFloorPlan,
    approveBrief,
    generateTechnicalDrawingsForProject,
    generating,
    error,
    status,
    activeRoom,
    setActiveRoom,
    setActiveNav,
    activeMoodboard,
    providerStatus,
    library,
    project,
    designPackage,
    onResetDemoWorkspace,
    maintenanceBusy
  } = props;

  const progress = Math.round(((activeStep + 1) / workflowSteps.length) * 100);
  const canGenerate = Boolean(form.clientName.trim() && form.selectedSpaces.length);
  const isFloorPlanStep = workflowSteps[activeStep]?.id === 'floor-plan';
  const goNextStep = () => setActiveStep(Math.min(activeStep + 1, workflowSteps.length - 1));
  const goPrevStep = () => setActiveStep(Math.max(activeStep - 1, 0));

  if (!isIntakeOpen && !project && !designPackage) {
    return (
      <>
        <main className="workspace">
          <StartClientCanvas
            providerStatus={providerStatus}
            library={library}
            onStartClient={startNewClient}
            onClearAll={clearAll}
            onResetDemoWorkspace={onResetDemoWorkspace}
            maintenanceBusy={maintenanceBusy}
          />
            </main>

        <footer className="bottom-progress">
          <span>{status}</span>
          <i><b style={{ width: '0%' }} /></i>
          <Button variant="gold" size="sm" onClick={startNewClient}>Add Client</Button>
        </footer>
      </>
    );
  }

  return (
    <>
      <main className="workspace design-workspace intake-workspace">
        <WorkflowRail activeStep={activeStep} setActiveStep={setActiveStep} progress={progress} workflowReadiness={workflowReadiness} />

        <section className={isFloorPlanStep ? 'onboarding-center floor-plan-center' : 'onboarding-center'}>
          {designPackage && activeStep === 7 ? (
            <MoodboardCanvas
              form={form}
              activeRoom={activeRoom}
              setActiveRoom={setActiveRoom}
              activeMoodboard={activeMoodboard}
              floorPlanDraft={floorPlanDraft}
              project={project}
            />
          ) : (
            <div className={isFloorPlanStep ? 'floor-plan-step-layout' : 'intake-step-layout'}>
              <div className="intake-floor-plan-column">
                <OnboardingPanel
                  form={form}
                  activeStep={activeStep}
                  floorPlanDraft={floorPlanDraft}
                  floorPlanAnalysis={floorPlanAnalysis}
                  onStepChange={setActiveStep}
                  onUpdate={updateForm}
                  onToggleArray={toggleArray}
                  onGenerate={createPackage}
                  onClearAll={clearAll}
                  generating={generating}
                  canGenerate={canGenerate}
                  error={error}
                  variant="center"
                  showWorkflow={false}
                  showFloorPlanUnderstanding={!isFloorPlanStep}
                  showPanelActions={false}
                />
              </div>
              {isFloorPlanStep && (
                <FloorPlanScene
                  form={form}
                  floorPlanDraft={floorPlanDraft}
                  onFloorPlanChange={setFloorPlanDraft}
                  onUpdateForm={updateForm}
                />
              )}
              <IntakeContextPanel
                isFloorPlanStep={isFloorPlanStep}
                analysis={floorPlanAnalysis}
                onAnalyze={analyzeFloorPlan}
                workflowReadiness={workflowReadiness}
                providerStatus={providerStatus}
                form={form}
                canGenerate={canGenerate}
              />
            </div>
          )}
        </section>
      </main>

      <footer className="bottom-progress sticky-action-bar">
        <span>{designPackage ? 'Review PDF brief and create cutlist project' : status || `Onboarding progress ${progress}%`}</span>
        <i><b style={{ width: `${clampPercent(progress)}%` }} /></i>
        <Button variant="ghost" size="sm" onClick={goPrevStep} disabled={activeStep === 0}>Back</Button>
        {isFloorPlanStep && <Button variant="gold" size="sm" onClick={analyzeFloorPlan} disabled={generating}>Analyze Floor Plan</Button>}
        <Button variant="ghost" size="sm" onClick={goNextStep} disabled={activeStep === workflowSteps.length - 1}>Next</Button>
        <Button variant="secondary" size="sm" onClick={() => setActiveNav('renders')} disabled={!project}>Renders</Button>
        <Button variant="gold" size="sm" onClick={createPackage} disabled={generating || !canGenerate}>Generate PDF Brief</Button>
        {designPackage && <Button variant="gold" size="sm" onClick={approveBrief} disabled={!project}>Approve Brief</Button>}
        {project && <Button variant="secondary" size="sm" onClick={generateTechnicalDrawingsForProject}>Drawings</Button>}
      </footer>
    </>
  );
}

export function activeRoomTitle(activeRoom) {
  if (activeRoom === 'whole-home') return 'Whole Home';
  return roomOptions.find((room) => room.id === activeRoom)?.label || 'Room';
}

function StartClientCanvas({ providerStatus, library, onStartClient, onClearAll, onResetDemoWorkspace, maintenanceBusy }) {
  const libraryPreview = library.slice(0, 3);

  return (
    <section className="canvas-zone start-client-screen">
      <div className="start-hero">
        <div>
          <span>Spacious Venture Studio OS</span>
          <h1>Start every project from Add Client</h1>
          <p>Begin with a structured client onboarding, capture the home, layout details, floor plan, materials, and production notes, then generate a client-ready PDF brief and cutlist project foundation.</p>
        </div>
        <div className="start-actions">
          <Button variant="gold" onClick={onStartClient}><Plus size={17} /> Add Client</Button>
          <Button variant="secondary" onClick={onResetDemoWorkspace} disabled={maintenanceBusy}>
            <Sparkles size={16} /> {maintenanceBusy ? 'Building Demo...' : 'Load Iyer Family Demo'}
          </Button>
          <Button variant="secondary" onClick={onClearAll}><RotateCcw size={16} /> Clear All</Button>
        </div>
      </div>

      <div className="start-flow">
        <article><Sparkles size={18} /><strong>1. Onboarding</strong><span>Client profile, layout details, floor plan, rooms, materials, site checks, and production notes.</span></article>
        <article><Sparkles size={18} /><strong>2. PDF Brief</strong><span>Client-ready document with floor plan preview, room details, materials, checks, and sign-off.</span></article>
        <article><Sparkles size={18} /><strong>3. Cutlist</strong><span>Approved brief becomes module planning, material defaults, parts, and workshop exports.</span></article>
      </div>

      <section className="start-preview">
        <div>
          <span>AI Engine</span>
          <strong>Gemini API</strong>
          <p>Floor plan analysis, spatial understanding, and 3D render generation powered by Google Gemini with your reference library.</p>
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

function WorkflowRail({ activeStep, setActiveStep, progress, workflowReadiness }) {
  return (
    <aside className="workflow-rail">
      <div className="interview-card">
        <div>
          <span>Client Onboarding</span>
          <strong>{progress}% complete</strong>
        </div>
        <div className="progress-line"><i style={{ width: `${clampPercent(progress)}%` }} /></div>
      </div>
      <div className="workflow-list">
        {workflowSteps.map((step, index) => (
          <button key={step.id} className={index === activeStep ? 'active' : ''} onClick={() => setActiveStep(index)}>
            <span>{index + 1}</span>
            <strong>{step.title}<small>{step.subtitle}</small></strong>
          </button>
        ))}
      </div>
      {workflowReadiness && (
        <div className="workflow-readiness-mini">
          <strong>{workflowReadiness.readinessScore}% workflow ready</strong>
          <span>Next: {workflowReadiness.nextAction}</span>
        </div>
      )}
    </aside>
  );
}

function FloorPlanAnalysisPanel({ analysis, onAnalyze }) {
  const readiness = analysis?.renderReadiness;
  const requiredMarkers = analysis?.requiredMarkers || [];
  const missingComponents = analysis?.missingComponents || [];
  return (
    <section className="floor-plan-analysis-panel">
      <div>
        <span>Floor plan understanding</span>
        <strong>{analysis ? `${analysis.confidence}% confidence` : 'Run analysis after marking zones'}</strong>
        <p>{analysis?.whatAiUnderstood || 'The app will summarize rooms, marked components, missing items, circulation notes, Vastu notes, and advisory measurements from annotations.'}</p>
        {analysis && (
          <div className="floor-plan-analysis-metrics">
            <article><strong>{analysis.roomsDetected?.length || 0}</strong><span>Rooms</span></article>
            <article><strong>{analysis.componentMarkers?.length || 0}</strong><span>Markers</span></article>
            <article><strong>{analysis.missingRooms?.length || 0}</strong><span>Missing</span></article>
            <article><strong>{analysis.circulationConcerns?.length || 0}</strong><span>Notes</span></article>
          </div>
        )}
      </div>
      <Button variant="gold" onClick={onAnalyze}>Analyze Floor Plan</Button>
      {readiness && (
        <div className="floor-plan-readiness-strip">
          <article><strong>{readiness.status}</strong><span>Render readiness</span></article>
          <article><strong>{readiness.canGeneratePrecisionRender ? 'Yes' : 'Review'}</strong><span>Precision render</span></article>
          <article><strong>{analysis.humanReviewRequired ? 'Needed' : 'Clear'}</strong><span>Human review</span></article>
        </div>
      )}
      {requiredMarkers.length > 0 && (
        <div className="floor-plan-marker-audit">
          <strong>Required markers</strong>
          <div>
            {requiredMarkers.slice(0, 10).map((item) => (
              <span key={`${item.room}-${item.type}`} className={item.present ? 'present' : 'missing'}>
                {item.type} - {item.roomLabel || item.room}
              </span>
            ))}
          </div>
        </div>
      )}
      {missingComponents.length > 0 && (
        <p className="floor-plan-warning">Add missing components before final renders: {missingComponents.map((item) => `${item.type} in ${item.roomLabel || item.room}`).join(', ')}.</p>
      )}
      {analysis?.sourceLabels?.length > 0 && (
        <div className="floor-plan-source-list">
          {analysis.sourceLabels.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}
      {analysis?.nextDesignerActions?.length > 0 && (
        <ul>
          {analysis.nextDesignerActions.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </section>
  );
}

function IntakeContextPanel({ isFloorPlanStep, analysis, onAnalyze, workflowReadiness, providerStatus, form, canGenerate }) {
  const selectedCount = form.selectedSpaces?.length || 0;
  return (
    <aside className="surface-panel intake-context-panel">
      {isFloorPlanStep ? (
        <FloorPlanAnalysisPanel analysis={analysis} onAnalyze={onAnalyze} />
      ) : (
        <>
          <div>
            <span>Intake readiness</span>
            <strong>{workflowReadiness ? `${workflowReadiness.readinessScore}% workflow ready` : canGenerate ? 'Ready for brief generation' : 'Capture required basics'}</strong>
            <p>{workflowReadiness?.nextAction || 'Complete client name, selected spaces, budget, style, and floor-plan notes before generating the PDF brief.'}</p>
          </div>
          <div className="floor-plan-analysis-metrics">
            <article><strong>{selectedCount}</strong><span>Spaces</span></article>
            <article><strong>{form.budgetTier || 'premium'}</strong><span>Budget</span></article>
            <article><strong>{form.primaryStyle ? 'Set' : 'Missing'}</strong><span>Style</span></article>
            <article><strong>{providerStatus?.liveImageGenReady ? 'Live' : 'Fallback'}</strong><span>AI renders</span></article>
          </div>
          <div className="floor-plan-source-list">
            <span>{providerStatus?.spendMode || 'smart-cost'}</span>
            <span>{providerStatus?.activeLabel || 'library-reuse'}</span>
            <span>{providerStatus?.reuseThreshold || 86}% reuse threshold</span>
          </div>
        </>
      )}
    </aside>
  );
}
