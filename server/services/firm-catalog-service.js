/**
 * Shopped Firm Catalog Service
 *
 * Firms can publish a branded, buyable product catalog linked to designs.
 * - Org-scoped catalog products
 * - pricingVisibility controls whether client sees prices or firm-only pricing
 * - simple cart/checkout intent can be added later; for now we store intent + unit cost
 */

import db from '../database/database.js';
import { searchProducts, createProduct as createCatalogProduct, getProduct } from './catalog-service.js';

const TABLE = 'firm_catalog_links';

export function linkDesignItem({ organizationId, productId, projectId, roomId, designItemId, markupProfile, clientVisible = true }) {
  const id = 'fcl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  db.prepare(`INSERT INTO ${TABLE} (id, organization_id, product_id, project_id, room_id, design_item_id, markup_profile, client_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, organizationId, productId, projectId || null, roomId || null, designItemId || null, markupProfile || 'standard', clientVisible ? 1 : 0);
  return getLink(id, organizationId);
}

export function getLink(linkId, organizationId) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ? AND organization_id = ?`).get(linkId, organizationId);
  return row ? desensitize(row) : null;
}

export function listLinks({ organizationId, projectId, roomId } = {}) {
  let sql = `SELECT * FROM ${TABLE} WHERE organization_id = ?`;
  const params = [organizationId];
  if (projectId) { sql += ` AND project_id = ?`; params.push(projectId); }
  if (roomId) { sql += ` AND room_id = ?`; params.push(roomId); }
  sql += ` ORDER BY created_at DESC`;
  return db.prepare(sql).all(...params).map(desensitize);
}

export function resolveClientPrice({ product, pricingProfile = {}, client = true, markupProfile = 'standard' } = {}) {
  if (!product) return null;
  const unitPrice = Number(product.unitPrice || 0);
  if (!client) return { unitPrice, currency: product.currency || 'INR', clientVisible: false, displayPrice: null };
  const settings = pricingProfile || {};
  const markup = settings[`${markupProfile}_markup_percent`] ?? settings.hardware_markup_percent ?? 18;
  const tax = settings.client_tax_percent ?? 12;
  const discount = settings.client_discount_percent ?? 0;
  const subtotal = unitPrice * (1 + Number(markup) / 100);
  const afterDiscount = subtotal * (1 - Number(discount) / 100);
  const finalPrice = afterDiscount * (1 + Number(tax) / 100);
  return {
    unitPrice,
    markupPercent: Number(markup),
    discountPercent: Number(discount),
    taxPercent: Number(tax),
    finalPrice: Math.round(finalPrice * 100) / 100,
    currency: product.currency || 'INR',
    clientVisible: true
  };
}

export function seedDemoCatalog(organizationId) {
  const existing = db.prepare(`SELECT COUNT(*) as cnt FROM ${TABLE} WHERE organization_id = ?`).get(organizationId).cnt;
  if (existing > 0) return listLinks({ organizationId });
  return [];
}

function desensitize(row) {
  if (!row) return null;
  const { ...rest } = row;
  return rest;
}
