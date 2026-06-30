import React from 'react';
import { CheckCircle2, Loader2, Trash2, Wand2 } from 'lucide-react';
import { classNames, roomOptions, styleOptions, workflowSteps } from '../data/studioData.js';

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
  error
}) {
  const progress = Math.round(((activeStep + 1) / workflowSteps.length) * 100);
  const current = workflowSteps[activeStep];

  return (
    <aside className="intake-panel">
      <div className="interview-card">
        <div>
          <span>Client Onboarding</span>
          <strong>{progress}% complete</strong>
        </div>
        <div className="progress-line"><i style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="workflow-list">
        {workflowSteps.map((step, index) => (
          <button key={step.id} className={index === activeStep ? 'active' : ''} onClick={() => onStepChange(index)}>
            <span>{index + 1}</span>
            <strong>{step.title}<small>{step.subtitle}</small></strong>
            {index < activeStep && <CheckCircle2 size={13} />}
          </button>
        ))}
      </div>

      <section className="form-section active-step-form">
        <h3>{activeStep + 1}. {current.title}</h3>
        {renderStep(activeStep, form, onUpdate, onToggleArray, floorPlanDraft)}
      </section>

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
      {error && <p className="error-text">{error}</p>}

      <div className="client-profile-card">
        <strong>Brief Readiness</strong>
        <span>{form.clientName || 'Client name pending'}</span>
        <span>{form.city || 'City pending'}</span>
        <span>Scope rooms: {form.selectedSpaces.length || 0}</span>
        <label>Notes<input placeholder="Add internal note..." /></label>
      </div>
    </aside>
  );
}

function renderStep(step, form, update, toggleArray, floorPlanDraft) {
  if (step === 0) {
    return (
      <>
        <label>Client name<input value={form.clientName} onChange={(event) => update('clientName', event.target.value)} /></label>
        <label>Phone / WhatsApp<input value={form.clientPhone} onChange={(event) => update('clientPhone', event.target.value)} /></label>
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
      <label>Curated references<textarea rows="4" value={form.referenceLinks} onChange={(event) => update('referenceLinks', event.target.value)} /></label>
      <label>Core design brief<textarea rows="5" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
    </>
  );
}
