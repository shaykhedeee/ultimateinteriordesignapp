import { LaminateChangeRequestSchema, type LaminateChangeRequestInput } from './schemas';

/**
 * This service lives in the API/domain layer.
 * It validates input, resolves context, and creates an async job.
 * It should not perform the heavy image editing itself.
 */
export class LaminateChangerService {
  constructor(private readonly deps: LaminateChangerServiceDeps) {}

  async createLaminateChangeJob(rawInput: unknown) {
    const input = LaminateChangeRequestSchema.parse(rawInput);

    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const project = await this.deps.projectsRepo.findByIdOrThrow(input.projectId, input.organizationId);
    const zone = input.zoneId
      ? await this.deps.zonesRepo.findByIdOrThrow(input.zoneId, input.organizationId)
      : null;

    const material = await this.normalizeMaterialReference(input);
    const sourceAssetId = input.sourceAssetId ?? render.assetId;

    const payload: LaminateChangerJobPayload = {
      request: { ...input, material, sourceAssetId },
      context: {
        projectName: project.name,
        zoneName: zone?.name ?? null,
        renderType: render.renderType,
        renderPromptSummary: render.promptText ?? null,
      },
    };

    const job = await this.deps.jobsRepo.enqueue({
      organizationId: input.organizationId,
      toolSlug: 'laminate-changer',
      jobType: 'design_laminate_change',
      queueName: 'render',
      inputJson: payload,
      createdBy: input.requestedBy,
      projectId: input.projectId,
      zoneId: input.zoneId,
      renderId: input.renderId,
    });

    await this.deps.auditLogger.log({
      organizationId: input.organizationId,
      actorUserId: input.requestedBy,
      action: 'design.laminate_change.job_created',
      entityType: 'ai_job',
      entityId: job.id,
      afterJson: { request: input },
    });

    return {
      jobId: job.id,
      status: job.status,
      message: 'Laminate change queued successfully.',
    };
  }

  async previewPlan(rawInput: unknown) {
    const input = LaminateChangeRequestSchema.parse(rawInput);

    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(input.renderId, input.organizationId);
    const designPlan = input.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(input.zoneId, input.organizationId)
      : null;

    return {
      renderId: render.id,
      material: input.material,
      designPlanSummary: designPlan ? summarizeDesignPlan(designPlan.planJson) : null,
      suggestedWarnings: buildPreviewWarnings(input),
      requiresManualConfirmation: input.selectionMode === 'auto_detect',
    };
  }

  private async normalizeMaterialReference(input: LaminateChangeRequestInput) {
    if (input.material.materialId) {
      const material = await this.deps.catalogRepo.findMaterialByIdOrThrow(input.material.materialId, input.organizationId);
      return {
        materialId: material.id,
        name: material.name,
        brand: material.metadataJson?.brand as string | undefined,
        finish: (input.finishOverride ?? material.finish ?? 'auto') as any,
        colorFamily: material.colorName ?? undefined,
        grainDirection: input.grainDirection ?? (material.attributesJson?.grainDirection as any) ?? 'auto',
        tone: material.attributesJson?.tone as any,
        textureAssetId: material.metadataJson?.textureAssetId as string | undefined,
        textureImageUrl: material.metadataJson?.textureImageUrl as string | undefined,
        metadata: material.metadataJson,
      };
    }

    return {
      ...input.material,
      finish: input.finishOverride ?? input.material.finish ?? 'auto',
      grainDirection: input.grainDirection ?? input.material.grainDirection ?? 'auto',
    };
  }
}

function summarizeDesignPlan(planJson: any) {
  return {
    styleName: planJson?.styleName ?? null,
    keywords: planJson?.styleKeywords ?? [],
    materialPalette: planJson?.materialPalette ?? [],
    mustKeep: planJson?.mustKeep ?? [],
    mustAvoid: planJson?.mustAvoid ?? [],
  };
}

function buildPreviewWarnings(input: LaminateChangeRequestInput) {
  const warnings: string[] = [];
  if (input.selectionMode === 'auto_detect') warnings.push('Auto-detect mode should be manually confirmed before charging credits.');
  if ((input.material.finish ?? input.finishOverride) === 'gloss') warnings.push('High-gloss finishes are more likely to create reflection mismatches.');
  if (input.surfaceType === 'laminate_floor') warnings.push('Floor changes are higher risk due to perspective and continuity.');
  return warnings;
}

export type LaminateChangerJobPayload = {
  request: LaminateChangeRequestInput & { sourceAssetId?: string };
  context: {
    projectName: string;
    zoneName: string | null;
    renderType: string;
    renderPromptSummary: string | null;
  };
};

export type LaminateChangerServiceDeps = {
  renderHistoryRepo: {
    findByIdOrThrow(renderId: string, organizationId: string): Promise<any>;
  };
  projectsRepo: {
    findByIdOrThrow(projectId: string, organizationId: string): Promise<any>;
  };
  zonesRepo: {
    findByIdOrThrow(zoneId: string, organizationId: string): Promise<any>;
  };
  designPlansRepo: {
    findLatestByZoneId(zoneId: string, organizationId: string): Promise<any | null>;
  };
  catalogRepo: {
    findMaterialByIdOrThrow(materialId: string, organizationId: string): Promise<any>;
  };
  jobsRepo: {
    enqueue(input: {
      organizationId: string;
      toolSlug: string;
      jobType: string;
      queueName: string;
      inputJson: unknown;
      createdBy: string;
      projectId?: string;
      zoneId?: string;
      renderId?: string;
    }): Promise<{ id: string; status: string }>;
  };
  auditLogger: {
    log(input: {
      organizationId: string;
      actorUserId?: string;
      action: string;
      entityType: string;
      entityId?: string;
      beforeJson?: unknown;
      afterJson?: unknown;
    }): Promise<void>;
  };
};
