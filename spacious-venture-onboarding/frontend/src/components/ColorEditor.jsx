// ============================================================
// SPACIOUS VENTURE STUDIO OS
// ColorEditor Component — Change component colors in renders
// ============================================================

import React, { useState, useEffect } from 'react';

const MATERIAL_OPTIONS = {
  sofa: ['Fabric', 'Velvet', 'Leather', 'Linen', 'Boucle'],
  'tv-unit': ['Walnut Veneer', 'White Lacquer', 'Laminate', 'PU Gloss'],
  wardrobe: ['Laminate', 'PU Finish', 'Veneer', 'Lacquer'],
  'kitchen-cabinet': ['Acrylic', 'Laminate', 'PU Matte', 'Veneer'],
  curtain: ['Fabric', 'Sheer', 'Velvet', 'Blackout'],
  wall: ['Emulsion Paint', 'Wallpaper', 'Textured Finish', 'Limewash'],
  default: ['Fabric', 'Laminate', 'Paint', 'Wood']
};

const COLOR_PRESETS = {
  sofa: [
    { name: 'Beige', hex: '#d4c5b2', family: 'neutral' },
    { name: 'Charcoal', hex: '#2d2d2d', family: 'neutral' },
    { name: 'Navy Blue', hex: '#1e4d6e', family: 'jewel' },
    { name: 'Teal', hex: '#008080', family: 'jewel' },
    { name: 'Terracotta', hex: '#c17e3a', family: 'earth' },
    { name: 'Mustard', hex: '#d4a017', family: 'bold' },
    { name: 'Sage', hex: '#a8b8a0', family: 'pastel' },
    { name: 'Blush', hex: '#e8c4b8', family: 'pastel' },
    { name: 'Forest', hex: '#2d5a27', family: 'jewel' },
    { name: 'Burgundy', hex: '#8b1a1a', family: 'jewel' },
    { name: 'Slate Grey', hex: '#708090', family: 'neutral' },
    { name: 'Cream', hex: '#f5f0e8', family: 'neutral' }
  ],
  'tv-unit': [
    { name: 'Natural Walnut', hex: '#8b6f47', family: 'wood' },
    { name: 'Pure White', hex: '#f5f5f0', family: 'neutral' },
    { name: 'Dark Walnut', hex: '#5c3a1e', family: 'wood' },
    { name: 'Warm Oak', hex: '#c4b49d', family: 'wood' },
    { name: 'Charcoal', hex: '#4a4a4a', family: 'neutral' },
    { name: 'Teak', hex: '#8b7a60', family: 'wood' },
    { name: 'High Gloss White', hex: '#ffffff', family: 'neutral' },
    { name: 'Matte Black', hex: '#1a1a1a', family: 'neutral' }
  ],
  wardrobe: [
    { name: 'Frosty White', hex: '#f0ece4', family: 'neutral' },
    { name: 'Warm Beige', hex: '#e8ddd0', family: 'neutral' },
    { name: 'Walnut', hex: '#8b6f47', family: 'wood' },
    { name: 'Grey Matt', hex: '#a0a098', family: 'neutral' },
    { name: 'Antique Oak', hex: '#c4b49d', family: 'wood' },
    { name: 'Sheesham', hex: '#5c3a1e', family: 'wood' },
    { name: 'Dove Grey', hex: '#d0d0c8', family: 'neutral' },
    { name: 'Taupe', hex: '#c0b0a0', family: 'neutral' }
  ],
  wall: [
    { name: 'Off White', hex: '#f4efe8', family: 'neutral' },
    { name: 'Warm Beige', hex: '#e8ddd0', family: 'neutral' },
    { name: 'Sage Green', hex: '#c4d4b8', family: 'pastel' },
    { name: 'Dusty Blue', hex: '#c0c8d8', family: 'pastel' },
    { name: 'Blush Pink', hex: '#e8c4b8', family: 'pastel' },
    { name: 'Mushroom', hex: '#d0c4b8', family: 'neutral' },
    { name: 'Terracotta', hex: '#d4a090', family: 'earth' },
    { name: 'Olive', hex: '#8a8a60', family: 'earth' }
  ],
  default: [
    { name: 'White', hex: '#ffffff', family: 'neutral' },
    { name: 'Beige', hex: '#d4c5b2', family: 'neutral' },
    { name: 'Grey', hex: '#808080', family: 'neutral' },
    { name: 'Brown', hex: '#8b6f47', family: 'wood' },
    { name: 'Black', hex: '#1a1a1a', family: 'neutral' },
    { name: 'Blue', hex: '#1e4d6e', family: 'jewel' }
  ]
};

export default function ColorEditor({
  componentType,
  currentColor,
  currentMaterial,
  onApply,
  onApplyToAll,
  onClose
}) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [viewFamily, setViewFamily] = useState('all');
  
  const colors = COLOR_PRESETS[componentType?.toLowerCase()] || COLOR_PRESETS.default;
  const materials = MATERIAL_OPTIONS[componentType?.toLowerCase()] || MATERIAL_OPTIONS.default;
  
  const families = [...new Set(colors.map(c => c.family))];
  const filteredColors = viewFamily === 'all' 
    ? colors 
    : colors.filter(c => c.family === viewFamily);
  
  const handleApply = () => {
    if (selectedColor) {
      onApply(componentType, selectedColor.name, selectedMaterial || 'Fabric');
    }
  };
  
  return (
    <div className="color-editor">
      <div className="editor-header">
        <div className="editor-title">
          <span className="editor-icon">🎨</span>
          <div>
            <h4>Color Editor</h4>
            <span className="editor-subtitle">{componentType}</span>
          </div>
        </div>
        <button className="btn btn-tiny btn-ghost" onClick={onClose}>✕</button>
      </div>
      
      {/* Current Color Display */}
      {currentColor && (
        <div className="current-color-display">
          <span className="label">Current:</span>
          <span className="current-swatch" style={{ backgroundColor: currentColor }} />
          <span>{currentColor}</span>
          {currentMaterial && <span className="material-label">({currentMaterial})</span>}
        </div>
      )}
      
      {/* Family Filter */}
      <div className="family-filter">
        <button
          className={`family-btn ${viewFamily === 'all' ? 'active' : ''}`}
          onClick={() => setViewFamily('all')}
        >
          All
        </button>
        {families.map(f => (
          <button
            key={f}
            className={`family-btn ${viewFamily === f ? 'active' : ''}`}
            onClick={() => setViewFamily(f)}
          >
            {f === 'neutral' && '⬜'} {f === 'jewel' && '💎'} {f === 'earth' && '🌍'}
            {f === 'pastel' && '🌸'} {f === 'wood' && '🪵'} {f === 'bold' && '🎨'}
            {' '}{f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Color Grid */}
      <div className="color-grid">
        {filteredColors.map((color, i) => (
          <button
            key={i}
            className={`color-cell ${selectedColor?.hex === color.hex ? 'selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            onClick={() => setSelectedColor(color)}
            title={color.name}
          >
            {selectedColor?.hex === color.hex && <span className="check-mark">✓</span>}
            <span className="color-name">{color.name}</span>
          </button>
        ))}
      </div>
      
      {/* Material Selector */}
      <div className="material-section">
        <label className="section-label">Material</label>
        <div className="material-options">
          {materials.map((mat, i) => (
            <button
              key={i}
              className={`material-chip ${selectedMaterial === mat ? 'active' : ''}`}
              onClick={() => setSelectedMaterial(mat)}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Preview */}
      {selectedColor && (
        <div className="color-preview">
          <div className="preview-label">Preview</div>
          <div className="preview-swatches">
            <div className="preview-before">
              <span className="preview-sub">Before</span>
              <div className="swatch-before" style={{ backgroundColor: currentColor || '#d4c5b2' }} />
            </div>
            <span className="preview-arrow">→</span>
            <div className="preview-after">
              <span className="preview-sub">After</span>
              <div className="swatch-after" style={{ backgroundColor: selectedColor.hex }} />
            </div>
          </div>
          <div className="preview-detail">
            {selectedColor.name} {selectedMaterial ? `· ${selectedMaterial}` : ''}
          </div>
        </div>
      )}
      
      {/* Apply Buttons */}
      <div className="apply-actions">
        <button
          className="btn btn-primary btn-full"
          disabled={!selectedColor}
          onClick={handleApply}
        >
          Apply to This Variant
        </button>
        {onApplyToAll && (
          <button
            className="btn btn-secondary btn-full"
            disabled={!selectedColor}
            onClick={() => onApplyToAll(componentType, selectedColor?.name, selectedMaterial || 'Fabric')}
          >
            Apply to All Variants
          </button>
        )}
      </div>
    </div>
  );
}