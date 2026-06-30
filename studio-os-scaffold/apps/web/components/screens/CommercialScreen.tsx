'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; name: string; activeSceneVersionId?: string };
type BudgetProfile = { id: string; budgetBand: string; targetBudget?: number; maxBudget?: number };
type EstimateSet = { id: string; estimateType: string; status: string; totals?: { grandTotal?: number } };
type PaymentPlan = { id: string; name: string; totalContractValue: number; status: string };
type Invoice = { id: string; invoiceNumber: string; grandTotal: number; status: string };
type Payment = { id: string; amount: number; paymentMethod: string; paymentDate: string; status: string };
type Variation = { id: string; variationCode: string; description: string; costDelta: number; status: string };
type PurchaseOrder = { id: string; poNumber: string; vendorName: string; category: string; grandTotal: number; status: string; isLocked?: boolean };

type BomSummary = {
  totalModules: number;
  totalCarcassBoardAreaSqft: number;
  totalShutterAreaSqft: number;
  totalEdgeBandRm: number;
  totalHardwareUnits: number;
  totalEstimatedPanels: number;
};
type BomPreview = {
  sceneVersionId: string;
  projectName?: string;
  summary: BomSummary;
};

export function CommercialScreen({ title }: { title: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [budgets, setBudgets] = useState<BudgetProfile[]>([]);
  const [estimates, setEstimates] = useState<EstimateSet[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bomPreview, setBomPreview] = useState<BomPreview | null>(null);

  const [targetBudget, setTargetBudget] = useState('850000');
  const [maxBudget, setMaxBudget] = useState('1000000');
  const [budgetBand, setBudgetBand] = useState('standard');
  const [variationDescription, setVariationDescription] = useState('Add false ceiling in living room');
  const [variationCost, setVariationCost] = useState('45000');
  const [invoiceAmount, setInvoiceAmount] = useState('150000');
  const [poVendor, setPoVendor] = useState('CenturyPly India');
  const [poCategory, setPoCategory] = useState('plywood');

  async function load(projectId?: string, sceneVersionId?: string) {
    const selected = projectId ?? project?.id;
    const activeSceneVersionId = sceneVersionId ?? project?.activeSceneVersionId;
    if (!selected) return;
    const [budgetData, estimateData, paymentPlanData, invoiceData, paymentData, variationData, purchaseOrderData] = await Promise.all([
      apiGet<BudgetProfile[]>(`/projects/${selected}/budget-profiles`),
      apiGet<EstimateSet[]>(`/projects/${selected}/estimate-sets`),
      apiGet<PaymentPlan[]>(`/projects/${selected}/payment-plans`),
      apiGet<Invoice[]>(`/projects/${selected}/invoices`),
      apiGet<Payment[]>(`/projects/${selected}/payments`),
      apiGet<Variation[]>(`/projects/${selected}/variation-orders`),
      apiGet<PurchaseOrder[]>(`/projects/${selected}/purchase-orders`),
    ]);
    setBudgets(budgetData);
    setEstimates(estimateData);
    setPaymentPlans(paymentPlanData);
    setInvoices(invoiceData);
    setPayments(paymentData);
    setVariations(variationData);
    setPurchaseOrders(purchaseOrderData);

    if (activeSceneVersionId) {
      const bom = await apiGet<BomPreview>(`/scenes/${activeSceneVersionId}/bom-preview`);
      setBomPreview(bom);
    }
  }

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (first) await load(first.id, first.activeSceneVersionId);
      })
      .catch(console.error);
  }, []);

  async function createBudgetProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    await apiPost(`/projects/${project.id}/budget-profiles`, {
      budgetBand,
      targetBudget: Number(targetBudget),
      maxBudget: Number(maxBudget),
      scopeType: 'turnkey',
      financingNeeded: false,
      priorities: { kitchen: 10, master_bedroom: 9, living_room: 8 },
      preferences: { maintenance: 'low' },
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function createEstimate() {
    if (!project) return;
    const currentBudget = budgets[0];
    
    // Use geometry derived BOQ totals if available
    const plywoodCost = (bomPreview?.summary.totalEstimatedPanels ?? 12) * 4200;
    const hardwareCost = (bomPreview?.summary.totalHardwareUnits ?? 48) * 350;
    const edgeBandCost = (bomPreview?.summary.totalEdgeBandRm ?? 85) * 95;
    const installationLot = 45000;
    const baseValue = plywoodCost + hardwareCost + edgeBandCost + installationLot;

    await apiPost(`/projects/${project.id}/estimate-sets`, {
      budgetProfileId: currentBudget?.id,
      estimateType: 'budget_fit',
      assumptions: { generatedFrom: 'bom_geometry_takeoff' },
      items: [
        {
          lineCode: 'BOQ-PLY-01',
          category: 'plywood',
          description: `Geometry-derived Marine Grade Plywood (${bomPreview?.summary.totalEstimatedPanels ?? 12} sheets)`,
          quantity: bomPreview?.summary.totalEstimatedPanels ?? 12,
          uom: 'sheet',
          baseRate: 4200,
          marginRate: 0.12,
          lineTotal: plywoodCost * 1.12,
        },
        {
          lineCode: 'BOQ-HDW-01',
          category: 'hardware',
          description: `Hinges, Runners & Handles (${bomPreview?.summary.totalHardwareUnits ?? 48} units)`,
          quantity: bomPreview?.summary.totalHardwareUnits ?? 48,
          uom: 'pc',
          baseRate: 350,
          marginRate: 0.15,
          lineTotal: hardwareCost * 1.15,
        },
        {
          lineCode: 'BOQ-EDG-01',
          category: 'laminate',
          description: `Edge Banding Roll (${bomPreview?.summary.totalEdgeBandRm ?? 85} running meters)`,
          quantity: bomPreview?.summary.totalEdgeBandRm ?? 85,
          uom: 'rm',
          baseRate: 95,
          marginRate: 0.15,
          lineTotal: edgeBandCost * 1.15,
        },
      ],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function createPaymentPlan() {
    if (!project) return;
    const currentEstimate = estimates[0];
    if (!currentEstimate?.id) return;
    await apiPost(`/estimate-sets/${currentEstimate.id}/payment-plan`, {
      estimateSetId: currentEstimate.id,
      name: 'Standard Milestone Plan',
      totalContractValue: currentEstimate?.totals?.grandTotal ?? 500000,
      milestones: [
        { milestoneKey: 'booking', milestoneLabel: 'Booking (10%)', dueType: 'percent', percentOfTotal: 0.1, sequenceNo: 1 },
        { milestoneKey: 'design_signoff', milestoneLabel: 'Design Sign-off (40%)', dueType: 'percent', percentOfTotal: 0.4, sequenceNo: 2 },
        { milestoneKey: 'production_start', milestoneLabel: 'Production Start (40%)', dueType: 'percent', percentOfTotal: 0.4, sequenceNo: 3 },
        { milestoneKey: 'installation', milestoneLabel: 'Handover/Installation (10%)', dueType: 'percent', percentOfTotal: 0.1, sequenceNo: 4 },
      ],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function createInvoice() {
    if (!project) return;
    const currentPlan = paymentPlans[0];
    if (!currentPlan?.id) return;
    await apiPost(`/payment-plans/${currentPlan.id}/invoices`, {
      paymentPlanId: currentPlan.id,
      invoiceType: 'milestone',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      lineItems: [
        {
          category: 'modular_unit',
          description: 'Milestone billing',
          quantity: 1,
          uom: 'lot',
          taxableValue: Number(invoiceAmount),
          taxRate: 0,
          taxAmount: 0,
          lineTotal: Number(invoiceAmount),
        },
      ],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function recordPayment() {
    if (!project) return;
    const invoice = invoices[0];
    if (!invoice?.id) return;
    await apiPost(`/projects/${project.id}/payments`, {
      amount: 50000,
      paymentMethod: 'upi',
      paymentDate: new Date().toISOString().split('T')[0],
      allocations: [{ invoiceId: invoice.id, allocatedAmount: 50000 }],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function createVariation(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    await apiPost(`/projects/${project.id}/variation-orders`, {
      reasonCategory: 'scope_addition',
      description: variationDescription,
      costDelta: Number(variationCost),
      timelineDeltaDays: 3,
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function createPurchaseOrder() {
    if (!project) return;
    
    let itemsCount = 10;
    let unitRate = 4200;
    let label = 'Plywood sheets';

    if (poCategory === 'hardware') {
      itemsCount = bomPreview?.summary.totalHardwareUnits ?? 48;
      unitRate = 220;
      label = 'Soft-close hinges & channels';
    } else if (poCategory === 'laminate') {
      itemsCount = bomPreview?.summary.totalEdgeBandRm ?? 85;
      unitRate = 60;
      label = 'Edge band roll & adhesive';
    } else {
      itemsCount = bomPreview?.summary.totalEstimatedPanels ?? 12;
      unitRate = 3800;
      label = 'MR/BWP Core Plywood Sheets';
    }

    await apiPost(`/projects/${project.id}/purchase-orders`, {
      vendorName: poVendor,
      category: poCategory,
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      lines: [
        {
          itemDescription: label,
          quantity: itemsCount,
          uom: poCategory === 'plywood' ? 'sheet' : poCategory === 'hardware' ? 'pc' : 'rm',
          unitRate,
          lineTotal: itemsCount * unitRate,
        },
      ],
    });
    await load(project.id, project.activeSceneVersionId);
  }

  async function togglePoLock(poId: string, currentLocked: boolean) {
    // Call custom lock update for the purchase order
    await apiPatch(`/purchase-orders/${poId}`, { isLocked: !currentLocked });
    await load(project?.id, project?.activeSceneVersionId);
  }

  const currentBudget = budgets[0];
  const currentEstimate = estimates[0];

  return (
    <>
      <Panel title={title}>
        <div className="workspace3">
          {/* Budget Profile Section */}
          <div className="panel">
            <h3>Budget Profile & Scope</h3>
            <div className="listMock">
              <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
              <div className="rowMock">Budget Band: {currentBudget?.budgetBand.toUpperCase() ?? 'n/a'}</div>
              <div className="rowMock">Target Budget: ₹{currentBudget?.targetBudget?.toLocaleString?.() ?? 'n/a'}</div>
              <div className="rowMock">Max Budget: ₹{currentBudget?.maxBudget?.toLocaleString?.() ?? 'n/a'}</div>
            </div>
            <form onSubmit={createBudgetProfile} className="listMock" style={{ marginTop: 12 }}>
              <select value={budgetBand} onChange={(e) => setBudgetBand(e.target.value)}>
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
              <input value={targetBudget} onChange={(e) => setTargetBudget(e.target.value)} placeholder="Target budget" />
              <input value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Max budget" />
              <button type="submit">Save Budget Profile</button>
            </form>
          </div>

          {/* Geometry-Derived BOQ Estimation Section */}
          <div className="panel">
            <h3>Geometry-Derived BOQ Estimation</h3>
            <div className="listMock">
              <div className="rowMock">Current Estimate: {currentEstimate?.estimateType.toUpperCase() ?? 'n/a'}</div>
              <div className="rowMock">Estimate Status: {currentEstimate?.status ?? 'n/a'}</div>
              <div className="rowMock" style={{ fontSize: 15, color: '#e1bf72', fontWeight: 600 }}>Grand Total: ₹{currentEstimate?.totals?.grandTotal?.toLocaleString?.() ?? 'n/a'}</div>
            </div>
            
            {bomPreview && (
              <div style={{ marginTop: 12, padding: 8, background: '#121615', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>GEOMETRY TAKEOFF SUMMARY</div>
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Core Panels: {bomPreview.summary.totalEstimatedPanels} sheets (~₹{(bomPreview.summary.totalEstimatedPanels * 4200).toLocaleString()})</div>
                  <div>Hardware Elements: {bomPreview.summary.totalHardwareUnits} units (~₹{(bomPreview.summary.totalHardwareUnits * 350).toLocaleString()})</div>
                  <div>Edge Banding: {bomPreview.summary.totalEdgeBandRm} rm (~₹{(bomPreview.summary.totalEdgeBandRm * 95).toLocaleString()})</div>
                </div>
              </div>
            )}

            <div className="listMock" style={{ marginTop: 12 }}>
              <button onClick={createEstimate} style={{ backgroundColor: '#7dbb74', color: '#0d1110', fontWeight: 'bold' }}>Create Geometry-Derived Estimate</button>
              <button onClick={createPaymentPlan}>Configure Milestone Payments</button>
              <input value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="Invoice amount" />
              <button onClick={createInvoice}>Generate Milestone Invoice</button>
              <button onClick={recordPayment}>Record Sample Payment</button>
            </div>
            
            <div className="listMock" style={{ marginTop: 12 }}>
              {invoices.map((invoice) => (
                <div className="rowMock" key={invoice.id}>{invoice.invoiceNumber} · ₹{invoice.grandTotal.toLocaleString()} · {invoice.status}</div>
              ))}
            </div>
          </div>

          {/* Procurement Packages & Variation Orders */}
          <div className="panel">
            <h3>Procurement & Variation Orders</h3>
            <form onSubmit={createVariation} className="listMock">
              <input value={variationDescription} onChange={(e) => setVariationDescription(e.target.value)} placeholder="Variation description" />
              <input value={variationCost} onChange={(e) => setVariationCost(e.target.value)} placeholder="Variation cost" />
              <button type="submit">Create Variation Order</button>
            </form>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0 0', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: '#888' }}>CREATE PROCUREMENT PURCHASE ORDER</span>
              <div className="listMock" style={{ marginTop: 8 }}>
                <input value={poVendor} onChange={(e) => setPoVendor(e.target.value)} placeholder="Vendor name" />
                <select value={poCategory} onChange={(e) => setPoCategory(e.target.value)}>
                  <option value="plywood">CenturyPly India (Plywood Core)</option>
                  <option value="hardware">Hafele / Ebco (Hardware Fittings)</option>
                  <option value="laminate">Merino Laminates (Finishes)</option>
                </select>
                <button type="button" onClick={createPurchaseOrder}>Create Purchase Order</button>
              </div>
            </div>

            <div className="listMock" style={{ marginTop: 12 }}>
              {variations.map((variation) => (
                <div className="rowMock" key={variation.id}>
                  {variation.variationCode} · ₹{variation.costDelta.toLocaleString()} · {variation.status}
                </div>
              ))}
              
              <div style={{ fontSize: 11, color: '#888', marginTop: 12, marginBottom: 4 }}>PURCHASE ORDERS & PRODUCTION FREEZE STATUS</div>
              {purchaseOrders.map((po) => (
                <div className="rowMock" key={po.id} style={{ opacity: po.isLocked ? 0.75 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{po.poNumber} · {po.vendorName} · ₹{po.grandTotal.toLocaleString()}</span>
                    <button
                      onClick={() => togglePoLock(po.id, Boolean(po.isLocked))}
                      style={{
                        padding: '2px 6px',
                        fontSize: 10,
                        backgroundColor: po.isLocked ? '#ff6f6f' : '#7dbb74',
                        color: '#0d1110',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {po.isLocked ? '🔒 LOCKED' : '🔓 FREEZE'}
                    </button>
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Category: {po.category.toUpperCase()} · Status: {po.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
