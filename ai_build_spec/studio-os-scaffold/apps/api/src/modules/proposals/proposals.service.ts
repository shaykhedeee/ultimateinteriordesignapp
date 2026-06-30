import type { CreateProposalSetRequestDto, UUID } from '@studio/contracts';
import { mockOutputsRepository } from '../../repositories/mock/outputs.repository';

export class ProposalsService {
  async list(projectId: UUID) {
    return mockOutputsRepository.listProposals(projectId);
  }

  async create(projectId: UUID, input: CreateProposalSetRequestDto) {
    return mockOutputsRepository.createProposal(projectId, input);
  }
}

export const proposalsService = new ProposalsService();
