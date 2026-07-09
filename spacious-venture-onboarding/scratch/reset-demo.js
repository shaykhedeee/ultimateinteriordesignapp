import { resetDemoWorkspace } from '../server/services/backup-service.js';

async function run() {
  console.log('Resetting demo workspace...');
  try {
    const result = await resetDemoWorkspace();
    console.log('✅ Demo workspace reset successfully!');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Failed to reset demo workspace:', err);
  }
}

run();
