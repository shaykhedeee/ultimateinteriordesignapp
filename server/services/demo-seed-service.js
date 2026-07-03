import db from '../database/database.js';
import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();

function clearDemoData() {
  db.exec(`PRAGMA foreign_keys = OFF;
    DELETE FROM render_generation_jobs WHERE project_id LIKE 'demo_%';
    DELETE FROM production_cutlists WHERE project_id LIKE 'demo_%';
    DELETE FROM invoices WHERE project_id LIKE 'demo_%';
    DELETE FROM design_renders WHERE project_id LIKE 'demo_%';
    DELETE FROM material_selections WHERE project_id LIKE 'demo_%';
    DELETE FROM cad_drawings WHERE project_id LIKE 'demo_%';
    DELETE FROM projects WHERE id LIKE 'demo_%';
    DELETE FROM leads WHERE id LIKE 'demo_%';
    PRAGMA foreign_keys = ON;`);
}

function insertLead(lead) {
  db.prepare(`INSERT OR REPLACE INTO leads (id, name, email, phone, location, budget, area, requirements, score, voice_status, call_transcript, call_recording, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    lead.id, lead.name, lead.email, lead.phone, lead.location,
    lead.budget, lead.area, lead.requirements, lead.score,
    lead.voice_status, lead.call_transcript, lead.call_recording, lead.created_at || now()
  );
}

function insertProject(project) {
  db.prepare(`INSERT OR REPLACE INTO projects (id, lead_id, name, client_name, email, phone, budget, unit_system, status, current_step, advance_paid_amount, total_cost, client_brief_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    project.id, project.lead_id, project.name, project.client_name, project.email, project.phone,
    project.budget, project.unit_system || 'metric', project.status, project.current_step,
    project.advance_paid_amount || 0, project.total_cost || 0, project.client_brief_json || null, project.created_at || now()
  );
}

function insertCad(projectId, cad) {
  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, measures_json, pixels_per_meter, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    cad.id, projectId, JSON.stringify(cad.walls || []), JSON.stringify(cad.openings || []),
    JSON.stringify(cad.furniture || []), JSON.stringify(cad.rooms || []), JSON.stringify(cad.measures || []),
    cad.pixels_per_meter || 40, now()
  );
}

function insertMaterials(projectId, materials) {
  db.prepare(`INSERT OR REPLACE INTO material_selections (id, project_id, laminates_json, hardware_json, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    materials.id, projectId, JSON.stringify(materials.laminates || []),
    JSON.stringify(materials.hardware || []), materials.notes || '', now()
  );
}

function insertRender(projectId, render) {
  db.prepare(`INSERT OR REPLACE INTO design_renders (id, project_id, image_url, sketchup_script_txt, room, prompt, review_status, review_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    render.id, projectId, render.image_url, render.sketchup_script_txt || null, render.room, render.prompt,
    render.review_status || 'approved', render.review_note || '', now()
  );
}

function insertInvoice(projectId, invoice) {
  db.prepare(`INSERT OR REPLACE INTO invoices (id, project_id, invoice_number, description, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    invoice.id, projectId, invoice.invoice_number, invoice.description, invoice.amount, invoice.status || 'paid', now()
  );
}

function insertJob(projectId, job) {
  db.prepare(`INSERT OR REPLACE INTO render_generation_jobs (id, project_id, room, provider, quality_mode, spend_mode, payload, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    job.id, projectId, job.room, job.provider || 'library-reuse', job.quality_mode || 'standard', job.spend_mode || 'smart-cost',
    JSON.stringify(job.payload || {}), job.status || 'completed', now()
  );
}

function insertCutlist(projectId, cutlist) {
  db.prepare(`INSERT OR REPLACE INTO production_cutlists (id, project_id, cutlist_data_json, optimized_sheets_json, created_at)
    VALUES (?, ?, ?, ?, ?)`).run(
    cutlist.id, projectId, JSON.stringify(cutlist.cutlist_data || {}), JSON.stringify(cutlist.optimized_sheets || []), now()
  );
}

const DEMO_LEADS = [
  { id: 'demo_lead_1', name: 'Rohan Sharma', email: 'rohan.sharma@example.com', phone: '+91 98765 43210', location: 'HSR Layout, Bangalore', budget: 850000, area: 1200, requirements: '3 BHK modular kitchen, wardrobes, living room panelling.', score: 85, voice_status: 'qualified', call_transcript: 'AI: Hello Rohan... Rohan: Yes, I want modular interiors.', call_recording: '/storage/calls/call_demo_lead_1.mp3', created_at: '2026-06-10T10:00:00Z' },
  { id: 'demo_lead_2', name: 'Anjali Verma', email: 'anjali.v@example.com', phone: '+91 91234 56789', location: 'Whitefield, Bangalore', budget: 1500000, area: 1800, requirements: 'Premium 4 BHK with false ceiling, lighting, modular kitchen and quartz tops.', score: 95, voice_status: 'new', created_at: '2026-06-12T11:30:00Z' },
  { id: 'demo_lead_3', name: 'Vikram Singh', email: 'vikram.s@example.com', phone: '+91 88888 77777', location: 'Indiranagar, Bangalore', budget: 300000, area: 800, requirements: 'One wardrobe and kitchen cabinet repair.', score: 42, voice_status: 'new', created_at: '2026-06-13T09:15:00Z' },
  { id: 'demo_lead_4', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 99999 11111', location: 'Koramangala, Bangalore', budget: 650000, area: 1100, requirements: 'Modular kitchen and living unit for rental property.', score: 70, voice_status: 'calling', created_at: '2026-06-14T14:20:00Z' },
  { id: 'demo_lead_5', name: 'Suresh Kumar', email: 'suresh.k@example.com', phone: '+91 77777 66666', location: 'Hebbal, Bangalore', budget: 1200000, area: 1600, requirements: 'Full home interiors after 6 months; price checking now.', score: 55, voice_status: 'disqualified', call_transcript: 'AI: Hi Suresh... Suresh: No, possession is in 8 months.', created_at: '2026-06-15T08:45:00Z' },
  { id: 'demo_lead_6', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 94456 12345', location: 'Jayanagar, Bangalore', budget: 980000, area: 1350, requirements: '2.5 BHK renovation plusLoft storage and wardrobe automation.', score: 78, voice_status: 'human_closed', created_at: '2026-06-16T16:05:00Z' },
  { id: 'demo_lead_7', name: 'Karthik Reddy', email: 'karthik.r@example.com', phone: '+91 93333 22222', location: 'Marathahalli, Bangalore', budget: 2200000, area: 2400, requirements: 'Villa package: false ceiling, smart lighting, home theatre, kitchen and wardrobes.', score: 91, voice_status: 'qualified', created_at: '2026-06-17T10:40:00Z' },
  { id: 'demo_lead_8', name: 'Nisha Gupta', email: 'nisha.g@example.com', phone: '+91 91111 00000', location: 'Electronic City, Bangalore', budget: 450000, area: 950, requirements: '1 BHK rental-fit interiors with budget laminates and minimal hardware.', score: 60, voice_status: 'human_lost', created_at: '2026-06-18T13:10:00Z' }
];

const DEMO_PROJECTS = [
  {
    id: 'demo_proj_1', lead_id: 'demo_lead_1', name: 'Sharma HSR 3BHK', client_name: 'Rohan Sharma', email: 'rohan.sharma@example.com', phone: '+91 98765 43210',
    budget: 850000, status: 'closed', current_step: 'renders_approved', advance_paid_amount: 50000, total_cost: 850000,
    client_brief_json: JSON.stringify({ lifestyle: 'family_with_kids', cookingHabits: 'heavy_indian', rooms: [
      { name: 'Modular Kitchen', type: 'kitchen', finishes: ['high_gloss_laminate', 'acrylic'], appliances: ['hob', 'chimney'] },
      { name: 'Master Bedroom', type: 'bedroom', finishes: ['matte_woodgrain'], furniture: ['wardrobe_sliding', 'bed_king_storage'] },
      { name: 'Living Room', type: 'living', finishes: ['veneer', 'fluted_panels'], furniture: ['tv_unit_floating', 'lounge_sofa'] }
    ]})
  },
  {
    id: 'demo_proj_2', lead_id: 'demo_lead_2', name: 'Verma Whitefield Premium', client_name: 'Anjali Verma', email: 'anjali.v@example.com', phone: '+91 91234 56789',
    budget: 1500000, status: 'cad_approved', current_step: 'studio', advance_paid_amount: 150000, total_cost: 1500000,
    client_brief_json: JSON.stringify({ lifestyle: 'premium_couple', cookingHabits: 'fine_dining', rooms: [
      { name: 'Kitchen', type: 'kitchen', finishes: ['quartz', 'acrylic'], appliances: ['hob', 'chimney', 'built_in_oven'] },
      { name: 'Living Room', type: 'living', finishes: ['marble_polished'], furniture: ['lounge_sofa', 'centre_table_marble'] }
    ]})
  },
  {
    id: 'demo_proj_3', lead_id: 'demo_lead_4', name: 'Patel Koramangala Rental Unit', client_name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 99999 11111',
    budget: 650000, status: 'brief_complete', current_step: 'cad', advance_paid_amount: 20000, total_cost: 650000,
    client_brief_json: JSON.stringify({ lifestyle: 'working_professional', cookingHabits: 'light_indian', rooms: [
      { name: 'Kitchen', type: 'kitchen', finishes: ['laminate_oak'] },
      { name: 'Living', type: 'living', finishes: ['laminate_grey'], furniture: ['tv_unit_simple'] }
    ]})
  },
  {
    id: 'demo_proj_4', lead_id: 'demo_lead_7', name: 'Reddy Villa Automation', client_name: 'Karthik Reddy', email: 'karthik.r@example.com', phone: '+91 93333 22222',
    budget: 2200000, status: 'signed_off', current_step: 'production', advance_paid_amount: 440000, total_cost: 2200000,
    client_brief_json: JSON.stringify({ lifestyle: 'luxury_family', cookingHabits: 'chef_grade', rooms: [
      { name: 'Home Theatre', type: 'media', finishes: ['acoustic_fabric', 'walnut_veneer'] },
      { name: 'Master Suite', type: 'bedroom', finishes: ['fabric_panel', 'soft_close_laminate'] },
      { name: 'Kitchen', type: 'kitchen', finishes: ['quartz_white', 'acrylic_grey'] }
    ]})
  }
];

const DEMO_CAD = [
  {
    id: 'demo_cad_1', project_id: 'demo_proj_1', pixels_per_meter: 40,
    walls: [
      { id: 'dw1', x1: 100, y1: 100, x2: 900, y2: 100, thickness: 14, material: 'concrete' },
      { id: 'dw2', x1: 900, y1: 100, x2: 900, y2: 500, thickness: 14, material: 'concrete' },
      { id: 'dw3', x1: 900, y1: 500, x2: 100, y2: 500, thickness: 14, material: 'concrete' },
      { id: 'dw4', x1: 100, y1: 500, x2: 100, y2: 100, thickness: 14, material: 'concrete' },
      { id: 'dw5', x1: 450, y1: 100, x2: 450, y2: 500, thickness: 10, material: 'drywall' }
    ],
    openings: [
      { id: 'do1', type: 'door', style: 'door_single', wallId: 'dw4', x: 100, y: 300, width: 36, angle: 90 },
      { id: 'ow1', type: 'window', style: 'window', wallId: 'dw1', x: 500, y: 100, width: 48, angle: 0 }
    ],
    furniture: [
      { id: 'df1', libraryId: 'executive_desk', name: 'Study Desk', x: 180, y: 150, width: 72, height: 36, rotation: 0, color: '#3182CE' },
      { id: 'df2', libraryId: 'lounge_sofa_3', name: 'Living Sofa', x: 550, y: 350, width: 88, height: 34, rotation: 180, color: '#4A5568' }
    ],
    rooms: [
      { id: 'dr1', name: 'Master Bedroom', points: [ {x:100, y:100}, {x:450, y:100}, {x:450, y:500}, {x:100, y:500} ], color: '#3182CE' },
      { id: 'dr2', name: 'Kitchen & Dining', points: [ {x:450, y:100}, {x:900, y:100}, {x:900, y:500}, {x:450, y:500} ], color: '#ED8936' }
    ],
    measures: []
  }
];

const DEMO_MATERIALS = [
  {
    id: 'demo_mat_1', project_id: 'demo_proj_1',
    laminates_json: JSON.stringify([
      { code: 'MT-8012', name: 'Charcoal Matte', brand: 'Royale Touche', finish: 'Anti-Fingerprint Matte', color: '#27272a', pricePerSqft: 95 },
      { code: 'SF-9120', name: 'Frosty White Suede', brand: 'CenturyPly', finish: 'Suede Matte', color: '#f3f4f6', pricePerSqft: 45 }
    ]),
    hardware_json: JSON.stringify([
      { code: 'HET-5136', name: 'Soft-Close Runner 450mm', brand: 'Hettich', finish: 'Drawer Slide', price: 950 },
      { code: 'EBC-500', name: 'Pullout Basket 500mm', brand: 'Ebco', finish: 'Wire Basket', price: 2500 }
    ]),
    notes: 'Primary shutter shell + interior box laminate selected.'
  },
  {
    id: 'demo_mat_2', project_id: 'demo_proj_2',
    laminates_json: JSON.stringify([
      { code: 'GL-D0456', name: 'Arctic Grey Gloss', brand: 'Greenlam', finish: 'High Gloss', color: '#9ca3af', pricePerSqft: 105 }
    ]),
    hardware_json: JSON.stringify([
      { code: 'HET-9332', name: 'Click On Hinge 110°', brand: 'Hettich', finish: 'Hinge', price: 185 },
      { code: 'HET-AV', name: 'Aventos HK Lift', brand: 'Hettich', finish: 'Lift System', price: 7200 }
    ]),
    notes: 'Premium gloss finish with soft-close lift systems.'
  }
];

const DEMO_RENDERS = [
  { id: 'demo_ren_1', project_id: 'demo_proj_1', room: 'Living Room', prompt: 'Warm Japandi living with fluted panels and oak tablescape', image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80', review_status: 'approved' },
  { id: 'demo_ren_2', project_id: 'demo_proj_1', room: 'Kitchen', prompt: 'High-gloss charcoal kitchen with quartz counter and under-cabinet lighting', image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80', review_status: 'approved' },
  { id: 'demo_ren_3', project_id: 'demo_proj_2', room: 'Living Room', prompt: 'Luxury marble floor living room with layered lighting and lounge seating', image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', review_status: 'approved' }
];

const DEMO_INVOICES = [
  { id: 'demo_inv_1', project_id: 'demo_proj_1', invoice_number: 'INV-2026-D1', description: 'Advance booking - Sharma HSR', amount: 50000, status: 'paid' },
  { id: 'demo_inv_2', project_id: 'demo_proj_2', invoice_number: 'INV-2026-D2', description: 'Concept advance - Verma Whitefield', amount: 150000, status: 'paid' }
];

const DEMO_JOBS = [
  { id: 'demo_job_1', project_id: 'demo_proj_1', room: 'Living Room', status: 'completed', provider: 'library-reuse', quality_mode: 'standard', spend_mode: 'smart-cost', payload: { prompt: 'warm lounge render' } },
  { id: 'demo_job_2', project_id: 'demo_proj_1', room: 'Kitchen', status: 'completed', provider: 'library-reuse', quality_mode: 'standard', spend_mode: 'smart-cost', payload: { prompt: 'kitchen render' } },
  { id: 'demo_job_3', project_id: 'demo_proj_2', room: 'Living Room', status: 'queued', provider: 'openrouter', quality_mode: 'high', spend_mode: 'preview', payload: { prompt: 'luxury living render' } }
];

const DEMO_CUTLISTS = [
  {
    id: 'demo_cut_1', project_id: 'demo_proj_1',
    cutlist_data: { panels: 48, sheetsUsed: 12, wastagePct: 7.2 },
    optimized_sheets: [
      { sheetId: 's1', label: 'Shutter panels', widthMm: 2440, heightMm: 1220, pieces: 8 },
      { sheetId: 's2', label: 'Interior boxes', widthMm: 2440, heightMm: 1220, pieces: 6 }
    ]
  },
  {
    id: 'demo_cut_2', project_id: 'demo_proj_4',
    cutlist_data: { panels: 112, sheetsUsed: 28, wastagePct: 5.1 },
    optimized_sheets: [
      { sheetId: 's3', label: 'Wardrobe carcasses', widthMm: 2440, heightMm: 1220, pieces: 14 },
      { sheetId: 's4', label: 'Shelf packs', widthMm: 2440, heightMm: 1220, pieces: 10 }
    ]
  }
];

export function seedDemoData() {
  clearDemoData();
  DEMO_LEADS.forEach(insertLead);
  DEMO_PROJECTS.forEach(insertProject);
  DEMO_CAD.forEach(c => insertCad(c.project_id, c));
  DEMO_MATERIALS.forEach(m => insertMaterials(m.project_id, m));
  DEMO_RENDERS.forEach(r => insertRender(r.project_id, r));
  DEMO_INVOICES.forEach(i => insertInvoice(i.project_id, i));
  DEMO_JOBS.forEach(j => insertJob(j.project_id, j));
  DEMO_CUTLISTS.forEach(c => insertCutlist(c.project_id, c));
  return {
    leads: DEMO_LEADS.length,
    projects: DEMO_PROJECTS.length,
    cads: DEMO_CAD.length,
    materials: DEMO_MATERIALS.length,
    renders: DEMO_RENDERS.length,
    invoices: DEMO_INVOICES.length,
    jobs: DEMO_JOBS.length,
    cutlists: DEMO_CUTLISTS.length
  };
}
