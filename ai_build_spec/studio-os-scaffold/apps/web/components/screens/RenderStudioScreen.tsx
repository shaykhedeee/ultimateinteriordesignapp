'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; activeSceneVersionId?: string; staleFlags?: Record<string, boolean> };
type RenderSet = { id: string; renderTier: string; status: string; roomRef?: string; variants: Array<{ id: string; cameraRef: string; approvalStatus: string; lightingPresetRef?: string }> };
type WalkthroughCamera = { id: string; roomRef: string; label: string; position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } };
type RenderFeedback = { id: string; decision: string; note?: string; roomRef?: string };
type RenderMemory = {
  totalSignals: number;
  approvals: number;
  shortlisted: number;
  rejected: number;
  topCameras: Array<{ cameraRef: string; count: number }>;
  topLightingPresets: Array<{ lightingPresetRef: string; count: number }>;
  roomMemory: Array<{ roomRef: string; approved: number; shortlisted: number; rejected: number }>;
  lastSignals: Array<{ id: string; decision: string; note?: string; roomRef?: string }>;
};
type RenderSuggestion = { cameraRef: string; lightingPresetRef: string; score: number; reason: string; roomRef?: string };
type SceneVersion = {
  id: string;
  scene: {
    levels: Array<{
      rooms: Array<{ roomId: string; name: string; polygon2d: Array<{ x: number; y: number }> }>;
    }>;
  };
};

export function RenderStudioScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [renderSets, setRenderSets] = useState<RenderSet[]>([]);
  const [walkthroughCameras, setWalkthroughCameras] = useState<WalkthroughCamera[]>([]);
  const [renderFeedback, setRenderFeedback] = useState<RenderFeedback[]>([]);
  const [renderMemory, setRenderMemory] = useState<RenderMemory | null>(null);
  const [renderSuggestions, setRenderSuggestions] = useState<RenderSuggestion[]>([]);
  const [scene, setScene] = useState<SceneVersion | null>(null);

  async function load(projectId?: string, sceneVersionId?: string) {
    const selected = projectId ?? project?.id;
    const activeSceneVersionId = sceneVersionId ?? project?.activeSceneVersionId;
    if (!selected) return;
    const [renderData, cameraData, feedbackData, memoryData, suggestionData] = await Promise.all([
      apiGet<RenderSet[]>(`/projects/${selected}/render-sets`),
      apiGet<WalkthroughCamera[]>(`/projects/${selected}/walkthrough-cameras`),
      apiGet<RenderFeedback[]>(`/projects/${selected}/render-feedback`),
      apiGet<RenderMemory>(`/projects/${selected}/render-memory`),
      apiGet<RenderSuggestion[]>(`/projects/${selected}/render-suggestions?roomRef=room_living_1&variantCount=3`),
    ]);
    setRenderSets(renderData);
    setWalkthroughCameras(cameraData);
    setRenderFeedback(feedbackData);
    setRenderMemory(memoryData);
    setRenderSuggestions(suggestionData);
    if (activeSceneVersionId) {
      const sceneData = await apiGet<SceneVersion>(`/scenes/${activeSceneVersionId}`);
      setScene(sceneData);
    }
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id, first.activeSceneVersionId);
      })
      .catch(console.error);
  }, []);

  async function createRenderSet() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/scenes/${project.activeSceneVersionId}/render-sets`, {
      roomRef: 'room_living_1',
      renderTier: 'review',
      variantCount: 3,
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function approveVariant(variantId: string) {
    await apiPost(`/render-variants/${variantId}/approve`, {});
    await load(project?.id, project?.activeSceneVersionId);
  }

  async function generateWalkthroughCameras() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/scenes/${project.activeSceneVersionId}/walkthrough-cameras/generate`, {});
    await load(project?.id, project?.activeSceneVersionId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.renders ? <StaleNotice label="Render outputs are stale because the scene or materials changed." /> : null}
      <div className="workspace3">
        <Panel title="Inputs">
          <div className="listMock">
            <div className="rowMock">Room: Living Room</div>
            <div className="rowMock">Tier: Review</div>
            <button onClick={createRenderSet}>Create Memory-Guided Render Set</button>
            <button onClick={generateWalkthroughCameras}>Generate Walkthrough Camera Points</button>
            <div className="rowMock">Render memory signals: {renderMemory?.totalSignals ?? 0}</div>
            <div className="rowMock">Auto suggestions loaded: {renderSuggestions.length}</div>
          </div>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Viewer + Variants">
            <WalkthroughPlaybackPanel scene={scene} cameras={walkthroughCameras} />
            <div className="listMock" style={{ marginTop: 12 }}>
              {renderSets.map((set) => (
                <div className="rowMock" key={set.id}>
                  <strong>{set.renderTier}</strong> · {set.status}
                  {set.variants.map((variant) => (
                    <div key={variant.id} style={{ marginTop: 8 }}>
                      {variant.cameraRef} · {variant.lightingPresetRef ?? 'lighting n/a'} · {variant.approvalStatus}
                      <button style={{ marginLeft: 8 }} onClick={() => approveVariant(variant.id)}>Approve</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Render Memory + Auto Suggestions">
            <div className="kpiGrid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              <div className="kpiCard"><div className="muted">Signals</div><div>{renderMemory?.totalSignals ?? 0}</div></div>
              <div className="kpiCard"><div className="muted">Approved</div><div>{renderMemory?.approvals ?? 0}</div></div>
              <div className="kpiCard"><div className="muted">Shortlisted</div><div>{renderMemory?.shortlisted ?? 0}</div></div>
              <div className="kpiCard"><div className="muted">Rejected</div><div>{renderMemory?.rejected ?? 0}</div></div>
            </div>
            <div className="workspaceSplit" style={{ marginTop: 12 }}>
              <div className="listMock">
                <div className="rowMock"><strong>Top Cameras</strong></div>
                {(renderMemory?.topCameras ?? []).map((item) => (
                  <div key={item.cameraRef} className="rowMock">{item.cameraRef} · {item.count} signal(s)</div>
                ))}
              </div>
              <div className="listMock">
                <div className="rowMock"><strong>Top Lighting Presets</strong></div>
                {(renderMemory?.topLightingPresets ?? []).map((item) => (
                  <div key={item.lightingPresetRef} className="rowMock">{item.lightingPresetRef} · {item.count} signal(s)</div>
                ))}
              </div>
            </div>
            <div className="listMock" style={{ marginTop: 12 }}>
              <div className="rowMock"><strong>Memory-guided variant suggestion stack</strong></div>
              {renderSuggestions.map((item, index) => (
                <div key={`${item.cameraRef}-${item.lightingPresetRef}-${index}`} className="rowMock">
                  Variant {index + 1} · {item.cameraRef} + {item.lightingPresetRef}
                  <div className="muted" style={{ marginTop: 6 }}>Score {item.score.toFixed(2)} · {item.reason}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Approval Rail">
          <div className="listMock">
            <div className="rowMock">Linked Scene Version: {project?.activeSceneVersionId ?? 'n/a'}</div>
            <div className="rowMock">Stale Render Flag: {project?.staleFlags?.renders ? 'Yes' : 'No'}</div>
            <div className="rowMock">Render Learning Events: {renderFeedback.length}</div>
            <div className="rowMock">Walkthrough Camera Points: {walkthroughCameras.length}</div>
            {(renderMemory?.roomMemory ?? []).map((room) => (
              <div key={room.roomRef} className="rowMock">
                {room.roomRef} · approved {room.approved} · shortlisted {room.shortlisted} · rejected {room.rejected}
              </div>
            ))}
            {(renderMemory?.lastSignals ?? []).map((signal) => (
              <div key={signal.id} className="rowMock">
                {signal.decision} · {signal.roomRef ?? 'project'}
                <div className="muted">{signal.note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function WalkthroughPlaybackPanel({ scene, cameras }: { scene: SceneVersion | null; cameras: WalkthroughCamera[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'fixed' | 'interpolated'>('fixed');
  const [index, setIndex] = useState(0);

  const rooms = scene?.scene.levels[0]?.rooms ?? [];
  const interpolatedFrames = useMemo(() => buildInterpolatedFrames(cameras, 10), [cameras]);
  const fixedFrames = useMemo(
    () => cameras.map((camera) => ({ position: camera.position, target: camera.target, label: camera.label, roomRef: camera.roomRef })),
    [cameras]
  );
  const activeFrames = mode === 'interpolated' ? interpolatedFrames : fixedFrames;

  useEffect(() => {
    if (!isPlaying || activeFrames.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % activeFrames.length);
    }, mode === 'interpolated' ? 160 : 1800);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeFrames, mode]);

  useEffect(() => {
    if (index >= activeFrames.length) setIndex(0);
  }, [activeFrames.length, index]);

  const current = activeFrames[index] ?? null;
  const bounds = useMemo(() => {
    const points = rooms.flatMap((room) => room.polygon2d);
    if (points.length === 0) return { minX: 0, minY: 0, width: 5000, height: 4000 };
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { minX, minY, width: Math.max(maxX - minX, 1), height: Math.max(maxY - minY, 1) };
  }, [rooms]);

  return (
    <div className="listMock">
      <div className="canvasMock" style={{ minHeight: 260 }}>
        <svg viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} style={{ width: '100%', height: 220 }}>
          {rooms.map((room) => (
            <polygon
              key={room.roomId}
              points={room.polygon2d.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={20}
            />
          ))}

          {mode === 'interpolated' && interpolatedFrames.length > 1 ? (
            <polyline
              points={interpolatedFrames.map((frame) => `${frame.position.x},${frame.position.y}`).join(' ')}
              fill="none"
              stroke="#6fa8ff"
              strokeWidth={20}
              strokeDasharray="50 18"
              opacity={0.7}
            />
          ) : null}

          {cameras.map((camera, cameraIndex) => (
            <g key={camera.id}>
              <circle cx={camera.position.x} cy={camera.position.y} r={mode === 'fixed' && cameraIndex === index ? 120 : 70} fill={mode === 'fixed' && cameraIndex === index ? '#e1bf72' : '#4d7ec2'} opacity={0.75} />
              <line x1={camera.position.x} y1={camera.position.y} x2={camera.target.x} y2={camera.target.y} stroke={mode === 'fixed' && cameraIndex === index ? '#e1bf72' : '#4d7ec2'} strokeWidth={28} strokeDasharray="36 18" opacity={0.75} />
            </g>
          ))}

          {current ? (
            <>
              <circle cx={current.position.x} cy={current.position.y} r={100} fill="#e1bf72" opacity={0.92} />
              <line x1={current.position.x} y1={current.position.y} x2={current.target.x} y2={current.target.y} stroke="#e1bf72" strokeWidth={22} opacity={0.85} />
            </>
          ) : null}
        </svg>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMode('fixed')}>Fixed Points</button>
          <button type="button" onClick={() => setMode('interpolated')}>Interpolated Path</button>
          <button type="button" onClick={() => setIndex((currentIndex) => Math.max(currentIndex - 1, 0))}>Prev</button>
          <button type="button" onClick={() => setIsPlaying((currentValue) => !currentValue)}>{isPlaying ? 'Pause' : 'Play'} Walkthrough</button>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex + 1) % Math.max(activeFrames.length, 1))}>Next</button>
        </div>
      </div>
      <div className="rowMock">
        <strong>{current?.label ?? 'No camera points yet'}</strong>
        <div className="muted" style={{ marginTop: 6 }}>
          {current ? `Mode ${mode} · Position ${Math.round(current.position.x)}, ${Math.round(current.position.y)}, ${Math.round(current.position.z)} · Target ${Math.round(current.target.x)}, ${Math.round(current.target.y)}, ${Math.round(current.target.z)}` : 'Generate room camera points from the active scene.'}
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          Interpolated walkthrough mode now creates an in-between playback path. Next step is AI-enhanced frame rendering and video export.
        </div>
      </div>
    </div>
  );
}

function buildInterpolatedFrames(cameras: WalkthroughCamera[], stepsPerSegment: number) {
  if (cameras.length <= 1) {
    return cameras.map((camera) => ({
      position: camera.position,
      target: camera.target,
      label: camera.label,
      roomRef: camera.roomRef,
    }));
  }

  const frames: Array<{ position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number }; label: string; roomRef: string }> = [];
  for (let i = 0; i < cameras.length - 1; i += 1) {
    const from = cameras[i];
    const to = cameras[i + 1];
    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      frames.push({
        position: {
          x: lerp(from.position.x, to.position.x, easeInOut(t)),
          y: lerp(from.position.y, to.position.y, easeInOut(t)),
          z: lerp(from.position.z, to.position.z, easeInOut(t)),
        },
        target: {
          x: lerp(from.target.x, to.target.x, easeInOut(t)),
          y: lerp(from.target.y, to.target.y, easeInOut(t)),
          z: lerp(from.target.z, to.target.z, easeInOut(t)),
        },
        label: `${from.label} → ${to.label}`,
        roomRef: from.roomRef,
      });
    }
  }

  const last = cameras[cameras.length - 1];
  frames.push({ position: last.position, target: last.target, label: last.label, roomRef: last.roomRef });
  return frames;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
