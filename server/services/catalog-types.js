/**
 * Catalog typed contracts
 *
 * These types document the expected shapes for catalog entities.
 * Backend uses JS; keep these minimal here and avoid changing tool runtime.
 */

/** @typedef {{ id: string, organizationId: string, scope: 'org'|'global', category: string, subcategory?: string, sku?: string, name: string, description?: string, tags: string[], dimensions: Record<string, unknown>, finishes: string[], pricingVisible: boolean, unitPrice: number, currency: string, metadata: Record<string, unknown>, isActive: boolean, createdAt: string, updatedAt: string }} CatalogProduct */

/** @typedef {{ id: string, organizationId: string, scope: 'org'|'global', category: string, subcategory?: string, sku?: string, name: string, brand?: string, finish?: string, color?: string, texture?: string, tags: string[], dimensions: Record<string, unknown>, unit: string, pricePerUnit: number, currency: string, thumbnailImagePath?: string, metadata: Record<string, unknown>, isActive: boolean, createdAt: string, updatedAt: string }} CatalogMaterial */

/** @typedef {{ id: string, organizationId: string, scope: 'org'|'global', category: string, name: string, sku?: string, tags: string[], unitPrice: number, currency: string, isActive: boolean }} CatalogProductSummary */

/** @typedef {{ id: string, materialId: string, organizationId: string, kind: string, url: string, storagePath?: string, width?: number, height?: number, tags: string[], isPrimary: boolean }} MaterialImage */

/** @typedef {{ id: string, productId: string, organizationId: string, kind: string, url: string, storagePath?: string, width?: number, height?: number, tags: string[], isPrimary: boolean }} ProductImage */

/** @typedef {{ id: string, organizationId: string, projectId: string, zoneId: string, assignableType: 'product'|'material', assignableId: string, role: string, quantity: number, unit: string, dimensionOverrides: Record<string, unknown>, promptNotes?: string }} ZoneAssignment */
