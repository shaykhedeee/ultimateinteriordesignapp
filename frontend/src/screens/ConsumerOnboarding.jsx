import React, { useState } from 'react';
import { apiUrl } from '../utils/api.js';
import { useAppStore } from '../stores/appStore';
import {
  ChevronRight, ChevronLeft, CheckCircle2, Sparkles, LayoutDashboard, Palette, IndianRupee, ArrowRight, Upload
} from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to ULTIDA',
    subtitle: 'ULTIMATE INTERIOR DESIGN APP',
    description: 'Your production-grade interior design workspace. Choose how you want to start.',
    icon: <Sparkles className="w-6 h-6 text-[#D4AF37]" />
  },
  {
    id: 'role',
    title: 'How do you work?',
    subtitle: 'Pick your primary role',
    description: 'We tailor the workspace and defaults to how you actually operate.',
    options: [
      { id: 'firm_owner', label: 'Firm Owner / Lead Designer', hint: 'Branding, templates, vendor control, pricing' },
      { id: 'designer', label: 'Interior Designer', hint: 'Sites, renders, materials, drawings' },
      { id: 'client', label: 'Client / End User', hint: 'Brief, previews, approvals, simple walkthrough' },
      { id: 'contractor', label: 'Contractor / Production', hint: 'Cutlist, DXF, timelines, BOQs' }
    ]
  },
  {
    id: 'goal',
    title: 'What do you want to do first?',
    subtitle: 'Pick one to start fast',
    description: 'You can switch to anything else instantly later.',
    options: [
      { id: 'new_project', label: 'Start a new project', hint: 'Create project with firm template', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'open_project', label: 'Open existing project', hint: 'Continue from project pipeline', icon: <FolderOpen className="w-4 h-4" /> },
      { id: 'generate_render', label: 'Generate a render', hint: 'AI render from prompt or reference', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'upload_plan', label: 'Upload a floorplan', hint: 'AI detect rooms + furnish', icon: <Upload className="w-4 h-4" /> },
      { id: 'review_quotes', label: 'Review quotes / estimates', hint: 'Check estimates and payments', icon: <IndianRupee className="w-4 h-4" /> }
    ]
  },
  {
    id: 'firm',
    title: 'Firm branding',
    subtitle: 'Optional',
    description: 'Apply a firm template to preload style, vendors, and pricing defaults.',
    options: []
  },
  {
    id: 'complete',
    title: 'You are all set',
    subtitle: 'Ready to start',
    description: 'Your workspace is personalized. Use AURA anytime from the bottom-right button.'
  }
];

function FolderOpen(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9l2 2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </svg>
  );
}

export default function ConsumerOnboarding({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({ role: '', goal: '', templateId: '', clientName: '', projectName: '' });
  const navigateTab = useAppStore((s) => s.navigateTab);
  const ensureProject = useAppStore((s) => s.ensureProject);
  const step = STEPS[stepIndex];

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const goNext = async () => {
    if (step.id === 'goal' && form.goal) {
      await handleGoalAction(form.goal);
      return;
    }
    if (step.id === 'firm' && form.templateId) {
      await handleApplyTemplate(form.templateId);
      return;
    }
    if (stepIndex + 1 >= STEPS.length) {
      onComplete && onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleGoalAction = async (goal) => {
    try {
      if (goal === 'new_project') {
        const proj = await ensureProject();
        if (proj?.id) {
          navigateTab('brief');
          onComplete && onComplete();
          return;
        }
      }
      if (goal === 'open_project') {
        navigateTab('projects');
        onComplete && onComplete();
        return;
      }
      if (goal === 'generate_render') {
        navigateTab('renders');
        onComplete && onComplete();
        return;
      }
      if (goal === 'upload_plan') {
        navigateTab('floorplan');
        onComplete && onComplete();
        return;
      }
      if (goal === 'review_quotes') {
        navigateTab('finance');
        onComplete && onComplete();
        return;
      }
      onComplete && onComplete();
    } catch (e) {
      console.warn('Onboarding navigation failed', e);
      onComplete && onComplete();
    }
  };

  const handleApplyTemplate = async (templateId) => {
    try {
      const projectId = useAppStore.getState().selectedProjectId || (await ensureProject())?.id;
      if (!projectId) return;
      const res = await fetch(`${apiUrl('')}/firm/templates/${encodeURIComponent(templateId)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const data = await res.json();
      if (!data.success) {
        console.warn('Template apply failed', data);
      }
    } catch (e) {
      console.warn('Template apply error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-950/40 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step {stepIndex + 1} of {STEPS.length}</div>
            <h3 className="text-sm font-black text-slate-100">{step.title}</h3>
            <p className="text-[11px] text-slate-400">{step.subtitle}</p>
          </div>
          <div className="shrink-0">{step.icon}</div>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-300 mb-4">{step.description}</p>

          {step.id === 'role' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateForm({ role: opt.id })}
                  className={`text-left border rounded-xl px-3 py-2.5 transition ${form.role === opt.id ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="text-xs font-black text-slate-200">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{opt.hint}</div>
                </button>
              ))}
            </div>
          )}

          {step.id === 'goal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateForm({ goal: opt.id })}
                  className={`text-left border rounded-xl px-3 py-2.5 transition flex items-center gap-2 ${form.goal === opt.id ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <span className="text-slate-500">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-black text-slate-200">{opt.label}</div>
                    <div className="text-[10px] text-slate-500">{opt.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step.id === 'firm' && (
            <div className="space-y-2">
              <input
                value={form.projectName}
                onChange={(e) => updateForm({ projectName: e.target.value })}
                placeholder="Project name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
              />
              <input
                value={form.clientName}
                onChange={(e) => updateForm({ clientName: e.target.value })}
                placeholder="Client name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
              />
              <select
                value={form.templateId}
                onChange={(e) => updateForm({ templateId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
              >
                <option value="">Skip template</option>
                <option value="residential_modern">Modern Residential</option>
                <option value="traditional_indian">Traditional Indian</option>
                <option value="commercial_office">Commercial Office</option>
              </select>
            </div>
          )}

          {step.id === 'complete' && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Start building your first project from the Command Center.
            </div>
          )}
        </div>

        <div className="bg-slate-950/40 border-t border-slate-800 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-slate-100 disabled:opacity-50 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#AA8C2C] text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition"
          >
            {stepIndex + 1 >= STEPS.length ? 'Finish' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
