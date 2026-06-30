// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Floor Plan Understanding Engine — Gemini Vision API Edition
// ============================================================
// Replaces TensorFlow/canvas approach with Google Gemini Vision
// for reliable, production-ready floor plan analysis.

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ---- Gemini API client ----
async function callGeminiVision(imagePath, prompt) {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_2,
    process.env.GOOGLE_AI_STUDIO_KEY_1
  ].filter(Boolean);
  if (!apiKeys.length) {
    throw new Error('No Gemini API key found in environment (GOOGLE_AI_STUDIO_KEY_2 or GOOGLE_AI_STUDIO_KEY_1)');
  }

  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  // Detect MIME type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Image } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    }
  };

  for (const apiKey of apiKeys) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`Gemini API error ${response.status}: ${text.slice(0, 120)}`);
      continue;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty Gemini response');
    
    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error('Could not parse Gemini JSON response: ' + content.slice(0, 200));
    }
  }

  throw new Error('All configured Gemini vision keys failed');
}

// ---- Fallback analysis when Gemini is unavailable ----
function buildFallbackAnalysis(imagePath, options = {}) {
  const style = options.style || 'modern';
  const budget = options.budget || 'premium';
  
  // Default Indian 3BHK layout
  const rooms = [
    {
      id: 'room-1', name: 'Living Room', type: 'living',
      areaSqFt: 252, dimensionsMm: { width: 5100, length: 4800, height: 2750 },
      confidence: 0.7
    },
    {
      id: 'room-2', name: 'Master Bedroom', type: 'bedroom',
      areaSqFt: 180, dimensionsMm: { width: 4200, length: 3900, height: 2750 },
      confidence: 0.7
    },
    {
      id: 'room-3', name: 'Bedroom 2', type: 'bedroom',
      areaSqFt: 140, dimensionsMm: { width: 3600, length: 3600, height: 2750 },
      confidence: 0.65
    },
    {
      id: 'room-4', name: 'Modular Kitchen', type: 'kitchen',
      areaSqFt: 108, dimensionsMm: { width: 3300, length: 3000, height: 2750 },
      confidence: 0.7
    },
    {
      id: 'room-5', name: 'Dining Area', type: 'dining',
      areaSqFt: 90, dimensionsMm: { width: 3000, length: 2700, height: 2750 },
      confidence: 0.65
    },
    {
      id: 'room-6', name: 'Pooja Room', type: 'pooja',
      areaSqFt: 36, dimensionsMm: { width: 1800, length: 1800, height: 2750 },
      confidence: 0.6
    },
    {
      id: 'room-7', name: 'Foyer', type: 'foyer',
      areaSqFt: 54, dimensionsMm: { width: 2400, length: 2100, height: 2750 },
      confidence: 0.6
    }
  ];
  
  const components = [
    { type: 'TV Unit', moduleType: 'tv-unit', roomName: 'Living Room', roomId: 'room-1', confidence: 0.85, suggestedDimensions: { width: 2400, height: 450, depth: 400 } },
    { type: 'Sofa', moduleType: 'sofa', roomName: 'Living Room', roomId: 'room-1', confidence: 0.8, suggestedDimensions: { width: 2400, height: 850, depth: 800 } },
    { type: 'Wardrobe', moduleType: 'wardrobe', roomName: 'Master Bedroom', roomId: 'room-2', confidence: 0.85, suggestedDimensions: { width: 2400, height: 2400, depth: 600 } },
    { type: 'Bed', moduleType: 'bed', roomName: 'Master Bedroom', roomId: 'room-2', confidence: 0.9, suggestedDimensions: { width: 1800, height: 200, depth: 2100 } },
    { type: 'Kitchen Run', moduleType: 'counter', roomName: 'Modular Kitchen', roomId: 'room-4', confidence: 0.85, suggestedDimensions: { width: 2700, height: 850, depth: 600 } },
    { type: 'Pooja Unit', moduleType: 'pooja-unit', roomName: 'Pooja Room', roomId: 'room-6', confidence: 0.8, suggestedDimensions: { width: 900, height: 1800, depth: 350 } }
  ];
  
  return {
    success: true,
    source: 'fallback',
    rooms, components,
    walls: [
      { type: 'exterior', length: 5100, thickness: 230 },
      { type: 'exterior', length: 4800, thickness: 230 },
      { type: 'interior', length: 3600, thickness: 115 },
      { type: 'interior', length: 4200, thickness: 115 }
    ],
    confidence: 65,
    style, budget,
    whatAiUnderstood: 'Fallback analysis: Standard 3BHK Indian residential layout with living, kitchen, bedrooms, dining, pooja, and foyer. Upload a clearer floor plan for accurate analysis.',
    nextDesignerActions: [
      'Review room dimensions for accuracy',
      'Mark TV unit and wardrobe positions on floor plan',
      'Confirm kitchen layout orientation',
      'Add site-specific notes for vastu compliance'
    ],
    constraints: { warnings: ['Analysis is a fallback estimate — upload a clearer floor plan for best results'] }
  };
}

function buildAdvisoryOnlyAnalysis(imagePath, options = {}, reason = 'Vision analysis unavailable') {
  const style = options.style || 'modern';
  const budget = options.budget || 'premium';
  return {
    success: true,
    source: 'advisory-only',
    rooms: [],
    components: [],
    walls: [],
    confidence: 18,
    style,
    budget,
    whatAiUnderstood: `${reason}. No rooms or components were inferred. Add manual room zones, furniture markers, and one calibration dimension before generating precision renders.`,
    nextDesignerActions: [
      'Draw room zones on the uploaded plan',
      'Mark TV Unit, Sofa, Kitchen Run, Wardrobe, Mandir, Door, and Window positions where relevant',
      'Enter one known wall length or room dimension for scale calibration',
      'Run analysis again before creating client-facing renders'
    ],
    constraints: { warnings: [reason], advisoryOnly: true },
    sourceLabels: ['inferred: none', 'confirmed: manual annotations required']
  };
}

// ---- Main Floor Plan Analysis via Gemini Vision ----
class FloorPlanUnderstandingEngine {
  async analyze(imagePath, options = {}) {
    const startTime = Date.now();
    console.log('[FP Engine] Starting analysis:', imagePath);
    
    // Check if we have a Gemini API key
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY_2 || process.env.GOOGLE_AI_STUDIO_KEY_1;
    
    if (!apiKey) {
      console.warn('[FP Engine] No Gemini API key - analysis requires manual annotations');
      return buildAdvisoryOnlyAnalysis(imagePath, options, 'No Gemini vision key is configured');
    }
    
    // Check file exists and is readable
    if (!fs.existsSync(imagePath)) {
      throw new Error('Floor plan image not found: ' + imagePath);
    }
    
    // For PDFs, we'd need conversion - for now return fallback
    const ext = path.extname(imagePath).toLowerCase();
    if (ext === '.pdf') {
      console.warn('[FP Engine] PDF files require first-page raster preview before vision analysis');
      return buildAdvisoryOnlyAnalysis(imagePath, options, 'PDF preview/raster analysis is not available for this upload');
    }
    
    // Resize image for Gemini (max 4MB inline data)
    let processedPath = imagePath;
    try {
      const metadata = await sharp(imagePath).metadata();
      if (metadata.width > 2048 || metadata.height > 2048) {
        processedPath = imagePath + '.resized.jpg';
        await sharp(imagePath)
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(processedPath);
      }
    } catch (err) {
      console.warn('[FP Engine] Image resize failed, using original:', err.message);
    }
    
    const prompt = `You are an expert Indian interior design consultant specializing in residential floor plan analysis.

Analyze this floor plan image and extract all spatial information. The floor plan is for an Indian residential property (likely 2BHK or 3BHK apartment).

Return ONLY valid JSON with this exact structure:
{
  "rooms": [
    {
      "id": "room-1",
      "name": "Living Room",
      "type": "living",
      "areaSqFt": 250,
      "dimensionsMm": { "width": 5000, "length": 4800, "height": 2750 },
      "confidence": 0.85,
      "notes": "L-shaped with balcony access"
    }
  ],
  "components": [
    {
      "type": "TV Unit",
      "moduleType": "tv-unit",
      "roomName": "Living Room",
      "roomId": "room-1",
      "confidence": 0.85,
      "suggestedDimensions": { "width": 2400, "height": 450, "depth": 400 }
    }
  ],
  "walls": [
    { "type": "exterior", "length": 5000, "thickness": 230 },
    { "type": "interior", "length": 3600, "thickness": 115 }
  ],
  "confidence": 82,
  "whatAiUnderstood": "Clear description of what was found in the floor plan",
  "nextDesignerActions": ["Action 1", "Action 2"],
  "constraints": {
    "warnings": ["Any warnings about the floor plan"]
  },
  "scaleFactor": "1px = 10mm (estimated)"
}

Rules:
- Identify ALL rooms: living, kitchen, bedrooms, bathrooms, pooja/mandir, foyer, balcony, utility, dining
- For rooms: estimate area in sq.ft and dimensions in millimetres (Indian standard)
- For components: identify TV units, sofas, beds, wardrobes, kitchen counters, dining tables, pooja units
- Set confidence 0.5-0.99 based on how clear the plan is
- Overall confidence 50-99%
- Style context: ${options.style || 'modern'}
- Budget context: ${options.budget || 'premium'}
- If you cannot read the plan clearly, return empty rooms/components with confidence below 35 and explain which manual annotations are required

Respond with ONLY the JSON object, no markdown, no explanation.`;

    try {
      const result = await callGeminiVision(processedPath, prompt);
      
      // Clean up resized file
      if (processedPath !== imagePath && fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }
      
      // Ensure required fields
      const rooms = (result.rooms || []).map((r, i) => ({
        id: r.id || `room-${i+1}`,
        name: r.name || `Room ${i+1}`,
        type: r.type || 'room',
        areaSqFt: r.areaSqFt || 100,
        dimensionsMm: r.dimensionsMm || { width: 3000, length: 3000, height: 2750 },
        confidence: r.confidence || 0.7,
        notes: r.notes || ''
      }));
      
      const components = (result.components || []).map(c => ({
        type: c.type || 'Component',
        moduleType: c.moduleType || 'generic',
        roomName: c.roomName || rooms[0]?.name || 'Living Room',
        roomId: c.roomId || rooms[0]?.id || 'room-1',
        confidence: c.confidence || 0.7,
        suggestedDimensions: c.suggestedDimensions || { width: 1200, height: 600, depth: 400 }
      }));
      
      const processingTime = Date.now() - startTime;
      console.log(`[FP Engine] Analysis complete in ${processingTime}ms - ${rooms.length} rooms, ${components.length} components`);
      
      return {
        success: true,
        source: 'gemini-vision',
        processingTime,
        rooms,
        components,
        walls: result.walls || [],
        confidence: result.confidence || 75,
        whatAiUnderstood: result.whatAiUnderstood || 'Floor plan analyzed successfully.',
        nextDesignerActions: result.nextDesignerActions || [],
        constraints: result.constraints || { warnings: [] },
        scaleFactor: result.scaleFactor || '1px ≈ 10mm (estimated)',
        spatialGraph: {
          rooms: rooms.map(r => ({ id: r.id, name: r.name, area: r.areaSqFt })),
          adjacency: [],
          circulation: []
        },
        dimensions: {
          scale: { pixelsPerMm: 0.1, confirmedBy: 'gemini-vision' },
          unit: 'mm',
          rooms: rooms
        }
      };
      
    } catch (err) {
      console.error('[FP Engine] Gemini analysis failed:', err.message);
      
      // Clean up resized file
      if (processedPath !== imagePath && fs.existsSync(processedPath)) {
        try { fs.unlinkSync(processedPath); } catch {}
      }
      
      return buildAdvisoryOnlyAnalysis(imagePath, options, `Gemini analysis failed: ${err.message}`);
    }
  }
  
  calculateOverallConfidence(walls, rooms, components) {
    const roomConf = rooms?.length > 0 ? 0.85 : 0;
    const compConf = components?.length > 0 ? 0.75 : 0;
    return Math.round((roomConf * 0.6 + compConf * 0.4) * 100);
  }
}

export default new FloorPlanUnderstandingEngine();
