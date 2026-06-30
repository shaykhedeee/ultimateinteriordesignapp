import type { UUID } from '@studio/contracts';
import { mockTimelineRepository } from '../../repositories/mock/timeline.repository';

export class TimelineService {
  async list(projectId: UUID) {
    return mockTimelineRepository.list(projectId);
  }
}

export const timelineService = new TimelineService();
