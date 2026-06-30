import type { BudgetBand, EstimateStatus, EstimateType, InvoiceStatus, InvoiceType, PaymentMethod, PaymentStatus, PurchaseOrderStatus, UUID, VariationStatus } from './enums';
export interface BudgetProfile {
    id: UUID;
    projectId: UUID;
    versionNumber: number;
    isCurrent: boolean;
    budgetBand: BudgetBand;
    targetBudget?: number;
    maxBudget?: number;
    scopeType: 'full_home' | 'room_package' | 'modular_only' | 'turnkey' | 'design_only';
    financingNeeded: boolean;
    priorities: Record<string, number>;
    preferences: Record<string, unknown>;
}
export interface EstimateLineItem {
    id: UUID;
    lineCode: string;
    roomRef?: string;
    moduleRef?: string;
    category: 'design_service' | 'modular_unit' | 'civil_scope' | 'electrical_scope' | 'plumbing_scope' | 'ceiling_scope' | 'painting_scope' | 'hardware_package' | 'appliance' | 'loose_furniture' | 'decor' | 'delivery_installation' | 'discount' | 'tax' | 'contingency';
    description: string;
    quantity: number;
    uom: string;
    baseRate: number;
    marginRate: number;
    lineTotal: number;
    metadata?: Record<string, unknown>;
}
export interface EstimateSet {
    id: UUID;
    projectId: UUID;
    sceneVersionId?: UUID;
    budgetProfileId?: UUID;
    estimateType: EstimateType;
    versionNumber: number;
    status: EstimateStatus;
    assumptions: Record<string, unknown>;
    summary: Record<string, unknown>;
    totals: {
        subtotal: number;
        taxTotal: number;
        grandTotal: number;
        optionalTotal?: number;
    };
    items: EstimateLineItem[];
}
export interface PaymentPlanMilestone {
    id: UUID;
    milestoneKey: string;
    milestoneLabel: string;
    dueType: 'event' | 'date';
    dueEvent?: string;
    dueDate?: string;
    percentOfTotal?: number;
    fixedAmount?: number;
    sequenceNo: number;
    status: 'not_due' | 'due' | 'overdue' | 'partially_paid' | 'paid' | 'waived';
    releaseGate?: Record<string, unknown>;
}
export interface PaymentPlan {
    id: UUID;
    projectId: UUID;
    estimateSetId?: UUID;
    name: string;
    versionNumber: number;
    status: 'draft' | 'active' | 'superseded' | 'closed';
    totalContractValue: number;
    notes?: string;
    milestones: PaymentPlanMilestone[];
}
export interface InvoiceLineItem {
    id: UUID;
    lineCode?: string;
    category: string;
    description: string;
    quantity: number;
    uom: string;
    taxableValue: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
    metadata?: Record<string, unknown>;
}
export interface Invoice {
    id: UUID;
    projectId: UUID;
    estimateSetId?: UUID;
    paymentPlanId?: UUID;
    milestoneId?: UUID;
    invoiceType: InvoiceType;
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string;
    status: InvoiceStatus;
    currencyCode: 'INR' | string;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    balanceDue: number;
    lineItems: InvoiceLineItem[];
    metadata?: Record<string, unknown>;
}
export interface PaymentAllocation {
    invoiceId: UUID;
    allocatedAmount: number;
}
export interface PaymentReceipt {
    id: UUID;
    projectId: UUID;
    paymentPlanId?: UUID;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNo?: string;
    status: PaymentStatus;
    notes?: string;
    allocations: PaymentAllocation[];
}
export interface VariationOrder {
    id: UUID;
    projectId: UUID;
    sceneVersionId?: UUID;
    sourceEstimateSetId?: UUID;
    revisedEstimateSetId?: UUID;
    variationCode: string;
    status: VariationStatus;
    reasonCategory: string;
    description: string;
    costDelta: number;
    timelineDeltaDays: number;
    metadata?: Record<string, unknown>;
}
export interface PurchaseOrderLine {
    id: UUID;
    lineCode?: string;
    roomRef?: string;
    moduleRef?: string;
    itemDescription: string;
    quantity: number;
    uom: string;
    unitRate: number;
    lineTotal: number;
    metadata?: Record<string, unknown>;
}
export interface PurchaseOrder {
    id: UUID;
    projectId: UUID;
    vendorName: string;
    poNumber: string;
    category: string;
    status: PurchaseOrderStatus;
    expectedDeliveryDate?: string;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    metadata?: Record<string, unknown>;
    lines: PurchaseOrderLine[];
}
export interface GoodsReceiptLine {
    poLineId: UUID;
    receivedQty: number;
    rejectedQty: number;
    notes?: string;
}
export interface GoodsReceipt {
    id: UUID;
    purchaseOrderId: UUID;
    receiptNumber: string;
    receiptDate: string;
    status: 'draft' | 'received' | 'partially_rejected' | 'closed';
    metadata?: Record<string, unknown>;
    lines: GoodsReceiptLine[];
}
