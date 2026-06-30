import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(pinoHttp({ logger }));

  app.use('/api/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
