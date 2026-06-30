// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Enhanced Render Routes (renders-enhanced.js)
// API endpoints for floor-plan-aware AI renders + color editing
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const fpEngine = require('../services/fp-understanding-engine');
const renderPipeline = require('../services/render-pipeline');
const colorService = require('../services/component-color-service');
const database = require('../services/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'storage/uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ============================================================
// ENDPOINT 1: Analyze Floor Plan
// POST /api/renders/analyze-floorplan
// Upload a floor plan image and get structured analysis
// ============================================================
router.post('/analyze-floorplan', upload.single('floorPlan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No floor plan image uploaded' });
    }
    
    const imagePath = req.file.path;
    const options = {
      style: req.body.style || 'modern',
      budget: req.body.budgetTier || 'standard'
    };
    
    // Run the 7-phase floor plan analysis
    const analysis = await fpEngine.analyze(imagePath, options);
    
    // Store analysis in database
    const projectId = req.body.projectId;
    if (projectId) {
      await database.saveFloorPlanAnalysis(projectId, {
        imagePath: imagePath,
        originalName: req.file.originalname,
        analysis: analysis
      });
    }
    
    res.json({
      success: true,
      analysis: analysis,
      summary: {
        totalRooms: analysis.rooms.length,
        totalComponents: analysis.components.length,
        wallsDetected: analysis.walls.length,
        spatialConfidence: analysis.confidence + '%',
        warnings: analysis.constraints.warnings
      },
      floorPlanUrl: `/storage/uploads/${req.file.filename}`
    });
    
  } catch (error) {
    console.error('Floor plan analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 2: Generate Renders from Floor Plan Analysis
// POST /api/renders/generate
// Generate AI renders grounded in the floor plan analysis
// ============================================================
router.post('/generate', async (req, res) => {
  try {
    const { projectId, floorPlanAnalysis, style, budgetTier, variantCount, imageSize, quality } = req.body;
    
    if (!floorPlanAnalysis && !projectId) {
      return res.status(400).json({ error: 'Floor plan analysis or projectId required' });
    }
    
    let analysis = floorPlanAnalysis;
    
    // Load from database if projectId provided
    if (!analysis && projectId) {
      analysis = await database.getFloorPlanAnalysis(projectId);
      if (!analysis) {
        return res.status(400).json({
          error: 'No floor plan analysis found for this project. Please upload and analyze a floor plan first.'
        });
      }
    }
    
    if (!analysis.rooms || analysis.rooms.length === 0) {
      return res.status(400).json({
        error: 'Floor plan analysis has no rooms. Please check the floor plan upload.',
        hint: 'Ensure the floor plan shows clear room boundaries and walls.'
      });
    }
    
    // Initialize render pipeline
    await renderPipeline.initialize({
      openaiApiKey: process.env.OPENAI_API_KEY,
      mockMode: !process.env.OPENAI_API_KEY
    });
    
    // Generate renders
    const results = await renderPipeline.generateRenders(analysis, {
      style: style || 'modern',
      budget: budgetTier || 'standard',
      variantCount: variantCount || 4,
      imageSize: imageSize || '1024x1024',
      quality: quality || 'balanced'
    });
    
    // Store results in database
    const renderRecord = await database.saveRenderResults(projectId, results);
    
    res.json({
      success: true,
      projectId: projectId,
      renderId: renderRecord.id,
      rooms: results.rooms.map(r => ({
        roomName: r.roomName,
        dimensions: r.dimensions,
        variants: r.variants.map(v => ({
          id: v.id,
          name: v.name,
          spatialValidation: v.spatialValidation,
          componentMasks: Object.keys(v.componentMasks || {})
        })),
        componentTypes: this.extractComponentTypes(r)
      })),
      totalVariants: results.totalVariants,
      style: results.style,
      budget: results.budget
    });
    
  } catch (error) {
    console.error('Render generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper
function extractComponentTypes(room) {
  const types = new Set();
  for (const wall of (room.walls || [])) {
    for (const comp of (wall.components || [])) {
      types.add(comp.type);
    }
  }
  return [...types];
}

// ============================================================
// ENDPOINT 3: Get Color Palette for Component
// GET /api/renders/colors/:componentType
// Returns available colors and materials for a component type
// ============================================================
router.get('/colors/:componentType', (req, res) => {
  try {
    const componentType = req.params.componentType;
    const palette = colorService.getAvailableColors(componentType);
    
    // Group by material for UI
    const grouped = {};
    for (const [materialKey, material] of Object.entries(palette.materials)) {
      grouped[materialKey] = {
        label: material.label,
        finishes: material.finishes,
        colors: material.colors.map(c => ({
          name: c.name,
          hex: c.hex,
          family: c.family
        }))
      };
    }
    
    res.json({
      success: true,
      componentType: componentType,
      category: palette.category,
      materials: grouped,
      colorFamilies: [...new Set(
        Object.values(palette.materials)
          .flatMap(m => m.colors)
          .map(c => c.family)
      )]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 4: Change Component Color in Render
// POST /api/renders/change-color
// Apply a color change to a specific component in a render
// ============================================================
router.post('/change-color', async (req, res) => {
  try {
    const {
      projectId, renderId, variantId,
      componentType, newColor, newMaterial,
      applyToAllVariants
    } = req.body;
    
    if (!componentType || !newColor) {
      return res.status(400).json({
        error: 'componentType and newColor are required'
      });
    }
    
    // Load the render data from database
    const renderData = await database.getRenderData(projectId, renderId, variantId);
    if (!renderData) {
      return res.status(400).json({
        error: 'Render data not found. Generate renders first.',
        hint: 'Use POST /api/renders/generate first'
      });
    }
    
    // Apply the color change
    const result = await colorService.applyColorChange(renderData, {
      componentType,
      newColor,
      newMaterial,
      variantId,
      applyToAllVariants
    });
    
    // If successful, save the color change record
    if (result.success) {
      await database.saveColorChange({
        projectId,
        renderId,
        variantId,
        componentType,
        newColor,
        newMaterial,
        colorHex: result.colorHex
      });
      
      // Get complementary suggestions
      const suggestions = colorService.suggestPalette(
        renderData.roomType,
        result.colorHex
      );
      
      result.suggestions = suggestions;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Color change error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 5: Get Color Change History
// GET /api/renders/color-history/:projectId
// Returns all color changes made in a project
// ============================================================
router.get('/color-history/:projectId', (req, res) => {
  try {
    const history = colorService.getColorHistory(req.params.projectId);
    
    // Group by component type for UI
    const grouped = {};
    for (const change of history) {
      if (!grouped[change.componentType]) {
        grouped[change.componentType] = [];
      }
      grouped[change.componentType].push(change);
    }
    
    res.json({
      success: true,
      projectId: req.params.projectId,
      totalChanges: history.length,
      history: history,
      grouped: grouped
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 6: Suggest Color Palette for Room
// POST /api/renders/suggest-palette
// Get AI-suggested color combinations for a room
// ============================================================
router.post('/suggest-palette', (req, res) => {
  try {
    const { roomType, baseColor } = req.body;
    
    if (!baseColor) {
      return res.status(400).json({ error: 'baseColor is required (hex format, e.g., #d4c5b2)' });
    }
    
    const suggestions = colorService.suggestPalette(roomType, baseColor);
    
    res.json({
      success: true,
      roomType: roomType || 'living-room',
      baseColor: baseColor,
      suggestions: suggestions,
      paletteName: suggestions.length > 0 ? `${suggestions[0].color} Inspired Palette` : 'Custom Palette'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 7: Apply Color to Multiple Variants
// POST /api/renders/batch-color-change
// Apply the same color change to all variants in a room
// ============================================================
router.post('/batch-color-change', async (req, res) => {
  try {
    const { projectId, renderId, componentType, newColor, newMaterial, variantIds } = req.body;
    
    if (!projectId || !componentType || !newColor) {
      return res.status(400).json({ error: 'Missing required fields: projectId, componentType, newColor' });
    }
    
    const results = [];
    const targets = variantIds || ['v1', 'v2', 'v3', 'v4'];
    
    for (const variantId of targets) {
      const renderData = await database.getRenderData(projectId, renderId, variantId);
      if (renderData) {
        const result = await colorService.applyColorChange(renderData, {
          componentType, newColor, newMaterial, variantId, applyToAllVariants: true
        });
        results.push({ variantId, success: result.success });
      }
    }
    
    res.json({
      success: true,
      message: `Applied ${newColor} ${componentType} to ${results.filter(r => r.success).length}/${results.length} variants`,
      results: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENDPOINT 8: Enhance View — Full Render Studio Data
// GET /api/renders/studio/:projectId
// Returns all data needed for the enhanced render studio UI
// ============================================================
router.get('/studio/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Get all render data for the project
    const renders = await database.getProjectRenders(projectId);
    const floorPlanAnalysis = await database.getFloorPlanAnalysis(projectId);
    const colorHistory = colorService.getColorHistory(projectId);
    const projectData = await database.getProject(projectId);
    
    // Prepare spatial map data
    const spatialMap = floorPlanAnalysis ? {
      rooms: (floorPlanAnalysis.rooms || []).map(r => ({
        name: r.name,
        area: r.areaSqFt,
        dimensions: r.dimensionsMm,
        confidence: r.confidence
      })),
      walls: (floorPlanAnalysis.walls || []).map(w => ({
        length: w.length,
        type: w.type,
        thickness: w.thickness
      })),
      components: (floorPlanAnalysis.components || []).map(c => ({
        type: c.type,
        roomName: c.roomName,
        moduleType: c.moduleType,
        confidence: c.confidence,
        suggestedDimensions: c.suggestedDimensions
      })),
      confidence: floorPlanAnalysis.confidence
    } : null;
    
    // Prepare color options for all detected components
    const componentColorOptions = {};
    if (floorPlanAnalysis) {
      for (const comp of (floorPlanAnalysis.components || [])) {
        const typeKey = comp.type?.toLowerCase() || comp.moduleType?.toLowerCase();
        if (typeKey && !componentColorOptions[typeKey]) {
          componentColorOptions[typeKey] = colorService.getAvailableColors(typeKey);
        }
      }
    }
    
    res.json({
      success: true,
      projectId,
      projectName: projectData?.client_name || 'Unnamed Project',
      currentStage: projectData?.current_stage || 'render-review',
      spatialMap: spatialMap,
      renders: renders ? renders.map(r => ({
        id: r.id,
        roomName: r.room_name,
        variants: r.variants || [],
        selectedVariant: r.selected_variant || 'v1',
        status: r.status || 'pending-review'
      })) : [],
      colorHistory: colorHistory,
      componentColorOptions: componentColorOptions,
      availableRooms: floorPlanAnalysis?.rooms?.map(r => r.name) || []
    });
    
  } catch (error) {
    console.error('Render studio data error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;