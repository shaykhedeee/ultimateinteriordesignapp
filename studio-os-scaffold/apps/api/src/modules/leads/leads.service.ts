import type { CreateLeadRequestDto, UUID } from '@studio/contracts';
import { mockLeadsRepository } from '../../repositories/mock/leads.repository';

export class LeadsService {
  async listLeads() {
    return mockLeadsRepository.list();
  }

  async createLead(input: CreateLeadRequestDto) {
    return mockLeadsRepository.create(input);
  }

  async qualifyLead(id: UUID) {
    return mockLeadsRepository.updateStatus(id, 'qualified');
  }
}

export const leadsService = new LeadsService();
