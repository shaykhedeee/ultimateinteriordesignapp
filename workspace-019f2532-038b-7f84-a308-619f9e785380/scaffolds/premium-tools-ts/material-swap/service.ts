import { MaterialSwapPreviewSchema, MaterialSwapRequestSchema, type MaterialSwapRequestInput } from './schemas';
import { buildBasePreviewWarnings, summarizeDesignPlan } from '../shared/common-service-helpers';

export class MaterialSwapService {
  constructor(private readonly deps: MaterialSwapServiceDeps) {}

  async preview(rawInput: unknown) {
    const input = MaterialSwapRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const designPlan = input.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(input.zoneId, input.organizationId)
      : null;

    return MaterialSwapPreviewSchema.parse({
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
    const input = MaterialSwapRequestSchema.parse(rawInput);
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const payload: MaterialSwapJobPayload = {
      request: input,
      context: {
        sourceAssetId: input.sourceAssetId ?? render.assetId,
        operationMode: 'image_edit',
      },
    };

    const job = await this.deps.jobsRepo.enqueue({
      organizationId: input.organizationId,
      toolSlug: 'material-swap',
      jobType: 'material_swap_job',
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

export type MaterialSwapJobPayload = {
  request: MaterialSwapRequestInput;
  context: {
    sourceAssetId?: string;
    operationMode: 'image_edit';
  };
};

export type MaterialSwapServiceDeps = {
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
