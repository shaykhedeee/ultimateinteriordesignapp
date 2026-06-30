'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string; budgetBand?: string; siteCity?: string };
type Material = {
  id: string;
  category: string;
  subcategory?: string;
  code?: string;
  name: string;
  brand?: string;
  metadata?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  isActive: boolean;
};
type Recommendation = { material: Material; score: number; reasons: string[] };

export function MaterialsCatalogScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [category, setCategory] = useState('laminate');
  const [roomType, setRoomType] = useState('living_room');
  const [name, setName] = useState('Warm Walnut Laminate');
  const [brand, setBrand] = useState('PremiumWood');
  const [rate, setRate] = useState('4200');

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    const projectData = await apiGet<Project>(`/projects/${selected}`);
    const [materialData, recommendationData] = await Promise.all([
      apiGet<Material[]>(`/material-catalog?budgetBand=${projectData?.budgetBand ?? 'premium'}&category=${category}&roomType=${roomType}`),
      apiGet<{ recommendations: Recommendation[] }>(`/projects/${selected}/material-recommendations?roomType=${roomType}&category=${category}`),
    ]);
    setProject(projectData);
    setMaterials(materialData);
    setRecommendations(recommendationData.recommendations);
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (project?.id) {
      load(project.id).catch(console.error);
    }
  }, [project?.id, category, roomType]);

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault();
    await apiPost('/material-catalog', {
      projectId: project?.id,
      category,
      name,
      brand,
      metadata: { budgetBand: project?.budgetBand ?? 'premium', roomTypes: ['living_room', 'kitchen'] },
      pricing: { unit: 'sheet', rate: Number(rate) },
    });
    await load(project?.id);
  }

  async function toggleActive(material: Material) {
    await apiPatch(`/material-catalog/${material.id}`, {
      projectId: project?.id,
      isActive: !material.isActive,
    });
    await load(project?.id);
  }

  return (
    <div className="workspace3">
      <Panel title="Create / Update Material">
        <form onSubmit={createMaterial} className="listMock">
          <div className="rowMock">Project Budget Band: {project?.budgetBand ?? 'n/a'}</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="laminate">Laminate</option>
            <option value="board">Board</option>
            <option value="veneer">Veneer</option>
            <option value="hardware">Hardware</option>
          </select>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="living_room">Living Room</option>
            <option value="kitchen">Kitchen</option>
            <option value="master_bedroom">Master Bedroom</option>
            <option value="utility">Utility</option>
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Material name" />
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" />
          <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" />
          <button type="submit">Add Material</button>
        </form>
      </Panel>
      <Panel title="Materials Catalog">
        <div className="listMock">
          {materials.map((material) => (
            <div className="rowMock" key={material.id}>
              <strong>{material.name}</strong>
              <div className="muted">{material.category} · {material.brand} · ₹{Number((material.pricing as any)?.rate ?? 0).toLocaleString()}</div>
              <div className="muted">Budget band: {String((material.metadata as any)?.budgetBand ?? 'n/a')}</div>
              <button style={{ marginTop: 8 }} onClick={() => toggleActive(material)}>{material.isActive ? 'Deactivate' : 'Activate'}</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Recommended Materials">
        <div className="listMock">
          <div className="rowMock">City Climate: {project?.siteCity ?? 'n/a'} · Budget: {project?.budgetBand ?? 'n/a'} · Room: {roomType}</div>
          {recommendations.map((item) => (
            <div className="rowMock" key={item.material.id}>
              <strong>{item.material.name}</strong>
              <div className="muted">Score: {item.score}</div>
              <div className="muted">Reasons: {item.reasons.join(', ') || '—'}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Why This Matters">
        <div className="listMock">
          <div className="rowMock">Materials must be budget-filtered and room-aware.</div>
          <div className="rowMock">Clients need rapid finish comparison, similar to top visualization-first competitors.</div>
          <div className="rowMock">Rates must tie directly into estimate and BOQ generation.</div>
        </div>
      </Panel>
    </div>
  );
}
