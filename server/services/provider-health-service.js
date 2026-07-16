const { performance } = require('perf_hooks');

class ProviderHealthService {
  constructor() {
    this.lastHeardAt = new Map();
    this.successStreak = new Map();
    this.failureStreak = new Map();
    this.circuitState = new Map();
    this.defaultEntry = () => ({ open: false, halfOpenAt: 0 }, { failures: 0, successes: 0 });
  }

  entry(provider) {
    const k = String(provider || 'mock').toLowerCase();
    const state = this.circuitState.get(k) || { open: false, halfOpenAt: 0 };
    if (state.open && state.halfOpenAt && state.halfOpenAt <= Date.now()) {
      state.open = false;
      this.circuitState.set(k, state);
    }
    return state;
  }

  recordSuccess(provider) {
    const k = String(provider || 'mock').toLowerCase();
    const s = this.entry(k);
    const failures = this.failureStreak.get(k) || 0;
    const successes = (this.successStreak.get(k) || 0) + 1;
    this.successStreak.set(k, successes);
    this.failureStreak.set(k, 0);
    this.lastHeardAt.set(k, Date.now());
    if (!s.open && successes >= 2) {
      this.successStreak.set(k, 0);
    }
  }

  recordFailure(provider, context = {}) {
    const k = String(provider || 'mock').toLowerCase();
    const failures = (this.failureStreak.get(k) || 0) + 1;
    this.failureStreak.set(k, failures);
    this.successStreak.set(k, 0);
    this.lastHeardAt.set(k, Date.now());
    const s = this.entry(k);
    if (failures >= 3) {
      const backoffMs = 5000 + Math.min(60000, failures * 2000);
      s.open = true;
      s.halfOpenAt = Date.now() + backoffMs;
      s.failures = failures;
      this.circuitState.set(k, s);
    }
    return failures;
  }

  degradationFallback({ provider, taskType, fallbackReason }) {
    return {
      ok: true,
      fallback: true,
      provider: 'mock',
      taskType,
      fallbackReason: String(fallbackReason || 'provider_unavailable').replace(/[^a-zA-Z0-9 _-]/g, ''),
      output: {
        text: `Provider '${provider}' degraded. Returning safe mock output.`,
        providerHistory: [provider, 'mock']
      }
    };
  }

  snapshot(statusFn) {
    const providers = Array.from(this.lastHeardAt.keys());
    const out = providers.map((provider) => {
      const state = this.entry(provider);
      const failures = this.failureStreak.get(provider) || 0;
      const successes = this.successStreak.get(provider) || 0;
      let liveStatus = 'configured';
      if (state.open) liveStatus = 'degraded';
      else if (failures > 0) liveStatus = 'issues';
      if (statusFn && typeof statusFn === 'function') {
        try {
          const live = statusFn(provider);
          if (!live) liveStatus = 'not_configured';
        } catch {
          liveStatus = 'not_configured';
        }
      }
      return {
        provider,
        liveStatus,
        circuitState: state.open ? 'open' : 'closed',
        failures,
        successes,
        lastHeardAt: this.lastHeardAt.get(provider) ? new Date(this.lastHeardAt.get(provider)).toISOString() : null,
        halfOpenAt: state.halfOpenAt ? new Date(state.halfOpenAt).toISOString() : null
      };
    });
    return out;
  }
}

const svc = new ProviderHealthService();

const REQUIRED_FIELDS = new Set([
  'providerChip',
  'retryConfig',
  'version',
  'providerStatus',
  'sectionError'
]);

const softFail = (entry) => {
  const hasMissing = Array.isArray(entry.missingFields) && entry.missingFields.length > 0;
  const hasAdvisory = Array.isArray(entry.advisories) && entry.advisories.length > 0;
  const grade = !hasMissing && !hasAdvisory ? 'ok' : hasMissing ? 'warn' : 'advised';
  return { ...entry, grade, failed: hasMissing };
};

const validateProviderResponse = (providerLabel) => (input = {}) => {
  const required = {
    ok: 'boolean',
    provider: 'string',
    taskType: 'string',
    retries: 'number',
    circuitState: 'string',
    latencyMs: 'number',
    operationId: 'string',
    requestedAt: 'string'
  };

  const missingFields = [];
  for (const [field, expectedType] of Object.entries(required)) {
    if (field in input) continue;
    missingFields.push(field);
  }

  const advisories = [];
  if (typeof input.retryDelayMs === 'number' && input.retryDelayMs > 30000) {
    advisories.push('retryDelayMs exceeds 30s');
  }
  if ((typeof input.latencyMs === 'number' && input.latencyMs > 0) && typeof input.retryAfterMs === 'number' && input.retryAfterMs > 0 && input.retryAfterMs < input.latencyMs) {
    advisories.push('retryAfterMs is earlier than observed latency');
  }

  const requiredChecks = {
    providerChip: Boolean(input.ok && input.provider && input.taskType),
    retryConfig: typeof input.retries === 'number' && typeof input.retryDelayMs === 'number',
    version: typeof input.version === 'string',
    providerStatus: typeof input.circuitState === 'string',
    sectionError: !(Array.isArray(input.missingFields) && input.missingFields.length > 0) || typeof input.sectionError === 'string'
  };

  const presentChecks = Object.values(requiredChecks);
  const passed = presentChecks.filter(Boolean).length;
  const total = presentChecks.length;
  const entry = {
    provider: providerLabel || input.provider || 'unknown',
    passed,
    total,
    percent: total ? Math.round((passed / total) * 100) : 0,
    requiredFields: Object.keys(required),
    missingFields,
    advisories,
    checklist: requiredChecks,
    score: ((passed / total) * 100).toFixed(1) + '%'
  };

  return softFail(entry);
};

const validateProviderResponseSet = (healthBranch) => (input = {}) => {
  const writers = Array.isArray(input.writers) ? input.writers : [];
  const sorted = [...writers].sort((a, b) => (b.percent || 0) - (a.percent || 0));
  const results = sorted.map((entry) => validateProviderResponse(entry.provider)(entry));
  const failures = results.filter((e) => e && e.failed);
  const overallPassed = results.reduce((acc, e) => acc + e.passed, 0);
  const overallTotal = results.reduce((acc, e) => acc + e.total, 0);
  const overallPercent = overallTotal ? Math.round((overallPassed / overallTotal) * 100) : 0;
  const actionable = failures.map((e) => `Provider '${e.provider}' fails validator checks`).join('; ');
  const fallback = failures.length
    ? 'Missing required validation response structures'
    : 'More writers should be enabled in production for this branch.';
  const remediation = failures.length
    ? '`enableDefaultValidations(\\\`' + (healthBranch || '') + '\\\`)`'
    : 'Enable writer options.';
  return {
    healthBranch: healthBranch || null,
    transformerRole: 'response-health-checker',
    status: overallPercent >= 100 ? 'ok' : 'warn',
    overallScore: overallPercent,
    actionable,
    fallback,
    remediation,
    enablementCommand: `enableDefaultValidationResponses('${healthBranch || 'default'}')`,
    results
  };
};

class DiagnosticBus {
  constructor() {
    this.sections = new Map();
    this.overall = 'ok';
    this.updatedAt = null;
    this.counters = { writes: 0 };
  }

  write(healthBranch, provider, entry = {}) {
    const key = `${String(healthBranch || '').trim().toLowerCase() || 'global'}:${String(provider || 'mock').toLowerCase()}`;
    this.counters.writes += 1;
    const record = {
      provider,
      sectionError: entry.sectionError || null,
      missingFields: Array.isArray(entry.missingFields) ? entry.missingFields : [],
      advisories: Array.isArray(entry.advisories) ? entry.advisories : [],
      checklist: entry.checklist || {},
      passed: typeof entry.passed === 'number' ? entry.passed : 0,
      total: typeof entry.total === 'number' ? entry.total : 0,
      percent: typeof entry.percent === 'number' ? entry.percent : 0,
      updatedAt: new Date().toISOString()
    };
    this.sections.set(key, record);
    if (record.missingFields.length > 0 || record.sectionError) {
      this.overall = 'degraded';
    } else if (this.overall === 'ok' && record.advisories.length) {
      this.overall = 'advised';
    }
    this.updatedAt = new Date().toISOString();
    return record;
  }

  snapshotForHealth(healthBranch, providerLabels = []) {
    const providers = providerLabels.length ? providerLabels : [...new Set(Array.from(this.sections.keys()).map((key) => key.split(':').slice(1).join(':')))];
    const isShapeValid = (entry) => {
      const required = ['providerChip', 'retryConfig', 'version'];
      return required.every((field) => entry && entry.checklist && entry.checklist[field]);
    };
    const invalid = providers.some((provider) => {
      const key = `${String(healthBranch || '').trim().toLowerCase() || 'global'}:${String(provider || 'mock').toLowerCase()}`;
      const entry = this.sections.get(key);
      return !isShapeValid(entry);
    });

    const writers = providers.map((provider) => {
      const key = `${String(healthBranch || '').trim().toLowerCase() || 'global'}:${String(provider || 'mock').toLowerCase()}`;
      const entry = this.sections.get(key) || {};
      return {
        provider,
        missingFields: entry.missingFields || [],
        advisories: entry.advisories || [],
        passed: entry.passed || 0,
        total: entry.total || 0,
        percent: entry.percent || 0
      };
    });

    const actionable = invalid
      ? 'Enable providers to populate all required response fields: providerChip, retryConfig, version.'
      : 'More providers should exceed 80%';
    const fallback = invalid
      ? 'Enable providers to populate all required response fields during validation'
      : 'Fallback not active';
    const remediation = invalid
      ? 'enableDefaultValidationResponses(`' + (healthBranch || '') + '`)'
      : 'Continue';
    const out = {
      healthBranch: healthBranch || 'global',
      transformerRole: 'response-health-checker',
      status: invalid ? 'degraded' : 'ok',
      actionable,
      fallback,
      remediation,
      enablementCommand: `enableDefaultValidationResponses('${healthBranch || 'default'}')`,
      results: writers
    };
    return out;
  }

  snapshot() {
    return {
      overall: this.overall,
      updatedAt: this.updatedAt,
      writes: this.counters.writes,
      sections: Object.fromEntries(this.sections)
    };
  }
}

const bus = new DiagnosticBus();

const service = {
  circuit: svc,
  bus,
  execute: async (provider, taskType, payload, fn, fallbackFn) => {
    const k = String(provider || 'mock').toLowerCase();
    const state = svc.entry(k);
    if (state.open) {
      return fallbackFn && typeof fallbackFn === 'function'
        ? fallbackFn({ provider, taskType, payload, fallbackReason: 'circuit_state_open' })
        : svc.degradationFallback({ provider, taskType, fallbackReason: 'circuit_state_open' });
    }
    const start = performance.now();
    try {
      const result = await Promise.resolve(fn({ provider, taskType, payload }));
      svc.recordSuccess(provider);
      const latencyMs = Math.round(performance.now() - start);
      return { ...result, _cb: { state: 'success', latencyMs } };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const failures = svc.recordFailure(provider, err);
      try {
        const meta = {
          provider: k,
          taskType: String(taskType || '').toLowerCase(),
          circuitState: svc.entry(k),
          operationId: `invoke-${Date.now().toString(36)}`,
          requestedAt: new Date().toISOString(),
          retryDelayMs: 1000,
          retries: 1
        };
        for (const field of ['providerChip', 'retryConfig', 'version']) meta[field] = true;
        bus.write(meta.taskType, provider, {
          ...meta,
          sectionError: err?.message || String(err),
          missingFields: [],
          advisories: []
        });
      } catch {
        // diagnostic writes must not break request flow
      }
      return (fallbackFn && typeof fallbackFn === 'function')
        ? fallbackFn({ provider: k, taskType, payload, fallbackReason: 'provider_error', originalError: err?.message || String(err), latencyMs })
        : svc.degradationFallback({ provider: k, taskType, payload, fallbackReason: 'provider_error=' + (err?.message || String(err)), latencyMs });
    }
  },
  validateProviderResponse,
  invalidateMissingFields: (input = {}) => {
    const { response } = input;
    if (!response || typeof response !== 'object') {
      return { invalid: true, missingFields: [], returnValue: { ok: false, invalid: true } };
    }
    const missingFields = [...REQUIRED_FIELDS].filter((field) => !(field in response));
    return {
      invalid: missingFields.length > 0,
      missingFields,
      returnValue: missingFields.length ? { ok: false, invalid: true, missingFields, response } : null
    };
  },
  summarizeProviderHealth: (providerLabels = []) => {
    const uniqueProviders = providerLabels.map((p) => String(p).toLowerCase()).filter(Boolean);
    return svc.summary();
  },
  validateProviderResponseSet
};

module.exports = service;
