import { Router } from 'express';
import { mockFurnitureRepository } from '../../repositories/mock/furniture.repository';

export const furnitureRouter = Router();

furnitureRouter.get('/furniture-catalog', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const roomType = typeof req.query.roomType === 'string' ? req.query.roomType : undefined;
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;
  const styleTag = typeof req.query.styleTag === 'string' ? req.query.styleTag : undefined;
  const trendTag = typeof req.query.trendTag === 'string' ? req.query.trendTag : undefined;
  const data = mockFurnitureRepository.list({ category, roomType, query, styleTag, trendTag });
  return res.json({ success: true, data, meta: {}, error: null });
});
