// ============================================================
// SPACIOUS VENTURE STUDIO OS — Frontend Entry Point
// Export all enhanced components for easy importing
// ============================================================

// ---- AI Render Studio (Enhanced) ----
export { default as AIRenderStudioEnhanced } from './screens/AIRenderStudioEnhanced';

// ---- Component Color Services ----
export { default as ColorEditor } from './components/ColorEditor';

// ---- Utility Functions ----
export { 
  formatCurrency,
  calculateReadiness,
  getStageColor,
  getConfidenceLabel 
} from './utils/helpers';

// ---- In future exports: ----
// export { default as FloorPlanAnalyzer } from './screens/FloorPlanAnalyzer';
// export { default as ReferenceLibrary } from './screens/ReferenceLibrary';
// export { default as ColorPaletteBrowser } from './screens/ColorPaletteBrowser';