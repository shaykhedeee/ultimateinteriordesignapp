import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, Sparkles, CheckCircle2, BrainCircuit,
  Wand2, FileCode2, X, ArrowRight
} from 'lucide-react';

const SUGGESTIONS = [
  "💡 Add pendant light above dining table (+350 Lux, CRI 98)",
  "💡 East wall looks empty. Suggest backlit fluted wood rafters",
  "💡 Living rug slightly small. Upgrade to 8×10 Berber?",
  "🎨 Extract 5-color Japandi palette from mood board",
  "📊 Kitchen work triangle 96%. Optimise layout?",
  "🪴 Add 3 Monstera plants for biophilic +12 pts"
];

// Derive real, project-aware insights from the selected project so the
// AURA Insights panel is never empty and always relevant to the work at hand.
function buildInsights(project) {
  if (!project || !project.name) {
    return SUGGESTIONS.map(s => ({ text: s.replace(/^[^\s]*\s*/, ''), prompt: s.replace(/^[^\s]*\s*/, ''), tone: 'info' }));
  }
  const insights = [];
  const budget = Number(project.budget) || 0;
  if (!budget) {
    insights.push({ text: `Set a budget for “${project.name}” to unlock cost optimisation`, prompt: `What budget should I plan ${project.name} around?`, tone: 'warn' });
  } else {
    insights.push({ text: `Budget ₹${(budget/100000).toFixed(1)}L allocated — optimise joinery cost`, prompt: `Optimise the joinery cost for ${project.name}'s ₹${(budget/100000).toFixed(1)}L budget`, tone: 'info' });
  }
  const status = (project.status || '').replace(/_/g, ' ');
  if (status && status !== 'production') {
    insights.push({ text: `Stage: ${status}. Generate elevations to advance`, prompt: `Generate 2D elevations for ${project.name}`, tone: 'info' });
  }
  insights.push({ text: `Generate photoreal renders for ${project.name}`, prompt: `Generate 3D photoreal renders for ${project.name}`, tone: 'info' });
  insights.push({ text: `Review my design & propose improvements`, prompt: `Review my design and propose improvements (resize sofa to fit wall, check mesh-basket placement, Vastu zones, elevation standard, material swaps)`, tone: 'info' });
  insights.push({ text: `Run Vastu check on ${project.name}`, prompt: `Run a Vastu compliance check on ${project.name}`, tone: 'info' });
  if (status === 'production') {
    insights.push({ text: `Build delivery package (SKP + DXF + cutlist)`, prompt: `Build the full delivery package for ${project.name}`, tone: 'info' });
  }
  return insights;
}

export default function AuraBrainChat({
  messages, onSendMessage, onExecuteAction,
  project, isOpen, onClose, isThinking,
  proposals, onProposalAction, onRunReview
}) {
  const [inputText, setInputText]         = useState('');
  const [isListening, setIsListening]     = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showProposals, setShowProposals] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const simulateVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      onSendMessage("Add a warm Chevron Herringbone oak floor to this bedroom.");
    }, 2500);
  };

  if (!isOpen) return null;

  /* ── Styles ── */
  const S = {
    panel: {
      width: '340px',
      borderLeft: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg, #09090F 0%, #06060C 100%)',
      flexShrink: 0,
      position: 'relative'
    },
    header: {
      padding: '12px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.02)', flexShrink: 0
    },
    iconWrap: {
      width: 34, height: 34, borderRadius: 10,
      background: 'rgba(99,102,241,0.15)',
      border: '1px solid rgba(99,102,241,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 14px rgba(99,102,241,0.15)', flexShrink: 0
    },
    msgArea: {
      flex: 1, overflowY: 'auto', padding: '16px 14px',
      display: 'flex', flexDirection: 'column', gap: '16px'
    },
    suggestionsBar: {
      padding: '10px 14px 6px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(0,0,0,0.2)',
      flexShrink: 0
    },
    inputRow: {
      padding: '10px 12px 14px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', gap: '8px', flexShrink: 0
    }
  };

  const renderBubble = (m) => {
    if (m.sender === 'system') {
      return (
        <div key={m.id} style={{ textAlign:'center', fontSize:'10px', color:'var(--text-muted)', fontFamily:'monospace', padding:'6px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.04)' }}>
          {m.text}
        </div>
      );
    }
    const isUser = m.sender === 'user';
    return (
      <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'9px', color:'var(--text-muted)', paddingInline:'4px' }}>
          <span>{isUser ? (project?.clientName || 'You') : 'AURA AI'}</span>
          <span>·</span>
          <span>{m.timestamp}</span>
        </div>

        <div style={{
          padding: '10px 13px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          maxWidth: '90%', fontSize: '11.5px', lineHeight: 1.6,
          ...(isUser
            ? { background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white' }
            : { background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }
          )
        }}>
          <p>{m.text}</p>

          {/* Action Preview */}
          {m.actionPreview && (
            <div style={{ marginTop:'12px', padding:'12px', borderRadius:'10px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(99,102,241,0.25)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', paddingBottom:'6px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:'#a5b4fc', display:'flex', alignItems:'center', gap:4 }}>
                  <Wand2 style={{ width:11, height:11 }} />
                  {m.actionPreview.title}
                </span>
                {m.actionPreview.costImpact !== 0 && (
                  <span style={{ fontSize:'10px', fontFamily:'monospace', fontWeight:800, color: m.actionPreview.costImpact < 0 ? 'var(--emerald)' : '#F59E0B' }}>
                    {m.actionPreview.costImpact < 0 ? `-₹${Math.abs(m.actionPreview.costImpact).toLocaleString()}` : `+₹${m.actionPreview.costImpact.toLocaleString()}`}
                  </span>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:'8px' }}>
                {m.actionPreview.changes?.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:'10px', color:'rgba(255,255,255,0.7)' }}>
                    <CheckCircle2 style={{ width:11, height:11, color:'var(--emerald)', flexShrink:0, marginTop:1 }} />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              {m.actionPreview.visualQualityImpact && (
                <div style={{ fontSize:'9px', color:'var(--text-muted)', display:'flex', justifyContent:'space-between', paddingTop:'6px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <span>Visual Impact</span>
                  <span style={{ color:'#F59E0B', letterSpacing:'0.05em' }}>
                    {'★'.repeat(Math.round(m.actionPreview.visualQualityImpact))}
                    <span style={{ color:'rgba(255,255,255,0.1)' }}>{'★'.repeat(5-Math.round(m.actionPreview.visualQualityImpact))}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {m.actions && m.actions.length > 0 && (
            <div style={{ marginTop:'10px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {m.actions.map(act => (
                <button
                  key={act.actionId}
                  onClick={() => onExecuteAction?.(act.actionId, act.preview || {})}
                  style={{
                    padding:'5px 12px',
                    borderRadius:'8px',
                    fontSize:'10px',
                    fontWeight:700,
                    cursor:'pointer',
                    display:'inline-flex',
                    alignItems:'center',
                    gap:'5px',
                    transition:'all 0.18s',
                    background: act.primary ? '#6366f1' : 'rgba(255,255,255,0.08)',
                    color: act.primary ? '#fff' : 'rgba(255,255,255,0.85)',
                    border: act.primary ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    boxShadow: act.primary ? '0 4px 12px rgba(99,102,241,0.35)' : 'none'
                  }}
                >
                  <Sparkles style={{ width:10, height:10 }} />
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={S.panel}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={S.iconWrap}>
            <BrainCircuit style={{ width:16, height:16, color:'#a5b4fc' }} className="animate-pulse" />
          </div>
          <div>
            <div style={{ fontSize:'11px', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
              AURA BRAIN
              {(() => {
                const lastAura = [...messages].reverse().find(m => m.sender === 'aura');
                const live = lastAura?.llmPowered;
                return (
                  <span style={{ fontSize:'8px', fontFamily:'monospace', fontWeight:700, padding:'2px 7px', borderRadius:'5px', background: live ? 'rgba(45,212,170,0.12)' : 'rgba(250,204,21,0.12)', color: live ? 'var(--emerald)' : '#facc15', border: `1px solid ${live ? 'rgba(45,212,170,0.2)' : 'rgba(250,204,21,0.25)'}` }}>{live ? 'ONLINE' : 'LOCAL'}</span>
                );
              })()}
            </div>
            <div style={{ fontSize:'9.5px', color:'var(--text-muted)', marginTop:'1px' }}>AI Design Co-pilot</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button
            onClick={() => setShowTelemetry(v => !v)}
            style={{
              padding:'5px', borderRadius:'8px', cursor:'pointer', transition:'all 0.18s',
              background: showTelemetry ? '#6366f1' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (showTelemetry ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'),
              color: showTelemetry ? 'white' : 'var(--text-muted)'
            }}
            title="Sub-Agent Telemetry"
          >
            <FileCode2 style={{ width:13, height:13 }} />
          </button>
          <button
            onClick={onClose}
            style={{ padding:'5px 10px', borderRadius:'8px', fontSize:'10px', fontWeight:700, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'var(--text-muted)', transition:'all 0.18s' }}
          >
            Hide
          </button>
        </div>
      </div>

      {/* ── Telemetry Drawer (honest, reflects real backend state) ── */}
      {showTelemetry && (() => {
        const lastAura = [...messages].reverse().find(m => m.sender === 'aura');
        const online = lastAura?.llmPowered;
        const model = lastAura?.model || 'offline-rule-engine';
        const toolCount = (lastAura?.toolCalls || []).length;
        return (
          <div style={{ background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 14px', fontFamily:'monospace', fontSize:'9.5px', color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap:'6px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'8px', color:'#a5b4fc', fontWeight:700, paddingBottom:'6px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span>ENGINE</span>
              <span style={{ color: online ? 'var(--emerald)' : '#facc15' }}>{online ? 'LLM ONLINE' : 'LOCAL RULE MODE'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#a5b4fc' }}>● AURA Orchestrator</span>
              <span style={{ color:'var(--text-muted)' }}>{String(model).replace('meta-llama/','LLaMA ')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#2DD4AA' }}>● Tool Router</span>
              <span style={{ color:'var(--text-muted)' }}>{toolCount} tool{toolCount===1?'':'s'} last turn</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#67E8F9' }}>● Project Memory</span>
              <span style={{ color:'var(--text-muted)' }}>{project?.name ? 'scoped' : 'global'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'8.5px', color:'var(--text-muted)', paddingTop:'6px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
              <span>Backend</span>
              <span>Express · SQLite</span>
            </div>
          </div>
        );
      })()}

      {/* ── AURA Design Proposals (rules-engine, grounded in real scene) ── */}
      {proposals && Array.isArray(proposals.actions) && proposals.actions.length > 0 && showProposals && (
        <div style={{ background:'rgba(99,102,241,0.06)', borderBottom:'1px solid rgba(99,102,241,0.18)', padding:'10px 14px', display:'flex', flexDirection:'column', gap:'7px', maxHeight:'38%', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'8.5px', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#a5b4fc' }}>AURA Design Proposals</span>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              {onRunReview && (
                <button onClick={onRunReview} title="Execute grounded, high-confidence proposals"
                  style={{ fontSize:'8.5px', fontWeight:800, padding:'2px 8px', borderRadius:'6px', cursor:'pointer', background:'#6366f1', color:'#fff', border:'none', display:'inline-flex', alignItems:'center', gap:'3px' }}>
                  Run Review
                </button>
              )}
              <button onClick={() => setShowProposals(false)} style={{ fontSize:'9px', color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer' }}>hide</button>
            </div>
          </div>
          {proposals.actions.map((a, i) => {
            const conf = Math.round((a.confidence || 0) * 100);
            return (
              <div key={i} style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:'9px', padding:'8px 9px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#c7d2fe' }}>{a.action.replace(/_/g,' ')}</span>
                  <span style={{ fontSize:'8.5px', fontFamily:'monospace', fontWeight:800, color: conf>=80 ? 'var(--emerald)' : conf>=60 ? '#F59E0B' : 'var(--text-muted)' }}>{conf}%</span>
                </div>
                <div style={{ height:'3px', borderRadius:'3px', background:'rgba(255,255,255,0.08)', marginBottom:'5px', overflow:'hidden' }}>
                  <div style={{ width:`${conf}%`, height:'100%', background: conf>=80 ? 'var(--emerald)' : '#F59E0B' }} />
                </div>
                <p style={{ fontSize:'9.5px', lineHeight:1.45, color:'rgba(255,255,255,0.72)', margin:'0 0 6px 0' }}>{a.reasoning}</p>
                <button
                  onClick={() => onProposalAction?.(a)}
                  style={{ fontSize:'9px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', cursor:'pointer', background:'#6366f1', color:'#fff', border:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}
                >Open in editor <ArrowRight style={{ width:9, height:9 }} /></button>
              </div>
            );
          })}
          <div style={{ fontSize:'8px', color:'var(--text-muted)', fontFamily:'monospace' }}>
            {proposals.retrieved?.materials ?? 0} materials · {proposals.retrieved?.corrections ?? 0} corrections · grounded in scene graph
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={S.msgArea}>
        {messages.map(renderBubble)}
        {isThinking && (
          <div style={{ display:'flex', flexDirection:'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'9px', color:'var(--text-muted)', paddingInline:'4px' }}>
              <span>AURA AI</span>
            </div>
            <div style={{
              padding: '10px 13px',
              borderRadius: '16px 16px 16px 4px',
              background: 'var(--surface-2)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'flex-start'
            }}>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        {isListening && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'#a5b4fc', fontSize:'11px', animation:'pulse 1s infinite' }}>
            <Mic style={{ width:14, height:14, color:'#818cf8' }} />
            <span>Listening... "Add wood floors..."</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Proactive Insights (dynamic, project-aware) ── */}
      <div style={S.suggestionsBar}>
        <span style={{ fontSize:'8.5px', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>
          AURA Insights
        </span>
        <div style={{ maxHeight:'92px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'3px' }}>
          {buildInsights(project).map((ins, i) => (
            <button
              key={i}
              onClick={() => setInputText(ins.prompt)}
              style={{
                textAlign:'left', fontSize:'10px', color: ins.tone === 'warn' ? '#fcd34d' : 'var(--text-secondary)', fontWeight:500,
                padding:'5px 8px', borderRadius:'7px', cursor:'pointer',
                background: ins.tone === 'warn' ? 'rgba(250,204,21,0.06)' : 'rgba(255,255,255,0.025)', border:'1px solid ' + (ins.tone === 'warn' ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.04)'),
                transition:'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.color='#c7d2fe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ins.tone === 'warn' ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = ins.tone === 'warn' ? '#fcd34d' : 'var(--text-secondary)'; }}
            >
              {ins.tone === 'warn' ? '⚠ ' : '💡 '}{ins.text}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Bar ── */}
      <form onSubmit={handleSend} style={S.inputRow}>
        <button
          type="button"
          onClick={simulateVoice}
          disabled={isThinking}
          style={{
            width:34, height:34, flexShrink:0, borderRadius:'10px', cursor: isThinking ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            background: isListening ? '#6366f1' : 'rgba(255,255,255,0.04)',
            border: '1px solid ' + (isListening ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'),
            color: isListening ? 'white' : 'var(--text-muted)',
            transition:'all 0.18s',
            animation: isListening ? 'pulse 0.8s infinite' : 'none',
            opacity: isThinking ? 0.5 : 1
          }}
          title="Voice input"
        >
          <Mic style={{ width:14, height:14 }} />
        </button>

        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isThinking ? "AURA is thinking..." : "Ask AURA to paint, place, or optimise..."}
          disabled={isThinking}
          style={{
            flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'10px', padding:'7px 12px', fontSize:'11.5px', color:'var(--text-primary)',
            outline:'none', fontFamily:'inherit', transition:'border-color 0.2s',
            opacity: isThinking ? 0.6 : 1
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          style={{
            width:34, height:34, flexShrink:0, borderRadius:'10px', cursor: (inputText.trim() && !isThinking) ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s',
            background: (inputText.trim() && !isThinking) ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
            border: '1px solid ' + ((inputText.trim() && !isThinking) ? 'transparent' : 'rgba(255,255,255,0.07)'),
            color: (inputText.trim() && !isThinking) ? '#060609' : 'var(--text-muted)',
            boxShadow: (inputText.trim() && !isThinking) ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
            opacity: isThinking ? 0.5 : 1
          }}
        >
          <Send style={{ width:13, height:13 }} />
        </button>
      </form>
    </div>
  );
}
