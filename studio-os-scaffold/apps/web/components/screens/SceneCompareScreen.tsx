'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SceneVersionDto } from '@studio/contracts';
import { apiGet } from '../../lib/api';
import { PlanCanvas2D } from '../design2d/PlanCanvas2D';
import { IsoScenePreview3D } from '../design3d/IsoScenePreview3D';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string };
type Scene = { id: string; branchName: string; versionNumber: number; isLocked: boolean; lockReason?: string };
type CompareResult = {
  left: Scene;
  right: Scene;
  summary: { roomCountDelta: number; wallCountDelta: number; moduleCountDelta: number };
  modules: { leftOnly: string[]; rightOnly: string[] };
};

export function SceneCompareScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [left, setLeft] = useState<string>('');
  const [right, setRight] = useState<string>('');
  const [leftScene, setLeftScene] = useState<SceneVersionDto | null>(null);
  const [rightScene, setRightScene] = useState<SceneVersionDto | null>(null);
  const [compare, setCompare] = useState<CompareResult | null>(null);

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (!first) return;
        const sceneData = await apiGet<Scene[]>(`/projects/${first.id}/scenes`);
        setScenes(sceneData);
        setLeft(sceneData[0]?.id ?? '');
        setRight(sceneData[1]?.id ?? sceneData[0]?.id ?? '');
      })
      .catch(console.error);
  }, []);

  const canCompare = useMemo(() => Boolean(project?.id && left && right), [project?.id, left, right]);

  async function runCompare() {
    if (!project?.id || !left || !right) return;
    const [data, leftDoc, rightDoc] = await Promise.all([
      apiGet<CompareResult>(`/projects/${project.id}/scenes/compare?left=${left}&right=${right}`),
      apiGet<SceneVersionDto>(`/scenes/${left}`),
      apiGet<SceneVersionDto>(`/scenes/${right}`),
    ]);
    setCompare(data);
    setLeftScene(leftDoc);
    setRightScene(rightDoc);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="workspace3">
        <Panel title="Scene Compare Controls">
          <div className="listMock">
            <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
            <select value={left} onChange={(e) => setLeft(e.target.value)}>
              {scenes.map((scene) => (
                <option key={`left-${scene.id}`} value={scene.id}>
                  {scene.branchName} · v{scene.versionNumber}
                </option>
              ))}
            </select>
            <select value={right} onChange={(e) => setRight(e.target.value)}>
              {scenes.map((scene) => (
                <option key={`right-${scene.id}`} value={scene.id}>
                  {scene.branchName} · v{scene.versionNumber}
                </option>
              ))}
            </select>
            <button disabled={!canCompare} onClick={runCompare}>Compare Scenes</button>
          </div>
        </Panel>
        <Panel title="Compare Summary">
          <div className="listMock">
            <div className="rowMock">Room Delta: {compare?.summary.roomCountDelta ?? 'n/a'}</div>
            <div className="rowMock">Wall Delta: {compare?.summary.wallCountDelta ?? 'n/a'}</div>
            <div className="rowMock">Module Delta: {compare?.summary.moduleCountDelta ?? 'n/a'}</div>
            <div className="rowMock">Left Locked: {compare?.left.isLocked ? 'yes' : 'no'} · Right Locked: {compare?.right.isLocked ? 'yes' : 'no'}</div>
          </div>
        </Panel>
        <Panel title="Module Differences">
          <div className="listMock">
            <div className="rowMock">Left Only: {(compare?.modules.leftOnly ?? []).join(', ') || '—'}</div>
            <div className="rowMock">Right Only: {(compare?.modules.rightOnly ?? []).join(', ') || '—'}</div>
          </div>
        </Panel>
      </div>

      <div className="panel">
        <h3>2D Diff Overlay</h3>
        {leftScene ? (
          <PlanCanvas2D readonly onCommitPatch={async () => undefined} baseScene={leftScene} compareScene={rightScene} />
        ) : (
          <div className="canvasMock">Run compare to load overlay.</div>
        )}
      </div>

      <div className="panel">
        <h3>3D Diff Overlay</h3>
        {leftScene ? (
          <IsoScenePreview3D baseScene={leftScene} compareScene={rightScene} />
        ) : (
          <div className="canvasMock">Run compare to load 3D overlay.</div>
        )}
      </div>
    </div>
  );
}
