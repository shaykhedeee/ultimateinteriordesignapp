// Regression tests for the shared BOQ engine (frontend/src/lib/boq.js) —
// the single source of truth for quotation math used by Material Catalog and
// Finance screens. Locks GST, discount, wastage, milestone-sum and the
// "no phantom 1 sqft" fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeQuote,
  buildMilestones,
  MILESTONE_SCHEDULES,
  normalizeQuoteItem,
  DEFAULT_GST_RATE
} from '../frontend/src/lib/boq.js';

const items = [
  { id: 'a', amount: 10000 },
  { id: 'b', amount: 5000 },
  { id: 'c', amount: 2500 }
];

test('subtotal sums item amounts', () => {
  const r = computeQuote({ items });
  assert.equal(r.subTotal, 17500);
});

test('GST 18% applied on discounted (taxable) base, rounded', () => {
  const r = computeQuote({ items, discount: 750, isGstEnabled: true, gstRate: 18 });
  assert.equal(r.taxable, 17500 - 750); // 16750
  assert.equal(r.gstValue, Math.round(16750 * 0.18)); // 3015
  assert.equal(r.grandTotal, 16750 + 3015); // 19765
});

test('GST disabled -> zero tax', () => {
  const r = computeQuote({ items, isGstEnabled: false });
  assert.equal(r.gstValue, 0);
  assert.equal(r.grandTotal, r.subTotal);
});

test('discount never drives taxable negative', () => {
  const r = computeQuote({ items, discount: 999999 });
  assert.equal(r.taxable, 0);
  assert.equal(r.gstValue, 0);
  assert.equal(r.grandTotal, 0);
});

test('wastage % adds a materials overhead before GST', () => {
  const r = computeQuote({ items, wastagePct: 10, isGstEnabled: true, gstRate: 18 });
  assert.equal(r.wastageValue, 1750); // 10% of 17500
  assert.equal(r.taxable, 17500 + 1750); // 19250
  assert.equal(r.gstValue, Math.round(19250 * 0.18));
  assert.equal(r.grandTotal, r.taxable + r.gstValue);
});

test('default GST rate is 18', () => {
  assert.equal(DEFAULT_GST_RATE, 18);
});

test('milestones always sum EXACTLY to total (no rounding drift)', () => {
  for (const total of [10000, 12345, 19999, 1, 0]) {
    for (const schedule of Object.values(MILESTONE_SCHEDULES)) {
      const ms = buildMilestones(total, schedule);
      const sum = ms.reduce((s, m) => s + m.amount, 0);
      assert.equal(sum, total, `schedule sums to ${sum}, expected ${total}`);
      // percentages preserved
      assert.equal(ms.reduce((s, m) => s + m.percentage, 0), 100);
    }
  }
});

test('normalizeQuoteItem: feet x feet -> sqft, amount = sqft*rate', () => {
  const n = normalizeQuoteItem({ name: 'Wardrobe', rate: 1200, width: '10', height: '8', isLumpSum: false });
  assert.equal(n.sqft, 80); // 10*8
  assert.equal(n.dimensions, '10 x 8 ft');
  assert.equal(n.amount, 80 * 1200);
});

test('normalizeQuoteItem: lump sum -> 1 lot, NOT phantom area', () => {
  const n = normalizeQuoteItem({ name: 'Consulting', rate: 5000, isLumpSum: true });
  assert.equal(n.sqft, 1);
  assert.equal(n.amount, 5000);
});

test('normalizeQuoteItem: missing dims + NOT lump sum -> 0 sqft (fixes silent 1sqft bug)', () => {
  const n = normalizeQuoteItem({ name: 'Cabinet', rate: 900, width: '', height: '', isLumpSum: false });
  assert.equal(n.sqft, 0);
  assert.equal(n.amount, 0);
  assert.equal(n.dimensions, 'Needs dimensions');
});

test('normalizeQuoteItem: NaN rate -> amount 0, never NaN', () => {
  const n = normalizeQuoteItem({ name: 'X', rate: 'abc', width: '5', height: '5', isLumpSum: false });
  assert.equal(n.amount, 0);
  assert.ok(Number.isFinite(n.amount));
});
