// Main Application State Coordinator and UI Controller
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('error', (e) => {
    console.log("DEBUG ERROR:", e.message, e.filename, e.lineno, e.error ? e.error.stack : "");
  });

  // --- DOM Elements ---
  const svgCanvas = document.getElementById('floorplan-svg');
  const fileUploadInput = document.getElementById('sketch-upload');
  const cameraUploadInput = document.getElementById('sketch-camera-upload');
  const uploadOverlay = document.getElementById('upload-overlay');
  
  // Modals
  const welcomeModal = document.getElementById('welcome-modal');
  const calibrateModal = document.getElementById('calibrate-modal');
  const calibrateInput = document.getElementById('prop-dist-meters');
  const calibrateBtn = document.getElementById('calibrate-submit');
  
  // Sliders & CV Controls
  const brightnessSlider = document.getElementById('slider-brightness');
  const contrastSlider = document.getElementById('slider-contrast');
  const thresholdSlider = document.getElementById('slider-threshold');
  const invertToggle = document.getElementById('toggle-invert');
  const opacitySlider = document.getElementById('slider-opacity');
  const autoTraceBtn = document.getElementById('btn-auto-trace');
  
  // Object Properties Sidebar
  const propPanel = document.getElementById('properties-panel');
  const propTitle = document.getElementById('prop-title');
  const propNameInput = document.getElementById('prop-name');
  const propWidthInput = document.getElementById('prop-width');
  const propHeightInput = document.getElementById('prop-height');
  const propRotationInput = document.getElementById('prop-rotation');
  const propColorInput = document.getElementById('prop-color');
  const propDeleteBtn = document.getElementById('btn-delete-prop');
  
  // Injected Wall-Specific Properties
  const propMaterialSelect = document.getElementById('prop-wall-material');
  const propThicknessSlider = document.getElementById('prop-wall-thickness');
  const propThicknessVal = document.getElementById('prop-thickness-val');
  
  // Library Categories & Search
  const searchInput = document.getElementById('library-search');
  
  // Project / View Actions
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  const btnMetric = document.getElementById('btn-unit-metric');
  const btnImperial = document.getElementById('btn-unit-imperial');
  const btnExportSVG = document.getElementById('btn-export-svg');
  const btnExportPNG = document.getElementById('btn-export-png');
  const btnExportDXF = document.getElementById('btn-export-dxf');
  const btnExportSCR = document.getElementById('btn-export-scr');
  const btnExportPDF = document.getElementById('btn-export-pdf');
  const btnSaveProject = document.getElementById('btn-save-project');
  const btnLoadProject = document.getElementById('btn-load-project');
  const btnDemoProject = document.getElementById('btn-demo-project');
  
  // Hidden Canvas for CV image processing
  const hiddenSrcCanvas = document.createElement('canvas');
  const hiddenDestCanvas = document.createElement('canvas');
  let originalImage = null; // Store Image object for redraws on adjustments

  // --- UNIT PRICING FOR BOM & BUDGET ESTIMATES ---
  const ItemUnitCosts = {
    single_desk: 250,
    executive_desk: 550,
    desk_cluster_4: 1100,
    conference_table_large: 1400,
    conference_table_round: 550,
    reception_desk: 850,
    lounge_sofa_3: 750,
    lounge_chair: 350,
    coffee_table: 180,
    pantry_table_cluster: 680,
    potted_plant_large: 85,
    printer_station: 950,
    server_rack: 2200,
    toilet_wc: 320,
    bathroom_sink: 260,
    
    // Construction per meter
    wall_drywall: 110,
    wall_concrete: 220,
    wall_glass: 350,
    
    // Openings
    opening_door: 350,
    opening_window: 550
  };
  
  // --- INITIALIZE EDITOR ---
  const editor = new FloorplanEditor(svgCanvas, {
    onSelectionChanged: (selectedData) => {
      updatePropertiesPanel(selectedData);
      
      // On mobile screens, automatically open properties panel tab when item selected!
      if (selectedData && window.innerWidth < 1024) {
        const drawer = document.getElementById('mobile-drawer');
        if (drawer.classList.contains('translate-y-full')) {
          openMobileTab('properties');
        }
      }
    },
    onProjectChanged: () => {
      updateProjectStats();
      refreshBudgetCalculations();
    },
    onScaleCalibrated: (pixelDistance, applyScaleCallback) => {
      calibrateModal.classList.remove('hidden');
      
      const label = document.getElementById('calibrate-label');
      if (editor.unitSystem === 'metric') {
        if (label) label.innerText = "How many METERS is the reference line you drew?";
        calibrateInput.value = "1.0";
      } else {
        if (label) label.innerText = "How many FEET is the reference line you drew?";
        calibrateInput.value = "3.28";
      }
      calibrateInput.focus();
      
      const newBtn = calibrateBtn.cloneNode(true);
      calibrateBtn.parentNode.replaceChild(newBtn, calibrateBtn);
      
      newBtn.addEventListener('click', () => {
        const val = parseFloat(calibrateInput.value);
        if (val && val > 0) {
          // Convert imperial feet to meters if unitSystem is imperial
          const meters = editor.unitSystem === 'metric' ? val : val * 0.3048;
          applyScaleCallback(meters);
          calibrateModal.classList.add('hidden');
          
          const unitStr = editor.unitSystem === 'metric' ? "meters" : "feet";
          showNotification("Success", `Scale calibrated! 1 meter = ${Math.round(editor.pixelsPerMeter)} pixels (${val} ${unitStr} reference applied).`);
          
          // Sync sheet layout scale label
          if (window.updateTitleBlockScale) {
            window.updateTitleBlockScale();
          }
        }
      });
    }
  });
  
  window.editorInstance = editor;
  editor.saveHistory();
  
  // --- WELCOME MODAL EVENT HANDLERS (FIXED DUPLICATE ID LISTENERS) ---
  // Bulletproof binding using querySelectorAll to bind modal AND dropzone overlay buttons
  const demoButtons = document.querySelectorAll('#btn-welcome-demo, [id="btn-welcome-demo"]');
  demoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      welcomeModal.classList.add('hidden');
      loadDemoOffice();
    });
  });

  const btnBlankWelcome = document.getElementById('btn-welcome-blank');
  if (btnBlankWelcome) {
    btnBlankWelcome.addEventListener('click', () => {
      startBlankCanvas();
    });
  }
  
  btnDemoProject.addEventListener('click', () => {
    if (confirm("Load demo project? This will replace your current design.")) {
      welcomeModal.classList.add('hidden');
      uploadOverlay.classList.add('hidden');
      loadDemoOffice();
    }
  });
  
  // --- KEYBOARD & GLOBAL BUTTON LINKS ---
  btnUndo.addEventListener('click', () => editor.undo());
  btnRedo.addEventListener('click', () => editor.redo());
  btnClear.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the workspace? All changes will be lost.")) {
      editor.walls = [];
      editor.furniture = [];
      editor.openings = [];
      editor.rooms = [];
      editor.measures = [];
      editor.deselectObject();
      originalImage = null;
      document.getElementById('sketch-layer').innerHTML = '';
      uploadOverlay.classList.remove('hidden');
      
      const sketchBar = document.getElementById('sketch-controls-bar');
      if (sketchBar) sketchBar.classList.add('hidden');
      
      editor.saveHistory();
      editor.render();
      showNotification("Cleared", "Workspace reset.");
    }
  });
  
  // Unit Switching
  btnMetric.addEventListener('click', () => {
    editor.unitSystem = 'metric';
    btnMetric.classList.add('active-tool-btn');
    btnImperial.classList.remove('active-tool-btn');
    editor.render();
    updateProjectStats();
    if (window.updateTitleBlockUnits) window.updateTitleBlockUnits();
    if (window.updateTitleBlockScale) window.updateTitleBlockScale();
  });
  btnImperial.addEventListener('click', () => {
    editor.unitSystem = 'imperial';
    btnImperial.classList.add('active-tool-btn');
    btnMetric.classList.remove('active-tool-btn');
    editor.render();
    updateProjectStats();
    if (window.updateTitleBlockUnits) window.updateTitleBlockUnits();
    if (window.updateTitleBlockScale) window.updateTitleBlockScale();
  });
  
  // --- TOOLBAR CONTROLLER ---
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      
      toolButtons.forEach(b => b.classList.remove('active-tool-btn'));
      btn.classList.add('active-tool-btn');
      
      editor.activeTool = tool;
      
      if (tool === 'wall') {
        showNotification("Wall Mode", "Click on canvas to place corners. Double-click or Esc to finish.");
      } else if (tool === 'room') {
        showNotification("Room Space", "Click corners of a room. Click the starting point to complete the area!");
      } else if (tool === 'measure') {
        showNotification("Tape Measure", "Click first point, then click second point to measure.");
      } else if (tool === 'calibrate') {
        showNotification("Calibrate Scale", "Click two points on your sketch (e.g. a door frame) to set the physical distance.");
      }
      
      editor.deselectObject();
    });
  });
  
  // --- KEYBOARD DYNAMIC INPUT HUD (AUTOCAD-STYLE) ---
  let hudValue = "";
  let lastMouseCoords = { clientX: 0, clientY: 0 };
  const hudElement = document.getElementById('dynamic-hud-input');
  const hudValueInput = document.getElementById('hud-len-value');
  const hudUnitLabel = document.getElementById('hud-unit-label');
  
  function updateHUD() {
    if (!hudElement) return;
    if (hudValue.length > 0) {
      if (hudValueInput) hudValueInput.value = hudValue;
      if (hudUnitLabel) hudUnitLabel.innerText = editor.unitSystem === 'metric' ? 'm' : 'ft';
      
      // Position HUD near cursor using stored coords
      const rect = svgCanvas.getBoundingClientRect();
      const x = lastMouseCoords.clientX - rect.left;
      const y = lastMouseCoords.clientY - rect.top;
      hudElement.style.left = `${x + 20}px`;
      hudElement.style.top = `${y + 15}px`;
      hudElement.classList.remove('hidden');
    } else {
      hudElement.classList.add('hidden');
    }
  }

  function processHUDInput() {
    const val = parseFloat(hudValue);
    if (!isNaN(val) && val > 0) {
      let meters = val;
      if (editor.unitSystem === 'imperial') {
        meters = val * 0.3048; // convert feet to meters
      }
      const lenPx = editor.metersToPx(meters);
      const lastP = editor.tempPoints[editor.tempPoints.length - 1];
      const mousePos = editor.getMousePos(lastMouseCoords);
      
      let angle = Math.atan2(mousePos.y - lastP.y, mousePos.x - lastP.x);
      if (editor.orthoMode) {
        const angleDeg = (angle * 180) / Math.PI;
        const snappedAngle = Math.round(angleDeg / 45) * 45;
        angle = (snappedAngle * Math.PI) / 180;
      }
      
      const endX = lastP.x + lenPx * Math.cos(angle);
      const endY = lastP.y + lenPx * Math.sin(angle);
      const snapped = { x: endX, y: endY };
      
      const newWall = {
        id: 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        x1: lastP.x,
        y1: lastP.y,
        x2: snapped.x,
        y2: snapped.y,
        thickness: 10,
        material: 'drywall'
      };
      
      editor.walls.push(newWall);
      editor.tempPoints.push(snapped);
      editor.saveHistory();
      editor.render();
      
      showNotification("Wall Placed", `Wall segment of length ${hudValue} ${editor.unitSystem === 'metric' ? 'm' : 'ft'} placed.`);
    }
    hudValue = "";
    if (hudElement) hudElement.classList.add('hidden');
  }

  svgCanvas.addEventListener('mousemove', (e) => {
    lastMouseCoords = { clientX: e.clientX, clientY: e.clientY };
    if (editor.activeTool === 'wall' && editor.tempPoints.length > 0 && hudValue.length > 0) {
      updateHUD();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toolButtons.forEach(b => b.classList.remove('active-tool-btn'));
      const selectBtn = document.querySelector('[data-tool="select"]');
      if (selectBtn) selectBtn.classList.add('active-tool-btn');
      editor.activeTool = 'select';
      
      // Reset HUD
      hudValue = "";
      if (hudElement) hudElement.classList.add('hidden');
    }
    
    // Intercept keyboard entry if drawing wall
    if (editor.activeTool === 'wall' && editor.tempPoints.length > 0) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        hudValue = hudValue.slice(0, -1);
        updateHUD();
      }
      else if (/^[0-9.]$/.test(e.key)) {
        e.preventDefault();
        if (e.key === '.' && hudValue.includes('.')) return;
        hudValue += e.key;
        updateHUD();
      }
      else if (e.key === 'Enter') {
        e.preventDefault();
        processHUDInput();
      }
    }
  });
  
  // --- OFFICE FURNITURE LIBRARY INTERACTION ---
  const libraryContainer = document.getElementById('library-list');
  
  function populateLibrary(filterText = '') {
    libraryContainer.innerHTML = '';
    const items = window.OfficeSymbols.furniture;
    
    Object.keys(items).forEach(key => {
      const item = items[key];
      if (filterText && !item.name.toLowerCase().includes(filterText.toLowerCase())) {
        return;
      }
      
      const div = document.createElement('div');
      div.className = "library-card bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer flex flex-col items-center select-none text-center";
      div.setAttribute('data-lib-id', key);
      
      const scale = 30; 
      const pW = item.width * scale;
      const pH = item.height * scale;
      const boxSize = 70;
      const ox = (boxSize - pW) / 2;
      const oy = (boxSize - pH) / 2;
      
      div.innerHTML = `
        <div class="h-16 w-full flex items-center justify-center mb-2 overflow-hidden bg-slate-900 rounded border border-slate-800 p-1">
          <svg width="${boxSize}" height="${boxSize}" viewBox="0 0 ${boxSize} ${boxSize}">
            <g transform="translate(${ox}, ${oy}) scale(${scale/40})">
              ${item.draw(item.width * 40, item.height * 40, '#4299E1')}
            </g>
          </svg>
        </div>
        <div class="text-xs font-semibold text-slate-200 line-clamp-1 leading-tight mb-0.5">${item.name}</div>
        <div class="text-[10px] text-slate-400 font-medium">${item.width}m x ${item.height}m</div>
      `;
      
      div.addEventListener('click', () => {
        editor.addFurnitureFromLibrary(key);
        showNotification("Added", `Placed ${item.name} in layout workspace.`);
      });
      
      libraryContainer.appendChild(div);
    });
  }
  
  searchInput.addEventListener('input', (e) => {
    populateLibrary(e.target.value);
  });
  
  populateLibrary(); 
  
  // --- PROPERTIES BAR UPDATES ---
  function updatePropertiesPanel(obj) {
    if (!obj) {
      propPanel.classList.add('hidden');
      return;
    }
    
    propPanel.classList.remove('hidden');
    propTitle.innerText = obj.name || (obj.type === 'opening' ? (obj.style === 'window' ? 'Window' : 'Door') : 'Wall Partition');
    
    propNameInput.value = obj.name || obj.label || '';
    
    const rotGroup = document.getElementById('prop-rotation-group');
    const colGroup = document.getElementById('prop-color-group');
    const matGroup = document.getElementById('prop-material-group');
    const thickGroup = document.getElementById('prop-thickness-group');
    const lengthGroup = document.getElementById('prop-wall-length-group');
    const lengthInput = document.getElementById('prop-wall-length');
    const lengthUnit = document.getElementById('prop-wall-len-unit');
    
    if (obj.type === 'wall' || (editor.selectedObjectType === 'wall')) {
      rotGroup.classList.add('hidden');
      colGroup.classList.add('hidden');
      matGroup.classList.remove('hidden');
      thickGroup.classList.remove('hidden');
      if (lengthGroup) lengthGroup.classList.remove('hidden');
      
      propWidthInput.parentNode.classList.add('hidden');
      propHeightInput.parentNode.classList.add('hidden');
      
      propMaterialSelect.value = obj.material || 'drywall';
      propThicknessSlider.value = obj.thickness || 10;
      propThicknessVal.innerText = `${obj.thickness || 10} cm`;
      
      // Calculate wall length in correct units
      const lenPx = Math.hypot(obj.x2 - obj.x1, obj.y2 - obj.y1);
      let lenReal = editor.pxToMeters(lenPx);
      if (editor.unitSystem === 'imperial') {
        lenReal = lenReal / 0.3048; // convert meters back to feet
      }
      if (lengthInput) lengthInput.value = lenReal.toFixed(2);
      if (lengthUnit) lengthUnit.innerText = editor.unitSystem === 'metric' ? 'meters' : 'feet';
    } else {
      rotGroup.classList.remove('hidden');
      colGroup.classList.remove('hidden');
      matGroup.classList.add('hidden');
      thickGroup.classList.add('hidden');
      if (lengthGroup) lengthGroup.classList.add('hidden');
      
      if (obj.width) {
        propWidthInput.value = editor.pxToMeters(obj.width).toFixed(2);
        propWidthInput.parentNode.classList.remove('hidden');
      } else {
        propWidthInput.parentNode.classList.add('hidden');
      }
      
      if (obj.height) {
        propHeightInput.value = editor.pxToMeters(obj.height).toFixed(2);
        propHeightInput.parentNode.classList.remove('hidden');
      } else {
        propHeightInput.parentNode.classList.add('hidden');
      }
      
      if (typeof obj.rotation === 'number') {
        propRotationInput.value = Math.round(obj.rotation);
      }
      
      if (obj.color) {
        propColorInput.value = obj.color;
      }
    }
  }
  
  propNameInput.addEventListener('input', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj) {
      obj.name = e.target.value;
      obj.label = e.target.value;
      editor.render();
    }
  });
  
  propWidthInput.addEventListener('change', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj) {
      const meters = parseFloat(e.target.value);
      if (meters && meters > 0) {
        obj.width = editor.metersToPx(meters);
        editor.saveHistory();
        editor.render();
      }
    }
  });
  
  propHeightInput.addEventListener('change', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj) {
      const meters = parseFloat(e.target.value);
      if (meters && meters > 0) {
        obj.height = editor.metersToPx(meters);
        editor.saveHistory();
        editor.render();
      }
    }
  });
  
  propRotationInput.addEventListener('input', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj) {
      const deg = parseInt(e.target.value);
      if (!isNaN(deg)) {
        obj.rotation = (deg + 360) % 360;
        editor.render();
      }
    }
  });
  
  propColorInput.addEventListener('input', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj) {
      obj.color = e.target.value;
      editor.render();
    }
  });
  
  propMaterialSelect.addEventListener('change', (e) => {
    const obj = editor.getSelectedObjectData();
    if (obj && editor.selectedObjectType === 'wall') {
      obj.material = e.target.value;
      editor.saveHistory();
      editor.render();
      refreshBudgetCalculations();
    }
  });
  
  propThicknessSlider.addEventListener('input', (e) => {
    const obj = editor.getSelectedObjectData();
    const val = parseInt(e.target.value);
    propThicknessVal.innerText = `${val} cm`;
    if (obj && editor.selectedObjectType === 'wall') {
      obj.thickness = val;
      editor.render();
    }
  });

  const wallLengthInput = document.getElementById('prop-wall-length');
  if (wallLengthInput) {
    wallLengthInput.addEventListener('change', (e) => {
      const obj = editor.getSelectedObjectData();
      if (obj && editor.selectedObjectType === 'wall') {
        const val = parseFloat(e.target.value);
        if (val && val > 0) {
          let meters = val;
          if (editor.unitSystem === 'imperial') {
            meters = val * 0.3048; // convert feet to meters
          }
          const pxLen = editor.metersToPx(meters);
          editor.resizeWallLength(obj.id, pxLen);
          showNotification("Wall Resized", `Wall length updated to ${val} ${editor.unitSystem === 'metric' ? 'm' : 'ft'}.`);
        }
      }
    });
  }

  propDeleteBtn.addEventListener('click', () => {
    editor.deleteSelected();
  });
  
  // --- PROFESSIONAL SHEET LAYOUT & TITLE BLOCK BINDINGS ---
  const sheetProjectTitle = document.getElementById('sheet-project-title');
  const tbProjectTitle = document.getElementById('tb-project-title');
  const sheetClientName = document.getElementById('sheet-client-name');
  const tbClientName = document.getElementById('tb-client-name');
  const sheetReleaseDate = document.getElementById('sheet-release-date');
  const tbDate = document.getElementById('tb-date');
  const sheetScaleRatio = document.getElementById('sheet-scale-ratio');
  const tbScaleRatio = document.getElementById('tb-scale-ratio');
  const tbUnitSystem = document.getElementById('tb-unit-system');

  function updateTitleBlockScale() {
    if (!sheetScaleRatio || !tbScaleRatio) return;
    if (sheetScaleRatio.value === 'auto') {
      const scaleVal = Math.round(40 / editor.pixelsPerMeter * 100);
      tbScaleRatio.textContent = `1:${scaleVal} (Auto)`;
    } else {
      tbScaleRatio.textContent = sheetScaleRatio.value;
    }
  }

  function updateTitleBlockUnits() {
    if (!tbUnitSystem) return;
    if (editor.unitSystem === 'metric') {
      tbUnitSystem.textContent = "Metric (M)";
    } else {
      tbUnitSystem.textContent = "Imperial (FT)";
    }
  }

  // Bind input synchronization
  if (sheetProjectTitle && tbProjectTitle) {
    sheetProjectTitle.addEventListener('input', (e) => {
      tbProjectTitle.textContent = e.target.value;
    });
    // Set initial value
    tbProjectTitle.textContent = sheetProjectTitle.value;
  }

  if (sheetClientName && tbClientName) {
    sheetClientName.addEventListener('input', (e) => {
      tbClientName.textContent = e.target.value;
    });
    // Set initial value
    tbClientName.textContent = sheetClientName.value;
  }

  if (sheetReleaseDate && tbDate) {
    // Default to current date YYYY-MM-DD on load
    const today = new Date().toISOString().split('T')[0];
    sheetReleaseDate.value = today;
    tbDate.textContent = today;

    sheetReleaseDate.addEventListener('input', (e) => {
      tbDate.textContent = e.target.value;
    });
  }

  if (sheetScaleRatio) {
    sheetScaleRatio.addEventListener('change', updateTitleBlockScale);
  }

  // Make scale updater globally accessible to run on scale calibrations
  window.updateTitleBlockScale = updateTitleBlockScale;
  window.updateTitleBlockUnits = updateTitleBlockUnits;

  // Run initial updates
  updateTitleBlockScale();
  updateTitleBlockUnits();
  
  // --- SKETCH FILE UPLOAD & PRE-PROCESSING ---
  fileUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      editor.sketchFileName = file.name;
      processSketchUpload(file);
    }
  });
  
  const overlayUploadInput = document.getElementById('overlay-sketch-upload');
  if (overlayUploadInput) {
    overlayUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        editor.sketchFileName = file.name;
        processSketchUpload(file);
      }
    });
  }
  
  if (cameraUploadInput) {
    cameraUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        editor.sketchFileName = file.name;
        processSketchUpload(file);
      }
    });
  }

  function processSketchUpload(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      originalImage = new Image();
      originalImage.onload = () => {
        hiddenSrcCanvas.width = originalImage.width;
        hiddenSrcCanvas.height = originalImage.height;
        const ctx = hiddenSrcCanvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0);
        
        editor.setSketch(event.target.result);
        uploadOverlay.classList.add('hidden');
        welcomeModal.classList.add('hidden');
        
        toggleSidebarTab('sketch');
        
        runCVProcessing();
        
        // Show sketch controls toolbar dynamically
        const sketchBar = document.getElementById('sketch-controls-bar');
        if (sketchBar) sketchBar.classList.remove('hidden');
        
        showNotification("Loaded Sketch", "You can trace manually, calibrate scale, or click 'Auto-Detect Walls'!");
      };
      originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  window.processSketchUploadExternally = processSketchUpload;
  
  // --- PROCEDURAL TEMPLATE BLUEPRINT LOADER ---
  function loadSampleSketchTemplate(type) {
    if (type === 'blueprint_mvp') {
      editor.sketchFileName = 'blueprint-mvp-sketch.png';
      CVProcessor.generateSampleSketch(hiddenSrcCanvas, type);
      const dataURL = hiddenSrcCanvas.toDataURL();
      
      originalImage = new Image();
      originalImage.onload = () => {
        editor.setSketch(dataURL);
        uploadOverlay.classList.add('hidden');
        
        toggleSidebarTab('sketch');
        
        brightnessSlider.value = 5;
        contrastSlider.value = 40;
        thresholdSlider.value = 135;
        invertToggle.checked = false;
        document.getElementById('toggle-processed-bg').checked = false; // Show detailed sketchy overlay
        
        runCVProcessing();
        
        // Show sketch controls toolbar dynamically
        const sketchBar = document.getElementById('sketch-controls-bar');
        if (sketchBar) sketchBar.classList.remove('hidden');
        
        // Populate precise CAD vectors matching the blueprint image exactly!
        loadBlueprintMVPLayout();
      };
      originalImage.src = dataURL;
      return;
    }

    // Save corresponding template names
    if (type === 'studio') editor.sketchFileName = 'compact-hub-sketch.png';
    else if (type === 'l_shaped') editor.sketchFileName = 'l-suite-sketch.png';
    else if (type === 'clinic') editor.sketchFileName = 'clinic-sketch.png';
    else editor.sketchFileName = 'sketch.png';

    CVProcessor.generateSampleSketch(hiddenSrcCanvas, type);
    const dataURL = hiddenSrcCanvas.toDataURL();
    
    originalImage = new Image();
    originalImage.onload = () => {
      editor.setSketch(dataURL);
      uploadOverlay.classList.add('hidden');
      
      toggleSidebarTab('sketch');
      
      brightnessSlider.value = 10;
      contrastSlider.value = 35;
      thresholdSlider.value = 140;
      invertToggle.checked = false;
      document.getElementById('toggle-processed-bg').checked = true;
      
      runCVProcessing();
      
      // Show sketch controls toolbar dynamically
      const sketchBar = document.getElementById('sketch-controls-bar');
      if (sketchBar) sketchBar.classList.remove('hidden');
      
      showNotification("Template Loaded", "Procedural hand-drawn draft loaded! Press 'Auto-Detect Walls' to vectorize.");
    };
    originalImage.src = dataURL;
  }

  // Exact scaled CAD vector layout builder for the User's Blueprint (2nd image)
  function loadBlueprintMVPLayout() {
    editor.walls = [];
    editor.furniture = [];
    editor.openings = [];
    editor.rooms = [];
    editor.measures = [];
    
    editor.pixelsPerMeter = 40.0; // 1 meter = 40 pixels (gives 23.5m width x 13.5m height outer boundary)

    // A. Concrete Core Structural Perimeter (23.5m x 13.5m)
    // SVG pixels boundaries: Left=100, Right=1040, Top=100, Bottom=640
    const outerWalls = [
      { id: 'w_o1', x1: 100, y1: 100, x2: 1040, y2: 100, thickness: 14, material: 'concrete' },
      { id: 'w_o2', x1: 1040, y1: 100, x2: 1040, y2: 640, thickness: 14, material: 'concrete' },
      { id: 'w_o3', x1: 1040, y1: 640, x2: 100, y2: 640, thickness: 14, material: 'concrete' },
      { id: 'w_o4', x1: 100, y1: 640, x2: 100, y2: 100, thickness: 14, material: 'concrete' }
    ];
    editor.walls.push(...outerWalls);

    // B. Office Drywall Partition Walls
    const partitions = [
      // Left vertical partition spine dividing left rooms
      { id: 'w_i1', x1: 190, y1: 100, x2: 190, y2: 430, thickness: 10, material: 'drywall' },
      
      // Pantry division
      { id: 'w_i2', x1: 100, y1: 210, x2: 190, y2: 210, thickness: 10, material: 'drywall' },
      // Left cabin splits
      { id: 'w_i3', x1: 100, y1: 320, x2: 190, y2: 320, thickness: 10, material: 'drywall' },
      
      // Horizontal wall capping left rooms and stairs
      { id: 'w_i4', x1: 100, y1: 430, x2: 390, y2: 430, thickness: 12, material: 'concrete' },

      // Top Row Rooms bottom wall spine (Cabins A, B, C and Washroom U)
      { id: 'w_i5_spine', x1: 190, y1: 230, x2: 700, y2: 230, thickness: 10, material: 'drywall' },
      // Top Row vertical room dividers
      { id: 'w_i5_div1', x1: 350, y1: 100, x2: 350, y2: 230, thickness: 10, material: 'drywall' },
      { id: 'w_i5_div2', x1: 480, y1: 100, x2: 480, y2: 230, thickness: 10, material: 'drywall' },
      { id: 'w_i5_div3', x1: 570, y1: 100, x2: 570, y2: 230, thickness: 10, material: 'drywall' },
      { id: 'w_i5_div4', x1: 700, y1: 100, x2: 700, y2: 230, thickness: 10, material: 'drywall' },

      // Middle-Left small cabins
      { id: 'w_i6_spine', x1: 190, y1: 330, x2: 390, y2: 330, thickness: 10, material: 'drywall' },
      { id: 'w_i6_div', x1: 290, y1: 230, x2: 290, y2: 330, thickness: 10, material: 'drywall' },
      { id: 'w_i6_right', x1: 390, y1: 230, x2: 390, y2: 430, thickness: 10, material: 'drywall' },

      // Staircase core dividers
      { id: 'w_i7_stairs', x1: 320, y1: 430, x2: 320, y2: 640, thickness: 12, material: 'concrete' },
      { id: 'w_i7_lobby', x1: 390, y1: 430, x2: 390, y2: 640, thickness: 12, material: 'concrete' },
      { id: 'w_i7_divider', x1: 320, y1: 500, x2: 390, y2: 500, thickness: 10, material: 'drywall' },

      // Bottom Row Cabins spine & dividers
      { id: 'w_i8_spine', x1: 390, y1: 430, x2: 1040, y2: 430, thickness: 10, material: 'drywall' },
      { id: 'w_i8_div1', x1: 600, y1: 430, x2: 600, y2: 640, thickness: 10, material: 'drywall' },
      { id: 'w_i8_div2', x1: 800, y1: 430, x2: 800, y2: 640, thickness: 10, material: 'drywall' },

      // Top-Right Washrooms (M & F) spine & dividers
      { id: 'w_i9_spine', x1: 900, y1: 230, x2: 1040, y2: 230, thickness: 10, material: 'drywall' },
      { id: 'w_i9_div1', x1: 900, y1: 100, x2: 900, y2: 230, thickness: 10, material: 'drywall' },
      { id: 'w_i9_div2', x1: 970, y1: 100, x2: 970, y2: 230, thickness: 8, material: 'drywall' },

      // Middle-Right Cabins vertical spine & dividers
      { id: 'w_i10_spine', x1: 900, y1: 230, x2: 900, y2: 430, thickness: 10, material: 'drywall' },
      { id: 'w_i10_div', x1: 900, y1: 330, x2: 1040, y2: 330, thickness: 10, material: 'drywall' }
    ];
    editor.walls.push(...partitions);

    // C. Mathematical Wall Openings (Doors & Windows snapped to walls)
    const openingsList = [
      // Doors (Single swing doors)
      { id: 'op_m1', type: 'door', style: 'door_single', wallId: 'w_i2', x: 145, y: 210, width: editor.metersToPx(0.85), angle: 0 },
      { id: 'op_m2', type: 'door', style: 'door_single', wallId: 'w_i3', x: 145, y: 320, width: editor.metersToPx(0.85), angle: 0 },
      { id: 'op_m3', type: 'door', style: 'door_single', wallId: 'w_i4', x: 145, y: 430, width: editor.metersToPx(0.85), angle: 0 },
      
      { id: 'op_m4', type: 'door', style: 'door_single', wallId: 'w_i5_spine', x: 270, y: 230, width: editor.metersToPx(0.85), angle: 180 },
      { id: 'op_m5', type: 'door', style: 'door_single', wallId: 'w_i5_spine', x: 415, y: 230, width: editor.metersToPx(0.85), angle: 180 },
      { id: 'op_m6', type: 'door', style: 'door_single', wallId: 'w_i5_spine', x: 525, y: 230, width: editor.metersToPx(0.80), angle: 180 },
      { id: 'op_m7', type: 'door', style: 'door_single', wallId: 'w_i5_spine', x: 635, y: 230, width: editor.metersToPx(0.85), angle: 180 },
      
      { id: 'op_m8', type: 'door', style: 'door_single', wallId: 'w_i9_spine', x: 935, y: 230, width: editor.metersToPx(0.80), angle: 180 },
      { id: 'op_m9', type: 'door', style: 'door_single', wallId: 'w_i9_spine', x: 1005, y: 230, width: editor.metersToPx(0.80), angle: 180 },

      { id: 'op_m10', type: 'door', style: 'door_single', wallId: 'w_i6_spine', x: 240, y: 330, width: editor.metersToPx(0.85), angle: 180 },
      { id: 'op_m11', type: 'door', style: 'door_single', wallId: 'w_i6_spine', x: 340, y: 330, width: editor.metersToPx(0.85), angle: 180 },
      { id: 'op_m12', type: 'door', style: 'door_single', wallId: 'w_i6_right', x: 390, y: 380, width: editor.metersToPx(0.85), angle: 90 },

      { id: 'op_m13', type: 'door', style: 'door_single', wallId: 'w_i4', x: 355, y: 430, width: editor.metersToPx(0.85), angle: 180 },

      { id: 'op_m14', type: 'door', style: 'door_single', wallId: 'w_i8_spine', x: 495, y: 430, width: editor.metersToPx(0.90), angle: 0 },
      { id: 'op_m15', type: 'door', style: 'door_single', wallId: 'w_i8_spine', x: 700, y: 430, width: editor.metersToPx(0.90), angle: 0 },
      { id: 'op_m16', type: 'door', style: 'door_single', wallId: 'w_i8_spine', x: 970, y: 430, width: editor.metersToPx(0.90), angle: 0 },

      { id: 'op_m17', type: 'door', style: 'door_single', wallId: 'w_i10_spine', x: 900, y: 280, width: editor.metersToPx(0.85), angle: 90 },
      { id: 'op_m18', type: 'door', style: 'door_single', wallId: 'w_i10_spine', x: 900, y: 380, width: editor.metersToPx(0.85), angle: 90 },

      // Windows (Outer walls double-pane windows)
      { id: 'op_w1', type: 'window', style: 'window', wallId: 'w_o1', x: 270, y: 100, width: editor.metersToPx(1.3), angle: 0 },
      { id: 'op_w2', type: 'window', style: 'window', wallId: 'w_o1', x: 415, y: 100, width: editor.metersToPx(1.3), angle: 0 },
      { id: 'op_w3', type: 'window', style: 'window', wallId: 'w_o1', x: 635, y: 100, width: editor.metersToPx(1.3), angle: 0 },
      
      { id: 'op_w4', type: 'window', style: 'window', wallId: 'w_o3', x: 495, y: 640, width: editor.metersToPx(1.6), angle: 0 },
      { id: 'op_w5', type: 'window', style: 'window', wallId: 'w_o3', x: 700, y: 640, width: editor.metersToPx(1.6), angle: 0 },
      { id: 'op_w6', type: 'window', style: 'window', wallId: 'w_o3', x: 970, y: 640, width: editor.metersToPx(1.6), angle: 0 },

      { id: 'op_w7', type: 'window', style: 'window', wallId: 'w_o2', x: 1040, y: 280, width: editor.metersToPx(1.3), angle: 90 },
      { id: 'op_w8', type: 'window', style: 'window', wallId: 'w_o2', x: 1040, y: 380, width: editor.metersToPx(1.3), angle: 90 }
    ];
    editor.openings.push(...openingsList);

    // D. Architectural Furniture blocks
    editor.furniture.push(
      // Precise Staircase Core blocks with double flight steps
      { id: 'f_mvp_stairs', libraryId: 'staircase', name: "Staircase core", x: 110, y: 445, width: editor.metersToPx(2.0), height: editor.metersToPx(4.3), rotation: 90, color: '#4A5568' },
      
      // Professional Office Workspace Desks
      { id: 'f_pantry_t', libraryId: 'pantry_table_cluster', name: "Pantry High-Table", x: 115, y: 120, width: editor.metersToPx(1.6), height: editor.metersToPx(0.8), rotation: 90, color: '#D69E2E' },
      { id: 'f_desk_a', libraryId: 'executive_desk', name: "Executive L-Desk", x: 215, y: 120, width: editor.metersToPx(1.8), height: editor.metersToPx(1.6), rotation: 90, color: '#3182CE' },
      { id: 'f_desk_b', libraryId: 'single_desk', name: "Manager Desk", x: 375, y: 125, width: editor.metersToPx(1.5), height: editor.metersToPx(0.85), rotation: 90, color: '#4A5568' },
      { id: 'f_desk_c', libraryId: 'conference_table_large', name: "Conference Table (10p)", x: 590, y: 120, width: editor.metersToPx(2.4), height: editor.metersToPx(1.2), rotation: 0, color: '#319795' },
      
      { id: 'f_desk_l1', libraryId: 'single_desk', name: "Station 1", x: 200, y: 245, width: editor.metersToPx(1.4), height: editor.metersToPx(0.8), rotation: 0, color: '#4A5568' },
      { id: 'f_desk_l2', libraryId: 'single_desk', name: "Station 2", x: 300, y: 245, width: editor.metersToPx(1.4), height: editor.metersToPx(0.8), rotation: 0, color: '#4A5568' },
      
      { id: 'f_lobby_reception', libraryId: 'reception_desk', name: "Reception Counter", x: 420, y: 320, width: editor.metersToPx(2.2), height: editor.metersToPx(1.1), rotation: 180, color: '#2C5282' },
      { id: 'f_lobby_sofa1', libraryId: 'lounge_sofa_3', name: "Guest Sofa", x: 440, y: 240, width: editor.metersToPx(2.1), height: editor.metersToPx(0.85), rotation: 0, color: '#4A5568' },
      { id: 'f_lobby_plant', libraryId: 'potted_plant_large', name: "Lobby Plant", x: 355, y: 240, width: editor.metersToPx(0.6), height: editor.metersToPx(0.6), rotation: 0, color: '#2F855A' },
      
      // Bottom Row Cabins Desks
      { id: 'f_desk_bot1', libraryId: 'desk_cluster_4', name: "Operations Cluster", x: 440, y: 500, width: editor.metersToPx(2.8), height: editor.metersToPx(1.6), rotation: 0, color: '#4A5568' },
      { id: 'f_desk_bot2', libraryId: 'desk_cluster_4', name: "Tech Support Cluster", x: 650, y: 500, width: editor.metersToPx(2.8), height: editor.metersToPx(1.6), rotation: 0, color: '#4A5568' },
      { id: 'f_rack_bot3', libraryId: 'server_rack', name: "Mainframe Server Rack", x: 880, y: 510, width: editor.metersToPx(0.9), height: editor.metersToPx(0.9), rotation: 90, color: '#9B2C2C' },
      { id: 'f_rack_bot3_b', libraryId: 'server_rack', name: "Backup Server Rack", x: 880, y: 560, width: editor.metersToPx(0.9), height: editor.metersToPx(0.9), rotation: 90, color: '#9B2C2C' },
      
      // Washrooms sanitaries
      { id: 'f_wc_u', libraryId: 'toilet_wc', name: "WC", x: 495, y: 110, width: editor.metersToPx(0.6), height: editor.metersToPx(0.7), rotation: 180, color: '#718096' },
      { id: 'f_sink_u', libraryId: 'bathroom_sink', name: "Sink", x: 545, y: 110, width: editor.metersToPx(0.6), height: editor.metersToPx(0.5), rotation: 180, color: '#718096' },
      
      { id: 'f_wc_m', libraryId: 'toilet_wc', name: "WC", x: 915, y: 110, width: editor.metersToPx(0.6), height: editor.metersToPx(0.7), rotation: 180, color: '#718096' },
      { id: 'f_wc_f', libraryId: 'toilet_wc', name: "WC", x: 985, y: 110, width: editor.metersToPx(0.6), height: editor.metersToPx(0.7), rotation: 180, color: '#718096' }
    );

    // E. Room Schedules (Name & Square Footage Tags)
    editor.rooms.push(
      { id: 'r_mvp1', name: "Pantry Breakroom", points: [ {x:100, y:100}, {x:190, y:100}, {x:190, y:210}, {x:100, y:210} ], color: '#ED8936' },
      { id: 'r_mvp2', name: "CEO Executive Suite", points: [ {x:190, y:100}, {x:350, y:100}, {x:350, y:230}, {x:190, y:230} ], color: '#3182CE' },
      { id: 'r_mvp3', name: "Manager Cabin", points: [ {x:350, y:100}, {x:480, y:100}, {x:480, y:230}, {x:350, y:230} ], color: '#3182CE' },
      { id: 'r_mvp4', name: "Washroom U (Unisex)", points: [ {x:480, y:100}, {x:570, y:100}, {x:570, y:230}, {x:480, y:230} ], color: '#805AD5' },
      { id: 'r_mvp5', name: "Conference Room", points: [ {x:570, y:100}, {x:700, y:100}, {x:700, y:230}, {x:570, y:230} ], color: '#319795' },
      { id: 'r_mvp6', name: "Washroom M", points: [ {x:900, y:100}, {x:970, y:100}, {x:970, y:230}, {x:900, y:230} ], color: '#805AD5' },
      { id: 'r_mvp7', name: "Washroom F", points: [ {x:970, y:100}, {x:1040, y:100}, {x:1040, y:230}, {x:970, y:230} ], color: '#805AD5' },
      
      { id: 'r_mvp_left1', name: "Left Cabin 1", points: [ {x:100, y:210}, {x:190, y:210}, {x:190, y:320}, {x:100, y:320} ], color: '#3182CE' },
      { id: 'r_mvp_left2', name: "Left Cabin 2", points: [ {x:100, y:320}, {x:190, y:320}, {x:190, y:430}, {x:100, y:430} ], color: '#3182CE' },
      
      { id: 'r_mvp_mid_l1', name: "Sales Cabin A", points: [ {x:190, y:230}, {x:290, y:230}, {x:290, y:330}, {x:190, y:330} ], color: '#3182CE' },
      { id: 'r_mvp_mid_l2', name: "Sales Cabin B", points: [ {x:290, y:230}, {x:390, y:230}, {x:390, y:330}, {x:290, y:330} ], color: '#3182CE' },
      { id: 'r_mvp_mid_l3', name: "Finance Cabin", points: [ {x:190, y:330}, {x:390, y:330}, {x:390, y:430}, {x:190, y:430} ], color: '#3182CE' },

      { id: 'r_mvp_stairs', name: "Staircase Core", points: [ {x:100, y:430}, {x:320, y:430}, {x:320, y:640}, {x:100, y:640} ], color: '#E53E3E' },
      { id: 'r_mvp_lobby', name: "Reception Lobby", points: [ {x:300, y:230}, {x:900, y:230}, {x:900, y:430}, {x:390, y:430} ], color: '#48BB78' },
      
      { id: 'r_mvp_bot1', name: "Operations Hub", points: [ {x:390, y:430}, {x:600, y:430}, {x:600, y:640}, {x:390, y:640} ], color: '#3182CE' },
      { id: 'r_mvp_bot2', name: "Tech Support Center", points: [ {x:600, y:430}, {x:800, y:430}, {x:800, y:640}, {x:600, y:640} ], color: '#3182CE' },
      { id: 'r_mvp_bot3', name: "Server Infrastructure", points: [ {x:800, y:430}, {x:1040, y:430}, {x:1040, y:640}, {x:800, y:640} ], color: '#9B2C2C' },

      { id: 'r_mvp_right1', name: "Human Resources", points: [ {x:900, y:230}, {x:1040, y:230}, {x:1040, y:330}, {x:900, y:330} ], color: '#3182CE' },
      { id: 'r_mvp_right2', name: "Accounting Cabin", points: [ {x:900, y:330}, {x:1040, y:330}, {x:1040, y:430}, {x:900, y:430} ], color: '#3182CE' }
    );

    // F. Scaled Reference Dimension Check (Length = 23.5m)
    editor.measures.push({
      id: 'm_mvp1',
      x1: 100,
      y1: 100,
      x2: 1040,
      y2: 100
    });
    
    editor.saveHistory();
    editor.render();
    
    setTimeout(() => {
      editor.zoom = 0.85;
      editor.panX = 40;
      editor.panY = 15;
      editor.updateWorkspaceTransform();
    }, 150);
    
    showNotification("Blueprint Loaded", "Exact 1:1 blueprint template successfully mapped and loaded!");
  }

  window.generateTemplateSketchInApp = loadSampleSketchTemplate;

  // Execute real-time image thresholding/binarization
  function runCVProcessing() {
    if (!originalImage) return;
    
    const brightness = parseInt(brightnessSlider.value);
    const contrast = parseInt(contrastSlider.value);
    const threshold = parseInt(thresholdSlider.value);
    const invert = invertToggle.checked;
    
    CVProcessor.processImage(
      hiddenSrcCanvas,
      hiddenDestCanvas,
      brightness,
      contrast,
      threshold,
      invert
    );
    
    const previewCanvas = document.getElementById('sketch-binarized-preview');
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      previewCanvas.width = 160;
      previewCanvas.height = 120;
      pCtx.drawImage(hiddenDestCanvas, 0, 0, 160, 120);
    }
    
    const mobDrawer = document.getElementById('mobile-drawer');
    const mobPreview = mobDrawer ? mobDrawer.querySelector('#sketch-binarized-preview') : null;
    if (mobPreview) {
      const pCtx = mobPreview.getContext('2d');
      mobPreview.width = 160;
      mobPreview.height = 120;
      pCtx.drawImage(hiddenDestCanvas, 0, 0, 160, 120);
    }

    const useThresholdBg = document.getElementById('toggle-processed-bg').checked;
    if (useThresholdBg) {
      editor.setSketch(hiddenDestCanvas.toDataURL());
    } else {
      editor.setSketch(originalImage.src);
    }
  }
  
  [brightnessSlider, contrastSlider, thresholdSlider, invertToggle].forEach(ctrl => {
    ctrl.addEventListener('input', runCVProcessing);
  });
  document.getElementById('toggle-processed-bg').addEventListener('change', runCVProcessing);
  
  opacitySlider.addEventListener('input', (e) => {
    editor.setSketchOpacity(e.target.value);
  });
  
  // --- AUTOMATED SKETCH TO VECTOR WALL CONVERSION ---
  autoTraceBtn.addEventListener('click', () => {
    if (!originalImage) {
      alert("Please upload or choose a sample sketch first!");
      return;
    }
    
    showNotification("Detecting Walls", "Running grid line analysis algorithm...");
    
    setTimeout(() => {
      const minLen = parseInt(document.getElementById('trace-min-length').value) || 40;
      const gap = parseInt(document.getElementById('trace-line-thickness').value) || 15;
      const snap = parseInt(document.getElementById('trace-snap-tolerance').value) || 25;
      
      const result = CVProcessor.detectWallsAndOpenings(hiddenDestCanvas, {
        minLineLength: minLen,
        lineThicknessGap: gap,
        snapTolerance: snap
      });
      
      const detectedLines = result.walls;
      const detectedOpenings = result.openings;
      
      if (detectedLines.length === 0) {
        showNotification("No Walls Detected", "Try inverting the image or adjusting the contrast sliders.", "error");
        return;
      }
      
      const canvasW = hiddenDestCanvas.width;
      const canvasH = hiddenDestCanvas.height;
      const scale = Math.min(800 / canvasW, 600 / canvasH);
      
      const addedCount = detectedLines.length;
      
      // Clear existing walls and openings for a clean vector trace
      editor.walls = [];
      editor.openings = [];
      
      detectedLines.forEach(line => {
        const wallId = 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        editor.walls.push({
          id: wallId,
          x1: line.x1 * scale + 50,
          y1: line.y1 * scale + 50,
          x2: line.x2 * scale + 50,
          y2: line.y2 * scale + 50,
          thickness: 11,
          material: 'drywall'
        });
      });
      
      // Map detected doors, windows, and openings back to their nearest walls!
      detectedOpenings.forEach(op => {
        const opX = op.x * scale + 50;
        const opY = op.y * scale + 50;
        const opW = op.width * scale;
        
        // Find nearest wall
        let nearestWallId = null;
        let minDist = Infinity;
        editor.walls.forEach(w => {
          const dx = w.x2 - w.x1;
          const dy = w.y2 - w.y1;
          const lenSq = dx * dx + dy * dy;
          let t = 0;
          if (lenSq > 0) {
            t = ((opX - w.x1) * dx + (opY - w.y1) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
          }
          const projX = w.x1 + t * dx;
          const projY = w.y1 + t * dy;
          const dist = Math.hypot(opX - projX, opY - projY);
          if (dist < minDist) {
            minDist = dist;
            nearestWallId = w.id;
          }
        });
        
        if (nearestWallId) {
          const matchedWall = editor.walls.find(w => w.id === nearestWallId);
          // Angle matches the wall's angle
          const angle = Math.round(Math.atan2(matchedWall.y2 - matchedWall.y1, matchedWall.x2 - matchedWall.x1) * 180 / Math.PI);
          
          editor.openings.push({
            id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: op.type,
            style: op.style,
            wallId: nearestWallId,
            x: opX,
            y: opY,
            width: opW,
            angle: angle
          });
        }
      });
      
      editor.saveHistory();
      editor.render();
      
      const numDoors = detectedOpenings.filter(o => o.type === 'door').length;
      const numWindows = detectedOpenings.filter(o => o.type === 'window').length;
      showNotification("Success!", `Detected ${addedCount} walls, ${numDoors} doors, and ${numWindows} windows automatically!`);
    }, 100);
  });
  
  // --- REAL-TIME PROJECT COST ESTIMATIONS & BILL OF MATERIALS ---
  function getBudgetBOMData() {
    let drywallLen = 0;
    let concreteLen = 0;
    let glassLen = 0;
    
    editor.walls.forEach(w => {
      const lenPx = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      const lenM = editor.pxToMeters(lenPx);
      const mat = w.material || 'drywall';
      if (mat === 'glass') glassLen += lenM;
      else if (mat === 'concrete') concreteLen += lenM;
      else drywallLen += lenM;
    });
    
    const counts = {};
    editor.furniture.forEach(f => {
      counts[f.libraryId] = (counts[f.libraryId] || 0) + 1;
    });
    
    editor.openings.forEach(op => {
      const key = `opening_${op.type}`; 
      counts[key] = (counts[key] || 0) + 1;
    });
    
    const wallsBreakdown = [
      { key: 'wall_drywall', name: 'Drywall Partition', len: drywallLen, unitCost: ItemUnitCosts.wall_drywall, total: drywallLen * ItemUnitCosts.wall_drywall },
      { key: 'wall_concrete', name: 'Structural Concrete', len: concreteLen, unitCost: ItemUnitCosts.wall_concrete, total: concreteLen * ItemUnitCosts.wall_concrete },
      { key: 'wall_glass', name: 'Glass Divider Panel', len: glassLen, unitCost: ItemUnitCosts.wall_glass, total: glassLen * ItemUnitCosts.wall_glass }
    ];
    
    const elementsBreakdown = [];
    Object.keys(counts).forEach(id => {
      const q = counts[id];
      const name = id.startsWith('opening_') ? (id === 'opening_door' ? 'Action Swing Door' : 'Glazed Window Block') : (window.OfficeSymbols.furniture[id]?.name || id);
      const unit = ItemUnitCosts[id] || 150;
      elementsBreakdown.push({
        key: id,
        name: name,
        qty: q,
        unitCost: unit,
        total: q * unit
      });
    });
    
    const sumWalls = wallsBreakdown.reduce((sum, w) => sum + w.total, 0);
    const sumElements = elementsBreakdown.reduce((sum, el) => sum + el.total, 0);
    const grandTotal = sumWalls + sumElements;
    
    return {
      walls: wallsBreakdown,
      elements: elementsBreakdown,
      total: grandTotal
    };
  }

  function refreshBudgetCalculations() {
    const data = getBudgetBOMData();
    
    const totalEl = document.getElementById('budget-grand-total');
    if (totalEl) totalEl.innerText = `$${data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const wallsContainer = document.getElementById('budget-list-walls');
    if (wallsContainer) {
      wallsContainer.innerHTML = data.walls.map(w => {
        if (w.len === 0) return '';
        return `
          <div class="flex justify-between items-center py-1 text-slate-300 font-semibold border-b border-slate-900/60 pb-1.5 last:border-0">
            <div>
              <div class="text-[11px] text-slate-200">${w.name}</div>
              <div class="text-[9px] text-slate-500 font-mono">${w.len.toFixed(1)}m @ $${w.unitCost}/m</div>
            </div>
            <span class="font-mono text-emerald-400 text-[11px]">$${w.total.toFixed(2)}</span>
          </div>
        `;
      }).join('') || '<div class="text-[10px] text-slate-500 text-center py-2">No walls drawn yet.</div>';
    }
    
    const furnContainer = document.getElementById('budget-list-furniture');
    if (furnContainer) {
      furnContainer.innerHTML = data.elements.map(el => `
        <div class="flex justify-between items-center py-1 text-slate-300 font-semibold border-b border-slate-900/60 pb-1.5 last:border-0">
          <div>
            <div class="text-[11px] text-slate-200">${el.name}</div>
            <div class="text-[9px] text-slate-500 font-mono">${el.qty} units @ $${el.unitCost}/ea</div>
          </div>
          <span class="font-mono text-emerald-400 text-[11px]">$${el.total.toFixed(2)}</span>
        </div>
      `).join('') || '<div class="text-[10px] text-slate-500 text-center py-2">No items placed yet.</div>';
    }

    const mobDrawer = document.getElementById('mobile-drawer');
    const mGrand = mobDrawer ? mobDrawer.querySelector('#budget-grand-total') : null;
    const mWalls = mobDrawer ? mobDrawer.querySelector('#budget-list-walls') : null;
    const mFurn = mobDrawer ? mobDrawer.querySelector('#budget-list-furniture') : null;
    
    if (mGrand) mGrand.innerText = `$${data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (mWalls && wallsContainer) mWalls.innerHTML = wallsContainer.innerHTML;
    if (mFurn && furnContainer) mFurn.innerHTML = furnContainer.innerHTML;
  }

  window.refreshBudgetCalculations = refreshBudgetCalculations;

  function exportBOMCSVData() {
    const data = getBudgetBOMData();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Item Name,Category,Quantity / Length,Unit Cost ($),Total Cost ($)\r\n";
    
    data.walls.forEach(w => {
      if (w.len > 0) {
        csvContent += `"${w.name}",Construction Wall,"${w.len.toFixed(1)} meters",${w.unitCost},${w.total.toFixed(2)}\r\n`;
      }
    });
    
    data.elements.forEach(el => {
      const cat = el.key.startsWith('opening_') ? 'Openings' : 'Office Furniture';
      csvContent += `"${el.name}",${cat},"${el.qty} units",${el.unitCost},${el.total.toFixed(2)}\r\n`;
    });
    
    csvContent += `\r\n"Estimated Total Project Cost",,,,$${data.total.toFixed(2)}\r\n`;
    
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `office-layout-cost-estimator-${Date.now()}.csv`;
    a.click();
    showNotification("Spreadsheet Downloaded", "Bill of Materials (BOM) CSV exported successfully.");
  }

  window.exportBOMCSVData = exportBOMCSVData;

  // --- DEMO OFFICE CONSTRUCTOR (HIGHLY TAILORED MODERN COMMERCIAL LAYOUT) ---
  function loadDemoOffice() {
    editor.walls = [];
    editor.furniture = [];
    editor.openings = [];
    editor.rooms = [];
    editor.measures = [];
    
    editor.pixelsPerMeter = 40.0; // reset scale factor (40px = 1m)
    
    // Outer perimeter concrete core (16m x 11m)
    const p = [
      { x: 100, y: 100 },
      { x: 740, y: 100 },
      { x: 740, y: 540 },
      { x: 100, y: 540 }
    ];
    
    const wConfig = [
      { x1: p[0].x, y1: p[0].y, x2: p[1].x, y2: p[1].y },
      { x1: p[1].x, y1: p[1].y, x2: p[2].x, y2: p[2].y },
      { x1: p[2].x, y1: p[2].y, x2: p[3].x, y2: p[3].y },
      { x1: p[3].x, y1: p[3].y, x2: p[0].x, y2: p[0].y }
    ];
    
    wConfig.forEach((wc, i) => {
      editor.walls.push({
        id: 'wall_p_' + i,
        x1: wc.x1,
        y1: wc.y1,
        x2: wc.x2,
        y2: wc.y2,
        thickness: 14,
        material: 'concrete' // Heavy concrete core walls
      });
    });
    
    // Modern Inner Partition Dividers
    const innerWalls = [
      // Meeting room glass partitions (Sleek Glass look)
      { id: 'wall_i_1', x1: 460, y1: 100, x2: 460, y2: 320, thickness: 8, material: 'glass' }, 
      { id: 'wall_i_2', x1: 460, y1: 320, x2: 740, y2: 320, thickness: 8, material: 'glass' },
      
      // Executive suite drywall partitions (Solid drywalls)
      { id: 'wall_i_3', x1: 100, y1: 340, x2: 280, y2: 340, thickness: 10, material: 'drywall' },
      { id: 'wall_i_4', x1: 280, y1: 340, x2: 280, y2: 540, thickness: 10, material: 'drywall' },
      
      // Cafeteria pantry wall divider
      { id: 'wall_i_5', x1: 260, y1: 100, x2: 260, y2: 220, thickness: 10, material: 'drywall' },
      { id: 'wall_i_6', x1: 100, y1: 220, x2: 260, y2: 220, thickness: 10, material: 'drywall' }
    ];
    editor.walls.push(...innerWalls);
    
    // Place Door Swing and Glass Window Openings
    editor.openings.push(
      // Lobby Double Entrance
      { id: 'op_d_1', type: 'door', style: 'door_double', wallId: 'wall_p_2', x: 420, y: 540, width: editor.metersToPx(1.6), angle: 180 },
      // Boardroom glass single swing door
      { id: 'op_d_2', type: 'door', style: 'door_single', wallId: 'wall_i_2', x: 500, y: 320, width: editor.metersToPx(0.9), angle: 180 },
      // Executive boss office sliding pocket door
      { id: 'op_d_3', type: 'door', style: 'door_sliding', wallId: 'wall_i_3', x: 170, y: 340, width: editor.metersToPx(1.1), angle: 0 },
      // Pantry single swing door
      { id: 'op_d_4', type: 'door', style: 'door_single', wallId: 'wall_i_6', x: 180, y: 220, width: editor.metersToPx(0.9), angle: 0 },
      
      // Large ribbon windows along perimeter concrete
      { id: 'op_w_1', type: 'window', style: 'window_std', wallId: 'wall_p_0', x: 180, y: 100, width: editor.metersToPx(1.6), angle: 0 },
      { id: 'op_w_2', type: 'window', style: 'window_std', wallId: 'wall_p_0', x: 560, y: 100, width: editor.metersToPx(1.6), angle: 0 },
      { id: 'op_w_3', type: 'window', style: 'window_std', wallId: 'wall_p_1', x: 740, y: 210, width: editor.metersToPx(1.6), angle: 90 },
      { id: 'op_w_4', type: 'window', style: 'window_std', wallId: 'wall_p_1', x: 740, y: 400, width: editor.metersToPx(1.6), angle: 90 }
    );
    
    // Placed Office Layout Assets
    editor.furniture.push(
      // Executive Conference Room (Top Right)
      { id: 'f_d_1', libraryId: 'conference_table_large', name: "Boardroom Table (12p)", x: 500, y: 165, width: editor.metersToPx(3.6), height: editor.metersToPx(1.4), rotation: 0, color: '#3182CE' },
      
      // Boss CEO Office Suite (Bottom Left)
      { id: 'f_d_2', libraryId: 'executive_desk', name: "CEO Executive Desk", x: 120, y: 380, width: editor.metersToPx(1.8), height: editor.metersToPx(1.6), rotation: 90, color: '#4A5568' },
      { id: 'f_d_2_p', libraryId: 'potted_plant_large', name: "Ficus Plant", x: 235, y: 495, width: editor.metersToPx(0.6), height: editor.metersToPx(0.6), rotation: 0, color: '#276749' },
      { id: 'f_d_2_l', libraryId: 'lounge_chair', name: "Guest Chair", x: 210, y: 405, width: editor.metersToPx(0.85), height: editor.metersToPx(0.8), rotation: 270, color: '#4A5568' },
      
      // Open Coworking Station (Center Right Bay)
      { id: 'f_d_3', libraryId: 'desk_cluster_4', name: "Engineering Pod A", x: 310, y: 340, width: editor.metersToPx(2.8), height: editor.metersToPx(1.6), rotation: 90, color: '#4A5568' },
      { id: 'f_d_3_p', libraryId: 'potted_plant_large', name: "Ficus Plant", x: 300, y: 260, width: editor.metersToPx(0.6), height: editor.metersToPx(0.6), rotation: 0, color: '#276749' },
      { id: 'f_d_3_c', libraryId: 'printer_station', name: "Shared Copier Station", x: 410, y: 485, width: editor.metersToPx(0.9), height: editor.metersToPx(0.8), rotation: 180, color: '#4A5568' },
      
      // Welcome Reception Lobby (Entrance Bottom center)
      { id: 'f_d_4', libraryId: 'reception_desk', name: "Welcome Desk", x: 345, y: 440, width: editor.metersToPx(2.2), height: editor.metersToPx(1.2), rotation: 0, color: '#2D3748' },
      { id: 'f_d_5', libraryId: 'lounge_sofa_3', name: "Lobby Couch", x: 580, y: 470, width: editor.metersToPx(2.2), height: editor.metersToPx(0.9), rotation: 180, color: '#4A5568' },
      { id: 'f_d_5_c', libraryId: 'coffee_table', name: "Coffee Table", x: 630, y: 415, width: editor.metersToPx(1.2), height: editor.metersToPx(0.6), rotation: 180, color: '#CBD5E0' },
      
      // Pantry Hub / Breakroom (Top Left)
      { id: 'f_d_6', libraryId: 'pantry_table_cluster', name: "Lunch Bar Bench", x: 120, y: 135, width: editor.metersToPx(2.0), height: editor.metersToPx(0.8), rotation: 0, color: '#744210' }
    );
    
    // Room space labels
    editor.rooms.push(
      { id: 'r_d_1', name: "CEO Executive Suite", points: [ {x:100, y:340}, {x:280, y:340}, {x:280, y:540}, {x:100, y:540} ], color: '#48BB78' },
      { id: 'r_d_2', name: "Boardroom Suite A", points: [ {x:460, y:100}, {x:740, y:100}, {x:740, y:320}, {x:460, y:320} ], color: '#3182CE' },
      { id: 'r_d_3', name: "Pantry Breakroom", points: [ {x:100, y:100}, {x:260, y:100}, {x:260, y:220}, {x:100, y:220} ], color: '#ED8936' },
      { id: 'r_d_4', name: "Collaboration Open Bay", points: [ {x:260, y:100}, {x:460, y:100}, {x:460, y:320}, {x:740, y:320}, {x:740, y:540}, {x:280, y:540}, {x:280, y:340}, {x:260, y:340} ], color: '#805AD5' }
    );
    
    // Quick outer scale check dimension (16m long check)
    editor.measures.push({
      id: 'm_d_1',
      x1: p[0].x,
      y1: p[0].y,
      x2: p[1].x,
      y2: p[1].y
    });
    
    editor.saveHistory();
    editor.render();
    
    setTimeout(() => {
      editor.zoom = 1.0;
      editor.panX = 40;
      editor.panY = 10;
      editor.updateWorkspaceTransform();
    }, 150);
    
    showNotification("Demo Loaded", "Enjoy exploring the pre-designed modern office layout!");
  }
  
  // --- STATS COMPILER ---
  function updateProjectStats() {
    const wallCount = editor.walls.length;
    const itemCount = editor.furniture.length;
    const openCount = editor.openings.length;
    
    let totalWorkstations = 0;
    editor.furniture.forEach(f => {
      if (f.libraryId === 'single_desk') totalWorkstations += 1;
      else if (f.libraryId === 'executive_desk') totalWorkstations += 1;
      else if (f.libraryId === 'desk_cluster_4') totalWorkstations += 4;
    });
    
    document.getElementById('stat-walls').innerText = wallCount;
    document.getElementById('stat-openings').innerText = openCount;
    document.getElementById('stat-furniture').innerText = itemCount;
    document.getElementById('stat-workstations').innerText = totalWorkstations;
  }
  
  // --- SAVING / EXPORTING ---
  btnSaveProject.addEventListener('click', () => {
    const data = {
      walls: editor.walls,
      furniture: editor.furniture,
      openings: editor.openings,
      rooms: editor.rooms,
      measures: editor.measures,
      pixelsPerMeter: editor.pixelsPerMeter,
      unitSystem: editor.unitSystem,
      currentTheme: editor.currentTheme
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office-layout-${Date.now()}.json`;
    a.click();
    showNotification("Saved", "Project configuration file downloaded.");
  });
  
  btnLoadProject.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            editor.loadFromState(data);
            editor.saveHistory();
            editor.render();
            showNotification("Loaded", "Project successfully imported!");
          } catch (err) {
            alert("Failed to parse project JSON file. Ensure file is valid.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });
  
  btnExportDXF.addEventListener('click', () => {
    showNotification("Generating DXF", "Calibrating scale and converting coordinates to Cartesian meters...");
    setTimeout(() => {
      try {
        DXFExporter.exportToDXF(editor);
        showNotification("Success!", "CAD DXF Drawing saved! Layer-organized and perfectly scaled.");
      } catch (err) {
        console.error("DXF Export failed:", err);
        showNotification("Export Failed", "Error rendering CAD file entities.", "error");
      }
    }, 120);
  });

  if (btnExportSCR) {
    btnExportSCR.addEventListener('click', () => {
      if (!originalImage) {
        showNotification("No Underlay Sketch", "Please upload a sketch or load a template first!", "error");
        return;
      }
      showNotification("Generating Script", "Computing AutoCAD underlay insertion coordinate offsets...");
      setTimeout(() => {
        try {
          DXFExporter.exportToSCR(editor);
          showNotification("Success!", "AutoCAD Script (.scr) downloaded successfully!");
        } catch (err) {
          console.error("AutoCAD SCR export failed:", err);
          showNotification("Export Failed", "Error generating underlay aligner script.", "error");
        }
      }, 120);
    });
  }
  
  btnExportSVG.addEventListener('click', () => {
    const clone = svgCanvas.cloneNode(true);
    const interactionLayer = clone.querySelector('#interaction-layer');
    if (interactionLayer) interactionLayer.remove();
    
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1600');
    clone.setAttribute('height', '1200');
    clone.setAttribute('viewBox', '0 0 1600 1200');
    clone.style.backgroundColor = '#FFFFFF';
    
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commercial-office-layout.svg';
    a.click();
    showNotification("Exported SVG", "Scalable Vector Graphics (SVG) blueprint saved.");
  });
  
  if (btnExportPNG) {
    btnExportPNG.addEventListener('click', () => {
      showNotification("Generating PNG", "Rasterizing layout, please wait...");
      
      const clone = svgCanvas.cloneNode(true);
      const interactionLayer = clone.querySelector('#interaction-layer');
      if (interactionLayer) interactionLayer.remove();
      
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const svgString = new XMLSerializer().serializeToString(clone);
      
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'commercial-office-floorplan.png';
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Exported PNG", "PNG Layout Image saved successfully!");
      };
      img.src = url;
    });
  }
  
  // Custom Page Print trigger that outputs the Paper Space layout sheet landscape A4 to printer/PDF
  btnExportPDF.addEventListener('click', () => {
    showNotification("Preparing Print", "Configuring layout sheet and drawing theme for print output...");
    
    const prevTheme = editor.currentTheme;
    const prevSelectedId = editor.selectedObjectId;
    const prevSelectedType = editor.selectedObjectType;
    
    const printFrame = document.getElementById('cad-print-frame');
    const prevSheetHidden = printFrame ? printFrame.classList.contains('hidden') : true;
    const svgEl = document.getElementById('floorplan-svg');
    const prevViewBox = svgEl ? svgEl.getAttribute('viewBox') : null;
    
    // Switch to warm (light) theme for print legibility and ink-saving
    editor.setTheme('warm');
    editor.deselectObject();
    
    // Temporarily show layout print frame
    if (printFrame) printFrame.classList.remove('hidden');
    
    // Temporarily set print aspect viewBox (1150 x 792) to match standard landscape printing aspect
    if (svgEl) svgEl.setAttribute('viewBox', '0 0 1150 792');
    
    // Wait for the SVG theme paints and recenter to take effect
    setTimeout(() => {
      window.print();
      
      // Restore previous user interface state
      editor.setTheme(prevTheme);
      if (prevSelectedId && prevSelectedType) {
        editor.selectObject(prevSelectedId, prevSelectedType);
      }
      if (printFrame && prevSheetHidden) {
        printFrame.classList.add('hidden');
      }
      if (svgEl) {
        if (prevViewBox) {
          svgEl.setAttribute('viewBox', prevViewBox);
        } else {
          svgEl.removeAttribute('viewBox');
        }
      }
      showNotification("Print Finished", "Workspace layout and editing restored.");
    }, 250);
  });
  
  // --- NOTIFICATION ENGINE ---
  function showNotification(title, message, type = 'success') {
    const banner = document.getElementById('notification-banner');
    const bTitle = document.getElementById('notif-title');
    const bMsg = document.getElementById('notif-msg');
    
    bTitle.innerText = title;
    bMsg.innerText = message;
    
    if (type === 'error') {
      banner.className = "fixed bottom-5 right-5 z-50 flex items-start gap-3 bg-red-900 border-l-4 border-red-500 text-white rounded-lg p-4 shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 max-w-sm";
    } else {
      banner.className = "fixed bottom-5 right-5 z-50 flex items-start gap-3 bg-slate-900 border-l-4 border-blue-500 text-white rounded-lg p-4 shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 max-w-sm";
    }
    
    setTimeout(() => {
      banner.classList.add('translate-y-10', 'opacity-0');
    }, 4000);
  }
  // --- ITERATION 3 WORKSPACE CONTROLLERS ---
  window.startBlankCanvas = () => {
    editor.walls = [];
    editor.furniture = [];
    editor.openings = [];
    editor.rooms = [];
    editor.measures = [];
    editor.deselectObject();
    originalImage = null;
    
    // Clear background sketch layers
    const sketchLayer = document.getElementById('sketch-layer');
    if (sketchLayer) sketchLayer.innerHTML = '';
    
    // Hide startup welcome and central dashboard overlays
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('upload-overlay').classList.add('hidden');
    
    // Hide sketch visibility dynamic toolbar
    const sketchBar = document.getElementById('sketch-controls-bar');
    if (sketchBar) sketchBar.classList.add('hidden');
    
    editor.saveHistory();
    editor.render();
    showNotification("New Workspace", "Blank canvas loaded. Use draw tools on the left to start!");
  };

  window.toggleSketchVisibility = (btn) => {
    const sketchLayer = document.getElementById('sketch-layer');
    if (!sketchLayer) return;
    
    const currentOpacity = parseFloat(sketchLayer.getAttribute('opacity') || '0.45');
    const visStatus = document.getElementById('sketch-vis-status');
    
    if (currentOpacity > 0) {
      sketchLayer.setAttribute('opacity', '0');
      if (visStatus) visStatus.innerText = "HIDDEN";
      btn.classList.add('text-slate-500');
      btn.classList.remove('text-blue-400');
      showNotification("Hidden Sketch", "Background sketch image hidden.");
    } else {
      const targetOpacity = parseFloat(document.getElementById('slider-opacity').value) || 0.45;
      sketchLayer.setAttribute('opacity', targetOpacity);
      if (visStatus) visStatus.innerText = "SHOW";
      btn.classList.add('text-blue-400');
      btn.classList.remove('text-slate-500');
      showNotification("Showing Sketch", "Background sketch image visible.");
    }
  };

  window.clearSketchBackground = () => {
    if (confirm("Remove background sketch image completely?")) {
      const sketchLayer = document.getElementById('sketch-layer');
      if (sketchLayer) sketchLayer.innerHTML = '';
      originalImage = null;
      document.getElementById('sketch-controls-bar').classList.add('hidden');
      showNotification("Removed Sketch", "Background sketch cleared.");
    }
  };

  document.getElementById('notif-close').addEventListener('click', () => {
    document.getElementById('notification-banner').classList.add('translate-y-10', 'opacity-0');
  });

  lucide.createIcons();
});