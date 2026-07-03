const { performance } = require('perf_hooks');

class ProviderCircuitBreaker {
  constructor() {
    this.states = new Map();
  }

  key(provider) {
    return String(provider || 'unknown').toLowerCase();
  }

  buildFallbackResult(provider, taskType, payload, fallbackReason) {
    return {
      ok: true,
      fallback: true,
      provider: 'mock',
      taskType,
      fallbackReason,
      output: {
        text: `Mock provider fallback for ${provider}. Reason: ${fallbackReason.replace(/[^a-zA-Z0-9 _-]/g, '')}`,
        providerHistory: [provider, 'mock']
      }
    };
  }

  recordSuccess(provider) {
    const k = this.key(provider);
    const current = this.states.get(k) || { state: 'closed', failures: 0, lastFailureAt: null };
    current.state = 'closed';
    current.failures = 0;
    current.lastFailureAt = null;
    current.nextAllowedAt = null;
    current.lastSuccessAt = Date.now();
    this.states.set(k, current);
  }

  recordFailure(provider, err) {
    const k = this.key(provider);
    const current = this.states.get(k) || { state: 'closed', failures: 0, lastFailureAt: null, nextAllowedAt: null };
    current.failures = (current.failures || 0) + 1;
    current.lastFailureAt = Date.now();
    const errorCode = typeof err === 'object' && err && err.code ? String(err.code) : 'unknown';
    if (current.failures >= 3 || errorCode === 401 || errorCode === 403) {
      current.state = 'open';
      const backoffMs = 5000 + Math.min(60000, current.failures * 2000);
      current.nextAllowedAt = Date.now() + backoffMs;
    }
    this.states.set(k, current);
  }

  canTry(provider) {
    const k = this.key(provider);
    const current = this.states.get(k) || { state: 'closed', failures: 0, nextAllowedAt: null };
    if (current.state === 'closed') return true;
    if (current.state === 'open' && current.nextAllowedAt && Date.now() >= current.nextAllowedAt) {
      current.state = 'half-open';
      current.failures = 0;
      this.states.set(k, current);
      return true;
    }
    return current.state === 'half-open';
  }

  status(provider) {
    const k = this.key(provider);
    const current = this.states.get(k) || { state: 'closed', failures: 0 };
    return {
      provider,
      state: current.state,
      failures: current.failures || 0,
      lastFailureAt: current.lastFailureAt ? new Date(current.lastFailureAt).toISOString() : null,
      nextAllowedAt: current.nextAllowedAt ? new Date(current.nextAllowedAt).toISOString() : null
    };
  }

  summary() {
    return Array.from(this.states.entries()).map(([provider, state]) => ({ provider, ...state }));
  }

  async execute(provider, taskType, payload, fn, fallbackFn) {
    const k = this.key(provider);
    if (!this.canTry(provider)) {
      const current = this.states.get(k) || {};
      return (fallbackFn && typeof fallbackFn === 'function')
        ? fallbackFn({ provider:k, taskType, payload, fallbackReason: `circuit_open_${current.state}` })
        : this.buildFallbackResult(provider, taskType, payload, 'circuit_state=' + current.state);
    }

    const start = performance.now();
    try {
      const result = await Promise.resolve(fn({ provider, taskType, payload }));
      const durationMs = Math.round(performance.now() - start);
      this.recordSuccess(provider);
      return { ...result, _cb: { durationMs, state: 'success' } };
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.recordFailure(provider, err);
      return (fallbackFn && typeof fallbackFn === 'function')
        ? fallbackFn({ provider:k, taskType, payload, fallbackReason: 'provider_error', originalError: err?.message || String(err), durationMs })
        : this.buildFallbackResult(provider, taskType, payload, 'provider_error=' + (err?.message || String(err)));
    }
  }
}

const breaker = new ProviderCircuitBreaker();
module.exports = breaker;
