'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelectedModule } from '../../stores/designEditorStore';
import { estimateModuleConfiguratorCost } from '../../lib/module-costing';
import { getConfiguratorPreset } from '../../lib/module-configurator';

export function ModuleConfiguratorPanel({
  onUpdate,
  readonly,
}: {
  onUpdate: (moduleId: string, params: Record<string, unknown>) => Promise<void>;
  readonly?: boolean;
}) {
  const module = useSelectedModule();
  const preset = useMemo(() => getConfiguratorPreset(module?.moduleType), [module?.moduleType]);
  const [draftParams, setDraftParams] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraftParams(module?.params ?? {});
  }, [module?.moduleId]);

  if (!module) {
    return (
      <div className="panel">
        <h3>Advanced Configurator</h3>
        <div className="rowMock">Select a module to open advanced configurator controls.</div>
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="panel">
        <h3>Advanced Configurator</h3>
        <div className="rowMock">No specialized configurator preset yet for {module.moduleType}.</div>
      </div>
    );
  }

  const currentCost = estimateModuleConfiguratorCost(module.moduleType, module.params);
  const draftCost = estimateModuleConfiguratorCost(module.moduleType, { ...module.params, ...draftParams });
  const delta = draftCost.total - currentCost.total;

  return (
    <div className="panel">
      <h3>Advanced Configurator</h3>
      <div className="listMock">
        <div className="rowMock">Preset: {preset.label}</div>
        <div className="rowMock">
          Current Cost: ₹{currentCost.total.toLocaleString()} · Draft Cost: ₹{draftCost.total.toLocaleString()} · Delta: {delta >= 0 ? '+' : ''}₹{delta.toLocaleString()}
        </div>
        {preset.fields.map((field) => {
          const currentValue = (module.params as any)?.[field.key] ?? field.defaultValue;
          if (field.type === 'number') {
            return (
              <label key={field.key}>
                {field.label}
                <input
                  disabled={readonly}
                  defaultValue={Number(currentValue)}
                  onChange={(e) => setDraftParams((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                  onBlur={(e) => onUpdate(module.moduleId, { [field.key]: Number(e.target.value) })}
                />
              </label>
            );
          }
          return (
            <label key={field.key}>
              {field.label}
              <select
                disabled={readonly}
                defaultValue={String(currentValue)}
                onChange={(e) => {
                  setDraftParams((prev) => ({ ...prev, [field.key]: e.target.value }));
                  onUpdate(module.moduleId, { [field.key]: e.target.value });
                }}
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          );
        })}
        <div className="rowMock">
          Production Cost Breakdown — Base: ₹{currentCost.baseCost.toLocaleString()} · Hardware: ₹{draftCost.hardwareCost.toLocaleString()} · Finish: ₹{draftCost.finishCost.toLocaleString()}
        </div>
        <div className="rowMock">
          Production Mapping Preset: {String((module.productionMapping as any)?.presetKey ?? 'n/a')}
        </div>
        <div className="rowMock">
          Board Defaults: carcass {String((module.productionMapping as any)?.boardDefaults?.carcass_thickness_mm ?? 'n/a')}mm · back {String((module.productionMapping as any)?.boardDefaults?.back_panel_thickness_mm ?? 'n/a')}mm
        </div>
        <div className="rowMock">
          Edge Defaults: visible {String((module.productionMapping as any)?.edgeBandDefaults?.visible_edge ?? 'n/a')} · internal {String((module.productionMapping as any)?.edgeBandDefaults?.internal_edge ?? 'n/a')}
        </div>
        <div className="rowMock">
          Notes: {Array.isArray((module.productionMapping as any)?.notes) ? (module.productionMapping as any).notes.join(' | ') : '—'}
        </div>
        <div className="rowMock">This foundation now drives pricing awareness and production mappings, and will later connect directly to BOM formulas and workshop outputs.</div>
      </div>
    </div>
  );
}
