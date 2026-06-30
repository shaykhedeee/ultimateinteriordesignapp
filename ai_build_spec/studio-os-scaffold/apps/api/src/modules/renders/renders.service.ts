import type { CreateRenderSetRequestDto, UUID } from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';
import { mockOutputsRepository } from '../../repositories/mock/outputs.repository';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';

export class RendersService {
  async list(projectId: UUID) {
    return mockOutputsRepository.listRenderSets(projectId);
  }

  async listFeedback(projectId: UUID) {
    return mockOutputsRepository.listRenderFeedback(projectId);
  }

  async getRenderMemory(projectId: UUID) {
    return mockOutputsRepository.getRenderMemorySummary(projectId);
  }

  async getSuggestedVariants(projectId: UUID, roomRef?: string, variantCount = 3) {
    return mockOutputsRepository.getSuggestedRenderVariants(projectId, roomRef, variantCount);
  }

  async listWalkthroughCameras(projectId: UUID) {
    return mockOutputsRepository.listWalkthroughCameras(projectId);
  }

  async generateWalkthroughCameras(sceneVersionId: UUID) {
    const sceneProject = mockProjectsRepository.list().find((project) => project.activeSceneVersionId === sceneVersionId);
    const projectId = sceneProject?.id ?? mockProjectsRepository.list()[0]?.id;
    const currentScene = mockStore.scenes.find((entry) => entry.id === sceneVersionId);
    if (!projectId || !currentScene) return [];
    const rooms = currentScene.scene.levels[0]?.rooms ?? [];
    return mockOutputsRepository.generateWalkthroughCameras(projectId, sceneVersionId, rooms as any);
  }

  async create(sceneVersionId: UUID, input: CreateRenderSetRequestDto) {
    const sceneProject = mockProjectsRepository.list().find((project) => project.activeSceneVersionId === sceneVersionId) ?? mockProjectsRepository.list()[0];
    const result = mockOutputsRepository.createRenderSet(sceneProject.id, sceneVersionId, input);
    mockProjectsRepository.incrementCount(sceneProject.id, 'renders');
    mockStore.jobs.unshift({
      id: crypto.randomUUID(),
      jobType: 'render_generation',
      status: 'queued',
      progress: 0,
      projectId: sceneProject.id,
      sourceEntityType: 'render_set',
      sourceEntityId: result.id,
      createdAt: new Date().toISOString(),
    });
    return result;
  }

  async approveVariant(variantId: UUID) {
    return mockOutputsRepository.approveRenderVariant(variantId);
  }
}

export const rendersService = new RendersService();
