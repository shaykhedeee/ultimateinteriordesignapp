// Unit test for the unified CLIENT PRESENTATION PDF PACK.
// Verifies the sellable sheet set (cover + Vastu + BOQ + acceptance) renders to a
// valid multi-page PDF from real project data via the shared SQLite DB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import pdfBuilder from '../server/services/pdf-builder.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmp = (n) => path.join(os.tmpdir(), `pres-test-${n}-${Date.now()}.pdf`);

test('generateClientPresentationPDF produces a valid multi-page PDF', async () => {
  const id = 'pres_test_' + Date.now().toString(36);
  db.prepare("INSERT INTO projects (id, name, client_name, phone, status, client_brief_json) VALUES (?,?,?,?,?,?)")
    .run(id, 'Test Villa', 'Client X', '9999999999', 'proposal',
      JSON.stringify({ rooms: [{ name: 'Kitchen', widthMm: 3000, heightMm: 2400, rate: 250000, amount: 250000 }] }));

  const dest = tmp('valid');
  const quotation = {
    items: [
      { room: 'Kitchen', name: 'Modular Kitchen', dimensions: '3000 x 2400', rate: 250000, sqft: 7.2, amount: 250000 },
      { room: 'Bedroom', name: 'Wardrobe', dimensions: '2000 x 2400', rate: 180000, sqft: 4.8, amount: 180000 },
    ],
    grandTotal: 430000, gstValue: 0,
  };

  await pdfBuilder.generateClientPresentationPDF(id, dest, { quotation, shareUrl: 'http://localhost/x' });

  const buf = fs.readFileSync(dest);
  assert.ok(buf.length > 1000, 'PDF should be non-trivial in size');
  assert.equal(buf.slice(0, 5).toString(), '%PDF-', 'must be a PDF');
  const pageMarkers = (buf.toString('latin1').match(/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pageMarkers >= 4, `expected >=4 pages (cover/summary/vastu/boq/acceptance), got ${pageMarkers}`);

  fs.unlinkSync(dest);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
});

test('presentation pdf throws clearly for a missing project', async () => {
  await assert.rejects(
    () => pdfBuilder.generateClientPresentationPDF('does_not_exist_' + Date.now(), tmp('missing')),
    /Project not found/
  );
});
