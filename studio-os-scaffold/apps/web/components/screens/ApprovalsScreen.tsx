'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; activeSceneVersionId?: string; stage: string };
type ApprovalPackage = { id: string; sceneVersionId: string; packageType: string; status: string; approvedByClientName?: string };
type Scene = { id: string; versionNumber: number; branchName: string; isLocked: boolean; lockReason?: string };

export function ApprovalsScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [packages, setPackages] = useState<ApprovalPackage[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const [data, sceneData] = await Promise.all([
      apiGet<ApprovalPackage[]>(`/projects/${selected}/approval-packages`),
      apiGet<Scene[]>(`/projects/${selected}/scenes`),
    ]);
    setPackages(data);
    setScenes(sceneData);
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

  async function createApprovalPackage() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/projects/${project.id}/approval-packages`, {
      sceneVersionId: project.activeSceneVersionId,
      packageType: 'client_approval',
    });
    await load(project.id);
  }

  async function approvePackage(id: string) {
    await apiPost(`/approval-packages/${id}/submit-client-decision`, {
      decision: 'approved',
      approvedByName: 'Demo Client',
      comments: 'Approved in demo flow',
    });
    await load(project?.id);
  }

  async function unlockScene(sceneVersionId: string) {
    await apiPost(`/scenes/${sceneVersionId}/unlock`, { note: 'Commercial/design override for revision' });
    await load(project?.id);
  }

  return (
    <div className="workspace3">
      <Panel title="Approval Packages">
        <div className="listMock">
          <button onClick={createApprovalPackage}>Create Approval Package</button>
          {packages.map((pkg) => {
            const scene = scenes.find((item) => item.id === pkg.sceneVersionId);
            return (
              <div className="rowMock" key={pkg.id}>
                {pkg.packageType} · {pkg.status}
                <div className="muted">Scene: {scene?.branchName} · v{scene?.versionNumber} · locked: {scene?.isLocked ? 'yes' : 'no'}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => approvePackage(pkg.id)}>Approve</button>
                  {scene?.isLocked ? <button onClick={() => unlockScene(scene.id)}>Unlock Scene</button> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Approval Preview">
        <div className="canvasMock">Approval package contents: renders, drawings, proposal, pricing summary.</div>
      </Panel>
      <Panel title="Project State">
        <div className="listMock">
          <div className="rowMock">Current Stage: {project?.stage ?? 'n/a'}</div>
          <div className="rowMock">Approving a package moves project to design_approved in this mock flow.</div>
        </div>
      </Panel>
    </div>
  );
}
