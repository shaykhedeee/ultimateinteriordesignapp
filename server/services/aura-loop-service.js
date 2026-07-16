export const AURA_STATES = Object.freeze({
  IDLE: 'IDLE',
  GATHER: 'GATHER',
  PROPOSE: 'PROPOSE',
  ACT: 'ACT',
  VERIFY: 'VERIFY',
  RESPOND: 'RESPOND'
});

export const AURA_TRANSITIONS = Object.freeze({
  IDLE: ['GATHER'],
  GATHER: ['PROPOSE'],
  PROPOSE: ['ACT', 'VERIFY'],
  ACT: ['VERIFY'],
  VERIFY: ['RESPOND'],
  RESPOND: ['IDLE']
});

export class AuraLoopService {
  constructor() {
    this.sessions = new Map();
  }

  startSession({ sessionId, projectId, goal, successCriteria = [], maxIterations = 10, budgetMs = 120000 }) {
    if (!sessionId || !projectId || !goal) {
      return { ok: false, error: 'Missing sessionId, projectId, or goal' };
    }
    const session = {
      id: sessionId,
      projectId,
      goal,
      state: AURA_STATES.IDLE,
      history: [],
      iterations: 0,
      maxIterations,
      budgetMs,
      startMs: Date.now(),
      lastProgressMs: Date.now(),
      successCriteria: Array.isArray(successCriteria) ? successCriteria : [],
      scratch: {
        promptPane: null,
        contextPane: null,
        receiptPane: [],
        nextActions: [],
        verificationResults: [],
        responseText: null
      }
    };
    this.sessions.set(sessionId, session);
    return { ok: true, session };
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  step(sessionId, payload = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: 'Session not found' };

    const elapsed = Date.now() - session.startMs;
    if (elapsed > session.budgetMs) {
      return { ok: false, error: 'Budget exceeded', state: session.state, session };
    }

    if (payload.abort) {
      session.scratch.responseText = session.scratch.responseText || 'Aborted by user.';
      session.state = AURA_STATES.RESPOND;
      return this._resolveResponse(session);
    }

    if (session.iterations >= session.maxIterations) {
      session.scratch.responseText = session.scratch.responseText || 'Stopped: max iterations reached.';
      session.state = AURA_STATES.RESPOND;
      return this._resolveResponse(session);
    }

    const noProgress = Date.now() - session.lastProgressMs > 30000;
    if (noProgress && session.state !== AURA_STATES.IDLE) {
      session.scratch.responseText = session.scratch.responseText || 'Stopped: no progress within 30s.';
      session.state = AURA_STATES.RESPOND;
      return this._resolveResponse(session);
    }

    const allowedNext = AURA_TRANSITIONS[session.state] || [];
    const requestedNext = payload.nextState;
    const nextState = requestedNext && allowedNext.includes(requestedNext) ? requestedNext : allowedNext[0];

    if (!nextState) {
      return { ok: false, error: 'No valid next state', state: session.state, session };
    }

    session.state = nextState;
    this._applyStateEffects(session, payload);
    session.iterations += 1;
    session.history.push({ state: session.state, at: Date.now(), payload });

    if (session.state === AURA_STATES.RESPOND) {
      return this._resolveResponse(session);
    }

    return { ok: true, state: session.state, iteration: session.iterations, scratch: session.scratch, session };
  }

  updateScratch(sessionId, patch = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: 'Session not found' };
    const allowed = ['promptPane','contextPane','receiptPane','nextActions','verificationResults','responseText'];
    for (const key of Object.keys(patch)) {
      if (!allowed.includes(key)) continue;
      if (key === 'receiptPane') {
        session.scratch.receiptPane = Array.isArray(patch.receiptPane) ? patch.receiptPane : session.scratch.receiptPane;
      } else if (key === 'nextActions') {
        session.scratch.nextActions = Array.isArray(patch.nextActions) ? patch.nextActions : session.scratch.nextActions;
      } else if (key === 'verificationResults') {
        session.scratch.verificationResults = Array.isArray(patch.verificationResults) ? patch.verificationResults : session.scratch.verificationResults;
      } else {
        session.scratch[key] = patch[key];
      }
    }
    session.lastProgressMs = Date.now();
    return { ok: true, scratch: session.scratch, session };
  }

  progress(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: 'Session not found' };
    session.lastProgressMs = Date.now();
    return { ok: true, state: session.state, iteration: session.iterations, scratch: session.scratch, session };
  }

  _applyStateEffects(session, payload) {
    const state = session.state;
    if (state === AURA_STATES.GATHER) {
      session.scratch.promptPane = payload.promptPane ?? session.scratch.promptPane;
      session.scratch.contextPane = payload.contextPane ?? session.scratch.contextPane;
      session.scratch.receiptPane = Array.isArray(payload.receiptPane) ? payload.receiptPane : session.scratch.receiptPane;
    }
    if (state === AURA_STATES.PROPOSE) {
      session.scratch.nextActions = Array.isArray(payload.nextActions) ? payload.nextActions : session.scratch.nextActions;
    }
    if (state === AURA_STATES.ACT) {
      session.scratch.receiptPane = Array.isArray(payload.receiptPane)
        ? payload.receiptPane
        : session.scratch.receiptPane;
    }
    if (state === AURA_STATES.VERIFY) {
      session.scratch.verificationResults = Array.isArray(payload.verificationResults)
        ? payload.verificationResults
        : session.scratch.verificationResults;
    }
    if (state === AURA_STATES.RESPOND) {
      session.scratch.responseText = payload.responseText ?? session.scratch.responseText;
    }
    session.lastProgressMs = Date.now();
  }

  _resolveResponse(session) {
    const allPassed = Array.isArray(session.scratch.verificationResults) && session.scratch.verificationResults.every(r => r.passed);
    const anyCriteria = session.successCriteria.length > 0;
    const criteriaSatisfied = anyCriteria ? this._checkSuccessCriteria(session) : null;
    return {
      ok: true,
      state: session.state,
      iteration: session.iterations,
      scratch: session.scratch,
      completed: true,
      passedVerification: allPassed,
      criteriaSatisfied,
      session
    };
  }

  _checkSuccessCriteria(session) {
    const latest = session.scratch.responseText || '';
    const receipts = session.scratch.receiptPane || [];
    return session.successCriteria.every(criterion => {
      if (!criterion || typeof criterion !== 'string') return true;
      const text = (latest + ' ' + receipts.map(r => (r.output || r.text || '')).join(' ')).toLowerCase();
      return text.includes(criterion.toLowerCase());
    });
  }
}
