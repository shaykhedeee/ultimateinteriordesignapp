'use client';

import { useEffect, useMemo, useState } from 'react';
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
    await apiPost(`/scenes/${currentSceneVersion.id}/lock`, { reason: 'Manual design lock from studio' });
    await load(project?.id);
  }

  async function unlockScene() {
    if (!currentSceneVersion?.id) return;
    await apiPost(`/scenes/${currentSceneVersion.id}/unlock`, { note: 'Manual unlock from studio' });
    await load(project?.id);
  }

  const readonly = Boolean(currentSceneVersion?.isLocked);
  const r3fEnabled = isR3FPreviewEnabled();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DesignToolbar onBranch={createBranch} onLock={lockScene} onUnlock={unlockScene} isLocked={readonly} />
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

      <div className="workspace3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        </div>

        <div className="panel">
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <MaterialQuickPicker
            readonly={readonly}
            onAssign={async (materialId, name) => {
              const selected = useDesignEditorStore.getState().selection;
              if (selected.entityType !== 'module' || !selected.entityId) return;
              await commitPatch(createAssignMaterialPatch(selected.entityId, { primary_finish: materialId, primary_finish_name: name }, 'Assign quick-picked material'));
            }}
          />
        </div>
      </div>
    </div>
  );
}
