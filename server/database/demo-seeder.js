import db from './database.js';
import { nanoid } from 'nanoid';
import cutlistEngine from '../services/cutlist-engine.js';

export async function seedDemoProject() {
  const projectId = 'proj_demo_hsr';
  const leadId = 'lead_demo_hsr';

  // The demo is re-seedable, but many child tables FK-reference projects/
  // scene_versions. Wrap the clean+insert in a foreign_keys=OFF window so a
  // re-seed never fails with "FOREIGN KEY constraint failed".
  db.exec('PRAGMA foreign_keys = OFF');

  try {
  // 1. Clean existing demo project to allow re-seeding
  db.prepare('DELETE FROM cutlist_parts WHERE cutlist_project_id IN (SELECT id FROM cutlist_projects WHERE project_id = ?)').run(projectId);
  db.prepare('DELETE FROM cutlist_modules WHERE cutlist_project_id IN (SELECT id FROM cutlist_projects WHERE project_id = ?)').run(projectId);
  db.prepare('DELETE FROM cutlist_projects WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM production_cutlists WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM invoices WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM photo_elevations WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM generated_assets WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM scene_versions WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  db.prepare('DELETE FROM leads WHERE id = ?').run(leadId);

  // 2. Insert Lead
  db.prepare(`
    INSERT INTO leads (id, name, email, phone, location, budget, area, requirements, score, voice_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    leadId,
    'Muskan Khede',
    'muskan@example.com',
    '+91 99999 88888',
    'HSR Layout, Bangalore',
    950000,
    1400,
    'Premium L-shaped kitchen, tall units with built-in microwave slot, and living TV backdrop.',
    98,
    'qualified'
  );

  // 3. Insert Project
  const clientBrief = {
    lifestyle: 'family_with_kids',
    cookingHabits: 'heavy_indian',
    budgetTier: 'premium',
    selectedSpaces: ['kitchen', 'living'],
    applianceList: ['hob', 'chimney', 'built_in_microwave'],
    dislikedColors: ['purple', 'neon_green']
  };

  db.prepare(`
    INSERT INTO projects (id, lead_id, name, client_name, email, phone, budget, unit_system, status, current_step, advance_paid_amount, total_cost, client_brief_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId,
    leadId,
    'Sharma Premium Kitchen & Living',
    'Muskan Khede',
    'muskan@example.com',
    '+91 99999 88888',
    950000,
    'metric',
    'closed', // advanced status
    'production',
    95000, // 10% booking fee paid
    928000,
    JSON.stringify(clientBrief)
  );

  // 4. Seed initial 2D CAD layouts
  const walls = [
    { id: 'w1', roomIdPrimary: 'kitchen', x1: 0, y1: 0, x2: 3600, y2: 0, lengthMm: 3600, heightMm: 2800, thicknessMm: 150 },
    { id: 'w2', roomIdPrimary: 'kitchen', x1: 3600, y1: 0, x2: 3600, y2: 3000, lengthMm: 3000, heightMm: 2800, thicknessMm: 150 }
  ];

  const furniture = [
    { id: 'furn_fridge', room: 'kitchen', type: 'appliance', name: 'Refrigerator', x: 3000, y: 1500, widthMm: 800, heightMm: 1800, depthMm: 700 }
  ];

  const openings = [
    { id: 'op_door', type: 'door', wallId: 'w2', x: 3600, y: 200, widthMm: 900, heightMm: 2100 }
  ];

  const rooms = [
    { name: 'Kitchen', roomIdPrimary: 'kitchen', widthMm: 3600, depthMm: 3000, ceilingHeightMm: 2800 }
  ];

  db.prepare(`
    INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, measures_json, pixels_per_meter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'cad_' + projectId,
    projectId,
    JSON.stringify(walls),
    JSON.stringify(openings),
    JSON.stringify(furniture),
    JSON.stringify(rooms),
    JSON.stringify([]),
    40.0
  );

  // 5. Seed 3D Scene Graph version
  const sceneJson = {
    room_shell: {
      widthMm: 3600,
      depthMm: 3000,
      heightMm: 2800,
      walls: walls.map(w => ({
        id: w.id,
        x1: w.x1,
        y1: w.y1,
        x2: w.x2,
        y2: w.y2,
        lengthMm: w.lengthMm,
        heightMm: w.heightMm,
        thicknessMm: w.thicknessMm
      })),
      openings
    },
    placed_modules: [
      // Kitchen base units along wall 1 (0 to 3600)
      { id: 'sink_mod', type: 'base', widthMm: 800, heightMm: 720, depthMm: 560, xOffsetMm: 900, yOffsetMm: 0, zOffsetMm: 0, rotationDeg: 0, shutterMaterial: 'shutter_cream', room: 'kitchen', wallId: 'w1' },
      { id: 'hob_mod', type: 'base', widthMm: 900, heightMm: 720, depthMm: 560, xOffsetMm: 1700, yOffsetMm: 0, zOffsetMm: 0, rotationDeg: 0, shutterMaterial: 'shutter_cream', room: 'kitchen', wallId: 'w1' },
      { id: 'pantry_mod', type: 'tall', widthMm: 600, heightMm: 2100, depthMm: 560, xOffsetMm: 2600, yOffsetMm: 0, zOffsetMm: 0, rotationDeg: 0, shutterMaterial: 'shutter_wood', room: 'kitchen', wallId: 'w1' },
      // Wall overhead unit
      { id: 'overhead_mod', type: 'wall', widthMm: 900, heightMm: 600, depthMm: 350, xOffsetMm: 1700, yOffsetMm: 0, zOffsetMm: 1400, rotationDeg: 0, shutterMaterial: 'shutter_cream', room: 'kitchen', wallId: 'w1' }
    ],
    lighting: [
      { type: 'spot', xOffsetMm: 1000, yOffsetMm: 1000, zOffsetMm: 2700, intensityWatts: 50, temperatureKelvin: 3000 },
      { type: 'spot', xOffsetMm: 2000, yOffsetMm: 1000, zOffsetMm: 2700, intensityWatts: 50, temperatureKelvin: 3000 }
    ]
  };

  db.prepare(`
    INSERT INTO scene_versions (id, project_id, version_number, branch_name, is_current, scene_json, scene_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'scene_v_demo',
    projectId,
    1,
    'main',
    1, // active
    JSON.stringify(sceneJson),
    'hash_demo_123'
  );

  // 6. Seed Render Record pointing to final visual asset
  db.prepare(`
    INSERT INTO generated_assets (id, project_id, room, style, budget_tier, title, prompt, file_path, tags, source_type, reusable_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'render_demo_hsr',
    projectId,
    'kitchen',
    'indian-contemporary',
    'premium',
    'Sharma Premium Kitchen Render',
    'High-end modular kitchen render, beige marble, warm led lights.',
    '/images/kitchen_3d_render_final.png', // valid existing visual
    JSON.stringify(['kitchen', 'indian-contemporary', 'premium']),
    'blender-cycles-ai-polish',
    96
  );

  // 7. Seed Elevation record
  const elevationModel = {
    lengthMm: 3600,
    heightMm: 2800,
    cabinets: [
      { id: 'sink_mod', type: 'base', widthMm: 800, heightMm: 720, depthMm: 560, xOffsetMm: 900, zOffsetMm: 0 },
      { id: 'hob_mod', type: 'base', widthMm: 900, heightMm: 720, depthMm: 560, xOffsetMm: 1700, zOffsetMm: 0 },
      { id: 'pantry_mod', type: 'tall', widthMm: 600, heightMm: 2100, depthMm: 560, xOffsetMm: 2600, zOffsetMm: 0 },
      { id: 'overhead_mod', type: 'wall', widthMm: 900, heightMm: 600, depthMm: 350, xOffsetMm: 1700, zOffsetMm: 1400 }
    ]
  };

  db.prepare(`
    INSERT INTO photo_elevations (id, project_id, wall_id, wall_name, model_json, confidence)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'elev_demo_hsr',
    projectId,
    'w1',
    'Kitchen Elevation Wall 1',
    JSON.stringify(elevationModel),
    100
  );

  // 8. Seed itemized Quote (invoice) with GST calculations
  const quoteItems = [
    { name: 'Modular Kitchen Sink Base Cabinet', category: 'BASE', quantity: 1, rate: 12000, amount: 12000, description: 'BWP plywood carcass, acrylic shutters' },
    { name: 'Modular Kitchen Hob Base Cabinet', category: 'BASE', quantity: 1, rate: 14000, amount: 14000, description: 'BWP plywood carcass, soft close drawers' },
    { name: 'Tall Cabinet Pantry Module', category: 'TALL', quantity: 1, rate: 28000, amount: 28000, description: 'BWR carcass, premium sliding rollers' },
    { name: 'Modular Overhead Wall Unit', category: 'WALL', quantity: 1, rate: 9000, amount: 9000, description: 'Hydraulic lift-ups' },
    { name: 'Quartz Premium Countertop Installation', category: 'COUNTER', quantity: 1, rate: 18000, amount: 18000, description: 'Double nose-polished edge' }
  ];

  const subtotal = quoteItems.reduce((s, item) => s + item.amount, 0); // 81000
  const gstRate = 18;
  const taxable = subtotal; // no discount
  const cgst = Math.round((taxable * (gstRate / 2)) / 100); // 7290
  const sgst = cgst; // 7290
  const grandTotal = taxable + cgst + sgst; // 95580

  db.prepare(`
    INSERT INTO invoices (
      id, project_id, invoice_number, description, amount, status,
      items_json, client_name, issue_date, due_date, subtotal, taxable,
      cgst, sgst, grand_total, paid_amount, gst_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'invoice_demo_hsr',
    projectId,
    'INV-DEMO-2026',
    'Quotation invoice for Muskan Sharma flat modular kitchen',
    grandTotal,
    'paid',
    JSON.stringify(quoteItems),
    'Muskan Khede',
    '2026-07-10',
    '2026-07-20',
    subtotal,
    taxable,
    cgst,
    sgst,
    grandTotal,
    grandTotal, // fully paid
    gstRate
  );

  try {
    cutlistEngine.createOrRefreshCutlist(projectId);
    console.log(`[demo-seeder] Cutlist compiled successfully for demo project ${projectId}.`);
  } catch (err) {
    console.error("[demo-seeder] Failed to generate cutlist during seed:", err.stack || err);
  }

  } finally {
    // Restore FK enforcement (the app enables it at boot).
    db.exec('PRAGMA foreign_keys = ON');
  }

  return { success: true, projectId };
}
