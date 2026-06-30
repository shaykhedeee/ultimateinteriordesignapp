import type { PlaceModuleRequestDto, ScenePatchRequestDto, SceneVersionDto, UUID } from '@studio/contracts';
import { buildProductionMapping } from '../../lib/module-production';
import { mockStore } from '../../lib/mock-store';
import { logTimelineEvent } from '../../lib/timeline';

function getFirstLevel(scene: SceneVersionDto) {
  if (!scene.scene.levels[0]) {
    scene.scene.levels[0] = {
      levelId: 'level_1',
      name: 'Ground Floor',
      rooms: [],
      walls: [],
      openings: [],
      modules: [],
    };
  }
  return scene.scene.levels[0];
}

function applyOperations(clone: SceneVersionDto, patch: ScenePatchRequestDto) {
  const level = getFirstLevel(clone);

  for (const operation of patch.operations) {
    if (operation.op === 'update_module_params' && operation.moduleId) {
      const mod = level.modules.find((item) => item.moduleId === operation.moduleId);
      if (mod) {
        mod.params = { ...mod.params, ...(operation.params ?? {}) };
        mod.geometry.size = {
          ...mod.geometry.size,
          widthMm: Number((operation.params as any)?.widthMm ?? mod.geometry.size.widthMm),
          heightMm: Number((operation.params as any)?.heightMm ?? mod.geometry.size.heightMm),
          depthMm: Number((operation.params as any)?.depthMm ?? mod.geometry.size.depthMm),
        };
        mod.geometry.anchor.x = Number((operation.params as any)?.x ?? mod.geometry.anchor.x);
        mod.geometry.anchor.y = Number((operation.params as any)?.y ?? mod.geometry.anchor.y);
        mod.geometry.anchor.z = Number((operation.params as any)?.z ?? mod.geometry.anchor.z);
        mod.productionMapping = buildProductionMapping(mod.moduleType, mod.params);
      }
    }

    if (operation.op === 'assign_material' && operation.moduleId) {
      const mod = level.modules.find((item) => item.moduleId === operation.moduleId);
      if (mod && operation.payload) {
        mod.materialAssignments = { ...mod.materialAssignments, ...operation.payload };
        mod.productionMapping = buildProductionMapping(mod.moduleType, mod.params);
      }
    }

    if (operation.op === 'remove_module' && operation.moduleId) {
      level.modules = level.modules.filter((item) => item.moduleId !== operation.moduleId);
    }

    if (operation.op === 'update_room_metadata' && operation.roomRef && operation.payload) {
      const room = level.rooms.find((item) => item.roomId === operation.roomRef);
      if (room) {
        room.name = String(operation.payload.name ?? room.name);
        room.roomType = String(operation.payload.roomType ?? room.roomType);
      }
    }
  }
}

export class MockScenesRepository {
  list(projectId: UUID) {
    return mockStore.scenes.filter((scene) => scene.projectId === projectId);
  }

  lockScene(id: UUID, reason?: string) {
    const scene = this.findById(id);
    if (!scene) return null;
    scene.isLocked = true;
    scene.lockReason = reason ?? 'Approved scene lock';
    scene.lockedAt = new Date().toISOString();
    logTimelineEvent(scene.projectId, 'scene.locked', 'Scene locked', scene.lockReason);
    return scene;
  }

  unlockScene(id: UUID, note?: string) {
    const scene = this.findById(id);
    if (!scene) return null;
    scene.isLocked = false;
    scene.lockReason = note ? `Unlocked: ${note}` : 'Unlocked';
    scene.lockedAt = undefined;
    logTimelineEvent(scene.projectId, 'scene.unlocked', 'Scene unlocked', note);
    return scene;
  }

  findById(id: UUID) {
    return mockStore.scenes.find((scene) => scene.id === id) ?? null;
  }

  createNextVersion(baseSceneId: UUID, patch: ScenePatchRequestDto) {
    const base = this.findById(baseSceneId);
    if (!base) return null;

    mockStore.scenes.forEach((scene) => {
      if (scene.projectId === base.projectId && scene.branchName === base.branchName) {
        scene.isCurrent = false;
      }
    });

    const next: SceneVersionDto = structuredClone({
      ...base,
      id: crypto.randomUUID(),
      versionNumber: base.versionNumber + 1,
      isCurrent: true,
    });

    next.scene.settings = {
      ...next.scene.settings,
      lastPatchReason: patch.reason,
    };

    applyOperations(next, patch);

    mockStore.scenes.unshift(next);
    logTimelineEvent(next.projectId, 'scene.version_created', 'Scene version created', `Scene v${next.versionNumber} created on branch ${next.branchName}`);
    return next;
  }

  createBranch(baseSceneId: UUID, branchName: string, reason?: string) {
    const base = this.findById(baseSceneId);
    if (!base) return null;

    const branched: SceneVersionDto = structuredClone({
      ...base,
      id: crypto.randomUUID(),
      versionNumber: 1,
      branchName,
      isCurrent: true,
    });

    branched.scene.settings = {
      ...branched.scene.settings,
      branchReason: reason,
    };

    mockStore.scenes.unshift(branched);
    logTimelineEvent(branched.projectId, 'scene.branch_created', 'Scene branch created', `Branch ${branchName} created`);
    return branched;
  }

  addModule(sceneId: UUID, input: PlaceModuleRequestDto) {
    const scene = this.findById(sceneId);
    if (!scene) return null;
    const level = getFirstLevel(scene);
    const moduleId = crypto.randomUUID();
    level.modules.push({
      moduleId,
      moduleType: input.templateKey,
      roomRef: input.roomRef,
      wallRef: input.wallRef,
      name: input.templateKey,
      geometry: {
        anchor: {
          roomId: input.roomRef,
          wallId: input.wallRef,
          x: Number((input.anchor as any)?.x ?? 0),
          y: Number((input.anchor as any)?.y ?? 0),
          z: Number((input.anchor as any)?.z ?? 0),
        },
        size: {
          widthMm: Number((input.params as any)?.widthMm ?? 1000),
          heightMm: Number((input.params as any)?.heightMm ?? 2400),
          depthMm: Number((input.params as any)?.depthMm ?? 600),
        },
        rotationDeg: 0,
      },
      params: input.params,
      materialAssignments: {},
      productionMapping: buildProductionMapping(input.templateKey, input.params),
    });
    logTimelineEvent(scene.projectId, 'scene.module_added', 'Module placed', `${input.templateKey} placed in ${input.roomRef}`);
    return moduleId;
  }

  duplicateModule(sceneId: UUID, moduleId: UUID) {
    const scene = this.findById(sceneId);
    if (!scene) return null;
    const level = getFirstLevel(scene);
    const existing = level.modules.find((item) => item.moduleId === moduleId);
    if (!existing) return null;
    const copyId = crypto.randomUUID();
    const duplicate = structuredClone(existing);
    duplicate.moduleId = copyId;
    duplicate.name = `${existing.name} Copy`;
    duplicate.geometry.anchor.x += 300;
    duplicate.geometry.anchor.y += 300;
    level.modules.push(duplicate);
    logTimelineEvent(scene.projectId, 'scene.module_duplicated', 'Module duplicated', `${existing.name} duplicated`);
    return copyId;
  }
}

export const mockScenesRepository = new MockScenesRepository();
