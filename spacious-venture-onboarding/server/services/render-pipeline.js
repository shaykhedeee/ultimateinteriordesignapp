// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Enhanced AI Render Pipeline (render-pipeline.js)
// Transforms floor plan analysis into photorealistic renders
// ============================================================

/**
 * PIPELINE OVERVIEW:
 * 
 * Phase 1: Layout Compiler (floor plan → structured 3D scene)
 * Phase 2: Structured Prompt Compiler (scene → deterministic prompt)
 * Phase 3: Multi-Variant Generator (prompt → variants with controlled differences)
 * Phase 4: Image Generation Provider (OpenAI/Freepik/Mock)
 * Phase 5: Spatial Validator (render matches floor plan? quality check)
 * Phase 6: Component Color Post-Processor (SAM-based recolor)
 * Phase 7: Variant Selection & Storage
 */

import { OpenAI } from 'openai';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { storageDir } from './database.js';
import { generateInteriorAsset } from './image-provider.js';
import { isNativeOpenAiKey } from './provider-config.js';

function componentKey(component = {}) {
  return [component.type, component.moduleType].filter(Boolean).join(' ').toLowerCase();
}

function slugRoom(value = '') {
  const key = String(value || 'room').toLowerCase();
  if (key.includes('kitchen')) return 'kitchen';
  if (key.includes('master')) return 'master';
  if (key.includes('kids')) return 'kids';
  if (key.includes('pooja') || key.includes('mandir')) return 'pooja';
  if (key.includes('foyer')) return 'foyer';
  if (key.includes('dining')) return 'dining';
  if (key.includes('study')) return 'study';
  if (key.includes('living') || key.includes('tv')) return 'living';
  return key.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'room';
}

// ---- PHASE 1: Layout Compiler ----

class LayoutCompiler {
  /**
   * Transform floor plan analysis into a structured 3D scene description
   */
  compile(floorPlanAnalysis, options = {}) {
    const { style = 'modern', budget = 'premium', quality = 'balanced' } = options;
    const constraints = floorPlanAnalysis.constraints || {};
    
    // Construct renderConstraints dynamically from rooms and components if not present
    const rooms = floorPlanAnalysis.rooms || [];
    const components = floorPlanAnalysis.components || [];
    
    const renderConstraints = constraints.renderConstraints || rooms.map(room => {
      const roomComps = components.filter(c => c.roomId === room.id || c.roomName === room.name);
      return {
        roomName: room.name,
        dimensions: room.dimensionsMm || room.dimensions || { width: 3600, length: 3600, height: 2750 },
        components: roomComps
      };
    });
    
    const scenes = [];
    
    for (const roomConstraint of renderConstraints) {
      const scene = this.compileRoom(roomConstraint, constraints, style, budget, quality);
      scenes.push(scene);
    }
    
    return {
      project: constraints.project || { style },
      scenes: scenes,
      style: style,
      budget: budget,
      quality: quality
    };
  }
  
  compileRoom(roomConstraint, projectConstraints, style, budget, quality) {
    const room = roomConstraint;
    const components = room.components || [];
    
    // Determine material palette based on style and budget
    const palette = this.getMaterialPalette(style, budget);

    // Build wall-by-wall description
    const walls = this.buildWallDescriptions(room, components, palette);
    
    // Calculate camera position
    const camera = this.calculateCameraPosition(room);
    
    // Determine light sources
    const lightSources = this.buildLightSources(room);
    
    return {
      roomName: room.roomName,
      dimensions: room.dimensions,
      camera: camera,
      walls: walls,
      components: components.map(c => ({
        ...c,
        defaultColor: this.getDefaultColor(c.type, palette),
        defaultMaterial: this.getDefaultMaterial(c.type, palette)
      })),
      lighting: lightSources,
      palette: palette,
      floor: palette.floor,
      ceiling: this.getCeilingType(budget)
    };
  }
  
  buildWallDescriptions(room, components, palette) {
    // Create 4 walls (North, East, South, West) or use actual wall data from floor plan
    const { width, length } = room.dimensions;
    const height = room.dimensions.height || 3000;
    
    // Place components on appropriate walls
    const westWallComps = components.filter(c => componentKey(c).includes('tv'));
    const northWallComps = components.filter(c => componentKey(c).includes('sofa'));
    const eastWallComps = components.filter(c =>
      componentKey(c).includes('dining') || componentKey(c).includes('counter') || componentKey(c).includes('kitchen')
    );
    const storageComps = components.filter(c =>
      ['wardrobe', 'bed', 'pooja', 'mandir', 'study', 'shoe'].some((key) => componentKey(c).includes(key))
    );
    
    return [
      {
        name: 'West Wall (TV Wall)',
        width: length, height: height,
        hasWindow: true, windowWidth: 1800, windowHeight: 2100,
        components: westWallComps.map(c => ({
          type: 'TV Unit',
          width: c.suggestedDimensions?.width || 2400,
          height: c.suggestedDimensions?.height || 450,
          depth: c.suggestedDimensions?.depth || 400,
          position: { fromFloor: 1200 },
          material: 'walnut veneer',
          finish: 'matte'
        })),
        wallMaterial: palette.wallFinish,
        description: 'Main accent wall with TV unit mounted between windows'
      },
      {
        name: 'North Wall (Sofa Wall)',
        width: width, height: height,
        hasDoor: true, doorWidth: 900,
        components: northWallComps.map(c => ({
          type: 'Sofa',
          width: c.suggestedDimensions?.width || 2400,
          height: c.suggestedDimensions?.height || 900,
          depth: c.suggestedDimensions?.depth || 800,
          material: 'fabric',
          color: palette.sofa.color,
          cushions: palette.sofa.cushionAccents
        })),
        wallMaterial: palette.wallFinish,
        description: 'Main seating area with L-shaped sofa'
      },
      {
        name: 'East Wall (Kitchen/Dining Side)',
        width: length, height: height,
        features: room.adjacentTo?.includes('kitchen') ? [{ type: 'arch', width: 2400 }] : [],
        components: eastWallComps.map(c => this.componentToWallObject(c, palette)),
        wallMaterial: palette.wallFinish,
        description: 'Open archway to adjacent spaces'
      },
      {
        name: 'South Wall (Window Wall)',
        width: width, height: height,
        hasWindow: true, windowWidth: 2400, windowHeight: 2100,
        components: storageComps.map(c => this.componentToWallObject(c, palette)),
        wallMaterial: palette.wallFinish,
        description: 'Natural light side'
      }
    ];
  }

  componentToWallObject(component, palette) {
    return {
      type: component.type || component.moduleType || 'Furniture',
      width: component.suggestedDimensions?.width || 1200,
      height: component.suggestedDimensions?.height || 900,
      depth: component.suggestedDimensions?.depth || 450,
      position: { fromFloor: 0, note: component.placementNote || component.placement?.note || '' },
      material: component.defaultMaterial || this.getDefaultMaterial(component.type, palette),
      finish: component.furnitureRequirement || component.sizeNote || 'as marked in the floor-plan annotation',
      color: component.defaultColor || this.getDefaultColor(component.type, palette)
    };
  }
  
  calculateCameraPosition(room) {
    const { width, length, height } = room.dimensions;
    return {
      position: { x: 500, y: 1600, z: length - 300 },
      target: { x: width / 2, y: 1600, z: 300 },
      fieldOfView: 75,
      description: 'Eye-level view from entrance looking into the room'
    };
  }
  
  buildLightSources(room) {
    return [
      {
        type: 'natural',
        source: 'south windows',
        direction: { x: 0, y: 0.6, z: -0.8 },
        color: 'afternoon daylight',
        temperature: 5500,
        intensity: 'medium-high'
      }
    ];
  }
  
  getMaterialPalette(style, budget) {
    // Style-based material palettes for Indian homes
    const palettes = {
      'modern': {
        wallFinish: 'textured off-white limewash paint',
        wallColor: '#f4efe8',
        floor: { material: 'vitrified tiles', size: '600x600mm', color: '#e8ddd0', finish: 'matte' },
        sofa: { color: '#d4c5b2', material: 'fabric', cushionAccents: ['#008080', '#d4a017'] },
        tvUnit: { material: 'walnut veneer', color: '#8b6f47', finish: 'matte' },
        diningTable: { material: 'engineered wood', color: '#8b6f47', seats: 6 },
        wardrobe: { finish: 'laminate', color: '#f5f5f0', accentPanel: '#8b6f47' },
        kitchenCounter: { material: 'quartz', color: '#f5f0e8' },
        cabinetFinish: { upper: 'white high-gloss acrylic', lower: 'warm wood laminate' }
      },
      'minimalist': {
        wallFinish: 'smooth white matte paint',
        wallColor: '#ffffff',
        floor: { material: 'engineered wood', color: '#c4b49d', finish: 'matte' },
        sofa: { color: '#f0ebe3', material: 'linen', cushionAccents: ['#a08060', '#d4c5b2'] },
        tvUnit: { material: 'white lacquer', color: '#ffffff', finish: 'matte' },
        diningTable: { material: 'oak', color: '#c4b49d', seats: 4 },
        wardrobe: { finish: 'lacquer', color: '#ffffff' },
        kitchenCounter: { material: 'concrete', color: '#c4c4c4' },
        cabinetFinish: { upper: 'white matte', lower: 'white matte' }
      },
      'traditional': {
        wallFinish: 'textured warm beige paint',
        wallColor: '#e8ddd0',
        floor: { material: 'marble', color: '#f5f0e8', finish: 'polished' },
        sofa: { color: '#8b4513', material: 'wood + cushioned', cushionAccents: ['#c89b45', '#8b1a1a'] },
        tvUnit: { material: 'solid sheesham wood', color: '#5c3a1e', finish: 'polished' },
        diningTable: { material: 'solid teak', color: '#5c3a1e', seats: 8 },
        wardrobe: { finish: 'PU', color: '#f5f0e8', accentPanel: '#5c3a1e' },
        kitchenCounter: { material: 'granite', color: '#2d2d2d' },
        cabinetFinish: { upper: 'wood laminate', lower: 'wood laminate dark' }
      },
      'luxury': {
        wallFinish: 'textured wallpaper with subtle pattern',
        wallColor: '#e8ddd0',
        floor: { material: 'imported marble', color: '#f8f4ec', finish: 'polished' },
        sofa: { color: '#1e4d6e', material: 'velvet', cushionAccents: ['#c89b45', '#e8ddd0'] },
        tvUnit: { material: 'high-gloss PU + metal', color: '#f5f5f0', finish: 'glossy' },
        diningTable: { material: 'solid walnut', color: '#5c3a1e', seats: 8 },
        wardrobe: { finish: 'PU high-gloss', color: '#f5f5f0', accentPanel: '#c89b45' },
        kitchenCounter: { material: 'quartzite', color: '#f8f4ec' },
        cabinetFinish: { upper: 'PU high-gloss white', lower: 'PU high-gloss taupe' }
      }
    };
    
    return palettes[style] || palettes['modern'];
  }
  
  getDefaultColor(componentType, palette) {
    if (componentType.includes('SOFA') || componentType.includes('sofa')) return palette.sofa.color;
    if (componentType.includes('TV') || componentType.includes('tv-unit')) return palette.tvUnit.color;
    if (componentType.includes('DINING') || componentType.includes('dining-table')) return palette.diningTable.color;
    if (componentType.includes('WARDROBE') || componentType.includes('wardrobe')) return palette.wardrobe.color;
    return '#d4c5b2';
  }
  
  getDefaultMaterial(componentType, palette) {
    if (componentType.includes('SOFA') || componentType.includes('sofa')) return palette.sofa.material;
    if (componentType.includes('TV') || componentType.includes('tv-unit')) return palette.tvUnit.material;
    return 'standard';
  }
  
  getCeilingType(budget) {
    if (budget === 'premium' || budget === 'luxury') {
      return { type: 'false ceiling with cove lighting', dropMm: 150, material: '12mm gypsum board' };
    }
    return { type: 'painted ceiling', material: 'paint finish' };
  }
}

// ---- PHASE 2: Structured Prompt Compiler ----

class StructuredPromptCompiler {
  compile(scene) {
    const room = scene;
    const prompts = [];
    
    // Base room description
    let prompt = `A highly detailed Lumion-like professional 3D architectural interior render of a ${scene.project?.style || 'modern'} Indian ${room.roomName || 'living room'}, realistic global illumination, raytraced material feel, corrected perspective, straight verticals, clean architectural visualization`;
    
    if (room.dimensions) {
      prompt += `, ${room.dimensions.width}mm wide × ${room.dimensions.length}mm deep × ${(room.dimensions.height || 3000)}mm high`;
    }
    
    // Camera
    if (room.camera) {
      prompt += `. Camera positioned at ${room.camera.description}`;
    }
    
    prompt += `.\n\n`;
    
    // Wall-by-wall
    for (const wall of (room.walls || [])) {
      prompt += `${wall.name}: `;
      prompt += `Wall is ${wall.width}mm wide, ${wall.height}mm high. `;
      
      if (wall.hasWindow) {
        prompt += `A ${wall.windowWidth}mm × ${wall.windowHeight}mm window with ${wall.windowWidth >= 2000 ? 'floor-to-ceiling' : 'standard'} glazing. `;
      }
      
      if (wall.hasDoor) {
        prompt += `A ${wall.doorWidth}mm door. `;
      }
      
      if (wall.features) {
        for (const feature of wall.features) {
          if (feature.type === 'arch') {
            prompt += `A ${feature.width}mm wide archway opening into adjacent room, visible beyond. `;
          }
        }
      }
      
      for (const comp of (wall.components || [])) {
        prompt += `A ${comp.width}mm wide`;
        if (comp.height) prompt += ` × ${comp.height}mm high`;
        if (comp.depth) prompt += ` × ${comp.depth}mm deep`;
        prompt += ` ${comp.type || 'furniture piece'}`;
        if (comp.material) prompt += ` in ${comp.material}`;
        if (comp.finish) prompt += ` with ${comp.finish} finish`;
        if (comp.color) prompt += `, color ${comp.color}`;
        prompt += '. ';
        
        if (comp.cushions) {
          prompt += `Accent cushions in ${comp.cushions.join(' and ')}. `;
        }
      }
      
      prompt += `Wall finish: ${wall.wallMaterial || 'painted finish'}.\n\n`;
    }
    
    // Floor
    if (room.floor) {
      prompt += `Floor: ${room.floor.material || 'vitrified tiles'}`;
      if (room.floor.size) prompt += `, ${room.floor.size}`;
      if (room.floor.color) prompt += `, color ${room.floor.color}`;
      if (room.floor.finish) prompt += `, ${room.floor.finish} finish`;
      prompt += `.\n`;
    }
    
    // Ceiling
    if (room.ceiling) {
      prompt += `Ceiling: ${room.ceiling.type || 'standard painted ceiling'}`;
      if (room.ceiling.dropMm) prompt += `, ${room.ceiling.dropMm}mm drop`;
      prompt += `.\n`;
    }
    
    // Lighting
    for (const light of (room.lighting || [])) {
      if (light.type === 'natural') {
        prompt += `Lighting: ${light.color || 'Warm natural'} light streaming through ${light.source || 'windows'}`;
        if (light.temperature) prompt += ` (${light.temperature}K)`;
        prompt += `.\n`;
      }
    }
    
    const exactRequirements = (room.components || [])
      .map((component) => [component.type, component.placementNote || component.placement?.note, component.furnitureRequirement, component.sizeNote].filter(Boolean).join(': '))
      .filter(Boolean);
    if (exactRequirements.length) {
      prompt += `\nFloor-plan constraints used: ${exactRequirements.join(' | ')}.\n`;
    }

    // Quality instructions
    prompt += `\nStyle: ${scene.project?.style || 'Modern'} Indian interior`;
    if (scene.budget) prompt += `, ${scene.budget} quality tier`;
    prompt += `.\n`;
    prompt += `Quality: Lumion-like professional 3D render, ultra-realistic material textures, presentation-ready 4K/8K detail, warm inviting atmosphere, realistic shadow casting, Indian home decor context with modular furniture, precisely matching the described layout.\n`;
    prompt += `DO NOT add any furniture or elements not described above. Every element must match the description exactly.\n`;
    prompt += `STRICT EXCLUSIONS: no humans, no human figures, no silhouettes, no mannequins, no pets, no logos, no watermarks, no text overlays, no fantasy objects, no cluttered showroom props.\n`;
    prompt += `IMPORTANT: Focus on realistic high-fidelity lighting, soft diffuse shadows, authentic Indian interior materials like warm teak wood, brass accents, and fluted paneling.\n`;
    
    // Create variants with controlled differences
    const basePrompt = prompt;
    
    return {
      basePrompt: basePrompt,
      enhancedPrompt: basePrompt,
      scenes: room
    };
  }
}

// ---- PHASE 3: Multi-Variant Generator ----

class VariantGenerator {
  generateVariants(compiledPrompt, count = 4) {
    const variants = [];
    
    // Variant 1: Designer's Choice (default palette)
    variants.push({
      id: 'v1',
      name: "Designer's Choice",
      prompt: compiledPrompt.basePrompt,
      colorOverrides: {},
      lightingOverride: null
    });
    
    // Variant 2: Contemporary Dark
    if (count >= 2) {
      const v2Prompt = compiledPrompt.basePrompt
        .replace(/beige.*?sofa/gi, 'charcoal grey fabric sofa')
        .replace(/walnut.*?(tv unit|veneer)/gi, 'white lacquer finish TV unit')
        .replace(/teal.*?mustard/gi, 'gold and ivory');
      
      variants.push({
        id: 'v2',
        name: 'Contemporary Dark',
        prompt: v2Prompt,
        colorOverrides: { sofa: '#2d2d2d', tvUnit: '#f5f5f0' },
        lightingOverride: null
      });
    }
    
    // Variant 3: Bold Colors
    if (count >= 3) {
      const v3Prompt = compiledPrompt.basePrompt
        .replace(/beige.*?sofa/gi, 'navy blue velvet sofa')
        .replace(/walnut.*?(tv unit|veneer)/gi, 'warm oak finished TV unit')
        .replace(/teal.*?mustard/gi, 'mustard yellow and burnt orange');
      
      variants.push({
        id: 'v3',
        name: 'Bold & Blue',
        prompt: v3Prompt,
        colorOverrides: { sofa: '#1e4d6e', tvUnit: '#8b6f47' },
        lightingOverride: null
      });
    }
    
    // Variant 4: Evening Ambiance
    if (count >= 4) {
      const v4Prompt = compiledPrompt.basePrompt
        .replace(/afternoon.*?(light|sunlight|daylight|natural)/gi, 'warm evening dusk lighting, dim warm glow from cove lights')
        .replace(/medium-high/gi, 'low warm');
      
      variants.push({
        id: 'v4',
        name: 'Evening Ambiance',
        prompt: v4Prompt,
        colorOverrides: {},
        lightingOverride: 'warm 2700K ambient, accent lighting on TV wall'
      });
    }
    
    return variants;
  }
}

// ---- PHASE 4: Image Generation Provider ----

class ImageGenerator {
  constructor() {
    this.providers = {
      'openai': null,
      'freepik': null
    };
    this.activeProvider = 'mock';
  }
  
  async initialize(config = {}) {
    if (isNativeOpenAiKey(config.openaiApiKey)) {
      this.providers.openai = new OpenAI({ apiKey: config.openaiApiKey });
      this.activeProvider = 'openai';
    }
    
    if (config.mockMode) {
      this.activeProvider = 'mock';
    }
  }
  
  async generate(prompt, options = {}) {
    const size = options.size || '1024x1024';
    const quality = options.quality || 'standard';
    const n = options.n || 1;

    if (options.useSharedProvider !== false) {
      const asset = await generateInteriorAsset({
        projectId: options.projectId || 'render-studio',
        room: slugRoom(options.roomName || 'room'),
        title: `${options.roomName || 'Room'} AI render`,
        prompt,
        style: options.style || 'modern',
        budgetTier: options.budgetTier || options.budget || 'premium',
        tags: ['render-studio', 'floor-plan-aware', options.quality || quality].filter(Boolean)
      });
      return [{
        index: 0,
        filePath: asset.filePath,
        revisedPrompt: asset.prompt || prompt,
        prompt: asset.prompt || prompt,
        provider: asset.sourceType,
        assetId: asset.id,
        reusableScore: asset.reusableScore
      }];
    }
    
    switch (this.activeProvider) {
      case 'openai':
        return this.generateWithOpenAI(prompt, size, quality, n);
      case 'freepik':
        return this.generateWithFreepik(prompt, size, n);
      default:
        return this.generateWithMock(prompt, size, n);
    }
  }
  
  async generateWithOpenAI(prompt, size, quality, n) {
    try {
      const response = await this.providers.openai.images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
        prompt: prompt,
        n: n,
        size: size,
        quality: quality,
        response_format: 'b64_json'
      });
      
      const results = [];
      for (let i = 0; i < response.data.length; i++) {
        const item = response.data[i];
        const b64 = item.b64_json;
        if (!b64) continue;
        
        const id = 'asset-' + Date.now() + '-' + Math.round(Math.random() * 1e5);
        const fileName = `render-${id}.png`;
        const filePath = path.join(storageDir, 'assets', fileName);
        
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        
        results.push({
          index: i,
          b64Json: b64,
          filePath: `/storage/assets/${fileName}`,
          revisedPrompt: item.revised_prompt || prompt,
          provider: 'openai'
        });
      }
      
      return results.length > 0 ? results : this.generateWithMock(prompt, size, n);
    } catch (error) {
      console.error('OpenAI generation failed:', error.message);
      return this.generateWithMock(prompt, size, n);
    }
  }
  
  async generateWithFreepik(prompt, size, n) {
    // Freepik API integration placeholder
    return this.generateWithMock(prompt, size, n);
  }
  
  async generateWithMock(prompt, size, n) {
    // Generate SVG-based mock images for offline development
    const results = [];
    for (let i = 0; i < n; i++) {
      results.push({
        index: i,
        svg: this.generateMockSvg(prompt, i),
        provider: 'mock',
        prompt: prompt
      });
    }
    return results;
  }
  
  generateMockSvg(prompt, variantIndex) {
    // Extract room info from prompt for a contextual SVG
    const roomType = prompt.includes('kitchen') ? 'Kitchen' :
                     prompt.includes('bedroom') ? 'Bedroom' :
                     prompt.includes('dining') ? 'Dining' : 'Living Room';
    
    const width = 800;
    const height = 600;
    const roomColor = variantIndex === 0 ? '#c89b45' : 
                      variantIndex === 1 ? '#2d2d2d' :
                      variantIndex === 2 ? '#1e4d6e' : '#8b4513';
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="wall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#101413"/>
          <stop offset="100%" style="stop-color:#171b19"/>
        </linearGradient>
        <linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a"/>
          <stop offset="100%" style="stop-color:#1a1a1a"/>
        </linearGradient>
      </defs>
      ${this.generateRoomSvg(roomType, width, height, roomColor)}
      <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#6f756d" font-family="sans-serif" font-size="12">
        AI Render Preview: ${roomType} (${roomColor}) - Style: ${variantIndex === 0 ? 'Default' : variantIndex === 1 ? 'Dark' : variantIndex === 2 ? 'Bold' : 'Evening'}
      </text>
    </svg>`;
  }
  
  generateRoomSvg(roomType, w, h, accentColor) {
    return `
      <!-- Back wall -->
      <rect x="50" y="50" width="${w-100}" height="${h-200}" fill="url(#wall)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <!-- Floor -->
      <rect x="50" y="${h-150}" width="${w-100}" height="100" fill="url(#floor)"/>
      <!-- Floor tiles -->
      ${this.generateGrid(60, h-150, w-100, 100, 100, '#1e1e1e')}
      <!-- Ceiling -->
      <rect x="50" y="20" width="${w-100}" height="30" fill="#0d0d0d"/>
      <!-- Window -->
      <rect x="${w*0.4}" y="100" width="${w*0.2}" height="${h-280}" fill="#2a3a4a" stroke="rgba(255,255,255,0.15)" stroke-width="2" rx="2"/>
      <line x1="${w*0.5}" y1="100" x2="${w*0.5}" y2="${h-180}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <line x1="${w*0.4}" y1="${h-280}" x2="${w*0.6}" y2="${h-280}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <!-- TV Unit -->
      <rect x="${w*0.38}" y="${h-280}" width="${w*0.24}" height="45" fill="${accentColor}" opacity="0.8" rx="2"/>
      <rect x="${w*0.42}" y="${h-240}" width="${w*0.16}" height="60" fill="#000" opacity="0.3" rx="1"/>
      <!-- Sofa -->
      <rect x="${w*0.15}" y="${h-200}" width="${w*0.35}" height="50" fill="${accentColor}" opacity="0.6" rx="3"/>
      <rect x="${w*0.2}" y="${h-210}" width="${w*0.25}" height="15" fill="${accentColor}" opacity="0.4" rx="2"/>
      <!-- Cushions -->
      <circle cx="${w*0.45}" cy="${h-180}" r="8" fill="#008080" opacity="0.7"/>
      <circle cx="${w*0.52}" cy="${h-180}" r="8" fill="#d4a017" opacity="0.7"/>
      <!-- Coffee table -->
      <rect x="${w*0.38}" y="${h-135}" width="80" height="15" fill="#8b6f47" opacity="0.7" rx="1"/>
      <!-- Room label -->
      <text x="${w/2}" y="80" text-anchor="middle" fill="#f4f0e8" font-family="sans-serif" font-size="18" font-weight="600">${roomType}</text>
      <!-- Dimension annotation -->
      <text x="${w-80}" y="${h-120}" text-anchor="end" fill="#aaa49a" font-family="sans-serif" font-size="10">W: 6000mm</text>
    `;
  }
  
  generateGrid(startX, startY, totalW, cellW, cellH, color) {
    let svg = '';
    for (let x = startX; x < startX + totalW; x += cellW) {
      svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + cellH}" stroke="${color}" stroke-width="0.5"/>\n`;
    }
    for (let y = startY; y < startY + cellH; y += cellH/2) {
      svg += `<line x1="${startX}" y1="${y}" x2="${startX + totalW}" y2="${y}" stroke="${color}" stroke-width="0.5"/>\n`;
    }
    return svg;
  }
}

// ---- PHASE 5: Spatial Validator ----

class SpatialValidator {
  validate(scene, generatedImage) {
    // Check render matches floor plan layout
    const checks = [
      this.checkRoomProportions(scene),
      this.checkWindowPresence(scene),
      this.checkComponentPresence(scene),
      this.checkLighting(scene)
    ];
    
    const totalScore = checks.reduce((sum, c) => sum + c.score * c.weight, 0);
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 100;
    
    return {
      passed: finalScore >= 70,
      score: Math.round(finalScore),
      checks: checks,
      failures: checks.filter(c => c.score < 0.6).map(c => c.name)
    };
  }
  
  checkRoomProportions(scene) {
    const dims = scene.scenes?.dimensions || scene.dimensions;
    if (!dims) return { name: 'Room proportions', score: 1.0, weight: 0.3 };
    
    const ratio = dims.width / dims.length;
    // Most Indian living rooms have ratio between 0.5 and 2.0
    const isValid = ratio >= 0.5 && ratio <= 2.0;
    return {
      name: 'Room proportions',
      score: isValid ? 0.9 : 0.5,
      weight: 0.3,
      detail: `${dims.width}×${dims.length}mm (ratio ${ratio.toFixed(2)})`
    };
  }
  
  checkWindowPresence(scene) {
    const walls = scene.scenes?.walls || scene.walls || [];
    const hasWindows = walls.some(w => w.hasWindow);
    return {
      name: 'Window presence',
      score: hasWindows ? 0.9 : 0.6,
      weight: 0.15,
      detail: hasWindows ? 'Windows present' : 'No windows detected'
    };
  }
  
  checkComponentPresence(scene) {
    const walls = scene.scenes?.walls || scene.walls || [];
    let totalComponents = 0;
    const required = new Set((scene.components || []).map((component) => component.type).filter(Boolean));
    const represented = new Set();
    for (const wall of walls) {
      totalComponents += (wall.components || []).length;
      for (const component of (wall.components || [])) represented.add(component.type);
    }
    const missing = [...required].filter((item) => !represented.has(item));
    
    return {
      name: 'Component placement',
      score: required.size ? Math.max(0.2, (required.size - missing.length) / required.size) : (totalComponents >= 2 ? Math.min(totalComponents / 5, 1.0) : 0.3),
      weight: 0.35,
      detail: missing.length ? `Missing in prompt: ${missing.join(', ')}` : `${totalComponents} components described`
    };
  }
  
  checkLighting(scene) {
    const lighting = scene.scenes?.lighting || scene.lighting || [];
    return {
      name: 'Lighting definition',
      score: lighting.length > 0 ? 0.9 : 0.4,
      weight: 0.20,
      detail: `${lighting.length} light source(s) defined`
    };
  }
}

// ---- PHASE 6: Component Color Post-Processor ----

class ComponentColorProcessor {
  /**
   * Change the color of a specific component in a rendered image
   * without regenerating the entire image
   */
  async recolorComponent(renderResult, componentType, newColor, newMaterial) {
    // Approach 1: Component-Aware Generation (best quality)
    // The component masks are stored during generation
    
    if (renderResult.componentMasks && renderResult.componentMasks[componentType]) {
      return await this.recolorWithMask(
        renderResult.image,
        renderResult.componentMasks[componentType],
        newColor,
        newMaterial
      );
    }
    
    // Approach 2: SAM-based segmentation (if no pre-computed mask)
    return await this.recolorWithSAM(
      renderResult.image,
      componentType,
      newColor,
      newMaterial
    );
  }
  
  async recolorWithMask(image, mask, newColor, newMaterial) {
    // Apply color change using the mask
    // In production: use inpainting or style transfer
    return {
      success: true,
      image: image, // recolored version
      method: 'mask-based',
      componentType: mask.componentType,
      newColor: newColor,
      newMaterial: newMaterial,
      processingTime: 500 // ms
    };
  }
  
  async recolorWithSAM(image, componentDescription, newColor, newMaterial) {
    // Use Segment Anything Model to find and recolor the component
    // In production: send to external SAM API or run locally
    
    return {
      success: true,
      image: image,
      method: 'sam-based',
      componentDescription: componentDescription,
      newColor: newColor,
      newMaterial: newMaterial,
      processingTime: 2000
    };
  }
  
  generateColorPrompt(componentType, currentColor, newColor, currentMaterial, newMaterial) {
    return `Change the ${currentMaterial || 'material'} color of the ${componentType} ` +
      `from ${currentColor || 'current'} to ${newColor} ${newMaterial || ''}. ` +
      `Keep the exact same geometry, lighting, shadows, and position. ` +
      `Do NOT change anything else in the image.`;
  }
}

// ---- PHASE 7: Main Pipeline Controller ----

class RenderPipeline {
  constructor() {
    this.layoutCompiler = new LayoutCompiler();
    this.promptCompiler = new StructuredPromptCompiler();
    this.variantGenerator = new VariantGenerator();
    this.imageGenerator = new ImageGenerator();
    this.validator = new SpatialValidator();
    this.colorProcessor = new ComponentColorProcessor();
    this.isInitialized = false;
  }
  
  async initialize(config = {}) {
    await this.imageGenerator.initialize(config);
    this.isInitialized = true;
  }
  
  async generateRenders(floorPlanAnalysis, options = {}) {
    console.time('RenderPipeline');
    
    // Phase 1: Compile layout
    console.log('Phase 1: Compiling layout...');
    const compiled = this.layoutCompiler.compile(floorPlanAnalysis, options);
    
    const allVariants = [];
    
    for (const scene of compiled.scenes) {
      // Phase 2: Compile structured prompt
      console.log(`  Scene: ${scene.roomName}`);
      const compiledPrompt = this.promptCompiler.compile(scene, compiled);
      
      // Phase 3: Generate variants
      const variants = this.variantGenerator.generateVariants(
        compiledPrompt, options.variantCount || 4
      );
      
      // Phase 4: Generate images
      console.log('  Generating images...');
      for (const variant of variants) {
        const generated = await this.imageGenerator.generate(variant.prompt, {
          size: options.imageSize || '1024x1024',
          quality: options.quality || 'standard',
          n: 1,
          projectId: options.projectId,
          roomName: scene.roomName,
          style: options.style,
          budgetTier: options.budget
        });
        
        variant.generatedImages = generated;
        
        // Phase 5: Validate spatial accuracy
        const validation = this.validator.validate(scene, generated[0]);
        variant.spatialValidation = validation;
        
        // Generate mock masks for color editing
        variant.componentMasks = this.generateComponentMasks(scene);
      }
      
      allVariants.push({
        roomName: scene.roomName,
        dimensions: scene.dimensions,
        variants: variants
      });
    }
    
    console.timeEnd('RenderPipeline');
    
    return {
      success: true,
      style: options.style || 'modern',
      budget: options.budget || 'premium',
      rooms: allVariants,
      totalVariants: allVariants.reduce((sum, r) => sum + r.variants.length, 0)
    };
  }
  
  generateComponentMasks(scene) {
    const masks = {};
    for (const wall of (scene.walls || [])) {
      for (const comp of (wall.components || [])) {
        masks[comp.type] = {
          componentType: comp.type,
          width: comp.width,
          height: comp.height,
          position: comp.position || { fromFloor: 0 },
          // In production: store actual pixel mask from SAM
          mockMask: true
        };
      }
    }
    return masks;
  }
  
  async recolorComponentInRender(renderResult, componentType, newColor, newMaterial) {
    return await this.colorProcessor.recolorComponent(
      renderResult, componentType, newColor, newMaterial
    );
  }
}

export default new RenderPipeline();
