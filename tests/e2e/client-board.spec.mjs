import { test, expect } from '@playwright/test';

// Client Board pipeline — API-level (no browser; stable on constrained hosts).
// Guards: CSV/import maps deal_stage + tokens_paid; PATCH mutates stage/tokens; GET reflects.
test('Client Board: import + stage/token pipeline persists', async ({ request }) => {
  const BASE = 'http://127.0.0.1:5055';

  // Import two clients with explicit pipeline fields.
  const seed = await request.post(`${BASE}/api/leads/import`, {
    data: { leadList: [
      { name: 'Amit Rao', phone: '+91 90000 11122', email: 'amit@x.com', location: 'Jayanagar', budget: 1200000, area: 1500, requirements: 'Kitchen', deal_stage: 'new', tokens_paid: 0, designs_sent: 0 },
      { name: 'Neha Gupta', phone: '+91 90000 33344', email: 'neha@x.com', location: 'Indiranagar', budget: 2400000, area: 2000, requirements: '4BHK', deal_stage: 'designs_sent', tokens_paid: 50000, designs_sent: 1 }
    ] }
  });
  expect(seed.ok()).toBeTruthy();
  const seedJson = await seed.json();
  expect(seedJson.leads).toHaveLength(2);
  const neha = seedJson.leads.find(l => l.name === 'Neha Gupta');
  expect(neha.deal_stage).toBe('designs_sent');
  expect(neha.tokens_paid).toBe(50000);
  expect(neha.designs_sent).toBe(1);

  // Advance Neha to token_paid + bump tokens.
  const patch = await request.patch(`${BASE}/api/leads/${neha.id}`, {
    data: { deal_stage: 'token_paid', tokens_paid: 75000 }
  });
  expect(patch.ok()).toBeTruthy();
  const pj = await patch.json();
  expect(pj.deal_stage).toBe('token_paid');
  expect(pj.tokens_paid).toBe(75000);

  // GET reflects the persisted mutation.
  const list = await request.get(`${BASE}/api/leads`);
  const rows = await list.json();
  const row = rows.find(r => r.id === neha.id);
  expect(row.deal_stage).toBe('token_paid');
  expect(row.tokens_paid).toBe(75000);

  // Cleanup.
  await request.delete(`${BASE}/api/leads/${neha.id}`);
  await request.delete(`${BASE}/api/leads/${seedJson.leads[0].id}`);
});
