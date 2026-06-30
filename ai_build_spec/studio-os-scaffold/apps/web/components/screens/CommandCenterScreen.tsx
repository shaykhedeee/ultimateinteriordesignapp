'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = {
  id: string;
  name: string;
  stage: string;
  budgetBand?: string;
  readiness?: { score: number; nextRequiredAction?: string };
};

type Lead = { id: string };

export function CommandCenterScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    apiGet<Project[]>('/projects').then(setProjects).catch(console.error);
    apiGet<Lead[]>('/leads').then((data) => setLeadCount(data.length)).catch(console.error);
  }, []);

  const activeProjects = projects.length;

  return (
    <>
      <div className="kpiGrid">
        {[
          `Leads ${leadCount}`,
          `Projects ${activeProjects}`,
          `Approvals ${projects.filter((p) => p.stage === 'client_approval_pending').length}`,
          `Production ${projects.filter((p) => p.stage === 'production_preparation' || p.stage === 'production_ready').length}`,
        ].map((label) => (
          <div key={label} className="kpiCard">{label}</div>
        ))}
      </div>
      <Panel title="Pipeline">
        <div className="listMock">
          {projects.map((project) => (
            <div className="rowMock" key={project.id}>
              <strong>{project.name}</strong>
              <div className="muted">
                {project.stage} · {project.budgetBand ?? 'n/a'} · Readiness {project.readiness?.score ?? 'n/a'}
              </div>
              <div className="muted">Next: {project.readiness?.nextRequiredAction ?? 'review project'}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
