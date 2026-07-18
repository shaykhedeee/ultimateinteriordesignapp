'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = {
  id: string;
  readiness?: { score: number; nextRequiredAction?: string; checks?: Record<string, boolean> };
  staleFlags?: Record<string, boolean>;
};

type TimelineResponse = { projectId: string; events: Array<{ id: string; title: string; detail?: string }> };

export function RightRail() {
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<TimelineResponse['events']>([]);

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (!first) return;
        const timeline = await apiGet<TimelineResponse>(`/projects/${first.id}/timeline`);
        setEvents(timeline.events.slice(0, 5));
      })
      .catch(() => undefined);
  }, []);

  const stale = project?.staleFlags;

  return (
    <aside className="rightRail">
      {stale && (stale.renders || stale.drawings || stale.pricing) ? (
        <StaleNotice label={`Renders ${stale.renders ? 'stale' : 'ok'} · Drawings ${stale.drawings ? 'stale' : 'ok'} · Pricing ${stale.pricing ? 'stale' : 'ok'}`} />
      ) : null}
      <Panel title="Readiness">
        <div className="listMock">
          <div className="rowMock">Score: {project?.readiness?.score ?? 'n/a'}</div>
          <div className="rowMock">Next: {project?.readiness?.nextRequiredAction ?? 'n/a'}</div>
          {Object.entries(project?.readiness?.checks ?? {}).slice(0, 4).map(([key, value]) => (
            <div className="rowMock" key={key}>{key}: {value ? 'Yes' : 'No'}</div>
          ))}
        </div>
      </Panel>
      <Panel title="Recent Activity">
        <div className="listMock">
          {events.map((event) => (
            <div className="rowMock" key={event.id}>
              <strong>{event.title}</strong>
              <div className="muted">{event.detail ?? '—'}</div>
            </div>
          ))}
        </div>
      </Panel>
    </aside>
  );
}
