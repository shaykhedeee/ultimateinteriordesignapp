import React, { useState } from "react";
import { DRAWER_SYSTEMS } from "../../config/hardwareDb";

export default function CabinetForm({ onAddCabinet }) {
  const [cabinetType, setCabinetType] = useState("base"); // "base" | "wall" | "drawer" | "wardrobe"
  
  // Form configurations
  const [formData, setFormData] = useState({
    name: "Base Cabinet 01",
    width: 600,
    height: 720,
    depth: 560,
    carcassThickness: 18,
    backingThickness: 9,
    backingRecessOffset: 16,
    backingGrooveDepth: 8,
    carcassEdgeband: 0.8,
    shutterEdgeband: 2.0,
    carcassMaterial: "18mm BWR Plywood",
    backingMaterial: "9mm BWR Plywood",
    shutterMaterial: "18mm MDF / Acrylic",
    shutterType: "double", // "single" | "double" | "none" | "sliding"
    numShelves: 1,
    // Drawer specific
    drawerSystemId: "hettich_innotech",
    numDrawers: 3,
    drawerBoardMaterial: "16mm PLPB",
    // Wardrobe specific
    hasVerticalDivider: false,
    plinthHeight: 75,
    // Corner specific
    blindPanelWidth: 150,
    frontSideDepth: 560
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" 
        ? checked 
        : ["width", "height", "depth", "carcassThickness", "backingThickness", "backingRecessOffset", "backingGrooveDepth", "carcassEdgeband", "shutterEdgeband", "numShelves", "numDrawers"].includes(name)
          ? parseFloat(value) || 0
          : value
    }));
  };

  // Add standard cabinetry preset items with 1 click
  const handleAddPreset = (presetKey) => {
    const uid = `${presetKey.slice(0,2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    let presetObj = {};
    const baseFields = {
      carcassThickness: 18,
      backingThickness: 9,
      backingRecessOffset: 16,
      backingGrooveDepth: 8,
      carcassEdgeband: 0.8,
      shutterEdgeband: 2.0,
      carcassMaterial: "18mm BWR Plywood",
      backingMaterial: "9mm BWR Plywood",
      shutterMaterial: "18mm Acrylic/MDF"
    };

    switch (presetKey) {
      case "base_double":
        presetObj = {
          id: uid,
          type: "base",
          name: "Standard Base Cabinet (2 Door)",
          width: 600,
          height: 720,
          depth: 560,
          shutterType: "double",
          numShelves: 1,
          ...baseFields
        };
        break;
      case "sink_base":
        presetObj = {
          id: uid,
          type: "base",
          name: "Kitchen Sink Carcass",
          width: 800,
          height: 720,
          depth: 560,
          shutterType: "double",
          numShelves: 0,
          ...baseFields
        };
        break;
      case "hob_drawers":
        presetObj = {
          id: uid,
          type: "drawer",
          name: "Kitchen Hob Drawer Pack",
          width: 900,
          height: 720,
          depth: 560,
          drawerSystemId: "hettich_innotech",
          numDrawers: 3,
          drawersConfig: [
            { type: "shallow", heightShare: 1 },
            { type: "medium", heightShare: 1.5 },
            { type: "deep", heightShare: 2 }
          ],
          drawerBoardMaterial: "16mm PLPB",
          drawerFrontMaterial: "18mm Acrylic/MDF",
          ...baseFields
        };
        break;
      case "overhead_single":
        presetObj = {
          id: uid,
          type: "wall",
          name: "Single Overhead Cabinet",
          width: 450,
          height: 720,
          depth: 300,
          shutterType: "single",
          numShelves: 2,
          ...baseFields,
          backingThickness: 6,
          backingRecessOffset: 12,
          backingGrooveDepth: 6,
          carcassMaterial: "18mm HDMR",
          backingMaterial: "6mm HDMR"
        };
        break;
      case "sliding_wardrobe":
        presetObj = {
          id: uid,
          type: "wardrobe",
          name: "Master Sliding Wardrobe",
          width: 1500,
          height: 2100,
          depth: 600,
          shutterType: "sliding",
          numShelves: 4,
          hasVerticalDivider: true,
          plinthHeight: 75,
          ...baseFields
        };
        break;
      case "tall_pantry":
        presetObj = {
          id: uid,
          type: "wardrobe", // Tall pantry behaves structurally like a slim wardrobe carcass
          name: "Tall Kitchen Pantry Unit",
          width: 600,
          height: 2100,
          depth: 560,
          shutterType: "double",
          numShelves: 5,
          hasVerticalDivider: false,
          plinthHeight: 75,
          ...baseFields
        };
        break;
      case "blind_corner":
        presetObj = {
          id: uid,
          type: "blind_corner",
          name: "Standard Blind Corner Base",
          width: 1000,
          height: 720,
          depth: 560,
          shutterType: "single",
          numShelves: 1,
          blindPanelWidth: 150,
          ...baseFields
        };
        break;
      case "l_corner":
        presetObj = {
          id: uid,
          type: "l_corner",
          name: "Standard L-Corner Base",
          width: 900,
          height: 720,
          depth: 900,
          shutterType: "double",
          frontSideDepth: 560,
          ...baseFields
        };
        break;
      default:
        return;
    }

    onAddCabinet(presetObj);
    alert(`Preset loaded! Added standard "${presetObj.name}" to layout.`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const uid = `${cabinetType.toUpperCase().slice(0, 2)}-${Date.now().toString().slice(-4)}`;
    
    let extraParams = {};
    if (cabinetType === "drawer") {
      let drawersConfig = [];
      if (formData.numDrawers === 2) {
        drawersConfig = [
          { type: "medium", heightShare: 1 },
          { type: "deep", heightShare: 1.5 }
        ];
      } else if (formData.numDrawers === 3) {
        drawersConfig = [
          { type: "shallow", heightShare: 1 },
          { type: "medium", heightShare: 1.5 },
          { type: "deep", heightShare: 2 }
        ];
      } else {
        drawersConfig = [
          { type: "shallow", heightShare: 1 },
          { type: "shallow", heightShare: 1 },
          { type: "medium", heightShare: 1.5 },
          { type: "deep", heightShare: 2 }
        ];
      }

      extraParams = {
        drawerSystemId: formData.drawerSystemId,
        drawersConfig,
        drawerBoardMaterial: formData.drawerBoardMaterial || "16mm PLPB",
        drawerFrontMaterial: formData.shutterMaterial
      };
    } else if (cabinetType === "wardrobe") {
      extraParams = {
        hasVerticalDivider: formData.hasVerticalDivider,
        plinthHeight: formData.plinthHeight !== undefined ? formData.plinthHeight : 75
      };
    } else if (cabinetType === "blind_corner") {
      extraParams = {
        blindPanelWidth: formData.blindPanelWidth || 150
      };
    } else if (cabinetType === "l_corner") {
      extraParams = {
        frontSideDepth: formData.frontSideDepth || 560
      };
    }

    const cabinetData = {
      id: uid,
      type: cabinetType,
      ...formData,
      ...extraParams
    };

    onAddCabinet(cabinetData);

    const numMatch = formData.name.match(/\d+$/);
    if (numMatch) {
      const nextNum = parseInt(numMatch[0]) + 1;
      const baseName = formData.name.replace(/\d+$/, "");
      setFormData(prev => ({
        ...prev,
        name: `${baseName}${nextNum.toString().padStart(numMatch[0].length, "0")}`
      }));
    }
  };

  return (
    <div className="cabinet-form-container">
      {/* Visual Presets Library */}
      <div className="card presets-card">
        <div className="card-header-premium">
          <h2>📦 Modular Carcass Presets</h2>
          <p>Quick-click standard Indian carpentry templates to populate the workspace instantly</p>
        </div>
        <div className="presets-grid-row">
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("base_double")}>
            <span className="preset-icon">🗄️</span>
            <span className="preset-name">Base Unit (600)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("sink_base")}>
            <span className="preset-icon">🚰</span>
            <span className="preset-name">Sink Unit (800)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("hob_drawers")}>
            <span className="preset-icon">📊</span>
            <span className="preset-name">Hob Drawers (900)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("overhead_single")}>
            <span className="preset-icon">🗃️</span>
            <span className="preset-name">Overhead (450)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("sliding_wardrobe")}>
            <span className="preset-icon">🚪</span>
            <span className="preset-name">Sliding Wardrobe</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("tall_pantry")}>
            <span className="preset-icon">🥫</span>
            <span className="preset-name">Tall Pantry (600)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("blind_corner")}>
            <span className="preset-icon">🧩</span>
            <span className="preset-name">Blind Corner (1000)</span>
          </button>
          <button type="button" className="preset-card-btn" onClick={() => handleAddPreset("l_corner")}>
            <span className="preset-icon">📐</span>
            <span className="preset-name">L-Corner (900)</span>
          </button>
        </div>
      </div>

      <div className="card cabinet-form-card">
        <div className="card-header-premium">
          <h2>📐 Custom Cabinet Parameter Form</h2>
          <p>Build custom sizing rules for complex cabinets and partitions</p>
        </div>

        {/* Tabs */}
        <div className="tabs-container form-tabs-6">
          <button
            type="button"
            className={`tab-btn ${cabinetType === "base" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("base");
              setFormData(p => ({ ...prevFormData(p), name: "Base Cabinet 01", height: 720, depth: 560, shutterType: "double" }));
            }}
          >
            🗄️ Base
          </button>
          <button
            type="button"
            className={`tab-btn ${cabinetType === "wall" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("wall");
              setFormData(p => ({ ...prevFormData(p), name: "Wall Cabinet 01", height: 720, depth: 300, backingThickness: 6, backingRecessOffset: 12, backingGrooveDepth: 6, carcassMaterial: "18mm HDMR", backingMaterial: "6mm HDMR", shutterType: "single" }));
            }}
          >
            🗃️ Wall
          </button>
          <button
            type="button"
            className={`tab-btn ${cabinetType === "drawer" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("drawer");
              setFormData(p => ({ ...prevFormData(p), name: "Drawer Cabinet 01", height: 720, depth: 560 }));
            }}
          >
            📊 Drawer
          </button>
          <button
            type="button"
            className={`tab-btn ${cabinetType === "wardrobe" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("wardrobe");
              setFormData(p => ({ ...prevFormData(p), name: "Wardrobe Unit 01", height: 2100, width: 900, depth: 600, numShelves: 3, shutterType: "double", hasVerticalDivider: false, plinthHeight: 75 }));
            }}
          >
            🚪 Wardrobe
          </button>
          <button
            type="button"
            className={`tab-btn ${cabinetType === "blind_corner" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("blind_corner");
              setFormData(p => ({ ...prevFormData(p), name: "Blind Corner 01", height: 720, width: 1000, depth: 560, shutterType: "single", blindPanelWidth: 150 }));
            }}
          >
            🧩 Blind Corner
          </button>
          <button
            type="button"
            className={`tab-btn ${cabinetType === "l_corner" ? "active" : ""}`}
            onClick={() => {
              setCabinetType("l_corner");
              setFormData(p => ({ ...prevFormData(p), name: "L-Corner 01", height: 720, width: 900, depth: 900, shutterType: "double", frontSideDepth: 560 }));
            }}
          >
            📐 L-Corner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="premium-form">
          {/* Core Name and Sizes Grid */}
          <div className="form-group full-width">
            <label>Cabinet Label/Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Wardrobe Master"
              required
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Width (mm)</label>
              <input
                type="number"
                name="width"
                value={formData.width}
                onChange={handleChange}
                min="100"
                max="3000"
                required
            />
            </div>
            <div className="form-group">
              <label>Height (mm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="100"
                max="3000"
                required
              />
            </div>
            <div className="form-group">
              <label>Depth (mm)</label>
              <input
                type="number"
                name="depth"
                value={formData.depth}
                onChange={handleChange}
                min="100"
                max="1500"
                required
              />
            </div>
          </div>

          {/* Board Specifications */}
          <h3 className="section-divider">Materials & Joints</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Carcass Material</label>
              <select name="carcassMaterial" value={formData.carcassMaterial} onChange={handleChange}>
                <option value="18mm BWR Plywood">18mm BWR Plywood (Kitchen Ply)</option>
                <option value="18mm HDMR">18mm HDMR (Action TESA)</option>
                <option value="18mm PLPB">18mm Pre-Lam Particle Board</option>
                <option value="19mm Blockboard">19mm Blockboard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Carcass Thickness (mm)</label>
              <select name="carcassThickness" value={formData.carcassThickness} onChange={handleChange}>
                <option value="18">18 mm (Standard)</option>
                <option value="16">16 mm</option>
                <option value="15">15 mm</option>
                <option value="19">19 mm</option>
              </select>
            </div>
            <div className="form-group">
              <label>Backing Material</label>
              <select name="backingMaterial" value={formData.backingMaterial} onChange={handleChange}>
                <option value="9mm BWR Plywood">9mm BWR Plywood</option>
                <option value="6mm BWR Plywood">6mm BWR Plywood</option>
                <option value="6mm HDMR">6mm HDMR</option>
                <option value="8mm MDF">8mm MDF</option>
              </select>
            </div>
            <div className="form-group">
              <label>Backing Thickness (mm)</label>
              <select name="backingThickness" value={formData.backingThickness} onChange={handleChange}>
                <option value="9">9 mm (Rigid)</option>
                <option value="6">6 mm (Standard)</option>
                <option value="8">8 mm</option>
                <option value="12">12 mm</option>
              </select>
            </div>
          </div>

          {/* Groove adjustments */}
          <div className="form-grid-3 text-small-fields">
            <div className="form-group">
              <label>Back Recess (mm)</label>
              <input
                type="number"
                name="backingRecessOffset"
                value={formData.backingRecessOffset}
                onChange={handleChange}
                min="0"
                max="50"
              />
            </div>
            <div className="form-group">
              <label>Groove Depth (mm)</label>
              <input
                type="number"
                name="backingGrooveDepth"
                value={formData.backingGrooveDepth}
                onChange={handleChange}
                min="0"
                max="15"
              />
            </div>
            <div className="form-group">
              <label>Carcass Edgeband (mm)</label>
              <select name="carcassEdgeband" value={formData.carcassEdgeband} onChange={handleChange}>
                <option value="0.8">0.8 mm (Internal)</option>
                <option value="0.4">0.4 mm (Economy)</option>
                <option value="2">2.0 mm (Heavy)</option>
                <option value="0">None</option>
              </select>
            </div>
          </div>

          {/* Dynamic Fields based on Type */}
          {cabinetType !== "drawer" ? (
            <>
              <h3 className="section-divider">Shutters & Internals</h3>
              
              {/* Corner specific configurations */}
              {cabinetType === "blind_corner" && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Blind Panel Width (mm)</label>
                    <input
                      type="number"
                      name="blindPanelWidth"
                      value={formData.blindPanelWidth}
                      onChange={handleChange}
                      min="100"
                      max="400"
                    />
                  </div>
                  <div className="form-group">
                    <label>Shutter Type</label>
                    <select name="shutterType" value={formData.shutterType} onChange={handleChange}>
                      <option value="single">Single Shutter Door</option>
                      <option value="none">Open Carcass (No Door)</option>
                    </select>
                  </div>
                </div>
              )}

              {cabinetType === "l_corner" && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Adjacent Cabinet Depth (mm)</label>
                    <input
                      type="number"
                      name="frontSideDepth"
                      value={formData.frontSideDepth}
                      onChange={handleChange}
                      min="300"
                      max="800"
                    />
                  </div>
                  <div className="form-group">
                    <label>Shutter Type</label>
                    <select name="shutterType" value={formData.shutterType} onChange={handleChange}>
                      <option value="double">Bi-fold Twin Shutters</option>
                      <option value="none">Open Carcass (No Door)</option>
                    </select>
                  </div>
                </div>
              )}

              {cabinetType !== "blind_corner" && cabinetType !== "l_corner" && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Shutter Type</label>
                    <select name="shutterType" value={formData.shutterType} onChange={handleChange}>
                      <option value="double">Double Door Shutter</option>
                      <option value="single">Single Door Shutter</option>
                      {cabinetType === "wardrobe" && <option value="sliding">Sliding Doors (2 overlapping)</option>}
                      <option value="none">Open Carcass (No Door)</option>
                    </select>
                  </div>
                  {formData.shutterType !== "none" && (
                    <div className="form-group">
                      <label>Shutter Material</label>
                      <select name="shutterMaterial" value={formData.shutterMaterial} onChange={handleChange}>
                        <option value="18mm Acrylic/MDF">18mm Acrylic MDF</option>
                        <option value="18mm Laminate/Ply">18mm Laminate Plywood</option>
                        <option value="18mm PU Lacquer">18mm PU Lacquered MDF</option>
                        {cabinetType === "wardrobe" && <option value="25mm Sliding Frame">25mm Alum sliding frame</option>}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Shutter Material for Corner Cabinets */}
              {(cabinetType === "blind_corner" || cabinetType === "l_corner") && formData.shutterType !== "none" && (
                <div className="form-group">
                  <label>Shutter Material</label>
                  <select name="shutterMaterial" value={formData.shutterMaterial} onChange={handleChange}>
                    <option value="18mm Acrylic/MDF">18mm Acrylic MDF</option>
                    <option value="18mm Laminate/Ply">18mm Laminate Plywood</option>
                    <option value="18mm PU Lacquer">18mm PU Lacquered MDF</option>
                  </select>
                </div>
              )}

              <div className="form-grid-2">
                {formData.shutterType !== "none" && cabinetType !== "blind_corner" && cabinetType !== "l_corner" && (
                  <div className="form-group">
                    <label>Shutter Edgeband (mm)</label>
                    <select name="shutterEdgeband" value={formData.shutterEdgeband} onChange={handleChange}>
                      <option value="2">2.0 mm (Premium Smooth)</option>
                      <option value="1.2">1.2 mm</option>
                      <option value="0.8">0.8 mm (Standard)</option>
                    </select>
                  </div>
                )}
                {/* Always show edgeband input for corner shutters if doors active */}
                {formData.shutterType !== "none" && (cabinetType === "blind_corner" || cabinetType === "l_corner") && (
                  <div className="form-group">
                    <label>Shutter Edgeband (mm)</label>
                    <select name="shutterEdgeband" value={formData.shutterEdgeband} onChange={handleChange}>
                      <option value="2">2.0 mm (Premium Smooth)</option>
                      <option value="1.2">1.2 mm</option>
                      <option value="0.8">0.8 mm (Standard)</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Adjustable Shelves</label>
                  <input
                    type="number"
                    name="numShelves"
                    value={formData.numShelves}
                    onChange={handleChange}
                    min="0"
                    max="15"
                  />
                </div>
              </div>

              {cabinetType === "wardrobe" && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Skirting / Plinth Height (mm)</label>
                    <select name="plinthHeight" value={formData.plinthHeight} onChange={handleChange}>
                      <option value="0">No Skirting (Direct legs)</option>
                      <option value="75">75 mm (Standard)</option>
                      <option value="100">100 mm (High Skirting)</option>
                      <option value="150">150 mm</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group-wrapper" style={{ justifyContent: "center" }}>
                    <label className="custom-checkbox-label" style={{ marginTop: "1.2rem" }}>
                      <input
                        type="checkbox"
                        name="hasVerticalDivider"
                        checked={formData.hasVerticalDivider}
                        onChange={handleChange}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-text-span">Vertical Partition</span>
                    </label>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="section-divider">Drawer Hardware Specs</h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Drawer Runner System</label>
                  <select name="drawerSystemId" value={formData.drawerSystemId} onChange={handleChange}>
                    {DRAWER_SYSTEMS.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.brand} - {system.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Drawers</label>
                  <select name="numDrawers" value={formData.numDrawers} onChange={handleChange}>
                    <option value="2">2 Drawers (Medium / Deep)</option>
                    <option value="3">3 Drawers (Shallow / Med / Deep)</option>
                    <option value="4">4 Drawers (2 Shallow / Med / Deep)</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Drawer Front Material</label>
                  <select name="shutterMaterial" value={formData.shutterMaterial} onChange={handleChange}>
                    <option value="18mm Acrylic/MDF">18mm Acrylic MDF</option>
                    <option value="18mm Laminate/Ply">18mm Laminate Plywood</option>
                    <option value="18mm PU Lacquer">18mm PU Lacquered MDF</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Drawer Box Material</label>
                  <select name="drawerBoardMaterial" value={formData.drawerBoardMaterial} onChange={handleChange}>
                    <option value="16mm PLPB">16mm PLPB (Standard)</option>
                    <option value="16mm BWR Plywood">16mm BWR Plywood</option>
                    <option value="18mm BWR Plywood">18mm BWR Plywood</option>
                    <option value="18mm HDMR">18mm HDMR</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full-width">
            ✨ Add Cabinet & Generate Cutlist
          </button>
        </form>
      </div>
    </div>
  );
}

// Reset fields helper
function prevFormData(p) {
  return {
    carcassThickness: p.carcassThickness,
    backingThickness: p.backingThickness,
    backingRecessOffset: p.backingRecessOffset,
    backingGrooveDepth: p.backingGrooveDepth,
    carcassEdgeband: p.carcassEdgeband,
    shutterEdgeband: p.shutterEdgeband,
    carcassMaterial: p.carcassMaterial,
    backingMaterial: p.backingMaterial,
    shutterMaterial: p.shutterMaterial,
    shutterType: p.shutterType,
    numShelves: p.numShelves,
    drawerSystemId: p.drawerSystemId,
    numDrawers: p.numDrawers,
    hasVerticalDivider: p.hasVerticalDivider || false,
    plinthHeight: p.plinthHeight || 75,
    blindPanelWidth: p.blindPanelWidth || 150,
    frontSideDepth: p.frontSideDepth || 560,
    drawerBoardMaterial: p.drawerBoardMaterial || "16mm PLPB"
  };
}
