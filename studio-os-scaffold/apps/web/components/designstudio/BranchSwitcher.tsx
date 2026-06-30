'use client';

import type { SceneVersionDto } from '@studio/contracts';

export function BranchSwitcher({
  scenes,
  currentSceneId,
  onSelectScene,
}: {
  scenes: SceneVersionDto[];
  currentSceneId?: string;
  onSelectScene: (sceneId: string) => void;
}) {
  return (
    <div className="panel" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong>Scene / Branch Switcher</strong>
      <select value={currentSceneId} onChange={(e) => onSelectScene(e.target.value)} style={{ maxWidth: 320 }}>
        {scenes.map((scene) => (
          <option key={scene.id} value={scene.id}>
            {scene.branchName} · v{scene.versionNumber} {scene.isCurrent ? '(current)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
