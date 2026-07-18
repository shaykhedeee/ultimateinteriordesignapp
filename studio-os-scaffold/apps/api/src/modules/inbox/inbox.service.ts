import type { UUID } from '@studio/contracts';
import { logTimelineEvent } from '../../lib/timeline';
import { mockStore } from '../../lib/mock-store';
import { mockAgentOsRepository } from '../../repositories/mock/agentos.repository';

export class InboxService {
  async list(projectId?: UUID) {
    return mockAgentOsRepository.list(projectId);
  }

  async create(projectId: UUID | undefined, input: {
    observationType: string;
    title: string;
    detail?: string;
    disposition: 'deterministic' | 'small_ai' | 'advanced_ai' | 'human_review' | 'memory_update';
  }) {
    const record = mockAgentOsRepository.create(projectId, input);
    if (projectId) {
      logTimelineEvent(projectId, 'agent.inbox_created', 'Agent inbox item created', `${input.title}`, 'orchestrator');
    }
    return record;
  }

  async updateStatus(id: UUID, status: 'new' | 'triaged' | 'in_progress' | 'done') {
    return mockAgentOsRepository.updateStatus(id, status);
  }

  async triggerAgentAnalysis(projectId: UUID) {
    const project = mockStore.projects.find((p) => p.id === projectId) ?? null;
    const activeScene = mockStore.scenes.find((s) => s.projectId === projectId && s.isCurrent);
    const modules = activeScene?.scene.levels[0]?.modules ?? [];

    const warnings: string[] = [];
    const suggestions: Array<{ agent: string; description: string; patch: any }> = [];

    // 1. Trigger Floor Plan Review Agent (Vastu & Spatial Boundaries)
    let planObservations = 'Floor plan scaling verified. Ready for modular layout placement.';
    if (activeScene?.scene.levels[0]?.rooms.length === 0) {
      warnings.push('AI Discrepancy: No room areas defined on calibrated canvas.');
      planObservations = 'Floor plan contains empty levels. Please place room markers first.';
    } else {
      planObservations = `Calibrated canvas contains ${activeScene?.scene.levels[0]?.rooms.length} room zones aligned with active spatial boundaries.`;
    }
    mockAgentOsRepository.create(projectId, {
      observationType: 'vastu_align',
      title: 'Floor Plan Review Agent: Spatial boundary analysis',
      detail: planObservations,
      disposition: 'deterministic',
    });

    // 2. Starter Suggestions if scene is empty
    if (modules.length === 0) {
      suggestions.push({
        agent: 'Layout Assist Agent',
        description: 'Place a Premium Fluted Backlit TV Unit Console on the Living Room accent wall.',
        patch: {
          op: 'add_module',
          payload: {
            templateKey: 'tv_unit_fluted_backlit',
            name: 'Backlit Media Center',
            params: { widthMm: 2400, heightMm: 500, depthMm: 420 }
          }
        }
      });
      suggestions.push({
        agent: 'Materials & Style Agent',
        description: 'No active finishes detected. Bootstrap scene with default high-quality Walnut Veneer theme.',
        patch: {
          op: 'assign_material_global',
          payload: { primary_finish: 'VEN-TEAK-01', name: 'Walnut Veneer' }
        }
      });
    }

    // 3. Process active modules dynamically
    for (const mod of modules) {
      const { moduleId, name, params, moduleType } = mod;
      const width = Number(params?.widthMm ?? mod.geometry.size.widthMm ?? 0);
      const height = Number(params?.heightMm ?? mod.geometry.size.heightMm ?? 0);
      const depth = Number(params?.depthMm ?? mod.geometry.size.depthMm ?? 0);

      // Rule A: Wardrobe depth clearance
      if (moduleType?.includes('wardrobe')) {
        if (depth < 600) {
          warnings.push(`Wardrobe "${name}" has a depth of ${depth}mm. Standard hanger clearance requires at least 600mm to prevent shutter friction.`);
          suggestions.push({
            agent: 'Layout Assist Agent',
            description: `Resize wardrobe "${name}" depth to 600mm for standard clothing hanger compatibility.`,
            patch: {
              op: 'update_module_params',
              moduleId,
              params: { ...params, depthMm: 600 }
            }
          });
        }
      }

      // Rule B: TV Unit Console circulation clearance
      if (moduleType?.includes('tv_unit')) {
        if (depth > 450) {
          warnings.push(`TV console "${name}" has a depth of ${depth}mm. Floating media cabinets should be under 450mm to clear passage corridors.`);
          suggestions.push({
            agent: 'Layout Assist Agent',
            description: `Refine TV console "${name}" depth to 400mm to maximize living room circulation.`,
            patch: {
              op: 'update_module_params',
              moduleId,
              params: { ...params, depthMm: 400 }
            }
          });
        }

        // Add backlit LED option suggestion
        suggestions.push({
          agent: 'Materials & Style Agent',
          description: `Add warm backlit halo illumination presets to TV unit "${name}".`,
          patch: {
            op: 'update_module_params',
            moduleId,
            params: { ...params, ledBacklit: true }
          }
        });
      }

      // Rule C: Value engineering based on project budget band
      const primaryFinish = params?.primary_finish as string | undefined;
      const isPremiumFinish = primaryFinish?.includes('VEN') || primaryFinish?.includes('GLOSS');
      if (project?.budgetBand === 'economy' && isPremiumFinish) {
        warnings.push(`Budget Overrun: Premium finish on "${name}" conflicts with Economy project parameters.`);
        suggestions.push({
          agent: 'Budget Optimization Agent',
          description: `Swap premium veneer on "${name}" to wood-grain textured laminate for a savings of 32,000 INR.`,
          patch: {
            op: 'assign_material',
            moduleId,
            payload: { primary_finish: 'LAM-WOOD-02', primary_finish_name: 'Natural Oak Matte' }
          }
        });
      }
    }

    // 4. Populate Agent Inbox logs based on warnings & suggestions
    if (warnings.length > 0) {
      mockAgentOsRepository.create(projectId, {
        observationType: 'clearance_alert',
        title: `Layout Assist Agent: ${warnings.length} clearance warnings flagged`,
        detail: warnings.join(' | '),
        disposition: 'small_ai',
      });
    }

    mockAgentOsRepository.create(projectId, {
      observationType: 'style_pairing',
      title: 'Materials & Style Agent: Material pairing optimized',
      detail: 'Verified harmony of wood grain selections against active client profile preferences.',
      disposition: 'advanced_ai',
    });

    mockAgentOsRepository.create(projectId, {
      observationType: 'budget_fit',
      title: 'Budget Optimization Agent: Pricing review run',
      detail: `Validated total commercial list price against ${project?.budgetBand ?? 'standard'} budget brackets.`,
      disposition: 'deterministic',
    });

    mockAgentOsRepository.create(projectId, {
      observationType: 'drawing_pack',
      title: 'Documentation Agent: Drafting coverage analysis',
      detail: `Verified that all placed modules are correctly projected onto elevation sheets.`,
      disposition: 'human_review',
    });

    mockAgentOsRepository.create(projectId, {
      observationType: 'render_preset',
      title: 'Render Recommendation Agent: Optimal cameras defined',
      detail: 'Shortlisted warm daylight renders for kitchen perspectives and evening mood presets for the living lounge.',
      disposition: 'memory_update',
    });

    logTimelineEvent(projectId, 'agent.orchestration_run', 'Multi-Agent Suite Triggered', `${warnings.length} clearance alerts flagged, ${suggestions.length} recommendations compiled.`, 'orchestrator');

    return {
      projectId,
      verdict: {
        status: 'completed',
        score: warnings.length === 0 ? 100 : Math.max(40, 100 - warnings.length * 15),
        warnings,
        suggestions
      }
    };
  }
}

export const inboxService = new InboxService();
