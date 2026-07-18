'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string; stage: string };
type IntakePackage = { id: string; versionNumber: number; completionPercent: number; payload: Record<string, unknown> };

export function OnboardingScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [intake, setIntake] = useState<IntakePackage | null>(null);
  const [clientLifestyle, setClientLifestyle] = useState('Family of 4, heavy storage, frequent guests');
  const [style, setStyle] = useState('modern_contemporary');
  const [mustHaveRooms, setMustHaveRooms] = useState('kitchen,living,master_bedroom,mandir');

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const current = await apiGet<IntakePackage | null>(`/projects/${selected}/intake/current`);
    setIntake(current);
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

  async function saveIntake(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    const payload = {
      clientProfile: { lifestyle: clientLifestyle },
      stylePreferences: { styles: [style] },
      rooms: mustHaveRooms.split(',').map((room) => ({ requestedName: room.trim(), required: true })),
    };
    await apiPost(`/projects/${project.id}/intake`, { payload, isAutosave: false });
    await load(project.id);
  }

  async function completeIntake() {
    if (!project) return;
    await apiPost(`/projects/${project.id}/intake/complete`, {});
    await load(project.id);
  }

  return (
    <div className="workspace3">
      <Panel title="Onboarding Wizard Mock">
        <form onSubmit={saveIntake} className="listMock">
          <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
          <textarea value={clientLifestyle} onChange={(e) => setClientLifestyle(e.target.value)} placeholder="Lifestyle notes" rows={4} />
          <input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Style preference" />
          <input value={mustHaveRooms} onChange={(e) => setMustHaveRooms(e.target.value)} placeholder="Required rooms, comma separated" />
          <button type="submit">Save Intake Version</button>
          <button type="button" onClick={completeIntake}>Mark Intake Complete</button>
        </form>
      </Panel>
      <Panel title="Current Intake Version">
        <div className="listMock">
          <div className="rowMock">Version: {intake?.versionNumber ?? 'n/a'}</div>
          <div className="rowMock">Completion: {intake?.completionPercent ?? 'n/a'}%</div>
          <div className="rowMock"><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(intake?.payload ?? {}, null, 2)}</pre></div>
        </div>
      </Panel>
      <Panel title="Onboarding Guidance">
        <div className="listMock">
          <div className="rowMock">Capture lifestyle, storage load, cooking style, Vastu preferences, and budget in one structured pass.</div>
          <div className="rowMock">Do not send a project to design without clear room priorities and budget band.</div>
        </div>
      </Panel>
    </div>
  );
}
