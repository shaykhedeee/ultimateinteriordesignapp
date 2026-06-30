## Monorepo TypeScript & Router Compilation Guardrails
- **Disable Declarations for Application Outputs**: End-use target applications (like web backends or API servers) should specify `"declaration": false` in their local `tsconfig.json` to prevent TS2742 declaration-export type portability warnings.
- **Next.js Typed Routes Casting**: When iterating dynamically over links in components (e.g. sidebar navigation maps), cast the target href using `href={href as any}` to satisfy Next.js static typed route compilation checks.

## Aesthetic Guidelines for Luxury CAD/Interiors Apps
- **Harmonious Neutral Colors**: Do not use primary red, blue, or green colors unless representing explicit active/stale state flags. Always rely on a curated, high-end design token palette:
  - Gold Accent: `#C9A84C` / `#E8C97A`
  - Base Dark: `#0A0A0B` / `#111113`
  - Cards / Elevated surfaces: `#1E1E24`
  - Neutral text: `#F0EEE8` / `#8A8899`
