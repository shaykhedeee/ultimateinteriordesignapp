import React, { useState } from 'react';
import { FurnitureAsset, PBRMaterial, Project } from '../types/aura';
import { MOCK_ASSETS, MOCK_MATERIALS } from '../data/mockData';
import { 
  Armchair, 
  Palette, 
  Lightbulb, 
  Flower2, 
  Plus, 
  Tag, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface AssetCatalogProps {
  onAddItemToRoom: (asset: FurnitureAsset) => void;
  onApplyMaterial: (material: PBRMaterial) => void;
  project: Project;
}

export const AssetCatalog: React.FC<AssetCatalogProps> = ({
  onAddItemToRoom,
  onApplyMaterial,
  project
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'materials' | 'lighting' | 'decor'>('furniture');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filterAssets = (category: string) => {
    return MOCK_ASSETS.filter(a => {
      const matchCat = category === 'lighting' ? a.category === 'Lighting' 
        : category === 'decor' ? (a.category === 'Decor' || a.category === 'Plants') 
        : a.category === 'Furniture';
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  };

  const filteredMaterials = MOCK_MATERIALS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const budgetPct = Math.min(100, Math.round((project.budget.spent / project.budget.allocated) * 100));

  return (
    <div className={`glass-panel border-t border-slate-800 transition-all duration-300 bg-slate-950/95 z-40 ${
      isExpanded ? 'h-56 sm:h-64' : 'h-11'
    }`}>
      {/* Drawer Bar */}
      <div className="h-11 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => { setActiveTab('furniture'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'furniture' && isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Furniture (150K)</span>
          </button>

          <button
            onClick={() => { setActiveTab('materials'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'materials' && isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Materials (100K PBR)</span>
          </button>

          <button
            onClick={() => { setActiveTab('lighting'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'lighting' && isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Lighting & IES</span>
          </button>

          <button
            onClick={() => { setActiveTab('decor'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'decor' && isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>Decor & Greenery</span>
          </button>
        </div>

        {/* Right Info: Live Budget & Minimize Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Budget:</span>
            <span className="font-mono font-bold text-slate-100">${project.budget.spent.toLocaleString()}</span>
            <span className="text-slate-500">/ ${project.budget.allocated.toLocaleString()}</span>
            <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
              <div 
                className={`h-full transition-all duration-500 ${budgetPct > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400">{budgetPct}%</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      {isExpanded && (
        <div className="p-3 h-[calc(100%-44px)] flex flex-col justify-between">
          {/* Top filter input */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Semantic Catalog Filter:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands (IKEA, West Elm), textures, or items..."
                className="bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-56 sm:w-72"
              />
            </div>
            <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
              {activeTab === 'materials' ? `${filteredMaterials.length} PBR textures found` : `${filterAssets(activeTab).length} 3D assets ready`}
            </div>
          </div>

          {/* Grid list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar">
            {activeTab !== 'materials' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filterAssets(activeTab).map((ast) => (
                  <div 
                    key={ast.id}
                    className="group relative bg-slate-900/80 hover:bg-slate-850 rounded-xl border border-slate-800/80 hover:border-indigo-500/50 p-2 transition-all flex flex-col justify-between cursor-pointer"
                    onClick={() => onAddItemToRoom(ast)}
                  >
                    <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-950 mb-2">
                      <img 
                        src={ast.thumbnail} 
                        alt={ast.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[9px] font-mono text-slate-300 border border-slate-800">
                        {ast.brand}
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-indigo-600/90 text-[9px] font-mono font-bold text-white shadow">
                        ${ast.price}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-slate-200 truncate group-hover:text-indigo-300 transition">
                        {ast.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{ast.dimensions.width}×{ast.dimensions.depth}×{ast.dimensions.height}cm</span>
                        <span className="flex items-center text-amber-400">★{ast.rating}</span>
                      </div>
                    </div>

                    <div className="mt-2 w-full py-1 rounded bg-indigo-500/10 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition">
                      <Plus className="w-3 h-3" /> Insert to Room
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="group relative bg-slate-900/80 hover:bg-slate-850 rounded-xl border border-slate-800/80 hover:border-indigo-500/50 p-2 transition-all flex flex-col justify-between cursor-pointer"
                    onClick={() => onApplyMaterial(mat)}
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-2">
                      <img 
                        src={mat.textureUrl} 
                        alt={mat.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[9px] font-mono text-slate-300 border border-slate-800">
                        {mat.category}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-slate-200 truncate group-hover:text-indigo-300 transition">
                        {mat.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>{mat.vendor}</span>
                        <span className="text-emerald-400 font-bold">${mat.pricePerSqFt}/sq.ft</span>
                      </div>
                    </div>

                    <div className="mt-2 w-full py-1 rounded bg-emerald-500/10 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition">
                      <Tag className="w-3 h-3" /> Paint Material
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
