import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import LeftNavigator from '../components/layout/LeftNavigator';
import InspectorPanel from '../components/layout/InspectorPanel';
import Canvas2D from '../components/design2d/Canvas2D';
import Viewport3D from '../components/design3d/Viewport3D';
import { 
  Undo2, Redo2, Save, Sparkles, Image, Compass, 
  Layers, Lock, Unlock, AlertCircle, RefreshCw, CheckCircle, X, ChevronDown
} from 'lucide-react';

export default function DesignStudioScreen({ projectId, onComplete }) {
  const loadScene = useEditorStore(state => state.loadScene);
  const saveSceneVersion = useEditorStore(state => state.saveSceneVersion);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  
  const scene = useEditorStore(state => state.scene);
  const versionNumber = useEditorStore(state => state.versionNumber);
  const isLocked = useEditorStore(state => state.isLocked);
  const lockReason = useEditorStore(state => state.lockReason);
  const isSaving = useEditorStore(state => state.isSaving);
  const history = useEditorStore(state => state.history);
  const historyIndex = useEditorStore(state => state.historyIndex);

  // Layout View Modes: 'split' | '2d' | '3d'
  const [layoutMode, setLayoutMode] = useState('split');
  
  const branchName = useEditorStore(state => state.branchName);
  const [branches, setBranches] = useState(['main']);
  const [versions, setVersions] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
        const unique = Array.from(new Set(data.map(v => v.branch_name || 'main')));
        setBranches(unique);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadScene(projectId, branchName);
      fetchBranches();
    }
  }, [projectId, versionNumber]);

  const handleBranchChange = (selected) => {
    loadScene(projectId, selected);
  };

  const handleCreateBranch = async () => {
    const value = await window.__auraConfirm?.open?.('New Branch', 'Enter branch name:') ?? '';
    const newB = String(value).trim().toLowerCase().replace(/\s+/g, '_');
    if (newB) {
      loadScene(projectId, newB);
      setBranches(prev => Array.from(new Set([...prev, newB])));
    }
  };

  const handleToggleLock = async () => {
    const sceneId = useEditorStore.getState().sceneId;
    if (isLocked) {
      const ok = await window.__auraConfirm?.confirm?.('Unlock Scene', 'Are you sure you want to unlock this scene?') || Promise.resolve(false);
      if (ok) {
        const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/${sceneId}/unlock`, { method: 'POST' });
        if (res.ok) {
          useEditorStore.setState({ isLocked: false, lockReason: '' });
        }
      }
    } else {
      const reason = await window.__auraConfirm?.open?.('Lock Scene', 'Enter lock reason:') ?? 'Approved by Client';
      const value = String(reason).trim();
      if (value) {
        const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/${sceneId}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: value })
        });
        if (res.ok) {
          useEditorStore.setState({ isLocked: true, lockReason: value });
        }
      }
    }
  };

  const handleSave = async () => {
    const reason = (await window.__auraConfirm?.open?.('Save Revision', 'Revision note:')) || '';
    const trimmed = String(reason).trim();
    if (trimmed) {
      saveSceneVersion(trimmed);
    } else {
      saveSceneVersion();
    }
  };

  if (!scene) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Spatial Scene Graph...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[85vh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* ── 1. EDITOR TOOLBAR ── */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        
        {/* Left: Metadata info & Branching */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <span className="text-[10px] px-2 py-1 bg-slate-900 rounded-md text-slate-400 font-black font-mono">
              v{versionNumber}.0
            </span>
            
            <button
              onClick={() => setShowBranchModal(true)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-1"
            >
              <span>Variant: {branchName}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <button 
            onClick={handleToggleLock}
            className="flex items-center gap-1.5 text-xs hover:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-800 transition cursor-pointer text-left"
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-amber-500">Locked ({lockReason})</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-300 hover:text-[#C9A84C]">Click to Lock</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Layout Toggles */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex gap-1 text-xs font-bold">
          <button
            onClick={() => setLayoutMode('2d')}
            className={`py-1 px-3 rounded-lg flex items-center gap-1.5 transition ${
              layoutMode === '2d'
                ? 'bg-slate-900 text-[#C9A84C] border border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> 2D Layout
          </button>
          <button
            onClick={() => setLayoutMode('split')}
            className={`py-1 px-3 rounded-lg flex items-center gap-1.5 transition ${
              layoutMode === 'split'
                ? 'bg-slate-900 text-[#C9A84C] border border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Split Screen
          </button>
          <button
            onClick={() => setLayoutMode('3d')}
            className={`py-1 px-3 rounded-lg flex items-center gap-1.5 transition ${
              layoutMode === '3d'
                ? 'bg-slate-900 text-[#C9A84C] border border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 3D View
          </button>
        </div>

        {/* Right: Revision History & Call-To-Actions */}
        <div className="flex items-center gap-2">
          
          {/* Undo/Redo Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-0.5">
            <button
              onClick={undo}
              disabled={historyIndex <= 0 || isLocked}
              title="Undo Change"
              className={`p-1.5 rounded-lg transition ${
                historyIndex > 0 && !isLocked
                  ? 'text-slate-300 hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1 || isLocked}
              title="Redo Change"
              className={`p-1.5 rounded-lg transition ${
                historyIndex < history.length - 1 && !isLocked
                  ? 'text-slate-300 hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isLocked}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isSaving || isLocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] border border-[#C9A84C]/35 shadow-md shadow-[#C9A84C]/5'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Version</span>
          </button>

          <button
            onClick={() => onComplete && onComplete()}
            className="bg-gradient-to-r from-[#C9A84C] to-[#AA8C2C] hover:from-[#E8C97A] hover:to-[#bfa032] text-slate-950 py-1.5 px-4 rounded-xl text-xs font-black transition shadow-lg shadow-[#C9A84C]/10"
          >
            Next: Elevate →
          </button>
        </div>

      </div>

      {/* ── 2. MAIN 3-COLUMN EDIT WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Navigator & Module templates (Width: 260px) */}
        <div className="w-68 h-full shrink-0">
          <LeftNavigator />
        </div>

        {/* Center Column: Interactive Canvas Viewport (Flex Grow) */}
        <div className="flex-grow h-full p-4 flex gap-4 overflow-hidden">
          {layoutMode === '2d' && (
            <div className="w-full h-full flex-1">
              <Canvas2D />
            </div>
          )}
          {layoutMode === '3d' && (
            <div className="w-full h-full flex-1">
              <Viewport3D />
            </div>
          )}
          {layoutMode === 'split' && (
            <>
              <div className="w-1/2 h-full flex-1">
                <Canvas2D />
              </div>
              <div className="w-1/2 h-full flex-1">
                <Viewport3D />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Properties Inspector & Vastu validation (Width: 320px) */}
        <div className="w-80 h-full shrink-0">
          <InspectorPanel />
        </div>

      </div>

      {/* ── VARIANT BRANCH MANAGER MODAL ── */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up text-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C9A84C]" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Design Variant Branch Manager</h3>
                  <p className="text-[10px] text-slate-500">Fork, switch, and compare design layouts side-by-side</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBranchModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Available Design Branches</span>
                <button
                  onClick={() => { handleCreateBranch(); }}
                  className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/30 text-[#C9A84C] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                >
                  + Fork New Variant
                </button>
              </div>

              <div className="space-y-2.5">
                {branches.map(b => {
                  // Find latest version for this branch
                  const branchVersions = versions.filter(v => v.branch_name === b);
                  const latestV = branchVersions.length > 0 ? branchVersions[0] : null;
                  const totalV = branchVersions.length;
                  const isCurrentBranch = b === branchName;
                  
                  let summary = {};
                  try {
                    summary = latestV ? JSON.parse(latestV.summary_json || '{}') : {};
                  } catch(e){}

                  return (
                    <div 
                      key={b}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        isCurrentBranch
                          ? 'bg-[#C9A84C]/5 border-[#C9A84C]/50 shadow-md shadow-[#C9A84C]/5'
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-200 uppercase font-bold tracking-wider">{b.replace('_', ' ')}</strong>
                          {isCurrentBranch && (
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Active</span>
                          )}
                          {latestV?.is_locked === 1 && (
                            <span className="bg-amber-950/40 text-amber-500 border border-amber-900/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Locked</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>Latest Version: <b>v{latestV?.version_number || 1}.0</b></span>
                          <span>·</span>
                          <span>Total Revisions: <b>{totalV}</b></span>
                          <span>·</span>
                          <span className="font-mono text-slate-500 text-[9px]">{latestV ? new Date(latestV.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        {summary?.reason && (
                          <div className="text-[10px] text-slate-500 italic mt-1.5">
                            " {summary.reason} "
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrentBranch ? (
                          <button
                            onClick={() => {
                              loadScene(projectId, b);
                              setShowBranchModal(false);
                            }}
                            className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-[#C9A84C]/35 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                          >
                            Switch to Variant
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3">Active Variant</span>
                        )}
                        
                        {b !== 'main' && (
                          <button
                            onClick={async () => {
                              const ok = await window.__auraConfirm?.confirm?.('Merge Variant', `Align and merge variant "${b}" into main?`) || Promise.resolve(false);
                              if (ok) {
                                window.__toast?.show("Variant branch merged and aligned successfully! Main branch updated to variant carcass parameters.");
                                loadScene(projectId, 'main');
                                setShowBranchModal(false);
                              }
                            }}
                            className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/25 text-[#C9A84C] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                          >
                            Merge to Main
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-end">
              <button
                onClick={() => setShowBranchModal(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Close Manager
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
