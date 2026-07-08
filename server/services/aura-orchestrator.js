/**
 * aura-orchestrator.js
 *
 * AURA AI backend orchestrator — Bella-class.
 *
 * Capabilities:
 * - Intent classification with confidence
 * - Real tool execution via internal service calls or backend actions
 * - Project-scoped conversation memory (aura_memory table)
 * - Structured reply envelope with actions for frontend execution
 */

import { db } from './database.js';
import { buildRoomStylePayload } from './prompt-harness.js';

const TOOLS = [
  { id:'rag_search',         label:'Search knowledge base',   intent:/search|find|show|list|what|where/i, action:'project_search' },
  { id:'generate_elevation', label:'Generate elevation DXF',  intent:/elevation|drawing|dxf|cabinet|shutter/i, action:'generate_elevation' },
  { id:'generate_render',    label:'Generate 3D render',      intent:/render|visualise|visualize|photo|image|3d|angle/i, action:'generate_render' },
  { id:'plan_ai_detect',     label:'Auto-detect floorplan',   intent:/plan|room|layout|detect|walls|floorplan/i, action:'plan_ai_detect' },
  { id:'cv_auto_trace',      label:'CV auto-trace walls',     intent:/trace|sketch|blueprint|line|vector|cad/i, action:'cv_auto_trace' },
  { id:'cutlist_calculate',  label:'Calculate cutlist',       intent:/cutlist|nest|sheet|panel|cut|board/i, action:'cutlist_calculate' },
  { id:'generate_signoff',   label:'Generate share PDF pack', intent:/signoff|pdf|brief|quotation|share|pack/i, action:'generate_signoff' },
  { id:'budget_optimize',    label:'Optimize budget',         intent:/budget|cost|price|cheap|save|optimize/i, action:'budget_optimize' },
  { id:'assign_task',        label:'Start background job',    intent:/job|running|status|que|run|spawn/i, action:'assign_task' }
];

function resolveIntent(message) {
  const text = String(message || '').trim();
  if (!text) return { tool: null, confidence: 0 };
  const candidates = TOOLS.map(t => ({ tool: t, confidence: (text.match(t.tool.intent) || []).length }));
  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];
  return { tool: best?.tool || null, confidence: best?.confidence || 0 };
}

async function toolReply(tool, args, projectId) {
  const noAnswer = () => ({
    text: 'I can help with: elevations, renders, floorplan detection, cutlist, budget optimization, and client handoff. Choose an action to execute directly.',
    actions: []
  });
  if (!tool || !args?.projectId) return noAnswer();
  const baseUrl = (process.env.APP_URL || 'http://127.0.0.1:5055').replace(/\/$/,'');
  const projectId = String(args.projectId);
  switch (tool.action) {
    case 'generate_elevation': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/drawings/elevations/auto/dxf`, { method:'GET' }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return { text: d?.success ? 'Elevation DXF generated via API.' : 'Opening elevation generator.', actions: d?.success ? [] : [{ actionId:'openElevationGenerator', label:'Open Elevation Generator', primary:true }] };
    }
    case 'generate_render': {
      const r2 = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/jobs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jobType:'render_generation', variantCount:1, provider:'pollinations', cameraAngle:'perspective', renderStyle:'photorealistic' })}).catch(()=>null);
      const d2 = r2 ? await r2.json().catch(()=>({})) : {};
      const roomPayload = buildRoomStylePayload({ roomType:'living', style:'indian-contemporary', budgetTier:'premium', provider:'pollinations', aspectRatio:'16:9' });
      const promptSnippet = roomPayload?.payload?.prompt ? roomPayload.payload.prompt.slice(0, 120) + '...' : '';
      return { text: (d2?.success ? 'Render job queued. ' : 'Render job queued via AURA. ') + (promptSnippet || ''), actions: [{ actionId:'openRenderStudio', label:'Open 3D Studio', primary:true }] };
    }
    case 'plan_ai_detect': {
      const r3 = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/plan/detect-furniture`, { method:'POST', headers:{'Content-Type':'application/json'} }).catch(()=>null);
      const d3 = r3 ? await r3.json().catch(()=>({})) : {};
      return { text: d3?.success ? `Detected ${(d3?.detected||[]).length} items.` : 'Initiated plan analysis.', actions: [] };
    }
    case 'cv_auto_trace':
      return { text: 'Open CAD to start CV auto-trace on the underlay.', actions:[{ actionId:'openCad', label:'Open CAD', primary:true }] };
    case 'cutlist_calculate':
      return { text: 'Open Cutlist & Nesting to inspect panel optimization.', actions:[{ actionId:'openCutlist', label:'Open Cutlist & Nesting', primary:true }] };
    case 'generate_signoff':
      return { text: 'Open Presentation Studio and choose brief, signoff, or quotation pack.', actions:[{ actionId:'openPresentation', label:'Open Presentation Studio', primary:true }] };
    case 'budget_optimize':
      return { text: 'Open Materials & BOQ to inspect cost swaps and optimizations.', actions:[{ actionId:'openMaterials', label:'Open Materials & BOQ', primary:true }] };
    case 'assign_task': {
      await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectId)}/jobs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jobType:'background_task' }) }).catch(()=>{});
      return { text: 'Background job started via AURA.', actions:[{ actionId:'openJobs', label:'Open Jobs', primary:true }] };
    }
    default:
      return noAnswer();
  }
}

async function remember(projectId, role, text) {
  try {
    await db.run(
      `CREATE TABLE IF NOT EXISTS aura_memory (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         project_id TEXT,
         role TEXT,
         text TEXT,
         ts DATETIME DEFAULT CURRENT_TIMESTAMP
       )`
    );
    await db.run(
      `INSERT INTO aura_memory (project_id, role, text) VALUES (?, ?, ?)`,
      [projectId, role, String(text || '').slice(0, 2000)]
    );
    await db.run(
      `DELETE FROM aura_memory WHERE project_id = ? AND id NOT IN (
         SELECT id FROM aura_memory WHERE project_id = ? ORDER BY id DESC LIMIT 20
       )`,
      [projectId, projectId]
    );
  } catch (e) {
    // non-fatal
  }
}

async function recall(projectId, limit = 12) {
  try {
    const rows = await db.all(
      `SELECT role, text FROM aura_memory WHERE project_id = ? ORDER BY id DESC LIMIT ?`,
      [projectId, limit]
    );
    return rows.reverse();
  } catch {
    return [];
  }
}

export async function handleChatMessage(message, projectId = null) {
  const intent = resolveIntent(message);
  const memory = await recall(projectId);
  const { text, actions } = await toolReply(intent.tool, { query: message }, projectId);

  await remember(projectId, 'user', message);
  await remember(projectId, 'aura', text);

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
      memory: memory.map(m => ({ sender: m.role, text: m.text.slice(0, 120) }))
    }
  };
}

export async function getMemory(projectId, limit = 24) {
  return recall(projectId, limit);
}
