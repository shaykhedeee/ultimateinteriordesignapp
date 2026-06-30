import type { ApprovalDecisionRequestDto, CreateApprovalPackageRequestDto, UUID } from '@studio/contracts';
import { mockOutputsRepository } from '../../repositories/mock/outputs.repository';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';
import { mockScenesRepository } from '../../repositories/mock/scenes.repository';

export class ApprovalsService {
  async list(projectId: UUID) {
    return mockOutputsRepository.listApprovalPackages(projectId);
  }

  async create(projectId: UUID, input: CreateApprovalPackageRequestDto) {
    const project = mockProjectsRepository.findById(projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (input.packageType === 'client_approval') {
      if (project.staleFlags?.renders || project.staleFlags?.drawings || project.staleFlags?.pricing) {
        throw new Error('OUTPUT_SET_STALE');
      }
      if (project.activeSceneVersionId && input.sceneVersionId !== project.activeSceneVersionId) {
        throw new Error('SCENE_NOT_CURRENT');
      }
    }
    return mockOutputsRepository.createApprovalPackage(projectId, input);
  }

  async decide(approvalPackageId: UUID, input: ApprovalDecisionRequestDto) {
    const result = mockOutputsRepository.decideApproval(approvalPackageId, input);
    if (result?.status === 'approved') {
      const project = mockProjectsRepository.list().find((item) => item.id === result.projectId);
      if (project) mockProjectsRepository.transition(project.id, 'design_approved');
      mockScenesRepository.lockScene(result.sceneVersionId, 'Locked by approved client package');
    }
    return result;
  }
}

export const approvalsService = new ApprovalsService();
