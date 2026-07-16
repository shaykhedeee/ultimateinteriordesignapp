/** @typedef {import('./provider-router-service.js').resolveProviderForTaskResult} ProviderResult */

const ALLOWED_EDIT_TYPES = new Set([
  'material_swap',
  'furniture_replace',
  'add_object',
  'remove_object',
  'lighting_tweak',
  'decor_refinement'
]);

const DEFAULT_INPAINT_TASK = 'inpaint';

export function buildEditPlan({ editType, instruction, roomStyleContext, geometryContext, referenceAssetId }) {
  const normalizedType = String(editType || '').trim().toLowerCase();
  if (!ALLOWED_EDIT_TYPES.has(normalizedType)) {
    throw new Error(`Unsupported edit type: ${editType}`);
  }

  const base = {
    editType: normalizedType,
    instruction: String(instruction || '').trim(),
    roomStyleContext: roomStyleContext ? String(roomStyleContext).trim() : null,
    geometryContext: geometryContext ? JSON.stringify(geometryContext) : null,
    preserveCamera: true,
    preserveGeometry: true,
    preserveLightingDirection: true,
    fallbackStrategy: 'inpaint_then_rerender'
  };

  switch (normalizedType) {
    case 'material_swap':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Inpaint only the masked region. Replace material with: ${base.instruction}. Preserve surrounding scene, camera, and lighting direction.`,
        negativeHint: 'Do not change room geometry, background objects, or camera angle.'
      };
    case 'furniture_replace':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Replace the selected furniture inside the mask with: ${base.instruction}. Keep room geometry, lighting direction, and surrounding objects intact.`,
        negativeHint: 'Do not redraw walls, openings, or objects outside the mask.'
      };
    case 'add_object':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Add an object naturally inside the masked region. ${base.instruction}. Match existing lighting direction and perspective.`,
        negativeHint: 'Do not modify room structure or existing objects outside the masked region.'
      };
    case 'remove_object':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Remove the selected object from the masked region and inpaint coherent background. ${base.instruction}.`,
        negativeHint: 'Do not introduce new objects or change room surfaces outside the mask.'
      };
    case 'lighting_tweak':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Adjust lighting only within the masked region. ${base.instruction}. Keep camera angle and geometry unchanged.`,
        negativeHint: 'Do not change furniture, materials, or geometry outside the masked region.'
      };
    case 'decor_refinement':
      return {
        ...base,
        preferredTaskType: DEFAULT_INPAINT_TASK,
        promptHint: `Refine decor details in the masked region. ${base.instruction}. Maintain consistent style with the rest of the scene.`,
        negativeHint: 'Avoid changing structural elements or large objects outside the mask.'
      };
    default:
      return base;
  }
}

export function resolveEditProvider(plan, providerRoutingResult) {
  const routing = providerRoutingResult || {};
  const provider = routing.provider || 'mock';
  const providerMode = routing.providerMode || 'platform';
  const fallbackUsed = routing.fallbackUsed || false;

  if (!provider || provider === 'unsupported') {
    return {
      provider: 'mock',
      providerMode: 'platform',
      fallbackUsed: true,
      reason: 'No capable edit provider available; using deterministic mock fallback.'
    };
  }

  return {
    provider,
    providerMode,
    fallbackUsed,
    reason: fallbackUsed ? 'Primary edit provider unavailable; fallback used.' : 'Primary edit provider selected.'
  };
}

export function shouldRetryEdit({ status, retryCount, maxRetries = 2 }) {
  const retryable = ['failed', 'timeout', 'provider_error'];
  const remaining = (retryCount || 0) < maxRetries;
  return retryable.includes(String(status || '').toLowerCase()) && remaining;
}

export function nextEditRetryState(current) {
  const retryCount = (current.retryCount || 0) + 1;
  const maxRetries = current.maxRetries || 2;
  const failed = retryCount > maxRetries;
  return {
    status: failed ? 'failed' : 'queued_retry',
    stage: failed ? 'failed' : 'queued_retry',
    retryCount: failed ? retryCount : retryCount,
    fallbackUsed: !failed && !current.fallbackUsed
  };
}

export function editStatusChip(status) {
  const map = {
    queued: 'Queued',
    queued_retry: 'Retrying',
    running: 'Editing',
    waiting_provider: 'Waiting on provider',
    validating: 'Validating edit',
    completed: 'Edit applied',
    failed: 'Edit failed',
    cancelled: 'Edit cancelled',
    dead_letter: 'Edit dead-lettered'
  };
  return map[String(status || '').toLowerCase()] || 'Unknown';
}
