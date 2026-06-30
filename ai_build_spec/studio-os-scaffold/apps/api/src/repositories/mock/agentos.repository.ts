import type { UUID } from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';

export class MockAgentOsRepository {
  list(projectId?: UUID) {
    return projectId ? mockStore.agentInbox.filter((item) => item.projectId === projectId) : mockStore.agentInbox;
  }

  create(projectId: UUID | undefined, input: {
    observationType: string;
    title: string;
    detail?: string;
    disposition: 'deterministic' | 'small_ai' | 'advanced_ai' | 'human_review' | 'memory_update';
  }) {
    const record = {
      id: crypto.randomUUID(),
      projectId,
      observationType: input.observationType,
      title: input.title,
      detail: input.detail,
      disposition: input.disposition,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };
    mockStore.agentInbox.unshift(record);
    return record;
  }

  updateStatus(id: UUID, status: 'new' | 'triaged' | 'in_progress' | 'done') {
    const record = mockStore.agentInbox.find((item) => item.id === id);
    if (!record) return null;
    record.status = status;
    return record;
  }
}

export const mockAgentOsRepository = new MockAgentOsRepository();
