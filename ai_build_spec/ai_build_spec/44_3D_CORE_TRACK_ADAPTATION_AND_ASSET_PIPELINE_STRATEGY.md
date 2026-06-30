# 44 — 3D Core Track Adaptation and Asset Pipeline Strategy

## Purpose

This document scans the supplied AURA 3D Core material — especially WebGPU rendering and the asset ingestion pipeline — and adapts it to the current StudioOS roadmap.

---

## 1. High-Level Verdict

The supplied 3D Core material contains strong ideas in two areas:
- richer rendering/runtime direction
- disciplined asset ingestion and normalization thinking

But if adopted literally right now, it would push StudioOS into premature complexity:
- WebGPU-first rendering engine work
- Blender-heavy asset pipeline before catalog usage is validated
- deep renderer optimization before core design workflows are fully operational

### StudioOS decision
Adopt the 3D Core material as:
- an **upgrade path**
- an **asset normalization strategy**
- a **future renderer maturity reference**

Do not adopt it as:
- a reason to replace the current lightweight editor stack
- a reason to suspend geometry/editor workflow development

---

## 2. WebGPU Material

The WebGPU content is technically ambitious and directionally valid.
It is useful for a future stage where StudioOS needs:
- richer material fidelity
- faster large-scene rendering
- better physically based lighting
- improved preview realism inside the browser

### StudioOS decision
WebGPU remains a **later optimization path**, not the current default.

### Why
The current priorities are still:
1. reviewed geometry correctness
2. editable scene continuity
3. material assignment consistency
4. drawing/elevation output reliability
5. budget/BOM linkage

### Practical near-term approach
- keep SVG 2D editing as the core planning surface
- keep lightweight 3D preview as default
- keep R3F/WebGL preview as the next production step
- postpone WebGPU until the product clearly benefits from it

---

## 3. Asset Pipeline Material

The supplied asset ingestion pipeline is genuinely useful as a long-term catalog operations reference.
It captures the right concerns:
- mesh normalization
- UV generation
- LOD generation
- texture compression
- thumbnails
- metadata extraction
- category-level standardization

### StudioOS decision
Adopt the **asset pipeline philosophy** immediately, but implement it in layers.

---

## 4. Correct Layered Asset Strategy for StudioOS

## Layer 1 — Now
- low-poly category proxies
- consistent dimensions metadata
- room/category/style tags
- fast previewability
- placement confidence

This is what Phase 2K starts to support with category-specific GLTF families.

## Layer 2 — Next
- more category-specific low-poly families
- basic anchor points and snap metadata
- material zones per asset
- thumbnail consistency
- dimension verification

## Layer 3 — Later
- vendor-specific production assets
- LODs
- compressed textures
- texture/material channels
- richer visual fidelity in preview/render

## Layer 4 — Mature platform
- automated normalization pipeline
- ingest raw FBX/OBJ/glTF
- auto-thumbnailing
- auto-LOD generation
- metadata QA checks

---

## 5. What Phase 2K Should Borrow from the 3D Core Material

### Adopt now
- category-specific low-poly GLTF families
- normalized preview asset naming
- catalog metadata enrichment
- preview and placement confidence improvements

### Adopt soon after
- asset dimension QA checks
- material zone metadata
- category-specific snap/origin conventions
- low-cost thumbnail generation

### Defer
- Blender-heavy pipeline automation
- full LOD generation
- full texture baking pipeline
- custom WebGPU renderer layer

---

## 6. Strong Rules for StudioOS Asset Growth

### Rule 1
Every asset must have trusted dimensions.

### Rule 2
Every asset must map cleanly to category + room + style tags.

### Rule 3
Preview geometry should remain lightweight until real usage proves the need for richer detail.

### Rule 4
Render assets and planning assets may diverge — but both must map back to the same scene item.

### Rule 5
Asset ingestion is only valuable if it improves speed, confidence, or downstream production continuity.

---

## 7. Repository Generator Script Decision

The supplied one-command repository generator is useful as a **greenfield bootstrap example**, but it should **not** replace the current StudioOS scaffold.

### Reason
StudioOS already has:
- a spec pack
- contracts and rules
- a backend scaffold
- a web design studio scaffold
- route/module structure
- memory-mode workflow validation

So the correct move is to **extend the current scaffold**, not fork into a parallel AURA repo tree.

---

## 8. Final Decision

> The AURA 3D Core material is a strong future-state reference, especially for asset normalization and long-term rendering maturity. StudioOS should absorb it selectively by strengthening category-specific GLTF preview assets first, while deferring WebGPU-heavy engine work until the geometry-first workflow is fully proven and commercially justified.
