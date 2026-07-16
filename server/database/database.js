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

// Swap-on-boot: a restore wrote a pending DB to ultimate_interior.db.new while
// the server was live (Windows locks the open .db, so it can't be overwritten
// directly). Promote it now, before any connection is established.
const pendingDb = dbPath + '.new';
if (fs.existsSync(pendingDb)) {
  try {
    // Remove any WAL siblings of the pending file, then drop the live db
    // (Windows renameSync cannot overwrite an existing target -> rm first).
    for (const s of ['-wal', '-shm']) {
      try { fs.rmSync(pendingDb + s, { force: true }); } catch (_) {}
    }
    for (const s of ['', '-wal', '-shm']) {
      try { fs.rmSync(dbPath + s, { force: true }); } catch (_) {}
    }
    // copyFile is more reliable than rename on Windows when replacing a file.
    fs.copyFileSync(pendingDb, dbPath);
    try { fs.rmSync(pendingDb, { force: true }); } catch (_) {}
    console.log('[db] promoted pending restore database -> ultimate_interior.db');
  } catch (e) {
    console.error('[db] pending restore promotion failed:', e.message);
  }
}

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
    status TEXT DEFAULT 'brief', -- lifecycle: 'brief' -> 'cad_approved' -> 'renders_approved' -> 'signed_off' -> 'production' (terminal 'closed' only when archived)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    invoice_number TEXT NOT NULL,
    description TEXT,
    amount REAL,
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Enhanced GST / itemized invoice fields
    items_json TEXT,
    client_name TEXT,
    client_address TEXT,
    client_gstin TEXT,
    issue_date TEXT,
    due_date TEXT,
    subtotal REAL,
    discount REAL DEFAULT 0,
    taxable REAL,
    cgst REAL DEFAULT 0,
    sgst REAL DEFAULT 0,
    igst REAL DEFAULT 0,
    gst_rate REAL DEFAULT 18,
    is_inter_state INTEGER DEFAULT 0,
    round_off REAL DEFAULT 0,
    grand_total REAL,
    paid_amount REAL DEFAULT 0,
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
    is_active INTEGER DEFAULT 1,
    source TEXT DEFAULT 'manual'
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
    status TEXT NOT NULL, -- 'queued', 'running', 'succeeded', 'failed'
    progress INTEGER DEFAULT 0,
    source_entity_type TEXT,
    source_entity_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(floor_plan_version_id) REFERENCES floor_plan_versions(id)
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
try { db.exec("ALTER TABLE projects ADD COLUMN floorplan_url TEXT;"); } catch (e) {}
// Invoice generator enhancement (GST / itemized)
const invoiceCols = [
  'items_json TEXT', 'client_name TEXT', 'client_address TEXT', 'client_gstin TEXT',
  'issue_date TEXT', 'due_date TEXT', 'subtotal REAL', 'discount REAL DEFAULT 0',
  'taxable REAL', 'cgst REAL DEFAULT 0', 'sgst REAL DEFAULT 0', 'igst REAL DEFAULT 0',
  'gst_rate REAL DEFAULT 18', 'is_inter_state INTEGER DEFAULT 0', 'round_off REAL DEFAULT 0',
  'grand_total REAL', 'paid_amount REAL DEFAULT 0', 'cancelled INTEGER DEFAULT 0'
];
invoiceCols.forEach(c => { try { db.exec(`ALTER TABLE invoices ADD COLUMN ${c};`); } catch (e) {} });
try { db.exec("ALTER TABLE cad_drawings ADD COLUMN plan_text TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE cad_drawings ADD COLUMN north_angle REAL DEFAULT 0;"); } catch (e) {}

// ── Client Board pipeline fields ──
try { db.exec("ALTER TABLE leads ADD COLUMN deal_stage TEXT DEFAULT 'new';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN tokens_paid REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN designs_sent INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN notes TEXT;"); } catch (e) {}

// Client approval / sign-off gate. A project may not be advanced to
// "designs sent" / production until the client has signed off (recorded here).
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS signoffs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      lead_id TEXT,
      client_name TEXT,
      pack_type TEXT DEFAULT 'signoff',     -- brief | signoff | quotation
      signature_token TEXT,                 -- opaque client signature token
      status TEXT DEFAULT 'approved',       -- approved | revoked
      signed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
} catch (e) {}

// Ensure the source column exists (added for catalogue provenance). Defensive
// migration so existing databases get the column without a full reset.
try {
  db.prepare('ALTER TABLE material_catalog ADD COLUMN source TEXT DEFAULT \'manual\'').run();
} catch (e) { /* column already exists */ }

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

console.log("Ultimate Interior Design SQLite Database initialized at:", dbPath);

// ── Idempotent schema additions for: app_settings, shared_links, api_keys ──
try {
  const cols = db.prepare("PRAGMA table_info(app_settings)").all().map(c => c.name);
  if (!cols.includes('studio_name')) {
    // Old key-value schema (id, value, updated_at) → migrate to columnar schema.
    db.prepare("ALTER TABLE app_settings RENAME TO app_settings_legacy").run();
    db.prepare(`CREATE TABLE app_settings (
      id TEXT PRIMARY KEY,
      studio_name TEXT,
      tagline TEXT,
      logo_text TEXT,
      accent_color TEXT DEFAULT '#C9A84C',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`).run();
    const legacy = db.prepare("SELECT id, value, updated_at FROM app_settings_legacy").all();
    const ins = db.prepare("INSERT OR REPLACE INTO app_settings (id, studio_name, tagline, logo_text, accent_color, updated_at) VALUES (?,?,?,?,?,?)");
    for (const row of legacy) {
      let v = {};
      try { v = JSON.parse(row.value || '{}'); } catch {}
      ins.run(row.id, v.studio_name || v.studioName || 'ULTIDA', v.tagline || '', v.logo_text || v.logoText || 'U', v.accent_color || v.accentColor || '#C9A84C', row.updated_at || new Date().toISOString());
    }
    db.prepare("DROP TABLE app_settings_legacy").run();
  }
} catch (e) { console.warn("app_settings migration warn:", e.message); }
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS shared_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'presentation',
    pdf_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );`).run();
} catch (e) { console.warn("shared_links schema warn:", e.message); }
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    key_enc TEXT NOT NULL,
    label TEXT,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
  );`).run();
} catch (e) { console.warn("api_keys schema warn:", e.message); }

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS company_brain_kb (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    learned_rule TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`).run();
} catch (e) { console.warn("company_brain_kb schema warn:", e.message); }

// Scene-graph lineage: every render MUST derive from an approved scene version
// (geometry is the source of truth — AI only polishes it). These columns make
// the lineage auditable and let us reject renders that have no scene backing.
try { db.exec("ALTER TABLE design_renders ADD COLUMN scene_version_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN geometry_hash TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN render_stage TEXT DEFAULT 'ai_polish';"); } catch (e) {}
try { db.exec("ALTER TABLE design_renders ADD COLUMN source TEXT;"); } catch (e) {}

// Phase 4: material swaps must record structured slot + component + approval so
// every laminate change is auditable and geometry-preserving.
try { db.exec("ALTER TABLE laminate_swap_history ADD COLUMN component_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE laminate_swap_history ADD COLUMN material_slot TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE laminate_swap_history ADD COLUMN keep_others_same INTEGER DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE laminate_swap_history ADD COLUMN before_material TEXT;"); } catch (e) {}

// Phase 5: render provenance/lineage for generated assets
try { db.exec("ALTER TABLE generated_assets ADD COLUMN scene_version_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE generated_assets ADD COLUMN parent_asset_id TEXT;"); } catch (e) {}

import dbClient from './db-client.js';
export default dbClient;

