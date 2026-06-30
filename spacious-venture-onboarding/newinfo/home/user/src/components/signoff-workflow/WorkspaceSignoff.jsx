// ============================================================
// PRIORITY 6: Workspace Sign-off Workflow
// src/components/signoff-workflow/WorkspaceSignoff.jsx
// Production sign-off before cutlist export
// ============================================================

import React, { useState } from 'react';
import './WorkspaceSignoff.css';

const CHECKLIST_ITEMS = [
  { id: 'measurements', label: 'Site measurements verified against module dimensions', category: 'site' },
  { id: 'materials', label: 'All materials confirmed in stock with correct codes', category: 'materials' },
  { id: 'edge-banding', label: 'Edge banding rules match production standards', category: 'production' },
  { id: 'sheet-sizes', label: 'Sheet sizes and quantities verified', category: 'production' },
  { id: 'hardware', label: 'Hardware specified for all modules', category: 'materials' },
  { id: 'cutlist-parts', label: 'All parts generated with correct dimensions', category: 'production' },
  { id: 'labels', label: 'Panel labels readable for workshop floor', category: 'production' },
  { id: 'drawings', label: 'Working drawings attached for reference', category: 'documentation' },
  { id: 'client-approval', label: 'Client has approved the PDF brief', category: 'documentation' },
  { id: 'render-approval', label: 'Final renders approved by designer', category: 'design' },
  { id: 'quantity-check', label: 'Module quantities double-checked', category: 'production' },
  { id: 'waste-check', label: 'Sheet wastage within acceptable threshold', category: 'production' },
  { id: 'special-notes', label: 'Any special production notes communicated', category: 'production' },
  { id: 'delivery-date', label: 'Delivery/installation timeline confirmed', category: 'logistics' }
];

export default function WorkspaceSignoff({ projectId, moduleData, onSignoffComplete }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [signerName, setSignerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = Math.round((checkedCount / totalCount) * 100);
  const allChecked = checkedCount === totalCount;

  const filteredItems = activeCategory === 'all'
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter(i => i.category === activeCategory);

  const handleSubmit = async () => {
    if (!signerName.trim()) return;
    if (!allChecked) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/workflow/signoff/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          notes: notes.trim(),
          checklist: checkedItems
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.success && onSignoffComplete) onSignoffComplete(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="signoff-complete">
        <div className="signoff-success-icon">✅</div>
        <h3>Production Sign-off Complete</h3>
        <p className="signoff-summary">
          Signed by {result.signerName} on {new Date(result.signedAt).toLocaleDateString('en-IN')}
        </p>
        <p className="signoff-note">{result.notes}</p>
        <div className="signoff-stats">
          <span>📋 {result.checklistCount} items checked</span>
          <span>🕐 {new Date(result.signedAt).toLocaleTimeString('en-IN')}</span>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setCheckedItems({}); setSignerName(''); setNotes(''); setResult(null);
        }}>
          Sign Off Another Project
        </button>
      </div>
    );
  }

  return (
    <div className="workspace-signoff">
      <div className="signoff-header">
        <h3>🔧 Production Sign-off</h3>
        <span className="signoff-stage">Before Workshop Export</span>
      </div>

      <div className="signoff-progress-section">
        <div className="progress-label">
          <span>Readiness Check</span>
          <span className={`progress-pct ${progress >= 100 ? 'complete' : progress >= 70 ? 'nearly' : ''}`}>
            {progress}%
          </span>
        </div>
        <div className="signoff-progress-bar">
          <div className="signoff-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-sub">{checkedCount}/{totalCount} checks passed</div>
      </div>

      <div className="signoff-filters">
        <button className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}>All</button>
        {categories.map(cat => (
          <button key={cat} className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="signoff-checklist">
        {filteredItems.map(item => (
          <label key={item.id} className={`checklist-item ${checkedItems[item.id] ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!checkedItems[item.id]}
              onChange={e => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
              className="checklist-input"
            />
            <span className="checkmark" />
            <span className="checklist-label">{item.label}</span>
            <span className="checklist-category">{item.category}</span>
          </label>
        ))}
      </div>

      <div className="signoff-form">
        <div className="form-field">
          <label>Signer Name *</label>
          <input
            type="text"
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
            placeholder="Production Manager"
            className="form-input"
          />
        </div>
        <div className="form-field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions or observations..."
            className="form-input form-textarea"
            rows={3}
          />
        </div>
      </div>

      <button
        className={`btn btn-full ${allChecked && signerName.trim() ? 'btn-primary' : 'btn-secondary'}`}
        disabled={!allChecked || !signerName.trim() || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '⏳ Submitting...' : allChecked ? '✅ Sign Off & Unlock Export' : `⏳ Complete all ${totalCount} checks (${checkedCount}/${totalCount})`}
      </button>

      {result && !result.success && (
        <div className="signoff-error">
          ⚠ {result.error || 'Sign-off failed. Please try again.'}
        </div>
      )}
    </div>
  );
}