import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/api.js';
import {
  Send, Mic, Sparkles, Lightbulb, ArrowUpRight,
  CheckCircle2, BrainCircuit, Wand2, FileCode2, RefreshCcw, AlertTriangle
} from 'lucide-react';

const COMMAND_TOOL_SUGGESTIONS = [
  { id: 'floorplan', label: 'Analyze floor plan', command: 'Analyze the uploaded floor plan and identify rooms, walls, doors, windows, and measurements.' },
  { id: 'scene', label: 'Stage modular furniture', command: 'Stage modular furniture for the current project using the approved floor plan.' },
  { id: 'render', label: 'Generate AI render', command: 'Generate a professional AI render for the current room using the selected furniture and materials.' },
  { id: 'elevation', label: 'Create elevations', command: 'Generate measured 2D elevations for the current scene.' },
  { id: 'materials', label: 'Explore materials', command: 'Suggest material and laminate options for the current design.' },
  { id: 'cutlist', label: 'Check cutlist', command: 'Calculate the current modular furniture cutlist and flag missing dimensions.' },
  { id: 'quote', label: 'Prepare quotation', command: 'Prepare a scene-linked quotation with GST and material costs.' },
  { id: 'delivery', label: 'Build delivery pack', command: 'Build the client presentation and delivery pack for the current project.' }
];

export default function AuraBrainChat({
  messages,
  onSendMessage,
  onExecuteAction,
  onRetryMessage,
  project,
  providerStatus: externalProviderStatus,
  isOpen,
  onClose
}) {
  const [providerStatus, setProviderStatus] = useState(externalProviderStatus || null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const base = apiUrl('');
        const res = await fetch(`${base}/providers/status`);
        const data = await res.json();
        if (!cancelled) setProviderStatus(data);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const [activeAgentTab, setActiveAgentTab] = useState('copilot'); // 'copilot' or 'floorplan'
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showBrainTelemetry, setShowBrainTelemetry] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState(null);

  // Design Agent State
  const [stylePrompt, setStylePrompt] = useState('');
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, running, success, error
  const [agentError, setAgentError] = useState('');
  const [agentOutput, setAgentOutput] = useState(null);
  const [stepperState, setStepperState] = useState(''); // validations, planning, saving, rendering
  const [agentOutputsHistory, setAgentOutputsHistory] = useState([]);

  const loadAgentOutputsHistory = async () => {
    if (!project?.id) return;
    try {
      const base = apiUrl('');
      const res = await fetch(`${base}/projects/${project.id}/ai/floorplan-agent/outputs`);
      if (res.ok) {
        const data = await res.json();
        setAgentOutputsHistory(data.outputs || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (project?.id) loadAgentOutputsHistory();
  }, [project?.id]);

  const handleRunAgent = async (e) => {
    if (e) e.preventDefault();
    if (!stylePrompt.trim() || !project?.id) return;

    setAgentStatus('running');
    setAgentError('');
    setAgentOutput(null);

    // Step 1: Input Guardrails & Plan Validation
    setStepperState('validations');
    await new Promise(r => setTimeout(r, 1500)); // Visual spacing for realistic co-pilot pacing

    try {
      const base = apiUrl('');
      const res = await fetch(`${base}/projects/${project.id}/ai/floorplan-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylePrompt })
      });

      const data = await res.json();
      if (!res.ok || data.tripwireTriggered || !data.success) {
        setAgentStatus('error');
        setAgentError(data.error || 'Failed to complete agent execution due to validation check.');
        return;
      }

      // Step 2: Planning
      setStepperState('planning');
      await new Promise(r => setTimeout(r, 1200));

      // Step 3: Saving to DB
      setStepperState('saving');
      await new Promise(r => setTimeout(r, 1000));

      // Step 4: Launching Renders
      setStepperState('rendering');
      await new Promise(r => setTimeout(r, 1200));

      setAgentOutput(data.designData);
      setAgentStatus('success');
      loadAgentOutputsHistory();
    } catch (err) {
      setAgentStatus('error');
      setAgentError(err.message || 'Network error executing agent.');
    }
  };

  const simulateVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsListening(true);
      window.setTimeout(() => setIsListening(false), 1800);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setInputText(event.results?.[0]?.[0]?.transcript || '');
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const runSuggestedTool = async (suggestion) => {
    if (!onSendMessage || !project?.id) return setInputText(suggestion.command);
    setPendingMessageId(`suggestion-${suggestion.id}-${Date.now()}`);
    setIsAiTyping(true);
    try { await onSendMessage(suggestion.command); }
    finally { setIsAiTyping(false); setPendingMessageId(null); }
  };

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

  if (!isOpen) return null;

  const renderStatusPill = (status) => {
    if (status === 'sending') return <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">SENDING</span>;
    if (status === 'sent') return <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">SENT</span>;
    if (status === 'error') return <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">ERROR</span>;
    return null;
  };

  return (
    <div className="ultida-aura-chat w-80 xl:w-96 border-l border-slate-800/80 flex flex-col h-full bg-[#080d18] shrink-0" style={{ background: 'linear-gradient(180deg, #070c17 0%, #040810 100%)' }}>
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              AURA BRAIN <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">{providerStatus && (providerStatus.auraChatReady || providerStatus.liveImageGenReady || providerStatus.configured || providerStatus.fallbackAvailable || providerStatus.providers) ? 'ONLINE' : 'OFFLINE'}</span>
              {providerStatus && (
                <>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    {providerStatus.provider || providerStatus.fallbackProvider || 'LLM'}
                  </span>
                </>
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

      {/* Interactive Agent Tabs */}
      <div className="flex border-b border-slate-800/60 bg-slate-950/30 p-1 gap-1">
        <button
          onClick={() => setActiveAgentTab('copilot')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
            activeAgentTab === 'copilot' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Co-Pilot Chat
        </button>
        <button
          onClick={() => setActiveAgentTab('floorplan')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
            activeAgentTab === 'floorplan' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Floorplan Agent
        </button>
      </div>

      {/* Telemetry drawer if open */}
      {showBrainTelemetry && (
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 font-mono text-[9px] text-slate-300 space-y-1.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-[8px] text-indigo-400 font-semibold border-b border-slate-800 pb-1">
            <span>ACTIVE SUB-AGENTS</span>
            <span>LATENCY: 42ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400">● DesignAgent</span>
            <span className="text-slate-400">Style & Layout GNN</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-400">● FloorplanChecker</span>
            <span className="text-slate-400">Multimodal Guardrail</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-purple-400">● ImageGenerationTool</span>
            <span className="text-slate-400">Flux Image Render Queue</span>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {activeAgentTab === 'copilot' ? (
        <>
          {/* Chat Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 font-sans" id="aura-chat-messages">
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
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md'
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
                                  <RefreshCcw className="w-3.5 h-3.5 inline mr-0.5" />
                                  Retry
                                </button>
                              </span>
                            ) : null}
                          </span>
                        )}
                      </p>
                    </div>

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

          {/* Suggestions footer */}
          <div className="p-3 bg-slate-950/95 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Command Center actions</span>
              <span className="text-[9px] text-slate-600 truncate max-w-[120px]">{project?.name || 'Select a project'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
              {COMMAND_TOOL_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => runSuggestedTool(suggestion)}
                  disabled={isAiTyping}
                  title={suggestion.command}
                  className="text-left px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition disabled:opacity-50"
                >
                  <span className="block text-[10px] font-bold text-slate-200 truncate">{suggestion.label}</span>
                  <span className="block text-[8px] text-slate-500 truncate">Run with AURA</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <button
              type="button"
              onClick={simulateVoice}
              className={`p-2 rounded-xl border transition ${
                isListening
                  ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Click to dictate design instructions"
            >
              <Mic className="w-4.5 h-4.5" />
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
        </>
      ) : (
        /* Floorplan Agent Tab */
        <div className="flex-grow overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {/* Active Floorplan Preview */}
          {project?.floorplanUrl || project?.floorplan_url ? (
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold mb-1.5 self-start uppercase tracking-wider">Active Floorplan</span>
              <img
                src={apiUrl(project.floorplanUrl || project.floorplan_url)}
                alt="Floorplan"
                className="max-h-28 object-contain rounded-lg border border-slate-850 bg-[#060a14] p-1"
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold block text-[10px] uppercase">No Floorplan Uploaded</span>
                <span className="text-[10.5px] mt-0.5 block leading-relaxed text-slate-300">Please upload a blueprint or floorplan image under the project settings first.</span>
              </div>
            </div>
          )}

          {/* Stepper Guardrails Warning */}
          {agentStatus === 'error' && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold block text-[10px] uppercase text-rose-400 tracking-wider">Input Guardrail Tripwire Triggered</span>
                  <p className="mt-1 leading-relaxed text-slate-350 text-[10.5px] font-medium">{agentError}</p>
                </div>
              </div>
              <button
                onClick={() => setAgentStatus('idle')}
                className="w-full py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[9px] uppercase transition"
              >
                Dismiss & Retry
              </button>
            </div>
          )}

          {/* Stepper Status Indicators */}
          {agentStatus === 'running' && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-[10px] font-bold text-indigo-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                Agent Execution Loop
              </h4>
              <ul className="space-y-2 text-[9.5px] font-mono">
                <li className={`flex items-center gap-2 ${stepperState === 'validations' ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span>{stepperState === 'validations' ? '●' : '✓'} Ingesting & Validating Guardrails...</span>
                </li>
                <li className={`flex items-center gap-2 ${stepperState === 'planning' ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span>{stepperState === 'planning' ? '●' : ['saving', 'rendering'].includes(stepperState) ? '✓' : '○'} Planning Space Design & Rooms...</span>
                </li>
                <li className={`flex items-center gap-2 ${stepperState === 'saving' ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span>{stepperState === 'saving' ? '●' : stepperState === 'rendering' ? '✓' : '○'} Invoking save_design_data_to_database...</span>
                </li>
                <li className={`flex items-center gap-2 ${stepperState === 'rendering' ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span>{stepperState === 'rendering' ? '●' : '○'} Invoking ImageGenerationTool...</span>
                </li>
              </ul>
            </div>
          )}

          {/* Design Form Input */}
          {agentStatus === 'idle' && (
            <form onSubmit={handleRunAgent} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-550 block mb-1 uppercase tracking-wider font-mono">Design Style Prompt</label>
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="e.g., Tudor period with oak woodwork and warm neutral fabrics..."
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/80 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!stylePrompt.trim() || !(project?.floorplanUrl || project?.floorplan_url)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-650/15"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Run Floorplan Agent
              </button>
            </form>
          )}

          {/* Agent Design Output Card */}
          {agentStatus === 'success' && agentOutput && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="font-bold text-[9px] text-indigo-400 uppercase tracking-wider flex items-center gap-1"><Wand2 className="w-3.5 h-3.5 text-indigo-400" /> Design Proposal</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono font-bold border border-emerald-500/30">SAVED</span>
                </div>
                <h4 className="font-bold text-sm text-slate-200">{agentOutput.design_style}</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">{agentOutput.final_description}</p>

                {/* Palette */}
                <div className="pt-1.5">
                  <span className="text-[9px] text-slate-550 font-bold block mb-1.5 uppercase tracking-wider">Color Palette</span>
                  <div className="flex gap-2">
                    {(agentOutput.color_palette || []).map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded border border-slate-800 shadow-sm" style={{ backgroundColor: color }} />
                        <span className="text-[8px] font-mono text-slate-550">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Furniture */}
                <div className="pt-1.5">
                  <span className="text-[9px] text-slate-550 font-bold block mb-1.5 uppercase tracking-wider">Recommended Furniture</span>
                  <div className="flex flex-wrap gap-1">
                    {(agentOutput.furniture || []).map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-850 border border-slate-800 text-slate-350 text-[9px] font-medium">{item}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Planned Rooms */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider block px-1">Planned Rooms</span>
                {(agentOutput.rooms || []).map((room, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1">
                    <h5 className="font-bold text-xs text-slate-300">{room.name}</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{room.description}</p>
                    <div className="text-[9px] text-slate-500 pt-1 flex items-center gap-1">
                      <span className="font-bold">Functional Needs:</span>
                      <span>{room.functionalNeeds}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Info Box */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Images Queued Successfully</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 pl-5">The ImageGenerationTool has dispatched photorealistic render jobs for planned rooms. You can monitor and view them under the 3D Studio screen.</p>
              </div>

              <button
                onClick={() => { setAgentStatus('idle'); setStylePrompt(''); }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase transition"
              >
                Create Another Design
              </button>
            </div>
          )}

          {/* Design History List */}
          {agentOutputsHistory.length > 0 && agentStatus === 'idle' && (
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-1">Past Agent Proposals</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agentOutputsHistory.map((out) => (
                  <button
                    key={out.id}
                    onClick={() => { setAgentOutput(out); setAgentStatus('success'); }}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="block font-bold text-slate-350 text-[10.5px]">{out.design_style}</span>
                      <span className="block text-[8.5px] text-slate-550 mt-0.5">{new Date(out.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[9px] text-indigo-400 font-bold hover:underline">View Plan →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
