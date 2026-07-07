import React, { useState } from 'react';
import { Project } from '../../types/aura';
import { MOCK_ASSETS } from '../../data/mockData';
import { 
  ShoppingCart, 
  ExternalLink, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Truck,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export const CommerceBOQ: React.FC<{ project: Project }> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartPurchased, setCartPurchased] = useState(false);

  const categories = ['All', 'Furniture', 'Lighting', 'Materials', 'Decor & Plants'];

  const lineItems = MOCK_ASSETS.map((ast, index) => ({
    ...ast,
    qty: index === 8 ? 1 : 1,
    vendorDiscount: index % 2 === 0 ? 10 : 5
  }));

  const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const laborEstimate = Math.round(subtotal * 0.18);
  const designerCommission = Math.round(subtotal * 0.08);
  const totalWithLabor = subtotal + laborEstimate;

  const handleCheckout = () => {
    setCartPurchased(true);
    setTimeout(() => setCartPurchased(false), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100 select-none">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-emerald-400" /> Commerce & Automated Procurement
          </div>
          <h1 className="text-2xl font-black tracking-tight">Auto-BOQ (Bill of Quantities) & Checkout</h1>
          <p className="text-slate-400 text-sm">Every 3D item is mapped directly to live vendor pricing with designer trade discounts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => alert("Detailed Excel BOQ downloaded with quantities, materials, and regional GST/VAT.")}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-300 font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => alert("Contractor Handoff PDF generated with floor plan, MEP routing drawings, and finish schedule.")}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-purple-300 font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Contractor Handoff PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Line Items vs Checkout & Commission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Line Items Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden border border-slate-800 flex flex-col">
          {/* Category Filter Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900/40">
            <span className="text-xs text-slate-400 mr-2">Filter Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-900/20">
                  <th className="py-3 px-4">Item & Specification</th>
                  <th className="py-3 px-4">Brand / Vendor</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={item.thumbnail} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-200">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height} cm</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-300">{item.brand}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-[10px]">
                        <Truck className="w-3 h-3" /> 3-Day Lead Time
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${item.price}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${item.price * item.qty}</td>
                    <td className="py-3 px-4 text-right">
                      <a href={item.buyUrl} target="_blank" rel="noreferrer" className="p-1.5 inline-block text-slate-400 hover:text-indigo-400" title="View Vendor SKU">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Procurement Summary & Designer Commission */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-indigo-500/30">
            <h3 className="font-bold text-base text-slate-100 flex items-center justify-between">
              <span>Procurement Summary</span>
              <span className="text-xs font-mono text-indigo-400">Multi-Vendor Cart</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Products Subtotal ({lineItems.length} items):</span>
                <span className="font-bold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated MEP & Labor (18%):</span>
                <span className="text-amber-400">+${laborEstimate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Consolidated White-Glove Shipping:</span>
                <span className="text-emerald-400">FREE Trade Tier</span>
              </div>
              
              <div className="pt-3 border-t border-slate-800 flex justify-between text-sm text-white font-extrabold">
                <span>Total Turnkey Investment:</span>
                <span className="text-indigo-400">${totalWithLabor.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cartPurchased}
              className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
                cartPurchased
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-emerald-600/25'
              }`}
            >
              <ShoppingCart className="w-4 h-4 fill-current" />
              <span>{cartPurchased ? 'Order Placed Across 8 Vendors!' : 'One-Click "Buy Entire Room"'}</span>
            </button>

            {cartPurchased && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>PO dispatched to IKEA, West Elm, CB2, Herman Miller & local contractors.</span>
              </div>
            )}
          </div>

          {/* Designer Earnings Panel (Monetization blueprint) */}
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Designer Trade Earnings
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">8% Trade Tier</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When clients or homeowners purchase products through your AURA designs, you automatically earn trade commissions.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">Project Commission:</span>
              <span className="font-mono text-xl font-black text-emerald-400">+${designerCommission.toLocaleString()}</span>
            </div>

            <button onClick={() => alert("Generated shareable Affiliate Client Portal link.")} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition">
              Copy Client Payment Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
