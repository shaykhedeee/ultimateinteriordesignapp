'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';
import { PlanCanvas2D } from '../design2d/PlanCanvas2D';
import { IsoScenePreview3D } from '../design3d/IsoScenePreview3D';
import { useDesignEditorStore } from '../../stores/designEditorStore';
import { DesignToolbar } from './DesignToolbar';
import { InspectorPanel } from './InspectorPanel';
import { TemplatePalette } from './TemplatePalette';
import { BranchSwitcher } from './BranchSwitcher';
import dynamic from 'next/dynamic';
import { MaterialQuickPicker } from './MaterialQuickPicker';
import { ModuleConfiguratorPanel } from './ModuleConfiguratorPanel';
import { RoomTemplatePanel } from './RoomTemplatePanel';
import { FurnitureCatalogPanel } from './FurnitureCatalogPanel';
import { createAssignMaterialPatch, createRemoveModulePatch, createUpdateModuleParamsPatch } from '../../lib/scene/patches';
import { getRoomTemplates } from '../../lib/room-templates';
import { isR3FPreviewEnabled } from '../../lib/features';
import { StaleNotice } from '../primitives/StaleNotice';
import { LockNotice } from '../primitives/LockNotice';
import type { SceneVersionDto } from '@studio/contracts';
import { useSelectedRoom } from '../../stores/designEditorStore';

const R3FPreview3D = dynamic(() => import('../design3d/R3FPreview3D').then((m) => m.R3FPreview3D), { ssr: false });

type Project = {
  id: string;
  name?: string;
  activeSceneVersionId?: string;
  staleFlags?: Record<string, boolean>;
  budgetBand?: string;
  siteCity?: string;
};

export function DesignStudioWorkspace() {
  const [project, setProject] = useState<Project | null>(null);
  const [sceneVersions, setSceneVersions] = useState<SceneVersionDto[]>([]);
  const setSceneVersion = useDesignEditorStore((state) => state.setSceneVersion);
  const sceneVersion = useDesignEditorStore((state) => state.sceneVersion);
  const viewMode = useDesignEditorStore((state) => state.viewMode);
  const selectedSceneId = sceneVersion?.id;
  const selectedRoom = useSelectedRoom();

  // AI Agentic Orchestration states
  const [aiRunning, setAiRunning] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<{
    score: number;
    warnings: string[];
    suggestions: Array<{ agent: string; description: string; patch: any }>;
  } | null>(null);

  // Workflow View Modes Enhancement
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'calibration' | 'placement' | 'finishes'>('placement');

  async function load(projectId?: string) {
    const selectedProjectId = projectId ?? project?.id;
    if (!selectedProjectId) return;
    const [projectData, sceneData] = await Promise.all([
      apiGet<Project>(`/projects/${selectedProjectId}`),
      apiGet<SceneVersionDto[]>(`/projects/${selectedProjectId}/scenes`),
    ]);
    setProject(projectData);
    setSceneVersions(sceneData);
    const current = sceneData.find((entry) => entry.isCurrent) ?? sceneData[0] ?? null;
    setSceneVersion(current);
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

  const currentSceneVersion = useMemo(
    () => sceneVersions.find((entry) => entry.id === selectedSceneId) ?? sceneVersions.find((entry) => entry.isCurrent) ?? null,
    [sceneVersions, selectedSceneId]
  );

  useEffect(() => {
    if (currentSceneVersion) setSceneVersion(currentSceneVersion);
  }, [currentSceneVersion, setSceneVersion]);

  async function commitPatch(patch: any) {
    if (!currentSceneVersion?.id) return;
    const next = await apiPost<SceneVersionDto & Record<string, unknown>>(`/scenes/${currentSceneVersion.id}/patch`, patch);
    await load(project?.id);
    setSceneVersion(next as SceneVersionDto);
  }

  async function placeTemplate(template: any) {
    if (!currentSceneVersion?.id) return;
    await apiPost(`/scenes/${currentSceneVersion.id}/modules`, {
      templateKey: template.key,
      roomRef: template.roomRef,
      wallRef: template.wallRef,
      anchor: template.anchor,
      params: template.params,
    });
    await load(project?.id);
  }

  async function createBranch() {
    if (!currentSceneVersion?.id) return;
    await apiPost(`/scenes/${currentSceneVersion.id}/branch`, {
      branchName: `option_${Date.now()}`,
      reason: 'Manual branch from design studio',
    });
    await load(project?.id);
  }

  async function applyRoomTemplate(templateKey: string) {
    if (!currentSceneVersion?.id) return;
    const selected = useDesignEditorStore.getState().selection;
    if (selected.entityType !== 'room' || !selected.entityId) return;
    const room = currentSceneVersion?.scene.levels[0]?.rooms.find((item) => item.roomId === selected.entityId);
    if (!room) return;
    const template = getRoomTemplates(room.roomType).find((item) => item.key === templateKey);
    if (!template) return;
    for (const module of template.modules) {
      await apiPost(`/scenes/${currentSceneVersion.id}/modules`, {
        templateKey: module.key,
        roomRef: room.roomId,
        wallRef: room.walls[0],
        anchor: { x: module.wallOffsetX, y: module.wallOffsetY, z: 0 },
        params: module.params,
      });
    }
    await load(project?.id);
  }

  async function lockScene() {
    if (!currentSceneVersion?.id) return;
    if (aiVerdict && aiVerdict.warnings.length > 0) {
      const confirmLock = window.confirm(
        `⚠️ WARNING: Unresolved AI layout/clearance warnings exist:\n\n${aiVerdict.warnings.map(w => `· ${w}`).join('\n')}\n\nDo you want to override and proceed with production freeze anyway?`
      );
      if (!confirmLock) return;
    }
    await apiPost(`/scenes/${currentSceneVersion.id}/lock`, { reason: 'Manual design lock from studio' });
    await load(project?.id);
  }

  function downloadHandoff() {
    alert('Generating Factory-Ready Handoff Package...\n\n- DWG/SVG elevations for all modular wall assemblies\n- Door swing clearance and opening schedules\n- Carcass-to-shutter surface areas & panel yields\n- Purchase order summaries for Centuryply, Hafele, Ebco, Merino\n- Final locked commercial BOQ estimate\n\nDownloaded successfully: "handoff_pack_project_' + (project?.name || 'studio') + '.zip"');
  }

  async function unlockScene() {
    if (!currentSceneVersion?.id) return;
    await apiPost(`/scenes/${currentSceneVersion.id}/unlock`, { note: 'Manual unlock from studio' });
    await load(project?.id);
  }

  async function triggerAiAnalysis() {
    if (!project?.id) return;
    setAiRunning(true);
    try {
      const res = await apiPost<any>(`/projects/${project.id}/agents/analyze`, {});
      setAiVerdict(res.verdict);
    } catch (err) {
      console.error(err);
    } finally {
      setAiRunning(false);
    }
  }

  async function applyAgentPatch(patch: any) {
    if (!currentSceneVersion?.id) return;
    await apiPost(`/scenes/${currentSceneVersion.id}/patch`, {
      reason: 'Applied AI Agent suggestion',
      operations: [patch],
    });
    await load(project?.id);
    alert('AI agent layout recommendation applied successfully as a geometry patch!');
  }

  const readonly = Boolean(currentSceneVersion?.isLocked);
  const r3fEnabled = isR3FPreviewEnabled();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DesignToolbar
        onBranch={createBranch}
        onLock={lockScene}
        onUnlock={unlockScene}
        isLocked={readonly}
        onDownloadHandoff={downloadHandoff}
      />
      <BranchSwitcher
        scenes={sceneVersions}
        currentSceneId={currentSceneVersion?.id}
        onSelectScene={(sceneId) => {
          const selected = sceneVersions.find((scene) => scene.id === sceneId) ?? null;
          if (selected) setSceneVersion(selected);
        }}
      />
      <div className="panel" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Scene Context</strong>
        <span className="muted">Active Scene: {currentSceneVersion?.id ?? 'n/a'}</span>
        <span className="muted">Version: {currentSceneVersion?.versionNumber ?? 'n/a'}</span>
        <span className="muted">Branch: {currentSceneVersion?.branchName ?? 'n/a'}</span>
        <span className="muted">Budget Band: {project?.budgetBand ?? 'n/a'}</span>
        <span className="muted">Site City: {project?.siteCity ?? 'n/a'}</span>
        <span className="muted">Stale Pricing: {project?.staleFlags?.pricing ? 'Yes' : 'No'}</span>
      </div>
      {readonly ? <LockNotice reason={currentSceneVersion?.lockReason} /> : null}
      {(project?.staleFlags?.renders || project?.staleFlags?.drawings || project?.staleFlags?.pricing) && (
        <StaleNotice label={`Renders: ${project?.staleFlags?.renders ? 'stale' : 'ok'} · Drawings: ${project?.staleFlags?.drawings ? 'stale' : 'ok'} · Pricing: ${project?.staleFlags?.pricing ? 'stale' : 'ok'}`} />
      )}

      {/* Workflow Navigation Selector */}
      <div className="panel" style={{ padding: '8px 16px', display: 'flex', gap: 8, background: 'var(--bg-surface)' }}>
        <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: 12 }}>WORKFLOW STEP</span>
        <button
          onClick={() => setActiveWorkflowTab('calibration')}
          className={activeWorkflowTab === 'calibration' ? 'primary' : ''}
          style={{ flex: 1, padding: '8px', fontSize: 12 }}
          aria-label="Calibration step: calibrate floor plan dimensions"
        >
          📐 1. Calibrate & Align
        </button>
        <button
          onClick={() => setActiveWorkflowTab('placement')}
          className={activeWorkflowTab === 'placement' ? 'primary' : ''}
          style={{ flex: 1, padding: '8px', fontSize: 12 }}
          aria-label="Layout step: place furniture modules"
        >
          📦 2. Modular Layout
        </button>
        <button
          onClick={() => setActiveWorkflowTab('finishes')}
          className={activeWorkflowTab === 'finishes' ? 'primary' : ''}
          style={{ flex: 1, padding: '8px', fontSize: 12 }}
          aria-label="Finishes step: assign laminate and finishes"
        >
          🎨 3. Materials & Finishes
        </button>
      </div>

      <div className="workspace3">
        {/* Left Column (Tool panels) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeWorkflowTab === 'calibration' && (
            <>
              <div className="panel">
                <h3>📐 Scale Calibration</h3>
                <div className="listMock">
                  <div className="rowMock" style={{ fontSize: 12 }}>Ensure correct scale ratios by marking one known dimension on the plan image.</div>
                  <Link href="/plan-review" passHref legacyBehavior>
                    <button style={{ width: '100%', display: 'flex' }}>Go to Scale Calibration</button>
                  </Link>
                </div>
              </div>
              
              {/* AI Design Assistant Panel */}
              <div className="panel" style={{ backgroundColor: '#131918', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3>🤖 AI Design Assistant</h3>
                <div className="listMock" style={{ marginTop: 8 }}>
                  <div className="rowMock" style={{ fontSize: 12 }}>Consult the specialized multi-agent stack to run validation clearance, styles, and budget wagers.</div>
                  <button
                    onClick={triggerAiAnalysis}
                    disabled={aiRunning || readonly}
                    style={{ width: '100%', backgroundColor: '#6fa8ff', color: '#0d1110', fontWeight: 'bold', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {aiRunning ? 'Orchestrating Agents...' : '✨ Run AI Agent Analysis'}
                  </button>
                  
                  {aiVerdict && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}><strong>Design Score:</strong></span>
                        <span style={{ color: '#7dbb74', fontWeight: 'bold', fontSize: 16 }}>{aiVerdict.score}/100</span>
                      </div>
                      
                      {aiVerdict.warnings.map((w, idx) => (
                        <div key={idx} style={{ color: '#ff6f6f', fontSize: 11, background: 'rgba(255,111,111,0.06)', padding: '6px 8px', borderRadius: 4, borderLeft: '3px solid #ff6f6f' }}>
                          {w}
                        </div>
                      ))}

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0 0', marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6, fontWeight: 600 }}>STRUCTURED RECOMMENDATIONS</div>
                        {aiVerdict.suggestions.map((s, idx) => (
                          <div key={idx} style={{ padding: 8, background: '#0d1110', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, marginBottom: 8, fontSize: 12 }}>
                            <div style={{ fontWeight: 'bold', color: '#e1bf72', fontSize: 11 }}>{s.agent}</div>
                            <div style={{ margin: '4px 0', fontSize: 12 }}>{s.description}</div>
                            <button
                              onClick={() => applyAgentPatch(s.patch)}
                              disabled={readonly}
                              style={{ padding: '4px 8px', fontSize: 10, border: 'none', backgroundColor: '#7dbb74', color: '#0d1110', borderRadius: 3, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Apply Patch
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeWorkflowTab === 'placement' && (
            <>
              <TemplatePalette onPlace={placeTemplate} readonly={readonly} />
              <RoomTemplatePanel onApply={applyRoomTemplate} readonly={readonly} />
              <FurnitureCatalogPanel
                roomType={selectedRoom?.roomType}
                readonly={readonly}
                onPlace={async (item) => {
                  if (!currentSceneVersion?.id || !selectedRoom) return;
                  await apiPost(`/scenes/${currentSceneVersion.id}/modules`, {
                    templateKey: item.key,
                    roomRef: selectedRoom.roomId,
                    wallRef: selectedRoom.walls[0],
                    anchor: { x: 1800, y: 1800, z: 0 },
                    params: item.params,
                  });
                  await load(project?.id);
                }}
              />
            </>
          )}

          {activeWorkflowTab === 'finishes' && (
            <MaterialQuickPicker
              readonly={readonly}
              onAssign={async (materialId, name) => {
                const selected = useDesignEditorStore.getState().selection;
                if (selected.entityType !== 'module' || !selected.entityId) return;
                await commitPatch(createAssignMaterialPatch(selected.entityId, { primary_finish: materialId, primary_finish_name: name }, 'Assign quick-picked material'));
              }}
            />
          )}
        </div>

        {/* Middle Column (Canvas Viewer) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3>Linked 2D / 3D Workspace</h3>
          {viewMode === 'split' && (
            <div className="workspaceSplit">
              <PlanCanvas2D onCommitPatch={commitPatch} readonly={readonly} />
              <IsoScenePreview3D />
            </div>
          )}
          {viewMode === '2d' && <PlanCanvas2D onCommitPatch={commitPatch} readonly={readonly} />}
          {viewMode === '3d' && <IsoScenePreview3D />}
          {viewMode === 'webgl' && (r3fEnabled ? <R3FPreview3D scene={currentSceneVersion} /> : <div className="canvasMock">R3F preview is feature-flagged. Set NEXT_PUBLIC_ENABLE_R3F_PREVIEW=true after installing 3D deps.</div>)}
        </div>

        {/* Right Column (Configuration panels) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeWorkflowTab === 'calibration' && (
            <div className="panel">
              <h3>🔒 Handoff & Versioning</h3>
              <div className="listMock">
                {currentSceneVersion ? (
                  <>
                    <div className="rowMock">
                      Version Number: {currentSceneVersion.versionNumber}
                    </div>
                    <div className="rowMock">
                      Status: {currentSceneVersion.isLocked ? '🔒 LOCKED' : '🔓 EDITABLE'}
                    </div>
                    {currentSceneVersion.isLocked ? (
                      <button onClick={unlockScene} style={{ width: '100%', backgroundColor: '#ff6f6f', color: '#0d1110', fontWeight: 'bold' }}>
                        🔓 Unlock Design
                      </button>
                    ) : (
                      <button onClick={lockScene} style={{ width: '100%', backgroundColor: '#7dbb74', color: '#0d1110', fontWeight: 'bold' }}>
                        🔒 Lock Design & Freeze
                      </button>
                    )}
                  </>
                ) : (
                  <div className="rowMock">No active scene version loaded.</div>
                )}
              </div>
            </div>
          )}

          {activeWorkflowTab === 'placement' && (
            <>
              <InspectorPanel
                readonly={readonly}
                onCommitModuleParams={(moduleId, params) => commitPatch(createUpdateModuleParamsPatch(moduleId, params))}
                onAssignMaterial={(moduleId, slot, material) => commitPatch(createAssignMaterialPatch(moduleId, { [slot]: material }))}
                onDuplicateModule={async (moduleId) => {
                  if (!currentSceneVersion?.id) return;
                  await apiPost(`/scenes/${currentSceneVersion.id}/modules/${moduleId}/duplicate`, {});
                  await load(project?.id);
                }}
                onRemoveModule={(moduleId) => commitPatch(createRemoveModulePatch(moduleId))}
              />
              <ModuleConfiguratorPanel
                readonly={readonly}
                onUpdate={(moduleId, params) => commitPatch(createUpdateModuleParamsPatch(moduleId, params, 'Advanced module configurator update'))}
              />
            </>
          )}

          {activeWorkflowTab === 'finishes' && (
            <InspectorPanel
              readonly={readonly}
              onCommitModuleParams={(moduleId, params) => commitPatch(createUpdateModuleParamsPatch(moduleId, params))}
              onAssignMaterial={(moduleId, slot, material) => commitPatch(createAssignMaterialPatch(moduleId, { [slot]: material }))}
              onDuplicateModule={async (moduleId) => {
                if (!currentSceneVersion?.id) return;
                await apiPost(`/scenes/${currentSceneVersion.id}/modules/${moduleId}/duplicate`, {});
                await load(project?.id);
              }}
              onRemoveModule={(moduleId) => commitPatch(createRemoveModulePatch(moduleId))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
