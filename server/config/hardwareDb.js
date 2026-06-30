export const DRAWER_SYSTEMS = [
  {
    id: "telescopic",
    name: "Generic Telescopic Slides",
    brand: "Generic",
    type: "telescopic",
    description: "Standard side-mounted ball bearing telescopic slides (typically Ebco/Godrej). Require 13mm spacing on each side.",
    widthDeduction: 26, // Total spacer width deduction (13mm + 13mm)
    bottomWidthFormula: (internalWidth, drawerSideThickness) => internalWidth - 26 - (2 * drawerSideThickness),
    bottomDepthFormula: (carcassDepth) => carcassDepth - 10,
    backWidthFormula: (internalWidth, drawerSideThickness) => internalWidth - 26 - (2 * drawerSideThickness),
    backHeightFormula: (drawerSideHeight) => drawerSideHeight - 12
  },
  {
    id: "ebco_pro",
    name: "Ebco ProMotion Tandem Box",
    brand: "Ebco",
    type: "tandem",
    description: "Premium single/double wall metal drawer sides. Requires 16mm thick bottom and back panels.",
    widthDeduction: 75, // Bottom plate width = internal width - 75mm
    depthDeduction: 24, // Bottom plate depth = runner length - 24mm
    backWidthDeduction: 87, // Back panel width = internal width - 87mm
    bottomWidthFormula: (internalWidth) => internalWidth - 75,
    bottomDepthFormula: (runnerLength) => runnerLength - 24,
    backWidthFormula: (internalWidth) => internalWidth - 87,
    backHeightPresets: { shallow: 84, medium: 135, deep: 199 }
  },
  {
    id: "hettich_innotech",
    name: "Hettich InnoTech Atira",
    brand: "Hettich",
    type: "tandem",
    description: "German-engineered double-wall metal drawers. Uses standard 16mm board bottoms.",
    widthDeduction: 75,
    depthDeduction: 24,
    backWidthDeduction: 87,
    bottomWidthFormula: (internalWidth) => internalWidth - 75,
    bottomDepthFormula: (runnerLength) => runnerLength - 24,
    backWidthFormula: (internalWidth) => internalWidth - 87,
    backHeightPresets: { shallow: 70, medium: 144, deep: 176 }
  },
  {
    id: "blum_tandembox",
    name: "Blum Tandembox antaro",
    brand: "Blum",
    type: "tandem",
    description: "High-end Austrian runner system. Smooth motion and high load capacity.",
    widthDeduction: 75,
    depthDeduction: 24,
    backWidthDeduction: 87,
    bottomWidthFormula: (internalWidth) => internalWidth - 75,
    bottomDepthFormula: (runnerLength) => runnerLength - 24,
    backWidthFormula: (internalWidth) => internalWidth - 87,
    backHeightPresets: { shallow: 68, medium: 148, deep: 224 }
  }
];

export const HINGE_SYSTEMS = [
  {
    id: "full_overlay",
    name: "Full Overlay Hinge (0 Crank)",
    description: "Standard cabinet door hinge. Shutter fully covers the side panel face (leaving 2.5-3mm side gap).",
    sideClearance: 3
  },
  {
    id: "half_overlay",
    name: "Half Overlay Hinge (8 Crank)",
    description: "Used when two adjacent doors share a single side-panel partition (e.g. twin cabinets).",
    sideClearance: 9
  },
  {
    id: "inset_hinge",
    name: "Inset / Insert Hinge (15 Crank)",
    description: "Used when the shutter sits entirely inside the side-panel frame, exposing the carcass front edge.",
    sideClearance: 19
  }
];
