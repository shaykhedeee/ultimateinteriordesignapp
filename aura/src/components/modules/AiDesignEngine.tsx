import React, { useState } from 'react';
import { DesignOption } from '../../types/aura';
import { MOCK_DESIGN_OPTIONS } from '../../data/mockData';
import { 
  Wand2, 
  CheckCircle2, 
  ArrowRight, 
  Brain,
  Award,
  RefreshCw,
  Heart
} from 'lucide-react';

interface AiDesignEngineProps {
  onSelectOption: (option: DesignOption) => void;
  activeOptionId: string;
}

export const AiDesignEngine: React.FC<AiDesignEngineProps> = ({
  onSelectOption,
  activeOptionId
}) => {
  const [briefInput, setBriefInput] = useState('Modern living room, warm tones, family with 2 kids, budget $15K, love indoor plants and natural light.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Japandi Wabi-Sabi');
  const [showStyleQuiz, setShowStyleQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);

  const styleTags = [
    'Japandi Wabi-Sabi',
    'Modern Minimalist',
    'Mid-Century Modern',
    'Scandinavian',
    'Industrial',
    'Art Deco',
    'Bohemian Biophilic',
    'Contemporary Indian'
  ];

  const quizImages = [
    { title: 'Zen Slatted Wood & Calm Tones', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80', tag: 'Japandi Wabi-Sabi' },
    { title: 'Rich Walnut & Camel Leather Statement', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80', tag: 'Mid-Century Modern' },
    { title: 'Crisp White & Airy Nordic Pine', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80', tag: 'Scandinavian' }
  ];

  const handleRunGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Generation Complete: 3 Ranked Layout Alternatives created matching your exact constraints and Vastu principles.');
    }, 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <div className="glass-panel-accent p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono">
            <Brain className="w-3.5 h-3.5 text-indigo-400" /> AURA DESIGN GENERATION ENGINE (50M+ Styles)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            60-Second Auto-Design: Intent to Photorealistic Home
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Input natural language constraints or take our Style DNA Quiz. The AURA GNN maps structural boundaries, ergonomics, and real vendor availability to generate ranked alternatives.
          </p>
        </div>

        <button
          onClick={() => setShowStyleQuiz(!showStyleQuiz)}
          className="relative z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-current animate-pulse" />
          <span>Take AI Style DNA Quiz</span>
        </button>
      </div>

      {/* Style Quiz Drawer if toggled */}
      {showStyleQuiz && (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/40 bg-purple-950/20 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-purple-200">
              AI Style Quiz: Which interior speaks to your aesthetic? ({quizIndex + 1}/3)
            </h3>
            <button onClick={() => setShowStyleQuiz(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quizImages.map((img, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setSelectedStyle(img.tag);
                  if (quizIndex < 2) setQuizIndex(quizIndex + 1);
                  else { setShowStyleQuiz(false); alert(`Style DNA Profile Calculated: ${img.tag}. Updating generated options.`); }
                }}
                className="group relative aspect-4/3 rounded-2xl overflow-hidden cursor-pointer border-2 border-slate-800 hover:border-purple-500 transition shadow-lg"
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white">
                  {img.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints & Brief Form */}
      <form onSubmit={handleRunGeneration} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-indigo-400" /> Step 1: Constraint & Brief Mapping
          </label>
          <span className="text-xs text-slate-400 font-mono">Realtime Constraint Parser</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            placeholder="e.g. Modern living room, warm tones, family with 2 kids, budget $15K, love plants"
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate 3 Alternatives'}</span>
          </button>
        </div>

        {/* Style selection chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-slate-400 mr-1 font-mono">Preferred Style Blend:</span>
          {styleTags.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setSelectedStyle(style)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedStyle === style 
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </form>

      {/* Step 2: Generated Layout Options Ranked by AI Score */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Ranked AI Layout Alternatives (Scored on Flow, Balance & Code)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Auto-BOQ Linked</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MOCK_DESIGN_OPTIONS.map((opt) => {
            const isActive = opt.id === activeOptionId;
            return (
              <div
                key={opt.id}
                onClick={() => onSelectOption(opt)}
                className={`group glass-panel rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                }`}
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-950">
                    <img 
                      src={opt.thumbnail} 
                      alt={opt.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur font-mono text-xs font-bold text-white border border-slate-800">
                      {opt.name.split(' ')[0]} {opt.name.split(' ')[1]}
                    </div>
                    
                    {/* Score Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-emerald-500/90 text-slate-950 font-mono text-xs font-extrabold shadow">
                      Score: {opt.score}/100
                    </div>

                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-indigo-600/90 text-white font-mono text-xs font-bold shadow">
                      ${opt.totalCost.toLocaleString()}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-100">{opt.styleName}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {opt.vibe.split(',')[0]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {opt.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">AI Rationale & Highlights:</div>
                      {opt.highlights.map((high, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{high}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelectOption(opt); }}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{isActive ? 'Active Option (In Viewport)' : 'Select & Customize Option'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
