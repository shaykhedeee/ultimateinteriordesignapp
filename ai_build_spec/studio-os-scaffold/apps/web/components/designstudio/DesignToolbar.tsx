'use client';

import { useDesignEditorStore } from '../../stores/designEditorStore';

export function DesignToolbar({
  onBranch,
  onLock,
  onUnlock,
  isLocked,
}: {
  onBranch: () => Promise<void>;
  onLock: () => Promise<void>;
  onUnlock: () => Promise<void>;
  isLocked?: boolean;
}) {
  const viewMode = useDesignEditorStore((state) => state.viewMode);
  const setViewMode = useDesignEditorStore((state) => state.setViewMode);

  return (
    <div className="panel" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong>Design Toolbar</strong>
      <button onClick={() => setViewMode('split')}>Split</button>
      <button onClick={() => setViewMode('2d')}>2D</button>
      <button onClick={() => setViewMode('3d')}>3D</button>
      <button onClick={() => setViewMode('webgl')}>WebGL</button>
      <button onClick={onBranch}>Create Branch</button>
      {isLocked ? <button onClick={onUnlock}>Unlock Scene</button> : <button onClick={onLock}>Lock Scene</button>}
      <span className="muted">View mode: {viewMode}</span>
    </div>
  );
}
