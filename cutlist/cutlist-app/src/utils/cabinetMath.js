import { DRAWER_SYSTEMS } from "../config/hardwareDb";

/**
 * Calculates raw and finished part sizes for a Standard Base Cabinet.
 * Optimization: Carcass bottoms, top rails, internal shelves, and backing panels 
 * are hidden inside the cabinet, so their grain direction is set to "none" 
 * to allow the nesting optimizer to rotate them for maximum board yield.
 * Shutters are highly visible and remain locked to "vertical" grain.
 */
export function calculateBaseCabinet({
  id = "B01",
  name = "Base Cabinet",
  width,
  height,
  depth,
  carcassThickness = 18,
  backingThickness = 9,
  backingRecessOffset = 16,
  backingGrooveDepth = 8,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  shutterType = "double", // "single" | "double" | "none"
  numShelves = 1,
  carcassMaterial = "18mm BWR Plywood",
  backingMaterial = "9mm BWR Plywood",
  shutterMaterial = "18mm MDF"
}) {
  const parts = [];
  
  // 1. Left & Right Sides (2 Nos.)
  // Side panels can be exposed at the end of modular runs, so they are vertical by default
  const sideFinHeight = height;
  const sideFinDepth = depth;
  const sideRawHeight = sideFinHeight;
  const sideRawDepth = sideFinDepth - carcassEdgeband;
  
  parts.push({
    partId: `${id}-L-SIDE`,
    name: "Left Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });
  
  parts.push({
    partId: `${id}-R-SIDE`,
    name: "Right Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  // 2. Bottom Panel (1 No.)
  // Optimization: Internal bottom, grain set to "none" for rotation
  const bottomFinWidth = width - (2 * carcassThickness);
  const bottomFinDepth = depth - backingRecessOffset - backingThickness;
  const bottomRawWidth = bottomFinWidth;
  const bottomRawDepth = bottomFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-BOTTOM`,
    name: "Bottom Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: bottomFinWidth,
    finWidth: bottomFinDepth,
    rawHeight: bottomRawWidth,
    rawWidth: bottomRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // 3. Top Rails / Stretchers (2 Nos. - Front & Back)
  // Optimization: Hidden under stone slab, set to "none" grain
  const railFinLength = width - (2 * carcassThickness);
  const railWidth = 100;
  
  parts.push({
    partId: `${id}-T-RAIL-F`,
    name: "Top Rail Front",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  parts.push({
    partId: `${id}-T-RAIL-B`,
    name: "Top Rail Back",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth,
    edgeband: "None",
    grain: "none"
  });

  // 4. Backing Panel (1 No.)
  // Optimization: Hidden at the back, set to "none" grain
  const backFinWidth = width - (2 * carcassThickness) + (2 * backingGrooveDepth);
  const backFinHeight = height - carcassThickness + backingGrooveDepth;
  
  parts.push({
    partId: `${id}-BACK`,
    name: "Backing Panel",
    qty: 1,
    material: backingMaterial,
    finHeight: backFinHeight,
    finWidth: backFinWidth,
    rawHeight: backFinHeight,
    rawWidth: backFinWidth,
    edgeband: "None",
    grain: "none"
  });

  // 5. Adjustable Shelves
  // Optimization: Inside cabinet, set to "none" grain
  if (numShelves > 0) {
    const shelfFinWidth = width - (2 * carcassThickness) - 2;
    const shelfFinDepth = depth - backingRecessOffset - backingThickness - 20;
    const shelfRawWidth = shelfFinWidth;
    const shelfRawDepth = shelfFinDepth - carcassEdgeband;
    
    parts.push({
      partId: `${id}-SHELF`,
      name: "Adjustable Shelf",
      qty: numShelves,
      material: carcassMaterial,
      finHeight: shelfFinWidth,
      finWidth: shelfFinDepth,
      rawHeight: shelfRawWidth,
      rawWidth: shelfRawDepth,
      edgeband: `1L (${carcassEdgeband}mm)`,
      grain: "none"
    });
  }

  // 6. Shutters (Doors)
  // Highly visible facade, strictly locked to vertical grain
  if (shutterType !== "none") {
    const shutterFinHeight = height - 3;
    let shutterFinWidth = 0;
    
    if (shutterType === "single") {
      shutterFinWidth = width - 3;
      
      parts.push({
        partId: `${id}-SHUTTER`,
        name: "Single Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    } else if (shutterType === "double") {
      shutterFinWidth = (width - 6) / 2;
      
      parts.push({
        partId: `${id}-SHUTTER-L`,
        name: "Left Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
      
      parts.push({
        partId: `${id}-SHUTTER-R`,
        name: "Right Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    }
  }

  return parts;
}

/**
 * Calculates raw and finished part sizes for an Overhead Wall Cabinet.
 * Optimization: Top, bottom, internal shelves, and backing are grain: "none" for rotation.
 * Shutters are strictly vertical.
 */
export function calculateWallCabinet({
  id = "W01",
  name = "Wall Cabinet",
  width,
  height,
  depth,
  carcassThickness = 18,
  backingThickness = 6,
  backingRecessOffset = 12,
  backingGrooveDepth = 6,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  shutterType = "single", // "single" | "double" | "none"
  numShelves = 1,
  carcassMaterial = "18mm HDMR",
  backingMaterial = "6mm HDMR",
  shutterMaterial = "18mm Acrylic/MDF"
}) {
  const parts = [];

  // Left & Right Sides (2 Nos.)
  const sideFinHeight = height;
  const sideFinDepth = depth;
  const sideRawHeight = sideFinHeight;
  const sideRawDepth = sideFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-L-SIDE`,
    name: "Left Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  parts.push({
    partId: `${id}-R-SIDE`,
    name: "Right Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  // Top & Bottom Panels (2 Nos. - grain: "none")
  const topBottomFinWidth = width - (2 * carcassThickness);
  const topBottomFinDepth = depth - backingRecessOffset - backingThickness;
  const topBottomRawWidth = topBottomFinWidth;
  const topBottomRawDepth = topBottomFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-TOP`,
    name: "Top Solid Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: topBottomFinWidth,
    finWidth: topBottomFinDepth,
    rawHeight: topBottomRawWidth,
    rawWidth: topBottomRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  parts.push({
    partId: `${id}-BOTTOM`,
    name: "Bottom Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: topBottomFinWidth,
    finWidth: topBottomFinDepth,
    rawHeight: topBottomRawWidth,
    rawWidth: topBottomRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // Backing Panel (1 No. - grain: "none")
  const backFinWidth = width - (2 * carcassThickness) + (2 * backingGrooveDepth);
  const backFinHeight = height - (2 * carcassThickness) + (2 * backingGrooveDepth);

  parts.push({
    partId: `${id}-BACK`,
    name: "Backing Panel",
    qty: 1,
    material: backingMaterial,
    finHeight: backFinHeight,
    finWidth: backFinWidth,
    rawHeight: backFinHeight,
    rawWidth: backFinWidth,
    edgeband: "None",
    grain: "none"
  });

  // Adjustable Shelves (grain: "none")
  if (numShelves > 0) {
    const shelfFinWidth = width - (2 * carcassThickness) - 2;
    const shelfFinDepth = depth - backingRecessOffset - backingThickness - 20;
    const shelfRawWidth = shelfFinWidth;
    const shelfRawDepth = shelfFinDepth - carcassEdgeband;

    parts.push({
      partId: `${id}-SHELF`,
      name: "Adjustable Shelf",
      qty: numShelves,
      material: carcassMaterial,
      finHeight: shelfFinWidth,
      finWidth: shelfFinDepth,
      rawHeight: shelfRawWidth,
      rawWidth: shelfRawDepth,
      edgeband: `1L (${carcassEdgeband}mm)`,
      grain: "none"
    });
  }

  // Shutters (Locked to vertical grain)
  if (shutterType !== "none") {
    const shutterFinHeight = height - 3;
    let shutterFinWidth = 0;

    if (shutterType === "single") {
      shutterFinWidth = width - 3;
      parts.push({
        partId: `${id}-SHUTTER`,
        name: "Single Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    } else if (shutterType === "double") {
      shutterFinWidth = (width - 6) / 2;
      parts.push({
        partId: `${id}-SHUTTER-L`,
        name: "Left Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
      parts.push({
        partId: `${id}-SHUTTER-R`,
        name: "Right Shutter",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    }
  }

  return parts;
}

/**
 * Calculates raw and finished part sizes for a modular Drawer Pack Cabinet.
 * Optimization: Drawer bottom plates and back panels are grain: "none" for rotation.
 */
export function calculateDrawerCabinet({
  id = "D01",
  name = "Drawer Cabinet",
  width,
  height,
  depth,
  carcassThickness = 18,
  backingThickness = 9,
  backingRecessOffset = 16,
  backingGrooveDepth = 8,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  carcassMaterial = "18mm BWR Plywood",
  backingMaterial = "9mm BWR Plywood",
  drawerBoardMaterial = "16mm PLPB",
  drawerFrontMaterial = "18mm Acrylic/MDF",
  drawerSystemId = "hettich_innotech",
  drawersConfig = [
    { type: "shallow", heightShare: 1 },
    { type: "medium", heightShare: 1.5 },
    { type: "deep", heightShare: 2 }
  ]
}) {
  const parts = calculateBaseCabinet({
    id,
    name,
    width,
    height,
    depth,
    carcassThickness,
    backingThickness,
    backingRecessOffset,
    backingGrooveDepth,
    carcassEdgeband,
    shutterEdgeband,
    shutterType: "none",
    numShelves: 0,
    carcassMaterial,
    backingMaterial
  });

  const internalWidth = width - (2 * carcassThickness);
  const runner = DRAWER_SYSTEMS.find(d => d.id === drawerSystemId) || DRAWER_SYSTEMS[0];

  const totalShares = drawersConfig.reduce((acc, curr) => acc + curr.heightShare, 0);
  const totalClearanceGaps = (drawersConfig.length + 1) * 3;
  const availableFrontHeight = height - totalClearanceGaps;
  
  let currentYOffset = 3;

  drawersConfig.forEach((drawer, idx) => {
    const frontFinHeight = Math.round((drawer.heightShare / totalShares) * availableFrontHeight);
    const frontFinWidth = width - 3;
    
    parts.push({
      partId: `${id}-FRONT-${idx + 1}`,
      name: `Drawer Front ${idx + 1} (${drawer.type.toUpperCase()})`,
      qty: 1,
      material: drawerFrontMaterial,
      finHeight: frontFinHeight,
      finWidth: frontFinWidth,
      rawHeight: frontFinHeight - (2 * shutterEdgeband),
      rawWidth: frontFinWidth - (2 * shutterEdgeband),
      edgeband: `4E (${shutterEdgeband}mm)`,
      grain: "vertical"
    });

    if (runner.type === "tandem") {
      const bottomFinWidth = runner.bottomWidthFormula(internalWidth);
      const runnerLength = depth >= 550 ? 500 : (depth >= 500 ? 450 : 400);
      const bottomFinDepth = runner.bottomDepthFormula(runnerLength);
      
      parts.push({
        partId: `${id}-DR-BOTTOM-${idx + 1}`,
        name: `Drawer ${idx + 1} Bottom Plate`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: bottomFinWidth,
        finWidth: bottomFinDepth,
        rawHeight: bottomFinWidth,
        rawWidth: bottomFinDepth,
        edgeband: "None",
        grain: "none"
      });

      const backFinWidth = runner.backWidthFormula(internalWidth);
      const backFinHeight = runner.backHeightPresets[drawer.type] || 144;
      
      parts.push({
        partId: `${id}-DR-BACK-${idx + 1}`,
        name: `Drawer ${idx + 1} Back Panel`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: backFinHeight,
        finWidth: backFinWidth,
        rawHeight: backFinHeight - carcassEdgeband,
        rawWidth: backFinWidth,
        edgeband: `1L (${carcassEdgeband}mm)`,
        grain: "none"
      });

    } else {
      const boxThickness = 15;
      const boxSideHeight = drawer.type === "shallow" ? 90 : (drawer.type === "medium" ? 140 : 200);
      const boxFinDepth = depth - 20;
      
      parts.push({
        partId: `${id}-DR-SIDE-${idx + 1}-L`,
        name: `Drawer ${idx + 1} Box Left Side`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: boxSideHeight,
        finWidth: boxFinDepth,
        rawHeight: boxSideHeight - carcassEdgeband,
        rawWidth: boxFinDepth,
        edgeband: `1L (${carcassEdgeband}mm)`,
        grain: "none"
      });

      parts.push({
        partId: `${id}-DR-SIDE-${idx + 1}-R`,
        name: `Drawer ${idx + 1} Box Right Side`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: boxSideHeight,
        finWidth: boxFinDepth,
        rawHeight: boxSideHeight - carcassEdgeband,
        rawWidth: boxFinDepth,
        edgeband: `1L (${carcassEdgeband}mm)`,
        grain: "none"
      });

      const innerFinWidth = internalWidth - runner.widthDeduction - (2 * boxThickness);
      
      parts.push({
        partId: `${id}-DR-BOX-F-${idx + 1}`,
        name: `Drawer ${idx + 1} Box Inner Front`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: boxSideHeight,
        finWidth: innerFinWidth,
        rawHeight: boxSideHeight - carcassEdgeband,
        rawWidth: innerFinWidth,
        edgeband: `1L (${carcassEdgeband}mm)`,
        grain: "none"
      });

      parts.push({
        partId: `${id}-DR-BOX-B-${idx + 1}`,
        name: `Drawer ${idx + 1} Box Inner Back`,
        qty: 1,
        material: drawerBoardMaterial,
        finHeight: boxSideHeight,
        finWidth: innerFinWidth,
        rawHeight: boxSideHeight - carcassEdgeband,
        rawWidth: innerFinWidth,
        edgeband: `1L (${carcassEdgeband}mm)`,
        grain: "none"
      });

      const drBottomWidth = internalWidth - runner.widthDeduction - 4;
      const drBottomDepth = boxFinDepth - 4;
      
      parts.push({
        partId: `${id}-DR-BOTTOM-${idx + 1}`,
        name: `Drawer ${idx + 1} Bottom Plate (Telescopic)`,
        qty: 1,
        material: backingMaterial,
        finHeight: drBottomWidth,
        finWidth: drBottomDepth,
        rawHeight: drBottomWidth,
        rawWidth: drBottomDepth,
        edgeband: "None",
        grain: "none"
      });
    }

    currentYOffset += frontFinHeight + 3;
  });

  return parts;
}

/**
 * Calculates raw and finished part sizes for a modular Wardrobe Carcass.
 * Optimization: Top, bottom, fixed center tie dividers, backing, dividers, 
 * and internal shelves are set to grain: "none" for nesting rotation.
 * Front sliding/hinged doors are strictly vertical.
 */
export function calculateWardrobe({
  id = "WD01",
  name = "Wardrobe Unit",
  width,
  height,
  depth,
  carcassThickness = 18,
  backingThickness = 9,
  backingRecessOffset = 16,
  backingGrooveDepth = 8,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  shutterType = "double", // "single" | "double" | "none" | "sliding"
  numShelves = 3,
  carcassMaterial = "18mm BWR Plywood",
  backingMaterial = "9mm BWR Plywood",
  shutterMaterial = "18mm MDF / Acrylic",
  hasVerticalDivider = false,
  plinthHeight = 75 // Exposing plinth skirting height (default: 75mm)
}) {
  const parts = [];

  // Left & Right Sides (2 Nos. - exposed exterior walls, vertical grain)
  const sideFinHeight = height;
  const sideFinDepth = depth;
  const sideRawHeight = sideFinHeight;
  const sideRawDepth = sideFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-L-SIDE`,
    name: "Wardrobe Left Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  parts.push({
    partId: `${id}-R-SIDE`,
    name: "Wardrobe Right Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideRawHeight,
    rawWidth: sideRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  // Top & Bottom Solid Panels (grain: "none")
  const topBottomFinWidth = width - (2 * carcassThickness);
  const topBottomFinDepth = depth - backingRecessOffset - backingThickness;
  const topBottomRawWidth = topBottomFinWidth;
  const topBottomRawDepth = topBottomFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-TOP`,
    name: "Wardrobe Top Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: topBottomFinWidth,
    finWidth: topBottomFinDepth,
    rawHeight: topBottomRawWidth,
    rawWidth: topBottomRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  parts.push({
    partId: `${id}-BOTTOM`,
    name: "Wardrobe Bottom Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: topBottomFinWidth,
    finWidth: topBottomFinDepth,
    rawHeight: topBottomRawWidth,
    rawWidth: topBottomRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // Middle Fixed Horizontal Divider (grain: "none")
  const midDividerFinWidth = width - (2 * carcassThickness);
  const midDividerFinDepth = depth - backingRecessOffset - backingThickness - 10;
  const midDividerRawWidth = midDividerFinWidth;
  const midDividerRawDepth = midDividerFinDepth - carcassEdgeband;

  parts.push({
    partId: `${id}-MID-DIV-H`,
    name: "Structural Tie Shelf (Fixed)",
    qty: 1,
    material: carcassMaterial,
    finHeight: midDividerFinWidth,
    finWidth: midDividerFinDepth,
    rawHeight: midDividerRawWidth,
    rawWidth: midDividerRawDepth,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // Backing Panel: stops at bottom panel if there is skirting, saving material
  const backFinHeight = height - plinthHeight - (2 * carcassThickness) + (2 * backingGrooveDepth);
  const totalBackWidth = width - (2 * carcassThickness) + (2 * backingGrooveDepth);

  if (hasVerticalDivider) {
    const singleBackFinWidth = Math.round((width - (2 * carcassThickness) - carcassThickness) / 2) + (2 * backingGrooveDepth);
    parts.push({
      partId: `${id}-BACK-1`,
      name: "Backing Panel Left Bay",
      qty: 1,
      material: backingMaterial,
      finHeight: backFinHeight,
      finWidth: singleBackFinWidth,
      rawHeight: backFinHeight,
      rawWidth: singleBackFinWidth,
      edgeband: "None",
      grain: "none"
    });
    parts.push({
      partId: `${id}-BACK-2`,
      name: "Backing Panel Right Bay",
      qty: 1,
      material: backingMaterial,
      finHeight: backFinHeight,
      finWidth: singleBackFinWidth,
      rawHeight: backFinHeight,
      rawWidth: singleBackFinWidth,
      edgeband: "None",
      grain: "none"
    });
  } else if (totalBackWidth > 1200) {
    const halfBackFinWidth = Math.round(totalBackWidth / 2);
    parts.push({
      partId: `${id}-BACK-1`,
      name: "Backing Panel (Split 1/2)",
      qty: 1,
      material: backingMaterial,
      finHeight: backFinHeight,
      finWidth: halfBackFinWidth,
      rawHeight: backFinHeight,
      rawWidth: halfBackFinWidth,
      edgeband: "None",
      grain: "none"
    });
    parts.push({
      partId: `${id}-BACK-2`,
      name: "Backing Panel (Split 2/2)",
      qty: 1,
      material: backingMaterial,
      finHeight: backFinHeight,
      finWidth: halfBackFinWidth,
      rawHeight: backFinHeight,
      rawWidth: halfBackFinWidth,
      edgeband: "None",
      grain: "none"
    });
  } else {
    parts.push({
      partId: `${id}-BACK`,
      name: "Backing Panel",
      qty: 1,
      material: backingMaterial,
      finHeight: backFinHeight,
      finWidth: totalBackWidth,
      rawHeight: backFinHeight,
      rawWidth: totalBackWidth,
      edgeband: "None",
      grain: "none"
    });
  }

  // Vertical partition divider depth: reduced by 100mm if sliding doors to clear tracks
  let activeInternalWidth = width - (2 * carcassThickness);
  const dividerDepthOffset = shutterType === "sliding" ? 100 : 20;
  
  if (hasVerticalDivider) {
    const vertDividerFinHeight = Math.round((height - plinthHeight - (3 * carcassThickness)) / 2);
    const vertDividerFinDepth = depth - backingRecessOffset - backingThickness - dividerDepthOffset;
    
    parts.push({
      partId: `${id}-VERT-DIV`,
      name: "Vertical Internal Partition",
      qty: 1,
      material: carcassMaterial,
      finHeight: vertDividerFinHeight,
      finWidth: vertDividerFinDepth,
      rawHeight: vertDividerFinHeight,
      rawWidth: vertDividerFinDepth - carcassEdgeband,
      edgeband: `1L (${carcassEdgeband}mm)`,
      grain: "none"
    });

    activeInternalWidth = Math.round((activeInternalWidth - carcassThickness) / 2);
  }

  // Adjustable Shelves depth: reduced by 100mm if sliding doors to clear tracks
  const shelfDepthOffset = shutterType === "sliding" ? 100 : 25;
  if (numShelves > 0) {
    const shelfFinWidth = activeInternalWidth - 2;
    const shelfFinDepth = depth - backingRecessOffset - backingThickness - shelfDepthOffset;
    
    parts.push({
      partId: `${id}-SHELF`,
      name: hasVerticalDivider ? "Adjustable Half-Shelf" : "Adjustable Full-Shelf",
      qty: numShelves,
      material: carcassMaterial,
      finHeight: shelfFinWidth,
      finWidth: shelfFinDepth,
      rawHeight: shelfFinWidth,
      rawWidth: shelfFinDepth - carcassEdgeband,
      edgeband: `1L (${carcassEdgeband}mm)`,
      grain: "none"
    });
  }

  // Wardrobe Skirting (Plinth) Base Generation underneath Bottom Panel
  if (plinthHeight > 0) {
    const plinthLength = width - (2 * carcassThickness);
    
    parts.push({
      partId: `${id}-PLINTH-F`,
      name: "Skirting Board Front",
      qty: 1,
      material: carcassMaterial,
      finHeight: plinthHeight,
      finWidth: plinthLength,
      rawHeight: plinthHeight,
      rawWidth: plinthLength,
      edgeband: "None",
      grain: "none"
    });

    parts.push({
      partId: `${id}-PLINTH-B`,
      name: "Skirting Board Back",
      qty: 1,
      material: carcassMaterial,
      finHeight: plinthHeight,
      finWidth: plinthLength,
      rawHeight: plinthHeight,
      rawWidth: plinthLength,
      edgeband: "None",
      grain: "none"
    });

    // Skirting supports (prevent sagging)
    const plinthSupportDepth = depth - backingRecessOffset - backingThickness - 60;
    parts.push({
      partId: `${id}-PLINTH-SUP-L`,
      name: "Skirting Left Support",
      qty: 1,
      material: carcassMaterial,
      finHeight: plinthHeight,
      finWidth: plinthSupportDepth,
      rawHeight: plinthHeight,
      rawWidth: plinthSupportDepth,
      edgeband: "None",
      grain: "none"
    });

    parts.push({
      partId: `${id}-PLINTH-SUP-R`,
      name: "Skirting Right Support",
      qty: 1,
      material: carcassMaterial,
      finHeight: plinthHeight,
      finWidth: plinthSupportDepth,
      rawHeight: plinthHeight,
      rawWidth: plinthSupportDepth,
      edgeband: "None",
      grain: "none"
    });
  }

  // Shutters (Doors)
  // For hinged doors, the doors stop above the plinth, exposing it.
  // For sliding doors, the track mounts at the very top and bottom, covering the plinth.
  if (shutterType !== "none") {
    const isSliding = shutterType === "sliding";
    const shutterFinHeight = height - (isSliding ? 0 : plinthHeight) - 4;
    
    if (shutterType === "single") {
      const shutterFinWidth = width - 4;
      parts.push({
        partId: `${id}-SHUTTER`,
        name: "Single Wardrobe Door",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    } else if (shutterType === "double") {
      const shutterFinWidth = (width - 6) / 2;
      parts.push({
        partId: `${id}-SHUTTER-L`,
        name: "Wardrobe Left Door",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
      parts.push({
        partId: `${id}-SHUTTER-R`,
        name: "Wardrobe Right Door",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    } else if (shutterType === "sliding") {
      const shutterFinWidth = Math.round((width + 50) / 2);
      
      parts.push({
        partId: `${id}-SLIDE-DOOR-1`,
        name: "Sliding Front Shutter 1",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });

      parts.push({
        partId: `${id}-SLIDE-DOOR-2`,
        name: "Sliding Rear Shutter 2",
        qty: 1,
        material: shutterMaterial,
        finHeight: shutterFinHeight,
        finWidth: shutterFinWidth,
        rawHeight: shutterFinHeight - (2 * shutterEdgeband),
        rawWidth: shutterFinWidth - (2 * shutterEdgeband),
        edgeband: `4E (${shutterEdgeband}mm)`,
        grain: "vertical"
      });
    }
  }

  return parts;
}

/**
 * Calculates raw and finished part sizes for a Blind Corner Base Cabinet.
 * Standard butt-joint construction. Features a front blind panel filler
 * and recessed spacers.
 */
export function calculateBlindCornerBase({
  id = "BC01",
  name = "Blind Corner Base Unit",
  width = 1000,
  height = 720,
  depth = 560,
  carcassThickness = 18,
  backingThickness = 9,
  backingRecessOffset = 16,
  backingGrooveDepth = 8,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  shutterType = "single", // "single" | "none"
  carcassMaterial = "18mm BWR Plywood",
  backingMaterial = "9mm BWR Plywood",
  shutterMaterial = "18mm MDF / Acrylic",
  blindPanelWidth = 150
}) {
  const parts = [];

  // Left & Right Sides (2 Nos.)
  const sideFinHeight = height;
  const sideFinDepth = depth;
  
  parts.push({
    partId: `${id}-L-SIDE`,
    name: "Left Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideFinHeight,
    rawWidth: sideFinDepth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  parts.push({
    partId: `${id}-R-SIDE`,
    name: "Right Side Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: sideFinHeight,
    finWidth: sideFinDepth,
    rawHeight: sideFinHeight,
    rawWidth: sideFinDepth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  // Bottom Panel (1 No.)
  const bottomFinWidth = width - (2 * carcassThickness);
  const bottomFinDepth = depth - backingRecessOffset - backingThickness;

  parts.push({
    partId: `${id}-BOTTOM`,
    name: "Bottom Panel",
    qty: 1,
    material: carcassMaterial,
    finHeight: bottomFinWidth,
    finWidth: bottomFinDepth,
    rawHeight: bottomFinWidth,
    rawWidth: bottomFinDepth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // Top Rails (2 Nos.)
  const railFinLength = width - (2 * carcassThickness);
  const railWidth = 100;

  parts.push({
    partId: `${id}-T-RAIL-F`,
    name: "Top Rail Front",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  parts.push({
    partId: `${id}-T-RAIL-B`,
    name: "Top Rail Back",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth,
    edgeband: "None",
    grain: "none"
  });

  // Backing Panel (1 No.)
  const backFinWidth = width - (2 * carcassThickness) + (2 * backingGrooveDepth);
  const backFinHeight = height - carcassThickness + backingGrooveDepth;

  parts.push({
    partId: `${id}-BACK`,
    name: "Backing Panel",
    qty: 1,
    material: backingMaterial,
    finHeight: backFinHeight,
    finWidth: backFinWidth,
    rawHeight: backFinHeight,
    rawWidth: backFinWidth,
    edgeband: "None",
    grain: "none"
  });

  // Front Blind Panel (Filler Panel) - Highly visible on front face
  const blindFinHeight = height - carcassThickness;
  const blindFinWidth = blindPanelWidth;

  parts.push({
    partId: `${id}-BLIND-PANEL`,
    name: "Blind Panel (Front Filler)",
    qty: 1,
    material: shutterMaterial, // Typically matches the shutter material/finish!
    finHeight: blindFinHeight,
    finWidth: blindFinWidth,
    rawHeight: blindFinHeight - (2 * shutterEdgeband),
    rawWidth: blindFinWidth - (2 * shutterEdgeband),
    edgeband: `4E (${shutterEdgeband}mm)`,
    grain: "vertical"
  });

  // Hinge post spacer board (recessed inside behind blind panel to mount corner hinges)
  const spacerFinHeight = height - carcassThickness;
  const spacerFinWidth = 100;

  parts.push({
    partId: `${id}-HINGE-SPACER`,
    name: "Internal Spacer Board",
    qty: 1,
    material: carcassMaterial,
    finHeight: spacerFinHeight,
    finWidth: spacerFinWidth,
    rawHeight: spacerFinHeight,
    rawWidth: spacerFinWidth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // Single Shutter door (only covers the non-blind opening)
  if (shutterType !== "none") {
    const shutterFinHeight = height - 3;
    const shutterFinWidth = width - blindPanelWidth - 6; // 3mm clearances on both sides

    parts.push({
      partId: `${id}-SHUTTER`,
      name: "Blind Corner Shutter",
      qty: 1,
      material: shutterMaterial,
      finHeight: shutterFinHeight,
      finWidth: shutterFinWidth,
      rawHeight: shutterFinHeight - (2 * shutterEdgeband),
      rawWidth: shutterFinWidth - (2 * shutterEdgeband),
      edgeband: `4E (${shutterEdgeband}mm)`,
      grain: "vertical"
    });
  }

  return parts;
}

/**
 * Calculates raw and finished part sizes for an L-Shaped Corner Base Cabinet (typically 900x900).
 * Nested bottom panel is returned as a full square to represent material stock required,
 * since the $90^\circ$ cutout is performed on-site/shop-floor.
 */
export function calculateLCornerBase({
  id = "LC01",
  name = "L-Shape Corner Base Unit",
  width = 900,
  height = 720,
  depth = 900, // typically symmetric depth = width
  carcassThickness = 18,
  backingThickness = 9,
  backingRecessOffset = 16,
  backingGrooveDepth = 8,
  carcassEdgeband = 0.8,
  shutterEdgeband = 2.0,
  shutterType = "double", // "double" (bi-fold doors) | "none"
  carcassMaterial = "18mm BWR Plywood",
  backingMaterial = "9mm BWR Plywood",
  shutterMaterial = "18mm MDF / Acrylic",
  frontSideDepth = 560 // depth of adjacent modular runs (typically 560mm)
}) {
  const parts = [];

  // L-corner has:
  // 1. Left Back Side Panel: H x (width - carcassThickness)
  // 2. Right Back Side Panel: H x (depth - carcassThickness)
  // These join in a butt-joint in the corner.
  const backSideDepth = width - carcassThickness;
  
  parts.push({
    partId: `${id}-L-BACK-SIDE`,
    name: "Left Corner Back Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: height,
    finWidth: backSideDepth,
    rawHeight: height,
    rawWidth: backSideDepth,
    edgeband: "None",
    grain: "vertical"
  });

  parts.push({
    partId: `${id}-R-BACK-SIDE`,
    name: "Right Corner Back Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: height,
    finWidth: backSideDepth,
    rawHeight: height,
    rawWidth: backSideDepth,
    edgeband: "None",
    grain: "vertical"
  });

  // 3. Left Front Side Panel: H x frontSideDepth
  // 4. Right Front Side Panel: H x frontSideDepth
  // These connect to the adjacent modular cabinets.
  parts.push({
    partId: `${id}-L-FRONT-SIDE`,
    name: "Left Front Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: height,
    finWidth: frontSideDepth,
    rawHeight: height,
    rawWidth: frontSideDepth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  parts.push({
    partId: `${id}-R-FRONT-SIDE`,
    name: "Right Front Side",
    qty: 1,
    material: carcassMaterial,
    finHeight: height,
    finWidth: frontSideDepth,
    rawHeight: height,
    rawWidth: frontSideDepth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "vertical"
  });

  // 5. Bottom Panel (L-shape): Nested as a square for material stock allocation
  parts.push({
    partId: `${id}-BOTTOM-CORNER`,
    name: "Corner Bottom Panel (Square Stock)",
    qty: 1,
    material: carcassMaterial,
    finHeight: width,
    finWidth: depth,
    rawHeight: width,
    rawWidth: depth,
    edgeband: "None", // carpenters edgeband the L-shape cutout faces manually
    grain: "none"
  });

  // 6. Top Rails (2 Nos. - Left and Right front-to-back connectors)
  const railFinLength = width - carcassThickness - frontSideDepth;
  const railWidth = 100;

  parts.push({
    partId: `${id}-T-RAIL-L`,
    name: "Corner Left Top Rail",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  parts.push({
    partId: `${id}-T-RAIL-R`,
    name: "Corner Right Top Rail",
    qty: 1,
    material: carcassMaterial,
    finHeight: railFinLength,
    finWidth: railWidth,
    rawHeight: railFinLength,
    rawWidth: railWidth - carcassEdgeband,
    edgeband: `1L (${carcassEdgeband}mm)`,
    grain: "none"
  });

  // 7. Backing Panels: 2 separate panels that meet in the corner
  const backPanelHeight = height - carcassThickness + backingGrooveDepth;
  const backPanelWidth = width - carcassThickness;

  parts.push({
    partId: `${id}-BACK-L`,
    name: "Corner Backing Left",
    qty: 1,
    material: backingMaterial,
    finHeight: backPanelHeight,
    finWidth: backPanelWidth,
    rawHeight: backPanelHeight,
    rawWidth: backPanelWidth,
    edgeband: "None",
    grain: "none"
  });

  parts.push({
    partId: `${id}-BACK-R`,
    name: "Corner Backing Right",
    qty: 1,
    material: backingMaterial,
    finHeight: backPanelHeight,
    finWidth: backPanelWidth,
    rawHeight: backPanelHeight,
    rawWidth: backPanelWidth,
    edgeband: "None",
    grain: "none"
  });

  // 8. Dual Bi-Fold Doors
  if (shutterType !== "none") {
    // Front diagonal opening width on each side of the corner is (width - frontSideDepth)
    const doorFinHeight = height - 3;
    const doorFinWidth = width - frontSideDepth - 5; // e.g. 900 - 560 - 5 = 335mm door

    parts.push({
      partId: `${id}-SHUTTER-L`,
      name: "Corner Shutter Left (Bi-fold)",
      qty: 1,
      material: shutterMaterial,
      finHeight: doorFinHeight,
      finWidth: doorFinWidth,
      rawHeight: doorFinHeight - (2 * shutterEdgeband),
      rawWidth: doorFinWidth - (2 * shutterEdgeband),
      edgeband: `4E (${shutterEdgeband}mm)`,
      grain: "vertical"
    });

    parts.push({
      partId: `${id}-SHUTTER-R`,
      name: "Corner Shutter Right (Bi-fold)",
      qty: 1,
      material: shutterMaterial,
      finHeight: doorFinHeight,
      finWidth: doorFinWidth,
      rawHeight: doorFinHeight - (2 * shutterEdgeband),
      rawWidth: doorFinWidth - (2 * shutterEdgeband),
      edgeband: `4E (${shutterEdgeband}mm)`,
      grain: "vertical"
    });
  }

  return parts;
}
