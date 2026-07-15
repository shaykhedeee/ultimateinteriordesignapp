import React, { useState } from 'react';
import { IndianRupee, Check, Sparkles, ShieldCheck, Layers, FileText, Box, Wand2, ChevronRight } from 'lucide-react';

// INR pricing — mirrors Agent B Studio's bands (₹2,999 / 6,999 / 11,999 / 26,999)
// but positions ULTIDA to WIN on what Agent B cannot claim: geometry-truthful
// output (DXF/BOM/quotation that survive a contractor), and the closed
// catalog→stage→render→quotation loop on real dimensions.
const PLANS = [
  {
    id: 'individual',
    name: 'Individual',
    price: 2999,
    tagline: 'Getting started',
    renders: '100 renders / mo',
    popular: false,
    features: [
      '2D Layout Builder + Quick Layout',
      'Smart Staging (auto furniture from plan)',
      'Space / Studio / Cinematic renders',
      'RCP + Elevation generation',
      'BOM Calculator + GST quotation',
      'Offline room/furniture detection'
    ]
  },
  {
    id: 'designer-pro',
    name: 'Designer Pro',
    price: 6999,
    tagline: 'Active professionals',
    renders: '250 renders / mo',
    popular: true,
    features: [
      'Everything in Individual',
      'Catalog → Stage → Quotation loop',
      'Live material/finish swap (real geometry)',
      'Client Presentation export (PDF)',
      'Unlimited scene versions + history',
      'Priority render queue'
    ]
  },
  {
    id: 'unlimited-pro',
    name: 'Unlimited Pro',
    price: 11999,
    tagline: 'Power users',
    renders: 'Unlimited',
    popular: false,
    features: [
      'Everything in Designer Pro',
      'Unlimited renders',
      'Video generation from render frames',
      'AI Director inpaint + lighting change',
      'Brand catalog access'
    ]
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    price: 26999,
    tagline: 'Studios & teams',
    renders: 'Unlimited · 5 seats',
    popular: false,
    features: [
      'Everything in Unlimited Pro',
      '5 seats + role-based access',
      'Per-member render visibility',
      'Consolidated billing + custom branding',
      'Dedicated support'
    ]
  }
];

const WHY_BETTER = [
  { icon: ShieldCheck, title: 'Geometry-truthful, not guesses', body: 'Every render, DXF, BOM and quotation derives from measured millimetre geometry. Agent B makes pictures; ULTIDA makes buildable drawings.' },
  { icon: Layers, title: 'One subscription replaces 6 tools', body: 'CAD + render + estimate + BOM + GST quotation + client presentation in a single workspace.' },
  { icon: Box, title: 'True 3D, not just a flat image', body: 'Scene graph exports to Blender/Cycles. When cloud AI quota dies, the deterministic base render still ships.' },
  { icon: FileText, title: 'India-native commerce', body: 'INR pricing, GST invoices, Vastu rules, and laminate catalogs local firms actually specify.' }
];

export default function PricingScreen() {
  const [annual, setAnnual] = useState(false);
  const discount = 0.25;
  const priceOf = (p) => annual ? Math.round(p * (1 - discount)) : p;

  return (
    <div className="min-h-screen w-full bg-[#0b0e14] text-slate-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[var(--gold)] text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" /> Plans &amp; Pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Professional interior design OS — priced for India</h1>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm">
            The only platform that turns a floor plan into contractor-ready drawings <em>and</em> client-ready renders — with the quotation included.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 bg-slate-900 border border-slate-800 rounded-full p-1 text-xs">
            <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full ${!annual ? 'bg-[var(--gold)] text-slate-950 font-bold' : 'text-slate-400'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full ${annual ? 'bg-[var(--gold)] text-slate-950 font-bold' : 'text-slate-400'}`}>Annual <span className="text-emerald-500 font-semibold">−25%</span></button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative rounded-2xl border p-5 flex flex-col ${plan.popular ? 'border-[var(--gold)] bg-slate-900/60' : 'border-slate-800 bg-slate-900/30'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">Most Popular</span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-[11px] text-slate-400 mb-3">{plan.tagline}</p>
              <div className="flex items-start gap-1 text-white">
                <IndianRupee className="w-5 h-5 mt-1 text-[var(--gold)]" />
                <span className="text-3xl font-extrabold">{priceOf(plan.price).toLocaleString('en-IN')}</span>
                <span className="text-slate-500 text-xs self-end mb-1">/mo</span>
              </div>
              {annual && <p className="text-[10px] text-emerald-500 mt-0.5">billed annually · save 25%</p>}
              <p className="text-[11px] text-slate-400 mt-2">{plan.renders}</p>
              <button className={`mt-4 w-full py-2 rounded-lg text-sm font-bold ${plan.popular ? 'bg-[var(--gold)] text-slate-950 hover:opacity-90' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                Get started
              </button>
              <ul className="mt-4 space-y-2 text-[12px] text-slate-300">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Why ULTIDA beats Agent B */}
        <div className="mt-14">
          <h2 className="text-center text-xl font-extrabold text-white mb-6">Why ULTIDA beats Agent B Studio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WHY_BETTER.map((w, i) => (
              <div key={i} className="flex gap-3 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/15 flex items-center justify-center shrink-0">
                  <w.icon className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{w.title}</h4>
                  <p className="text-[12px] text-slate-400 mt-1">{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-white">Running a furniture or décor brand?</h3>
          <p className="text-slate-400 text-sm mt-1">Brand plans with storefront, product library and catalog management — let's talk.</p>
          <button className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--gold)] text-slate-950 text-sm font-bold hover:opacity-90">
            Talk to us <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
