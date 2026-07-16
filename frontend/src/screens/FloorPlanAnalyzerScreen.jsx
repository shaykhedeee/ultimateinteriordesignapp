import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useEffect, useRef, useState, Suspense, lazy, useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import LeftNavigator from '../components/layout/LeftNavigator';
import InspectorPanel from '../components/layout/InspectorPanel';
import Canvas2D from '../components/design2d/Canvas2D';
import {
  Upload,
  Scan,
  Map,
  RefreshCw,
  Save,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
  Tag,
  Plus,
  Lock,
  Unlock,
  LayoutDashboard,
  Compass,
  DoorOpen,
  Layout,
  Sparkles,
  Download
} from 'lucide-react';
const ROOM_COLORS = [
  'bg-red-500/20 text-red-300 border-red-500/40',
  'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'bg-violet-500/20 text-violet-300 border-violet-500/40',
  'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'bg-orange-500/20 text-orange-300 border-orange-500/40'
];

function ToolButton({ label, icon, onClick, disabled, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      <span className="text-slate-500" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function FloorPlanAnalyzerScreen({ projectId, onComplete }) {
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

  const [layoutMode, setLayoutMode] = useState('split');
  const [branchName, setBranchName] = useState('main');
  const [branches, setBranches] = useState(['main']);
  const [versions, setVersions] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const [floorplanFile, setFloorplanFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | parsing | interpreting | review_required | approved | error
  const [overallConfidence, setOverallConfidence] = useState(null);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [zoneTags, setZoneTags] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState(null);

  const [toolkitMessage, setToolkitMessage] = useState(null);
  const [toolkitStatus, setToolkitStatus] = useState('idle');
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const aiDetectControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Quick action states
  const [quickAction, setQuickAction] = useState(null);
  const [selectedAllZones, setSelectedAllZones] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (jobStatusIntervalRef.current) clearInterval(jobStatusIntervalRef.current);
      if (aiDetectControllerRef.current) aiDetectControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (projectId) {
      loadScene(projectId, branchName);
      fetchVersions();
    }
    return () => {
      if (jobStatusIntervalRef.current) clearInterval(jobStatusIntervalRef.current);
    };
  }, [projectId, versionNumber]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/floor-plan-versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
        const unique = Array.from(new Set(data.map(v => v.branchName || 'main').filter(Boolean)));
        setBranches(unique.length > 0 ? unique : ['main']);
        const current = data.find(v => v.isCurrent);
        if (current) {
          setCurrentVersionId(current.id);
          setUploadStatus(current.interpretationStatus || 'draft');
          setOverallConfidence(current.overallConfidence);
          fetchVersionDetails(current.id);
        }
      }
    } catch (err) {
      console.error('fetchVersions failed', err);
    }
  };

  const fetchVersionDetails = async (versionId) => {
    try {
      const res = await fetch(`${API_BASE}/floor-plan-versions/${versionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setReviewItems(data.data.reviewItems || []);
          setInterpretation(data.data.interpretation || null);
          buildZoneTags(data.data.interpretation);
        }
      }
    } catch (err) {
      console.error('fetchVersionDetails failed', err);
    }
  };

  const buildZoneTags = (interp) => {
    if (!interp || !Array.isArray(interp.rooms)) return setZoneTags([]);
    const tags = interp.rooms.map((room, idx) => ({
      id: room.id || `room_${idx}_${Date.now()}`,
      name: room.name || room.type || `Zone ${idx + 1}`,
      type: room.type || 'unknown',
      confidence: room.confidence || null,
      vastu: room.orientation || room.vastu || 'UNKNOWN',
      bounds: room.bounds || null,
      colorClass: ROOM_COLORS[idx % ROOM_COLORS.length],
      resolved: room.resolved || false
    }));
    setZoneTags(tags);
  };

  const API_BASE = apiUrl('');

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFloorplanFile(file);
    setUploadStatus('parsing');
    setReviewItems([]);
    setZoneTags([]);
    setInterpretation(null);
    setOverallConfidence(null);
    setCurrentVersionId(null);
    setQuickAction('uploading');

    const form = new FormData();
    form.append('floorplan', file);

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/floorplan`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCurrentVersionId(data.floorPlanVersionId);
      setUploadStatus('interpreting');
      setQuickAction('interpreting');
      pollJobStatus();
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setQuickAction('error');
    } finally {
      useAutoClear(uploadStatus === 'done' ? 'done' : uploadStatus === 'error' ? 'error' : null, setQuickAction, 1200);
    }
  };

  const pollJobStatus = () => {
    if (jobStatusIntervalRef.current) clearInterval(jobStatusIntervalRef.current);
    jobStatusIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/jobs`);
        if (!res.ok) return;
        const jobs = await res.json();
        const planJob = jobs.find(j => j.job_type === 'plan-analysis');
        if (!planJob) return;
        if (planJob.status === 'succeeded') {
          clearInterval(jobStatusIntervalRef.current);
          jobStatusIntervalRef.current = null;
          await fetchVersions();
          setQuickAction('done');
          useAutoClear(uploadStatus === 'done' ? 'done' : uploadStatus === 'error' ? 'error' : null, setQuickAction, 1200);
        } else if (planJob.status === 'failed') {
          clearInterval(jobStatusIntervalRef.current);
          jobStatusIntervalRef.current = null;
          setUploadStatus('error');
          setQuickAction('error');
          useAutoClear(uploadStatus === 'done' ? 'done' : uploadStatus === 'error' ? 'error' : null, setQuickAction, 1200);
        }
      } catch (err) {
        console.error('poll error', err);
      }
    }, 1200);
  };

  const cancelAiDetect = async () => {
    if (aiDetectControllerRef.current) {
      aiDetectControllerRef.current.abort();
      aiDetectControllerRef.current = null;
    }
    setIsAiDetecting(false);
    setToolkitMessage('AI detection cancelled.', 'warning');
    setToolkitStatus('idle');
  };

  const handleAiDetect = async () => {
    if (isAiDetecting) {
      await cancelAiDetect();
      return;
    }
    try {
      aiDetectControllerRef.current = new AbortController();
      setIsAiDetecting(true);
      setToolkitMessage('Running AI room detection...', 'loading');
      const res = await fetch(`${apiUrl('')}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: 'floorplan-analyzer', projectId, params: { mode: 'detect' } }),
        signal: aiDetectControllerRef.current.signal
      });
      if (!res.ok) throw new Error('AI detect failed');
      const data = await res.json();
      setUploadStatus('review_required');
      setToolkitMessage('AI detection complete. Review zones below.', 'success');
      setToolkitStatus('idle');
      await fetchVersions();
    } catch (err) {
      if (err?.name === 'AbortError') {
        setToolkitMessage('AI detection cancelled.', 'error');
      } else {
        console.error(err);
        setToolkitMessage('AI detect failed.', 'error');
        setUploadStatus('error');
      }
    } finally {
      setIsAiDetecting(false);
      aiDetectControllerRef.current = null;
      setToolkitStatus('idle');
    }
  };

  const handleTagClick = (tag) => {
    setSelectedRoomId(tag.id);
    setSelectedAllZones(false);
    const room = (interpretation && interpretation.rooms || []).find(r => r.id === tag.id);
    if (room?.bounds) {
      // place inspector selection focus / center could go here using stored selection bus
    }
  };

  const handleSelectAllZones = () => {
    const next = !selectedAllZones;
    setSelectedAllZones(next);
    setSelectedRoomId(next ? (interpretation?.rooms?.[0]?.id || null) : null);
    setToolkitMessage(next ? 'All zones selected for batch actions.' : 'Selection cleared.', 'success');
  };

  const handleBatchApprove = async () => {
    if (!currentVersionId) return;
    setToolkitStatus('loading');
    setToolkitMessage('Batch approving all zones...', 'loading');
    try {
      const state = useEditorStore.getState();
      const sceneSnapshot = state.scene ? { ...state.scene, zones: zoneTags } : null;
      const res = await fetch(`${API_BASE}/floor-plan-versions/${currentVersionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corrections: [],
          reviewedSceneData: sceneSnapshot || interpretation || {}
        })
      });
      if (!res.ok) throw new Error('Review submit failed');
      setUploadStatus('approved');
      setToolkitMessage('All zones approved.', 'success');
      await fetchVersions();
    } catch (err) {
      console.error(err);
      setToolkitMessage('Batch approval failed.', 'error');
      setUploadStatus('error');
    } finally {
      setToolkitStatus('idle');
    }
  };

  const handleKeyboard = useCallback((e) => {
    if (!projectId) return;
    const tag = /^[A-Za-z]$/.test(e.key) ? e.key.toLowerCase() : null;
    if (tag && zoneTags.length && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      const idx = tag.charCodeAt(0) - 97;
      if (idx >= 0 && idx < zoneTags.length) {
        handleTagClick(zoneTags[idx]);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSaveVersion();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
    if (e.key.toLowerCase() === 'f5') {
      e.preventDefault();
      handleAiDetect();
    }
  }, [projectId, zoneTags, undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const handleSaveVersion = () => {
    const reason = `Version ${versionNumber + 1}`;
    const confirmed = {};
    planToolkitMessage('Saving version...', 'loading');
    saveSceneVersion(reason).then(() => {
      planToolkitMessage('Floorplan version saved.', 'success');
    }).catch((_) => {
      planToolkitMessage('Version save failed.', 'error');
    });
  };

  const handleToggleLock = async () => {
    const sceneId = useEditorStore.getState().sceneId;
    if (!sceneId) {
      planToolkitMessage('Scene ID missing.', 'error');
      return;
    }
    if (isLocked) {
      await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/unlock`, { method: 'POST' });
      useEditorStore.setState({ isLocked: false, lockReason: '' });
      planToolkitMessage('Scene unlocked.', 'success');
    } else {
      const reason = window.prompt('Lock reason:', 'Approved by Client');
      if (reason === null) return;
      await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      useEditorStore.setState({ isLocked: true, lockReason: reason || '' });
      planToolkitMessage('Scene locked.', 'success');
    }
  };

  const handleApprove = async () => {
    if (!currentVersionId) return;
    try {
      const state = useEditorStore.getState();
      const sceneSnapshot = state.scene ? { ...state.scene, zones: zoneTags } : null;
      const res = await fetch(`${API_BASE}/floor-plan-versions/${currentVersionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corrections: [],
          reviewedSceneData: sceneSnapshot || interpretation || {}
        })
      });
      if (!res.ok) throw new Error('Review submit failed');
      setUploadStatus('approved');
      fetchVersions();
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
    }
  };

  const handleBranchChange = (selected) => {
    loadScene(projectId, selected);
    setBranchName(selected);
  };

  const handleCreateBranch = async () => {
    const newB = `V-${Date.now().toString(36).slice(-4)}`;
    const cleaned = newB.trim().toLowerCase().replace(/\s+/g, '_') || newB;
    loadScene(projectId, cleaned);
    setBranches((prev) => Array.from(new Set([...prev, cleaned])));
    setToolkitMessage(`Created branch: ${cleaned}`, 'success');
  };

  const handleKonvaMeasurement = () => {
    setToolkitMessage('2D canvas: drag to measure segment lengths in meters/feet.');
  };
  const handleKonvaAreaCompute = () => {
    const rooms = interpretation?.rooms || [];
    const totalAreaM2 = rooms.reduce((acc, r) => acc + (r.bounds?.area || 0), 0);
    const sqft = totalAreaM2 * 10.7639;
    const perRoom = rooms.map(r => ({ name: r.name, sqft: ((r.bounds?.area || 0) * 10.7639).toFixed(1) }));
    setToolkitMessage(`Total: ${sqft.toFixed(1)} sq ft across ${rooms.length} zone(s). ${JSON.stringify(perRoom)}`, 'success');
  };
  const handleKonvaPerimeter = () => {
    const rooms = interpretation?.rooms || [];
    const perRoom = rooms.map((r, idx) => `${r.name || `Zone ${idx + 1}`}: ${((r.bounds?.width + r.bounds?.height) * 2)} ft`);
    setToolkitMessage(perRoom.length ? `Perimeter estimate: ${perRoom.join(' | ')}` : 'No room geometry detected yet.', 'success');
  };
  const handleToolkitOpenings = () => {
    const tags = interpretation?.rooms || [];
    const openingDensity = tags.reduce((acc, r) => acc + (r.openingsCount || 0), 0);
    setToolkitMessage(`Opening count estimate: ${openingDensity} across ${tags.length} zone(s).`, 'success');
  };
  const handleToolkitVastu = () => {
    const tags = (interpretation?.rooms || []).map((r, idx) => `${r.name || `Zone ${idx + 1}`} → ${r.orientation || r.vastu || 'UNKNOWN'}`).join(', ');
    setToolkitMessage(tags ? `Vastu orientation draft: ${tags}` : 'No spatial orientations available', 'success');
  };

  const handleAutoFurnish = async () => {
    if (!projectId) { setToolkitMessage('Open a project first.', 'error'); return; }
    setToolkitStatus('loading');
    setToolkitMessage('Auto-furnishing rooms from catalog...', 'loading');
    try {
      const roomTypes = (interpretation?.rooms || []).map(r => r.type).filter(Boolean);
      const res = await fetch(`${API_BASE}/auto-furnish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, roomTypes: roomTypes.length ? roomTypes : ['living', 'bedroom', 'kitchen'], budgetBand: 'standard' })
      });
      if (!res.ok) throw new Error('Auto-furnish failed');
      const data = await res.json();
      const roomCount = Object.keys(data.recommendations || {}).length;
      setToolkitMessage(`Auto-furnish ready for ${roomCount} room type(s). Review catalog recommendations.`, 'success');
    } catch (err) {
      console.error(err);
      setToolkitMessage('Auto-furnish failed. Try again.', 'error');
    } finally {
      setToolkitStatus('idle');
    }
  };
  const handleToolkitEnhance = async () => {
    if (!interpretation) { setToolkitMessage('Run AI detect first, then use enhance plan for refinements.', 'error'); return; }
    setToolkitStatus('enhancing');
    setToolkitMessage('Submitting plan enhancement to free model executor...', 'loading');
    try {
      const res = await fetch(`${apiUrl('')}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: 'plan-enhancer', projectId, params: { interpretation } })
      });
      if (!res.ok) throw new Error('Enhance failed');
      const data = await res.json();
      setToolkitMessage('Plan enhanced. Review updated geometry and placements.', 'success');
    } catch (err) {
      setToolkitMessage('Plan enhancement failed.', 'error');
    } finally {
      setToolkitStatus('idle');
    }
  };
  const handleToolkitExportDxf = async () => {
    if (!interpretation) { setToolkitMessage('Run AI detect first to build exportable floorplan schema.', 'error'); return; }
    setToolkitStatus('exporting');
    setToolkitMessage('Generating export package...', 'loading');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${currentVersionId || 'latest'}/drawings/dxf`, { method: 'GET' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorplan-export-${Date.now()}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
      setToolkitMessage('DXF export downloaded.', 'success');
    } catch (err) {
      setToolkitMessage('Export failed. Try again after saving a version.', 'error');
    } finally {
      setToolkitStatus('idle');
    }
  };
  const handleToolkitAreaSummary = () => handleKonvaAreaCompute();
  const handleToolkitPerimeter = () => handleKonvaPerimeter();

  if (!scene) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Plan Analyzer...</span>
      </div>
    );
  }

  const selectedTag = zoneTags.find(z => z.id === selectedRoomId);

  return (
    <div className="w-full h-[85vh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Skip link for keyboard users */}
      <a href="#floorplan-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[999] focus:bg-[#D4AF37] focus:text-slate-950 focus:px-3 focus:py-2 focus:rounded-lg focus:text-xs focus:font-bold">
        Skip to floor plan workspace
      </a>

      {/* ── TOOLBAR ── */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0" role="toolbar" aria-label="Floor plan controls">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <span className="text-[10px] px-2 py-1 bg-slate-900 rounded-md text-slate-400 font-black font-mono">v{versionNumber}.0</span>
            <button onClick={() => setShowBranchModal(true)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-1">
              <span>Variant: {branchName}</span>
              <ChevronRight className="w-3 h-3 text-slate-500 rotate-90" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              aria-label="Upload floorplan image or PDF"
              className="bg-slate-950 border border-slate-800 hover:border-[#C9A84C]/35 text-[10px] font-black uppercase tracking-wider text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Floorplan
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.dxf"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload floorplan file"
            />

            <button
              onClick={handleAiDetect}
              disabled={!projectId || isAnalyzing}
              className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/35 text-[#C9A84C] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              {isAnalyzing ? 'Detecting Zones...' : 'AI Detect Rooms'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSaveVersion} disabled={isSaving || isLocked} className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${isSaving || isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] border border-[#C9A84C]/35 shadow-md shadow-[#C9A84C]/5'}`}>
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Version</span>
          </button>

          <button onClick={handleToggleLock} className="flex items-center gap-1.5 text-xs hover:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-800 transition cursor-pointer text-left">
            {isLocked ? <><Lock className="w-3.5 h-3.5 text-amber-500" /><span className="font-semibold text-amber-500">Locked ({lockReason})</span></> : <><Unlock className="w-3.5 h-3.5 text-emerald-500" /><span className="font-semibold text-slate-300 hover:text-[#C9A84C]">Click to Lock</span></>}
          </button>

          {onComplete && (
            <button onClick={onComplete} className="bg-gradient-to-r from-[#C9A84C] to-[#AA8C2C] hover:from-[#E8C97A] hover:to-[#bfa032] text-slate-950 py-1.5 px-4 rounded-xl text-xs font-black transition shadow-lg shadow-[#C9A84C]/10">
              Next: Elevate →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex overflow-hidden" id="floorplan-main">
        <div className="w-56 h-full shrink-0" aria-label="Floor plan layers and palette">
          <LeftNavigator />
        </div>

        <div className="flex-grow h-full p-4 flex gap-4 overflow-hidden">
          {layoutMode === '2d' && (
            <div className="w-full h-full flex-1"><Canvas2D aria-label="2D floor plan canvas" /></div>
          )}
          {layoutMode === '3d' && (
            <div className="w-full h-full flex-1"><Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500">Loading 3D preview…</div>}><Viewport3DComponent2 aria-label="3D floor plan preview" /></Suspense></div>
          )}
          {layoutMode === 'split' && (
            <>
              <div className="w-1/2 h-full flex-1"><Canvas2D aria-label="2D floor plan canvas" /></div>
              <div className="w-1/2 h-full flex-1"><Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500">Loading 3D preview…</div>}><Viewport3DComponent2 aria-label="3D floor plan preview" /></Suspense></div>
            </>
          )}
        </div>

        <div className="w-80 h-full shrink-0" aria-label="Inspector and version details">
          <InspectorPanel />
        </div>
      </div>

      {/* Blank-state safeguard if shared design modules fail to render */}
      {!Canvas2D || !Viewport3D ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-2">
            <p className="text-sm font-semibold text-slate-200">Floor plan view is unavailable right now.</p>
            <p className="text-xs text-slate-400">Continue by uploading a plan, detecting rooms, or saving a version. The rest of the workflow is still active.</p>
          </div>
        </div>
      ) : null}

      {/* ── STATUS & ZONE TAGS FOOTER ── */}
      <div className="bg-slate-900/70 border-t border-slate-800 shrink-0 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Zone Detection Status</span>
            {quickAction && (
              <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2 py-0.5 rounded">
                {quickAction === 'uploading' ? 'Uploading' : quickAction === 'interpreting' ? 'Interpreting' : quickAction === 'done' ? 'Ready' : quickAction === 'error' ? 'Error' : 'Working'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSelectAllZones} className="text-[10px] font-bold uppercase border border-slate-800 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition">
              {selectedAllZones ? 'Clear Selection' : 'Select All Zones'}
            </button>
            {uploadStatus === 'review_required' && (
              <button onClick={selectedAllZones ? handleBatchApprove : handleApprove} className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {selectedAllZones ? 'Batch Approve' : 'Approve Zones'}
              </button>
            )}
            {uploadStatus === 'review_required' && (
              <button onClick={handleAiDetect} className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1">
                <Scan className="w-3.5 h-3.5" /> {isAiDetecting ? 'Cancel AI' : 'Re-run AI'}
              </button>
            )}
            {overallConfidence !== null && (
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-1 rounded-lg">
                {(overallConfidence * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true" role="status" className="text-[10px] bg-slate-900 border rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-wider mr-1">
              {toolkitStatus === 'loading' || quickAction === 'uploading' ? 'PROCESSING' : toolkitStatus === 'enhancing' ? 'ENHANCING' : toolkitStatus === 'exporting' ? 'EXPORTING' : 'STATUS'}
            </span>
            <span className="opacity-90">{toolkitMessage || (isAiDetecting ? 'AI detection in progress…' : 'Ready')}</span>
          </div>
          {isAiDetecting && (
            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">Detecting…</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['idle', 'parsing', 'interpreting', 'review_required', 'approved', 'error'].map(status => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${uploadStatus === status ? 'bg-[#C9A84C] animate-pulse' : 'bg-slate-700'}`} />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        {zoneTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Detected zones">
            <Tag className="w-4 h-4 text-slate-500 shrink-0" />
            {zoneTags.map((zone, idx) => {
              const room = (interpretation?.rooms || []).find(r => r.id === zone.id);
              const areaText = room?.bounds ? `${Math.max(0, ((room.bounds.width || 0) / 1000)).toFixed(1)}m × ${Math.max(0, ((room.bounds.height || 0) / 1000)).toFixed(1)}m` : '—';
              const letter = String.fromCharCode(97 + (idx % 26));
              return (
                <button
                  key={zone.id}
                  onClick={() => handleTagClick(zone)}
                  aria-selected={selectedRoomId === zone.id}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 transition focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${selectedRoomId === zone.id ? 'border-[#C9A84C]/70 shadow-md shadow-[#C9A84C]/10 scale-105' : 'opacity-80 hover:opacity-100'} ${zone.colorClass}`}
                >
                  <span className="mr-1 text-[9px] opacity-80 font-mono">{letter}.</span>
                  {zone.name}
                  <span className="ml-1 text-[9px] opacity-70 font-mono">{areaText}</span>
                  {zone.confidence !== null && <span className="ml-1 text-[9px] opacity-70">{(zone.confidence * 100).toFixed(0)}%</span>}
                </button>
              );
            })}
          </div>
        )}
        <div className="text-[9px] text-slate-500">Keyboard: <span className="font-mono text-slate-300">A-Z</span> select zones · <span className="font-mono text-slate-300">F5</span> AI detect · <span className="font-mono text-slate-300">Ctrl/Cmd+S</span> save · <span className="font-mono text-slate-300">Ctrl/Cmd+Z</span> undo</div>
        </div>

        {zoneTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Tag className="w-4 h-4 text-slate-500 shrink-0" />
            {zoneTags.map(zone => {
              const room = (interpretation?.rooms || []).find(r => r.id === zone.id);
              const areaText = room?.bounds ? `${Math.max(0, ((room.bounds.width || 0) / 1000)).toFixed(1)}m × ${Math.max(0, ((room.bounds.height || 0) / 1000)).toFixed(1)}m` : '—';
              return (
                <button
                  key={zone.id}
                  onClick={() => handleTagClick(zone)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 transition ${selectedRoomId === zone.id ? 'border-[#C9A84C]/70 shadow-md shadow-[#C9A84C]/10 scale-105' : 'opacity-80 hover:opacity-100'} ${zone.colorClass}`}
                >
                  {zone.name}
                  <span className="ml-1 text-[9px] opacity-70 font-mono">{areaText}</span>
                  {zone.confidence !== null && <span className="ml-1 text-[9px] opacity-70">{(zone.confidence * 100).toFixed(0)}%</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Floorplan Toolkit */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2" role="region" aria-label="Floorplan toolkit">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Floorplan Toolkit</span>
            <span className="text-[8px] font-mono text-slate-500">2D analyser + enhancer</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Analysis tools">
            <ToolButton label="Area Summary" icon={<LayoutDashboard className="w-3 h-3" />} onClick={handleToolkitAreaSummary} ariaLabel="Compute total area across all detected rooms" />
            <ToolButton label="Perimeter" icon={<Compass className="w-3 h-3" />} onClick={handleToolkitPerimeter} ariaLabel="Estimate perimeter for each detected room" />
            <ToolButton label="Openings Review" icon={<DoorOpen className="w-3 h-3" />} onClick={handleToolkitOpenings} ariaLabel="Review detected doors and windows" />
            <ToolButton label="Vastu Check" icon={<Layout className="w-3 h-3" />} onClick={handleToolkitVastu} ariaLabel="Check Vastu orientation for each zone" />
            <ToolButton label="Enhance Plan" icon={<Sparkles className="w-3 h-3" />} onClick={handleToolkitEnhance} ariaLabel="AI-assisted plan refinement" />
            <ToolButton label="Auto-Furnish" icon={<Sparkles className="w-3 h-3" />} onClick={handleAutoFurnish} ariaLabel="Auto-furnish rooms from catalog" />
            <ToolButton label="Export DXF" icon={<Download className="w-3 h-3" />} onClick={handleToolkitExportDxf} ariaLabel="Export floor plan to DXF format" />
          </div>
          <div
            aria-live="polite"
            aria-atomic="true"
            role="status"
            className={`text-[10px] bg-slate-900 border rounded-lg px-2.5 py-1.5 ${
              toolkitStatus === 'error' || toolkitMessage?.startsWith?.('Run AI detect')
                ? 'text-red-300 border-red-900/60'
                : 'text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-black uppercase tracking-wider mr-1">
              {toolkitStatus === 'loading' ? 'PROCESSING' : toolkitStatus === 'enhancing' ? 'ENHANCING' : toolkitStatus === 'exporting' ? 'EXPORTING' : 'STATUS'}
            </span>
            <span className="opacity-90">{toolkitMessage || 'Ready'}</span>
          </div>
        </div>

      {/* ── VARIANT BRANCH MODAL (reused from 3D studio) ── */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up text-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Floorplan Variant Manager</h3>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition"><AlertCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Available Variants</span>
                <button onClick={handleCreateBranch} className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/30 text-[#C9A84C] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition">+ New Variant</button>
              </div>
              <div className="space-y-2.5">
                {branches.map(b => {
                  const branchVersions = versions.filter(v => v.branchName === b);
                  const latestV = branchVersions[0] || null;
                  const totalV = branchVersions.length;
                  const isCurrentBranch = b === branchName;
                  let summary = {};
                  try { summary = latestV ? JSON.parse(latestV.summary_json || '{}') : {}; } catch(e){}
                  return (
                    <div key={b} className={`p-4 rounded-xl border flex items-center justify-between transition ${isCurrentBranch ? 'bg-[#C9A84C]/5 border-[#C9A84C]/50 shadow-md shadow-[#C9A84C]/5' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><strong className="text-xs text-slate-200 uppercase font-bold tracking-wider">{b.replace('_', ' ')}</strong>{isCurrentBranch ? <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Active</span> : null}</div>
                        <div className="text-[10px] text-slate-400">Latest Version: <b>v{latestV?.versionNumber || 1}</b> · Total: <b>{totalV}</b></div>
                        {summary?.reason && <div className="text-[10px] text-slate-500 italic">"{summary.reason}"</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrentBranch && <button onClick={() => { loadScene(projectId, b); setShowBranchModal(false); }} className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-[#C9A84C]/35 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition">Switch</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
