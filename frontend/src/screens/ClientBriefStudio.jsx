import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { 
  FileText, Save, Download, Plus, Trash2, LayoutGrid, 
  Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Upload, X, HelpCircle
} from 'lucide-react';

const stylePresets = [
  { id: 'modern-luxury', title: 'Modern Luxury', desc: 'Bold marble, metal trims, dramatic lighting, and sleek custom paneling.', icon: '✨' },
  { id: 'bohemian-chic', title: 'Boho Chic', desc: 'Warm textures, natural wicker/rattan elements, rich plants, and earthy palettes.', icon: '🌿' },
  { id: 'scandinavian-minimal', title: 'Scandi Minimal', desc: 'Clean geometric lines, light oak woods, matte finishes, and maximizing natural light.', icon: '📐' },
  { id: 'indian-contemporary', title: 'Indian Contemporary', desc: 'Rich hand-carved jali patterns, brass accents, warm teak wood, and vibrant block-colors.', icon: '🕉️' },
  { id: 'japandi-fusion', title: 'Japandi Fusion', desc: 'Japanese minimalism meets Scandinavian warmth—natural light oak, off-white sand textures.', icon: '🌸' },
  { id: 'industrial-rustic', title: 'Industrial Rustic', desc: 'Exposed dark brick, rugged matte black steel, distressed timber, and warm Edison bulbs.', icon: '⚙️' }
];

export default function ClientBriefStudio({ projectId, onBriefSaved }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  
  // Structured Brief State
  const [brief, setBrief] = useState({
    lifestyle: 'standard',
    cookingHabits: 'regular',
    vastuPreferences: 'none',
    primaryStyle: 'modern-luxury',
    bhkConfig: '3bhk',
    ceilingHeight: '3000mm',
    materialTier: 'gold-bwp',
    kitchenLayout: 'l-shaped',
    purifierSetup: 'under-sink',
    pantrySystem: 'hettich-larder',
    poojaPreference: 'dedicated',
    gasSetup: 'hob-piped',
    partitionStyle: 'cnc-jali',
    vastuStrictness: 'general',
    shutterFinish: 'acrylic',
    vastuCompliant: true,
    lightingPreference: 'warm-ambient',
    hasLofts: true,
    chimneyVentRoute: 'external',
    notes: '',
    floorplanImageUrl: '',
    
    // Checklist arrays
    familyProfile: [], // 'kids', 'elderly', 'pets'
    selectedSpaces: ['living', 'kitchen', 'masterBed'], // 'living', 'kitchen', 'masterBed', 'kidsBed', 'pooja', 'foyer'
    appliances: ['otg', 'fridge'], // 'otg', 'dishwasher', 'fridge', 'utility'
    fittings: ['tandem', 'pullout'], // 'tandem', 'pullout', 'corner', 'trouser', 'safe', 'bench'
    
    // Room custom specifications
    rooms: [
      { name: 'Modular Kitchen', type: 'kitchen', finishes: ['acrylic'], orientation: 'SE' },
      { name: 'Master Suite', type: 'masterBed', finishes: ['matte-laminate'], orientation: 'SW' },
      { name: 'Grand Living Area', type: 'living', finishes: ['veneer'], orientation: 'E' }
    ]
  });

  useEffect(() => {
    if (projectId) {
      fetchBrief();
    }
  }, [projectId]);

  const fetchBrief = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      const data = await res.json();
      if (data.client_brief_json) {
        const loadedBrief = JSON.parse(data.client_brief_json);
        // Ensure defaults for arrays
        setBrief(prev => ({
          ...prev,
          ...loadedBrief,
          familyProfile: loadedBrief.familyProfile || [],
          selectedSpaces: loadedBrief.selectedSpaces || ['living', 'kitchen', 'masterBed'],
          appliances: loadedBrief.appliances || [],
          fittings: loadedBrief.fittings || [],
          rooms: loadedBrief.rooms || []
        }));
      }
    } catch (err) {
      console.error("Error loading project brief:", err);
    }
  };

  useEffect(() => {
    const defaultRooms = {
      living: { name: 'Grand Living Area', type: 'living', finishes: ['veneer'], orientation: 'E' },
      kitchen: { name: 'Modular Kitchen', type: 'kitchen', finishes: ['acrylic'], orientation: 'SE' },
      masterBed: { name: 'Master Suite', type: 'masterBed', finishes: ['matte-laminate'], orientation: 'SW' },
      kidsBed: { name: 'Kids Bedroom', type: 'kidsBed', finishes: ['matte-laminate'], orientation: 'NW' },
      pooja: { name: 'Pooja Room', type: 'pooja', finishes: ['veneer'], orientation: 'NE' },
      foyer: { name: 'Foyer Entrance', type: 'foyer', finishes: ['acrylic'], orientation: 'N' }
    };

    setBrief(prev => {
      const updatedRooms = (prev.selectedSpaces || []).map(spaceId => {
        const existing = (prev.rooms || []).find(r => r.type === spaceId);
        if (existing) return existing;
        return defaultRooms[spaceId] || { name: `${spaceId.charAt(0).toUpperCase() + spaceId.slice(1)} Space`, type: spaceId, finishes: [], orientation: 'NE' };
      });

      const currentTypes = (prev.rooms || []).map(r => r.type).join(',');
      const nextTypes = updatedRooms.map(r => r.type).join(',');
      if (currentTypes === nextTypes) return prev;

      return { ...prev, rooms: updatedRooms };
    });
  }, [brief.selectedSpaces]);

  const saveBrief = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefData: brief, currentStep: 'cad' })
      });
      const data = await res.json();
      if (data.success) {
        alert("Onboarding brief specifications compiled successfully!");
        if (onBriefSaved) onBriefSaved();
      }
    } catch (err) {
      console.error("Error saving brief:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('floorplan', file);

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/floorplan`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setBrief(prev => ({ ...prev, floorplanImageUrl: data.floorplanUrl }));
      }
    } catch (err) {
      console.error("Error uploading floorplan:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStyleRefsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('styleReferences', file));

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/style-references`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.urls) {
        setBrief(prev => ({
          ...prev,
          styleReferences: [...(prev.styleReferences || []), ...data.urls]
        }));
      }
    } catch (err) {
      console.error("Error uploading style references:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveStyleRef = (urlToRemove) => {
    setBrief(prev => ({
      ...prev,
      styleReferences: (prev.styleReferences || []).filter(url => url !== urlToRemove)
    }));
  };

  const toggleCheckbox = (field, value) => {
    setBrief(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const addRoom = () => {
    setBrief(prev => ({
      ...prev,
      rooms: [...prev.rooms, { name: 'New Room Space', type: 'other', finishes: [], orientation: 'NE' }]
    }));
  };

  const removeRoom = (idx) => {
    setBrief(prev => {
      const updated = [...prev.rooms];
      updated.splice(idx, 1);
      return { ...prev, rooms: updated };
    });
  };

  const updateRoomField = (idx, field, value) => {
    setBrief(prev => {
      const updated = [...prev.rooms];
      updated[idx][field] = value;
      return { ...prev, rooms: updated };
    });
  };

  const loadDemoBrief = () => {
    setBrief(prev => ({
      ...prev,
      lifestyle: 'family_with_kids',
      cookingHabits: 'heavy_indian',
      vastuPreferences: 'south_west_master',
      bhkConfig: '3bhk',
      ceilingHeight: '3000mm',
      materialTier: 'gold-bwp',
      kitchenLayout: 'l-shaped',
      purifierSetup: 'under-sink',
      pantrySystem: 'hettich-larder',
      poojaPreference: 'dedicated',
      gasSetup: 'hob-piped',
      partitionStyle: 'cnc-jali',
      vastuStrictness: 'general',
      shutterFinish: 'acrylic',
      lightingPreference: 'warm-ambient',
      hasLofts: true,
      chimneyVentRoute: 'external',
      notes: "We want a serene, warm residential look for our 3 BHK apartment. Require a concealed under-sink water purifier in modular kitchen, Hettich soft-close modular pantry system, a hidden biometric safe built into the master suite sliding wardrobe base, and an entry console featuring cushioned foyer shoe seating.",
      familyProfile: ['kids', 'elderly'],
      selectedSpaces: ['living', 'kitchen', 'masterBed', 'pooja', 'foyer'],
      appliances: ['otg', 'fridge', 'dishwasher'],
      fittings: ['tandem', 'pullout', 'corner', 'safe', 'bench'],
      rooms: [
        { name: 'Modular Kitchen', type: 'kitchen', finishes: ['acrylic'], orientation: 'SE' },
        { name: 'Master Suite', type: 'masterBed', finishes: ['matte_woodgrain'], orientation: 'SW' },
        { name: 'Grand Living Area', type: 'living', finishes: ['veneer'], orientation: 'E' },
        { name: 'Dedicated Pooja', type: 'pooja', finishes: ['veneer'], orientation: 'NE' },
        { name: 'Entry Foyer', type: 'foyer', finishes: ['acrylic'], orientation: 'N' }
      ]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 1: Contact Details & BHK Config</h3>
              <button 
                type="button" 
                onClick={loadDemoBrief}
                className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold px-2 py-1 rounded hover:bg-[#D4AF37]/20 transition flex items-center gap-1"
              >
                ⚡ Load Demo Client
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Home/Office Layout Configuration</label>
                <select 
                  value={brief.bhkConfig}
                  onChange={(e) => setBrief(prev => ({ ...prev, bhkConfig: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="1bhk">1 BHK Apartment</option>
                  <option value="2bhk">2 BHK Apartment</option>
                  <option value="3bhk">3 BHK Apartment</option>
                  <option value="villa">Luxury Villa / Duplex</option>
                  <option value="office">Commercial Office Space</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Clear Ceiling Height</label>
                <select 
                  value={brief.ceilingHeight}
                  onChange={(e) => setBrief(prev => ({ ...prev, ceilingHeight: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="2900mm">Standard Residential (2900mm / 9.5 ft)</option>
                  <option value="3000mm">Premium Residential (3000mm / 10 ft)</option>
                  <option value="3300mm">Double Height / Villa (3300mm / 11 ft)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Material Core Plywood Tier</label>
                <select 
                  value={brief.materialTier}
                  onChange={(e) => setBrief(prev => ({ ...prev, materialTier: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="gold-bwp">Gold Class (IS 710 BWP Marine Grade - 100% Waterproof carcass everywhere)</option>
                  <option value="silver-bwr">Silver Class (BWP wet carcass + BWR dry areas carcass)</option>
                  <option value="bronze-hdmr">Bronze Class (HDMR board core + moisture resistant backing)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Lifestyle Segment</label>
                <select 
                  value={brief.lifestyle}
                  onChange={(e) => setBrief(prev => ({ ...prev, lifestyle: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="standard">Standard Couple</option>
                  <option value="family_with_kids">Family with Kids</option>
                  <option value="bachelor_hub">Bachelor / Studio Hub</option>
                  <option value="multi_generational">Multi-Generational Family</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 2: Spatial Profile & Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Cooking & Kitchen Style</label>
                <select 
                  value={brief.cookingHabits}
                  onChange={(e) => setBrief(prev => ({ ...prev, cookingHabits: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="regular">Regular Home Cooking</option>
                  <option value="heavy_indian">Traditional Indian (Heavy frying / High-suction chimney required)</option>
                  <option value="continental_light">Continental / Light Baking</option>
                  <option value="none">Extremely Minimal / Order-In</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Modular Kitchen Layout Style</label>
                <select 
                  value={brief.kitchenLayout}
                  onChange={(e) => setBrief(prev => ({ ...prev, kitchenLayout: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="l-shaped">L-Shaped Layout (Optimal corner workspace)</option>
                  <option value="parallel">Parallel Counter Layout (Chef dual-zone efficiency)</option>
                  <option value="u-shaped">U-Shaped Layout (Maximum counters & storage)</option>
                  <option value="straight">Straight Counter (Compact / Space-saver)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Water Purifier Setup</label>
                <select 
                  value={brief.purifierSetup}
                  onChange={(e) => setBrief(prev => ({ ...prev, purifierSetup: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="under-sink">Under-Sink RO (Concealed premium utility carcass)</option>
                  <option value="wall-mount">Wall-Mounted RO (Standard cabinet casing)</option>
                  <option value="external-inlet">Utility Area / External wall mount</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Modular Pantry System</label>
                <select 
                  value={brief.pantrySystem}
                  onChange={(e) => setBrief(prev => ({ ...prev, pantrySystem: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="hettich-larder">6-Tier Hettich Soft-Close Larder Pull-out</option>
                  <option value="wire-baskets">Stainless Steel Modular Wire Pantry Baskets</option>
                  <option value="wooden-matrix">Solid Wood Premium Shelving Matrix</option>
                  <option value="none">No dedicated pantry unit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Pooja Mandir Integration</label>
                <select 
                  value={brief.poojaPreference}
                  onChange={(e) => setBrief(prev => ({ ...prev, poojaPreference: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="dedicated">Dedicated Pooja Room (Teak CNC Jali doors)</option>
                  <option value="integrated-tv">Integrated Pooja Niche (Inside living room TV wall)</option>
                  <option value="wall-hung">Wall-Mounted Mandir Panel</option>
                  <option value="none">No Pooja Space Required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Living Area Partition Divider</label>
                <select 
                  value={brief.partitionStyle}
                  onChange={(e) => setBrief(prev => ({ ...prev, partitionStyle: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="cnc-jali">CNC Carved Wooden Screen</option>
                  <option value="gold-metal">Brushed Gold Metal Partition Grid</option>
                  <option value="timber-rafters">Louvered Teak Wood Rafters</option>
                  <option value="none">No Divider Screen Required</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-semibold block">Family Profile Factors</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kids', label: 'Toddlers/Kids (Rounded edges)' },
                  { id: 'elderly', label: 'Elderly (Slip-resistant floors)' },
                  { id: 'pets', label: 'Pets (Scratch-proof laminates)' }
                ].map(factor => {
                  const isChecked = brief.familyProfile.includes(factor.id);
                  return (
                    <button
                      key={factor.id}
                      onClick={() => toggleCheckbox('familyProfile', factor.id)}
                      className={`p-3 rounded-lg border text-center transition font-semibold ${
                        isChecked 
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {factor.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 3: Style & Work Scope</h3>
            
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-semibold block">Select Primary Aesthetic Direction</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stylePresets.map(preset => {
                  const isSelected = brief.primaryStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setBrief(prev => ({ ...prev, primaryStyle: preset.id }))}
                      className={`p-3 rounded-xl border text-left transition space-y-1.5 flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-slate-100 shadow-lg' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg">{preset.icon}</span>
                        {isSelected && <span className="text-[10px] bg-[#D4AF37] text-slate-950 px-1.5 py-0.5 rounded font-bold">Selected</span>}
                      </div>
                      <div>
                        <strong className="text-xs block text-slate-200">{preset.title}</strong>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-semibold block">Select Spaces to Design</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: 'living', label: 'Living Room', icon: '🛋️' },
                  { id: 'kitchen', label: 'Modular Kitchen', icon: '🍳' },
                  { id: 'masterBed', label: 'Master Suite', icon: '👑' },
                  { id: 'kidsBed', label: 'Kids Bedroom', icon: '🧸' },
                  { id: 'pooja', label: 'Pooja Mandir', icon: '🙏' },
                  { id: 'foyer', label: 'Foyer Entrance', icon: '👞' }
                ].map(space => {
                  const isSelected = brief.selectedSpaces.includes(space.id);
                  return (
                    <button
                      key={space.id}
                      onClick={() => toggleCheckbox('selectedSpaces', space.id)}
                      className={`p-3 rounded-lg border text-center transition flex flex-col items-center gap-1.5 font-semibold ${
                        isSelected 
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{space.icon}</span>
                      <span className="text-[10px]">{space.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 4: Floor Plan Underlay & Reference Uploads</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Floor Plan Upload */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                <label className="text-slate-400 text-xs font-semibold block">Import Architectural Floorplan (IMAGEATTACH)</label>
                
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-slate-700 transition relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-500" />
                  <span className="text-xs text-slate-300 font-bold">Upload blueprint file</span>
                  <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</span>
                </div>

                {isUploading && <span className="text-[10px] text-[#D4AF37] animate-pulse block">Processing underlay upload...</span>}
                
                {brief.floorplanImageUrl && (
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Floorplan attached successfully
                    </span>
                    <button 
                      onClick={() => setBrief(prev => ({ ...prev, floorplanImageUrl: '' }))}
                      className="text-red-400 hover:bg-slate-850 p-1 rounded ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Core Text Requirements */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-400 font-semibold block">Client Core Architectural & Spatial Requirements *</label>
                <textarea 
                  value={brief.notes}
                  onChange={(e) => setBrief(prev => ({ ...prev, notes: e.target.value }))}
                  rows="6"
                  placeholder="Enter mandatory structural notes, reading nooks, lighting constraints, or specific appliances placement details..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 outline-none focus:border-[#D4AF37] resize-none"
                  required
                />
              </div>
            </div>

            {/* Style references dropzone */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <label className="text-slate-400 text-xs font-semibold block">Style Inspiration References & Pinterest Moodboards</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-slate-700 transition relative h-28">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleStyleRefsUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-slate-500" />
                  <span className="text-[10px] text-slate-300 font-bold">Upload reference photos</span>
                  <span className="text-[8px] text-slate-500">Supports multiple JPG, PNG</span>
                </div>

                <div className="md:col-span-2 grid grid-cols-4 gap-2 min-h-28 border border-slate-800 rounded-xl p-2.5 bg-slate-900/50 overflow-y-auto">
                  {(brief.styleReferences || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-video border border-slate-800 rounded overflow-hidden group">
                      <img src={`http://127.0.0.1:5055${url}`} alt="Pinterest reference" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => handleRemoveStyleRef(url)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!brief.styleReferences || brief.styleReferences.length === 0) && (
                    <div className="col-span-4 flex items-center justify-center text-[10px] text-slate-500 italic">
                      No style reference images uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 5: Standards & Vastu Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Vastu Strictness Level</label>
                <select 
                  value={brief.vastuStrictness}
                  onChange={(e) => setBrief(prev => ({ ...prev, vastuStrictness: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="strict">Strict Adherence (Exact orientations mandatory)</option>
                  <option value="general">General Guidelines (Basic balance advice)</option>
                  <option value="minimal">Minimal / Modern Layout focus</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Lighting Mood Preference</label>
                <select 
                  value={brief.lightingPreference}
                  onChange={(e) => setBrief(prev => ({ ...prev, lightingPreference: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="warm-ambient">Warm Ambient (3000K Warm white / COB strip loops)</option>
                  <option value="cool-task">Cool Task (4000K Natural white / direct downlights)</option>
                  <option value="smart-dimmable">Dimmable Automation (Integrated smart scene loops)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Kitchen Chimney Ducting Route</label>
                <select 
                  value={brief.chimneyVentRoute}
                  onChange={(e) => setBrief(prev => ({ ...prev, chimneyVentRoute: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="external">Direct External Venting (High suction)</option>
                  <option value="recirculating">Recirculating Carbon Filter (No ducting)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Wardrobe Shutter Core Finish</label>
                <select 
                  value={brief.shutterFinish}
                  onChange={(e) => setBrief(prev => ({ ...prev, shutterFinish: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-[#D4AF37] outline-none"
                >
                  <option value="acrylic">1.5mm High-Gloss Specular Acrylic (Mirror reflection)</option>
                  <option value="matte-laminate">Super-Matte Anti-Fingerprint Velvet Laminate</option>
                  <option value="pu-veneer">Wire-Brushed Natural Teak PU Veneer Coating</option>
                  <option value="smoked-glass">Smoked Tinted Glass with Black Profile framing</option>
                </select>
              </div>

              <div className="space-y-1.5 flex items-center justify-between bg-slate-950/40 border border-slate-850 p-3 rounded-lg">
                <div>
                  <span className="font-semibold text-slate-300 block">Vastu Shastra Compliance</span>
                  <span className="text-[10px] text-slate-500">Enable direction-based checking</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={brief.vastuCompliant}
                  onChange={(e) => setBrief(prev => ({ ...prev, vastuCompliant: e.target.checked }))}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5 flex items-center justify-between bg-slate-950/40 border border-slate-850 p-3 rounded-lg">
                <div>
                  <span className="font-semibold text-slate-300 block">Overhead Modular Lofts</span>
                  <span className="text-[10px] text-slate-500">Maximize ceiling storage</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={brief.hasLofts}
                  onChange={(e) => setBrief(prev => ({ ...prev, hasLofts: e.target.checked }))}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
              </div>
            </div>

            {/* Checklists for Appliances and Fittings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-2 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                <span className="font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5">Appliances Profile</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'otg', label: 'OTG Tall Unit' },
                    { id: 'dishwasher', label: 'Dishwasher Cavity' },
                    { id: 'fridge', label: 'Double-Door Fridge' },
                    { id: 'utility', label: 'Washing Machine Hookup' }
                  ].map(app => (
                    <label key={app.id} className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={brief.appliances.includes(app.id)}
                        onChange={() => toggleCheckbox('appliances', app.id)}
                        className="w-3.5 h-3.5 accent-[#D4AF37]"
                      />
                      {app.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                <span className="font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5">Fittings & Accessories</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'tandem', label: 'Soft-Close Tandems' },
                    { id: 'pullout', label: 'Bottle Pull-out (150mm)' },
                    { id: 'corner', label: 'Corner Magic Carousel' },
                    { id: 'trouser', label: 'Trouser/Saree Pullout' },
                    { id: 'safe', label: 'Concealed Safe' },
                    { id: 'bench', label: 'Foyer Shoe Bench Ledge' }
                  ].map(fit => (
                    <label key={fit.id} className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={brief.fittings.includes(fit.id)}
                        onChange={() => toggleCheckbox('fittings', fit.id)}
                        className="w-3.5 h-3.5 accent-[#D4AF37]"
                      />
                      {fit.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 6: Room Customizations & Vastu Directions</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
              Verify design details and Vastu orientations for each selected space. These dictate the Vastu compliance report card and 3D specifications.
            </p>
            
            <div className="space-y-3.5 max-h-[42vh] overflow-y-auto pr-1">
              {brief.rooms.map((room, idx) => (
                <div key={room.type || idx} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      Space #{idx + 1}: {room.type.toUpperCase()}
                    </span>
                    <button 
                      type="button"
                      onClick={() => removeRoom(idx)} 
                      className="text-red-400 hover:text-red-300 transition text-[10px] flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold block text-[10px] uppercase">Custom Room Name</label>
                      <input 
                        type="text" 
                        value={room.name} 
                        onChange={(e) => updateRoomField(idx, 'name', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold block text-[10px] uppercase">Vastu Orientation</label>
                      <select 
                        value={room.orientation || 'NE'} 
                        onChange={(e) => updateRoomField(idx, 'orientation', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-[#D4AF37] outline-none"
                      >
                        <option value="N">North (N)</option>
                        <option value="NE">North-East (NE)</option>
                        <option value="E">East (E)</option>
                        <option value="SE">South-East (SE)</option>
                        <option value="S">South (S)</option>
                        <option value="SW">South-West (SW)</option>
                        <option value="W">West (W)</option>
                        <option value="NW">North-West (NW)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold block text-[10px] uppercase">Primary Finish</label>
                      <select 
                        value={room.finishes?.[0] || 'acrylic'} 
                        onChange={(e) => updateRoomField(idx, 'finishes', [e.target.value])} 
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-[#D4AF37] outline-none"
                      >
                        <option value="acrylic">1.5mm High-Gloss Acrylic</option>
                        <option value="matte-laminate">Super-Matte Laminate</option>
                        <option value="veneer">Natural Teak PU Veneer</option>
                        <option value="smoked-glass">Smoked Glass Profile</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {brief.rooms.length === 0 && (
                <div className="text-center text-slate-500 py-6 font-semibold">
                  No spaces selected. Go back to Step 3 and select spaces to design.
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={addRoom} 
              className="border border-dashed border-slate-800 hover:border-[#D4AF37] text-slate-400 hover:text-[#D4AF37] w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Custom Space
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto h-full max-h-screen pb-24 select-none">
      
      {/* 1. Client Onboarding Wizard steps (Left column) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[50vh]">
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
              <LayoutGrid className="w-4.5 h-4.5 text-[#D4AF37]" />
              Client Intake & Onboarding Studio
            </h2>
            <span className="text-[10px] font-bold font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded">
              Step {currentStep} of 6
            </span>
          </div>

          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#D4AF37] h-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
            ></div>
          </div>

          <div className="py-2">
            {renderStepContent()}
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-800 pt-4 mt-6">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition ${
              currentStep === 1 
                ? 'bg-slate-950 text-slate-600 cursor-not-allowed' 
                : 'bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 text-xs font-extrabold uppercase rounded-lg flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/15 hover:brightness-110 transition"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={saveBrief}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold uppercase rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 hover:brightness-110 transition"
            >
              Compile & Save Brief
              <Sparkles className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Unified specs overview summary (Right column) */}
      <div className="space-y-6">
        {/* Actions panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" /> Output Deliverables
          </h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Generate and export the formal design brief contract for client signature approval.
          </p>
          <div className="space-y-2">
            <button 
              onClick={saveBrief}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              Compile Specifications
            </button>
            <button 
              onClick={() => window.open(`${API_BASE}/projects/${projectId}/brief/pdf`, '_blank')}
              className="w-full py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              Export Design Brief PDF
            </button>
          </div>
        </div>

        {/* Onboarding specs quick highlights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5 text-xs">
          <h3 className="font-extrabold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Onboarding Checklist</h3>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Plywood Core Material</span>
              <strong className="text-slate-200 font-semibold">{brief.materialTier === 'gold-bwp' ? 'IS 710 BWP Class' : brief.materialTier === 'silver-bwr' ? 'IS 303 BWR Class' : 'HDMR Core'}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Vastu Strictness</span>
              <strong className="text-slate-200 font-semibold uppercase">{brief.vastuStrictness}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Lighting Moods</span>
              <strong className="text-slate-200 font-semibold">{brief.lightingPreference === 'warm-ambient' ? 'Warm White COB' : brief.lightingPreference === 'cool-task' ? 'Natural White' : 'Dimmable Smart'}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Floorplan Attachment</span>
              <strong className={brief.floorplanImageUrl ? "text-emerald-400" : "text-amber-400"}>
                {brief.floorplanImageUrl ? 'IMAGEATTACH Loaded' : 'No Image Loaded'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Design spaces count</span>
              <strong className="text-slate-200 font-semibold">{brief.selectedSpaces.length} Zones</strong>
            </div>
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-3 rounded-lg text-[10px] text-slate-400 leading-relaxed">
            * Saving the brief automatically compiles the layout parameters and loads the floorplan underlay background in the 2D CAD canvas.
          </div>
        </div>
      </div>

    </div>
  );
}
