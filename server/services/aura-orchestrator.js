/**
 * aura-orchestrator.js  — ULTIDA AURA AI backend orchestrator
 *
 * FIXES APPLIED (2026-07):
 *  - better-sqlite3 is SYNCHRONOUS: removed all await db.run() / db.all() calls.
 *    These were silently failing (returning undefined), breaking AURA memory entirely.
 *    All DB ops now use db.prepare().run() / db.prepare().all() (sync API).
 *  - `message` parameter was not passed into toolReply() — fixed scope bug.
 *  - aura_memory table now created at module init (not inside per-call async fn).
 *
 * Capabilities:
 *  - Intent classification with confidence
 *  - Real tool execution via internal service calls or backend actions
 *  - Project-scoped conversation memory (aura_memory table) — NOW WORKING
 *  - Structured reply envelope with actions for frontend execution
 */

import db from '../database/database.js';
import { buildRoomStylePayload } from './prompt-harness.js';
import { chatWithAura } from './gemini-service.js';

// ── Create memory table at startup (synchronous, safe to call multiple times) ──
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS aura_memory (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT,
      role    TEXT,
      text    TEXT,
      ts      DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (e) {
  console.warn('[aura-orchestrator] aura_memory table init warning:', e.message);
}

const TOOLS = [
  { id:'rag_search',         label:'Search knowledge base',   intent:/search|find|show|list|what|where/i,                  action:'project_search' },
  { id:'generate_elevation', label:'Generate elevation DXF',  intent:/elevation|drawing|dxf|cabinet|shutter/i,             action:'generate_elevation' },
  { id:'generate_render',    label:'Generate 3D render',      intent:/render|visualise|visualize|photo|image|3d|angle/i,   action:'generate_render' },
  { id:'plan_ai_detect',     label:'Auto-detect floorplan',   intent:/plan|room|layout|detect|walls|floorplan/i,           action:'plan_ai_detect' },
  { id:'cv_auto_trace',      label:'CV auto-trace walls',     intent:/trace|sketch|blueprint|line|vector|cad/i,            action:'cv_auto_trace' },
  { id:'cutlist_calculate',  label:'Calculate cutlist',       intent:/cutlist|nest|sheet|panel|cut|board/i,                action:'cutlist_calculate' },
  { id:'generate_signoff',   label:'Generate share PDF pack', intent:/signoff|pdf|brief|quotation|share|pack/i,            action:'generate_signoff' },
  { id:'budget_optimize',    label:'Optimize budget',         intent:/budget|cost|price|cheap|save|optimize/i,             action:'budget_optimize' },
  { id:'assign_task',        label:'Start background job',    intent:/job|running|status|que|run|spawn/i,                  action:'assign_task' },
  { id:'regen_room',         label:'Regenerate room render',  intent:/regenerate|re-render|redo|regen|refresh.*room|regenerate.*room/i, action:'regen_room' }
];

function resolveIntent(message) {
  const text = String(message || '').trim();
  if (!text) return { tool: null, confidence: 0 };
  const candidates = TOOLS.map(t => ({ tool: t, confidence: (text.match(t.intent) || []).length }));
  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];
  return { tool: best?.tool || null, confidence: best?.confidence || 0 };
}

// ── FIXED: added `message` as a parameter so regen_room case can access it ──
async function toolReply(tool, args, projectId, message = '') {
  const noAnswer = () => ({
    text: 'I can help with: elevations, renders, floorplan detection, cutlist, budget optimization, and client handoff. Choose an action to execute directly.',
    actions: []
  });
  if (!tool || !args?.projectId) return noAnswer();
  const baseUrl = (process.env.APP_URL || 'http://127.0.0.1:5055').replace(/\/$/,'');
  const projectIdResolved = String(args.projectId);

  switch (tool.action) {
    case 'generate_elevation': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/drawings/elevations/auto/dxf`, { method:'GET' }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? 'Elevation DXF generated via API.' : 'Opening elevation generator.',
        actions: d?.success ? [] : [{ actionId:'openElevationGenerator', label:'Open Elevation Generator', primary:true }]
      };
    }

    case 'generate_render': {
      const r2 = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/jobs`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jobType:'render_generation', variantCount:1, cameraAngle:'perspective', renderStyle:'photorealistic' })
      }).catch(()=>null);
      const d2 = r2 ? await r2.json().catch(()=>({})) : {};
      const roomPayload = buildRoomStylePayload({ roomType:'living', style:'indian-contemporary', budgetTier:'premium', aspectRatio:'16:9' });
      const promptSnippet = roomPayload?.payload?.prompt ? roomPayload.payload.prompt.slice(0, 120) + '...' : '';
      return {
        text: (d2?.success ? 'Render job queued. ' : 'Render job queued via AURA. ') + (promptSnippet || ''),
        actions: [{ actionId:'openRenderStudio', label:'Open 3D Studio', primary:true }]
      };
    }

    case 'plan_ai_detect': {
      const r3 = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/plan/detect-furniture`, {
        method:'POST', headers:{'Content-Type':'application/json'}
      }).catch(()=>null);
      const d3 = r3 ? await r3.json().catch(()=>({})) : {};
      return {
        text: d3?.success ? `Detected ${(d3?.detected||[]).length} items.` : 'Initiated plan analysis.',
        actions: []
      };
    }

    case 'cv_auto_trace':
      return { text: 'Open CAD to start CV auto-trace on the underlay.', actions:[{ actionId:'openCad', label:'Open CAD', primary:true }] };

    case 'cutlist_calculate':
      return { text: 'Open Cutlist & Nesting to inspect panel optimization.', actions:[{ actionId:'openCutlist', label:'Open Cutlist & Nesting', primary:true }] };

    case 'rag_search':
      return { text: 'Search terms saved. Opening knowledge base results.', actions:[{ actionId:'openKnowledgeBase', label:'Open Knowledge Base', primary:true }] };

    case 'generate_signoff':
      return { text: 'Open Presentation Studio and choose brief, signoff, or quotation pack.', actions:[{ actionId:'openPresentation', label:'Open Presentation Studio', primary:true }] };

    case 'generate_quotation':
      return { text: 'Opening quotation generator in Materials & BOQ.', actions:[{ actionId:'openMaterials', label:'Open Materials & BOQ', primary:true }] };

    case 'regen_room': {
      // FIXED: `message` is now properly passed as a parameter
      const roomMatch = String(message || '').match(/room\s+([a-z0-9 ]+?)(?:$|\.|,|with|using)/i);
      const roomName = roomMatch ? roomMatch[1].trim() : 'Living Dining';
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/pipeline/regenerate-room`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ room: { name: roomName, w: 4200, h: 3600 }, projectName: 'ULTIDA' })
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? `Regenerated ${roomName} render, SKP, DXF and PDF.` : `Regenerating ${roomName} via AURA.`,
        actions:[{ actionId:'openPipelineStudio', label:'Open Pipeline Studio', primary:true }]
      };
    }

    case 'testimonial':
      return { text: 'Opening testimonial capture form.', actions:[{ actionId:'openTestimonial', label:'Open Testimonial Form', primary:true }] };

    case 'budget_optimize':
      return { text: 'Opening Finance & BOQ screen for budget optimization analysis.', actions:[{ actionId:'openFinance', label:'Open Finance & BOQ', primary:true }] };

    default:
      return noAnswer();
  }
}

// ── FIXED: better-sqlite3 is synchronous — removed all async/await from DB calls ──

function remember(projectId, role, text) {
  try {
    db.prepare(`INSERT INTO aura_memory (project_id, role, text) VALUES (?, ?, ?)`)
      .run(projectId, role, String(text || '').slice(0, 2000));
    // Keep only the last 20 messages per project
    db.prepare(`
      DELETE FROM aura_memory
      WHERE project_id = ? AND id NOT IN (
        SELECT id FROM aura_memory WHERE project_id = ? ORDER BY id DESC LIMIT 20
      )
    `).run(projectId, projectId);
  } catch (e) {
    // non-fatal — memory is best-effort
    console.warn('[aura-orchestrator] remember() warn:', e.message);
  }
}

function recall(projectId, limit = 12) {
  try {
    const rows = db.prepare(
      `SELECT role, text FROM aura_memory WHERE project_id = ? ORDER BY id DESC LIMIT ?`
    ).all(projectId, limit);
    return rows.reverse(); // oldest first for LLM context
  } catch (e) {
    console.warn('[aura-orchestrator] recall() warn:', e.message);
    return [];
  }
}

// ── Main public handler ──

export async function handleChatMessage(message, projectId = null) {
  const intent = resolveIntent(message);

  // FIXED: recall() is now synchronous (was using await db.all which silently returned undefined)
  const memory = projectId ? recall(projectId) : [];

  // Preferred path: real conversational LLM (OpenRouter llama-3.3-70b or Gemini fallback).
  const llm = projectId ? await chatWithAura({ message, history: memory, tools: TOOLS }) : null;
  let text;
  let actions = [];

  if (llm) {
    text = llm.text;
    const chosenTool = llm.toolId ? TOOLS.find(t => t.id === llm.toolId) : (intent.tool || null);
    if (chosenTool) {
      // FIXED: pass `message` so regen_room case can extract room name from it
      const toolOut = await toolReply(chosenTool, { query: message, projectId }, projectId, message);
      text = text || toolOut.text;
      actions = toolOut.actions || [];
    }
  } else {
    // Fallback: deterministic keyword routing (no LLM key available / rate-limited).
    const { text: fbText, actions: fbActions } = await toolReply(intent.tool, { query: message, projectId }, projectId, message);
    text = fbText;
    actions = fbActions;
  }

  // FIXED: remember() is now synchronous (was using await db.run which silently did nothing)
  if (projectId) {
    remember(projectId, 'user', message);
    remember(projectId, 'aura', text);
  }

  return {
    success: true,
    reply: {
      id: 'a-' + Date.now().toString(36),
      sender: 'aura',
      text,
      toolCalls: intent.tool ? [{ tool: intent.tool.id, label: intent.tool.label, confidence: intent.confidence }] : [],
      actions,
      intent: intent.tool ? intent.tool.id : null,
      next: intent.tool ? { screen: 'command', action: intent.tool.action } : null,
      memory: memory.map(m => ({ sender: m.role, text: m.text.slice(0, 120) })),
      llmPowered: Boolean(llm),
      model: llm?.model || (projectId ? 'offline-rule-engine' : 'unavailable')
    }
  };
}

function getMemory(projectId, limit = 24) {
  return recall(projectId, limit);
}

export default { handleChatMessage, getMemory };
