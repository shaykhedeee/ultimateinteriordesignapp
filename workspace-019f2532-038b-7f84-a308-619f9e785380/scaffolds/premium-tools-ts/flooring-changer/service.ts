import { FlooringChangerPreviewSchema, FlooringChangerRequestSchema, type FlooringChangerRequestInput } from './schemas';
import { buildBasePreviewWarnings, summarizeDesignPlan } from '../shared/common-service-helpers';

export class FlooringChangerService {
  constructor(private readonly deps: FlooringChangerServiceDeps) {}

  async preview(rawInput: unknown) {
    const input = FlooringChangerRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const designPlan = input.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(input.zoneId, input.organizationId)
      : null;

    return FlooringChangerPreviewSchema.parse({
      request: input,
      designContext: designPlan
        ? summarizeDesignPlan(designPlan.planJson)
        : null,
      warnings: buildBasePreviewWarnings({
        selectionMode: input.selectionMode,
        riskLevel: 'high',
        notes: input.notes,
      }),
      recommendedNextStep: input.selectionMode === 'auto_detect' ? 'manual_confirm' : 'preview',
    });
  }

  async createJob(rawInput: unknown) {
    const input = FlooringChangerRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const payload: FlooringChangerJobPayload = {
      request: input,
      context: {
        sourceAssetId: input.sourceAssetId ?? render.assetId,
        operationMode: 'image_edit',
      },
    };

    const job = await this.deps.jobsRepo.enqueue({
      organizationId: input.organizationId,
      toolSlug: 'flooring-changer',
      jobType: 'flooring_changer_job',
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

export type FlooringChangerJobPayload = {
  request: FlooringChangerRequestInput;
  context: {
    sourceAssetId?: string;
    operationMode: 'image_edit';
  };
};

export type FlooringChangerServiceDeps = {
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
