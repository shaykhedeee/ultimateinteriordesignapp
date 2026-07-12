// Regression tests for subscription-validator.js — feature-gating / tier matrix.
// Guards the monetization gate: each tier must expose exactly the right products,
// and checkAccess must 403 when a product is not in the tier (and pass otherwise).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAccess, PRODUCTS, TIERS } from '../server/services/subscription-validator.js';

test('TIERS matrix: free < professional < enterprise (strict superset)', () => {
  assert.deepEqual(TIERS.free, [PRODUCTS.PLAN_INTELLIGENCE]);
  assert.deepEqual(TIERS.professional, [PRODUCTS.PLAN_INTELLIGENCE, PRODUCTS.RENDER_STUDIO]);
  assert.deepEqual(TIERS.enterprise, [PRODUCTS.PLAN_INTELLIGENCE, PRODUCTS.RENDER_STUDIO, PRODUCTS.PRODUCTION_NESTING]);
  // enterprise is a strict superset of professional, which is a superset of free
  for (const p of TIERS.free) assert.ok(TIERS.professional.includes(p));
  for (const p of TIERS.professional) assert.ok(TIERS.enterprise.includes(p));
});

test('checkAccess: developer mode (no env) allows ALL products (enterprise default)', () => {
  delete process.env.STUDIO_SUBSCRIPTION_TIER;
  for (const p of Object.values(PRODUCTS)) {
    let nexted = false;
    const mw = checkAccess(p);
    mw({}, { status() { return this; }, json() { return this; } }, () => { nexted = true; });
    assert.ok(nexted, `dev mode should allow ${p}`);
  }
});

test('checkAccess: free tier is blocked from render_studio + production_nesting (403)', () => {
  process.env.STUDIO_SUBSCRIPTION_TIER = 'free';
  for (const blocked of [PRODUCTS.RENDER_STUDIO, PRODUCTS.PRODUCTION_NESTING]) {
    let status = null, nexted = false;
    const mw = checkAccess(blocked);
    mw({}, { status(c) { status = c; return this; }, json() { return this; } }, () => { nexted = true; });
    assert.equal(status, 403, `free blocked from ${blocked}`);
    assert.equal(nexted, false);
  }
  // free tier MAY access plan_intelligence
  let nexted = false;
  checkAccess(PRODUCTS.PLAN_INTELLIGENCE)({}, { status() { return this; }, json() { return this; } }, () => { nexted = true; });
  assert.ok(nexted, 'free may access plan_intelligence');
  delete process.env.STUDIO_SUBSCRIPTION_TIER;
});

test('checkAccess: professional tier blocked from production_nesting only', () => {
  process.env.STUDIO_SUBSCRIPTION_TIER = 'professional';
  let status = null;
  const mw = checkAccess(PRODUCTS.PRODUCTION_NESTING);
  mw({}, { status(c) { status = c; return this; }, json() { return this; } }, () => {});
  assert.equal(status, 403, 'professional blocked from production_nesting');
  // professional may access render_studio
  let nexted = false;
  checkAccess(PRODUCTS.RENDER_STUDIO)({}, { status() { return this; }, json() { return this; } }, () => { nexted = true; });
  assert.ok(nexted, 'professional may access render_studio');
  delete process.env.STUDIO_SUBSCRIPTION_TIER;
});

test('checkAccess: unknown tier string falls back to empty allow-list (blocks everything)', () => {
  process.env.STUDIO_SUBSCRIPTION_TIER = 'bogus_tier';
  let status = null;
  checkAccess(PRODUCTS.PLAN_INTELLIGENCE)({}, { status(c) { status = c; return this; }, json() { return this; } }, () => {});
  assert.equal(status, 403, 'unknown tier blocks access (safe default)');
  delete process.env.STUDIO_SUBSCRIPTION_TIER;
});
