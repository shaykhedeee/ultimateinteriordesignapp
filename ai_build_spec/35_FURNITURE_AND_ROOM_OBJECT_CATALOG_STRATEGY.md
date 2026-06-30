# 35 — Furniture and Room Object Catalog Strategy

## Purpose

This document defines how StudioOS should build a usable interior catalog for design workflows.

The goal is not just to collect random models.
The goal is to build a **design-usable, budget-aware, room-aware, style-aware, production-aware catalog**.

---

## 1. What the Catalog Must Include

The product should support a curated object catalog including:
- beds
- sofas
- TV units
- dresser units
- wardrobes (laminate and premium systems)
- study desks
- mandirs
- storage units
- lights
- decor accents later

The catalog should not be treated as a loose gallery. Each item should store:
- category
- room types
- dimensions
- style tags
- trend tags
- budget tier hints
- placement defaults
- parametric compatibility where relevant

---

## 2. Current Trend Direction Used for Catalog Seeding

Broad 2026 interiors/furniture trend coverage repeatedly highlights:
- softer, curved silhouettes in sofas and seating
- comfort-first furniture
- warm woods and darker/walnut-toned finishes
- textured casegoods / reeding / fluted panel details
- handcrafted / layered / less mass-produced feel in furniture direction.[1](https://www.veranda.com/home-decorators/design-trends/a70237289/2026-furniture-trends/) [2](https://www.hearthsidefurniture.com/blogs/news/top-furniture-trends) [3](https://www.veranda.com/home-decorators/design-trends/a71242765/interior-design-trends-summer-2026/)

These trend directions are useful for catalog tagging and default suggestions.

---

## 3. Product Rule

The app should allow both:
1. **curated internal catalog items** for speed and consistency
2. **future external catalogs / GLTF libraries / branded vendor libraries** for richer production and rendering workflows

---

## 4. Final Rule

> A strong interior design app needs a design-grade object catalog, not merely a model dump. Every object should be easy to place, dimensionally meaningful, style-tagged, budget-tagged, and useful in real client workflows.
