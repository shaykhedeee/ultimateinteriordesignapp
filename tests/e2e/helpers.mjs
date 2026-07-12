// Shared helpers for ULTIDA end-to-end (Playwright) suites.
// Boots against the already-running server (see playwright.config.mjs webServer),
// seeds a project via the real API, and clicks through the tab-state SPA by
// stable data-testid selectors (nav-<tab>). No flaky text matching.
import { test, expect } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5055';

// Create a real project through the API so specs have a projectId to bind to.
export async function seedProject(request, overrides = {}) {
  const res = await request.post(`${BASE_URL}/api/projects`, {
    data: {
      name: overrides.name || `E2E ${Date.now()}`,
      client_name: overrides.client_name || 'E2E Client',
      budget: overrides.budget || 800000,
      ...overrides
    }
  });
  expect(res.status(), 'POST /api/projects should be 201').toBe(201);
  const project = await res.json();
  expect(project.id, 'project should have an id').toBeTruthy();
  return project;
}

// Make every navigation on this page bind the given project via localStorage,
// the same way App.jsx reads it on boot. Using addInitScript avoids a double
// reload (which re-downloads the large SPA bundle twice per test).
export async function bindProject(page, projectId) {
  await page.addInitScript((pid) => {
    localStorage.setItem('ultida_project', pid);
    localStorage.setItem('ultida_tab', 'dashboard');
  }, projectId);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  // Hydration is proven once the sidebar nav renders.
  await page.getByTestId('nav-dashboard').waitFor({ state: 'visible', timeout: 30000 });
}

// Click a sidebar nav item by its stable data-testid and wait for the panel to mount.
export async function gotoTab(page, tabId) {
  const btn = page.getByTestId(`nav-${tabId}`);
  await expect(btn, `nav-${tabId} should be present`).toBeVisible();
  await btn.click();
  // The active tab button gains the .active class — confirm the switch stuck.
  await expect(btn, `nav-${tabId} should become active`).toHaveClass(/active/);
  // Give the screen a tick to mount its controls.
  await page.waitForTimeout(400);
}

// Convenience: navigate to a tab only when a project is bound.
export async function openProjectTab(page, projectId, tabId) {
  await bindProject(page, projectId);
  await gotoTab(page, tabId);
}

// Delete a seeded project + its dependents through the real API (cascade).
export async function deleteProject(request, projectId) {
  await request.delete(`${BASE_URL}/api/projects/${projectId}`).catch(() => {});
}

// Base fixture that seeds a project once per test and tears it down after.
export const projectTest = test.extend({
  project: async ({ request }, use) => {
    const project = await seedProject(request);
    await use(project);
    await deleteProject(request, project.id);
  }
});
