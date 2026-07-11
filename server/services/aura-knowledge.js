/**
 * aura-knowledge.js — Offline domain brain for AURA.
 *
 * When no LLM key is configured (or the local model is still downloading),
 * AURA falls back to this deterministic knowledge engine so the chat ALWAYS
 * returns a useful, accurate Indian-interior-design answer. This is the
 * "works with zero config" selling point that competitors (Infurnia / Coohom)
 * cannot match out-of-the-box.
 *
 * Pure, deterministic, fully unit-testable.
 */

const KNOWLEDGE = {
  vastu: {
    keywords: ['vastu', 'direction', 'north', 'south', 'east', 'west', 'pooja', 'kitchen direction', 'bedroom direction'],
    answer: `Vastu quick-guide for Indian homes:
• Pooja room → Northeast (Ishanya). Avoid South.
• Master bedroom → Southwest. Headboard South or East.
• Kitchen → Southeast (Agneya); cooking facing East. Avoid Northeast.
• Living room → North or East.
• Toilets → Northwest or West; never Northeast/Southwest.
• Main entrance → North/East/Northeast auspicious.`
  },
  cabinetry: {
    keywords: ['cabinet', 'shutter', 'ply', 'plywood', 'thickness', '18mm', 'mdf'],
    answer: `Standard Indian carcass specs:
• BWP/BWR plywood 18mm for carcass, 12mm for back.
• Shutter: 18mm MDF/PLY, or 22–25mm for premium.
• Plinth/kick 100mm. Hardware: Hettich/Blum/Ebco hinges with soft-close.
• Counter height 850–920mm (900 standard).`
  },
  wardrobe: {
    keywords: ['wardrobe', 'almirah', 'hanging', 'loft'],
    answer: `Wardrobe sizing:
• Depth 600mm (min 560) to hang shirts/dresses.
• Height 2100–2400mm; loft above 300–400mm.
• Shutter >750mm width → use 2 shutters to avoid sag.
• L-shape or parallel for walk-in.`
  },
  kitchen: {
    keywords: ['kitchen', 'counter', 'modular', 'gallery', 'work triangle'],
    answer: `Modular kitchen rules:
• Work triangle (sink–hob–fridge) each leg 1.2–2.7m.
• Counter 900mm, depth 600mm, 1200mm front clearance.
• Overheads bottom at 1500mm, 720mm tall.
• Landing space 300mm either side of hob & sink.`
  },
  budget: {
    keywords: ['budget', 'cost', 'price', 'quotation', 'rate', 'sqft'],
    answer: `Budget guidance (premium Indian fit-out, indicative):
• Modular wardrobe ₹18k–25k/ft run.
• Kitchen ₹2L–5L for 8–12 ft.
• Full home interior ₹1,200–2,500/sqft depending on material tier.
Use Materials & BOQ screen to chain a real estimate.`
  },
  render: {
    keywords: ['render', '3d', 'visualise', 'lighting', 'light'],
    answer: `For photoreal renders: warm 2700K cove + task lighting, beige marble-vein floor, two-tone walnut/charcoal ribbed cabinetry, brass accents, channel-tufted headboard. Avoid humans/pets/text in the frame.`
  },
  dxf: {
    keywords: ['dxf', 'autocad', 'shop drawing', 'elevation drawing'],
    answer: `ULTIDA emits AutoCAD R2010 ASCII DXF + vector PDF elevations directly from your 2D trace. Component layers (glass/cane/handle/frame) keep the shop drawing clean.`
  },
  default: {
    keywords: [],
    answer: `I'm AURA, your design co-pilot. I can help with elevations & DXF, 3D renders, floorplan AI detection, cutlists, Vastu checks, budget optimization, and client handoff. Ask me about any of these, or tell me the room you're working on.`
  }
};

/**
 * Answer a question using the offline knowledge engine.
 * @param {string} message
 * @returns {{text:string, topic:string, model:string}}
 */
export function answerFromKnowledge(message) {
  const text = String(message || '').toLowerCase();
  let best = KNOWLEDGE.default;
  let bestScore = 0;
  for (const [topic, entry] of Object.entries(KNOWLEDGE)) {
    if (topic === 'default') continue;
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw.toLowerCase())) score += kw.length;
    }
    if (score > bestScore) { bestScore = score; best = entry; best._topic = topic; }
  }
  const topic = best._topic || 'default';
  return { text: best.answer, topic, model: 'offline-knowledge' };
}

export { KNOWLEDGE };
export default { answerFromKnowledge, KNOWLEDGE };
