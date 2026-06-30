-- ============================================================
-- SPACIOUS VENTURE STUDIO OS
-- Migration 003: AI Render Enhancements
-- Floor plan analysis, render results, color changes tables
-- ============================================================

-- 1. Floor Plan Analysis Results
DROP TABLE IF EXISTS floor_plan_analyses;

CREATE TABLE IF NOT EXISTS floor_plan_analyses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  original_filename TEXT,
  analysis_json TEXT NOT NULL,  -- Full JSON of floor plan analysis
  rooms_count INTEGER DEFAULT 0,
  walls_count INTEGER DEFAULT 0,
  components_count INTEGER DEFAULT 0,
  confidence REAL DEFAULT 0,
  status TEXT DEFAULT 'completed',  -- processing | completed | failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fpa_project ON floor_plan_analyses(project_id);

-- 2. Render Generation Results
CREATE TABLE IF NOT EXISTS render_generations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  style TEXT DEFAULT 'modern',
  budget TEXT DEFAULT 'standard',
  quality TEXT DEFAULT 'balanced',
  variant_count INTEGER DEFAULT 4,
  rooms_data TEXT NOT NULL,  -- JSON array of rooms with variants
  total_variants INTEGER DEFAULT 0,
  selected_variant TEXT,     -- e.g., 'v1'
  status TEXT DEFAULT 'pending-review',  -- pending-review | approved | rejected
  accuracy_score REAL,       -- Overall spatial validation score
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rg_project ON render_generations(project_id);

-- 3. Render Variants (individual variant images/data)
CREATE TABLE IF NOT EXISTS render_variants (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES render_generations(id) ON DELETE CASCADE,
  variant_key TEXT NOT NULL,  -- v1, v2, v3, v4
  name TEXT,                  -- "Designer's Choice", etc.
  prompt_used TEXT,
  image_path TEXT,            -- path to generated image
  image_svg TEXT,             -- SVG fallback
  component_masks TEXT,       -- JSON of component masks for color editing
  spatial_validation TEXT,    -- validation result JSON
  status TEXT DEFAULT 'active', -- active | approved | rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rv_generation ON render_variants(generation_id);

-- 4. Component Color Changes
CREATE TABLE IF NOT EXISTS component_color_changes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  generation_id TEXT REFERENCES render_generations(id),
  variant_key TEXT,
  component_type TEXT NOT NULL,   -- sofa, tv-unit, wardrobe, etc.
  previous_color TEXT,
  previous_material TEXT,
  new_color TEXT NOT NULL,
  new_material TEXT,
  new_color_hex TEXT,
  applied_to_all_variants BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ccc_project ON component_color_changes(project_id);

-- 5. Reference Library Index
CREATE TABLE IF NOT EXISTS reference_library (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  category TEXT NOT NULL,        -- living-room, kitchen, bedroom, etc.
  subcategory TEXT,
  style TEXT,
  budget_tier TEXT,
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,
  metadata_json TEXT,            -- Full metadata
  ai_training_ready BOOLEAN DEFAULT 0,
  source TEXT DEFAULT 'upload',  -- upload | ai-generated | stock
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rl_category ON reference_library(category);
CREATE INDEX IF NOT EXISTS idx_rl_style ON reference_library(style);

-- 6. User Color Preferences (learned from designer behavior)
CREATE TABLE IF NOT EXISTS user_color_preferences (
  id TEXT PRIMARY KEY,
  studio_id TEXT DEFAULT 'default',
  component_type TEXT NOT NULL,
  preferred_color TEXT,
  preferred_material TEXT,
  use_count INTEGER DEFAULT 1,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ucp_component ON user_color_preferences(studio_id, component_type);

-- ============================================================
-- UPDATE EXISTING projects table with new fields
-- ============================================================

-- ALTER TABLE client_projects ADD COLUMN floor_plan_analysis_id TEXT REFERENCES floor_plan_analyses(id);
-- ALTER TABLE client_projects ADD COLUMN active_render_generation_id TEXT REFERENCES render_generations(id);
-- ALTER TABLE client_projects ADD COLUMN render_approved BOOLEAN DEFAULT 0;
-- ALTER TABLE client_projects ADD COLUMN approved_render_note TEXT;

-- ============================================================
-- SEED DATA: Reference Library Metadata for downloaded images
-- ============================================================

INSERT OR IGNORE INTO reference_library (id, filename, category, style, budget_tier, image_path, source, ai_training_ready)
VALUES 
  ('lr-001', 'modern-living-01.jpg', 'living-room', 'modern', 'premium', '/storage/reference/indian-interiors/living-rooms/modern-living-01.jpg', 'stock', 1),
  ('lr-002', 'modern-living-02.jpg', 'living-room', 'contemporary', 'standard', '/storage/reference/indian-interiors/living-rooms/modern-living-02.jpg', 'stock', 1),
  ('lr-003', 'indian-living-03.jpg', 'living-room', 'indian-contemporary', 'premium', '/storage/reference/indian-interiors/living-rooms/indian-living-03.jpg', 'stock', 1),
  ('lr-004', 'indian-modern-living-room.jpg', 'living-room', 'indian-modern', 'premium', '/storage/reference/indian-interiors/living-rooms/indian-modern-living-room.jpg', 'ai-generated', 1),
  ('kt-001', 'kitchen-01.jpg', 'kitchen', 'modern', 'premium', '/storage/reference/indian-interiors/kitchens/kitchen-01.jpg', 'stock', 1),
  ('kt-002', 'indian-modular-kitchen.jpg', 'kitchen', 'indian-modern', 'premium', '/storage/reference/indian-interiors/kitchens/indian-modular-kitchen.jpg', 'ai-generated', 1),
  ('br-001', 'bedroom-01.jpg', 'bedroom', 'modern', 'premium', '/storage/reference/indian-interiors/bedrooms/bedroom-01.jpg', 'stock', 1),
  ('br-002', 'indian-master-bedroom.jpg', 'bedroom', 'indian-modern', 'premium', '/storage/reference/indian-interiors/bedrooms/indian-master-bedroom.jpg', 'ai-generated', 1),
  ('wd-001', 'wardrobe-01.jpg', 'wardrobe', 'modern', 'standard', '/storage/reference/indian-interiors/wardrobes/wardrobe-01.jpg', 'stock', 1),
  ('wd-002', 'modern-sliding-wardrobe.jpg', 'wardrobe', 'indian-modern', 'premium', '/storage/reference/indian-interiors/wardrobes/modern-sliding-wardrobe.jpg', 'ai-generated', 1),
  ('tv-001', 'tvunit-01.jpg', 'tv-unit', 'modern', 'standard', '/storage/reference/indian-interiors/tv-units/tvunit-01.jpg', 'stock', 1),
  ('tv-002', 'modern-tv-unit.jpg', 'tv-unit', 'indian-modern', 'premium', '/storage/reference/indian-interiors/tv-units/modern-tv-unit.jpg', 'ai-generated', 1),
  ('pj-001', 'pooja-01.jpg', 'pooja-unit', 'traditional', 'standard', '/storage/reference/indian-interiors/pooja-units/pooja-01.jpg', 'stock', 1),
  ('pj-002', 'modern-pooja-unit.jpg', 'pooja-unit', 'indian-modern', 'premium', '/storage/reference/indian-interiors/pooja-units/modern-pooja-unit.jpg', 'ai-generated', 1),
  ('dn-001', 'dining-01.jpg', 'dining-area', 'modern', 'standard', '/storage/reference/indian-interiors/dining-areas/dining-01.jpg', 'stock', 1),
  ('3d-lr-01', 'modern-living-3d-01.jpg', 'living-room', 'modern', 'premium', '/storage/reference/indian-interiors/renders-3d/modern-living-3d-01.jpg', 'ai-generated', 1),
  ('3d-kit-01', 'modern-kitchen-3d-01.jpg', 'kitchen', 'modern', 'premium', '/storage/reference/indian-interiors/renders-3d/modern-kitchen-3d-01.jpg', 'ai-generated', 1),
  ('3d-br-01', 'master-bedroom-3d-01.jpg', 'bedroom', 'modern', 'premium', '/storage/reference/indian-interiors/renders-3d/master-bedroom-3d-01.jpg', 'ai-generated', 1),
  ('3d-wd-01', 'wardrobe-3d-01.jpg', 'wardrobe', 'modern', 'premium', '/storage/reference/indian-interiors/renders-3d/wardrobe-3d-01.jpg', 'ai-generated', 1),
  ('3d-pj-01', 'pooja-unit-3d-01.jpg', 'pooja-unit', 'indian-modern', 'premium', '/storage/reference/indian-interiors/renders-3d/pooja-unit-3d-01.jpg', 'ai-generated', 1),
  ('3d-dn-01', 'dining-room-3d-01.jpg', 'dining-area', 'modern', 'premium', '/storage/reference/indian-interiors/renders-3d/dining-room-3d-01.jpg', 'ai-generated', 1);

-- -- Update project stages to support enhanced flow
-- UPDATE client_projects 
-- SET current_stage = 'render-review' 
-- WHERE current_stage = 'renders' OR current_stage = 'ai-renders';