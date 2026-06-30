import type { UUID } from '@studio/contracts';
import { logTimelineEvent } from '../../lib/timeline';
import { mockAgentOsRepository } from '../../repositories/mock/agentos.repository';

export class InboxService {
  async list(projectId?: UUID) {
    return mockAgentOsRepository.list(projectId);
  }

  async create(projectId: UUID | undefined, input: {
    observationType: string;
    title: string;
    detail?: string;
    disposition: 'deterministic' | 'small_ai' | 'advanced_ai' | 'human_review' | 'memory_update';
  }) {
    const record = mockAgentOsRepository.create(projectId, input);
    if (projectId) {
      logTimelineEvent(projectId, 'agent.inbox_created', 'Agent inbox item created', `${input.title}`, 'orchestrator');
    }
    return record;
  }

  async updateStatus(id: UUID, status: 'new' | 'triaged' | 'in_progress' | 'done') {
    return mockAgentOsRepository.updateStatus(id, status);
  }
}

export const inboxService = new InboxService();
