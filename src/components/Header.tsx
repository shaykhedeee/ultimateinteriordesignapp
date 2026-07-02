import React, { useState } from 'react';
import { ViewMode, Project } from '../types/aura';
import {
  Box,
  Layers,
  Sparkles,
  Sliders,
  Camera,
  ShoppingCart,
  Cpu,
  Undo2,
  Redo2,
  Save,
  Share2,
  ChevronDown,
  Users,
  Play,
  Upload,
  Scan,
  Plus,
  Palette,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  project: Project;
  onProjectSwitch: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onTriggerRender: () => void;
  onOpenVRModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  project,
  onProjectSwitch,
  onUndo,
  onRedo,
  onSave,
  onTriggerRender,
  onOpenVRModal
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);

  const handleSaveClick = () => {
    onSave();
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 2000);
  };

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'viewport-3d', label: '3D Viewport', icon: <Box className="w-4 h-4" />, badge: 'WebGPU' },
    { id: 'floorplan-2d', label: '2D Floor Plan', icon: <Layers className="w-4 h-4" /> },
    { id: 'ai-generator', label: 'AI Design', icon: <Sparkles className="w-4 h-4 text-indigo-400" />, badge: '60s' },
    { id: 'parametric', label: 'Parametric', icon: <Sliders className="w-4 h-4" /> },
    { id: 'mood-board', label: 'Mood Board', icon: <Palette className="w-4 h-4 text-pink-400" /> },
    { id: 'render-studio', label: 'Renders', icon: <Camera className="w-4 h-4" /> },
    { id: 'project-timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4 text-amber-400" /> },
    { id: 'commerce-boq', label: 'BOQ', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'brain-arch', label: 'Brain', icon: <Cpu className="w-4 h-4 text-cyan-400" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />, badge: 'Live' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/90 shadow-xl">
      {/* Left section: Logo + Project Dropdown */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectView('viewport-3d')}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                AURA
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                v2.4 AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">Infurnia × AI × Realtime</p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-sm font-medium text-slate-200 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{project.name}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProjectMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProjectMenu && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-2 text-sm animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</div>
              {[
                'AURA Sky Penthouse (3BHK)',
                'Zenith Wabi-Sabi Villa',
                'Minimalist Studio Renovation',
                'Silicon Valley Tech HQ Lounge'
              ].map((pName) => (
                <button
                  key={pName}
                  onClick={() => {
                    onProjectSwitch(pName);
                    setShowProjectMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between ${
                    project.name === pName ? 'text-indigo-400 bg-indigo-950/30 font-medium' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{pName}</span>
                  {project.name === pName && <span className="text-xs bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">Active</span>}
                </button>
              ))}

              <div className="border-t border-slate-800 mt-2 pt-2 px-2 flex flex-col gap-1">
                <button 
                  onClick={() => { onProjectSwitch('New Custom Blueprint'); setShowProjectMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 text-xs text-indigo-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Blank Design
                </button>
                <button 
                  onClick={() => { alert("Photo Scan Mode simulated: Upload a room photo to auto-extract walls & materials."); setShowProjectMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 text-xs text-emerald-300"
                >
                  <Scan className="w-3.5 h-3.5" /> 📸 Photo Scan Room
                </button>
                <button 
                  onClick={() => { alert("LiDAR/PDF import simulator: Vectorizing blueprint coordinates."); setShowProjectMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 text-xs text-purple-300"
                >
                  <Upload className="w-3.5 h-3.5" /> 📐 Import PDF Blueprint
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center navigation tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 no-scrollbar justify-start md:justify-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right actions: Multiplayer + Undo/Redo + Render + VR/AR */}
      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2">
        {/* Collaborative multi-user avatars */}
        <div className="flex items-center -space-x-2 mr-2" title="Multiplayer CRDT Sync Active">
          {project.collaborators.map((c) => (
            <div key={c.id} className="relative group">
              <img 
                src={c.avatar} 
                alt={c.name} 
                className="w-7 h-7 rounded-full border-2 border-slate-950 object-cover" 
              />
              <span 
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950" 
                style={{ backgroundColor: c.color }} 
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-slate-700">
                  {c.name} ({c.role})
                </div>
              </div>
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-300">
            <Users className="w-3 h-3 text-indigo-400" />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={onUndo}
            disabled={project.historyIndex <= 0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onRedo}
            disabled={project.historyIndex >= 10}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={handleSaveClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            savedPulse 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{savedPulse ? 'Synced to Cloud' : 'Save'}</span>
        </button>

        <button
          onClick={onTriggerRender}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>AI Render</span>
        </button>

        <button
          onClick={onOpenVRModal}
          className="flex items-center justify-center p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
          title="AR / VR Headset Walkthrough"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
