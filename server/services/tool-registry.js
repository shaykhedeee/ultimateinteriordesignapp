/**
 * Tool Registry
 *
 * Canonical catalog of all tool verticals. Used by:
 * - frontend shell / navigation
 * - backend route registration
 * - permission checks
 * - feature flag gating
 * - capability routing
 *
 * Add new tools here, not in scattered route files.
 */

export const TOOL_CATEGORIES = Object.freeze({
  DESIGN: 'design',
  RENDER: 'render',
  MEDIA: 'media',
  DOCS: 'docs',
  ANALYSIS: 'analysis',
  AUTOMATION: 'automation',
  COMMERCE: 'commerce'
});

export const TOOLS = Object.freeze([
  {
    slug: 'floorplan-analyzer',
    name: 'Floorplan Analyzer',
    category: TOOL_CATEGORIES.ANALYSIS,
    enabledByDefault: true,
    route: '/app/tools/design/floorplan',
    apiNamespace: '/api/design/floorplans',
    capabilities: ['floorplan_upload', 'geometry_validation', 'room_detection'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['floorplan_analyze', 'canonical_render'],
    hidden: false
  },
  {
    slug: 'plan-enhancer',
    name: 'Plan Enhancer',
    category: TOOL_CATEGORIES.DESIGN,
    enabledByDefault: true,
    route: '/app/tools/design/enhance',
    apiNamespace: '/api/design/floorplans/:projectId/enhance',
    capabilities: ['topview_enhance', 'style_transfer'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['topview_enhance'],
    hidden: false
  },
  {
    slug: 'zone-planner',
    name: 'Zone Planner',
    category: TOOL_CATEGORIES.DESIGN,
    enabledByDefault: true,
    route: '/app/tools/design/zones/:zoneId',
    apiNamespace: '/api/design/zones',
    capabilities: ['zone_design_plan', 'style_recommendation'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['zone_design_plan'],
    hidden: false
  },
  {
    slug: 'quick-render',
    name: 'Quick Render',
    category: TOOL_CATEGORIES.RENDER,
    enabledByDefault: true,
    route: '/app/tools/render/quick',
    apiNamespace: '/api/design/zones/:zoneId/render/quick',
    capabilities: ['render_prompt_compose', 'image_generation', 'image_edit'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['quick_render'],
    hidden: false
  },
  {
    slug: 'detailed-render',
    name: 'Detailed Render',
    category: TOOL_CATEGORIES.RENDER,
    enabledByDefault: true,
    route: '/app/tools/render/detailed',
    apiNamespace: '/api/design/zones/:zoneId/render/detailed',
    capabilities: ['render_prompt_compose', 'image_generation', 'image_upscale'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['detailed_render'],
    hidden: false
  },
  {
    slug: 'render-editor',
    name: 'Render Editor',
    category: TOOL_CATEGORIES.RENDER,
    enabledByDefault: true,
    route: '/app/tools/render/edit',
    apiNamespace: '/api/renders/edit',
    capabilities: ['inpaint', 'style_transfer', 'material_swap'],
    requiredFeatures: [],
    requiredPermissions: ['project:write'],
    jobTypes: ['inpaint', 'style_transfer'],
    hidden: false
  },
  {
    slug: 'material-swap',
    name: 'Material Swap',
    category: TOOL_CATEGORIES.DESIGN,
    enabledByDefault: true,
    route: '/app/tools/design/materials/swap',
    apiNamespace: '/api/renders/material-swap',
    capabilities: ['material_swap', 'image_generation'],
    requiredFeatures: [],
    requiredPermissions: ['project:write'],
    jobTypes: ['material_swap'],
    hidden: false
  },
  {
    slug: 'laminate-swap',
    name: 'Laminate Swap',
    category: TOOL_CATEGORIES.COMMERCE,
    enabledByDefault: true,
    route: '/app/tools/commerce/laminate-swap',
    apiNamespace: '/api/renders/laminate-swap',
    capabilities: ['laminate_swap', 'bom_update'],
    requiredFeatures: [],
    requiredPermissions: ['project:write'],
    jobTypes: ['laminate_swap'],
    hidden: false
  },
  {
    slug: 'catalog',
    name: 'Material Catalog',
    category: TOOL_CATEGORIES.COMMERCE,
    enabledByDefault: true,
    route: '/app/tools/catalog',
    apiNamespace: '/api/material-catalog',
    capabilities: ['catalog_search', 'catalog_filter'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: [],
    hidden: false
  },
  {
    slug: 'document-parser',
    name: 'Document Parser',
    category: TOOL_CATEGORIES.DOCS,
    enabledByDefault: true,
    route: '/app/tools/docs/parser',
    apiNamespace: '/api/docs/parse',
    capabilities: ['document_parse', 'ocr_grounding'],
    requiredFeatures: [],
    requiredPermissions: ['project:write'],
    jobTypes: ['document_parse'],
    hidden: false
  },
  {
    slug: 'image-upscaler',
    name: 'Image Upscaler',
    category: TOOL_CATEGORIES.MEDIA,
    enabledByDefault: true,
    route: '/app/tools/media/upscale',
    apiNamespace: '/api/media/upscale',
    capabilities: ['image_upscale'],
    requiredFeatures: [],
    requiredPermissions: ['project:write'],
    jobTypes: ['upscale'],
    hidden: false
  },
  {
    slug: 'ai-chat',
    name: 'AURA Brain',
    category: TOOL_CATEGORIES.AUTOMATION,
    enabledByDefault: true,
    route: '/app/tools/ai/chat',
    apiNamespace: '/api/ai/chat',
    capabilities: ['room_semantics', 'style_recommendation', 'design_plan', 'render_prompt_compose', 'render_critique'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['aura_task'],
    hidden: false
  },
  {
    slug: 'brain-architecture',
    name: 'Brain Architecture',
    category: TOOL_CATEGORIES.AUTOMATION,
    enabledByDefault: true,
    route: '/app/brain-arch',
    apiNamespace: '/api/ai/os',
    capabilities: ['agent_orchestration', 'memory_feedback'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['aura_task'],
    hidden: false
  },
  {
    slug: '3d-studio',
    name: '3D Studio',
    category: TOOL_CATEGORIES.RENDER,
    enabledByDefault: true,
    route: '/app/tools/render/3d',
    apiNamespace: '/api/projects/:id/renders',
    capabilities: ['render_view', 'walkthrough', 'laminate_swap'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['quick_render', 'detailed_render'],
    hidden: false
  },
  {
    slug: 'command-center',
    name: 'Command Center',
    category: TOOL_CATEGORIES.AUTOMATION,
    enabledByDefault: true,
    route: '/app/command-center',
    apiNamespace: '/api/projects/:id',
    capabilities: ['project_dashboard', 'job_lifecycle'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: [],
    hidden: false
  },
  {
    slug: 'cutlist-exporter',
    name: 'Cutlist Exporter',
    category: TOOL_CATEGORIES.COMMERCE,
    enabledByDefault: true,
    route: '/app/tools/commerce/cutlist',
    apiNamespace: '/api/projects/:id/cutlist',
    capabilities: ['cutlist_export', 'nest_preview', 'cnc_dxf'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['cutlist_calculate'],
    hidden: false
  },
  {
    slug: 'pdf-builder',
    name: 'PDF Builder',
    category: TOOL_CATEGORIES.DOCS,
    enabledByDefault: true,
    route: '/app/tools/docs/pdf',
    apiNamespace: '/api/projects/:id/brief/pdf',
    capabilities: ['pdf_generate', 'quotation_pdf', 'signoff_pdf'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['pdf_build'],
    hidden: false
  },
  {
    slug: 'dxf-exporter',
    name: 'DXF Exporter',
    category: TOOL_CATEGORIES.DOCS,
    enabledByDefault: true,
    route: '/app/tools/docs/dxf',
    apiNamespace: '/api/projects/:id/drawings/dxf',
    capabilities: ['dxf_export', 'elevation_dxf', 'scene_dxf'],
    requiredFeatures: [],
    requiredPermissions: ['project:read'],
    jobTypes: ['dxf_export'],
    hidden: false
  }
]);

const toolRegistry = {};

for (const tool of TOOLS) {
  toolRegistry[tool.slug] = { ...tool };
}

export const TOOL_REGISTRY = new Proxy(toolRegistry, {
  get(_target, slug) {
    return _target[String(slug)] || null;
  },
  set(_target, slug, tool) {
    if (!tool?.slug) {
      throw new Error('Tool registration requires slug.');
    }
    _target[String(slug)] = { ...tool };
    return true;
  }
});

export function getToolBySlug(slug) {
  return toolRegistry[slug] || null;
}

export function getToolsByCategory(category) {
  return Object.values(toolRegistry).filter((tool) => tool.category === category);
}

export function getEnabledTools() {
  return Object.values(toolRegistry).filter((tool) => tool.enabledByDefault && !tool.hidden);
}

export function listToolSlugs() {
  return Object.keys(toolRegistry);
}

export function validateToolCapabilities(toolSlug, requiredCapabilities = []) {
  const tool = getToolBySlug(toolSlug);
  if (!tool) return false;
  return requiredCapabilities.every((cap) => tool.capabilities.includes(cap));
}

export function registerTool(tool) {
  if (!tool || !tool.slug || !tool.category) {
    throw new Error('Tool registration requires slug and category.');
  }
  const existing = getToolBySlug(tool.slug);
  const merged = existing ? { ...existing, ...tool } : { ...tool };
  toolRegistry[tool.slug] = merged;
  return merged;
}
