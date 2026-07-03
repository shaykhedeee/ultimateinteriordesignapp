import { migrateCatalogTables } from '../migrations/create-catalog-tables.js';

export class CatalogService {
  constructor(dbInstance) {
    this.db = dbInstance;
  }

  init() {
    migrateCatalogTables();
  }

  searchProducts({ organizationId, scope = 'org', query = '', category, subcategory, tags = [], minPrice, maxPrice, limit = 50, offset = 0 }) {
    const params = [];
    const clauses = ['(scope = ? OR scope = ?)', '(organization_id = ? OR scope = ?)'];
    params.push(scope, 'global', organizationId, 'global');

    if (query) {
      clauses.push('(name LIKE ? OR description LIKE ? OR sku LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (category) { clauses.push('category = ?'); params.push(category); }
    if (subcategory) { clauses.push('subcategory = ?'); params.push(subcategory); }
    for (const tag of tags) { clauses.push('tags_json LIKE ?'); params.push(`%"${tag}"%`); }
    if (minPrice != null) { clauses.push('unit_price >= ?'); params.push(Number(minPrice)); }
    if (maxPrice != null) { clauses.push('unit_price <= ?'); params.push(Number(maxPrice)); }

    const where = clauses.join(' AND ');
    const rows = this.db.prepare(`SELECT * FROM catalog_products WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset));
    return rows.map(this.#desensitize);
  }

  getProduct(productId, organizationId) {
    const row = this.db.prepare("SELECT * FROM catalog_products WHERE id = ? AND (organization_id = ? OR scope = ?)").get(productId, organizationId, 'global');
    return row ? this.#desensitize(row) : null;
  }

  createProduct({ organizationId, scope = 'org', category, subcategory, sku, name, description, tags = [], dimensions = {}, finishes = [], pricingVisible, unitPrice = 0, currency = 'INR', metadata = {} }) {
    const id = 'prod_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    this.db.prepare(`INSERT INTO catalog_products (id, organization_id, scope, category, subcategory, sku, name, description, tags_json, dimensions_json, finishes_json, pricing_visible, unit_price, currency, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, scope, category || 'General', subcategory || null, sku || null, name, description || null, JSON.stringify(tags), JSON.stringify(dimensions), JSON.stringify(finishes), pricingVisible ? 1 : 0, Number(unitPrice), currency, JSON.stringify(metadata));
    return this.getProduct(id, organizationId);
  }

  updateProduct(productId, organizationId, patch = {}) {
    const current = this.getProduct(productId, organizationId);
    if (!current) return null;
    this.db.prepare(`UPDATE catalog_products SET category = COALESCE(?, category), name = COALESCE(?, name), unit_price = COALESCE(?, unit_price), metadata_json = COALESCE(?, metadata_json), updated_at = ? WHERE id = ? AND (organization_id = ? OR scope = ?)`)
      .run(patch.category || current.category, patch.name || current.name, patch.unitPrice != null ? patch.unitPrice : current.unit_price, patch.metadata != null ? JSON.stringify(patch.metadata) : current.metadata_json, new Date().toISOString(), productId, organizationId, 'global');
    return this.getProduct(productId, organizationId);
  }

  deleteProduct(productId, organizationId) {
    const row = this.db.prepare("SELECT id FROM catalog_products WHERE id = ? AND (organization_id = ? OR scope = ?)").get(productId, organizationId, 'global');
    if (!row) return false;
    this.db.prepare("DELETE FROM catalog_products WHERE id = ?").run(productId);
    return true;
  }

  searchMaterials({ organizationId, scope = 'org', query = '', category, subcategory, tags = [], minPrice, maxPrice, brand, finish, color, limit = 50, offset = 0 }) {
    const params = [];
    const clauses = ['(scope = ? OR scope = ?)', '(organization_id = ? OR scope = ?)'];
    params.push(scope, 'global', organizationId, 'global');

    if (query) { clauses.push('(name LIKE ? OR brand LIKE ? OR sku LIKE ?)'); params.push(`%${query}%`, `%${query}%`, `%${query}%`); }
    if (category) { clauses.push('category = ?'); params.push(category); }
    if (subcategory) { clauses.push('subcategory = ?'); params.push(subcategory); }
    if (brand) { clauses.push('brand = ?'); params.push(brand); }
    if (finish) { clauses.push('finish = ?'); params.push(finish); }
    if (color) { clauses.push('color = ?'); params.push(color); }
    for (const tag of tags) { clauses.push('tags_json LIKE ?'); params.push(`%"${tag}"%`); }
    if (minPrice != null) { clauses.push('price_per_unit >= ?'); params.push(Number(minPrice)); }
    if (maxPrice != null) { clauses.push('price_per_unit <= ?'); params.push(Number(maxPrice)); }

    const where = clauses.join(' AND ');
    const rows = this.db.prepare(`SELECT * FROM catalog_materials WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset));
    return rows.map(this.#desensitize);
  }

  createMaterial({ organizationId, scope = 'org', category, subcategory, sku, name, brand, finish, color, texture, tags = [], dimensions = {}, unit = 'sqft', pricePerUnit = 0, currency = 'INR', thumbnailImagePath, metadata = {} }) {
    const id = 'mat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    this.db.prepare(`INSERT INTO catalog_materials (id, organization_id, scope, category, subcategory, sku, name, brand, finish, color, texture, tags_json, dimensions_json, unit, price_per_unit, currency, thumbnail_image_path, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, scope, category || 'General', subcategory || null, sku || null, name, brand || null, finish || null, color || null, texture || null, JSON.stringify(tags), JSON.stringify(dimensions), unit, Number(pricePerUnit), currency, thumbnailImagePath || null, JSON.stringify(metadata));
    return this.getMaterial(id, organizationId);
  }

  getMaterial(materialId, organizationId) {
    const row = this.db.prepare("SELECT * FROM catalog_materials WHERE id = ? AND (organization_id = ? OR scope = ?)").get(materialId, organizationId, 'global');
    return row ? this.#desensitize(row) : null;
  }

  updateMaterial(materialId, organizationId, patch = {}) {
    const current = this.getMaterial(materialId, organizationId);
    if (!current) return null;
    const set = [
      'category = COALESCE(?, category)',
      'name = COALESCE(?, name)',
      'brand = COALESCE(?, brand)',
      'finish = COALESCE(?, finish)',
      'color = COALESCE(?, color)',
      'price_per_unit = COALESCE(?, price_per_unit)',
      'metadata_json = COALESCE(?, metadata_json)',
      'updated_at = ?'
    ];
    const values = [
      patch.category || current.category,
      patch.name || current.name,
      patch.brand || current.brand,
      patch.finish || current.finish,
      patch.color || current.color,
      patch.pricePerUnit != null ? patch.pricePerUnit : current.price_per_unit,
      patch.metadata != null ? JSON.stringify(patch.metadata) : current.metadata_json,
      new Date().toISOString()
    ];
    this.db.prepare(`UPDATE catalog_materials SET ${set.join(', ')} WHERE id = ? AND (organization_id = ? OR scope = ?)`)
      .run(...values, materialId, organizationId, 'global');
    return this.getMaterial(materialId, organizationId);
  }

  deleteMaterial(materialId, organizationId) {
    const row = this.db.prepare("SELECT id FROM catalog_materials WHERE id = ? AND (organization_id = ? OR scope = ?)").get(materialId, organizationId, 'global');
    if (!row) return false;
    this.db.prepare("DELETE FROM catalog_materials WHERE id = ?").run(materialId);
    return true;
  }

  addProductImage(productId, organizationId, { kind = 'reference', url, storagePath, width, height, tags = [], isPrimary }) {
    const id = 'pimg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    this.db.prepare('INSERT INTO product_images (id, product_id, organization_id, kind, url, storage_path, width, height, tags_json, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, productId, organizationId, kind, url, storagePath || null, width || null, height || null, JSON.stringify(tags), isPrimary ? 1 : 0);
    return this.getProductImage(id, organizationId);
  }

  getProductImage(imageId, organizationId) {
    const row = this.db.prepare("SELECT * FROM product_images WHERE id = ? AND organization_id = ?").get(imageId, organizationId);
    return row ? this.#desensitize(row) : null;
  }

  addMaterialImage(materialId, organizationId, { kind = 'reference', url, storagePath, width, height, tags = [], isPrimary }) {
    const id = 'mimg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    this.db.prepare('INSERT INTO material_images (id, material_id, organization_id, kind, url, storage_path, width, height, tags_json, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, materialId, organizationId, kind, url, storagePath || null, width || null, height || null, JSON.stringify(tags), isPrimary ? 1 : 0);
    return this.getMaterialImage(id, organizationId);
  }

  getMaterialImage(imageId, organizationId) {
    const row = this.db.prepare("SELECT * FROM material_images WHERE id = ? AND organization_id = ?").get(imageId, organizationId);
    return row ? this.#desensitize(row) : null;
  }

  assignZone({ organizationId, projectId, zoneId, assignableType, assignableId, role = 'primary', quantity = 1, unit = 'unit', dimensionOverrides = {}, promptNotes = '', metadata = {} }) {
    const id = 'za_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    this.db.prepare(`INSERT INTO zone_assignments (id, organization_id, project_id, zone_id, assignable_type, assignable_id, role, quantity, unit, dimension_overrides_json, prompt_notes, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, projectId, zoneId, assignableType, assignableId, role, Number(quantity), unit, JSON.stringify(dimensionOverrides), promptNotes || '', JSON.stringify(metadata));
    return this.getAssignment(id, organizationId);
  }

  getAssignment(assignmentId, organizationId) {
    const row = this.db.prepare("SELECT * FROM zone_assignments WHERE id = ? AND organization_id = ?").get(assignmentId, organizationId);
    return row ? this.#desensitize(row) : null;
  }

  listAssignments({ organizationId, projectId, zoneId }) {
    const params = [organizationId];
    const clauses = ['organization_id = ?'];
    if (projectId) { clauses.push('project_id = ?'); params.push(projectId); }
    if (zoneId) { clauses.push('zone_id = ?'); params.push(zoneId); }
    return this.db.prepare(`SELECT * FROM zone_assignments WHERE ${clauses.join(' AND ')} ORDER BY assigned_at DESC`).all(...params).map(this.#desensitize);
  }

  deleteAssignment(assignmentId, organizationId) {
    const row = this.db.prepare("SELECT id FROM zone_assignments WHERE id = ? AND organization_id = ?").get(assignmentId, organizationId);
    if (!row) return false;
    this.db.prepare("DELETE FROM zone_assignments WHERE id = ?").run(assignmentId);
    return true;
  }

  enrichPrompt({ zone, assignments = [], productRefs = [], materialRefs = [] }) {
    const lines = [
      String(zone?.name || zone?.type || 'zone'),
      'Selected catalog references:',
      ...(productRefs.length ? productRefs.map((p, i) => `- product: ${p.name}`) : []),
      ...(materialRefs.length ? materialRefs.map((m, i) => `- material: ${m.name} brand=${m.brand || 'n/a'} finish=${m.finish || 'n/a'} color=${m.color || 'n/a'}`) : [])
    ];
    return lines.filter(Boolean).join('\n');
  }

  #desensitize(row) {
    if (!row || typeof row !== 'object') return row;
    const copy = { ...row };
    for (const key of ['api_key', 'apiSecret', 'token', 'password']) {
      if (copy[key]) copy[key] = `[REDACTED]`;
    }
    return copy;
  }
}
