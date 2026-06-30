'use client';

import { useState } from 'react';
import { useDesignEditorStore, useSelectedModule, useSelectedRoom } from '../../stores/designEditorStore';

type Props = {
  onCommitModuleParams: (moduleId: string, params: Record<string, unknown>) => Promise<void>;
  onAssignMaterial: (moduleId: string, slot: string, material: string) => Promise<void>;
  onRemoveModule: (moduleId: string) => Promise<void>;
  onDuplicateModule: (moduleId: string) => Promise<void>;
  readonly?: boolean;
};

export function InspectorPanel({ onCommitModuleParams, onAssignMaterial, onRemoveModule, onDuplicateModule, readonly }: Props) {
  const selection = useDesignEditorStore((state) => state.selection);
  const module = useSelectedModule();
  const room = useSelectedRoom();
  const [materialName, setMaterialName] = useState('walnut_veneer');

  if (selection.entityType === 'module' && module) {
    return (
      <div className="panel">
        <h3>Module Inspector</h3>
        <div className="listMock">
          <div className="rowMock">Name: {module.name}</div>
          <div className="rowMock">Type: {module.moduleType}</div>
          <div className="rowMock">Room: {module.roomRef}</div>
          <label>
            Width (mm)
            <input disabled={readonly} defaultValue={module.geometry.size.widthMm} onBlur={(e) => onCommitModuleParams(module.moduleId, { widthMm: Number(e.target.value) })} />
          </label>
          <label>
            Height (mm)
            <input disabled={readonly} defaultValue={module.geometry.size.heightMm} onBlur={(e) => onCommitModuleParams(module.moduleId, { heightMm: Number(e.target.value) })} />
          </label>
          <label>
            Depth (mm)
            <input disabled={readonly} defaultValue={module.geometry.size.depthMm} onBlur={(e) => onCommitModuleParams(module.moduleId, { depthMm: Number(e.target.value) })} />
          </label>
          <label>
            Material Slot: primary_finish
            <input disabled={readonly} value={materialName} onChange={(e) => setMaterialName(e.target.value)} />
          </label>
          <button disabled={readonly} onClick={() => onAssignMaterial(module.moduleId, 'primary_finish', materialName)}>Assign Material</button>
          <button disabled={readonly} onClick={() => onDuplicateModule(module.moduleId)}>Duplicate Module</button>
          <button disabled={readonly} onClick={() => {
            if (typeof window !== 'undefined' && !window.confirm(`Remove ${module.name}?`)) return;
            onRemoveModule(module.moduleId);
          }}>Remove Module</button>
        </div>
      </div>
    );
  }

  if (selection.entityType === 'room' && room) {
    return (
      <div className="panel">
        <h3>Room Inspector</h3>
        <div className="listMock">
          <div className="rowMock">Name: {room.name}</div>
          <div className="rowMock">Type: {room.roomType}</div>
          <div className="rowMock">Height: {room.heightMm} mm</div>
          <div className="rowMock">Modules: {room.modules.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Inspector</h3>
      <div className="rowMock">Select a room, wall, or module to edit details.</div>
    </div>
  );
}
