import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Save, X, Layers, FileText, ArrowRight, Info, Check } from 'lucide-react';
import { CustomTemplate, QuoteItem, RateItem } from '../types';
import { CATEGORY_SUGGESTIONS, PROJECT_TYPES, DEFAULT_SPECS, DEFAULT_TERMS } from '../constants';

interface TemplatesManagerProps {
  customTemplates: CustomTemplate[];
  rateCard: RateItem[];
  onSave: (updatedTemplates: CustomTemplate[]) => void;
  onCancel: () => void;
  onCreateQuoteFromTemplate: (
    items: QuoteItem[],
    specs: string[],
    terms: string[],
    projectType: string,
    notes?: string
  ) => void;
}

const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  customTemplates,
  rateCard,
  onSave,
  onCancel,
  onCreateQuoteFromTemplate
}) => {
  const [localTemplates, setLocalTemplates] = useState<CustomTemplate[]>(() => 
    JSON.parse(JSON.stringify(customTemplates))
  );

  // Edit / Add state
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newProjectType, setNewProjectType] = useState(PROJECT_TYPES[0]);

  // Edit template sub-views
  const [activeTab, setActiveTab] = useState<'items' | 'specs' | 'terms'>('items');
  const [newSpec, setNewSpec] = useState('');
  const [newTerm, setNewTerm] = useState('');

  // Rate lookup helper
  const handleProductSelect = (itemId: string, rateId: string) => {
    if (!editingTemplate) return;
    const catalogItem = rateCard.find(r => r.id === rateId);
    if (!catalogItem) return;

    const updatedItems = editingTemplate.items.map(i => {
      if (i.id !== itemId) return i;
      const isLump = catalogItem.rateType === 'LUMPSUM';
      const dims = catalogItem.defaultDimensions;
      const rate = catalogItem.defaultRate;
      
      const parts = dims.split('x').map(p => p.trim());
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      const sqft = !isNaN(w) && !isNaN(h) && !isLump ? w * h : 0;
      const amount = isLump ? rate : sqft * rate;

      return {
        ...i,
        description: catalogItem.name,
        dimensions: dims,
        rate: rate,
        sqft: sqft,
        amount: amount,
        isLumpSum: isLump,
        unit: catalogItem.defaultUnit,
        material: catalogItem.defaultMaterial || '',
        finish: catalogItem.defaultFinish || '',
        hardware: catalogItem.defaultHardware || ''
      };
    });

    setEditingTemplate({ ...editingTemplate, items: updatedItems });
  };

  const handleItemFieldChange = (itemId: string, field: keyof QuoteItem, value: any) => {
    if (!editingTemplate) return;
    const updatedItems = editingTemplate.items.map(i => {
      if (i.id !== itemId) return i;
      const updated = { ...i, [field]: value };
      
      if (field === 'dimensions' || field === 'rate' || field === 'isLumpSum') {
        const isLump = field === 'isLumpSum' ? value : updated.isLumpSum;
        const dims = field === 'dimensions' ? value : updated.dimensions;
        const rate = field === 'rate' ? Number(value) : updated.rate;
        
        const parts = (dims as string).split('x').map((p: string) => p.trim());
        const w = parseFloat(parts[0]);
        const h = parseFloat(parts[1]);
        updated.sqft = !isNaN(w) && !isNaN(h) && !isLump ? w * h : 0;
        updated.amount = isLump ? rate : updated.sqft * rate;
      }
      return updated;
    });

    setEditingTemplate({ ...editingTemplate, items: updatedItems });
  };

  const handleAddNewItem = () => {
    if (!editingTemplate) return;
    const newItem: QuoteItem = {
      id: `ti-${Date.now()}-${Math.random()}`,
      category: CATEGORY_SUGGESTIONS[0],
      description: '',
      dimensions: '10 x 2.75',
      sqft: 27.5,
      rate: 0,
      amount: 0,
      isLumpSum: false,
      unit: 'Sqft'
    };
    setEditingTemplate({
      ...editingTemplate,
      items: [...editingTemplate.items, newItem]
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      items: editingTemplate.items.filter(i => i.id !== id)
    });
  };

  // Add/Remove specs and terms
  const handleAddSpec = () => {
    if (!editingTemplate || !newSpec.trim()) return;
    setEditingTemplate({
      ...editingTemplate,
      specifications: [...editingTemplate.specifications, newSpec.trim()]
    });
    setNewSpec('');
  };

  const handleRemoveSpec = (idx: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      specifications: editingTemplate.specifications.filter((_, i) => i !== idx)
    });
  };

  const handleAddTerm = () => {
    if (!editingTemplate || !newTerm.trim()) return;
    setEditingTemplate({
      ...editingTemplate,
      terms: [...editingTemplate.terms, newTerm.trim()]
    });
    setNewTerm('');
  };

  const handleRemoveTerm = (idx: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      terms: editingTemplate.terms.filter((_, i) => i !== idx)
    });
  };

  // CRUD actions for Template
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: CustomTemplate = {
      id: `t-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      projectType: newProjectType,
      items: [],
      requestedItems: [],
      specifications: [...DEFAULT_SPECS],
      terms: [...DEFAULT_TERMS],
      notes: ''
    };
    setLocalTemplates(prev => [...prev, newTemplate]);
    setShowAddForm(false);
    setNewTemplateName('');
    setEditingTemplate(newTemplate);
  };

  const handleSaveTemplateChanges = () => {
    if (!editingTemplate) return;
    setLocalTemplates(prev => 
      prev.map(t => t.id === editingTemplate.id ? editingTemplate : t)
    );
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template? This cannot be undone.")) {
      const updated = localTemplates.filter(t => t.id !== id);
      setLocalTemplates(updated);
      onSave(updated);
    }
  };

  const handleDuplicateTemplate = (template: CustomTemplate) => {
    const duplicated: CustomTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      id: `t-custom-${Date.now()}`,
      name: `${template.name} (Copy)`
    };
    setLocalTemplates(prev => [...prev, duplicated]);
    onSave([...localTemplates, duplicated]);
  };

  if (editingTemplate) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
          {/* Header */}
          <div className="p-6 border-b border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#b8873b] border border-[#b8873b]/30 px-2 py-0.5 rounded">
                  {editingTemplate.projectType}
                </span>
                <span className="text-stone-400 text-xs">Template Editor</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-800 mt-1">
                {editingTemplate.name}
              </h2>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setEditingTemplate(null)}
                className="flex-1 sm:flex-none border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 px-4 py-2 rounded-lg text-xs font-bold"
              >
                Exit Editor
              </button>
              <button
                onClick={handleSaveTemplateChanges}
                className="flex-1 sm:flex-none bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save size={14} />
                <span>Save Template</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="border-b border-stone-100 flex bg-stone-50/20 px-6">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'items' ? 'border-[#b8873b] text-[#1f352b]' : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              Template Items ({editingTemplate.items.length})
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'specs' ? 'border-[#b8873b] text-[#1f352b]' : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              Default Specs ({editingTemplate.specifications.length})
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'terms' ? 'border-[#b8873b] text-[#1f352b]' : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              Default Terms ({editingTemplate.terms.length})
            </button>
          </div>

          <div className="p-6">
            {/* TAB: ITEMS */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Line items preset</span>
                  <button
                    onClick={handleAddNewItem}
                    className="border border-stone-200 hover:bg-stone-50 text-[#1f352b] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-[9px] uppercase tracking-widest font-black text-stone-400">
                        <th className="py-2.5 px-4 w-32">Room / Zone</th>
                        <th className="py-2.5 px-4">Item Details (Rate Catalog Lookup)</th>
                        <th className="py-2.5 px-4 w-28 text-center">Dimensions</th>
                        <th className="py-2.5 px-4 w-20 text-center">Lump Sum</th>
                        <th className="py-2.5 px-4 w-28 text-right">Default Rate (₹)</th>
                        <th className="py-2.5 px-4 text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {editingTemplate.items.map(item => (
                        <tr key={item.id} className="hover:bg-stone-50/20">
                          <td className="py-2.5 px-4">
                            <select
                              value={item.category || ''}
                              onChange={e => handleItemFieldChange(item.id, 'category', e.target.value)}
                              className="w-full border border-stone-200 rounded p-1 text-[11px] bg-white font-semibold text-stone-700"
                            >
                              {CATEGORY_SUGGESTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-col gap-1.5">
                              <select
                                onChange={e => handleProductSelect(item.id, e.target.value)}
                                className="w-full border border-stone-200 rounded p-1 text-[11px] bg-white font-bold"
                              >
                                <option value="">-- Catalog Lookup --</option>
                                {rateCard.map(rc => (
                                  <option key={rc.id} value={rc.id}>{rc.name} (₹{rc.defaultRate}/{rc.rateType})</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => handleItemFieldChange(item.id, 'description', e.target.value)}
                                placeholder="Custom Description overrides..."
                                className="w-full border border-stone-200 rounded p-1 text-[11px]"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.dimensions}
                              onChange={e => handleItemFieldChange(item.id, 'dimensions', e.target.value)}
                              disabled={item.isLumpSum}
                              placeholder="e.g. 10 x 2.75"
                              className="w-full border border-stone-200 rounded p-1 text-[11px] text-center font-mono disabled:bg-stone-50"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={item.isLumpSum || false}
                              onChange={e => handleItemFieldChange(item.id, 'isLumpSum', e.target.checked)}
                              className="h-3.5 w-3.5 rounded text-[#b8873b] focus:ring-[#b8873b]"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="number"
                              value={item.rate || ''}
                              onChange={e => handleItemFieldChange(item.id, 'rate', Number(e.target.value))}
                              placeholder="0"
                              className="w-full border border-stone-200 rounded p-1 text-[11px] text-right font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 hover:text-red-600 rounded hover:bg-red-50 text-stone-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {editingTemplate.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-stone-400">
                            No items in this template. Click "Add Item Row" to start adding modular templates.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SPECS */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpec}
                    onChange={e => setNewSpec(e.target.value)}
                    placeholder="Add brand/material specification (e.g. Hardware: Blum soft-close hinges)..."
                    className="flex-1 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                  />
                  <button
                    onClick={handleAddSpec}
                    className="bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 rounded-lg text-xs font-bold"
                  >
                    Add Spec
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto border border-stone-100 p-4 rounded-xl">
                  {editingTemplate.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 p-2 bg-stone-50 rounded-lg text-xs border border-stone-200/50">
                      <span className="font-semibold text-stone-700 leading-normal">{spec}</span>
                      <button
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-stone-400 hover:text-red-600 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TERMS */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={e => setNewTerm(e.target.value)}
                    placeholder="Add contracting terms (e.g. Validity: Quoted price valid for 15 days)..."
                    className="flex-1 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
                  />
                  <button
                    onClick={handleAddTerm}
                    className="bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 rounded-lg text-xs font-bold"
                  >
                    Add Term
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto border border-stone-100 p-4 rounded-xl">
                  {editingTemplate.terms.map((term, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 p-2 bg-stone-50 rounded-lg text-xs border border-stone-200/50">
                      <span className="font-semibold text-stone-700 leading-normal">{term}</span>
                      <button
                        onClick={() => handleRemoveTerm(idx)}
                        className="text-stone-400 hover:text-red-600 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-8">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">Project Templates Manager</h2>
            <p className="text-stone-500 text-xs mt-1">
              Create and manage customizable templates. Save standard modular groups (like modular kitchens, complete BHKs) to quickly prefill client estimates.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Create New Template</span>
          </button>
        </div>

        {/* Add Template Modal Area */}
        {showAddForm && (
          <div className="p-6 bg-[#f5e6cf]/15 border-b border-stone-200 flex flex-col sm:flex-row items-end gap-4">
            <label className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Template Name</span>
              <input
                type="text"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="e.g. Prestige Lake Ridge 3BHK Standard"
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-bold"
              />
            </label>

            <label className="w-52 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Property Type</span>
              <select
                value={newProjectType}
                onChange={e => setNewProjectType(e.target.value)}
                className="w-full border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              >
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-bold hover:bg-stone-50 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c]"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Grid of templates */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localTemplates.map(template => (
              <div 
                key={template.id}
                className="border border-stone-200 rounded-xl p-5 hover:border-[#b8873b]/40 hover:bg-stone-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="text-[9px] uppercase font-bold text-[#b8873b] border border-[#b8873b]/20 px-2 py-0.5 rounded">
                      {template.projectType}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Duplicate Template"
                        className="p-1 text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete Template"
                        className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <strong className="text-sm font-bold text-stone-800 block mb-1">
                    {template.name}
                  </strong>
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Preset with {template.items.length} line items, {template.specifications.length} brand specifications, and {template.terms.length} terms & conditions.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="border border-stone-200 hover:bg-stone-50 text-stone-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 size={12} />
                    <span>Edit Preset</span>
                  </button>
                  <button
                    onClick={() => onCreateQuoteFromTemplate(
                      template.items,
                      template.specifications,
                      template.terms,
                      template.projectType,
                      template.notes
                    )}
                    className="bg-[#b8873b] hover:bg-[#a37632] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span>Use Template</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}

            {localTemplates.length === 0 && (
              <div className="md:col-span-2 p-12 text-center text-stone-400">
                <Layers size={40} className="mx-auto mb-3 opacity-20 text-[#1f352b]" />
                <h4 className="font-bold text-stone-700 text-sm mb-1">No Custom Templates Yet</h4>
                <p className="text-xs">Save any quotation as a template from its preview, or click "Create New Template" above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold hover:bg-stone-50"
        >
          Close
        </button>
        <button
          onClick={() => onSave(localTemplates)}
          className="px-5 py-2 bg-[#1f352b] text-white rounded-lg text-xs font-bold hover:bg-[#2c493c] shadow-sm"
        >
          Save All Templates
        </button>
      </div>
    </div>
  );
};

export default TemplatesManager;
