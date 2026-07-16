import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useEffect, useState } from 'react';
import { RefreshCw, Save, Download, AlertTriangle, CheckCircle2, XCircle, Clock, Image as ImageIcon, Ruler } from 'lucide-react';

const API = apiUrl('');

export default function RenderEditWorkspace({ projectId, renderId }) {
  const [render, setRender] = useState(null);
  const [edits, setEdits] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTool, setActiveTool] = useState('material_swap');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [selectedEditId, setSelectedEditId] = useState(null);
  const [mask, setMask] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [measurements, setMeasurements] = useState({ wallLengthMm: 0, ceilingHeightMm: 2700, moduleWidthMm: 900, moduleHeightMm: 720, moduleDepthMm: 600, wallUnitHeightMm: 1400 });
  const [measurementsSaved, setMeasurementsSaved] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    useAutoClear(toast?.msg || null, setToast, 3000);
  };

  useEffect(() => {
    if (projectId) {
      resolveRenderId();
      loadEditsForProject();
      loadHistoryForProject();
    }
  }, [projectId]);

  const resolveRenderId = async () => {
    try {
      let rid = renderId;
      if (!rid) {
        const res = await fetch(`${API}/projects/${projectId}/renders/latest`);
        if (res.ok) {
          const data = await res.json();
          rid = data.renderId || data.id || null;
        }
      }
      setSelectedEditId(null);
      if (rid) {
        loadRender(rid);
        loadEdits(rid);
        loadHistory(rid);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRender = async (rid) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders/${rid}`);
      if (res.ok) {
        const data = await res.json();
        setRender(data);
      } else {
        setLastError('Render not found');
      }
    } catch (err) {
      console.error(err);
      setLastError('Failed to load render');
    }
  };

  const loadEdits = async (rid) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders/${rid}/edits`);
      if (res.ok) {
        const data = await res.json();
        setEdits(Array.isArray(data.edits) ? data.edits : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEditsForProject = async () => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders?latest=1`);
      if (!res.ok) return;
      const data = await res.json();
      const rid = data.render?.id || data.id || null;
      if (rid) loadEdits(rid);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async (rid) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders/${rid}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.history) ? data.history : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistoryForProject = async () => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders?latest=1`);
      if (!res.ok) return;
      const data = await res.json();
      const rid = data.render?.id || data.id || null;
      if (rid) loadHistory(rid);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateEdit = async () => {
    if (!projectId || !renderId) return;
    setIsGenerating(true);
    setLastError(null);
    try {
      const maskedBbox = mask ? { x: mask.x, y: mask.y, width: mask.width, height: mask.height } : null;
      const instruction = prompt.trim() || `Apply ${activeTool.replace(/_/g, ' ')} edit with masked region ${maskedBbox ? `at ${maskedBbox.x},${maskedBbox.y}` : 'full frame'}`;

      const body = {
        projectId,
        renderId,
        editType: activeTool,
        title: activeTool.replace(/_/g, ' ').toUpperCase(),
        instruction,
        maskBboxJson: maskedBbox ? JSON.stringify(maskedBbox) : null,
        maskAssetId: maskedBbox ? `mask_${Date.now()}` : null,
        preserveCamera: true,
        preserveGeometry: true,
        preserveLightingDirection: true,
        geometryContext: measurementsSaved ? measurements : {},
        roomStyleContext: measurementsSaved ? measurements : {},
      };

      const res = await fetch(`${API}/projects/${projectId}/renders/${renderId}/edits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success || data.edit) {
        showToast('Edit generated successfully');
        setPrompt('');
        loadEdits();
        loadHistory();
      } else {
        const errMsg = data.error || 'Edit generation failed';
        setLastError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      setLastError('Network error');
      showToast('Edit generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelEdit = async (editId) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders/${renderId}/edits/${editId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showToast('Edit cancelled');
        loadEdits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryEdit = async (editId) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/renders/${renderId}/edits/${editId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Retry started');
        loadEdits();
      } else {
        showToast(data.error || 'Retry failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Retry failed', 'error');
    }
  };

  const toolOptions = [
    { id: 'material_swap', label: 'Material Swap', icon: '🧱' },
    { id: 'furniture_replace', label: 'Furniture Replace', icon: '🪑' },
    { id: 'add_object', label: 'Add Object', icon: '➕' },
    { id: 'remove_object', label: 'Remove Object', icon: '➖' },
    { id: 'lighting_tweak', label: 'Lighting Tweak', icon: '💡' },
    { id: 'decor_refinement', label: 'Decor Refinement', icon: '🎨' }
  ];

  const updateMeasurement = (key, value) => {
    setMeasurements(prev => ({ ...prev, [key]: Number(value) || 0 }));
    setMeasurementsSaved(false);
  };

  const saveMeasurements = () => {
    setMeasurementsSaved(true);
    showToast('Measurements applied');
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'queued': return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'processing': return <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#020617]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-2xl flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-400' : 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 overflow-y-auto h-full">
        {/* Source Render */}
        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 h-[80vh]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] mb-2">Source Render</h2>
          <div className="flex-1 border border-slate-800 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden">
            {render?.image_url ? (
              <img src={render.image_url} alt="Render" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-slate-500 text-xs p-6">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-60" />
                No render image available
              </div>
            )}
          </div>
        </div>

        {/* Edit Controls */}
        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 h-[80vh] overflow-y-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">Edit Controls</h2>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Edit Tool</label>
            <div className="grid grid-cols-2 gap-1.5">
              {toolOptions.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-bold transition border ${
                    activeTool === tool.id
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="mr-1">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Mask Region (px)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 block mb-0.5 text-[9px]">X</label>
                <input type="number" value={mask.x} onChange={(e) => setMask(prev => ({ ...prev, x: Number(e.target.value) || 0 }))} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5 text-[9px]">Y</label>
                <input type="number" value={mask.y} onChange={(e) => setMask(prev => ({ ...prev, y: Number(e.target.value) || 0 }))} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5 text-[9px]">Width</label>
                <input type="number" value={mask.width} onChange={(e) => setMask(prev => ({ ...prev, width: Number(e.target.value) || 0 }))} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5 text-[9px]">Height</label>
                <input type="number" value={mask.height} onChange={(e) => setMask(prev => ({ ...prev, height: Number(e.target.value) || 0 }))} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
            </div>
          </div>

          {(activeTool === 'material_swap' || activeTool === 'decor_refinement' || activeTool === 'lighting_tweak') && (
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the change... e.g., 'replace marble with walnut'"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 resize-none h-24 outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          )}

          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> Measurement Overrides
              </h3>
              <span className="text-[9px] font-mono text-slate-400">{measurementsSaved ? 'Saved' : 'Unsaved'}</span>
            </div>
            <div className="space-y-1.5">
              <div>
                <label className="text-slate-400 block mb-0.5 text-[9px]">Wall Length (mm)</label>
                <input type="number" value={measurements.wallLengthMm || ''} onChange={(e) => updateMeasurement('wallLengthMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5 text-[9px]">Ceiling Height (mm)</label>
                <input type="number" value={measurements.ceilingHeightMm || 2700} onChange={(e) => updateMeasurement('ceilingHeightMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5 text-[9px]">Module Width (mm)</label>
                  <input type="number" value={measurements.moduleWidthMm || ''} onChange={(e) => updateMeasurement('moduleWidthMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5 text-[9px]">Module Height (mm)</label>
                  <input type="number" value={measurements.moduleHeightMm || ''} onChange={(e) => updateMeasurement('moduleHeightMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5 text-[9px]">Module Depth (mm)</label>
                  <input type="number" value={measurements.moduleDepthMm || ''} onChange={(e) => updateMeasurement('moduleDepthMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5 text-[9px]">Wall Unit Height (mm)</label>
                  <input type="number" value={measurements.wallUnitHeightMm || ''} onChange={(e) => updateMeasurement('wallUnitHeightMm', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs" />
                </div>
              </div>
              <button onClick={saveMeasurements} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-[11px] transition">Apply Measurements</button>
            </div>
          </div>

          <button
            onClick={handleGenerateEdit}
            disabled={isGenerating}
            className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-slate-950 font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Generate Edit
          </button>
        </div>

        {/* Edits + History List */}
        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 h-[80vh] overflow-y-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">Edits & History</h2>

          {lastError && (
            <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-2.5 text-[11px] text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {lastError}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pending / Active Edits</div>
            {edits.length === 0 && <div className="text-slate-500 text-[11px]">No active edits</div>}
            {edits.map(edit => (
              <div key={edit.id} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200">{edit.edit_type?.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(edit.status)}
                    <span className="text-[9px] font-mono text-slate-400">{edit.status}</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Provider: {edit.provider_used || 'pending'} • Retries: {edit.retry_count ?? 0}</div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleRetryEdit(edit.id)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700 transition">Retry</button>
                  <button onClick={() => handleCancelEdit(edit.id)} className="text-[10px] bg-red-950/60 hover:bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-900/40 transition">Cancel</button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Render History</div>
            {history.length === 0 && <div className="text-slate-500 text-[11px]">No history yet</div>}
            {history.map(item => (
              <div key={item.id} className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-200">{item.kind === 'edit_parent' ? 'Base Render' : `Edit #${item.parent_render_id}`}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{item.provider_used || 'unknown'} • {item.status}</div>
                </div>
                {statusIcon(item.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
