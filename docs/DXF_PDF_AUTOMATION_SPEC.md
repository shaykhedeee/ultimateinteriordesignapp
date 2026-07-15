# DXF PDF Automation Spec

## DXF

- Use real measured wall, opening, and cabinet geometry.
- Keep layer structure explicit.
- Include title block, overall dimensions, and module tags.
- Use production-readable linework.

## PDF Elevations

- Generate A3 landscape sheets for shop use.
- Use clean white-background technical drawings.
- Show chained dimensions plus overall run dimensions.
- Place notes and schedules outside the main viewport.

## Data Contract

- Input: approved scene snapshot, wall selection, scale, and output options.
- Output: DXF path, PDF path, metadata, and version linkage.

## Safety

- Refuse to generate if the scene is not approved or the geometry is incomplete.
- Mark outputs stale when the scene changes.

