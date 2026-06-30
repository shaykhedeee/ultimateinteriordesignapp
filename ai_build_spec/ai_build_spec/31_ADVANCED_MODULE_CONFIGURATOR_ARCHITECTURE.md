# 31 — Advanced Module Configurator Architecture

## 1. Purpose

This document defines how to build **advanced module configurators** that outperform generic interior apps.

The goal is to move beyond static furniture placement and support true interior-design intelligence for:
- kitchens
- wardrobes
- TV units
- mandirs
- crockery units
- utility units
- study desks
- storage systems

---

## 2. Why This Matters

Many competitors are strong at visualization, but weaker in domain-specific modular intelligence.

The strongest value comes when the system understands:
- module dimensions
- splits
- shutters
- carcass logic
- material slots
- hardware tiers
- production mapping
- budget impact

That is where your app can become better than a generic planner.

---

## 3. Configurator Layers

Each module configurator should have:

### Layer 1 — Placement
- room
- wall association
- anchor position
- width / height / depth

### Layer 2 — Layout Logic
- shutter count
- shelf count
- drawer count
- internal zoning
- loft handling
- appliance or special-use zones

### Layer 3 — Finish Logic
- carcass board
- shutter finish
- handle/gola profile
- back panel
- accent material
- glass / mirror / jali / stone where relevant

### Layer 4 — Budget Logic
- cost tier impact
- upgrade/downgrade paths
- suggested substitutions

### Layer 5 — Production Logic
- part formula set
- edge band mapping
- sheet/material summary hooks

---

## 4. Required Advanced Configurators

### Kitchen Configurator
Must support:
- straight / L / U / island layouts
- base / wall / loft / tall segmentation
- hob/sink/chimney logic
- appliance allocation
- finish tiering
- countertop slot
- dado/backsplash slot

### Wardrobe Configurator
Must support:
- swing / sliding
- width split logic
- internal shelf/hanging/drawer allocation
- loft inclusion
- glass / laminate / fluted handle variants
- clearance rules

### TV Unit Configurator
Must support:
- console dimensions
- backdrop type
- paneling options
- backlighting options
- shelves/display niches
- floating vs grounded console

### Mandir Configurator
Must support:
- floor/wall/niche type
- base storage
- jali / backlit stone / wood finish
- height and puja platform rules

---

## 5. UX Best Practice

A configurator should feel:
- visual
- structured
- not overwhelming
- budget-aware
- production-aware

### Recommended UX sections
- dimensions
- layout splits
- materials
- hardware/lighting
- budget effect
- production notes

---

## 6. Final Rule

> Advanced module configurators are one of the biggest product moats. They must behave like intelligent interior-specific product builders, not generic furniture forms.
