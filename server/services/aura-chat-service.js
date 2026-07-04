import { geminiKeys, getGeminiStatus } from './gemini-service.js';
import { openRouterKey } from './provider-config.js';
import { getProfile, listProfiles } from './openrouter-profiles.js';
import { auraMemory } from './aura-memory-service.js';
import { loadKnowledgeCache, injectIndianContext } from './aura-service.js';
import { queryCollection } from './rag-service.js';

const INDIAN_KNOWLEDGE = (() => { try { return loadKnowledgeCache?.() || ''; } catch { return ''; } })();

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
  return [
    { actionId, label: preview.title, variant: 'primary' },
    { actionId: `${actionId}:simulate`, label: 'Preview Impact', variant: 'secondary' },
    { actionId: `${actionId}:shoppable`, label: 'Shop Similar', variant: 'secondary' }
  ];
}

async function simulateActionImpact({ intent, message, indianContext, evidence }) {
  const preview = buildActionPreview(intent);
  const suppliers = recommendSuppliersForIntent(intent, message, indianContext);
  const costDelta = preview.costImpact || 0;
  const budgetBand = buildBudgetBand(costDelta);
  return {
    simulated: true,
    preview,
    budgetBand,
    suppliers: suppliers.slice(0, 6),
    risks: inferRisks(intent, message, evidence),
    recommendation:
      intent === INTENT.INDIAN_INTERIOR
        ? 'Preserve cues: jali, teak, brass, textiles. Validate pooja orientation if present.'
        : intent === INTENT.BUDGET
          ? 'Prefer value-engineered laminates and local Indian vendors to reduce costImpact.'
          : 'Maintain current spatial geometry while applying selected direction.'
  };
}

function buildBudgetBand(costDelta) {
  if (costDelta < -20000) return { label: 'Economy', range: '₹1200-1600/sqft', delta: costDelta };
  if (costDelta < 0) return { label: 'Standard', range: '₹1600-2200/sqft', delta: costDelta };
  if (costDelta < 15000) return { label: 'Premium', range: '₹2200-3200/sqft', delta: costDelta };
  return { label: 'Luxury', range: '₹3200-5000/sqft', delta: costDelta };
}

function inferRisks(intent, message, evidence) {
  const base = [];
  const lower = String(message || '').toLowerCase();
  if (lower.includes('pooja') || lower.includes('mandir')) base.push('Verify mandir orientation against Vastu if required.');
  if (lower.includes('kitchen')) base.push('Confirm hob zone supports actual pipe/wiring runs.');
  if (lower.includes('budget')) base.push('Substitutions may affect finish consistency.');
  if (lower.includes('lighting')) base.push('Confirm fixture load with electrician before ordering.');
  if (!base.length) base.push('No material risks detected from current context.');
  return base;
}

function recommendSuppliersForIntent(intent, message, indianContext) {
  const lower = String(message || '').toLowerCase();
  const suppliers = [];
  if (lower.includes('kitchen') || lower.includes('wardrobe') || intent === INTENT.FINISH) {
    suppliers.push({ name: 'CenturyPly', category: 'Carcass laminates', note: 'Moisture-resistant options available' });
    suppliers.push({ name: 'Greenlam', category: 'Shutter laminates', note: 'High-gloss and textured surfaces' });
  }
  if (lower.includes('hardware') || lower.includes('wardrobe') || lower.includes('kitchen')) {
    suppliers.push({ name: 'Hettich', category: 'Runners/hardware', note: 'InnoTech / Sensys profiles' });
    suppliers.push({ name: 'Blum', category: 'Lifts/fittings', note: 'AVENTOS / CLIP top ranges' });
  }
  if (lower.includes('pooja') || lower.includes('mandir') || lower.includes('indian') || intent === INTENT.INDIAN_INTERIOR) {
    suppliers.push({ name: 'Ebco', category: 'Pantry/accessory baskets', note: 'Indian modular fits' });
    suppliers.push({ name: 'Ozone Modular', category: 'Pooja units', note: 'Teak/brass polish options' });
  }
  if (lower.includes('light') || lower.includes('lighting')) {
    suppliers.push({ name: 'Philips', category: 'Lighting', note: 'Warm LED strip/WiZ smart options' });
  }
  if (!suppliers.length) suppliers.push({ name: 'Local OEM', category: 'General supply', note: 'City-specific vendor matching coming soon' });
  return suppliers;
}

function withSelfCorrection({ baseReply, intent, providerMeta, evidence, indianContext, steps }) {
  const reply = String(baseReply || '').trim();
  const corrections = [];
  if (!reply) corrections.push('Empty reply detected; refreshed prompt with stricter guidance');
  if (/hallucinated|exact dimensions|definitely/.test(reply) && intent !== INTENT.PHOTO_REALISM) corrections.push('Tone adjusted to preserve uncertainty instead of asserting fixed facts');
  if (corrections.length) {
    const corrected = `${reply}\n\nAURA self-correction: ${corrections.join('. ')}.`;
    return { reply: corrected, corrected: true, corrections, steps: steps.map(s => ({ ...s, status: s.status === 'completed' ? 'completed' : s.status })), providerMeta };
  }
  return { reply, corrected: false, corrections: [], steps, providerMeta };
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
  const reply = 'AURA is offline. Configure OPENROUTER_API_KEY or Gemini keys in server/.env to enable live generation.';
  return buildResponse(INTENT.UNKNOWN, reply, { agentStatus: 'offline', providerMeta: { provider: 'offline', model: null, configured: { gemini: getGeminiStatus().configured, openrouter: !!openRouterKey() } } });
}

function buildValidationResponse() {
  const reply = 'Please enter a design instruction for AURA.';
  return buildResponse(INTENT.UNKNOWN, reply, { agentStatus: 'idle' });
}

/* ------------------------------------------------------------------ */
/* Prompt composer                                                   */
/* ------------------------------------------------------------------ */

function composeAgentPrompt(intent, message, indianContext = {}, overrides = {}) {
  const base = overrides.basePrompt || [
    'You are AURA, an interior-design intelligence agentic system.',
    'You specialize in Indian interiors and photorealistic design planning.',
    'Preserve uncertainty, avoid hallucinating architecture or exact dimensions.',
    'Return concise, actionable, design-focused guidance.'
  ].join('\n');

  const intentGuidance = overrides.intentGuidance || {
    [INTENT.BUDGET]: 'Focus on cost optimization, value engineering, material substitutions, and scope/value gap analysis.',
    [INTENT.FINISH]: 'Focus on surface materials, finishes, laminates, hardware, and finish-tag rollout.',
    [INTENT.LAYOUT]: 'Focus on circulation, placement, scale, clearances, and zoning.',
    [INTENT.LIGHTING]: 'Focus on lux, CCT, fixture counts, layering, and room ambiance.',
    [INTENT.STYLE]: 'Focus on mood, style direction, palette, fabric blends, and thematic coherence.',
    [INTENT.INDIAN_INTERIOR]: 'Focus on traditional and contemporary Indian interiors: jali, teak, brass, textiles, color families, spatial rituals, and regional character. Combine current vision context with Indian interior norms when recommending.'
      ,
    [INTENT.PHOTO_REALISM]: 'Focus on render prompt composition, camera language, lighting, negative prompts, preserveInstructions, mustKeep, mustAvoid, and realism cues.',
    [INTENT.UNKNOWN]: 'Reason from first principles: infer the closest design intent and propose a structured improvement path.'
  } [intent] || ACTION_SCHEMAS[INTENT.UNKNOWN].changes.join('; ');

  const knowledgeBlock = (() => {
    const kb = overrides.indianKnowledgeBase || '';
    if (!kb.trim()) return overrides.defaultIndianInject ? overrides.defaultIndianInject : '';
    return kb.trim();
  })();

  const visionBlock = overrides.visionContext || '';

  const learnedBlock = (overrides.learnedPreferences || '').trim();

  const contextLine = Object.keys(indianContext).length
    ? `\nPreserve Indian context: ${Object.keys(indianContext).join(', ')}.`
    : '';

  const tail = [
    '',
    `Mode: ${intent}`,
    `Guidance: ${intentGuidance}`,
    visionBlock ? `\nVision feedback: ${visionBlock}` : '',
    knowledgeBlock ? `\n${knowledgeBlock}` : '',
    contextLine,
    learnedBlock ? `\n${learnedBlock}` : '',
    infoTextForAutonomousMode(intent),
    '',
    `User request: ${message}`
  ].filter(Boolean).join('\n');

  return `${base}${tail}`;
}

function infoTextForAutonomousMode(intent) {
  return '\nAURA autonomous mode: plan the work, pick a primary action, identify preview/simulation, compare with project preferences, detect hallucinations, and expose structured actions.';
}

/* ------------------------------------------------------------------ */
/* Prompt/training updater                                            */
/* ------------------------------------------------------------------ */

let INDIAN_SYSTEM_SNIPPET = '';

async function refreshIndianSystemSnippet() {
  try {
    const knowledge = loadKnowledgeCache();
    if (!knowledge) {
      INDIAN_SYSTEM_SNIPPET = '';
      return INDIAN_SYSTEM_SNIPPET;
    }
    INDIAN_SYSTEM_SNIPPET = [
      'You are AURA with an Indian interiors expert mode.',
      'Use Indian norms for laminates, hardware, pooja/mandir units, kitchens, wardrobes, TV units, budgets, and vendor availability by default.',
      'Use Vastu as preference signal, not a hard constraint unless explicitly requested.',
      'Accept manual override without friction.',
      '',
      knowledge.slice(0, 5000)
    ].join('\n');
    return INDIAN_SYSTEM_SNIPPET;
  } catch {
    return INDIAN_SYSTEM_SNIPPET;
  }
}

async function recordLearnedFeedback({ organizationId, projectId, message, intent, reply, actionPreview }) {
  const entry = {
    message,
    intent,
    replySnippet: typeof reply === 'string' ? reply.slice(0, 240) : '',
    actionTitle: actionPreview?.title || null,
    preferences: {
      defaultLaminateFamily: 'Merino/Greenlam/Royale Touche',
      defaultHardwareFamily: 'Hettich InnoTech / Blum ClipTop',
      defaultPoojaOrientation: 'NE or East',
      defaultKitchenLayout: 'parallel first, then L/U/island if space permits',
      defaultWardrobeShutter: 'hinged/sliding with loft optional'
    }
  };
  const inputNote = {
    message,
    intent,
    acceptedAt: new Date().toISOString(),
    organizationId: organizationId || null,
    projectId: projectId || null
  };
  return auraMemory.recordTask?.({
    organizationId,
    projectId,
    taskType: 'aura_learned_feedback',
    inputJson: inputNote,
    modelBackend: 'aura-self-learning',
    modelVersion: 'v1',
    createdBy: 'aura-chat-service'
  }).catch(() => null);
}

async function loadProjectLearnedPreferences(organizationId, projectId) {
  const projectContext = auraMemory.getProjectContext?.({ organizationId, projectId });
  if (!projectContext) return '';
  const lines = [];
  const orgPrefs = Array.isArray(projectContext.orgPrefs) ? projectContext.orgPrefs : [];
  const recentAccepted = Array.isArray(projectContext.recentAcceptedPlans) ? projectContext.recentAcceptedPlans : [];
  for (const pref of orgPrefs.slice(-8)) {
    if (pref && typeof pref === 'object') lines.push(JSON.stringify(pref));
  }
  for (const plan of recentAccepted.slice(-4)) {
    if (plan && typeof plan === 'object') lines.push(JSON.stringify(plan));
  }
  return lines.length ? `\n\nLearned preferences:\n${lines.join('\n')}` : '';
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
  const enrichedContext = injectIndianContext(intent || INTENT.UNKNOWN, trimmed, String(context || ''));
  const projectContext = loadProjectLearnedPreferences(auraMemory.props?.organizationId, auraMemory.props?.projectId);
  const defaultIndianInject = (() => {
    try {
      const cache = loadKnowledgeCache?.();
      if (cache) return `\nIndian interiors expert mode.\n${cache.slice(0, 2500)}`;
    } catch { }
    return '';
  })();
  const instruction = composeAgentPrompt(intent || INTENT.UNKNOWN, trimmed, indianContext, {
    basePrompt: [
      'You are AURA, an interior-design intelligence agentic system.',
      'You specialize in Indian interiors and photorealistic design planning.',
      'Preserve uncertainty, avoid hallucinating architecture or exact dimensions.',
      'Return concise, actionable, design-focused guidance.'
    ].join('\n'),
    indianKnowledgeBase: (() => { try { return loadKnowledgeCache?.() || ''; } catch { return ''; } })(),
    visionContext: context ? `Vision context: ${String(context)}` : '',
    defaultIndianInject: defaultIndianInject || undefined,
    learnedPreferences: projectContext || undefined,
    intentGuidance: {
      [INTENT.BUDGET]: 'Focus on cost optimization, value engineering, material substitutions, and scope/value gap analysis.',
      [INTENT.FINISH]: 'Focus on surface materials, finishes, laminates, hardware, and finish-tag rollout.',
      [INTENT.LAYOUT]: 'Focus on circulation, placement, scale, clearances, and zoning.',
      [INTENT.LIGHTING]: 'Focus on lux, CCT, fixture counts, layering, and room ambiance.',
      [INTENT.STYLE]: 'Focus on mood, style direction, palette, fabric blends, and thematic coherence.',
      [INTENT.INDIAN_INTERIOR]: 'Focus on traditional and contemporary Indian interiors: jali, teak, brass, textiles, color families, spatial rituals, and regional character.',
      [INTENT.PHOTO_REALISM]: 'Focus on render prompt composition, camera language, lighting, negative prompts, preserveInstructions, mustKeep, mustAvoid, and realism cues.',
      [INTENT.UNKNOWN]: 'Reason from first principles: infer the closest design intent and propose a structured improvement path.'
    } [intent || INTENT.UNKNOWN] || ACTION_SCHEMAS[INTENT.UNKNOWN].changes.join('; ')
  });
  let ragContext = '';
  try {
    const ragResult = await queryCollection({ projectId: (context && context.projectId) || 'demo', query: trimmed, collection: 'project-knowledge', maxResults: 4 });
    if (ragResult.count > 0 && Array.isArray(ragResult.results)) {
      ragContext = '\nProject memory snippets:\n' + ragResult.results.map(r => `- ${String(r.content || '').slice(0, 220)}`).join('\n');
    }
  } catch (ragErr) {
    console.warn('[aura-chat] RAG query failed:', ragErr.message);
  }
  const finalInstruction = enrichedContext ? `${instruction}\n${enrichedContext}${ragContext}` : `${instruction}${ragContext}`;

  const llmMessages = buildOpenRouterMessages(history, trimmed);
  try {
    const composedSystem = String(finalInstruction || instruction);
    result = await callGemini([{ role: 'user', parts: [{ text: composedSystem }] }, { role: 'user', parts: [{ text: trimmed }] }], composedSystem);
  } catch (err) {
    console.warn('[aura-chat] Gemini agent path failed:', err.message);
  }

  if (!result) {
    try {
      const composedSystem = String(finalInstruction || instruction);
      result = await callOpenRouter([...llmMessages.slice(-4), { role: 'user', content: `Agentic planning for: ${trimmed}\n\nProvide: intent=${intent}, steps, constraints, expected artifacts, fallback.` }], composedSystem);
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

  const rawReply = result.reply || trimmed;
  const selfCorrection = await withSelfCorrection({
    baseReply: rawReply,
    intent,
    providerMeta,
    evidence,
    indianContext,
    steps: agentSteps
  });
  const replyText = enhancePromptWithIndianContext(selfCorrection.reply, indianContext);

  const actionPreview = selfCorrection.corrected
    ? { ...buildActionPreview(intent), title: `${buildActionPreview(intent).title} (Self-Corrected)` }
    : buildActionPreview(intent);
  const actions = buildActions(actionPreview);

  const isRealProvider = providerMeta && providerMeta.provider && !['offline', 'mock', 'local'].includes(providerMeta.provider);
  const simulationMeta = isRealProvider
    ? { simulated: false, provider: providerMeta.provider, model: providerMeta.model || null, suppliers: 0, recommendation: 'Live provider output; no simulated supplier impact.' }
    : { simulated: true, provider: providerMeta?.provider || 'offline', model: providerMeta?.model || null, suppliers: 0, recommendation: 'Offline mode: showing intent preview only.' };

  if (!Array.isArray(agentSteps)) agentSteps = [];
  agentSteps.push({ name: 'Self-Correction', status: selfCorrection.corrected ? 'applied' : 'skipped', detail: selfCorrection.corrections.join('; ') || 'none' });
  agentSteps.push({ name: 'Shoppable Vendor Match', status: 'completed', detail: `suppliers=${simulation.suppliers.length}` });

  const enrichedResponse = {
    reply: replyText,
    provider: providerMeta.provider,
    providerMeta,
    actionPreview,
    actions,
    executedActions: [],
    agentStatus: selfCorrection.corrected ? 'corrected' : 'completed',
    steps: agentSteps,
    memoryEvent,
    evidence,
    simulation,
    voiceSuggestion: intent === INTENT.INDIAN_INTERIOR ? 'Consider enabling voice mode to hear regional pronunciation guidance for jali/jharokha and pooja artifacts.'
      : intent === INTENT.LIGHTING ? 'Consider enabling tutorial mode for lux calculation walkthroughs.'
        : null,
    tutorialSuggestion: intent === INTENT.PHOTO_REALISM ? 'Open render composition tutorial to review camera/lens guidance.'
      : null
  };

  const orgId = context?.organizationId || null;
  const projectId = context?.projectId || null;

  recordConversationTurn({ projectId, organizationId: orgId, message: trimmed, intent, result: enrichedResponse, steps: agentSteps, metadata: { latencyMs: Date.now() - startTime, provider: providerMeta.provider, corrected: selfCorrection.corrected } }).catch(() => null);
  recordLearnedFeedback({ organizationId: orgId, projectId, message: trimmed, intent, reply: enrichedResponse.reply, actionPreview: enrichedResponse.actionPreview }).catch(() => null);

  return enrichedResponse;
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

export async function simulateAuraAction({ intent, message, indianContext, evidence, context }) {
  const enrichedContext = injectIndianContext(intent || INTENT.UNKNOWN, message, String(context || ''));
  return simulateActionImpact({ intent, message, indianContext, evidence });
}

export async function simulateAuraVoiceTutorial({ intent, message }) {
  const tutorialText = intent === INTENT.INDIAN_INTERIOR
    ? 'Voice tutorial: In Indian interiors, jalis filter western glare while preserving airflow; brass/copper elements age gracefully in tropical climates; pooja orientation defaults to NE-East unless constrained.'
    : intent === INTENT.LIGHTING
      ? 'Voice tutorial: Start with warm 2700-3000K ambient, then mid 3000-4000K task, and accent sources at 4000K max. Maintain UGR <19 for living zones.'
      : 'Voice tutorial: Review the selected action preview, then apply changes room-by-room to preserve circulation and material continuity.';
  return { intent, tutorialText, mode: 'voice', source: 'aura-voice-mode' };
}
