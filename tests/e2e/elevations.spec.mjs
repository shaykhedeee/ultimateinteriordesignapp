// E2E: Drawings & Elevations + Cutlist — guards the elevation/cutlist pipeline
// routing and the "cutlist from measured 2D wall elevations" flow we hardened.
// We assert the screens mount and the real production controls are present/clickable
// without throwing (catches routing/state regressions in the studio pipeline).
import { expect } from '@playwright/test';
import { projectTest, openProjectTab, BASE_URL } from './helpers.mjs';

const screenTitle = (page, name) => page.locator('.header-title', { hasText: name });

projectTest.describe('Drawings & Elevations', () => {
  projectTest('elevations studio mounts with generation controls', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'drawings');
    await expect(screenTitle(page, /Drawings & Elevations/i)).toBeVisible();
    // The "Generate All Unit Elevations (DXF + PDF)" action is always visible on
    // the default sub-tab (no dead buttons in the production surface).
    await expect(page.getByRole('button', { name: /Generate All Unit Elevations/i })).toBeVisible();
  });

  projectTest('photo-generated elevations tab is reachable', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'drawings');
    const photoTab = page.getByRole('button', { name: /Photo-Generated/i });
    await expect(photoTab).toBeVisible();
    await photoTab.click();
    // stays on the drawings surface (no route crash)
    await expect(screenTitle(page, /Drawings & Elevations/i)).toBeVisible();
  });
});

projectTest.describe('Cutlist & Nesting', () => {
  projectTest('cutlist screen mounts and exposes the calculate/refresh control', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'cutlist');
    await expect(page.getByTestId('nav-cutlist')).toHaveClass(/active/);
    await expect(page.locator('h2').first()).toBeVisible();
    // The production action is "Run Nesting Slices" (deterministic optimizer).
    const calc = page.getByRole('button', { name: /Run Nesting Slices/i }).first();
    await expect(calc).toBeVisible();
  });

  projectTest('clicking Run Nesting Slices refreshes the cutlist without crashing', async ({ page, project, request }) => {
    await openProjectTab(page, project.id, 'cutlist');
    const calc = page.getByRole('button', { name: /Run Nesting Slices/i }).first();
    await expect(calc).toBeVisible();
    // Seed a real cabinet set so the nesting run produces a cutlist (the screen
    // calls POST /cutlist/calculate with cabinets).
    const seed = await request.post(`${BASE_URL}/api/projects/${project.id}/cutlist/calculate`, {
      data: { cabinets: [{ name: 'Base Cabinet', width: 900, height: 720, depth: 560, carcassPly: 18, backPly: 6, plinthH: 100 }] }
    });
    expect(seed.status(), 'cutlist/calculate should accept a cabinet').toBe(200);
    await calc.click();
    // After refresh the cutlist API should return a project cutlist payload.
    const projectId = project.id;
    await expect
      .poll(
        async () => {
          const res = await page.request.get(`${BASE_URL}/api/projects/${projectId}/cutlist`);
          if (!res.ok()) return null;
          const data = await res.json();
          // A refreshed cutlist always carries an id + projectId.
          return data && data.id && data.projectId ? data : null;
        },
        { timeout: 90000, intervals: [1500] }
      )
      .not.toBeNull();
  });
});
