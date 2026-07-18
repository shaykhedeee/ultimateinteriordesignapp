import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Eye, Edit, ArrowLeft, Printer, FileDown, Check, Layers } from 'lucide-react';
import { Quotation, QuoteItem, CompanyProfile, QuoteStatus, CustomTemplate } from '../types';

interface QuotationPreviewProps {
  quotation: Quotation;
  companyProfile: CompanyProfile;
  onEdit: () => void;
  onBack: () => void;
  onClientReview: (q: Quotation) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  companyProfile,
  onEdit,
  onBack,
  onClientReview,
  showToast
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<QuoteStatus>(quotation.status);

  // Group items by category (rooms)
  const groupedItems = quotation.items.reduce((acc, item) => {
    const category = item.category || 'General Works';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QuoteItem[]>);

  // Flatten the grouped items into table rows for pagination
  type TableRowType = 
    | { type: 'header'; category: string }
    | { type: 'item'; item: QuoteItem; index: number }
    | { type: 'footer'; category: string; totalAmount: number };

  const tableRows: TableRowType[] = [];
  Object.entries(groupedItems).forEach(([category, catItems]) => {
    tableRows.push({ type: 'header', category });
    catItems.forEach((item, idx) => {
      tableRows.push({ type: 'item', item, index: idx + 1 });
    });
    
    const totalAmount = catItems.reduce((sum, item) => sum + item.amount, 0);
    tableRows.push({ type: 'footer', category, totalAmount });
  });

  // Split tableRows into chunks of max units per page dynamically.
  const calculateRowWeight = (row: TableRowType): number => {
    if (row.type === 'header') return 1.5;
    if (row.type === 'footer') return 1.2;
    
    const item = row.item;
    let weight = 1.0;
    
    // Calculate lines for description (approx 32 chars per line in 14px font inside 280px width)
    const descLines = Math.ceil(item.description.length / 32);
    if (descLines > 1) {
      weight += (descLines - 1) * 0.35;
    }
    
    // Check specifications (Core, Finish, Hardware)
    let specCount = 0;
    if (item.material) specCount++;
    if (item.finish) specCount++;
    if (item.hardware) specCount++;
    
    if (specCount > 0) {
      weight += 0.35;
      if (specCount > 2) {
        weight += 0.2;
      }
    }
    
    return weight;
  };

  const maxUnitsPerPage = 7.6; // Re-calibrated for 7-column layout and text-wrapping safety
  const tablePages: TableRowType[][] = [];
  let currentPage: TableRowType[] = [];
  let currentUnits = 0;

  tableRows.forEach((row) => {
    const rowUnits = calculateRowWeight(row);
    
    if (currentUnits + rowUnits > maxUnitsPerPage) {
      tablePages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
      
      // Carry over category header for context if split
      if (row.type !== 'header') {
        let lastHeaderCategory = '';
        const currentIdx = tableRows.indexOf(row);
        for (let i = currentIdx - 1; i >= 0; i--) {
          const r = tableRows[i];
          if (r.type === 'header') {
            lastHeaderCategory = r.category;
            break;
          }
        }
        if (lastHeaderCategory) {
          currentPage.push({ type: 'header', category: lastHeaderCategory });
          currentUnits += 1.5;
        }
      }
    }
    
    currentPage.push(row);
    currentUnits += rowUnits;
  });

  if (currentPage.length > 0) {
    tablePages.push(currentPage);
  }

  if (tablePages.length === 0) {
    tablePages.push([]);
  }

  // Calculate pages dynamically based on what sections are present
  let currentPageNum = 1 + tablePages.length;
  
  const specsPageNum = quotation.specifications && quotation.specifications.length > 0 ? ++currentPageNum : null;
  const paymentPageNum = quotation.paymentSchedule && quotation.paymentSchedule.length > 0 ? ++currentPageNum : null;
  const termsPageNum = quotation.terms && quotation.terms.length > 0 ? ++currentPageNum : null;
  const closingPageNum = ++currentPageNum;
  
  const totalPagesCount = currentPageNum;

  // Status Change
  const handleStatusChange = (newStatus: QuoteStatus) => {
    setStatus(newStatus);
    // Persist status change in parent state by modifying the local storage
    try {
      const saved = localStorage.getItem('sv_quotations');
      if (saved) {
        const parsed: Quotation[] = JSON.parse(saved);
        const updated = parsed.map(q => q.id === quotation.id ? { ...q, status: newStatus } : q);
        localStorage.setItem('sv_quotations', JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save as Custom Template
  const handleSaveAsTemplate = () => {
    const templateName = prompt("Enter a name for this custom template (e.g. Society Name, BHK spec):", `${quotation.clientName || 'Society'} - Custom Template`);
    if (!templateName || !templateName.trim()) {
      return;
    }
    
    try {
      const saved = localStorage.getItem('sv_custom_templates');
      const templates: CustomTemplate[] = saved ? JSON.parse(saved) : [];
      
      const newTemplate: CustomTemplate = {
        id: `t-custom-${Date.now()}`,
        name: templateName.trim(),
        projectType: quotation.projectType,
        items: quotation.items,
        requestedItems: quotation.requestedItems || [],
        specifications: quotation.specifications || [],
        terms: quotation.terms || [],
        notes: quotation.notes
      };
      
      templates.push(newTemplate);
      localStorage.setItem('sv_custom_templates', JSON.stringify(templates));
      
      if (showToast) {
        showToast('Template saved successfully! Access it on the dashboard.', 'success');
      } else {
        alert('Template saved successfully! Access it on the dashboard.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save template.');
    }
  };

  // jsPDF Multi-page Generator
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsGenerating(true);
    
    const styleInjections: string[] = [];
    const hrefsToRemove: string[] = [];
    
    try {
      // 1. Try reading stylesheets from document.styleSheets in-memory
      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            if (sheet.cssRules) {
              let rulesText = '';
              for (let j = 0; j < sheet.cssRules.length; j++) {
                rulesText += sheet.cssRules[j].cssText + '\n';
              }
              const cleanedCSS = rulesText.replace(/(?:oklch|oklab|color-mix|lch|lab)\((?:[^()]+|\([^()]*\))*\)/g, 'rgb(120, 120, 120)');
              styleInjections.push(cleanedCSS);
              if (sheet.href) {
                hrefsToRemove.push(sheet.href);
              }
            }
          } catch (e) {
            // Cross-origin stylesheet security fallback
          }
        }
      } catch (err) {
        console.error('Error reading document.styleSheets in-memory:', err);
      }

      // 2. Fallback to async fetch for stylesheet links
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < linkTags.length; i++) {
        const link = linkTags[i] as HTMLLinkElement;
        const href = link.href;
        if (href && !hrefsToRemove.includes(href)) {
          if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
            continue;
          }
          try {
            const response = await fetch(href);
            if (response.ok) {
              const text = await response.text();
              const cleanedCSS = text.replace(/(?:oklch|oklab|color-mix|lch|lab)\((?:[^()]+|\([^()]*\))*\)/g, 'rgb(120, 120, 120)');
              styleInjections.push(cleanedCSS);
              hrefsToRemove.push(href);
            }
          } catch (e) {
            console.error('Failed to fetch stylesheet fallback asynchronously:', href, e);
          }
        }
      }

      const element = printAreaRef.current;
      const pages = element.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; 
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2, 
          useCORS: true,
          backgroundColor: '#FAF8F5', 
          width: 794,
          height: 1122,
          windowWidth: 794,
          windowHeight: 1122,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const clonedLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            clonedLinks.forEach(link => {
              const href = (link as HTMLLinkElement).href;
              if (href && hrefsToRemove.includes(href)) {
                link.parentNode?.removeChild(link);
              }
            });

            styleInjections.forEach(cssText => {
              const style = clonedDoc.createElement('style');
              style.textContent = cssText;
              clonedDoc.head.appendChild(style);
            });

            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let j = 0; j < styleTags.length; j++) {
              const style = styleTags[j];
              if (style.textContent && /(?:oklch|oklab|color-mix|lch|lab)/.test(style.textContent)) {
                style.textContent = style.textContent.replace(/(?:oklch|oklab|color-mix|lch|lab)\((?:[^()]+|\([^()]*\))*\)/g, 'rgb(120, 120, 120)');
              }
            }

            const allElements = clonedDoc.getElementsByTagName('*');
            for (let j = 0; j < allElements.length; j++) {
              const el = allElements[j] as HTMLElement;
              const styleAttr = el.getAttribute('style');
              if (styleAttr && /(?:oklch|oklab|color-mix|lch|lab)/.test(styleAttr)) {
                const cleanedAttr = styleAttr.replace(/(?:oklch|oklab|color-mix|lch|lab)\((?:[^()]+|\([^()]*\))*\)/g, 'rgb(120, 120, 120)');
                el.setAttribute('style', cleanedAttr);
              }
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${quotation.clientName.replace(/\s+/g, '_')}_Quotation_${quotation.quoteNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Something went wrong while exporting the PDF. Please try browser print instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      
      {/* Action Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-white border border-stone-200 shadow-sm p-4 rounded-xl mb-6 gap-4 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-6 w-px bg-stone-200"></div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Status</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
              className="text-xs font-bold border border-stone-200 rounded px-2 py-0.5 bg-white text-stone-800 focus:outline-none focus:border-[#b8873b]"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="INITIAL_QUOTE">INITIAL QUOTE</option>
              <option value="SENT">SENT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onClientReview(quotation)}
            className="flex-1 sm:flex-none bg-[#b8873b] hover:bg-[#a37632] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Eye size={14} />
            <span>Client Review Portal</span>
          </button>

          <button
            onClick={handleSaveAsTemplate}
            className="flex-1 sm:flex-none border border-stone-200 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers size={14} className="text-[#b8873b]" />
            <span>Save as Template</span>
          </button>

          <button
            onClick={onEdit}
            className="flex-1 sm:flex-none border border-stone-200 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Edit size={14} />
            <span>Edit Quote</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none border border-stone-200 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer size={14} />
            <span>Print / Save PDF (Browser)</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex-1 sm:flex-none bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>{isGenerating ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF PRINT / SCROLLABLE PREVIEW BOX */}
      <div className="bg-stone-700/5 border border-stone-300 p-8 rounded-xl flex justify-center overflow-x-auto shadow-inner print-container-wrapper">
        <div ref={printAreaRef} className="print-document bg-white shadow-2xl">
          
          {/* ================= PAGE 1: COVER PAGE ================= */}
          <div 
            className="pdf-page sv-page border p-14 flex flex-col justify-between relative overflow-hidden page-break-after-always"
            style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
          >
            {/* Elegant double border frame */}
            <div className="absolute inset-4 border border-[#b8873b]/30 rounded-lg pointer-events-none"></div>
            <div className="absolute inset-[22px] border border-[#1f352b]/10 rounded pointer-events-none"></div>
            
            <div className="absolute top-0 right-0 w-2/3 h-full sv-bg-diagonal skew-x-12 origin-top transform pointer-events-none"></div>
            
            {/* Logo and Header Details */}
            <div className="flex justify-between items-center border-b sv-border-secondary/40 pb-5 z-10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-52 sv-bg-white rounded-lg flex items-center justify-center border sv-border-light p-1.5 shadow-sm overflow-hidden">
                  <img src="/spacious-venture-logo.png" alt="Spacious Venture Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-serif font-black text-3xl sv-text-primary tracking-wider leading-none">SPACIOUS VENTURE</h1>
                  <span className="text-[11.5px] uppercase tracking-[0.25em] sv-text-secondary font-bold block mt-1">Factory-Direct Interior Studio</span>
                </div>
              </div>
              <div className="text-right text-[12.5px] sv-text-muted leading-normal">
                <p><strong>Sarjapur Factory:</strong> Sulikunte Road, Bangalore</p>
                <p><strong>Mobile:</strong> +91 95385 36950</p>
                <p className="font-mono text-[11.5px]">info@spaciousventure.com</p>
              </div>
            </div>

            {/* Middle Presentation Title */}
            <div className="my-auto py-10 z-10 px-6">
              <span className="text-[13.5px] font-bold sv-text-secondary uppercase tracking-[0.25em] block mb-3">Custom Interior Design proposal</span>
              <h2 className="text-5xl font-serif sv-text-primary font-bold leading-tight">Project Quotation &<br/>Design Specification</h2>
              <div className="w-24 h-[3px] sv-bg-secondary mt-6"></div>
              
              <div className="mt-14 space-y-6">
                <div className="bg-[#1f352b]/5 border-l-4 sv-border-primary p-4 rounded-r-lg max-w-lg">
                  <span className="text-[12.5px] font-bold sv-text-light uppercase tracking-widest block mb-1">Estimate Prepared For</span>
                  <h3 className="text-[26px] font-bold sv-text-dark leading-snug">{quotation.clientName || 'Valued Client'}</h3>
                  <p className="text-[15px] sv-text-muted mt-1">Location: <span className="font-semibold sv-text-primary">{quotation.projectLocation || 'Sarjapur, Bangalore'}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-6 max-w-lg border-t sv-border-light pt-6">
                  <div>
                    <span className="text-[12.5px] font-bold sv-text-light uppercase tracking-widest block mb-0.5">Project Scope</span>
                    <strong className="text-[15px] font-bold sv-text-primary">{quotation.projectType}</strong>
                  </div>
                  <div>
                    <span className="text-[12.5px] font-bold sv-text-light uppercase tracking-widest block mb-0.5">Delivery Target</span>
                    <strong className="text-[15px] font-bold sv-text-muted">{quotation.projectDuration || '40 Working Days'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Meta Footer */}
            <div className="border-t sv-border-light pt-6 flex justify-between items-center text-[13.5px] sv-text-muted z-10">
              <div>
                <span className="block sv-text-light font-bold uppercase text-[11px] tracking-wider">Quote Reference</span>
                <strong className="font-mono sv-text-primary font-bold text-[14px]">{quotation.quoteNumber}</strong>
              </div>
              <div className="text-center">
                <span className="block sv-text-light font-bold uppercase text-[11px] tracking-wider">Date of Issue</span>
                <strong className="sv-text-primary font-bold text-[13.5px]">{new Date(quotation.dateOfIssue).toLocaleDateString('en-GB', { dateStyle: 'long' })}</strong>
              </div>
              <div className="text-right">
                <span className="block sv-text-light font-bold uppercase text-[11px] tracking-wider">Valid Until</span>
                <strong className="sv-text-primary font-bold text-[13.5px]">{new Date(quotation.validUntil).toLocaleDateString('en-GB', { dateStyle: 'long' })}</strong>
              </div>
            </div>

          </div>

          {/* ================= PAGE 2+: DETAILED BREAKDOWN TABLES ================= */}
          {tablePages.map((pageRows, pageIdx) => {
            const pageNumber = 2 + pageIdx;
            return (
              <div 
                key={pageIdx} 
                className="pdf-page sv-page border p-12 flex flex-col justify-between relative overflow-hidden page-break-after-always"
                style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
              >
                <div>
                  {/* Header running info */}
                  <div className="flex justify-between items-center border-b sv-border-secondary pb-3 mb-6 text-[11px] sv-text-muted">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-24 sv-bg-white rounded flex items-center justify-center p-0.5 border sv-border-light overflow-hidden">
                        <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <span className="font-serif font-black uppercase sv-text-primary tracking-wider text-[14px]">SPACIOUS VENTURE</span>
                    </div>
                    <span className="font-mono text-[12px] font-semibold sv-text-light">
                      Quote Ref: {quotation.quoteNumber} | Page {pageNumber} of {totalPagesCount}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold sv-text-secondary uppercase tracking-widest mb-4 font-serif">Detailed Price Breakdown</h3>
                  
                  <div className="overflow-hidden rounded-lg border sv-border-light sv-bg-white">
                    <table className="w-full text-left border-collapse text-[13px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="sv-bg-primary sv-text-white text-[11px] uppercase tracking-widest font-black border-b sv-border-secondary">
                          <th className="py-3 px-2 w-[40px] text-center">S.NO</th>
                          <th className="py-3 px-3 w-[280px]">PRODUCT / SERVICE</th>
                          <th className="py-3 px-2 w-[90px] text-center">DIMENSIONS</th>
                          <th className="py-3 px-2 w-[60px] text-center">QTY</th>
                          <th className="py-3 px-2 w-[50px] text-center">UNIT</th>
                          <th className="py-3 px-2 w-[80px] text-right">RATE</th>
                          <th className="py-3 px-4 w-[98px] text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row, rowIdx) => {
                          if (row.type === 'header') {
                            return (
                              <tr key={rowIdx} className="sv-bg-light font-bold sv-text-primary border-b sv-border-light">
                                <td className="py-2.5 px-3 text-left font-serif font-black uppercase text-[12px]" colSpan={7}>
                                  {row.category.toUpperCase()}
                                </td>
                              </tr>
                            );
                          } else if (row.type === 'footer') {
                            return (
                              <tr key={rowIdx} className="sv-bg-muted border-t border-b sv-border-light text-right font-bold">
                                <td colSpan={6} className="py-2.5 px-3 text-right text-[12px] uppercase tracking-wider sv-text-light font-black">
                                  {row.category.toUpperCase()} TOTAL :
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono sv-text-primary text-[13.5px] font-black">
                                  ₹{Math.round(row.totalAmount).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          } else {
                            const { item, index } = row;
                            return (
                              <tr key={rowIdx} className="border-b sv-border-muted last:border-0 hover:bg-stone-50/20">
                                {/* S.No */}
                                <td className="py-3 px-2 text-center font-bold sv-text-light text-[12px] align-top">{index}</td>
                                
                                {/* Product Details */}
                                <td className="py-3 px-3 sv-text-dark font-semibold leading-relaxed whitespace-pre-wrap break-words align-top">
                                  <div className="font-bold text-[13.5px]">{item.description}</div>
                                  {(item.material || item.finish || item.hardware) && (
                                    <div className="text-[10.5px] sv-text-muted mt-1 leading-normal italic font-medium border-t border-stone-200/50 pt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                      {item.material && <span><strong>Core:</strong> {item.material}</span>}
                                      {item.finish && <span><strong>Finish:</strong> {item.finish}</span>}
                                      {item.hardware && <span><strong>Hardware:</strong> {item.hardware}</span>}
                                    </div>
                                  )}
                                </td>

                                {/* Dimensions */}
                                <td className="py-3 px-2 text-center sv-text-muted font-bold font-mono text-[12px] align-top">
                                  {item.isLumpSum ? '-' : item.dimensions}
                                </td>

                                {/* Qty */}
                                <td className="py-3 px-2 text-center sv-text-muted font-bold font-mono text-[12px] align-top">
                                  {item.isLumpSum ? '1' : item.sqft.toFixed(2)}
                                </td>

                                {/* Unit */}
                                <td className="py-3 px-2 text-center sv-text-light font-bold text-[10px] uppercase tracking-wider align-top pt-3.5">
                                  {item.unit || (item.isLumpSum ? 'Nos' : 'Sqft')}
                                </td>

                                {/* Rate */}
                                <td className="py-3 px-2 text-right font-bold sv-text-muted font-mono text-[12.5px] align-top">
                                  ₹{Math.round(item.rate).toLocaleString('en-IN')}
                                </td>

                                {/* Costing */}
                                <td className="py-3 px-4 text-right font-bold sv-text-dark font-mono text-[13.5px] align-top">
                                  {item.amount > 0 ? `₹${Math.round(item.amount).toLocaleString('en-IN')}` : '-'}
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Page Footer */}
                <div className="border-t sv-border-light pt-3 flex justify-between items-center text-[12px] sv-text-light uppercase tracking-widest font-semibold">
                  <span>Sarjapur Factory Direct</span>
                  <span>Personalized Home Interiors</span>
                </div>
              </div>
            );
          })}

          {/* ================= PAGE: MATERIAL SPECS ================= */}
          {specsPageNum && (
            <div 
              className="pdf-page sv-page border p-12 flex flex-col justify-between relative overflow-hidden page-break-after-always"
              style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
            >
              <div>
                {/* Header running info */}
                <div className="flex justify-between items-center border-b sv-border-secondary pb-3 mb-6 text-[11px] sv-text-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 sv-bg-white rounded flex items-center justify-center p-0.5 border sv-border-light overflow-hidden">
                      <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-serif font-black uppercase sv-text-primary tracking-wider text-[14px]">SPACIOUS VENTURE</span>
                  </div>
                  <span className="font-mono text-[12px] font-semibold sv-text-light">
                    Quote Ref: {quotation.quoteNumber} | Page {specsPageNum} of {totalPagesCount}
                  </span>
                </div>

                {/* Material Specifications */}
                <div>
                  <h4 className="text-[15px] font-bold sv-text-secondary uppercase tracking-wider mb-4 border-b sv-border-light pb-1.5 font-serif">
                    Material Specifications & Brand Standards
                  </h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[13px] sv-text-muted leading-normal mt-2">
                    {quotation.specifications.map((spec, idx) => {
                      const colonIdx = spec.indexOf(':');
                      if (colonIdx !== -1) {
                        const title = spec.substring(0, colonIdx).trim();
                        const desc = spec.substring(colonIdx + 1).trim();
                        return (
                          <div key={idx} className="border-b sv-border-light/60 pb-2 flex flex-col gap-1">
                            <span className="text-[11.5px] font-black uppercase sv-text-primary tracking-wide block">{title}</span>
                            <span className="sv-text-muted font-medium">{desc}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex gap-2.5 border-b sv-border-light/60 pb-2 items-start">
                          <span className="sv-text-primary font-bold">•</span>
                          <span>{spec}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t sv-border-light pt-3 flex justify-between items-center text-[12px] sv-text-light uppercase tracking-widest font-semibold">
                <span>Sarjapur Factory Direct</span>
                <span>Personalized Home Interiors</span>
              </div>
            </div>
          )}

          {/* ================= PAGE: PAYMENT SCHEDULE ================= */}
          {paymentPageNum && (
            <div 
              className="pdf-page sv-page border p-12 flex flex-col justify-between relative overflow-hidden page-break-after-always"
              style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
            >
              <div>
                {/* Header running info */}
                <div className="flex justify-between items-center border-b sv-border-secondary pb-3 mb-6 text-[11px] sv-text-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 sv-bg-white rounded flex items-center justify-center p-0.5 border sv-border-light overflow-hidden">
                      <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-serif font-black uppercase sv-text-primary tracking-wider text-[14px]">SPACIOUS VENTURE</span>
                  </div>
                  <span className="font-mono text-[12px] font-semibold sv-text-light">
                    Quote Ref: {quotation.quoteNumber} | Page {paymentPageNum} of {totalPagesCount}
                  </span>
                </div>

                {/* Payment Schedule */}
                <div>
                  <h4 className="text-[15px] font-bold sv-text-secondary uppercase tracking-wider mb-4 border-b sv-border-light pb-1.5 font-serif">
                    Payment Schedule (Milestones)
                  </h4>
                  <div className="overflow-hidden rounded-xl border sv-border-light sv-bg-white mt-4">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="sv-bg-light sv-text-primary font-bold border-b sv-border-light">
                          <th className="py-3 px-5 w-[420px] text-[12.5px] uppercase tracking-wider">Milestone Event</th>
                          <th className="py-3 px-5 text-center w-[120px] text-[12.5px] uppercase tracking-wider">Percentage</th>
                          <th className="py-3 px-5 text-right w-[158px] text-[12.5px] uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y sv-border-muted">
                        {quotation.paymentSchedule?.map((p, idx) => (
                          <tr key={idx} className="sv-text-muted">
                            <td className="py-3.5 px-5 font-semibold">{p.milestone}</td>
                            <td className="py-3.5 px-5 text-center font-bold sv-text-secondary">{p.percentage}%</td>
                            <td className="py-3.5 px-5 text-right font-bold sv-text-primary font-mono text-[14px]">
                              ₹{Math.round(p.amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t sv-border-light pt-3 flex justify-between items-center text-[12px] sv-text-light uppercase tracking-widest font-semibold">
                <span>Sarjapur Factory Direct</span>
                <span>Personalized Home Interiors</span>
              </div>
            </div>
          )}

          {/* ================= PAGE: TERMS & CONDITIONS ================= */}
          {termsPageNum && (
            <div 
              className="pdf-page sv-page border p-12 flex flex-col justify-between relative overflow-hidden page-break-after-always"
              style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
            >
              <div>
                {/* Header running info */}
                <div className="flex justify-between items-center border-b sv-border-secondary pb-3 mb-6 text-[11px] sv-text-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 sv-bg-white rounded flex items-center justify-center p-0.5 border sv-border-light overflow-hidden">
                      <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-serif font-black uppercase sv-text-primary tracking-wider text-[14px]">SPACIOUS VENTURE</span>
                  </div>
                  <span className="font-mono text-[12px] font-semibold sv-text-light">
                    Quote Ref: {quotation.quoteNumber} | Page {termsPageNum} of {totalPagesCount}
                  </span>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <h4 className="text-[15px] font-bold sv-text-secondary uppercase tracking-wider mb-4 border-b sv-border-light pb-1.5 font-serif">
                    Terms & Conditions
                  </h4>
                  <div className="grid grid-cols-1 gap-y-3.5 text-[12.5px] sv-text-muted leading-relaxed mt-4">
                    {quotation.terms.map((term, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <span className="sv-text-primary font-bold font-mono text-[13px]">{idx + 1}.</span>
                        <span className="font-medium">{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t sv-border-light pt-3 flex justify-between items-center text-[12px] sv-text-light uppercase tracking-widest font-semibold">
                <span>Sarjapur Factory Direct</span>
                <span>Personalized Home Interiors</span>
              </div>
            </div>
          )}

          {/* ================= PAGE: CLOSING & SIGN ACCEPTANCE ================= */}
          <div 
            className="pdf-page sv-page border p-12 flex flex-col justify-between"
            style={{ width: '794px', height: '1122px', minWidth: '794px', minHeight: '1122px', maxWidth: '794px', maxHeight: '1122px' }}
          >
            <div>
              {/* Header running info */}
              <div className="flex justify-between items-center border-b sv-border-secondary pb-3 mb-6 text-[11px] sv-text-muted">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-24 sv-bg-white rounded flex items-center justify-center p-0.5 border sv-border-light overflow-hidden">
                    <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-serif font-black uppercase sv-text-primary tracking-wider text-[14px]">SPACIOUS VENTURE</span>
                </div>
                <span className="font-mono text-[12px] font-semibold sv-text-light">
                  Quote Ref: {quotation.quoteNumber} | Page {closingPageNum} of {totalPagesCount}
                </span>
              </div>

              {/* Closing Header */}
              <h4 className="text-[15px] font-bold sv-text-secondary uppercase tracking-wider mb-4 border-b sv-border-light pb-1.5 font-serif">
                Quotation Acceptance & Sign-off
              </h4>

              <div className="sv-bg-white rounded-xl border sv-border-light p-6 mb-8 shadow-sm mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bank info */}
                  <div className="text-[12px] sv-text-muted space-y-2 pr-6 border-r sv-border-light">
                    <span className="text-[13px] font-bold sv-text-primary uppercase tracking-wider block mb-2">
                      Bank Remittance Accounts
                    </span>
                    <p><strong>A/c Name:</strong> {quotation.bankDetails?.accountName || companyProfile.bankDetails.accountName}</p>
                    <p><strong>Banker:</strong> {quotation.bankDetails?.bankName || companyProfile.bankDetails.bankName}</p>
                    <p><strong>A/c Number:</strong> <span className="font-mono font-semibold">{quotation.bankDetails?.accountNumber || companyProfile.bankDetails.accountNumber}</span></p>
                    <p><strong>IFSC Code:</strong> <span className="font-mono font-semibold">{quotation.bankDetails?.ifscCode || companyProfile.bankDetails.ifscCode}</span></p>
                    {(quotation.bankDetails?.upiId || companyProfile.bankDetails.upiId) && <p><strong>UPI ID:</strong> <span className="font-mono font-semibold">{quotation.bankDetails?.upiId || companyProfile.bankDetails.upiId}</span></p>}
                  </div>

                  {/* Totals Summary */}
                  <div className="space-y-2.5 text-[13px] sv-text-muted pl-4 flex flex-col justify-center">
                    <div className="flex justify-between">
                      <span>Gross Subtotal</span>
                      <span className="font-mono font-semibold">₹{quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {quotation.discount > 0 && (
                      <div className="flex justify-between sv-text-red-600 font-semibold">
                        <span>Discount (-)</span>
                        <span className="font-mono">- ₹{quotation.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {quotation.isGstEnabled && (
                      <div className="flex justify-between">
                        <span>GST ({quotation.gstPercentage || 18}%)</span>
                        <span className="font-mono">₹{quotation.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t-2 sv-border-light flex justify-between items-center sv-text-primary">
                      <span className="font-black uppercase text-[13px]">Grand Total</span>
                      <strong className="text-[20px] font-serif font-black font-mono">
                        ₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Signatures */}
            <div>
              <div className="grid grid-cols-2 gap-12 items-end border-t border-dashed sv-border-light pt-8 text-[12px] mt-8">
                {/* Client acceptance signature */}
                <div>
                  <span className="text-[11px] font-bold sv-text-light uppercase tracking-widest block mb-2">Client Acceptance</span>
                  {status === 'APPROVED' ? (
                    <div className="pb-1">
                      {quotation.clientSignature ? (
                        <img src={quotation.clientSignature} alt="Client Signature" className="h-10 object-contain block" />
                      ) : (
                        <span className="font-signature text-3xl sv-text-emerald-800 transform -rotate-1 block leading-none">{quotation.clientName}</span>
                      )}
                      <span className="text-[11px] font-bold sv-text-emerald-600 uppercase tracking-wider block mt-1">Accepted Digital Contract</span>
                      {quotation.clientApprovedDate && (
                        <span className="text-[9px] text-stone-400 block mt-0.5">{quotation.clientApprovedDate}</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 flex items-end">
                      <div className="w-full border-b sv-border-dark"></div>
                    </div>
                  )}
                  <span className="text-[10px] font-bold sv-text-light block mt-2">Authorized Client Signature & Date</span>
                </div>

                {/* Company Authorized Signatory */}
                <div className="text-right flex flex-col items-end">
                  {companyProfile.signature ? (
                    <img src={companyProfile.signature} alt="Signature" className="h-12 object-contain mb-1" />
                  ) : (
                    <span className="font-signature text-3xl sv-text-primary transform -rotate-2 block leading-none mb-2">
                      {companyProfile.name}
                    </span>
                  )}
                  <div className="w-48 border-b sv-border-dark mb-1"></div>
                  <span className="text-[10px] font-bold sv-text-muted uppercase tracking-wider">Authorized Studio Signatory</span>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t sv-border-light pt-4 mt-8 flex justify-between items-center text-[12px] sv-text-light uppercase tracking-widest font-semibold">
                <span>Sarjapur Factory Direct</span>
                <span>Personalized Home Interiors</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
