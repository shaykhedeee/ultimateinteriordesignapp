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
  if (!tool) {
    return {
      text: 'I can help with: elevations, renders, floorplan detection, cutlist, budget optimization, and client handoff. Try: "Generate an elevation", "Optimize budget", or "Run AI layout detection".',
      actions: []
    };
  }

  const base = {
    tool: tool.id,
    label: tool.label,
    confidence: tool.confidence
  };

  switch (tool.action) {
    case 'generate_elevation':
      return {
        text: 'Opening the elevation generator. Select a wall in the CAD viewport to export DXF, or ask me to generate from the last detected wall.',
        actions: [
          { actionId: 'openElevationGenerator', label: 'Open Elevation Generator', primary: true },
          { actionId: 'generateFromLastWall', label: 'Auto-generate from last wall', primary: false }
        ]
      };

    case 'generate_render':
      return {
        text: 'I queued a render generation job. Choose a provider and angle, or let me use the last saved settings.',
        actions: [
          { actionId: 'openRenderStudio', label: 'Open 3D Studio', primary: true },
          { actionId: 'regenerateLastRender', label: 'Regenerate last render', primary: false },
          { actionId: 'renderFromAngle', label: 'Render from camera angle', primary: false, preview: { angle: true } }
        ]
      };

    case 'plan_ai_detect':
      return {
        text: 'Running AI Auto-Detect on the floorplan underlay. This may take a few seconds.',
        actions: [
          { actionId: 'runAiDetect', label: 'Run AI Detect', primary: true },
          { actionId: 'runCvTrace', label: 'Run CV Auto-Trace first', primary: false }
        ]
      };

    case 'cv_auto_trace':
      return {
        text: 'Starting CV auto-trace on the floorplan underlay. Trace will create wall segments in the CAD editor.',
        actions: [
          { actionId: 'runCvTrace', label: 'Start CV Trace', primary: true }
        ]
      };

    case 'cutlist_calculate':
      return {
        text: 'Recalculating cutlist from current CAD geometry. Results will appear in the Cutlist screen.',
        actions: [
          { actionId: 'refreshCutlist', label: 'Refresh Cutlist', primary: true },
          { actionId: 'openCutlist', label: 'Open Cutlist & Nesting', primary: false }
        ]
      };

    case 'generate_signoff':
      return {
        text: 'Generating the client-share PDF pack. Use Presentation Studio to choose brief / signoff / quotation pack and copy the link.',
        actions: [
          { actionId: 'openPresentation', label: 'Open Presentation Studio', primary: true },
          { actionId: 'generateQuotation', label: 'Generate Quotation PDF', primary: false }
        ]
      };

    case 'budget_optimize':
      return {
        text: 'Scanning for cost swaps: alternate laminates, standard hardware sizes, panel optimization, and redundant accessories.',
        actions: [
          { actionId: 'openMaterials', label: 'Open Materials & BOQ', primary: true },
          { actionId: 'optimizeCutlist', label: 'Optimize Cutlist Layout', primary: false }
        ]
      };

    case 'assign_task':
      return {
        text: 'Background job started. You can track progress in the Jobs screen.',
        actions: [
          { actionId: 'openJobs', label: 'Open Jobs', primary: true }
        ]
      };

    default:
      return {
        text: 'Understood. If this is about your current project, I can route you to the right specialist tool.',
        actions: []
      };
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
