// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Enhanced Database Service (database-enhanced.js)
// New methods for render pipeline, floor plan analysis, colors
// ============================================================

import { getDb as db } from './database.js';

const DatabaseEnhanced = {
  async getProject(projectId) {
    const row = db().prepare('SELECT * FROM client_projects WHERE id = ?').get(projectId);
    if (!row) return null;
    return {
      id: row.id,
      ...JSON.parse(row.payload),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // ---- Floor Plan Analysis ----
  async saveFloorPlanAnalysis(projectId, data) {
    const id = 'fpa-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const analysisJson = JSON.stringify(data.analysis);
    const roomsCount = data.analysis?.rooms?.length || 0;
    const wallsCount = data.analysis?.walls?.length || 0;
    const componentsCount = data.analysis?.components?.length || 0;
    const confidence = data.analysis?.confidence || 0;
    
    const stmt = db().prepare(`
      INSERT INTO floor_plan_analyses (id, project_id, image_path, original_filename, 
        analysis_json, rooms_count, walls_count, components_count, confidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `);
    stmt.run(id, projectId, data.imagePath, data.originalName, 
      analysisJson, roomsCount, wallsCount, componentsCount, confidence);
    
    // Update project
    db().prepare(`UPDATE client_projects SET floor_plan_analysis_id = ?, current_stage = 'floor-plan' WHERE id = ?`)
      .run(id, projectId);
    
    return { id, analysis: data.analysis };
  },
  
  async getFloorPlanAnalysis(projectId) {
    const row = db().prepare(`SELECT * FROM floor_plan_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`).get(projectId);
    if (!row) return null;
    return JSON.parse(row.analysis_json);
  },
  
  // ---- Render Generations ----
  async saveRenderResults(projectId, results) {
    const id = 'rnd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const roomsData = JSON.stringify(results.rooms);
    
    const stmt = db().prepare(`
      INSERT INTO render_generations (id, project_id, style, budget, quality, 
        variant_count, rooms_data, total_variants, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending-review')
    `);
    stmt.run(id, projectId, results.style || 'modern', results.budget || 'standard', 
      'balanced', results.totalVariants / (results.rooms?.length || 1), 
      roomsData, results.totalVariants);
    
    // Save individual variants
    const variantStmt = db().prepare(`
      INSERT INTO render_variants (id, generation_id, variant_key, name, prompt_used, 
        image_path, image_svg, component_masks, spatial_validation, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const room of (results.rooms || [])) {
      for (const variant of (room.variants || [])) {
        const vId = 'rv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        variantStmt.run(
          vId, id, variant.id, variant.name, variant.prompt || '',
          variant.generatedImages?.[0]?.filePath || null,
          variant.generatedImages?.[0]?.svg || '',
          JSON.stringify(variant.componentMasks || {}),
          JSON.stringify(variant.spatialValidation || {}),
          'active'
        );
      }
    }
    
    // Update project stage
    db().prepare(`UPDATE client_projects SET active_render_generation_id = ?, current_stage = 'render-review' WHERE id = ?`)
      .run(id, projectId);
    
    return { id, results };
  },
  
  async getProjectRenders(projectId) {
    const generations = db().prepare(`
      SELECT * FROM render_generations WHERE project_id = ? ORDER BY created_at DESC
    `).all(projectId);
    
    for (const gen of generations) {
      gen.variants = db().prepare(`
        SELECT * FROM render_variants WHERE generation_id = ? ORDER BY variant_key
      `).all(gen.id);
      
      gen.rooms_data = JSON.parse(gen.rooms_data || '[]');
    }
    
    return generations;
  },
  
  async getRenderData(projectId, generationId, variantKey) {
    const gen = db().prepare(`
      SELECT * FROM render_generations WHERE id = ? AND project_id = ?
    `).get(generationId, projectId);
    
    if (!gen) return null;
    
    const variant = db().prepare(`
      SELECT * FROM render_variants WHERE generation_id = ? AND variant_key = ?
    `).get(generationId, variantKey || 'v1');
    
    return {
      projectId,
      generationId,
      variantKey: variant?.variant_key,
      imageSvg: variant?.image_svg,
      componentMasks: JSON.parse(variant?.component_masks || '{}'),
      spatialValidation: JSON.parse(variant?.spatial_validation || '{}'),
      roomType: gen.rooms_data ? JSON.parse(gen.rooms_data)?.[0]?.roomName : null,
      style: gen.style,
      budget: gen.budget,
      currentColors: {} // In production: fetch from actual render
    };
  },
  
  // ---- Color Changes ----
  async saveColorChange(data) {
    const id = 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const stmt = db().prepare(`
      INSERT INTO component_color_changes (id, project_id, generation_id, variant_key,
        component_type, new_color, new_material, new_color_hex, applied_to_all_variants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.projectId, data.renderId || null, data.variantId || null,
      data.componentType, data.newColor, data.newMaterial || null, 
      data.colorHex || null, data.applyToAllVariants ? 1 : 0);
    return { id };
  },
  
  async getColorChanges(projectId) {
    return db().prepare(`
      SELECT * FROM component_color_changes WHERE project_id = ? ORDER BY created_at DESC
    `).all(projectId);
  },
  
  // ---- Reference Library ----
  async getReferenceImages(category, style, limit = 20) {
    let query = `SELECT * FROM reference_library WHERE ai_training_ready = 1 AND deleted_at IS NULL`;
    const params = [];
    
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (style) {
      query += ` AND style = ?`;
      params.push(style);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    return db().prepare(query).all(...params);
  },
  
  async searchReferenceImages(searchTerm) {
    return db().prepare(`
      SELECT * FROM reference_library 
      WHERE (category LIKE ? OR style LIKE ? OR metadata_json LIKE ?)
      AND ai_training_ready = 1 AND deleted_at IS NULL
      LIMIT 30
    `).all(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  },
  
  // ---- Color Preferences (learning) ----
  async recordColorPreference(studioId, componentType, color, material) {
    const existing = db().prepare(`
      SELECT * FROM user_color_preferences 
      WHERE studio_id = ? AND component_type = ?
    `).get(studioId || 'default', componentType);
    
    if (existing) {
      const newCount = existing.use_count + 1;
      db().prepare(`
        UPDATE user_color_preferences 
        SET preferred_color = ?, preferred_material = ?, use_count = ?, last_used = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(color, material || existing.preferred_material, newCount, existing.id);
    } else {
      db().prepare(`
        INSERT INTO user_color_preferences (id, studio_id, component_type, preferred_color, preferred_material, use_count)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run('ucp-' + Date.now(), studioId || 'default', componentType, color, material);
    }
  },
  
  async getLearnedPreferences(studioId) {
    return db().prepare(`
      SELECT * FROM user_color_preferences 
      WHERE studio_id = ?
      ORDER BY use_count DESC
    `).all(studioId || 'default');
  },
  
  // ---- Project Stage Update ----
  async updateProjectStage(projectId, stage, additionalData = {}) {
    const stmt = db().prepare(`UPDATE client_projects SET current_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(stage, projectId);
    
    // Apply stage-specific logic
    switch(stage) {
      case 'render-approved':
        db().prepare(`UPDATE client_projects SET render_approved = 1 WHERE id = ?`).run(projectId);
        break;
      case 'brief-ready':
        // Check render is approved before allowing brief
        const project = db().prepare(`SELECT render_approved FROM client_projects WHERE id = ?`).get(projectId);
        if (!project?.render_approved) {
          return { warning: 'Cannot generate brief until renders are approved' };
        }
        break;
    }
    
    return { projectId, stage, ...additionalData };
  }
};

export default DatabaseEnhanced;
