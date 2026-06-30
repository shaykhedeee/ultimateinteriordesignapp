import type { PlaceModuleRequestDto, ScenePatchRequestDto, UUID } from '@studio/contracts';
import { ruleSeeds } from '@studio/rules';
import { applyStaleFlags } from '../../lib/stale-engine';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';
import { mockScenesRepository } from '../../repositories/mock/scenes.repository';

export class ScenesService {
  async listScenes(projectId: UUID) {
    return mockScenesRepository.list(projectId);
  }

  async getScene(sceneVersionId: UUID) {
    return mockScenesRepository.findById(sceneVersionId);
  }

  async lockScene(sceneVersionId: UUID, reason?: string) {
    return mockScenesRepository.lockScene(sceneVersionId, reason);
  }

  async unlockScene(sceneVersionId: UUID, note?: string) {
    return mockScenesRepository.unlockScene(sceneVersionId, note);
  }

  async compareScenes(leftSceneId: UUID, rightSceneId: UUID) {
    const left = mockScenesRepository.findById(leftSceneId);
    const right = mockScenesRepository.findById(rightSceneId);
    if (!left || !right) return null;
    const leftLevel = left.scene.levels[0];
    const rightLevel = right.scene.levels[0];
    return {
      left: { id: left.id, branchName: left.branchName, versionNumber: left.versionNumber, isLocked: left.isLocked },
      right: { id: right.id, branchName: right.branchName, versionNumber: right.versionNumber, isLocked: right.isLocked },
      summary: {
        roomCountDelta: (leftLevel?.rooms.length ?? 0) - (rightLevel?.rooms.length ?? 0),
        wallCountDelta: (leftLevel?.walls.length ?? 0) - (rightLevel?.walls.length ?? 0),
        moduleCountDelta: (leftLevel?.modules.length ?? 0) - (rightLevel?.modules.length ?? 0),
      },
      modules: {
        leftOnly: (leftLevel?.modules ?? []).filter((m) => !(rightLevel?.modules ?? []).some((r) => r.moduleId === m.moduleId)).map((m) => m.name),
        rightOnly: (rightLevel?.modules ?? []).filter((m) => !(leftLevel?.modules ?? []).some((r) => r.moduleId === m.moduleId)).map((m) => m.name),
      },
    };
  }

  async patchScene(sceneVersionId: UUID, patch: ScenePatchRequestDto) {
    const current = mockScenesRepository.findById(sceneVersionId);
    if (current?.isLocked) throw new Error('SCENE_LOCKED');
    const next = mockScenesRepository.createNextVersion(sceneVersionId, patch);
    if (!next) return null;
    const project = mockProjectsRepository.findById(next.projectId);
    if (project) {
      const reason = patch.operations.some((op) => op.op === 'assign_material') ? 'material_changed' : 'geometry_changed';
      applyStaleFlags(project, reason);
      project.activeSceneVersionId = next.id;
    }
    return {
      ...next,
      patchApplied: patch.operations.length,
      ruleSeedKeys: Object.keys(ruleSeeds),
    };
  }

  async branchScene(sceneVersionId: UUID, branchName: string, reason?: string) {
    const next = mockScenesRepository.createBranch(sceneVersionId, branchName, reason);
    if (!next) return null;
    const project = mockProjectsRepository.findById(next.projectId);
    if (project) {
      applyStaleFlags(project, 'scene_branched');
    }
    return next;
  }

  async placeModule(sceneVersionId: UUID, input: PlaceModuleRequestDto) {
    const current = mockScenesRepository.findById(sceneVersionId);
    if (current?.isLocked) throw new Error('SCENE_LOCKED');
    const moduleId = mockScenesRepository.addModule(sceneVersionId, input);
    if (!moduleId) return null;
    const scene = mockScenesRepository.findById(sceneVersionId);
    const project = scene ? mockProjectsRepository.findById(scene.projectId) : null;
    if (project) applyStaleFlags(project, 'geometry_changed');
    return {
      id: moduleId,
      sceneVersionId,
      roomRef: input.roomRef,
      wallRef: input.wallRef,
      moduleType: input.templateKey,
      name: input.templateKey,
      status: 'draft',
      geometry: input.anchor ?? {},
      params: input.params,
      materialAssignments: {},
    };
  }

  async duplicateModule(sceneVersionId: UUID, moduleId: UUID) {
    const current = mockScenesRepository.findById(sceneVersionId);
    if (current?.isLocked) throw new Error('SCENE_LOCKED');
    const duplicateId = mockScenesRepository.duplicateModule(sceneVersionId, moduleId);
    if (!duplicateId) return null;
    const scene = mockScenesRepository.findById(sceneVersionId);
    const project = scene ? mockProjectsRepository.findById(scene.projectId) : null;
    if (project) applyStaleFlags(project, 'geometry_changed');
    return { id: duplicateId, sourceModuleId: moduleId, sceneVersionId };
  }
}

export const scenesService = new ScenesService();
