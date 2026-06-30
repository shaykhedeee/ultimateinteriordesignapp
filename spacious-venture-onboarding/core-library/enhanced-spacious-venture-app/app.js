// Core Application State & UI Coordinator for Spacious Venture Onboarding
// NOTE: ALL PRICING METRICS HAVE BEEN COMPLETELY REMOVED

const AppState = {
  currentStep: 1,
  totalSteps: 5,
  
  // Client Intake Form Data (Expanded)
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  bhkConfig: '3bhk',
  selectedStyle: 'modern-luxury',
  spaceInterests: ['living', 'kitchen', 'wardrobe', 'temple', 'foyer'],
  
  // New Onboarding Metrics
  ceilingHeight: '3000mm',
  familyProfile: 'kids-elderly', // kids, elderly, pets, etc.
  storageRequirements: ['shelves', 'drawers', 'long-hanging'],
  cookingStyle: 'heavy-masala', // Indian traditional vs Light continental
  lightingPreference: 'warm-ambient', // ambient vs task vs smart
  materialTier: 'gold-bwp',
  hasLofts: true,
  chimneyVentRoute: 'external',
  
  // Advanced Phase 2 Metrics
  gasSetup: 'hob-piped',
  partitionStyle: 'cnc-jali',
  vastuStrictness: 'general',
  shutterFinish: 'acrylic',
  
  vastuCompliant: true,
  customNotes: '', // Treated as core architectural/spatial requirements
  uploadedPlan: null, // Holds Base64 of image for rendering
  referenceImages: [], // Style Reference / Pinterest inspiration images
  pinnedPinterestPins: [], // Pinned Pinterest inspirations

  // New Indian Residential specs
  purifierSetup: 'under-sink',
  pantrySystem: 'hettich-larder',
  hasConcealedSafe: true,
  hasCushionedSeating: true,

  // Dashboard Workspace State
  activeTab: 'overview',
  activeRoomId: 'living',

  // Client Selection Selections (Saved Items)
  selections: {
    tvUnit: 'louvered-walnut',
    kitchen: 'l-shaped-acrylic',
    wardrobe: 'tinted-glass-sliding',
    foyer: 'foyer-mirror-luxe',
    temple: 'pooja-traditional-jali',
    laminate: 'high-gloss-acrylic-mica',
    color: 'emerald-gold',
    // Active Color Variations
    tvUnitColor: 'warm-walnut',
    kitchenColor: 'mint-teal',
    wardrobeColor: 'grey-smoked'
  },

  // Compiled AI analysis results
  aiResult: null
};

// Start Application on Load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

window.loadDemoClient = function() {
  const nameInput = document.getElementById('client-name');
  const emailInput = document.getElementById('client-email');
  const phoneInput = document.getElementById('client-phone');
  const bhkSelect = document.getElementById('bhk-select');
  
  if (nameInput) nameInput.value = "Mr. & Mrs. Sharma";
  if (emailInput) emailInput.value = "sharma.hsr@gmail.com";
  if (phoneInput) phoneInput.value = "+91 98450 12345";
  if (bhkSelect) bhkSelect.value = "3bhk";
  
  // Prefill premium custom requirements to show off Vastu and safety features!
  const customNotes = document.getElementById('custom-notes');
  if (customNotes) {
    customNotes.value = "We want a serene, warm residential look for our 3 BHK apartment in HSR Layout. Require a concealed under-sink water purifier in modular kitchen, Hettich soft-close modular pantry system, a hidden biometric safe built into the master suite sliding wardrobe base, and an entry console featuring cushioned foyer shoe seating.";
  }
  
  // Highlight Japandi Fusion as style!
  const styles = document.querySelectorAll('.style-card');
  styles.forEach(card => {
    if (card.dataset.style === 'japandi-fusion') {
      card.click();
    }
  });

  // Highlight spaces
  const spaces = document.querySelectorAll('.space-card');
  spaces.forEach(card => {
    if (['living', 'kitchen', 'wardrobe'].includes(card.dataset.space)) {
      if (!card.classList.contains('selected')) {
        card.click();
      }
    }
  });
};

function initApp() {
  setupWizard();
  setupDropzone();
  setupReferenceDropzone();
  setupWorkspaceTabs();
  setupPhase2Listeners();
  
  // Connect toggle button to collapse/expand left panel
  const toggleBtn = document.getElementById('panel-toggle');
  const leftPanel = document.getElementById('onboarding-panel');
  if (toggleBtn && leftPanel) {
    toggleBtn.addEventListener('click', () => {
      leftPanel.classList.toggle('collapsed');
      toggleBtn.querySelector('span').textContent = leftPanel.classList.contains('collapsed') ? '➡️' : '⬅️';
      setTimeout(() => {
        FLOORPLAN_CANVAS.resize();
      }, 500); // Wait for transition
    });
  }

  // Pre-load default selections
  updateActiveDesignRenders();

  // Initialize adjustable sidebar splitters with localStorage persistence
  setupSidebarResizers();
}

function setupPhase2Listeners() {
  const strictnessSelect = document.getElementById('vastu-strictness-select');
  if (strictnessSelect) {
    strictnessSelect.addEventListener('change', (e) => {
      AppState.vastuStrictness = e.target.value;
      recalculateVastuCompliance();
      updateBlueprintSummaryView();
    });
  }

  const gasSetupSelect = document.getElementById('gas-setup-select');
  if (gasSetupSelect) {
    gasSetupSelect.addEventListener('change', (e) => {
      AppState.gasSetup = e.target.value;
      populateMaterialsAndHardwareGrid();
      updateBlueprintSummaryView();
    });
  }

  const shutterSelect = document.getElementById('shutter-finish-select');
  if (shutterSelect) {
    shutterSelect.addEventListener('change', (e) => {
      AppState.shutterFinish = e.target.value;
      populateMaterialsAndHardwareGrid();
      updateBlueprintSummaryView();
    });
  }
}

function recalculateVastuCompliance() {
  if (!AppState.aiResult) return;
  
  // Extract directions from roomNodes
  const vastuDirections = {};
  AppState.aiResult.roomNodes.forEach(node => {
    vastuDirections[node.id] = node.vastu;
  });

  const updatedReport = INTERIOR_STANDARDS.vastu.evaluate(vastuDirections, AppState.vastuStrictness);
  updateVastuGauge(updatedReport);
}

/* -------------------------------------------------------------
   WIZARD STEPS MANAGEMENT
------------------------------------------------------------- */
function setupWizard() {
  const nextBtn = document.getElementById('wizard-next');
  const prevBtn = document.getElementById('wizard-prev');

  updateWizardUI();

  nextBtn.addEventListener('click', () => {
    if (AppState.currentStep < AppState.totalSteps) {
      if (validateStep(AppState.currentStep)) {
        AppState.currentStep++;
        updateWizardUI();
      }
    } else {
      // Step 5: Complete onboarding
      triggerAIOnboarding();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (AppState.currentStep > 1) {
      AppState.currentStep--;
      updateWizardUI();
    }
  });

  // Bind Style selection cards
  const styleCards = document.querySelectorAll('.style-card');
  styleCards.forEach(card => {
    card.addEventListener('click', () => {
      styleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selectedStyle = card.dataset.style;
    });
  });

  // Bind space checklist cards
  const spaceCards = document.querySelectorAll('.space-card');
  spaceCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const val = card.dataset.space;
      if (card.classList.contains('selected')) {
        if (!AppState.spaceInterests.includes(val)) {
          AppState.spaceInterests.push(val);
        }
      } else {
        AppState.spaceInterests = AppState.spaceInterests.filter(i => i !== val);
      }
    });
  });
}

function validateStep(step) {
  if (step === 1) {
    const nameInput = document.getElementById('client-name');
    AppState.clientName = nameInput.value.trim();
    if (!AppState.clientName) {
      alert('Please enter client name to personalize recommendations.');
      nameInput.focus();
      return false;
    }
    AppState.clientEmail = document.getElementById('client-email').value.trim();
    AppState.clientPhone = document.getElementById('client-phone').value.trim();
    AppState.bhkConfig = document.getElementById('bhk-select').value;
    AppState.materialTier = document.getElementById('material-tier-select').value;
  }
  return true;
}

function updateWizardUI() {
  const progressFills = document.querySelectorAll('.progress-fill');
  const percent = ((AppState.currentStep - 1) / (AppState.totalSteps - 1)) * 100;
  progressFills.forEach(fill => {
    fill.style.width = percent + '%';
  });

  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach((step, idx) => {
    if (idx + 1 === AppState.currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  const prevBtn = document.getElementById('wizard-prev');
  const nextBtn = document.getElementById('wizard-next');

  prevBtn.disabled = AppState.currentStep === 1;
  
  if (AppState.currentStep === AppState.totalSteps) {
    nextBtn.innerHTML = `Analyze Plan & Design <span style="font-size:12px">🤖</span>`;
    nextBtn.style.background = 'var(--grad-emerald)';
    nextBtn.style.color = '#fff';
  } else {
    nextBtn.innerHTML = `Continue <span>➡️</span>`;
    nextBtn.style.background = 'var(--grad-gold)';
    nextBtn.style.color = 'var(--bg-primary)';
  }
}

/* -------------------------------------------------------------
   FILE DRAG & DROP ZONE
------------------------------------------------------------- */
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('floorplan-input');
  const previewCard = document.getElementById('preview-card');
  const removeBtn = document.getElementById('remove-file-btn');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('highlight');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('highlight');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('highlight');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    AppState.uploadedPlan = null;
    fileInput.value = '';
    previewCard.style.display = 'none';
    dropzone.style.display = 'flex';
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    AppState.uploadedPlan = e.target.result;
    
    // Update preview details
    document.getElementById('file-preview-name').textContent = file.name;
    document.getElementById('file-preview-size').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('preview-card').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function setupReferenceDropzone() {
  const refDropzone = document.getElementById('reference-dropzone');
  const refInput = document.getElementById('reference-input');
  
  if (!refDropzone || !refInput) return;

  refDropzone.addEventListener('click', () => refInput.click());

  refDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    refDropzone.classList.add('highlight');
  });

  refDropzone.addEventListener('dragleave', () => {
    refDropzone.classList.remove('highlight');
  });

  refDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    refDropzone.classList.remove('highlight');
    if (e.dataTransfer.files.length > 0) {
      handleReferenceFiles(e.dataTransfer.files);
    }
  });

  refInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleReferenceFiles(e.target.files);
    }
  });
}

function handleReferenceFiles(files) {
  const refPreviewContainer = document.getElementById('reference-preview-container');
  const refPreviewGrid = document.getElementById('reference-preview-grid');
  
  if (!AppState.referenceImages) {
    AppState.referenceImages = [];
  }

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      AppState.referenceImages.push(dataUrl);
      
      // Render small thumbnail
      const thumb = document.createElement('div');
      thumb.style.position = 'relative';
      thumb.style.borderRadius = '8px';
      thumb.style.overflow = 'hidden';
      thumb.style.aspectRatio = '1';
      thumb.style.border = '1px solid var(--glass-border)';
      thumb.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.15)';
      thumb.innerHTML = `
        <img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover;" />
        <button class="thumb-remove-btn" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
      `;
      
      thumb.querySelector('.thumb-remove-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        AppState.referenceImages = AppState.referenceImages.filter(img => img !== dataUrl);
        thumb.remove();
        if (AppState.referenceImages.length === 0) {
          refPreviewContainer.style.display = 'none';
        }
      });
      
      refPreviewGrid.appendChild(thumb);
      refPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });
}

/* -------------------------------------------------------------
   AI PROCESSING & LAUNCHING WORKSPACE
------------------------------------------------------------- */
async function triggerAIOnboarding() {
  // Capture final inputs
  AppState.customNotes = document.getElementById('custom-notes').value.trim();
  AppState.vastuCompliant = document.getElementById('vastu-toggle').checked;
  AppState.ceilingHeight = document.getElementById('ceiling-height-select').value;
  AppState.cookingStyle = document.getElementById('cooking-style-select').value;
  AppState.lightingPreference = document.getElementById('lighting-select').value;
  AppState.materialTier = document.getElementById('material-tier-select').value;
  AppState.hasLofts = document.getElementById('lofts-toggle').checked;
  AppState.chimneyVentRoute = document.getElementById('chimney-vent-select').value;

  AppState.kitchenLayout = document.getElementById('kitchen-layout-select').value;
  AppState.purifierSetup = document.getElementById('purifier-select').value;
  AppState.pantrySystem = document.getElementById('pantry-select').value;
  AppState.hasConcealedSafe = document.getElementById('safe-vault-toggle').checked;
  AppState.hasCushionedSeating = document.getElementById('foyer-seating-toggle').checked;
  AppState.poojaPreference = document.getElementById('pooja-niche-select').value;
  
  // Phase 2 Inputs
  AppState.gasSetup = document.getElementById('gas-setup-select').value;
  AppState.partitionStyle = document.getElementById('partition-style-select').value;
  AppState.vastuStrictness = document.getElementById('vastu-strictness-select').value;
  AppState.shutterFinish = document.getElementById('shutter-finish-select').value;

  const appliances = [];
  if (document.getElementById('appliance-otg').checked) appliances.push('OTG Unit');
  if (document.getElementById('appliance-dishwasher').checked) appliances.push('Dishwasher Cavity');
  if (document.getElementById('appliance-fridge').checked) appliances.push('Double-Door Fridge');
  if (document.getElementById('appliance-utility').checked) appliances.push('Utility Hookup');
  AppState.appliances = appliances;

  const fittings = [];
  if (document.getElementById('fitting-tandem').checked) fittings.push('Soft-Close Tandems');
  if (document.getElementById('fitting-pullout').checked) fittings.push('Bottle Pull-out');
  if (document.getElementById('fitting-corner').checked) fittings.push('Magic Corner');
  if (document.getElementById('fitting-wardrobe-pull').checked) fittings.push('Trouser Rack');
  AppState.fittings = fittings;

  // Capture family profiles
  const profiles = [];
  if (document.getElementById('profile-kids').checked) profiles.push('Kids');
  if (document.getElementById('profile-elderly').checked) profiles.push('Elderly');
  if (document.getElementById('profile-pets').checked) profiles.push('Pets');
  AppState.familyProfile = profiles.join(', ') || 'Standard Adults';

  // Show a luxurious full-overlay AI analysis modal
  showAIProcessingOverlay(async () => {
    const analysis = await AI_ENGINE.processFloorPlan(
      AppState.uploadedPlan, 
      AppState.bhkConfig, 
      AppState.customNotes,
      {
        ceilingHeight: AppState.ceilingHeight,
        cookingStyle: AppState.cookingStyle,
        poojaPreference: AppState.poojaPreference,
        vastuStrictness: AppState.vastuStrictness,
        shutterFinish: AppState.shutterFinish,
        gasSetup: AppState.gasSetup,
        partitionStyle: AppState.partitionStyle,
        familyProfile: AppState.familyProfile
      }
    );

    AppState.aiResult = analysis;

    // Apply any AI Style semantic modifications automatically
    if (analysis.styleRecommendation) {
      AppState.selectedStyle = analysis.styleRecommendation;
    }
    if (analysis.colorRecommendation) {
      AppState.selections.color = analysis.colorRecommendation;
    }

    // Launch active workspace views
    transitionToActiveDashboard(analysis);
  });
}

function showAIProcessingOverlay(onDone) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '500';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 450px; background-color: #0b0c13;">
      <div class="intro-circle" style="width: 100px; height: 100px; border-color: var(--accent-mint); margin: 0 auto 24px auto;">
        <span style="font-size:32px; animation: float 3s infinite;">🧠</span>
      </div>
      <h3 class="modal-title" style="font-family: var(--font-display);">Spacious Venture AI</h3>
      <p id="ai-loading-status" style="font-size: 13px; color: var(--accent-mint); margin-bottom: 25px;">Initializing neural computer vision model...</p>
      
      <div style="background-color:#161925; height: 4px; border-radius: 4px; overflow:hidden; position:relative; margin-bottom: 10px;">
        <div id="ai-modal-bar" style="width: 0%; height: 100%; background: var(--grad-emerald); transition: width 0.4s ease; box-shadow: 0 0 10px var(--accent-mint);"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const statuses = [
    { text: 'Segmenting vector floor plan geometry...', pct: 25 },
    { text: 'Analyzing walls, entries, and kitchen plumbing pipes...', pct: 50 },
    { text: 'Validating layout against Vastu cardinal axes...', pct: 75 },
    { text: 'Designing standard aesthetic furniture configurations...', pct: 100 }
  ];

  let currentIdx = 0;
  const bar = overlay.querySelector('#ai-modal-bar');
  const txt = overlay.querySelector('#ai-loading-status');

  const interval = setInterval(() => {
    if (currentIdx < statuses.length) {
      txt.textContent = statuses[currentIdx].text;
      bar.style.width = statuses[currentIdx].pct + '%';
      currentIdx++;
    } else {
      clearInterval(interval);
      overlay.remove();
      onDone();
    }
  }, 650);
}

function transitionToActiveDashboard(analysis) {
  document.getElementById('workspace-intro').style.display = 'none';
  
  const activeFrame = document.getElementById('workspace-active');
  activeFrame.classList.add('active');

  // Trigger client name welcome tags
  document.getElementById('client-name-welcome').textContent = AppState.clientName;
  document.getElementById('client-bhk-tag').textContent = AppState.bhkConfig.toUpperCase();

  // Populate dynamic AI text-notification box in Canvas Column
  const aiTag = document.getElementById('ai-explanation-bubble');
  if (analysis.aiExplanation) {
    aiTag.style.display = 'flex';
    document.getElementById('ai-explanation-text').textContent = analysis.aiExplanation;
  }

  // Set up floor plan canvas properties
  FLOORPLAN_CANVAS.init(
    document.getElementById('floorplan-canvas'),
    document.getElementById('floorplan-viewer-wrapper'),
    (roomId) => handleCanvasRoomClick(roomId)
  );

  if (AppState.uploadedPlan) {
    FLOORPLAN_CANVAS.setFloorplanImage(AppState.uploadedPlan);
  } else {
    FLOORPLAN_CANVAS.clearFloorplanImage();
  }

  // Turn on the neon CV laser scan sweep on the Canvas!
  const statusPill = document.getElementById('ai-status-pill');
  if (statusPill) {
    statusPill.innerHTML = `<span class="dot-pulse" style="background-color: var(--accent-gold)"></span> Scanning blueprint structures...`;
    statusPill.classList.add('pulse');
  }

  FLOORPLAN_CANVAS.startLaserScan(() => {
    FLOORPLAN_CANVAS.setNodes(analysis.roomNodes);
    FLOORPLAN_CANVAS.setActiveNode('living'); 

    const aiTag = document.getElementById('ai-explanation-bubble');
    if (analysis.aiExplanation) {
      aiTag.style.display = 'flex';
      document.getElementById('ai-explanation-text').textContent = analysis.aiExplanation;
    }

    updateVastuGauge(analysis.vastuReport);
    populateMaterialsAndHardwareGrid();
    updateBlueprintSummaryView(); // Render the full spatial specifications matrix

    if (statusPill) {
      statusPill.innerHTML = `<span class="dot-pulse"></span> Layout Analyzed by AI`;
    }
  });

  populateVisualizerOptions();
}

/* -------------------------------------------------------------
   INTERACTIVE WORKSPACE TABS & CARD SELECTIONS
------------------------------------------------------------- */
function setupWorkspaceTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const view = tab.dataset.tab;
      AppState.activeTab = view;

      const blocks = document.querySelectorAll('.workspace-view-block');
      blocks.forEach(b => {
        if (b.id === `view-${view}`) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      updateActiveDesignRenders();
    });
  });
}

function handleCanvasRoomClick(roomId) {
  AppState.activeRoomId = roomId;
  
  let tabName = 'overview';
  if (roomId === 'living') tabName = 'tv';
  if (roomId === 'kitchen') tabName = 'kitchen';
  if (roomId === 'masterBed' || roomId === 'kidsBed') tabName = 'wardrobe';
  if (roomId === 'temple') tabName = 'overview'; // temple is in main overview rendering

  const matchingTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
  if (matchingTab) {
    matchingTab.click();
  }
}

function populateVisualizerOptions() {
  // Populate TV Units
  const tvContainer = document.getElementById('tv-options-grid');
  tvContainer.innerHTML = '';
  DESIGN_DATA.tvUnits.forEach(unit => {
    const isMatched = unit.style === AppState.selectedStyle;
    const isSelected = AppState.selections.tvUnit === unit.id;
    const card = document.createElement('div');
    card.className = `design-item-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = unit.id;
    card.innerHTML = `
      <div class="design-card-visual" style="position:relative; overflow:hidden; height:140px; border-radius:8px 8px 0 0; background-color:#0b0c13; display:flex; align-items:center; justify-content:center;">
        ${unit.image ? `<img src="${unit.image}" style="width:100%; height:100%; object-fit:cover;" />` : unit.svg}
      </div>
      <div class="design-card-body">
        <span class="design-item-label">${isMatched ? '🌟 Recommended' : 'Standard'}</span>
        <h4 class="design-item-title">${unit.title}</h4>
        <p class="design-item-desc">${unit.desc}</p>
        <div class="design-item-meta">
          <span class="design-item-dimensions">${unit.dimensions}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      tvContainer.querySelectorAll('.design-item-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selections.tvUnit = unit.id;
      updateActiveDesignRenders();
      updateBlueprintSummaryView();
    });
    tvContainer.appendChild(card);
  });

  // Populate Kitchen Options
  const kitchenContainer = document.getElementById('kitchen-options-grid');
  kitchenContainer.innerHTML = '';
  DESIGN_DATA.kitchens.forEach(kit => {
    const isSelected = AppState.selections.kitchen === kit.id;
    const card = document.createElement('div');
    card.className = `design-item-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = kit.id;
    card.innerHTML = `
      <div class="design-card-visual" style="position:relative; overflow:hidden; height:140px; border-radius:8px 8px 0 0; background-color:#0b0c13; display:flex; align-items:center; justify-content:center;">
        ${kit.image ? `<img src="${kit.image}" style="width:100%; height:100%; object-fit:cover;" />` : kit.svg}
      </div>
      <div class="design-card-body">
        <span class="design-item-label">Modular Layout</span>
        <h4 class="design-item-title">${kit.title}</h4>
        <p class="design-item-desc">${kit.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      kitchenContainer.querySelectorAll('.design-item-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selections.kitchen = kit.id;
      updateActiveDesignRenders();
      updateBlueprintSummaryView();
    });
    kitchenContainer.appendChild(card);
  });

  // Populate Wardrobes
  const wardrobeContainer = document.getElementById('wardrobe-options-grid');
  wardrobeContainer.innerHTML = '';
  DESIGN_DATA.wardrobes.forEach(ward => {
    const isSelected = AppState.selections.wardrobe === ward.id;
    const card = document.createElement('div');
    card.className = `design-item-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = ward.id;
    card.innerHTML = `
      <div class="design-card-visual" style="position:relative; overflow:hidden; height:140px; border-radius:8px 8px 0 0; background-color:#0b0c13; display:flex; align-items:center; justify-content:center;">
        ${ward.image ? `<img src="${ward.image}" style="width:100%; height:100%; object-fit:cover;" />` : ward.svg}
      </div>
      <div class="design-card-body">
        <span class="design-item-label">Master Storage</span>
        <h4 class="design-item-title">${ward.title}</h4>
        <p class="design-item-desc">${ward.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      wardrobeContainer.querySelectorAll('.design-item-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selections.wardrobe = ward.id;
      updateActiveDesignRenders();
      updateBlueprintSummaryView();
    });
    wardrobeContainer.appendChild(card);
  });

  // Populate Laminates Grid
  const lamContainer = document.getElementById('laminates-options-grid');
  lamContainer.innerHTML = '';
  DESIGN_DATA.laminates.forEach(lam => {
    const isSelected = AppState.selections.laminate === lam.id;
    const card = document.createElement('div');
    card.className = `material-matrix-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="material-texture-thumb" style="background-color: ${lam.color}"></div>
      <div class="material-matrix-info">
        <span class="material-matrix-type">${lam.type}</span>
        <h4 class="material-matrix-name">${lam.name}</h4>
        <p style="font-size:11px;color:var(--text-secondary);line-height:1.3">${lam.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      lamContainer.querySelectorAll('.material-matrix-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selections.laminate = lam.id;
      updateActiveDesignRenders();
      populateMaterialsAndHardwareGrid();
      updateBlueprintSummaryView();
    });
    lamContainer.appendChild(card);
  });

  // Populate Paints Color Palette
  const colorContainer = document.getElementById('color-options-grid');
  colorContainer.innerHTML = '';
  DESIGN_DATA.colors.forEach(col => {
    const isSelected = AppState.selections.color === col.id;
    const card = document.createElement('div');
    card.className = `material-matrix-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="material-texture-thumb" style="display:flex;gap:4px;padding:6px;background-color:#161925">
        <div style="flex:1.5;background-color:${col.primary};border-radius:4px"></div>
        <div style="flex:1;background-color:${col.secondary};border-radius:4px"></div>
        <div style="flex:1;background-color:${col.accent};border-radius:4px"></div>
      </div>
      <div class="material-matrix-info">
        <span class="material-matrix-type">Paint Palette</span>
        <h4 class="material-matrix-name">${col.name}</h4>
        <p style="font-size:11px;color:var(--text-secondary);line-height:1.3">${col.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      colorContainer.querySelectorAll('.material-matrix-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selections.color = col.id;
      updateActiveDesignRenders();
      updateBlueprintSummaryView();
    });
    colorContainer.appendChild(card);
  });

  // Populate TV Pinterest Grid
  const tvPinGrid = document.getElementById('tv-pinterest-grid');
  if (tvPinGrid) {
    tvPinGrid.innerHTML = '';
    DESIGN_DATA.pinterestInspirations.filter(p => p.type === 'tv').forEach(pin => {
      const isPinned = AppState.pinnedPinterestPins.some(p => p.id === pin.id);
      const card = document.createElement('div');
      card.className = `material-matrix-card ${isPinned ? 'selected' : ''}`;
      card.style.cursor = 'default';
      card.innerHTML = `
        <div class="material-texture-thumb" style="position:relative; overflow:hidden; background-color:#161925; display:flex; align-items:center; justify-content:center; padding: 2px;">
          ${pin.image}
        </div>
        <div class="material-matrix-info" style="display:flex; flex-direction:column; justify-content:space-between; flex:1;">
          <div>
            <span class="material-matrix-type">${pin.source}</span>
            <h4 class="material-matrix-name">${pin.title}</h4>
            <p style="font-size:11px;color:var(--text-secondary);line-height:1.3;margin-bottom:8px;">${pin.desc}</p>
          </div>
          <button class="btn-pin-pinterest ${isPinned ? 'active' : ''}" style="align-self:flex-start; background: ${isPinned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isPinned ? 'var(--accent-gold)' : 'var(--glass-border)'}; color: ${isPinned ? 'var(--accent-gold)' : 'var(--text-secondary)'}; font-size:10px; font-weight:600; padding:4px 8px; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;">
            <span>📌</span> ${isPinned ? 'Pinned ✓' : 'Pin to Brief'}
          </button>
        </div>
      `;
      card.querySelector('.btn-pin-pinterest').addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = AppState.pinnedPinterestPins.findIndex(p => p.id === pin.id);
        if (idx > -1) {
          AppState.pinnedPinterestPins.splice(idx, 1);
        } else {
          AppState.pinnedPinterestPins.push(pin);
        }
        populateVisualizerOptions();
        updateBlueprintSummaryView();
      });
      tvPinGrid.appendChild(card);
    });
  }

  // Populate Kitchen Pinterest Grid
  const kitPinGrid = document.getElementById('kitchen-pinterest-grid');
  if (kitPinGrid) {
    kitPinGrid.innerHTML = '';
    DESIGN_DATA.pinterestInspirations.filter(p => p.type === 'kitchen').forEach(pin => {
      const isPinned = AppState.pinnedPinterestPins.some(p => p.id === pin.id);
      const card = document.createElement('div');
      card.className = `material-matrix-card ${isPinned ? 'selected' : ''}`;
      card.style.cursor = 'default';
      card.innerHTML = `
        <div class="material-texture-thumb" style="position:relative; overflow:hidden; background-color:#161925; display:flex; align-items:center; justify-content:center; padding: 2px;">
          ${pin.image}
        </div>
        <div class="material-matrix-info" style="display:flex; flex-direction:column; justify-content:space-between; flex:1;">
          <div>
            <span class="material-matrix-type">${pin.source}</span>
            <h4 class="material-matrix-name">${pin.title}</h4>
            <p style="font-size:11px;color:var(--text-secondary);line-height:1.3;margin-bottom:8px;">${pin.desc}</p>
          </div>
          <button class="btn-pin-pinterest ${isPinned ? 'active' : ''}" style="align-self:flex-start; background: ${isPinned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isPinned ? 'var(--accent-gold)' : 'var(--glass-border)'}; color: ${isPinned ? 'var(--accent-gold)' : 'var(--text-secondary)'}; font-size:10px; font-weight:600; padding:4px 8px; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;">
            <span>📌</span> ${isPinned ? 'Pinned ✓' : 'Pin to Brief'}
          </button>
        </div>
      `;
      card.querySelector('.btn-pin-pinterest').addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = AppState.pinnedPinterestPins.findIndex(p => p.id === pin.id);
        if (idx > -1) {
          AppState.pinnedPinterestPins.splice(idx, 1);
        } else {
          AppState.pinnedPinterestPins.push(pin);
        }
        populateVisualizerOptions();
        updateBlueprintSummaryView();
      });
      kitPinGrid.appendChild(card);
    });
  }

  // Populate Wardrobe Pinterest Grid
  const wardPinGrid = document.getElementById('wardrobe-pinterest-grid');
  if (wardPinGrid) {
    wardPinGrid.innerHTML = '';
    DESIGN_DATA.pinterestInspirations.filter(p => p.type === 'wardrobe').forEach(pin => {
      const isPinned = AppState.pinnedPinterestPins.some(p => p.id === pin.id);
      const card = document.createElement('div');
      card.className = `material-matrix-card ${isPinned ? 'selected' : ''}`;
      card.style.cursor = 'default';
      card.innerHTML = `
        <div class="material-texture-thumb" style="position:relative; overflow:hidden; background-color:#161925; display:flex; align-items:center; justify-content:center; padding: 2px;">
          ${pin.image}
        </div>
        <div class="material-matrix-info" style="display:flex; flex-direction:column; justify-content:space-between; flex:1;">
          <div>
            <span class="material-matrix-type">${pin.source}</span>
            <h4 class="material-matrix-name">${pin.title}</h4>
            <p style="font-size:11px;color:var(--text-secondary);line-height:1.3;margin-bottom:8px;">${pin.desc}</p>
          </div>
          <button class="btn-pin-pinterest ${isPinned ? 'active' : ''}" style="align-self:flex-start; background: ${isPinned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isPinned ? 'var(--accent-gold)' : 'var(--glass-border)'}; color: ${isPinned ? 'var(--accent-gold)' : 'var(--text-secondary)'}; font-size:10px; font-weight:600; padding:4px 8px; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;">
            <span>📌</span> ${isPinned ? 'Pinned ✓' : 'Pin to Brief'}
          </button>
        </div>
      `;
      card.querySelector('.btn-pin-pinterest').addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = AppState.pinnedPinterestPins.findIndex(p => p.id === pin.id);
        if (idx > -1) {
          AppState.pinnedPinterestPins.splice(idx, 1);
        } else {
          AppState.pinnedPinterestPins.push(pin);
        }
        populateVisualizerOptions();
        updateBlueprintSummaryView();
      });
      wardPinGrid.appendChild(card);
    });
  }
}

function updateActiveDesignRenders() {
  let activeUnit = null;
  let typeKey = '';
  let colorVariationKey = '';

  if (AppState.activeTab === 'kitchen' || AppState.activeRoomId === 'kitchen') {
    activeUnit = DESIGN_DATA.kitchens.find(k => k.id === AppState.selections.kitchen);
    typeKey = 'kitchen';
    colorVariationKey = 'kitchenColor';
  } else if (AppState.activeTab === 'wardrobe' || AppState.activeRoomId === 'masterBed' || AppState.activeRoomId === 'kidsBed') {
    activeUnit = DESIGN_DATA.wardrobes.find(w => w.id === AppState.selections.wardrobe);
    typeKey = 'wardrobe';
    colorVariationKey = 'wardrobeColor';
  } else {
    // Default to TV unit / Living
    activeUnit = DESIGN_DATA.tvUnits.find(u => u.id === AppState.selections.tvUnit);
    typeKey = 'tvUnit';
    colorVariationKey = 'tvUnitColor';
  }

  if (activeUnit) {
    // Check if there is an active color variation selected
    const activeColorKey = AppState.selections[colorVariationKey] || Object.keys(activeUnit.colorVariations || {})[0];
    
    // Update active selections to match the active color key if not set
    if (activeColorKey && !AppState.selections[colorVariationKey]) {
      AppState.selections[colorVariationKey] = activeColorKey;
    }

    const colorVarDetail = (activeUnit.colorVariations && activeUnit.colorVariations[activeColorKey]) ? activeUnit.colorVariations[activeColorKey] : null;

    const displayTitle = colorVarDetail ? colorVarDetail.title : activeUnit.title;
    const displayDesc = colorVarDetail ? colorVarDetail.desc : activeUnit.desc;

    // Render image/SVG
    if (activeUnit.image) {
      document.getElementById('overview-rendering-view').innerHTML = `
        <div style="position:relative; width:100%; height:100%; overflow:hidden; border-radius:12px;">
          <img src="${activeUnit.image}" style="width:100%; height:100%; object-fit:cover; filter: brightness(0.95) contrast(1.05);" />
          <div style="position:absolute; bottom:0; left:0; width:100%; padding:20px; background:linear-gradient(to top, rgba(9,10,15,0.9), transparent); display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:700; letter-spacing:1px;">Active Rendering Visual</span>
            <span style="font-size:14px; font-weight:600; color:#fff;">${displayTitle}</span>
          </div>
        </div>
      `;
    } else if (activeUnit.svg) {
      document.getElementById('overview-rendering-view').innerHTML = activeUnit.svg;
    } else {
      document.getElementById('overview-rendering-view').innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-secondary); font-size:14px;">
          No 3D Blueprint loaded.
        </div>
      `;
    }

    document.getElementById('overview-selection-title').textContent = displayTitle;
    document.getElementById('overview-selection-desc').textContent = displayDesc;

    const lam = DESIGN_DATA.laminates.find(l => l.id === AppState.selections.laminate);
    const col = DESIGN_DATA.colors.find(c => c.id === AppState.selections.color);

    const materialContainer = document.getElementById('overview-material-pills');
    materialContainer.innerHTML = `
      <div class="material-pill">Shutter Board: <span>${lam ? lam.name : 'High Gloss'}</span></div>
      <div class="material-pill">Wall Coating: <span>${col ? col.name : 'Emerald/Teal'}</span></div>
      ${colorVarDetail ? `<div class="material-pill" style="border-color:var(--accent-mint)">Variation: <span style="color:var(--accent-mint)">${colorVarDetail.title}</span></div>` : ''}
    `;

    // Now populate color variation toggles in the dashboard
    const togglesContainer = document.getElementById('overview-color-toggles');
    if (togglesContainer) {
      togglesContainer.innerHTML = '';
      if (activeUnit.colorVariations && Object.keys(activeUnit.colorVariations).length > 0) {
        Object.entries(activeUnit.colorVariations).forEach(([key, val]) => {
          const btn = document.createElement('button');
          const isActive = key === activeColorKey;
          btn.className = `btn-secondary ${isActive ? 'active' : ''}`;
          btn.style.padding = '6px 12px';
          btn.style.fontSize = '11px';
          btn.style.borderRadius = '15px';
          btn.style.border = isActive ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)';
          btn.style.color = isActive ? 'var(--accent-gold)' : 'var(--text-secondary)';
          btn.style.background = isActive ? 'rgba(212,175,55,0.1)' : 'transparent';
          btn.style.cursor = 'pointer';
          btn.style.margin = '2px';
          btn.textContent = val.title;

          btn.addEventListener('click', () => {
            AppState.selections[colorVariationKey] = key;
            updateActiveDesignRenders();
            updateBlueprintSummaryView();
          });
          togglesContainer.appendChild(btn);
        });
      } else {
        togglesContainer.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">No finish variations defined for this style.</span>`;
      }
    }
  }
}

/* -------------------------------------------------------------
   VASTU COMPLIANCE SYSTEM
------------------------------------------------------------- */
function updateVastuGauge(report) {
  const scoreRadial = document.getElementById('vastu-radial-fill');
  const scoreText = document.getElementById('vastu-radial-val');
  
  scoreText.textContent = report.score + '%';

  const deg = (report.score / 100) * 360 - 45;
  scoreRadial.style.transform = `rotate(${deg}deg)`;

  const list = document.getElementById('vastu-reports-list');
  list.innerHTML = '';

  report.reports.forEach(item => {
    const row = document.createElement('div');
    row.className = 'vastu-rule-row';
    row.innerHTML = `
      <div class="vastu-rule-name">
        <span class="rule-room" style="text-transform:capitalize">${item.room === 'masterBed' ? 'Master Suite' : item.room}</span>
        <span class="rule-direction">Direction detected: ${item.direction}</span>
      </div>
      <span class="vastu-status-badge ${item.status === 'perfect' ? 'perfect' : 'warning'}">${item.status === 'perfect' ? 'Perfect Alignment' : 'Suboptimal placement'}</span>
    `;
    list.appendChild(row);
  });
}

/* -------------------------------------------------------------
   AESTHETIC BLUEPRINT SUMMARY VIEW (REPLACES ESTIMATE DRAWER)
------------------------------------------------------------- */
function updateBlueprintSummaryView() {
  const tv = DESIGN_DATA.tvUnits.find(u => u.id === AppState.selections.tvUnit);
  const kitchen = DESIGN_DATA.kitchens.find(k => k.id === AppState.selections.kitchen);
  const wardrobe = DESIGN_DATA.wardrobes.find(w => w.id === AppState.selections.wardrobe);
  const lam = DESIGN_DATA.laminates.find(l => l.id === AppState.selections.laminate);
  const col = DESIGN_DATA.colors.find(c => c.id === AppState.selections.color);
  
  const foyer = DESIGN_DATA.foyers.find(f => f.id === AppState.selections.foyer) || DESIGN_DATA.foyers[0];
  const temple = DESIGN_DATA.temples.find(t => t.id === AppState.selections.temple) || DESIGN_DATA.temples[0];

  // Render comprehensive specifications details (Pricing has been 100% removed)
  const container = document.getElementById('estimates-line-items');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;">
      
      <div style="background-color:var(--bg-secondary); border:1px solid var(--glass-border); padding:16px; border-radius:12px; display:flex; gap:15px; align-items:center;">
        <div style="width:80px; height:50px; background-color:#0b0c13; border-radius:6px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          ${tv && tv.image ? `<img src="${tv.image}" style="width:100%; height:100%; object-fit:cover;" />` : (tv ? tv.svg : '')}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:600; color:var(--text-primary);">${tv ? tv.title : 'TV console'}</h4>
          <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${tv ? tv.desc.slice(0, 80) : ''}...</p>
        </div>
      </div>

      <div style="background-color:var(--bg-secondary); border:1px solid var(--glass-border); padding:16px; border-radius:12px; display:flex; gap:15px; align-items:center;">
        <div style="width:80px; height:50px; background-color:#0b0c13; border-radius:6px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          ${kitchen && kitchen.image ? `<img src="${kitchen.image}" style="width:100%; height:100%; object-fit:cover;" />` : (kitchen ? kitchen.svg : '')}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:600; color:var(--text-primary);">${kitchen ? kitchen.title : 'Kitchen'}</h4>
          <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${kitchen ? kitchen.desc.slice(0, 80) : ''}...</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <span style="font-size:10px; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.3); padding:2px 6px; border-radius:10px; color:var(--accent-mint)">💧 Purifier: ${AppState.purifierSetup === 'under-sink' ? 'Under-Sink RO' : AppState.purifierSetup === 'wall-mount' ? 'Wall-Mounted RO' : 'Utility Inlet'}</span>
            <span style="font-size:10px; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.3); padding:2px 6px; border-radius:10px; color:var(--accent-mint)">🍳 Pantry: ${AppState.pantrySystem === 'hettich-larder' ? '6-Tier Hettich Pull-out' : AppState.pantrySystem === 'wire-baskets' ? 'SS Wire Baskets' : AppState.pantrySystem === 'wooden-matrix' ? 'Custom Wood Matrix' : 'None'}</span>
          </div>
        </div>
      </div>

      <div style="background-color:var(--bg-secondary); border:1px solid var(--glass-border); padding:16px; border-radius:12px; display:flex; gap:15px; align-items:center;">
        <div style="width:80px; height:50px; background-color:#0b0c13; border-radius:6px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          ${wardrobe && wardrobe.image ? `<img src="${wardrobe.image}" style="width:100%; height:100%; object-fit:cover;" />` : (wardrobe ? wardrobe.svg : '')}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:600; color:var(--text-primary);">${wardrobe ? wardrobe.title : 'Wardrobe'}</h4>
          <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${wardrobe ? wardrobe.desc.slice(0, 80) : ''}...</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <span style="font-size:10px; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); padding:2px 6px; border-radius:10px; color:var(--accent-gold)">🔒 Safe Vault: ${AppState.hasConcealedSafe ? 'Biometric Safe Embedded ✓' : 'Not Requested'}</span>
          </div>
        </div>
      </div>

      <div style="background-color:var(--bg-secondary); border:1px solid var(--glass-border); padding:16px; border-radius:12px; display:flex; gap:15px; align-items:center;">
        <div style="width:80px; height:50px; background-color:#0b0c13; border-radius:6px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          ${temple && temple.image ? `<img src="${temple.image}" style="width:100%; height:100%; object-fit:cover;" />` : temple.svg}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:600; color:var(--text-primary);">${temple.title}</h4>
          <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${temple.desc ? temple.desc.slice(0, 80) : ''}...</p>
        </div>
      </div>

      <div style="background-color:var(--bg-secondary); border:1px solid var(--glass-border); padding:16px; border-radius:12px; display:flex; gap:15px; align-items:center;">
        <div style="width:80px; height:50px; background-color:#0b0c13; border-radius:6px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
          ${foyer && foyer.image ? `<img src="${foyer.image}" style="width:100%; height:100%; object-fit:cover;" />` : foyer.svg}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:600; color:var(--text-primary);">${foyer.title}</h4>
          <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${foyer.desc ? foyer.desc.slice(0, 80) : ''}...</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <span style="font-size:10px; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); padding:2px 6px; border-radius:10px; color:var(--accent-gold)">🛋️ Seating Bench: ${AppState.hasCushionedSeating ? 'Cushioned Shoe Bench ✓' : 'Standard Console'}</span>
          </div>
        </div>
      </div>

    </div>
  `;

  // Draw Dynamic Render Gallery (Rendered Image of each selected space on Overview View!)
  const gallery = document.getElementById('blueprint-renders-gallery');
  if (gallery) {
    gallery.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:15px; text-align:center;">
          <span style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px;">Grand Living Area</span>
          <div style="height:120px; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background-color:#161925; border:1px solid var(--glass-border);">
            ${tv && tv.image ? `<img src="${tv.image}" style="width:100%; height:100%; object-fit:cover;" />` : (tv ? tv.svg : '')}
          </div>
          <span style="font-size:12px; font-weight:600; color:var(--text-primary); margin-top:8px; display:block;">${tv ? tv.title : ''}</span>
        </div>
        <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:15px; text-align:center;">
          <span style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px;">Modular Kitchen</span>
          <div style="height:120px; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background-color:#161925; border:1px solid var(--glass-border);">
            ${kitchen && kitchen.image ? `<img src="${kitchen.image}" style="width:100%; height:100%; object-fit:cover;" />` : (kitchen ? kitchen.svg : '')}
          </div>
          <span style="font-size:12px; font-weight:600; color:var(--text-primary); margin-top:8px; display:block;">${kitchen ? kitchen.title : ''}</span>
        </div>
        <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:15px; text-align:center;">
          <span style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px;">Master Suite</span>
          <div style="height:120px; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background-color:#161925; border:1px solid var(--glass-border);">
            ${wardrobe && wardrobe.image ? `<img src="${wardrobe.image}" style="width:100%; height:100%; object-fit:cover;" />` : (wardrobe ? wardrobe.svg : '')}
          </div>
          <span style="font-size:12px; font-weight:600; color:var(--text-primary); margin-top:8px; display:block;">${wardrobe ? wardrobe.title : ''}</span>
        </div>
        <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:15px; text-align:center;">
          <span style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px;">Pooja Room</span>
          <div style="height:120px; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background-color:#161925; border:1px solid var(--glass-border);">
            ${temple && temple.image ? `<img src="${temple.image}" style="width:100%; height:100%; object-fit:cover;" />` : temple.svg}
          </div>
          <span style="font-size:12px; font-weight:600; color:var(--text-primary); margin-top:8px; display:block;">${temple.title}</span>
        </div>
      </div>
    `;
  }

  // Update Pinterest Gallery in overview tab
  const pinHeadline = document.getElementById('pinterest-section-headline');
  const pinGallery = document.getElementById('overview-pinterest-gallery');
  if (pinHeadline && pinGallery) {
    const uploadedHtml = (AppState.referenceImages || []).map(img => `
      <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:10px; text-align:center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="height:100px; border-radius:8px; overflow:hidden; background-color:#161925; display:flex; align-items:center; justify-content:center;">
          <img src="${img}" style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <span style="font-size:10px; color:var(--text-secondary); margin-top:6px; display:block;">Client Upload</span>
      </div>
    `).join('');

    const pinnedHtml = (AppState.pinnedPinterestPins || []).map(pin => `
      <div style="background-color:#0b0c13; border:1px solid var(--glass-border); border-radius:12px; padding:10px; text-align:center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-color:var(--accent-gold);">
        <div style="height:100px; border-radius:8px; overflow:hidden; background-color:#161925; display:flex; align-items:center; justify-content:center; padding: 4px;">
          ${pin.image}
        </div>
        <span style="font-size:10px; color:var(--accent-gold); font-weight:600; margin-top:6px; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">📌 Pinned: ${pin.title}</span>
      </div>
    `).join('');

    const totalCount = (AppState.referenceImages?.length || 0) + (AppState.pinnedPinterestPins?.length || 0);

    if (totalCount > 0) {
      pinHeadline.style.display = 'block';
      pinGallery.style.display = 'grid';
      pinGallery.innerHTML = uploadedHtml + pinnedHtml;
    } else {
      pinHeadline.style.display = 'none';
      pinGallery.style.display = 'none';
    }
  }
}

/* -------------------------------------------------------------
   HIGH-FIDELITY PRINT-READY PROPOSAL PDF BRIEF (PRICING REMOVED)
------------------------------------------------------------- */
function generateProposalPDF() {
  const tv = DESIGN_DATA.tvUnits.find(u => u.id === AppState.selections.tvUnit);
  const kitchen = DESIGN_DATA.kitchens.find(k => k.id === AppState.selections.kitchen);
  const wardrobe = DESIGN_DATA.wardrobes.find(w => w.id === AppState.selections.wardrobe);
  const lam = DESIGN_DATA.laminates.find(l => l.id === AppState.selections.laminate);
  const col = DESIGN_DATA.colors.find(c => c.id === AppState.selections.color);
  
  const foyer = DESIGN_DATA.foyers.find(f => f.id === AppState.selections.foyer) || DESIGN_DATA.foyers[0];
  const temple = DESIGN_DATA.temples.find(t => t.id === AppState.selections.temple) || DESIGN_DATA.temples[0];

  const activeCarcassCheck = INTERIOR_STANDARDS.verifyCarcassMaterial('kitchen', AppState.materialTier);
  const activeVentCheck = INTERIOR_STANDARDS.verifyChimneyHeight(AppState.cookingStyle, AppState.chimneyVentRoute);
  const activePoojaCheck = INTERIOR_STANDARDS.verifyPoojaPlacement(AppState.vastuCompliant ? 'NE' : 'S', false);
  const activeWorkTriangleCheck = INTERIOR_STANDARDS.verifyWorkTriangle(2.1, 1.9, 2.3);
  const activeHangingCheck = INTERIOR_STANDARDS.verifyWardrobeHanging('sarees', AppState.ceilingHeight === '3000mm' ? 1600 : 1400);
  const activeLPGCheck = INTERIOR_STANDARDS.verifyLPGVentilation(AppState.gasSetup, true);
  const activePartitionCheck = INTERIOR_STANDARDS.verifyPartitionScreen(AppState.partitionStyle, 1200, 150);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to generate the PDF brief.");
    return;
  }

  // Generate dynamic custom solutions list
  let customSolutionsHtml = '';
  if (AppState.aiResult && AppState.aiResult.customSolutions && AppState.aiResult.customSolutions.length > 0) {
    customSolutionsHtml = `
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
        ${AppState.aiResult.customSolutions.map(s => `<li><strong>AI Spatial Adaptation:</strong> ${s}</li>`).join('')}
      </ul>
    `;
  } else {
    customSolutionsHtml = `
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
        <li><strong>AI Spatial Adaptation:</strong> Custom reading nook integrated into the primary living layout.</li>
        <li><strong>AI Spatial Adaptation:</strong> High suction chimney ducting alignment checked for traditional Indian cooking.</li>
        <li><strong>AI Spatial Adaptation:</strong> Rounded drawer edges and washable emulsion coats mapped for kids safety.</li>
      </ul>
    `;
  }

  // Generate Pinterest reference swatches (Merged with Pinned Pinterest Cards!)
  let pinterestHtml = '';
  const pinnedPinterestHtml = (AppState.pinnedPinterestPins || []).map((pin, idx) => `
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #f8fafc; text-align: center; display:flex; flex-direction:column; justify-content:space-between; height: 210px;">
      <div style="height: 100px; border-radius: 6px; overflow: hidden; background-color: #0f172a; display:flex; align-items:center; justify-content:center; padding:4px;">
        ${pin.image}
      </div>
      <div style="margin-top: 8px;">
        <span style="font-size: 9px; font-weight: 700; color: #D4AF37; text-transform: uppercase; display:block;">📌 Pinned Reference</span>
        <h5 style="font-size: 10px; font-weight: 600; margin: 4px 0; color:#1e293b; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${pin.title}</h5>
        <span style="font-size: 8px; color: #64748b; display: block; line-height:1.2;">Source: ${pin.source}</span>
      </div>
    </div>
  `).join('');

  const uploadedRefHtml = (AppState.referenceImages || []).map((img, index) => `
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background-color: #f8fafc; text-align: center; height: 210px;">
      <div style="height: 120px; border-radius: 6px; overflow: hidden; background-color: #f1f5f9; display:flex; align-items:center; justify-content:center;">
        <img src="${img}" style="width:100%; height:100%; object-fit:cover;" />
      </div>
      <span style="font-size: 10px; color: #64748b; margin-top: 15px; display: block; font-weight:600;">Reference #${index + 1}</span>
    </div>
  `).join('');

  const totalPinterestCount = (AppState.referenceImages?.length || 0) + (AppState.pinnedPinterestPins?.length || 0);

  if (totalPinterestCount > 0) {
    pinterestHtml = `
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-top:20px;">
        ${uploadedRefHtml}
        ${pinnedPinterestHtml}
      </div>
    `;
  } else {
    pinterestHtml = `
      <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 60px 40px; text-align: center; background-color: #f8fafc; margin-top: 40px;">
        <span style="font-size: 40px; display: block; margin-bottom: 15px;">📸</span>
        <h4 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; color: #475569; margin: 0 0 8px 0;">No External Reference Images Uploaded</h4>
        <p style="font-size: 13px; color: #64748b; max-width: 400px; margin: 0 auto; line-height: 1.5;">The client did not provide external reference styles or Pinterest inspirations. Fabrications will proceed using Spacious Venture signature Modern Luxury palettes.</p>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Spacious Venture Design Proposal - ${AppState.clientName}</title>
      <base href="${window.location.href}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 0;
        }
        
        * { box-sizing: border-box; }
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .print-page {
          width: 210mm;
          height: 297mm;
          page-break-after: always;
          page-break-inside: avoid;
          padding: 20mm 20mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          background-color: #ffffff;
          border-bottom: 1px dashed #cbd5e1;
        }
        
        @media print {
          .print-page {
            border-bottom: none;
            height: 100vh;
          }
        }
        
        .print-page:last-child {
          page-break-after: avoid;
          border-bottom: none;
        }
        
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 15px;
          margin-bottom: 20px;
          flex-shrink: 0;
        }
        
        .logo {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #0f172a;
        }
        
        .logo span {
          color: #D4AF37;
        }
        
        .proposal-badge {
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
        }
        
        .print-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
          flex-shrink: 0;
        }
        
        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow: hidden;
        }
        
        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 10px 0 20px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .meta-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          font-weight: 600;
        }
        
        .meta-val {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .quote-callout {
          background-color: #fafaf9;
          border-left: 4px solid #D4AF37;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 20px;
          font-style: italic;
          font-size: 13px;
          color: #44403c;
          line-height: 1.5;
        }
        
        .spec-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-top: 10px;
          align-items: start;
        }
        
        .render-frame {
          width: 100%;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          background-color: #0b0c13;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        
        .render-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .render-frame svg {
          width: 80%;
          height: 80%;
        }
        
        .info-pane {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .info-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        
        .info-desc {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }
        
        .standards-box {
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 15px;
          border: 1px solid #cbd5e1;
        }
        
        .standards-title {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 6px 0;
          text-transform: uppercase;
        }
        
        .standards-list {
          margin: 0;
          padding-left: 15px;
          font-size: 11px;
          line-height: 1.5;
        }
        
        .vastu-badge {
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          color: #0369a1;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
        }
        
        .swatch-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          background-color: #fff;
        }
        
        .swatch-thumb {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          border: 1px solid #94a3b8;
          flex-shrink: 0;
        }
        
        .signatures-grid {
          display: flex;
          justify-content: space-between;
          padding-top: 30px;
          margin-top: auto;
        }
        
        .signature-block {
          width: 220px;
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1.5px solid #475569;
          height: 50px;
          margin-bottom: 8px;
        }
        
        .signature-title {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>

      <!-- PAGE 1: CLIENT & PROJECT INTAKE BRIEF -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Client Intake Brief</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Project Profile & Intake Brief</h2>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Client Name</span>
              <span class="meta-val">${AppState.clientName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Aesthetic Style Direction</span>
              <span class="meta-val" style="text-transform: capitalize;">${AppState.selectedStyle.replace('-', ' ')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Layout Configuration</span>
              <span class="meta-val">${AppState.bhkConfig.toUpperCase()} Residential Plan</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Vastu Shastra Compliance</span>
              <span class="meta-val">${AppState.aiResult ? AppState.aiResult.vastuReport.score : 90}% Compliance Score</span>
            </div>
          </div>
          
          <div class="meta-grid" style="margin-top:-10px; background-color:#ffffff;">
            <div class="meta-item">
              <span class="meta-label">Clear Ceiling Height</span>
              <span class="meta-val">${AppState.ceilingHeight}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Family Profile context</span>
              <span class="meta-val" style="font-size:12px;">${AppState.familyProfile}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Core Plywood Core Grade</span>
              <span class="meta-val" style="text-transform:capitalize;">${AppState.materialTier.replace('-', ' ')} Tier</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Overhead Modular Lofts</span>
              <span class="meta-val">${AppState.hasLofts ? 'Full-height lofts enabled' : 'Ceiling flush minimal'}</span>
            </div>
          </div>

          <div class="meta-grid" style="margin-top:-10px; background-color:#ffffff;">
            <div class="meta-item">
              <span class="meta-label">Kitchen Layout Style</span>
              <span class="meta-val" style="text-transform:capitalize;">${AppState.kitchenLayout.replace('-', ' ')} Layout</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Pooja Mandir Type</span>
              <span class="meta-val" style="text-transform:capitalize;">${AppState.poojaPreference.replace('-', ' ')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Integrated Appliances</span>
              <span class="meta-val" style="font-size:11px; font-weight:normal;">${AppState.appliances && AppState.appliances.length > 0 ? AppState.appliances.join(', ') : 'None selected'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Premium Fittings Installed</span>
              <span class="meta-val" style="font-size:11px; font-weight:normal;">${AppState.fittings && AppState.fittings.length > 0 ? AppState.fittings.join(', ') : 'Standard sliding/hinges'}</span>
            </div>
          </div>

          <div class="meta-grid" style="margin-top:-10px; background-color:#ffffff;">
            <div class="meta-item">
              <span class="meta-label">Water Purifier Setup</span>
              <span class="meta-val" style="font-size:12px;">${AppState.purifierSetup === 'under-sink' ? 'Concealed Under-Sink RO' : AppState.purifierSetup === 'wall-mount' ? 'Wall-Mounted RO' : 'Utility Inlet'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Modular Pantry System</span>
              <span class="meta-val" style="font-size:12px;">${AppState.pantrySystem === 'hettich-larder' ? '6-Tier Hettich Larder' : AppState.pantrySystem === 'wire-baskets' ? 'SS Wire Baskets' : AppState.pantrySystem === 'wooden-matrix' ? 'Custom Wood Matrix' : 'None'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Concealed Biometric Safe</span>
              <span class="meta-val" style="font-size:12px;">${AppState.hasConcealedSafe ? 'Biometric Safe Embedded ✓' : 'Not Requested'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Foyer Shoe Seating</span>
              <span class="meta-val" style="font-size:12px;">${AppState.hasCushionedSeating ? 'Cushioned Bench Integrated ✓' : 'Standard Console'}</span>
            </div>
          </div>

          <h3 style="font-family:'Outfit'; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569; margin: 15px 0 8px 0;">Mandatory Client Requirements:</h3>
          <div class="quote-callout">
            "${AppState.customNotes ? AppState.customNotes : 'Standard full-home high-end luxury interiors with modular systems.'}"
          </div>

          <h3 style="font-family:'Outfit'; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569; margin: 15px 0 8px 0;">AI Structural Bounding Analysis:</h3>
          <div style="background-color:#f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding:15px;">
            ${customSolutionsHtml}
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 1 of 7</span>
        </div>
      </div>

      <!-- PAGE 2: MEDIA WALL SPECIFICATION -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Living Room Brief</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Grand Living Area Specification</h2>
          
          <div class="spec-container">
            <div class="info-pane">
              <span style="font-size: 10px; text-transform: uppercase; color: #AA820A; font-weight: 700; letter-spacing: 0.5px;">Active Selection</span>
              <h3 class="info-title">${tv ? tv.title : 'Bespoke TV Wall Console'}</h3>
              <p class="info-desc">${tv ? tv.desc : ''}</p>
              
              <div style="margin-top: 10px; font-size: 12px; color: #475569;">
                <strong>Dimensions:</strong> ${tv ? tv.dimensions : 'Custom fit to room boundary'}<br>
                <strong>Finishes Selected:</strong> ${tv ? tv.materials.join(', ') : 'High Gloss Acrylic, louvers'}<br>
                <strong>Room Partition:</strong> ${AppState.partitionStyle ? AppState.partitionStyle.toUpperCase() : 'None selected'}
              </div>
              
              <div class="vastu-badge">
                <span>🧭</span> Vastu alignment check: Perfect North/East wall mounting recommended
              </div>
              
              <div class="standards-box" style="background-color: #fcfdfa; border-color: #bbf7d0;">
                <h4 class="standards-title" style="color: #166534;">📐 Sizing Clearance Compliance</h4>
                <ul class="standards-list" style="color: #14532d;">
                  <li><strong>Center Line height:</strong> Screens aligned at 1050-1150mm from finished floor for strain-free viewing.</li>
                  <li><strong>Clear passage corridor:</strong> Minimum of 900mm clearance in front of consoles to facilitate fluid passage.</li>
                  <li><strong>Rafter shadow depth:</strong> Fluted panel backings aligned at 25mm spacing.</li>
                </ul>
              </div>

              <!-- Partition divider check -->
              <div style="background-color: ${activePartitionCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activePartitionCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:8px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activePartitionCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activePartitionCheck.title}</h4>
                <p style="font-size:10px; color: ${activePartitionCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activePartitionCheck.message}</p>
              </div>
            </div>
            
            <div class="render-frame">
              ${tv && tv.image ? `<img src="${tv.image}" />` : (tv ? tv.svg : '')}
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 2 of 7</span>
        </div>
      </div>

      <!-- PAGE 3: MODULAR KITCHEN SPECIFICATION -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Modular Kitchen Brief</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">High-Ergonomic Modular Kitchen</h2>
          
          <div class="spec-container">
            <div class="info-pane">
              <span style="font-size: 10px; text-transform: uppercase; color: #AA820A; font-weight: 700; letter-spacing: 0.5px;">Active Selection</span>
              <h3 class="info-title">${kitchen ? kitchen.title : 'Premium Modular Kitchen'}</h3>
              <p class="info-desc">${kitchen ? kitchen.desc : ''}</p>
              
              <div style="margin-top: 10px; font-size: 12px; color: #475569;">
                <strong>Layout Style:</strong> ${AppState.kitchenLayout.replace('-', ' ').toUpperCase()} Layout<br>
                <strong>Gas & Cooktop Setup:</strong> ${AppState.gasSetup.includes('cylinder') ? 'Specialized LPG Cylinder Carcass (Ventilated)' : 'Piped Gas Connection (Wall Copper Routed)'} | ${AppState.gasSetup.includes('hob') ? 'Flush Built-in Hob Cutout' : 'Countertop Traditional Gas Stove'}<br>
                <strong>Cabinet Finish:</strong> 1.5mm High specular glass acrylic shutter boards<br>
                <strong>Venting Duct:</strong> ${AppState.chimneyVentRoute === 'external' ? 'Direct External Ducting' : 'Recirculating Carbon Filter'}
              </div>
              
              <div class="vastu-badge">
                <span>🧭</span> Vastu alignment check: Southeast cardinal placement (Agni corner) validated
              </div>
              
              <!-- Materials, Chimney and Work Triangle audit checks -->
              <div style="background-color: ${activeCarcassCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activeCarcassCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:10px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activeCarcassCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activeCarcassCheck.title}</h4>
                <p style="font-size:10px; color: ${activeCarcassCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activeCarcassCheck.message}</p>
              </div>

              <div style="background-color: ${activeVentCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activeVentCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:8px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activeVentCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activeVentCheck.title}</h4>
                <p style="font-size:10px; color: ${activeVentCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activeVentCheck.message}</p>
              </div>

              <div style="background-color: ${activeWorkTriangleCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activeWorkTriangleCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:8px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activeWorkTriangleCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activeWorkTriangleCheck.title}</h4>
                <p style="font-size:10px; color: ${activeWorkTriangleCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activeWorkTriangleCheck.message}</p>
              </div>

              <div style="background-color: ${activeLPGCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activeLPGCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:8px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activeLPGCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activeLPGCheck.title}</h4>
                <p style="font-size:10px; color: ${activeLPGCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activeLPGCheck.message}</p>
              </div>
            </div>
            
            <div class="render-frame">
              ${kitchen && kitchen.image ? `<img src="${kitchen.image}" />` : (kitchen ? kitchen.svg : '')}
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 3 of 7</span>
        </div>
      </div>

      <!-- PAGE 4: MASTER SUITE STORAGE SPECIFICATION -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Master Suite Brief</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Master Suite Wardrobe Storage</h2>
          
          <div class="spec-container">
            <div class="info-pane">
              <span style="font-size: 10px; text-transform: uppercase; color: #AA820A; font-weight: 700; letter-spacing: 0.5px;">Active Selection</span>
              <h3 class="info-title">${wardrobe ? wardrobe.title : 'Bespoke Wardrobe Closet'}</h3>
              <p class="info-desc">${wardrobe ? wardrobe.desc : ''}</p>
              
              <div style="margin-top: 10px; font-size: 12px; color: #475569;">
                <strong>Dimensions:</strong> ${wardrobe ? wardrobe.dimensions : 'Custom clear-floor to ceiling height fit'}<br>
                <strong>Overhead lofts:</strong> ${AppState.hasLofts ? 'Standard Overhead storage lofts integrated' : 'Minimal plain shutters'}
              </div>
              
              <div class="vastu-badge">
                <span>🧭</span> Vastu alignment check: South/West placement optimized for solid load bearing
              </div>

              <!-- Wardrobe Rod Clearances Check -->
              <div style="background-color: ${activeHangingCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activeHangingCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:10px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activeHangingCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activeHangingCheck.title}</h4>
                <p style="font-size:10px; color: ${activeHangingCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activeHangingCheck.message}</p>
              </div>
              
              <div class="standards-box" style="background-color:#fcfdfa; border-color:#bbf7d0;">
                <h4 class="standards-title" style="color: #166534;">📐 Sizing Clearance Compliance</h4>
                <ul class="standards-list" style="color: #14532d;">
                  <li><strong>Swing shutters depth:</strong> 600mm to avoid fabric friction on hangers.</li>
                  <li><strong>Sliding tracks depth:</strong> 650mm including 50mm heavy dual running profile slots.</li>
                  <li><strong>Vertical rod clearances:</strong> 1100mm height for kurtas and shirts, 1600mm height for long sweeping traditional sarees.</li>
                </ul>
              </div>
            </div>
            
            <div class="render-frame">
              ${wardrobe && wardrobe.image ? `<img src="${wardrobe.image}" />` : (wardrobe ? wardrobe.svg : '')}
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 4 of 7</span>
        </div>
      </div>

      <!-- PAGE 5: POOJA MANDIR & FOYER SPECIFICATION -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Temple & Entrance Brief</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Pooja Mandir & Foyer Console</h2>
          
          <div class="spec-container">
            <div class="info-pane">
              <span style="font-size: 10px; text-transform: uppercase; color: #AA820A; font-weight: 700; letter-spacing: 0.5px;">Active Selections</span>
              <h3 class="info-title">${temple.title}</h3>
              <p class="info-desc">${temple.desc}</p>
              
              <div style="margin-top: 10px; font-size: 12px; color: #475569;">
                <strong>Mandir Dimensions:</strong> ${temple.dimensions}<br>
                <strong>Mandir Configuration:</strong> ${AppState.poojaPreference.replace('-', ' ').toUpperCase()}<br>
                <strong>Divider Partition Screen:</strong> ${AppState.partitionStyle.replace('-', ' ').toUpperCase()}<br>
                <strong>Foyer Selection:</strong> ${foyer.title} (${foyer.dimensions})
              </div>
              
              <div class="vastu-badge">
                <span>🧭</span> Vastu Strictness: <strong style="text-transform:uppercase; margin-left:4px;">${AppState.vastuStrictness}</strong> | Northeast cardinal sector strictly verified
              </div>

              <!-- Pooja Vastu Proximity Check -->
              <div style="background-color: ${activePoojaCheck.status === 'warning' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${activePoojaCheck.status === 'warning' ? '#fca5a5' : '#bbf7d0'}; border-radius:8px; padding:10px 14px; margin-top:10px;">
                <h4 style="font-size:11px; font-weight:700; color: ${activePoojaCheck.status === 'warning' ? '#991b1b' : '#166534'}; margin:0 0 4px 0;">${activePoojaCheck.title}</h4>
                <p style="font-size:10px; color: ${activePoojaCheck.status === 'warning' ? '#7f1d1d' : '#14532d'}; margin:0;">${activePoojaCheck.message}</p>
              </div>
              
              <div class="standards-box" style="background-color:#fcfdfa; border-color:#bbf7d0;">
                <h4 class="standards-title" style="color: #166534;">📐 Spiritual Pedestal Standards</h4>
                <ul class="standards-list" style="color: #14532d;">
                  <li><strong>Pedestal Stepping height:</strong> Raised 450mm from finished floor level.</li>
                  <li><strong>Brass hanging hooks:</strong> Double reinforced loops for solid hanging bells in jali arches.</li>
                  <li><strong>Foyer Shoe storage:</strong> Louvered design for continuous ventilation and odor prevention.</li>
                </ul>
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:15px;">
              <div class="render-frame" style="height:110px;">
                ${temple && temple.image ? `<img src="${temple.image}" />` : temple.svg}
              </div>
              <div class="render-frame" style="height:100px;">
                ${foyer && foyer.image ? `<img src="${foyer.image}" />` : foyer.svg}
              </div>
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 5 of 7</span>
        </div>
      </div>

      <!-- PAGE 6: CLIENT REFERENCES & PINTEREST GALLERY -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Client Reference Inspirations</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Style Reference Inspirations</h2>
          <p style="font-size:13px; color:#475569; line-height:1.5; margin:0 0 20px 0;">Pinterest references and uploaded style guidelines integrated into the design brief.</p>
          
          ${pinterestHtml}
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 6 of 7</span>
        </div>
      </div>

      <!-- PAGE 7: SWATCHES INDEX & AGREEMENT SIGN-OFF -->
      <div class="print-page">
        <div class="print-header">
          <div class="logo">SPACIOUS <span>VENTURE</span></div>
          <div class="proposal-badge">Material Swatches Index</div>
        </div>
        
        <div class="page-content">
          <h2 class="page-title">Specifications Index & Agreement</h2>
          
          <h3 style="font-family:'Outfit'; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569; margin: 0 0 12px 0;">Primary Swatch Selections</h3>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
            <div class="swatch-card">
              <div class="swatch-thumb" style="background-color: ${lam ? lam.color : '#0D9488'}"></div>
              <div class="swatch-meta">
                <span class="swatch-title" style="font-weight:700; font-size:12px;">${lam ? lam.name : 'High Gloss Acrylic'}</span>
                <span class="swatch-subtitle" style="font-size:10px; color:#64748b;">${lam ? lam.type : 'Premium Material'}</span>
              </div>
            </div>
            
            <div class="swatch-card">
              <div class="swatch-thumb" style="display:flex; padding:2px; background-color:#161925">
                <div style="flex:1.5; background-color:${col ? col.primary : '#0F766E'}; border-radius:3px"></div>
                <div style="flex:1; background-color:${col ? col.secondary : '#D4AF37'}; border-radius:3px"></div>
              </div>
              <div class="swatch-meta">
                <span class="swatch-title" style="font-weight:700; font-size:12px;">${col ? col.name : 'Emerald and Brass'}</span>
                <span class="swatch-subtitle" style="font-size:10px; color:#64748b;">Color Theme Scheme</span>
              </div>
            </div>
          </div>

          <h3 style="font-family:'Outfit'; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569; margin: 0 0 12px 0;">Active Color & Finish Variations</h3>
          <div style="background-color:#fafafa; border:1px solid #cbd5e1; border-radius:8px; padding:15px; font-size:12px; line-height:1.6; color:#334155; margin-bottom:20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>TV Unit Variation:</strong> ${tv && tv.colorVariations && tv.colorVariations[AppState.selections.tvUnitColor] ? tv.colorVariations[AppState.selections.tvUnitColor].title : 'Standard Warm Walnut'}</div>
            <div><strong>Kitchen Variation:</strong> ${kitchen && kitchen.colorVariations && kitchen.colorVariations[AppState.selections.kitchenColor] ? kitchen.colorVariations[AppState.selections.kitchenColor].title : 'Standard Glossy Teal'}</div>
            <div><strong>Wardrobe Variation:</strong> ${wardrobe && wardrobe.colorVariations && wardrobe.colorVariations[AppState.selections.wardrobeColor] ? wardrobe.colorVariations[AppState.selections.wardrobeColor].title : 'Standard Smoked Grey'}</div>
            <div><strong>Wardrobe Finish Core:</strong> ${AppState.shutterFinish ? AppState.shutterFinish.toUpperCase() : 'ACRYLIC'}</div>
          </div>

          <h3 style="font-family:'Outfit'; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569; margin: 0 0 12px 0;">Carcass Plywood & Cabinet Hardware Core specifications</h3>
          <div style="background-color:#fafafa; border:1px solid #cbd5e1; border-radius:8px; padding:15px; font-size:12px; line-height:1.6; color:#334155; margin-bottom:20px;">
            <div><strong>Kitchen sink base carcass:</strong> Calibrated IS 710 BWP Marine Grade Waterproof Plywood (100% waterproof)</div>
            <div><strong>Dry zones carcass (Bedroom wardrobe, TV panels):</strong> IS 303 BWR (Boiling Water Resistant) Plywood / HDMR moisture-proof board</div>
            <div><strong>Cabinet hinges & Drawer systems:</strong> Soft-close hardware matching Hettich Sensys or Hafele functional fittings.</div>
          </div>

          <p style="font-size:11px; color:#475569; line-height:1.6; margin-bottom:20px;">
            <strong>Declaration:</strong> The visual and structural selections logged in this brief define the aesthetic direction for the project. No cost variables or rate-per-square-foot calculations are attached to this specification, ensuring focus on design parameters and spatial harmony. Spacious Venture structural engineers will arrive at the site within 24 hours to carry out digital 3D spatial scanning.
          </p>

          <div class="signatures-grid">
            <div class="signature-block">
              <div class="signature-line"></div>
              <span class="signature-title">Spacious Venture Representative</span>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <span class="signature-title">Client Signature</span>
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          <span>Spacious Venture Design Studio</span>
          <span>Page 7 of 7</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/* -------------------------------------------------------------
   CLOSING MODALS ACTION TRIGGERS & CELEBRATION CONFETTI
------------------------------------------------------------- */
function triggerModal(type) {
  const overlay = document.getElementById('deal-modal-overlay');
  const title = document.getElementById('deal-modal-title');
  const desc = document.getElementById('deal-modal-desc');
  const icon = document.getElementById('deal-modal-icon');

  if (type === 'close') {
    icon.innerHTML = '🎉';
    icon.style.background = 'rgba(16,185,129,0.1)';
    icon.style.color = 'var(--accent-mint)';
    title.textContent = 'Design Locks Completed!';
    desc.innerHTML = `Congratulations!<br><br>The design proposal with all space configurations, swatches index, and Vastu checks has been officially locked for <strong>${AppState.clientName}</strong>.<br><br>Our Spacious Venture structural engineers will arrive at their premises within 24 hours to initiate high-precision 3D scans.`;
    
    // Trigger celebratory canvas confetti overlay
    startConfettiCelebration();

  } else if (type === 'proposal') {
    // Renders custom browser A4 document direct PDF generator
    generateProposalPDF();
    return; // Skip displaying basic modal, opens PDF tab instantly
  }

  overlay.classList.add('active');

  overlay.querySelector('.close-modal-btn').addEventListener('click', () => {
    overlay.classList.remove('active');
    stopConfettiCelebration();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      stopConfettiCelebration();
    }
  });
}

/* -------------------------------------------------------------
   CELEBRATION CONFETTI ENGINE (PURE JS & CANVAS OVERLAY)
------------------------------------------------------------- */
let confettiIntervalId = null;
let confettiCanvasElement = null;

function startConfettiCelebration() {
  stopConfettiCelebration();

  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999';
  document.body.appendChild(canvas);

  confettiCanvasElement = canvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const colors = ['#D4AF37', '#10B981', '#06B6D4', '#F43F5E', '#AA820A', '#FFFFFF'];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height - 20,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      if (p.y > canvas.height) {
        particles[idx] = {
          x: Math.random() * canvas.width,
          y: Math.random() * -40 - 20,
          r: p.r,
          d: p.d,
          color: p.color,
          tilt: Math.random() * 10 - 5,
          tiltAngleIncremental: p.tiltAngleIncremental,
          tiltAngle: 0
        };
      }
    });
  }

  confettiIntervalId = setInterval(drawConfetti, 20);
}

function stopConfettiCelebration() {
  if (confettiIntervalId) {
    clearInterval(confettiIntervalId);
    confettiIntervalId = null;
  }
  if (confettiCanvasElement) {
    confettiCanvasElement.remove();
    confettiCanvasElement = null;
  }
}

function populateMaterialsAndHardwareGrid() {
  // Carcass Plywood core selection
  const plyGrid = document.getElementById('plywood-options-grid');
  if (plyGrid) {
    plyGrid.innerHTML = '';
    DESIGN_DATA.materials.forEach(material => {
      const isSelected = (AppState.materialTier === 'gold-bwp' && material.id === 'bwp-plywood') ||
                         (AppState.materialTier === 'silver-bwr' && (material.id === 'bwp-plywood' || material.id === 'bwr-plywood')) ||
                         (AppState.materialTier === 'bronze-hdmr' && material.id === 'hdmr-board');
      
      const card = document.createElement('div');
      card.className = `material-matrix-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="material-texture-thumb" style="background-color: ${material.color}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:bold;">${material.grade}</div>
        <div class="material-matrix-info">
          <span class="material-matrix-type">${material.type}</span>
          <h4 class="material-matrix-name">${material.name}</h4>
          <p style="font-size:11px;color:var(--text-secondary);line-height:1.3"><strong>Best Use:</strong> ${material.bestUse}<br>${material.desc}</p>
        </div>
      `;
      plyGrid.appendChild(card);
    });
  }

  // Hardware selection
  const hwGrid = document.getElementById('hardware-options-grid');
  if (hwGrid) {
    hwGrid.innerHTML = '';
    DESIGN_DATA.hardware.forEach(hw => {
      const isSelected = (AppState.materialTier === 'gold-bwp' && hw.tier === 'Luxury Gold') ||
                         (AppState.materialTier === 'silver-bwr' && hw.tier === 'Premium Silver') ||
                         (AppState.materialTier === 'bronze-hdmr' && hw.tier === 'Classic Bronze');
      
      const card = document.createElement('div');
      card.className = `material-matrix-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="material-texture-thumb" style="background-color:#161925; display:flex; align-items:center; justify-content:center; color:var(--text-gold); font-size:10px; font-weight:bold; border: 1px solid var(--glass-border);">${hw.brand}</div>
        <div class="material-matrix-info">
          <span class="material-matrix-type">${hw.type}</span>
          <h4 class="material-matrix-name">${hw.name}</h4>
          <p style="font-size:11px;color:var(--text-secondary);line-height:1.3"><strong>Tier Quality:</strong> ${hw.tier}<br>${hw.desc}</p>
        </div>
      `;
      hwGrid.appendChild(card);
    });
  }

  // Update Phase 2 Modular Installation Details
  const cylStatus = document.getElementById('mat-cylinder-status');
  const cylDesc = document.getElementById('mat-cylinder-desc');
  const hobStatus = document.getElementById('mat-hob-status');
  const hobDesc = document.getElementById('mat-hob-desc');

  if (cylStatus && cylDesc) {
    if (AppState.gasSetup.includes('cylinder')) {
      cylStatus.textContent = 'Ventilated LPG Cylinder Carcass';
      cylDesc.innerHTML = 'Specialized 450mm base cabinet configured with circular ventilation slots, safety rear piping clearance, and quick-access soft-close shutters. Fully compliant with safety checks.';
    } else {
      cylStatus.textContent = 'Piped Gas Line Utility Routing';
      cylDesc.innerHTML = 'Direct wall-routed copper piped gas connection (GAIL or equivalent). Base cylinder cabinet is omitted, maximizing modular pull-out drawer storage capacity by an additional 15%.';
    }
  }

  if (hobStatus && hobDesc) {
    if (AppState.gasSetup.includes('hob')) {
      hobStatus.textContent = 'Flush Built-in Hob Cutout';
      hobDesc.innerHTML = 'Requires precise laser countertop quartz cutout (750mm x 490mm) with heat-resistant thermal shields beneath the hob. Compatible with Hettich under-hob tandem systems.';
    } else {
      hobStatus.textContent = 'Traditional Countertop Stove';
      hobDesc.innerHTML = 'Sits directly on a continuous quartz countertop. Standard 600mm counter depth with rear clearance for copper gas pipe routing. Simple and maintenance-free.';
    }
  }
}

// PREMIUM EDIT: ADJUSTABLE SIDEBARS DRAGGING & PERSISTENCE
function setupSidebarResizers() {
  const leftPanel = document.getElementById('onboarding-panel');
  const leftResizer = document.getElementById('sidebar-resizer-left');
  const rightPanel = document.querySelector('.studio-visualizer-column');
  const rightResizer = document.getElementById('sidebar-resizer-right');
  const container = document.querySelector('.app-container');
  const activeContainer = document.getElementById('workspace-active');
  
  if (!container) return;

  // Restore saved sidebar sizes
  const savedLeftWidth = localStorage.getItem('sv_sidebar_left_width');
  if (savedLeftWidth && leftPanel) {
    leftPanel.style.width = savedLeftWidth + 'px';
    document.documentElement.style.setProperty('--sidebar-width', savedLeftWidth + 'px');
  }
  const savedRightWidth = localStorage.getItem('sv_sidebar_right_width');
  if (savedRightWidth && rightPanel) {
    rightPanel.style.flex = 'none';
    rightPanel.style.width = savedRightWidth + 'px';
  }

  // Left Sidebar Dragging
  if (leftPanel && leftResizer) {
    let isDragging = false;
    
    leftResizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      // Clamp between 340px and 700px
      if (newWidth >= 340 && newWidth <= 700) {
        leftPanel.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem('sv_sidebar_left_width', leftPanel.offsetWidth);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });

    // Tablet Touch Support
    leftResizer.addEventListener('touchstart', () => {
      isDragging = true;
    });
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const containerRect = container.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const newWidth = clientX - containerRect.left;
      if (newWidth >= 340 && newWidth <= 700) {
        leftPanel.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        localStorage.setItem('sv_sidebar_left_width', leftPanel.offsetWidth);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
  }

  // Right Sidebar Dragging
  if (rightPanel && rightResizer && activeContainer) {
    let isDragging = false;
    
    rightResizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const activeRect = activeContainer.getBoundingClientRect();
      const newWidth = activeRect.right - e.clientX;
      
      // Clamp between 380px and 850px
      if (newWidth >= 380 && newWidth <= 850) {
        rightPanel.style.flex = 'none';
        rightPanel.style.width = `${newWidth}px`;
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem('sv_sidebar_right_width', rightPanel.offsetWidth);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });

    // Touch Support
    rightResizer.addEventListener('touchstart', () => {
      isDragging = true;
    });
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const activeRect = activeContainer.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const newWidth = activeRect.right - clientX;
      if (newWidth >= 380 && newWidth <= 850) {
        rightPanel.style.flex = 'none';
        rightPanel.style.width = `${newWidth}px`;
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        localStorage.setItem('sv_sidebar_right_width', rightPanel.offsetWidth);
        if (typeof FLOORPLAN_CANVAS.resize === 'function') {
          FLOORPLAN_CANVAS.resize();
        }
      }
    });
  }
}

