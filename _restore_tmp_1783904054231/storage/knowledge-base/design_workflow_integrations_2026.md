# Spatial Design Workflow & Coordinate Integration Standards (2026 Update)

This document outlines the standard spatial coordinates, parametric rules, and visualization pipelines integrated into ULTIDA StudioOS.

---

## 1. 📐 2D Layout Sketcher Vector Mapping
When translating custom 2D layouts sketched in the orthographic editor to CAD/3D coordinates:
* **Scale Ratio**: Standard translation ratio is **1 pixel = 10 millimeters** (e.g. a 450px wall maps to 4500mm or 4.5 meters in real space).
* **Wall Specifications**: Standard partition walls are drawn with a thickness of **150mm**.
* **Room Reference Origins**: The primary room boundaries are mapped from an origin offset (typically 1500mm, 1500mm) to align modular furniture centroids.

---

## 2. 🗄️ Cabinetry Placement & Space Constraints
Parametric modular cabinetry placed from the catalog aligns with the following dimensional standards:
* **Base Units**:
  * Depth: **560mm** (Kitchen standard) or **600mm** (Wardrobe standard).
  * Height: **720mm** (excluding plinth) or **850mm** (finished vanity worktop height from floor level).
* **Materials & Finishes Mapping**:
  * Default Carcass Core: `lam_1` (CenturyPly Frosty White / Suede, unit pricing ₹45/sqft).
  * Default Shutter Finish: `lam_4` (Bourbon Walnut, unit pricing ₹85/sqft).
  * Default Hardware Fittings: `hw_1` (Hettich tandem runners or soft-close Blum hinges).

---

## 🌠 3. Concept Variant Generation (Visualizer Pipeline)
Concept variant requests submitted via the **Quick Generate** tab trigger the multi-stage visualizer pipeline:
* **Aesthetic Anchors**: Prompt payloads are automatically enhanced to enforce the **ULTIDA Signature luxury Indian-modern design language**:
  * Plaster walls in warm-white and cream.
  * Large-format beige/cream marble floors with subtle grey veining.
  * Dual-tone cabinetry: warm walnut veneer paired with charcoal fluted panels.
  * Arched mirrors backlit with warm 2700K LEDs.
  * Perimeter cove lighting and recessed downlights.

---

## 🖼️ 4. Photo Edit & Material Inpainting
Image-to-image material swapping and reference patching are routed through the mask-guided inpaint engine:
* **Input Validation**: Rejects empty payloads; handles base64 data strings cleanly.
* **Avoidance Rules**: The visualizer queries `mistakes_log.json` to prevent recurring layout mistakes, adjusting color values to maintain warmth and avoid cold corporate palettes.
