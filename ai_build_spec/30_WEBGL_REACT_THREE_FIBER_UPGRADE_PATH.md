# 30 — Full WebGL / React-Three-Fiber Upgrade Path

## 1. Purpose

This document defines the **correct upgrade path** from the current lightweight editor to a stronger WebGL / react-three-fiber design environment.

The goal is not to replace the current system recklessly.
The goal is to upgrade it in the safest, most cost-effective, and highest-performing way possible.

---

## 2. Why the Current Lightweight 3D Layer Was Correct

The current scaffold uses:
- SVG-based 2D editing
- lightweight isometric 3D preview
- scene-graph-driven state

This was correct because it gave:
- linked 2D/3D architecture
- fast browser performance
- lower development risk
- lower device requirements
- easier iteration

That is not a compromise mistake — it is the right intermediate architecture.

---

## 3. What the WebGL Upgrade Should Add

The WebGL/react-three-fiber upgrade should improve:
- richer spatial understanding
- orbit/pan/zoom camera UX
- actual 3D transform previews
- better light/material feedback
- higher fidelity module massing
- better future path to final preview mode

It should **not**:
- destroy the scene-first architecture
- overload the browser by default
- turn the editor into a photoreal renderer

---

## 4. Best Practices Backed by Official R3F Guidance

The official React Three Fiber docs consistently emphasize:
- use `frameloop="demand"` for scenes that do not need constant rerendering, and trigger frames using `invalidate()` when external mutation occurs.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- reuse geometry/materials and avoid unnecessary remounting because creating materials, lights, and geometry is expensive.[2](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- use instancing when you have many similar objects to reduce draw calls.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- avoid setState inside per-frame loops; mutate refs in `useFrame` and use deltas for frame-rate-independent updates.[2](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- rely on caching and shared asset reuse when loading models.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

These rules must shape the upgrade.

---

## 5. Recommended Upgrade Stages

## Stage A — WebGL Preview Layer
Introduce an optional R3F scene preview while keeping the SVG 2D editor as primary planning surface.

### Add
- one `Canvas`
- `frameloop="demand"`
- single camera controller
- lightweight walls/floor/ceiling meshes
- box-based module previews

### Keep
- SVG 2D editing as main editing tool
- scene patch architecture unchanged

## Stage B — 3D Interaction Layer
Add controlled 3D interactions:
- select module in 3D
- inspect module in 3D
- drag limited anchors in 3D if stable
- section/isolate room preview later

## Stage C — Rich Preview Layer
Only after the above is stable:
- richer materials
- better shadows
- optional higher-detail module components
- lightweight environment lighting

## Stage D — High-Fidelity Review Mode
Separate from edit mode:
- enhanced material previews
- stronger lighting presets
- still not final render pipeline

---

## 6. Performance Rules for the Upgrade

1. **Only one main canvas instance** in the app shell/editor region.
2. **Use demand rendering** for non-animated scenes.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
3. **Manual invalidate** when imperative controls mutate scene state.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
4. **Box / plane primitives for edit mode** before detailed models.
5. **Instancing for repeated objects** where suitable.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
6. **No React state churn inside `useFrame`**.[2](https://r3f.docs.pmnd.rs/advanced/pitfalls)
7. **Cap or optimize shadows aggressively**; do not treat full shadow fidelity as default. Three.js and community guidance repeatedly note that shadow rendering is expensive and that each shadow-casting light can multiply scene render cost.[3](https://threejs.org/manual/en/shadows.html)
8. **Avoid many shadow-casting lights**; prefer one or two at most in preview mode.[3](https://threejs.org/manual/en/shadows.html)
9. **Use cached loaders / shared assets / GLTF optimization** when introducing detailed models.[1](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
10. **Preserve current lightweight 2D editor** even after 3D upgrades.

---

## 7. Recommended Technical Stack for Upgrade

### Keep
- Next.js
- React
- TypeScript
- Zustand
- shared contracts

### Add
- `@react-three/fiber`
- optionally `@react-three/drei`
- optional model pipeline with `gltfjsx`
- optional `three-mesh-bvh` later for faster raycasting on complex geometry

---

## 8. Upgrade Architecture Pattern

```text
Scene Graph
  → SVG 2D Editor (authoritative editing surface)
  → R3F 3D Preview (linked viewer)
  → Review Mode Enhancements
  → Final Render Pipeline (server-side / async)
```

Do not collapse all of these into one uncontrolled heavy runtime.

---

## 9. Final Rule

> The correct WebGL upgrade path is incremental. Keep 2D planning authoritative, keep 3D edit mode lightweight, use demand rendering and caching, and reserve heavy fidelity for review and render pipelines. This is the only way to beat competitors without wasting time or killing browser performance.
