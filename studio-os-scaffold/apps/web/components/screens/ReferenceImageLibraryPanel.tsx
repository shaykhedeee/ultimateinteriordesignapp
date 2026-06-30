'use client';

import { useState } from 'react';

type ReferenceEntry = { roomRef: string; imageLabel: string; styleNote?: string; imageUrl?: string };

export function ReferenceImageLibraryPanel({
  entries,
  onAdd,
}: {
  entries: ReferenceEntry[];
  onAdd: (entry: ReferenceEntry) => Promise<void>;
}) {
  const [roomRef, setRoomRef] = useState('room_living_1');
  const [imageLabel, setImageLabel] = useState('Warm modern living reference');
  const [styleNote, setStyleNote] = useState('Focus on walnut, curved sofa, layered lighting');
  const [imageUrl, setImageUrl] = useState('https://example.com/reference.jpg');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onAdd({ roomRef, imageLabel, styleNote, imageUrl });
  }

  return (
    <div className="panel">
      <h3>Reference Image Library</h3>
      <form onSubmit={submit} className="listMock" style={{ marginBottom: 12 }}>
        <input value={roomRef} onChange={(e) => setRoomRef(e.target.value)} placeholder="Room ref" />
        <input value={imageLabel} onChange={(e) => setImageLabel(e.target.value)} placeholder="Image label" />
        <input value={styleNote} onChange={(e) => setStyleNote(e.target.value)} placeholder="Style note" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Reference image URL" />
        <button type="submit">Add Reference</button>
      </form>
      <div className="listMock">
        {entries.map((entry, index) => (
          <div className="rowMock" key={`${entry.roomRef}-${index}`}>
            <strong>{entry.imageLabel}</strong>
            <div className="muted">Room: {entry.roomRef}</div>
            <div className="muted">{entry.styleNote ?? '—'}</div>
            <div className="muted">{entry.imageUrl ?? 'no url'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
