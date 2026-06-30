'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { StatusBadge } from '../primitives/StatusBadge';

type Project = {
  projectCode: string;
  name: string;
  stage: string;
  activeSceneVersionId?: string;
  staleFlags?: Record<string, boolean>;
};

export function Topbar({ title }: { title: string }) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then((projects) => setProject(projects[0] ?? null))
      .catch(() => undefined);
  }, []);

  const hasStale = Boolean(project?.staleFlags?.renders || project?.staleFlags?.drawings || project?.staleFlags?.pricing);

  return (
    <header className="topbar">
      <div>
        <div className="headerTitle">{title}</div>
        <div className="muted">
          {project?.projectCode ?? 'PRJ-—'} · {project?.name ?? 'No Active Project'} · Scene {project?.activeSceneVersionId?.slice(0, 8) ?? 'n/a'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <StatusBadge label={project?.stage ?? 'loading'} variant="review" />
        {hasStale ? <StatusBadge label="Outputs Stale" variant="stale" /> : <StatusBadge label="Outputs Current" variant="approved" />}
      </div>
    </header>
  );
}
