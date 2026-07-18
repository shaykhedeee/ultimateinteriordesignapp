// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Enhanced AI Render Studio (AIRenderStudioEnhanced.jsx)
// Full-featured render studio with floor plan understanding,
// spatial map, component color editing, and variant management
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/render-studio-enhanced.css';

/**
 * AIRenderStudioEnhanced
 * 
 * The centerpiece of the app — connects floor plan analysis
 * to AI render generation with full color editing capabilities.
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SPATIAL MAP  │  RENDER CANVAS              │ COLOR CTL   │
 * │  (260px)      │  (flex: 1)                  │ (320px)     │
 * │               │                              │             │
 * │  Floor plan   │  Main render display         │ Room/style  │
 * │  overlay      │  Click to select components  │ selection   │
 * │  Room list    │  Thumbnail strip below       │ Color ed.   │
 * │  Component    │  Spatial accuracy report     │ Material    │
 * │  confidence   │                              │ Variants    │
 * └───────────────┴──────────────────────────────┴────────────┘
 */
export default function AIRenderStudioEnhanced({ projectId, floorPlanData, onRendersGenerated }) {
  // ---- State Management ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studioData, setStudioData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('v1');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showAccuracyReport, setShowAccuracyReport] = useState(false);
  const [renderMode, setRenderMode] = useState('balanced'); // quick | balanced | precision
  const [variantCount, setVariantCount] = useState(4);
  const [style, setStyle] = useState('modern');
  const [budgetTier, setBudgetTier] = useState('premium');
  const [customInstruction, setCustomInstruction] = useState('');
  const [renderResults, setRenderResults] = useState(null);
  const [colorChanges, setColorChanges] = useState([]);
  const [activeTab, setActiveTab] = useState('render'); // render | accuracy | colors

  // ---- Load Studio Data ----
  useEffect(() => {
    if (projectId) {
      loadStudioData(projectId);
    }
  }, [projectId]);

  const loadStudioData = async (pid) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/renders/studio/${pid}`);
      const data = await response.json();
      if (data.success) {
        setStudioData(data);
        if (data.availableRooms?.length > 0) {
          setSelectedRoom(data.availableRooms[0]);
        }
      }
    } catch (err) {
      setError('Failed to load studio data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Floor Plan Analysis ----
  const handleFloorPlanUpload = async (file) => {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('floorPlan', file);
    formData.append('projectId', projectId);
    formData.append('style', style);
    formData.append('budgetTier', budgetTier);
    
    try {
      const response = await fetch('/api/renders/analyze-floorplan', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        // Update studio data with analysis results
        setStudioData(prev => ({
          ...prev,
          spatialMap: data.analysis ? {
            rooms: data.analysis.rooms.map(r => ({
              name: r.name, area: r.areaSqFt,
              dimensions: r.dimensionsMm, confidence: r.confidence
            })),
            walls: data.analysis.walls?.map(w => ({
              length: w.length, type: w.type
            })) || [],
            components: data.analysis.components?.map(c => ({
              type: c.type, roomName: c.roomName,
              moduleType: c.moduleType, confidence: c.confidence
            })) || [],
            confidence: data.analysis.confidence
          } : null,
          availableRooms: data.analysis?.rooms?.map(r => r.name) || []
        }));
        
        if (data.analysis?.rooms?.length > 0) {
          setSelectedRoom(data.analysis.rooms[0].name);
        }
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Generate Renders ----
  const handleGenerateRenders = async () => {
    if (!studioData?.spatialMap) {
      setError('Please upload and analyze a floor plan first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/renders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          floorPlanAnalysis: { rooms: studioData.spatialMap.rooms.map(r => ({
            name: r.name, dimensions: r.dimensions
          })) },
          style,
          budgetTier,
          variantCount,
          imageSize: '1024x1024',
          quality: renderMode
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRenderResults(data);
        if (onRendersGenerated) onRendersGenerated(data);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (err) {
      setError('Render generation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Component Color Change ----
  const handleColorChange = async (componentType, newColor, newMaterial, applyToAllVariants) => {
    setLoading(true);
    try {
      const response = await fetch('/api/renders/change-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          renderId: renderResults?.renderId,
          variantId: selectedVariant,
          componentType,
          newColor,
          newMaterial,
          applyToAllVariants
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setColorChanges(prev => [...prev, {
          componentType, newColor, newMaterial,
          timestamp: new Date().toISOString()
        }]);
        
        if (data.suggestions?.length > 0) {
          // Show complementary suggestions
          setShowSuggestions(data.suggestions);
        }
        
        // Re-render the mock display with updated color
        // In production: update the actual render image
      }
    } catch (err) {
      setError('Color change failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Batch Color Apply ----
  const handleBatchColorChange = async (componentType, newColor, newMaterial) => {
    setLoading(true);
    try {
      const response = await fetch('/api/renders/batch-color-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          renderId: renderResults?.renderId,
          componentType, newColor, newMaterial
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setColorChanges(prev => [...prev, {
          componentType, newColor, newMaterial,
          batchApplied: true,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err) {
      setError('Batch color change failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Component Click Handler (click render → edit color) ----
  const handleComponentClick = (componentType) => {
    setSelectedComponent(componentType);
    setShowColorEditor(true);
  };

  // ---- Render Mock Display Helper ----
  const renderMockImage = (variantId) => {
    const colors = {
      v1: '#c89b45',
      v2: '#2d2d2d',
      v3: '#1e4d6e',
      v4: '#8b4513'
    };
    const names = {
      v1: "Designer's Choice",
      v2: 'Contemporary Dark',
      v3: 'Bold & Blue',
      v4: 'Evening Ambiance'
    };
    
    const color = colors[variantId] || '#c89b45';
    const name = names[variantId] || 'Variant';
    
    // Apply color overrides from changes
    const sofaChange = colorChanges.find(c => c.componentType?.includes('SOFA'));
    const tvChange = colorChanges.find(c => c.componentType?.includes('TV') || c.componentType?.includes('tv'));
    
    const sofaColor = sofaChange ? getColorHex(sofaChange.newColor) : color;
    const tvColor = tvChange ? getColorHex(tvChange.newColor) : '#8b6f47';
    
    return { color, sofaColor, tvColor, name };
  };

  // ---- Render ----
  return (
    <div className="render-studio-enhanced">
      {/* Top Bar */}
      <div className="studio-topbar">
        <div className="topbar-left">
          <h2>AI Render Studio</h2>
          <span className="project-badge">{projectId ? `Project: ${studioData?.projectName || projectId}` : 'No project selected'}</span>
        </div>
        <div className="topbar-right">
          <span className="stage-badge">Stage: Render Review</span>
          <div className="studio-actions">
            <button className="btn btn-ghost" onClick={() => setShowAccuracyReport(!showAccuracyReport)}>
              {showAccuracyReport ? 'Hide Report' : 'Show Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="studio-main">
        {/* LEFT: Spatial Map */}
        <div className="studio-panel spatial-map-panel">
          <div className="panel-header">
            <h3>Spatial Map</h3>
            <span className="confidence-badge" data-level={
              (studioData?.spatialMap?.confidence || 0) >= 85 ? 'high' :
              (studioData?.spatialMap?.confidence || 0) >= 60 ? 'medium' : 'low'
            }>
              {(studioData?.spatialMap?.confidence || 0)}% confident
            </span>
          </div>
          
          <div className="spatial-map-content">
            {/* Floor Plan Upload */}
            {!studioData?.spatialMap ? (
              <div className="upload-zone">
                <div className="upload-icon">📐</div>
                <p>Upload a floor plan image to begin</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => e.target.files[0] && handleFloorPlanUpload(e.target.files[0])}
                  id="floorplan-upload"
                  hidden
                />
                <label htmlFor="floorplan-upload" className="btn btn-primary">
                  Upload Floor Plan
                </label>
              </div>
            ) : (
              <>
                {/* Room List */}
                <div className="room-list">
                  <h4>Rooms Detected</h4>
                  {studioData.spatialMap.rooms?.map((room, i) => (
                    <div
                      key={i}
                      className={`room-item ${selectedRoom === room.name ? 'active' : ''}`}
                      onClick={() => setSelectedRoom(room.name)}
                    >
                      <div className="room-icon">
                        {room.name.includes('Kitchen') ? '🍳' :
                         room.name.includes('Bed') ? '🛏️' :
                         room.name.includes('Living') ? '🛋️' :
                         room.name.includes('Dining') ? '🍽️' :
                         room.name.includes('Bath') ? '🚿' :
                         room.name.includes('Balcony') ? '🌿' :
                         room.name.includes('Pooja') ? '🪔' : '🚪'}
                      </div>
                      <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        <span className="room-dims">{room.area} sq.ft</span>
                      </div>
                      <div className="room-confidence">
                        <div className="confidence-dot" data-level={room.confidence >= 0.8 ? 'high' : room.confidence >= 0.5 ? 'medium' : 'low'} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Components Detected */}
                <div className="component-list">
                  <h4>Components</h4>
                  {studioData.spatialMap.components
                    ?.filter(c => !selectedRoom || c.roomName === selectedRoom)
                    .map((comp, i) => (
                      <div key={i} className="component-item">
                        <div className="component-icon">
                          {comp.moduleType?.includes('tv') ? '📺' :
                           comp.moduleType?.includes('sofa') ? '🛋️' :
                           comp.moduleType?.includes('wardrobe') ? '🗄️' :
                           comp.moduleType?.includes('bed') ? '🛏️' :
                           comp.moduleType?.includes('dining') ? '🍽️' :
                           comp.moduleType?.includes('kitchen') ? '🍳' : '📦'}
                        </div>
                        <div className="component-info">
                          <span className="comp-name">{comp.type}</span>
                          <span className="comp-room">{comp.roomName}</span>
                        </div>
                        <div className="comp-confidence">
                          {Math.round(comp.confidence * 100)}%
                        </div>
                        <button
                          className="btn btn-tiny btn-ghost"
                          onClick={() => handleComponentClick(comp.type)}
                          title="Change color"
                        >
                          🎨
                        </button>
                      </div>
                    ))}
                </div>

                {/* Walls Summary */}
                <div className="walls-summary">
                  <h4>Walls</h4>
                  <div className="wall-stats">
                    <span>{(studioData.spatialMap.walls?.filter(w => w.type === 'exterior')?.length || 0)} exterior</span>
                    <span>{(studioData.spatialMap.walls?.filter(w => w.type === 'interior')?.length || 0)} interior</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CENTER: Render Canvas */}
        <div className="studio-panel render-canvas-panel">
          <div className="panel-header">
            <h3>Render Preview</h3>
            <div className="render-controls">
              <select value={renderMode} onChange={e => setRenderMode(e.target.value)} className="select-sm">
                <option value="quick">Quick</option>
                <option value="balanced">Balanced</option>
                <option value="precision">Precision</option>
              </select>
              <select value={style} onChange={e => setStyle(e.target.value)} className="select-sm">
                <option value="modern">Modern</option>
                <option value="minimalist">Minimalist</option>
                <option value="traditional">Traditional</option>
                <option value="luxury">Luxury</option>
                <option value="contemporary">Contemporary</option>
              </select>
              <select value={budgetTier} onChange={e => setBudgetTier(e.target.value)} className="select-sm">
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div className="canvas-content">
            {/* Main Render Display */}
            <div className="render-display">
              {!renderResults ? (
                <div className="render-placeholder">
                  <div className="placeholder-icon">🎨</div>
                  {studioData?.spatialMap ? (
                    <>
                      <p>Ready to generate renders from floor plan analysis</p>
                      <p className="placeholder-detail">
                        {studioData.spatialMap.rooms?.length || 0} rooms • 
                        {studioData.spatialMap.components?.length || 0} components detected
                      </p>
                      <button className="btn btn-primary btn-lg" onClick={handleGenerateRenders} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Variants'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p>Upload a floor plan to analyze the space</p>
                      <p className="placeholder-detail">Then generate AI renders that match the layout exactly</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Mock Render Image */}
                  <div className="render-image-container">
                    <div className="render-image" style={{
                      backgroundColor: renderMockImage(selectedVariant).color + '22',
                      borderColor: renderMockImage(selectedVariant).color
                    }}>
                      <svg viewBox="0 0 800 600" className="render-svg">
                        <defs>
                          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: '#101413'}}/>
                            <stop offset="100%" style={{stopColor: '#171b19'}}/>
                          </linearGradient>
                        </defs>
                        <rect x="50" y="50" width="700" height="400" fill="url(#bg)" rx="4"/>
                        <rect x="50" y="450" width="700" height="100" fill="#1a1a1a" rx="2"/>
                        <rect x="300" y="100" width="200" height="220" fill="#2a3a4a" rx="2" opacity="0.8"/>
                        <line x1="400" y1="100" x2="400" y2="320" stroke="rgba(255,255,255,0.1)"/>
                        <line x1="300" y1="210" x2="500" y2="210" stroke="rgba(255,255,255,0.1)"/>
                        {/* TV Unit */}
                        <rect x="310" y="310" width="180" height="35" fill={renderMockImage(selectedVariant).sofaColor} rx="2" opacity="0.85"/>
                        <rect x="340" y="280" width="120" height="30" fill="#000" opacity="0.4" rx="1"/>
                        {/* Sofa */}
                        <rect x="120" y="380" width="260" height="40" fill={renderMockImage(selectedVariant).sofaColor} rx="3" opacity="0.7"/>
                        <rect x="160" y="372" width="180" height="12" fill={renderMockImage(selectedVariant).sofaColor} rx="2" opacity="0.5"/>
                        {/* Cushion accents */}
                        <circle cx="300" cy="400" r="6" fill="#008080" opacity="0.8"/>
                        <circle cx="315" cy="400" r="6" fill="#d4a017" opacity="0.8"/>
                        {/* Coffee table */}
                        <rect x="280" y="415" width="70" height="12" fill="#8b6f47" rx="1"/>
                        {/* Room label */}
                        <text x="400" y="80" textAnchor="middle" fill="#f4f0e8" fontSize="16" fontWeight="600">
                          {selectedRoom || 'Living Room'}
                        </text>
                        <text x="400" y="98" textAnchor="middle" fill="#aaa49a" fontSize="11">
                          {renderMockImage(selectedVariant).name} • W: 6000mm • L: 4500mm
                        </text>
                        {/* Clickable component areas */}
                        <rect x="120" y="360" width="260" height="60" fill="transparent" stroke="rgba(200,155,69,0.3)" strokeWidth="1" strokeDasharray="4" rx="3"
                          onClick={() => handleComponentClick('Sofa')} style={{cursor: 'pointer'}}/>
                        <rect x="300" y="270" width="200" height="80" fill="transparent" stroke="rgba(200,155,69,0.3)" strokeWidth="1" strokeDasharray="4" rx="2"
                          onClick={() => handleComponentClick('TV Unit')} style={{cursor: 'pointer'}}/>
                      </svg>
                      
                      {/* Color change indicator */}
                      {colorChanges.length > 0 && (
                        <div className="render-changes-badge">
                          <span>✨ {colorChanges.length} color change(s) applied</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover hint */}
                    <div className="click-hint">
                      Click on components in the render to change their colors
                    </div>
                  </div>

                  {/* Variant Thumbnails */}
                  <div className="variant-strip">
                    {['v1', 'v2', 'v3', 'v4'].slice(0, variantCount).map(vId => {
                      const mock = renderMockImage(vId);
                      const isActive = selectedVariant === vId;
                      return (
                        <div
                          key={vId}
                          className={`variant-thumb ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedVariant(vId)}
                        >
                          <div className="variant-thumb-img" style={{
                            backgroundColor: mock.color + '44',
                            borderColor: isActive ? '#c89b45' : 'rgba(255,255,255,0.1)'
                          }}>
                            <span className="variant-icon">
                              {vId === 'v1' ? '⭐' : vId === 'v2' ? '🌙' : vId === 'v3' ? '💙' : '🌆'}
                            </span>
                          </div>
                          <div className="variant-name">{mock.name}</div>
                          <div className="variant-status">
                            {isActive ? '● Selected' : '○ Click to view'}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Regenerate button */}
                    <button className="btn btn-secondary variant-regenerate" onClick={handleGenerateRenders} disabled={loading}>
                      {loading ? '⟳' : '+'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Instruction */}
          <div className="canvas-footer">
            <input
              type="text"
              placeholder="Custom instructions for the AI render (e.g., 'Add a statement chandelier')"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              className="input-full"
            />
          </div>
        </div>

        {/* RIGHT: Color Controls & Design Settings */}
        <div className="studio-panel color-controls-panel">
          <div className="panel-header">
            <h3>Design Controls</h3>
          </div>

          <div className="controls-content">
            {/* Room selector */}
            <div className="control-section">
              <label>Room to Render</label>
              <select
                value={selectedRoom || ''}
                onChange={e => setSelectedRoom(e.target.value)}
                className="select-full"
              >
                {studioData?.availableRooms?.map((room, i) => (
                  <option key={i} value={room}>{room}</option>
                ))}
                {!studioData?.availableRooms?.length && (
                  <option value="">No rooms detected</option>
                )}
              </select>
            </div>

            {/* Variant Count */}
            <div className="control-section">
              <label>Variants to Generate</label>
              <div className="variant-count-selector">
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    className={`btn btn-sm ${variantCount === n ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVariantCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="control-section">
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleGenerateRenders}
                disabled={loading || !studioData?.spatialMap}
              >
                {loading ? '⏳ Processing...' : '🎨 Generate Variants'}
              </button>
            </div>

            {/* Divider */}
            <div className="control-divider" />

            {/* Color Editor (shown when component selected) */}
            {showColorEditor && selectedComponent && (
              <div className="color-editor-section">
                <div className="color-editor-header">
                  <h4>Color Editor</h4>
                  <button className="btn btn-tiny btn-ghost" onClick={() => setShowColorEditor(false)}>✕</button>
                </div>
                
                <div className="color-editor-component">
                  <span className="editor-label">Editing:</span>
                  <span className="editor-value">{selectedComponent}</span>
                </div>

                {/* Color Palette */}
                <div className="color-palette-grid">
                  {getPaletteForComponent(selectedComponent).map((color, i) => (
                    <button
                      key={i}
                      className="color-swatch"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      onClick={() => handleColorChange(selectedComponent, color.name, 'fabric', false)}
                    >
                      <span className="swatch-tooltip">{color.name}</span>
                    </button>
                  ))}
                </div>

                {/* Material Selector */}
                <div className="material-selector">
                  <label>Material</label>
                  <div className="material-options">
                    {['Fabric', 'Velvet', 'Leather', 'Linen'].map(mat => (
                      <button
                        key={mat}
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleColorChange(selectedComponent, selectedComponent + ' Color', mat, false)}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Options */}
                <div className="apply-options">
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleColorChange(
                      selectedComponent,
                      'Navy Blue',
                      'Velvet',
                      false
                    )}
                  >
                    Apply to This Variant
                  </button>
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => handleBatchColorChange(
                      selectedComponent,
                      'Navy Blue',
                      'Velvet'
                    )}
                  >
                    Apply to All Variants
                  </button>
                </div>

                {/* Color Change History */}
                {colorChanges.filter(c => c.componentType === selectedComponent).length > 0 && (
                  <div className="color-history">
                    <h5>Recent Changes</h5>
                    {colorChanges
                      .filter(c => c.componentType === selectedComponent)
                      .slice(-3)
                      .reverse()
                      .map((change, i) => (
                        <div key={i} className="history-item">
                          <span className="history-action">{change.componentType}</span>
                          <span className="history-arrow">→</span>
                          <span className="history-color">{change.newColor}</span>
                          {change.newMaterial && <span className="history-material">({change.newMaterial})</span>}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Show color editor prompt if no component selected */}
            {!showColorEditor && (
              <div className="color-editor-prompt">
                <div className="prompt-icon">👆</div>
                <p>Select a component in the render to change its color</p>
                <p className="prompt-hint">Click on the sofa, TV unit, or any furniture piece</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accuracy Report Overlay */}
      {showAccuracyReport && renderResults && (
        <div className="accuracy-overlay">
          <div className="accuracy-panel">
            <div className="accuracy-header">
              <h3>Spatial Accuracy Report</h3>
              <button className="btn btn-tiny btn-ghost" onClick={() => setShowAccuracyReport(false)}>✕</button>
            </div>
            <div className="accuracy-content">
              {renderResults.rooms?.map((room, ri) => (
                <div key={ri} className="accuracy-room">
                  <h4>{room.roomName}</h4>
                  <div className="accuracy-checks">
                    {room.variants?.find(v => v.id === selectedVariant)?.spatialValidation?.checks?.map((check, ci) => (
                      <div key={ci} className={`accuracy-check ${check.score >= 0.7 ? 'pass' : check.score >= 0.4 ? 'warn' : 'fail'}`}>
                        <span className="check-icon">
                          {check.score >= 0.7 ? '✓' : check.score >= 0.4 ? '⚠' : '✗'}
                        </span>
                        <span className="check-name">{check.name}</span>
                        <span className="check-score">{Math.round(check.score * 100)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="accuracy-overall">
                    Overall: {room.variants?.find(v => v.id === selectedVariant)?.spatialValidation?.score || 'N/A'}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ---- Helper Functions ----

function getColorHex(colorName) {
  const colorMap = {
    'Beige': '#d4c5b2', 'Charcoal': '#2d2d2d', 'Navy Blue': '#1e4d6e',
    'Teal Green': '#008080', 'Forest Green': '#2d5a27', 'Mustard Yellow': '#d4a017',
    'Burgundy': '#8b1a1a', 'Terracotta': '#c17e3a', 'Blush Pink': '#e8c4b8',
    'Sage Green': '#a8b8a0', 'Slate Grey': '#708090', 'Cream': '#f5f0e8'
  };
  return colorMap[colorName] || '#d4c5b2';
}

function getPaletteForComponent(componentType) {
  if (componentType?.includes('SOFA') || componentType?.includes('sofa') || componentType?.includes('Sofa')) {
    return [
      { name: 'Beige', hex: '#d4c5b2' }, { name: 'Charcoal', hex: '#2d2d2d' },
      { name: 'Navy Blue', hex: '#1e4d6e' }, { name: 'Teal Green', hex: '#008080' },
      { name: 'Terracotta', hex: '#c17e3a' }, { name: 'Mustard', hex: '#d4a017' },
      { name: 'Sage Green', hex: '#a8b8a0' }, { name: 'Blush Pink', hex: '#e8c4b8' }
    ];
  }
  if (componentType?.includes('TV') || componentType?.includes('tv')) {
    return [
      { name: 'Natural Walnut', hex: '#8b6f47' }, { name: 'Pure White', hex: '#f5f5f0' },
      { name: 'Dark Walnut', hex: '#5c3a1e' }, { name: 'Warm Oak', hex: '#c4b49d' },
      { name: 'Charcoal Grey', hex: '#4a4a4a' }, { name: 'Teak Wood', hex: '#8b7a60' }
    ];
  }
  return [
    { name: 'Beige', hex: '#d4c5b2' }, { name: 'White', hex: '#f5f5f0' },
    { name: 'Grey', hex: '#808080' }, { name: 'Walnut', hex: '#8b6f47' }
  ];
}
