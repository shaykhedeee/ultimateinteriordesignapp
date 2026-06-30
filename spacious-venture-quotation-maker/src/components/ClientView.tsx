import React, { useRef, useState, useEffect } from 'react';
import { Check, X, ShieldAlert, Edit, Info, Sparkles, User, Calendar, MessageSquare, Award } from 'lucide-react';
import { Quotation, QuoteItem, CompanyProfile, PaymentMilestone } from '../types';

interface ClientViewProps {
  quotation: Quotation;
  companyProfile: CompanyProfile;
  onApprove: (approvedQuote: Quotation) => void;
  onBack: () => void;
}

const ClientView: React.FC<ClientViewProps> = ({
  quotation,
  companyProfile,
  onApprove,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [clientNameInput, setClientNameInput] = useState(quotation.clientName || '');
  const [feedback, setFeedback] = useState(quotation.clientFeedback || '');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [status, setStatus] = useState(quotation.status);

  // Optional items selection state
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>(() => {
    // By default, assume all are selected if we want to show maximum scope,
    // or let them check/uncheck. Let's assume they are unchecked initially, or checked.
    // Let's check if the quote was already approved, in which case we load whatever was saved.
    // If not approved, let's select none or let them choose. Let's select all initially.
    return (quotation.requestedItems || []).map(i => i.id);
  });

  // Financial recalculations
  const [financials, setFinancials] = useState({
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    gst: quotation.gst,
    grandTotal: quotation.grandTotal,
    milestones: [] as PaymentMilestone[]
  });

  useEffect(() => {
    const baseSubtotal = quotation.items.reduce((sum, item) => sum + item.amount, 0);
    const optionalSubtotal = (quotation.requestedItems || [])
      .filter(item => selectedOptionalIds.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
    
    const sub = baseSubtotal + optionalSubtotal;
    const disc = quotation.discount || 0;
    const taxable = Math.max(0, sub - disc);
    const gstVal = quotation.isGstEnabled ? taxable * (quotation.gstPercentage / 100) : 0;
    const total = taxable + gstVal;

    const updatedMilestones = (quotation.paymentSchedule || []).map(m => ({
      ...m,
      amount: Math.round(total * (m.percentage / 100))
    }));

    setFinancials({
      subtotal: sub,
      discount: disc,
      gst: gstVal,
      grandTotal: total,
      milestones: updatedMilestones
    });
  }, [selectedOptionalIds, quotation]);

  // Canvas Signature Pad drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || status === 'APPROVED') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution and line styles
    ctx.strokeStyle = '#1f352b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Resize canvas to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Handle touch/mouse events
    const getPos = (e: MouseEvent | TouchEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        return {
          x: e.touches[0].clientX - canvasRect.left,
          y: e.touches[0].clientY - canvasRect.top
        };
      } else {
        return {
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top
        };
      }
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      if (!pos) return;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      if (!pos) return;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSigned(true);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing, status]);

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleApproveQuote = () => {
    if (status === 'APPROVED') return;
    if (!clientNameInput.trim()) {
      alert("Please enter your name to authorize the contract.");
      return;
    }
    if (!agreeTerms) {
      alert("Please check the agreement box to accept the specifications and terms.");
      return;
    }
    if (!hasSigned) {
      alert("Please draw your signature in the signature area.");
      return;
    }

    const canvas = canvasRef.current;
    let signatureBase64 = '';
    if (canvas) {
      signatureBase64 = canvas.toDataURL(); // Save canvas as Base64 PNG image
    }

    // Filter requestedItems based on client selections
    const finalRequested = (quotation.requestedItems || []).map(i => ({
      ...i,
      notes: selectedOptionalIds.includes(i.id) ? 'Approved by client' : 'Declined by client'
    }));

    const approvedQuotation: Quotation = {
      ...quotation,
      clientName: clientNameInput.trim(),
      clientSignature: signatureBase64,
      clientApprovedDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }) + ' ' + new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' }),
      clientFeedback: feedback.trim(),
      requestedItems: finalRequested,
      subtotal: financials.subtotal,
      discount: financials.discount,
      gst: financials.gst,
      grandTotal: financials.grandTotal,
      paymentSchedule: financials.milestones,
      status: 'APPROVED',
      updatedAt: new Date().toISOString()
    };

    setStatus('APPROVED');
    onApprove(approvedQuotation);
  };

  const toggleOptionalItem = (id: string) => {
    if (status === 'APPROVED') return; // Locked once approved
    setSelectedOptionalIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Group items by category (rooms)
  const groupedItems = quotation.items.reduce((acc, item) => {
    const category = item.category || 'General Works';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QuoteItem[]>);

  return (
    <div className="min-h-screen bg-[#f7f5f2] py-8 px-4 md:px-8 font-sans selection:bg-[#f5e6cf] selection:text-[#1f352b]">
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 shadow-lg rounded-2xl overflow-hidden">
        
        {/* Top Branding Header */}
        <div className="bg-[#1f352b] text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#b8873b]/20 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#b8873b]/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-10 w-28 bg-white rounded flex items-center justify-center p-1.5 overflow-hidden">
              <img src="/spacious-venture-logo.png" alt="Spacious Venture" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-md font-bold uppercase tracking-widest">{companyProfile.name}</h1>
              <p className="text-[9px] text-[#b8873b] uppercase tracking-[0.2em] font-bold">{companyProfile.tagline}</p>
            </div>
          </div>
          <div className="text-right sm:text-right relative z-10">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">Quotation Reference</span>
            <strong className="text-lg font-mono tracking-tight text-white">{quotation.quoteNumber}</strong>
          </div>
        </div>

        {/* Status Alert Banner */}
        {status === 'APPROVED' ? (
          <div className="bg-emerald-50 border-y border-emerald-200 p-4 text-emerald-800 flex items-center gap-3">
            <Award size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold text-emerald-900 block">Estimate Approved & Signed Digitally</strong>
              Approved by {quotation.clientName} on {quotation.clientApprovedDate || 'Authorized Date'}. A PDF contract has been locked and factory-queued.
            </div>
          </div>
        ) : (
          <div className="bg-[#b8873b]/10 border-y border-[#b8873b]/20 p-4 text-[#1f352b] flex items-center gap-3">
            <Info size={18} className="text-[#b8873b] shrink-0" />
            <div className="text-xs">
              <strong className="font-bold block">Interactive Client Review Portal</strong>
              Review your layout estimates below. You can toggle "Optional / Upgrade Items" in Section 2 to see dynamic pricing impact, then sign at the bottom to approve.
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-5 rounded-xl border border-stone-200/60 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Client Particulars</span>
              <p className="text-sm font-bold text-stone-800">{quotation.clientName}</p>
              {quotation.clientPhone && <p className="text-stone-500">Phone: {quotation.clientPhone}</p>}
              {quotation.clientEmail && <p className="text-stone-500">Email: {quotation.clientEmail}</p>}
              <p className="text-stone-500">Project Site: <span className="font-semibold">{quotation.projectLocation}</span></p>
            </div>
            <div className="space-y-1.5 sm:text-right flex flex-col justify-end">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Contract details</span>
              <p className="text-stone-600">Project Type: <span className="font-bold text-[#1f352b]">{quotation.projectType}</span></p>
              <p className="text-stone-500">Estimate Date: {new Date(quotation.dateOfIssue).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
              <p className="text-stone-500">Proposal Valid Until: {new Date(quotation.validUntil).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
              <p className="text-stone-600">Delivery Period: <span className="font-semibold text-stone-800">{quotation.projectDuration || '40 Working Days'}</span></p>
            </div>
          </div>

          {/* Section 1: Standard Items Table */}
          <div>
            <h3 className="text-xs font-black uppercase text-[#1f352b] tracking-wider mb-3 pb-1 border-b border-stone-200 flex items-center gap-1.5">
              <span>01. Primary Scope of Work</span>
            </h3>
            
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[9px] uppercase tracking-widest font-black text-stone-400">
                      <th className="py-2.5 px-4 w-48">Room / Zone</th>
                      <th className="py-2.5 px-4">Item Details & Quality Specifications</th>
                      <th className="py-2.5 px-4 w-24 text-center">Size</th>
                      <th className="py-2.5 px-4 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {Object.entries(groupedItems).map(([category, catItems]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-stone-50/50 font-bold text-[#1f352b] border-y border-stone-200/50">
                          <td colSpan={4} className="py-2 px-4 uppercase tracking-wider text-[10px] font-black">{category}</td>
                        </tr>
                        {catItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-stone-50/10">
                            <td className="py-3 px-4 font-medium text-stone-500 align-top pl-6">
                              {idx + 1}. {item.category || category}
                            </td>
                            <td className="py-3 px-4 text-stone-800 align-top">
                              <strong className="font-bold text-stone-800 block">{item.description}</strong>
                              {(item.material || item.finish || item.hardware) && (
                                <div className="text-[10px] text-stone-400 font-medium mt-1 italic flex flex-wrap gap-x-2 gap-y-0.5">
                                  {item.material && <span><strong>Core:</strong> {item.material}</span>}
                                  {item.finish && <span><strong>Finish:</strong> {item.finish}</span>}
                                  {item.hardware && <span><strong>Hardware:</strong> {item.hardware}</span>}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-stone-500 align-top">
                              {item.isLumpSum ? '-' : `${item.dimensions} (${item.sqft.toFixed(1)} Sqft)`}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-stone-800 font-mono align-top text-[12.5px]">
                              ₹{Math.round(item.amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-stone-50/20 text-right font-semibold">
                          <td colSpan={3} className="py-2 px-4 text-stone-400 uppercase tracking-widest text-[9px] font-bold">{category} Subtotal :</td>
                          <td className="py-2 px-4 text-stone-600 font-mono font-bold">
                            ₹{Math.round(catItems.reduce((s, i) => s + i.amount, 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Optional Upgrade Items */}
          {quotation.requestedItems && quotation.requestedItems.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase text-[#1f352b] tracking-wider mb-3 pb-1 border-b border-stone-200 flex justify-between items-center">
                <span>02. Optional Work & Upgrade Scope</span>
                <span className="text-[10px] text-stone-400 font-medium lowercase">check box to include in final total</span>
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {quotation.requestedItems.map(item => {
                  const isChecked = selectedOptionalIds.includes(item.id);
                  const isLocked = status === 'APPROVED';
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleOptionalItem(item.id)}
                      className={`border p-4 rounded-xl flex items-start gap-4 transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-[#b8873b] bg-[#f5e6cf]/10 shadow-sm' 
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() => {}} // handled by div click
                        className="mt-1 h-4 w-4 rounded text-[#b8873b] focus:ring-[#b8873b] shrink-0 pointer-events-none"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block mb-0.5">{item.category || 'Optional Upgrade'}</span>
                            <strong className="text-xs font-bold text-stone-800">{item.description}</strong>
                          </div>
                          <span className="text-xs font-bold text-stone-800 font-mono whitespace-nowrap">
                            ₹{Math.round(item.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {(item.material || item.finish || item.hardware) && (
                          <div className="text-[9.5px] text-stone-400 mt-1 italic flex flex-wrap gap-x-2">
                            {item.material && <span><strong>Core:</strong> {item.material}</span>}
                            {item.finish && <span><strong>Finish:</strong> {item.finish}</span>}
                            {item.hardware && <span><strong>Hardware:</strong> {item.hardware}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specifications and Terms Accordions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200/60">
            {/* Specs */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#1f352b] uppercase tracking-wider block">Material Standards</span>
              <div className="space-y-2 text-[11px] text-stone-500 max-h-56 overflow-y-auto border border-stone-100 p-4 rounded-xl bg-stone-50/40">
                {quotation.specifications.map((spec, i) => (
                  <p key={i} className="leading-relaxed flex gap-2">
                    <span className="text-[#b8873b] font-bold">•</span>
                    <span>{spec}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#1f352b] uppercase tracking-wider block">Commercial Terms</span>
              <div className="space-y-2 text-[11px] text-stone-500 max-h-56 overflow-y-auto border border-stone-100 p-4 rounded-xl bg-stone-50/40">
                {quotation.terms.map((term, i) => (
                  <p key={i} className="leading-relaxed flex gap-2">
                    <span className="font-bold text-stone-400">{i + 1}.</span>
                    <span>{term}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Payment schedule milestones */}
          <div>
            <h3 className="text-xs font-black uppercase text-[#1f352b] tracking-wider mb-3 pb-1 border-b border-stone-200">
              <span>03. Remittance & Billing Milestones</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {financials.milestones.map((m, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200/50 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[8.5px] uppercase font-bold text-stone-400 block mb-1">Milestone {idx + 1}</span>
                    <strong className="font-bold text-stone-700 leading-snug block min-h-[32px]">{m.milestone}</strong>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-200/50 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-[#b8873b]">{m.percentage}%</span>
                    <strong className="font-bold text-[#1f352b] font-mono text-[13px]">
                      ₹{Math.round(m.amount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals Box */}
          <div className="bg-[#1f352b] text-white p-6 rounded-2xl border border-[#b8873b]/30 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-[11.5px] text-stone-400 flex flex-col justify-center gap-1 leading-normal pr-6 border-r border-white/10">
                <span className="text-[12.5px] font-bold uppercase tracking-wider text-white mb-1.5 block">Payment Gateway Details</span>
                <p><strong>A/c Name:</strong> {quotation.bankDetails?.accountName || companyProfile.bankDetails.accountName}</p>
                <p><strong>Banker:</strong> {quotation.bankDetails?.bankName || companyProfile.bankDetails.bankName}</p>
                <p><strong>Account #:</strong> <span className="font-mono font-bold tracking-wider text-stone-300">{quotation.bankDetails?.accountNumber || companyProfile.bankDetails.accountNumber}</span></p>
                <p><strong>IFSC Code:</strong> <span className="font-mono font-bold text-stone-300">{quotation.bankDetails?.ifscCode || companyProfile.bankDetails.ifscCode}</span></p>
              </div>

              <div className="flex flex-col justify-center gap-2.5 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Gross Subtotal</span>
                  <span className="font-mono font-semibold text-white">₹{Math.round(financials.subtotal).toLocaleString('en-IN')}</span>
                </div>
                {financials.discount > 0 && (
                  <div className="flex justify-between text-red-400 font-semibold">
                    <span>Discount (-)</span>
                    <span className="font-mono">- ₹{Math.round(financials.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {quotation.isGstEnabled && (
                  <div className="flex justify-between">
                    <span>GST ({quotation.gstPercentage || 18}%)</span>
                    <span className="font-mono text-white">₹{Math.round(financials.gst).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-3.5 border-t border-white/10 flex justify-between items-center text-white">
                  <span className="font-black uppercase text-[12px] text-[#b8873b]">Grand Total Estimate</span>
                  <strong className="text-[22px] font-serif font-black font-mono text-white">
                    ₹{Math.round(financials.grandTotal).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Signature & Approve Block */}
          {status === 'APPROVED' ? (
            <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl p-6 text-center space-y-4">
              <Award size={48} className="mx-auto text-emerald-600" />
              <div>
                <h4 className="text-md font-bold text-emerald-900">Quotation Officially Accepted</h4>
                <p className="text-xs text-emerald-700 mt-1">Thank you for approving this project estimate! We have logged your digital signature below.</p>
              </div>
              <div className="max-w-[320px] mx-auto bg-white border border-stone-200 rounded-xl p-4 mt-4 shadow-sm flex flex-col items-center">
                {quotation.clientSignature ? (
                  <img src={quotation.clientSignature} alt="Client Signature" className="h-16 object-contain" />
                ) : (
                  <span className="font-signature text-3xl text-emerald-800 italic">{quotation.clientName}</span>
                )}
                <div className="w-full border-t border-stone-100 pt-2 mt-2 text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                  Authorized Client Signature & Date
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">{quotation.clientApprovedDate}</div>
              </div>
              {quotation.clientFeedback && (
                <div className="max-w-md mx-auto text-[11px] text-stone-500 border border-stone-200/50 bg-stone-50 rounded-xl p-3 mt-4 text-left">
                  <span className="font-bold uppercase text-[9px] text-stone-400 block mb-1">Your comments:</span>
                  "{quotation.clientFeedback}"
                </div>
              )}
            </div>
          ) : (
            <div className="border border-stone-200 rounded-2xl p-6 space-y-6 bg-stone-50/20">
              <h3 className="text-xs font-black uppercase text-[#1f352b] tracking-wider pb-1 border-b border-stone-200">
                <span>04. Digital Contract Signature & Acceptance</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Authorize Client Name *</span>
                    <input
                      type="text"
                      value={clientNameInput}
                      onChange={e => setClientNameInput(e.target.value)}
                      placeholder="Enter your full name..."
                      className="border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#b8873b] bg-white font-bold text-stone-700"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Feedback / Project Notes (Optional)</span>
                    <textarea
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Write any changes, timelines, or comments you would like us to note..."
                      rows={4}
                      className="border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-[#b8873b] bg-white text-stone-600"
                    />
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-stone-500 cursor-pointer pt-2 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-[#b8873b] focus:ring-[#b8873b] mt-0.5"
                    />
                    <span>
                      I verify that the dimensions and modular scope match the approved designs, and I accept the terms of the Spacious Venture payment schedule.
                    </span>
                  </label>
                </div>

                {/* Signature Pad */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Draw Your Signature Below *</span>
                  <div className="flex-1 bg-white border border-stone-200 rounded-xl relative shadow-inner overflow-hidden min-h-[160px] md:min-h-[200px]">
                    <canvas 
                      ref={canvasRef} 
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                    {!hasSigned && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-stone-300 text-xs">
                        Draw signature here using mouse or finger
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleClearSignature}
                      className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-500 rounded-lg text-xs font-semibold"
                    >
                      Clear Pad
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-stone-200/50">
                <button
                  onClick={handleApproveQuote}
                  className="w-full sm:w-auto bg-[#1f352b] hover:bg-[#2c493c] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-98 transition-all flex justify-center items-center gap-2"
                >
                  <Award size={16} />
                  <span>Approve & Authorize Estimate</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Portal Footer */}
        <div className="bg-stone-50 py-5 px-6 border-t border-stone-200 flex justify-between items-center text-stone-400 text-xs">
          <button 
            onClick={onBack}
            className="text-stone-500 hover:text-stone-800 font-bold transition-colors"
          >
            ← Return to Dashboard
          </button>
          <span>Powered by Spacious Venture Studio</span>
        </div>

      </div>
    </div>
  );
};

export default ClientView;
