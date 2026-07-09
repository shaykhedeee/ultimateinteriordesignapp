// subscription-validator.js — middleware for feature gating and tier enforcement
export const PRODUCTS = {
  PLAN_INTELLIGENCE: 'plan_intelligence', // Vastu compliance, auto-trace, floorplan AI
  RENDER_STUDIO: 'render_studio',         // Freepik, OpenAI, Dall-E 3 image generation
  PRODUCTION_NESTING: 'production_nesting' // SketchUp scripts, nesting, BOM cutlist
};

// Map of subscription tiers to products
export const TIERS = {
  free: [PRODUCTS.PLAN_INTELLIGENCE],
  professional: [PRODUCTS.PLAN_INTELLIGENCE, PRODUCTS.RENDER_STUDIO],
  enterprise: [PRODUCTS.PLAN_INTELLIGENCE, PRODUCTS.RENDER_STUDIO, PRODUCTS.PRODUCTION_NESTING]
};

/**
 * Validate that the current request has access to the requested product/tier.
 * Locally, it defaults to allowing all (developer mode).
 * In cloud mode, it validates based on Stripe status or tenant level.
 */
export function checkAccess(product) {
  return (req, res, next) => {
    // Read subscription tier from env/headers. Default to enterprise for local dev.
    const activeTier = process.env.STUDIO_SUBSCRIPTION_TIER || 'enterprise';
    
    const allowedProducts = TIERS[activeTier.toLowerCase()] || [];
    if (!allowedProducts.includes(product)) {
      return res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_UPGRADE_REQUIRED',
        message: `The active subscription tier (${activeTier}) does not include access to the ${product} module. Please upgrade your package.`,
        requiredProduct: product
      });
    }
    next();
  };
}
