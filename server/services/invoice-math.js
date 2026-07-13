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
 * HSN → default GST slab for the Indian interior-goods trade.
 * Used as a soft default when a line item carries no explicit rate, so a
 * furniture+hardware+works invoice still splits correctly even if the
 * operator only typed an HSN.
 *   - 9403  Furniture / prefab woodwork (wardrobes, kitchens, units)
 *   - 9401  Seating (sofas, chairs)
 *   - 9402  Beds / mattresses
 *   - 8302  Hardware (hinges, handles, channels, baskets)
 *   - 4418  Builders' joinery / carpentry (plywood, MDF, laminate sheets)
 *   - 3926  Plastic fittings (profiles, edge bands)
 *   - 7009  Mirrors
 *   - 6910  Ceramic / tile
 *   - 7308  Fabricated structural steel (MS frames)
 *   - 9954  Construction / works contract services
 */
export const HSN_GST_SLAB = {
  '9403': 18, '9401': 18, '9402': 18,
  '8302': 12, '4418': 18, '3926': 18, '7009': 18,
  '6910': 18, '7308': 18, '9954': 18
};

/**
 * Resolve the GST rate that applies to a single line item.
 * Precedence: explicit line `gstRate` → HSN default → invoice-level `fallbackRate`.
 */
export function resolveLineGstRate(it, fallbackRate = DEFAULT_GST_RATE) {
  if (it && Number(it.gstRate) > 0) return Number(it.gstRate);
  const hsn = String((it && it.hsn) || '').trim();
  if (hsn && HSN_GST_SLAB[hsn] != null) return HSN_GST_SLAB[hsn];
  return Number(fallbackRate) || 0;
}

/**
 * Compute a full GST invoice from line items.
 *
 * Supports BOTH pricing models used by real Indian interior-firm tax
 * invoices:
 *   1. Mixed HSN slabs (default): each line may carry its own `gstRate`
 *      (or derive one from its HSN code via HSN_GST_SLAB). Tax is
 *      computed per slab and summed — so a 9403@18% furniture line and an
 *      8302@12% hardware line are taxed correctly, not at one flat rate.
 *   2. Legacy single-rate: if no line carries a `gstRate`/HSN slab, the
 *      invoice-level `gstRate` is applied to the whole taxable base
 *      (backward-compatible with every existing caller).
 *
 * @param {object} o
 * @param {Array<{description?:string,hsn?:string,qty?:number,rate?:number,amount?:number,gstRate?:number}>} o.items
 *        Provide (qty*rate) per item OR a precomputed `amount`.
 * @param {number} [o.discount=0]          flat discount subtracted before tax
 * @param {boolean} [o.isGstEnabled=true]
 * @param {number} [o.gstRate=18]          fallback GST % for lines with no slab/HSN
 * @param {boolean} [o.isInterState=false]  IGST mode (else CGST+SGST)
 * @param {number} [o.paidAmount=0]        amount already received (for balance)
 * @param {string} [o.supplierGstin]       used to auto-derive inter-state
 * @param {string} [o.clientGstin]         used to auto-derive inter-state
 * @returns {object} full invoice breakdown (all values rounded to whole ₹)
 */
export function computeInvoice({
  items = [],
  discount = 0,
  isGstEnabled = true,
  gstRate = DEFAULT_GST_RATE,
  isInterState = false,
  paidAmount = 0,
  supplierGstin = '',
  clientGstin = ''
} = {}) {
  // Auto-derive inter-state from the GSTIN state codes when the caller
  // hasn't forced a value *and* we have both GSTINs to compare.
  if (isInterState === false && (clientGstin || supplierGstin)) {
    const derived = isInterStateSupply(supplierGstin, clientGstin);
    if (derived) isInterState = true;
  }

  const normalized = (items || []).map(it => {
    const qty = Number(it.qty) > 0 ? Number(it.qty) : 1;
    const rate = Number(it.rate) || 0;
    const amount = Number(it.amount);
    const lineTotal = Number.isFinite(amount) && amount !== 0
      ? Math.round(amount)
      : Math.round(qty * rate);
    const lineGst = resolveLineGstRate(it, gstRate);
    return {
      description: it.description || 'Item',
      hsn: it.hsn || '9403',
      qty,
      rate: Math.round(rate),
      amount: lineTotal,
      gstRate: lineGst
    };
  });

  const subTotal = normalized.reduce((s, it) => s + it.amount, 0);
  const discountVal = Math.max(0, Number(discount) || 0);
  // Apportion discount across lines by value so GST is charged on the
  // post-discount (actual taxable) amount — correct under GST.
  const taxableBase = Math.max(0, subTotal - discountVal);
  if (discountVal > 0 && subTotal > 0) {
    let allocated = 0;
    normalized.forEach((it, idx) => {
      if (idx === normalized.length - 1) {
        it.discountedAmount = Math.max(0, it.amount - (discountVal - allocated));
      } else {
        const share = Math.round((it.amount / subTotal) * discountVal);
        allocated += share;
        it.discountedAmount = Math.max(0, it.amount - share);
      }
    });
  } else {
    normalized.forEach(it => { it.discountedAmount = it.amount; });
  }

  let cgst = 0, sgst = 0, igst = 0, gstValue = 0;
  // Per-slab breakdowns for the printed summary (keyed by integer %).
  const slabs = {};
  if (isGstEnabled) {
    for (const it of normalized) {
      const r = it.gstRate || 0;
      const base = it.discountedAmount;
      const tax = Math.round((base * r) / 100);
      gstValue += tax;
      const { cgst: c, sgst: s, igst: i } = splitGst(r, isInterState);
      cgst += Math.round((base * c) / 100);
      sgst += Math.round((base * s) / 100);
      igst += Math.round((base * i) / 100);
      if (r > 0) slabs[r] = (slabs[r] || 0) + base;
    }
    cgst = Math.round(cgst);
    sgst = Math.round(sgst);
    igst = Math.round(igst);
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
    // Ordered list of {rate, taxable} slabs actually used, for PDF/UI summary.
    slabs: Object.keys(slabs).map(Number).sort((a, b) => a - b)
      .map(rate => ({ rate, taxable: Math.round(slabs[rate]) })),
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
