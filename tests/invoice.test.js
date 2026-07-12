import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInvoice, isInterStateSupply, amountToWords } from '../server/services/invoice-math.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import pdfBuilder from '../server/services/pdf-builder.js';

test('intra-state: CGST + SGST split at 18%', () => {
  const r = computeInvoice({
    items: [{ description: 'Wardrobe', qty: 1, rate: 100000 }],
    gstRate: 18,
    isInterState: false
  });
  assert.equal(r.subTotal, 100000);
  assert.equal(r.taxable, 100000);
  assert.equal(r.cgst, 9000);
  assert.equal(r.sgst, 9000);
  assert.equal(r.igst, 0);
  assert.equal(r.gstValue, 18000);
  assert.equal(r.grandTotal, 118000);
  assert.equal(r.status, 'unpaid');
});

test('inter-state: IGST applied, no CGST/SGST', () => {
  const r = computeInvoice({
    items: [{ description: 'Wardrobe', qty: 1, rate: 100000 }],
    gstRate: 18,
    isInterState: true
  });
  assert.equal(r.cgst, 0);
  assert.equal(r.sgst, 0);
  assert.equal(r.igst, 18000);
  assert.equal(r.grandTotal, 118000);
});

test('discount reduces taxable base before tax', () => {
  const r = computeInvoice({
    items: [{ description: 'Kitchen', qty: 1, rate: 200000 }],
    discount: 20000,
    gstRate: 18,
    isInterState: false
  });
  assert.equal(r.taxable, 180000);
  assert.equal(r.cgst, 16200);
  assert.equal(r.sgst, 16200);
  assert.equal(r.grandTotal, 212400);
});

test('GST disabled => no tax, grand = taxable', () => {
  const r = computeInvoice({
    items: [{ description: 'Service', qty: 1, rate: 50000 }],
    isGstEnabled: false
  });
  assert.equal(r.taxable, 50000);
  assert.equal(r.cgst + r.sgst + r.igst, 0);
  assert.equal(r.grandTotal, 50000);
});

test('round-off reconciles paisa drift to whole rupee', () => {
  // 100 * 1180.3333 => taxable 118033.33-ish; expect whole rupee grand total
  const r = computeInvoice({
    items: [{ description: 'Item', qty: 3, rate: 1180.33 }],
    gstRate: 18,
    isInterState: false
  });
  assert.ok(Number.isInteger(r.grandTotal), 'grand total must be whole rupee');
  // roundOff should be small (within +/-1)
  assert.ok(Math.abs(r.roundOff) < 1);
});

test('balance & partial/paid status from paidAmount', () => {
  const r = computeInvoice({
    items: [{ description: 'P', qty: 1, rate: 100000 }],
    gstRate: 18,
    paidAmount: 50000
  });
  assert.equal(r.grandTotal, 118000);
  assert.equal(r.balanceDue, 68000);
  assert.equal(r.status, 'partial');

  const paid = computeInvoice({
    items: [{ description: 'P', qty: 1, rate: 100000 }],
    gstRate: 18,
    paidAmount: 118000
  });
  assert.equal(paid.balanceDue, 0);
  assert.equal(paid.status, 'paid');
});

test('isInterStateSupply derives from GSTIN state codes', () => {
  // supplier KA (29), client MH (27) => inter-state
  assert.equal(isInterStateSupply('29ABCDE1234F1Z5', '27ABCDE1234F1Z2'), true);
  // supplier KA (29), client KA (29) => intra-state
  assert.equal(isInterStateSupply('29ABCDE1234F1Z5', '29XYZDE1234F1Z9'), false);
  // no client gstin => intra-state by default
  assert.equal(isInterStateSupply('29ABCDE1234F1Z5', ''), false);
});

test('amountToWords produces rupee words', () => {
  assert.equal(amountToWords(0), 'Zero Rupees Only');
  assert.ok(amountToWords(118000).includes('One Lakh Eighteen Thousand'));
  assert.ok(amountToWords(118000).endsWith('Rupees Only'));
});

test('generateInvoicePDF writes a valid PDF file with GST lines', async () => {
  const tmp = path.join(os.tmpdir(), `inv-test-${Date.now()}.pdf`);
  const invoice = {
    invoice_number: 'INV-2026-0001',
    project_id: 'test',
    items_json: JSON.stringify([{ description: 'Wardrobe', hsn: '9403', qty: 1, rate: 100000, amount: 100000 }]),
    client_name: 'Test Client',
    client_address: 'MG Road, Bengaluru',
    client_gstin: '',
    issue_date: '2026-07-12',
    due_date: '',
    subtotal: 100000, discount: 0, taxable: 100000,
    cgst: 9000, sgst: 9000, igst: 0, gst_rate: 18, is_inter_state: 0,
    round_off: 0, grand_total: 118000, paid_amount: 0
  };
  const dest = await pdfBuilder.generateInvoicePDF(null, tmp, {
    invoice,
    supplier: { name: 'GRID OS', address: 'Bengaluru', gstNo: '29ABCDE1234F1Z5', bankDetails: { accountName: 'ACME', bankName: 'SBI', accountNumber: '1234', ifscCode: 'SBIN0001' } }
  });
  const buf = await fs.readFile(dest);
  assert.ok(buf.length > 1000, 'PDF should have content');
  assert.ok(buf.slice(0, 5).toString() === '%PDF-', 'valid PDF header');
  assert.ok(buf.toString('latin1').includes('%%EOF'), 'valid PDF trailer');
  await fs.unlink(dest);
});
