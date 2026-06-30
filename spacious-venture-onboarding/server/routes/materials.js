import express from 'express';
import { matchLaminates } from '../services/design-engine.js';

export const materialsRouter = express.Router();

materialsRouter.get('/laminates', (req, res, next) => {
  try {
    const projectLike = {
      budgetTier: req.query.budget || 'premium',
      primaryStyle: req.query.style || 'indian-contemporary',
      cookingStyle: req.query.useCase === 'kitchen' ? 'heavy-indian' : 'balanced',
      finishTolerance: [req.query.finish, req.query.texture].filter(Boolean),
      notes: `${req.query.finish || ''} ${req.query.useCase || ''}`,
      storageHabits: ''
    };
    const items = matchLaminates(projectLike, {
      brand: req.query.brand,
      finish: req.query.finish,
      useCase: req.query.useCase,
      budget: req.query.budget
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

materialsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Materials API error' });
});
