'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string };
type InboxItem = { id: string; observationType: string; title: string; detail?: string; disposition: string; status: string; createdAt: string };

export function InboxScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [title, setTitle] = useState('Potential budget overrun due to finish upgrades');
  const [detail, setDetail] = useState('Need value engineering suggestions before final quote.');
  const [disposition, setDisposition] = useState('advanced_ai');

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const data = await apiGet<InboxItem[]>(`/projects/${selected}/inbox`);
    setItems(data);
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

  async function createInboxItem(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    await apiPost(`/projects/${project.id}/inbox`, {
      observationType: 'budget_risk',
      title,
      detail,
      disposition,
    });
    await load(project.id);
  }

  async function markDone(id: string) {
    await apiPost(`/inbox/${id}/status`, { status: 'done' });
    await load(project?.id);
  }

  return (
    <div className="workspace3">
      <Panel title="Create Inbox Item">
        <form onSubmit={createInboxItem} className="listMock">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} placeholder="Detail" />
          <select value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            <option value="deterministic">Deterministic</option>
            <option value="small_ai">Small AI</option>
            <option value="advanced_ai">Advanced AI</option>
            <option value="human_review">Human Review</option>
            <option value="memory_update">Memory Update</option>
          </select>
          <button type="submit">Create Inbox Item</button>
        </form>
      </Panel>
      <Panel title="Agentic Inbox">
        <div className="listMock">
          {items.map((item) => (
            <div className="rowMock" key={item.id}>
              <strong>{item.title}</strong>
              <div className="muted">{item.observationType} · {item.disposition} · {item.status}</div>
              <div className="muted">{item.detail ?? '—'}</div>
              <button style={{ marginTop: 8 }} onClick={() => markDone(item.id)}>Mark Done</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Foundation Only">
        <div className="listMock">
          <div className="rowMock">This is the first foundation for the agentic event inbox / task feed.</div>
          <div className="rowMock">Next phases can add wagers, verdicts, task routing, and automation policies.</div>
        </div>
      </Panel>
    </div>
  );
}
