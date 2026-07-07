import React, { useState } from 'react';
import { ChatMessage, Project } from '../types/aura';
import { 
  Send, 
  Mic, 
  Sparkles, 
  Lightbulb, 
  ArrowUpRight, 
  CheckCircle2, 
  BrainCircuit,
  Wand2,
  FileCode2
} from 'lucide-react';

interface AuraBrainChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onExecuteAction: (actionId: string, actionPreview?: ChatMessage['actionPreview']) => void;
  project: Project;
}

export const AuraBrainChat: React.FC<AuraBrainChatProps> = ({
  messages,
  onSendMessage,
  onExecuteAction,
  project
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showBrainTelemetry, setShowBrainTelemetry] = useState(false);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const simulateVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      onSendMessage("Rotate the living room sofa 45 degrees towards the window and make the wall oak.");
    }, 2500);
  };

  const proactiveSuggestions = [
    "💡 Add a warm pendant light above the dining table (+350 Lux, CRI 98)",
    "💡 This east wall looks empty. I suggest a gallery wall or floating oak shelves",
    "💡 The living rug is slightly small for this seating. Upgrade to 8x10 Berber?",
    "🎨 Extract a cohesive 5-color Japandi palette from the current mood board",
    "📊 The kitchen work triangle score is 96%. Want me to optimize further?",
    "🪴 Add 3 more Monstera plants for biophilic balance score +12 points"
  ];

  return (
    <div className="w-full lg:w-80 xl:w-96 glass-panel border-l border-slate-800/80 flex flex-col h-[calc(100vh-53px)] bg-slate-950/95 shrink-0">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              AURA BRAIN <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">ONLINE</span>
            </h3>
            <p className="text-[10px] text-slate-400">LLaMA 3.1 70B Orchestrator</p>
          </div>
        </div>
        <button
          onClick={() => setShowBrainTelemetry(!showBrainTelemetry)}
          className={`p-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1 ${
            showBrainTelemetry ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Sub-Agent Telemetry Logs"
        >
          <FileCode2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Telemetry drawer if open */}
      {showBrainTelemetry && (
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 font-mono text-[11px] text-slate-300 space-y-1.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-[10px] text-indigo-400 font-semibold border-b border-slate-800 pb-1">
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
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>Pinecone Vector RAG:</span>
            <span className="text-slate-300">50M+ Embeddings</span>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {messages.map((m) => {
          if (m.sender === 'system') {
            return (
              <div key={m.id} className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono text-center">
                {m.text}
              </div>
            );
          }

          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <span>{isUser ? project.clientName : 'AURA AI Agent'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>
              
              <div className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                isUser 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
              }`}>
                <p>{m.text}</p>

                {/* Executable AI Action Preview Box */}
                {m.actionPreview && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="font-bold text-[11px] text-indigo-300 flex items-center gap-1">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        {m.actionPreview.title}
                      </span>
                      {m.actionPreview.costImpact !== 0 && (
                        <span className={`text-[11px] font-mono font-bold ${m.actionPreview.costImpact < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {m.actionPreview.costImpact < 0 ? `-$${Math.abs(m.actionPreview.costImpact)}` : `+$${m.actionPreview.costImpact}`}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1 py-1 text-[11px]">
                      {m.actionPreview.changes.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Visual Impact:</span>
                      <span className="text-amber-400 font-bold">
                        {'★'.repeat(Math.round(m.actionPreview.visualQualityImpact))}
                        <span className="text-slate-600">{'★'.repeat(5 - Math.round(m.actionPreview.visualQualityImpact))}</span>
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
                        onClick={() => onExecuteAction(act.actionId, m.actionPreview)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition ${
                          act.variant === 'primary'
                            ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20'
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

        {isListening && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-xs animate-pulse">
            <Mic className="w-4 h-4 text-indigo-400 animate-ping" />
            <span>Listening to voice command... "Rotate sofa 45 degrees..."</span>
          </div>
        )}
      </div>

      {/* Proactive Smart Suggestions */}
      <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-900/30 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" /> Proactive Suggestions
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
          {proactiveSuggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(sug.replace("💡 ", ""))}
              className="w-full text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-indigo-300 transition flex items-center justify-between group"
            >
              <span className="truncate pr-2">{sug}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Multimodal Quick Triggers + Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          <button 
            onClick={() => onSendMessage("Show me how this looks in warm Japandi style")}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
          >
            🎨 Style Transfer
          </button>
          <button 
            onClick={() => onSendMessage("What's the total cost so far and suggest budget alternatives")}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
          >
            💰 Cost Breakdown
          </button>
          <button 
            onClick={() => onSendMessage("Generate 3 alternative furniture arrangements")}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
          >
            🔄 3 Alternate Layouts
          </button>
        </div>

        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or speak design command..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition pr-20"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={simulateVoice}
              className={`p-1.5 rounded-lg transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              title="Voice Command"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
