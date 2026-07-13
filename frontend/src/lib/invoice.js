// invoice.js — frontend mirror of server/services/invoice-math.js for live GST
// invoice totals in the UI. Keep in sync with the server (single pricing logic).
export const DEFAULT_GST_RATE = 18;

export function splitGst(gstRate, isInterState) {
  const r = Number(gstRate) || 0;
  if (isInterState) return { cgst: 0, sgst: 0, igst: r };
  return { cgst: r / 2, sgst: r / 2, igst: 0 };
}

export function stateCodeFromGstin(gstin = '') {
  const m = String(gstin).match(/^(\d{2})/);
  return m ? m[1] : '';
}

export function isInterStateSupply(supplierGstin, clientGstin) {
  const s = stateCodeFromGstin(supplierGstin);
  const c = stateCodeFromGstin(clientGstin);
  if (!c) return false;
  return s !== c && s !== '';
}

// HSN → default GST slab (mirror of server HSN_GST_SLAB).
export const HSN_GST_SLAB = {
  '9403': 18, '9401': 18, '9402': 18,
  '8302': 12, '4418': 18, '3926': 18, '7009': 18,
  '6910': 18, '7308': 18, '9954': 18
};

export function resolveLineGstRate(it, fallbackRate = DEFAULT_GST_RATE) {
  if (it && Number(it.gstRate) > 0) return Number(it.gstRate);
  const hsn = String((it && it.hsn) || '').trim();
  if (hsn && HSN_GST_SLAB[hsn] != null) return HSN_GST_SLAB[hsn];
  return Number(fallbackRate) || 0;
}

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
  if (isInterState === false && (clientGstin || supplierGstin)) {
    if (isInterStateSupply(supplierGstin, clientGstin)) isInterState = true;
  }

  const normalized = (items || []).map(it => {
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
      amount: lineTotal,
      gstRate: resolveLineGstRate(it, gstRate)
    };
  });

  const subTotal = normalized.reduce((s, it) => s + it.amount, 0);
  const discountVal = Math.max(0, Number(discount) || 0);
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
  const slabs = {};
  if (isGstEnabled) {
    for (const it of normalized) {
      const r = it.gstRate || 0;
      const base = it.discountedAmount;
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
  const roundOff = Math.round((roundedGrand - gross) * 100) / 100;

  const paid = Math.max(0, Number(paidAmount) || 0);
  const balanceDue = Math.max(0, roundedGrand - paid);
  const status = balanceDue <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

  return {
    items: normalized, subTotal: Math.round(subTotal), discount: Math.round(Number(discount) || 0),
    taxable: Math.round(taxableBase), cgst, sgst, igst, gstRate: Number(gstRate) || 0,
    isInterState, isGstEnabled, gstValue,
    slabs: Object.keys(slabs).map(Number).sort((a, b) => a - b)
      .map(rate => ({ rate, taxable: Math.round(slabs[rate]) })),
    roundOff, grandTotal: roundedGrand,
    paidAmount: paid, balanceDue, status
  };
}
