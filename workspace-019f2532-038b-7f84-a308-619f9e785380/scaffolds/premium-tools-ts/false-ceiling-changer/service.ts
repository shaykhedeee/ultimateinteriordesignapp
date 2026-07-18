import { FalseCeilingChangerPreviewSchema, FalseCeilingChangerRequestSchema, type FalseCeilingChangerRequestInput } from './schemas';
import { buildBasePreviewWarnings, summarizeDesignPlan } from '../shared/common-service-helpers';

export class FalseCeilingChangerService {
  constructor(private readonly deps: FalseCeilingChangerServiceDeps) {}

  async preview(rawInput: unknown) {
    const input = FalseCeilingChangerRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const designPlan = input.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(input.zoneId, input.organizationId)
      : null;

    return FalseCeilingChangerPreviewSchema.parse({
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
    const input = FalseCeilingChangerRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const payload: FalseCeilingChangerJobPayload = {
      request: input,
      context: {
        sourceAssetId: input.sourceAssetId ?? render.assetId,
        operationMode: 'image_edit',
      },
    };

    const job = await this.deps.jobsRepo.enqueue({
      organizationId: input.organizationId,
      toolSlug: 'false-ceiling-changer',
      jobType: 'false_ceiling_changer_job',
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

export type FalseCeilingChangerJobPayload = {
  request: FalseCeilingChangerRequestInput;
  context: {
    sourceAssetId?: string;
    operationMode: 'image_edit';
  };
};

export type FalseCeilingChangerServiceDeps = {
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
