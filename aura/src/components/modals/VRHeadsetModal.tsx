import React, { useState } from 'react';
import { 
  Glasses, 
  X, 
  Play, 
  QrCode
} from 'lucide-react';

export const VRHeadsetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [vrMode, setVrMode] = useState<'quest' | 'vision-pro' | 'web-360'>('vision-pro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="glass-panel-accent max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-purple-500/40 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Glasses className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">AR / VR HEADSET WALKTHROUGH</h3>
              <p className="text-xs text-purple-300 font-mono">WebXR & Apple Vision Pro Spatial Audio Ready</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Headset Device Switcher */}
          <div className="flex items-center justify-center gap-3">
            {[
              { id: 'vision-pro', label: '🥽 Apple Vision Pro (Spatial)' },
              { id: 'quest', label: '🎮 Meta Quest 3 (WebXR)' },
              { id: 'web-360', label: '🌐 Interactive Web 360°' }
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setVrMode(h.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  vrMode === h.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Stereo Dual Eye Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-purple-500/50 bg-slate-950 shadow-2xl group flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80" alt="Left eye" className="w-full h-full object-cover scale-110 group-hover:scale-115 transition duration-700" />
              <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/80 pointer-events-none" />
              <div className="absolute top-4 left-4 bg-purple-950/80 px-2.5 py-1 rounded font-mono text-[10px] text-purple-300 border border-purple-500/40">
                LEFT EYE 4K (90Hz)
              </div>
            </div>

            <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-purple-500/50 bg-slate-950 shadow-2xl group flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80" alt="Right eye" className="w-full h-full object-cover scale-110 group-hover:scale-115 transition duration-700" />
              <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/80 pointer-events-none" />
              <div className="absolute top-4 left-4 bg-purple-950/80 px-2.5 py-1 rounded font-mono text-[10px] text-purple-300 border border-purple-500/40">
                RIGHT EYE 4K (90Hz)
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white">Scan to open WebXR Session</div>
                <div className="text-slate-400 text-[11px]">No installation required. Works on Safari iOS & Meta Browser.</div>
              </div>
            </div>

            <button 
              onClick={() => { alert("WebXR Session initialized. Put on your headset or point camera at floor."); onClose(); }}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Immersive Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
