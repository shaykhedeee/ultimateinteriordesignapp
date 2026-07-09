import { openRouterKey } from './provider-config.js';

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_1,
    process.env.GOOGLE_AI_STUDIO_KEY_2
  ].filter(Boolean);
}

export function getGeminiStatus() {
  return {
    configured: geminiKeys().length > 0,
    enabled: process.env.GEMINI_PROMPT_REFINEMENT !== 'false',
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
  };
}

async function tryRefineWithOpenRouter({ prompt, instruction }) {
  const key = openRouterKey();
  if (!key) return null;
  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Spacious Venture Studio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: instruction }],
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter status ${response.status}`);
    }
    const payload = await response.json();
    const refined = payload?.choices?.[0]?.message?.content?.trim();
    if (!refined) {
      throw new Error('OpenRouter returned empty content');
    }
    return refined;
  } catch (err) {
    console.warn('OpenRouter fallback refinement failed:', err.message);
    return null;
  }
}

export async function refineRenderPromptWithGemini({ prompt, room, style, budgetTier, layoutConstraints }) {
  const instruction = [
    'You are the final prompt editor for an Indian interior-design render studio.',
    'Rewrite the supplied image-generation prompt into one precise professional prompt.',
    'Do not remove, weaken, or contradict any floor-plan zone, component marker, furniture, material, budget, or correction rule.',
    'Do not invent dimensions, openings, furniture, or architectural elements.',
    'Preserve these non-negotiable render constraints: Lumion-like professional 3D architectural render, no humans, no human figures, no silhouettes, no mannequins, no pets, no text, no logos, no watermarks, no fantasy objects, no unrequested furniture.',
    'Keep it concise enough for an image model, but explicit about layout accuracy and Indian residential context.',
    'Return only the rewritten prompt without markdown or commentary.',
    'MANDATORY SUFFIX — append verbatim, do not alter: ULTIDA signature luxury Indian-modern interior language: warm-white/cream plaster walls, beige marble-vein floors, two-tone walnut/charcoal ribbed cabinetry, slim black handles, warm 2700K LED cove + arched-mirror halo, channel-tufted sage/teal headboard, houndstooth throw, brass accents, no cold corporate palette.',
    `Room: ${room}. Style: ${style}. Budget tier: ${budgetTier}.`,
    `Layout constraints JSON: ${JSON.stringify(layoutConstraints)}.`,
    `Source prompt: ${prompt}`
  ].join('\n');

  const status = getGeminiStatus();
  if (status.configured && status.enabled) {
    for (const apiKey of geminiKeys()) {
      try {
        const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${status.model}:generateContent`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: instruction }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1400
            }
          })
        });
        if (response.ok) {
          const payload = await response.json();
          const refinedPrompt = payload?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join(' ')
            .trim();
          if (refinedPrompt) {
            return { prompt: refinedPrompt, provider: `gemini:${status.model}`, refined: true };
          }
        } else if (![401, 403, 429].includes(response.status)) {
          console.warn(`Gemini server returned ${response.status}, trying next configured key.`);
        }
      } catch (err) {
        console.warn(`Gemini prompt refinement failed with a configured key, trying next: ${err.message}`);
      }
    }
  }

  // Fallback to OpenRouter
  const openRouterRefined = await tryRefineWithOpenRouter({ prompt, instruction });
  if (openRouterRefined) {
    return { prompt: openRouterRefined, provider: 'openrouter:meta-llama-3.3-free', refined: true };
  }

  return { prompt, provider: 'deterministic-compiler', refined: false };
}

/**
 * chatWithAura — real conversational LLM call for the AURA co-pilot.
 * Tries OpenRouter (meta-llama/llama-3.3-70b-instruct:free) first, falls back
 * to Gemini (gemini-2.5-flash) when OpenRouter is rate-limited/unavailable.
 * Returns { text, toolId, model } or null (caller then uses rule engine).
 */
export async function chatWithAura({ message, history = [], tools = [] }) {
  const toolList = tools.map(t => `- ${t.id}: ${t.label} (triggers action "${t.action}")`).join('\n');
  const system = [
    'You are AURA, an AI design co-pilot for an Indian interior-design studio (ULTIDA).',
    'You help with elevations, 3D renders, floorplan detection, cutlists, budget optimization,',
    'Vastu checks, and client handoff. Be concise, professional, and use Indian residential context.',
    'If the user clearly wants a specific action executed, end your reply with a single line:',
    'ACTION:<toolId> where toolId is one of:',
    toolList,
    'Otherwise just answer conversationally. Do not invent dimensions or claim actions you did not take.'
  ].join('\n');
  const messages = [
    { role: 'system', content: system },
    ...history.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: message }
  ];

  // 1) OpenRouter (with one 429-aware retry)
  const orResult = await callOpenRouterChat(messages);
  if (orResult) return orResult;

  // 2) Gemini fallback (higher free quota, avoids OpenRouter 429s)
  const gemResult = await callGeminiChat(system, message, history);
  if (gemResult) return gemResult;

  return null;
}

async function callOpenRouterChat(messages) {
  const key = openRouterKey();
  if (!key) return null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': process.env.APP_URL || 'http://127.0.0.1:5055',
          'X-Title': 'ULTIDA AURA'
        },
        body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages, temperature: 0.4 })
      });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after') || '3');
        console.warn(`AURA chat: OpenRouter 429, retry in ${retryAfter}s`);
        await new Promise(r => setTimeout(r, Math.min(retryAfter, 5) * 1000));
        continue;
      }
      if (!response.ok) { console.warn(`AURA chat failed: OpenRouter ${response.status}`); return null; }
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content?.trim();
      if (!content) return null;
      return parseAuraReply(content, payload?.model || 'meta-llama/llama-3.3-70b-instruct:free');
    } catch (err) {
      console.warn('AURA chat error:', err.message);
      return null;
    }
  }
  return null;
}

async function callGeminiChat(system, message, history) {
  const status = getGeminiStatus();
  if (!status.configured || !status.enabled) return null;
  const parts = [
    system,
    ...history.slice(-6).flatMap(m => [`${m.role === 'user' ? 'User' : 'AURA'}: ${m.text}`]),
    `User: ${message}`
  ].join('\n');
  for (const apiKey of geminiKeys()) {
    try {
      const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${status.model}:generateContent`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: parts }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 800 } })
      });
      if (!response.ok) {
        if (![401, 403, 429].includes(response.status)) console.warn(`AURA Gemini fallback ${response.status}`);
        continue;
      }
      const payload = await response.json();
      const content = payload?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join(' ').trim();
      if (!content) continue;
      return parseAuraReply(content, `gemini:${status.model}`);
    } catch (err) {
      console.warn('AURA Gemini chat error:', err.message);
    }
  }
  return null;
}

function parseAuraReply(content, model) {
  const actionMatch = content.match(/ACTION:([a-z_]+)\s*$/i);
  const text = actionMatch ? content.replace(/ACTION:[a-z_]+\s*$/i, '').trim() : content;
  const toolId = actionMatch ? actionMatch[1].toLowerCase() : null;
  return { text: text || content, toolId, model };
}
