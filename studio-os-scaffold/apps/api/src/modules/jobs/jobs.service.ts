import type { UUID } from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';

export class JobsService {
  async list(projectId?: UUID) {
    return projectId ? mockStore.jobs.filter((job) => job.projectId === projectId) : mockStore.jobs;
  }

  async getJob(jobId: UUID) {
    return mockStore.jobs.find((job) => job.id === jobId) ?? null;
  }
}

export const jobsService = new JobsService();
