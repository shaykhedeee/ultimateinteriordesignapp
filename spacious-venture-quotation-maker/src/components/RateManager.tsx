import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { RateItem } from '../types';
import { DEFAULT_RATE_ITEMS, CATEGORY_SUGGESTIONS } from '../constants';

interface RateManagerProps {
  rateCard: RateItem[];
  onSave: (updatedCard: RateItem[]) => void;
  onCancel: () => void;
}

const RateManager: React.FC<RateManagerProps> = ({ rateCard, onSave, onCancel }) => {
  const [localCard, setLocalCard] = useState<RateItem[]>(() => JSON.parse(JSON.stringify(rateCard)));
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RateItem>>({});

  // New item state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState<Partial<RateItem>>({
    category: 'Kitchen',
    name: '',
    defaultDimensions: '10 x 2.75',
    defaultRate: 0,
    rateType: 'SQFT',
    defaultUnit: 'Sqft',
    defaultMaterial: '',
    defaultFinish: '',
    defaultHardware: ''
  });

  const handleStartEdit = (item: RateItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.defaultRate) return;
    setLocalCard(prev => prev.map(item => item.id === editingId ? (editForm as RateItem) : item));
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this item from the catalog? New quotes won't see this in dropdowns.")) {
      setLocalCard(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    if (!newForm.name || !newForm.defaultRate) {
      alert("Please enter a name and default rate.");
      return;
    }
    const newItem: RateItem = {
      id: `r-custom-${Date.now()}`,
      category: newForm.category || 'General',
      name: newForm.name,
      defaultDimensions: newForm.defaultDimensions || '-',
      defaultRate: Number(newForm.defaultRate),
      rateType: newForm.rateType || 'SQFT',
      defaultUnit: newForm.defaultUnit || 'Sqft',
      defaultMaterial: newForm.defaultMaterial || '',
      defaultFinish: newForm.defaultFinish || '',
      defaultHardware: newForm.defaultHardware || ''
    };
    setLocalCard(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewForm({
      category: 'Kitchen',
      name: '',
      defaultDimensions: '10 x 2.75',
      defaultRate: 0,
      rateType: 'SQFT',
      defaultUnit: 'Sqft',
      defaultMaterial: '',
      defaultFinish: '',
      defaultHardware: ''
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset the catalog? All custom items and rates will be overwritten by original Spacious Venture defaults.")) {
      setLocalCard(JSON.parse(JSON.stringify(DEFAULT_RATE_ITEMS)));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">Standard Rate Catalog</h2>
            <p className="text-stone-500 text-xs mt-1">Configure item names, default sizes, and rates. These populate immediately in the dropdown selectors of the estimate builder.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetDefaults}
              className="flex-1 sm:flex-none border border-stone-200 hover:bg-stone-50 text-stone-600 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              title="Restore original Spacious Venture pricing defaults"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none bg-[#1f352b] hover:bg-[#2c493c] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add Catalog Item</span>
            </button>
          </div>
        </div>

        {/* Add Form Drawer */}
        {showAddForm && (
          <div className="p-6 bg-[#f5e6cf]/15 border-b border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 pb-2 border-b border-stone-200/50 flex justify-between items-center">
              <strong className="text-xs font-bold uppercase text-[#1f352b]">New Catalog Item Details</strong>
              <button onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-600"><X size={16}/></button>
            </div>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category</span>
              <select
                value={newForm.category}
                onChange={e => setNewForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              >
                {CATEGORY_SUGGESTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Item Name</span>
              <input
                type="text"
                value={newForm.name}
                onChange={e => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Crockery Unit (Premium Gold Finish)"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Default Dimensions</span>
              <input
                type="text"
                value={newForm.defaultDimensions}
                onChange={e => setNewForm(prev => ({ ...prev, defaultDimensions: e.target.value }))}
                placeholder="e.g. 5 x 7 or -"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pricing Method</span>
              <select
                value={newForm.rateType}
                onChange={e => {
                  const val = e.target.value as 'SQFT' | 'LUMPSUM';
                  setNewForm(prev => ({ 
                    ...prev, 
                    rateType: val, 
                    defaultUnit: val === 'SQFT' ? 'Sqft' : 'Nos' 
                  }));
                }}
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              >
                <option value="SQFT">Sqft-based (dimensions calculate cost)</option>
                <option value="LUMPSUM">Lump sum (fixed unit pricing)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Default Rate (₹)</span>
              <input
                type="number"
                value={newForm.defaultRate || ''}
                onChange={e => setNewForm(prev => ({ ...prev, defaultRate: Number(e.target.value) }))}
                placeholder="e.g. 1450"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Default Carcass/Core Particular</span>
              <input
                type="text"
                value={newForm.defaultMaterial || ''}
                onChange={e => setNewForm(prev => ({ ...prev, defaultMaterial: e.target.value }))}
                placeholder="e.g. BWR Plywood"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Default Finish Particular</span>
              <input
                type="text"
                value={newForm.defaultFinish || ''}
                onChange={e => setNewForm(prev => ({ ...prev, defaultFinish: e.target.value }))}
                placeholder="e.g. 1.0mm Matte Laminate"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Default Hardware Particular</span>
              <input
                type="text"
                value={newForm.defaultHardware || ''}
                onChange={e => setNewForm(prev => ({ ...prev, defaultHardware: e.target.value }))}
                placeholder="e.g. Hettich Soft-close"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c]"
              >
                Add to Catalog
              </button>
            </div>
          </div>
        )}

        {/* Catalog List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[9px] uppercase tracking-widest font-black text-stone-400">
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Default Size</th>
                <th className="py-3 px-4">Pricing Type</th>
                <th className="py-3 px-4 text-right">Default Rate (₹)</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {localCard.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#1f352b]">
                      {isEditing ? (
                        <select
                          value={editForm.category}
                          onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="border border-stone-200 rounded px-1.5 py-1 text-xs"
                        >
                          {CATEGORY_SUGGESTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      ) : item.category}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-700">
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 w-full max-w-xs">
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="border border-stone-200 rounded px-1.5 py-1 text-xs font-bold"
                          />
                          <div className="grid grid-cols-3 gap-1 bg-stone-50 p-1.5 rounded border border-stone-200/50">
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[7px] text-stone-400 font-bold uppercase">Core</span>
                              <input
                                type="text"
                                value={editForm.defaultMaterial || ''}
                                onChange={e => setEditForm(prev => ({ ...prev, defaultMaterial: e.target.value }))}
                                className="border border-stone-200 rounded px-1 py-0.5 text-[9px] font-medium bg-white"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[7px] text-stone-400 font-bold uppercase">Finish</span>
                              <input
                                type="text"
                                value={editForm.defaultFinish || ''}
                                onChange={e => setEditForm(prev => ({ ...prev, defaultFinish: e.target.value }))}
                                className="border border-stone-200 rounded px-1 py-0.5 text-[9px] font-medium bg-white"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[7px] text-stone-400 font-bold uppercase">Hardware</span>
                              <input
                                type="text"
                                value={editForm.defaultHardware || ''}
                                onChange={e => setEditForm(prev => ({ ...prev, defaultHardware: e.target.value }))}
                                className="border border-stone-200 rounded px-1 py-0.5 text-[9px] font-medium bg-white"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{item.name}</div>
                          {(item.defaultMaterial || item.defaultFinish || item.defaultHardware) && (
                            <div className="text-[8.5px] font-normal text-stone-400 mt-1 italic leading-tight space-y-0.5">
                              {item.defaultMaterial && <div><span className="font-semibold text-stone-500">Core:</span> {item.defaultMaterial}</div>}
                              {item.defaultFinish && <div><span className="font-semibold text-stone-500">Finish:</span> {item.defaultFinish}</div>}
                              {item.defaultHardware && <div><span className="font-semibold text-stone-500">Hardware:</span> {item.defaultHardware}</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 font-mono">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.defaultDimensions || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, defaultDimensions: e.target.value }))}
                          className="border border-stone-200 rounded px-1.5 py-1 text-xs w-20"
                        />
                      ) : item.defaultDimensions}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {isEditing ? (
                        <select
                          value={editForm.rateType}
                          onChange={e => {
                            const val = e.target.value as 'SQFT' | 'LUMPSUM';
                            setEditForm(prev => ({
                              ...prev,
                              rateType: val,
                              defaultUnit: val === 'SQFT' ? 'Sqft' : 'Nos'
                            }));
                          }}
                          className="border border-stone-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="SQFT">Sqft-based</option>
                          <option value="LUMPSUM">Lump sum</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.rateType === 'SQFT' ? 'bg-[#f5e6cf]/30 text-[#b8873b]' : 'bg-stone-100 text-stone-500'}`}>
                          {item.rateType === 'SQFT' ? 'per Sqft' : 'Flat rate'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-stone-800">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.defaultRate || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, defaultRate: Number(e.target.value) }))}
                          className="border border-stone-200 rounded px-1.5 py-1 text-xs w-24 text-right font-bold"
                        />
                      ) : (
                        `₹ ${item.defaultRate.toLocaleString('en-IN')}`
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localCard)}
          className="px-5 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c] shadow-sm"
        >
          Save Catalog Rates
        </button>
      </div>
    </div>
  );
};

export default RateManager;
