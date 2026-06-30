import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = env.DATABASE_URL
  ? new Pool({ connectionString: env.DATABASE_URL })
  : null;

export async function dbHealthcheck() {
  if (env.DATA_MODE === 'memory') {
    return { mode: 'memory', ok: true };
  }

  if (!pool) {
    return { mode: 'postgres', ok: false, reason: 'DATABASE_URL missing' };
  }

  const result = await pool.query('select now() as now');
  return { mode: 'postgres', ...result.rows[0] };
}
