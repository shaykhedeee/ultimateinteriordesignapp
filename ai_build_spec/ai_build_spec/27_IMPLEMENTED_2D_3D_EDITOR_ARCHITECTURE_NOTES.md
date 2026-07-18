# 27 — Implemented 2D/3D Editor Architecture Notes

## Purpose

This document explains the actual editor component architecture implemented in the scaffold.

## Current implementation path

The editor in the scaffold uses a **lightweight, browser-first architecture**:

### State
- `apps/web/stores/designEditorStore.ts`
- Zustand store
- one source of truth for loaded scene version, selection, view mode, and optimistic edits

### Scene helpers
- `apps/web/lib/scene/selectors.ts`
- `apps/web/lib/scene/patches.ts`

### 2D editor
- `apps/web/components/design2d/PlanCanvas2D.tsx`
- SVG-based rendering for rooms, walls, modules
- supports selection and drag movement of modules
- commits movement via patch requests

### 3D preview
- `apps/web/components/design3d/IsoScenePreview3D.tsx`
- lightweight isometric SVG projection
- intentionally chosen over heavy WebGL as the first interactive 3D preview layer to keep browser cost low

### Design studio orchestration
- `apps/web/components/designstudio/DesignStudioWorkspace.tsx`
- loads project + scene versions
- handles branch creation
- routes module placement and patch commits
- ties 2D, 3D, inspector, and palette together

### Inspector
- `apps/web/components/designstudio/InspectorPanel.tsx`
- module param editing
- material slot editing
- remove module action

### Toolbar / template palette
- `apps/web/components/designstudio/DesignToolbar.tsx`
- `apps/web/components/designstudio/TemplatePalette.tsx`

## Why this is a good lightweight first implementation

It gives:
- real linked 2D/3D editing architecture
- real scene-driven rendering
- real patch/branch workflow hooks
- low browser compute load
- easy future migration to richer 3D rendering if needed

## Future upgrade path

Later, the 3D preview layer can be swapped or extended with:
- react-three-fiber
- simple box/plane geometry edit mode
- richer material previews
- optional high-detail assets on demand

without changing the canonical scene/store architecture.
