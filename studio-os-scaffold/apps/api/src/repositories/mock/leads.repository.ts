import type { CreateLeadRequestDto, UUID } from '@studio/contracts';
import { createLeadRecord, mockStore } from '../../lib/mock-store';

export class MockLeadsRepository {
  list() {
    return mockStore.leads;
  }

  findById(id: UUID) {
    return mockStore.leads.find((lead) => lead.id === id) ?? null;
  }

  create(input: CreateLeadRequestDto) {
    const lead = createLeadRecord(input);
    mockStore.leads.unshift(lead);
    return lead;
  }

  updateStatus(id: UUID, status: 'new' | 'qualified' | 'lost' | 'converted') {
    const lead = this.findById(id);
    if (!lead) return null;
    lead.status = status;
    return lead;
  }
}

export const mockLeadsRepository = new MockLeadsRepository();
