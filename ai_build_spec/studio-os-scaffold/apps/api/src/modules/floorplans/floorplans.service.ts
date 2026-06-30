import type { InterpretFloorPlanRequestDto, ReviewFloorPlanRequestDto, UUID } from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';
import { mockFloorPlansRepository } from '../../repositories/mock/floorplans.repository';

export class FloorPlansService {
  async interpret(projectId: UUID, input: InterpretFloorPlanRequestDto) {
    const version = mockFloorPlansRepository.create(projectId, input.sourceAssetId, input.mode);
    const jobId = crypto.randomUUID();
    mockStore.jobs.unshift({
      id: jobId,
      jobType: 'floor_plan_interpretation',
      status: 'queued',
      progress: 0,
      projectId,
      sourceEntityType: 'floor_plan_version',
      sourceEntityId: version.id,
      createdAt: new Date().toISOString(),
    });
    return {
      jobId,
      status: 'queued',
      projectId,
      floorPlanVersionId: version.id,
      sourceAssetId: input.sourceAssetId,
      mode: input.mode,
    };
  }

  async listVersions(projectId: UUID) {
    return mockFloorPlansRepository.list(projectId);
  }

  async review(versionId: UUID, input: ReviewFloorPlanRequestDto) {
    return mockFloorPlansRepository.review(versionId, {
      acceptRemainingHighConfidence: input.acceptRemainingHighConfidence ?? false,
      corrections: input.corrections,
    });
  }

  async attachSource(versionId: UUID, input: { assetName: string; imageDataUrl: string; widthPx: number; heightPx: number }) {
    return mockFloorPlansRepository.attachSource(versionId, input);
  }

  async saveOverlay(
    versionId: UUID,
    input: {
      calibrationPoints: Array<{ x: number; y: number }>;
      markers: Array<{ id: string; markerType: 'room' | 'module' | 'reference'; x: number; y: number; label: string; color: string }>;
    }
  ) {
    return mockFloorPlansRepository.saveOverlay(versionId, input);
  }

  async calibrate(versionId: UUID, input: { referenceName: string; knownDistanceMm: number; pixelDistance: number }) {
    return mockFloorPlansRepository.calibrate(versionId, input);
  }

  async annotate(
    versionId: UUID,
    input: {
      rooms: Array<{ roomRef: string; roomType: string; label: string }>;
      modules: Array<{ moduleType: string; roomRef: string; wallRef?: string; note?: string }>;
      references: Array<{ roomRef: string; imageLabel: string; styleNote?: string }>;
    }
  ) {
    return mockFloorPlansRepository.annotate(versionId, input);
  }

  async finalize(versionId: UUID) {
    return {
      id: crypto.randomUUID(),
      sourceFloorPlanVersionId: versionId,
      versionNumber: 1,
      isCurrent: true,
      model: { units: 'mm', levels: [], adjacency: [] },
    };
  }
}

export const floorPlansService = new FloorPlansService();
