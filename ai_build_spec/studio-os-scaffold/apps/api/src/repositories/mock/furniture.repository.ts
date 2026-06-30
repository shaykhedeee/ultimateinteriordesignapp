import { furnitureCatalog, type FurnitureCatalogItem } from '../../lib/furniture-catalog';

export class MockFurnitureRepository {
  list(filters?: { category?: string; roomType?: string; query?: string; styleTag?: string; trendTag?: string }) {
    const q = filters?.query?.toLowerCase();
    return furnitureCatalog.filter((item) => {
      if (filters?.category && item.category !== filters.category) return false;
      if (filters?.roomType && !item.roomTypes.includes(filters.roomType)) return false;
      if (filters?.styleTag && !item.styleTags.includes(filters.styleTag)) return false;
      if (filters?.trendTag && !item.trendTags.includes(filters.trendTag)) return false;
      if (q) {
        const haystack = [item.label, item.category, ...item.styleTags, ...item.trendTags].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  findByKey(key: string) {
    return furnitureCatalog.find((item) => item.key === key) ?? null;
  }
}

export const mockFurnitureRepository = new MockFurnitureRepository();
