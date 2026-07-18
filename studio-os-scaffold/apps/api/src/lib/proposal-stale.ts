import { mockStore } from './mock-store';

export function invalidateProjectProposals(projectId: string, reason: string) {
  for (const proposal of mockStore.proposals) {
    if (proposal.projectId === projectId && proposal.status !== 'approved') {
      proposal.status = 'stale';
    }
  }

  for (const approval of mockStore.approvalPackages) {
    if (approval.projectId === projectId && approval.status === 'pending') {
      approval.status = 'superseded';
      approval.comments = approval.comments ? `${approval.comments} | Superseded: ${reason}` : `Superseded: ${reason}`;
    }
  }
}
