import { FalseCeilingChangerAnalysisSchema, FalseCeilingChangerCritiqueSchema, FalseCeilingChangerPlanSchema, FalseCeilingChangerResultSchema } from './schemas';
import { buildFalseCeilingChangerCritiquePrompt, buildFalseCeilingChangerPlanSystemPrompt, buildFalseCeilingChangerPlanUserPrompt } from './prompts';
import type { FalseCeilingChangerJobPayload } from './service';

export class FalseCeilingChangerProcessor {
  constructor(private readonly deps: FalseCeilingChangerProcessorDeps) {}

  async process(job: WorkerJob<FalseCeilingChangerJobPayload>) {
    const { request, context } = job.payload;

    await this.deps.jobState.update(job.id, { stage: 'analyzing_subject', progress: 20 });
    const analysis = FalseCeilingChangerAnalysisSchema.parse(
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
    const plan = FalseCeilingChangerPlanSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'design_edit_plan',
        systemPrompt: buildFalseCeilingChangerPlanSystemPrompt(),
        userPrompt: buildFalseCeilingChangerPlanUserPrompt({
          request,
          analysis,
        }),
        schemaName: 'FalseCeilingChangerPlanSchema',
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'executing', progress: 70 });
    const providerResult = await this.deps.inferenceGateway.runToolOperation({
      toolSlug: 'false-ceiling-changer',
      organizationId: request.organizationId,
      mode: context.operationMode,
      sourceAssetId: context.sourceAssetId,
      request,
      plan,
    });

    await this.deps.jobState.update(job.id, { stage: 'validating', progress: 84 });
    const validation = await this.deps.outputValidator.validateToolOutput({
      toolSlug: 'false-ceiling-changer',
      beforeAssetId: context.sourceAssetId,
      afterAssetId: providerResult.outputAssetId,
      request,
      analysis,
    });

    await this.deps.jobState.update(job.id, { stage: 'critiquing', progress: 92 });
    const critique = FalseCeilingChangerCritiqueSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'render_critique',
        systemPrompt: buildFalseCeilingChangerCritiquePrompt({
          planSummary: plan.editIntent,
        }).system,
        userPrompt: buildFalseCeilingChangerCritiquePrompt({
          planSummary: plan.editIntent,
        }).user,
        schemaName: 'FalseCeilingChangerCritiqueSchema',
        imageAssetIds: [providerResult.outputAssetId],
      }),
    );

    const result = FalseCeilingChangerResultSchema.parse({
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

export type FalseCeilingChangerProcessorDeps = {
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
