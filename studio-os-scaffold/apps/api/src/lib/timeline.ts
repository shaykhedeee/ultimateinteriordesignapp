import type { UUID } from '@studio/contracts';
import { mockStore, type TimelineEventRecord } from './mock-store';

export function logTimelineEvent(projectId: UUID, eventType: string, title: string, detail?: string, actor = 'system'): TimelineEventRecord {
  const record: TimelineEventRecord = {
    id: crypto.randomUUID(),
    projectId,
    eventType,
    title,
    detail,
    actor,
    createdAt: new Date().toISOString(),
  };
  mockStore.timelineEvents.unshift(record);
  return record;
}
