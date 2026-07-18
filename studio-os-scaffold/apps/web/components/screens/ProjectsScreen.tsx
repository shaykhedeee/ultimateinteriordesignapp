'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = {
  id: string;
  name: string;
  stage: string;
  status: string;
  budgetBand?: string;
  readiness?: { score: number; nextRequiredAction?: string };
};

const stages = [
  'draft',
  'lead_qualified',
  'intake_in_progress',
  'intake_complete',
  'site_capture',
  'plan_analysis_review',
  'scene_ready',
  'design_in_progress',
  'render_review',
  'proposal_review',
  'client_approval_pending',
  'design_approved',
  'production_preparation',
  'production_ready',
  'delivered',
];

export function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [budgetBand, setBudgetBand] = useState('standard');

  async function load() {
    const data = await apiGet<Project[]>('/projects');
    setProjects(data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await apiPost('/projects', {
      client: { primaryName: clientName },
      name: projectName || clientName,
      budgetBand,
      propertyType: 'apartment',
      projectType: 'residential',
    });
    setClientName('');
    setProjectName('');
    await load();
  }

  async function advance(projectId: string, currentStage: string) {
    const index = stages.indexOf(currentStage);
    const nextStage = stages[Math.min(index + 1, stages.length - 1)];
    await apiPost(`/projects/${projectId}/transition`, { nextStage });
    await load();
  }

  return (
    <div className="workspace3">
      <Panel title="Create Project">
        <form onSubmit={createProject} className="listMock">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" />
          <select value={budgetBand} onChange={(e) => setBudgetBand(e.target.value)}>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="luxury">Luxury</option>
          </select>
          <button type="submit">Create Project</button>
        </form>
      </Panel>
      <Panel title="Projects">
        <div className="listMock">
          {projects.map((project) => (
            <div className="rowMock" key={project.id}>
              <strong>{project.name}</strong>
              <div className="muted">{project.stage} · {project.status} · {project.budgetBand}</div>
              <div className="muted">Readiness: {project.readiness?.score ?? 'n/a'} · Next: {project.readiness?.nextRequiredAction ?? 'n/a'}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => advance(project.id, project.stage)}>Advance Stage</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Pipeline Guidance">
        <div className="listMock">
          <div className="rowMock">Do not move to final quote before scope freeze and material band selection.</div>
          <div className="rowMock">Budget-first logic should gate upgrades during design.</div>
          <div className="rowMock">Production should only start after design approval and commercial release.</div>
        </div>
      </Panel>
    </div>
  );
}
