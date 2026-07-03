import { MaterialSwapAnalysisSchema, MaterialSwapCritiqueSchema, MaterialSwapPlanSchema, MaterialSwapResultSchema } from './schemas';
import { buildMaterialSwapCritiquePrompt, buildMaterialSwapPlanSystemPrompt, buildMaterialSwapPlanUserPrompt } from './prompts';
import type { MaterialSwapJobPayload } from './service';

export class MaterialSwapProcessor {
  constructor(private readonly deps: MaterialSwapProcessorDeps) {}

  async process(job: WorkerJob<MaterialSwapJobPayload>) {
    const { request, context } = job.payload;

    await this.deps.jobState.update(job.id, { stage: 'analyzing_subject', progress: 20 });
    const analysis = MaterialSwapAnalysisSchema.parse(
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
    const plan = MaterialSwapPlanSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'design_edit_plan',
        systemPrompt: buildMaterialSwapPlanSystemPrompt(),
        userPrompt: buildMaterialSwapPlanUserPrompt({
          request,
          analysis,
        }),
        schemaName: 'MaterialSwapPlanSchema',
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'executing', progress: 70 });
    const providerResult = await this.deps.inferenceGateway.runToolOperation({
      toolSlug: 'material-swap',
      organizationId: request.organizationId,
      mode: context.operationMode,
      sourceAssetId: context.sourceAssetId,
      request,
      plan,
    });

    await this.deps.jobState.update(job.id, { stage: 'validating', progress: 84 });
    const validation = await this.deps.outputValidator.validateToolOutput({
      toolSlug: 'material-swap',
      beforeAssetId: context.sourceAssetId,
      afterAssetId: providerResult.outputAssetId,
      request,
      analysis,
    });

    await this.deps.jobState.update(job.id, { stage: 'critiquing', progress: 92 });
    const critique = MaterialSwapCritiqueSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'render_critique',
        systemPrompt: buildMaterialSwapCritiquePrompt({
          planSummary: plan.editIntent,
        }).system,
        userPrompt: buildMaterialSwapCritiquePrompt({
          planSummary: plan.editIntent,
        }).user,
        schemaName: 'MaterialSwapCritiqueSchema',
        imageAssetIds: [providerResult.outputAssetId],
      }),
    );

    const result = MaterialSwapResultSchema.parse({
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

export type MaterialSwapProcessorDeps = {
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
