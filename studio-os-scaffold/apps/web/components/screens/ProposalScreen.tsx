'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; activeSceneVersionId?: string; staleFlags?: Record<string, boolean> };
type Proposal = { id: string; versionNumber: number; status: string; renderSetId?: string; drawingSetId?: string; pricingSetId?: string };

export function ProposalScreen() {
  const [project, setProject] = useState<any>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sceneVersion, setSceneVersion] = useState<any>(null);

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
    if (!selected) return;
    
    try {
      const projectData = await apiGet<any>(`/projects/${selected}`);
      setProject(projectData);
      
      const data = await apiGet<Proposal[]>(`/projects/${selected}/proposal-sets`);
      setProposals(data);

      if (projectData?.activeSceneVersionId) {
        const sceneData = await apiGet<any>(`/scenes/${projectData.activeSceneVersionId}`);
        setSceneVersion(sceneData);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    apiGet<any[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id);
      })
      .catch(console.error);
  }, []);

  async function createProposal() {
    if (!project?.activeSceneVersionId) return;
    await apiPost(`/projects/${project.id}/proposal-sets`, {
      sceneVersionId: project.activeSceneVersionId,
      sections: ['cover', 'summary', 'visuals', 'quote', 'signoff'],
    });
    await load(project.id);
  }

  async function regenerateProposal() {
    await createProposal();
  }

  function computeQuoteItems(sv: any) {
    if (!sv?.scene?.levels?.[0]?.modules) return [];
    const modules = sv.scene.levels[0].modules;
    
    return modules.map((mod: any) => {
      const { widthMm, heightMm } = mod.geometry.size;
      const wFt = widthMm / 304.8;
      const hFt = heightMm / 304.8;
      const sqft = (widthMm * heightMm) / 92903.04;
      
      let rate = 1450;
      let rateType = 'SQFT';
      let material = 'BWR Plywood (IS:303)';
      let finish = '1.0mm Matte Laminate (Virgo/Century)';
      let hardware = 'Hettich soft-close hinges & magnetic catchers';

      const type = mod.moduleType;

      if (type === 'sofa_l_shape_lounge') {
        rate = 32000;
        rateType = 'LUMPSUM';
        material = 'Solid Sal wood frame & 40-density Sleepwell foam';
        finish = 'Premium stain-resistant fabric (allowance ₹600/mtr)';
        hardware = 'N/A';
      } else if (type === 'sofa_three_seater_linear') {
        rate = 24000;
        rateType = 'LUMPSUM';
        material = 'Solid Sal wood frame with cushioned seat and backrest';
        finish = 'Polished wood legs & premium fabric';
        hardware = 'N/A';
      } else if (type === 'tv_unit_fluted_backlit') {
        rate = 1650;
        material = 'BWR Plywood & Teak wood framing';
        finish = 'Teak Veneer Polish & LED CNC backlit board';
        hardware = 'Hettich soft-close runners (Telescopic)';
      } else if (type === 'tv_unit_minimal_wood') {
        rate = 1450;
        material = 'BWR Plywood carcass';
        finish = '1.0mm Matte Laminate';
        hardware = 'Hettich soft-close hinges';
      } else if (type === 'tv_unit_marble_floating') {
        rate = 1750;
        material = 'BWR Plywood carcass & PVC marble sheet';
        finish = '1.2mm High-Gloss Acrylic';
        hardware = 'Hettich soft-close runners';
      } else if (type === 'tv_unit_compact_apartment') {
        rate = 1100;
        material = 'BWR Plywood';
        finish = 'Laminated textured finish';
        hardware = 'Standard hinges';
      } else if (type.includes('wardrobe_four_door')) {
        rate = 1650;
        material = 'BWR Plywood (Grade IS:303)';
        finish = '1.0mm Suede Laminate & Premium fabric upholstery';
        hardware = 'Hettich sliding door fittings & soft-close';
      } else if (type.includes('wardrobe_three_door')) {
        rate = 1450;
        material = 'BWR Plywood';
        finish = '1.0mm Matte Laminate';
        hardware = 'Hettich soft-close hinges';
      } else if (type.includes('crockery')) {
        rate = 1650;
        material = 'BWR Plywood & Aluminium profiles';
        finish = 'Frosted/Clear glass with inner LED strips';
        hardware = 'Hettich profile hinges';
      } else if (type.includes('mandir')) {
        rate = 1750;
        material = 'BWR Plywood & Teak frame';
        finish = 'CNC backlit design with veneer polish';
        hardware = 'Brass handles';
      } else if (type.includes('study')) {
        rate = 1100;
        material = 'BWR Plywood';
        finish = 'Laminated matte finish';
        hardware = 'Standard runners';
      } else if (type.includes('dresser')) {
        rate = 1450;
        material = 'BWR Plywood with premium mirror';
        finish = '1.0mm Laminate';
        hardware = 'Soft-close drawer runners';
      }

      const qty = rateType === 'SQFT' ? Math.round(sqft * 100) / 100 : 1;
      const amount = Math.round(qty * rate);

      return {
        id: mod.moduleId,
        name: mod.name || mod.moduleType,
        dimensions: `${Math.round(wFt * 10) / 10} x ${Math.round(hFt * 10) / 10} ft`,
        quantity: qty,
        rate,
        rateType,
        unit: rateType === 'SQFT' ? 'Sqft' : 'Nos',
        material,
        finish,
        hardware,
        amount
      };
    });
  }

  const quoteItems = computeQuoteItems(sceneVersion);
  const subtotal = quoteItems.reduce((sum: number, item: any) => sum + item.amount, 0);
  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {project?.staleFlags?.pricing ? <StaleNotice label="Proposal pricing context is stale. Regenerate quote/proposal after scene or material changes." /> : null}
      
      <div className="workspace3" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Proposal Packages">
            <div className="listMock">
              <button onClick={createProposal}>Create Proposal Package</button>
              <button onClick={regenerateProposal}>Regenerate Proposal</button>
              {proposals.map((proposal) => (
                <div className="rowMock" key={proposal.id}>
                  Proposal v{proposal.versionNumber} · {proposal.status}
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="State">
            <div className="listMock">
              <div className="rowMock">Scene Version: {project?.activeSceneVersionId ?? 'n/a'}</div>
              <div className="rowMock">Stale Pricing Flag: {project?.staleFlags?.pricing ? 'Yes' : 'No'}</div>
            </div>
          </Panel>
          <Panel title="Print Actions">
            <div className="listMock">
              <button onClick={() => window.print()} style={{ backgroundColor: 'var(--gold)', color: '#000', fontWeight: 'bold' }}>
                Print / Save PDF
              </button>
            </div>
          </Panel>
        </div>

        <div className="quotePrintArea" style={{ background: '#111113', border: '1px solid var(--border)', borderRadius: 8, padding: 24, color: '#f0eee8' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--gold)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--gold)', letterSpacing: '0.05em' }}>SPACIOUS VENTURE</h2>
              <span className="muted" style={{ fontSize: 12 }}>Factory-Direct Interior Studio</span>
              <div style={{ fontSize: 11, color: '#8a8899', marginTop: 4 }}>
                Sulikunte Road, Sarjapur, Bengaluru, Karnataka 560099<br />
                Phone: +91 95385 36950 | info@spaciousventure.com
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>FACTORY-DIRECT ESTIMATE</div>
              <div>Quote No: QT-2026-{Math.floor(1000 + Math.random() * 9000)}</div>
              <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
              <div>GSTIN: 29AAGCS9538Q1Z2</div>
            </div>
          </div>

          {/* Client Details */}
          <div style={{ background: '#1e1e24', borderRadius: 6, padding: 12, marginBottom: 20, fontSize: 12, borderLeft: '3px solid var(--gold)' }}>
            <strong>Client Name</strong>: {project?.name || 'Valued Customer'}<br />
            <strong>Project Site</strong>: {project?.siteCity || 'Bengaluru'}<br />
            <strong>Scope</strong>: Modular Interior Woodwork (Factory CNC Cut)
          </div>

          {/* Quotation Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#1e1e24', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Item Description & Specs</th>
                <th style={{ padding: 8 }}>Dimensions</th>
                <th style={{ padding: 8 }}>Qty</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, textAlign: 'center', color: '#8a8899' }}>
                    No modular layout placed. Place modules in the Design Studio to generate automatic quotation.
                  </td>
                </tr>
              ) : (
                quoteItems.map((item: any, idx: number) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: 8 }}>
                      <strong style={{ color: 'var(--gold)' }}>{idx + 1}. {item.name}</strong>
                      <div style={{ fontSize: 10, color: '#8a8899', marginTop: 2 }}>
                        Core: {item.material} | Finish: {item.finish} | Hardware: {item.hardware}
                      </div>
                    </td>
                    <td style={{ padding: 8 }}>{item.dimensions}</td>
                    <td style={{ padding: 8 }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{item.rate.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{item.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Summary Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <div style={{ width: 280, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span>GST (18%)</span>
                <span>₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', color: 'var(--gold)', fontSize: 15 }}>
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Milestones & Bank Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div>
              <strong style={{ color: 'var(--gold)' }}>Payment Milestones</strong>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>1. Booking Advance (10%): ₹{Math.round(grandTotal * 0.10).toLocaleString('en-IN')}</div>
                <div>2. Design Finalized (50%): ₹{Math.round(grandTotal * 0.50).toLocaleString('en-IN')}</div>
                <div>3. Material Dispatch (35%): ₹{Math.round(grandTotal * 0.35).toLocaleString('en-IN')}</div>
                <div>4. Final Handover (5%): ₹{Math.round(grandTotal * 0.05).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--gold)' }}>HDFC Bank Details</strong>
              <div style={{ marginTop: 6 }}>
                Account Name: SPACIOUS VENTURE INTERIOR DESIGN STUDIO<br />
                A/C No: 50200095385369 | IFSC: HDFC0001953<br />
                UPI ID: spaciousventure@hdfcbank
              </div>
            </div>
          </div>

          {/* Specs Checklist */}
          <div style={{ marginTop: 20, fontSize: 10, color: '#8a8899', borderTop: '1px dotted var(--border)', paddingTop: 12 }}>
            <strong>Materials & Standards</strong>: BWR Plywood carcass (Century/Greenply) | 2.0mm Hot-Melt PVC Edge banding | Hettich German soft-close hinges.
          </div>
        </div>
      </div>
    </div>
  );
}
