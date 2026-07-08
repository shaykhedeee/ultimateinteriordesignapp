/**
 * tests/measure-plan.test.js
 * measurePlan must handle the manual room-marking path (rooms only, no traced
 * walls) and return a valid interpretation instead of 422/NO_TRACED_WALLS — this
 * is what the guided PipelineStudio "Mark Spaces" step sends.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import planIntelligenceCore from '../server/services/plan-intelligence-core.js';

test('measurePlan returns interpretation from rooms-only (no walls)', () => {
  const res = planIntelligenceCore.measurePlan({
    walls: [],
    rooms: [
      { name: 'Living', wMm: 5600, hMm: 4200 },
      { name: 'Master Bedroom', wMm: 4200, hMm: 3600 },
    ],
  });
  assert.equal(res.success, true);
  assert.equal(res.interpretation.rooms.length, 2);
  const living = res.interpretation.rooms.find(r => r.name === 'Living');
  assert.equal(living.type, 'living');
  assert.ok(living.areaMm2 > 0);
  assert.ok(res.interpretation.bedroomCount >= 1);
  assert.ok(res.overallConfidence > 0);
});

test('measurePlan still requires walls when no rooms supplied', () => {
  const res = planIntelligenceCore.measurePlan({ walls: [], rooms: [] });
  assert.equal(res.success, false);
  assert.equal(res.error, 'NO_TRACED_WALLS');
});
