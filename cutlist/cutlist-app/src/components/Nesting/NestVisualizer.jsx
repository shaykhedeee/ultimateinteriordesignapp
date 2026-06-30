import React from "react";

export default function NestVisualizer({ 
  parts, 
  nestingResult, 
  bladeKerf, 
  setBladeKerf, 
  trimMargin, 
  setTrimMargin, 
  nestingMode, 
  setNestingMode 
}) {

  // Color generator for panel categories to make maps visually premium
  const getPartColor = (partId) => {
    if (partId.includes("SIDE")) return "rgba(37, 99, 235, 0.12)"; // Blue for sides
    if (partId.includes("BOTTOM")) return "rgba(16, 185, 129, 0.12)"; // Green for bottom
    if (partId.includes("SHUTTER") || partId.includes("FRONT") || partId.includes("DOOR")) return "rgba(245, 158, 11, 0.12)"; // Amber for shutters
    if (partId.includes("BACK")) return "rgba(139, 92, 246, 0.12)"; // Purple for backing
    return "rgba(107, 114, 128, 0.12)"; // Slate for rails/shelves
  };

  const getPartBorder = (partId) => {
    if (partId.includes("SIDE")) return "#3b82f6";
    if (partId.includes("BOTTOM")) return "#10b981";
    if (partId.includes("SHUTTER") || partId.includes("FRONT") || partId.includes("DOOR")) return "#f59e0b";
    if (partId.includes("BACK")) return "#8b5cf6";
    return "#94a3b8";
  };

  return (
    <div className="card nesting-visualizer-card">
      <div className="card-header-premium flex-header-nest">
        <div>
          <h2>⚡ Global 2D Panel Nesting Maps ({nestingMode === "cnc" ? "CNC Router" : "Guillotine"})</h2>
          <p>
            {nestingMode === "cnc" 
              ? "Ultra-high efficiency nested layouts optimized for automated CNC routing (8x4 ft sheets - wastage < 5%)"
              : "Guillotine-aligned layouts optimized for manual sliding table saw cutting (8x4 ft sheets)"}
          </p>
        </div>
        
        {/* Controls */}
        <div className="nest-controls no-print">
          <div className="control-item-inline">
            <label>Nesting Mode</label>
            <select
              value={nestingMode}
              onChange={(e) => setNestingMode(e.target.value)}
              className="small-select-input"
            >
              <option value="cnc">CNC Router (MaxRects - Recommended)</option>
              <option value="guillotine">Panel Saw (Guillotine)</option>
            </select>
          </div>
          <div className="control-item-inline">
            <label>Saw Kerf (mm)</label>
            <input
              type="number"
              value={bladeKerf}
              onChange={(e) => setBladeKerf(parseFloat(e.target.value) || 0)}
              min="0"
              max="10"
              className="small-num-input"
            />
          </div>
          <div className="control-item-inline">
            <label>Trim Margin (mm)</label>
            <input
              type="number"
              value={trimMargin}
              onChange={(e) => setTrimMargin(parseFloat(e.target.value) || 0)}
              min="0"
              max="50"
              className="small-num-input"
            />
          </div>
        </div>
      </div>

      {parts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No panels available for nesting. Add modular cabinets to compute layouts.</p>
        </div>
      ) : (
        <div className="nesting-workspace">
          {/* Summary */}
          <div className="nest-stats-bar">
            <span>Total Sheets Required: <strong>{nestingResult.nestedSheets.length} Sheets</strong></span>
            {nestingResult.unplacedParts.length > 0 && (
              <span className="error-badge">
                ⚠️ {nestingResult.unplacedParts.length} Panels exceed standard sheet size!
              </span>
            )}
          </div>

          {/* Sheets Layouts Grid */}
          <div className="sheets-layouts-container">
            {nestingResult.nestedSheets.map((sheet, index) => {
              const scale = 0.25; 
              const canvasW = 2440 * scale;
              const canvasH = 1220 * scale;

              return (
                <div key={sheet.sheetId} className="nest-sheet-block">
                  <div className="sheet-meta-bar">
                    <span className="sheet-index-label">Sheet #{index + 1} ({sheet.material})</span>
                    <span className="sheet-efficiency-badge">{sheet.efficiency}% Space Utilized</span>
                  </div>

                  <div className="canvas-wrapper-outer">
                    <div className="canvas-container" style={{ width: canvasW + "px", height: canvasH + "px" }}>
                      {/* Standard Board Frame */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 2440 1220"
                        className="nest-sheet-svg"
                      >
                        {/* 1. Main Sheet Boundary */}
                        <rect x="0" y="0" width="2440" height="1220" fill="#0f172a" stroke="#475569" strokeWidth="4" />
                        
                        {/* 2. Trim Boundary lines */}
                        <rect
                          x={trimMargin}
                          y={trimMargin}
                          width={2440 - (2 * trimMargin)}
                          height={1220 - (2 * trimMargin)}
                          fill="none"
                          stroke="rgba(239, 68, 68, 0.4)"
                          strokeWidth="2"
                          strokeDasharray="6,4"
                        />

                        {/* 3. Placed parts */}
                        {sheet.placedParts.map((placed) => (
                          <g key={placed.uniqueId} className="nest-placed-part-group">
                            <rect
                              x={placed.x}
                              y={placed.y}
                              width={placed.w}
                              height={placed.h}
                              fill={getPartColor(placed.partId)}
                              stroke={getPartBorder(placed.partId)}
                              strokeWidth="3"
                            />
                            {/* Part Text label details */}
                            {placed.w > 180 && placed.h > 80 ? (
                              <foreignObject
                                x={placed.x + 8}
                                y={placed.y + 8}
                                width={placed.w - 16}
                                height={placed.h - 16}
                              >
                                <div className="svg-html-label" style={{ color: getPartBorder(placed.partId) }}>
                                  <div className="svg-label-cabinet">{placed.cabinetName}</div>
                                  <div className="svg-label-code">{placed.partId}</div>
                                  <div className="svg-label-name">{placed.name}</div>
                                  <div className="svg-label-dim font-mono">{placed.rawHeight} × {placed.rawWidth} mm</div>
                                </div>
                              </foreignObject>
                            ) : (
                              /* Small label fallback for thin panels */
                              <text
                                x={placed.x + 8}
                                y={placed.y + 30}
                                fill={getPartBorder(placed.partId)}
                                fontSize="26"
                                fontWeight="bold"
                                fontFamily="sans-serif"
                              >
                                {placed.partId} ({placed.rawHeight}x{placed.rawWidth})
                              </text>
                            )}
                          </g>
                        ))}

                        {/* 4. Draw Trim margin labels */}
                        <text x="20" y="45" fill="rgba(239, 68, 68, 0.7)" fontSize="24" fontFamily="monospace">
                          {trimMargin}mm trim border
                        </text>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Placed Parts List for this sheet */}
                  <div className="sheet-parts-index no-print">
                    <span className="index-title">Mixed Cut Sequence (Sorted by efficiency):</span>
                    <div className="index-badges-row">
                      {sheet.placedParts.map((placed, pidx) => (
                        <span key={placed.uniqueId} className="sheet-part-index-chip" style={{ borderLeft: `4px solid ${getPartBorder(placed.partId)}` }}>
                          <strong>{pidx + 1}.</strong> <span className="highlight-text-cabinet">{placed.cabinetName}</span> — {placed.partId} ({placed.rawHeight}x{placed.rawWidth}) {placed.rotated ? "🔄" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
