import React, { useState, useEffect } from 'react';
import { X, Save, Pencil, Loader2, CheckCircle2, AlertCircle, IndianRupee } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'brief', label: 'Brief' },
  { value: 'cad', label: 'CAD Drafting' },
  { value: 'cad_approved', label: 'CAD Approved' },
  { value: 'materials_selected', label: 'Materials Selected' },
  { value: 'renders', label: 'Rendering' },
  { value: 'drawings', label: 'Drawings' },
  { value: 'production', label: 'Production' },
  { value: 'closed', label: 'Closed' },
];

const API = '';

export default function ProjectSettingsModal({ project, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('onboarding');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClientName(project.client_name || '');
      setBudget(project.budget != null ? String(project.budget) : '');
      setStatus(project.status || 'onboarding');
    }
  }, [project]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`${API}/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          client_name: clientName.trim(),
          budget: budget === '' ? null : Number(budget),
          status,
        }),
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      if (onSaved) onSaved(body.project || body);
      setTimeout(() => onClose(), 600);
    } catch (e) {
      setError(e.message || 'Failed to save project settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          background: 'var(--surface-1, #15151c)',
          border: '1px solid var(--gold-border, rgba(201,168,76,0.25))',
          borderRadius: '18px', padding: '22px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pencil style={{ width: 15, height: 15, color: 'var(--gold, #C9A84C)' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-primary, #F0EEE8)', textTransform: 'uppercase' }}>
              Edit Project
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #8a8a9a)', padding: '4px' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Project Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Verona Heights 3BHK"
              style={inputStyle}
            />
          </Field>

          <Field label="Client Name">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sharma Residence"
              style={inputStyle}
            />
          </Field>

          <Field label="Budget (₹)">
            <div style={{ position: 'relative' }}>
              <IndianRupee style={{ width: 13, height: 13, position: 'absolute', left: 10, top: 11, color: 'var(--text-muted, #8a8a9a)' }} />
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="e.g. 1850000"
                style={{ ...inputStyle, paddingLeft: 30 }}
              />
            </div>
            {budget && Number(budget) > 0 && (
              <span style={{ fontSize: '9px', color: 'var(--gold, #C9A84C)', marginTop: '4px', display: 'block' }}>
                ≈ ₹{(Number(budget) / 100000).toFixed(2)} L
              </span>
            )}
          </Field>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', color: '#ff6b6b', fontSize: '11px' }}>
            <AlertCircle style={{ width: 13, height: 13 }} /> {error}
          </div>
        )}
        {saved && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', color: '#4ade80', fontSize: '11px' }}>
            <CheckCircle2 style={{ width: 13, height: 13 }} /> Saved successfully
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-secondary, #c8c8d4)', fontSize: '12px', fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: saving ? 'wait' : 'pointer',
              background: saving ? 'rgba(201,168,76,0.5)' : 'var(--gold, #C9A84C)',
              border: 'none', color: '#1a1a1a', fontSize: '12px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #8a8a9a)', display: 'block', marginBottom: '6px' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary, #F0EEE8)', fontSize: '12px', outline: 'none',
  fontFamily: 'inherit',
};
