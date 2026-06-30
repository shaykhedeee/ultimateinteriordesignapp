'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string };
type TimelineEvent = { id: string; eventType: string; title: string; detail?: string; actor?: string; createdAt: string };

export function TimelineScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (!first) return;
        const timeline = await apiGet<{ projectId: string; events: TimelineEvent[] }>(`/projects/${first.id}/timeline`);
        setEvents(timeline.events);
      })
      .catch(console.error);
  }, []);

  const eventTypes = Array.from(new Set(events.map((event) => event.eventType)));
  const actors = Array.from(new Set(events.map((event) => event.actor ?? 'system')));
  const filteredEvents = events.filter((event) => {
    const typeOk = eventTypeFilter === 'all' || event.eventType === eventTypeFilter;
    const actorOk = actorFilter === 'all' || (event.actor ?? 'system') === actorFilter;
    return typeOk && actorOk;
  });

  return (
    <div className="workspace3">
      <Panel title="Project Timeline">
        <div className="listMock">
          <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
          <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
            <option value="all">All events</option>
            {eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>{eventType}</option>
            ))}
          </select>
          <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="all">All actors</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>
          {filteredEvents.map((event) => (
            <div className="rowMock" key={event.id}>
              <strong>{event.title}</strong>
              <div className="muted">{event.eventType} · actor: {event.actor ?? 'system'}</div>
              <div className="muted">{event.detail ?? '—'}</div>
              <div className="muted">{new Date(event.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Timeline Design Goal">
        <div className="listMock">
          <div className="rowMock">Every major design, commercial, and approval event should be auditable.</div>
          <div className="rowMock">This is the backbone for trust, PM clarity, and future agentic decision support.</div>
        </div>
      </Panel>
      <Panel title="Future Enhancements">
        <div className="listMock">
          <div className="rowMock">Filter by event type</div>
          <div className="rowMock">Actor / user attribution</div>
          <div className="rowMock">Wager / verdict overlays</div>
        </div>
      </Panel>
    </div>
  );
}
