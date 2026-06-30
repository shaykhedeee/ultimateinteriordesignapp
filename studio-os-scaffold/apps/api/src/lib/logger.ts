import pino from 'pino';

export const logger = pino({
  name: 'studio-api',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});
