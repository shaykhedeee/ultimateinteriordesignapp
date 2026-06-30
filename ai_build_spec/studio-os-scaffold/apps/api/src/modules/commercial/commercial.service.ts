import type {
  CreateBudgetProfileRequestDto,
  CreateEstimateSetRequestDto,
  CreateInvoiceRequestDto,
  CreatePaymentPlanRequestDto,
  CreatePurchaseOrderRequestDto,
  CreateVariationOrderRequestDto,
  RecordPaymentRequestDto,
  UUID,
} from '@studio/contracts';
import { mockCommercialRepository } from '../../repositories/mock/commercial.repository';
import { mockProjectsRepository } from '../../repositories/mock/projects.repository';

export class CommercialService {
  async listBudgetProfiles(projectId: UUID) {
    return mockCommercialRepository.listBudgetProfiles(projectId);
  }

  async createBudgetProfile(projectId: UUID, input: CreateBudgetProfileRequestDto) {
    return mockCommercialRepository.createBudgetProfile(projectId, input);
  }

  async listEstimateSets(projectId: UUID) {
    return mockCommercialRepository.listEstimateSets(projectId);
  }

  async createEstimateSet(projectId: UUID, input: CreateEstimateSetRequestDto) {
    const record = mockCommercialRepository.createEstimateSet(projectId, input);
    mockProjectsRepository.incrementCount(projectId, 'estimates');
    return record;
  }

  async listPaymentPlans(projectId: UUID) {
    return mockCommercialRepository.listPaymentPlans(projectId);
  }

  async createPaymentPlanByEstimate(estimateSetId: UUID, input: CreatePaymentPlanRequestDto) {
    const estimate = mockCommercialRepository.findEstimateSetById(estimateSetId);
    if (!estimate) throw new Error('ESTIMATE_SET_NOT_FOUND');
    return mockCommercialRepository.createPaymentPlan(estimate.projectId, input);
  }

  async listInvoices(projectId: UUID) {
    return mockCommercialRepository.listInvoices(projectId);
  }

  async createInvoiceByPaymentPlan(paymentPlanId: UUID, input: CreateInvoiceRequestDto) {
    const plan = mockCommercialRepository.findPaymentPlanById(paymentPlanId);
    if (!plan) throw new Error('PAYMENT_PLAN_NOT_FOUND');
    return mockCommercialRepository.createInvoice(plan.projectId, { ...input, paymentPlanId });
  }

  async listPayments(projectId: UUID) {
    return mockCommercialRepository.listPayments(projectId);
  }

  async recordPayment(projectId: UUID, input: RecordPaymentRequestDto) {
    return mockCommercialRepository.recordPayment(projectId, input);
  }

  async listVariationOrders(projectId: UUID) {
    return mockCommercialRepository.listVariationOrders(projectId);
  }

  async createVariationOrder(projectId: UUID, input: CreateVariationOrderRequestDto) {
    return mockCommercialRepository.createVariationOrder(projectId, input);
  }

  async listPurchaseOrders(projectId: UUID) {
    return mockCommercialRepository.listPurchaseOrders(projectId);
  }

  async createPurchaseOrder(projectId: UUID, input: CreatePurchaseOrderRequestDto) {
    return mockCommercialRepository.createPurchaseOrder(projectId, input);
  }
}

export const commercialService = new CommercialService();
