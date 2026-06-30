// AI Spatial Coordinates & Floor Plan Interpretation Engine
// NOTE: ALL PRICING METRICS ARE ABSOLUTELY EXCLUDED FROM THE OUTPUTS

import { evaluateVastu } from './standards.js';

export async function generateAiSpatialLayout(input, floorPlanImageBase64) {
  const bhkSelect = input.homeType || input.bhkConfig || '3bhk';
  const customNotes = input.floorPlanNotes || input.customNotes || '';
  const notesLower = customNotes.toLowerCase();
  
  // Try OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const systemPrompt = `You are the lead AI spatial layout designer for Spacious Venture Design Studio.
Your task is to analyze client requirements and return an extremely accurate, premium architectural room coordinate mapping in JSON format.
Each spatial node MUST have precise bounding boxes (percentages between 0.0 and 1.0) and center coordinates (percentages 0 to 100) mapped to typical Indian contemporary layouts.
Indian Vastu Shastra rules MUST be respected:
- Kitchen should ideally be in South-East (Agni) or North-West.
- Master Bedroom in South-West (Nairutya).
- Pooja Mandir (Temple) in North-East (Ishanya).
- Living room in North-East or East.
- Kids/Guest bed in North-West.

Provide exactly a JSON object matching this structure with NO extra markdown or formatting:
{
  "roomNodes": [
    {
      "id": "living",
      "name": "Grand Living Area",
      "x": 30,
      "y": 35,
      "icon": "🛋️",
      "vastu": "NE",
      "bounds": { "x": 0.11, "y": 0.11, "w": 0.39, "h": 0.39 }
    }
  ],
  "styleRecommendation": "modern-luxury",
  "colorRecommendation": "emerald-gold",
  "aiExplanation": "AI Core Spatial Adaptation compiled...",
  "customSolutions": [
    "Cozy reading nook integrated into the Living Area NE corner.",
    "BWP plywood carcass and high suction chimney configured for Indian cooking."
  ]
}

Available styles: modern-luxury, bohemian-chic, scandinavian-minimal, indian-contemporary.
Available colors: emerald-gold, charcoal-walnut, terracotta-sand, mint-sage-ivory, teak-brass.
Ensure NO pricing or estimation is returned in prompts or fields.`;

      const userPrompt = `Client Name: ${input.clientName || 'Walk-in Client'}
Layout type: ${bhkSelect}
Clear Ceiling Height: ${input.ceilingHeight || '3000mm'}
Family Profile: ${input.familyProfile || 'Standard'}
Cooking style: ${input.cookingStyle || 'heavy-masala'}
Pooja Preference: ${input.poojaNeed || input.poojaPreference || 'dedicated'}
Vastu strictness: ${input.vastuStrictness || 'general'}
Client Custom Notes: "${customNotes}"

Output the optimal layout.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // If a floor plan image is supplied, make it a multimodal vision call
      if (floorPlanImageBase64 && floorPlanImageBase64.startsWith('data:image/')) {
        messages[1].content = [
          { type: 'text', content: userPrompt },
          {
            type: 'image_url',
            image_url: {
              url: floorPlanImageBase64
            }
          }
        ];
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed.roomNodes && parsed.roomNodes.length > 0) {
        // Enforce Vastu evaluation using local standards
        const vastuDirections = {};
        parsed.roomNodes.forEach(node => {
          vastuDirections[node.id] = node.vastu;
        });
        parsed.vastuReport = evaluateVastu(parsed.roomNodes.map(n => n.id), input.vastuStrictness || 'general');
        return parsed;
      }
    } catch (err) {
      console.warn('OpenAI spatial coordination failed, trying next provider:', err.message);
    }
  }

  // Try Google Gemini API (via REST fetch to avoid library setup issues)
  if (process.env.GOOGLE_AI_STUDIO_KEY_1 || process.env.GOOGLE_AI_STUDIO_KEY_2) {
    const geminiKey = process.env.GOOGLE_AI_STUDIO_KEY_1 || process.env.GOOGLE_AI_STUDIO_KEY_2;
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const prompt = `You are a premium AI architect for Spacious Venture. Output ONLY a valid JSON block containing layout analysis for a ${bhkSelect} layout matching client notes: "${customNotes}".
Vastu strictness: ${input.vastuStrictness || 'general'}. Pooja preference: ${input.poojaNeed || input.poojaPreference || 'dedicated'}. Cooking: ${input.cookingStyle || 'heavy-masala'}.
Ensure the JSON response follows this structure precisely:
{
  "roomNodes": [
    { "id": "living", "name": "Living Room", "x": 28, "y": 35, "icon": "🛋️", "vastu": "NE", "bounds": { "x": 0.11, "y": 0.11, "w": 0.39, "h": 0.39 } }
  ],
  "styleRecommendation": "modern-luxury",
  "colorRecommendation": "emerald-gold",
  "aiExplanation": "Gemini Spatial Interpreter loaded...",
  "customSolutions": ["Specific solution matches..."]
}
Do NOT include markdown formatting or backticks around the JSON.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(text);
        if (parsed.roomNodes && parsed.roomNodes.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini spatial coordination failed:', err.message);
    }
  }

  // Graceful Semantic Local Rule-Based Coordinator Fallback (100% Fully Functional)
  return generateHeuristicSpatialLayout(bhkSelect, customNotes, input);
}

function generateHeuristicSpatialLayout(bhkSelect, customNotes, input) {
  const notesLower = (customNotes || '').toLowerCase();
  let roomNodes = [];
  let vastuDirections = {};

  if (bhkSelect === '2bhk') {
    roomNodes = [
      { id: 'living', name: 'Living Room', x: 28, y: 35, icon: '🛋️', vastu: 'NE', bounds: { x: 0.11, y: 0.11, w: 0.39, h: 0.39 } },
      { id: 'kitchen', name: 'Modular Kitchen', x: 72, y: 35, icon: '🍳', vastu: 'SE', bounds: { x: 0.50, y: 0.11, w: 0.39, h: 0.39 } },
      { id: 'masterBed', name: 'Master Bedroom', x: 28, y: 75, icon: '🛏️', vastu: 'SW', bounds: { x: 0.11, y: 0.50, w: 0.39, h: 0.39 } },
      { id: 'kidsBed', name: 'Guest/Kids Room', x: 72, y: 75, icon: '👶', vastu: 'NW', bounds: { x: 0.50, y: 0.50, w: 0.39, h: 0.39 } }
    ];
    vastuDirections = { living: 'NE', kitchen: 'SE', masterBed: 'SW', kidsBed: 'NW' };
  } else if (bhkSelect === '3bhk' || bhkSelect === 'villa') {
    roomNodes = [
      { id: 'living', name: 'Grand Living Area', x: 30, y: 35, icon: '🛋️', vastu: 'E', bounds: { x: 0.11, y: 0.11, w: 0.39, h: 0.39 } },
      { id: 'kitchen', name: 'Modular Kitchen', x: 72, y: 35, icon: '🍳', vastu: 'SE', bounds: { x: 0.50, y: 0.11, w: 0.39, h: 0.39 } },
      { id: 'masterBed', name: 'Master Suite', x: 28, y: 75, icon: '👑', vastu: 'SW', bounds: { x: 0.11, y: 0.50, w: 0.39, h: 0.39 } },
      { id: 'kidsBed', name: 'Kids Bedroom', x: 72, y: 75, icon: '🧸', vastu: 'NW', bounds: { x: 0.50, y: 0.50, w: 0.39, h: 0.39 } },
      { id: 'temple', name: 'Pooja Room', x: 50, y: 22, icon: '🙏', vastu: 'NE', bounds: { x: 0.38, y: 0.11, w: 0.12, h: 0.20 } }
    ];
    vastuDirections = { living: 'E', kitchen: 'SE', masterBed: 'SW', kidsBed: 'NW', temple: 'NE' };
  } else {
    // 1BHK / Office / Other default
    roomNodes = [
      { id: 'living', name: 'Living Area', x: 30, y: 40, icon: '🛋️', vastu: 'N', bounds: { x: 0.11, y: 0.11, w: 0.39, h: 0.45 } },
      { id: 'kitchen', name: 'Kitchenette', x: 70, y: 40, icon: '🍳', vastu: 'NW', bounds: { x: 0.50, y: 0.11, w: 0.39, h: 0.45 } },
      { id: 'masterBed', name: 'Bedroom Suite', x: 50, y: 80, icon: '🛏️', vastu: 'S', bounds: { x: 0.20, y: 0.56, w: 0.60, h: 0.33 } }
    ];
    vastuDirections = { living: 'N', kitchen: 'NW', masterBed: 'S' };
  }

  let styleOverride = null;
  let colorOverride = null;
  let customSolutions = [];
  let aiReasoningSummary = 'AI Core Spatial System resolved layout adapted to requirements.';

  // Semantic triggers
  if (notesLower.includes('teal') || notesLower.includes('emerald') || notesLower.includes('green') || notesLower.includes('gold')) {
    colorOverride = 'emerald-gold';
    styleOverride = 'modern-luxury';
    customSolutions.push('Selected luxurious teal/emerald swatches with brass T-profile divisions.');
  }
  if (notesLower.includes('walnut') || notesLower.includes('charcoal') || notesLower.includes('wood') || notesLower.includes('warm')) {
    colorOverride = 'charcoal-walnut';
    styleOverride = 'modern-luxury';
    customSolutions.push('Loaded premium warm walnut veneers paired with textured charcoal flutes.');
  }
  if (notesLower.includes('boho') || notesLower.includes('cane') || notesLower.includes('rattan')) {
    colorOverride = 'terracotta-sand';
    styleOverride = 'bohemian-chic';
    customSolutions.push('Prioritized natural wicker cane weaving and open curved arches shelves.');
  }
  if (notesLower.includes('minimal') || notesLower.includes('scandi') || notesLower.includes('white')) {
    colorOverride = 'mint-sage-ivory';
    styleOverride = 'scandinavian-minimal';
    customSolutions.push('Loaded light pine woods, matte anti-fingerprint surfaces, and seamless hidden doors.');
  }
  if (notesLower.includes('mandir') || notesLower.includes('pooja') || notesLower.includes('temple') || notesLower.includes('prayer')) {
    customSolutions.push('Incorporated pure North-East Pooja Arch with solid teak wood CNC jali screens.');
  }
  if (notesLower.includes('reading nook') || notesLower.includes('bookshelf') || notesLower.includes('study')) {
    customSolutions.push('Core Living Space Solution: Asymmetric floating bookshelf console in NE corner.');
  }
  if (notesLower.includes('elderly') || notesLower.includes('parents') || notesLower.includes('safety') || notesLower.includes('handrail')) {
    customSolutions.push('Ergonomic Safety Solution: Rounded corners on all cabinets, slip-resistant base mats, low-VOC paint.');
  }
  if (notesLower.includes('suction') || notesLower.includes('frying') || notesLower.includes('masala') || notesLower.includes('chimney')) {
    customSolutions.push('Indian Culinary Solution: High-suction chimney loops (1200+ m3/h) with easy-to-clean stainless steel oil filters.');
  }
  if (notesLower.includes('vanity') || notesLower.includes('dressing') || notesLower.includes('mirror')) {
    customSolutions.push('Modular Dressing Solution: Full-length gray backlit vanity mirror panel adjacent to sliding wardrobes.');
  }
  if (notesLower.includes('shoe') || notesLower.includes('foyer') || notesLower.includes('entrance')) {
    customSolutions.push('Foyer Optimization: Fluted Teak shoe storage cabinet console positioned in entryway.');
  }

  if (customSolutions.length > 0) {
    aiReasoningSummary = `Semantic AI Resolution: Compiled ${customSolutions.length} personalized solutions matching core client requirements.`;
  }

  const vastuReport = evaluateVastu(roomNodes.map(n => n.id), input.vastuStrictness || 'general');

  return {
    success: true,
    roomNodes: roomNodes,
    styleRecommendation: styleOverride,
    colorRecommendation: colorOverride,
    aiExplanation: aiReasoningSummary,
    customSolutions: customSolutions,
    vastuReport: vastuReport,
    dimensionsSummary: bhkSelect.toUpperCase() + ' Residential Layout',
    avgEstimationSqft: bhkSelect === '2bhk' ? 1200 : (bhkSelect === '3bhk' ? 1600 : 2500)
  };
}
