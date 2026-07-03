/**
 * Async Job Orchestration System
 *
 * Persistent, retryable, observable job execution for AI and vision tasks.
 * Redis-backed BullMQ queue with Postgres persistence via `ai_jobs` table.
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import db from '../database/database.js';
import { getProviderStatus } from './provider-config.js';
import { processInpaintRender } from './render-edit-worker.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const JOB_TYPES = [
  'layout_preprocess',
  'layout_analyze',
  'canonical_render',
  'enhance_topview',
  'validate_enhanced',
  'zone_design_plan',
  'quick_render',
  'detailed_render',
  'inpaint_render',
  'upscale_render'
];

let editWorkerInstance = null;
export function startEditWorker() {
  if (editWorkerInstance) return editWorkerInstance;
  editWorkerInstance = new Worker(
    'inpaint_render',
    async (job) => processInpaintRender(job),
    { connection, concurrency: 2 }
  );
  editWorkerInstance.on('failed', (job, err) => {
    console.error('[inpaint_render] failed', job?.id, err?.message);
  });
  return editWorkerInstance;
}

export function createJob({ organizationId, projectId, zoneId, jobType, provider = null, providerJobId = null, inputJson = {} }) {
  const id = `job_${nanoid(16)}`;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO ai_jobs
    (id, organization_id, project_id, zone_id, job_type, status, stage, progress, provider, provider_job_id, input_json, output_json, error_json, retry_count, max_retries, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'queued', 'queued', 0, ?, ?, ?, NULL, NULL, 0, 3, ?, ?)`).run(
    id,
    organizationId || null,
    String(projectId || 'unknown'),
    zoneId || null,
    String(jobType),
    provider,
    providerJobId,
    JSON.stringify(inputJson),
    now,
    now
  );

  return {
    jobId: id,
    job: {
      id,
      organization_id: organizationId || null,
      project_id: String(projectId || 'unknown'),
      zone_id: zoneId || null,
      job_type: String(jobType),
      status: 'queued',
      stage: 'queued',
      progress: 0,
      provider,
      provider_job_id: providerJobId,
      input_json: inputJson,
      retryCount: 0,
      maxRetries: 3,
      created_at: now,
      updated_at: now
    }
  };
}

export function getJob(jobId) {
  const row = db.prepare('SELECT * FROM ai_jobs WHERE id = ?').get(jobId);
  if (!row) return null;
  return mapJobRow(row);
}

export function listJobs(filters = {}) {
  const clauses = [];
  const args = [];
  if (filters.projectId) { clauses.push('project_id = ?'); args.push(String(filters.projectId)); }
  if (filters.zoneId) { clauses.push('zone_id = ?'); args.push(String(filters.zoneId)); }
  if (filters.jobType) { clauses.push('job_type = ?'); args.push(String(filters.jobType)); }
  if (filters.status) { clauses.push('status = ?'); args.push(String(filters.status)); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.prepare(`SELECT * FROM ai_jobs ${where} ORDER BY created_at DESC`).all(...args).map(mapJobRow);
}

export function updateJobStatus(jobId, updates = {}) {
  const sets = ['updated_at = ?'];
  const values = [new Date().toISOString()];
  if (updates.status) { sets.push('status = ?'); values.push(updates.status); }
  if (updates.stage) { sets.push('stage = ?'); values.push(updates.stage); }
  if (updates.progress !== undefined) { sets.push('progress = ?'); values.push(updates.progress); }
  if (updates.output_json !== undefined) { sets.push('output_json = ?'); values.push(JSON.stringify(updates.output_json)); }
  if (updates.error_json !== undefined) { sets.push('error_json = ?'); values.push(JSON.stringify(updates.error_json)); }
  if (updates.provider !== undefined) { sets.push('provider = ?'); values.push(updates.provider); }
  if (updates.provider_job_id !== undefined) { sets.push('provider_job_id = ?'); values.push(updates.provider_job_id); }
  values.push(jobId);
  db.prepare(`UPDATE ai_jobs SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function incrementRetry(jobId) {
  const row = db.prepare('SELECT retry_count, max_retries FROM ai_jobs WHERE id = ?').get(jobId);
  const next = ((row?.retry_count || 0) + 1);
  const failed = next > (row?.max_retries || 3);
  db.prepare("UPDATE ai_jobs SET retry_count = ?, status = ?, stage = ?, updated_at = ? WHERE id = ?")
    .run(next, failed ? 'failed' : 'queued', failed ? 'failed' : 'queued_retry', new Date().toISOString(), jobId);
  return next;
}

export function cancelJob(jobId) {
  const row = db.prepare('SELECT * FROM ai_jobs WHERE id = ?').get(jobId);
  if (!row) return null;
  db.prepare("UPDATE ai_jobs SET status = 'cancelled', stage = 'cancelled', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), jobId);
  return mapJobRow({ ...row, status: 'cancelled', stage: 'cancelled' });
}

export function enqueueJob({ organizationId, projectId, zoneId, jobType, provider, providerJobId, inputJson }) {
  const { jobId } = createJob({ organizationId, projectId, zoneId, jobType, provider, providerJobId, inputJson });
  const queue = new Queue(jobType, { connection });
  queue.add(jobType, { jobId, projectId, zoneId, inputJson }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: false,
    removeOnFail: false
  }).catch(() => {});
  return { jobId, queued: true };
}

export function getProviderStatuses() {
  try { return getProviderStatus(); } catch {
    return { providers: {}, live: false };
  }
}

function mapJobRow(row) {
  return {
    id: row.id,
    organization_id: row.organization_id || null,
    project_id: row.project_id,
    zone_id: row.zone_id || null,
    job_type: row.job_type,
    status: row.status,
    stage: row.stage,
    progress: Number(row.progress || 0),
    provider: row.provider || null,
    provider_job_id: row.provider_job_id || null,
    input_json: safeJson(row.input_json, null),
    output_json: row.output_json ? safeJson(row.output_json, null) : undefined,
    error_json: row.error_json ? safeJson(row.error_json, null) : undefined,
    retryCount: Number(row.retry_count || 0),
    maxRetries: Number(row.max_retries || 3),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function safeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
