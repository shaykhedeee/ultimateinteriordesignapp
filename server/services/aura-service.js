/**
 * AURA — Structured Interior Intelligence Layer
 *
 * Provides typed interfaces, prompt library, Indian interiors expertise,
 * self-learning hooks, and validation for room semantics, style planning,
 * render prompt composition, render critique, and style recommendation.
 *
 * @typedef {'room_semantics'|'zone_design_plan'|'render_prompt_compose'|'render_critic'|'style_recommend'} AuraTaskType
 * @typedef {'living_room'|'bedroom'|'kitchen'|'bathroom'|'dining'|'office'|'entry'|'outdoor'|'unknown'} RoomType
 * @typedef {'primary'|'secondary'|'accent'} ZoneRole
 * @typedef {'accepted'|'rejected'|'lightly_edited'|'heavily_edited'|'flagged'|'approved'|'misclassified'} FeedbackType
 * @typedef {'topdown'|'elevated'|'eye_level'|'isometric'} CameraMode
 * @typedef {'template'|'composed'|'edited'} PromptSourceType
 */

import fs from 'fs';
import path from 'path';
import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';
import { generateInteriorAsset } from './image-provider.js';
import { listProfiles } from './openrouter-profiles.js';

export const AURA_TASK_TYPES = Object.freeze({
  ROOM_SEMANTICS: 'room_semantics',
  ZONE_DESIGN_PLAN: 'zone_design_plan',
  RENDER_PROMPT_COMPOSE: 'render_prompt_compose',
  RENDER_CRITIC: 'render_critic',
  STYLE_RECOMMEND: 'style_recommend'
});

export const AURA_TASK_TYPE_LIST = Object.freeze(Object.values(AURA_TASK_TYPES));

export const ROOM_TYPES = Object.freeze([
  'living_room', 'bedroom', 'kitchen', 'bathroom', 'dining', 'office', 'entry', 'outdoor', 'unknown'
]);

export const ZONE_ROLES = Object.freeze(['primary', 'secondary', 'accent']);

import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';
import { generateInteriorAsset } from './image-provider.js';
import { listProfiles } from './openrouter-profiles.js';
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_PATH = path.join(process.cwd(), 'server/services/aura/knowledge/indian-interiors-knowledge.md');
let KNOWLEDGE_CACHE = '';
let KNOWLEDGE_CACHE_MTIME = 0;

function loadKnowledge(force = false) {
  try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
      const stat = fs.statSync(KNOWLEDGE_PATH);
      if (force || !KNOWLEDGE_CACHE || stat.mtimeMs !== KNOWLEDGE_CACHE_MTIME) {
        KNOWLEDGE_CACHE = fs.readFileSync(KNOWLEDGE_PATH, 'utf-8');
        KNOWLEDGE_CACHE_MTIME = stat.mtimeMs;
      }
    }
    return KNOWLEDGE_CACHE;
  } catch (err) {
    return '';
  }
}

const DEFAULT_INDIAN_INJECTS = Object.freeze({
  climate: 'Include Indian climate-aware guidance: moisture-resistant finishes for tropical wet, earthy low-gloss materials for tropical dry, durable high-traffic laminates for subtropical, and woodgrains/wool blends for alpine hill stations.',
  vastu: 'Use Vastu as a preference signal, not a hard constraint: prefer NE pooja room/study, SE kitchen hob facing East, SW master bedroom, avoid NE toilets.',
  laminates: 'Favor Indian laminate conventions: Merino/Greenlam/Royale Touche for wardrobes/TV units/pooja; moisture-resistant carcass laminates for kitchens; high-gloss acrylic for premium shutters; matte/textured for high-use surfaces.',
  pooja: 'Pooja room norms: NE or East, elevated platform 150-200mm, warm LED strip lighting, teak/iroko/brass; include shelf count guidance.',
  kitchen: 'Kitchen layout norms: parallel/L/U/island; tall unit depth 600mm, wall unit 300mm; min counter 900mm height; backsplash 600-750mm; use bottle pull-out and corner carousel when helpful.',
  wardrobe: 'Wardrobe norms: 1500-1800mm width, 550-600mm depth, 2100mm height, long rod at 1800mm, short at 1000mm; add pantaloons rack, jewelry drawer, pull-out mirror; loft optional.',
  budgeting: 'Use Indian budget bands: economy ~1200-1600 INR/sqft, standard 1600-2200, premium 2200-3200, luxury 3200-5000 INR/sqft with matching laminate/hardware recommendations.',
  vendor: 'Prefer Indian-locally-available vendors by default: CenturyPly/Royale Touche carcass, Merino/Greenlam shutters, Hettich InnoTech/Sensys runners, Blum/AVENTOS lifts, Ebco pantry baskets.',
  pooja_shutter: 'Glass shutters optional for pooja; generally prefer sliding/folding to save clearance in small puja/mandir units.'
});

function buildIndianInjectionText(injects) {
  if (!injects || typeof injects !== 'object') return '';
  const keys = Object.keys(injects);
  if (!keys.length) return '';
  const lines = keys.map((k) => `\n[${k}] ${String(injects[k] || '').trim()}`);
  return lines.join('\n');
}

function resolveTemplateDefaults(template, context = {}) {
  const injected = template.system.replace('__INDIAN_KNOWLEDGE_BASE__', loadKnowledge());
  const injection = buildIndianInjectionText(context.indianInjects || DEFAULT_INDIAN_INJECTS);
  return {
    system: injected || template.system,
    task: template.task || '',
    repair: template.repair || '',
    indiaContextTag: injection ? `\n\nIndian interiors expert mode. Use only Indian norms for laminates, hardware, pooja, kitchens, wardrobes, budgets, and vendors.${injection}` : ''
  };
}

export class AuraService {
  #defaultSystemPrompt = [
    'You are AURA, an interior-design intelligence system.',
    'You are used for room semantics, style planning, palette/material planning, circulation-aware recommendations, render prompt composition, and render critique.',
    'You are NOT used for exact geometry extraction, exact wall measurement, exact symbol coordinates, or authoritative CAD-style layout generation.',
    'Rules: output valid JSON only; follow the provided schema exactly; preserve uncertainty instead of hallucinating certainty; always include must_keep and must_avoid when requested; respect organization rules and brand presets; do not invent exact dimensions or fixed architectural facts not present in input.'
  ].join('\n');

  #promptLibrary = Object.freeze({
    [AURA_TASK_TYPES.ROOM_SEMANTICS]: {
      system: this.#indianizedSystemPrompt(),
      task: `Task: room_semantics\nInputs: roomImageUrl, zoneCropUrl?, floorplanCropUrl?, layoutContext?, ocrContext?, orgContext?\nOutput: roomType, confidence, visibleElements, functionalNeeds, constraints, styleSignals, materialSignals, mustKeep, mustAvoid, uncertainties\nIndian context: consider pooja room norms, vastu orientation hints, laminate/hardware preferences, and modular furniture norms when inferring function.`,
      repair: 'Your last output was not valid JSON. Return only valid JSON matching the room_semantics schema. Admit uncertainty instead of guessing.'
    },
    [AURA_TASK_TYPES.ZONE_DESIGN_PLAN]: {
      system: this.#indianizedSystemPrompt(),
      task: `Task: zone_design_plan\nInputs: roomSemantics, projectBrief?, catalogContext?, organizationRules?\nOutput: styleName, styleKeywords, colorPalette, materialPalette, lightingStrategy, productCategories, placementNotes, circulationNotes, mustKeep, mustAvoid, riskFlags, confidence\nIndian context: prefer modular furniture from catalog, Merino laminates where premium shutters are appropriate, CenturyPly carcass for interiors, Royale Touche for wardrobes/TV units, Hettich/Blum hardware for premium segments.`,
      repair: 'Your last output was not valid JSON. Return only valid JSON matching the zone_design_plan schema.'
    },
    [AURA_TASK_TYPES.RENDER_PROMPT_COMPOSE]: {
      system: this.#indianizedSystemPrompt(),
      task: `Task: render_prompt_compose\nInputs: designPlan, layoutContext?, references?\nOutput: prompt, negativePrompt, cameraNotes, preserveInstructions, mustKeep, mustAvoid`,
      repair: 'Your last output was not valid JSON. Return only valid JSON matching the render_prompt_compose schema. Always preserve geometry and must_avoid hallucinated architecture.'
    },
    [AURA_TASK_TYPES.RENDER_CRITIC]: {
      system: this.#indianizedSystemPrompt(),
      task: `Task: render_critic\nInputs: renderImageUrl, layoutContext?, designPlan?, selectedProducts?, priorPromptPack?\nOutput: score, geometryConsistency, styleConsistency, realismScore, issues, mustFix, suggestedEdits, approve`,
      repair: 'Your last output was not valid JSON. Return only valid JSON matching the render_critic schema.'
    },
    [AURA_TASK_TYPES.STYLE_RECOMMEND]: {
      system: this.#indianizedSystemPrompt(),
      task: `Task: style_recommend\nInputs: roomImageUrl?, moodboardUrls?, briefText?, orgRules?\nOutput: primaryStyle, secondaryInfluences, palette, materialFamilies, moodKeywords, doNotUse, confidence`,
      repair: 'Your last output was not valid JSON. Return only valid JSON matching the style_recommend schema.'
    }
  });

  #indianizedSystemPrompt() {
    const knowledge = loadKnowledgeCache();
    const knowledgeSnippet = knowledge ? `\nIndian interiors knowledge:\n${knowledge.slice(0, 3000)}` : '';
    return `${this.#defaultSystemPrompt}${knowledgeSnippet}`;
  }

  getPromptLibrary() {
    return this.#promptLibrary;
  }

  validateJson(input, contract) {
    if (!contract || typeof contract !== 'object') return true;
    const schema = contract;
    if (schema.type === 'object' && typeof input !== 'object') return false;
    if (Array.isArray(schema.required) && input && typeof input === 'object') {
      for (const field of schema.required) {
        if (!(field in input)) return false;
      }
    }
    return true;
  }

  wrapStructuredTask({ taskType, raw, parsed, memory, providerMeta }) {
    const valid = this.validateJson(parsed, this.#promptLibrary[taskType]);
    return {
      taskType,
      parsed,
      parseValid: valid,
      raw: valid ? undefined : String(raw),
      confidence: extractConfidence(parsed),
      providerMeta,
      usedMemory: memory
    };
  }
}

export function extractConfidence(parsed) {
  if (!parsed || typeof parsed !== 'object') return undefined;
  if (typeof parsed.confidence === 'number') return parsed.confidence;
  return undefined;
}

export function composeRenderPromptFromPlan(plan) {
  try {
    const prompt = [
      `Photorealistic ${String(plan.styleName || '').toLowerCase()} ${cameraContext('elevated')}.`,
      `Style cues: ${(Array.isArray(plan.styleKeywords) ? plan.styleKeywords : []).join(', ')}.`,
      `Palette: ${(Array.isArray(plan.colorPalette) ? plan.colorPalette : []).join(', ')}. Material language: ${(Array.isArray(plan.materialPalette) ? plan.materialPalette : []).join(', ')}.`,
      `Lighting: ${(Array.isArray(plan.lightingStrategy) ? plan.lightingStrategy : []).join('; ')}.`,
      `Layout intent: ${(Array.isArray(plan.placementNotes) ? plan.placementNotes : []).join('; ')}.`,
      `Circulation: ${(Array.isArray(plan.circulationNotes) ? plan.circulationNotes : []).join('; ')}.`,
      `Keep: ${(Array.isArray(plan.mustKeep) ? plan.mustKeep : []).join(', ')}.`,
      `Avoid: ${(Array.isArray(plan.mustAvoid) ? plan.mustAvoid : []).join(', ')}.`,
      riskBlock(Array.isArray(plan.riskFlags) ? plan.riskFlags : []),
      geometryPreservationBlock()
    ].join('\n');

    const negativePrompt = [
      'do not change architecture',
      'no extra windows',
      'no floating furniture',
      'no distorted perspective',
      'no clutter',
      'no oversized objects',
      'no hallucinated openings'
    ].join(', ');

    return {
      prompt,
      negativePrompt,
      cameraNotes: { mode: 'elevated', framing: showFullRoomHint(Array.isArray(plan.placementNotes) ? plan.placementNotes : []), lensHint: '24-28mm' },
      preserveInstructions: ['preserve room proportions', 'preserve door and window positions', 'preserve circulation path'],
      mustKeep: Array.isArray(plan.mustKeep) ? plan.mustKeep : [],
      mustAvoid: Array.isArray(plan.mustAvoid) ? plan.mustAvoid : []
    };
  } catch {
    return fallbackRenderPrompt();
  }
}

export function buildCritiqueRepairPrompt(pack) {
  return [
    `Repair prompt pack for safer render generation.`,
    `Original prompt: ${pack.prompt}`,
    `Negative prompt baseline: ${pack.negativePrompt}`,
    `Preserve these must_keep: ${(Array.isArray(pack.mustKeep) ? pack.mustKeep : []).join(', ')}`,
    `Enforce these must_avoid: ${(Array.isArray(pack.mustAvoid) ? pack.mustAvoid : []).join(', ')}`,
    `Do not introduce new architectural elements or break composition.`
  ].join('\n');
}

export function buildStylePrompt(request) {
  return [
    `Apply style direction: ${request.primaryStyle}.`,
    `Influences: ${(Array.isArray(request.secondaryInfluences) ? request.secondaryInfluences : []).join(', ')}.`,
    `Palette: ${(Array.isArray(request.palette) ? request.palette : []).join(', ')}.`,
    `Material families: ${(Array.isArray(request.materialFamilies) ? request.materialFamilies : []).join(', ')}.`,
    `Mood keywords: ${(Array.isArray(request.moodKeywords) ? request.moodKeywords : []).join(', ')}.`,
    `Do not use: ${(Array.isArray(request.doNotUse) ? request.doNotUse : []).join(', ')}.`
  ].join('\n');
}

export function topLevelTasks() {
  return Object.values(AURA_TASK_TYPES);
}

export function fallbackRenderPrompt() {
  return {
    prompt: 'Safe interior render preserving existing room geometry and balancing neutral warmth with refined minimal furniture placement.',
    negativePrompt: 'no extra walls, no floating furniture, no distorted perspective, no clutter',
    cameraNotes: { mode: 'elevated', framing: 'show full room composition', lensHint: '24-28mm' },
    preserveInstructions: ['preserve room proportions', 'preserve door and window positions'],
    mustKeep: ['room geometry'],
    mustAvoid: ['hallucinated architecture']
  };
}

function riskBlock(riskFlags) {
  if (!riskFlags.length) return '';
  return `Risk flags: ${riskFlags.join('; ')}. Reduce those risks in composition.`;
}

function geometryPreservationBlock() {
  return 'Critical: preserve room geometry and input layout exactly.';
}

function cameraContext(mode) {
  return `${String(mode || 'elevated').replace(/_/g, ' ')} perspective view`.trim();
}

function showFullRoomHint(placementNotes) {
  return placementNotes.length ? `Show key zones: ${placementNotes[0]}.` : 'Show full room composition.';
}
