import db from '../server/database/database.js';
import { getProject } from '../server/services/design-engine.js';
import { compileFastRenderPlan } from '../server/services/visualizer-engine.js';

async function testPromptCompilation() {
  console.log("=== START PROMPT COMPILATION TEST ===");
  try {
    // 1. Get first project from projects table
    const projectRow = db.prepare("SELECT id FROM projects LIMIT 1").get();
    if (!projectRow) {
      console.log("No projects found in projects table. Inserting mock project...");
      db.prepare(`
        INSERT OR REPLACE INTO projects (id, lead_id, name, client_name, email, phone, budget, status, client_brief_json)
        VALUES ('test_proj_001', 'lead_001', 'Test Residence', 'Dev Client', 'test@test.com', '9999999999', 1500000, 'brief_complete', ?)
      `).run(JSON.stringify({
        budgetTier: 'premium',
        selectedSpaces: ['kitchen', 'living'],
        vastuCompliant: true,
        vastuPreferences: 'west_facing',
        stylePreferences: ['indian-contemporary']
      }));
    }

    const projectId = projectRow ? projectRow.id : 'test_proj_001';
    console.log(`Using Project ID: ${projectId}`);

    // Ensure we have some mock selected laminates
    db.prepare(`
      INSERT OR REPLACE INTO material_selections (id, project_id, laminates_json, hardware_json, notes)
      VALUES ('mat_test', ?, ?, '[]', 'Test selection notes')
    `).run(
      projectId,
      JSON.stringify([
        { id: 'lam_Century_White', name: 'Premium Glossy Ice White', brand: 'CenturyPly', finish: 'High Gloss Acrylic', type: 'kitchen' },
        { id: 'lam_Century_Teak', name: 'Classic Burma Teak Woodgrain', brand: 'CenturyPly', finish: 'Textured Wood Veneer', type: 'living' }
      ])
    );

    const project = getProject(projectId);
    console.log("Ingested Project Vastu Config:", {
      vastuCompliant: project.vastuCompliant,
      vastuPreferences: project.vastuPreferences,
      facingDirection: project.vastu_direction || project.vastuPreferences
    });

    const params = {
      room: 'kitchen',
      style: 'indian-contemporary',
      budgetTier: 'premium',
      hobSinkSwapped: true,
      loftAligned: true,
      uniformLoftHeight: true
    };

    const corrections = [
      { avoidance_instruction: "AVOID: using silver handles on cabinets; use black profile handles instead." }
    ];

    const renderPlan = compileFastRenderPlan(project, params, corrections);
    console.log("\n--- COMPILED PROMPT ---");
    console.log(renderPlan.prompt);
    console.log("-----------------------\n");

    const hasNorthLighting = renderPlan.prompt.includes("Cool diffused natural daylight from the North window");
    const hasWestLighting = renderPlan.prompt.includes("Golden hour warm beams of low afternoon sun");
    const hasEastLighting = renderPlan.prompt.includes("Early morning sunlight casting long soft shadows");
    const hasSouthLighting = renderPlan.prompt.includes("Bright direct natural daylight of mid-day sun");

    // Let's verify that the expected keywords are present in the prompt
    const checks = {
      laminates: renderPlan.prompt.includes("CenturyPly Premium Glossy Ice White") || renderPlan.prompt.includes("Classic Burma Teak Woodgrain"),
      vastu: renderPlan.prompt.includes("Vastu Guideline") && renderPlan.prompt.includes("faces East"),
      lighting: hasNorthLighting || hasWestLighting || hasEastLighting || hasSouthLighting,
      correction: renderPlan.prompt.includes("use black profile handles")
    };

    console.log("Validation Checks:");
    console.log(`- Selected Laminates Injected: ${checks.laminates ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`- Vastu Guidelines Injected: ${checks.vastu ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`- Orientation Lighting Injected: ${checks.lighting ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`- Corrections Log Injected: ${checks.correction ? 'PASS ✓' : 'FAIL ✗'}`);

    if (checks.laminates && checks.vastu && checks.lighting && checks.correction) {
      console.log("\n=== TEST RESULT: SUCCESS ===\n");
    } else {
      console.log("\n=== TEST RESULT: FAILED ===\n");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  }
}

testPromptCompilation();
