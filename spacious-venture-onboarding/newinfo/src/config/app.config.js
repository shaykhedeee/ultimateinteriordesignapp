// ============================================================
// SPACIOUS VENTURE STUDIO OS — Application Configuration
// All configurable parameters in one place
// ============================================================

const AppConfig = {
  // ---- App Info ----
  appName: 'Spacious Venture Studio OS',
  version: '2.0.0',
  
  // ---- API Endpoints ----
  api: {
    baseUrl: '/api',
    endpoints: {
      // Projects
      projects: '/api/projects',
      projectDetail: (id) => `/api/projects/${id}`,
      
      // Floor Plan Analysis (NEW)
      analyzeFloorPlan: '/api/renders/analyze-floorplan',
      
      // Render Generation (NEW)
      generateRenders: '/api/renders/generate',
      renderStudio: (id) => `/api/renders/studio/${id}`,
      
      // Color Editing (NEW)
      colorPalette: (type) => `/api/renders/colors/${type}`,
      changeColor: '/api/renders/change-color',
      batchColorChange: '/api/renders/batch-color-change',
      colorHistory: (id) => `/api/renders/color-history/${id}`,
      suggestPalette: '/api/renders/suggest-palette',
      
      // Reference Library (NEW)
      referenceLibrary: '/api/reference-library',
      
      // Cutlists
      cutlists: (projId) => `/api/projects/${projId}/cutlists`,
      cutlistDetail: (id) => `/api/cutlists/${id}`,
      cutlistCsv: (id) => `/api/cutlists/${id}/csv`,
      cutlistPdf: (id) => `/api/cutlists/${id}/pdf`,
      generateParts: (id) => `/api/cutlists/${id}/generate-parts`,
      optimizeSheets: (id) => `/api/cutlists/${id}/optimize`,
      
      // Briefs
      briefs: (projId) => `/api/projects/${projId}/briefs`,
      briefPdf: (id) => `/api/briefs/${id}/pdf`,
      
      // Admin
      adminSummary: '/api/admin/summary',
      documents: '/api/admin/documents',
      backupExport: '/api/library/export',
      backupImport: '/api/library/import',
      demoReset: '/api/admin/demo-reset'
    }
  },
  
  // ---- Render Defaults ----
  render: {
    defaultStyle: 'modern',
    defaultBudget: 'premium',
    defaultVariantCount: 4,
    availableStyles: ['modern', 'minimalist', 'traditional', 'luxury', 'contemporary', 'indian-contemporary'],
    availableBudgets: ['economy', 'standard', 'premium', 'luxury'],
    availableQualities: ['quick', 'balanced', 'precision'],
    imageSizes: ['1024x1024', '1024x1792', '1792x1024'],
    maxVariants: 6,
    minVariants: 2
  },
  
  // ---- Cutlist Defaults ----
  cutlist: {
    defaultSheetWidth: 2440,
    defaultSheetHeight: 1220,
    defaultCarcassThickness: 18,
    defaultBackThickness: 6,
    defaultKerf: 3,
    defaultTrim: 10,
    allowRotation: true,
    moduleTypes: [
      'base-cabinet', 'wall-cabinet', 'tall-unit', 'wardrobe',
      'tv-unit', 'shoe-rack', 'pooja-unit', 'sink-cabinet',
      'hob-drawer', 'study-desk', 'dining-crockery', 'custom-box'
    ]
  },
  
  // ---- Color Palette (from component-color-service) ----
  colorFamilies: {
    neutral: { label: 'Neutrals', icon: '⬜' },
    jewel: { label: 'Jewel Tones', icon: '💎' },
    earth: { label: 'Earth Tones', icon: '🌍' },
    pastel: { label: 'Pastels', icon: '🌸' },
    wood: { label: 'Wood Tones', icon: '🪵' },
    bold: { label: 'Bold Accents', icon: '🎨' }
  },
  
  // ---- Feature Flags ----
  features: {
    floorPlanAI: true,
    aiRenders: true,
    componentColorChange: true,
    referenceLibrary: true,
    cutlistAutomation: true,
    batchColorApply: true,
    colorHistory: true,
    spatialValidation: true,
    variantComparison: true
  },
  
  // ---- Studio Settings Defaults ----
  studio: {
    brandName: 'Spacious Venture',
    brandLine: 'Interior Design Studio',
    adminName: 'Studio Admin',
    leadDesigner: 'Lead Designer',
    studioCity: 'Bangalore',
    contactEmail: 'studio@spaciousventure.com',
    contactPhone: '+91 98765 43210',
    proposalFooter: 'Thank you for choosing Spacious Venture. We look forward to creating your dream space.',
    commercialScope: 'Design consultation, modular furniture planning, production supervision, and installation.',
    oneTimeFee: '₹ 1,45,000',
    paymentTerms: '50% advance, 25% on design approval, 25% on completion.',
    handoverNote: 'This proposal includes design concept, material specifications, modular layout, and production estimate.'
  }
};

export default AppConfig;