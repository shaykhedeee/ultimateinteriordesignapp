'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';
import { StaleNotice } from '../primitives/StaleNotice';

type Project = { id: string; name: string };
type BudgetProfile = { id: string; budgetBand: string; targetBudget?: number; maxBudget?: number };
type EstimateSet = { id: string; estimateType: string; status: string; totals?: { grandTotal?: number } };
type PaymentPlan = { id: string; name: string; totalContractValue: number; status: string };
type Invoice = { id: string; invoiceNumber: string; grandTotal: number; status: string };
type Payment = { id: string; amount: number; paymentMethod: string; paymentDate: string; status: string };
type Variation = { id: string; variationCode: string; description: string; costDelta: number; status: string };
type PurchaseOrder = { id: string; poNumber: string; vendorName: string; grandTotal: number; status: string };

export function CommercialScreen({ title }: { title: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [budgets, setBudgets] = useState<BudgetProfile[]>([]);
  const [estimates, setEstimates] = useState<EstimateSet[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [targetBudget, setTargetBudget] = useState('850000');
  const [maxBudget, setMaxBudget] = useState('1000000');
  const [budgetBand, setBudgetBand] = useState('standard');
  const [variationDescription, setVariationDescription] = useState('Add false ceiling in living room');
  const [variationCost, setVariationCost] = useState('45000');
  const [invoiceAmount, setInvoiceAmount] = useState('150000');
  const [poVendor, setPoVendor] = useState('Premium Laminates Vendor');

  async function load(projectId?: string) {
    const selected = projectId ?? project?.id;
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
    await load(project.id);
  }

  async function createEstimate() {
    if (!project) return;
    const currentBudget = budgets[0];
    await apiPost(`/projects/${project.id}/estimate-sets`, {
      budgetProfileId: currentBudget?.id,
      estimateType: 'budget_fit',
      assumptions: { generatedFrom: 'ui_mock' },
      items: [
        {
          lineCode: 'EST-KIT-001',
          category: 'modular_unit',
          description: 'Kitchen core package',
          quantity: 1,
          uom: 'lot',
          baseRate: 225000,
          marginRate: 0.15,
          lineTotal: 258750,
        },
      ],
    });
    await load(project.id);
  }

  async function createPaymentPlan() {
    if (!project) return;
    const currentEstimate = estimates[0];
    if (!currentEstimate?.id) return;
    await apiPost(`/estimate-sets/${currentEstimate.id}/payment-plan`, {
      estimateSetId: currentEstimate.id,
      name: 'Default Plan',
      totalContractValue: currentEstimate?.totals?.grandTotal ?? 500000,
      milestones: [
        { milestoneKey: 'booking', milestoneLabel: 'Booking', dueType: 'event', dueEvent: 'booking', percentOfTotal: 0.1, sequenceNo: 1 },
        { milestoneKey: 'design_signoff', milestoneLabel: 'Design Sign-off', dueType: 'event', dueEvent: 'design_signoff', percentOfTotal: 0.5, sequenceNo: 2 },
      ],
    });
    await load(project.id);
  }

  async function createInvoice() {
    if (!project) return;
    const currentPlan = paymentPlans[0];
    if (!currentPlan?.id) return;
    await apiPost(`/payment-plans/${currentPlan.id}/invoices`, {
      paymentPlanId: currentPlan.id,
      invoiceType: 'milestone',
      issueDate: '2026-06-23',
      dueDate: '2026-06-25',
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
    await load(project.id);
  }

  async function recordPayment() {
    if (!project) return;
    const invoice = invoices[0];
    if (!invoice?.id) return;
    await apiPost(`/projects/${project.id}/payments`, {
      amount: 50000,
      paymentMethod: 'upi',
      paymentDate: '2026-06-23',
      allocations: [{ invoiceId: invoice.id, allocatedAmount: 50000 }],
    });
    await load(project.id);
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
    await load(project.id);
  }

  async function createPurchaseOrder() {
    if (!project) return;
    await apiPost(`/projects/${project.id}/purchase-orders`, {
      vendorName: poVendor,
      category: 'laminate',
      expectedDeliveryDate: '2026-06-30',
      lines: [
        {
          itemDescription: 'Laminate sheets',
          quantity: 10,
          uom: 'sheet',
          unitRate: 5000,
          lineTotal: 50000,
        },
      ],
    });
    await load(project.id);
  }

  const currentBudget = budgets[0];
  const currentEstimate = estimates[0];

  return (
    <>
      <Panel title={title}>
        <div className="workspace3">
          <div className="panel">
            <h3>Budget / Scope</h3>
            <div className="listMock">
              <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
              <div className="rowMock">Budget Band: {currentBudget?.budgetBand ?? 'n/a'}</div>
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
          <div className="panel">
            <h3>Estimate / Quote / Billing</h3>
            <div className="listMock">
              <div className="rowMock">Current Estimate Type: {currentEstimate?.estimateType ?? 'n/a'}</div>
              <div className="rowMock">Estimate Status: {currentEstimate?.status ?? 'n/a'}</div>
              <div className="rowMock">Grand Total: ₹{currentEstimate?.totals?.grandTotal?.toLocaleString?.() ?? 'n/a'}</div>
              <div className="rowMock">Payment Plans: {paymentPlans.length} · Invoices: {invoices.length} · Payments: {payments.length}</div>
            </div>
            <div className="listMock" style={{ marginTop: 12 }}>
              <button onClick={createEstimate}>Create Budget-Fit Estimate</button>
              <button onClick={createPaymentPlan}>Create Payment Plan</button>
              <input value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="Invoice amount" />
              <button onClick={createInvoice}>Create Invoice</button>
              <button onClick={recordPayment}>Record Sample Payment</button>
            </div>
            <div className="listMock" style={{ marginTop: 12 }}>
              {invoices.map((invoice) => (
                <div className="rowMock" key={invoice.id}>{invoice.invoiceNumber} · ₹{invoice.grandTotal.toLocaleString()} · {invoice.status}</div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3>Commercial Controls</h3>
            <form onSubmit={createVariation} className="listMock">
              <input value={variationDescription} onChange={(e) => setVariationDescription(e.target.value)} placeholder="Variation description" />
              <input value={variationCost} onChange={(e) => setVariationCost(e.target.value)} placeholder="Variation cost" />
              <button type="submit">Create Variation</button>
              <input value={poVendor} onChange={(e) => setPoVendor(e.target.value)} placeholder="PO vendor" />
              <button type="button" onClick={createPurchaseOrder}>Create Purchase Order</button>
            </form>
            <div className="listMock" style={{ marginTop: 12 }}>
              {variations.map((variation) => (
                <div className="rowMock" key={variation.id}>
                  {variation.variationCode} · ₹{variation.costDelta.toLocaleString()} · {variation.status}
                </div>
              ))}
              {purchaseOrders.map((po) => (
                <div className="rowMock" key={po.id}>{po.poNumber} · {po.vendorName} · ₹{po.grandTotal.toLocaleString()} · {po.status}</div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
