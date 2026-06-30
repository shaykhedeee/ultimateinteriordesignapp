import React, { useState } from "react";
import {
  calculateBaseCabinet,
  calculateWallCabinet,
  calculateDrawerCabinet,
  calculateWardrobe,
  calculateBlindCornerBase,
  calculateLCornerBase
} from "../../utils/cabinetMath";

export default function PartListTable({ cabinets, onDeleteCabinet, nestingResult }) {
  // Board pricing state in Indian Rupees (INR)
  const [boardPrices, setBoardPrices] = useState({
    "18mm BWR Plywood": 4200,
    "18mm HDMR": 2800,
    "18mm PLPB": 2200,
    "9mm BWR Plywood": 2400,
    "6mm HDMR": 1400,
    "19mm Blockboard": 4500
  });

  // 1. Expand all cabinets into individual panels
  const allParts = [];
  
  cabinets.forEach((cab) => {
    let parts = [];
    if (cab.type === "base") {
      parts = calculateBaseCabinet(cab);
    } else if (cab.type === "wall") {
      parts = calculateWallCabinet(cab);
    } else if (cab.type === "drawer") {
      parts = calculateDrawerCabinet(cab);
    } else if (cab.type === "wardrobe") {
      parts = calculateWardrobe(cab);
    } else if (cab.type === "blind_corner") {
      parts = calculateBlindCornerBase(cab);
    } else if (cab.type === "l_corner") {
      parts = calculateLCornerBase(cab);
    } else if (cab.type === "custom") {
      parts = cab.customParts || [];
    }
    
    parts.forEach(p => {
      p.cabinetName = cab.name;
      p.cabinetId = cab.id;
    });
    
    allParts.push(...parts);
  });

  // 2. Group statistics by Material & compute cost metrics
  const materialStats = {};
  allParts.forEach((part) => {
    const mat = part.material;
    const areaSqM = (part.rawHeight * part.rawWidth * part.qty) / 1000000;
    
    if (!materialStats[mat]) {
      materialStats[mat] = { area: 0, count: 0 };
    }
    materialStats[mat].area += areaSqM;
    materialStats[mat].count += part.qty;
  });

  // Calculate live pricing metrics based on exact live nested sheets
  let totalCost = 0;
  let totalWastedCost = 0;

  Object.entries(materialStats).forEach(([mat, stat]) => {
    const materialSheets = nestingResult?.nestedSheets?.filter(s => s.material === mat) || [];
    const sheets = materialSheets.length;
    const pricePerSheet = boardPrices[mat] || 3000;
    const matCost = sheets * pricePerSheet;
    totalCost += matCost;

    const netUsedArea = stat.area;
    const totalProvidedArea = sheets * 2.9768;
    const wastedRatio = totalProvidedArea > 0 ? (totalProvidedArea - netUsedArea) / totalProvidedArea : 0;
    totalWastedCost += matCost * wastedRatio;
  });

  const handlePriceChange = (mat, val) => {
    setBoardPrices(prev => ({
      ...prev,
      [mat]: parseInt(val) || 0
    }));
  };

  // Client-side CSV spreadsheet generator (no backend needed, fully offline)
  const handleExportCSV = () => {
    if (allParts.length === 0) {
      alert("No parts to export. Please add cabinets first!");
      return;
    }

    // Dynamic CSV string header
    let csvContent = "\ufeff"; // Byte Order Mark to ensure Excel handles UTF-8 correctly (e.g. Indian Rupee symbols)
    csvContent += "Part Code,Cabinet Owner,Panel Label,Qty,Finished Height (mm),Finished Width (mm),Raw Height (mm),Raw Width (mm),Edgebanding,Material,Woodgrain\n";

    // Loop rows
    allParts.forEach((part) => {
      const row = [
        part.partId,
        `"${part.cabinetName.replace(/"/g, '""')}"`,
        `"${part.name.replace(/"/g, '""')}"`,
        part.qty,
        part.finHeight,
        part.finWidth,
        part.rawHeight,
        part.rawWidth,
        `"${part.edgeband.replace(/"/g, '""')}"`,
        `"${part.material.replace(/"/g, '""')}"`,
        part.grain.toUpperCase()
      ].join(",");
      csvContent += row + "\n";
    });

    // Create anchor and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cutlist_Pro_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOptimizationTips = () => {
    if (!nestingResult || !nestingResult.nestedSheets || nestingResult.nestedSheets.length === 0) return [];
    
    const sheetsByMaterial = {};
    nestingResult.nestedSheets.forEach((sheet, idx) => {
      if (!sheetsByMaterial[sheet.material]) {
        sheetsByMaterial[sheet.material] = [];
      }
      sheetsByMaterial[sheet.material].push({ sheet, index: idx + 1 });
    });
    
    const tips = [];
    
    Object.entries(sheetsByMaterial).forEach(([material, sheetList]) => {
      const numSheets = sheetList.length;
      if (numSheets <= 1) return; // Only advise on overflow sheets (more than 1 sheet)
      
      const lastSheetObj = sheetList[numSheets - 1];
      const lastSheet = lastSheetObj.sheet;
      const lastSheetNum = lastSheetObj.index;
      
      if (lastSheet.efficiency < 45 && lastSheet.placedParts.length > 0) {
        const price = boardPrices[material] || 3000;
        const placedCount = lastSheet.placedParts.length;
        const partNames = Array.from(new Set(lastSheet.placedParts.map(p => `${p.cabinetName} (${p.partId})`)));
        
        const totalPartArea = lastSheet.placedParts.reduce((acc, p) => acc + (p.w * p.h), 0) / 1000000;
        
        tips.push({
          type: "warning",
          material,
          savings: price,
          message: `Sheet #${lastSheetNum} of ${material} is only ${lastSheet.efficiency}% utilized, carrying just ${placedCount} panel(s): ${partNames.join(", ")}.`,
          recommendation: `Reduce the size of these cabinets slightly, adjust filler panels, or reduce shelf quantities by a total of ${totalPartArea.toFixed(2)} m² of material to fit all panels onto the previous ${numSheets - 1} sheet(s) instead of ${numSheets}, saving ₹${price.toLocaleString("en-IN")} INR.`
        });
      }
    });
    
    return tips;
  };

  const tips = generateOptimizationTips();

  return (
    <div className="parts-container">
      {/* Sizing & Pricing Dashboard */}
      <div className="summary-grid-3">
        <div className="card summary-card gradient-blue">
          <h3>Total Materials Cost</h3>
          <p className="summary-stat">₹{totalCost.toLocaleString("en-IN")} <span className="unit">INR</span></p>
          <span className="summary-card-sub no-print">Based on sheet counts</span>
        </div>
        <div className="card summary-card gradient-red-glow">
          <h3>Wasted Plywood Cost</h3>
          <p className="summary-stat">₹{Math.round(totalWastedCost).toLocaleString("en-IN")} <span className="unit">INR</span></p>
          <span className="summary-card-sub highlight-orange text-bold">
            {totalCost > 0 ? ((totalWastedCost / totalCost) * 100).toFixed(0) : 0}% Sheet Waste Value
          </span>
        </div>
        <div className="card summary-card gradient-yellow">
          <h3>Estimated Sheet Stock</h3>
          <div className="material-est-list">
            {Object.keys(materialStats).length === 0 ? (
              <span className="no-data-msg">Add cabinets to compute</span>
            ) : (
              Object.entries(materialStats).map(([mat, stat]) => {
                const materialSheets = nestingResult?.nestedSheets?.filter(s => s.material === mat) || [];
                const sheets = materialSheets.length;
                return (
                  <div key={mat} className="material-stat-row">
                    <span className="material-stat-name">{mat}:</span>
                    <strong className="material-stat-val">
                      {sheets} {sheets === 1 ? "Sheet" : "Sheets"} ({stat.area.toFixed(1)} m²)
                    </strong>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Smart Optimization Advisor */}
      {tips.length > 0 && (
        <div className="card advisor-card no-print" style={{ borderLeft: "5px solid var(--accent-color, #fbbf24)", marginTop: "1rem" }}>
          <div className="card-header-premium" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "1rem 1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#fef08a", margin: 0 }}>💡 Smart Material Optimization Advisor</h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0 0" }}>Algorithmic insights suggesting minor cabinetry modifications to eliminate high-wastage overflow sheets</p>
          </div>
          <div className="advisor-tips-list" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {tips.map((tip, idx) => (
              <div key={idx} className="advisor-tip-item" style={{
                background: "rgba(30, 41, 59, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fbbf24" }}>
                    ⚠️ Potential Savings: ₹{tip.savings.toLocaleString("en-IN")} INR on {tip.material}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#cbd5e1", lineHeight: "1.5" }}>
                  {tip.message}
                </p>
                <div style={{
                  background: "rgba(251, 191, 36, 0.08)",
                  borderLeft: "3px solid #fbbf24",
                  padding: "0.6rem 0.9rem",
                  borderRadius: "0 4px 4px 0",
                  fontSize: "0.825rem",
                  color: "#fef08a",
                  lineHeight: "1.4",
                  marginTop: "0.25rem"
                }}>
                  <strong>Recommendation:</strong> {tip.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sizing & Board Stock Price Editor */}
      {Object.keys(materialStats).length > 0 && (
        <div className="card price-editor-card no-print">
          <div className="card-header-simple">
            <h3>💲 Board Stock Rate Manager (Per Sheet)</h3>
          </div>
          <div className="price-inputs-grid">
            {Object.keys(materialStats).map(mat => (
              <div key={mat} className="price-input-row">
                <span className="price-mat-name">{mat}:</span>
                <div className="price-input-flex">
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="100"
                    value={boardPrices[mat] || 3000}
                    onChange={(e) => handlePriceChange(mat, e.target.value)}
                    className="price-slider"
                  />
                  <input
                    type="number"
                    value={boardPrices[mat] || 3000}
                    onChange={(e) => handlePriceChange(mat, e.target.value)}
                    className="price-num-input"
                  />
                  <span className="price-rupee-label">/ sheet</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cabinets Quick List */}
      <div className="card cabinets-list-card">
        <div className="card-header-simple">
          <h3>Active Layout Cabinets ({cabinets.length})</h3>
        </div>
        {cabinets.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>No cabinets added yet. Use the presets above or form panels to add cabinets.</p>
          </div>
        ) : (
          <div className="cabinet-chips-grid">
            {cabinets.map((cab) => (
              <div key={cab.id} className={`cabinet-chip type-${cab.type}`}>
                <div className="chip-details">
                  <span className="chip-code">{cab.id}</span>
                  <span className="chip-name">{cab.name}</span>
                  {cab.width > 0 && (
                    <span className="chip-dim">{cab.width}x{cab.height}x{cab.depth}mm</span>
                  )}
                  <span className="chip-type">({cab.type.toUpperCase()})</span>
                </div>
                <button
                  type="button"
                  className="chip-delete-btn"
                  onClick={() => onDeleteCabinet(cab.id)}
                  title="Remove Cabinet"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core Cutting Sheet Table */}
      <div className="card table-card">
        <div className="card-header-premium flex-header">
          <div>
            <h2>Cutting Part List</h2>
            <p>Calculated finished sizes vs raw cutting dimensions (0.8mm front carcass edgeband auto-deducted)</p>
          </div>
          {allParts.length > 0 && (
            <div className="table-actions-row no-print">
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary text-small-btn"
                title="Download CSV for Microsoft Excel"
              >
                📊 Export CSV (Excel)
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary text-small-btn"
                title="Print Cutlist"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          )}
        </div>

        <div className="table-responsive">
          <table className="parts-table">
            <thead>
              <tr>
                <th>Part Code</th>
                <th>Cabinet Owner</th>
                <th>Panel Label</th>
                <th>Qty</th>
                <th>Finished Size (mm)</th>
                <th>Edgeband Rule</th>
                <th className="highlight-column">Raw Cut Size (mm)</th>
                <th>Woodgrain</th>
              </tr>
            </thead>
            <tbody>
              {allParts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">
                    No panels calculated. Preload a cabinet template to view the cutting list.
                  </td>
                </tr>
              ) : (
                allParts.map((part) => (
                  <tr key={part.partId}>
                    <td className="font-mono text-bold">{part.partId}</td>
                    <td className="text-secondary">{part.cabinetName}</td>
                    <td className="part-label">{part.name}</td>
                    <td className="text-bold">{part.qty}</td>
                    <td className="font-mono">
                      {part.finHeight} × {part.finWidth}
                    </td>
                    <td>
                      <span className={`eb-badge ${part.edgeband !== "None" ? "active" : ""}`}>
                        {part.edgeband}
                      </span>
                    </td>
                    <td className="font-mono text-bold highlight-column">
                      {part.rawHeight} × {part.rawWidth}
                    </td>
                    <td>
                      <span className={`grain-badge ${part.grain}`}>
                        {part.grain.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
