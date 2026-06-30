'use client';

import { create } from 'zustand';
import type { SceneVersionDto } from '@studio/contracts';
import { findModule, findRoom } from '../lib/scene/selectors';

type EntityType = 'room' | 'wall' | 'module' | null;
type ViewMode = 'split' | '2d' | '3d' | 'webgl';

interface SelectionState {
  entityType: EntityType;
  entityId: string | null;
}

interface DesignEditorState {
  sceneVersion: SceneVersionDto | null;
  selection: SelectionState;
  viewMode: ViewMode;
  pending: boolean;
  setSceneVersion: (scene: SceneVersionDto | null) => void;
  setSelection: (entityType: EntityType, entityId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setPending: (pending: boolean) => void;
  optimisticMoveModule: (moduleId: string, x: number, y: number) => void;
  optimisticUpdateModuleParams: (moduleId: string, params: Record<string, unknown>) => void;
  optimisticAssignMaterial: (moduleId: string, slot: string, material: string) => void;
  clearSelection: () => void;
}

export const useDesignEditorStore = create<DesignEditorState>((set, get) => ({
  sceneVersion: null,
  selection: { entityType: null, entityId: null },
  viewMode: 'split',
  pending: false,
  setSceneVersion: (sceneVersion) => set({ sceneVersion }),
  setSelection: (entityType, entityId) => set({ selection: { entityType, entityId } }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPending: (pending) => set({ pending }),
  clearSelection: () => set({ selection: { entityType: null, entityId: null } }),
  optimisticMoveModule: (moduleId, x, y) => {
    const sceneVersion = get().sceneVersion;
    if (!sceneVersion) return;
    const clone = structuredClone(sceneVersion);
    for (const level of clone.scene.levels) {
      const module = level.modules.find((item) => item.moduleId === moduleId);
      if (module) {
        module.geometry.anchor.x = x;
        module.geometry.anchor.y = y;
      }
    }
    set({ sceneVersion: clone });
  },
  optimisticUpdateModuleParams: (moduleId, params) => {
    const sceneVersion = get().sceneVersion;
    if (!sceneVersion) return;
    const clone = structuredClone(sceneVersion);
    for (const level of clone.scene.levels) {
      const module = level.modules.find((item) => item.moduleId === moduleId);
      if (module) {
        module.params = { ...module.params, ...params };
        if (typeof params.widthMm === 'number') module.geometry.size.widthMm = params.widthMm;
        if (typeof params.heightMm === 'number') module.geometry.size.heightMm = params.heightMm;
        if (typeof params.depthMm === 'number') module.geometry.size.depthMm = params.depthMm;
      }
    }
    set({ sceneVersion: clone });
  },
  optimisticAssignMaterial: (moduleId, slot, material) => {
    const sceneVersion = get().sceneVersion;
    if (!sceneVersion) return;
    const clone = structuredClone(sceneVersion);
    for (const level of clone.scene.levels) {
      const module = level.modules.find((item) => item.moduleId === moduleId);
      if (module) {
        module.materialAssignments = { ...module.materialAssignments, [slot]: material };
      }
    }
    set({ sceneVersion: clone });
  },
}));

export function useSelectedModule() {
  return useDesignEditorStore((state) =>
    state.selection.entityType === 'module'
      ? findModule(state.sceneVersion, state.selection.entityId)
      : null
  );
}

export function useSelectedRoom() {
  return useDesignEditorStore((state) =>
    state.selection.entityType === 'room'
      ? findRoom(state.sceneVersion, state.selection.entityId)
      : null
  );
}
