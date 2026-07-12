// Playwright config for ULTIDA end-to-end QA.
// Boots the REAL app (vite build + node server/index.js on BASE_URL) and runs
// specs that click through the SPA so routing/state regressions are caught
// automatically. Run:  npm run test:e2e   (or npx playwright test tests/e2e)
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5055';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-gpu', '--disable-dev-shm-usage'] } } }
  ],
  // Build the production bundle and start the server; wait until the API responds.
  webServer: {
    command: 'npm run build && node server/index.js',
    cwd: path.resolve(__dirname, '../..'),
    url: `${BASE_URL}/api/projects`,
    reuseExistingServer: true,
    timeout: 180000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { PORT: '5055', NODE_ENV: 'test' }
  }
});
