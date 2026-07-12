import React, { useState, useEffect, useRef } from 'react';
import { 
  Square, DoorClosed, Ruler, Move, Compass, 
  Video, Play, Save, ChevronRight, Maximize2, 
  Trash2, RefreshCw, ZoomIn, ZoomOut, Layers,
  CheckCircle, AlertTriangle, Eye, Palette, Download, Sparkles, Image
} from 'lucide-react';
import { exportToDXF, exportToSCR } from '../utils/dxf-exporter';
import CVProcessor from '../lib/cv/cv-processor';
import { roomCentroid, shiftRoom } from '../lib/roomOverlay';

export default function InteractiveCADScreen({ projectId, onComplete }) {
  // --- Workspace Vector State ---
  const [walls, setWalls] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [detectedPoints, setDetectedPoints] = useState([]); // SLAM service points
  const [pixelsPerMeter, setPixelsPerMeter] = useState(40.0);
  
  // --- View Transform State ---
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(50);
  const [activeTheme, setActiveTheme] = useState('carbon'); // 'carbon' (dark), 'blue' (blueprint), 'warm' (cream)

  // --- Floor Plan Underlay Image State ---
  const [sketchUrl, setSketchUrl] = useState('');
  const [sketchOpacity, setSketchOpacity] = useState(0.45);
  const [sketchScale, setSketchScale] = useState(1.0);
  const [sketchX, setSketchX] = useState(0);
  const [sketchY, setSketchY] = useState(0);
  
  // --- Editor Tool & Selection State ---
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'wall', 'door', 'window', 'measure', 'calibrate'
  const [selectedObj, setSelectedObj] = useState(null); // { id, type: 'wall'|'opening'|'furniture'|'room'|'measure' }
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [orthoMode, setOrthoMode] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [wallThicknessMm, setWallThicknessMm] = useState(150); // Default standard wall thickness
  
  // --- Drawing / Interaction Temp State ---
  const [tempPoints, setTempPoints] = useState([]);
  const [dragMode, setDragMode] = useState(null); // 'move', 'rotate', 'wall_node_1', 'wall_node_2'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [calibrateModal, setCalibrateModal] = useState(false);
  const [enteredLength, setEnteredLength] = useState('3.0'); // for scale calibration input
  const [pixelCalibrateDist, setPixelCalibrateDist] = useState(0);

  // --- Video Walkthrough State ---
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoWarnings, setVideoWarnings] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // --- AI Layout State ---
  const [isDetectingLayout, setIsDetectingLayout] = useState(false);
  const [cvStatus, setCvStatus] = useState(null); // { kind:'ok'|'warn'|'error', text:string }
  const [multimodalAnalysis, setMultimodalAnalysis] = useState(null);

  // --- Undo/Redo Stacks ---
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [photoElevations, setPhotoElevations] = useState([]);
  const [componentLayers, setComponentLayers] = useState({ glass: false, cane: false, handle: false, frame: false });
  const [vastuDiff, setVastuDiff] = useState(null); // { poojaPresent, changes, needsApply }
  const [vastuBusy, setVastuBusy] = useState(false);
  const [vastuApplied, setVastuApplied] = useState(false);
  const [ackText, setAckText] = useState(''); // spoken floor-plan acknowledgement
  const [showVastuOverlay, setShowVastuOverlay] = useState(false);

  // SVG viewport ref
  const svgRef = useRef(null);
  const isDraggingCanvasRef = useRef(false);
  const canvasDragStartRef = useRef({ x: 0, y: 0 });
  const hiddenCanvasRef = useRef(null);
  const detectImageInputRef = useRef(null);

  // Theme Colors dictionary
  const themeColors = {
    carbon: {
      bg: 'bg-[#0A0A0B]',
      svgBg: '#111113',
      gridMinor: '#1E1E24',
      gridMajor: '#374151',
      wallFill: '#1E1E24',
      wallStroke: '#8A8899',
      furnitureStroke: '#C9A84C',
      furnitureFill: 'rgba(201, 168, 76, 0.05)',
      textLabel: '#F0EEE8',
      servicePlumbing: '#06b6d4',
      serviceElectrical: '#f59e0b'
    },
    blue: {
      bg: 'bg-[#0d1e3d]',
      svgBg: '#09152a',
      gridMinor: '#102347',
      gridMajor: '#1b3b73',
      wallFill: '#1e3a8a',
      wallStroke: '#38bdf8',
      furnitureStroke: '#38bdf8',
      furnitureFill: 'rgba(56, 189, 248, 0.05)',
      textLabel: '#f0f9ff',
      servicePlumbing: '#06b6d4',
      serviceElectrical: '#f59e0b'
    },
    warm: {
      bg: 'bg-[#FAF8F5]',
      svgBg: '#FAF6F0',
      gridMinor: '#f3ede2',
      gridMajor: '#e9decb',
      wallFill: '#4a3f35',
      wallStroke: '#8c7a6b',
      furnitureStroke: '#C9A84C',
      furnitureFill: 'rgba(201, 168, 76, 0.03)',
      textLabel: '#3b2f2f',
      servicePlumbing: '#0891b2',
      serviceElectrical: '#d97706'
    }
  };

  const colors = themeColors[activeTheme];

  // --- Initialize CAD Data ---
  useEffect(() => {
    if (projectId) {
      loadCADData();
      loadPhotoElevations();
    }
  }, [projectId]);

  const loadPhotoElevations = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/photo-elevations`);
      const rows = await res.json();
      if (Array.isArray(rows)) setPhotoElevations(rows.reverse().slice(0, 20));
    } catch (e) { /* silent */ }
  };

  const loadCADData = async () => {
    try {
      // 1. Fetch CAD vector drawing
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad`);
      const data = await res.json();
      const safe = data && typeof data === 'object' ? data : {};
      const loadedWalls = JSON.parse(safe.walls_json || '[]');
      const loadedOpenings = JSON.parse(safe.openings_json || '[]');
      const loadedFurniture = JSON.parse(safe.furniture_json || '[]');
      const loadedRooms = JSON.parse(safe.rooms_json || '[]');
      const loadedMeasures = JSON.parse(safe.measures_json || '[]');
      const ppm = safe.pixels_per_meter || 40.0;
      
      setWalls(loadedWalls);
      setOpenings(loadedOpenings);
      setFurniture(loadedFurniture);
      setRooms(loadedRooms);
      setMeasures(loadedMeasures);
      setPixelsPerMeter(ppm);
      // Canonical flow step 1: speak/print acknowledgement once the plan is loaded
      if (loadedRooms.length || loadedFurniture.length) buildAcknowledgement();

      // Seed initial history
      const initialState = JSON.stringify({
        walls: loadedWalls,
        openings: loadedOpenings,
        furniture: loadedFurniture,
        rooms: loadedRooms,
        measures: loadedMeasures,
        pixelsPerMeter: ppm
      });
      setHistory([initialState]);
      setHistoryIndex(0);

      // 2. Fetch Project Brief to extract floorplan underlay background image
      try {
        const resProj = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}`);
        const projData = await resProj.json();
        if (projData.client_brief_json) {
          const briefData = JSON.parse(projData.client_brief_json);
          if (briefData.floorplanImageUrl) {
            setSketchUrl(`http://127.0.0.1:8787${briefData.floorplanImageUrl}`);
          }
        }
      } catch (errProj) {
        console.warn("Failed to load floorplan underlay image:", errProj);
      }

    } catch (err) {
      console.error("Error loading CAD:", err);
    }
  };

  const triggerCvDetect = async (file) => {
    setIsDetectingLayout(true);
    try {
      // PRIORITY 1: user uploaded a floorplan/room image -> server-side CV (works with ANY image)
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        window.__toast?.show('Running offline CV wall detection on your image…');
        const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad/detect-walls-vision`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          window.__toast?.show(`Detected ${data.walls} wall segment(s) via ${data.source}. Refine in the editor, then run AI Auto-Detect Layout.`);
          if (data.multimodalAnalysis) setMultimodalAnalysis(data.multimodalAnalysis);
          loadCADData();
        } else {
          window.__toast?.show(data.message || 'Wall detection failed. Trace manually in the editor.');
        }
        return;
      }
      // PRIORITY 2: an attached underlay exists -> client-side CV (legacy path)
      if (!sketchUrl) {
        // No image at all: open the file picker so the user can supply one.
        detectImageInputRef.current?.click();
        return;
      }
      // 1. Load the underlay image into an offscreen canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sketchUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Could not load underlay image'));
      });

      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const srcCanvas = hiddenCanvasRef.current || document.createElement('canvas');
      srcCanvas.width = w; srcCanvas.height = h;
      const sctx = srcCanvas.getContext('2d');
      sctx.drawImage(img, 0, 0, w, h);

      // 2. Binarize (real CV line-detection preprocessing)
      const binCanvas = document.createElement('canvas');
      binCanvas.width = w; binCanvas.height = h;
      CVProcessor.processImage(srcCanvas, binCanvas, 0, 1.2, 140, false);

      // 3. Detect walls + openings from the binarized image
      const result = CVProcessor.detectWallsAndOpenings(binCanvas, { lineThicknessGap: 15, snapTolerance: 25 });

      if (!result.walls || result.walls.length === 0) {
        window.__toast?.show("No walls detected in the image. Try a higher-contrast sketch, or upload one via 'Detect Walls From Image'.");
        return;
      }

      // 4. Map detected segments -> CAD wall state (convert px coords directly)
      const newWalls = result.walls.map(seg => ({
        id: 'wall_' + Math.random().toString(36).substr(2, 6),
        x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2,
        thickness: (wallThicknessMm / 1000) * pixelsPerMeter,
        material: 'drywall'
      }));

      // Map detected openings -> opening state on the nearest new wall
      const newOpenings = (result.openings || []).map(op => ({
        id: 'op_' + Math.random().toString(36).substr(2, 6),
        type: op.type || 'door',
        x: op.x != null ? op.x : ((op.x1 || 0) + (op.x2 || 0)) / 2,
        y: op.y != null ? op.y : ((op.y1 || 0) + (op.y2 || 0)) / 2,
        width: op.width || 40,
        angle: op.angle || 0,
        wallId: ''
      })).filter(o => o.x || o.y);

      setWalls(newWalls);
      setOpenings(newOpenings.length ? newOpenings : openings);
      saveToHistory(newWalls, newOpenings.length ? newOpenings : openings, furniture, rooms, measures);

      // 5. Persist to server so AI layout interpretation can run on traced walls
      await saveCADToServer();
      window.__toast?.show(`Detected ${newWalls.length} wall segment(s) from the image. Review and refine in the editor, then run AI Auto-Detect Layout.`);
    } catch (err) {
      console.error(err);
      window.__toast?.show("Wall detection failed: " + err.message);
    } finally {
      setIsDetectingLayout(false);
    }
  };

  const onDetectImagePicked = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) triggerCvDetect(f);
    e.target.value = '';
  };

  const triggerAiDetect = async () => {
    setIsDetectingLayout(true);
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad/ai-detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.fallback) {
          window.__toast?.show("AI generated a standards-based starter layout (no walls traced yet). Upload a floorplan or trace walls for a custom plan.");
        } else {
          window.__toast?.show("Floorplan interpreted: rooms detected and cabinet modules placed. Review the result in the CAD editor.");
        }
        loadCADData();
      } else if (res.status === 422) {
        window.__toast?.show(data.message || "Trace the walls and openings in the CAD editor first, then run interpretation.");
      } else {
        window.__toast?.show(data.error || "Floorplan interpretation failed.");
      }
    } catch (err) {
      console.error(err);
      window.__toast?.show("Error contacting AI layout engine.");
    } finally {
      setIsDetectingLayout(false);
    }
  };

  // --- Push history helper ---
  const saveToHistory = (newWalls, newOpenings, newFurniture, newRooms, newMeasures, ppm = pixelsPerMeter) => {
    const state = JSON.stringify({
      walls: newWalls,
      openings: newOpenings,
      furniture: newFurniture,
      rooms: newRooms,
      measures: newMeasures,
      pixelsPerMeter: ppm
    });
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, state]);
    setHistoryIndex(updatedHistory.length);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      const state = JSON.parse(history[idx]);
      setWalls(state.walls);
      setOpenings(state.openings);
      setFurniture(state.furniture);
      setRooms(state.rooms);
      setMeasures(state.measures);
      setPixelsPerMeter(state.pixelsPerMeter);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      const state = JSON.parse(history[idx]);
      setWalls(state.walls);
      setOpenings(state.openings);
      setFurniture(state.furniture);
      setRooms(state.rooms);
      setMeasures(state.measures);
      setPixelsPerMeter(state.pixelsPerMeter);
    }
  };

  // --- Auto-Vastu: preview proposed fixes (full scan) ---
  const runVastuCheck = async () => {
    setVastuBusy(true);
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/vastu/analyze`);
      const data = await res.json();
      if (res.ok) setVastuDiff(data);
    } catch (e) {
      console.error('vastu analyze failed', e);
    } finally {
      setVastuBusy(false);
    }
  };

  const applyVastuFix = async () => {
    setVastuBusy(true);
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/vastu/auto-apply-full`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (res.ok && data.applied?.length) {
        window.__toast?.show(`Vastu applied: ${data.applied.length} fix(es)`);
        setVastuApplied(true);
        setVastuDiff({ ...(vastuDiff || {}), needsApply: false });
        // reload furniture so the canvas reflects the change
        const cad = await (await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad`)).json();
        if (cad?.furniture) setFurniture(cad.furniture);
      }
    } catch (e) {
      console.error('vastu apply failed', e);
    } finally {
      setVastuBusy(false);
    }
  };

  // --- Spoken + banner acknowledgement of the analyzed floor plan ---
  const speak = (text) => {
    setAckText(text);
    try { if (window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 1; window.speechSynthesis.speak(u); } } catch (_) {}
  };
  const buildAcknowledgement = () => {
    const bedrooms = rooms.filter(r => /bed|sleep/i.test(r.name || r.type || '')).length
      || furniture.filter(f => /bed/i.test(f.name || f.type || '')).length;
    const type = bedrooms >= 4 ? '4BHK' : bedrooms === 3 ? '3BHK' : bedrooms === 2 ? '2BHK' : bedrooms === 1 ? '1BHK' : 'APARTMENT';
    const roomCount = rooms.length || furniture.length || 0;
    speak(`OKAY I SEE IT IS A ${type} BEAUTIFUL APARTMENT WITH ${roomCount} ZONES — ANALYSING NOW`);
  };

  // --- Kitchen template picker (canonical step 7) ---
  const applyKitchenShape = async (shape) => {
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/kitchen/template`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shape })
      });
      const data = await res.json();
      if (res.ok) { window.__toast?.show(`Kitchen ${shape}-shape applied`); const cad = await (await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad`)).json(); if (cad?.furniture) setFurniture(cad.furniture); }
    } catch (e) { console.error(e); }
  };

  // --- Modular TV-unit library (canonical step 8) ---
  const [tvUnits, setTvUnits] = useState([]);
  const [tvBusy, setTvBusy] = useState(false);
  const loadTvUnits = async () => {
    try { const d = await (await fetch('http://127.0.0.1:8787/api/tv-units')).json(); setTvUnits(d); } catch (e) { console.error(e); }
  };
  const applyTvUnitStyle = async (unitId) => {
    setTvBusy(true);
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/tv-unit/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unitId })
      });
      const data = await res.json();
      if (res.ok) { window.__toast?.show('TV unit style applied'); const cad = await (await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad`)).json(); if (cad?.furniture) setFurniture(cad.furniture); }
    } catch (e) { console.error(e); } finally { setTvBusy(false); }
  };
  const saveCADToServer = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walls,
          openings,
          furniture,
          rooms,
          measures,
          pixelsPerMeter
        })
      });
      const data = await res.json();
      if (data.success) {
        window.__toast?.show("Floorplan drawing saved successfully!");
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error("Error saving CAD:", err);
    }
  };

  // --- Dimension SLAM Video walkthrough verification ---
  const triggerVideoUpload = () => {
    fileInputRef.current.click();
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadProgress(15);
    
    const formData = new FormData();
    formData.append('video', file);

    try {
      // Simulate progress ticks
      const timer = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 12, 90));
      }, 300);

      const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad/video`, {
        method: 'POST',
        body: formData
      });
      clearInterval(timer);
      setUploadProgress(100);

      const data = await res.json();
      
      if (Array.isArray(data.detectedPoints)) {
        setDetectedPoints(data.detectedPoints);
      }
      if (Array.isArray(data.warnings)) {
        setVideoWarnings(data.warnings);
      }
      if (data.calibrationSuggestion) {
        // Automatically place suggested measurements or alert
        window.__toast?.show(`SLAM analysis detected dimension deviations. Suggested scale recalibration: ${data.calibrationSuggestion.suggestedLengthMeters}m`);
      }
      
      setTimeout(() => {
        setIsUploadingVideo(false);
      }, 500);

    } catch (err) {
      console.error("Video analysis failed:", err);
      setIsUploadingVideo(false);
    }
  };

  // --- Coordinates & Snapping Helpers ---
  const getMouseCoords = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convert screen coordinates to SVG workspace coordinate space (accounting for pan and zoom)
    const workX = (x - panX) / zoom;
    const workY = (y - panY) / zoom;

    return { x: workX, y: workY };
  };

  const applySnaps = (pos) => {
    let x = pos.x;
    let y = pos.y;

    // Ortho Snap (angles 0, 45, 90, 135...)
    if (orthoMode && tempPoints.length > 0) {
      const origin = tempPoints[tempPoints.length - 1];
      const dx = x - origin.x;
      const dy = y - origin.y;
      const angle = Math.atan2(dy, dx);
      const angleDeg = (angle * 180) / Math.PI;
      const snappedAngle = Math.round(angleDeg / 45) * 45;
      const snappedRad = (snappedAngle * Math.PI) / 180;
      const dist = Math.hypot(dx, dy);

      x = origin.x + dist * Math.cos(snappedRad);
      y = origin.y + dist * Math.sin(snappedRad);
      return { x, y };
    }

    // Nearest Wall Endpoint Snap
    const snapTolerance = 15 / zoom;
    for (const wall of walls) {
      if (Math.hypot(x - wall.x1, y - wall.y1) < snapTolerance) {
        return { x: wall.x1, y: wall.y1 };
      }
      if (Math.hypot(x - wall.x2, y - wall.y2) < snapTolerance) {
        return { x: wall.x2, y: wall.y2 };
      }
    }

    // Grid Snap
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    return { x, y };
  };

  // --- Room overlay: inline rename state + commit (drag math lives in lib/roomOverlay) ---
  const [renamingRoom, setRenamingRoom] = useState(null); // room id being renamed inline
  const renamingCancelledRef = useRef(false); // Escape must cancel, never commit on unmount-blur
  const roomMovedRef = useRef(false); // tracks whether a room drag actually moved (avoids junk saves)
  const cancelRoomRename = () => {
    renamingCancelledRef.current = true;
    setRenamingRoom(null);
  };
  const commitRoomRename = (id, value) => {
    if (renamingCancelledRef.current) {
      renamingCancelledRef.current = false;
      setRenamingRoom(null);
      return;
    }
    const name = (value || '').trim();
    if (name) {
      const updated = rooms.map(r => r.id === id ? { ...r, name } : r);
      setRooms(updated);
      saveToHistory(walls, openings, furniture, updated, measures);
      saveCADToServer();
    }
    setRenamingRoom(null);
  };
  // Wall connection joint propagation (stretches walls connected at a shared corner point)
  const propagateWallStretch = (wallId, targetNode, snappedX, snappedY, oldX, oldY) => {
    const updatedWalls = walls.map(w => {
      // Find other walls that shared the starting corner point
      const wallNodeTolerance = 10;
      let newW = { ...w };
      
      if (w.id === wallId) {
        if (targetNode === '1') {
          newW.x1 = snappedX;
          newW.y1 = snappedY;
        } else {
          newW.x2 = snappedX;
          newW.y2 = snappedY;
        }
      } else {
        if (Math.hypot(w.x1 - oldX, w.y1 - oldY) < wallNodeTolerance) {
          newW.x1 = snappedX;
          newW.y1 = snappedY;
        }
        if (Math.hypot(w.x2 - oldX, w.y2 - oldY) < wallNodeTolerance) {
          newW.x2 = snappedX;
          newW.y2 = snappedY;
        }
      }
      return newW;
    });
    setWalls(updatedWalls);
  };

  // --- SVG Mouse Event Handlers ---
  const handleSVGMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'pan') {
      isDraggingCanvasRef.current = true;
      canvasDragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const mousePos = getMouseCoords(e);
    const snapped = applySnaps(mousePos);

    // select mode
    if (activeTool === 'select') {
      // Check handles click first
      const handleElement = e.target.closest('.wall-joint-handle');
      if (handleElement) {
        const id = handleElement.getAttribute('data-id');
        const node = handleElement.getAttribute('data-node');
        const w = walls.find(wall => wall.id === id);
        
        setDragMode(node === '1' ? 'wall_node_1' : 'wall_node_2');
        setSelectedObj({ id, type: 'wall' });
        setDragStart({ x: node === '1' ? w.x1 : w.x2, y: node === '1' ? w.y1 : w.y2 });
        return;
      }

      // Check click on items
      const furnitureElement = e.target.closest('.furniture-shape');
      if (furnitureElement) {
        const id = furnitureElement.getAttribute('data-id');
        const fItem = furniture.find(item => item.id === id);
        setSelectedObj({ id, type: 'furniture' });
        setDragMode('move');
        setDragOffset({ x: mousePos.x - fItem.x, y: mousePos.y - fItem.y });
        return;
      }

      const openingElement = e.target.closest('.opening-shape');
      if (openingElement) {
        const id = openingElement.getAttribute('data-id');
        const opItem = openings.find(item => item.id === id);
        setSelectedObj({ id, type: 'opening' });
        setDragMode('move');
        setDragOffset({ x: mousePos.x - opItem.x, y: mousePos.y - opItem.y });
        return;
      }

      const wallElement = e.target.closest('.wall-line-click');
      if (wallElement) {
        const id = wallElement.getAttribute('data-id');
        setSelectedObj({ id, type: 'wall' });
        return;
      }

      // Room overlay node (persisted review layer)
      const roomElement = e.target.closest('.room-node');
      if (roomElement) {
        const id = roomElement.getAttribute('data-id');
        const rItem = rooms.find(r => r.id === id);
        if (rItem) {
          setSelectedObj({ id, type: 'room' });
          const c = roomCentroid(rItem, rooms.indexOf(rItem));
          setDragMode('move');
          roomMovedRef.current = false;
          setDragOffset({ x: mousePos.x - c.x, y: mousePos.y - c.y });
        }
        return;
      }

      setSelectedObj(null);
    } 

    // draw wall mode
    else if (activeTool === 'wall') {
      if (tempPoints.length === 0) {
        setTempPoints([snapped]);
      } else {
        const startPt = tempPoints[tempPoints.length - 1];
        if (Math.hypot(snapped.x - startPt.x, snapped.y - startPt.y) > 10) {
          const newWall = {
            id: 'wall_' + Math.random().toString(36).substr(2, 6),
            x1: startPt.x,
            y1: startPt.y,
            x2: snapped.x,
            y2: snapped.y,
            thickness: (wallThicknessMm / 1000) * pixelsPerMeter,
            material: 'drywall'
          };
          const updatedWalls = [...walls, newWall];
          setWalls(updatedWalls);
          setTempPoints([snapped]);
          saveToHistory(updatedWalls, openings, furniture, rooms, measures);
        }
      }
    }

    // add openings
    else if (activeTool === 'door' || activeTool === 'window') {
      const nearestWall = findNearestWallSegment(mousePos);
      if (nearestWall && nearestWall.distance < 30) {
        const newOp = {
          id: 'op_' + Math.random().toString(36).substr(2, 6),
          type: activeTool,
          x: nearestWall.projX,
          y: nearestWall.projY,
          width: activeTool === 'window' ? 50 : 40,
          angle: nearestWall.angle,
          wallId: nearestWall.wallId
        };
        const updatedOpenings = [...openings, newOp];
        setOpenings(updatedOpenings);
        saveToHistory(walls, updatedOpenings, furniture, rooms, measures);
        setActiveTool('select');
      }
    }

    // add linear measurement helper
    else if (activeTool === 'measure') {
      if (tempPoints.length === 0) {
        setTempPoints([snapped]);
      } else {
        const startPt = tempPoints[0];
        const newMeasure = {
          id: 'measure_' + Date.now(),
          x1: startPt.x,
          y1: startPt.y,
          x2: snapped.x,
          y2: snapped.y
        };
        const updatedMeasures = [...measures, newMeasure];
        setMeasures(updatedMeasures);
        setTempPoints([]);
        saveToHistory(walls, openings, furniture, rooms, updatedMeasures);
        setActiveTool('select');
      }
    }

    // add camera keyframe node
    else if (activeTool === 'camera') {
      const newCam = {
        id: 'camera_' + Math.random().toString(36).substr(2, 6),
        type: 'camera',
        name: 'CAM ' + (furniture.filter(f => f.type === 'camera').length + 1),
        x: snapped.x,
        y: snapped.y,
        width: 16,
        height: 16,
        rotation: 0
      };
      const updatedFurniture = [...furniture, newCam];
      setFurniture(updatedFurniture);
      saveToHistory(walls, openings, updatedFurniture, rooms, measures);
      setActiveTool('select');
    }

    // laser calibration mode
    else if (activeTool === 'calibrate') {
      if (tempPoints.length === 0) {
        setTempPoints([mousePos]);
      } else {
        const startPt = tempPoints[0];
        const dist = Math.hypot(mousePos.x - startPt.x, mousePos.y - startPt.y);
        setPixelCalibrateDist(dist);
        setTempPoints([]);
        setCalibrateModal(true);
      }
    }
  };

  const handleSVGMouseMove = (e) => {
    const mousePos = getMouseCoords(e);

    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - canvasDragStartRef.current.x;
      const dy = e.clientY - canvasDragStartRef.current.y;
      setPanX(prevX => prevX + dx);
      setPanY(prevY => prevY + dy);
      canvasDragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'select' && selectedObj && dragMode) {
      const snapped = applySnaps(mousePos);
      
      if (dragMode.startsWith('wall_node_')) {
        const id = selectedObj.id;
        const wall = walls.find(w => w.id === id);
        const node = dragMode === 'wall_node_1' ? '1' : '2';
        
        const oldX = node === '1' ? wall.x1 : wall.x2;
        const oldY = node === '1' ? wall.y1 : wall.y2;
        
        propagateWallStretch(id, node, snapped.x, snapped.y, oldX, oldY);
      } 
      
      else if (dragMode === 'move') {
        if (selectedObj.type === 'furniture') {
          const fItem = furniture.find(item => item.id === selectedObj.id);
          const nearestWall = findNearestWallSegment(mousePos);
          let newX = snapped.x;
          let newY = snapped.y;
          let newRotation = fItem.rotation;
          
          const isCabinetry = ['wardrobe', 'kitchen_base', 'tv_unit', 'counter'].includes(fItem.type);
          if (isCabinetry && nearestWall && nearestWall.distance < 40) {
            newX = nearestWall.projX;
            newY = nearestWall.projY;
            newRotation = Math.round(nearestWall.angle);
          } else {
            newX = snapped.x - (snapToGrid ? 0 : dragOffset.x % gridSize);
            newY = snapped.y - (snapToGrid ? 0 : dragOffset.y % gridSize);
          }

          const updatedFurniture = furniture.map(f => {
            if (f.id === selectedObj.id) {
              return { ...f, x: newX, y: newY, rotation: newRotation };
            }
            return f;
          });
          setFurniture(updatedFurniture);
        }
        else if (selectedObj.type === 'opening') {
          const nearestWall = findNearestWallSegment(mousePos);
          const updatedOpenings = openings.map(op => {
            if (op.id === selectedObj.id) {
              if (nearestWall && nearestWall.distance < 30) {
                return { ...op, x: nearestWall.projX, y: nearestWall.projY, angle: nearestWall.angle, wallId: nearestWall.wallId };
              } else {
                return { ...op, x: snapped.x, y: snapped.y };
              }
            }
            return op;
          });
          setOpenings(updatedOpenings);
        }
        else if (selectedObj.type === 'room') {
          const target = rooms.find(r => r.id === selectedObj.id);
          if (target) {
            const c = roomCentroid(target, rooms.indexOf(target));
            const dx = (snapped.x - dragOffset.x) - c.x;
            const dy = (snapped.y - dragOffset.y) - c.y;
            if (dx !== 0 || dy !== 0) roomMovedRef.current = true;
            const updatedRooms = rooms.map(r => r.id === selectedObj.id ? shiftRoom(r, dx, dy) : r);
            setRooms(updatedRooms);
          }
        }
      }
    }
    
    // update temp drawing guides
    if (tempPoints.length > 0 && (activeTool === 'wall' || activeTool === 'measure' || activeTool === 'calibrate')) {
      // triggers visual re-render of temp coordinate lines
      setTempPoints([tempPoints[0], applySnaps(mousePos)]);
    }
  };

  const handleSVGMouseUp = () => {
    isDraggingCanvasRef.current = false;
    if (dragMode) {
      if (selectedObj?.type === 'room' && roomMovedRef.current) saveCADToServer();
      setDragMode(null);
      if (roomMovedRef.current) saveToHistory(walls, openings, furniture, rooms, measures);
      roomMovedRef.current = false;
    }
  };

  // --- Wheel Zoom ---
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev * zoomFactor, 6.0));
    } else {
      setZoom(prev => Math.max(prev / zoomFactor, 0.2));
    }
  };

  // Find nearest Wall Segment to snap/lock items onto
  const findNearestWallSegment = (pt) => {
    let bestDist = Infinity;
    let bestProjX = 0;
    let bestProjY = 0;
    let bestAngle = 0;
    let bestWallId = null;

    walls.forEach(w => {
      // Calculate projection point on wall line segment
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return;

      let t = ((pt.x - w.x1) * dx + (pt.y - w.y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t)); // clamp to line segment bounds

      const projX = w.x1 + t * dx;
      const projY = w.y1 + t * dy;
      const dist = Math.hypot(pt.x - projX, pt.y - projY);

      if (dist < bestDist) {
        bestDist = dist;
        bestProjX = projX;
        bestProjY = projY;
        bestAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        bestWallId = w.id;
      }
    });

    return { distance: bestDist, projX: bestProjX, projY: bestProjY, angle: bestAngle, wallId: bestWallId };
  };

  // Delete active selection
  const handleDeleteSelected = () => {
    if (!selectedObj) return;
    
    let updatedWalls = walls;
    let updatedOpenings = openings;
    let updatedFurniture = furniture;
    let updatedMeasures = measures;

    if (selectedObj.type === 'wall') {
      updatedWalls = walls.filter(w => w.id !== selectedObj.id);
      setWalls(updatedWalls);
    } else if (selectedObj.type === 'opening') {
      updatedOpenings = openings.filter(op => op.id !== selectedObj.id);
      setOpenings(updatedOpenings);
    } else if (selectedObj.type === 'furniture') {
      updatedFurniture = furniture.filter(f => f.id !== selectedObj.id);
      setFurniture(updatedFurniture);
    } else if (selectedObj.type === 'measure') {
      updatedMeasures = measures.filter(m => m.id !== selectedObj.id);
      setMeasures(updatedMeasures);
    }

    setSelectedObj(null);
    saveToHistory(updatedWalls, updatedOpenings, updatedFurniture, rooms, updatedMeasures);
  };

  // Add furniture library items
  const addFurnitureSym = (type) => {
    const symbolWidths = { bed: 75, wardrobe: 85, table: 60, counter: 90, kitchen_base: 80, tv_unit: 100 };
    const w = symbolWidths[type] || 60;
    
    // Spawn at center screen relative to panning
    const svgEl = svgRef.current;
    const viewW = svgEl ? svgEl.clientWidth : 800;
    const viewH = svgEl ? svgEl.clientHeight : 500;
    const spawnX = (viewW / 2 - panX) / zoom;
    const spawnY = (viewH / 2 - panY) / zoom;

    const newItem = {
      id: 'furn_' + Date.now(),
      name: type.replace('_', ' ').toUpperCase(),
      type,
      x: Math.round(spawnX / gridSize) * gridSize,
      y: Math.round(spawnY / gridSize) * gridSize,
      width: w,
      height: type === 'wardrobe' ? 30 : type === 'bed' ? 80 : type === 'kitchen_base' ? 24 : type === 'tv_unit' ? 20 : 40,
      rotation: 0
    };

    const updatedFurniture = [...furniture, newItem];
    setFurniture(updatedFurniture);
    saveToHistory(walls, openings, updatedFurniture, rooms, measures);
  };

  // Scale calibration modal trigger
  const applyScaleCalibration = () => {
    const distanceVal = parseFloat(enteredLength);
    if (!isNaN(distanceVal) && distanceVal > 0 && pixelCalibrateDist > 0) {
      const calculatedPpm = pixelCalibrateDist / distanceVal;
      setPixelsPerMeter(calculatedPpm);
      setCalibrateModal(false);
      setTempPoints([]);
      saveToHistory(walls, openings, furniture, rooms, measures, calculatedPpm);
    }
  };

  const getWallsBoundingBox = () => {
    if (!walls.length) return { minX: 100, minY: 100, maxX: 700, maxY: 500 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    walls.forEach(w => {
      minX = Math.min(minX, w.x1, w.x2);
      minY = Math.min(minY, w.y1, w.y2);
      maxX = Math.max(maxX, w.x1, w.x2);
      maxY = Math.max(maxY, w.y1, w.y2);
    });
    return {
      minX: minX - 40,
      minY: minY - 40,
      maxX: maxX + 40,
      maxY: maxY + 40
    };
  };

  // Format metric or imperial label
  const formatMeters = (pxVal) => {
    const meters = pxVal / pixelsPerMeter;
    return `${meters.toFixed(2)}m`;
  };

  const getWallLength = (w) => {
    const pxLen = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    return formatMeters(pxLen);
  };

  return (
    <div className="flex flex-col xl:flex-row h-[85vh] text-slate-200 select-none bg-slate-950 p-4 gap-4">
      {/* Hidden offscreen canvas for CV wall detection from underlay image */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* Spoken floor-plan acknowledgement banner (canonical flow step 1) */}
      {ackText && (
        <div className="w-full xl:w-full bg-gradient-to-r from-[#1a1407] to-[#0b0f17] border border-[#C9A84C]/40 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
          <span className="text-[var(--gold)] text-lg">🛈</span>
          <span className="text-sm font-bold text-slate-100 tracking-wide flex-1">{ackText}</span>
          <button onClick={() => speak(ackText)} className="text-[10px] uppercase font-bold text-[var(--gold)] border border-[var(--gold)]/40 rounded px-2 py-1 hover:bg-[var(--gold)]/10">🔊 Replay</button>
        </div>
      )}

      {/* 1. Left CAD Controls Palette */}
      <div className="w-full xl:w-72 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-500 mb-1 flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> Drafting Workspace
          </h2>
          <p className="text-[10px] text-slate-400">Precision 2D blueprint drafting engine</p>
        </div>

        {/* Action Tools Palette */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Tool</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'select', label: 'Select', icon: <Move className="w-4 h-4" /> },
              { id: 'wall', label: 'Wall', icon: <Square className="w-4 h-4" /> },
              { id: 'measure', label: 'Measure', icon: <Ruler className="w-4 h-4" /> },
              { id: 'door', label: 'Door', icon: <DoorClosed className="w-4 h-4" /> },
              { id: 'calibrate', label: 'Calibrate', icon: <RefreshCw className="w-4 h-4" /> },
              { id: 'camera', label: 'Camera', icon: <Video className="w-4 h-4" /> },
              { id: 'pan', label: 'Pan', icon: <Maximize2 className="w-4 h-4" /> }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setTempPoints([]); }}
                className={`py-2 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 transition ${
                  activeTool === tool.id 
                    ? 'bg-brand-500/10 border-brand-500 text-brand-500 shadow-md' 
                    : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400'
                }`}
              >
                {tool.icon}
                <span className="text-[9px]">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Snap & constraint options */}
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Drafting Aids</label>
          <div className="flex items-center justify-between">
            <span>Snap to Grid</span>
            <input 
              type="checkbox" 
              checked={snapToGrid} 
              onChange={() => setSnapToGrid(!snapToGrid)}
              className="accent-brand-500 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Ortho Angle Constraints</span>
            <input 
              type="checkbox" 
              checked={orthoMode} 
              onChange={() => setOrthoMode(!orthoMode)}
              className="accent-brand-500 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Wall Thickness preset:</span>
            <select
              value={wallThicknessMm}
              onChange={(e) => setWallThicknessMm(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 outline-none focus:border-brand-500"
            >
              <option value="100">100mm (Internal Partition)</option>
              <option value="150">150mm (Standard Wall)</option>
              <option value="230">230mm (Brick Main Wall)</option>
              <option value="300">300mm (Thick Structural)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Calibration Scale</span>
            <span className="font-mono text-[#C9A84C]">{pixelsPerMeter.toFixed(1)} px/m</span>
          </div>
        </div>

        {/* Add Library Symbols */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Symbols Library</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button onClick={() => addFurnitureSym('bed')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + Bed
            </button>
            <button onClick={() => addFurnitureSym('wardrobe')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + Wardrobe
            </button>
            <button onClick={() => addFurnitureSym('kitchen_base')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + Kitchen Base
            </button>
            <button onClick={() => addFurnitureSym('tv_unit')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + TV Unit
            </button>
            <button onClick={() => addFurnitureSym('table')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + Table
            </button>
            <button onClick={() => addFurnitureSym('counter')} className="bg-slate-950/60 border border-slate-850 hover:border-slate-700 py-1.5 rounded-lg transition">
              + Counter
            </button>
          </div>
        </div>

        {/* AI Layout Engine */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Layout Assistant
          </label>
          <button
            onClick={triggerAiDetect}
            disabled={isDetectingLayout}
            className="w-full py-2.5 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/45 text-[#C9A84C] text-xs font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDetectingLayout ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Auto-Detect Layout
          </button>
          <button
            onClick={() => triggerCvDetect()}
            disabled={isDetectingLayout}
            title="Detect walls from an uploaded floorplan/room image (works with any image), or the attached underlay"
            className="w-full py-2 bg-[#2DD4AA]/10 hover:bg-[#2DD4AA]/20 border border-[#2DD4AA]/45 text-[#2DD4AA] text-xs font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Image className="w-3.5 h-3.5" />
            Detect Walls From Image
          </button>
          <input ref={detectImageInputRef} type="file" accept="image/*" className="hidden" onChange={onDetectImagePicked} />
        </div>

        {/* Selected Item Properties Panel */}
        {selectedObj && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
              <span className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">Properties</span>
              <button onClick={handleDeleteSelected} className="text-red-400 hover:text-red-300 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {selectedObj.type === 'wall' && (
              <div className="text-xs space-y-2.5 text-slate-400">
                <div><b>Wall ID:</b> {selectedObj.id}</div>
                <div><b>Length:</b> {walls.find(w => w.id === selectedObj.id) ? getWallLength(walls.find(w => w.id === selectedObj.id)) : ''}</div>
                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Change Wall Thickness:</span>
                  <select
                    value={walls.find(w => w.id === selectedObj.id) ? Math.round((walls.find(w => w.id === selectedObj.id).thickness / pixelsPerMeter) * 1000) : 150}
                    onChange={(e) => {
                      const mm = parseInt(e.target.value);
                      const updated = walls.map(w => w.id === selectedObj.id ? { ...w, thickness: (mm / 1000) * pixelsPerMeter } : w);
                      setWalls(updated);
                      saveToHistory(updated, openings, furniture, rooms, measures);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="100">100mm (Internal Partition)</option>
                    <option value="150">150mm (Standard Wall)</option>
                    <option value="230">230mm (Brick Main Wall)</option>
                    <option value="300">300mm (Thick Structural)</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    window.open(`http://127.0.0.1:8787/api/projects/${projectId}/drawings/elevations/${selectedObj.id}/dxf`);
                  }}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[#C9A84C] font-extrabold text-[10px] uppercase rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#C9A84C]" />
                  Download Elevation DXF
                </button>
              </div>
            )}

            {selectedObj.type === 'furniture' && (
              <div className="text-xs space-y-2 text-slate-400">
                <div><b>Symbol:</b> {furniture.find(f => f.id === selectedObj.id)?.name}</div>
                {furniture.find(f => f.id === selectedObj.id)?.type === 'camera' && (
                  <div className="text-[10px] text-[var(--gold)] font-bold uppercase tracking-wider">Camera Path Keyframe</div>
                )}
                <div className="flex items-center gap-2">
                  <span>Rotate:</span>
                  <input
                    type="range" min="0" max="360" step="15"
                    value={furniture.find(f => f.id === selectedObj.id)?.rotation || 0}
                    onChange={(e) => {
                      const updated = furniture.map(f => f.id === selectedObj.id ? { ...f, rotation: parseInt(e.target.value) } : f);
                      setFurniture(updated);
                    }}
                    className="accent-brand-500 w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-Vastu panel (canonical flow step 5-6) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-widest block">Auto-Vastu</label>
            <button onClick={runVastuCheck} disabled={vastuBusy} className="text-[10px] uppercase font-bold text-slate-300 border border-slate-700 rounded px-2 py-1 hover:border-[var(--gold)]/50 disabled:opacity-40">Check</button>
          </div>
          {vastuDiff && (
            <div className="space-y-1.5">
              {vastuDiff.poojaPresent === false && (
                <div className="text-[10px] text-amber-300/90">• No Pooja unit found — will add one in North-East (NE).</div>
              )}
              {vastuDiff.changes?.filter(c => c.kind === 'move_bed').map((c, i) => (
                <div key={i} className="text-[10px] text-amber-300/90">• {c.summary}</div>
              ))}
              {vastuDiff.needsApply ? (
                <button onClick={applyVastuFix} disabled={vastuBusy} className="w-full mt-1 bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-slate-950 font-black py-1.5 rounded-lg text-[10px] uppercase transition disabled:opacity-40">
                  {vastuBusy ? 'Applying…' : 'Apply Vastu Fixes'}
                </button>
              ) : (
                <div className="text-[10px] text-emerald-400">✓ Plan is Vastu-compliant.</div>
              )}
            </div>
          )}
          {vastuApplied && <div className="text-[10px] text-emerald-400">✓ Applied & saved to plan.</div>}
        </div>

        {/* Kitchen template picker (canonical flow step 7) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2">
          <label className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-widest block">Kitchen Layout</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => applyKitchenShape('L')} className="py-2 rounded-lg border border-slate-700 text-[10px] font-bold uppercase hover:border-[var(--gold)]/50 hover:text-[var(--gold)]">L-Shape</button>
            <button onClick={() => applyKitchenShape('U')} className="py-2 rounded-lg border border-slate-700 text-[10px] font-bold uppercase hover:border-[var(--gold)]/50 hover:text-[var(--gold)]">U-Shape</button>
          </div>
        </div>

        {/* Modular TV-unit library (canonical flow step 8) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-widest block">TV Unit Library</label>
            <button onClick={loadTvUnits} className="text-[10px] uppercase font-bold text-slate-300 border border-slate-700 rounded px-2 py-0.5 hover:border-[var(--gold)]/50">Load</button>
          </div>
          {tvUnits.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {tvUnits.map(u => (
                <button key={u.id} onClick={() => applyTvUnitStyle(u.id)} disabled={tvBusy}
                  className="text-left rounded-lg border border-slate-800 hover:border-[var(--gold)]/60 p-1.5 flex items-center gap-2 disabled:opacity-50">
                  <span className="w-4 h-4 rounded-sm shrink-0" style={{ background: u.color }} />
                  <span className="text-[9px] leading-tight text-slate-300">{u.name}</span>
                </button>
              ))}
            </div>
          )}
          {tvUnits.length === 0 && <div className="text-[9px] text-slate-500">Click Load to browse 14+ modular styles.</div>}
        </div>

        {/* Theme Settings Selector */}
        <div className="mt-auto space-y-2 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Drafting Theme</label>
          <div className="flex border border-slate-800 rounded-lg p-1 bg-slate-950 gap-1.5 text-[10px] font-extrabold uppercase">
            {[
              { id: 'carbon', label: 'Carbon' },
              { id: 'blue', label: 'Blueprint' },
              { id: 'warm', label: 'Drafting' }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                className={`flex-1 py-1 rounded transition ${
                  activeTheme === theme.id 
                    ? 'bg-slate-800 text-brand-500' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 2. Interactive SVG Canvas Drafting Sheet */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col">
        {/* Calibration Banner */}
        {activeTool === 'calibrate' && (
          <div className="bg-brand-500/10 border-b border-brand-500/30 px-6 py-2.5 text-xs text-brand-500 flex items-center gap-2 font-bold z-20 shrink-0">
            <Ruler className="w-4.5 h-4.5 text-brand-500 animate-pulse" />
            <span>Scale Calibration Mode: Click any two points on your floor plan underlay, then specify the real-world distance in meters to calibrate the drafting scale.</span>
          </div>
        )}
        {/* Navigation Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/80 border border-slate-800 p-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
          <button onClick={handleUndo} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition" title="Undo (Ctrl+Z)">
            <RefreshCw className="w-4 h-4 transform -scale-x-100" />
          </button>
          <button onClick={handleRedo} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition" title="Redo (Ctrl+Y)">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="w-[1px] h-4 bg-slate-800 mx-1"></span>
          <button onClick={() => setZoom(prev => Math.min(prev * 1.2, 5.0))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.2))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1.0); setPanX(50); setPanY(50); }} className="px-2 py-1 text-[9px] font-extrabold uppercase hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
            Recenter
          </button>
          <span className="w-[1px] h-4 bg-slate-800 mx-1"></span>
          <button 
            onClick={() => setShowVastuOverlay(!showVastuOverlay)} 
            className={`px-2 py-1 text-[9px] font-extrabold uppercase rounded transition ${showVastuOverlay ? 'bg-[#C9A84C] text-[#0A0A0B]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Toggle Vastu Compass & Grid Overlay"
          >
            Vastu Overlay
          </button>
        </div>

        {/* SVG Drawing Layer */}
        <svg
          ref={svgRef}
          onMouseDown={handleSVGMouseDown}
          onMouseMove={handleSVGMouseMove}
          onMouseUp={handleSVGMouseUp}
          onWheel={handleWheel}
          style={{ backgroundColor: colors.svgBg }}
          className="w-full h-full cursor-crosshair select-none"
        >
          {/* Defs block containing hatch patterns and grids */}
          <defs>
            <pattern id="cad-grid-minor" width={gridSize / 5} height={gridSize / 5} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize / 5} 0 L 0 0 0 ${gridSize / 5}`} fill="none" stroke={colors.gridMinor} strokeWidth="0.5" />
            </pattern>
            <pattern id="cad-grid-major" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <rect width={gridSize} height={gridSize} fill="url(#cad-grid-minor)" />
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke={colors.gridMajor} strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid Pattern Layer */}
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#cad-grid-major)" style={{ pointerEvents: 'none' }} />

          {/* Dynamic Interactive Workspace Group */}
          <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>

            {/* Background attached image (AutoCAD IMAGEATTACH underlay) */}
            <g id="sketch-layer" opacity={sketchOpacity} style={{ pointerEvents: 'none' }}>
              {sketchUrl && (
                <image
                  href={sketchUrl}
                  x={sketchX}
                  y={sketchY}
                  width={800 * sketchScale}
                  height={800 * sketchScale}
                />
              )}
            </g>
            
            {/* Draw Wall Lines */}
            {walls.map(w => {
              const isSelected = selectedObj?.type === 'wall' && selectedObj.id === w.id;
              return (
                <g key={w.id}>
                  {/* Outer Wall Body */}
                  <line
                    x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                    stroke={isSelected ? 'var(--gold)' : colors.wallStroke}
                    strokeWidth={w.thickness}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                  {/* Thin Wall Centerline for CAD reference */}
                  <line
                    x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                    stroke={colors.svgBg}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Thick Invisible line to click wall easily */}
                  <line
                    x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                    stroke="transparent"
                    strokeWidth={w.thickness + 15}
                    data-id={w.id}
                    className="wall-line-click cursor-pointer"
                  />
                </g>
              );
            })}

            {/* Draw Openings (Doors / Windows) */}
            {openings.map(op => {
              const isSelected = selectedObj?.type === 'opening' && selectedObj.id === op.id;
              return (
                <g key={op.id} transform={`translate(${op.x}, ${op.y}) rotate(${op.angle})`} className="opening-shape cursor-pointer" data-id={op.id}>
                  {op.type === 'window' ? (
                    // Window Symbol
                    <g>
                      <rect x={-op.width / 2} y="-6" width={op.width} height="12" fill={colors.svgBg} stroke={isSelected ? 'var(--gold)' : '#0ea5e9'} strokeWidth="2" />
                      <line x1={-op.width / 2} y1="0" x2={op.width / 2} y2="0" stroke="#0ea5e9" strokeWidth="1.5" />
                    </g>
                  ) : (
                    // Door Swing Arc Symbol
                    <g>
                      <line x1="0" y1="0" x2={op.width} y2="0" stroke={isSelected ? 'var(--gold)' : '#10b981'} strokeWidth="2.5" />
                      <path d={`M 0 0 A ${op.width} ${op.width} 0 0 1 ${op.width} ${op.width}`} fill="none" stroke={isSelected ? 'var(--gold)' : '#10b981'} strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="0" y1="0" x2="0" y2={op.width} stroke={isSelected ? 'var(--gold)' : '#10b981'} strokeWidth="1" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Draw Furniture Items */}
            {furniture.map(f => {
              const isSelected = selectedObj?.type === 'furniture' && selectedObj.id === f.id;
              if (f.type === 'camera') {
                return (
                  <g key={f.id} transform={`translate(${f.x}, ${f.y}) rotate(${f.rotation || f.angle || 0})`} className="camera-node cursor-move" data-id={f.id}>
                    {/* Camera view cone */}
                    <path d="M 0 0 L -15 -30 L 15 -30 Z" fill="rgba(201, 168, 76, 0.2)" stroke={isSelected ? '#2DD4AA' : 'var(--gold)'} strokeWidth="1.5" strokeDasharray="2,2" />
                    {/* Camera Body */}
                    <circle r="8" fill="var(--gold)" stroke="#0A0A0B" strokeWidth="1.5" />
                    {/* Lens representation */}
                    <rect x="-4" y="-12" width="8" height="4" fill="var(--gold)" />
                    <text x="0" y="16" textAnchor="middle" fill="var(--gold)" fontSize="7" fontWeight="bold">
                      {f.name || 'CAM'}
                    </text>
                  </g>
                );
              }
              return (
                <g key={f.id} transform={`translate(${f.x}, ${f.y}) rotate(${f.rotation})`} className="furniture-shape cursor-move" data-id={f.id}>
                  {/* Fill Box */}
                  <rect
                    x={-f.width / 2} y={-f.height / 2}
                    width={f.width} height={f.height}
                    fill={colors.furnitureFill}
                    stroke={isSelected ? 'var(--gold)' : colors.furnitureStroke}
                    strokeWidth="2"
                    rx="3"
                  />
                  {/* Diagonal slash symbols to signify block */}
                  <line x1={-f.width / 2} y1={-f.height / 2} x2={f.width / 2} y2={f.height / 2} stroke={colors.furnitureStroke} strokeWidth="0.5" strokeOpacity="0.4" />
                  <text x="0" y="4" textAnchor="middle" fill={colors.textLabel} fontSize="8" fontWeight="bold">
                    {f.name}
                  </text>
                </g>
              );
            })}

            {/* Draw SLAM Processed Walkthrough Video Nodes */}
            {detectedPoints.map(sp => (
              <g key={sp.id} transform={`translate(${sp.x}, ${sp.y})`}>
                <circle 
                  r="12" 
                  fill={sp.type.includes('plumbing') ? colors.servicePlumbing : colors.serviceElectrical} 
                  fillOpacity="0.15" 
                  stroke={sp.type.includes('plumbing') ? colors.servicePlumbing : colors.serviceElectrical} 
                  strokeWidth="1.5"
                  className="animate-pulse" 
                />
                <circle r="4" fill={sp.type.includes('plumbing') ? colors.servicePlumbing : colors.serviceElectrical} />
                <text x="14" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" className="bg-slate-900 px-1 rounded">
                  {sp.name}
                </text>
              </g>
            ))}

            {/* Draw Measurement Lines */}
            {measures.map(m => {
              const dx = m.x2 - m.x1;
              const dy = m.y2 - m.y1;
              const len = Math.hypot(dx, dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              const angleRad = Math.atan2(dy, dx);
              const midX = (m.x1 + m.x2) / 2;
              const midY = (m.y1 + m.y2) / 2;

              // Perpendicular vector for witness/extension lines
              const perpX = Math.sin(angleRad) * 12;
              const perpY = -Math.cos(angleRad) * 12;

              return (
                <g key={m.id} className="cursor-pointer" onClick={() => setSelectedObj({ id: m.id, type: 'measure' })}>
                  {/* Witness extension lines to measured boundaries */}
                  <line x1={m.x1 - perpX} y1={m.y1 - perpY} x2={m.x1 + perpX} y2={m.y1 + perpY} stroke="var(--gold)" strokeWidth="0.75" opacity="0.6" />
                  <line x1={m.x2 - perpX} y1={m.y2 - perpY} x2={m.x2 + perpX} y2={m.y2 + perpY} stroke="var(--gold)" strokeWidth="0.75" opacity="0.6" />
                  {/* Dimension Line */}
                  <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="var(--gold)" strokeWidth="1.5" />
                  {/* Oblique ticks (45-degree angle slashes) */}
                  <line x1={m.x1 - 5} y1={m.y1 - 5} x2={m.x1 + 5} y2={m.y1 + 5} stroke="var(--gold)" strokeWidth="1.75" />
                  <line x1={m.x2 - 5} y1={m.y2 - 5} x2={m.x2 + 5} y2={m.y2 + 5} stroke="var(--gold)" strokeWidth="1.75" />
                  {/* Dimension Text block */}
                  <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                    <rect x="-22" y="-12" width="44" height="15" fill="#020617" rx="3" stroke="var(--gold)" strokeWidth="0.5" />
                    <text x="0" y="-1" textAnchor="middle" fill="var(--gold)" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {formatMeters(len)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Draw Interactive Corner Joint Handles when in select mode */}
            {activeTool === 'select' && selectedObj?.type === 'wall' && (
              (() => {
                const w = walls.find(wall => wall.id === selectedObj.id);
                if (!w) return null;
                return (
                  <g>
                    {/* Node 1 handle */}
                    <circle
                      cx={w.x1} cy={w.y1} r="8"
                      fill="var(--gold)" stroke="#000" strokeWidth="1.5"
                      data-id={w.id} data-node="1"
                      className="wall-joint-handle cursor-move"
                    />
                    {/* Node 2 handle */}
                    <circle
                      cx={w.x2} cy={w.y2} r="8"
                      fill="var(--gold)" stroke="#000" strokeWidth="1.5"
                      data-id={w.id} data-node="2"
                      className="wall-joint-handle cursor-move"
                    />
                  </g>
                );
              })()
            )}

            {/* Temporary Draw Line Guides */}
            {tempPoints.length === 2 && (
              <g>
                <line
                  x1={tempPoints[0].x} y1={tempPoints[0].y}
                  x2={tempPoints[1].x} y2={tempPoints[1].y}
                  stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,4"
                />
                <circle cx={tempPoints[1].x} cy={tempPoints[1].y} r="4" fill="#9ca3af" />
              </g>
            )}

            {/* Room Overlay Review Layer — draggable + renamable, persisted to /cad */}
            {rooms.length > 0 && (
              <g>
                {rooms.map((room, idx) => {
                  const c = roomCentroid(room, idx);
                  const isSel = selectedObj?.type === 'room' && selectedObj.id === room.id;
                  const isRenaming = renamingRoom === room.id;
                  const badge = (room.vastu || room.vastuZone || room.orientation || '').toUpperCase();
                  const w = Math.max(120, (room.name || 'Room').length * 7 + 70);
                  const h = 46;
                  return (
                    <g
                      key={room.id}
                      className="room-node cursor-move"
                      data-id={room.id}
                      transform={`translate(${c.x - w / 2}, ${c.y - h / 2})`}
                      onDoubleClick={(e) => { e.stopPropagation(); setRenamingRoom(room.id); }}
                    >
                      <rect
                        width={w} height={h} rx={9}
                        fill={isSel ? 'rgba(201,168,76,0.18)' : 'rgba(15,23,42,0.82)'}
                        stroke={isSel ? '#C9A84C' : 'rgba(148,163,184,0.45)'}
                        strokeWidth={isSel ? 2 : 1}
                      />
                      {isRenaming ? (
                        <foreignObject x={8} y={h / 2 - 11} width={w - 16} height={24}>
                          <input
                            autoFocus
                            defaultValue={room.name}
                            className="w-full bg-slate-900 text-slate-100 text-[12px] px-1 rounded border border-gold outline-none"
                            onBlur={(e) => commitRoomRename(room.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRoomRename(room.id, e.target.value);
                              if (e.key === 'Escape') { e.stopPropagation(); cancelRoomRename(); }
                            }}
                          />
                        </foreignObject>
                      ) : (
                        <>
                          <text x={12} y={20} fill="#F0EEE8" fontSize="12.5" fontWeight="bold">
                            {(room.name || 'Room').slice(0, 22)}
                          </text>
                          {badge && (
                            <text x={12} y={37} fill="#C9A84C" fontSize="9">
                              {badge} ZONE
                            </text>
                          )}
                        </>
                      )}
                      <circle cx={w - 14} cy={14} r={5} fill="#C9A84C" opacity="0.85" />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Vastu Compass and Directional Zonal Overlay */}
            {showVastuOverlay && (() => {
              const { minX, minY, maxX, maxY } = getWallsBoundingBox();
              const wBB = maxX - minX;
              const hBB = maxY - minY;
              const dx = wBB / 3;
              const dy = hBB / 3;
              
              const vastuZones = [
                { name: 'Northwest (Vayu)', sub: 'Guest Bed / Toilet', x: minX, y: minY },
                { name: 'North (Kubera)', sub: 'Entrance / Living', x: minX + dx, y: minY },
                { name: 'Northeast (Ishanya)', sub: '★ Optimal Pooja Room', x: minX + 2*dx, y: minY, highlight: true },
                
                { name: 'West (Varuna)', sub: 'Children Bed / Dining', x: minX, y: minY + dy },
                { name: 'Brahmasthan (Center)', sub: 'Keep Open & Light', x: minX + dx, y: minY + dy, center: true },
                { name: 'East (Indra)', sub: 'Entrance / Living', x: minX + 2*dx, y: minY + dy },
                
                { name: 'Southwest (Nairutya)', sub: '★ Optimal Master Bed', x: minX, y: minY + 2*dy, highlight: true },
                { name: 'South (Yama)', sub: 'Storage / Staircase', x: minX + dx, y: minY + 2*dy },
                { name: 'Southeast (Agneya)', sub: '★ Optimal Kitchen (Fire)', x: minX + 2*dx, y: minY + 2*dy, highlight: true }
              ];
              
              return (
                <g opacity="0.85" style={{ pointerEvents: 'none' }}>
                  {/* Outer boundary */}
                  <rect x={minX} y={minY} width={wBB} height={hBB} fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="6,4" />
                  {/* Grid Lines */}
                  <line x1={minX + dx} y1={minY} x2={minX + dx} y2={maxY} stroke="rgba(201, 168, 76, 0.25)" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1={minX + 2*dx} y1={minY} x2={minX + 2*dx} y2={maxY} stroke="rgba(201, 168, 76, 0.25)" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1={minX} y1={minY + dy} x2={maxX} y2={minY + dy} stroke="rgba(201, 168, 76, 0.25)" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1={minX} y1={minY + 2*dy} x2={maxX} y2={minY + 2*dy} stroke="rgba(201, 168, 76, 0.25)" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* Zone Labels & Highlights */}
                  {vastuZones.map((z, idx) => (
                    <g key={idx}>
                      {z.highlight && (
                        <rect x={z.x + 4} y={z.y + 4} width={dx - 8} height={dy - 8} fill="rgba(201, 168, 76, 0.04)" rx="6" />
                      )}
                      <text x={z.x + dx/2} y={z.y + dy/2 - 4} textAnchor="middle" fill={z.highlight ? '#E8C97A' : '#8A8899'} fontSize="9" fontWeight="bold">
                        {z.name}
                      </text>
                      <text x={z.x + dx/2} y={z.y + dy/2 + 8} textAnchor="middle" fill="#8A8899" fontSize="7" opacity="0.8">
                        {z.sub}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}

          </g>
        </svg>

        {/* Footer Calibration Status bar */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 flex justify-between items-center text-xs shrink-0 z-10">
          <div className="flex gap-4">
            <div><b>Walls:</b> {walls.length}</div>
            <div><b>Furniture:</b> {furniture.length}</div>
            <div><b>Openings:</b> {openings.length}</div>
          </div>
          <div className="text-[10px] text-slate-400">
            * Drag wall corners to stretch joints. Press Delete key to remove selected symbols.
          </div>
        </div>

      </div>

      {/* 3. Right Process Sidebar (Walkthrough video, SLAM notifications) */}
      <div className="w-full xl:w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[80vh]">
        
        {/* AI Floor Plan Scan Analysis & OCR Panel */}
        {multimodalAnalysis && (
          <div className="bg-slate-950 border border-[#C9A84C]/30 rounded-xl p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Sparkles className="w-4 h-4 text-[var(--gold)]" />
              <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider">AI Floor Plan Scan</h3>
            </div>
            
            <div className="space-y-2.5 text-[11px] text-[#8A8899]">
              <div>
                <span className="text-slate-400 font-bold block">Overall Dimensions:</span>
                <span className="text-[var(--gold)] font-semibold">{multimodalAnalysis.overallDimensions || 'Not detected'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Detected Zones/Rooms:</span>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[#F0EEE8]">
                  {(multimodalAnalysis.detectedRooms || []).map((r, idx) => (
                    <li key={idx}>
                      <span className="capitalize font-medium text-slate-300">{r.type}:</span> {r.label} {r.measurements ? `(${r.measurements})` : ''}
                    </li>
                  ))}
                </ul>
              </div>

              {multimodalAnalysis.openingsCount && (
                <div>
                  <span className="text-slate-400 font-bold block">Openings:</span>
                  <div className="flex gap-4 mt-1 text-[#F0EEE8]">
                    <span>🚪 Doors: {multimodalAnalysis.openingsCount.doors || 0}</span>
                    <span>🪟 Windows: {multimodalAnalysis.openingsCount.windows || 0}</span>
                  </div>
                </div>
              )}

              {multimodalAnalysis.handwrittenNotes && multimodalAnalysis.handwrittenNotes.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block">OCR / Handwritten Notes:</span>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[#F0EEE8]">
                    {multimodalAnalysis.handwrittenNotes.map((note, idx) => (
                      <li key={idx} className="italic text-slate-300">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AutoCAD IMAGEATTACH Underlay Layer Panel */}
        <div className="panel">
          <h3 className="panel-head">
            <Compass className="ph-icon" /> Floorplan Underlay (IMAGEATTACH)
          </h3>
          <p className="panel-sub">
            Attach your client's handdrawn layout or PNG blueprint, adjust position and trace walls directly.
          </p>

          <label className="btn-gold w-full cursor-pointer">
            Choose Floor Plan File
            <input
              type="file"
              accept="image/*,.dxf,.dwg,.pdf"
              onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const isVector = /\.(dxf|dwg)$/i.test(file.name);
              if (isVector) {
                // Vector plan: auto-trace walls in TRUE mm — no manual tracing needed.
                try {
                  __toast?.info?.("Auto-tracing DXF/DWG plan…");
                  const formData = new FormData();
                  formData.append('floorplan', file);
                  const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/floorplan/auto-trace`, {
                    method: 'POST',
                    body: formData
                  });
                  const data = await res.json();
                  if (data.success) {
                    const w = (data.interpretation?.walls || []).map(seg => ({
                      id: seg.id, x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2,
                      thickness: seg.thicknessMm || 230, wallId: ''
                    }));
                    if (w.length) { setWalls(w); saveToHistory(w, openings, furniture, rooms, measures); }
                    __toast?.success(`Auto-traced ${data.walls} walls (${data.unit}). Rooms: ${(data.interpretation?.rooms || []).length}.`);
                  } else {
                    __toast?.error(data.message || "No walls found in DXF. Trace manually.");
                  }
                } catch (err) {
                  console.error("DXF auto-trace failed:", err);
                  __toast?.error("Auto-trace failed. Try manual tracing.");
                }
                return;
              }
              // Raster (image/PDF): attach as underlay for manual tracing.
              setSketchUrl(URL.createObjectURL(file));
              try {
                const formData = new FormData();
                formData.append('floorplan', file);
                const res = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/floorplan`, {
                  method: 'POST',
                  body: formData
                });
                const data = await res.json();
                if (data.success) {
                  setSketchUrl(`http://127.0.0.1:8787${data.floorplanUrl}`);
                  __toast?.success("Floorplan underlay attached — trace walls over it.");
                }
              } catch (err) {
                console.error("Error uploading floorplan from CAD screen:", err);
                __toast?.error("Failed to save floorplan to server.");
              }
              }}
              className="hidden"
            />
          </label>

          {sketchUrl && (
            <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Opacity: {Math.round(sketchOpacity * 100)}%</span>
                  <button onClick={() => setSketchUrl('')} className="text-red-400 hover:text-red-300">Remove</button>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={sketchOpacity} onChange={(e) => setSketchOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[var(--gold)]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Scale: {sketchScale.toFixed(2)}x</span>
                <input
                  type="range" min="0.2" max="3" step="0.05"
                  value={sketchScale} onChange={(e) => setSketchScale(parseFloat(e.target.value))}
                  className="w-full accent-[var(--gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Offset X: {sketchX}px</span>
                  <input
                    type="range" min="-500" max="500" step="10"
                    value={sketchX} onChange={(e) => setSketchX(parseInt(e.target.value))}
                    className="w-full accent-[var(--gold)]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Offset Y: {sketchY}px</span>
                  <input
                    type="range" min="-500" max="500" step="10"
                    value={sketchY} onChange={(e) => setSketchY(parseInt(e.target.value))}
                    className="w-full accent-[var(--gold)]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Reference Images */}
        <div className="panel">
          <h3 className="panel-head">
            <Layers className="ph-icon" /> Room Reference Images
          </h3>
          <p className="panel-sub">
            Attach style reference photos for each room zone to guide the 3D model generation.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-500 italic">
                No rooms marked. Use AI Auto-Detect or draw zones first.
              </div>
            ) : (
              rooms.map(room => (
                <div key={room.id} className="bg-slate-900 border border-slate-850 p-2 text-xs flex items-center justify-between gap-3 rounded-lg">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">{room.name}</span>
                    <span className="text-[9px] text-[var(--gold)] font-semibold">{room.vastu} Facing</span>
                  </div>
                  
                  {/* Reference Image Thumbnail / Upload Button */}
                  <div className="shrink-0">
                    {room.referenceImage ? (
                      <div className="relative w-8 h-8 rounded border border-slate-700 overflow-hidden group">
                        <img src={room.referenceImage} alt="Ref" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            const updated = rooms.map(r => r.id === room.id ? { ...r, referenceImage: null } : r);
                            setRooms(updated);
                            saveToHistory(walls, openings, furniture, updated, measures);
                          }}
                          className="absolute inset-0 bg-red-600/90 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-8 h-8 bg-slate-950 border border-dashed border-slate-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:text-brand-500 text-slate-500 transition">
                        <span className="text-[10px] font-black">+</span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const updated = rooms.map(r => r.id === room.id ? { ...r, referenceImage: reader.result } : r);
                                setRooms(updated);
                                saveToHistory(walls, openings, furniture, updated, measures);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Walkthrough video analyzer card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-brand-500" /> Walkthrough SLAM
          </h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Upload a site video; Gemini will overlay plumbing nodes, socket boards, and verify dimensions.
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleVideoFileChange} 
            accept="video/*" 
            className="hidden" 
          />

          {isUploadingVideo ? (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-[10px] font-bold text-brand-500 uppercase">
                <span>Analyzing Walkthrough...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <button
              onClick={triggerVideoUpload}
              className="w-full py-2.5 bg-brand-500/10 border border-brand-500/35 hover:bg-brand-500/20 text-brand-500 font-extrabold text-[10px] uppercase rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Video className="w-4.5 h-4.5" />
              Upload Walkthrough Video
            </button>
          )}

          {/* Video warning cards */}
          {videoWarnings.length > 0 && (
            <div className="space-y-2 mt-2">
              <span className="text-[9px] font-extrabold text-amber-500 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Site Discrepancies
              </span>
              {videoWarnings.map((w, idx) => (
                <div key={idx} className="bg-amber-500/5 border border-amber-500/20 p-2 rounded text-[10px] text-amber-400 leading-relaxed">
                  {w.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database Save Handoff */}
        <div className="mt-auto space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                try {
                  const r = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/drawings/floorplan/dxf`);
                  if (!r.ok) throw new Error('server');
                  const blob = await r.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `ultida-floorplan-${projectId}.dxf`; a.click();
                  URL.revokeObjectURL(url);
                  __toast?.success?.('Floor-plan DXF downloaded');
                } catch (e) {
                  // offline fallback: client R12 exporter (still produces a file)
                  exportToDXF({ walls, openings, furniture, rooms, measures, pixelsPerMeter, hasUnderlay: !!sketchUrl, componentLayers });
                  __toast?.warn?.('Server unavailable — used offline DXF export');
                }
              }}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-brand-500 border border-slate-750 font-extrabold text-[10px] uppercase rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export DXF
            </button>
            <button
              onClick={() => exportToSCR({ walls, openings, furniture, rooms, measures, pixelsPerMeter })}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 font-extrabold text-[10px] uppercase rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export SCR
            </button>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
            <div className="text-[9px] font-black text-[#C9A84C] uppercase tracking-widest">Render + Dims → DXF</div>
            <textarea id="render-dims-text" placeholder="Paste dimensions from render..." className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 h-16"></textarea>
            <button onClick={async ()=> {
              const txt = document.getElementById('render-dims-text')?.value || '';
              const r = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/cad/render-to-dxf`, {
                method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dimsText: txt })
              });
              const d = await r.json();
              if (d?.success) { __toast?.success('Render DXF generated'); } else { __toast?.error(d?.error || 'failed'); }
            }} className="w-full py-2 bg-[#C9A84C] text-slate-950 font-black uppercase text-[10px] rounded-lg">Generate from Render Dims</button>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
            <div className="text-[9px] font-black text-[#C9A84C] uppercase tracking-widest">Photo → Elevation → DXF</div>
            <input id="rtp-image-input" type="file" accept="image/*" className="block w-full text-[9px] text-slate-400" />
            <input id="rtp-width" placeholder="real width (mm)" inputMode="numeric" className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[10px] text-slate-200" />
            <input id="rtp-height" placeholder="real height (mm)" inputMode="numeric" className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[10px] text-slate-200" />
            <button onClick={async () => {
              const file = document.getElementById('rtp-image-input')?.files?.[0];
              const w = Number(document.getElementById('rtp-width')?.value);
              const h = Number(document.getElementById('rtp-height')?.value);
              if (!file || !w || !h) { __toast?.warn('Upload photo + enter width/height'); return; }
              const fd = new FormData(); fd.append('image', file); fd.append('widthMm', String(w)); fd.append('heightMm', String(h)); fd.append('projectId', String(projectId));
              const r = await fetch(`http://127.0.0.1:8787/api/elevation/from-photo`, { method:'POST', body: fd });
              const d = await r.json();
              if (d?.success) {
                __toast?.success('Elevation generated');
                if (typeof loadProjectCAD === 'function') loadProjectCAD();
                if (typeof loadPhotoElevations === 'function') loadPhotoElevations();
              } else { __toast?.error(d?.error || 'failed'); }
            }} className="w-full py-2 bg-[#C9A84C] text-slate-950 font-black uppercase text-[10px] rounded-lg">Generate Elevation</button>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
            <div className="text-[9px] font-black text-[#C9A84C] uppercase tracking-widest">Component Layers</div>
            <div className="flex flex-wrap gap-1.5">
              {['glass','cane','handle','frame'].map(k => (
                <button key={k} onClick={() => setComponentLayers(s => ({ ...s, [k]: !s[k] }))} className={`px-2 py-1 rounded-md border text-[9px] font-bold uppercase transition ${componentLayers[k] ? 'bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>{k}</button>
              ))}
            </div>
            <div className="text-[9px] text-slate-500">Toggle symbolic DXF layers for glass, cane, handles, and frame brackets.</div>
          </div>

          <button
            onClick={saveCADToServer}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            Approve Layout & Save
          </button>
        </div>

      </div>

      {/* --- Calibration Length Input Modal --- */}
      {calibrateModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-80 max-w-full space-y-4">
            <h3 className="text-sm font-extrabold text-brand-500 uppercase tracking-wider">Laser Calibrator</h3>
            <p className="text-xs text-slate-400">
              Input the real-world distance between the two points clicked on canvas to calibrate drafting scale.
            </p>
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400">Length (Meters):</label>
              <input
                type="number" step="0.1"
                value={enteredLength}
                onChange={(e) => setEnteredLength(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-brand-500"
                placeholder="e.g. 3.05"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={applyScaleCalibration}
                className="flex-1 py-2 bg-brand-500 text-slate-950 text-xs font-bold rounded-lg uppercase transition hover:bg-brand-600"
              >
                Apply
              </button>
              <button 
                onClick={() => { setCalibrateModal(false); setTempPoints([]); }}
                className="flex-1 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg uppercase transition hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
