// Regression tests for lead-scorer.js — locks the documented 0..100 contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import leadScorer from '../server/services/lead-scorer.js';

test('premium lead scores high but never exceeds 100', () => {
  const s = leadScorer.calculateScore({
    budget: 2000000, area: 3000, location: 'Koramangala',
    requirements: 'immediate 4 bhk villa full flat'
  });
  assert.ok(s <= 100, `score ${s} should be <= 100`);
  assert.ok(s >= 90, `premium lead should score high, got ${s}`);
});

test('score never falls below 1 (documented floor)', () => {
  const s = leadScorer.calculateScore({
    budget: 100000, area: 300, location: 'nowhere',
    requirements: 'just checking next year repair only kitchen cabinet'
  });
  assert.ok(s >= 1, `score ${s} should be >= 1`);
  assert.ok(s <= 100, `score ${s} should be <= 100`);
});

test('base score for an average lead sits in a sane mid range', () => {
  const s = leadScorer.calculateScore({ budget: 600000, area: 1000, location: 'hsr layout', requirements: '3 bhk' });
  assert.ok(s >= 50 && s <= 95, `unexpected mid score ${s}`);
});
