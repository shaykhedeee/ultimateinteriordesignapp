import { geminiKeys, getGeminiStatus } from './gemini-service.js';
import { openRouterKey } from './provider-config.js';
import { getProfile, listProfiles } from './openrouter-profiles.js';

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
      actions: [],
      agentStatus: 'idle'
    };
  }

  const instruction = context ? `User context:\n${String(context)}` : '';
  const llmMessages = buildOpenRouterMessages(history, trimmed);
  
  // Agentic step 1: understand intent
  const intentPrompt = `${instruction}\n\nYou are AURA, an interior design agent. Analyze this request and respond with a brief plan.\nRequest: ${trimmed}\n\nRespond with: 1) Intent classification, 2) Required steps, 3) Estimated impact`;
  
  let result = null;
  try {
    result = await callGemini([{ role: 'user', parts: [{ text: intentPrompt }] }, { role: 'user', parts: [{ text: trimmed }] }], instruction);
  } catch (err) {
    console.warn('[aura-chat] Gemini intent path failed:', err.message);
  }
  if (!result) {
    try {
      result = await callOpenRouter([...llmMessages.slice(-4), { role: 'user', content: `Intent analysis: ${trimmed}\n\nProvide a brief plan with steps.` }], instruction);
    } catch (err) {
      console.warn('[aura-chat] OpenRouter intent path failed:', err.message);
    }
  }

  if (!result) {
    return {
      reply: `Understood: "${trimmed}". AURA is currently in offline mode.`,
      provider: 'offline-fallback',
      actionPreview: null,
      actions: [],
      agentStatus: 'offline'
    };
  }

  const replyText = result.reply || trimmed;
  const actionPreview = classifyPreview(replyText, trimmed);
  const actions = buildActions(actionPreview);
  
  // Agentic step 2: execute safe actions automatically
  let executedActions = [];
  if (actions.length > 0 && actionPreview) {
    try {
      // Simulate tool execution
      const executionResult = await executeAgentTool(trimmed, actionPreview, actions);
      executedActions = executionResult.actions || [];
    } catch (err) {
      console.warn('[aura-chat] Tool execution failed:', err.message);
    }
  }

  const reply = actionPreview
    ? `${replyText}\n\nExecuted: ${executedActions.map(a => a.label).join(', ') || 'Analysis complete'}`
    : replyText;

  return {
    reply,
    provider: result.provider,
    providerMeta: { provider: result.provider, model: result.model || 'unknown' },
    actionPreview,
    actions,
    executedActions,
    agentStatus: 'completed',
    steps: [
      { name: 'Intent Analysis', status: 'completed' },
      { name: 'Tool Execution', status: executedActions.length > 0 ? 'completed' : 'skipped' },
      { name: 'Response Generation', status: 'completed' }
    ]
  };
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
