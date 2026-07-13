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

// ── New: per-line HSN GST slabs ──
test('mixed HSN slabs split GST correctly (18% + 12%)', () => {
  const r = computeInvoice({
    items: [
      { description: 'Wardrobe', hsn: '9403', qty: 1, rate: 100000, gstRate: 18 },
      { description: 'Hinges', hsn: '8302', qty: 40, rate: 120, gstRate: 12 }
    ],
    gstRate: 18,
    isInterState: false
  });
  assert.equal(r.subTotal, 104800);
  assert.equal(r.cgst, 9288);   // 18% of 100000/2 + 12% of 4800/2 = 9000 + 288
  assert.equal(r.sgst, 9288);
  assert.equal(r.igst, 0);
  assert.equal(r.gstValue, 2 * 9288); // 18576
  assert.equal(r.grandTotal, 104800 + r.gstValue);
  // slab summary should expose the two rates with their taxable bases
  const rates = r.slabs.map(s => s.rate).sort((a, b) => a - b);
  assert.deepEqual(rates, [12, 18]);
  const s12 = r.slabs.find(s => s.rate === 12);
  const s18 = r.slabs.find(s => s.rate === 18);
  assert.equal(s12.taxable, 4800);
  assert.equal(s18.taxable, 100000);
});

test('HSN auto-defaults gstRate when line omits it', () => {
  const r = computeInvoice({
    items: [
      { description: 'Wardrobe', hsn: '9403', qty: 1, rate: 100000 },
      { description: 'Hinges', hsn: '8302', qty: 1, rate: 10000 }
    ],
    isInterState: false
  });
  // 9403 => 18%, 8302 => 12%
  assert.equal(r.cgst, 9000 + 600);
  assert.equal(r.sgst, 9000 + 600);
  assert.equal(r.gstValue, 2 * (9000 + 600));
});

test('line gstRate overrides HSN default', () => {
  const r = computeInvoice({
    items: [{ description: 'Custom', hsn: '9403', qty: 1, rate: 100000, gstRate: 5 }],
    isInterState: false
  });
  assert.equal(r.cgst, 2500);
  assert.equal(r.sgst, 2500);
});

// ── New: auto inter-state derivation from supplier/client GSTIN ──
test('isInterState auto-derived from GSTIN when not forced', () => {
  const r = computeInvoice({
    items: [{ description: 'Wardrobe', qty: 1, rate: 100000 }],
    gstRate: 18,
    isInterState: false,
    supplierGstin: '29ABCDE1234F1Z5',  // Karnataka
    clientGstin: '27ABCDE1234F1Z2'     // Maharashtra => inter-state
  });
  assert.equal(r.isInterState, true);
  assert.equal(r.igst, 18000);
  assert.equal(r.cgst, 0);
  assert.equal(r.sgst, 0);
});

test('explicit isInterState=true wins over GSTIN same-state', () => {
  const r = computeInvoice({
    items: [{ description: 'Wardrobe', qty: 1, rate: 100000 }],
    gstRate: 18,
    isInterState: true,
    supplierGstin: '29ABCDE1234F1Z5',
    clientGstin: '29ABCDE1234F1Z9' // same state but explicit flag wins
  });
  assert.equal(r.isInterState, true);
  assert.equal(r.igst, 18000);
});

// ── New: milestone invoice GST math parity ──
test('milestone items use GST math via computeInvoice', () => {
  const items = [
    { description: 'Advance', hsn: '9954', qty: 1, rate: 50000, amount: 50000 },
    { description: 'Material', hsn: '4418', qty: 1, rate: 30000, amount: 30000 }
  ];
  const r = computeInvoice({ items, isGstEnabled: true, gstRate: 18, isInterState: false });
  assert.equal(r.subTotal, 80000);
  assert.equal(r.taxable, 80000);
  assert.equal(r.cgst, 7200);
  assert.equal(r.sgst, 7200);
  assert.equal(r.gstValue, 14400);
  assert.equal(r.grandTotal, 94400);
  assert.equal(r.status, 'unpaid');
});
