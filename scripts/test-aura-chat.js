import { chatAura, getAuraProviderStatus } from '../../server/services/aura-chat-service.js';

let fetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  fetchCalls.push({ input, init });
  return new Response(JSON.stringify({
    choices: [{ message: { content: 'mocked openrouter reply from test' } }]
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const originalEnv = process.env.OPENROUTER_API_KEY;
process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-mock-key-for-integration-test';

try {
  const statusBefore = getAuraProviderStatus();
  console.log('STATUS:', JSON.stringify(statusBefore));

  const result = await chatAura({
    message: 'integration test hello',
    history: [],
    context: 'test'
  });

  console.log('RESULT_PROVIDER:', result.provider);
  console.log('RESULT_REPLY:', result.reply);
  console.log('FETCH_CALLS:', fetchCalls.length);
  if (fetchCalls[0]) {
    console.log('FETCH_INPUT:', fetchCalls[0].input);
    console.log('FETCH_HEADERS:', JSON.stringify(fetchCalls[0].init?.headers));
  }

  if (result.provider === 'offline-fallback') {
    console.error('FAIL: still offline-fallback');
    process.exitCode = 1;
  } else {
    console.log('OK: live provider path reached');
  }
} finally {
  process.env.OPENROUTER_API_KEY = originalEnv;
  globalThis.fetch = originalFetch;
}
