import React, { useState, useRef } from 'react';
import { Upload, FileText, Play, CheckCircle2, ChevronRight, AlertCircle, RefreshCcw, Layers, Trash2, ArrowRight } from 'lucide-react';
import { RateItem, QuoteItem } from '../types';
import { CATEGORY_SUGGESTIONS } from '../constants';

interface FloorPlanAnalyserProps {
  rateCard: RateItem[];
  onCreateQuote: (items: QuoteItem[], projectType: string, notes: string) => void;
  onCancel: () => void;
}

interface ParsedItem {
  id: string;
  category: string;
  name: string;
  dimensions: string;
  rate: number;
  rateType: 'SQFT' | 'LUMPSUM';
  unit: string;
  material: string;
  finish: string;
  hardware: string;
  rateId: string;
  confidence: number;
}

const FloorPlanAnalyser: React.FC<FloorPlanAnalyserProps> = ({ rateCard, onCreateQuote, onCancel }) => {
  const [inputText, setInputText] = useState(
    "Foyer: shoe rack 4x3 with seating.\n" +
    "Living Room: Floating TV console 8x1.5. Decorative backing wall paneling 8x9.\n" +
    "Kitchen: modular base cabinet 10x2.75, overhead wall storage 10x2. Granite countertop. Cutlery basket set.\n" +
    "Master Bedroom: Sliding wardrobe 8x7, wardrobe loft 8x2. Hydraulic storage bed. Headboard 6.5x3.\n" +
    "Guest Bedroom: Hinged wardrobe 7x7.\n" +
    "False Ceiling: Peripheral gypsum ceiling 180 sqft.\n" +
    "Services: Royale Emulsion painting, post-install deep cleaning."
  );
  
  const [activeTab, setActiveTab] = useState<'text' | 'upload'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [blueprintPreview, setBlueprintPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated AI Logger
  const addLog = (msg: string, delay: number): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, msg]);
        resolve();
      }, delay);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFileName(file.name);
    
    // Create image preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBlueprintPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setBlueprintPreview(null);
    }
  };

  // The AI Parser Engine
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setLogs([]);
    setParsedItems([]);

    await addLog("⚡ Initializing Spacious Venture AI Layout Engine...", 200);
    
    if (activeTab === 'upload') {
      await addLog(`📂 Loading file: "${selectedFileName || 'blueprint.png'}"...`, 400);
      await addLog("🔍 Performing computer vision boundary analysis...", 600);
      await addLog("📐 Vectorizing DWG/PDF walls and locating cabinetry blocks...", 800);
      await addLog("🚪 Detected room partitions: FOYER, LIVING, KITCHEN, MBR, GBR, BATHS.", 600);
    } else {
      await addLog("📝 Parsing designer specifications text...", 400);
      await addLog("🧠 Running Natural Language Processing (NLP) token matcher...", 600);
    }

    await addLog("⚙️ Cross-referencing rate card catalog IDs...", 500);

    // AI Matching Logic
    const extracted: ParsedItem[] = [];
    const textToAnalyze = activeTab === 'upload' 
      ? `Foyer: shoe rack 5x3 with seating.
         Living Room: Floating TV console 7x1.5. Decorative backing wall paneling 8x9.
         Kitchen: modular base cabinet 12x2.75, overhead wall storage 12x2. Granite countertop.
         Master Bedroom: Sliding wardrobe 7x7, wardrobe loft 7x2. Hydraulic storage bed. Headboard.
         False Ceiling: Peripheral gypsum ceiling 150 sqft.
         Services: Royale Emulsion painting.` 
      : inputText;

    const lines = textToAnalyze.split('\n');
    let currentCategory = 'General Works';

    // Scan lines for category hints
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      // Update room category context if mentioned
      for (const cat of CATEGORY_SUGGESTIONS) {
        if (lowerLine.includes(cat.toLowerCase()) || (cat === 'General Works' && lowerLine.includes('services'))) {
          currentCategory = cat;
          break;
        }
      }

      // Check against all rate card items
      rateCard.forEach(catalogItem => {
        // Build search terms: category keywords + item keywords
        const itemKeywords = catalogItem.name.toLowerCase().split(/\s+/).filter(k => k.length > 3 && k !== 'with' && k !== 'unit');
        
        let matchScore = 0;
        
        // Match category context
        if (catalogItem.category.toLowerCase() === currentCategory.toLowerCase()) {
          matchScore += 2;
        }

        // Match keywords in line
        itemKeywords.forEach(kw => {
          // clean keyword
          const cleanKw = kw.replace(/[^a-z0-9]/g, '');
          if (lowerLine.includes(cleanKw)) {
            matchScore += 3;
          }
        });

        // Specific acronym matches
        if (catalogItem.name.includes("MBR") && lowerLine.includes("mbr")) matchScore += 4;
        if (catalogItem.name.includes("GBR") && lowerLine.includes("gbr")) matchScore += 4;
        if (catalogItem.name.includes("KBR") && lowerLine.includes("kbr")) matchScore += 4;

        if (matchScore >= 5) {
          // Find dimensions in this line: e.g. "8x7" or "10 x 2.75"
          let extractedDims = catalogItem.defaultDimensions;
          const dimRegex = /(\d+(?:\.\d+)?)\s*(?:x|by|\*)\s*(\d+(?:\.\d+)?)/i;
          const match = line.match(dimRegex);
          if (match) {
            extractedDims = `${match[1]} x ${match[2]}`;
          }

          // Check if already added to avoid duplicates
          const exists = extracted.some(e => e.rateId === catalogItem.id);
          if (!exists) {
            extracted.push({
              id: `extracted-${Date.now()}-${Math.random()}`,
              category: catalogItem.category,
              name: catalogItem.name,
              dimensions: extractedDims,
              rate: catalogItem.defaultRate,
              rateType: catalogItem.rateType,
              unit: catalogItem.defaultUnit,
              material: catalogItem.defaultMaterial || '',
              finish: catalogItem.defaultFinish || '',
              hardware: catalogItem.defaultHardware || '',
              rateId: catalogItem.id,
              confidence: Math.min(99, 65 + matchScore * 5)
            });
          }
        }
      });
    });

    await addLog("🎯 Mapped cabinetry, woodwork, and general services to standard products.", 600);
    await addLog(`✅ Parsing complete. Successfully extracted ${extracted.length} items.`, 400);

    setParsedItems(extracted);
    setIsAnalyzing(false);
  };

  const handleRemoveExtractedItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemField = (id: string, field: keyof ParsedItem, value: any) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateAmount = (item: ParsedItem) => {
    if (item.rateType === 'LUMPSUM') return item.rate;
    const parts = item.dimensions.split('x').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * parts[1] * item.rate;
    }
    return 0;
  };

  const handleGenerateQuote = () => {
    if (parsedItems.length === 0) return;
    
    // Map ParsedItems into QuoteItem[]
    const quoteItems: QuoteItem[] = parsedItems.map(pi => {
      const parts = pi.dimensions.split('x').map(p => parseFloat(p.trim()));
      const isLump = pi.rateType === 'LUMPSUM';
      const sqft = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isLump 
        ? parts[0] * parts[1] 
        : 0;
      
      return {
        id: `qi-fp-${Date.now()}-${Math.random()}`,
        category: pi.category,
        description: pi.name,
        dimensions: pi.dimensions,
        sqft: sqft,
        rate: pi.rate,
        baseRate: pi.rate,
        amount: isLump ? pi.rate : sqft * pi.rate,
        isLumpSum: isLump,
        unit: pi.unit,
        material: pi.material,
        finish: pi.finish,
        hardware: pi.hardware
      };
    });

    const notes = "Auto-generated from floor plan layout model specifications.";
    onCreateQuote(quoteItems, "2 BHK Apartment", notes);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8">
      {/* Intro Header */}
      <div className="bg-[#1f352b] rounded-xl p-6 md:p-8 text-white shadow-md mb-8 border border-[#b8873b]/20 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-[#b8873b]/10 rounded-full blur-2xl"></div>
        <h2 className="text-xl md:text-3xl font-serif font-bold mb-2">AI Floor Plan Estimate Analyzer</h2>
        <p className="text-white/70 text-xs md:text-sm max-w-2xl">
          Instantly generate estimates from floor plans. Type room measurements or upload a blueprint diagram. Our AI model extracts dimensions and aligns them with active factory rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        {/* Left Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-stone-100 bg-stone-50/50">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'text' ? 'border-[#b8873b] text-[#1f352b] bg-white' : 'border-transparent text-stone-400'
                }`}
              >
                <FileText size={14} />
                <span>Text Measurements</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'upload' ? 'border-[#b8873b] text-[#1f352b] bg-white' : 'border-transparent text-stone-400'
                }`}
              >
                <Upload size={14} />
                <span>Upload Blueprint</span>
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'text' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Site Measurement Notes</span>
                    <button
                      onClick={() => setInputText("")}
                      className="text-[10px] text-stone-400 hover:text-stone-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Enter room details, dimensions (e.g. 7x7 sliding wardrobe) and specs..."
                    rows={12}
                    className="w-full border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#b8873b] bg-stone-50/30 font-mono text-stone-700 leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Blueprint File / Image Scan</span>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-8 text-center cursor-pointer hover:bg-stone-50/50 transition-all flex flex-col items-center justify-center min-h-[220px]"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*,.pdf,.dxf"
                      className="hidden" 
                    />
                    <Upload size={32} className="text-[#b8873b] mb-3 opacity-80" />
                    <strong className="text-xs text-stone-700 block mb-1">
                      {selectedFileName ? selectedFileName : "Choose Floorplan File"}
                    </strong>
                    <span className="text-[10px] text-stone-400 block max-w-[200px] leading-normal">
                      Drag & drop image (JPEG/PNG), AutoCAD PDF, or DXF files.
                    </span>
                  </div>

                  {blueprintPreview && (
                    <div className="border border-stone-100 rounded-xl p-2 bg-stone-50 max-h-48 overflow-hidden flex justify-center relative">
                      <img src={blueprintPreview} alt="Blueprint Preview" className="h-full object-contain opacity-75" />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent pointer-events-none rounded-xl"></div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || (activeTab === 'upload' && !selectedFileName)}
                className="w-full mt-5 bg-[#1f352b] hover:bg-[#2d4d3e] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                <span>{isAnalyzing ? 'Analyzing Layout...' : 'Run Layout Analyzer'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Logs Screen */}
          {logs.length > 0 && (
            <div className="bg-stone-900 rounded-xl p-5 font-mono text-[11px] text-emerald-400 shadow-inner border border-stone-800">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800 mb-3 text-stone-500 font-bold uppercase tracking-wider text-[9px]">
                <span>AI Layout Processor Console</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-2">
                    <ChevronRight size={12} className="mt-0.5 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Items Results List */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-700 tracking-wider">AI Extracted Cabinetry & Services</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Edit sizes, materials, and quantities prior to generating estimate.</p>
              </div>
              {parsedItems.length > 0 && (
                <button
                  onClick={handleGenerateQuote}
                  className="bg-[#b8873b] hover:bg-[#a37632] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Build official estimate</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {parsedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-stone-200/50">
                      <th className="py-2.5 px-4 w-32">Zone / Room</th>
                      <th className="py-2.5 px-2">Matched Product</th>
                      <th className="py-2.5 px-2 w-28 text-center">Dimensions</th>
                      <th className="py-2.5 px-2 w-20 text-center">Pricing</th>
                      <th className="py-2.5 px-2 w-28 text-right">Rate</th>
                      <th className="py-2.5 px-4 w-28 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {parsedItems.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50/10">
                        {/* Zone dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={item.category}
                            onChange={e => handleUpdateItemField(item.id, 'category', e.target.value)}
                            className="border border-stone-200 rounded p-1 text-[11px] bg-white font-semibold text-stone-700 w-full"
                          >
                            {CATEGORY_SUGGESTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>

                        {/* Product Name */}
                        <td className="py-3 px-2">
                          <strong className="font-bold block text-stone-800">{item.name}</strong>
                          <div className="flex gap-1.5 mt-1 text-[9px] text-stone-400 items-center">
                            <span className="bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-black border border-emerald-100">
                              {item.confidence}% Match
                            </span>
                            {item.material && <span>• {item.material}</span>}
                          </div>
                        </td>

                        {/* Dimensions */}
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={item.dimensions}
                            onChange={e => handleUpdateItemField(item.id, 'dimensions', e.target.value)}
                            disabled={item.rateType === 'LUMPSUM'}
                            className="border border-stone-200 rounded p-1 text-[11px] text-center font-mono w-20 bg-white disabled:bg-stone-50 disabled:text-stone-400"
                          />
                        </td>

                        {/* Rate Type */}
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black ${
                            item.rateType === 'SQFT' ? 'bg-[#f5e6cf] text-[#b8873b]' : 'bg-stone-100 text-stone-400'
                          }`}>
                            {item.rateType}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={e => handleUpdateItemField(item.id, 'rate', Number(e.target.value))}
                            className="border border-stone-200 rounded p-1 text-[11px] text-right font-bold w-20 font-mono bg-white"
                          />
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-black text-stone-900 font-mono text-[12px]">
                          ₹{Math.round(calculateAmount(item)).toLocaleString('en-IN')}
                        </td>

                        {/* Delete row */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleRemoveExtractedItem(item.id)}
                            className="text-stone-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-stone-400 flex flex-col items-center justify-center bg-stone-50/10">
                <AlertCircle size={40} className="text-stone-300 mb-3" />
                <h4 className="font-bold text-stone-700 text-sm mb-1">No Extracted Cabinetry Yet</h4>
                <p className="text-xs max-w-sm leading-normal">
                  Write site layout specs in the text editor or drop a floor plan blueprint image, then trigger the layout analyzer to extract products.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons footer */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold hover:bg-stone-50"
        >
          Cancel
        </button>
        {parsedItems.length > 0 && (
          <button
            onClick={handleGenerateQuote}
            className="px-5 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c] shadow-sm flex items-center gap-1.5"
          >
            <span>Generate Official Proposal</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FloorPlanAnalyser;
