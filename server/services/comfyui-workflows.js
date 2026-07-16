// ComfyUI workflow presets
// Place your real ComfyUI workflows here and import this map by path.
export const COMFYUI_WORKFLOW_TEMPLATE_PATHS = Object.freeze({
  rapid_sdxl_render: 'server/services/comfyui-workflows/rapid-sdxl-render.json',
  rapid_flux_render: 'server/services/comfyui-workflows/rapid-flux-render.json',
  exact_quality_render: 'server/services/comfyui-workflows/exact-quality-render.json'
});

export const COMFYUI_PRESETS = Object.freeze({
  rapid: {
    preset: 'rapid',
    workflowTemplateKey: 'rapid_flux_render',
    fallbackWorkflowTemplateKey: 'rapid_sdxl_render',
    defaultWidth: 512,
    defaultHeight: 320,
    defaultSeedSource: 'hash',
    notes: 'Fast interior draft render. Lower noise steps, smaller canvas. Output suitable for client previews and variant selection. Use only for speed-sensitive sessions.'
  },
  exact: {
    preset: 'exact',
    workflowTemplateKey: 'exact_quality_render',
    fallbackWorkflowTemplateKey: 'rapid_flux_render',
    defaultWidth: 1024,
    defaultHeight: 768,
    defaultSeedSource: 'deterministic',
    notes: 'Detailed client-ready render. Higher step counts, larger denoise, stronger conditioning. Use for final approved deliverables or polypanel exports.'
  }
});

export const COMFYUI_IMAGE_PROFILES = Object.freeze({
  interior_render: {
    promptPrefix: 'Interior design render,',
    promptSuffix: 'No people, no text, no watermark, photorealistic, 8k, high detail',
    negativePromptPrefix: 'deformed, distorted, watermark, text, humanity, people, person, blurry',
    warmDaylight: {
      promptSuffix: 'Natural daylight, warm ambient illumination, sunlit view, balanced shadow'
    },
    eveningCove: {
      promptSuffix: 'Evening cove lighting, warm 2700K glow, low contrast, luxurious ambience'
    },
    wideAngle: {
      cameraNotes: '24mm lens, wide angle, straight verticals, no barrel distortion'
    },
    standard: {
      cameraNotes: 'Neutral interior visualization, straight composition, balanced exposure'
    }
  }
});
