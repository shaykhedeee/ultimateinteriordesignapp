import fs from 'node:fs';
import { getDb, ensureDatabase } from './services/database.js';

try {
  ensureDatabase();
  const db = getDb();
  
  // Execute main migrations file
  const sql = fs.readFileSync('./server/migrations/003_render_enhancements.sql', 'utf8');
  db.exec(sql);
  
  // Run ALTER TABLE statements dynamically, catching errors if column already exists
  const alterQueries = [
    "ALTER TABLE client_projects ADD COLUMN current_stage TEXT DEFAULT 'onboarding'",
    "ALTER TABLE client_projects ADD COLUMN floor_plan_analysis_id TEXT REFERENCES floor_plan_analyses(id)",
    "ALTER TABLE client_projects ADD COLUMN active_render_generation_id TEXT REFERENCES render_generations(id)",
    "ALTER TABLE client_projects ADD COLUMN render_approved BOOLEAN DEFAULT 0",
    "ALTER TABLE client_projects ADD COLUMN approved_render_note TEXT"
  ];
  
  for (const query of alterQueries) {
    try {
      db.exec(query);
    } catch (err) {
      if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
        // Safe to ignore: column is already added
      } else {
        throw err;
      }
    }
  }
  
  // Run UPDATE statement for project stage migrations
  try {
    db.exec(`
      UPDATE client_projects 
      SET current_stage = 'render-review' 
      WHERE current_stage = 'renders' OR current_stage = 'ai-renders'
    `);
  } catch (err) {
    console.warn('Could not update project stages (table/column may not contain stage records):', err.message);
  }
  
  console.log('✅ Database migrated successfully');
} catch (error) {
  console.error('Migration failed:', error);
}
