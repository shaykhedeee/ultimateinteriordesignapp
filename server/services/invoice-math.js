/**
 * invoice-math.js
 * --------------------------------------------------------------------------
 * Pure, framework-free GST invoice pricing math for the ULTIDA invoice
 * generator. Usable in Node (server + tests) and imported by the frontend
 * for live totals (same logic, no drift).
 *
 * Indian GST rules implemented:
 *   - Intra-state supply  -> CGST (½ rate) + SGST (½ rate)
 *   - Inter-state supply   -> IGST (full rate)
 *   - Discount reduces the taxable base BEFORE tax.
 *   - Round-off reconciles the paisa drift so the invoice grand total is a
 *     whole rupee (standard practice on Indian tax invoices).
 *   - Place of supply is compared against the supplier's state code (from
 *     the company GSTIN's first 2 digits).
 */

export const DEFAULT_GST_RATE = 18;

/**
 * Split a GST percentage into the levies for a given supply type.
 * @returns {{cgst:number,sgst:number,igst:number}}
 */
export function splitGst(gstRate, isInterState) {
  const r = Number(gstRate) || 0;
  if (isInterState) return { cgst: 0, sgst: 0, igst: r };
  return { cgst: r / 2, sgst: r / 2, igst: 0 };
}

/** State code = first 2 digits of a GSTIN (e.g. "29ABCDE..." -> "29"). */
export function stateCodeFromGstin(gstin = '') {
  const m = String(gstin).match(/^(\d{2})/);
  return m ? m[1] : '';
}

export function isInterStateSupply(supplierGstin, clientGstin) {
  const s = stateCodeFromGstin(supplierGstin);
  const c = stateCodeFromGstin(clientGstin);
  // No client GSTIN -> treat as intra-state (or unknown) by default.
  if (!c) return false;
  return s !== c && s !== '';
}

/**
 * Compute a full GST invoice from line items.
 * @param {object} o
 * @param {Array<{description:string,hsn?:string,qty?:number,rate?:number,amount?:number}>} o.items
 *        Either provide (qty*rate) per item OR a precomputed `amount`.
 * @param {number} [o.discount=0]      flat discount subtracted before tax
 * @param {boolean} [o.isGstEnabled=true]
 * @param {number} [o.gstRate=18]
 * @param {boolean} [o.isInterState=false]
 * @param {number} [o.paidAmount=0]    amount already received (for balance)
 * @returns {object} full invoice breakdown (all values rounded to whole ₹)
 */
export function computeInvoice({
  items = [],
  discount = 0,
  isGstEnabled = true,
  gstRate = DEFAULT_GST_RATE,
  isInterState = false,
  paidAmount = 0
} = {}) {
  const normalized = items.map(it => {
    const qty = Number(it.qty) > 0 ? Number(it.qty) : 1;
    const rate = Number(it.rate) || 0;
    const amount = Number(it.amount);
    const lineTotal = Number.isFinite(amount) && amount !== 0
      ? Math.round(amount)
      : Math.round(qty * rate);
    return {
      description: it.description || 'Item',
      hsn: it.hsn || '9403',
      qty,
      rate: Math.round(rate),
      amount: lineTotal
    };
  });

  const subTotal = normalized.reduce((s, it) => s + it.amount, 0);
  const taxableBase = Math.max(0, subTotal - (Number(discount) || 0));

  let cgst = 0, sgst = 0, igst = 0, gstValue = 0;
  if (isGstEnabled) {
    const { cgst: c, sgst: s, igst: i } = splitGst(gstRate, isInterState);
    cgst = Math.round((taxableBase * c) / 100);
    sgst = Math.round((taxableBase * s) / 100);
    igst = Math.round((taxableBase * i) / 100);
    gstValue = cgst + sgst + igst;
  }

  const gross = taxableBase + gstValue;
  const roundedGrand = Math.round(gross);
  const roundOff = Math.round((roundedGrand - gross) * 100) / 100; // keep paisa precision for display

  const paid = Math.max(0, Number(paidAmount) || 0);
  const balanceDue = Math.max(0, roundedGrand - paid);
  const status = balanceDue <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

  return {
    items: normalized,
    subTotal: Math.round(subTotal),
    discount: Math.round(Number(discount) || 0),
    taxable: Math.round(taxableBase),
    cgst, sgst, igst,
    gstRate: Number(gstRate) || 0,
    isInterState,
    isGstEnabled,
    gstValue,
    roundOff,
    grandTotal: roundedGrand,
    paidAmount: paid,
    balanceDue,
    status
  };
}

/** Convert a number to Indian rupee words (e.g. 123456 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees Only"). */
export function amountToWords(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(d) {
    d = Math.round(d);
    if (d < 20) return ones[d];
    return tens[Math.floor(d / 10)] + (d % 10 ? ' ' + ones[d % 10] : '');
  }
  function three(d) {
    if (d === 0) return '';
    if (d < 100) return two(d);
    return ones[Math.floor(d / 100)] + ' Hundred' + (d % 100 ? ' ' + two(d % 100) : '');
  }
  function convert(x) {
    if (x === 0) return '';
    let str = '';
    const crore = Math.floor(x / 10000000);
    x %= 10000000;
    const lakh = Math.floor(x / 100000);
    x %= 100000;
    const thousand = Math.floor(x / 1000);
    x %= 1000;
    if (crore) str += three(crore) + ' Crore ';
    if (lakh) str += three(lakh) + ' Lakh ';
    if (thousand) str += three(thousand) + ' Thousand ';
    if (x) str += three(x) + ' ';
    return str.trim();
  }
  return convert(n) + ' Rupees Only';
}
