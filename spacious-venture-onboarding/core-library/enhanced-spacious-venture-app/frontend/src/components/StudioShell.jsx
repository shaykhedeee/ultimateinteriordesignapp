import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus, RefreshCw, Trash2, Undo2 } from 'lucide-react';
import { studioNav } from '../data/studioData.js';

export function StudioShell({
  activeNav,
  onNavChange,
  children,
  form,
  project,
  designPackage,
  providerStatus,
  studioSettings,
  onDesignerInfoChange,
  onStartClient,
  onClearAll
}) {
  const hasClient = Boolean(form.clientName.trim() || project || designPackage);
  const clientLine = hasClient
    ? `${form.clientName || 'Walk-in Client'}${form.city ? ` Residence, ${form.city}` : ' Residence'}`
    : 'No Client Selected';
  const projectCode = project ? `SV-${project.id.slice(0, 6).toUpperCase()}` : 'SV-DRAFT';
  const logoPrimary = studioSettings?.logoPrimary || 'SPACIOUS';
  const logoSecondary = studioSettings?.logoSecondary || 'VENTURE';
  const leadDesigner = studioSettings?.leadDesigner || 'Muskan P';
  const leadRole = studioSettings?.leadRole || 'Lead Designer';
  const avatarText = initials(leadDesigner);

  const [isEditingDesigner, setIsEditingDesigner] = useState(false);
  const [editingName, setEditingName] = useState(leadDesigner);
  const [editingRole, setEditingRole] = useState(leadRole);
  const nameInputRef = useRef(null);
  const roleInputRef = useRef(null);

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

  function handleNameBlur() {
    setIsEditingDesigner(false);
    if (onDesignerInfoChange && editingName !== leadDesigner) {
      onDesignerInfoChange('leadDesigner', editingName);
    }
  }

  function handleRoleBlur() {
    setIsEditingDesigner(false);
    if (onDesignerInfoChange && editingRole !== leadRole) {
      onDesignerInfoChange('leadRole', editingRole);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setIsEditingDesigner(false);
    }
  }

  React.useEffect(() => {
    const resizer = document.getElementById('react-sidebar-resizer-left');
    const shell = document.querySelector('.app-shell');
    if (!resizer || !shell) return;

    let isDragging = false;

    const savedLeftWidth = localStorage.getItem('sv_react_left_width') || '238';
    shell.style.gridTemplateColumns = `${savedLeftWidth}px 6px minmax(0, 1fr)`;

    setTimeout(() => {
      const intakePanel = document.querySelector('.intake-panel');
      if (intakePanel) {
        intakePanel.style.width = `${Number(savedLeftWidth) - 74}px`;
      }
    }, 100);

    function onMouseDown() {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
      if (!isDragging) return;
      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 450) {
        shell.style.gridTemplateColumns = `${newWidth}px 6px minmax(0, 1fr)`;
        const panel = document.querySelector('.intake-panel');
        if (panel) {
          panel.style.width = `${newWidth - 74}px`;
        }
      }
    }

    function onMouseUp() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const width = shell.style.gridTemplateColumns.split('px')[0];
        localStorage.setItem('sv_react_left_width', width);
      }
    }

    resizer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onTouchStart() {
      isDragging = true;
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      const clientX = e.touches[0].clientX;
      if (clientX >= 180 && clientX <= 450) {
        shell.style.gridTemplateColumns = `${clientX}px 6px minmax(0, 1fr)`;
        const panel = document.querySelector('.intake-panel');
        if (panel) {
          panel.style.width = `${clientX - 74}px`;
        }
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
  }, [form.clientName, project, designPackage]); // Re-run if intake panel mounts/unmounts

  return (
    <div className="app-shell">
      <aside className="studio-sidebar">
        <div className="studio-logo">
          <div className="studio-flower" aria-hidden="true" />
          <div>
            <strong>{logoPrimary}</strong>
            <span>{logoSecondary}</span>
          </div>
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

      {/* Left resizer splitter */}
      <div className="sidebar-resizer-left" id="react-sidebar-resizer-left" style={{ width: '6px', cursor: 'col-resize', zIndex: 10, background: 'rgba(0,0,0,0.03)', borderRight: '1px solid var(--line)', position: 'relative' }}></div>

      <section className="main-shell">
        <header className="project-topbar">
          <div className="project-meta">
            <span>Project</span>
            <strong>{projectCode}</strong>
            {hasClient && <i />}
            <strong className="client-title">{clientLine}</strong>
            <em>{form.budgetTier}</em>
          </div>
          <div className="topbar-tools">
            <button aria-label="Add client" className="topbar-action" onClick={onStartClient}><Plus size={16} /> Add Client</button>
            <button aria-label="Clear all" className="topbar-action muted-action" onClick={onClearAll}><Trash2 size={16} /> Clear All</button>
            <button aria-label="Undo"><Undo2 size={17} /></button>
            <button aria-label="Refresh" onClick={() => window.location.reload()}><RefreshCw size={17} /></button>
            <button aria-label="Notifications"><Bell size={17} /></button>
            <div className="avatar">{avatarText}</div>
            {isEditingDesigner ? (
              <div className="designer-edit-inline">
                <input
                  ref={nameInputRef}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Designer name"
                />
                <input
                  ref={roleInputRef}
                  value={editingRole}
                  onChange={(event) => setEditingRole(event.target.value)}
                  onBlur={handleRoleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Role"
                />
              </div>
            ) : (
              <span className="designer-info" onClick={handleDesignerClick} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleDesignerClick()} title="Click to edit">
                <strong>{leadDesigner}</strong>
                <small>{leadRole}</small>
              </span>
            )}
          </div>
        </header>
        {children}
      </section>

      <nav className="mobile-command-dock" aria-label="Mobile studio navigation">
        {studioNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeNav === item.id ? 'active' : ''}
              aria-label={item.label}
              onClick={() => onNavChange(item.id)}
            >
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
    admin: 'Home',
    dashboard: 'Intake',
    renders: 'Renders',
    briefs: 'Briefs',
    packages: 'Files',
    materials: 'Materials',
    settings: 'Settings'
  };
  return labels[item.id] || item.label;
}

function initials(value = '') {
  const parts = String(value || 'SV').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SV';
}
