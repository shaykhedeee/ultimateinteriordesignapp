// SVG-based Floorplan Layout Editor Engine with CAD-like Snapping, Panning, and Zooming
class FloorplanEditor {
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.container = svgElement.parentNode;
    
    // Theme configurations
    this.currentTheme = 'warm'; // 'warm' (drafting), 'blue' (blueprint), 'carbon' (dark)
    
    this.gWorkspace = svgElement.querySelector('#workspace-group') || this.createWorkspaceGroup();
    
    // Core State
    this.walls = [];
    this.furniture = [];
    this.openings = []; 
    this.rooms = [];
    this.measures = [];
    
    // Canvas View Configuration
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    
    // Touch Gestures Mobile Variables
    this.initialTouchDistance = 0;
    this.initialZoom = 1.0;
    this.initialPanX = 0;
    this.initialPanY = 0;
    this.touchMidPoint = { x: 0, y: 0 };
    this.isTouchPanning = false;
    this.touchStartPoint = { x: 0, y: 0 };
    
    // Grid Options
    this.gridSize = 20; 
    this.snapToGrid = true;
    this.snapToElements = true;
    this.orthoMode = false; 
    this.smartGuidesEnabled = true; // Smart Alignment Guides like Figma/Miro
    
    // Scale Calibration
    this.pixelsPerMeter = 40.0; 
    this.unitSystem = 'metric'; 
    
    // Active Tools
    this.activeTool = 'select';
    this.selectedObjectId = null;
    this.selectedObjectType = null; 
    
    // Drawing / Interaction State
    this.dragMode = null; 
    this.dragStart = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.activeCornerIndex = null; 
    
    // Dynamic alignment guides state
    this.alignmentGuides = []; // { x, y, type: 'v' | 'h' }
    
    // Temporary Guides / Drawing Elements
    this.tempPoints = []; 
    this.tempGuideLine = null; 
    
    // Scale Calibration temp state
    this.calibratePoints = [];
    
    // Undo / Redo History stack
    this.history = [];
    this.historyIndex = -1;
    
    // Callbacks to hook with App UI
    this.onSelectionChanged = options.onSelectionChanged || null;
    this.onProjectChanged = options.onProjectChanged || null;
    this.onScaleCalibrated = options.onScaleCalibrated || null;
    
    // Bind Event Listeners
    this.initEventListeners();
    this.drawGrid();
  }

  // Themes configurations details
  getThemeColors() {
    const themes = {
      warm: {
        bg: '#FDFBF7', // warm cream paper
        gridMinor: '#EDF2F7',
        gridMajor: '#E2E8F0',
        wallDrywallFill: '#2D3748',
        wallDrywallStroke: '#1A202C',
        wallGlassFill: '#E0F2FE',
        wallGlassStroke: '#0284C7',
        wallConcreteFill: 'url(#concrete-hatch-warm)',
        wallConcreteStroke: '#1A202C',
        furnitureStroke: '#4A5568',
        furnitureFill: '#FFFFFF',
        textLabel: '#2D3748'
      },
      blue: {
        bg: '#0B1E36', // classic blue blueprint
        gridMinor: '#112A46',
        gridMajor: '#1D3B6C',
        wallDrywallFill: '#1A3A5F',
        wallDrywallStroke: '#EBF8FF',
        wallGlassFill: '#1E293B',
        wallGlassStroke: '#38BDF8',
        wallConcreteFill: 'url(#concrete-hatch-blue)',
        wallConcreteStroke: '#EBF8FF',
        furnitureStroke: '#00F5FF',
        furnitureFill: '#11223F',
        textLabel: '#EBF8FF'
      },
      carbon: {
        bg: '#0F0F12', // carbon high-tech dark mode
        gridMinor: '#1C1C20',
        gridMajor: '#2C2C35',
        wallDrywallFill: '#27272A',
        wallDrywallStroke: '#52525B',
        wallGlassFill: '#172554',
        wallGlassStroke: '#3B82F6',
        wallConcreteFill: 'url(#concrete-hatch-carbon)',
        wallConcreteStroke: '#E4E4E7',
        furnitureStroke: '#38BDF8',
        furnitureFill: '#18181B',
        textLabel: '#F4F4F5'
      }
    };
    return themes[this.currentTheme] || themes.warm;
  }

  createWorkspaceGroup() {
    this.svg.innerHTML = `
      <defs>
        <!-- Grids Pattern -->
        <pattern id="grid-pattern-minor" width="10" height="10" patternUnits="userSpaceOnUse">
          <path id="path-grid-minor" d="M 10 0 L 0 0 0 10" fill="none" stroke="#EDF2F7" stroke-width="0.5" />
        </pattern>
        <pattern id="grid-pattern-major" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#grid-pattern-minor)" />
          <path id="path-grid-major" d="M 50 0 L 0 0 0 50" fill="none" stroke="#E2E8F0" stroke-width="1.2" />
        </pattern>
        
        <!-- Concrete hatch patterns oriented for different themes -->
        <pattern id="concrete-hatch-warm" width="15" height="15" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="15" stroke="#718096" stroke-width="1.5" />
          <line x1="7.5" y1="0" x2="7.5" y2="15" stroke="#CBD5E0" stroke-width="0.8" />
        </pattern>
        <pattern id="concrete-hatch-blue" width="15" height="15" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="15" stroke="#EBF8FF" stroke-width="1.5" stroke-opacity="0.6" />
          <line x1="7.5" y1="0" x2="7.5" y2="15" stroke="#38BDF8" stroke-width="0.8" stroke-opacity="0.5" />
        </pattern>
        <pattern id="concrete-hatch-carbon" width="15" height="15" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="15" stroke="#52525B" stroke-width="1.5" />
          <line x1="7.5" y1="0" x2="7.5" y2="15" stroke="#3F3F46" stroke-width="0.8" />
        </pattern>
      </defs>
      <!-- Background Sketch Image Layer -->
      <g id="sketch-layer" opacity="0.45"></g>
      <!-- Visual Grid -->
      <rect id="grid-overlay" width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid-pattern-major)" style="pointer-events: none;" />
      <!-- Zoom and Pan Container Group -->
      <g id="workspace-group">
        <!-- Dynamic Rooms Layer -->
        <g id="rooms-layer"></g>
        <!-- Dynamic Walls Layer -->
        <g id="walls-layer"></g>
        <!-- Openings (Doors & Windows) Layer -->
        <g id="openings-layer"></g>
        <!-- Office Furniture Layer -->
        <g id="furniture-layer"></g>
        <!-- Dimension Line & Measurement Layer -->
        <g id="measures-layer"></g>
        <!-- Alignment Guides Layer -->
        <g id="alignment-guides-layer"></g>
        <!-- Active User Interaction Overlay (Selections, drag boxes, temp lines) -->
        <g id="interaction-layer"></g>
      </g>
      <!-- Standalone Professional CAD Title Block & Border Sheet -->
      <g id="cad-print-frame" class="hidden" style="pointer-events: none;">
        <!-- Outer margin border -->
        <rect x="15" y="15" width="1120" height="762" fill="none" stroke="#2D3748" stroke-width="2" />
        <!-- Inner drawing border -->
        <rect x="30" y="30" width="1090" height="732" fill="none" stroke="#2D3748" stroke-width="1.2" />
        
        <!-- Grid border ticks around sheet -->
        <line x1="30" y1="200" x2="40" y2="200" stroke="#2D3748" stroke-width="1" />
        <line x1="30" y1="400" x2="40" y2="400" stroke="#2D3748" stroke-width="1" />
        <line x1="30" y1="600" x2="40" y2="600" stroke="#2D3748" stroke-width="1" />
        <line x1="1110" y1="200" x2="1120" y2="200" stroke="#2D3748" stroke-width="1" />
        <line x1="1110" y1="400" x2="1120" y2="400" stroke="#2D3748" stroke-width="1" />
        <line x1="1110" y1="600" x2="1120" y2="600" stroke="#2D3748" stroke-width="1" />
        
        <line x1="300" y1="30" x2="300" y2="40" stroke="#2D3748" stroke-width="1" />
        <line x1="600" y1="30" x2="600" y2="40" stroke="#2D3748" stroke-width="1" />
        <line x1="900" y1="30" x2="900" y2="40" stroke="#2D3748" stroke-width="1" />
        
        <!-- Bottom-Right Title Block -->
        <g transform="translate(820, 562)" fill="#2D3748" font-family="Segoe UI, Inter, sans-serif">
          <!-- Background panel -->
          <rect x="0" y="0" width="290" height="190" fill="#FFFFFF" stroke="#2D3748" stroke-width="1.5" />
          
          <!-- Horizontal Dividers -->
          <line x1="0" y1="45" x2="290" y2="45" stroke="#2D3748" stroke-width="1" />
          <line x1="0" y1="90" x2="290" y2="90" stroke="#2D3748" stroke-width="1" />
          <line x1="0" y1="135" x2="290" y2="135" stroke="#2D3748" stroke-width="1" />
          
          <!-- Vertical Dividers inside cells -->
          <line x1="180" y1="45" x2="180" y2="135" stroke="#2D3748" stroke-width="1" />
          <line x1="100" y1="135" x2="100" y2="190" stroke="#2D3748" stroke-width="1" />
          <line x1="200" y1="135" x2="200" y2="190" stroke="#2D3748" stroke-width="1" />
          
          <!-- Company / Logo Brand area (Cell 1) -->
          <text x="15" y="28" font-size="16" font-weight="800" fill="#1E3A8A" letter-spacing="1">SPACETRACE AI</text>
          <text x="210" y="26" font-size="9" font-weight="600" fill="#718096">2D BLUEPRINT</text>
          
          <!-- Project Title Cell -->
          <text x="12" y="58" font-size="7" font-weight="600" fill="#718096">PROJECT TITLE</text>
          <text x="12" y="76" font-size="11" font-weight="700" id="tb-project-title" fill="#1A202C">Commercial Office Layout</text>
          
          <text x="192" y="58" font-size="7" font-weight="600" fill="#718096">SHEET NO.</text>
          <text x="192" y="78" font-size="14" font-weight="800" fill="#1E3A8A">A-01</text>
          
          <!-- Client Cell -->
          <text x="12" y="103" font-size="7" font-weight="600" fill="#718096">DESIGNED FOR</text>
          <text x="12" y="120" font-size="11" font-weight="700" id="tb-client-name" fill="#1A202C">Muskan Autocad Solutions</text>
          
          <text x="192" y="103" font-size="7" font-weight="600" fill="#718096">STATUS</text>
          <text x="192" y="120" font-size="10" font-weight="700" fill="#48BB78">FINAL DRAFT</text>
          
          <!-- Metadata Row -->
          <text x="12" y="148" font-size="7" font-weight="600" fill="#718096">SCALE</text>
          <text x="12" y="165" font-size="9" font-weight="700" id="tb-scale-ratio" fill="#1A202C">1:50 (40px/m)</text>
          
          <text x="112" y="148" font-size="7" font-weight="600" fill="#718096">DATE</text>
          <text x="112" y="165" font-size="9" font-weight="700" id="tb-date" fill="#1A202C">2026-06-04</text>
          
          <text x="212" y="148" font-size="7" font-weight="600" fill="#718096">UNITS</text>
          <text x="212" y="165" font-size="9" font-weight="700" id="tb-unit-system" fill="#1A202C">Metric (M)</text>
        </g>
      </g>
    `;
    return this.svg.querySelector('#workspace-group');
  }

  // Switch design themes smoothly (Drafting Table, Traditional Blueprint, Carbon Dark)
  setTheme(themeName) {
    this.currentTheme = themeName;
    const colors = this.getThemeColors();
    
    // Update SVG overall paper color
    this.svg.style.backgroundColor = colors.bg;
    
    // Update visual grid pattern strokes
    const pathMinor = this.svg.querySelector('#path-grid-minor');
    const pathMajor = this.svg.querySelector('#path-grid-major');
    if (pathMinor && pathMajor) {
      pathMinor.setAttribute('stroke', colors.gridMinor);
      pathMajor.setAttribute('stroke', colors.gridMajor);
    }
    
    this.render();
  }

  // Draw or update background visual grids
  drawGrid() {
    const gridOverlay = this.svg.querySelector('#grid-overlay');
    if (!gridOverlay) return;
    
    const colors = this.getThemeColors();
    this.svg.style.backgroundColor = colors.bg;
    
    const minorPattern = this.svg.querySelector('#grid-pattern-minor');
    const majorPattern = this.svg.querySelector('#grid-pattern-major');
    
    if (minorPattern && majorPattern) {
      const step = this.gridSize;
      minorPattern.setAttribute('width', step / 5);
      minorPattern.setAttribute('height', step / 5);
      
      const pathMinor = minorPattern.querySelector('path');
      pathMinor.setAttribute('d', `M ${step/5} 0 L 0 0 0 ${step/5}`);
      pathMinor.setAttribute('stroke', colors.gridMinor);
      
      majorPattern.setAttribute('width', step);
      majorPattern.setAttribute('height', step);
      
      const pathMajor = majorPattern.querySelector('path');
      pathMajor.setAttribute('d', `M ${step} 0 L 0 0 0 ${step}`);
      pathMajor.setAttribute('stroke', colors.gridMajor);
    }
  }

  // Push state to Undo stack
  saveHistory() {
    const state = JSON.stringify({
      walls: this.walls,
      furniture: this.furniture,
      openings: this.openings,
      rooms: this.rooms,
      measures: this.measures,
      pixelsPerMeter: this.pixelsPerMeter,
      unitSystem: this.unitSystem,
      currentTheme: this.currentTheme
    });
    
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(state);
    this.historyIndex = this.history.length - 1;
    
    if (this.onProjectChanged) this.onProjectChanged();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadFromState(JSON.parse(this.history[this.historyIndex]));
      this.render();
      if (this.onProjectChanged) this.onProjectChanged();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadFromState(JSON.parse(this.history[this.historyIndex]));
      this.render();
      if (this.onProjectChanged) this.onProjectChanged();
    }
  }

  loadFromState(state) {
    this.walls = state.walls || [];
    this.furniture = state.furniture || [];
    this.openings = state.openings || [];
    this.rooms = state.rooms || [];
    this.measures = state.measures || [];
    this.pixelsPerMeter = state.pixelsPerMeter || 40.0;
    this.unitSystem = state.unitSystem || 'metric';
    this.currentTheme = state.currentTheme || 'warm';
    
    this.selectedObjectId = null;
    this.selectedObjectType = null;
    this.setTheme(this.currentTheme);
  }

  pxToMeters(pixels) {
    return pixels / this.pixelsPerMeter;
  }

  metersToPx(meters) {
    return meters * this.pixelsPerMeter;
  }

  formatDistance(meters) {
    if (this.unitSystem === 'metric') {
      if (meters < 1.0) {
        return `${Math.round(meters * 100)} cm`;
      }
      return `${meters.toFixed(2)} m`;
    } else {
      const totalInches = meters * 39.3701;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}' ${inches}"`;
    }
  }

  formatArea(sqMeters) {
    if (this.unitSystem === 'metric') {
      return `${sqMeters.toFixed(1)} m²`;
    } else {
      const sqFt = sqMeters * 10.7639;
      return `${sqFt.toFixed(1)} sq ft`;
    }
  }

  // --- EVENT HANDLERS ---
  initEventListeners() {
    // Mouse Listeners
    this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.svg.addEventListener('mouseleave', () => { 
      this.isPanning = false; 
      this.dragMode = null; 
      this.alignmentGuides = [];
      this.renderAlignmentGuides();
    });
    
    // Zoom with Mouse Wheel
    this.svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    
    // Prevent Context Menu for right-click pan
    this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Touch Events for Mobile (Highly Responsive Gesture Engine)
    this.svg.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.svg.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.svg.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    
    // Keyboard listener (bound globally)
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  getMousePos(e) {
    const rect = this.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const workspaceX = (x - this.panX) / this.zoom;
    const workspaceY = (y - this.panY) / this.zoom;
    
    return { x: workspaceX, y: workspaceY, clientX: e.clientX, clientY: e.clientY };
  }

  getSnappedPoint(pos) {
    let x = pos.x;
    let y = pos.y;
    
    // Smart Guides snap center values
    if (this.smartGuidesEnabled && this.activeTool === 'select' && this.alignmentGuides.length > 0) {
      this.alignmentGuides.forEach(g => {
        if (g.type === 'v' && Math.abs(x - g.coord) < 8) {
          x = g.coord; // Snap horizontally to alignment line
        }
        else if (g.type === 'h' && Math.abs(y - g.coord) < 8) {
          y = g.coord; // Snap vertically
        }
      });
    }
    
    if (this.snapToElements && this.activeTool !== 'select') {
      const tolerance = 15 / this.zoom;
      // 1. Check endpoints
      for (const wall of this.walls) {
        if (Math.hypot(x - wall.x1, y - wall.y1) < tolerance) {
          return { x: wall.x1, y: wall.y1, snapped: 'endpoint' };
        }
        if (Math.hypot(x - wall.x2, y - wall.y2) < tolerance) {
          return { x: wall.x2, y: wall.y2, snapped: 'endpoint' };
        }
      }
      // 2. Check nearest perpendicular projection on wall body
      const nearestWall = this.findNearestWall({ x, y });
      if (nearestWall && nearestWall.distance < tolerance) {
        return { x: nearestWall.proj.x, y: nearestWall.proj.y, snapped: 'wall_projection' };
      }
    }
    
    if (this.orthoMode && this.tempPoints.length > 0) {
      const pStart = this.tempPoints[this.tempPoints.length - 1];
      const dx = x - pStart.x;
      const dy = y - pStart.y;
      
      const angle = Math.atan2(dy, dx);
      const angleDeg = (angle * 180) / Math.PI;
      const snappedAngle = Math.round(angleDeg / 45) * 45;
      const snappedRad = (snappedAngle * Math.PI) / 180;
      const len = Math.hypot(dx, dy);
      
      x = pStart.x + len * Math.cos(snappedRad);
      y = pStart.y + len * Math.sin(snappedRad);
      return { x, y, snapped: 'ortho' };
    }
    
    if (this.snapToGrid) {
      const step = this.gridSize;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
      return { x, y, snapped: 'grid' };
    }
    
    return { x, y, snapped: 'none' };
  }

  updateWorkspaceTransform() {
    this.gWorkspace.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
  }

  zoomIn() {
    const zoomFactor = 1.25;
    const oldZoom = this.zoom;
    this.zoom = Math.min(this.zoom * zoomFactor, 6.0);
    
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    this.panX = centerX - (centerX - this.panX) * (this.zoom / oldZoom);
    this.panY = centerY - (centerY - this.panY) * (this.zoom / oldZoom);
    
    this.updateWorkspaceTransform();
  }

  zoomOut() {
    const zoomFactor = 1.25;
    const oldZoom = this.zoom;
    this.zoom = Math.max(this.zoom / zoomFactor, 0.25);
    
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    this.panX = centerX - (centerX - this.panX) * (this.zoom / oldZoom);
    this.panY = centerY - (centerY - this.panY) * (this.zoom / oldZoom);
    
    this.updateWorkspaceTransform();
  }

  recenter() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateWorkspaceTransform();
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const oldZoom = this.zoom;
    
    if (e.deltaY < 0) {
      this.zoom = Math.min(this.zoom * zoomFactor, 6.0);
    } else {
      this.zoom = Math.max(this.zoom / zoomFactor, 0.25);
    }
    
    const rect = this.svg.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    this.panX = cursorX - (cursorX - this.panX) * (this.zoom / oldZoom);
    this.panY = cursorY - (cursorY - this.panY) * (this.zoom / oldZoom);
    
    this.updateWorkspaceTransform();
  }

  handleMouseDown(e) {
    const mousePos = this.getMousePos(e);
    const snapped = this.getSnappedPoint(mousePos);
    
    if (e.button === 1 || e.button === 2 || e.shiftKey && this.activeTool === 'select') {
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.svg.style.cursor = 'grabbing';
      return;
    }
    
    if (e.button !== 0) return;
    this.executeActionAtCoords(mousePos, snapped, e.target);
  }

  executeActionAtCoords(mousePos, snapped, targetElement) {
    if (this.activeTool === 'select') {
      const clickedHandle = targetElement.closest('.interaction-handle');
      if (clickedHandle) {
        const handleType = clickedHandle.getAttribute('data-handle-type');
        this.dragMode = handleType;
        this.dragStart = { x: mousePos.x, y: mousePos.y };
        
        if (handleType === 'resize_corner') {
          this.activeCornerIndex = parseInt(clickedHandle.getAttribute('data-corner-index'));
        }
        return;
      }
      
      const fElement = targetElement.closest('.furniture-item');
      if (fElement) {
        const fid = fElement.getAttribute('data-id');
        this.selectObject(fid, 'furniture');
        this.dragMode = 'move';
        const obj = this.furniture.find(f => f.id === fid);
        this.dragStart = { x: mousePos.x, y: mousePos.y };
        this.dragOffset = { x: mousePos.x - obj.x, y: mousePos.y - obj.y };
        return;
      }
      
      const opElement = targetElement.closest('.opening-item');
      if (opElement) {
        const opid = opElement.getAttribute('data-id');
        this.selectObject(opid, 'opening');
        this.dragMode = 'move';
        const obj = this.openings.find(op => op.id === opid);
        this.dragStart = { x: mousePos.x, y: mousePos.y };
        this.dragOffset = { x: mousePos.x - obj.x, y: mousePos.y - obj.y };
        return;
      }
      
      const wallElement = targetElement.closest('.wall-line');
      if (wallElement) {
        const wallId = wallElement.getAttribute('data-id');
        this.selectObject(wallId, 'wall');
        this.dragMode = 'move';
        this.dragStart = { x: mousePos.x, y: mousePos.y };
        return;
      }
      
      const roomElement = targetElement.closest('.room-shape');
      if (roomElement) {
        const roomId = roomElement.getAttribute('data-id');
        this.selectObject(roomId, 'room');
        return;
      }
      
      this.deselectObject();
    }
    
    else if (this.activeTool === 'wall') {
      const p = snapped;
      
      if (this.tempPoints.length === 0) {
        this.tempPoints.push(p);
      } else {
        const lastP = this.tempPoints[this.tempPoints.length - 1];
        if (Math.hypot(p.x - lastP.x, p.y - lastP.y) > 5) {
          const newWall = {
            id: 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            x1: lastP.x,
            y1: lastP.y,
            x2: p.x,
            y2: p.y,
            thickness: 10,
            material: 'drywall' // 'drywall' or 'concrete' or 'glass'
          };
          this.walls.push(newWall);
          this.tempPoints.push(p);
          this.saveHistory();
          this.render();
        }
      }
    }
    
    else if (this.activeTool.startsWith('door_') || this.activeTool === 'window') {
      const wallData = this.findNearestWall(mousePos);
      if (wallData && wallData.distance < 25) {
        const wall = wallData.wall;
        const width = this.activeTool === 'window' ? this.metersToPx(1.2) : this.metersToPx(0.9);
        
        const newOp = {
          id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: this.activeTool === 'window' ? 'window' : 'door',
          style: this.activeTool,
          wallId: wall.id,
          x: wallData.proj.x,
          y: wallData.proj.y,
          width: width,
          angle: wallData.angle
        };
        this.openings.push(newOp);
        this.saveHistory();
        this.activeTool = 'select';
        
        const selectBtn = document.querySelector('[data-tool="select"]');
        if (selectBtn) {
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool-btn'));
          selectBtn.classList.add('active-tool-btn');
        }
        
        this.selectObject(newOp.id, 'opening');
        this.render();
      }
    }
    
    else if (this.activeTool === 'room') {
      const p = snapped;
      if (this.tempPoints.length > 2 && Math.hypot(p.x - this.tempPoints[0].x, p.y - this.tempPoints[0].y) < 20) {
        const newRoom = {
          id: 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: 'Commercial Space',
          points: [...this.tempPoints],
          color: '#3182CE'
        };
        this.rooms.push(newRoom);
        this.tempPoints = [];
        this.saveHistory();
        this.activeTool = 'select';
        
        const selectBtn = document.querySelector('[data-tool="select"]');
        if (selectBtn) {
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool-btn'));
          selectBtn.classList.add('active-tool-btn');
        }
        
        this.selectObject(newRoom.id, 'room');
        this.render();
      } else {
        this.tempPoints.push(p);
        this.render();
      }
    }
    
    else if (this.activeTool === 'measure') {
      const p = snapped;
      if (this.tempPoints.length === 0) {
        this.tempPoints.push(p);
      } else {
        const lastP = this.tempPoints[0];
        const newMeasure = {
          id: 'measure_' + Date.now(),
          x1: lastP.x,
          y1: lastP.y,
          x2: p.x,
          y2: p.y
        };
        this.measures.push(newMeasure);
        this.tempPoints = [];
        this.saveHistory();
        this.activeTool = 'select';
        
        const selectBtn = document.querySelector('[data-tool="select"]');
        if (selectBtn) {
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool-btn'));
          selectBtn.classList.add('active-tool-btn');
        }
        
        this.render();
      }
    }
    
    else if (this.activeTool === 'calibrate') {
      this.calibratePoints.push({ x: mousePos.x, y: mousePos.y });
      if (this.calibratePoints.length === 2) {
        const p1 = this.calibratePoints[0];
        const p2 = this.calibratePoints[1];
        const pixelDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        
        if (this.onScaleCalibrated) {
          this.onScaleCalibrated(pixelDist, (realDistance) => {
            if (realDistance && realDistance > 0) {
              this.pixelsPerMeter = pixelDist / realDistance;
              this.saveHistory();
              this.render();
            }
          });
        }
        
        this.calibratePoints = [];
        this.activeTool = 'select';
        
        const selectBtn = document.querySelector('[data-tool="select"]');
        if (selectBtn) {
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool-btn'));
          selectBtn.classList.add('active-tool-btn');
        }
      }
      this.render();
    }
  }

  handleMouseMove(e) {
    const mousePos = this.getMousePos(e);
    const snapped = this.getSnappedPoint(mousePos);
    
    if (this.isPanning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.panX += dx;
      this.panY += dy;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.updateWorkspaceTransform();
      return;
    }
    
    if (this.activeTool === 'select' && this.selectedObjectId && this.dragMode) {
      // Calculate and render alignment guides when dragging furniture
      if (this.selectedObjectType === 'furniture' && this.dragMode === 'move') {
        this.computeAlignmentGuides(mousePos);
      }
      
      this.executeDragAction(mousePos, snapped, e.shiftKey);
      return;
    }
    
    // Clear alignment guides when not dragging
    if (this.alignmentGuides.length > 0) {
      this.alignmentGuides = [];
      this.renderAlignmentGuides();
    }
    
    this.updateLiveDrawGuides(snapped, mousePos);
  }

  // Smart Alignment Alignment lines computations (compares center-point matching with other furniture)
  computeAlignmentGuides(draggedPos) {
    if (!this.smartGuidesEnabled) return;
    
    const obj = this.furniture.find(f => f.id === this.selectedObjectId);
    if (!obj) return;
    
    const halfW = obj.width / 2;
    const halfH = obj.height / 2;
    // Dragged object's target center coordinates (un-snapped)
    const targetCx = draggedPos.x - this.dragOffset.x + halfW;
    const targetCy = draggedPos.y - this.dragOffset.y + halfH;
    
    this.alignmentGuides = [];
    const threshold = 12; // distance to show guide line
    
    this.furniture.forEach(other => {
      if (other.id === obj.id) return;
      
      const otherCx = other.x + other.width / 2;
      const otherCy = other.y + other.height / 2;
      
      // Horizontal Alignments (Centers share same Y-height)
      if (Math.abs(targetCy - otherCy) < threshold) {
        this.alignmentGuides.push({
          coord: otherCy,
          type: 'h',
          startX: Math.min(targetCx, otherCx),
          endX: Math.max(targetCx, otherCx)
        });
      }
      
      // Vertical Alignments (Centers share same X-width)
      if (Math.abs(targetCx - otherCx) < threshold) {
        this.alignmentGuides.push({
          coord: otherCx,
          type: 'v',
          startY: Math.min(targetCy, otherCy),
          endY: Math.max(targetCy, otherCy)
        });
      }
    });
    
    this.renderAlignmentGuides();
  }

  renderAlignmentGuides() {
    const layer = this.svg.querySelector('#alignment-guides-layer');
    if (!layer) return;
    
    if (this.alignmentGuides.length === 0) {
      layer.innerHTML = '';
      return;
    }
    
    layer.innerHTML = this.alignmentGuides.map(g => {
      if (g.type === 'h') {
        return `
          <g>
            <line x1="${g.startX - 50}" y1="${g.coord}" x2="${g.endX + 50}" y2="${g.coord}" stroke="#A855F7" stroke-width="1" stroke-dasharray="3,3" />
            <circle cx="${g.startX}" cy="${g.coord}" r="3.5" fill="#A855F7" />
            <circle cx="${g.endX}" cy="${g.coord}" r="3.5" fill="#A855F7" />
          </g>
        `;
      } else {
        return `
          <g>
            <line x1="${g.coord}" y1="${g.startY - 50}" x2="${g.coord}" y2="${g.endY + 50}" stroke="#A855F7" stroke-width="1" stroke-dasharray="3,3" />
            <circle cx="${g.coord}" cy="${g.startY}" r="3.5" fill="#A855F7" />
            <circle cx="${g.coord}" cy="${g.endY}" r="3.5" fill="#A855F7" />
          </g>
        `;
      }
    }).join('');
  }

  executeDragAction(mousePos, snapped, shiftKey) {
    if (this.selectedObjectType === 'furniture') {
      const obj = this.furniture.find(f => f.id === this.selectedObjectId);
      
      if (this.dragMode === 'move') {
        const targetX = mousePos.x - this.dragOffset.x;
        const targetY = mousePos.y - this.dragOffset.y;
        
        let finalX = targetX;
        let finalY = targetY;
        
        // Snapping priority: 1st Smart Guides, 2nd Grid
        let snappedBySmartGuide = false;
        if (this.smartGuidesEnabled && this.alignmentGuides.length > 0) {
          const halfW = obj.width / 2;
          const halfH = obj.height / 2;
          
          this.alignmentGuides.forEach(g => {
            if (g.type === 'v') {
              finalX = g.coord - halfW;
              snappedBySmartGuide = true;
            }
            if (g.type === 'h') {
              finalY = g.coord - halfH;
              snappedBySmartGuide = true;
            }
          });
        }
        
        if (!snappedBySmartGuide && this.snapToGrid) {
          const step = this.gridSize;
          finalX = Math.round(targetX / step) * step;
          finalY = Math.round(targetY / step) * step;
        }
        
        obj.x = finalX;
        obj.y = finalY;
      }
      
      else if (this.dragMode === 'rotate') {
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
        let deg = (angle * 180) / Math.PI - 90;
        
        if (shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        obj.rotation = (deg + 360) % 360;
      }
      
      else if (this.dragMode === 'resize_corner') {
        const dx = mousePos.x - this.dragStart.x;
        const dy = mousePos.y - this.dragStart.y;
        
        obj.width = Math.max(15, obj.width + dx);
        obj.height = Math.max(15, obj.height + dy);
        this.dragStart = { x: mousePos.x, y: mousePos.y };
      }
      
      this.render();
    }
    
    else if (this.selectedObjectType === 'opening') {
      const obj = this.openings.find(op => op.id === this.selectedObjectId);
      
      if (this.dragMode === 'move') {
        const wallData = this.findNearestWall(mousePos);
        if (wallData && wallData.distance < 40) {
          obj.wallId = wallData.wall.id;
          obj.x = wallData.proj.x;
          obj.y = wallData.proj.y;
          obj.angle = wallData.angle;
        } else {
          obj.x = mousePos.x - this.dragOffset.x;
          obj.y = mousePos.y - this.dragOffset.y;
        }
      }
      this.render();
    }
    
    else if (this.selectedObjectType === 'wall') {
      const wall = this.walls.find(w => w.id === this.selectedObjectId);
      
      if (this.dragMode === 'wall_node_1') {
        const oldCoords = { x: wall.x1, y: wall.y1 };
        wall.x1 = snapped.x;
        wall.y1 = snapped.y;
        this.propagateWallConnections(wall.id, '1', snapped, oldCoords);
      }
      else if (this.dragMode === 'wall_node_2') {
        const oldCoords = { x: wall.x2, y: wall.y2 };
        wall.x2 = snapped.x;
        wall.y2 = snapped.y;
        this.propagateWallConnections(wall.id, '2', snapped, oldCoords);
      }
      else if (this.dragMode === 'move') {
        const dx = mousePos.x - this.dragStart.x;
        const dy = mousePos.y - this.dragStart.y;
        
        let targetX1 = wall.x1 + dx;
        let targetY1 = wall.y1 + dy;
        let targetX2 = wall.x2 + dx;
        let targetY2 = wall.y2 + dy;
        
        if (this.snapToGrid) {
          const step = this.gridSize;
          targetX1 = Math.round(targetX1 / step) * step;
          targetY1 = Math.round(targetY1 / step) * step;
          targetX2 = Math.round(targetX2 / step) * step;
          targetY2 = Math.round(targetY2 / step) * step;
        }
        
        wall.x1 = targetX1;
        wall.y1 = targetY1;
        wall.x2 = targetX2;
        wall.y2 = targetY2;
        
        this.dragStart = { x: mousePos.x, y: mousePos.y };
      }
      this.render();
    }
  }

  handleMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.svg.style.cursor = 'default';
      return;
    }
    
    if (this.dragMode) {
      this.dragMode = null;
      this.activeCornerIndex = null;
      this.alignmentGuides = [];
      this.renderAlignmentGuides();
      this.saveHistory();
    }
  }

  // --- MOBILE TOUCH GESTURES (TOUCH START/MOVE/END) ---
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mousePos = this.getMousePos(touch);
      const snapped = this.getSnappedPoint(mousePos);
      
      e.preventDefault();
      
      const clickedHandle = e.target.closest('.interaction-handle');
      const clickedItem = e.target.closest('.furniture-item, .opening-item, .wall-line, .room-shape');
      
      if (this.activeTool === 'select' && !clickedHandle && !clickedItem) {
        this.isTouchPanning = true;
        this.touchStartPoint = { x: touch.clientX, y: touch.clientY };
        this.initialPanX = this.panX;
        this.initialPanY = this.panY;
      } else {
        this.executeActionAtCoords(mousePos, snapped, e.target);
      }
    } 
    else if (e.touches.length === 2) {
      e.preventDefault();
      this.isTouchPanning = false;
      this.dragMode = null; 
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      this.initialTouchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      this.initialZoom = this.zoom;
      this.initialPanX = this.panX;
      this.initialPanY = this.panY;
      
      this.touchMidPoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mousePos = this.getMousePos(touch);
      const snapped = this.getSnappedPoint(mousePos);
      
      if (this.isTouchPanning) {
        e.preventDefault();
        const dx = touch.clientX - this.touchStartPoint.x;
        const dy = touch.clientY - this.touchStartPoint.y;
        this.panX = this.initialPanX + dx;
        this.panY = this.initialPanY + dy;
        this.updateWorkspaceTransform();
      } 
      else if (this.activeTool === 'select' && this.selectedObjectId && this.dragMode) {
        e.preventDefault();
        
        if (this.selectedObjectType === 'furniture' && this.dragMode === 'move') {
          this.computeAlignmentGuides(mousePos);
        }
        
        this.executeDragAction(mousePos, snapped, false);
      }
      else {
        this.updateLiveDrawGuides(snapped, mousePos);
      }
    } 
    else if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (this.initialTouchDistance > 0) {
        const ratio = currentDistance / this.initialTouchDistance;
        const targetZoom = Math.max(0.25, Math.min(this.initialZoom * ratio, 6.0));
        
        const rect = this.svg.getBoundingClientRect();
        const midX = this.touchMidPoint.x - rect.left;
        const midY = this.touchMidPoint.y - rect.top;
        
        this.zoom = targetZoom;
        this.panX = midX - (midX - this.initialPanX) * (this.zoom / this.initialZoom);
        this.panY = midY - (midY - this.initialPanY) * (this.zoom / this.initialZoom);
        
        this.updateWorkspaceTransform();
      }
    }
  }

  handleTouchEnd(e) {
    this.isTouchPanning = false;
    this.initialTouchDistance = 0;
    
    if (this.dragMode) {
      this.dragMode = null;
      this.activeCornerIndex = null;
      this.alignmentGuides = [];
      this.renderAlignmentGuides();
      this.saveHistory();
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.tempPoints = [];
      this.calibratePoints = [];
      this.deselectObject();
      this.activeTool = 'select';
      this.render();
    }
    
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedObjectId) {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      this.deleteSelected();
    }
    
    if (this.selectedObjectId && this.selectedObjectType === 'furniture') {
      const obj = this.furniture.find(f => f.id === this.selectedObjectId);
      if (obj) {
        const amt = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') { obj.y -= amt; e.preventDefault(); }
        else if (e.key === 'ArrowDown') { obj.y += amt; e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { obj.x -= amt; e.preventDefault(); }
        else if (e.key === 'ArrowRight') { obj.x += amt; e.preventDefault(); }
        this.render();
      }
    }
    
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.undo();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.redo();
    }
  }

  propagateWallConnections(sourceWallId, nodeIndex, snappedCoords, oldCoords = null) {
    const sourceWall = this.walls.find(w => w.id === sourceWallId);
    if (!sourceWall) return;
    
    const sx = oldCoords ? oldCoords.x : (nodeIndex === '1' ? sourceWall.x1 : sourceWall.x2);
    const sy = oldCoords ? oldCoords.y : (nodeIndex === '1' ? sourceWall.y1 : sourceWall.y2);
    
    const tolerance = 10;
    this.walls.forEach(otherWall => {
      if (otherWall.id === sourceWallId) return;
      
      if (Math.hypot(otherWall.x1 - sx, otherWall.y1 - sy) < tolerance) {
        otherWall.x1 = snappedCoords.x;
        otherWall.y1 = snappedCoords.y;
      }
      if (Math.hypot(otherWall.x2 - sx, otherWall.y2 - sy) < tolerance) {
        otherWall.x2 = snappedCoords.x;
        otherWall.y2 = snappedCoords.y;
      }
    });
  }

  resizeWallLength(wallId, newLength) {
    const wall = this.walls.find(w => w.id === wallId);
    if (!wall) return;
    
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const oldLength = Math.hypot(dx, dy);
    if (oldLength === 0) return;
    
    const oldCoords = { x: wall.x2, y: wall.y2 };
    
    const newX2 = wall.x1 + (dx / oldLength) * newLength;
    const newY2 = wall.y1 + (dy / oldLength) * newLength;
    
    // Propagate connections using the old coordinates before updating the wall
    this.propagateWallConnections(wall.id, '2', { x: newX2, y: newY2 }, oldCoords);
    
    wall.x2 = newX2;
    wall.y2 = newY2;
    
    this.saveHistory();
    this.render();
  }

  findNearestWall(point) {
    let bestDist = Infinity;
    let bestProj = null;
    let bestWall = null;
    let bestAngle = 0;
    
    this.walls.forEach(wall => {
      const proj = this.getProjectionPoint(point, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
      const dist = Math.hypot(point.x - proj.x, point.y - proj.y);
      
      if (dist < bestDist) {
        bestDist = dist;
        bestProj = proj;
        bestWall = wall;
        bestAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * (180 / Math.PI);
      }
    });
    
    if (bestWall) {
      return { wall: bestWall, proj: bestProj, distance: bestDist, angle: bestAngle };
    }
    return null;
  }

  getProjectionPoint(p, a, b) {
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ab2 = ab.x * ab.x + ab.y * ab.y;
    if (ab2 === 0) return a;
    
    let t = (ap.x * ab.x + ap.y * ab.y) / ab2;
    t = Math.max(0, Math.min(1, t));
    
    return { x: a.x + t * ab.x, y: a.y + t * ab.y };
  }

  setSketch(imageUrl) {
    const sketchLayer = this.svg.querySelector('#sketch-layer');
    if (sketchLayer) {
      sketchLayer.innerHTML = `
        <image id="sketch-img" href="${imageUrl}" x="0" y="0" width="1000" height="1000" />
      `;
    }
  }

  setSketchOpacity(val) {
    const sketchLayer = this.svg.querySelector('#sketch-layer');
    if (sketchLayer) {
      sketchLayer.setAttribute('opacity', val);
    }
  }

  selectObject(id, type) {
    this.selectedObjectId = id;
    this.selectedObjectType = type;
    this.render();
    if (this.onSelectionChanged) {
      const obj = this.getSelectedObjectData();
      this.onSelectionChanged(obj);
    }
  }

  deselectObject() {
    this.selectedObjectId = null;
    this.selectedObjectType = null;
    this.render();
    if (this.onSelectionChanged) this.onSelectionChanged(null);
  }

  getSelectedObjectData() {
    if (!this.selectedObjectId) return null;
    if (this.selectedObjectType === 'furniture') {
      return this.furniture.find(f => f.id === this.selectedObjectId);
    }
    if (this.selectedObjectType === 'opening') {
      return this.openings.find(op => op.id === this.selectedObjectId);
    }
    if (this.selectedObjectType === 'wall') {
      return this.walls.find(w => w.id === this.selectedObjectId);
    }
    if (this.selectedObjectType === 'room') {
      return this.rooms.find(r => r.id === this.selectedObjectId);
    }
    return null;
  }

  deleteSelected() {
    if (!this.selectedObjectId) return;
    
    if (this.selectedObjectType === 'furniture') {
      this.furniture = this.furniture.filter(f => f.id !== this.selectedObjectId);
    } else if (this.selectedObjectType === 'opening') {
      this.openings = this.openings.filter(op => op.id !== this.selectedObjectId);
    } else if (this.selectedObjectType === 'wall') {
      this.walls = this.walls.filter(w => w.id !== this.selectedObjectId);
      this.openings = this.openings.filter(op => op.wallId !== this.selectedObjectId);
    } else if (this.selectedObjectType === 'room') {
      this.rooms = this.rooms.filter(r => r.id !== this.selectedObjectId);
    }
    
    this.deselectObject();
    this.saveHistory();
    this.render();
  }

  addFurnitureFromLibrary(libraryId) {
    const libItem = window.OfficeSymbols.furniture[libraryId];
    if (!libItem) return;
    
    const rect = this.svg.getBoundingClientRect();
    const cx = (rect.width / 2 - this.panX) / this.zoom;
    const cy = (rect.height / 2 - this.panY) / this.zoom;
    
    const pxW = this.metersToPx(libItem.width);
    const pxH = this.metersToPx(libItem.height);
    
    const newF = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      libraryId: libraryId,
      name: libItem.name,
      x: cx - pxW / 2,
      y: cy - pxH / 2,
      width: pxW,
      height: pxH,
      rotation: 0,
      color: '#4A5568'
    };
    
    this.furniture.push(newF);
    this.saveHistory();
    this.activeTool = 'select';
    this.selectObject(newF.id, 'furniture');
    this.render();
  }

  // --- RENDERING PIPELINE ---
  render() {
    this.renderRooms();
    this.renderWalls();
    this.renderOpenings();
    this.renderFurniture();
    this.renderMeasures();
    this.renderInteractionLayer();
  }

  // Vector-offset multi-material Wall rendering! Beautifully handles Concrete hatching & Glass transparency
  renderWalls() {
    const layer = this.svg.querySelector('#walls-layer');
    const colors = this.getThemeColors();
    
    layer.innerHTML = this.walls.map(wall => {
      const isSelected = this.selectedObjectId === wall.id && this.selectedObjectType === 'wall';
      const material = wall.material || 'drywall';
      const thickness = wall.thickness || 10;
      
      // Calculate normal vectors to draw filled polygons for high-end styling
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const len = Math.hypot(dx, dy);
      
      if (len === 0) return '';
      
      const nx = -dy / len;
      const ny = dx / len;
      const t = thickness / 2;
      
      // The 4 corners of the structural wall segment
      const p1x = wall.x1 + nx * t; const p1y = wall.y1 + ny * t;
      const p2x = wall.x2 + nx * t; const p2y = wall.y2 + ny * t;
      const p3x = wall.x2 - nx * t; const p3y = wall.y2 - ny * t;
      const p4x = wall.x1 - nx * t; const p4y = wall.y1 - ny * t;
      
      const pointsStr = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`;
      
      let fillVal = '';
      let strokeVal = '';
      let strokeW = 1.2;
      let centerLineHTML = '';
      
      if (isSelected) {
        fillVal = 'rgba(59, 130, 246, 0.2)';
        strokeVal = '#3182CE';
        strokeW = 2.0;
      } else {
        if (material === 'glass') {
          // Semi-transparent blue glass panels with double borders
          fillVal = 'rgba(14, 165, 233, 0.15)';
          strokeVal = colors.wallGlassStroke;
          strokeW = 1.0;
          // Glass centerpiece dashed layout
          centerLineHTML = `<line x1="${wall.x1}" y1="${wall.y1}" x2="${wall.x2}" y2="${wall.y2}" stroke="${colors.wallGlassStroke}" stroke-width="0.8" stroke-dasharray="3,3" />`;
        } else if (material === 'concrete') {
          // Architectural hatch pattern fill
          fillVal = colors.wallConcreteFill;
          strokeVal = colors.wallConcreteStroke;
          strokeW = 1.5;
        } else {
          // Standard Drywall partition block
          fillVal = colors.wallDrywallFill;
          strokeVal = colors.wallDrywallStroke;
          strokeW = 1.2;
        }
      }
      
      return `
        <g class="wall-element" id="el_${wall.id}">
          <!-- Invisible wide touch hitbox -->
          <line class="wall-line cursor-pointer" data-id="${wall.id}"
                x1="${wall.x1}" y1="${wall.y1}" x2="${wall.x2}" y2="${wall.y2}"
                stroke="transparent" stroke-width="25" stroke-linecap="round" />
          <!-- The Styled Structural Wall Polygon -->
          <polygon points="${pointsStr}" fill="${fillVal}" stroke="${strokeVal}" stroke-width="${strokeW}" stroke-linejoin="round" style="pointer-events: none;" />
          ${centerLineHTML}
        </g>
      `;
    }).join('');
  }

  renderOpenings() {
    const layer = this.svg.querySelector('#openings-layer');
    const colors = this.getThemeColors();
    
    layer.innerHTML = this.openings.map(op => {
      const symbol = window.OfficeSymbols.openings[op.style];
      if (!symbol) return '';
      
      const isSelected = this.selectedObjectId === op.id && this.selectedObjectType === 'opening';
      // If selected neon blue, else theme specific opening color
      const color = isSelected ? '#3182CE' : colors.wallGlassStroke;
      
      return `
        <g class="opening-item cursor-pointer" data-id="${op.id}"
           transform="translate(${op.x}, ${op.y}) rotate(${op.angle})">
          <rect x="0" y="-12" width="${op.width}" height="24" fill="none" pointer-events="visible" />
          ${symbol.draw(op.width, color)}
        </g>
      `;
    }).join('');
  }

  renderFurniture() {
    const layer = this.svg.querySelector('#furniture-layer');
    const colors = this.getThemeColors();
    
    layer.innerHTML = this.furniture.map(f => {
      const symbol = window.OfficeSymbols.furniture[f.libraryId];
      if (!symbol) return '';
      
      const isSelected = this.selectedObjectId === f.id && this.selectedObjectType === 'furniture';
      const strokeColor = isSelected ? '#A855F7' : colors.furnitureStroke; // Neon Purple on selection
      
      return `
        <g class="furniture-item cursor-pointer" data-id="${f.id}"
           transform="translate(${f.x}, ${f.y}) rotate(${f.rotation}, ${f.width/2}, ${f.height/2})">
          ${symbol.draw(f.width, f.height, strokeColor)}
          <text x="${f.width/2}" y="${f.height/2 + 4}" font-family="Segoe UI, Inter, sans-serif" font-size="9" fill="#718096" text-anchor="middle" pointer-events="none">${f.name}</text>
        </g>
      `;
    }).join('');
  }

  renderRooms() {
    const layer = this.svg.querySelector('#rooms-layer');
    const colors = this.getThemeColors();
    
    layer.innerHTML = this.rooms.map(room => {
      const pointsStr = room.points.map(p => `${p.x},${p.y}`).join(' ');
      const isSelected = this.selectedObjectId === room.id && this.selectedObjectType === 'room';
      const strokeColor = isSelected ? '#A855F7' : 'transparent';
      
      let area = 0;
      const n = room.points.length;
      for (let i = 0; i < n; i++) {
        const p1 = room.points[i];
        const p2 = room.points[(i + 1) % n];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      area = Math.abs(area) / 2;
      const sqMeters = area / (this.pixelsPerMeter * this.pixelsPerMeter);
      
      let cx = 0, cy = 0;
      room.points.forEach(p => { cx += p.x; cy += p.y; });
      cx /= n;
      cy /= n;
      
      return `
        <g class="room-element" id="room_${room.id}">
          <polygon class="room-shape cursor-pointer" data-id="${room.id}"
                   points="${pointsStr}" fill="${room.color}" fill-opacity="0.08"
                   stroke="${strokeColor}" stroke-width="2.5" />
          <g transform="translate(${cx}, ${cy})" style="pointer-events: none;">
            <rect x="-65" y="-22" width="130" height="40" rx="4" fill="#FFFFFF" fill-opacity="0.95" stroke="#E2E8F0" stroke-width="1" />
            <text x="0" y="-4" font-family="Segoe UI, Inter, sans-serif" font-size="11" font-weight="bold" fill="#2D3748" text-anchor="middle">${room.name}</text>
            <text x="0" y="11" font-family="Segoe UI, Inter, sans-serif" font-size="9" fill="#718096" text-anchor="middle">${this.formatArea(sqMeters)}</text>
          </g>
        </g>
      `;
    }).join('');
  }

  renderMeasures() {
    const layer = this.svg.querySelector('#measures-layer');
    layer.innerHTML = this.measures.map(m => {
      const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
      const meters = this.pxToMeters(len);
      const angle = Math.atan2(m.y2 - m.y1, m.x2 - m.x1);
      const angleDeg = angle * (180 / Math.PI);
      const mx = (m.x1 + m.x2) / 2;
      const my = (m.y1 + m.y2) / 2;
      
      const offsetX = -18 * Math.sin(angle);
      const offsetY = 18 * Math.cos(angle);
      
      return `
        <g class="measure-line-group" style="pointer-events: none;">
          <line x1="${m.x1}" y1="${m.y1}" x2="${m.x1 + offsetX * 1.5}" y2="${m.y1 + offsetY * 1.5}" stroke="#718096" stroke-width="1" />
          <line x1="${m.x2}" y1="${m.y2}" x2="${m.x2 + offsetX * 1.5}" y2="${m.y2 + offsetY * 1.5}" stroke="#718096" stroke-width="1" />
          <line x1="${m.x1 + offsetX}" y1="${m.y1 + offsetY}" x2="${m.x2 + offsetX}" y2="${m.y2 + offsetY}" stroke="#E53E3E" stroke-width="1.2" stroke-dasharray="3,3" />
          <g transform="translate(${m.x1 + offsetX}, ${m.y1 + offsetY}) rotate(${angleDeg})">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#E53E3E" stroke-width="1.5" />
          </g>
          <g transform="translate(${m.x2 + offsetX}, ${m.y2 + offsetY}) rotate(${angleDeg})">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#E53E3E" stroke-width="1.5" />
          </g>
          <g transform="translate(${mx + offsetX * 1.6}, ${my + offsetY * 1.6})">
            <rect x="-30" y="-10" width="60" height="20" rx="3" fill="#E53E3E" />
            <text x="0" y="4" font-family="Segoe UI, Inter, sans-serif" font-size="10" font-weight="600" fill="#FFFFFF" text-anchor="middle">${this.formatDistance(meters)}</text>
          </g>
        </g>
      `;
    }).join('');
  }

  renderInteractionLayer() {
    const layer = this.svg.querySelector('#interaction-layer');
    layer.innerHTML = '';
    
    if (this.selectedObjectId) {
      const obj = this.getSelectedObjectData();
      if (obj) {
        if (this.selectedObjectType === 'furniture') {
          const handles = `
            <line x1="${obj.width / 2}" y1="0" x2="${obj.width / 2}" y2="-25" stroke="#A855F7" stroke-width="1.5" />
            <circle cx="${obj.width / 2}" cy="-25" r="7" fill="#A855F7" stroke="#FFFFFF" stroke-width="2" pointer-events="none" />
            <circle class="interaction-handle cursor-pointer" data-handle-type="rotate" cx="${obj.width / 2}" cy="-25" r="16" fill="transparent" />
            
            <rect x="${obj.width - 5}" y="${obj.height - 5}" width="10" height="10" fill="#A855F7" stroke="#FFFFFF" stroke-width="1.5" pointer-events="none" />
            <rect class="interaction-handle cursor-se-resize" data-handle-type="resize_corner" data-corner-index="3" x="${obj.width - 15}" y="${obj.height - 15}" width="30" height="30" fill="transparent" />
          `;
          layer.innerHTML += `
            <g transform="translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${obj.width/2}, ${obj.height/2})">
              <rect x="0" y="0" width="${obj.width}" height="${obj.height}" fill="none" stroke="#A855F7" stroke-width="1.5" stroke-dasharray="3,3" />
              ${handles}
            </g>
          `;
        }
        else if (this.selectedObjectType === 'wall') {
          layer.innerHTML += `
            <g>
              <circle cx="${obj.x1}" cy="${obj.y1}" r="7" fill="#3182CE" stroke="#FFFFFF" stroke-width="2" pointer-events="none" />
              <circle class="interaction-handle cursor-move" data-handle-type="wall_node_1" cx="${obj.x1}" cy="${obj.y1}" r="18" fill="transparent" />
              
              <circle cx="${obj.x2}" cy="${obj.y2}" r="7" fill="#3182CE" stroke="#FFFFFF" stroke-width="2" pointer-events="none" />
              <circle class="interaction-handle cursor-move" data-handle-type="wall_node_2" cx="${obj.x2}" cy="${obj.y2}" r="18" fill="transparent" />
            </g>
          `;
        }
      }
    }
    
    if (this.activeTool === 'wall' && this.tempPoints.length > 0) {
      const pointsHTML = this.tempPoints.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#3182CE" stroke="#FFFFFF" stroke-width="1.5" />
      `).join('');
      layer.innerHTML += pointsHTML;
    }
    else if (this.activeTool === 'room' && this.tempPoints.length > 0) {
      const pointsStr = this.tempPoints.map(p => `${p.x},${p.y}`).join(' ');
      const dotsHTML = this.tempPoints.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#3182CE" stroke="#FFFFFF" stroke-width="1.5" />
      `).join('');
      layer.innerHTML += `
        <polygon points="${pointsStr}" fill="#3182CE" fill-opacity="0.1" stroke="#3182CE" stroke-width="1.5" stroke-dasharray="3,3" />
        ${dotsHTML}
      `;
    }
    else if (this.activeTool === 'calibrate' && this.calibratePoints.length > 0) {
      const p1 = this.calibratePoints[0];
      layer.innerHTML += `
        <circle cx="${p1.x}" cy="${p1.y}" r="6" fill="#E53E3E" stroke="#FFFFFF" stroke-width="1.5" />
      `;
    }
  }

  updateLiveDrawGuides(snapped, mousePos) {
    const layer = this.svg.querySelector('#interaction-layer');
    if (!layer) return;
    
    const oldGuide = layer.querySelector('.live-draw-guide');
    if (oldGuide) oldGuide.remove();
    
    if (this.activeTool === 'wall' && this.tempPoints.length > 0) {
      const lastP = this.tempPoints[this.tempPoints.length - 1];
      const len = Math.hypot(snapped.x - lastP.x, snapped.y - lastP.y);
      const meters = this.pxToMeters(len);
      const mx = (lastP.x + snapped.x) / 2;
      const my = (lastP.y + snapped.y) / 2;
      
      const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      guideGroup.setAttribute('class', 'live-draw-guide');
      guideGroup.innerHTML = `
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${snapped.x}" y2="${snapped.y}" stroke="#3182CE" stroke-width="8" stroke-opacity="0.4" />
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${snapped.x}" y2="${snapped.y}" stroke="#3182CE" stroke-width="1.5" stroke-dasharray="4,4" />
        <circle cx="${snapped.x}" cy="${snapped.y}" r="6" fill="none" stroke="#48BB78" stroke-width="2" />
        <g transform="translate(${mx}, ${my - 14})">
          <rect x="-30" y="-8" width="60" height="16" rx="3" fill="#2D3748" />
          <text x="0" y="4" font-family="Segoe UI, Inter, sans-serif" font-size="9" font-weight="600" fill="#FFFFFF" text-anchor="middle">${this.formatDistance(meters)}</text>
        </g>
      `;
      layer.appendChild(guideGroup);
    }
    
    else if (this.activeTool === 'measure' && this.tempPoints.length > 0) {
      const lastP = this.tempPoints[0];
      const len = Math.hypot(snapped.x - lastP.x, snapped.y - lastP.y);
      const meters = this.pxToMeters(len);
      const mx = (lastP.x + snapped.x) / 2;
      const my = (lastP.y + snapped.y) / 2;
      
      const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      guideGroup.setAttribute('class', 'live-draw-guide');
      guideGroup.innerHTML = `
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${snapped.x}" y2="${snapped.y}" stroke="#E53E3E" stroke-width="1.5" stroke-dasharray="4,4" />
        <circle cx="${snapped.x}" cy="${snapped.y}" r="6" fill="#E53E3E" fill-opacity="0.5" stroke="#FFFFFF" stroke-width="1.5" />
        <g transform="translate(${mx}, ${my - 14})">
          <rect x="-30" y="-8" width="60" height="16" rx="3" fill="#E53E3E" />
          <text x="0" y="4" font-family="Segoe UI, Inter, sans-serif" font-size="9" font-weight="600" fill="#FFFFFF" text-anchor="middle">${this.formatDistance(meters)}</text>
        </g>
      `;
      layer.appendChild(guideGroup);
    }
    
    else if (this.activeTool === 'room' && this.tempPoints.length > 0) {
      const lastP = this.tempPoints[this.tempPoints.length - 1];
      const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      guideGroup.setAttribute('class', 'live-draw-guide');
      guideGroup.innerHTML = `
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${snapped.x}" y2="${snapped.y}" stroke="#3182CE" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${snapped.x}" cy="${snapped.y}" r="5" fill="#3182CE" fill-opacity="0.4" stroke="#FFFFFF" stroke-width="1.5" />
      `;
      layer.appendChild(guideGroup);
    }
    
    else if (this.activeTool === 'calibrate' && this.calibratePoints.length === 1) {
      const lastP = this.calibratePoints[0];
      const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      guideGroup.setAttribute('class', 'live-draw-guide');
      guideGroup.innerHTML = `
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${mousePos.x}" y2="${mousePos.y}" stroke="#E53E3E" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${mousePos.x}" cy="${mousePos.y}" r="6" fill="#E53E3E" fill-opacity="0.5" stroke="#FFFFFF" stroke-width="1.5" />
      `;
      layer.appendChild(guideGroup);
    }
    
    else if (this.activeTool.startsWith('door_') || this.activeTool === 'window') {
      const wallData = this.findNearestWall(mousePos);
      if (wallData && wallData.distance < 40) {
        const symbol = window.OfficeSymbols.openings[this.activeTool];
        const width = this.activeTool === 'window' ? this.metersToPx(1.2) : this.metersToPx(0.9);
        
        if (symbol) {
          const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          guideGroup.setAttribute('class', 'live-draw-guide');
          guideGroup.innerHTML = `
            <g transform="translate(${wallData.proj.x}, ${wallData.proj.y}) rotate(${wallData.angle})">
              ${symbol.draw(width, '#48BB78')}
            </g>
            <line x1="${mousePos.x}" y1="${mousePos.y}" x2="${wallData.proj.x}" y2="${wallData.proj.y}" stroke="#48BB78" stroke-width="1" stroke-dasharray="2,2" />
          `;
          layer.appendChild(guideGroup);
        }
      } else {
        const guideGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        guideGroup.setAttribute('class', 'live-draw-guide');
        guideGroup.innerHTML = `
          <circle cx="${mousePos.x}" cy="${mousePos.y}" r="12" fill="none" stroke="#E53E3E" stroke-width="1.5" />
          <line x1="${mousePos.x - 18}" y1="${mousePos.y}" x2="${mousePos.x + 18}" y2="${mousePos.y}" stroke="#E53E3E" stroke-width="1" />
          <line x1="${mousePos.x}" y1="${mousePos.y - 18}" x2="${mousePos.x}" y2="${mousePos.y + 18}" stroke="#E53E3E" stroke-width="1" />
        `;
        layer.appendChild(guideGroup);
      }
    }
  }
}

window.FloorplanEditor = FloorplanEditor;