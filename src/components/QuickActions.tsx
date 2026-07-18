import React from 'react';
import { 
  Palette, 
  Camera,
  ShoppingCart,
  BrainCircuit,
  GanttChart,
  Zap,
  Layers,
  Sparkles,
  Scissors
} from 'lucide-react';
import { ViewMode } from '../types/aura';

interface QuickActionsProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onQuickAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ currentView, onNavigate, onQuickAction }) => {
  const actions: { id: string; icon: React.ReactNode; label: string; shortcut: string; view?: ViewMode; action?: string; color: string }[] = [
    { id: 'qa-gen', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Generate Design', shortcut: '⌘G', view: 'ai-generator', color: 'text-indigo-400' },
    { id: 'qa-render', icon: <Camera className="w-3.5 h-3.5" />, label: 'AI Render', shortcut: '⌘R', view: 'render-studio', color: 'text-purple-400' },
    { id: 'qa-mood', icon: <Palette className="w-3.5 h-3.5" />, label: 'Mood Board', shortcut: '⌘M', view: 'mood-board', color: 'text-pink-400' },
    { id: 'qa-timeline', icon: <GanttChart className="w-3.5 h-3.5" />, label: 'Timeline', shortcut: '⌘T', view: 'project-timeline', color: 'text-amber-400' },
    { id: 'qa-budget', icon: <ShoppingCart className="w-3.5 h-3.5" />, label: 'BOQ & Cart', shortcut: '⌘B', view: 'commerce-boq', color: 'text-emerald-400' },
    { id: 'qa-brain', icon: <BrainCircuit className="w-3.5 h-3.5" />, label: 'AURA Brain', shortcut: '⌘K', view: 'brain-arch', color: 'text-cyan-400' },
    { id: 'qa-3d', icon: <Layers className="w-3.5 h-3.5" />, label: '3D Viewport', shortcut: '⌘1', view: 'viewport-3d', color: 'text-blue-400' },
    { id: 'qa-2d', icon: <Scissors className="w-3.5 h-3.5" />, label: '2D Floor Plan', shortcut: '⌘2', view: 'floorplan-2d', color: 'text-blue-300' },
    { id: 'qa-optimize', icon: <Zap className="w-3.5 h-3.5" />, label: 'Optimize Budget', shortcut: '⌘O', action: 'optimize-budget', color: 'text-amber-400' },
  ];

  const isActive = (qa: typeof actions[0]) => {
    if (qa.view) return currentView === qa.view;
    return false;
  };

  return (
    <div className="absolute left-3 top-24 bottom-auto z-40 pointer-events-none hidden xl:block">
      <div className="glass-panel p-1.5 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-1 border border-slate-800/80 bg-slate-950/95">
        {actions.map((qa) => (
          <button
            key={qa.id}
            onClick={() => {
              if (qa.view) onNavigate(qa.view);
              if (qa.action) onQuickAction(qa.action);
            }}
            className={`group relative flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-medium ${
              isActive(qa)
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
            title={`${qa.label} (${qa.shortcut})`}
          >
            <span className={isActive(qa) ? 'text-white' : qa.color}>{qa.icon}</span>
            <span className="hidden group-hover:inline-block whitespace-nowrap pr-1">{qa.label}</span>
            <span className="hidden group-hover:inline-block text-[9px] font-mono text-slate-600 ml-auto">
              {qa.shortcut}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
