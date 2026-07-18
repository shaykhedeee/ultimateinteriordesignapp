'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string };
type Job = { id: string; jobType: string; status: string; progress: number; sourceEntityType?: string; sourceEntityId?: string; createdAt?: string };

export function JobsScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (!first) return;
        const data = await apiGet<Job[]>(`/projects/${first.id}/jobs`);
        setJobs(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="workspace3">
      <Panel title="Jobs Monitor">
        <div className="listMock">
          <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
          {jobs.map((job) => (
            <div className="rowMock" key={job.id}>
              <strong>{job.jobType}</strong>
              <div className="muted">{job.status} · {job.progress}%</div>
              <div className="muted">{job.sourceEntityType} · {job.sourceEntityId}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Why Monitor Jobs">
        <div className="listMock">
          <div className="rowMock">Rendering, drawing generation, proposal export, and CV tasks must be trackable.</div>
          <div className="rowMock">This is essential for production reliability and future agent-based orchestration.</div>
        </div>
      </Panel>
      <Panel title="Future Job UX">
        <div className="listMock">
          <div className="rowMock">Retry failed jobs</div>
          <div className="rowMock">Priority queueing</div>
          <div className="rowMock">Job detail drawer with logs</div>
        </div>
      </Panel>
    </div>
  );
}
