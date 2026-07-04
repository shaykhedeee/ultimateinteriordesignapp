import rateLimit from 'express-rate-limit';

const schemas = {
  '/api/tools/run': { toolKey: 'string', projectId: 'string', params: 'object?' },
  '/api/projects/:id/cad': { walls: 'array?', openings: 'array?', furniture: 'array?', rooms: 'array?', measures: 'object?' },
  '/api/projects/:id/floorplan': {},
  '/api/projects/:id/renders/generate': { room: 'string?', style: 'string?', renderMode: 'string?' },
  '/api/projects/:id/renders/edit': { assetId: 'string', revisionRequest: 'string', renderMode: 'string?' },
  '/api/projects/:id/renders/laminate-swap': { instruction: 'string?', room: 'string?' },
  '/api/projects/:id/renders/suggest-palette': { roomType: 'string?', baseColor: 'string?' },
  '/api/projects/:id/zones/design-plan': { planType: 'string?', notes: 'string?' },
  '/api/projects/:id/elevations/generate': { wallFace: 'string?' },
  '/api/settings/pricing': { price_per_sqft: 'number?', labor_cost_per_sqft: 'number?', client_discount_rate: 'number?', ex_showroom_markup: 'number?' }
};

function parseBody(req) { return req.body || {}; }
function coerce(value, type) {
  if (value === undefined || value === null) return undefined;
  if (type === 'string') return String(value);
  if (type === 'number') return Number(value);
  if (type === 'object') return typeof value === 'object' ? value : undefined;
  if (type === 'array') return Array.isArray(value) ? value : undefined;
  return value;
}
function validate(pattern, body) {
  const missing = [];
  const out = {};
  for (const [key, rawType] of Object.entries(pattern)) {
    const required = !rawType.endsWith('?');
    const type = rawType.replace('?', '');
    const value = body[key];
    if (value === undefined || value === null) {
      if (required) missing.push(key);
      continue;
    }
    out[key] = coerce(value, type);
  }
  if (missing.length) return { error: `Missing required fields: ${missing.join(', ')}` };
  return { data: out };
}

export function applyValidation(app) {
  for (const [pattern, shape] of Object.entries(schemas)) {
    const method = pattern.startsWith('/api/projects/') || pattern.startsWith('/api/settings/') ? 'post' : 'get';
    const exact = (reqPath, reqMethod) => {
      if (pattern.includes(':id')) {
        const prefix = pattern.split(':id')[0];
        if (reqPath.startsWith(prefix) && reqMethod === method.toUpperCase()) return true;
      }
      return reqPath === pattern && reqMethod === method.toUpperCase();
    };
    app.use((req, res, next) => {
      if (!exact(req.path, req.method)) return next();
      if (req.method !== 'POST') return next();
      const { error } = validate(shape, req.body || {});
      if (error) return res.status(400).json({ error });
      next();
    });
  }
}
