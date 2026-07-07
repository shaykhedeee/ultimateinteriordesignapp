import React from 'react';
import { 
  Wifi, 
  Cpu, 
  HardDrive, 
  Clock,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Project } from '../types/aura';

interface StatusBarProps {
  project: Project;
  currentView: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ project, currentView }) => {
  return (
    <div className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none z-50">
      {/* Left: Project Stats */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-3 h-3 text-emerald-500" />
          <span className="text-slate-400">CRDT Synced</span>
          <span className="text-emerald-500">●</span>
        </span>
        <span className="hidden sm:flex items-center gap-1">
          <Wifi className="w-3 h-3 text-blue-400" />
          <span>WebSocket 42ms</span>
        </span>
        <span className="hidden md:flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>WebGPU 60fps</span>
        </span>
      </div>

      {/* Center: Current Context */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-slate-600">{project.name}</span>
        <span className="text-slate-700">•</span>
        <span className="text-indigo-400">{currentView}</span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{project.collaborators.length} online</span>
        </span>
      </div>

      {/* Right: Shortcuts hint */}
      <div className="flex items-center gap-3">
        <span className="hidden lg:flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-500">
          ⌘P Pallete
        </kbd>
        <kbd className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-500">
          ⌘K Brain
        </kbd>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-indigo-400 animate-pulse" />
          <span className="text-indigo-400 font-bold">AURA 70B Active</span>
        </span>
      </div>
    </div>
  );
};
