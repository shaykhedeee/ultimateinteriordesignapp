import React, { useState } from "react";

export default function QuickImport({ onAddCabinet }) {
  const [importMode, setImportMode] = useState("shorthand"); // "shorthand" | "ai"
  const [importText, setImportText] = useState("");
  const [aiText, setAiText] = useState("");
  const [defaultMaterial, setDefaultMaterial] = useState("18mm BWR Plywood");
  const [parsedPreview, setParsedPreview] = useState([]);
  
  // AI Entity Extraction Preview State
  const [aiPreview, setAiPreview] = useState(null);

  // 1. Shorthand & CSV Parser
  const handleParseShorthand = () => {
    if (!importText.trim()) {
      setParsedPreview([]);
      return;
    }

    const lines = importText.split("\n");
    const parsed = [];

    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Format A: Shorthand regex (e.g. '720x560x2 Left Side')
      const shorthandRegex = /^(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)(?:\s+(.+))?$/;
      const shorthandMatch = cleanLine.match(shorthandRegex);

      if (shorthandMatch) {
        const height = parseInt(shorthandMatch[1]);
        const width = parseInt(shorthandMatch[2]);
        const qty = parseInt(shorthandMatch[3]);
        const label = shorthandMatch[4] ? shorthandMatch[4].trim() : `Carcass Panel ${idx + 1}`;
        
        parsed.push({
          partId: `PANEL-${Date.now().toString().slice(-3)}-${idx + 1}`,
          name: label,
          qty,
          finHeight: height,
          finWidth: width,
          rawHeight: height,
          rawWidth: width,
          material: defaultMaterial,
          edgeband: "None",
          grain: "none",
          lineNum: idx + 1,
          status: "valid"
        });
        return;
      }

      // Format B: CSV format (Name, Qty, Height, Width)
      const csvParts = cleanLine.split(",").map(p => p.trim());
      if (csvParts.length >= 4) {
        const name = csvParts[0];
        const qty = parseInt(csvParts[1]);
        const height = parseInt(csvParts[2]);
        const width = parseInt(csvParts[3]);
        const mat = csvParts[4] || defaultMaterial;

        if (!isNaN(qty) && !isNaN(height) && !isNaN(width)) {
          parsed.push({
            partId: `PANEL-${Date.now().toString().slice(-3)}-${idx + 1}`,
            name: name,
            qty,
            finHeight: height,
            finWidth: width,
            rawHeight: height,
            rawWidth: width,
            material: mat,
            edgeband: "None",
            grain: "none",
            lineNum: idx + 1,
            status: "valid"
          });
          return;
        }
      }

      parsed.push({
        lineNum: idx + 1,
        text: cleanLine,
        status: "error",
        error: "Invalid format. Use '720x560x2 Sides' or 'Sides, 2, 720, 560'."
      });
    });

    setParsedPreview(parsed);
  };

  const handleImportShorthand = () => {
    const validPanels = parsedPreview.filter(p => p.status === "valid");
    if (validPanels.length === 0) {
      alert("No valid panels parsed.");
      return;
    }

    const customCabinet = {
      id: `CST-${Date.now().toString().slice(-4)}`,
      type: "custom",
      name: "Bulk Paste List",
      width: 0,
      height: 0,
      depth: 0,
      customParts: validPanels.map(p => ({
        partId: p.partId,
        name: p.name,
        qty: p.qty,
        material: p.material,
        finHeight: p.finHeight,
        finWidth: p.finWidth,
        rawHeight: p.rawHeight,
        rawWidth: p.rawWidth,
        edgeband: p.edgeband,
        grain: p.grain
      }))
    };

    onAddCabinet(customCabinet);
    setImportText("");
    setParsedPreview([]);
    alert(`Imported ${validPanels.length} custom panels successfully!`);
  };

  // 2. Natural Language AI Text Parser
  const handleParseNaturalLanguage = () => {
    if (!aiText.trim()) {
      setAiPreview(null);
      return;
    }

    const clean = aiText.toLowerCase();
    
    // Default initializations
    let type = "base";
    let width = 600;
    let height = 720;
    let depth = 560;
    let name = "Plain-Text Carcass";
    let shutterType = "double";
    let numShelves = 1;
    let carcassMaterial = "18mm BWR Plywood";
    let backingMaterial = "9mm BWR Plywood";
    let hasVerticalDivider = false;

    // A. Archetype classification
    if (clean.includes("wardrobe") || clean.includes("almirah") || clean.includes("closet") || clean.includes("cupboard")) {
      type = "wardrobe";
      height = 2100;
      width = 900;
      depth = 600;
      name = "Wardrobe (Text Scanned)";
      shutterType = "double";
      numShelves = 3;
    } else if (clean.includes("overhead") || clean.includes("wall cabinet") || clean.includes("wall unit") || clean.includes("hanging")) {
      type = "wall";
      height = 720;
      width = 600;
      depth = 300;
      name = "Overhead Cabinet (Text Scanned)";
      shutterType = "single";
      carcassMaterial = "18mm HDMR";
      backingMaterial = "6mm HDMR";
    } else if (clean.includes("drawer") || clean.includes("drawers") || clean.includes("tandem")) {
      type = "drawer";
      height = 720;
      width = 600;
      depth = 560;
      name = "Drawer Carcass (Text Scanned)";
    } else if (clean.includes("sink")) {
      type = "base";
      name = "Sink Cabinet (Text Scanned)";
      shutterType = "double";
    } else if (clean.includes("hob") || clean.includes("stove")) {
      type = "base";
      name = "Hob Cabinet (Text Scanned)";
      shutterType = "double";
    }

    // B. Sizing extraction (mm sizes)
    const widthMatches = clean.match(/(\d+)\s*(?:mm|millimeter)?\s*(?:wide|width|w)\b/) || clean.match(/(?:wide|width|w)\s*(?:of|is)?\s*(\d+)/);
    if (widthMatches) width = parseInt(widthMatches[1]);

    const heightMatches = clean.match(/(\d+)\s*(?:mm|millimeter)?\s*(?:tall|height|h|high)\b/) || clean.match(/(?:tall|height|h|high)\s*(?:of|is)?\s*(\d+)/);
    if (heightMatches) height = parseInt(heightMatches[1]);

    const depthMatches = clean.match(/(\d+)\s*(?:mm|millimeter)?\s*(?:deep|depth|d)\b/) || clean.match(/(?:deep|depth|d)\s*(?:of|is)?\s*(\d+)/);
    if (depthMatches) depth = parseInt(depthMatches[1]);

    // C. Shutter Closure overrides
    if (clean.includes("sliding")) {
      shutterType = "sliding";
    } else if (clean.includes("single") || clean.includes("one door")) {
      shutterType = "single";
    } else if (clean.includes("double") || clean.includes("two door") || clean.includes("twin door")) {
      shutterType = "double";
    } else if (clean.includes("no door") || clean.includes("open") || clean.includes("no shutter")) {
      shutterType = "none";
    }

    // D. divider logic
    if (clean.includes("vertical divider") || clean.includes("center partition") || clean.includes("double bay") || clean.includes("split partition")) {
      hasVerticalDivider = true;
    }

    // E. Shelves count
    const shelfMatches = clean.match(/(\d+)\s*(?:shelf|shelves)/);
    if (shelfMatches) numShelves = parseInt(shelfMatches[1]);

    // F. Material selection
    if (clean.includes("hdmr") || clean.includes("action tesa")) {
      carcassMaterial = "18mm HDMR";
      backingMaterial = "6mm HDMR";
    } else if (clean.includes("particle") || clean.includes("prelam") || clean.includes("pb") || clean.includes("pre-lam")) {
      carcassMaterial = "18mm PLPB";
      backingMaterial = "8mm MDF";
    } else if (clean.includes("plywood") || clean.includes("marine") || clean.includes("bwr") || clean.includes("bwp")) {
      carcassMaterial = "18mm BWR Plywood";
      backingMaterial = "9mm BWR Plywood";
    }

    setAiPreview({
      type,
      name,
      width,
      height,
      depth,
      shutterType,
      numShelves,
      carcassThickness: 18,
      backingThickness: type === "wall" ? 6 : 9,
      backingRecessOffset: type === "wall" ? 12 : 16,
      backingGrooveDepth: type === "wall" ? 6 : 8,
      carcassEdgeband: 0.8,
      shutterEdgeband: 2.0,
      carcassMaterial,
      backingMaterial,
      shutterMaterial: "18mm Acrylic/MDF",
      hasVerticalDivider,
      drawerSystemId: "hettich_innotech",
      numDrawers: 3
    });
  };

  const handleImportAiCabinet = () => {
    if (!aiPreview) return;
    
    // Bundle and inject standard wardrobe settings if applicable
    let extraParams = {};
    if (aiPreview.type === "drawer") {
      extraParams = {
        drawerSystemId: "hettich_innotech",
        drawersConfig: [
          { type: "shallow", heightShare: 1 },
          { type: "medium", heightShare: 1.5 },
          { type: "deep", heightShare: 2 }
        ],
        drawerBoardMaterial: "16mm PLPB",
        drawerFrontMaterial: "18mm Acrylic/MDF"
      };
    } else if (aiPreview.type === "wardrobe") {
      extraParams = {
        hasVerticalDivider: aiPreview.hasVerticalDivider
      };
    }

    const cabinetData = {
      id: `${aiPreview.type.toUpperCase().slice(0,2)}-${Date.now().toString().slice(-4)}`,
      ...aiPreview,
      ...extraParams
    };

    onAddCabinet(cabinetData);
    setAiText("");
    setAiPreview(null);
    alert(`Successfully parsed & imported: "${cabinetData.name}" (${cabinetData.width}x${cabinetData.height}x${cabinetData.depth}mm)`);
  };

  return (
    <div className="card quick-import-card">
      {/* Dynamic Tabs */}
      <div className="card-header-premium flex-header-import">
        <div>
          <h2>🚀 Smart Multi-Input Panel</h2>
          <p>Import bulk sheets from spreadsheets or write in plain conversational text</p>
        </div>
      </div>
      
      <div className="tabs-container form-tabs-4">
        <button
          type="button"
          className={`tab-btn ${importMode === "shorthand" ? "active" : ""}`}
          onClick={() => {
            setImportMode("shorthand");
            setParsedPreview([]);
          }}
        >
          📋 Copy-Paste List
        </button>
        <button
          type="button"
          className={`tab-btn ${importMode === "ai" ? "active" : ""}`}
          onClick={() => {
            setImportMode("ai");
            setAiPreview(null);
          }}
        >
          💬 Explain in Plain Text
        </button>
      </div>

      <div className="premium-form">
        {importMode === "shorthand" ? (
          /* SECTION A: SHORTHAND / EXCEL IMPORTER */
          <>
            <div className="form-group">
              <label>Default Panel Material</label>
              <select value={defaultMaterial} onChange={(e) => setDefaultMaterial(e.target.value)}>
                <option value="18mm BWR Plywood">18mm BWR Plywood</option>
                <option value="18mm HDMR">18mm HDMR</option>
                <option value="18mm PLPB">18mm Pre-Lam Particle Board</option>
                <option value="9mm BWR Plywood">9mm Backing Plywood</option>
              </select>
            </div>

            <div className="form-group">
              <label>Paste Spreadsheet Cells</label>
              <div className="import-formats-hints">
                <span>💡 <strong>WhatsApp Style:</strong> <code>720x560x2 L Side</code> (H x W x Qty Name)</span>
                <span>💡 <strong>Excel Cells:</strong> <code>Shelf Panel, 4, 564, 280</code> (Name, Qty, H, W)</span>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows="5"
                placeholder="720x560x2 Carcass Side&#10;564x535x1 Bottom Panel&#10;Adjustable Shelf, 4, 564, 280"
                className="premium-textarea font-mono text-small-input"
              />
            </div>

            <div className="form-grid-2 import-btn-row">
              <button type="button" className="btn btn-secondary" onClick={handleParseShorthand}>
                🔍 Parse List
              </button>
              {parsedPreview.some(p => p.status === "valid") && (
                <button type="button" className="btn btn-primary" onClick={handleImportShorthand}>
                  ⚡ Load Panels
                </button>
              )}
            </div>

            {/* Parsing Previews */}
            {parsedPreview.length > 0 && (
              <div className="import-preview-box">
                <h4>Parsed Panel Listing</h4>
                <div className="preview-list">
                  {parsedPreview.map((item, idx) => (
                    <div key={idx} className={`preview-item ${item.status}`}>
                      {item.status === "valid" ? (
                        <div className="preview-valid-details">
                          <span className="p-badge valid">✔</span>
                          <strong>L{item.lineNum}:</strong> {item.name} — <span className="font-mono">{item.qty} Pcs ({item.finHeight}x{item.finWidth}mm)</span>
                        </div>
                      ) : (
                        <div className="preview-error-details">
                          <span className="p-badge error">✕</span>
                          <strong>L{item.lineNum}:</strong> <span className="error-text">{item.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* SECTION B: PLAIN TEXT AI PARSER */
          <>
            <div className="form-group">
              <label>Explain what you want to build</label>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows="5"
                placeholder="e.g. Add a modular sliding wardrobe, 1500mm wide, 2100mm tall, 600mm deep, using 18mm prelam board, with 4 shelves and a vertical center partition."
                className="premium-textarea text-small-input"
              />
            </div>

            <div className="form-grid-2 import-btn-row">
              <button type="button" className="btn btn-secondary" onClick={handleParseNaturalLanguage}>
                🧠 Smart Scan
              </button>
              {aiPreview && (
                <button type="button" className="btn btn-primary" onClick={handleImportAiCabinet}>
                  ⚡ Add Cabinet
                </button>
              )}
            </div>

            {/* AI Entity Preview Card */}
            {aiPreview && (
              <div className="import-preview-box ai-card-preview">
                <h4>Extracted Architecture Details</h4>
                <div className="ai-extracted-specs">
                  <div className="spec-item-row">
                    <span>Carcass Category:</span>
                    <strong className="text-highlight">{aiPreview.type.toUpperCase()} UNIT</strong>
                  </div>
                  <div className="spec-item-row">
                    <span>Outer Dimensions:</span>
                    <strong>{aiPreview.width} W × {aiPreview.height} H × {aiPreview.depth} D (mm)</strong>
                  </div>
                  <div className="spec-item-row">
                    <span>Material:</span>
                    <span>{aiPreview.carcassMaterial}</span>
                  </div>
                  <div className="spec-item-row">
                    <span>Closure Style:</span>
                    <span>{aiPreview.shutterType.toUpperCase()} SHUTTER</span>
                  </div>
                  <div className="spec-item-row">
                    <span>Adjustable Shelves:</span>
                    <span>{aiPreview.numShelves} Levels</span>
                  </div>
                  {aiPreview.type === "wardrobe" && (
                    <div className="spec-item-row">
                      <span>Internal Partition:</span>
                      <span>{aiPreview.hasVerticalDivider ? "Yes (Center Divider)" : "No"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
