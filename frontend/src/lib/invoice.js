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
    return { description: it.description || 'Item', hsn: it.hsn || '9403', qty, rate: Math.round(rate), amount: lineTotal };
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
  const roundOff = Math.round((roundedGrand - gross) * 100) / 100;

  const paid = Math.max(0, Number(paidAmount) || 0);
  const balanceDue = Math.max(0, roundedGrand - paid);
  const status = balanceDue <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

  return {
    items: normalized, subTotal: Math.round(subTotal), discount: Math.round(Number(discount) || 0),
    taxable: Math.round(taxableBase), cgst, sgst, igst, gstRate: Number(gstRate) || 0,
    isInterState, isGstEnabled, gstValue, roundOff, grandTotal: roundedGrand,
    paidAmount: paid, balanceDue, status
  };
}
