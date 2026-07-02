import React, { useState, useEffect } from 'react';
import { 
  Send, Mic, Sparkles, Lightbulb, ArrowUpRight, 
  CheckCircle2, BrainCircuit, Wand2, FileCode2 
} from 'lucide-react';

export default function AuraBrainChat({
  messages,
  onSendMessage,
  onExecuteAction,
  project,
  isOpen,
  onClose,
  ariaId = 'aura-brain-chat'
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showBrainTelemetry, setShowBrainTelemetry] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const headerId = `${ariaId}-header`;
  const messageListId = `${ariaId}-messages`;
  const inputId = `${ariaId}-input`;

  const ensureFocus = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  useEffect(() => {
    if (!isOpen || !hasInteracted) return;
    const el = document.getElementById(inputId);
    if (el) el.focus({ preventScroll: true });
  }, [isOpen, hasInteracted, inputId, showBrainTelemetry]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    ensureFocus();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const simulateVoice = () => {
    setIsListening(true);
    ensureFocus();
    setTimeout(() => {
      setIsListening(false);
      onSendMessage("Add a warm Chevron Herringbone oak floor material to this bedroom.");
    }, 2500);
  };

  const proactiveSuggestions = [
    "💡 Add a warm pendant light above the dining table (+350 Lux, CRI 98)",
    "💡 This east wall looks empty. I suggest backlit fluted wood rafters",
    "💡 The living rug is slightly small. Upgrade to 8x10 Berber?",
    "🎨 Extract a cohesive 5-color Japandi palette from the current mood board",
    "📊 The kitchen work triangle score is 96%. Optimize layout?",
    "🪴 Add 3 more Monstera plants for biophilic balance score +12 points"
  ];

  if (!isOpen) return null;

  return (
    <aside
      id={ariaId}
      role="complementary"
      aria-label="AURA AI Assistant chat panel"
      aria-labelledby={headerId}
      className="w-80 xl:w-96 border-l border-slate-800/80 flex flex-col h-full bg-[#080d18] shrink-0"
      style={{ background: 'linear-gradient(180deg, #070c17 0%, #040810 100%)' }}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <BrainCircuit className="w-4 h-4 animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <h3 id={headerId} className="font-bold text-xs text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              AURA BRAIN <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">ONLINE</span>
            </h3>
            <p className="text-[9px] text-slate-500">LLaMA 3.1 70B Orchestrator</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowBrainTelemetry(!showBrainTelemetry)}
            aria-pressed={showBrainTelemetry}
            className={`p-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1 ${
              showBrainTelemetry ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle sub-agent telemetry logs"
          >
            <FileCode2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 text-xs font-semibold px-2 transition"
            aria-label="Close AURA assistant panel"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Telemetry drawer if open */}
      {showBrainTelemetry && (
        <div
          className="bg-slate-900/90 border-b border-slate-800 p-3 font-mono text-[9px] text-slate-350 space-y-1.5 animate-in slide-in-from-top-2"
          aria-live="polite"
          aria-label="Sub-agent telemetry"
        >
          <div className="flex items-center justify-between text-[8px] text-indigo-400 font-semibold border-b border-slate-800 pb-1">
            <span>ACTIVE SUB-AGENTS</span>
            <span>LATENCY: 42ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400">● DesignAgent</span>
            <span className="text-slate-400">Style & Layout GNN</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-400">● SpatialAgent</span>
            <span className="text-slate-400">Traffic Pathfinding</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-400">● CommerceAgent</span>
            <span className="text-slate-400">Live API Pricing</span>
          </div>
          <div className="text-[8px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>Pinecone Vector RAG:</span>
            <span className="text-slate-400">50M+ Embeddings</span>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div
        id={messageListId}
        className="flex-grow overflow-y-auto p-4 space-y-4 font-sans"
        role="log"
        aria-live="polite"
        aria-label="AURA conversation"
        tabIndex={0}
      >
        {messages.map((m) => {
          if (m.sender === 'system') {
            return (
              <div key={m.id} className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-center">
                {m.text}
              </div>
            );
          }

          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 px-1">
                <span>{isUser ? (project?.clientName || 'Designer') : 'AURA AI Agent'}</span>
                <span aria-hidden="true">•</span>
                <span>{m.timestamp}</span>
              </div>

              <div className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-755 text-white rounded-br-none shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-250 rounded-bl-none shadow-lg'
              }`}>
                <p>{m.text}</p>

                {/* Executable AI Action Preview Box */}
                {m.actionPreview && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-bold text-[10px] text-indigo-300 flex items-center gap-1">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                        {m.actionPreview.title}
                      </span>
                      {m.actionPreview.costImpact !== 0 && (
                        <span className={`text-[10px] font-mono font-bold ${m.actionPreview.costImpact < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {m.actionPreview.costImpact < 0 ? `-$${Math.abs(m.actionPreview.costImpact)}` : `+$${m.actionPreview.costImpact}`}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1 py-1 text-[10px]" aria-label="Proposed changes">
                      {m.actionPreview.changes.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-350 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>Visual Impact:</span>
                      <span className="text-amber-400 font-bold" aria-label={`${Math.round(m.actionPreview.visualQualityImpact)} out of 5 impact`}>
                        {'★'.repeat(Math.round(m.actionPreview.visualQualityImpact))}
                        <span className="text-slate-700">{'★'.repeat(5 - Math.round(m.actionPreview.visualQualityImpact))}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Buttons to accept / modify */}
                {m.actions && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    {m.actions.map((act) => (
                      <button
                        key={act.actionId}
                        type="button"
                        onClick={() => onExecuteAction(act.actionId, m.actionPreview)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                          act.variant === 'primary'
                            ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                        aria-label={`${act.label} for ${m.actionPreview?.title || act.actionId}`}
                      >
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isListening && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-[11px] animate-pulse">
            <Mic className="w-4 h-4 text-indigo-400 animate-ping" aria-hidden="true" />
            <span>Listening to voice command...</span>
          </div>
        )}
      </div>

      {/* Proactive Suggestions Drawer */}
      <div className="p-3 bg-slate-900/50 border-t border-slate-850/80 space-y-1.5">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">AURA Proactive Insights</span>
        <div className="max-h-24 overflow-y-auto space-y-1 text-[10px] text-slate-350 pr-1">
          {proactiveSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const text = sug.replace(/^[\u{1F4A1}\u{1F3A8}\u{1F4CA}\u{1FAB4}]\s*/, '');
                setInputText(text);
              }}
              className="w-full text-left p-1.5 bg-slate-950/40 border border-slate-850/60 rounded-lg hover:border-indigo-500/40 hover:text-indigo-200 transition text-ellipsis truncate block"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-850 bg-slate-950 flex gap-2">
        <button
          type="button"
          onClick={simulateVoice}
          aria-label="Start voice input"
          className={`p-2 rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
            isListening
              ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse animate-duration-500'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-4 h-4" aria-hidden="true" />
        </button>

        <label htmlFor={inputId} className="sr-only">Ask AURA a design question</label>
        <input
          id={inputId}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AURA to paint, place, or configure..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 placeholder-slate-550 outline-none focus:border-[#D4AF37]"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2 rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
            inputText.trim()
              ? 'bg-[#D4AF37] text-slate-950 hover:bg-[#e6c045]'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
          aria-label="Send message to AURA"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </aside>
  );
}
