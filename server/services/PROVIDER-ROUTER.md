# Provider Router

## Overview
The provider router abstracts all AI and vision provider interactions behind a capability-based selection layer. Business logic stays provider-agnostic; routing decides which provider serves each task.

## Supported Modes
1. **Platform-managed provider keys** — backend controls keys; no customer exposure.
2. **Customer BYOK provider keys** — customers supply their own keys via `provider_configs`.
3. **Local/private inference endpoints** — ComfyUI or internal inference gateway.

## Task Types
- `topview_enhance`
- `quick_render`
- `detailed_render`
- `inpaint`
- `upscale`
- `style_image`
- `critic_text`

## Provider Capability Map
Defined in `server/services/provider-registry.js`:
- `openrouter`: text, critic_text
- `openai`: text, image, enhance, render, edit, upscale
- `gemini`: text, image, enhance, render, edit, upscale
- `stability`: image, enhance, render, edit, upscale
- `pollinations`: image, style_image
- `huggingface`: text, image, enhance, render, edit, upscale
- `pexels`: image, style_image
- `mock`: all capabilities (fallback)
- `local_comfyui`: image, enhance, render, edit, upscale
- `local_inference`: text, critic_text

## Usage
```js
import { resolveProviderForTask, recordProviderMetadata } from './services/provider-router-service.js';

const resolution = resolveProviderForTask({
  taskType: 'topview_enhance',
  organizationId: 'org_1',
  provider: 'auto',
  providerMode: 'platform',
  fallbackOrder: ['pollinations', 'huggingface']
});

// resolution = { provider, providerMode, capabilityMatch, fallbackUsed, unsupported }

// Log routing decision
recordProviderMetadata({
  organizationId: 'org_1',
  projectId: 'proj_1',
  taskType: 'topview_enhance',
  provider: resolution.provider,
  providerMode: resolution.providerMode,
  capabilityMatch: resolution.capabilityMatch,
  fallbackUsed: resolution.fallbackUsed
});
```

## API Endpoints
- `POST /api/providers/resolve` — resolve provider for a task
- `POST /api/providers/routing-log` — record routing decision
- `GET /api/providers/tasks` — list supported task types

## Database Tables
- `provider_configs` — org-scoped provider configs with mode, capabilities, fallback order
- `provider_routing_log` — persistent routing audit trail

## Adding a New Provider
1. Add capability tags to `PROVIDER_CAPABILITIES` in `provider-registry.js`.
2. Add task requirements to `TASK_CAPABILITY_REQUIREMENTS` if needed.
3. Implement adapter in `image-provider.js` or appropriate service.
4. No business-logic changes required.

## Security
- No provider secrets in frontend.
- All keys stored in backend `provider_configs` or env.
- Diagnostics endpoint masks keys.
