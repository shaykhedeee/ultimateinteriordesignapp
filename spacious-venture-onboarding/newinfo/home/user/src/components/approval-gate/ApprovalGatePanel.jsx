// ============================================================
// PRIORITY 3b: Approval Gate UI Panel
// src/components/approval-gate/ApprovalGatePanel.jsx
// Shows pipeline status and blocks/enables actions
// ============================================================

import React, { useState, useEffect } from 'react';
import './ApprovalGatePanel.css';

const GATE_ICONS = {
  'Render Approval': '🎨',
  'Brief Approval': '📄',
  'Cutlist Readiness': '✂️',
  'Workspace Sign-off': '✅'
};

export default function ApprovalGatePanel({ projectId, onGateChange }) {
  const [gates, setGates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overrideModal, setOverrideModal] = useState(null);

  useEffect(() => {
    if (projectId) loadGates(projectId);
  }, [projectId]);

  const loadGates = async (pid) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow/gates/${pid}`);
      const data = await res.json();
      setGates(data);
    } catch (err) {
      console.error('Failed to load gates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type, id) => {
    let endpoint = '';
    switch(type) {
      case 'render-approval':
        endpoint = `/api/workflow/approve-render/${projectId}/${id}`;
        break;
      case 'brief-approval':
        endpoint = `/api/workflow/approve-brief/${projectId}/${id}`;
        break;
      case 'workspace-signoff':
        endpoint = `/api/workflow/signoff/${projectId}`;
        break;
    }
    
    try {
      await fetch(endpoint, { method: 'POST' });
      await loadGates(projectId);
      if (onGateChange) onGateChange();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  if (loading) return <div className="gate-loading">Checking pipeline status...</div>;
  if (!gates) return null;

  return (
    <div className="approval-gate-panel">
      <div className="gate-header">
        <h3>Pipeline Gates</h3>
        <span className={`gate-progress ${gates.overallProgress >= 100 ? 'complete' : ''}`}>
          {gates.overallProgress}%
        </span>
      </div>

      <div className="gate-list">
        {gates.gates?.map((gate, i) => (
          <div key={i} className={`gate-item ${gate.passed ? 'passed' : 'blocked'} ${gate === gates.currentBlockingGate ? 'current' : ''}`}>
            <div className="gate-status-icon">
              {gate.passed ? '✅' : gate === gates.currentBlockingGate ? '⏳' : '🔒'}
            </div>
            
            <div className="gate-content">
              <div className="gate-name-row">
                <span className="gate-icon">{GATE_ICONS[gate.name] || '🔷'}</span>
                <span className="gate-name">{gate.name}</span>
                {gate === gates.currentBlockingGate && (
                  <span className="gate-now-label">NEXT</span>
                )}
              </div>
              
              <div className="gate-details">
                {gate.details && Object.entries(gate.details).map(([key, val]) => (
                  <span key={key} className="gate-detail-chip">
                    {key.replace(/([A-Z])/g, ' $1')}: {String(val)}
                  </span>
                ))}
              </div>

              {!gate.passed && (
                <div className="gate-action">
                  <p className="gate-blocked-msg">{gate.blockingMessage}</p>
                  {gate.blockingAction && (
                    <div className="gate-buttons">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprove(
                          gate.name.toLowerCase().replace(/\s+/g, '-'),
                          projectId
                        )}
                      >
                        {gate.blockingAction.button}
                      </button>
                      <button
                        className="btn btn-ghost btn-tiny"
                        onClick={() => setOverrideModal(gate.name)}
                        title="Override this gate (audit logged)"
                      >
                        ⚡ Override
                      </button>
                    </div>
                  )}
                </div>
              )}

              {gate.passed && (
                <div className="gate-passed-badge">✓ Passed</div>
              )}
            </div>

            {/* Connector line to next gate */}
            {i < gates.gates.length - 1 && (
              <div className={`gate-connector ${gate.passed ? 'passed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="gate-progress-bar">
        <div
          className="gate-progress-fill"
          style={{ width: `${gates.overallProgress}%` }}
        />
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="override-modal-overlay">
          <div className="override-modal">
            <h4>⚠ Override Gate: {overrideModal}</h4>
            <p className="override-warning">
              This will bypass the gate without meeting its conditions.
              This action is logged in the audit trail.
            </p>
            <textarea
              placeholder="Reason for override..."
              className="override-reason"
            />
            <div className="override-actions">
              <button className="btn btn-secondary" onClick={() => setOverrideModal(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={async () => {
                await fetch(`/api/workflow/override-gate/${projectId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gateName: overrideModal, reason: 'Manual override' })
                });
                setOverrideModal(null);
                await loadGates(projectId);
              }}>
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}