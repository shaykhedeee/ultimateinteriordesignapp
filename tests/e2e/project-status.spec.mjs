// Functional test: new projects must start at the intake stage, not the
// terminal 'closed' state. Guards against regression of the project-status defect.
import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers.mjs';

test('POST /api/projects creates a project in the intake stage (not closed)', async ({ request }) => {
  const res = await request.post(`${BASE_URL}/api/projects`, {
    data: { name: `StatusCheck ${Date.now()}`, client_name: 'SC', budget: 500000 }
  });
  expect(res.status()).toBe(201);
  const project = await res.json();
  expect(project.id, 'project should have an id').toBeTruthy();
  expect(project.status, `new project status was "${project.status}"`).toBe('brief');
  expect(project.current_step).toBe('brief');
  // Cleanup
  await request.delete(`${BASE_URL}/api/projects/${project.id}`).catch(() => {});
});
