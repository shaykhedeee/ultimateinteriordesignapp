'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../lib/api';
import { FurniturePreview3D } from '../design3d/FurniturePreview3D';

type FurnitureItem = {
  key: string;
  label: string;
  category: string;
  styleTags: string[];
  trendTags: string[];
  roomTypes: string[];
  params: { widthMm?: number; heightMm?: number; depthMm?: number } & Record<string, unknown>;
  gltfAssetPath?: string;
  previewColor?: string;
  previewLabel?: string;
};

export function FurnitureCatalogPanel({
  roomType,
  onPlace,
  readonly,
}: {
  roomType?: string;
  onPlace: (item: FurnitureItem) => Promise<void>;
  readonly?: boolean;
}) {
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');

  useEffect(() => {
    const query = new URLSearchParams();
    if (category !== 'all') query.set('category', category);
    if (roomType) query.set('roomType', roomType);
    apiGet<FurnitureItem[]>(`/furniture-catalog${query.toString() ? `?${query.toString()}` : ''}`)
      .then((data) => {
        setItems(data);
        setSelectedKey((current) => current || data[0]?.key || '');
      })
      .catch(console.error);
  }, [category, roomType]);

  const selectedItem = useMemo(
    () => items.find((item) => item.key === selectedKey) ?? items[0] ?? null,
    [items, selectedKey]
  );

  return (
    <div className="panel">
      <h3>Furniture Catalog</h3>
      <div className="listMock">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="bed">Beds</option>
          <option value="sofa">Sofas</option>
          <option value="tv_unit">TV Units</option>
          <option value="dresser">Dressers</option>
          <option value="wardrobe">Wardrobes</option>
          <option value="mandir">Mandirs</option>
          <option value="study">Study</option>
        </select>

        {selectedItem ? (
          <FurniturePreview3D
            assetPath={selectedItem.gltfAssetPath}
            color={selectedItem.previewColor}
            widthMm={Number(selectedItem.params.widthMm ?? 1200)}
            heightMm={Number(selectedItem.params.heightMm ?? 900)}
            depthMm={Number(selectedItem.params.depthMm ?? 500)}
            label={selectedItem.label}
          />
        ) : null}

        <div className="rowMock">
          <strong>Selected Preview</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {selectedItem ? `${selectedItem.category} · ${selectedItem.previewLabel ?? 'Preview ready'}` : 'Choose a furniture item below.'}
          </div>
        </div>

        {items.map((item) => {
          const isSelected = selectedItem?.key === item.key;
          return (
            <div className="rowMock" key={item.key} style={{ borderColor: isSelected ? 'rgba(225,191,114,0.45)' : undefined }}>
              <strong>{item.label}</strong>
              <div className="muted">{item.category} · {item.styleTags.join(', ')}</div>
              <div className="muted">Trends: {item.trendTags.join(', ')}</div>
              <div className="muted">Dimensions: {item.params.widthMm} × {item.params.heightMm} × {item.params.depthMm} mm</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSelectedKey(item.key)}>Preview</button>
                <button disabled={readonly} type="button" onClick={() => onPlace(item)}>Place in 3D</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
