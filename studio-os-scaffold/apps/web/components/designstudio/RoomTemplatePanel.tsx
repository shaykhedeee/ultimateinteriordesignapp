'use client';

import { useSelectedRoom } from '../../stores/designEditorStore';
import { getRoomTemplates } from '../../lib/room-templates';

export function RoomTemplatePanel({
  onApply,
  readonly,
}: {
  onApply: (templateKey: string) => Promise<void>;
  readonly?: boolean;
}) {
  const room = useSelectedRoom();
  const templates = getRoomTemplates(room?.roomType);

  return (
    <div className="panel">
      <h3>Room Template Engine</h3>
      {!room ? (
        <div className="rowMock">Select a room to apply a room template.</div>
      ) : (
        <div className="listMock">
          <div className="rowMock">Room: {room.name} · {room.roomType}</div>
          {templates.map((template) => (
            <div className="rowMock" key={template.key}>
              <strong>{template.label}</strong>
              <div className="muted">Modules: {template.modules.map((m) => m.key).join(', ')}</div>
              <button disabled={readonly} style={{ marginTop: 8 }} onClick={() => onApply(template.key)}>Apply Template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
