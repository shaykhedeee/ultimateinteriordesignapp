import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Settings2, 
  Layers, 
  Zap, 
  Droplets
} from 'lucide-react';

export const ParametricStudio: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'kitchen' | 'wardrobe' | 'bathroom' | 'ceiling' | 'custom-cnc'>('kitchen');
  
  // Kitchen state
  const [kitchenLayout, setKitchenLayout] = useState<'L-Shaped' | 'U-Shaped' | 'Parallel' | 'Island' | 'G-Shaped'>('Island');
  const [counterMaterial, setCounterMaterial] = useState('Calacatta Gold Quartz');
  const [cabinetFinish, setCabinetFinish] = useState('Matte Anthracite Lacquer');
  const [backsplash, setBacksplash] = useState('White Chevron Mosaic');
  
  // Wardrobe state
  const [wardrobeType, setWardrobeType] = useState<'Walk-in' | 'Sliding' | 'Hinged'>('Walk-in');
  const [internalLighting, setInternalLighting] = useState(true);

  // False Ceiling state
  const [ceilingProfile, setCeilingProfile] = useState<'Cove' | 'Tray' | 'Coffered' | 'Floating'>('Floating');

  const getWorkTriangleScore = () => {
    if (kitchenLayout === 'Island' || kitchenLayout === 'L-Shaped') return 96;
    if (kitchenLayout === 'U-Shaped') return 94;
    return 89;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 text-slate-100 select-none">
      {/* Module Selector Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-extrabold tracking-tight">PARAMETRIC DESIGN ENGINE</h2>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'kitchen', label: '🍳 Modular Kitchen' },
            { id: 'wardrobe', label: '👔 Wardrobes & Closets' },
            { id: 'bathroom', label: '🛁 Bathrooms & Wet Zones' },
            { id: 'ceiling', label: '💡 False Ceilings' },
            { id: 'custom-cnc', label: '🪚 Custom CNC Furniture' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeModule === m.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module Content */}
      {activeModule === 'kitchen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configurator Controls */}
          <div className="glass-panel p-6 rounded-3xl space-y-6 lg:col-span-1">
            <h3 className="font-bold text-base text-slate-100 flex items-center justify-between">
              <span>Parametric Kitchen Rules</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                Work Triangle Score: {getWorkTriangleScore()}%
              </span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-mono font-semibold block mb-1.5">Auto-Detect Kitchen Shape:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['L-Shaped', 'U-Shaped', 'Parallel', 'Island', 'G-Shaped'] as const).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setKitchenLayout(shape)}
                      className={`px-3 py-2 rounded-xl font-medium transition ${
                        kitchenLayout === shape ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono font-semibold block mb-1.5">Countertop Material + Edge Profile:</label>
                <select 
                  value={counterMaterial}
                  onChange={(e) => setCounterMaterial(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option>Calacatta Gold Quartz</option>
                  <option>Carrara White Marble</option>
                  <option>Matte Black Granitex</option>
                  <option>Neolith Sintered Stone</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-mono font-semibold block mb-1.5">Cabinet Configurator Finish:</label>
                <select 
                  value={cabinetFinish}
                  onChange={(e) => setCabinetFinish(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option>Matte Anthracite Lacquer</option>
                  <option>Warm Fluted European Oak</option>
                  <option>Soft Cashmere Acrylic</option>
                  <option>Brushed Champagne Aluminium</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-mono font-semibold block mb-1.5">Backsplash Pattern Generator:</label>
                <select 
                  value={backsplash}
                  onChange={(e) => setBacksplash(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option>White Chevron Mosaic</option>
                  <option>Green Subway Tile (Herringbone)</option>
                  <option>Continuous Calacatta Slab</option>
                  <option>Hexagonal Matte Pewter</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px] text-slate-300 font-mono">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-blue-400"><Droplets className="w-3.5 h-3.5" /> Plumbing Points:</span>
                  <span>Auto-planned (Under sink)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-400"><Zap className="w-3.5 h-3.5" /> MEP Sockets:</span>
                  <span>6x 16A Dedicated points</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => alert("Parametric Kitchen Config Updated. Exported live parameters to Bill of Materials (+$8,450).")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition"
            >
              Export & Apply to Design
            </button>
          </div>

          {/* Real-time Visualizer & Output Preview */}
          <div className="glass-panel p-6 rounded-3xl space-y-6 lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-100">
                Parametric 3D Interactive Kitchen Simulation
              </h3>
              <span className="text-xs font-mono text-indigo-400">Live WebGPU Rendered</span>
            </div>

            {/* Visual simulation representation */}
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shadow-2xl group">
              <img 
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80" 
                alt="Parametric Kitchen Preview" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Parametric Overlay badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-mono font-bold text-white shadow">
                  Layout: {kitchenLayout}
                </div>
                <div className="px-3 py-1 rounded-lg bg-indigo-950/80 backdrop-blur border border-indigo-500/40 text-xs font-mono text-indigo-200">
                  Counter: {counterMaterial}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3 text-emerald-400 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Optimal Work Triangle: Sink ↔ Hob ↔ Fridge</span>
                </div>
                <div className="bg-slate-950/90 px-3 py-1.5 rounded-xl text-slate-200 border border-slate-800">
                  Est. Cost: <span className="font-bold text-indigo-400">$8,450</span>
                </div>
              </div>
            </div>

            {/* Parametric features summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-indigo-300">Intelligent Storage AI</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">Corner LeMans carousel + Blum Tandembox full-extension drawers.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-emerald-300">Appliance Integration</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">Siemens iQ700 induction hob & Bosch built-in double oven mapped.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-purple-300">CNC Ready Output</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">Auto-generated drilling diagrams & panel cutting optimization.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'wardrobe' && (
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Parametric Wardrobe & Closet Configurator</h3>
              <p className="text-xs text-slate-400 mt-1">AI analyzes your clothing inventory to optimize internal shelf, hanging rod, and accessory drawer ratios.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['Walk-in', 'Sliding', 'Hinged'] as const).map(t => (
                <button key={t} onClick={() => setWardrobeType(t)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${wardrobeType === t ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative aspect-16/10 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
              <img src="https://images.unsplash.com/photo-1558997519-83ea9252ded8?auto=format&fit=crop&w=800&q=80" alt="Walk in closet" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded font-mono text-xs text-indigo-300 border border-slate-800">
                {wardrobeType} Closet • Internal LED {internalLighting ? 'ON' : 'OFF'}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">AI Inventory Mapping Recommendation:</div>
                <ul className="space-y-1 text-slate-400 pl-2">
                  <li>• 45% Long & Short Hanging space (Suits, Dresses, Shirts)</li>
                  <li>• 30% Adjustable shelving (Folded knitwear, Denim)</li>
                  <li>• 15% Soft-close velvet lined accessory drawers (Watches, Ties, Jewelry)</li>
                  <li>• 10% Upper luggage & seasonal quilt storage</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span>Integrated Internal Motion LED Profiles (2700K Warm)</span>
                <input type="checkbox" checked={internalLighting} onChange={() => setInternalLighting(!internalLighting)} className="accent-indigo-500 w-4 h-4" />
              </div>

              <button onClick={() => alert("Wardrobe parametric blueprint saved.")} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition">
                Apply Wardrobe Specification ($4,200)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'ceiling' && (
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">False Ceiling & Integrated Lighting Designer</h3>
              <p className="text-xs text-slate-400 mt-1">Accommodates structural beams, HVAC/AC ducts, and layered cove LED strips.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['Cove', 'Tray', 'Coffered', 'Floating'] as const).map(p => (
                <button key={p} onClick={() => setCeilingProfile(p)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${ceilingProfile === p ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>{p}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
              <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" alt="False ceiling" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded font-mono text-xs text-amber-300 border border-slate-800">
                {ceilingProfile} Profile • 12.5mm Moisture Resistant Gypsum
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300"><span>Gypsum Board Quantity:</span><span className="font-mono font-bold text-emerald-400">42 sq.m</span></div>
                <div className="flex justify-between text-slate-300"><span>COB Downlight Fixtures:</span><span className="font-mono font-bold text-amber-400">12x 10W Philips CRI 95</span></div>
                <div className="flex justify-between text-slate-300"><span>Indirect Cove LED Strip:</span><span className="font-mono font-bold text-indigo-400">28 meters (2700K Warm)</span></div>
                <div className="flex justify-between text-slate-300"><span>AC Duct Drop Allowance:</span><span className="font-mono font-bold text-slate-400">220 mm clear drop</span></div>
              </div>

              <button onClick={() => alert("Ceiling lighting & gypsum plan finalized.")} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 text-white font-bold transition">
                Export Ceiling CAD Plan ($1,850)
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeModule === 'bathroom' || activeModule === 'custom-cnc') && (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
          <Layers className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold capitalize">{activeModule.replace('-', ' ')} Parametric Modulator</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            {activeModule === 'bathroom' 
              ? 'Automated wet/dry zoning, slope drainage verification, and herringbone/subway tile generator.'
              : 'AI custom geometry generator for awkward corners. Structural FEM validation and direct CNC G-code export ready.'}
          </p>
          <button onClick={() => alert(`${activeModule} CAD parameters injected.`)} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
            Run Parametric Optimization
          </button>
        </div>
      )}
    </div>
  );
};
