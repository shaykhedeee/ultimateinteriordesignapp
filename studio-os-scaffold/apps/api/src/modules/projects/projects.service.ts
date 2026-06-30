import type { CreateProjectRequestDto, ProjectStage, UpdateProjectRequestDto, UUID } from '@studio/contracts';
import { canTransition } from '../../lib/workflow';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';

export class ProjectsService {
  async listProjects() {
    return mockProjectsRepository.list();
  }

  async getProject(projectId: UUID) {
    return mockProjectsRepository.findById(projectId);
  }

  async createProject(input: CreateProjectRequestDto) {
    return mockProjectsRepository.create(input);
  }

  async updateProject(projectId: UUID, input: UpdateProjectRequestDto) {
    return mockProjectsRepository.update(projectId, input);
  }

  async transitionProject(projectId: UUID, nextStage: ProjectStage) {
    const project = mockProjectsRepository.findById(projectId);
    if (!project) return null;
    if (!canTransition(project.stage, nextStage)) {
      throw new Error(`INVALID_STAGE_TRANSITION: cannot move from ${project.stage} to ${nextStage}`);
    }
    return mockProjectsRepository.transition(projectId, nextStage);
  }
}

export const projectsService = new ProjectsService();
