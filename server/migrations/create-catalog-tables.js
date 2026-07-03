import db from '../database/database.js';

export function migrateCatalogTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS catalog_products (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'org', -- 'org' | 'global'
      category TEXT NOT NULL,
      subcategory TEXT,
      sku TEXT,
      name TEXT NOT NULL,
      description TEXT,
      tags_json TEXT DEFAULT '[]',
      dimensions_json TEXT DEFAULT '{}',
      finishes_json TEXT DEFAULT '[]',
      pricing_visible INTEGER NOT NULL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      metadata_json TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catalog_materials (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'org',
      category TEXT NOT NULL,
      subcategory TEXT,
      sku TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      finish TEXT,
      color TEXT,
      texture TEXT,
      tags_json TEXT DEFAULT '[]',
      dimensions_json TEXT DEFAULT '{}',
      unit TEXT DEFAULT 'sqft',
      price_per_unit REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      thumbnail_image_path TEXT,
      metadata_json TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      kind TEXT DEFAULT 'reference', -- 'reference' | 'render' | 'texture'
      url TEXT NOT NULL,
      storage_path TEXT,
      width INTEGER,
      height INTEGER,
      tags_json TEXT DEFAULT '[]',
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES catalog_products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS material_images (
      id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      kind TEXT DEFAULT 'reference',
      url TEXT NOT NULL,
      storage_path TEXT,
      width INTEGER,
      height INTEGER,
      tags_json TEXT DEFAULT '[]',
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(material_id) REFERENCES catalog_materials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS zone_assignments (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      assignable_type TEXT NOT NULL, -- 'product' | 'material'
      assignable_id TEXT NOT NULL,
      role TEXT DEFAULT 'primary', -- 'primary' | 'secondary' | 'accent'
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'unit',
      dimension_overrides_json TEXT DEFAULT '{}',
      prompt_notes TEXT,
      metadata_json TEXT DEFAULT '{}',
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS zone_assignment_images (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      kind TEXT DEFAULT 'reference',
      url TEXT NOT NULL,
      storage_path TEXT,
      width INTEGER,
      height INTEGER,
      tags_json TEXT DEFAULT '[]',
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assignment_id) REFERENCES zone_assignments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_catalog_products_org ON catalog_products(organization_id, scope, category);
    CREATE INDEX IF NOT EXISTS idx_catalog_materials_org ON catalog_materials(organization_id, scope, category);
    CREATE INDEX IF NOT EXISTS idx_zone_assignments_project ON zone_assignments(project_id, zone_id);
    CREATE INDEX IF NOT EXISTS idx_zone_assignment_images_assignment ON zone_assignment_images(assignment_id);
  `, {
    timeout: 10000,
    busyTimeout: 5000
  });
}
