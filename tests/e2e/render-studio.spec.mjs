// E2E: 3D Render Studio — guards routing + the render-generation pipeline state.
// Without an API key the backend returns a mock placeholder render, so we can
// still assert the studio mounts, the Generate action fires, and a render record
// is created without crashing (catches regressions in SSE/progress/state wiring).
import { expect } from '@playwright/test';
import { projectTest, openProjectTab, BASE_URL } from './helpers.mjs';

const screenTitle = (page, name) => page.locator('.header-title', { hasText: name });

projectTest.describe('3D Render Studio', () => {
  projectTest('studio mounts with the generate control', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'renders');
    await expect(screenTitle(page, /3D AI Render Studio/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Renders/i })).toBeVisible();
  });

  projectTest('clicking Generate Renders creates a render record (no crash)', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'renders');
    const genBtn = page.getByRole('button', { name: /Generate Renders/i });
    await expect(genBtn).toBeVisible();

    await genBtn.click();

    // Poll the API until a render appears (backend mock placeholder path).
    const projectId = project.id;
    await expect
      .poll(
        async () => {
          const res = await page.request.get(`${BASE_URL}/api/projects/${projectId}/renders`);
          if (!res.ok()) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data.renders || []);
        },
        { timeout: 90000, intervals: [1500] }
      )
      .not.toHaveLength(0);

    // The UI should reflect the new render without throwing.
    await expect(page.getByText(/Render|render/i).first()).toBeVisible();
  });
});
