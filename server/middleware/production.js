import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function applyProductionMiddleware(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN?.split(',') || false : true,
    credentials: true,
    maxAge: 86400
  }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health' || req.path === '/api/live'
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health' || req.path === '/api/live'
  });

  app.use('/api/', generalLimiter);
  app.use('/api/ai/', aiLimiter);
  app.use('/api/providers/', aiLimiter);
  app.use('/api/tools/', aiLimiter);
  app.use('/api/projects/', aiLimiter);

  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader('x-request-id', req.id);
    next();
  });
}
