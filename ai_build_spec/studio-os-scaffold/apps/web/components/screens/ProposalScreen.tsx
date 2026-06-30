'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; activeSceneVersionId?: string; staleFlags?: Record<string, boolean> };
type Proposal = { id: string; versionNumber: number; status: string; renderSetId?: string; drawingSetId?: string; pricingSetId?: string };

export function ProposalScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const data = await apiGet<Proposal[]>(`/projects/${selected}/proposal-sets`);
    setProposals(data);
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id);
      })
      .catch(console.error);
  }, []);

  async function createProposal() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/projects/${project.id}/proposal-sets`, {
      sceneVersionId: project.activeSceneVersionId,
      sections: ['cover', 'summary', 'visuals', 'quote', 'signoff'],
    });
    await load(project.id);
  }

  async function regenerateProposal() {
    await createProposal();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.pricing ? <StaleNotice label="Proposal pricing context is stale. Regenerate quote/proposal after scene or material changes." /> : null}
      <div className="workspace3">
      <Panel title="Proposal Packages">
        <div className="listMock">
          <button onClick={createProposal}>Create Proposal Package</button>
          <button onClick={regenerateProposal}>Regenerate Proposal</button>
          {proposals.map((proposal) => (
            <div className="rowMock" key={proposal.id}>
              Proposal v{proposal.versionNumber} · {proposal.status}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Proposal Preview">
        <div className="canvasMock">Proposal page preview / room visuals / quote summary.</div>
      </Panel>
      <Panel title="State">
        <div className="listMock">
          <div className="rowMock">Scene Version: {project?.activeSceneVersionId ?? 'n/a'}</div>
          <div className="rowMock">Stale Pricing Flag: {project?.staleFlags?.pricing ? 'Yes' : 'No'}</div>
        </div>
      </Panel>
      </div>
    </div>
  );
}
