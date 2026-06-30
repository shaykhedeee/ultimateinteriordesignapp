'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
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

  // Variant notes & Comparison state
  const [variantNotes, setVariantNotes] = useState<Record<string, string>>({});
  const [comparedVariantIds, setComparedVariantIds] = useState<string[]>([]);
  const [selectedSuggestionPreset, setSelectedSuggestionPreset] = useState<string>('living_comfort');

  async function load(projectId?: string, sceneVersionId?: string) {
    const selected = projectId ?? project?.id;
    const activeSceneVersionId = sceneVersionId ?? project?.activeSceneVersionId;
    if (!selected) return;
    const [renderData, cameraData, feedbackData, memoryData, suggestionData] = await Promise.all([
      apiGet<RenderSet[]>(`/projects/${selected}/render-sets`),
      apiGet<WalkthroughCamera[]>(`/projects/${selected}/walkthrough-cameras`),
      apiGet<RenderFeedback[]>(`/projects/${selected}/render-feedback`),
      apiGet<RenderMemory>(`/projects/${selected}/render-memory`),
      apiGet<RenderSuggestion[]>(`/projects/${selected}/render-suggestions?roomRef=room_living_1&variantCount=4`),
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

  async function rejectVariant(variantId: string) {
    const note = variantNotes[variantId] ?? 'Rejected during review session';
    await apiPost(`/render-variants/${variantId}/reject`, { note });
    await load(project?.id, project?.activeSceneVersionId);
  }

  async function shortlistVariant(variantId: string) {
    await apiPost(`/render-variants/${variantId}/shortlist`, {});
    await load(project?.id, project?.activeSceneVersionId);
  }

  async function applySuggestionPreset() {
    if (!project?.activeSceneVersionId || renderSuggestions.length === 0) return;
    // Batch apply suggestions by creating a memory-guided render set
    await apiPost(`/scenes/${project.activeSceneVersionId}/render-sets`, {
      roomRef: 'room_living_1',
      renderTier: 'review',
      variantCount: 2,
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function generateWalkthroughCameras() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/scenes/${project.activeSceneVersionId}/walkthrough-cameras/generate`, {});
    await load(project?.id, project?.activeSceneVersionId);
  }

  function toggleCompare(variantId: string) {
    setComparedVariantIds((current) =>
      current.includes(variantId)
        ? current.filter((id) => id !== variantId)
        : [...current, variantId].slice(-2) // Cap at max 2 compared items
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.renders ? <StaleNotice label="Render outputs are stale because the scene or materials changed." /> : null}
      <div className="workspace3">
        <Panel title="Render Controls">
          <div className="listMock">
            <div className="rowMock">Room: Living Room</div>
            <div className="rowMock">Tier: Review</div>
            
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Suggestion Presets</label>
            <select value={selectedSuggestionPreset} onChange={(e) => setSelectedSuggestionPreset(e.target.value)}>
              <option value="living_comfort">🛋️ Living Room Presets (Warm Accent)</option>
              <option value="kitchen_task">🍳 Kitchen Presets (Bright Task)</option>
              <option value="bedroom_soft">🛏️ Bedroom Presets (Soft Cove)</option>
            </select>

            <button onClick={applySuggestionPreset} style={{ marginTop: 8 }}>Apply Sugggested Variant Set</button>
            <button onClick={createRenderSet}>Create Memory-Guided Render Set</button>
            <button onClick={generateWalkthroughCameras}>Generate Walkthrough Camera Points</button>
            <div className="rowMock">Render memory signals: {renderMemory?.totalSignals ?? 0}</div>
            <div className="rowMock">Auto suggestions loaded: {renderSuggestions.length}</div>
          </div>
        </Panel>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Walkthrough Viewport + Playback">
            <WalkthroughPlaybackPanel scene={scene} cameras={walkthroughCameras} />
          </Panel>

          {/* Side-by-Side Comparison UI */}
          {comparedVariantIds.length === 2 && (
            <Panel title="⚖️ Side-by-Side Variant Comparison">
              <div className="workspaceSplit">
                {comparedVariantIds.map((id) => {
                  const v = renderSets.flatMap((s) => s.variants).find((item) => item.id === id);
                  if (!v) return null;
                  return (
                    <div key={id} className="rowMock" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', padding: 12, borderRadius: 6, background: '#121615' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong>{v.cameraRef}</strong>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: v.approvalStatus === 'approved' ? '#7dbb74' : v.approvalStatus === 'rejected' ? '#ff6f6f' : '#bdc5cd', color: '#0d1110', fontWeight: 600 }}>
                          {v.approvalStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Preset: {v.lightingPresetRef}</div>
                      
                      {/* Simulated Render frame */}
                      <div style={{ height: 160, background: 'linear-gradient(135deg, #101413 0%, #1c2422 100%)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <span style={{ fontSize: 13, color: '#e1bf72', fontStyle: 'italic' }}>Simulated Render Frame</span>
                        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, color: '#888' }}>Scene version 12</div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>Designer comparison notes</label>
                        <input
                          placeholder="Add comments on materials/shading..."
                          value={variantNotes[v.id] ?? ''}
                          onChange={(e) => setVariantNotes({ ...variantNotes, [v.id]: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', background: '#0d1110', border: '1px solid #232927', borderRadius: 4, color: '#f4f0e8', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          <Panel title="Viewer + Variants list">
            <div className="listMock">
              {renderSets.map((set) => (
                <div className="rowMock" key={set.id}>
                  <strong>{set.renderTier.toUpperCase()} TIER</strong> · {set.status}
                  {set.variants.map((variant, vIdx) => {
                    let imageSrc = '/images/tv_unit_render_final.png';
                    if (variant.cameraRef?.includes('kitchen')) {
                      imageSrc = '/images/kitchen_3d_render_final.png';
                    } else if (variant.cameraRef?.includes('mandir')) {
                      imageSrc = '/images/cnc_teak_mandir_1779969965502.png';
                    } else if (variant.cameraRef?.includes('wardrobe')) {
                      imageSrc = '/images/smoked_glass_wardrobe_1779969938746.png';
                    } else {
                      const idx = vIdx % 4;
                      if (idx === 0) imageSrc = '/images/tv_unit_render_final.png';
                      else if (idx === 1) imageSrc = '/images/louvered_walnut_tv_1779969578489.png';
                      else if (idx === 2) imageSrc = '/images/statutario_marble_tv_1779969617129.png';
                      else imageSrc = '/images/crockery_unit_render.png';
                    }

                    return (
                      <div key={variant.id} style={{ marginTop: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-elevated)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <strong style={{ color: 'var(--gold)' }}>{variant.cameraRef}</strong>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: {variant.approvalStatus}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginRight: 8, cursor: 'pointer' }}>
                              <input type="checkbox" checked={comparedVariantIds.includes(variant.id)} onChange={() => toggleCompare(variant.id)} />
                              Compare
                            </label>
                            <button onClick={() => approveVariant(variant.id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#7dbb74', color: '#0d1110', border: 'none', borderRadius: 4 }}>Approve</button>
                            <button onClick={() => shortlistVariant(variant.id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#6fa8ff', color: '#0d1110', border: 'none', borderRadius: 4 }}>Shortlist</button>
                            <button onClick={() => rejectVariant(variant.id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#ff6f6f', color: '#0d1110', border: 'none', borderRadius: 4 }}>Reject</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <img
                            src={imageSrc}
                            alt={`${variant.cameraRef} render variant`}
                            style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              <strong>Lighting Preset:</strong> {variant.lightingPresetRef ?? 'standard lighting'}
                            </div>
                            <input
                              placeholder="Write feedback notes..."
                              value={variantNotes[variant.id] ?? ''}
                              onChange={(e) => setVariantNotes({ ...variantNotes, [variant.id]: e.target.value })}
                              style={{ width: '100%', padding: '4px 8px', background: '#0a0d0c', border: '1px solid #1a2220', borderRadius: 4, color: '#f4f0e8', fontSize: 11 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              <div className="rowMock"><strong>Memory-guided variant suggestion stack (suppression enabled)</strong></div>
              {renderSuggestions.map((item, index) => (
                <div key={`${item.cameraRef}-${item.lightingPresetRef}-${index}`} className="rowMock" style={{ opacity: item.score < 0.4 ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Variant {index + 1} · {item.cameraRef} + {item.lightingPresetRef}</span>
                    <span style={{ fontSize: 11, fontWeight: 'bold', color: item.score < 0.4 ? '#ff6f6f' : '#7dbb74' }}>Score {item.score.toFixed(2)}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{item.reason}</div>
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
                {signal.decision.toUpperCase()} · {signal.roomRef ?? 'project'}
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

  // Walkthrough Maturity States
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [pausePoints, setPausePoints] = useState<Record<string, number>>({});
  const [roomSequence, setRoomSequence] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const rooms = scene?.scene.levels[0]?.rooms ?? [];

  useEffect(() => {
    if (cameras.length > 0 && roomSequence.length === 0) {
      setRoomSequence(cameras.map((c) => c.roomRef));
    }
  }, [cameras, roomSequence]);

  // Sort cameras based on room sequence preferences
  const sortedCameras = useMemo(() => {
    if (roomSequence.length === 0) return cameras;
    return [...cameras].sort((a, b) => {
      const idxA = roomSequence.indexOf(a.roomRef);
      const idxB = roomSequence.indexOf(b.roomRef);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [cameras, roomSequence]);

  const interpolatedFrames = useMemo(() => buildInterpolatedFrames(sortedCameras, 12), [sortedCameras]);
  const fixedFrames = useMemo(
    () => sortedCameras.map((camera) => ({ position: camera.position, target: camera.target, label: camera.label, roomRef: camera.roomRef, id: camera.id })),
    [sortedCameras]
  );
  
  const activeFrames = mode === 'interpolated' ? interpolatedFrames : fixedFrames;

  useEffect(() => {
    if (!isPlaying || activeFrames.length <= 1) return;
    
    // Calculate speed delay (base 200ms for interpolated, 2000ms for fixed, scaled by speed multiplier)
    const baseDelay = mode === 'interpolated' ? 200 : 2200;
    const finalDelay = Math.max(50, baseDelay / speedMultiplier);

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % activeFrames.length);
    }, finalDelay);
    
    return () => window.clearInterval(timer);
  }, [isPlaying, activeFrames, mode, speedMultiplier]);

  useEffect(() => {
    if (index >= activeFrames.length) setIndex(0);
  }, [activeFrames.length, index]);

  const current = activeFrames[index] ?? null;

  async function handleExportVideo() {
    setIsExporting(true);
    // Trigger mock background job for render walkthrough MP4
    await new Promise((r) => setTimeout(r, 2000));
    setIsExporting(false);
    alert('Mock Walkthrough Video successfully exported to procurement handoff pack!');
  }

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

  function shiftRoomSequence(idx: number, dir: 'up' | 'down') {
    const next = [...roomSequence];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setRoomSequence(next);
  }

  return (
    <div className="listMock">
      <div className="canvasMock" style={{ minHeight: 280 }}>
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

          {sortedCameras.map((camera, cameraIndex) => (
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" onClick={() => setMode('fixed')} style={{ backgroundColor: mode === 'fixed' ? '#4d7ec2' : 'transparent', color: '#f4f0e8' }}>Fixed Viewpoints</button>
          <button type="button" onClick={() => setMode('interpolated')} style={{ backgroundColor: mode === 'interpolated' ? '#4d7ec2' : 'transparent', color: '#f4f0e8' }}>Interpolated Path</button>
          <button type="button" onClick={() => setIndex((currentIndex) => Math.max(currentIndex - 1, 0))}>Prev</button>
          <button type="button" onClick={() => setIsPlaying((currentValue) => !currentValue)} style={{ backgroundColor: isPlaying ? '#e1bf72' : '#232927', color: isPlaying ? '#0d1110' : '#f4f0e8', fontWeight: 'bold' }}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play Walkthrough'}
          </button>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex + 1) % Math.max(activeFrames.length, 1))}>Next</button>
          <button type="button" onClick={handleExportVideo} disabled={isExporting} style={{ border: '1px solid #7dbb74', color: '#7dbb74', backgroundColor: 'transparent' }}>
            {isExporting ? 'Exporting...' : '🎥 Export Walkthrough MP4'}
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0 0', display: 'flex', gap: 16 }}>
        {/* Playback Settings */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#f4f0e8', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Speed Multiplier ({speedMultiplier}x)
            <input type="range" min="1" max="10" step="1" value={speedMultiplier} onChange={(e) => setSpeedMultiplier(Number(e.target.value))} />
          </label>
          {mode === 'fixed' && current && 'id' in current && (
            <label style={{ fontSize: 13, color: '#f4f0e8', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Pause at this waypoint (seconds)
              <input
                type="number"
                min="0"
                max="10"
                value={pausePoints[current.id as string] ?? 0}
                onChange={(e) => setPausePoints({ ...pausePoints, [current.id as string]: Number(e.target.value) })}
                style={{ width: '100px', padding: '4px 6px', background: '#0d1110', border: '1px solid #232927', color: '#f4f0e8', borderRadius: 4 }}
              />
            </label>
          )}
        </div>

        {/* Room routing sequence list */}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, color: '#888' }}>Room Path routing Sequence</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {roomSequence.map((ref, idx) => (
              <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121615', border: '1px solid rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                <span>{ref}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => shiftRoomSequence(idx, 'up')} disabled={idx === 0} style={{ padding: '2px 6px', fontSize: 10 }}>▲</button>
                  <button type="button" onClick={() => shiftRoomSequence(idx, 'down')} disabled={idx === roomSequence.length - 1} style={{ padding: '2px 6px', fontSize: 10 }}>▼</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rowMock" style={{ marginTop: 8 }}>
        <strong>{current?.label ?? 'No camera points yet'}</strong>
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {current ? `Position: ${Math.round(current.position.x)}, ${Math.round(current.position.y)}, ${Math.round(current.position.z)} · Target: ${Math.round(current.target.x)}, ${Math.round(current.target.y)}, ${Math.round(current.target.z)}` : 'Generate walkthrough camera points from your scene rooms.'}
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
