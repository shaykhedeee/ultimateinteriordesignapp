import { WallPaintChangerAnalysisSchema, WallPaintChangerCritiqueSchema, WallPaintChangerPlanSchema, WallPaintChangerResultSchema } from './schemas';
import { buildWallPaintChangerCritiquePrompt, buildWallPaintChangerPlanSystemPrompt, buildWallPaintChangerPlanUserPrompt } from './prompts';
import type { WallPaintChangerJobPayload } from './service';

export class WallPaintChangerProcessor {
  constructor(private readonly deps: WallPaintChangerProcessorDeps) {}

  async process(job: WorkerJob<WallPaintChangerJobPayload>) {
    const { request, context } = job.payload;

    await this.deps.jobState.update(job.id, { stage: 'analyzing_subject', progress: 20 });
    const analysis = WallPaintChangerAnalysisSchema.parse(
      await this.deps.subjectAnalyzer.analyze({
        organizationId: request.organizationId,
        renderId: request.renderId,
        sourceAssetId: context.sourceAssetId,
        selectionMode: request.selectionMode,
        selectedCandidateId: request.selectedCandidateId,
        subjectType: request.subjectType,
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'planning', progress: 45 });
    const plan = WallPaintChangerPlanSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'design_edit_plan',
        systemPrompt: buildWallPaintChangerPlanSystemPrompt(),
        userPrompt: buildWallPaintChangerPlanUserPrompt({
          request,
          analysis,
        }),
        schemaName: 'WallPaintChangerPlanSchema',
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'executing', progress: 70 });
    const providerResult = await this.deps.inferenceGateway.runToolOperation({
      toolSlug: 'wall-paint-changer',
      organizationId: request.organizationId,
      mode: context.operationMode,
      sourceAssetId: context.sourceAssetId,
      request,
      plan,
    });

    await this.deps.jobState.update(job.id, { stage: 'validating', progress: 84 });
    const validation = await this.deps.outputValidator.validateToolOutput({
      toolSlug: 'wall-paint-changer',
      beforeAssetId: context.sourceAssetId,
      afterAssetId: providerResult.outputAssetId,
      request,
      analysis,
    });

    await this.deps.jobState.update(job.id, { stage: 'critiquing', progress: 92 });
    const critique = WallPaintChangerCritiqueSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'render_critique',
        systemPrompt: buildWallPaintChangerCritiquePrompt({
          planSummary: plan.editIntent,
        }).system,
        userPrompt: buildWallPaintChangerCritiquePrompt({
          planSummary: plan.editIntent,
        }).user,
        schemaName: 'WallPaintChangerCritiqueSchema',
        imageAssetIds: [providerResult.outputAssetId],
      }),
    );

    const result = WallPaintChangerResultSchema.parse({
      outputAssetId: providerResult.outputAssetId,
      outputImageUrl: providerResult.outputImageUrl,
      childRenderId: providerResult.childRenderId,
      validationScore: validation.score,
      critiqueScore: critique.score,
      warnings: [...(validation.warnings ?? []), ...critique.issues],
      acceptedBySystem: validation.score >= 0.75 && critique.approve,
      subjectType: request.subjectType,
    });

    await this.deps.jobState.complete(job.id, result);
    return result;
  }
}

export type WorkerJob<TPayload> = {
  id: string;
  payload: TPayload;
};

export type WallPaintChangerProcessorDeps = {
  jobState: {
    update(jobId: string, patch: { stage: string; progress: number }): Promise<void>;
    complete(jobId: string, outputJson: unknown): Promise<void>;
  };
  subjectAnalyzer: {
    analyze(input: any): Promise<unknown>;
  };
  auraClient: {
    generateStructured(input: any): Promise<unknown>;
  };
  inferenceGateway: {
    runToolOperation(input: any): Promise<{
      outputAssetId: string;
      outputImageUrl?: string;
      childRenderId?: string;
    }>;
  };
  outputValidator: {
    validateToolOutput(input: any): Promise<{ score: number; warnings: string[] }>;
  };
};
