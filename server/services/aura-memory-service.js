import db from '../database/database.js';
import { AURA_TASK_TYPES, AURA_TASK_TYPE_LIST, ROOM_TYPES } from './aura-service.js';

const MEMORY_ORG_PREFS_KEY = 'aura.org_prefs.v1';
const MEMORY_PROJECT_PROFILES_PREFIX = 'aura.project_profile.v1:';
const MEMORY_PROMPT_HISTORY_PREFIX = 'aura.prompt_history.v1:';
const MAX_PROJECT_MEMORY_BYTES = 200 * 1024;

export class AuraMemoryService {
  init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS aura_prompt_versions (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        prompt_family TEXT NOT NULL,
        version_name TEXT NOT NULL,
        system_prompt TEXT,
        developer_prompt TEXT,
        response_schema_json TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_training_candidates (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        source_task_id TEXT,
        candidate_type TEXT NOT NULL,
        task_type TEXT NOT NULL,
        input_json TEXT NOT NULL,
        target_json TEXT,
        rejected_json TEXT,
        quality_score REAL,
        curation_status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        curated_at TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_eval_cases (
        id TEXT PRIMARY KEY,
        task_type TEXT NOT NULL,
        input_json TEXT NOT NULL,
        expected_output_json TEXT NOT NULL,
        rubric_json TEXT,
        difficulty TEXT,
        tags_json TEXT DEFAULT '[]',
        source TEXT DEFAULT 'synthetic',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_eval_runs (
        id TEXT PRIMARY KEY,
        model_backend TEXT NOT NULL,
        model_version TEXT NOT NULL,
        prompt_version_id TEXT,
        run_label TEXT,
        summary_json TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_eval_results (
        id TEXT PRIMARY KEY,
        eval_run_id TEXT NOT NULL,
        eval_case_id TEXT NOT NULL,
        output_json TEXT,
        score REAL,
        passed INTEGER,
        failure_modes_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_preferences (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        scope_id TEXT,
        preference_type TEXT NOT NULL,
        preference_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_critique_results (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        render_id TEXT NOT NULL,
        source_task_id TEXT,
        critique_json TEXT NOT NULL,
        approved INTEGER,
        human_override INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_tasks (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        project_id TEXT,
        zone_id TEXT,
        render_id TEXT,
        task_type TEXT NOT NULL,
        model_backend TEXT,
        model_version TEXT,
        prompt_version_id TEXT,
        input_json TEXT NOT NULL,
        raw_output_text TEXT,
        parsed_output_json TEXT,
        parse_valid INTEGER NOT NULL DEFAULT 0,
        confidence_score REAL,
        latency_ms INTEGER,
        token_input INTEGER,
        token_output INTEGER,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS aura_feedback (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        aura_task_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_id TEXT,
        rating_overall INTEGER,
        rating_accuracy INTEGER,
        rating_style INTEGER,
        rating_usefulness INTEGER,
        feedback_notes TEXT,
        diff_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `, { timeout: 10000, busyTimeout: 5000 });
  }

  getProjectContext({ organizationId, projectId }) {
    const projectProfile = this.#getProjectProfile(projectId);
    const recentAccepted = projectProfile?.recentAcceptedPlans || [];
    const recentPromptVersions = this.#getRecentPromptVersions(projectId);
    const orgPrefs = this.#getOrgPrefs(organizationId);
    return {
      projectId,
      organizationId,
      recentAcceptedPlans: recentAccepted.slice(-8),
      recentPromptVersions,
      orgPrefs
    };
  }

  recordTask({ organizationId, projectId, zoneId, renderId, taskType, modelBackend, modelVersion, promptVersionId, inputJson, latencyMs, tokenInput, tokenOutput, createdBy }) {
    const id = 'aura_task_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_tasks (id, organization_id, project_id, zone_id, render_id, task_type, model_backend, model_version, prompt_version_id, input_json, latency_ms, token_input, token_output, parse_valid, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`)
      .run(id, organizationId || null, projectId || null, zoneId || null, renderId || null, taskType, modelBackend || null, modelVersion || null, promptVersionId || null, JSON.stringify(inputJson || {}), latencyMs || null, tokenInput || null, tokenOutput || null, createdBy || null);
    return id;
  }

  updateTaskParsed(taskId, rawOutputText, parsedOutputJson, parseValid, confidenceScore) {
    db.prepare(`UPDATE aura_tasks SET raw_output_text = ?, parsed_output_json = ?, parse_valid = ?, confidence_score = ? WHERE id = ?`)
      .run(rawOutputText || null, JSON.stringify(parsedOutputJson || {}), parseValid ? 1 : 0, confidenceScore ?? null, taskId);
  }

  recordFeedback({ organizationId, auraTaskId, feedbackType, actorType = 'system', actorId, ratings, notes, diffJson }) {
    const id = 'aura_fb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_feedback (id, organization_id, aura_task_id, feedback_type, actor_type, actor_id, rating_overall, rating_accuracy, rating_style, rating_usefulness, feedback_notes, diff_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, auraTaskId, feedbackType, actorType, actorId || null, ratings?.overall || null, ratings?.accuracy || null, ratings?.style || null, ratings?.usefulness || null, notes || null, diffJson ? JSON.stringify(diffJson) : null);
    return id;
  }

  recordCritique({ organizationId, renderId, sourceTaskId, critique, approved, humanOverride = false }) {
    const id = 'aura_crit_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_critique_results (id, organization_id, render_id, source_task_id, critique_json, approved, human_override) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, renderId, sourceTaskId || null, JSON.stringify(critique), approved ? 1 : 0, humanOverride ? 1 : 0);
    return id;
  }

  recordPromptVersion({ organizationId, promptFamily, versionName, systemPrompt, developerPrompt, responseSchemaJson, isActive = false }) {
    const id = 'aura_prompt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_prompt_versions (id, organization_id, prompt_family, version_name, system_prompt, developer_prompt, response_schema_json, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId || null, promptFamily, versionName, systemPrompt || null, developerPrompt || null, JSON.stringify(responseSchemaJson || {}), isActive ? 1 : 0);
    return id;
  }

  recordTrainingCandidate({ organizationId, sourceTaskId, candidateType, taskType, inputJson, targetJson, rejectedJson, qualityScore }) {
    const id = 'aura_train_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_training_candidates (id, organization_id, source_task_id, candidate_type, task_type, input_json, target_json, rejected_json, quality_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId || null, sourceTaskId || null, candidateType, taskType, JSON.stringify(inputJson || {}), targetJson ? JSON.stringify(targetJson) : null, rejectedJson ? JSON.stringify(rejectedJson) : null, qualityScore ?? null);
    return id;
  }

  updateProjectMemory({ projectId, acceptedPlan, promptVersion }) {
    const key = MEMORY_PROJECT_PROFILES_PREFIX + projectId;
    const existing = this.#getJson(key, { recentAcceptedPlans: [], recentPromptVersions: [] });
    const recentAcceptedPlans = [...(existing.recentAcceptedPlans || []), acceptedPlan].slice(-20);
    const recentPromptVersions = [...(existing.recentPromptVersions || [])];
    if (promptVersion) recentPromptVersions.push(promptVersion);
    const payload = { recentAcceptedPlans, recentPromptVersions: recentPromptVersions.slice(-20) };
    this.#setJson(key, payload);
  }

  #getProjectProfile(projectId) {
    return this.#getJson(MEMORY_PROJECT_PROFILES_PREFIX + projectId, null);
  }

  #getRecentPromptVersions(projectId) {
    const profile = this.#getProjectProfile(projectId);
    if (!profile) return [];
    return Array.isArray(profile.recentPromptVersions) ? profile.recentPromptVersions.slice(-20) : [];
  }

  #getOrgPrefs(organizationId) {
    return this.#getJson(MEMORY_ORG_PREFS_KEY, []);
  }

  #getJson(key, fallback) {
    try {
      const row = db.prepare('SELECT value_json FROM aura_memory_store WHERE key = ?').get(key);
      if (!row) return fallback;
      return JSON.parse(row.value_json);
    } catch {
      return fallback;
    }
  }

  #setJson(key, value) {
    const serialized = JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO aura_memory_store (key, value_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, serialized);
  }

  async logAcceptanceFeedback({ organizationId, projectId, taskId, feedbackType, notes, rating }) {
    const id = 'aura_fb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    db.prepare(`INSERT INTO aura_feedback (id, organization_id, aura_task_id, feedback_type, actor_type, actor_id, rating_overall, feedback_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId || null, taskId || null, feedbackType || 'accepted', 'system', 'aura-self-learning', typeof rating === 'number' ? rating : null, notes || null);
    return id;
  }

  async storeIndianLearnedPreference({ organizationId, preferenceType, preferenceJson }) {
    if (!preferenceJson || !organizationId) return null;
    const existing = this.#getJson(MEMORY_ORG_PREFS_KEY, []);
    const merged = Array.isArray(existing) ? existing.slice(-50) : [];
    merged.push({ preferenceType, preferenceJson, updatedAt: new Date().toISOString() });
    this.#setJson(MEMORY_ORG_PREFS_KEY, Array.from(new Map(merged.map(item => [item.preferenceType + ':' + JSON.stringify(item.preferenceJson), item])).values()));
    return true;
  }
}

export const auraMemory = new AuraMemoryService();
