import { test, expect } from '@playwright/test';

// "Send Designs" — assembles a real render-pack PDF for a client's project.
// API-level (no browser; stable on constrained hosts).
test('Client Board: Send Designs builds a real render-pack PDF', async ({ request }) => {
  const BASE = 'http://127.0.0.1:5055';

  // Seed a client.
  const seed = await request.post(`${BASE}/api/leads/import`, {
    data: { leadList: [{ name: 'Pack Tester', phone: '+91 90000 99999', email: 'pack@x.com', location: 'Whitefield', budget: 1500000, area: 1400, requirements: 'Kitchen', deal_stage: 'new', tokens_paid: 0, designs_sent: 0 }] }
  });
  const leadId = (await seed.json()).leads[0].id;

  // Link the client to a project that already has renders.
  const projId = 'proj_LTPrDT3BNE';
  await request.patch(`${BASE}/api/projects/${projId}`, { data: { lead_id: leadId } });

  // Send designs -> real PDF pack.
  const r = await request.post(`${BASE}/api/leads/${leadId}/send-designs`);
  expect(r.status()).toBe(200);
  const rj = await r.json();
  expect(rj.success).toBeTruthy();
  expect(rj.downloadUrl).toMatch(/\.pdf$/);

  // The PDF is served and is a valid PDF with embedded render images.
  const pdf = await request.get(`${BASE}${rj.downloadUrl}`);
  expect(pdf.status()).toBe(200);
  const buf = Buffer.from(await pdf.body());
  expect(buf.slice(0, 4).toString()).toBe('%PDF');
  expect((buf.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length).toBeGreaterThan(0);

  // Client flagged as designs-sent.
  const leads = await request.get(`${BASE}/api/leads`);
  const me = (await leads.json()).find(l => l.id === leadId);
  expect(me.designs_sent).toBe(1);

  // Cleanup.
  await request.delete(`${BASE}/api/leads/${leadId}`);
  await request.patch(`${BASE}/api/projects/${projId}`, { data: { lead_id: null } });
});
