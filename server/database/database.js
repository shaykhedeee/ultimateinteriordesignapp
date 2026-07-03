import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../storage');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ultimate_interior.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    budget REAL,
    area REAL,
    requirements TEXT,
    score INTEGER DEFAULT 0,
    voice_status TEXT DEFAULT 'new', -- 'new', 'calling', 'qualified', 'disqualified', 'human_closed', 'human_lost'
    call_transcript TEXT,
    call_recording TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    budget REAL,
    unit_system TEXT DEFAULT 'metric',
    status TEXT DEFAULT 'closed', -- 'closed', 'brief_complete', 'cad_approved', 'renders_approved', 'signed_off', 'production'
    current_step TEXT DEFAULT 'brief',
    advance_paid_amount REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    client_brief_json TEXT, -- Store room-by-room design preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS cad_drawings (
    id TEXT PRIMARY KEY,
    project_id TEXT UNIQUE,
    walls_json TEXT,
    openings_json TEXT,
    furniture_json TEXT,
    rooms_json TEXT,
    measures_json TEXT,
    pixels_per_meter REAL DEFAULT 40.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS material_selections (
    id TEXT PRIMARY KEY,
    project_id TEXT UNIQUE,
    laminates_json TEXT, -- array of selected laminates
    hardware_json TEXT, -- array of handles/fixtures
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS design_renders (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    image_url TEXT,
    sketchup_script_txt TEXT,
    room TEXT,
    prompt TEXT,
    review_status TEXT DEFAULT 'unreviewed',
    review_note TEXT,
    render_mode TEXT DEFAULT 'new-interior',
    source_type TEXT DEFAULT 'generative',
    provider_used TEXT,
    variant_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    invoice_number TEXT NOT NULL,
    description TEXT,
    amount REAL,
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
  CREATE TABLE IF NOT EXISTS production_cutlists (
    id TEXT PRIMARY KEY,
    project_id TEXT UNIQUE,
    cutlist_data_json TEXT,
    optimized_sheets_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS render_corrections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    asset_id TEXT,
    room TEXT NOT NULL,
    mistake TEXT NOT NULL,
    correction TEXT NOT NULL,
    prompt_patch TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS render_variants (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    render_id TEXT,
    variant_key TEXT NOT NULL,
    image_url TEXT NOT NULL,
    prompt_used TEXT,
    component_masks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS component_color_changes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    variant_key TEXT NOT NULL,
    component_type TEXT NOT NULL,
    previous_color TEXT,
    new_color TEXT NOT NULL,
    applied_to_all BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS generated_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    room TEXT NOT NULL,
    style TEXT NOT NULL,
    budget_tier TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    file_path TEXT NOT NULL,
    tags TEXT NOT NULL,
    source_type TEXT NOT NULL,
    reusable_score INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS reference_library (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    style TEXT,
    budget_tier TEXT,
    image_path TEXT NOT NULL,
    thumbnail_path TEXT,
    metadata_json TEXT,
    ai_training_ready BOOLEAN DEFAULT 1,
    source TEXT DEFAULT 'upload',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS generation_costs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    asset_id TEXT,
    source_type TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    unit_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS render_generation_jobs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    room TEXT NOT NULL,
    provider TEXT NOT NULL,
    quality_mode TEXT NOT NULL,
    spend_mode TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS scene_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    branch_name TEXT NOT NULL DEFAULT 'main',
    parent_scene_version_id TEXT,
    is_current INTEGER DEFAULT 1,
    is_locked INTEGER DEFAULT 0,
    lock_reason TEXT,
    scene_json TEXT NOT NULL,
    scene_hash TEXT NOT NULL,
    summary_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    UNIQUE (project_id, branch_name, version_number)
  );

  CREATE TABLE IF NOT EXISTS material_catalog (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    subcategory TEXT,
    code TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    finish TEXT,
    color TEXT,
    price_per_sqft REAL DEFAULT 0,
    rating REAL DEFAULT 5.0,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS render_color_preferences (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    render_id TEXT,
    component_type TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS laminate_swap_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    render_id TEXT,
    component_type TEXT NOT NULL,
    new_material TEXT,
    new_color TEXT,
    laminate_code TEXT,
    laminate_brand TEXT,
    result_file_path TEXT,
    source_type TEXT,
    prompt TEXT,
    approved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    source_entity_type TEXT,
    source_entity_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS provider_configs (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    provider TEXT NOT NULL,
    provider_mode TEXT NOT NULL DEFAULT 'platform',
    capabilities TEXT NOT NULL DEFAULT '[]',
    fallback_order TEXT NOT NULL DEFAULT '[]',
    api_key TEXT,
    endpoint_url TEXT,
    metadata_json TEXT DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS provider_routing_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    job_id TEXT,
    task_type TEXT NOT NULL,
    selected_provider TEXT NOT NULL,
    provider_mode TEXT NOT NULL,
    capability_match TEXT NOT NULL DEFAULT '[]',
    fallback_used INTEGER NOT NULL DEFAULT 0,
    error_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS ai_jobs (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT NOT NULL,
    zone_id TEXT,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    stage TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0,
    provider TEXT,
    provider_job_id TEXT,
    input_json TEXT,
    output_json TEXT,
    error_json TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS budget_profiles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER DEFAULT 1,
    is_current INTEGER DEFAULT 1,
    budget_band TEXT,
    target_budget REAL,
    max_budget REAL,
    scope_type TEXT,
    priorities_json TEXT,
    preferences_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS estimate_sets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scene_version_id TEXT,
    budget_profile_id TEXT,
    estimate_type TEXT,
    version_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    totals_json TEXT,
    items_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS payment_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    estimate_set_id TEXT,
    name TEXT,
    version_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    total_contract_value REAL,
    milestones_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    payment_plan_id TEXT,
    amount REAL,
    payment_method TEXT,
    payment_date TEXT,
    status TEXT DEFAULT 'cleared',
    allocations_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS variation_orders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_estimate_set_id TEXT,
    variation_code TEXT,
    status TEXT DEFAULT 'priced',
    reason_category TEXT,
    description TEXT,
    cost_delta REAL DEFAULT 0,
    timeline_delta_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    vendor_name TEXT,
    po_number TEXT,
    category TEXT,
    status TEXT DEFAULT 'issued',
    expected_delivery_date TEXT,
    subtotal REAL DEFAULT 0,
    tax_total REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    lines_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS floor_plan_versions (
    id TEXT PRIMARY KEY,
    studio_id TEXT,
    project_id TEXT,
    source_asset_id TEXT,
    version_number INTEGER,
    is_current INTEGER DEFAULT 1,
    interpretation_status TEXT, -- 'draft', 'review_required', 'approved', 'superseded'
    overall_confidence REAL,
    scale_unit TEXT DEFAULT 'mm',
    scale_factor REAL,
    interpretation_json TEXT,
    reviewed_json TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS floor_plan_review_items (
    id TEXT PRIMARY KEY,
    floor_plan_version_id TEXT,
    item_type TEXT, -- 'room', 'wall', 'opening', 'dimension', 'symbol'
    item_ref TEXT,
    confidence REAL,
    severity TEXT, -- 'info', 'warning', 'critical'
    status TEXT DEFAULT 'open', -- 'open', 'accepted', 'corrected', 'ignored'
    suggested_value_json TEXT,
    resolved_value_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY(floor_plan_version_id) REFERENCES floor_plan_versions(id)
  );

  CREATE TABLE IF NOT EXISTS spatial_model_versions (
    id TEXT PRIMARY KEY,
    studio_id TEXT,
    project_id TEXT,
    floor_plan_version_id TEXT,
    version_number INTEGER,
    is_current INTEGER DEFAULT 1,
    model_json TEXT,
    summary_json TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(floor_plan_version_id) REFERENCES floor_plan_versions(id)
  );

  CREATE TABLE IF NOT EXISTS topview_render_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    floor_plan_version_id TEXT,
    spatial_model_version_id TEXT,
    kind TEXT DEFAULT 'canonical_topview',
    preset TEXT DEFAULT 'technical_clean',
    mode TEXT,
    svg_url TEXT,
    png_url TEXT,
    enhanced_image_url TEXT,
    prompt TEXT,
    style_reference_url TEXT,
    validation TEXT DEFAULT '{"status":"pending","wallDrift":0,"openingDrift":0,"topologyMismatch":false,"geometryMismatch":false,"accepted":false}',
    fallback_reason TEXT,
    provider TEXT,
    model TEXT,
    tags TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    floor_plan_version_id TEXT,
    zone_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    level TEXT,
    points_json TEXT NOT NULL,
    wall_count INTEGER DEFAULT 0,
    opening_count INTEGER DEFAULT 0,
    symbol_count INTEGER DEFAULT 0,
    area_mm2 REAL DEFAULT 0,
    area_sqft REAL DEFAULT 0,
    perimeter_mm REAL DEFAULT 0,
    bounding_box TEXT,
    aspect_ratio REAL,
    window_to_wall_ratio REAL DEFAULT 0,
    window_count INTEGER DEFAULT 0,
    door_count INTEGER DEFAULT 0,
    confidence REAL DEFAULT 0,
    metadata_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS zone_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    kind TEXT DEFAULT 'thumbnail',
    preset TEXT DEFAULT 'technical_clean',
    file_path TEXT NOT NULL,
    url TEXT,
    fallback INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS zone_design_plans (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT NOT NULL,
    floor_plan_version_id TEXT,
    zone_id TEXT NOT NULL,
    mode TEXT DEFAULT 'faithful_clean',
    status TEXT DEFAULT 'ready',
    design_direction TEXT,
    style_keywords TEXT,
    palette TEXT,
    materials TEXT,
    lighting_strategy TEXT,
    placement_notes TEXT,
    suggested_products TEXT,
    rendering_constraints TEXT,
    prompt_ready_instructions TEXT,
    constraints TEXT DEFAULT '{}',
    source_thumb_svg_url TEXT,
    generated_image_url TEXT,
    provider TEXT,
    model TEXT,
    fallback_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

// Self-healing migration for existing databases
try { db.exec("ALTER TABLE design_renders ADD COLUMN room TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN prompt TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN review_status TEXT DEFAULT 'unreviewed';"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN review_note TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN quotation_json TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN stale_renders INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN stale_drawings INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN stale_pricing INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN active_floor_plan_version_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN active_spatial_model_version_id TEXT;"); } catch (e) {}

// Seed default material catalog if empty
try {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM material_catalog").get().cnt;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO material_catalog (id, category, subcategory, code, name, brand, finish, color, price_per_sqft, rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    // Seed laminates
    insert.run('lam_1', 'laminate', 'carcass_interior', 'SF-9120', 'Frosty White', 'CenturyPly', 'Suede Matte', '#f3f4f6', 45, 4.8);
    insert.run('lam_2', 'laminate', 'carcass_interior', 'SF-9210', 'Ivory Cream', 'CenturyPly', 'Suede Matte', '#fef3c7', 48, 4.6);
    insert.run('lam_3', 'laminate', 'carcass_interior', 'MT-1001', 'Light Concrete Grey', 'Greenlam', 'Texture Matt', '#d1d5db', 52, 4.7);
    insert.run('lam_4', 'laminate', 'shutter_facade', 'W-4211', 'Bourbon Walnut', 'Royale Touche', 'Horizontal Woodgrain', '#5c4033', 85, 4.9);
    insert.run('lam_5', 'laminate', 'shutter_facade', 'W-4501', 'Driftwood Teak', 'Royale Touche', 'Brushed Wood', '#8b7355', 90, 4.8);
    insert.run('lam_6', 'laminate', 'shutter_facade', 'AC-105', 'Electric Blue Acrylic', 'Greenlam', 'High Gloss Acrylic', '#1d4ed8', 120, 4.5);
    insert.run('lam_7', 'laminate', 'shutter_facade', 'AC-202', 'Pearl White Acrylic', 'Greenlam', 'High Gloss Acrylic', '#f8fafc', 115, 4.7);
    insert.run('lam_8', 'laminate', 'shutter_facade', 'AC-303', 'Champagne Gold Acrylic', 'Merino', 'High Gloss Acrylic', '#d4af37', 135, 4.9);
    insert.run('lam_9', 'laminate', 'shutter_facade', 'MT-8012', 'Charcoal Matte', 'Royale Touche', 'Anti-Fingerprint Matte', '#27272a', 95, 4.8);
    // Seed hardware
    insert.run('hw_1', 'hardware', 'runners', 'H-01', 'Soft-Close Drawer Runners', 'Hettich', 'Drawer slides', '', 850, 4.9);
    insert.run('hw_2', 'hardware', 'hinges', 'B-hinge', 'Clip-Top 110° Hinge', 'Blum', 'Hinges', '', 220, 5.0);
    insert.run('hw_3', 'hardware', 'baskets', 'E-bsk', 'Modular Pullout Wire Baskets', 'Ebco', 'Pantry baskets', '', 3200, 4.7);
    insert.run('hw_4', 'hardware', 'lift_systems', 'B-avt', 'Aventos HF Lift Up', 'Blum', 'Bi-fold horizontal lift-up', '', 6500, 4.9);
    insert.run('hw_5', 'hardware', 'handles', 'G-handle', 'G-Profile Aluminium Handle', 'Hafele', 'Integrated anodized profile', '', 180, 4.9);
  }
} catch (e) {
  console.error("Error seeding material catalog:", e);
}

// Create Furniture Catalog Table
db.exec(`
  CREATE TABLE IF NOT EXISTS furniture_catalog (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    style_tags TEXT,
    trend_tags TEXT,
    room_types TEXT,
    params_json TEXT,
    gltf_asset_path TEXT,
    preview_color TEXT,
    preview_label TEXT,
    placement_type TEXT DEFAULT 'floor',
    snap_origin TEXT DEFAULT 'center',
    material_zones TEXT,
    price_band TEXT DEFAULT 'standard',
    price REAL DEFAULT 0,
    dimensions_json TEXT,
    thumbnail TEXT
  );
`);

// Seed default furniture catalog if empty
try {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM furniture_catalog").get().cnt;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO furniture_catalog (
        key, label, category, style_tags, trend_tags, room_types, params_json, 
        gltf_asset_path, preview_color, preview_label, placement_type, snap_origin, 
        material_zones, price_band, price, dimensions_json, thumbnail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'bed_queen_upholstered', 'Queen Upholstered Bed', 'bed',
      'modern,soft-curved,comfort-first', 'curved,warm-neutral', 'master_bedroom,bedroom,guest_bedroom',
      JSON.stringify({ widthMm: 1800, heightMm: 1100, depthMm: 2100, headboardType: 'upholstered' }),
      '/models/furniture/bed_lowpoly.gltf', '#8ea6c9', 'Low-poly bed family preview',
      'floor', 'bottom', 'headboard,frame,legs', 'premium', 34500,
      JSON.stringify({ minWidth: 1500, maxWidth: 2000, minHeight: 900, maxHeight: 1300 }),
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'bed_storage_laminate', 'Storage Bed Laminate', 'bed',
      'practical,family-storage', 'storage-first', 'master_bedroom,bedroom',
      JSON.stringify({ widthMm: 1800, heightMm: 1050, depthMm: 2100, storageBase: 'yes' }),
      '/models/furniture/bed_lowpoly.gltf', '#9bb087', 'Low-poly bed family preview',
      'floor', 'bottom', 'frame,headboard,internal_storage', 'standard', 28000,
      JSON.stringify({ minWidth: 1500, maxWidth: 2000 }),
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'sofa_l_shape_curved', 'L-Shape Curved Sofa', 'sofa',
      'modern,comfort-first', 'curved,deep-seating', 'living_room',
      JSON.stringify({ widthMm: 2800, heightMm: 850, depthMm: 1700, sofaType: 'l_shape' }),
      '/models/furniture/sofa_lshape_lowpoly.gltf', '#c79574', 'Low-poly sofa L-shape preview',
      'floor', 'bottom', 'upholstery,legs', 'premium', 54000,
      JSON.stringify({ minWidth: 2400, maxWidth: 3200 }),
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'sofa_three_seater_linear', '3-Seater Linear Sofa', 'sofa',
      'modern,minimal', 'neutral-base', 'living_room',
      JSON.stringify({ widthMm: 2200, heightMm: 850, depthMm: 950, sofaType: 'linear' }),
      '/models/furniture/sofa_linear_lowpoly.gltf', '#bf9f7f', 'Low-poly sofa linear preview',
      'floor', 'bottom', 'upholstery,legs', 'standard', 32000,
      JSON.stringify({ minWidth: 1800, maxWidth: 2400 }),
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'tv_unit_fluted_backlit', 'Fluted Backlit TV Unit', 'tv_unit',
      'premium,feature-wall', 'textured-casegoods,warm-lighting', 'living_room',
      JSON.stringify({ widthMm: 2400, heightMm: 500, depthMm: 420, panelType: 'fluted', consoleType: 'floating', finishTier: 'veneer_premium' }),
      '/models/furniture/tv_unit_feature_lowpoly.gltf', '#7aa884', 'Low-poly TV feature wall preview',
      'wall', 'back', 'console_body,fluted_backdrop,marble_panel,led_strip', 'premium', 45000,
      JSON.stringify({ minWidth: 1800, maxWidth: 3000 }),
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'tv_unit_minimal_wood', 'Minimalist Wood Slats TV Unit', 'tv_unit',
      'minimalist,warm-oak,clean-lines', 'wood-slats,neutral-wood', 'living_room,bedroom',
      JSON.stringify({ widthMm: 2000, heightMm: 450, depthMm: 400, panelType: 'slatted', consoleType: 'floor_mount', finishTier: 'laminate_matte' }),
      '/models/furniture/tv_unit_feature_lowpoly.gltf', '#d2b48c', 'Low-poly slatted wood TV unit',
      'floor', 'bottom', 'console_body,slats_panel', 'standard', 22000,
      JSON.stringify({ minWidth: 1600, maxWidth: 2400 }),
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'tv_unit_marble_floating', 'Luxurious Marble Floating Console', 'tv_unit',
      'luxury,marble,sophisticated', 'calacatta-marble,led-underglow', 'living_room',
      JSON.stringify({ widthMm: 2800, heightMm: 600, depthMm: 450, panelType: 'marble_slab', consoleType: 'floating', finishTier: 'acrylic_high_gloss' }),
      '/models/furniture/tv_unit_feature_lowpoly.gltf', '#ffffff', 'Luxury floating marble media wall',
      'wall', 'back', 'console_body,marble_cladding,led_glow', 'premium', 65000,
      JSON.stringify({ minWidth: 2200, maxWidth: 3200 }),
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'tv_unit_compact_apartment', 'Compact Apartment Media Unit', 'tv_unit',
      'compact,space-saving,practical', 'shelving-towers,multi-functional', 'living_room,bedroom,kids_bedroom',
      JSON.stringify({ widthMm: 1500, heightMm: 1800, depthMm: 380, panelType: 'shelf_towers', consoleType: 'floor_mount', finishTier: 'pre_lam_particle' }),
      '/models/furniture/tv_unit_feature_lowpoly.gltf', '#c0c0c0', 'Compact shelving TV unit',
      'floor', 'back', 'shelving_body,base_console', 'economy', 12500,
      JSON.stringify({ minWidth: 1200, maxWidth: 1800 }),
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'dresser_clean_mirror_unit', 'Dresser + Mirror Unit', 'dresser',
      'modern,bedroom', 'warm-wood', 'master_bedroom,bedroom',
      JSON.stringify({ widthMm: 1200, heightMm: 780, depthMm: 500, mirrorType: 'round' }),
      '/models/furniture/dresser_mirror_lowpoly.gltf', '#b79bca', 'Low-poly dresser preview',
      'floor', 'back', 'carcass,shutter,mirror_frame', 'standard', 18500,
      null,
      'https://images.unsplash.com/photo-1596162954151-cd54178520cd?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'wardrobe_aristo_glass', 'Aristo Glass Sliding Wardrobe', 'wardrobe',
      'premium,glass', 'dark-glass,slim-frame', 'master_bedroom',
      JSON.stringify({ widthMm: 2400, heightMm: 2700, depthMm: 650, doorCount: 3, wardrobeSystem: 'aristo_glass' }),
      '/models/furniture/wardrobe_tall_lowpoly.gltf', '#6f88a8', 'Low-poly wardrobe preview',
      'floor', 'back', 'carcass,glass_shutters,metal_profiles,internal_led', 'premium', 85000,
      JSON.stringify({ minDepth: 650, maxDepth: 700 }),
      'https://images.unsplash.com/photo-1558882224-cca166733360?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'wardrobe_laminate_swing', 'Laminate Swing Wardrobe', 'wardrobe',
      'standard,practical', 'warm-wood,storage-first', 'master_bedroom,bedroom,kids_bedroom',
      JSON.stringify({ widthMm: 2400, heightMm: 2700, depthMm: 600, doorCount: 4, wardrobeSystem: 'laminate_swing' }),
      '/models/furniture/wardrobe_tall_lowpoly.gltf', '#7c9e67', 'Low-poly wardrobe preview',
      'floor', 'back', 'carcass,laminate_shutter,handles', 'standard', 42000,
      JSON.stringify({ minDepth: 600, maxDepth: 650 }),
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'study_desk_compact', 'Compact Study Desk', 'study',
      'compact,functional', 'work-from-home', 'study,master_bedroom,bedroom',
      JSON.stringify({ widthMm: 1400, heightMm: 760, depthMm: 550 }),
      '/models/furniture/study_desk_lowpoly.gltf', '#c3a46f', 'Low-poly study desk preview',
      'floor', 'back', 'tabletop,legs,drawer_shutter', 'economy', 9500,
      null,
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'mandir_backlit_jali', 'Backlit Jali Mandir', 'mandir',
      'spiritual,premium', 'jali,backlit-panel', 'mandir_room,living_room',
      JSON.stringify({ widthMm: 900, heightMm: 1800, depthMm: 450, backPanelType: 'jali', storageBase: 'yes' }),
      '/models/furniture/mandir_compact_lowpoly.gltf', '#d5b56b', 'Low-poly mandir preview',
      'floor', 'back', 'body,jali_backplate,lighting_fixtures,base_cabinets', 'premium', 24500,
      null,
      'https://images.unsplash.com/photo-1609137144813-9f874ab0cf7f?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'kitchen_base_cabinet_laminate', 'Kitchen Base Cabinet Run', 'kitchen_base_cabinet',
      'kitchen,modular', 'efficient-storage', 'kitchen,utility',
      JSON.stringify({ widthMm: 2400, heightMm: 850, depthMm: 600, drawerCount: 3, doorCount: 2 }),
      '/models/furniture/generic_cuboid.gltf', '#7dbb74', 'Base cabinet preview',
      'floor', 'back', 'carcass,shutter_finish,countertop,handles', 'standard', 36000,
      JSON.stringify({ minHeight: 800, maxHeight: 900, minDepth: 560, maxDepth: 620 }),
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'kitchen_wall_cabinet_acrylic', 'Kitchen Acrylic Wall Cabinet', 'kitchen_wall_cabinet',
      'kitchen,modular,glossy', 'reflective-acrylic', 'kitchen',
      JSON.stringify({ widthMm: 2400, heightMm: 600, depthMm: 350, doorCount: 4 }),
      '/models/furniture/generic_cuboid.gltf', '#bfd9e2', 'Wall cabinet preview',
      'wall', 'back', 'carcass,shutter_finish,handles', 'premium', 29000,
      JSON.stringify({ minHeight: 500, maxHeight: 750, minDepth: 300, maxDepth: 380 }),
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=600&q=80'
    );

    insert.run(
      'pendant_light_brass', 'Modern Brass Pendant Light', 'pendant_light',
      'lighting,contemporary', 'brass-accents', 'dining_room,kitchen,foyer',
      JSON.stringify({ widthMm: 300, heightMm: 800, depthMm: 300, bulbCount: 1 }),
      '/models/furniture/generic_cuboid.gltf', '#ffd700', 'Pendant light preview',
      'ceiling', 'center', 'fixture_body,diffuser', 'premium', 4800,
      null,
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80'
    );
  }
} catch (e) {
  console.error("Error seeding furniture catalog:", e);
}

// Render history + localized edit lineage
db.exec(`CREATE TABLE IF NOT EXISTS render_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  zone_id TEXT,
  parent_render_id TEXT,
  kind TEXT DEFAULT 'render',
  image_url TEXT,
  prompt TEXT,
  negative_prompt TEXT,
  provider TEXT,
  model TEXT,
  seed INTEGER,
  style TEXT,
  room TEXT,
  metadata_json TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);`);

db.exec(`CREATE TABLE IF NOT EXISTS render_edits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  render_id TEXT NOT NULL,
  parent_render_id TEXT,
  edit_type TEXT NOT NULL,
  title TEXT,
  instruction TEXT NOT NULL,
  mask_asset_id TEXT,
  mask_bbox_json TEXT,
  reference_asset_id TEXT,
  room_style_context TEXT,
  geometry_context TEXT,
  preserve_camera INTEGER DEFAULT 1,
  preserve_geometry INTEGER DEFAULT 1,
  preserve_lighting_direction INTEGER DEFAULT 1,
  result_render_id TEXT,
  provider TEXT,
  model TEXT,
  status TEXT DEFAULT 'queued',
  error_json TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(render_id) REFERENCES render_history(id),
  FOREIGN KEY(parent_render_id) REFERENCES render_history(id),
  FOREIGN KEY(result_render_id) REFERENCES render_history(id),
  FOREIGN KEY(mask_asset_id) REFERENCES file_assets(id)
);`);

db.exec(`CREATE TABLE IF NOT EXISTS render_edit_masks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  render_edit_id TEXT NOT NULL,
  file_asset_id TEXT NOT NULL,
  format TEXT DEFAULT 'png',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(render_edit_id) REFERENCES render_edits(id),
  FOREIGN KEY(file_asset_id) REFERENCES file_assets(id)
);`);

try { db.exec("ALTER TABLE render_edits ADD COLUMN room_style_context TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE render_edits ADD COLUMN geometry_context TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE render_edits ADD COLUMN preserve_camera INTEGER DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE render_edits ADD COLUMN preserve_geometry INTEGER DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE render_edits ADD COLUMN preserve_lighting_direction INTEGER DEFAULT 1;"); } catch (e) {}

console.log("Ultimate Interior Design SQLite Database initialized at:", dbPath);

export default db;

