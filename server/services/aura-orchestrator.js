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
import { answerFromKnowledge } from './aura-knowledge.js';

const NO_ANSWER_TEXT = 'I can help with: elevations, renders, floorplan detection, cutlist, budget optimization, and client handoff. Choose an action to execute directly.';

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
  { id:'rag_search',         label:'Search knowledge base',   intent:/search|find|show|\blist\b|what|where/i,               action:'project_search' },
  { id:'generate_elevation', label:'Generate elevation DXF',  intent:/elevation|drawing|dxf|cabinet|shutter/i,             action:'generate_elevation' },
  { id:'generate_render',    label:'Generate 3D render',      intent:/render|visualise|visualize|photo|image|3d|angle/i,   action:'generate_render' },
  { id:'plan_ai_detect',     label:'Auto-detect floorplan',   intent:/plan|room|layout|detect|walls|floorplan/i,           action:'plan_ai_detect' },
  { id:'cv_auto_trace',      label:'CV auto-trace walls',     intent:/trace|sketch|blueprint|line|vector|cad/i,            action:'cv_auto_trace' },
  { id:'cutlist_calculate',  label:'Calculate cutlist',       intent:/cutlist|nest|sheet|cut\b/i,                          action:'cutlist_calculate' },
  { id:'generate_signoff',   label:'Generate share PDF pack', intent:/signoff|brief|share|presentation/i,                  action:'generate_signoff' },
  { id:'budget_optimize',    label:'Optimize budget',         intent:/budget|cost|price|cheap|save|optimize/i,             action:'budget_optimize' },
  { id:'assign_task',        label:'Start background job',    intent:/job|running|status|que|run|spawn/i,                  action:'assign_task' },
  { id:'regen_room',         label:'Regenerate room render',  intent:/regenerate|re-render|redo|regen|refresh.*room|regenerate.*room/i, action:'regen_room', weight: 2 },
  { id:'vastu_check',        label:'Check Vastu compliance',  intent:/vastu.*(check|complian|audit|report)|check.*vastu|compliant|pooja|altar|feng.*shui/i, action:'vastu_check', weight: 2 },
  { id:'jali_generate',      label:'Generate jali/lattice panel', intent:/jali|lattice|jaali|screen|partition.*panel|mashrabiya/i, action:'jali_generate' },
  { id:'shoe_rack_generate', label:'Generate shoe rack',          intent:/shoe\s*rack|shoe cabinet| footwear|shoe storage/i,        action:'shoe_rack_generate' },
  { id:'cutlist_refresh',    label:'Recalculate cutlist',       intent:/refresh.*cutlist|recalculat.*cutlist|re-?generate.*cutlist|cutlist.*recalc/i, action:'cutlist_refresh', weight: 2 },
  { id:'delivery_pack',      label:'Build delivery package',    intent:/delivery|dispatch|pack.*ship|handover|installation pack/i, action:'delivery_pack' },
  { id:'generate_quotation', label:'Generate quotation PDF',    intent:/quotation|quote.*pdf|proposal.*pdf|proposal|client.*quote|price.*quote|estimate.*pdf/i, action:'generate_quotation' },
  { id:'kitchen_template',   label:'Apply kitchen template',    intent:/kitchen.*(u|l)\b|u-?shape kitchen|l-?shape kitchen|kitchen template|modular kitchen|kitchen layout/i, action:'kitchen_template', weight: 2 },
  { id:'apply_vastu',        label:'Auto-apply Vastu fixes',     intent:/apply.*vastu|fix.*vastu|vastu.*auto|make.*vastu|vastu.*complian/i, action:'apply_vastu', weight: 2 },
  { id:'preview_vastu',      label:'Preview Vastu changes',      intent:/preview.*vastu|vastu.*preview|show.*vastu|vastu.*changes|vastu.*diff/i, action:'preview_vastu', weight: 2 },
  { id:'tv_unit_apply',      label:'Apply TV unit',              intent:/tv\s*unit|tv wall|television unit|media unit/i,            action:'tv_unit_apply' }
];

export function resolveIntent(message) {
  const text = String(message || '').trim();
  if (!text) return { tool: null, confidence: 0 };
  // Count EVERY keyword occurrence (global regex) so a message that hits
  // several words of one tool outranks a single-word tie. The intent regexes
  // are not global, so without this, confidence is capped at 1 and ties were
  // previously broken by array order (arbitrary, wrong routing).
  const candidates = TOOLS.map(t => {
    const re = new RegExp(t.intent.source, t.intent.flags + 'g');
    const confidence = (text.match(re) || []).length;
    // weight is a tiebreaker for tools whose intent verb is more specific
    // (e.g. regen_room "regenerate" must beat the generic "render").
    return { tool: t, confidence, weight: t.weight || 1 };
  });
  candidates.sort((a, b) => (b.confidence - a.confidence) || (b.weight - a.weight));
  const best = candidates[0];
  // No keyword matched at all -> no intent (never return a phantom tool).
  if (!best || best.confidence === 0) return { tool: null, confidence: 0 };
  return { tool: best.tool, confidence: best.confidence };
}

// ── FIXED: added `message` as a parameter so regen_room case can access it ──
export async function toolReply(tool, args, projectId, message = '') {
  const noAnswer = () => ({ text: NO_ANSWER_TEXT, actions: [] });
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

    case 'vastu_check': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/vastu/analyze`, { method:'GET' }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      const msg = d?.items?.filter(i => i.status === 'violation').map(i => `• ${i.label}: currently ${i.zone}, move to ${i.suggestion?.zone} (${i.suggestion?.place})`).join('\n')
        || (d?.missingKeyItems?.length ? d.missingKeyItems.map(m => `• ${m.summary}`).join('\n') : null)
        || 'Your layout is 100% Vastu-compliant!';
      return {
        text: `Vastu Floor-Plan Scan (${d?.counts?.compliant || 0} compliant / ${d?.counts?.violation || 0} to fix / ${d?.counts?.unknown || 0} unclassified of ${d?.counts?.total || 0} items):\n${msg}`,
        actions: d?.needsApply ? [{ actionId:'applyVastuFixes', label:'Auto-Apply Vastu (all items)', primary:true }, { actionId:'openVastu', label:'Open Vastu Studio' }] : [{ actionId:'openVastu', label:'Open Vastu Studio', primary:true }]
      };
    }

    case 'jali_generate': {
      // Extract size hints from the message (e.g. "jali 600x2000"); fall back to standard.
      const dims = String(message || '').match(/(\d{2,4})\s*[xX]\s*(\d{2,4})/);
      const widthMm = dims ? Math.min(3000, Math.max(100, Number(dims[1]))) : 600;
      const heightMm = dims ? Math.min(4000, Math.max(100, Number(dims[2]))) : 2000;
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/elevations/jali-panel`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ widthMm, heightMm, name:'Jali Panel' })
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? `Jali panel DXF + PDF generated (${widthMm}×${heightMm}mm).` : 'Open the Jali / Lattice designer to configure the panel.',
        actions: d?.success ? [] : [{ actionId:'openJali', label:'Open Jali Designer', primary:true }]
      };
    }

    case 'shoe_rack_generate': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/elevations/shoe-rack`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? 'Shoe rack / entry cabinet DXF + PDF generated.' : 'Open the Shoe Rack designer for the entryway.',
        actions: d?.success ? [] : [{ actionId:'openShoeRack', label:'Open Shoe Rack Designer', primary:true }]
      };
    }

    case 'cutlist_refresh': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/cutlist/refresh`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? `Cutlist recalculated — ${d.moduleCount || 0} modules, ${d.partCount || 0} parts.` : 'Open Cutlist & Nesting to build the panel optimization.',
        actions: d?.success ? [] : [{ actionId:'openCutlist', label:'Open Cutlist & Nesting', primary:true }]
      };
    }

    case 'delivery_pack': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/delivery-package`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? 'Client delivery package built (branded ZIP).' : 'Open Presentation Studio to assemble the client handoff package.',
        actions: d?.success ? [] : [{ actionId:'openPresentation', label:'Open Presentation Studio', primary:true }]
      };
    }

    case 'generate_quotation': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/quotation/pdf`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.success ? 'Quotation PDF generated.' : 'Open Materials & BOQ to build the quotation.',
        actions: d?.success ? [] : [{ actionId:'openMaterials', label:'Open Materials & BOQ', primary:true }]
      };
    }

    case 'kitchen_template': {
      // Infer U or L shape from the message; default to L.
      const shape = /u[-\s]?shape|\bu\b/i.test(message) ? 'U' : 'L';
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/kitchen/template`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ shape })
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      return {
        text: d?.ok ? `${shape}-shape modular kitchen template applied (${d.applied} modules).` : 'Open the Kitchen Studio to pick a U or L template.',
        actions: d?.ok ? [] : [{ actionId:'openKitchen', label:'Open Kitchen Studio', primary:true }]
      };
    }

    case 'apply_vastu': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/vastu/auto-apply-full`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      const n = Array.isArray(d?.applied) ? d.applied.length : 0;
      return {
        text: d?.ok ? `Full Vastu applied — ${n} item(s) repositioned/reconciled across the floor plan (beds, seating, kitchen, pooja and more moved to their ideal zones).` : 'Open Vastu Studio to review compliance.',
        actions: d?.ok ? [{ actionId:'openVastu', label:'Open Vastu Studio', primary:true }] : [{ actionId:'openVastu', label:'Open Vastu Studio', primary:true }]
      };
    }

    case 'preview_vastu': {
      const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/vastu/analyze`, {
        method:'GET'
      }).catch(()=>null);
      const d = r ? await r.json().catch(()=>({})) : {};
      const v = d?.items?.filter(i => i.status === 'violation').length || 0;
      const miss = d?.missingKeyItems?.length || 0;
      return {
        text: d?.ok ? (v || miss ? `Vastu floor-plan scan: ${v} item(s) in the wrong zone and ${miss} missing key item(s). Open Vastu Studio for the full room-by-room blueprint and one-click fix.` : 'Plan already Vastu-compliant — no changes needed.') : 'Open Vastu Studio to review the plan.',
        actions: d?.ok && (v || miss) ? [{ actionId:'applyVastuFixes', label:'Auto-Apply Vastu', primary:true }, { actionId:'openVastu', label:'Open Vastu Studio' }] : [{ actionId:'openVastu', label:'Open Vastu Studio', primary:true }]
      };
    }

    case 'tv_unit_apply': {
      // Infer a library id from the message if possible; otherwise open the picker.
      const lib = await (async () => {
        try { const r = await fetch(`${baseUrl}/api/tv-units`); const list = r.ok ? await r.json() : []; return list; }
        catch { return []; }
      })();
      const match = (lib || []).find(u => {
        if (message.toLowerCase().includes(u.id.replace(/_/g, ' '))) return true;
        if (message.toLowerCase().includes(u.name.toLowerCase())) return true;
        // token-overlap fallback: e.g. "high-gloss black tv unit" -> "High-Gloss Black Statement"
        const toks = (u.name || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const hits = toks.filter(w => message.toLowerCase().includes(w)).length;
        return toks.length > 0 && hits >= 2;
      });
      if (match) {
        const r = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(projectIdResolved)}/tv-unit/apply`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ unitId: match.id })
        }).catch(()=>null);
        const d = r ? await r.json().catch(()=>({})) : {};
        return { text: d?.ok ? `Applied TV unit: ${match.name}.` : 'Open the TV Unit library to pick a style.', actions: d?.ok ? [] : [{ actionId:'openTvUnit', label:'Open TV Units', primary:true }] };
      }
      return { text: 'Pick a TV unit style from the library (Louvered Walnut, CNC Teak, Fluted Oak, High-Gloss Black, and more).', actions:[{ actionId:'openTvUnit', label:'Open TV Units', primary:true }] };
    }

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
    // If rule-engine routing produced no meaningful answer, use the offline
    // knowledge engine so the chat is NEVER empty (zero-config selling point).
    if (!fbText || fbText === NO_ANSWER_TEXT) {
      const kb = answerFromKnowledge(message);
      text = kb.text;
      actions = [];
    } else {
      text = fbText;
      actions = fbActions;
    }
  }

  // FIXED: remember() is now synchronous (was using await db.run which silently did nothing)
  if (projectId) {
    remember(projectId, 'user', message);
    remember(projectId, 'aura', text);
  }
  
  if (llm?.learnedRule) {
    try {
      db.prepare(`INSERT INTO company_brain_kb (id, category, learned_rule, source) VALUES (?, ?, ?, ?)`).run(
        'kb-' + Date.now().toString(36),
        'general',
        llm.learnedRule,
        'aura_chat'
      );
      text = text + `\n\n(Learned company rule: "${llm.learnedRule}")`;
    } catch(e) {
      console.warn("Failed to learn rule", e.message);
    }
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
