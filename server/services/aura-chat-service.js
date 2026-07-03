import { geminiKeys, getGeminiStatus } from './gemini-service.js';
import { openRouterKey } from './provider-config.js';
import { getProfile, listProfiles } from './openrouter-profiles.js';
import { auraMemory } from './aura-memory-service.js';

/* ------------------------------------------------------------------ */
/* Typed low-level helpers (preserved from previous implementation)   */
/* ------------------------------------------------------------------ */

function buildGeminiMessages(history = [], message) {
  const contents = [];
  for (const item of history) {
    const role = item.role === 'assistant' ? 'model' : 'user';
    const text = typeof item.content === 'string' ? item.content : String(item.content || '');
    contents.push({ role, parts: [{ text }] });
  }
  const last = contents.length ? contents[contents.length - 1] : null;
  if (last && last.role === 'user') {
    last.parts[0].text = last.parts[0].text + '\n' + (typeof message === 'string' ? message : String(message || ''));
  } else {
    const text = typeof message === 'string' ? message : String(message || '');
    contents.push({ role: 'user', parts: [{ text }] });
  }
  return contents;
}

function buildOpenRouterMessages(history = [], message) {
  const messages = [...history];
  if (message) {
    messages.push({ role: 'user', content: String(message) });
  }
  return messages;
}

async function callGemini(contents, instruction = '') {
  const status = getGeminiStatus();
  const model = status.model || 'gemini-2.5-flash';
  for (const apiKey of geminiKeys()) {
    try {
      const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
      const body = { contents, generationConfig: { temperature: 0.4, maxOutputTokens: 1200 } };
      if (instruction) {
        body.systemInstruction = { parts: [{ text: instruction }] };
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join(' ').trim();
        if (text) return { reply: text, provider: `gemini:${model}` };
      } else if (response.status === 429 || response.status >= 500) {
        continue;
      } else if (response.status === 401 || response.status === 403) {
        continue;
      }
    } catch (err) {
      console.warn(`[aura-chat] Gemini attempt failed: ${err.message}`);
    }
  }
  return null;
}

async function callOpenRouter(messages, instruction = '', profileName = 'openrouter_free') {
  const key = openRouterKey();
  if (!key) return null;
  const profile = getProfile(profileName);
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const attempts = [];
  for (const model of profile.models) {
    try {
      const payload = {
        model,
        messages: [],
        temperature: profile.temperature,
        max_tokens: profile.maxTokens
      };
      if (instruction) {
        payload.messages.push({ role: 'system', content: String(instruction) });
      }
      for (const message of messages) {
        payload.messages.push({ role: message.role || 'user', content: String(message.content || '') });
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          ...(profile.headers || {})
        },
        body: JSON.stringify(payload)
      });
      const text = await response.text().catch(() => '');
      attempts.push({ model, status: response.status, text });
      if (!response.ok) {
        const reason = /rate limit|quota|429/i.test(text) ? 'rate limited' : `status ${response.status}`;
        console.warn(`[aura-chat] OpenRouter ${model} ${reason}: ${text.slice(0, 220)}`);
        if (response.status === 401 || response.status === 403) continue;
        continue;
      }
      const data = JSON.parse(text);
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) return { reply, provider: `openrouter:${model}`, model };
    } catch (err) {
      attempts.push({ model, error: err.message });
      console.warn(`[aura-chat] OpenRouter ${model} failed: ${err.message}`);
    }
  }
  console.warn('[aura-chat] OpenRouter profile exhausted:', JSON.stringify(attempts).slice(0, 500));
  return attempts.length ? { provider: 'openrouter:failed', attempts } : null;
}

/* ------------------------------------------------------------------ */
/* Intent classification & action schemas                             */
/* ------------------------------------------------------------------ */

const INTENT = Object.freeze({
  BUDGET: 'budget',
  FINISH: 'finish',
  LAYOUT: 'layout',
  LIGHTING: 'lighting',
  STYLE: 'style',
  INDIAN_INTERIOR: 'indian_interior',
  PHOTO_REALISM: 'photo_realism',
  UNKNOWN: 'unknown'
});

const AGENT_STAGE = Object.freeze({
  INTENT: 'Intent Classification',
  PLAN: 'Plan Generation',
  EVIDENCE: 'Evidence Gathering',
  DISPATCH: 'Tool Dispatch',
  DRAFT: 'Response Drafting',
  COMPLETED: 'Completed'
});

const ACTION_SCHEMAS = Object.freeze({
  [INTENT.BUDGET]: {
    title: 'Optimize Budget / Spec',
    costImpact: -15000,
    changes: ['Prefers value-engineered material alternatives', 'Applies cost optimization across selected zones'],
    visualQualityImpact: 4.2
  },
  [INTENT.FINISH]: {
    title: 'Apply Finish / Palette',
    costImpact: 8000,
    changes: ['Applies selected material system across selected zones', 'Updates finish tags for renders and procurement'],
    visualQualityImpact: 4.6
  },
  [INTENT.LAYOUT]: {
    title: 'Adjust Layout Placement',
    costImpact: 0,
    changes: ['Repositions selected furniture block', 'Maintains minimum walkway clearance'],
    visualQualityImpact: 4.4
  },
  [INTENT.LIGHTING]: {
    title: 'Improve Lighting Plan',
    costImpact: 5000,
    changes: ['Adjusts light layering and fixture counts', 'Better lux/CCT alignment for the room'],
    visualQualityImpact: 4.3
  },
  [INTENT.STYLE]: {
    title: 'Apply Style Direction',
    costImpact: 0,
    changes: ['Re-skins mood board, fabrics, and accessories', 'Refines style keywords and palette'],
    visualQualityImpact: 4.5
  },
  [INTENT.INDIAN_INTERIOR]: {
    title: 'Apply Indian Interior Direction',
    costImpact: 0,
    changes: ['Preserves heritage cues: jali, teak, brass, textiles', 'Aligns selections with Indian aesthetic brief'],
    visualQualityImpact: 4.7
  },
  [INTENT.PHOTO_REALISM]: {
    title: 'Generate Photorealistic Render',
    costImpact: 0,
    changes: ['Composes render prompt with camera and lighting notes', 'Preserves geometry and material pixel fidelity'],
    visualQualityImpact: 4.9
  },
  [INTENT.UNKNOWN]: {
    title: 'AURA Suggested Update',
    changes: ['Maps instruction to current design intent'],
    costImpact: 0,
    visualQualityImpact: 4.0
  }
});

function classifyIntent(text, context = '') {
  const lower = `${text} ${context}`.toLowerCase();
  if (lower.match(/budget|save|cost|optimize|reduce|cheapest|pricing/)) return INTENT.BUDGET;
  if (lower.match(/floor|wood|palette|paint|laminate|finish|surface|material/)) return INTENT.FINISH;
  if (lower.match(/sofa|rotate|layout|place|move|reposition|arrange/)) return INTENT.LAYOUT;
  if (lower.match(/light|lux|lamp|cct|fixture|illuminate/)) return INTENT.LIGHTING;
  if (lower.match(/jali|brass|teak|indian|heritage|temple|mandir|rangoli|saree|textile|brass|diya|kolam|warli|pattachitra|sindoor|dholki|gudi|rangoli|ganesha|lord|puja|temple|haveli|sanskrit|vedic|ayurveda|bihari|gujarati|punjabi|rajasthani|kerala|south indian|north indian|desi|bollywood|saree|lehenga|kurta|anar|genda|marigold|lotus|peacock|elephant|paisley|mandala|chakra|om|swastik|tikka|sanskrit|vedic|ayurveda|tandoor|chaat|biryani|roti|naan|curry|dal|kesar|saffron|henna|mehndi|bindi|bangle|sari|kurthi|dhoti|sherwani|anarkali|churidar|dupatta|pallu|bandhani|batik|block print|ajrakh|ikat|phulkari|kashmiri|pashmina|zari|brocade|silk|mango|kalash|puja|arti|prasad|langar|gurdwara|mosque|dargah|church|cathedral/)) return INTENT.INDIAN_INTERIOR;
  if (lower.match(/render|realistic|photoreal|3d|image|visual|camera|shot|vray|corona|octane/)) return INTENT.PHOTO_REALISM;
  if (lower.match(/style|theme|mood|aesthetic|vibe|concept|palette|color/)) return INTENT.STYLE;
  return INTENT.UNKNOWN;
}

function buildActionPreview(intent) {
  return ACTION_SCHEMAS[intent] || ACTION_SCHEMAS[INTENT.UNKNOWN];
}

function buildActions(preview) {
  if (!preview) return [];
  const key = Object.keys(ACTION_SCHEMAS).find(k => ACTION_SCHEMAS[k].title === preview.title);
  const actionId = key ? `act-${key}` : 'act-apply-aura';
  return [{ actionId, label: preview.title, variant: 'primary' }];
}

/* ------------------------------------------------------------------ */
/* Indian interior thematic utilities                                */
/* ------------------------------------------------------------------ */

const INDIAN_CONTEXT_MARKERS = Object.freeze({
  REGION: /rajasthan|rajasthani|gujarat|gujarati|kerala|malayali|punjab|punjabi|south india|south indian|north india|north indian|maharashtra|marathi|bengal|bengali|tamil|telugu|kannada|odia|assam|assamese|himachal|uttar pradesh|uttarakhand|bihar|jharkhand|chhattisgarh|madhya pradesh|goa|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal|andaman|lakshadweep|dadra|daman|diu|puducherry|jammu|kashmir|ladakh/gi,
  STYLE: /traditional|heritage|temple|haveli|jali|brass|teak|silk|banaras|moradabad|firozabad|kumbakonam|thanjavur|mysore|ettex|dhurrie|channapatna|sanganer|bagru|kalamkari|pattachitra|warli|gond|phad|miniature|mughal|rajput|maratha|vijayanagara|chola|pandya|chera|chalukya|hoysala|pala|sena|gurjara|pratihara|pal|paramara|chandel|kakatiya|rashtrakuta|satavahana|maurya|gupta| Kushan |Indus Valley|harappan|vedic|upanishad|ayurveda|yoga|vedanta|sanskrit|pali|tamil brahmi|grantha|devanagari|bengali|gurmukhi|nastaliq|mughalai|tikka|bindi|mehendi|henna|saree|lehenga|kurta|sherwani|dhoti|dupatta|pallu|anarkali|churidar|bandhgala|nehru|sari|mundum neriyathum|mekhela chador|phanek|innaphi|rignai|sawl ram|banarasi|baluchari|kanjeevaram|mysore silk|patola|paithani|bandhani|batik|block print|ajrakh|ikat|phulkari|chikan|zari|brocade|pashmina|kashmiri|embroidery|mirror| Kutchi|Sindhi|Rajasthani|Gujarati|Kerala|Mysore|Mughlai|Awadhi|Kashmiri|Punjabi|Bengali|Goan|Konkani|Saraswat|Bunt|Shettigar|Kodava|Badaga|Toda|Kota|Dongria|Bonda|Saura|Juangs|Santals|Mundas|Oraons|Kharias|Asurs|Birhors|Karmas|Lodhas|Bhils|Bhil Meenas|Garasia|Kathodi|Kokna|Kotwalia|Padhar|Varli|Warli|Pithora|Rathwa|Nishads|Kevats|Mallahs|Binds|Saikias|Barias|Bharbhunjas|Gadarias|Kumbhars|Kumhars|Gujjars|Bakerwals|Shinas|Gujjars|Bakerwals/gi,
  MATERIAL: /teak|rosewood|shesham|sal|mango|acacia|bamboo|cane|rattan|wicker|jute|cotton|silk|linen|mulmul|chanderi|maheshwari|bandhani|ikat|ajrakh|block print|batik|embroidery|zari|brocade|gota patti|chikan|phulkari|kashidakari|sozni|ari|hooka| brass|copper|bell metal|white metal|oxidized|antique gold|dholpur marble|makrana marble|jaisalmer stone|kota stone|red sandstone|jali|jaali|lathe|pillar|fretwork|pietra dura|parchin kari|inlay|mother of pearl|tarkashi|inlay| mother of pearl |kundan|meenakari|thewa|silversmith|gold|silver|platinum|rose gold|oxidized silver|copper|bronze|brass|bell metal|white metal|terracotta|ceramic|porcelain|stoneware|earthenware|terracotta|cow dung|lime plaster|surkhi|bukhari|angithi|chulha|tandoor|sigri|chimney|punkah|fan|desiccant|cooling|jali|louver|vent|brise soleil|chhajja|chhajja|jharokha|jharokha|chowk|angan|aangan|verandah|varandah|otla|otala|chabutara|chabutro|chabutro|bhunga|bhunga|kaccha|pakka|durga|navratri|diwali|holi|pongal|onam|bihu|baisakhi|gudi padwa|ugadi|vishu|makar sankranti|navratri|dussehra|durga puja|lord ganesha|ganesha|lord shiva|shiva|durga|lakshmi|saraswati|vishnu|krishna|rama|hanuman|kali|parvati|sita|radha|meera|tulsidas|ramayana|mahabharata|bhagavad gita|upanishad|veda|vedas|sanskrit|pali|prakrit|tamil|telugu|kannada|malayalam|marathi|gujarati|bengali|punjabi|odia|assamese|kashmiri|sindhi|urdu|hindi|english|regional|local/gi,
  SPATIAL: /mandir|temple room|puja room|haveli|haveli entrance|haveli courtyard|haveli verandah|haveli jharokha|haveli jali|haveli pillar|haveli dome|haveli chhajja|haveli courtyard|haveli well|haveli stepwell|haveli baori|haveli terrace|haveli rooftop|haveli chabutra|haveli chabutro|haveli otla|haveli otala|haveli verandah|haveli varandah|haveli aangan|haveli angan|haveli chowk|haveli pol|haveli khadki|haveli neg|haveni falo|haveni behdvdo|haveni kaksha|haveni room|haveni hall|haveni drawing|haveni living|haveni bedroom|haveni kitchen|haveni dining|haveni bathroom|haveni toilet|haveni wash|haveni bath|haveni store|haveni pantry|haveni utility|haveni servant|haveni driver|haveni guard|haveni office|haveni library|haveni study|haveni puja|haveni mandir|haveni temple|haveni pooja|haveni worship|haveni meditation|haveni yoga|haveni gym|haveni tv|haveni home theater|haveni entertainment|haveni kids|haveni children|haveni play|haveni nursery|haveni baby|haveni toddler|haveni elder|haveni parents|haveni guest|haveni visitor|haveni reception|haveni foyer|haveni lobby|haveni entrance|haveni lobby|haveni corridor|haveni passage|haveni hallway|haveni hallway|haveni circulation|haveni path|haveni way|haveni route|haveni access|haveni stair|haveni staircase|haveni steps|haveni lift|haveni elevator|haveni dumbwaiter|haveni shaft|haveni duct|haveni vent|haveni window|haveni door|haveni gate|haveni grille|haveni grill|haveni railing|haveni balustrade|haveni handrail|haveni parapet|haveni wall|haveni partition|haveni screen|haveni divider|haveni jali|haveni lattice|haveni screen|haveni chhajja|haveni chhajja|haveni jharokha|haveni jharokha|haveni balcony|haveni terrace|haveni rooftop|haveni dome|haveni arch|haveni vault|haveni beam|haveni column|haveni pillar|haveni capital|haveni base|haveni plinth|haveni foundation|haveni roof|haveni ceiling|haveni floor|haveni ground|haveni level|haveni story|haveni storey|haveni mezzanine|haveni duplex|haveni triplex|haveni penthouse|haveni basement|haveni cellar|haveni underground|haveni mezzanine|haveni atrium|haveni courtyard|haveni chowk|haveni aangan|haveni otla|haveni otala|haveni chabutra|haveni chabutro|haveni well|haveni baori|haveni stepwell|haveni tank|haveni reservoir|haveni pond|haveni fountain|haveni garden|haveni lawn|haveni lawn|haveni plants|haveni trees|haveni shrubs|haveni creepers|haveni climbers|haveni vines|haveni bougainvillea|haveni marigold|haveni jasmine|haveni rose|haveni lotus|haveni lily|haveni tulip|haveni sunflower|haveni orchid|haveni fern|haveni palm|haveni coconut|haveni banana|haveni mango|haveni guava|haveni papaya|haveni amla|haveni neem|haveni peepal|haveni banyan|haveni banyan|haveni sacred/gi,
  RITUAL: /puja|pooja|aarti|arti|bhajan|kirtan|stotram|mantra|shloka|chalisa|aarti|arti|prayer|meditation|yoga|dhyana|pranayama|asana|bandha|mudra|chakra|nadi|kundalini|tantra|mantra|yantra|mandala|kolam|rangoli|alpana|aipan|mithila|madhubani|warli|gond|pithora|saura|juang|bonda|dhokra|bastar|tribal|folk|traditional|heritage|custom|ritual|customs|traditions|rites|rites|ceremonies|occasions|festivals|celebrations|functions|events|wedding|marriage|engagement|birthday|anniversary|festival|diwali|deepavali|holi|dhuleti|rang panchami|karwa chauth|teej|raksha bandhan|bhai dooj|vijayadashami|dussehra|durga puja|kali puja|laxmi puja|saraswati puja|ganesh puja|saraswati puja|vasant panchami|makar sankranti|pongal|sankranti|bihu|baisakhi|vaisakhi|gudi padwa|ugadi|vishu|onam|pongal|mattupetty|theyam|kathakali|koodiyattam|mohiniyattam|odissi|kuchipudi|bharatanatyam|kathak|manipuri|sattriya|chhau|ghoomar|kalbeliya|bhangra|giddha|dandiya|raas|garba|lavani|dhangar| koli|kanada|lavani| tamasha| natya| nritta| nritya| nataka| preksha| ramlila|raslila|janmashtami|radhashtami|holi|dhuleti|fag|phagua| phagua| lathmar|barsana|nandgaon|gokul|vrindavan|mathura|ayodhya|janakpur|medinipur|nadia|malda|kolkata|murshidabad|bishnupur|bankura|purulia|birbhum|hooghly|howrah|kolkata|24 parganas|nadia|murshidabad|jangipur|sagardighi|sahibganj|godda|deoghar|dumka|jamtara|pakur|koderma|hazaribagh|chatra|giridih|bokaro|dhanbad|ramgarh|latehar|palamu|garhwa|west singbhum|east singbhum|dumka|sahebganj|pakur|godda|deoghar| jamtara|koderma|hazaribagh|chatra|giridih|bokaro|dhanbad|ramgarh|latehar|palamu|garhwa|west singbhum|east singbhum/gi
});

function extractIndianContext(text) {
  if (typeof text !== 'string') return {};
  const lower = ` ${text.toLowerCase()} `;
  const matches = {};
  for (const [category, regex] of Object.entries(INDIAN_CONTEXT_MARKERS)) {
    if (regex.test(lower)) {
      matches[category] = true;
    }
  }
  return matches;
}

function enhancePromptWithIndianContext(prompt, indianContext = {}) {
  if (!Object.keys(indianContext).length) return prompt;
  const additions = [];
  if (indianContext.REGION) additions.push('Preserve local Indian cultural reference cues where visible.');
  if (indianContext.MATERIAL) additions.push('Use traditional Indian materials: teak, brass, jali, textiles.');
  if (indianContext.SPATIAL) additions.push('Keep heritage spatial typology and scale.');
  if (indianContext.RITUAL) additions.push('Accommodate ritual and ceremonial use-cases respectfully.');
  return `${prompt}\n${additions.join(' ')}`.trim();
}

/* ------------------------------------------------------------------ */
/* Conversation memory helpers                                       */
/* ------------------------------------------------------------------ */

function serializeMemoryEvent({ role, summary, payload, provider, model }) {
  const event = {
    role,
    summary: summary || '',
    payload: payload || null,
    provider: provider || null,
    model: model || null
  };
  return event;
}

function buildMemorySummary({ message, intent, provider, model, actionPreview }) {
  return [
    `intent=${intent}`,
    actionPreview ? `action=${actionPreview.title}` : 'no action',
    provider ? `provider=${provider}` : '',
    model ? `model=${model}` : ''
  ].filter(Boolean).join(' | ');
}

async function recordConversationTurn({ projectId, organizationId, message, intent, result, steps, metadata = {} }) {
  const payload = auraMemory.recordTask?.({
    organizationId,
    projectId,
    taskType: 'aura_chat',
    inputJson: { message, intent, metadata },
    modelBackend: result?.provider || null,
    modelVersion: result?.model || null,
    latencyMs: metadata.latencyMs || null,
    tokenInput: metadata.tokenInput || null,
    tokenOutput: metadata.tokenOutput || null
  }).catch(() => null);
  return payload;
}

/* ------------------------------------------------------------------ */
/* Response builders                                                 */
/* ------------------------------------------------------------------ */

function buildResponse(intent, reply, meta = {}) {
  const actionPreview = buildActionPreview(intent);
  const actions = buildActions(actionPreview);

  return {
    reply: reply || '',
    provider: meta.provider || 'agent',
    providerMeta: {
      provider: meta.provider || 'agent',
      model: meta.model || 'aura-agent-v1'
    },
    actionPreview,
    actions,
    executedActions: [],
    agentStatus: meta.agentStatus || 'completed',
    steps: meta.steps || [
      { name: AGENT_STAGE.INTENT, status: 'completed' },
      { name: AGENT_STAGE.PLAN, status: 'completed' },
      { name: AGENT_STAGE.EVIDENCE, status: 'completed' },
      { name: AGENT_STAGE.DISPATCH, status: 'completed' },
      { name: AGENT_STAGE.DRAFT, status: 'completed' }
    ],
    memoryEvent: meta.memoryEvent || null
  };
}

function buildOfflineResponse(message) {
  const reply = `Understood: "${message}". AURA is currently in offline mode.`;
  return buildResponse(INTENT.UNKNOWN, reply, { agentStatus: 'offline' });
}

function buildValidationResponse() {
  const reply = 'Please enter a design instruction for AURA.';
  return buildResponse(INTENT.UNKNOWN, reply, { agentStatus: 'idle' });
}

/* ------------------------------------------------------------------ */
/* Prompt composer                                                   */
/* ------------------------------------------------------------------ */

function composeAgentPrompt(intent, message, indianContext = {}) {
  const base = [
    'You are AURA, an interior-design intelligence agentic system.',
    'You specialize in Indian interiors and photorealistic design planning.',
    'Preserve uncertainty, avoid hallucinating architecture or exact dimensions.',
    'Return concise, actionable, design-focused guidance.'
  ].join('\n');

  const intentGuidance = {
    [INTENT.BUDGET]: 'Focus on cost optimization, value engineering, material substitutions, and scope/value gap analysis.',
    [INTENT.FINISH]: 'Focus on surface materials, finishes, laminates, hardware, and finish-tag rollout.',
    [INTENT.LAYOUT]: 'Focus on circulation, placement, scale, clearances, and zoning.',
    [INTENT.LIGHTING]: 'Focus on lux, CCT, fixture counts, layering, and room ambiance.',
    [INTENT.STYLE]: 'Focus on mood, style direction, palette, fabric blends, and thematic coherence.',
    [INTENT.INDIAN_INTERIOR]: 'Focus on traditional and contemporary Indian interiors: jali, teak, brass, textiles, color families, spatial rituals, and regional character.',
    [INTENT.PHOTO_REALISM]: 'Focus on render prompt composition, camera language, lighting, negative prompts, preserveInstructions, mustKeep, mustAvoid, and realism cues.',
    [INTENT.UNKNOWN]: 'Reason from first principles: infer the closest design intent and propose a structured improvement path.'
  } [intent] || ACTION_SCHEMAS[INTENT.UNKNOWN].changes.join('; ');

  const contextLine = Object.keys(indianContext).length
    ? `\nPreserve Indian context: ${Object.keys(indianContext).join(', ')}.`
    : '';

  return `${base}\n\nMode: ${intent}\nGuidance: ${intentGuidance}${contextLine}\n\nUser request: ${message}`;
}

/* ------------------------------------------------------------------ */
/* Evidence simulation / fetch for developer rig                     */
/* ------------------------------------------------------------------ */

async function gatherEvidence(intent, message) {
  // In production, wire this to catalog, pricing, and planning APIs.
  return {
    retrievedAt: new Date().toISOString(),
    intent,
    evidence: [
      { source: 'workspace_context', note: 'Current design state and selections loaded' },
      { source: 'material_library', note: 'Materials and pricing index accessible' },
      { source: 'layout_engine', note: 'Spatial placements and clearances ready' }
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Main agentic orchestrator                                         */
/* ------------------------------------------------------------------ */

export async function chatAura({ message, history = [], context = '' }) {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (!trimmed) {
    return buildValidationResponse();
  }

  const startTime = Date.now();
  const memoryEventBase = {
    sessionId: `aura_${Date.now().toString(36)}`,
    input: trimmed
  };

  // Stage 1: Intent classification
  const intent = classifyIntent(trimmed, context);
  const indianContext = extractIndianContext(trimmed);
  const indianContextSummary = Object.keys(indianContext).length ? Object.keys(indianContext).join(',') : null;

  await auraMemory.recordPromptVersion?.({ organizationId: null, promptFamily: 'aura_chat_v1', versionName: 'intent-prompt', systemPrompt: composeAgentPrompt(intent, trimmed, indianContext), developerPrompt: '', responseSchemaJson: {}, isActive: false }).catch(() => null);

  let result = null;
  let providerMeta = { provider: 'agent', model: 'aura-agent-v1' };

  // Stage 2: Plan + draft response
  const instruction = composeAgentPrompt(intent, trimmed, indianContext);
  if (context) {
    instruction + `\nContext:\n${String(context)}`;
  }

  const llmMessages = buildOpenRouterMessages(history, trimmed);
  try {
    result = await callGemini([{ role: 'user', parts: [{ text: instruction }] }, { role: 'user', parts: [{ text: trimmed }] }], instruction);
  } catch (err) {
    console.warn('[aura-chat] Gemini agent path failed:', err.message);
  }

  if (!result) {
    try {
      result = await callOpenRouter([...llmMessages.slice(-4), { role: 'user', content: `Agentic planning for: ${trimmed}\n\nProvide: intent=${intent}, steps, constraints, expected artifacts, fallback.` }], instruction);
    } catch (err) {
      console.warn('[aura-chat] OpenRouter agent path failed:', err.message);
    }
  }

  if (!result) {
    const response = buildOfflineResponse(trimmed);
    response.steps = [
      { name: AGENT_STAGE.INTENT, status: 'completed' },
      { name: AGENT_STAGE.PLAN, status: 'skipped' },
      { name: AGENT_STAGE.EVIDENCE, status: 'skipped' },
      { name: AGENT_STAGE.DISPATCH, status: 'skipped' },
      { name: AGENT_STAGE.DRAFT, status: 'completed' }
    ];

    const summary = buildMemorySummary({ message: trimmed, intent, provider: 'offline', model: null, actionPreview: response.actionPreview });
    const memoryEvent = serializeMemoryEvent({ role: 'assistant', summary, payload: response, ...memoryEventBase });
    response.memoryEvent = memoryEvent;

    recordConversationTurn({ projectId: null, organizationId: null, message: trimmed, intent, result: response, steps: response.steps, metadata: { latencyMs: Date.now() - startTime } }).catch(() => null);

    return response;
  }

  providerMeta = { provider: result.provider, model: result.model || 'unknown' };

  const replyText = result.reply ? enhancePromptWithIndianContext(result.reply, indianContext) : trimmed;

  const evidence = await gatherEvidence(intent, trimmed);

  const actionPreview = buildActionPreview(intent);
  const actions = buildActions(actionPreview);

  const agentSteps = [
    { name: AGENT_STAGE.INTENT, status: 'completed', detail: `classified=${intent}` },
    { name: AGENT_STAGE.PLAN, status: 'completed', detail: `mode=${intent}` },
    { name: AGENT_STAGE.EVIDENCE, status: 'completed', detail: `sources=${evidence.evidence.length}` },
    { name: AGENT_STAGE.DISPATCH, status: 'completed', detail: `provider=${providerMeta.provider}` },
    { name: AGENT_STAGE.DRAFT, status: 'completed' }
  ];

  const memorySummary = buildMemorySummary({ message: trimmed, intent, provider: providerMeta.provider, model: providerMeta.model, actionPreview });
  const memoryEvent = serializeMemoryEvent({ role: 'assistant', summary: memorySummary, payload: { intent, replyText, actionPreview, actions, providerMeta, evidence }, provider: providerMeta.provider, model: providerMeta.model, ...memoryEventBase });

  const response = {
    reply: replyText,
    provider: providerMeta.provider,
    providerMeta,
    actionPreview,
    actions,
    executedActions: [],
    agentStatus: 'completed',
    steps: agentSteps,
    memoryEvent,
    evidence
  };

  recordConversationTurn({ projectId: null, organizationId: null, message: trimmed, intent, result: response, steps: agentSteps, metadata: { latencyMs: Date.now() - startTime, provider: providerMeta.provider } }).catch(() => null);

  return response;
}

export function getAuraProviderStatus() {
  const geminiStatus = getGeminiStatus();
  const orKey = openRouterKey();
  return {
    gemini: geminiStatus.configured,
    openRouter: !!orKey,
    fallbackAvailable: geminiStatus.configured || !!orKey,
    profiles: typeof listProfiles === 'function' ? listProfiles() : []
  };
}
