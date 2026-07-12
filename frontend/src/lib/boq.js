// boq.js — single source of truth for quotation math (BOQ / GST / milestones).
// Pure & framework-free so it can be unit-tested in Node (no React).
// Used by MaterialCatalogScreen and FinanceScreen so both screens always
// agree on totals, GST and milestone breakdowns.

// Standard Indian interior-project milestone schedules (percentages sum to 100).
export const MILESTONE_SCHEDULES = {
  // Material Catalog screen legacy split
  standard: [
    { stage: '10% Booking Fee', percentage: 10 },
    { stage: '40% Site Execution & Structure Start', percentage: 40 },
    { stage: '40% Material Sourcing & Delivery', percentage: 40 },
    { stage: '10% Final Finishing & Handover', percentage: 10 }
  ],
  // Finance screen legacy split
  finance: [
    { stage: '1. Booking Advance (To initiate design & drawings)', percentage: 10 },
    { stage: '2. Design Finalized (Before initiating factory production)', percentage: 50 },
    { stage: '3. Material Dispatch (Upon dispatch from factory)', percentage: 35 },
    { stage: '4. Final Handover & Sign-off (Post-installation)', percentage: 5 }
  ]
};

export const DEFAULT_GST_RATE = 18; // % — Indian GST for interior works

/**
 * Compute a full quotation from line items.
 * @param {object} o
 * @param {Array<{amount?:number}>} o.items      line items (each has `amount`)
 * @param {number} [o.discount=0]                 flat discount subtracted before GST
 * @param {boolean} [o.isGstEnabled=true]
 * @param {number} [o.gstRate=18]                 GST percentage
 * @param {number} [o.wastagePct=0]               material wastage % added to subtotal
 * @returns {{subTotal:number,taxable:number,gstValue:number,grandTotal:number,
 *            wastageValue:number,totalWithWastage:number}}
 */
export function computeQuote({
  items = [],
  discount = 0,
  isGstEnabled = true,
  gstRate = DEFAULT_GST_RATE,
  wastagePct = 0
} = {}) {
  const subTotal = items.reduce((s, it) => s + (Number(it?.amount) || 0), 0);

  // Wastage is a materials overhead applied on the gross subtotal.
  const wastageValue = Math.round((subTotal * (Number(wastagePct) || 0)) / 100);

  // Discount reduces the taxable base (never below zero).
  const taxable = Math.max(0, subTotal + wastageValue - (Number(discount) || 0));

  const gstValue = isGstEnabled ? Math.round((taxable * (Number(gstRate) || 0)) / 100) : 0;

  const grandTotal = taxable + gstValue;
  const totalWithWastage = grandTotal; // wastage already folded into taxable

  return { subTotal, wastageValue, taxable, gstValue, grandTotal, totalWithWastage };
}

/**
 * Build milestone line items from a total and a schedule.
 * Amounts are rounded; the final line absorbs any rounding remainder so the
 * milestones always sum EXACTLY to `total` (no off-by-a-rupee drift).
 */
export function buildMilestones(total, schedule = MILESTONE_SCHEDULES.standard) {
  const steps = Array.isArray(schedule) ? schedule : MILESTONE_SCHEDULES.standard;
  const t = Number(total) || 0;
  const rows = steps.map(s => ({
    stage: s.stage,
    percentage: s.percentage,
    amount: Math.round((t * s.percentage) / 100)
  }));
  // Fix rounding drift on the last row.
  const sum = rows.reduce((a, r) => a + r.amount, 0);
  if (rows.length) rows[rows.length - 1].amount += t - sum;
  return rows;
}

/**
 * Validate + normalise a raw quote line entry from the UI.
 * Guards the silent "1 sqft default" bug: if dimensions are absent and the
 * item is NOT a lump-sum, sqft is 0 (not 1) so we never charge phantom area.
 */
export function normalizeQuoteItem({ name, rate = 0, width, height, isLumpSum = false, room = '' }) {
  const r = Number(rate) || 0;
  const w = parseFloat(width);
  const h = parseFloat(height);
  const hasDims = !isNaN(w) && !isNaN(h) && w > 0 && h > 0;

  let sqft = 1.0;
  let dimensions = 'Lump Sum';
  if (isLumpSum) {
    sqft = 1.0; // lump sum = one lot
  } else if (hasDims) {
    sqft = w * h; // feet × feet = sqft
    dimensions = `${w} x ${h} ft`;
  } else {
    // No dimensions and not lump-sum -> charge nothing, flag as unresolved.
    sqft = 0;
    dimensions = 'Needs dimensions';
  }
  const amount = Math.round(sqft * r);
  return { name, room, rate: r, sqft, dimensions, amount, isLumpSum };
}
