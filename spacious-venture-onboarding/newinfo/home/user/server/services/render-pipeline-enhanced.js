// ============================================================
// PRIORITY 2b: Enhanced Render Route with Flux/ControlNet
// server/services/render-pipeline-enhanced.js
// Integrates Flux/ControlNet into the main render pipeline
// ============================================================

const fpEngine = require('./fp-understanding-engine');
const fluxProvider = require('./flux-controlnet/flux-provider');
const renderPipeline = require('./render-pipeline');

class EnhancedRenderPipeline {
  constructor() {
    this.mode = 'standard'; // 'standard' | 'precision'
  }

  /**
   * Generate renders with best available provider
   * Priority: Flux/ControlNet > OpenAI > Freepik > Mock
   */
  async generate(floorPlanAnalysis, options = {}) {
    const { quality = 'balanced' } = options;
    
    // PRECISION MODE: Use Flux/ControlNet for floor-plan-grounded renders
    if (quality === 'precision' || options.useControlNet) {
      return await this.generateWithControlNet(floorPlanAnalysis, options);
    }
    
    // STANDARD/BALANCED MODE: Use structured prompt pipeline
    return await renderPipeline.generateRenders(floorPlanAnalysis, options);
  }

  async generateWithControlNet(analysis, options) {
    // Generate floor-plan-grounded renders
    const result = await fluxProvider.generateFloorPlanRender(analysis, options);
    
    return {
      success: true,
      provider: 'flux-controlnet',
      mode: 'precision',
      validation: result.validation,
      rooms: this.formatRooms(analysis, result),
      totalVariants: result.images.length,
      controlImage: result.controlImage.base64,
      processingTime: Date.now()
    };
  }

  formatRooms(analysis, generationResult) {
    const rooms = (analysis.rooms || []).map(room => ({
      roomName: room.name,
      dimensions: room.dimensionsMm,
      variants: generationResult.images.map((img, i) => ({
        id: `v${i + 1}`,
        name: img.variantName || `Variant ${i + 1}`,
        imageUrl: img.url || img.base64,
        spatialValidation: generationResult.validation,
        componentMasks: this.generateComponentMasks(analysis, room)
      }))
    }));
    
    return rooms;
  }

  generateComponentMasks(analysis, room) {
    const masks = {};
    const components = (analysis.components || [])
      .filter(c => c.roomId === room.id);
    
    for (const comp of components) {
      masks[comp.type] = {
        componentType: comp.type,
        estimatedPosition: comp.estimatedPosition,
        suggestedDimensions: comp.suggestedDimensions,
        // SAM mask would be stored here during generation
        maskAvailable: false
      };
    }
    
    return masks;
  }
}

module.exports = new EnhancedRenderPipeline();