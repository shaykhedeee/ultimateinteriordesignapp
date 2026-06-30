import type {
  ApprovalDecisionRequestDto,
  CreateApprovalPackageRequestDto,
  CreateDrawingSetRequestDto,
  CreateProposalSetRequestDto,
  CreateRenderSetRequestDto,
  DrawingSetDto,
  RenderSet,
  UUID,
} from '@studio/contracts';
import { mockStore, type ApprovalPackageRecord, type ProposalRecord } from '../../lib/mock-store';
import { logTimelineEvent } from '../../lib/timeline';

export class MockOutputsRepository {
  listRenderSets(projectId: UUID) {
    return mockStore.renderSets.filter((set) => set.projectId === projectId);
  }

  getSuggestedRenderVariants(projectId: UUID, roomRef?: string, variantCount = 3) {
    const memory = this.getRenderMemorySummary(projectId);
    const roomMemory = memory.roomMemory.find((item) => item.roomRef === roomRef);

    const fallbackCameras = roomRef?.includes('living')
      ? ['cam_living_diag_01', 'cam_living_elev_01', 'cam_living_feature_01']
      : roomRef?.includes('bed')
        ? ['cam_bed_corner_01', 'cam_bed_elev_01', 'cam_bed_window_01']
        : ['cam_room_diag_01', 'cam_room_elev_01', 'cam_room_detail_01'];

    const fallbackLighting = roomRef?.includes('living')
      ? ['evening_warm_01', 'day_soft_01', 'accent_lux_01']
      : roomRef?.includes('bed')
        ? ['night_warm_01', 'day_soft_01', 'soft_cove_01']
        : ['day_soft_01', 'evening_warm_01', 'balanced_neutral_01'];

    const topCameras = memory.topCameras.map((item) => item.cameraRef);
    const topLighting = memory.topLightingPresets.map((item) => item.lightingPresetRef);

    const cameras = Array.from(new Set([...topCameras, ...fallbackCameras])).slice(0, variantCount);
    const lighting = Array.from(new Set([...topLighting, ...fallbackLighting])).slice(0, variantCount);

    return Array.from({ length: variantCount }, (_, index) => ({
      cameraRef: cameras[index] ?? fallbackCameras[index % fallbackCameras.length],
      lightingPresetRef: lighting[index] ?? fallbackLighting[index % fallbackLighting.length],
      score: Math.min(0.99, Math.max(0.55, 0.92 - index * 0.11 + (roomMemory?.approved ?? 0) * 0.03)),
      reason:
        memory.totalSignals > 0
          ? `Ranked from prior ${memory.totalSignals} signal(s) with ${memory.approvals} approvals.`
          : 'Fallback recommendation because no render memory exists yet.',
      roomRef,
    }));
  }

  createRenderSet(projectId: UUID, sceneVersionId: UUID, input: CreateRenderSetRequestDto): RenderSet {
    const suggestions = this.getSuggestedRenderVariants(projectId, input.roomRef, input.variantCount);
    const record: RenderSet = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId,
      roomRef: input.roomRef,
      renderTier: input.renderTier,
      status: 'queued',
      variants: Array.from({ length: input.variantCount }, (_, index) => ({
        id: crypto.randomUUID(),
        cameraRef: suggestions[index]?.cameraRef ?? `camera_${index + 1}`,
        lightingPresetRef: suggestions[index]?.lightingPresetRef ?? `lighting_${index + 1}`,
        approvalStatus: 'pending',
      })),
    };
    mockStore.renderSets.unshift(record);
    logTimelineEvent(projectId, 'render_set.created', 'Render set created', `${record.renderTier} render set created for ${record.roomRef ?? 'project'}`);
    return record;
  }

  approveRenderVariant(variantId: UUID) {
    for (const set of mockStore.renderSets) {
      const variant = set.variants.find((item) => item.id === variantId);
      if (variant) {
        variant.approvalStatus = 'approved';
        mockStore.renderFeedbacks.unshift({
          id: crypto.randomUUID(),
          projectId: set.projectId,
          renderSetId: set.id,
          variantId: variant.id,
          roomRef: set.roomRef,
          decision: 'approved',
          note: 'Approved by designer/client',
          preferenceSignals: { cameraRef: variant.cameraRef, lightingPresetRef: variant.lightingPresetRef },
          createdAt: new Date().toISOString(),
        });
        logTimelineEvent(set.projectId, 'render_variant.approved', 'Render variant approved', `${variant.cameraRef} approved`);
        return variant;
      }
    }
    return null;
  }

  listRenderFeedback(projectId: UUID) {
    return mockStore.renderFeedbacks.filter((item) => item.projectId === projectId);
  }

  getRenderMemorySummary(projectId: UUID) {
    const feedback = this.listRenderFeedback(projectId);
    const renderSets = this.listRenderSets(projectId);
    const variantIndex = new Map<string, { cameraRef: string; lightingPresetRef: string; roomRef?: string }>(
      renderSets.flatMap((set) =>
        set.variants.map(
          (variant) =>
            [
              variant.id,
              {
                cameraRef: variant.cameraRef,
                lightingPresetRef: variant.lightingPresetRef,
                roomRef: set.roomRef,
              },
            ] as [string, { cameraRef: string; lightingPresetRef: string; roomRef?: string }]
        )
      )
    );

    const cameraCounts = new Map<string, number>();
    const lightingCounts = new Map<string, number>();
    const roomCounts = new Map<string, { approved: number; shortlisted: number; rejected: number }>();

    for (const event of feedback) {
      const variant = event.variantId ? variantIndex.get(event.variantId) : undefined;
      const cameraRef = String(event.preferenceSignals?.cameraRef ?? variant?.cameraRef ?? 'unknown_camera');
      const lightingPresetRef = String(event.preferenceSignals?.lightingPresetRef ?? variant?.lightingPresetRef ?? 'unknown_lighting');
      const roomRef = event.roomRef ?? variant?.roomRef ?? 'unassigned_room';

      cameraCounts.set(cameraRef, (cameraCounts.get(cameraRef) ?? 0) + 1);
      lightingCounts.set(lightingPresetRef, (lightingCounts.get(lightingPresetRef) ?? 0) + 1);

      const roomBucket = roomCounts.get(roomRef) ?? { approved: 0, shortlisted: 0, rejected: 0 };
      if (event.decision === 'approved') roomBucket.approved += 1;
      if (event.decision === 'shortlisted') roomBucket.shortlisted += 1;
      if (event.decision === 'rejected') roomBucket.rejected += 1;
      roomCounts.set(roomRef, roomBucket);
    }

    const sortCounts = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
      totalSignals: feedback.length,
      approvals: feedback.filter((item) => item.decision === 'approved').length,
      shortlisted: feedback.filter((item) => item.decision === 'shortlisted').length,
      rejected: feedback.filter((item) => item.decision === 'rejected').length,
      topCameras: sortCounts(cameraCounts).map((item) => ({ cameraRef: item.key, count: item.count })),
      topLightingPresets: sortCounts(lightingCounts).map((item) => ({ lightingPresetRef: item.key, count: item.count })),
      roomMemory: Array.from(roomCounts.entries()).map(([roomRef, counts]) => ({ roomRef, ...counts })),
      lastSignals: feedback.slice(0, 6),
    };
  }

  listWalkthroughCameras(projectId: UUID) {
    return mockStore.walkthroughCameras.filter((camera) => camera.projectId === projectId);
  }

  generateWalkthroughCameras(projectId: UUID, sceneVersionId: UUID, rooms: Array<{ roomId: string; name: string; polygon2d: Array<{ x: number; y: number }>; heightMm: number }>) {
    const generated = rooms.map((room) => {
      const xs = room.polygon2d.map((p) => p.x);
      const ys = room.polygon2d.map((p) => p.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      return {
        id: crypto.randomUUID(),
        projectId,
        sceneVersionId,
        roomRef: room.roomId,
        label: `${room.name} Fixed Walkthrough View`,
        position: { x: centerX, y: Math.max(...ys) - 300, z: Math.min(room.heightMm * 0.5, 1600) },
        target: { x: centerX, y: centerY, z: Math.min(room.heightMm * 0.4, 1200) },
        createdAt: new Date().toISOString(),
      };
    });
    mockStore.walkthroughCameras = [
      ...mockStore.walkthroughCameras.filter((camera) => !(camera.projectId === projectId && camera.sceneVersionId === sceneVersionId)),
      ...generated,
    ];
    logTimelineEvent(projectId, 'walkthrough.generated', 'Walkthrough camera points generated', `${generated.length} room camera points generated`);
    return generated;
  }

  listDrawingSets(projectId: UUID) {
    return mockStore.drawingSets.filter((set) => set.projectId === projectId);
  }

  createDrawingSet(projectId: UUID, sceneVersionId: UUID, input: CreateDrawingSetRequestDto): DrawingSetDto {
    const outputs = input.include.map((kind) => ({
      id: crypto.randomUUID(),
      drawingType: kind === 'elevations' ? 'elevation' : kind,
      roomRef: input.roomRefs?.[0],
    })) as DrawingSetDto['outputs'];

    const record: DrawingSetDto = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId,
      drawingScope: input.drawingScope,
      status: 'queued',
      outputs,
    };

    mockStore.drawingSets.unshift(record);
    logTimelineEvent(projectId, 'drawing_set.created', 'Drawing set created', `${record.drawingScope} drawing set created`);
    return record;
  }

  listProposals(projectId: UUID) {
    return mockStore.proposals.filter((proposal) => proposal.projectId === projectId);
  }

  createProposal(projectId: UUID, input: CreateProposalSetRequestDto): ProposalRecord {
    const record: ProposalRecord = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId: input.sceneVersionId,
      versionNumber: this.listProposals(projectId).reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1,
      status: 'draft',
      renderSetId: input.renderSetId,
      drawingSetId: input.drawingSetId,
      pricingSetId: input.pricingSetId,
    };
    mockStore.proposals.unshift(record);
    logTimelineEvent(projectId, 'proposal.created', 'Proposal package created', `Proposal v${record.versionNumber} created`);
    return record;
  }

  listApprovalPackages(projectId: UUID) {
    return mockStore.approvalPackages.filter((approval) => approval.projectId === projectId);
  }

  createApprovalPackage(projectId: UUID, input: CreateApprovalPackageRequestDto): ApprovalPackageRecord {
    const record: ApprovalPackageRecord = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId: input.sceneVersionId,
      packageType: input.packageType,
      status: 'pending',
      proposalSetId: input.proposalSetId,
      renderSetId: input.renderSetId,
      drawingSetId: input.drawingSetId,
      pricingSetId: input.pricingSetId,
    };
    mockStore.approvalPackages.unshift(record);
    logTimelineEvent(projectId, 'approval_package.created', 'Approval package created', `${record.packageType} package created`);
    return record;
  }

  decideApproval(approvalPackageId: UUID, input: ApprovalDecisionRequestDto) {
    const record = mockStore.approvalPackages.find((pkg) => pkg.id === approvalPackageId);
    if (!record) return null;
    record.status = input.decision === 'approved' ? 'approved' : 'rejected';
    record.approvedByClientName = input.approvedByName;
    record.comments = input.comments;
    logTimelineEvent(record.projectId, 'approval_package.decided', `Approval ${record.status}`, input.comments);
    return record;
  }
}

export const mockOutputsRepository = new MockOutputsRepository();
