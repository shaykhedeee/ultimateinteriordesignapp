# Render And Elevation Architecture

## Source Of Truth

The scene graph is canonical. Renders, elevations, cutlists, quotes, and delivery packs are derived artifacts.

## Render Pipeline

1. Parse the approved scene snapshot.
2. Export deterministic geometry to Blender/Cycles.
3. Render a clean base image with physically plausible lighting.
4. Use AI editing only for polish, inpainting, or material swaps.
5. Save base render, final render, prompt, mask data, and approval state.

## Elevation Pipeline

1. Project the approved scene to wall elevations.
2. Generate measured cabinet and opening geometry.
3. Emit DXF and vector PDF from the same measured model.
4. Keep tags, dimensions, and schedules tied to scene entities.

## Output Rules

- Do not invent geometry during rendering.
- Do not let material edits move openings, cabinets, or dimensions.
- Keep PDF and DXF outputs production readable.

