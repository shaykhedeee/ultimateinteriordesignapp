import React from 'react';
import { Layers } from 'lucide-react';
import { getSlotsForModuleType, SLOT_LABELS, describeAssignment } from '../../lib/materialSlots';

// Reusable multi-slot material selector used in the Inspector panel.
// Renders one swatch row per material slot the module exposes, so the
// "3D material selector" is complete: carcass, shutter, countertop, backPanel, hardware.
export default function MaterialSelector({ module, moduleType, palette = [], isLocked = false, onChange }) {
  const slots = getSlotsForModuleType(moduleType);
  const assignments = (module && module.materialAssignments) || {};

  return (
    <div className="space-y-3">
      <label className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] flex items-center gap-1.5">
        <Layers className="w-3 h-3 text-[var(--gold)]" /> Material Selector
      </label>

      <div className="space-y-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
        {slots.map(slot => {
          const currentId = assignments[slot] || 'lam_1';
          const currentName = describeAssignment(currentId, palette);
          return (
            <div key={slot} className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider">{SLOT_LABELS[slot] || slot}</span>
                <span className="text-slate-500 truncate max-w-[140px] text-right">{currentName}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {palette.map(lam => {
                  const lamId = lam.id || lam.code;
                  const isSelected = currentId === lamId;
                  return (
                    <button
                      key={lamId}
                      type="button"
                      onClick={() => onChange(slot, lamId)}
                      disabled={isLocked}
                      title={`${lam.brand || ''} - ${lam.name || ''}`}
                      className={`h-9 rounded-lg border relative transition ${
                        isSelected
                          ? 'border-[var(--gold)] scale-105 shadow-md shadow-[var(--gold)]/10'
                          : 'border-slate-850 hover:border-slate-700'
                      }`}
                      style={{ backgroundColor: lam.color || '#888' }}
                    >
                      {isSelected && (
                        <span className="absolute bottom-0 right-0 bg-[var(--gold)] w-2.5 h-2.5 rounded-br-md flex items-center justify-center text-[7px] text-slate-950 font-black">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
