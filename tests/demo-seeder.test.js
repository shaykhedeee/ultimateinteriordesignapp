import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { seedDemoProject } from '../server/database/demo-seeder.js';

test('seedDemoProject successfully seeds the complete high-fidelity project', async () => {
  const result = await seedDemoProject();
  
  assert.ok(result.success, 'seeding should report success');
  assert.equal(result.projectId, 'proj_demo_hsr');

  // Verify Project Row
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_demo_hsr');
  assert.ok(project, 'project row should be seeded');
  assert.equal(project.client_name, 'Muskan Khede');
  assert.equal(project.status, 'closed');
  
  // Verify Lead Row
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get('lead_demo_hsr');
  assert.ok(lead, 'lead row should be seeded');
  
  // Verify CAD Drawings Row
  const cad = db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get('proj_demo_hsr');
  assert.ok(cad, 'CAD drawings row should be seeded');
  
  // Verify Scene Version Row
  const scene = db.prepare('SELECT * FROM scene_versions WHERE project_id = ?').get('proj_demo_hsr');
  assert.ok(scene, 'scene version row should be seeded');
  
  // Verify Invoice Row
  const invoice = db.prepare('SELECT * FROM invoices WHERE project_id = ?').get('proj_demo_hsr');
  assert.ok(invoice, 'invoice row should be seeded');
  assert.equal(invoice.grand_total, 95580);
  
  // Verify Render Asset Row
  const render = db.prepare('SELECT * FROM generated_assets WHERE project_id = ?').get('proj_demo_hsr');
  assert.ok(render, 'generated asset row should be seeded');
  
  // Verify Cutlist Project Row was generated
  const cutlistProj = db.prepare('SELECT * FROM cutlist_projects WHERE project_id = ?').get('proj_demo_hsr');
  assert.ok(cutlistProj, 'cutlist project row should be generated on seed');
});
