import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, RotateCcw, Box, Sparkles, Cpu } from 'lucide-react';
import { MaterialItem } from '../types';
import { DEFAULT_MATERIALS } from '../constants';

interface MaterialsManagerProps {
  materials: MaterialItem[];
  onSave: (updatedMaterials: MaterialItem[]) => void;
  onCancel: () => void;
}

const MaterialsManager: React.FC<MaterialsManagerProps> = ({ materials, onSave, onCancel }) => {
  const [localMaterials, setLocalMaterials] = useState<MaterialItem[]>(() => 
    JSON.parse(JSON.stringify(materials))
  );

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MaterialItem>>({});

  // Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState<Partial<MaterialItem>>({
    name: '',
    type: 'carcass',
    markupPercentage: 0,
    description: ''
  });

  const handleStartEdit = (item: MaterialItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editForm.name) return;
    setLocalMaterials(prev => prev.map(item => item.id === editingId ? (editForm as MaterialItem) : item));
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this material from the catalog? This will affect new calculations.")) {
      setLocalMaterials(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    if (!newForm.name) {
      alert("Please enter a name for the material.");
      return;
    }
    const newItem: MaterialItem = {
      id: `m-custom-${Date.now()}`,
      name: newForm.name,
      type: newForm.type || 'carcass',
      markupPercentage: Number(newForm.markupPercentage || 0),
      description: newForm.description || ''
    };
    setLocalMaterials(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewForm({
      name: '',
      type: 'carcass',
      markupPercentage: 0,
      description: ''
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset the materials catalog? All custom options and markups will be replaced by Spacious Venture defaults.")) {
      setLocalMaterials(JSON.parse(JSON.stringify(DEFAULT_MATERIALS)));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'carcass': return <Box className="text-[#b8873b]" size={16} />;
      case 'finish': return <Sparkles className="text-purple-600" size={16} />;
      case 'hardware': return <Cpu className="text-blue-600" size={16} />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'carcass': return 'Carcass / Core Board';
      case 'finish': return 'Finish Material';
      case 'hardware': return 'Hardware & Fitting';
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">Materials & Finishes Library</h2>
            <p className="text-stone-500 text-xs mt-1">
              Manage material specs and their cost multipliers. Selecting a material in the estimate editor dynamically adjusts the item rates by these markup percentages.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetDefaults}
              className="flex-1 sm:flex-none border border-stone-200 hover:bg-stone-50 text-stone-600 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              title="Restore standard material rates"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none bg-[#1f352b] hover:bg-[#2c493c] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add Material Option</span>
            </button>
          </div>
        </div>

        {/* Add Form Drawer */}
        {showAddForm && (
          <div className="p-6 bg-[#f5e6cf]/15 border-b border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 pb-2 border-b border-stone-200/50 flex justify-between items-center">
              <strong className="text-xs font-bold uppercase text-[#1f352b]">New Material Specs</strong>
              <button onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-600"><X size={16}/></button>
            </div>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Classification</span>
              <select
                value={newForm.type}
                onChange={e => setNewForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              >
                <option value="carcass">Carcass / Core (e.g. Plywood)</option>
                <option value="finish">Finish / Shutter (e.g. Acrylic)</option>
                <option value="hardware">Hardware / Fittings (e.g. Hettich)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Material / Finish Name</span>
              <input
                type="text"
                value={newForm.name}
                onChange={e => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. 1.2mm Acrylic Premium High-Gloss"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Markup Premium (%)</span>
              <input
                type="number"
                value={newForm.markupPercentage === 0 ? '' : (newForm.markupPercentage || '')}
                onChange={e => setNewForm(prev => ({ ...prev, markupPercentage: Number(e.target.value) / 100 }))}
                placeholder="e.g. +25 for +25% or -10 for -10%"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Short Description / Brand Info</span>
              <input
                type="text"
                value={newForm.description}
                onChange={e => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Anti-scratch water resistant, German engineered"
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
                Add Material
              </button>
            </div>
          </div>
        )}

        {/* Catalog List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[9px] uppercase tracking-widest font-black text-stone-400">
                <th className="py-3 px-6">Classification</th>
                <th className="py-3 px-4">Material / Brand Name</th>
                <th className="py-3 px-4 text-center">Cost Premium Adjustment</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {localMaterials.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-stone-700">
                      {isEditing ? (
                        <select
                          value={editForm.type}
                          onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                          className="border border-stone-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="carcass">Carcass / Core</option>
                          <option value="finish">Finish / Shutter</option>
                          <option value="hardware">Hardware / Fitting</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span>{getTypeLabel(item.type)}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-700">
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="border border-stone-200 rounded px-1.5 py-1 text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={editForm.description || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description"
                            className="border border-stone-200 rounded px-1.5 py-1 text-[10px] font-normal text-stone-400"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-stone-800 font-bold">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-stone-400 font-normal mt-0.5">{item.description}</div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-black">
                      {isEditing ? (
                        <div className="flex justify-center items-center gap-1 max-w-[120px] mx-auto">
                          <input
                            type="number"
                            value={editForm.markupPercentage === undefined ? '' : Math.round(editForm.markupPercentage * 100)}
                            onChange={e => setEditForm(prev => ({ ...prev, markupPercentage: Number(e.target.value) / 100 }))}
                            className="border border-stone-200 rounded px-1.5 py-1 text-xs text-center font-bold w-16"
                          />
                          <span className="text-stone-400">%</span>
                        </div>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10.5px] font-black ${
                          item.markupPercentage > 0 
                            ? 'bg-red-50 text-red-600' 
                            : item.markupPercentage < 0 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-stone-50 text-stone-400'
                        }`}>
                          {item.markupPercentage > 0 ? `+${Math.round(item.markupPercentage * 100)}% Premium` : item.markupPercentage < 0 ? `${Math.round(item.markupPercentage * 100)}% Discount` : 'Base Price'}
                        </span>
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
          onClick={() => onSave(localMaterials)}
          className="px-5 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c] shadow-sm"
        >
          Save Materials Catalog
        </button>
      </div>
    </div>
  );
};

export default MaterialsManager;
