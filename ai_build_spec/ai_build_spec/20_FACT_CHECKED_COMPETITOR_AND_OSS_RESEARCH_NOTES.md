# 20 — Fact-Checked Competitor and Open-Source Research Notes

## Competitor strengths confirmed from official product surfaces

### Foyr
- Browser-based interior design workflow
- 2D space planning, 3D modeling, 4K renders, walkthroughs
- Large catalog/library and floor plan upload/trace workflow
- Server-side/cloud rendering orientation

### RoomSketcher
- AI Convert from image/PDF to editable floor plan
- FloorCapture / LiDAR-assisted room capture path
- 2D and 3D floor plans, 360 views, Live 3D
- Measurements, area calculations, branding, replace materials

### Cedreo
- Synchronized plans, renderings, sections, elevations, and presentation documents
- Automatic update of presentation graphics when underlying design changes
- Strong pre-sales proposal/document positioning

### Matterport
- Digital twin / capture-first mindset
- CAD/BIM/digital twin downstream utility
- Construction-focused integrations and reality-capture workflow

## Open-source building blocks confirmed as relevant

### blueprint3d-modern
- Modern TypeScript-based 2D/3D planner
- Core library separated from Next.js app
- Strong reference for editor package structure and floorplan/item modeling

### furnishup/blueprint3d
- Classic three.js-based interior space planner with floorplanner/model/items/three split
- Good conceptual foundation for editor behavior

### openfpc
- 2D CAD tool on React, Three.js, and Immutable
- Useful for snapping, transforms, bulk selection, and boundary attachment behavior

### pascalorg/editor
- Serious modern architectural editor codebase
- Strong reference for monorepo architecture, viewer/editor separation, and state management patterns

### FloorPlanAnalyzer / floor-plan CV repos
- Good for experimentation and prototyping CV/OCR/segmentation pipelines
- Not sufficient as-is to serve as a production floor plan intelligence stack without review layers and refinement

### invoice/ERP repos
- Useful for quote/invoice/payment/reporting subsystem inspiration
- Must be adapted to geometry-first interior workflows

## Product conclusion

The winning build path is:
1. use modern open-source editor patterns for 2D/3D interaction
2. build your own canonical scene graph and commercial model
3. use CV repos only as algorithm references and experimentation bases
4. keep render compute on-demand
5. implement Indian interior + commercial + production continuity as your proprietary advantage
