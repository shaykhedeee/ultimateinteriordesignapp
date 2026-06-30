import React from 'react';
import { CheckCircle2, Loader2, Trash2, Wand2 } from 'lucide-react';
import { classNames, roomOptions, styleOptions, workflowSteps } from '../data/studioData.js';

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function OnboardingPanel({
  form,
  activeStep,
  floorPlanDraft,
  onStepChange,
  onUpdate,
  onToggleArray,
  onGenerate,
  onClearAll,
  generating,
  canGenerate,
  error,
  variant = 'sidebar',
  showWorkflow = true,
  floorPlanAnalysis,
  showFloorPlanUnderstanding = true,
  showPanelActions = variant !== 'center'
}) {
  const progress = Math.round(((activeStep + 1) / workflowSteps.length) * 100);
  const current = workflowSteps[activeStep];
  const Shell = variant === 'center' ? 'section' : 'aside';

  return (
    <Shell className={classNames('intake-panel', variant === 'center' && 'intake-panel-center')}>
      {variant !== 'center' && (
        <div className="interview-card">
          <div>
            <span>Client Onboarding</span>
            <strong>{progress}% complete</strong>
          </div>
          <div className="progress-line"><i style={{ width: `${clampPercent(progress)}%` }} /></div>
        </div>
      )}

      {showWorkflow && <div className="workflow-list">
        {workflowSteps.map((step, index) => (
          <button key={step.id} className={index === activeStep ? 'active' : ''} onClick={() => onStepChange(index)}>
            <span>{index + 1}</span>
            <strong>{step.title}<small>{step.subtitle}</small></strong>
            {index < activeStep && <CheckCircle2 size={13} />}
          </button>
        ))}
      </div>}

      <section className="form-section active-step-form">
        <span className="center-step-eyebrow">Step {activeStep + 1} of {workflowSteps.length}</span>
        <h3>{current.title}</h3>
        <p className="step-hint">{current.subtitle}</p>
        {renderStep(activeStep, form, onUpdate, onToggleArray, floorPlanDraft)}
        {activeStep === 3 && floorPlanAnalysis && showFloorPlanUnderstanding && (
          <FloorPlanUnderstandingCard analysis={floorPlanAnalysis} />
        )}
      </section>

      {showPanelActions && (
        <>
          <div className="step-actions">
            <button className="secondary-button" disabled={activeStep === 0} onClick={() => onStepChange(activeStep - 1)}>Back</button>
            <button className="secondary-button" disabled={activeStep === workflowSteps.length - 1} onClick={() => onStepChange(activeStep + 1)}>Next</button>
          </div>

          <button className="primary-button" onClick={onGenerate} disabled={generating || !canGenerate}>
            {generating ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
            Generate PDF Brief
          </button>
          <button className="secondary-button clear-intake-button" onClick={onClearAll}>
            <Trash2 size={15} /> Clear All
          </button>
        </>
      )}
      {error && <p className="error-text">{error}</p>}

      {variant !== 'center' && <div className="client-profile-card">
        <strong>Brief Readiness</strong>
        <span>{form.clientName || 'Client name pending'}</span>
        <span>{form.city || 'City pending'}</span>
        <span>Scope rooms: {form.selectedSpaces.length || 0}</span>
        <label>Notes<input placeholder="Add internal note..." /></label>
      </div>}
    </Shell>
  );
}

function renderStep(step, form, update, toggleArray, floorPlanDraft) {
  if (step === 0) {
    return (
      <>
        <label>Client name<input value={form.clientName} onChange={(event) => update('clientName', event.target.value)} /></label>
        <label>Phone / WhatsApp<input value={form.clientPhone} onChange={(event) => update('clientPhone', event.target.value)} /></label>
        <label>Decision urgency<select value={form.timeline} onChange={(event) => update('timeline', event.target.value)}>
          <option value="48-hour first design presentation">48-hour first design presentation</option>
          <option value="urgent walk-in closure">Urgent walk-in closure</option>
          <option value="one-week concept package">One-week concept package</option>
          <option value="post-site-measurement">After site measurement</option>
        </select></label>
        <div className="chip-grid compact">
          {['Kids', 'Elderly', 'Pets', 'Hosting guests', 'WFH', 'Rental durability'].map((item) => (
            <button key={item} className={classNames('choice-chip', form.familyProfile.includes(item) && 'active')} onClick={() => toggleArray('familyProfile', item)}>{item}</button>
          ))}
        </div>
      </>
    );
  }
  if (step === 1) {
    return (
      <div className="two-col">
        <label>Budget<select value={form.budgetTier} onChange={(event) => update('budgetTier', event.target.value)}>
          <option value="value">Value</option>
          <option value="comfort">Comfort</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select></label>
        <label>Timeline<select value={form.timeline} onChange={(event) => update('timeline', event.target.value)}>
          <option value="48-hour first design presentation">48-hour design presentation</option>
          <option value="one-week concept package">One-week concept package</option>
          <option value="urgent walk-in closure">Urgent walk-in closure</option>
        </select></label>
        <label>Desired luxury level<select value={form.luxuryLevel || 'premium-selective'} onChange={(event) => update('luxuryLevel', event.target.value)}>
          <option value="essential-clean">Essential but clean</option>
          <option value="premium-selective">Premium selective</option>
          <option value="luxury-showcase">Luxury showcase</option>
          <option value="ultra-luxury">Ultra luxury</option>
        </select></label>
      </div>
    );
  }
  if (step === 2) {
    return (
      <>
        <div className="two-col">
          <label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
          <label>Home<select value={form.homeType} onChange={(event) => update('homeType', event.target.value)}>
            <option value="1bhk">1 BHK</option>
            <option value="2bhk">2 BHK</option>
            <option value="3bhk">3 BHK</option>
            <option value="villa">Villa / Duplex</option>
            <option value="office">Office</option>
          </select></label>
        </div>
        <div className="chip-grid">
          {roomOptions.map((room) => (
            <button key={room.id} className={classNames('choice-chip', form.selectedSpaces.includes(room.id) && 'active')} onClick={() => toggleArray('selectedSpaces', room.id)}>
              {room.label}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (step === 3) {
    const zoneCount = floorPlanDraft?.annotations?.zones?.length || 0;
    const markerCount = floorPlanDraft?.annotations?.markers?.length || 0;
    return (
      <>
        <div className="floor-plan-step-summary">
          <strong>{floorPlanDraft?.fileName || 'No floor plan uploaded'}</strong>
          <span>{zoneCount} room zones - {markerCount} component markers</span>
        </div>
        <label>Layout notes<textarea rows="4" value={form.floorPlanNotes} onChange={(event) => update('floorPlanNotes', event.target.value)} placeholder="Example: TV unit on north wall, sofa faces balcony, mandir near living entry." /></label>
        <div className="floor-plan-step-summary">
          <strong>{floorPlanDraft?.analysis?.calibration?.knownLengthMm ? `${floorPlanDraft.analysis.calibration.knownLengthMm}mm calibration set` : 'No scale calibration set'}</strong>
          <span>Measurements remain descriptive until one known wall length is entered in the floor-plan editor.</span>
        </div>
        <p className="step-hint">Use the central floor-plan scene to upload the plan, draw room zones, and mark furniture/component locations.</p>
      </>
    );
  }
  if (step === 4) {
    return (
      <>
        <label>Primary style<select value={form.primaryStyle} onChange={(event) => update('primaryStyle', event.target.value)}>
          {styleOptions.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
        </select></label>
        <div className="chip-grid compact">
          {['glossy', 'matte', 'anti-fingerprint', 'easy-clean', 'child-safe', 'pet-safe', 'woodgrain', 'fluted'].map((item) => (
            <button key={item} className={classNames('choice-chip', form.finishTolerance.includes(item) && 'active')} onClick={() => toggleArray('finishTolerance', item)}>{item}</button>
          ))}
        </div>
        <label>Dislikes<textarea rows="3" value={form.dislikedMaterials} onChange={(event) => update('dislikedMaterials', event.target.value)} /></label>
      </>
    );
  }
  if (step === 5) {
    return (
      <>
        <label>Pooja need<select value={form.poojaNeed} onChange={(event) => update('poojaNeed', event.target.value)}>
          <option value="dedicated-pooja">Dedicated pooja room</option>
          <option value="living-niche">Living room mandir niche</option>
          <option value="wall-hung">Wall-hung compact mandir</option>
          <option value="none">No pooja space</option>
        </select></label>
        <label>Vastu note<textarea rows="4" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
      </>
    );
  }
  if (step === 6) {
    return (
      <>
        <label>Cooking<select value={form.cookingStyle} onChange={(event) => update('cookingStyle', event.target.value)}>
          <option value="heavy-indian">Heavy Indian tadka/frying</option>
          <option value="balanced">Balanced Indian + baking</option>
          <option value="light">Light cooking</option>
        </select></label>
        <label>Storage habits<textarea rows="4" value={form.storageHabits} onChange={(event) => update('storageHabits', event.target.value)} /></label>
      </>
    );
  }
  return (
    <>
      <div className="guided-brief-block">
        <strong>Reference direction</strong>
        <p className="step-hint">Add only client-approved links, uploaded references, or studio-curated image names. Do not paste random Pinterest images without source context.</p>
        <div className="chip-grid compact">
          {referencePrompts.map((item) => (
            <button key={item} type="button" className="choice-chip" onClick={() => update('referenceLinks', appendLine(form.referenceLinks, item))}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <label>Curated references<textarea rows="4" value={form.referenceLinks} onChange={(event) => update('referenceLinks', event.target.value)} placeholder="Example: Client liked warm beige TV wall reference, dislikes glossy red, wants mandir similar to studio curated pooja niche." /></label>
      <div className="guided-brief-block">
        <strong>Core brief builder</strong>
        <p className="step-hint">Use these lines to create a sales-ready first-meeting brief before generating the PDF.</p>
        <div className="brief-example-grid">
          {briefPromptExamples.map((item) => (
            <button key={item.title} type="button" onClick={() => update('notes', appendLine(form.notes, item.text))}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
      <label>Core design brief<textarea rows="7" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder={coreBriefPlaceholder} /></label>
    </>
  );
}

const referencePrompts = [
  'Use one studio-curated reference per room',
  'Include one fresh AI render per selected room',
  'Client prefers warm Indian contemporary, no people in renders',
  'Show material confidence: laminate, marble-look, fabric, brass'
];

const briefPromptExamples = [
  {
    title: 'Client priority',
    text: 'Client priority: quick visual clarity for living, kitchen, master bedroom, and mandir before final quotation.'
  },
  {
    title: 'Design promise',
    text: 'Design promise: warm contemporary Indian home with practical storage, low-maintenance finishes, and selective luxury focal walls.'
  },
  {
    title: 'Render instruction',
    text: 'Render instruction: produce Lumion-like 3D renders with no humans, no pets, no logos, and component placement matching the annotated floor plan.'
  },
  {
    title: 'Approval note',
    text: 'Approval note: final working drawings, dimensions, and cutlists require site measurement and designer verification after brief approval.'
  }
];

const coreBriefPlaceholder = `Example:
Living: floating walnut TV unit with fluted back panel, sofa opposite TV, mandir near entry.
Kitchen: easy-clean matte shutters, tall pantry, chimney over hob, practical Indian cooking workflow.
Master: warm wardrobe wall, soft headboard, concealed storage, calm palette.
Client dislikes: glossy red, excessive gold, cluttered decor.
Decision note: client wants one reference image and one fresh AI render per room.`;

function appendLine(current = '', addition = '') {
  if (!addition) return current;
  if (current.includes(addition)) return current;
  return current ? `${current}\n${addition}` : addition;
}

function FloorPlanUnderstandingCard({ analysis }) {
  return (
    <article className="floor-plan-understanding-card">
      <strong>AI understood the floor plan</strong>
      <p>{analysis.whatAiUnderstood}</p>
      <div>
        <span>{analysis.confidence}% confidence</span>
        <span>{analysis.roomsDetected?.length || 0} rooms</span>
        <span>{analysis.componentMarkers?.length || 0} markers</span>
      </div>
      {analysis.missingRooms?.length > 0 && (
        <small>Missing from annotations: {analysis.missingRooms.join(', ')}</small>
      )}
      {analysis.advisoryVision?.summary && <small>{analysis.advisoryVision.summary}</small>}
      {analysis.nextDesignerActions?.length > 0 && (
        <ul>
          {analysis.nextDesignerActions.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </article>
  );
}
