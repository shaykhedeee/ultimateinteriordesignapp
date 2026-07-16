import db from './database.js';
import { nanoid } from 'nanoid';

// Clear existing seed data if necessary
db.exec("PRAGMA foreign_keys = OFF; DELETE FROM leads; DELETE FROM projects; DELETE FROM cad_drawings; DELETE FROM material_selections; DELETE FROM invoices; DELETE FROM design_renders; DELETE FROM production_cutlists; PRAGMA foreign_keys = ON;");

// 1. Seed Leads
const leads = [
  {
    id: 'lead_1',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'HSR Layout, Bangalore',
    budget: 850000,
    area: 1200,
    requirements: '3 BHK Modular Kitchen, Master Bedroom Wardrobes, TV Unit and Living Room paneling.',
    score: 85,
    voice_status: 'qualified',
    call_transcript: 'AI: Hello Rohan, I see you are looking for interior design quotes. Rohan: Yes, I am actively looking to do modular interiors for my new 3BHK flat in HSR layout. I want a modular kitchen and wardrobes. AI: Great! I will assign a senior designer to reach out to you soon. Rohan: Sure, thank you.',
    call_recording: '/storage/calls/call_lead_1.mp3'
  },
  {
    id: 'lead_2',
    name: 'Anjali Verma',
    email: 'anjali.v@example.com',
    phone: '+91 91234 56789',
    location: 'Whitefield, Bangalore',
    budget: 1500000,
    area: 1800,
    requirements: 'Premium 4 BHK interior design, complete false ceiling, lighting, modular work, and modular kitchen with solid quartz countertop.',
    score: 95,
    voice_status: 'new',
    call_transcript: null,
    call_recording: null
  },
  {
    id: 'lead_3',
    name: 'Vikram Singh',
    email: 'vikram.s@example.com',
    phone: '+91 88888 77777',
    location: 'Indiranagar, Bangalore',
    budget: 300000,
    area: 800,
    requirements: 'Need only one wardrobe and repair for kitchen cabinets.',
    score: 42,
    voice_status: 'new',
    call_transcript: null,
    call_recording: null
  },
  {
    id: 'lead_4',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 99999 11111',
    location: 'Koramangala, Bangalore',
    budget: 650000,
    area: 1100,
    requirements: 'Modular kitchen and living room unit for a rental property.',
    score: 70,
    voice_status: 'calling',
    call_transcript: null,
    call_recording: null
  },
  {
    id: 'lead_5',
    name: 'Suresh Kumar',
    email: 'suresh.k@example.com',
    phone: '+91 77777 66666',
    location: 'Hebbal, Bangalore',
    budget: 1200000,
    area: 1600,
    requirements: 'Interested in full home package but only after 6 months. Just checking prices.',
    score: 55,
    voice_status: 'disqualified',
    call_transcript: 'AI: Hi Suresh, are you looking to do your interiors now? Suresh: No, my possession is in 8 months, I am just checking prices. AI: Alright, thank you.',
    call_recording: null
  }
];

const insertLead = db.prepare(`
  INSERT INTO leads (id, name, email, phone, location, budget, area, requirements, score, voice_status, call_transcript, call_recording)
  VALUES (@id, @name, @email, @phone, @location, @budget, @area, @requirements, @score, @voice_status, @call_transcript, @call_recording)
`);

leads.forEach(lead => insertLead.run(lead));

// 2. Seed a closed Project (from lead 1)
const projectId = 'proj_1';
const projectBrief = {
  lifestyle: 'family_with_kids',
  cookingHabits: 'heavy_indian',
  vastuPreferences: 'north_facing_kitchen',
  rooms: [
    { name: 'Modular Kitchen', type: 'kitchen', finishes: ['high_gloss_laminate', 'acrylic'], appliances: ['hob', 'chimney', 'built_in_oven'] },
    { name: 'Master Bedroom', type: 'bedroom', finishes: ['matte_woodgrain'], furniture: ['wardrobe_sliding', 'bed_king_storage'] },
    { name: 'Living Room', type: 'living', finishes: ['veneer', 'fluted_panels'], furniture: ['tv_unit_floating', 'lounge_sofa'] }
  ],
  dislikedColors: ['bright_red', 'dark_purple']
};

db.prepare(`
  INSERT INTO projects (id, lead_id, name, client_name, email, phone, budget, unit_system, status, current_step, advance_paid_amount, total_cost, client_brief_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  projectId,
  'lead_1',
  'Sharma HSR 3BHK flat',
  'Rohan Sharma',
  'rohan.sharma@example.com',
  '+91 98765 43210',
  850000,
  'metric',
  'closed',
  'brief',
  50000, // 1st advanced paid
  850000,
  JSON.stringify(projectBrief)
);

// 3. Seed initial 2D CAD floor plan for this project
const initialWalls = [
  { id: 'w_demo_1', x1: 100, y1: 100, x2: 900, y2: 100, thickness: 14, material: 'concrete' },
  { id: 'w_demo_2', x1: 900, y1: 100, x2: 900, y2: 500, thickness: 14, material: 'concrete' },
  { id: 'w_demo_3', x1: 900, y1: 500, x2: 100, y2: 500, thickness: 14, material: 'concrete' },
  { id: 'w_demo_4', x1: 100, y1: 500, x2: 100, y2: 100, thickness: 14, material: 'concrete' },
  // Partition wall inside
  { id: 'w_demo_5', x1: 450, y1: 100, x2: 450, y2: 500, thickness: 10, material: 'drywall' }
];

const initialOpenings = [
  { id: 'op_demo_1', type: 'door', style: 'door_single', wallId: 'w_demo_4', x: 100, y: 300, width: 36, angle: 90 },
  { id: 'op_demo_2', type: 'window', style: 'window', wallId: 'w_demo_1', x: 500, y: 100, width: 48, angle: 0 }
];

const initialFurniture = [
  { id: 'f_demo_1', libraryId: 'executive_desk', name: "Study Desk", x: 180, y: 150, width: 72, height: 36, rotation: 0, color: '#3182CE' },
  { id: 'f_demo_2', libraryId: 'lounge_sofa_3', name: "Lobby Couch", x: 550, y: 350, width: 88, height: 34, rotation: 180, color: '#4A5568' }
];

const initialRooms = [
  { id: 'r_demo_1', name: 'Master Bedroom', points: [ {x:100, y:100}, {x:450, y:100}, {x:450, y:500}, {x:100, y:500} ], color: '#3182CE' },
  { id: 'r_demo_2', name: 'Kitchen & Dining', points: [ {x:450, y:100}, {x:900, y:100}, {x:900, y:500}, {x:450, y:500} ], color: '#ED8936' }
];

db.prepare(`
  INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, measures_json, pixels_per_meter)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'cad_demo_1',
  projectId,
  JSON.stringify(initialWalls),
  JSON.stringify(initialOpenings),
  JSON.stringify(initialFurniture),
  JSON.stringify(initialRooms),
  JSON.stringify([]),
  40.0
);

// 4. Seed Invoice
db.prepare(`
  INSERT INTO invoices (id, project_id, invoice_number, description, amount, status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  'inv_1',
  projectId,
  'INV-2026-001',
  '1st Advance Payment - 10% Booking Fee for Sharma HSR Flat',
  50000.0,
  'paid'
);

// 5. Seed Indian vendor catalog — Hettich, EBCO, and laminate families
const insertMaterial = db.prepare(`
  INSERT OR IGNORE INTO material_catalog (id, category, subcategory, code, name, brand, finish, color, price_per_sqft, rating)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

[
  ['mat_hw_h01','hardware','runners','HET-5136','Soft-Close Ball Bearing Runner 450mm','Hettich','Drawer Slide','',950,4.9],
  ['mat_hw_h02','hardware','runners','HET-5166','Tandem Runner 600mm Full Extension','Hettich','Drawer Slide','',1850,4.9],
  ['mat_hw_h03','hardware','hinges','HET-9332','Click On Hinge 110°','Hettich','Hinge','',185,4.8],
  ['mat_hw_h04','hardware','lift_systems','HET-AV','Aventos HK Top Cabinet Lift','Hettich','Lift System','',7200,4.9],
  ['mat_hw_h05','hardware','shelves','HET-SVS','Sensys Adjustable Shelf Clip','Hettich','Clip','',65,4.7],
  ['mat_hw_e01','hardware','baskets','EBC-450','Pullout Basket Wire 400mm','Ebco','Wire Basket','',2200,4.7],
  ['mat_hw_e02','hardware','baskets','EBC-500','Pullout Basket Wire 500mm','Ebco','Wire Basket','',2500,4.8],
  ['mat_hw_e03','hardware','handles','EBC-H01','Cupboard Handle Knob 128mm','Ebco','Handle','',180,4.6],
  ['mat_hw_e04','hardware','wardrobe','EBC-WS01','Wardrobe Lifter Hanger','Ebco','Lifter','',1450,4.7],
  ['mat_lam_1','laminate','carcass_interior','SF-9120','Frosty White Suede','CenturyPly','Suede Matte','#f3f4f6',45,4.8],
  ['mat_lam_2','laminate','shutter_facade','MT-8012','Charcoal Matte','Royale Touche','Anti-Fingerprint Matte','#27272a',95,4.8],
  ['mat_lam_3','laminate','shutter_facade','GL-D0456','Arctic Grey Gloss','Greenlam','High Gloss','#9ca3af',105,4.6],
  ['mat_lam_4','laminate','shutter_facade','W-4211','Bourbon Walnut','Royale Touche','Horizontal Woodgrain','#5c4033',85,4.9]
].forEach(row => insertMaterial.run(row));

console.log("Database seeded successfully with demo leads, closed project and initial CAD drawings.");
