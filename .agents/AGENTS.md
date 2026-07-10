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
