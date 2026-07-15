import React, { useState, useEffect } from 'react';
import { Palette, RotateCcw, Save, Check, Sparkles, Key, Trash2, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

const API = '';

const PROVIDERS = [
  { id: 'openai',       label: 'OpenAI',        hint: 'sk-... (gpt-image-1, gpt-4o-mini)',         color: '#10a37f' },
  { id: 'gemini',       label: 'Gemini / Imagen',hint: 'AI Studio key for gemini-2.5-flash & Imagen',color: '#4285F4' },
  { id: 'openrouter',   label: 'OpenRouter',     hint: 'sk-or-... (free llama-3.3-70b for AURA)',   color: '#8b5cf6' },
  { id: 'freepik',      label: 'Freepik',        hint: 'Freepik API key (Flux-Dev renders)',         color: '#F24E1E' },
  { id: 'huggingface',  label: 'HuggingFace',    hint: 'hf_... (SDXL / Flux-Schnell)',               color: '#ff9d00' },
  { id: 'stability',    label: 'Stability AI',   hint: 'sk-... (SDXL, Stable-Diffusion)',            color: '#7c3aed' },
];

const PRESETS = [
  { name:'ULTIDA Gold',  accent:'#C9A84C', surface:'#0F0F14', text:'#F0EEE8', muted:'#5C5C72', font:'Outfit' },
  { name:'Noir Luxe',   accent:'#E8C97A', surface:'#0A0A0D', text:'#F5F2EA', muted:'#6B6B7B', font:'Inter' },
  { name:'Sage Studio', accent:'#A3B18A', surface:'#121512', text:'#EEF1E8', muted:'#6E765F', font:'Outfit' },
  { name:'Royal Teal',  accent:'#2DD4AA', surface:'#0C1414', text:'#E8F4F1', muted:'#5C7070', font:'Inter' },
  { name:'Crimson Craft', accent:'#E07A5F', surface:'#140D0C', text:'#F4EAE6', muted:'#7A5C54', font:'Outfit' }
];

export default function WhiteLabelStudio({ onBack }) {
  const [form, setForm] = useState({ studioName:'ULTIDA', tagline:'The Ultimate Interior Design Application', logoText:'U', accentColor:'#C9A84C', surfaceColor:'#0F0F14', textColor:'#F0EEE8', mutedColor:'#5C5C72', fontDisplay:'Outfit', supportPhone:'', termsUrl:'', privacyUrl:'', showPoweredBy:true });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // BYOK API Key state
  const [keyStatus, setKeyStatus] = useState({});           // { [provider]: { configured, source, preview } }
  const [keyInputs, setKeyInputs] = useState({});           // { [provider]: string }
  const [keyVisible, setKeyVisible] = useState({});         // { [provider]: bool }
  const [keyBusy, setKeyBusy] = useState({});               // { [provider]: bool }
  const [keyMsg, setKeyMsg] = useState({});                 // { [provider]: { ok, text } }


  useEffect(() => {
    fetch(`${API}/api/whitelabel/public`).then(r => r.json()).then(d => {
      const s = d.settings || {};
      setForm(f => ({
        studioName: s.studioName || f.studioName,
        tagline: s.tagline || f.tagline,
        logoText: s.logoText || f.logoText,
        accentColor: s.accentColor || f.accentColor,
        surfaceColor: s.surfaceColor || f.surfaceColor,
        textColor: s.textColor || f.textColor,
        mutedColor: s.mutedColor || f.mutedColor,
        fontDisplay: s.fontDisplay || f.fontDisplay,
        supportPhone: s.supportPhone || '',
        termsUrl: s.termsUrl || '',
        privacyUrl: s.privacyUrl || '',
        showPoweredBy: s.showPoweredBy !== false
      }));
    }).catch(() => {});

    // Load existing key statuses
    fetch(`${API}/api/keys`).then(r => r.json()).then(d => {
      if (d.keys) {
        const map = {};
        d.keys.forEach(k => { map[k.provider] = k; });
        setKeyStatus(map);
      }
    }).catch(() => {});
  }, []);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const saveKey = async (provider) => {
    const key = (keyInputs[provider] || '').trim();
    if (!key) return;
    setKeyBusy(b => ({ ...b, [provider]: true }));
    setKeyMsg(m => ({ ...m, [provider]: null }));
    try {
      const r = await fetch(`${API}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key })
      });
      const d = await r.json();
      if (d.success) {
        setKeyStatus(s => ({ ...s, [provider]: { configured: true, source: 'database', preview: key.slice(0, 8) + '...' } }));
        setKeyInputs(i => ({ ...i, [provider]: '' }));
        setKeyMsg(m => ({ ...m, [provider]: { ok: true, text: 'Key saved & activated!' } }));
      } else {
        setKeyMsg(m => ({ ...m, [provider]: { ok: false, text: d.error || 'Save failed' } }));
      }
    } catch (e) {
      setKeyMsg(m => ({ ...m, [provider]: { ok: false, text: e.message } }));
    } finally {
      setKeyBusy(b => ({ ...b, [provider]: false }));
    }
  };

  const testKey = async (provider) => {
    const key = (keyInputs[provider] || '').trim();
    if (!key) return;
    setKeyBusy(b => ({ ...b, [provider]: true }));
    setKeyMsg(m => ({ ...m, [provider]: null }));
    try {
      const r = await fetch(`${API}/api/keys/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key })
      });
      const d = await r.json();
      if (d.success && d.valid) {
        setKeyMsg(m => ({ ...m, [provider]: { ok: true, text: `✓ Connectivity OK: ${d.note}` } }));
      } else {
        setKeyMsg(m => ({ ...m, [provider]: { ok: false, text: d.note || d.error || 'Connection failed' } }));
      }
    } catch (e) {
      setKeyMsg(m => ({ ...m, [provider]: { ok: false, text: e.message } }));
    } finally {
      setKeyBusy(b => ({ ...b, [provider]: false }));
    }
  };

  const deleteKey = async (provider) => {
    setKeyBusy(b => ({ ...b, [provider]: true }));
    try {
      await fetch(`${API}/api/keys/${provider}`, { method: 'DELETE' });
      setKeyStatus(s => ({ ...s, [provider]: { configured: false, source: 'none', preview: null } }));
      setKeyMsg(m => ({ ...m, [provider]: { ok: true, text: 'Key removed.' } }));
    } catch (e) {
      setKeyMsg(m => ({ ...m, [provider]: { ok: false, text: e.message } }));
    } finally {
      setKeyBusy(b => ({ ...b, [provider]: false }));
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await fetch(`${API}/api/whitelabel`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      setSaved(true);
      window.dispatchEvent(new CustomEvent('ultida-update-branding', { detail: { studioName: form.studioName, tagline: form.tagline, logoText: form.logoText, accentColor: form.accentColor } }));
    } finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const d = await (await fetch(`${API}/api/whitelabel/reset`, { method:'POST' })).json();
      const s = d.settings || {};
      setForm(f => ({ ...f, ...s, showPoweredBy: s.showPoweredBy !== false }));
      setSaved(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 font-sans" style={{ background:'var(--base-100)', color:'var(--text-primary)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Palette style={{ width:18, height:18, color:'var(--gold)' }} />
            <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.01em' }}>Brand Studio</h1>
          </div>
          <p style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:4 }}>White-label the studio with your own identity.</p>
        </div>
        {onBack && <button onClick={onBack} style={{ padding:'8px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-secondary)', fontSize:'12px', fontWeight:600, cursor:'pointer', background:'transparent' }}>← Back to Studio</button>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
        {/* ── Form ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card title="Identity">
            <Field label="Studio name"><input value={form.studioName} onChange={e => update('studioName', e.target.value)} className="wl-input" /></Field>
            <Field label="Tagline"><input value={form.tagline} onChange={e => update('tagline', e.target.value)} className="wl-input" /></Field>
            <Field label="Logo text (1–2 chars)"><input maxLength={2} value={form.logoText} onChange={e => update('logoText', e.target.value)} className="wl-input" style={{ maxWidth:80 }} /></Field>
            <Field label="Support phone"><input value={form.supportPhone} onChange={e => update('supportPhone', e.target.value)} className="wl-input" placeholder="+91..." /></Field>
          </Card>

          <Card title="Palette & Type">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <ColorField label="Accent" value={form.accentColor} onChange={v => update('accentColor', v)} />
              <ColorField label="Surface" value={form.surfaceColor} onChange={v => update('surfaceColor', v)} />
              <ColorField label="Text" value={form.textColor} onChange={v => update('textColor', v)} />
              <ColorField label="Muted" value={form.mutedColor} onChange={v => update('mutedColor', v)} />
            </div>
            <Field label="Display font">
              <select value={form.fontDisplay} onChange={e => update('fontDisplay', e.target.value)} className="wl-input">
                <option>Outfit</option><option>Inter</option>
              </select>
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'12px', color:'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.showPoweredBy} onChange={e => update('showPoweredBy', e.target.checked)} /> Show “Powered by” footer
            </label>
          </Card>

          <Card title="Presets">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {PRESETS.map(p => (
                <button key={p.name} onClick={() => { setForm(f => ({ ...f, ...p })); setSaved(false); }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', cursor:'pointer', fontSize:'11.5px', fontWeight:600 }}>
                  <span style={{ width:14, height:14, borderRadius:4, background:p.accent }} />
                  {p.name}
                </button>
              ))}
            </div>
          </Card>

          {/* ── API Key Manager ── */}
          <Card title="AI Provider Keys (BYOK)">
            <p style={{ fontSize:'11px', color:'var(--text-muted)', lineHeight:1.5, marginBottom:4 }}>
              Keys are stored in the local SQLite database and activated immediately — no restart needed.
              AURA uses OpenRouter → Gemini → OpenAI in order. Image generation uses the first available key.
            </p>
            {PROVIDERS.map(prov => {
              const st = keyStatus[prov.id] || {};
              const msg = keyMsg[prov.id];
              const busy_ = keyBusy[prov.id];
              const show = keyVisible[prov.id];
              return (
                <div key={prov.id} style={{ borderRadius:12, border:'1px solid rgba(255,255,255,0.06)', padding:'12px 14px', background:'rgba(0,0,0,0.15)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background: st.configured ? '#22c55e' : '#475569', flexShrink:0 }} />
                    <span style={{ fontSize:'12px', fontWeight:700, color:'var(--text-primary)' }}>{prov.label}</span>
                    {st.configured && (
                      <span style={{ fontSize:'9.5px', fontWeight:600, color:'#22c55e', background:'rgba(34,197,94,0.12)', padding:'1px 7px', borderRadius:99 }}>ACTIVE</span>
                    )}
                    {st.preview && (
                      <span style={{ fontSize:'9.5px', color:'var(--text-muted)', fontFamily:'monospace', marginLeft:'auto' }}>{st.preview}</span>
                    )}
                  </div>
                  <p style={{ fontSize:'10px', color:'var(--text-muted)', marginBottom:8 }}>{prov.hint}</p>
                  <div style={{ display:'flex', gap:6 }}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input
                        type={show ? 'text' : 'password'}
                        value={keyInputs[prov.id] || ''}
                        onChange={e => setKeyInputs(i => ({ ...i, [prov.id]: e.target.value }))}
                        placeholder={st.configured ? 'Enter new key to replace...' : 'Paste your API key...'}
                        className="wl-input"
                        style={{ paddingRight:36, width:'100%', boxSizing:'border-box' }}
                        onKeyDown={e => { if (e.key === 'Enter') saveKey(prov.id); }}
                      />
                      <button
                        onClick={() => setKeyVisible(v => ({ ...v, [prov.id]: !show }))}
                        style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0 }}
                      >
                        {show ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                      </button>
                    </div>
                    <button
                      onClick={() => testKey(prov.id)}
                      disabled={busy_ || !(keyInputs[prov.id] || '').trim()}
                      style={{ padding:'6px 12px', borderRadius:8, background: 'rgba(255,255,255,0.08)', color:'#fff', fontWeight:600, fontSize:'11px', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', opacity: (busy_ || !(keyInputs[prov.id] || '').trim()) ? 0.5 : 1, whiteSpace:'nowrap', flexShrink:0 }}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => saveKey(prov.id)}
                      disabled={busy_ || !(keyInputs[prov.id] || '').trim()}
                      style={{ padding:'6px 12px', borderRadius:8, background: prov.color, color:'#fff', fontWeight:700, fontSize:'11px', border:'none', cursor:'pointer', opacity: busy_ ? 0.6 : 1, whiteSpace:'nowrap', flexShrink:0 }}
                    >
                      {busy_ ? <Loader style={{ width:12, height:12, animation:'spin 1s linear infinite' }} /> : <Key style={{ width:12, height:12 }} />}
                    </button>
                    {st.configured && (
                      <button
                        onClick={() => deleteKey(prov.id)}
                        disabled={busy_}
                        style={{ padding:'6px 10px', borderRadius:8, background:'rgba(239,68,68,0.12)', color:'#ef4444', fontWeight:700, fontSize:'11px', border:'1px solid rgba(239,68,68,0.25)', cursor:'pointer', flexShrink:0 }}
                      >
                        <Trash2 style={{ width:12, height:12 }} />
                      </button>
                    )}
                  </div>
                  {msg && (
                    <p style={{ fontSize:'10px', marginTop:6, color: msg.ok ? '#22c55e' : '#ef4444', fontWeight:600 }}>
                      {msg.ok ? '✓ ' : '✗ '}{msg.text}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        </div>

        {/* ── Live preview ── */}
        <div style={{ position:'sticky', top:0 }}>
          <Card title="Live Preview">
            <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${form.accentColor}33`, background:form.surfaceColor, color:form.textColor, fontFamily:`${form.fontDisplay}, sans-serif` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 18px', borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg, ${form.accentColor}, ${form.accentColor}99)`, color:form.surfaceColor, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{form.logoText}</div>
                <div style={{ fontWeight:800, fontSize:15 }}>{form.studioName}</div>
              </div>
              <div style={{ padding:'20px 18px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background:`${form.accentColor}1a`, color:form.accentColor, fontSize:'10px', fontWeight:700, marginBottom:12 }}>
                  <Sparkles style={{ width:12, height:12 }} /> Interior Design OS
                </div>
                <div style={{ fontSize:'19px', fontWeight:800, lineHeight:1.15, letterSpacing:'-0.01em' }}>{form.tagline}</div>
                <p style={{ fontSize:'12px', color:form.mutedColor, marginTop:8, lineHeight:1.5 }}>From floor plan to photoreal render in one workspace.</p>
                <button style={{ marginTop:14, padding:'10px 18px', borderRadius:10, background:`linear-gradient(135deg, ${form.accentColor}, ${form.accentColor}cc)`, color:form.surfaceColor, fontWeight:700, fontSize:'12px', border:'none', cursor:'pointer' }}>Open Studio</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Sticky save bar ── */}
      <div style={{ position:'fixed', bottom:18, right:18, zIndex:80, display:'flex', gap:10, alignItems:'center', padding:'10px 12px', borderRadius:14, background:'rgba(15,15,20,0.96)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'var(--shadow-panel)', backdropFilter:'blur(12px)' }}>
        <button onClick={reset} disabled={busy} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 13px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-secondary)', fontSize:'12px', fontWeight:600, cursor:'pointer', background:'transparent' }}>
          <RotateCcw style={{ width:13, height:13 }} /> Reset
        </button>
        <button onClick={save} disabled={busy} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, background:'linear-gradient(135deg, var(--gold), var(--gold-deep))', color:'#0A0A0D', fontSize:'12px', fontWeight:700, cursor:'pointer', border:'none' }}>
          {saved ? <Check style={{ width:14, height:14 }} /> : <Save style={{ width:14, height:14 }} />} {saved ? 'Saved' : 'Save Brand'}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background:'var(--surface-1)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:18, padding:20, boxShadow:'var(--shadow-card)' }}>
      <div style={{ fontSize:'10px', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:14 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label style={{ display:'block' }}>
      <span style={{ display:'block', fontSize:'11px', fontWeight:600, color:'var(--text-secondary)', marginBottom:5 }}>{label}</span>
      {children}
    </label>
  );
}
function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width:34, height:32, border:'none', background:'none', borderRadius:8, cursor:'pointer', padding:0 }} />
        <input value={value} onChange={e => onChange(e.target.value)} className="wl-input" style={{ flex:1 }} />
      </div>
    </Field>
  );
}
