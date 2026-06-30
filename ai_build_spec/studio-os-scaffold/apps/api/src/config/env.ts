import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATA_MODE: z.enum(['memory', 'postgres']).default('memory'),
  DATABASE_URL: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
