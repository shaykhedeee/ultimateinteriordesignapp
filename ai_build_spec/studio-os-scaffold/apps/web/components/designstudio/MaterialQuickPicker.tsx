'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useSelectedModule } from '../../stores/designEditorStore';

type Material = {
  id: string;
  category: string;
  name: string;
  brand?: string;
  metadata?: Record<string, unknown>;
};

export function MaterialQuickPicker({ onAssign, readonly }: { onAssign: (materialId: string, name: string) => Promise<void>; readonly?: boolean }) {
  const selectedModule = useSelectedModule();
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    apiGet<Material[]>('/material-catalog').then(setMaterials).catch(console.error);
  }, []);

  return (
    <div className="panel">
      <h3>Material Quick Picker</h3>
      {!selectedModule ? (
        <div className="rowMock">Select a module to assign a finish.</div>
      ) : (
        <div className="listMock">
          <div className="rowMock">Selected Module: {selectedModule.name}</div>
          {materials.slice(0, 5).map((material) => (
            <div className="rowMock" key={material.id}>
              <strong>{material.name}</strong>
              <div className="muted">{material.category} · {material.brand ?? 'Generic'} · {String((material.metadata as any)?.budgetBand ?? 'n/a')}</div>
              <button disabled={readonly} style={{ marginTop: 8 }} onClick={() => onAssign(material.id, material.name)}>Assign to primary_finish</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
