import type { UUID } from '@studio/contracts';

type FloorPlanReviewStatus = 'draft' | 'review_required' | 'approved' | 'superseded';

export interface FloorPlanVersionRecord {
  id: UUID;
  projectId: UUID;
  sourceAssetId?: UUID;
  versionNumber: number;
  isCurrent: boolean;
  interpretationStatus: FloorPlanReviewStatus;
  overallConfidence: number;
  interpretation: Record<string, unknown>;
  reviewed: Record<string, unknown>;
  source?: {
    assetName: string;
    imageDataUrl: string;
    widthPx: number;
    heightPx: number;
    uploadedAt: string;
  };
  overlay?: {
    calibrationPoints: Array<{ x: number; y: number }>;
    markers: Array<{ id: string; markerType: 'room' | 'module' | 'reference'; x: number; y: number; label: string; color: string }>;
    updatedAt: string;
  };
  calibration?: {
    referenceName: string;
    knownDistanceMm: number;
    pixelDistance: number;
    scaleMmPerPixel: number;
  };
  annotations?: {
    rooms: Array<{ roomRef: string; roomType: string; label: string }>;
    modules: Array<{ moduleType: string; roomRef: string; wallRef?: string; note?: string }>;
    references: Array<{ roomRef: string; imageLabel: string; styleNote?: string }>;
  };
}

const floorPlanStore: FloorPlanVersionRecord[] = [];

export class MockFloorPlansRepository {
  list(projectId: UUID) {
    return floorPlanStore.filter((plan) => plan.projectId === projectId);
  }

  findById(id: UUID) {
    return floorPlanStore.find((plan) => plan.id === id) ?? null;
  }

  create(projectId: UUID, sourceAssetId: UUID, mode: string) {
    floorPlanStore.forEach((plan) => {
      if (plan.projectId === projectId && plan.isCurrent) plan.isCurrent = false;
    });

    const record: FloorPlanVersionRecord = {
      id: crypto.randomUUID(),
      projectId,
      sourceAssetId,
      versionNumber: this.list(projectId).reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1,
      isCurrent: true,
      interpretationStatus: 'review_required',
      overallConfidence: 0.82,
      interpretation: { mode, roomsDetected: 4, wallsDetected: 12 },
      reviewed: {},
      source: undefined,
      overlay: {
        calibrationPoints: [],
        markers: [],
        updatedAt: new Date().toISOString(),
      },
      calibration: undefined,
      annotations: {
        rooms: [],
        modules: [],
        references: [],
      },
    };

    floorPlanStore.unshift(record);
    return record;
  }

  review(id: UUID, reviewed: Record<string, unknown>) {
    const record = this.findById(id);
    if (!record) return null;
    record.reviewed = reviewed;
    record.interpretationStatus = 'approved';
    return record;
  }

  attachSource(id: UUID, input: { assetName: string; imageDataUrl: string; widthPx: number; heightPx: number }) {
    const record = this.findById(id);
    if (!record) return null;
    record.source = {
      ...input,
      uploadedAt: new Date().toISOString(),
    };
    return record;
  }

  saveOverlay(
    id: UUID,
    input: {
      calibrationPoints: Array<{ x: number; y: number }>;
      markers: Array<{ id: string; markerType: 'room' | 'module' | 'reference'; x: number; y: number; label: string; color: string }>;
    }
  ) {
    const record = this.findById(id);
    if (!record) return null;
    record.overlay = {
      calibrationPoints: input.calibrationPoints,
      markers: input.markers,
      updatedAt: new Date().toISOString(),
    };
    return record;
  }

  calibrate(id: UUID, input: { referenceName: string; knownDistanceMm: number; pixelDistance: number }) {
    const record = this.findById(id);
    if (!record) return null;
    record.calibration = {
      referenceName: input.referenceName,
      knownDistanceMm: input.knownDistanceMm,
      pixelDistance: input.pixelDistance,
      scaleMmPerPixel: input.knownDistanceMm / Math.max(input.pixelDistance, 1),
    };
    return record;
  }

  annotate(id: UUID, input: NonNullable<FloorPlanVersionRecord['annotations']>) {
    const record = this.findById(id);
    if (!record) return null;
    record.annotations = input;
    return record;
  }
}

export const mockFloorPlansRepository = new MockFloorPlansRepository();
