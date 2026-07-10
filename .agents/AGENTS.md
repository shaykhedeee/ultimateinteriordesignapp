## Monorepo TypeScript & Router Compilation Guardrails
- **Disable Declarations for Application Outputs**: End-use target applications (like web backends or API servers) should specify `"declaration": false` in their local `tsconfig.json` to prevent TS2742 declaration-export type portability warnings.
- **Next.js Typed Routes Casting**: When iterating dynamically over links in components (e.g. sidebar navigation maps), cast the target href using `href={href as any}` to satisfy Next.js static typed route compilation checks.

## Aesthetic Guidelines for Luxury CAD/Interiors Apps
- **Harmonious Neutral Colors**: Do not use primary red, blue, or green colors unless representing explicit active/stale state flags. Always rely on a curated, high-end design token palette:
  - Gold Accent: `#C9A84C` / `#E8C97A`
  - Base Dark: `#0A0A0B` / `#111113`
  - Cards / Elevated surfaces: `#1E1E24`
  - Neutral text: `#F0EEE8` / `#8A8899`

## Millwork & CAD 2D Elevation Guidelines (Pooja/Crockery/Cabinets)
When generating 2D elevations in DXF or PDF form:
1. **Witness Dimension Lines**: Always draw witness/extension lines all the way from the object boundary points (e.g. cabinet corners/plinths) to the dimension offsets to prevent floating labels.
2. **Dimension Tiers**: Output double-tiered dimension lines at the bottom (Tier 1: individual cabinet widths in a chain; Tier 2: overall wall/room width).
3. **Oblique Slats/Ticks**: Draw AutoCAD-compatible 45-degree angle slashes (oblique ticks) instead of simple vertical lines for professional shop drawings.
4. **Hinge Door Swings**: Draw dashed V-shape swing markers (pointing towards the hinges on a hidden/dashed layer) for both single and double doors. Center-split doors wider than 500mm.
5. **Filler/Void X-Marks**: Draw a red diagonal cross (X) on the openings layer inside spacers, fillers, or narrow void modules (width < 300mm).
6. **Handles**: Draw thick solid-filled rectangles to represent horizontal pull bars for drawers and vertical pulls for shutter doors.

## Deep 2D Wardrobe Elevation Blueprint Guidelines (External & Internal)
When generating detailed 2D shop drawings for sliding/hinged wardrobes with vanity mirrors or lofts:

### 1. External Elevation (Closed Doors)
* **Door Division Standards**: Divide standard wardrobe carcass widths into equal bays (typically `500-600mm` wide) labeled `SHUTTER` or `SLIDING DOOR`.
* **Lofts**: Place loft doors (typically `500-700mm` tall) aligned exactly to the vertical bays below, labeled `LOFT`.
* **Vanity Dresser Sections**:
  * Position dresser mirror worktops at exactly `850mm` from the floor level (e.g. skirting `100mm` + three drawers of `250mm` = `850mm`).
  * Mirror height should be drawn at `1230mm` with a `20mm` clearance frame. Render diagonal reflection strokes (`//`) inside the glass panel.
* **Swing Indicators**: Draw dashed V-swing lines pointing towards the hinge on a hidden/dashed layer. Use diamond-swing markers for lofts.

### 2. Internal Sectional Elevation (Open Shelves)
* **Carcass Line Representation**: Draw all internal horizontal shelves and vertical partition panels as **double lines** representing the actual `18mm` board thickness.
* **Specialty Compartments**:
  * **Hanging Wardrobe Sections**: Label as `hanging space` or `used clothes hanging space` and draw a double-line clothes hanger rod.
  * **Saree Hangers**: Label wide hanging slots (`1000-1100mm` wide, `750mm` tall) as `Saree Hanger Compartment`.
  * **Internal Drawers**: Mark drawer depths (e.g. `200mm`, `250mm`, `300mm`) and draw center pull-knob circles.
  * **Adjustable Shelves**: Draw horizontal double lines labeled with height clearances (e.g. `300-380mm`).

### 3. Wall Enclosure & Fillers
* **Masonry Hatch**: Surround the unit with a diagonal wall cross-hatch structure showing the built-in alcove wall.
* **X-Marks on Fillers**: Draw diagonal cross lines on spacer/filler sections (e.g. `30mm` left and right spacers).
* **Double-Tier Bottom Dimensions**:
  * **Tier 1**: Individual cabinet run divisions (e.g. `30`, `528`, `528`, `528`, `528`, `528`, `600`, `30`).
  * **Tier 2**: Wardrobe carcass run (`2670`) and overall layout run (`3300`).

