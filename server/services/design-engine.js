import db from '../database/database.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');

export function getProject(projectId) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  if (!project) return null;
  
  let brief = {};
  if (project.client_brief_json) {
    try {
      brief = JSON.parse(project.client_brief_json);
    } catch (e) {
      brief = {};
    }
  }
  
  // Try to load floorplan coordinates or images from cad_drawings
  let floorPlan = null;
  const cad = db.prepare("SELECT * FROM cad_drawings WHERE project_id = ?").get(projectId);
  if (cad) {
    floorPlan = {
      filePath: cad.walls_json ? 'has_cad' : null,
      annotations: {
        zones: JSON.parse(cad.rooms_json || '[]'),
        markers: JSON.parse(cad.furniture_json || '[]')
      }
    };
  }
  
  return {
    ...project,
    ...brief,
    id: project.id,
    clientName: project.client_name,
    budget: project.budget,
    budgetTier: brief.budgetTier || (project.budget >= 1000000 ? 'premium' : 'value'),
    selectedSpaces: brief.selectedSpaces || ['living', 'kitchen', 'masterBed'],
    floorPlan
  };
}

export function findReusableAssets({ room, style, budgetTier, rooms = [], componentTags = [] } = {}) {
  // Query from generated_assets table
  try {
    const rows = db.prepare("SELECT * FROM generated_assets ORDER BY created_at DESC LIMIT 120").all();
    const normalizedTags = componentTags.map(tag => String(tag).toLowerCase());
    
    return rows
      .filter(asset => !room || asset.room === room || rooms.includes(asset.room))
      .filter(asset => !style || asset.style === style)
      .filter(asset => !budgetTier || asset.budget_tier === budgetTier)
      .filter(asset => asset.source_type !== 'mock-generated' && !String(asset.file_path || '').toLowerCase().endsWith('.svg'))
      .map(asset => {
        // Tag score calculation
        let score = 50;
        const assetTags = JSON.parse(asset.tags || '[]');
        normalizedTags.forEach(t => {
          if (assetTags.some(at => String(at).toLowerCase().includes(t))) score += 15;
        });
        return {
          id: asset.id,
          projectId: asset.project_id,
          room: asset.room,
          style: asset.style,
          budgetTier: asset.budget_tier,
          title: asset.title,
          prompt: asset.prompt,
          tags: assetTags,
          url: asset.file_path,
          filePath: asset.file_path,
          reusableScore: asset.reusable_score,
          sourceType: asset.source_type,
          matchScore: score
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch (err) {
    console.error("Error in findReusableAssets:", err);
    return [];
  }
}

export function matchLaminates(project, filters = {}) {
  // First attempt: load from project's selected materials catalog
  try {
    const selection = db.prepare("SELECT * FROM material_selections WHERE project_id = ?").get(project.id);
    if (selection && selection.laminates_json) {
      const selected = JSON.parse(selection.laminates_json);
      if (selected.length > 0) {
        return selected.map(item => ({
          id: item.id || item.code || 'lam_' + Math.random().toString(36).substr(2, 5),
          name: item.name || 'Selected Laminate',
          brand: item.brand || 'Generic',
          finish: item.finish || 'Suede',
          bestFor: item.bestFor || (item.type === 'kitchen' ? ['kitchen'] : ['wardrobe', 'tv-unit', 'carcass'])
        }));
      }
    }
  } catch (err) {
    console.warn("Could not load selected laminates from DB, falling back to defaults", err);
  }

  // Fallback default Indian contemporary laminate palette
  return [
    { id: 'lam_1', name: 'Premium Frosty White SF', brand: 'CenturyPly', finish: 'Suede Finish', bestFor: ['kitchen', 'wardrobe', 'carcass'] },
    { id: 'lam_2', name: 'Classic Warm Oak Woodgrain', brand: 'Greenlam', finish: 'Textured Wood', bestFor: ['tv-unit', 'wardrobe', 'living'] },
    { id: 'lam_3', name: 'Charcoal Matte Acrylic', brand: 'Merino', finish: 'High Gloss Acrylic', bestFor: ['kitchen', 'shutter'] },
    { id: 'lam_4', name: 'Light Beige Gloss SF', brand: 'CenturyPly', finish: 'Gloss', bestFor: ['kitchen', 'wardrobe', 'carcass'] }
  ];
}
