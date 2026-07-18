import db from '../database/database.js';
import { callLocalLLM } from './local-llm-service.js';

function resolveKey(provider) {
  const envMap = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    freepik: 'FREEPIK_API_KEY',
    huggingface: 'HUGGINGFACE_API_KEY',
    stability: 'STABILITY_API_KEY'
  };
  const envKey = envMap[provider.toLowerCase()];
  if (envKey && process.env[envKey]) return process.env[envKey];
  try {
    const row = db.prepare('SELECT key_value FROM api_keys WHERE provider = ? LIMIT 1').get(provider.toLowerCase());
    if (row?.key_value) return row.key_value;
  } catch {}
  return null;
}

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_1,
    process.env.GOOGLE_AI_STUDIO_KEY_2,
    resolveKey('gemini')
  ].filter(Boolean);
}

function resolveAppUrl() {
  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT || '8790';
  return (process.env.APP_URL || `http://${host}:${port}`).replace(/\/$/, '');
}

export function getGeminiStatus() {
  return {
    configured: geminiKeys().length > 0,
    enabled: process.env.GEMINI_PROMPT_REFINEMENT !== 'false',
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
  };
}

async function tryRefineWithOpenRouter({ prompt, instruction }) {
  const key = resolveKey('openrouter');
  if (!key) return null;
  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': resolveAppUrl(),
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

import { getCompanyBrainContext } from './aura-agents.js';

/**
 * chatWithAura — real conversational LLM call for the AURA co-pilot.
 * Priority chain: OpenRouter → Gemini → OpenAI GPT-4o-mini → null (rule engine)
 * Returns { text, toolId, model } or null (caller then uses rule engine).
 */
export async function chatWithAura({ message, history = [], tools = [] }) {
  const toolList = tools.map(t => `- ${t.id}: ${t.label} (triggers action "${t.action}")`).join('\n');
  const companyKnowledge = getCompanyBrainContext();
  const system = [
    'You are AURA, a Multi-Agent AI design orchestrator for ULTIDA.',
    'You manage 8 specialized agents: Layout Analyst, 3D Director, Materials Expert, Product Engineer, Finance Controller, Technical Drafter, Client Manager, and Style Curator.',
    'Based on the user prompt, adopt the persona of the best-suited agent to fulfill the request.',
    companyKnowledge,
    'If the user tells you to "remember" a preference, standard, or rule, end your reply with:',
    'LEARN:<The rule to remember in a concise sentence>',
    'If the user clearly wants a specific action executed, end your reply with a single line:',
    'ACTION:<toolId> where toolId is one of:',
    toolList,
    'Otherwise just answer conversationally as the specialized agent. Do not claim actions you did not take.'
  ].filter(Boolean).join('\n');
  
  const messages = [
    { role: 'system', content: system },
    ...history.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: message }
  ];

  // Helper: race the local LLM against a hard timeout so a missing/slow 350MB
  // model download can never stall the chat (this laptop has no GPU).
  const withTimeout = (p, ms) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('local-llm-timeout')), ms))
  ]);

  // 1) Local Quantized LLM (Qwen2.5-0.5B) is explicitly opt-in. The bundled
  // ONNX build is not compatible with every Windows runtime; trying it first
  // made every chat request wait on a known optional failure.
  if (process.env.AURA_LOCAL_LLM === 'true') {
    try {
      const localRes = await withTimeout(callLocalLLM(messages), 8000);
      if (localRes) return parseAuraReply(localRes, 'local:qwen2.5-0.5b');
    } catch (err) {
      console.warn('[AURA] Local model unavailable; continuing with configured providers.');
    }
  }

  // 2) Gemini (free Google AI Studio key) — primary reliable cloud path
  const gemResult = await callGeminiChat(system, message, history);
  if (gemResult) return gemResult;

  // 3) OpenRouter (with 429-aware retry across free models)
  const orResult = await callOpenRouterChat(messages);
  if (orResult) return orResult;

  // 4) OpenAI GPT-4o-mini final fallback
  const oaiResult = await callOpenAiGptChat(messages);
  if (oaiResult) return oaiResult;

  return null;
}

async function callOpenRouterChat(messages) {
  const key = resolveKey('openrouter');
  if (!key) return null;
  // Try several free models; if one is rate-limited (429) move to the next.
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct-v0.3:free',
    'nousresearch/hermes-3-llama-3.1-8b:free',
    'deepseek/deepseek-r1-distill-qwen-14b:free'
  ];
  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': resolveAppUrl(),
          'X-Title': 'ULTIDA AURA'
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 })
      });
      if (response.status === 429) {
        console.warn(`AURA chat: OpenRouter ${model} rate-limited (429), trying next model`);
        continue;
      }
      if (response.status === 404) {
        console.warn(`AURA chat: OpenRouter model ${model} unavailable (404)`);
        continue;
      }
      if (!response.ok) { console.warn(`AURA chat failed: OpenRouter ${model} ${response.status}`); continue; }
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content?.trim();
      if (!content) continue;
      return parseAuraReply(content, payload?.model || model);
    } catch (err) {
      console.warn('AURA chat error:', err.message);
      continue;
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

async function callOpenAiGptChat(messages) {
  const key = resolveKey('openai');
  if (!key || !key.startsWith('sk-')) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.4,
        max_tokens: 800
      })
    });
    if (!response.ok) {
      console.warn(`AURA GPT-4o-mini fallback: OpenAI returned ${response.status}`);
      return null;
    }
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    return parseAuraReply(content, 'openai:gpt-4o-mini');
  } catch (err) {
    console.warn('AURA GPT-4o-mini error:', err.message);
    return null;
  }
}

function parseAuraReply(content, model) {
  const actionMatch = content.match(/ACTION:([a-z_]+)/i);
  const learnMatch = content.match(/LEARN:(.+)/i);
  
  let text = content;
  if (actionMatch) text = text.replace(actionMatch[0], '');
  if (learnMatch) text = text.replace(learnMatch[0], '');
  text = text.trim();

  const toolId = actionMatch ? actionMatch[1].toLowerCase() : null;
  const learnedRule = learnMatch ? learnMatch[1].trim() : null;
  
  return { text: text || content, toolId, learnedRule, model };
}
