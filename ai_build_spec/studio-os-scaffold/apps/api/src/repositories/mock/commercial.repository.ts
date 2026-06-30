import type {
  BudgetProfile,
  CreateBudgetProfileRequestDto,
  CreateEstimateSetRequestDto,
  CreateInvoiceRequestDto,
  CreatePaymentPlanRequestDto,
  CreatePurchaseOrderRequestDto,
  CreateVariationOrderRequestDto,
  EstimateSet,
  Invoice,
  PaymentPlan,
  PaymentReceipt,
  PurchaseOrder,
  RecordPaymentRequestDto,
  UUID,
  VariationOrder,
} from '@studio/contracts';
import { mockStore } from '../../lib/mock-store';
import { logTimelineEvent } from '../../lib/timeline';

export class MockCommercialRepository {
  listBudgetProfiles(projectId: UUID) {
    return mockStore.budgetProfiles.filter((profile) => profile.projectId === projectId);
  }

  createBudgetProfile(projectId: UUID, input: CreateBudgetProfileRequestDto): BudgetProfile {
    mockStore.budgetProfiles.forEach((profile) => {
      if (profile.projectId === projectId && profile.isCurrent) profile.isCurrent = false;
    });
    const record: BudgetProfile = {
      id: crypto.randomUUID(),
      projectId,
      versionNumber: this.listBudgetProfiles(projectId).reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1,
      isCurrent: true,
      budgetBand: input.budgetBand,
      targetBudget: input.targetBudget,
      maxBudget: input.maxBudget,
      scopeType: input.scopeType,
      financingNeeded: input.financingNeeded,
      priorities: input.priorities ?? {},
      preferences: input.preferences ?? {},
    };
    mockStore.budgetProfiles.unshift(record);
    logTimelineEvent(projectId, 'budget.profile_created', 'Budget profile created', `${record.budgetBand} budget profile saved`);
    return record;
  }

  listEstimateSets(projectId: UUID) {
    return mockStore.estimateSets.filter((estimate) => estimate.projectId === projectId);
  }

  createEstimateSet(projectId: UUID, input: CreateEstimateSetRequestDto): EstimateSet {
    const total = (input.items ?? []).reduce((sum, item) => sum + item.lineTotal, 0);
    const record: EstimateSet = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId: input.sceneVersionId,
      budgetProfileId: input.budgetProfileId,
      estimateType: input.estimateType,
      versionNumber: this.listEstimateSets(projectId)
        .filter((estimate) => estimate.estimateType === input.estimateType)
        .reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1,
      status: 'draft',
      assumptions: input.assumptions ?? {},
      summary: {},
      totals: { subtotal: total, taxTotal: 0, grandTotal: total },
      items: input.items ?? [],
    };
    mockStore.estimateSets.unshift(record);
    logTimelineEvent(projectId, 'estimate.created', 'Estimate created', `${record.estimateType} estimate v${record.versionNumber} created`);
    return record;
  }

  findEstimateSetById(id: UUID) {
    return mockStore.estimateSets.find((estimate) => estimate.id === id) ?? null;
  }

  listPaymentPlans(projectId: UUID) {
    return mockStore.paymentPlans.filter((plan) => plan.projectId === projectId);
  }

  findPaymentPlanById(id: UUID) {
    return mockStore.paymentPlans.find((plan) => plan.id === id) ?? null;
  }

  createPaymentPlan(projectId: UUID, input: CreatePaymentPlanRequestDto): PaymentPlan {
    const record: PaymentPlan = {
      id: crypto.randomUUID(),
      projectId,
      estimateSetId: input.estimateSetId,
      name: input.name,
      versionNumber: this.listPaymentPlans(projectId).reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1,
      status: 'draft',
      totalContractValue: input.totalContractValue,
      notes: undefined,
      milestones: input.milestones,
    };
    mockStore.paymentPlans.unshift(record);
    logTimelineEvent(projectId, 'payment_plan.created', 'Payment plan created', `${record.name} created with ${record.milestones.length} milestones`);
    return record;
  }

  listPayments(projectId: UUID) {
    return mockStore.payments.filter((payment) => payment.projectId === projectId);
  }

  listInvoices(projectId: UUID) {
    return mockStore.invoices.filter((invoice) => invoice.projectId === projectId);
  }

  createInvoice(projectId: UUID, input: CreateInvoiceRequestDto): Invoice {
    const subtotal = input.lineItems.reduce((sum, line) => sum + line.taxableValue, 0);
    const taxTotal = input.lineItems.reduce((sum, line) => sum + line.taxAmount, 0);
    const grandTotal = input.lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
    const record: Invoice = {
      id: crypto.randomUUID(),
      projectId,
      estimateSetId: input.estimateSetId,
      paymentPlanId: input.paymentPlanId,
      milestoneId: input.milestoneId,
      invoiceType: input.invoiceType,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status: 'draft',
      currencyCode: input.currencyCode ?? 'INR',
      subtotal,
      taxTotal,
      grandTotal,
      balanceDue: grandTotal,
      lineItems: input.lineItems,
      metadata: input.metadata,
    };
    mockStore.invoices.unshift(record);
    logTimelineEvent(projectId, 'invoice.created', 'Invoice created', `${record.invoiceNumber} for ₹${record.grandTotal}`);
    return record;
  }

  recordPayment(projectId: UUID, input: RecordPaymentRequestDto): PaymentReceipt {
    const record: PaymentReceipt = {
      id: crypto.randomUUID(),
      projectId,
      paymentPlanId: input.paymentPlanId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: input.paymentDate,
      referenceNo: input.referenceNo,
      status: 'recorded',
      notes: input.notes,
      allocations: input.allocations,
    };
    mockStore.payments.unshift(record);
    logTimelineEvent(projectId, 'payment.recorded', 'Payment recorded', `₹${record.amount} received via ${record.paymentMethod}`);
    return record;
  }

  listVariationOrders(projectId: UUID) {
    return mockStore.variationOrders.filter((variation) => variation.projectId === projectId);
  }

  createVariationOrder(projectId: UUID, input: CreateVariationOrderRequestDto): VariationOrder {
    const record: VariationOrder = {
      id: crypto.randomUUID(),
      projectId,
      sceneVersionId: input.sceneVersionId,
      sourceEstimateSetId: input.sourceEstimateSetId,
      revisedEstimateSetId: input.revisedEstimateSetId,
      variationCode: `VO-${Date.now()}`,
      status: 'proposed',
      reasonCategory: input.reasonCategory,
      description: input.description,
      costDelta: input.costDelta,
      timelineDeltaDays: input.timelineDeltaDays ?? 0,
      metadata: input.metadata,
    };
    mockStore.variationOrders.unshift(record);
    logTimelineEvent(projectId, 'variation.created', 'Variation order created', `${record.variationCode} created for ₹${record.costDelta}`);
    return record;
  }

  listPurchaseOrders(projectId: UUID) {
    return mockStore.purchaseOrders.filter((po) => po.projectId === projectId);
  }

  createPurchaseOrder(projectId: UUID, input: CreatePurchaseOrderRequestDto): PurchaseOrder {
    const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const record: PurchaseOrder = {
      id: crypto.randomUUID(),
      projectId,
      vendorName: input.vendorName,
      poNumber: `PO-${Date.now()}`,
      category: input.category,
      status: 'draft',
      expectedDeliveryDate: input.expectedDeliveryDate,
      subtotal,
      taxTotal: 0,
      grandTotal: subtotal,
      metadata: input.metadata,
      lines: input.lines,
    };
    mockStore.purchaseOrders.unshift(record);
    logTimelineEvent(projectId, 'purchase_order.created', 'Purchase order created', `${record.poNumber} issued to ${record.vendorName}`);
    return record;
  }
}

export const mockCommercialRepository = new MockCommercialRepository();
