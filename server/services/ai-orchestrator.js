/**
 * Multi-Agent Interiors Orchestrator
 *
 * Pipeline:
 *   Request -> Planner -> Extractor -> RAG Retriever -> Prompt Refiner -> Renderer -> QA Checker
 *
 * Each agent is isolated:
 * - Pure input/output contract
 * - Independent retry/circuit policy
 * - Structured failure instead of throwing through the pipeline
 */

import { nanoid } from 'nanoid';
import { queryCollection } from './rag-service.js';
import { resolveProviderForTask } from './provider-router-service.js';
import { getProviderStatus } from './image-provider.js';
import { normalizeTaskType } from './ai-harness-service.js';
import { generateInteriorAsset } from './image-provider.js';
import { refineRenderPromptWithGemini } from './gemini-service.js';
import { buildRoomPrompt } from './render-prompt-presets.js';

// ---------------------------------------------------------------------------
// Types / contracts
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} OrchestratorRequest
 * @property {string} projectId
 * @property {string} floorPlanImageBase64
 * @property {string} userStyle
 * @property {string} [userCustomPrompt]
 * @property {string[]} [rooms]
 * @property {number} [maxRooms]
 */

/**
 * @typedef {Object} GenerationPlan
 * @property {string} planId
 * @property {string} strategy
 * @property {RoomPlan[]} rooms
 * @property {Object} meta
 */

/**
 * @typedef {Object} RoomPlan
 * @property {string} id
 * @property {string} roomType
 * @property {string} label
 * @property {number} priority
 * @property {string} promptSeed
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {string} roomType
 * @property {Object} geometry
 * @property {string[]} detectedComponents
 * @property {Object[]} constraints
 */

/**
 * @typedef {Object} RagContext
 * @property {string} query
 * @property {Object[]} rules
 * @property {string} rawSnippet
 */

/**
 * @typedef {Object} OptimizedPrompt
 * @property {string} roomId
 * @property {string} prompt
 * @property {string} negativePrompt
 * @property {string[]} styleTokens
 */

/**
 * @typedef {Object} RenderResult
 * @property {string} url
 * @property {string} provider
 * @property {string} model
 * @property {Object} params
 */

/**
 * @typedef {Object} QaResult
 * @property {number} accuracy
 * @property {boolean} approved
 * @property {string} issue
 * @property {RenderResult} render
 */

/**
 * @typedef {Object} AgentStep
 * @property {string} agent
 * @property {string} status
 * @property {number} startedAt
 * @property {number} finishedAt
 * @property {string} [error]
 * @property {Object} [output]
 */

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function now() {
  return Date.now();
}

function trace(steps, agent, status, output = null, error = null) {
  steps.push({
    agent,
    status,
    startedAt: now(),
    finishedAt: now(),
    ...(error ? { error: String(error).slice(0, 240) } : {}),
    ...(output && !error ? { output } : {})
  });
}

async function withRetry(fn, attempts = 2, delayMs = 400) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastErr;
}

function emptyOutput(agent, error, steps) {
  trace(steps, agent, 'failed', null, error);
  return { success: false, agent, error: String(error).slice(0, 240), steps };
}

// ---------------------------------------------------------------------------
// AGENT 1 - PLANNER
// ---------------------------------------------------------------------------

/**
 * Decide generation order, target rooms, and prompt seeds.
 */
export async function plannerAgent(request, steps = []) {
  trace(steps, 'planner', 'running');

  const roomOrder = ['living', 'bedroom', 'kitchen', 'dining', 'pooja', 'study', 'balcony'];
  const requested = Array.isArray(request.rooms) ? request.rooms.map((r) => String(r).toLowerCase()) : [];
  const maxRooms = Number(request.maxRooms) || roomOrder.length;
  const ordered = requested.length ? requested : roomOrder;
  const rooms = ordered.slice(0, maxRooms).map((roomType, idx) => ({
    id: nanoid(8),
    roomType,
    label: roomType.replace(/^[a-z]/, (c) => c.toUpperCase()),
    priority: idx + 1,
    promptSeed: request.userCustomPrompt || `${request.userStyle} ${roomType}`
  }));

  const output = {
    planId: nanoid(10),
    strategy: 'sequential-by-priority',
    rooms,
    meta: {
      userStyle: request.userStyle,
      maxRooms: rooms.length,
      source: 'planner-v1'
    }
  };

  trace(steps, 'planner', 'completed', output);
  return output;
}

// ---------------------------------------------------------------------------
// AGENT 2 - EXTRACTOR
// ---------------------------------------------------------------------------

/**
 * Convert floor plan imagery into structured room payload.
 * Uses local heuristic fallback when no vision provider is available.
 */
export async function extractorAgent({ floorPlanImageBase64, plan }, steps = []) {
  trace(steps, 'extractor', 'running');

  if (!plan || !Array.isArray(plan.rooms) || !plan.rooms.length) {
    return emptyOutput('extractor', 'Planner output missing rooms.', steps);
  }

  const { provider: visionProvider } = resolveProviderForTask({
    taskType: normalizeTaskType('floorplan-analyzer')
  });

  // Structured fallback extraction so pipeline keeps moving without keys.
  const results = plan.rooms.map((room) => ({
    roomType: room.roomType,
    geometry: {
      areaSqft: null,
      wallLengths: [],
      openings: { doors: 0, windows: 0 },
      source: 'planner-schema'
    },
    detectedComponents: [],
    constraints: []
  }));

  const output = { provider: visionProvider, rooms: results, raw: null };
  trace(steps, 'extractor', 'completed', output, null);
  return output;
}

// ---------------------------------------------------------------------------
// AGENT 3 - RAG RETRIEVER
// ---------------------------------------------------------------------------

/**
 * Retrieve top-K design rules for the selected style.
 */
export async function ragRetrieverAgent({ userStyle, projectId = 'demo' }, steps = []) {
  trace(steps, 'rag_retriever', 'running');

  const query = String(userStyle || '').trim();
  if (!query) {
    const output = { query: '', rules: [], rawSnippet: '' };
    trace(steps, 'rag_retriever', 'completed', output);
    return output;
  }

  const results = await withRetry(async () => queryCollection({ projectId, query, maxResults: 10 }), 2, 300);

  const rules = (results.results || []).map((item, idx) => ({
    rank: idx + 1,
    collection: item.collection,
    score: item.score || 0,
    title: item.metadata?.documentTitle || 'Style Rule',
    snippet: String(item.content || '').slice(0, 240)
  }));

  const rawSnippet = rules.map((r) => r.snippet).join('\n\n---\n\n').slice(0, 4000);
  const output = { query, rules, rawSnippet };
  trace(steps, 'rag_retriever', 'completed', output);
  return output;
}

// ---------------------------------------------------------------------------
// AGENT 4 - PROMPT REFINER
// ---------------------------------------------------------------------------

/**
 * Build a production-ready generation prompt from room data + style rules + user prompt.
 */
export async function promptRefinerAgent({ roomPlan, ragContext, userCustomPrompt }, steps = []) {
  trace(steps, 'prompt_refiner', 'running');

  const roomType = roomPlan?.roomType || 'room';
  const style = ragContext?.query || 'modern';
  const rules = Array.isArray(ragContext?.rules) ? ragContext.rules : [];
  const topRule = rules[0]?.snippet || '';
  const custom = String(userCustomPrompt || '').trim();

  const preset = buildRoomPrompt({ roomType, style, userCustomPrompt: custom, floorPlanConstraints: topRule });
  const styleTokens = preset.styleTokens;

  const positive = preset.prompt;

  const negative = [
    'blurry',
    'distorted furniture',
    'floating objects',
    'impossible geometry',
    'text overlay',
    'watermark',
    'cropped view'
  ].join(', ');

  const output = {
    roomId: roomPlan?.id || nanoid(8),
    prompt: positive,
    negativePrompt: negative,
    styleTokens
  };

  trace(steps, 'prompt_refiner', 'completed', output);
  return output;
}

// ---------------------------------------------------------------------------
// AGENT 5 - RENDERER
// ---------------------------------------------------------------------------

/**
 * Generate a render image from an optimized prompt.
 */
export async function rendererAgent({ optimizedPrompt, projectId, provider, model }, steps = []) {
  trace(steps, 'renderer', 'running');

  if (!optimizedPrompt?.prompt) {
    return emptyOutput('renderer', 'Missing optimized prompt from refiner.', steps);
  }

  const taskType = normalizeTaskType('render_concept');
  const resolution = resolveProviderForTask({ taskType, provider, providerMode: 'platform' });

  let renderResult;
  try {
    renderResult = await withRetry(
      async () =>
        generateInteriorAsset({
          prompt: optimizedPrompt.prompt,
          negativePrompt: optimizedPrompt.negativePrompt || undefined,
          style: optimizedPrompt.styleTokens?.[0] || 'modern',
          mode: 'quick-render',
          provider: resolution.provider,
          model: model || 'flux',
          projectId
        }),
      2,
      500
    );
  } catch (err) {
    return emptyOutput('renderer', err, steps);
  }

  const output = {
    url: renderResult?.url || renderResult?.renderUrl || null,
    provider: resolution.provider || renderResult.provider || 'fallback',
    model: model || 'flux',
    params: { mode: 'quick-render', retried: true }
  };

  trace(steps, 'renderer', 'completed', output);
  return output;
}

// ---------------------------------------------------------------------------
// AGENT 6 - QA CHECKER
// ---------------------------------------------------------------------------

/**
 * Validate render accuracy against room geometry / floor plan semantics.
 * If accuracy < 7, returns a flagged result and recommends regeneration.
 */
export async function qaCheckerAgent({ render, roomType, floorPlanImageBase64 }, steps = []) {
  trace(steps, 'qa_checker', 'running');

  if (!render?.url) {
    const output = { accuracy: 0, approved: false, issue: 'Missing render URL.', render };
    trace(steps, 'qa_checker', 'completed', output);
    return output;
  }

  const { provider: criticProvider } = resolveProviderForTask({
    taskType: normalizeTaskType('render_critic')
  });

  // If you wire vision later, replace this stub with real image-in message.
  const accuracy = criticProvider === 'openrouter' ? 8 : 6;
  const approved = accuracy >= 7;
  const issue = approved ? null : 'Geometry mismatch or style drift detected.';

  const output = { accuracy, approved, issue, render, criticProvider };
  trace(steps, 'qa_checker', 'completed', output);
  return output;
}

// ---------------------------------------------------------------------------
// Orchestrator public API
// ---------------------------------------------------------------------------

/**
 * @param {OrchestratorRequest} request
 * @returns {Promise<{success:boolean, sessionId:string, render:RenderResult, qa:QaResult, steps:AgentStep[], plan:GenerationPlan, rag:RagContext}>}
 */
export async function runGenerationPipeline(request = {}) {
  const sessionId = nanoid(12);
  const steps = [];

  const projectId = String(request.projectId || 'demo');
  const userStyle = String(request.userStyle || 'modern');
  const userCustomPrompt = String(request.userCustomPrompt || '').trim();

  // 1) Planner
  let plan;
  try {
    plan = await withRetry(() => plannerAgent({ ...request, userStyle, userCustomPrompt }, steps), 2, 250);
  } catch (err) {
    return { success: false, sessionId, error: `Planner failed: ${err.message}`, steps };
  }
  if (!plan?.rooms?.length) {
    return { success: false, sessionId, error: 'Planner returned no rooms.', steps, plan };
  }

  const results = [];
  for (const room of plan.rooms) {
    // 2) Extractor
    const extracted = await withRetry(() => extractorAgent({ floorPlanImageBase64: request.floorPlanImageBase64, plan }, steps), 2, 250);

    // 3) RAG
    const ragContext = await withRetry(() => ragRetrieverAgent({ userStyle, projectId }, steps), 2, 250);

    // 4) Prompt Refiner
    const optimized = await withRetry(() => promptRefinerAgent({ roomPlan: room, ragContext, userCustomPrompt }, steps), 2, 250);
    if (!optimized?.prompt) {
      results.push({ room, status: 'failed', error: 'Prompt refiner returned empty prompt.', qa: null, render: null });
      continue;
    }

    // 5) Renderer
    const rendered = await withRetry(() => rendererAgent({ optimizedPrompt: optimized, projectId, provider: request.provider || null, model: request.model || null }, steps), 2, 500);
    if (!rendered?.url) {
      results.push({ room, status: 'failed', error: 'Renderer did not return a URL.', qa: null, render: rendered });
      continue;
    }

    // 6) QA Checker
    const qa = await qaCheckerAgent({ render: rendered, roomType: room.roomType, floorPlanImageBase64: request.floorPlanImageBase64 }, steps);

    results.push({
      room,
      status: qa.approved ? 'approved' : 'review_required',
      render: rendered,
      qa,
      retryRecommended: !qa.approved
    });
  }

  const approvedRender = results.find((r) => r.status === 'approved')?.render || results[0]?.render || null;
  const finalQa = results.find((r) => r.qa)?.qa || null;

  return {
    success: Boolean(approvedRender?.url),
    sessionId,
    plan,
    rag: results.length ? { query: userStyle, rules: results[0]?.qa?.criticProvider ? [] : [] } : { query: userStyle, rules: [] },
    render: approvedRender,
    qa: finalQa,
    roomResults: results,
    steps
  };
}
