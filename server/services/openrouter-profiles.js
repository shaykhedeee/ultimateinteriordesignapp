const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistral/mistral-7b-instruct:free'
];

const PROFILES = {
  openrouter_free: {
    key: 'openrouter',
    provider: 'openrouter',
    models: FALLBACK_MODELS,
    temperature: 0.4,
    maxTokens: 1200,
    headers: {
      'HTTP-Referer': String(process.env.PUBLIC_APP_BASE_URL || 'http://localhost:3000'),
      'X-Title': String(process.env.PUBLIC_APP_TITLE || 'Ultimate Interior Design App')
    }
  },
  aura_primary: {
    key: 'openrouter',
    provider: 'openrouter',
    models: FALLBACK_MODELS,
    temperature: 0.35,
    maxTokens: 1400,
    headers: {
      'HTTP-Referer': String(process.env.PUBLIC_APP_BASE_URL || 'http://localhost:3000'),
      'X-Title': String(process.env.PUBLIC_APP_TITLE || 'Ultimate Interior Design App')
    }
  },
  aura_secondary: {
    key: 'openrouter',
    provider: 'openrouter',
    models: FALLBACK_MODELS,
    temperature: 0.5,
    maxTokens: 1000,
    headers: {
      'HTTP-Referer': String(process.env.PUBLIC_APP_BASE_URL || 'http://localhost:3000'),
      'X-Title': String(process.env.PUBLIC_APP_TITLE || 'Ultimate Interior Design App')
    }
  }
};

export function getProfile(name = 'openrouter_free') {
  return PROFILES[name] || PROFILES.openrouter_free;
}

export function listProfiles() {
  return Object.keys(PROFILES).map(name => ({
    name,
    provider: PROFILES[name].provider,
    models: PROFILES[name].models,
    temperature: PROFILES[name].temperature,
    maxTokens: PROFILES[name].maxTokens
  }));
}
