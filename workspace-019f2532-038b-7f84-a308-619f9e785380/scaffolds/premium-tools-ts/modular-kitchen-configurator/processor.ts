import { ModularKitchenConfiguratorAnalysisSchema, ModularKitchenConfiguratorCritiqueSchema, ModularKitchenConfiguratorPlanSchema, ModularKitchenConfiguratorResultSchema } from './schemas';
import { buildModularKitchenConfiguratorCritiquePrompt, buildModularKitchenConfiguratorPlanSystemPrompt, buildModularKitchenConfiguratorPlanUserPrompt } from './prompts';
import type { ModularKitchenConfiguratorJobPayload } from './service';

export class ModularKitchenConfiguratorProcessor {
  constructor(private readonly deps: ModularKitchenConfiguratorProcessorDeps) {}

  async process(job: WorkerJob<ModularKitchenConfiguratorJobPayload>) {
    const { request, context } = job.payload;

    await this.deps.jobState.update(job.id, { stage: 'analyzing_subject', progress: 20 });
    const analysis = ModularKitchenConfiguratorAnalysisSchema.parse(
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
    const plan = ModularKitchenConfiguratorPlanSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'design_edit_plan',
        systemPrompt: buildModularKitchenConfiguratorPlanSystemPrompt(),
        userPrompt: buildModularKitchenConfiguratorPlanUserPrompt({
          request,
          analysis,
        }),
        schemaName: 'ModularKitchenConfiguratorPlanSchema',
      }),
    );

    await this.deps.jobState.update(job.id, { stage: 'executing', progress: 70 });
    const providerResult = await this.deps.inferenceGateway.runToolOperation({
      toolSlug: 'modular-kitchen-configurator',
      organizationId: request.organizationId,
      mode: context.operationMode,
      sourceAssetId: context.sourceAssetId,
      request,
      plan,
    });

    await this.deps.jobState.update(job.id, { stage: 'validating', progress: 84 });
    const validation = await this.deps.outputValidator.validateToolOutput({
      toolSlug: 'modular-kitchen-configurator',
      beforeAssetId: context.sourceAssetId,
      afterAssetId: providerResult.outputAssetId,
      request,
      analysis,
    });

    await this.deps.jobState.update(job.id, { stage: 'critiquing', progress: 92 });
    const critique = ModularKitchenConfiguratorCritiqueSchema.parse(
      await this.deps.auraClient.generateStructured({
        capability: 'render_critique',
        systemPrompt: buildModularKitchenConfiguratorCritiquePrompt({
          planSummary: plan.editIntent,
        }).system,
        userPrompt: buildModularKitchenConfiguratorCritiquePrompt({
          planSummary: plan.editIntent,
        }).user,
        schemaName: 'ModularKitchenConfiguratorCritiqueSchema',
        imageAssetIds: [providerResult.outputAssetId],
      }),
    );

    const result = ModularKitchenConfiguratorResultSchema.parse({
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

export type ModularKitchenConfiguratorProcessorDeps = {
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
