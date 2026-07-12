import db from '../database/database.js';

/**
 * AURA Multi-Agent Definitions
 * 
 * Each agent handles a specific domain of interior design, 
 * with tailored tools (functions) it can call.
 */

export const AURA_AGENTS = {
  LAYOUT_ANALYST: {
    id: 'layout_analyst',
    name: 'Layout & Vastu Analyst',
    description: 'Specializes in floorplan ingestion, space planning, and Vastu compliance.',
    systemPrompt: `You are the Layout & Vastu Analyst agent for ULTIDA.
Your job is to analyze floorplans, detect rooms, parse walls, and ensure Vastu compliance.
Always be precise with measurements and cardinal directions (NE, SW, SE, NW).`,
    tools: [
      {
        name: 'plan_ai_detect',
        description: 'Auto-detect furniture and walls from the uploaded floorplan.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'cv_auto_trace',
        description: 'Run computer vision tracing on the floorplan to generate CAD lines.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'vastu_check',
        description: 'Analyze the current floorplan for Vastu compliance and violations.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'apply_vastu',
        description: 'Automatically fix Vastu violations by swapping non-compliant rooms/furniture.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  VISUALIZATION_DIRECTOR: {
    id: 'visualization_director',
    name: '3D Visualization Director',
    description: 'Specializes in 3D rendering, camera angles, and lighting.',
    systemPrompt: `You are the 3D Visualization Director for ULTIDA.
Your job is to generate photorealistic interior design renders, adjust lighting, and frame camera angles.
When asked to render, always pick the most flattering FOV and specify lighting conditions.`,
    tools: [
      {
        name: 'generate_render',
        description: 'Generate a new 3D render for the current room or project.',
        parameters: { 
          type: 'object', 
          properties: {
            roomType: { type: 'string', description: 'e.g. living, kitchen, masterBed' },
            style: { type: 'string', description: 'e.g. indian-contemporary, modern-minimalist' }
          } 
        }
      },
      {
        name: 'regen_room',
        description: 'Regenerate the render and CAD for a specific room.',
        parameters: { 
          type: 'object', 
          properties: {
            roomName: { type: 'string', description: 'Name of the room to regenerate' }
          },
          required: ['roomName']
        }
      }
    ]
  },
  MATERIALS_EXPERT: {
    id: 'materials_expert',
    name: 'Materials & Finishes Expert',
    description: 'Specializes in material selection, texture swapping, and color palettes.',
    systemPrompt: `You are the Materials & Finishes Expert for ULTIDA.
Your job is to recommend and apply laminates, acrylics, veneers, paints, and fabrics.
Ensure colors and textures harmonize with the requested design style.`,
    tools: [
      {
        name: 'suggest_palette',
        description: 'Suggest a color palette or material board.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  PRODUCT_ENGINEER: {
    id: 'product_engineer',
    name: 'Product & Cabinetry Engineer',
    description: 'Specializes in modular cabinetry, parametric design, and cutlists.',
    systemPrompt: `You are the Product & Cabinetry Engineer for ULTIDA.
Your job is to generate modular cabinetry templates (kitchens, wardrobes), shoe racks, jali panels, and optimize CNC cutlists.
Focus on structural integrity, standard panel sizes (e.g., 18mm ply), and minimizing wastage.`,
    tools: [
      {
        name: 'kitchen_template',
        description: 'Apply a standard modular kitchen layout (U-shape, L-shape, Straight).',
        parameters: { 
          type: 'object', 
          properties: { shape: { type: 'string', enum: ['U', 'L', 'Straight'] } },
          required: ['shape']
        }
      },
      {
        name: 'cutlist_calculate',
        description: 'Calculate the CNC cutlist and nesting optimization for the current design.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'cutlist_refresh',
        description: 'Recalculate the CNC cutlist after changes.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'jali_generate',
        description: 'Generate a CNC Jali or Lattice panel DXF.',
        parameters: { 
          type: 'object', 
          properties: { widthMm: { type: 'number' }, heightMm: { type: 'number' } } 
        }
      },
      {
        name: 'shoe_rack_generate',
        description: 'Generate a parametric shoe rack cabinet.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  FINANCE_CONTROLLER: {
    id: 'finance_controller',
    name: 'Finance & BOQ Controller',
    description: 'Specializes in budgeting, BOQ (Bill of Quantities), and quotations.',
    systemPrompt: `You are the Finance & BOQ Controller for ULTIDA.
Your job is to generate quotations, optimize costs, and track the budget.
Always prioritize value-engineering while maintaining design aesthetics.`,
    tools: [
      {
        name: 'generate_quotation',
        description: 'Generate the final cost quotation PDF.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'budget_optimize',
        description: 'Suggest changes to optimize the budget and reduce cost.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  TECHNICAL_DRAFTER: {
    id: 'technical_drafter',
    name: 'Technical Drafter',
    description: 'Specializes in 2D elevations, RCPs, and DXF generation.',
    systemPrompt: `You are the Technical Drafter for ULTIDA.
Your job is to generate precise 2D elevations, shop drawings, and export DXF files for manufacturing.
Ensure all dimensions are in millimeters.`,
    tools: [
      {
        name: 'generate_elevation',
        description: 'Generate 2D Elevation DXF shop drawings for the current room/walls.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  CLIENT_MANAGER: {
    id: 'client_manager',
    name: 'Client Delivery Manager',
    description: 'Specializes in client briefs, presentation generation, and final handoff.',
    systemPrompt: `You are the Client Delivery Manager for ULTIDA.
Your job is to prepare presentation PDFs, compile client sign-offs, and generate the final delivery package.
Use professional, polished language suitable for high-end clients.`,
    tools: [
      {
        name: 'generate_signoff',
        description: 'Compile the client presentation and sign-off package.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'delivery_pack',
        description: 'Build the final client delivery ZIP package with all assets.',
        parameters: { type: 'object', properties: {} }
      }
    ]
  },
  STYLE_CURATOR: {
    id: 'style_curator',
    name: 'Style Curator',
    description: 'Specializes in moodboards, concept discovery, and styling.',
    systemPrompt: `You are the Style Curator for ULTIDA.
Your job is to understand the user's aesthetic preferences and suggest design themes, moodboards, or inspiration.
Be creative and inspiring.`,
    tools: [
      {
        name: 'rag_search',
        description: 'Search the ULTIDA knowledge base for styling ideas, catalog items, or past projects.',
        parameters: { 
          type: 'object', 
          properties: { query: { type: 'string' } },
          required: ['query']
        }
      }
    ]
  }
};

/**
 * Fetch company-wide learned rules to inject into the system prompt.
 */
export function getCompanyBrainContext() {
  try {
    const rules = db.prepare("SELECT learned_rule FROM company_brain_kb ORDER BY created_at DESC").all();
    if (rules.length === 0) return "";
    
    return "\\n\\nCRITICAL COMPANY STANDARDS (Self-Learned):\\n" + rules.map(r => "- " + r.learned_rule).join("\\n");
  } catch (err) {
    console.warn("Failed to fetch company brain context:", err.message);
    return "";
  }
}
