import db from '../database/database.js';

const DEFAULT_SETTINGS = {
  currency: 'INR',
  laminate_price_per_sqft: 45,
  hardware_markup_percent: 18,
  labor_per_sqft: 220,
  transport_percent: 4,
  profit_percent: 12,
  client_discount_percent: 0,
  client_tax_percent: 12,
  showroom_multiplier: 1.18,
  price_band_economy_max: 1600,
  price_band_standard_max: 2200,
  price_band_premium_max: 3200,
  default_markup_profile: 'standard'
};

export function getPricingSettings() {
  const row = db.prepare("SELECT * FROM pricing_settings WHERE id = 'global'").get();
  if (!row) {
    const defaults = { id: 'global', ...DEFAULT_SETTINGS };
    db.prepare(`INSERT INTO pricing_settings (id, currency, laminate_price_per_sqft, hardware_markup_percent, labor_per_sqft, transport_percent, profit_percent, client_discount_percent, client_tax_percent, showroom_multiplier, price_band_economy_max, price_band_standard_max, price_band_premium_max, default_markup_profile, updated_at) VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      defaults.currency, defaults.laminate_price_per_sqft, defaults.hardware_markup_percent, defaults.labor_per_sqft, defaults.transport_percent, defaults.profit_percent, defaults.client_discount_percent, defaults.client_tax_percent, defaults.showroom_multiplier, defaults.price_band_economy_max, defaults.price_band_standard_max, defaults.price_band_premium_max, defaults.default_markup_profile, new Date().toISOString()
    );
    return defaults;
  }
  return row;
}

export function updatePricingSettings(patch = {}) {
  const current = getPricingSettings();
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  db.prepare(`UPDATE pricing_settings SET currency = COALESCE(?, currency), laminate_price_per_sqft = COALESCE(?, laminate_price_per_sqft), hardware_markup_percent = COALESCE(?, hardware_markup_percent), labor_per_sqft = COALESCE(?, labor_per_sqft), transport_percent = COALESCE(?, transport_percent), profit_percent = COALESCE(?, profit_percent), client_discount_percent = COALESCE(?, client_discount_percent), client_tax_percent = COALESCE(?, client_tax_percent), showroom_multiplier = COALESCE(?, showroom_multiplier), price_band_economy_max = COALESCE(?, price_band_economy_max), price_band_standard_max = COALESCE(?, price_band_standard_max), price_band_premium_max = COALESCE(?, price_band_premium_max), default_markup_profile = COALESCE(?, default_markup_profile), updated_at = ? WHERE id = 'global'`).run(
    patch.currency || current.currency,
    patch.laminate_price_per_sqft != null ? patch.laminate_price_per_sqft : current.laminate_price_per_sqft,
    patch.hardware_markup_percent != null ? patch.hardware_markup_percent : current.hardware_markup_percent,
    patch.labor_per_sqft != null ? patch.labor_per_sqft : current.labor_per_sqft,
    patch.transport_percent != null ? patch.transport_percent : current.transport_percent,
    patch.profit_percent != null ? patch.profit_percent : current.profit_percent,
    patch.client_discount_percent != null ? patch.client_discount_percent : current.client_discount_percent,
    patch.client_tax_percent != null ? patch.client_tax_percent : current.client_tax_percent,
    patch.showroom_multiplier != null ? patch.showroom_multiplier : current.showroom_multiplier,
    patch.price_band_economy_max != null ? patch.price_band_economy_max : current.price_band_economy_max,
    patch.price_band_standard_max != null ? patch.price_band_standard_max : current.price_band_standard_max,
    patch.price_band_premium_max != null ? patch.price_band_premium_max : current.price_band_premium_max,
    patch.default_markup_profile != null ? patch.default_markup_profile : current.default_markup_profile,
    next.updated_at
  );
  return getPricingSettings();
}

export function estimateProjectCost({ laminateSqft = 0, hardwareBaseCost = 0, laborSqft = 0, transportBaseCost = 0, client = true } = {}) {
  const settings = getPricingSettings();
  const laminate = laminateSqft * settings.laminate_price_per_sqft;
  const hardware = hardwareBaseCost * (1 + settings.hardware_markup_percent / 100);
  const labor = laborSqft * settings.labor_per_sqft;
  const transport = transportBaseCost * (1 + settings.transport_percent / 100);
  const subtotal = laminate + hardware + labor + transport;
  const profit = subtotal * (settings.profit_percent / 100);
  const discount = client ? subtotal * (settings.client_discount_percent / 100) : 0;
  const taxable = subtotal + profit - discount;
  const tax = client ? taxable * (settings.client_tax_percent / 100) : 0;
  const total = taxable + tax;
  const band = total <= settings.price_band_economy_max ? 'Economy' : total <= settings.price_band_standard_max ? 'Standard' : total <= settings.price_band_premium_max ? 'Premium' : 'Luxury';
  return { settings, laminate, hardware, labor, transport, subtotal, profit, discount, tax, total, band, client };
}
