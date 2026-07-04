import { z } from 'zod';

const schemas = {
  'POST:/api/tools/run': z.object({ projectId: z.string().min(1), toolKey: z.string().min(1), params: z.record(z.any()).optional() }),
  'POST:/api/tools/execute': z.object({ toolSlug: z.string().min(1), projectId: z.string().min(1), renderId: z.string().optional(), params: z.record(z.any()).optional(), provider: z.string().optional(), model: z.string().optional() }),
  'POST:/api/projects/:id/renders/generate': z.object({ room: z.string().optional(), style: z.string().optional(), budgetTier: z.string().optional(), modelTier: z.string().optional(), variantCount: z.number().int().min(1).max(8).optional(), renderMode: z.string().optional(), sourceType: z.string().optional() }),
  'POST:/api/projects/:id/renders/laminate-swap': z.object({ room: z.string().optional(), componentType: z.string().optional(), newMaterial: z.string().optional() }),
  'POST:/api/projects/:id/renders/suggest-palette': z.object({ roomType: z.string().optional(), baseColor: z.string().optional() }),
  'POST:/api/projects/:id/zones/design-plan': z.object({ planType: z.string().optional(), notes: z.string().optional() }),
  'POST:/api/projects/:id/elevations/generate': z.object({ wallFace: z.string().optional(), userMeasurements: z.record(z.any()).optional() }),
  'POST:/api/settings/defaults': z.object({ defaultProvider: z.string().optional(), defaultModel: z.string().optional(), freeProvidersFirst: z.boolean().optional(), maxCostPerImage: z.number().optional() }),
  'POST:/api/settings/pricing': z.object({ pricePerSqft: z.number().optional(), currency: z.string().optional() }),
  'POST:/api/projects/:id/ai/chat': z.object({ message: z.string().min(1).max(4000), provider: z.string().optional(), model: z.string().optional() }),
  'POST:/api/projects/:id/renders/:renderId/edits': z.object({ editType: z.string().min(1), mask: z.record(z.any()).optional(), instruction: z.string().max(4000).optional() }),
  'POST:/api/projects/:id/jobs': z.object({ jobType: z.string().min(1), sourceEntityType: z.string().optional(), sourceEntityId: z.string().optional() })
};

let applyValidation = null;
try {
  const express = await import('express');
  applyValidation = (app) => {
    app.use((req, res, next) => {
      if (req.method !== 'POST') return next();
      const key = `${req.method}:${req.route?.path || req.path}`;
      const schema = Object.keys(schemas).find(k => k === key);
      if (!schema) return next();
      const parsed = schemas[key].safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.issues.map(i => i.message) });
      }
      req.body = parsed.data;
      next();
    });
  };
} catch {
  applyValidation = () => {};
}

export { applyValidation };
