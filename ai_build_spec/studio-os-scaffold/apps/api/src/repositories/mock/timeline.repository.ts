import type { UUID } from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';

export class MockTimelineRepository {
  list(projectId: UUID) {
    return mockStore.timelineEvents.filter((event) => event.projectId === projectId);
  }
}

export const mockTimelineRepository = new MockTimelineRepository();
