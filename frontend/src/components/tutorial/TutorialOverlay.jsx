import React, { useEffect, useMemo, useState } from 'react';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Ultimate Interior Design',
    body: 'This app lets you manage projects, drafts, renders, materials, production cutlists, and AI-assisted design in one workspace.',
  },
  {
    id: 'projects',
    title: 'Start from a project',
    body: 'Pick or create a project. Project gating keeps data organized and ensures every tool has the right context.',
  },
  {
    id: 'brief',
    title: 'Client brief intake',
    body: 'Capture budget, rooms, finishes, appliances, and style tags in the Client Brief workspace.',
  },
  {
    id: 'cad',
    title: '2D drafting and floor plans',
    body: 'Use the CAD workspace for walls, openings, zones, and scale-ready measurements.',
  },
  {
    id: 'studio',
    title: 'Design studio and catalog',
    body: 'Place furniture from the catalog, refine layouts, and iterate with AI assists.',
  },
  {
    id: 'renders',
    title: 'Render and edit',
    body: 'Generate renders, switch modes, and use Render Edit Suite for localized edits without rerendering the full scene.',
  },
  {
    id: 'library',
    title: 'Growing reuse library',
    body: 'Save style references from Pinterest Learning and reuse catalog items across projects.',
  },
  {
    id: 'settings',
    title: 'Providers and whitelabel',
    body: 'Choose execution providers, cost guardrails, and whitelabel branding for professional export.',
  },
];

export default function TutorialOverlay({ onClose, onFinished }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const step = TUTORIAL_STEPS[index] || TUTORIAL_STEPS[0];
  const isLast = index === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    const seen = localStorage.getItem('tutorialSeen');
    if (seen) {
      onFinished?.();
      onClose?.();
    }
  }, []);

  const finish = () => {
    localStorage.setItem('tutorialSeen', 'true');
    onFinished?.();
    onClose?.();
  };

  const next = () => {
    if (isLast) return finish();
    setIndex(i => i + 1);
  };

  const skip = () => finish();

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="max-w-xl w-full mx-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Tutorial</div>
            <div className="text-[9px] text-slate-500">{step.id}</div>
          </div>
          <button onClick={skip} className="text-[10px] text-slate-400 hover:text-slate-200">Skip</button>
        </div>
        <h3 className="text-sm font-bold text-slate-100 mb-2">{step.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-[#D4AF37]' : 'w-2 bg-slate-800'}`} />
            ))}
          </div>
          <button
            onClick={next}
            className="text-[11px] bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-bold px-4 py-2 rounded-xl transition"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
