import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus, RefreshCw, Trash2, Undo2, Check, X, PencilLine } from 'lucide-react';
import { studioNav, showcaseImages } from '../data/studioData.js';
import { assetUrl } from '../api/client.js';
import { InspectorPanel } from './InspectorPanel.jsx';
import { ToastContainer, Logo, Button } from './ui/index.js';

export function StudioShell({
  activeNav,
  onNavChange,
  activeStep,
  setActiveStep,
  children,
  form,
  project,
  designPackage,
  providerStatus,
  studioSettings,
  onDesignerInfoChange,
  onStartClient,
  onClearAll,
  /* inspector props */
  laminates = [],
  library = [],
  generating,
  uploading,
  onGenerate,
  onRegenerate,
  onUploadReferences,
  onDownloadProposal,
  onCreateCutlistProject,
  onRefreshLibrary,
  onExportBackup,
  activeMoodboard,
  activeRoom,
  setActiveRoom,
  floorPlanDraft,
  floorPlanAnalysis,
  canGenerate,
  cutlist,
  adminSummary,
  projectList,
  /* toast */
  toasts,
  onDismissToast
}) {
  const hasClient = Boolean(form.clientName.trim() || project || designPackage);
  const clientLine = hasClient
    ? `${form.clientName || 'Walk-in Client'}${form.city ? ` Residence, ${form.city}` : ' Residence'}`
    : 'No Client Selected';
  const projectCode = project ? `SV-${project.id.slice(0, 6).toUpperCase()}` : 'SV-DRAFT';
  const leadDesigner = studioSettings?.leadDesigner || 'Muskan P';
  const leadRole = studioSettings?.leadRole || 'Lead Designer';
  const avatarText = initials(leadDesigner);

  const [isEditingDesigner, setIsEditingDesigner] = useState(false);
  const [editingName, setEditingName] = useState(leadDesigner);
  const [editingRole, setEditingRole] = useState(leadRole);
  const nameInputRef = useRef(null);
  const roleInputRef = useRef(null);
  const editContainerRef = useRef(null);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const activeImages = getActiveImages(activeMoodboard, activeRoom);

  useEffect(() => {
    if (isEditingDesigner) {
      setEditingName(leadDesigner);
      setEditingRole(leadRole);
    }
  }, [isEditingDesigner, leadDesigner, leadRole]);

  useEffect(() => {
    if (isEditingDesigner) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isEditingDesigner]);

  function handleDesignerClick() {
    setIsEditingDesigner(true);
  }

  function handleSaveDesigner() {
    setIsEditingDesigner(false);
    if (onDesignerInfoChange) {
      const trimmedName = editingName.trim();
      const trimmedRole = editingRole.trim();
      if (trimmedName && trimmedName !== leadDesigner) {
        onDesignerInfoChange('leadDesigner', trimmedName);
      }
      if (trimmedRole && trimmedRole !== leadRole) {
        onDesignerInfoChange('leadRole', trimmedRole);
      }
    }
  }

  function handleCancelDesigner() {
    setIsEditingDesigner(false);
    setEditingName(leadDesigner);
    setEditingRole(leadRole);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveDesigner();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelDesigner();
    }
  }

  // Left resizer
  React.useEffect(() => {
    const resizer = document.getElementById('react-sidebar-resizer-left');
    const shell = document.querySelector('.app-shell');
    if (!resizer || !shell) return;

    let isDragging = false;
    const savedLeftWidth = Number(localStorage.getItem('sv_react_left_width') || '220');
    const initialLeftWidth = Math.max(180, Math.min(240, Number.isFinite(savedLeftWidth) ? savedLeftWidth : 220));
    shell.style.setProperty('--sidebar-total', `${initialLeftWidth}px`);

    function onMouseDown() {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
      if (!isDragging) return;
      const newWidth = Math.max(180, Math.min(240, e.clientX));
      shell.style.setProperty('--sidebar-total', `${newWidth}px`);
      const panel = document.querySelector('.intake-panel');
      if (panel) panel.style.width = `${newWidth - 64}px`;
    }

    function onMouseUp() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const width = shell.style.getPropertyValue('--sidebar-total').replace('px', '');
        localStorage.setItem('sv_react_left_width', width);
      }
    }

    resizer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onTouchStart() { isDragging = true; }
    function onTouchMove(e) {
      if (!isDragging) return;
      const clientX = e.touches[0].clientX;
      const newWidth = Math.max(180, Math.min(240, clientX));
      shell.style.setProperty('--sidebar-total', `${newWidth}px`);
      const panel = document.querySelector('.intake-panel');
      if (panel) panel.style.width = `${newWidth - 64}px`;
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
  }, [form.clientName, project, designPackage]);

  // Right resizer
  React.useEffect(() => {
    const resizer = document.getElementById('react-sidebar-resizer-right');
    const shell = document.querySelector('.app-shell');
    if (!resizer || !shell) return;

    let isDragging = false;
    const savedRightWidth = localStorage.getItem('sv_react_right_width') || '320';
    shell.style.setProperty('--inspector-width', `${savedRightWidth}px`);

    function onMouseDown() {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
      if (!isDragging) return;
      const rect = shell.getBoundingClientRect();
      const newWidth = Math.max(260, Math.min(550, rect.right - e.clientX));
      shell.style.setProperty('--inspector-width', `${newWidth}px`);
    }

    function onMouseUp() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const width = shell.style.getPropertyValue('--inspector-width').replace('px', '');
        localStorage.setItem('sv_react_right_width', width);
      }
    }

    resizer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onTouchStart() { isDragging = true; }
    function onTouchMove(e) {
      if (!isDragging) return;
      const rect = shell.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const newWidth = Math.max(260, Math.min(550, rect.right - clientX));
      shell.style.setProperty('--inspector-width', `${newWidth}px`);
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
  }, [inspectorVisible]);

  return (
    <div className={`app-shell ${activeNav === 'dashboard' ? 'has-onboarding' : ''}${inspectorVisible ? ' has-inspector' : ''}`}>
      <aside className="studio-sidebar">
        <div className="studio-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 14px' }}>
          <Logo variant={activeNav === 'dashboard' ? 'full' : 'icon'} height={36} />
        </div>
        <nav className="studio-nav" aria-label="Studio navigation">
          {studioNav.filter((item) => !item.dock).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activeNav === item.id ? 'active' : ''} onClick={() => onNavChange(item.id)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="help-link" onClick={() => onNavChange('help')}>Help</button>
      </aside>

      {/* Left resizer */}
      <div className="sidebar-resizer-left" id="react-sidebar-resizer-left"></div>

      <section className="main-shell">
        <header className="project-topbar">
          <div className="project-meta">
            <span className="project-meta-label">Spacious Venture Studio</span>
            <div className="project-meta-main">
              <strong className="project-code-pill">{projectCode}</strong>
              <strong className="client-title">{clientLine}</strong>
            </div>
          </div>
          <div className="topbar-tools">
            <div className="topbar-primary-actions">
              <Button aria-label="Add client" variant="gold" size="md" className="topbar-action topbar-primary-btn" onClick={onStartClient}>
                <Plus size={16} /> Add Client
              </Button>
              <Button aria-label="Clear all" variant="secondary" size="md" className="topbar-action muted-action" onClick={onClearAll}>
                <Trash2 size={16} /> Clear All
              </Button>
            </div>

            <div className="topbar-icon-actions" aria-label="Workspace utilities">
              <button aria-label="Undo" className="topbar-icon-btn"><Undo2 size={17} /></button>
              <button aria-label="Refresh" className="topbar-icon-btn" onClick={() => window.location.reload()}><RefreshCw size={17} /></button>
              <button aria-label="Notifications" className="topbar-icon-btn"><Bell size={17} /></button>
            </div>

            {isEditingDesigner ? (
              <div
                className="designer-edit-inline"
                ref={editContainerRef}
                onBlur={(e) => {
                  if (editContainerRef.current && !editContainerRef.current.contains(e.relatedTarget)) {
                    handleSaveDesigner();
                  }
                }}
              >
                <div className="avatar designer-avatar">{avatarText}</div>
                <div className="designer-edit-fields">
                  <input ref={nameInputRef} value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={handleKeyDown} placeholder="Designer name" aria-label="Designer name" />
                  <input ref={roleInputRef} value={editingRole} onChange={(e) => setEditingRole(e.target.value)} onKeyDown={handleKeyDown} placeholder="Role" aria-label="Role" />
                </div>
                <button type="button" className="designer-edit-btn save-btn" onClick={handleSaveDesigner} title="Save"><Check size={14} /></button>
                <button type="button" className="designer-edit-btn cancel-btn" onClick={handleCancelDesigner} title="Cancel"><X size={14} /></button>
              </div>
            ) : (
              <button
                type="button"
                className="designer-profile-card"
                onClick={handleDesignerClick}
                onKeyDown={(e) => e.key === 'Enter' && handleDesignerClick()}
                title="Click to edit designer profile"
              >
                <div className="avatar designer-avatar">{avatarText}</div>
                <span className="designer-info">
                  <strong>{leadDesigner}</strong>
                  <small>{leadRole}</small>
                </span>
                <PencilLine size={15} />
              </button>
            )}
          </div>
        </header>
        {/* Horizontal Progress Wizard Tracker */}
        {hasClient && (
          <div className="workspace-wizard-bar">
            <div className="wizard-track-line" />
            <div className="wizard-steps-container">
              {[
                { id: 'intake', label: '1. Intake', nav: 'dashboard', step: 0 },
                { id: 'floorplan', label: '2. Floor Plan', nav: 'dashboard', step: 3 },
                { id: 'renders', label: '3. AI Renders', nav: 'renders' },
                { id: 'brief', label: '4. PDF Brief', nav: 'briefs' },
                { id: 'cutlist', label: '5. Cutlist', nav: 'cutlists' },
                { id: 'deliverables', label: '6. Deliverables', nav: 'packages' }
              ].map((s) => {
                // Determine if this step is active
                const isCurrentNav = activeNav === s.nav;
                const isCurrentStep = s.step !== undefined ? activeStep === s.step : true;
                const isActive = isCurrentNav && isCurrentStep;

                // Determine if this step is completed
                let isCompleted = false;
                if (s.id === 'intake') isCompleted = true; // Intake is always completed if client exists
                if (s.id === 'floorplan') isCompleted = Boolean(floorPlanDraft?.file || floorPlanDraft?.annotations?.zones?.length);
                if (s.id === 'renders') isCompleted = Boolean(designPackage?.moodboards?.length);
                if (s.id === 'brief') isCompleted = Boolean(designPackage);
                if (s.id === 'cutlist') isCompleted = Boolean(cutlist);
                if (s.id === 'deliverables') isCompleted = Boolean(project?.approvedAt || cutlist);

                return (
                  <button
                    key={s.id}
                    className={`wizard-step-btn${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
                    onClick={() => {
                      onNavChange(s.nav);
                      if (s.step !== undefined && setActiveStep) {
                        setActiveStep(s.step);
                      }
                    }}
                  >
                    <span className="step-dot" />
                    <span className="step-label">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="page-enter" key={activeNav}>
          {children}
        </div>
      </section>

      {/* Right resizer */}
      {inspectorVisible && (
        <>
          <div className="sidebar-resizer-right" id="react-sidebar-resizer-right"></div>
          <InspectorPanel
            activeNav={activeNav}
            activeMoodboard={activeMoodboard}
            activeImages={activeImages}
            providerStatus={providerStatus}
            form={form}
            floorPlanDraft={floorPlanDraft}
            floorPlanAnalysis={floorPlanAnalysis}
            laminates={laminates}
            library={library}
            generating={generating}
            uploading={uploading}
            project={project}
            canGenerate={canGenerate}
            onGenerate={onGenerate}
            onRegenerate={onRegenerate}
            onUploadReferences={onUploadReferences}
            onDownloadProposal={onDownloadProposal}
            onCreateCutlistProject={onCreateCutlistProject}
            onRefreshLibrary={onRefreshLibrary}
            onExportBackup={onExportBackup}
            cutlist={cutlist}
            adminSummary={adminSummary}
            projectList={projectList}
          />
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />

      <nav className="mobile-command-dock" aria-label="Mobile studio navigation">
        {studioNav.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activeNav === item.id ? 'active' : ''} aria-label={item.label} onClick={() => onNavChange(item.id)}>
              <Icon size={18} />
              <span>{mobileNavLabel(item)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function mobileNavLabel(item) {
  const labels = {
    admin: 'Home', dashboard: 'Intake', renders: 'Renders',
    library: 'Library', briefs: 'Briefs', packages: 'Files', materials: 'Materials', settings: 'Settings'
  };
  return labels[item.id] || item.label;
}

function initials(value = '') {
  const parts = String(value || 'SV').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SV';
}

function getActiveImages(activeMoodboard, activeRoom) {
  const generatedImages = activeMoodboard?.assets?.map((asset) => assetUrl(asset.url)) || [];
  return [...generatedImages, ...(showcaseImages[activeRoom] || showcaseImages?.living || [])].slice(0, 4);
}
