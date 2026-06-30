import type { CreateDrawingSetRequestDto, UUID } from '@studio/contracts';
import { generateBomPreview } from '../../lib/bom-preview';
import { generateElevationPack } from '../../lib/elevation-pack';
import { mockStore } from '../../lib/mock-store';
import { mockOutputsRepository } from '../../repositories/mock/outputs.repository';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';
import { mockScenesRepository } from '../../repositories/mock/scenes.repository';

export class DrawingsService {
  async list(projectId: UUID) {
    return mockOutputsRepository.listDrawingSets(projectId);
  }

  async getElevationPack(sceneVersionId: UUID) {
    const scene = mockScenesRepository.findById(sceneVersionId);
    if (!scene) return null;
    const project = mockProjectsRepository.findById(scene.projectId);
    return generateElevationPack(scene, {
      projectName: project?.name,
      sceneVersionNumber: scene.versionNumber,
    });
  }

  async getBomPreview(sceneVersionId: UUID) {
    const scene = mockScenesRepository.findById(sceneVersionId);
    if (!scene) return null;
    const project = mockProjectsRepository.findById(scene.projectId);
    return generateBomPreview(scene, project?.name);
  }

  async qualityPass(projectId: UUID) {
    const sets = mockOutputsRepository.listDrawingSets(projectId);
    return sets.map((set) => ({
      drawingSetId: set.id,
      status: set.status,
      checks: {
        hasFloorPlan: set.outputs.some((o) => o.drawingType === 'floor_plan'),
        hasElevation: set.outputs.some((o) => o.drawingType === 'elevation'),
        hasRoomLinkage: set.outputs.every((o) => Boolean(o.roomRef || o.wallRef)),
      },
      note: 'Elevation pack should include internal/external walls where modules exist.',
    }));
  }

  async create(sceneVersionId: UUID, input: CreateDrawingSetRequestDto) {
    const sceneProject = mockProjectsRepository.list().find((project) => project.activeSceneVersionId === sceneVersionId) ?? mockProjectsRepository.list()[0];
    const result = mockOutputsRepository.createDrawingSet(sceneProject.id, sceneVersionId, input);
    mockProjectsRepository.incrementCount(sceneProject.id, 'drawings');
    mockStore.jobs.unshift({
      id: crypto.randomUUID(),
      jobType: 'drawing_generation',
      status: 'queued',
      progress: 0,
      projectId: sceneProject.id,
      sourceEntityType: 'drawing_set',
      sourceEntityId: result.id,
      createdAt: new Date().toISOString(),
    });
    return result;
  }
}

export const drawingsService = new DrawingsService();
