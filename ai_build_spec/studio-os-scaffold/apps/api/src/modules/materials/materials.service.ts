import type { UUID } from '@studio/contracts';
import { ruleSeeds } from '@studio/rules';
import type { MaterialCatalogRecord } from '../../lib/mock-store';
import { getClimateProfile } from '../../lib/climate';
import { logTimelineEvent } from '../../lib/timeline';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';
import { mockMaterialsRepository } from '../../repositories/mock/materials.repository';

const budgetOrder = ['economy', 'standard', 'premium', 'luxury', 'ultra_luxury_bespoke'];

function budgetScore(materialBudgetBand: string | undefined, projectBudgetBand: string | undefined) {
  if (!projectBudgetBand || !materialBudgetBand) return 0;
  const m = budgetOrder.indexOf(materialBudgetBand);
  const p = budgetOrder.indexOf(projectBudgetBand);
  if (m === -1 || p === -1) return 0;
  if (m === p) return 40;
  if (m < p) return 30;
  if (m === p + 1) return 10;
  return -20;
}

export class MaterialsService {
  async list(filters?: { category?: string; budgetBand?: string; roomType?: string }) {
    return mockMaterialsRepository.list(filters);
  }

  async recommend(projectId: UUID, params: { roomType?: string; category?: string }) {
    const project = mockProjectsRepository.findById(projectId);
    const climate = getClimateProfile(project?.siteCity);
    const projectBudgetBand = project?.budgetBand;
    const candidates = mockMaterialsRepository.list({ category: params.category, roomType: params.roomType });

    const recommendations = candidates
      .map((material) => {
        const metadata = material.metadata ?? {};
        let score = 0;
        const reasons: string[] = [];

        const bScore = budgetScore(String(metadata.budgetBand ?? ''), projectBudgetBand);
        score += bScore;
        if (bScore > 0) reasons.push('budget fit');
        if (bScore < 0) reasons.push('budget stretch');

        const roomTypes = Array.isArray(metadata.roomTypes) ? (metadata.roomTypes as string[]) : [];
        if (params.roomType && roomTypes.includes(params.roomType)) {
          score += 25;
          reasons.push('room compatible');
        }

        const moisture = String(metadata.moisture ?? 'medium');
        if ((climate === 'humid' || climate === 'coastal') && (material.category === 'board' || params.category === 'board')) {
          if (moisture === 'high') {
            score += 20;
            reasons.push('suited for humid/coastal climate');
          } else {
            score -= 10;
            reasons.push('lower moisture resistance');
          }
        }

        const finish = String(metadata.finish ?? '');
        if (params.roomType === 'kitchen' && finish === 'matte') {
          score += 5;
          reasons.push('practical kitchen finish');
        }
        if (params.roomType === 'living_room' && finish === 'veneer') {
          score += 5;
          reasons.push('premium feature-room finish');
        }

        return {
          material,
          score,
          reasons,
          climate,
          projectBudgetBand,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      projectId,
      climate,
      roomType: params.roomType,
      category: params.category,
      recommendations,
      budgetPolicy: ruleSeeds.budgetPolicies,
    };
  }

  async create(projectId: UUID | undefined, input: Parameters<typeof mockMaterialsRepository.create>[0]) {
    const record = mockMaterialsRepository.create(input);
    if (projectId) {
      logTimelineEvent(projectId, 'material.created', 'Material catalog item created', `${record.name} added to catalog`);
    }
    return record;
  }

  async update(projectId: UUID | undefined, materialId: UUID, input: Partial<MaterialCatalogRecord>) {
    const record = mockMaterialsRepository.update(materialId, input);
    if (record && projectId) {
      logTimelineEvent(projectId, 'material.updated', 'Material catalog item updated', `${record.name} updated`);
    }
    return record;
  }
}

export const materialsService = new MaterialsService();
