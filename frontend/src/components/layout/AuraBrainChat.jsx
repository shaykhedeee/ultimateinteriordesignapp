import React, { useState } from 'react';
import {
  Send, Mic, Sparkles, Lightbulb, ArrowUpRight,
  CheckCircle2, BrainCircuit, Wand2, FileCode2, RefreshCcw
} from 'lucide-react';

export default function AuraBrainChat({
  messages,
  onSendMessage,
  onExecuteAction,
  onRetryMessage,
  project,
  providerStatus,
  isOpen,
  onClose
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showBrainTelemetry, setShowBrainTelemetry] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState(null);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    const sentId = `msg-${Date.now()}`;
    setPendingMessageId(sentId);
    setIsAiTyping(true);
    try {
      if (onSendMessage) await onSendMessage(text);
    } finally {
      setIsAiTyping(false);
      setPendingMessageId(prev => (prev === sentId ? null : prev));
    }
  };

  const handleRetry = async (m) => {
    if (!onRetryMessage) return;
    setPendingMessageId(m.id);
    setIsAiTyping(true);
    try {
      await onRetryMessage(m.originalText || m.text, m.id);
    } finally {
      setIsAiTyping(false);
      setPendingMessageId(prev => (prev === m.id ? null : prev));
    }
  };

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last && last.sender === 'aura' && last.actions && last.actions.length > 0 && !last.executedActions) {
      const safeActions = last.actions.filter(a => a.variant !== 'destructive');
      if (safeActions.length > 0 && onExecuteAction) {
        onExecuteAction(safeActions[0].actionId, last.actionPreview);
      }
    }
  }, [messages, onExecuteAction]);

  useEffect(() => {
    const el = document.getElementById('aura-chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isAiTyping]);

  const proactiveSuggestions = [
    "💡 Add a warm pendant light above the dining table (+350 Lux, CRI 98)",
    "💡 This east wall looks empty. I suggest backlit fluted wood rafters",
    "💡 The living rug is slightly small. Upgrade to 8x10 Berber?",
    "🎨 Extract a cohesive 5-color Japandi palette from the current mood board",
    "📊 The kitchen work triangle score is 96%. Optimize layout?",
    "🪴 Add 3 more Monstera plants for biophilic balance score +12 points"
  ];

  if (!isOpen) return null;

  const renderStatusPill = (status) => {
    if (status === 'sending') return <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">SENDING</span>;
    if (status === 'sent') return <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">SENT</span>;
    if (status === 'error') return <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">ERROR</span>;
    return null;
  };

  return (
    <div className="w-80 xl:w-96 border-l border-slate-800/80 flex flex-col h-full bg-[#080d18] shrink-0" style={{ background: 'linear-gradient(180deg, #070c17 0%, #040810 100%)' }}>
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              AURA BRAIN <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">ONLINE</span>
              {providerStatus && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {providerStatus.provider || providerStatus.fallbackProvider || 'LLM'}
                </span>
              )}
            </h3>
            <p className="text-[9px] text-slate-500">Tiny LLM Orchestrator</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBrainTelemetry(!showBrainTelemetry)}
            className={`p-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1 ${
              showBrainTelemetry ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Sub-Agent Telemetry Logs"
          >
            <FileCode2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 text-xs font-semibold px-2 transition"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Telemetry drawer if open */}
      {showBrainTelemetry && (
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 font-mono text-[9px] text-slate-350 space-y-1.5 animate-in slide-in-from-top-2">
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
      <div className="flex-grow overflow-y-auto p-4 space-y-4 font-sans">
        {messages.map((m) => {
          if (m.sender === 'system') {
            return (
              <div key={m.id} className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-center">
                {m.text}
              </div>
            );
          }

          const isUser = m.sender === 'user';
          const isErrored = m.status === 'error';
          const isStreaming = m.isPartial || m.isStreaming;
          const provider = m.provider || m.providerMeta?.provider;
          const model = m.providerMeta?.model || m.model;

          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 px-1">
                <span>{isUser ? (project?.clientName || 'Designer') : 'AURA AI Agent'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
                <span className="ml-1">{renderStatusPill(m.status)}</span>
                {!isUser && provider ? (
                  <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[8px] text-slate-300">
                    {provider === 'openrouter' ? `OpenRouter/${model || 'meta-llama'}` : provider}
                  </span>
                ) : null}
              </div>

              <div className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-755 text-white rounded-br-none shadow-md'
                  : isErrored
                    ? 'bg-rose-950/60 border border-rose-500/30 text-slate-200 rounded-bl-none shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-250 rounded-bl-none shadow-lg'
              }`}>
                <div className="flex items-start gap-2">
                  <p className="flex-1">
                    {isStreaming && !isUser ? (
                      <span className={isStreaming ? 'animate-pulse' : ''}>
                        {m.text}
                        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#D4AF37] align-middle animate-pulse" />
                      </span>
                    ) : (
                      <span className={isStreaming ? 'animate-pulse' : ''}>
                        {m.text}
                        {isErrored ? (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <button
                              onClick={() => handleRetry(m)}
                              className="text-[10px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded px-1.5 py-0.5 transition"
                              title="Retry"
                            >
                              <RefreshCcw className="w-3 h-3 inline mr-0.5" />
                              Retry
                            </button>
                          </span>
                        ) : null}
                      </span>
                    )}
                  </p>
                </div>

                {/* Executable AI Action Preview Box */}
                {m.actionPreview && !isErrored ? (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/85 border border-indigo-500/30 text-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-bold text-[10px] text-indigo-300 flex items-center gap-1">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        {m.actionPreview.title}
                      </span>
                      {m.actionPreview.costImpact !== 0 ? (
                        <span className={`text-[10px] font-mono font-bold ${m.actionPreview.costImpact < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {m.actionPreview.costImpact < 0 ? `-$${Math.abs(m.actionPreview.costImpact)}` : `+$${m.actionPreview.costImpact}`}
                        </span>
                      ) : null}
                    </div>

                    <ul className="space-y-1 py-1 text-[10px]">
                      {(m.actionPreview.changes || []).map((change, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-350 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>Visual Impact:</span>
                      <span className="text-amber-400 font-bold">
                        {'★'.repeat(Math.round(m.actionPreview.visualQualityImpact || 0))}
                        <span className="text-slate-700">{'★'.repeat(5 - Math.round(m.actionPreview.visualQualityImpact || 0))}</span>
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Buttons to accept / modify */}
                {m.actions && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    {m.actions.map((act) => (
                      <button
                        key={act.actionId}
                        onClick={() => onExecuteAction && onExecuteAction(act.actionId, m.actionPreview)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition ${
                          act.variant === 'primary'
                            ? 'bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 shadow-md shadow-[#D4AF37]/10'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiTyping && (
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed bg-slate-900 border border-slate-800 text-slate-250 rounded-bl-none shadow-lg">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:300ms]" />
                </span>
                <span className="text-[10px] text-slate-500">AURA is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {isListening && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-[11px] animate-pulse">
            <Mic className="w-4 h-4 text-indigo-400 animate-ping" />
            <span>Listening to voice command... "Add wood floors..."</span>
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
              onClick={() => {
                const text = sug.replace(/^💡\s*|^🎨\s*|^📊\s*|^🪴\s*/, '');
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
          className={`p-2 rounded-xl border transition ${
            isListening
              ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse animate-duration-500'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Click to dictate design instructions"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AURA to paint, place, or configure..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 placeholder-slate-550 outline-none focus:border-[#D4AF37]"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2 rounded-xl transition ${
            inputText.trim()
              ? 'bg-[#D4AF37] text-slate-950 hover:bg-[#e6c045]'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
