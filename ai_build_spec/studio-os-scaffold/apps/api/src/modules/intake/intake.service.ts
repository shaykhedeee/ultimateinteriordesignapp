import type { UUID } from '@studio/contracts';
import { mockIntakeRepository } from '../../repositories/mock/intake.repository';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';

export class IntakeService {
  async getCurrent(projectId: UUID) {
    return mockIntakeRepository.current(projectId);
  }

  async save(projectId: UUID, payload: Record<string, unknown>) {
    const record = mockIntakeRepository.save(projectId, payload);
    mockProjectsRepository.transition(projectId, 'intake_in_progress');
    return record;
  }

  async complete(projectId: UUID) {
    const project = mockProjectsRepository.transition(projectId, 'intake_complete');
    return project;
  }
}

export const intakeService = new IntakeService();
