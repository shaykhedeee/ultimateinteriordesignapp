export const INDIAN_INTERIOR_PROMPT_CORPUS = Object.freeze({
  vastu: [
    'Kitchen should be in the southeast corner of the home.',
    'Master bedroom should be in the southwest direction.',
    'Pooja room should face east or northeast.',
    'Avoid beams over the bed or dining table.',
    'Keep the center of the home open and light.'
  ],
  pooja_unit: [
    'Pooja units should have a raised platform or mandap style.',
    'Include a backlit LED panel or tejalight niche behind the deity shelf.',
    'Use teak or carved MDF with a polish or laminate finish.',
    'Include lower drawers for storage of puja items.',
    'Height should allow standing darshan on the floor.'
  ],
  tv_unit: [
    'TV unit height should allow comfortable viewing from the sofa at ~2.5m.',
    'Include open celings for media devices and closed panels for cables.',
    'Backlit coves behind the TV reduce eye strain.',
    'Use push-open or soft-close hardware for a seamless face.',
    'Laminate or veneer finishes match living room furniture.'
  ],
  wardrobe: [
    'Wardrobe internal layout should include hanging rails, shelves, and shoe rack.',
    'Loft usage increases usable storage by 25-30 percent.',
    'Use BWR ply or MDF with laminate for durability.',
    'Include drawer modules for accessories and a locker.',
    'Mirror shutters visually enlarge smaller bedrooms.'
  ],
  modular_kitchen: [
    'Standard kitchen counter height is 900mm for Indian users.',
    'Include electrical sockets for chimneys, microwaves, and hobs.',
    'Use of SS sinks with drainboard is common in North India.',
    'Tall units reduce bending and improve ergonomics for elderly users.',
    'Include a chimney or exhaust for fume management.'
  ],
  laminate: [
    'Common laminate brands include Greenply, Century, and Merino.',
    'High-gloss finishes are popular for modern interiors.',
    'Textured finishes are preferred in high-traffic areas.',
    'Maintain alignment with existing furniture section widths.'
  ],
  hardware: [
    'Soft-close hinges and channels improve durability.',
    'Use of handle-less profiles gives a premium look.',
    'Include automatic wardrobe LED strip lighting.'
  ],
  cutlist: [
    'Standard sheet sizes: 1220x2440mm plywood and MDF.',
    'Include edgebanding on all exposed edges.',
    'Add 2mm-5mm kerf and alignment holes for CNC nesting.'
  ]
});

export class ProjectMemory {
  constructor() {
    this.store = new Map();
  }

  getMemory(projectId) {
    return this.store.get(projectId) || null;
  }

  initialize(projectId, seed = {}) {
    const memory = {
      projectId,
      sceneVersion: seed.sceneVersion || 0,
      renderHistory: Array.isArray(seed.renderHistory) ? seed.renderHistory : [],
      materialAssignments: Array.isArray(seed.materialAssignments) ? seed.materialAssignments : [],
      clientPreferences: Array.isArray(seed.clientPreferences) ? seed.clientPreferences : [],
      vastuFlags: Array.isArray(seed.vastuFlags) ? seed.vastuFlags : [],
      conversationSummary: seed.conversationSummary || '',
      prompts: Array.isArray(seed.prompts) ? seed.prompts : [],
      activeContext: Array.isArray(seed.activeContext) ? seed.activeContext : []
    };
    this.store.set(projectId, memory);
    return memory;
  }

  appendConversation(projectId, role, text) {
    const memory = this._getOrInit(projectId);
    memory.prompts.push({ role, text, at: Date.now() });
    this._summarize(memory);
    return memory;
  }

  setCurrentRender(projectId, renderMeta) {
    const memory = this._getOrInit(projectId);
    memory.renderHistory.push({ ...renderMeta, at: Date.now() });
    memory.activeContext = memory.activeContext.filter(x => x.kind !== 'current_render');
    memory.activeContext.push({ kind: 'current_render', meta: renderMeta });
    return memory;
  }

  assignMaterial(projectId, assignment) {
    const memory = this._getOrInit(projectId);
    memory.materialAssignments.push({ ...assignment, at: Date.now() });
    memory.activeContext.push({ kind: 'material_assignment', meta: assignment });
    return memory;
  }

  flagVastu(projectId, flag) {
    const memory = this._getOrInit(projectId);
    memory.vastuFlags.push({ ...flag, at: Date.now() });
    memory.activeContext.push({ kind: 'vastu_flag', meta: flag });
    return memory;
  }

  getActiveContext(projectId, maxTokens = 2000) {
    const memory = this._getOrInit(projectId);
    const curated = this._curate(memory);
    const contextPane = {
      projectSnapshot: memory.activeContext,
      renderHistory: memory.renderHistory.slice(-5),
      materialAssignments: memory.materialAssignments.slice(-10),
      vastuFlags: memory.vastuFlags.slice(-10),
      clientPreferences: memory.clientPreferences.slice(-10),
      prompts: this._promptsAsContext(memory.prompts),
      corpus: INDIAN_INTERIOR_PROMPT_CORPUS
    };
    const text = JSON.stringify(contextPane);
    if (text.length > maxTokens) {
      contextPane.projectSnapshot = contextPane.projectSnapshot.slice(-20);
      contextPane.prompts = this._promptsAsContext(memory.prompts.slice(-10));
    }
    return contextPane;
  }

  _getOrInit(projectId) {
    let memory = this.store.get(projectId);
    if (!memory) {
      memory = this.initialize(projectId);
    }
    return memory;
  }

  _curate(memory) {
    memory.activeContext = memory.activeContext.slice(-80);
    return memory;
  }

  _summarize(memory) {
    const recent = memory.prompts.slice(-10);
    memory.conversationSummary = recent.map(p => `${p.role}:${p.text.slice(0,120)}`).join(' | ');
  }

  _promptsAsContext(prompts) {
    return prompts.slice(-20).map(p => ({ role: p.role, text: p.text?.slice(0,300) }));
  }
}
