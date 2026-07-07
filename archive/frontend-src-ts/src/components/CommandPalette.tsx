import React, { useState, useEffect, useRef } from 'react';
import type { ViewMode } from '../types/aura';
import {
  Box, Layers, Sparkles, Sliders, Camera, ShoppingCart,
  Palette, Calendar, Search, Zap, Wand2, BrainCircuit, 
  FileSpreadsheet, Play, Scan, Upload, Glasses
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: 'navigate' | 'action' | 'ai';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
  onAction: (action: string) => void;
  onOpenVR: () => void;
  onTriggerRender: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen, onClose, onNavigate, onAction, onOpenVR, onTriggerRender
}) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: CommandItem[] = [
    { id: 'nav-3d', label: '3D Viewport', description: 'Real-time WebGPU PBR rendering', icon: <Box className="w-4 h-4" />, action: () => onNavigate('viewport-3d'), shortcut: '⌘1', category: 'navigate' },
    { id: 'nav-2d', label: '2D Floor Plan', description: 'Vector CAD with Vastu/Feng Shui', icon: <Layers className="w-4 h-4" />, action: () => onNavigate('floorplan-2d'), shortcut: '⌘2', category: 'navigate' },
    { id: 'nav-ai', label: 'AI Auto-Design Generator', description: '60-second full home generation', icon: <Sparkles className="w-4 h-4" />, action: () => onNavigate('ai-generator'), shortcut: '⌘G', category: 'navigate' },
    { id: 'nav-param', label: 'Parametric Design Engine', description: 'Kitchens, wardrobes, ceilings', icon: <Sliders className="w-4 h-4" />, action: () => onNavigate('parametric'), category: 'navigate' },
    { id: 'nav-mood', label: 'Mood Board', description: 'AI color palette extraction', icon: <Palette className="w-4 h-4" />, action: () => onNavigate('mood-board'), shortcut: '⌘M', category: 'navigate' },
    { id: 'nav-render', label: 'Render Studio', description: '5-tier rendering pipeline', icon: <Camera className="w-4 h-4" />, action: () => onNavigate('render-studio'), shortcut: '⌘R', category: 'navigate' },
    { id: 'nav-timeline', label: 'Project Timeline', description: 'Gantt chart & AI delay prediction', icon: <Calendar className="w-4 h-4" />, action: () => onNavigate('project-timeline'), shortcut: '⌘T', category: 'navigate' },
    { id: 'nav-boq', label: 'Commerce & BOQ', description: 'Automated bill of quantities', icon: <ShoppingCart className="w-4 h-4" />, action: () => onNavigate('commerce-boq'), shortcut: '⌘B', category: 'navigate' },
    { id: 'nav-brain', label: 'AURA Brain Architecture', description: 'Multi-agent AI topology', icon: <BrainCircuit className="w-4 h-4" />, action: () => onNavigate('brain-arch'), shortcut: '⌘K', category: 'navigate' },
    { id: 'act-render', label: 'Generate AI Render', description: 'Queue cloud GPU path-traced render', icon: <Play className="w-4 h-4" />, action: onTriggerRender, shortcut: '⌘R', category: 'action' },
    { id: 'act-vr', label: 'Launch VR/AR Headset', description: 'WebXR spatial walkthrough', icon: <Glasses className="w-4 h-4" />, action: onOpenVR, category: 'action' },
    { id: 'act-budget', label: 'Optimize Budget 20%', description: 'Cost Optimization Engine', icon: <Zap className="w-4 h-4" />, action: () => onAction('optimize-budget'), shortcut: '⌘O', category: 'action' },
    { id: 'act-boq', label: 'Export BOQ to Excel', description: 'Detailed bill of materials spreadsheet', icon: <FileSpreadsheet className="w-4 h-4" />, action: () => onAction('export-boq'), category: 'action' },
    { id: 'ai-photo', label: 'Scan Room from Photo', description: 'AI wall/door/window extraction', icon: <Scan className="w-4 h-4" />, action: () => onAction('photo-scan'), category: 'ai' },
    { id: 'ai-blueprint', label: 'Import PDF Blueprint', description: 'OCR + vectorization', icon: <Upload className="w-4 h-4" />, action: () => onAction('pdf-import'), category: 'ai' },
    { id: 'ai-style', label: 'Transfer Style to All Rooms', description: 'Apply current style globally', icon: <Wand2 className="w-4 h-4" />, action: () => onAction('style-transfer'), category: 'ai' },
  ];

  const filtered = query.trim()
    ? allCommands.filter(c => 
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  useEffect(() => {
    setSelectedIdx(0);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); filtered[selectedIdx]?.action(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered, selectedIdx, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-in fade-in">
      <div className="glass-panel-accent w-full max-w-xl rounded-2xl border border-indigo-500/40 shadow-2xl overflow-hidden animate-in slide-in-from-top-3 fade-in">
        {/* Search Input */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search modules..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 font-medium"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {['navigate', 'action', 'ai'].map((cat) => {
            const catItems = filtered.filter(c => c.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="mb-2">
                <div className="px-3 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  {cat === 'navigate' ? 'Navigate' : cat === 'action' ? 'Actions' : 'AI Commands'}
                </div>
                {catItems.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                      selectedIdx === filtered.indexOf(cmd)
                        ? 'bg-indigo-600/30 text-white'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className={selectedIdx === filtered.indexOf(cmd) ? 'text-white' : 'text-slate-400'}>
                      {cmd.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{cmd.label}</div>
                      <div className="text-[10px] text-slate-500">{cmd.description}</div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="p-2 border-t border-slate-800 flex items-center gap-3 text-[10px] text-slate-500 font-mono px-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};
