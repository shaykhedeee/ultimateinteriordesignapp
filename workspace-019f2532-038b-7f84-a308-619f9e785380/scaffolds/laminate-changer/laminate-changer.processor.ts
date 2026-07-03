import {
  AuraLaminatePlanSchema,
  LaminateCritiqueSchema,
  LaminateEditResultSchema,
  SurfaceAnalysisSchema,
} from './schemas';
import { buildLaminateCritiquePrompt, buildLaminatePlanSystemPrompt, buildLaminatePlanUserPrompt } from './prompts';
import type { LaminateChangerJobPayload } from './laminate-changer.service';

/**
 * This processor lives in the worker layer.
 * It executes the full laminate-change pipeline.
 */
export class LaminateChangerProcessor {
  constructor(private readonly deps: LaminateChangerProcessorDeps) {}

  async process(job: WorkerJob<LaminateChangerJobPayload>) {
    const { request } = job.payload;

    await this.deps.jobState.update(job.id, { stage: 'loading_context', progress: 5 });
    const render = await this.deps.renderHistoryRepo.findByIdOrThrow(request.renderId, request.organizationId);
    const zone = request.zoneId ? await this.deps.zonesRepo.findByIdOrThrow(request.zoneId, request.organizationId) : null;
    const designPlan = request.zoneId
      ? await this.deps.designPlansRepo.findLatestByZoneId(request.zoneId, request.organizationId)
      : null;

    await this.deps.jobState.update(job.id, { stage: 'surface_analysis', progress: 20 });
    const surfaceAnalysis = SurfaceAnalysisSchema.parse(
      await this.deps.surfaceAnalyzer.analyze({
        organizationId: request.organizationId,
        renderId: request.renderId,
        sourceAssetId: request.sourceAssetId ?? render.assetId,
        selectionMode: request.selectionMode,
        selectedSurfaceId: request.selectedSurfaceId,
        maskAssetId: request.maskAssetId,
        maskPolygon: request.maskPolygon,
        requestedSurfaceType: request.surfaceType,
      }),
    );

    if (request.selectionMode === 'auto_detect' && surfaceAnalysis.confidence < 0.75) {
      return await this.deps.jobState.fail(job.id, {
        code: 'LOW_SURFACE_CONFIDENCE',
        message: 'Surface confidence too low for automatic laminate change. Require manual confirmation.',
        details: surfaceAnalysis,
      });
    }

    await this.deps.jobState.update(job.id, { stage: 'planning_edit', progress: 40 });
    const auraPlan = AuraLaminatePlanSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'image_edit_plan',
        systemPrompt: buildLaminatePlanSystemPrompt(),
        userPrompt: buildLaminatePlanUserPrompt({
          request,
          surfaceAnalysis,
          roomStyleSummary: designPlan?.planJson?.styleName,
          designPlanSummary: designPlan ? JSON.stringify(designPlan.planJson) : undefined,
        }),
        schemaName: 'AuraLaminatePlanSchema',
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'running_edit', progress: 65 });
    const providerResult = await this.deps.inferenceGateway.runImageEdit({
      organizationId: request.organizationId,
      mode: 'laminate_change',
      sourceAssetId: request.sourceAssetId ?? render.assetId,
      maskAssetId: request.maskAssetId,
      maskPolygon: request.maskPolygon,
      prompt: auraPlan.editPrompt,
      negativePrompt: auraPlan.negativePrompt,
      referenceMaterial: request.material,
      preserveInstructions: auraPlan.preserveInstructions,
      metadata: {
        surfaceType: auraPlan.targetSurfaceType,
        grainDirection: auraPlan.grainDirection,
        finishType: auraPlan.finishType,
      },
    });

    await this.deps.jobState.update(job.id, { stage: 'validating_output', progress: 82 });
    const validation = await this.deps.outputValidator.validateLaminateEdit({
      beforeAssetId: request.sourceAssetId ?? render.assetId,
      afterAssetId: providerResult.outputAssetId,
      selectedSurface: surfaceAnalysis.selectedSurface,
      preserveHardware: request.preserveHardware ?? true,
      preserveSeams: request.preserveSeams ?? true,
    });

    await this.deps.jobState.update(job.id, { stage: 'critiquing_output', progress: 90 });
    const critique = LaminateCritiqueSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'render_critique',
        systemPrompt: buildLaminateCritiquePrompt({
          planSummary: auraPlan.editIntent,
          roomContext: designPlan ? JSON.stringify(designPlan.planJson) : undefined,
          materialContext: request.material.name,
        }).system,
        userPrompt: buildLaminateCritiquePrompt({
          planSummary: auraPlan.editIntent,
          roomContext: designPlan ? JSON.stringify(designPlan.planJson) : undefined,
          materialContext: request.material.name,
        }).user,
        schemaName: 'LaminateCritiqueSchema',
        imageAssetIds: [providerResult.outputAssetId],
      }),
    );

    const acceptedBySystem = validation.score >= 0.75 && critique.approve;

    await this.deps.jobState.update(job.id, { stage: 'persisting', progress: 96 });
    const childRender = await this.deps.renderHistoryRepo.createChildRender({
      organizationId: request.organizationId,
      projectId: request.projectId,
      zoneId: request.zoneId,
      parentRenderId: request.renderId,
      renderType: 'inpaint',
      assetId: providerResult.outputAssetId,
      promptText: auraPlan.editPrompt,
      negativePromptText: auraPlan.negativePrompt,
      providerName: providerResult.providerName,
      modelBackend: providerResult.modelBackend,
      modelVersion: providerResult.modelVersion,
      sourceJobId: job.id,
      metadataJson: {
        laminateChange: true,
        request,
        surfaceAnalysis,
        auraPlan,
        validation,
        critique,
      },
      createdBy: request.requestedBy,
    });

    await this.deps.critiqueResultsRepo.create({
      organizationId: request.organizationId,
      renderId: childRender.id,
      critiqueJson: critique,
      approved: acceptedBySystem,
      sourceTaskId: undefined,
    });

    const result = LaminateEditResultSchema.parse({
      outputAssetId: providerResult.outputAssetId,
      outputImageUrl: providerResult.outputImageUrl,
      childRenderId: childRender.id,
      validationScore: validation.score,
      critiqueScore: critique.score,
      warnings: [...validation.warnings, ...critique.issues],
      acceptedBySystem,
    });

    await this.deps.jobState.complete(job.id, result);
    return result;
  }
}

export type WorkerJob<TPayload> = {
  id: string;
  payload: TPayload;
};

export type LaminateChangerProcessorDeps = {
  jobState: {
    update(jobId: string, patch: { stage: string; progress: number }): Promise<void>;
    complete(jobId: string, outputJson: unknown): Promise<void>;
    fail(jobId: string, errorJson: unknown): Promise<void>;
  };
  renderHistoryRepo: {
    findByIdOrThrow(renderId: string, organizationId: string): Promise<any>;
    createChildRender(input: any): Promise<{ id: string }>;
  };
  zonesRepo: {
    findByIdOrThrow(zoneId: string, organizationId: string): Promise<any>;
  };
  designPlansRepo: {
    findLatestByZoneId(zoneId: string, organizationId: string): Promise<any | null>;
  };
  surfaceAnalyzer: {
    analyze(input: any): Promise<unknown>;
  };
  auraClient: {
    generateStructured(input: {
      capability: string;
      systemPrompt: string;
      userPrompt: unknown;
      schemaName: string;
      imageAssetIds?: string[];
    }): Promise<unknown>;
  };
  inferenceGateway: {
    runImageEdit(input: any): Promise<{
      outputAssetId: string;
      outputImageUrl?: string;
      providerName?: string;
      modelBackend?: string;
      modelVersion?: string;
    }>;
  };
  outputValidator: {
    validateLaminateEdit(input: any): Promise<{ score: number; warnings: string[] }>;
  };
  critiqueResultsRepo: {
    create(input: any): Promise<void>;
  };
};
