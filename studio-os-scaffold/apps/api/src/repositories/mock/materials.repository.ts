import type { UUID } from '@studio/contracts';
import { mockStore, type MaterialCatalogRecord } from '../../lib/mock-store';

export class MockMaterialsRepository {
  list(filters?: { category?: string; budgetBand?: string; roomType?: string }) {
    return mockStore.materials.filter((material) => {
      if (filters?.category && material.category !== filters.category) return false;
      if (filters?.budgetBand && material.metadata?.budgetBand !== filters.budgetBand) return false;
      if (filters?.roomType) {
        const roomTypes = material.metadata?.roomTypes as string[] | undefined;
        if (roomTypes && !roomTypes.includes(filters.roomType)) return false;
      }
      return material.isActive;
    });
  }

  findById(id: UUID) {
    return mockStore.materials.find((material) => material.id === id) ?? null;
  }

  create(input: Omit<MaterialCatalogRecord, 'id' | 'isActive'> & { isActive?: boolean }) {
    const record: MaterialCatalogRecord = {
      id: crypto.randomUUID(),
      category: input.category,
      subcategory: input.subcategory,
      code: input.code,
      name: input.name,
      brand: input.brand,
      metadata: input.metadata,
      pricing: input.pricing,
      isActive: input.isActive ?? true,
    };
    mockStore.materials.unshift(record);
    return record;
  }

  update(id: UUID, input: Partial<MaterialCatalogRecord>) {
    const record = this.findById(id);
    if (!record) return null;
    Object.assign(record, input);
    return record;
  }
}

export const mockMaterialsRepository = new MockMaterialsRepository();
