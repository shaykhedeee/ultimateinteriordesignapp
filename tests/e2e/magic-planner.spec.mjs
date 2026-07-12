// E2E: "Magic Planner" journey — the AI brief intake + floor-plan intelligence
// flow that turns a blank project into a structured spatial model.
// Guards against routing/state regressions in: dashboard -> brief -> cad.
import { expect } from '@playwright/test';
import { projectTest, openProjectTab, BASE_URL } from './helpers.mjs';

// Screen titles render in <div class="header-title"> (not a heading role).
const screenTitle = (page, name) => page.locator('.header-title', { hasText: name });

projectTest.describe('Magic Planner flow', () => {
  projectTest('dashboard loads and shows the command center', async ({ page, project }) => {
    await page.goto(BASE_URL);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(screenTitle(page, /Command Center/i)).toBeVisible();
  });

  projectTest('navigating to Client Intake (brief) renders the form', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'brief');
    await expect(screenTitle(page, /Client Intake/i)).toBeVisible();
    await expect(page.locator('input, textarea, select').first()).toBeVisible();
  });

  projectTest('navigating to Plan Intelligence (CAD) renders the analysis surface', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'cad');
    await expect(screenTitle(page, /Plan Intelligence/i)).toBeVisible();
    // The CAD surface mounted (some interactive control is present).
    await expect(page.locator('button, canvas, svg, input, .cad-shell').first()).toBeVisible();
  });

  projectTest('full flow dashboard -> brief -> cad keeps state consistent', async ({ page, project }) => {
    await openProjectTab(page, project.id, 'dashboard');
    await openProjectTab(page, project.id, 'brief');
    await expect(screenTitle(page, /Client Intake/i)).toBeVisible();
    await openProjectTab(page, project.id, 'cad');
    await expect(screenTitle(page, /Plan Intelligence/i)).toBeVisible();
    await openProjectTab(page, project.id, 'dashboard');
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/active/);
  });
});
