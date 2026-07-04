/**
 * Firm Project Templates
 *
 * Lets each firm/org save and reuse project shells:
 * - client intake fields
 * - default rooms
 * - default style presets
 * - default vendor lists
 * - default pricing profiles
 *
 * This is a whitelabel-first feature: every firm gets its own
 * branded starting points, not a generic blank project.
 */

import db from '../database/database.js';

const TABLE = 'firm_project_templates';

export function listTemplates({ organizationId, scope = 'org' } = {}) {
  const rows = db.prepare(`SELECT * FROM ${TABLE} WHERE (organization_id = ? OR scope = ?) ORDER BY is_system DESC, created_at DESC`).all(organizationId, 'global');
  return rows.map(desensitize);
}

export function getTemplate(templateId, organizationId) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ? AND (organization_id = ? OR scope = ?)`).get(templateId, organizationId, 'global');
  return row ? desensitize(row) : null;
}

export function createTemplate({ organizationId, scope = 'org', name, description, thumbnailUrl, rooms = [], stylePreset, vendorList, pricingProfile, isSystem = false } = {}) {
  const id = 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  db.prepare(`INSERT INTO ${TABLE} (id, organization_id, scope, name, description, thumbnail_url, rooms_json, style_preset, vendor_list_json, pricing_profile_json, is_system) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, organizationId, scope, name, description || null, thumbnailUrl || null, JSON.stringify(rooms), stylePreset || null, JSON.stringify(vendorList || []), JSON.stringify(pricingProfile || {}), isSystem ? 1 : 0);
  return getTemplate(id, organizationId);
}

export function applyTemplate(templateId, organizationId, overrides = {}) {
  const template = getTemplate(templateId, organizationId);
  if (!template) return null;
  const projectName = overrides.projectName || template.name;
  const rooms = Array.isArray(template.rooms_json) ? template.rooms_json : JSON.parse(template.rooms_json || '[]');
  const vendorList = Array.isArray(template.vendor_list_json) ? template.vendor_list_json : JSON.parse(template.vendor_list_json || '[]');
  const pricingProfile = template.pricing_profile_json && typeof template.pricing_profile_json === 'string' ? JSON.parse(template.pricing_profile_json) : (template.pricing_profile_json || {});
  
  return {
    source: 'firm-template',
    templateId: template.id,
    projectName,
    rooms: rooms.map(r => ({ ...r, ...(overrides.roomOverrides?.[r.id] || {}) })),
    stylePreset: template.style_preset,
    vendorList,
    pricingProfile: { ...pricingProfile, ...(overrides.pricingOverrides || {}) },
    description: template.description,
    thumbnailUrl: template.thumbnail_url
  };
}

export function seedSystemTemplates(organizationId) {
  const existing = db.prepare(`SELECT COUNT(*) as cnt FROM ${TABLE} WHERE organization_id = ? AND is_system = 1`).get(organizationId).cnt;
  if (existing > 0) return [];
  
  const templates = [
    {
      name: '3BHK Modern Indian Apartment',
      description: 'Standard 3BHK with parallel kitchen, 2 wardrobes, pooja unit, living/dining',
      rooms: [
        { id: 'living', roomType: 'living', label: 'Living', priority: 1 },
        { id: 'dining', roomType: 'dining', label: 'Dining', priority: 2 },
        { id: 'master', roomType: 'bedroom', label: 'Master Bedroom', priority: 3 },
        { id: 'bedroom2', roomType: 'bedroom', label: 'Bedroom 2', priority: 4 },
        { id: 'kitchen', roomType: 'kitchen', label: 'Kitchen', priority: 0 },
        { id: 'pooja', roomType: 'pooja', label: 'Pooja Unit', priority: 5 }
      ],
      stylePreset: 'modern',
      pricingProfile: { default_markup_profile: 'standard', price_band_target: 'standard' }
    },
    {
      name: 'Luxury Penthouse Suite',
      description: 'Premium finishes, walk-in wardrobe, island kitchen, panoramic living',
      rooms: [
        { id: 'living', roomType: 'living', label: 'Living', priority: 1 },
        { id: 'kitchen', roomType: 'kitchen', label: 'Island Kitchen', priority: 0 },
        { id: 'master', roomType: 'bedroom', label: 'Master Suite', priority: 2 },
        { id: 'walkin', roomType: 'wardrobe', label: 'Walk-in Wardrobe', priority: 3 }
      ],
      stylePreset: 'luxury',
      pricingProfile: { default_markup_profile: 'premium', price_band_target: 'premium' }
    },
    {
      name: 'Compact 2BHK Rental Package',
      description: 'Budget-friendly essentials: kitchen, wardrobe,tv unit, minimal decor',
      rooms: [
        { id: 'living', roomType: 'living', label: 'Living + TV Unit', priority: 1 },
        { id: 'kitchen', roomType: 'kitchen', label: 'Kitchen', priority: 0 },
        { id: 'master', roomType: 'bedroom', label: 'Bedroom', priority: 2 },
        { id: 'bedroom2', roomType: 'bedroom', label: 'Bedroom 2', priority: 3 }
      ],
      stylePreset: 'scandinavian',
      pricingProfile: { default_markup_profile: 'economy', price_band_target: 'economy' }
    }
  ];

  return templates.map(t => createTemplate({ organizationId, scope: 'global', isSystem: true, ...t }));
}

function desensitize(row) {
  if (!row) return null;
  const { ...rest } = row;
  if (rest.rooms_json && typeof rest.rooms_json === 'string') {
    try { rest.rooms = JSON.parse(rest.rooms_json); } catch { rest.rooms = []; }
    delete rest.rooms_json;
  }
  if (rest.vendor_list_json && typeof rest.vendor_list_json === 'string') {
    try { rest.vendorList = JSON.parse(rest.vendor_list_json); } catch { rest.vendorList = []; }
    delete rest.vendor_list_json;
  }
  if (rest.pricing_profile_json && typeof rest.pricing_profile_json === 'string') {
    try { rest.pricingProfile = JSON.parse(rest.pricing_profile_json); } catch { rest.pricingProfile = {}; }
    delete rest.pricing_profile_json;
  }
  return rest;
}
