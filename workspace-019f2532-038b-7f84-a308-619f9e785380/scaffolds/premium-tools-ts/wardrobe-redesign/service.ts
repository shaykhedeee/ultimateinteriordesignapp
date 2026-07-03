import { WardrobeRedesignPreviewSchema, WardrobeRedesignRequestSchema, type WardrobeRedesignRequestInput } from './schemas';
import { buildBasePreviewWarnings, summarizeDesignPlan } from '../shared/common-service-helpers';

export class WardrobeRedesignService {
  constructor(private readonly deps: WardrobeRedesignServiceDeps) {}

  async preview(rawInput: unknown) {
    const input = WardrobeRedesignRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const designPlan = input.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(input.zoneId, input.organizationId)
      : null;

    return WardrobeRedesignPreviewSchema.parse({
      request: input,
      designContext: designPlan
        ? summarizeDesignPlan(designPlan.planJson)
        : null,
      warnings: buildBasePreviewWarnings({
        selectionMode: input.selectionMode,
        riskLevel: 'medium',
        notes: input.notes,
      }),
      recommendedNextStep: input.selectionMode === 'auto_detect' ? 'manual_confirm' : 'preview',
    });
  }

  async createJob(rawInput: unknown) {
    const input = WardrobeRedesignRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const payload: WardrobeRedesignJobPayload = {
      request: input,
      context: {
        sourceAssetId: input.sourceAssetId ?? render.assetId,
        operationMode: 'concept_generate',
      },
    };

    const job = await this.deps.jobsRepo.enqueue({
      organizationId: input.organizationId,
      toolSlug: 'wardrobe-redesign',
      jobType: 'wardrobe_redesign_job',
      queueName: 'render',
      inputJson: payload,
      createdBy: input.requestedBy,
      projectId: input.projectId,
      zoneId: input.zoneId,
      renderId: input.renderId,
    });

    return { jobId: job.id, status: job.status };
  }
}

export type WardrobeRedesignJobPayload = {
  request: WardrobeRedesignRequestInput;
  context: {
    sourceAssetId?: string;
    operationMode: 'concept_generate';
  };
};

export type WardrobeRedesignServiceDeps = {
  renderHistoryRepo: {
    findByIdOrThrow(renderId: string, organizationId: string): Promise<any>;
  };
  designPlansRepo: {
    findLatestByZoneId(zoneId: string, organizationId: string): Promise<any | null>;
  };
  jobsRepo: {
    enqueue(input: any): Promise<{ id: string; status: string }>;
  };
};
