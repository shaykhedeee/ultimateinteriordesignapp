import React, { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, RefreshCw, ShieldCheck, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const API = 'http://127.0.0.1:5055';

export default function MaintenanceScreen() {
  const [preflight, setPreflight] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const fileRef = useRef(null);

  const runPreflight = async () => {
    setBusy('preflight');
    try {
      const r = await fetch(`${API}/api/system/preflight`);
      setPreflight(await r.json());
    } catch { setMsg('Preflight failed'); }
    finally { setBusy(''); }
  };

  useEffect(() => { runPreflight(); }, []);

  const exportBackup = () => {
    setBusy('export');
    const a = document.createElement('a');
    a.href = `${API}/api/backup/export`;
    a.download = `ultida-backup-${Date.now()}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setBusy(''); setMsg('Backup downloaded (DB + all storage).');
  };

  const importBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('import'); setMsg('');
    try {
      const fd = new FormData();
      fd.append('backup', file);
      fd.append('mode', 'replace');
      const r = await fetch(`${API}/api/backup/import`, { method: 'POST', body: fd });
      const d = await r.json();
      setMsg(d.success ? 'Restore complete — restart the app to load restored data.' : `Restore failed: ${d.error}`);
    } catch (err) { setMsg('Restore failed'); }
    finally { setBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };

  const demoReset = async () => {
    if (confirmText !== 'RESET DEMO') { setMsg('Type RESET DEMO to confirm.'); return; }
    setBusy('reset');
    try {
      const r = await fetch(`${API}/api/admin/demo-reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'RESET DEMO' }) });
      const d = await r.json();
      setMsg(d.success ? 'Demo data cleared. Schema preserved.' : `Reset failed: ${d.error}`);
    } catch { setMsg('Reset failed'); }
    finally { setBusy(''); setConfirmText(''); }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-[var(--gold)]" /> Backup &amp; Restore
        </h1>
        <p className="text-slate-400 mt-1">Keep the whole studio safe: database + every deliverable, one ZIP.</p>
      </div>

      {/* Preflight */}
      <Card title="Preflight Readiness" icon={ShieldCheck}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-400">Automated check before a client demo.</span>
          <button onClick={runPreflight} disabled={busy === 'preflight'} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm disabled:opacity-50">
            {busy === 'preflight' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Run
          </button>
        </div>
        {preflight && (
          <div className="space-y-1.5">
            {preflight.checks.map(c => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                <span className="text-slate-200">{c.name}</span>
                {c.detail && <span className="text-slate-500 text-xs">— {c.detail}</span>}
              </div>
            ))}
            <div className={`mt-2 text-sm font-semibold ${preflight.ready ? 'text-emerald-400' : 'text-rose-400'}`}>
              {preflight.ready ? 'Ready to demo' : 'Not ready — see above'}
            </div>
          </div>
        )}
      </Card>

      {/* Backup / Restore */}
      <Card title="Studio Backup" icon={Database}>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportBackup} disabled={busy === 'export'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-black font-bold text-sm disabled:opacity-50">
            <Download className="w-4 h-4" /> Export full backup (ZIP)
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy === 'import'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm disabled:opacity-50">
            {busy === 'import' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Restore from backup
          </button>
          <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={importBackup} />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Backup includes the SQLite database (with live WAL) and all storage folders: assets, proposals, uploads, elevations, gcode. Restore replaces storage and the database from the ZIP.</p>
      </Card>

      {/* Demo reset */}
      <Card title="Demo Reset" icon={Trash2}>
        <p className="text-sm text-slate-400 mb-3">Clear all client/project/deliverable data but keep the schema. Use before a fresh walkthrough.</p>
        <div className="flex gap-2">
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type RESET DEMO"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-rose-500 outline-none" />
          <button onClick={demoReset} disabled={busy === 'reset'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/80 text-white font-bold text-sm disabled:opacity-50">
            {busy === 'reset' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Reset
          </button>
        </div>
      </Card>

      {msg && <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-xl text-sm">{msg}</div>}
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[var(--gold)]" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}
