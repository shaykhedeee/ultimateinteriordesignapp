const DEFAULT_COMPONENTS = {
  living_room: [
    { id: 'sofa', label: 'Sofa', confidence: 0.92 },
    { id: 'coffee_table', label: 'Coffee Table', confidence: 0.88 },
    { id: 'tv_unit', label: 'TV Unit', confidence: 0.85 },
    { id: 'curtains', label: 'Curtains', confidence: 0.78 },
    { id: 'ceiling_fan', label: 'Ceiling Fan', confidence: 0.72 }
  ],
  bedroom: [
    { id: 'bed', label: 'Bed', confidence: 0.94 },
    { id: 'wardrobe', label: 'Wardrobe', confidence: 0.90 },
    { id: 'side_table', label: 'Side Table', confidence: 0.82 },
    { id: 'dressing_table', label: 'Dressing Table', confidence: 0.76 }
  ],
  kitchen: [
    { id: 'kitchen_cabinet', label: 'Kitchen Cabinet', confidence: 0.93 },
    { id: 'chimney', label: 'Chimney', confidence: 0.80 },
    { id: 'refrigerator', label: 'Refrigerator', confidence: 0.85 },
    { id: 'kitchen_counter', label: 'Counter', confidence: 0.88 }
  ],
  pooja_room: [
    { id: 'pooja_unit', label: 'Pooja Unit', confidence: 0.95 },
    { id: 'mandir_shelf', label: 'Mandir Shelf', confidence: 0.82 },
    { id: 'brass_lamp', label: 'Brass Lamp', confidence: 0.70 }
  ],
  default: [
    { id: 'furniture', label: 'Furniture', confidence: 0.70 },
    { id: 'lighting', label: 'Lighting', confidence: 0.65 },
    { id: 'flooring', label: 'Flooring', confidence: 0.60 }
  ]
};

function normalize(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: String(item.id || item.component || item.label || `item_${index}`).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    label: String(item.label || item.component || item.name || item.id || `Item ${index + 1}`),
    confidence: Number(item.confidence || item.score || item.accuracy || 0),
    bbox: item.bbox || item.box || item.coordinates || null,
    metadata: item.metadata || {}
  }));
}

function filterAndRank(items = []) {
  const normalized = normalize(items);
  const threshold = 0.5;
  const filtered = normalized
    .filter(item => item.confidence >= threshold)
    .sort((a, b) => b.confidence - a.confidence);
  return filtered;
}

function mergeWithDefaults(items = [], roomType = 'default') {
  const ranked = filterAndRank(items);
  const defaults = DEFAULT_COMPONENTS[roomType] || DEFAULT_COMPONENTS.default;
  const existingIds = new Set(ranked.map(item => item.id));
  const merged = [...ranked];
  for (const defaultItem of defaults) {
    if (!existingIds.has(defaultItem.id)) {
      merged.push({ ...defaultItem, source: 'default' });
    }
  }
  return merged.sort((a, b) => b.confidence - a.confidence);
}

function parseDetections(items = [], roomType = 'default') {
  const normalized = normalize(items);
  const filtered = filterAndRank(normalized);
  const merged = mergeWithDefaults(filtered, roomType);
  return {
    raw: normalized,
    filtered,
    merged,
    summary: {
      totalDetected: normalized.length,
      afterFiltering: filtered.length,
      afterMerging: merged.length,
      roomType
    }
  };
}

const indianInteriorComponentDetector = {
  parseDetections,
  filterAndRank,
  mergeWithDefaults,
  normalize,
  DEFAULT_COMPONENTS
};

export default indianInteriorComponentDetector;
