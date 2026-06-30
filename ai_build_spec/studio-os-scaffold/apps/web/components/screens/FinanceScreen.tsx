'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Project = { id: string; name: string };
type PaymentPlan = { id: string; name: string; totalContractValue: number; status: string; milestones?: Array<{ milestoneLabel: string; status: string }> };
type Invoice = { id: string; invoiceNumber: string; grandTotal: number; balanceDue: number; status: string };
type Payment = { id: string; amount: number; paymentMethod: string; paymentDate: string; status: string };

export function FinanceScreen() {
  const [project, setProject] = useState<Project | null>(null);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(async (projects) => {
        const first = projects[0] ?? null;
        setProject(first);
        if (!first) return;
        const [planData, invoiceData, paymentData] = await Promise.all([
          apiGet<PaymentPlan[]>(`/projects/${first.id}/payment-plans`),
          apiGet<Invoice[]>(`/projects/${first.id}/invoices`),
          apiGet<Payment[]>(`/projects/${first.id}/payments`),
        ]);
        setPlans(planData);
        setInvoices(invoiceData);
        setPayments(paymentData);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="workspace3">
      <Panel title="Payment Plans">
        <div className="listMock">
          <div className="rowMock">Project: {project?.name ?? 'Loading...'}</div>
          {plans.map((plan) => (
            <div className="rowMock" key={plan.id}>
              <strong>{plan.name}</strong>
              <div className="muted">₹{plan.totalContractValue.toLocaleString()} · {plan.status}</div>
              {plan.milestones?.map((milestone, index) => (
                <div className="muted" key={`${plan.id}-${index}`}>{milestone.milestoneLabel} · {milestone.status}</div>
              ))}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Invoices">
        <div className="listMock">
          {invoices.map((invoice) => (
            <div className="rowMock" key={invoice.id}>
              <strong>{invoice.invoiceNumber}</strong>
              <div className="muted">₹{invoice.grandTotal.toLocaleString()} · Balance ₹{invoice.balanceDue.toLocaleString()} · {invoice.status}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Payments">
        <div className="listMock">
          {payments.map((payment) => (
            <div className="rowMock" key={payment.id}>
              <strong>₹{payment.amount.toLocaleString()}</strong>
              <div className="muted">{payment.paymentMethod} · {payment.status}</div>
              <div className="muted">{payment.paymentDate}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
