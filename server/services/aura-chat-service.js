import { geminiKeys, getGeminiStatus } from './gemini-service.js';
import { openRouterKey } from './provider-config.js';

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

async function callOpenRouter(messages, instruction = '') {
  const key = openRouterKey();
  if (!key) return null;
  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const payload = {
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: instruction }],
      temperature: 0.4,
      max_tokens: 1200
    };
    if (instruction) {
      payload.messages.unshift({ role: 'system', content: String(instruction) });
    }
    for (const message of messages) {
      payload.messages.push({ role: message.role || 'user', content: String(message.content || '') });
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Spacious Venture Studio'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenRouter ${response.status}: ${text}`);
    }
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply) return { reply, provider: 'openrouter:meta-llama-3.3-free' };
  } catch (err) {
    console.warn('[aura-chat] OpenRouter fallback failed:', err.message);
  }
  return null;
}

function buildActionPreview() {
  return {
    title: 'AURA Suggested Update',
    changes: ['Maps instruction to current design intent'],
    costImpact: 0,
    visualQualityImpact: 4.0,
    raw: '',
    originalRequest: ''
  };
}

function classifyPreview(reply, originalMessage) {
  const lower = (reply + ' ' + (originalMessage || '')).toLowerCase();
  let title = 'AURA Suggested Update';
  let changes = ['Maps instruction to current design intent'];
  let costImpact = 0;
  let visualQualityImpact = 4.0;

  if (lower.match(/save|budget|cost|optimize|reduce|cheapest/)) {
    title = 'Optimize Budget / Spec';
    costImpact = -15000;
    changes = ['Prefers value-engineered laminate/hardware alternatives', 'Target cabinet/hardware savings applied'];
    visualQualityImpact = 4.2;
  } else if (lower.match(/floor|wood|palette|paint|laminate|finish|surface/)) {
    title = 'Apply Finish / Palette';
    costImpact = 8000;
    changes = ['Applies selected material system across selected zones', 'Updates finish tags for renders and procurement'];
    visualQualityImpact = 4.6;
  } else if (lower.match(/sofa|rotate|layout|place|move|reposition/)) {
    title = 'Adjust Layout Placement';
    costImpact = 0;
    changes = ['Repositions selected furniture block', 'Maintains minimum walkway clearance'];
    visualQualityImpact = 4.4;
  } else if (lower.match(/light|lux|lamp|cct|fixture/)) {
    title = 'Improve Lighting Plan';
    costImpact = 5000;
    changes = ['Adjusts light layering and fixture counts', 'Better CCT/Lux alignment for the room'];
    visualQualityImpact = 4.3;
  }

  return {
    title,
    changes,
    costImpact,
    visualQualityImpact,
    raw: reply,
    originalRequest: originalMessage || ''
  };
}

function buildActions(preview) {
  if (!preview) return [];
  if (preview.title.toLowerCase().includes('budget')) return [{ actionId: 'act-budget-cut', label: 'Apply Optimization', variant: 'primary' }];
  if (preview.title.toLowerCase().includes('finish')) return [{ actionId: 'act-palette-apply', label: 'Apply Finishes Globally', variant: 'primary' }];
  if (preview.title.toLowerCase().includes('layout')) return [{ actionId: 'act-restyle', label: 'Execute Move', variant: 'primary' }];
  if (preview.title.toLowerCase().includes('light')) return [{ actionId: 'act-lighting-apply', label: 'Apply Lighting Plan', variant: 'primary' }];
  return [{ actionId: 'act-apply-aura', label: 'Apply Suggestion', variant: 'primary' }];
}

export async function chatAura({ message, history = [], context = '' }) {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (!trimmed) {
    return {
      reply: 'Please enter a design instruction for AURA.',
      provider: 'validation',
      actionPreview: null,
      actions: []
    };
  }

  const instruction = context ? `User context:\n${String(context)}` : '';
  const contents = buildGeminiMessages(history, trimmed);
  const llmMessages = buildOpenRouterMessages(history, trimmed);

  let result = null;
  try {
    result = await callGemini(contents, instruction);
  } catch (err) {
    console.warn('[aura-chat] Gemini path failed:', err.message);
  }
  if (!result) {
    try {
      result = await callOpenRouter(llmMessages, instruction);
    } catch (err) {
      console.warn('[aura-chat] OpenRouter path failed:', err.message);
    }
  }
  if (!result) {
    return {
      reply: `Understood: "${trimmed}". AURA is currently in offline mode.`,
      provider: 'offline-fallback',
      actionPreview: null,
      actions: []
    };
  }

  const actionPreview = classifyPreview(result.reply, trimmed);
  const actions = buildActions(actionPreview);
  const reply = actionPreview
    ? `${actionPreview.title}. Saved estimate updated with cost impact ₹${Math.abs(actionPreview.costImpact || 0).toLocaleString()}.`
    : result.reply;

  return { reply, provider: result.provider, actionPreview, actions };
}

export function getAuraProviderStatus() {
  const geminiStatus = getGeminiStatus();
  const orKey = openRouterKey();
  return {
    gemini: geminiStatus.configured,
    openRouter: !!orKey,
    fallbackAvailable: geminiStatus.configured || !!orKey
  };
}
