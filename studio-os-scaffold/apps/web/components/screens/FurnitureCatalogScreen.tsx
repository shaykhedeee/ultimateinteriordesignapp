'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type FurnitureItem = {
  key: string;
  label: string;
  category: string;
  styleTags: string[];
  trendTags: string[];
  roomTypes: string[];
  params: Record<string, unknown>;
};

export function FurnitureCatalogScreen() {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [styleTag, setStyleTag] = useState('all');
  const [trendTag, setTrendTag] = useState('all');

  useEffect(() => {
    const search = new URLSearchParams();
    if (category !== 'all') search.set('category', category);
    if (query) search.set('query', query);
    if (styleTag !== 'all') search.set('styleTag', styleTag);
    if (trendTag !== 'all') search.set('trendTag', trendTag);
    apiGet<FurnitureItem[]>(`/furniture-catalog${search.toString() ? `?${search.toString()}` : ''}`)
      .then(setItems)
      .catch(console.error);
  }, [category, query, styleTag, trendTag]);

  const allStyleTags = useMemo(() => Array.from(new Set(items.flatMap((item) => item.styleTags))), [items]);
  const allTrendTags = useMemo(() => Array.from(new Set(items.flatMap((item) => item.trendTags))), [items]);

  return (
    <div className="workspace3">
      <Panel title="Catalog Filters">
        <div className="listMock">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search beds, sofas, wardrobes..." />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="bed">Beds</option>
            <option value="sofa">Sofas</option>
            <option value="tv_unit">TV Units</option>
            <option value="dresser">Dressers</option>
            <option value="wardrobe">Wardrobes</option>
            <option value="mandir">Mandirs</option>
            <option value="study">Study</option>
            <option value="storage">Storage</option>
          </select>
          <select value={styleTag} onChange={(e) => setStyleTag(e.target.value)}>
            <option value="all">All Styles</option>
            {allStyleTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select value={trendTag} onChange={(e) => setTrendTag(e.target.value)}>
            <option value="all">All Trends</option>
            {allTrendTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </Panel>
      <Panel title="Furniture / Object Catalog">
        <div className="listMock">
          {items.map((item) => (
            <div key={item.key} className="rowMock">
              <strong>{item.label}</strong>
              <div className="muted">{item.category}</div>
              <div className="muted">Styles: {item.styleTags.join(', ')}</div>
              <div className="muted">Trends: {item.trendTags.join(', ')}</div>
              <div className="muted">Rooms: {item.roomTypes.join(', ')}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Catalog Purpose">
        <div className="listMock">
          <div className="rowMock">This catalog is intended to seed design-grade objects: beds, sofas, TV units, dressers, Aristo wardrobes, laminate wardrobes, mandirs, and room support furniture.</div>
          <div className="rowMock">Next step: connect these catalog objects to richer preview assets and purchasable vendor/product records.</div>
        </div>
      </Panel>
    </div>
  );
}
