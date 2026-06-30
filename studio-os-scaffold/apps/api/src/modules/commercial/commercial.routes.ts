import { Router } from 'express';
import {
  CreateBudgetProfileRequestSchema,
  CreateEstimateSetRequestSchema,
  CreateInvoiceRequestSchema,
  CreatePaymentPlanRequestSchema,
  CreatePurchaseOrderRequestSchema,
  CreateVariationOrderRequestSchema,
  RecordPaymentRequestSchema,
  UuidSchema,
} from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { commercialService } from './commercial.service';

export const commercialRouter = Router();

commercialRouter.get('/projects/:projectId/budget-profiles', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listBudgetProfiles(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/projects/:projectId/budget-profiles', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreateBudgetProfileRequestSchema, req.body);
  const result = await commercialService.createBudgetProfile(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/estimate-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listEstimateSets(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/projects/:projectId/estimate-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreateEstimateSetRequestSchema, req.body);
  const result = await commercialService.createEstimateSet(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/payment-plans', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listPaymentPlans(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/estimate-sets/:estimateSetId/payment-plan', async (req, res) => {
  const estimateSetId = UuidSchema.parse(req.params.estimateSetId);
  const input = validateBody(CreatePaymentPlanRequestSchema, req.body);
  const result = await commercialService.createPaymentPlanByEstimate(estimateSetId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/invoices', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listInvoices(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/payment-plans/:paymentPlanId/invoices', async (req, res) => {
  const paymentPlanId = UuidSchema.parse(req.params.paymentPlanId);
  const input = validateBody(CreateInvoiceRequestSchema, req.body);
  const result = await commercialService.createInvoiceByPaymentPlan(paymentPlanId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/payments', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listPayments(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/projects/:projectId/payments', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(RecordPaymentRequestSchema, req.body);
  const result = await commercialService.recordPayment(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/variation-orders', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listVariationOrders(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/projects/:projectId/variation-orders', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreateVariationOrderRequestSchema, req.body);
  const result = await commercialService.createVariationOrder(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.get('/projects/:projectId/purchase-orders', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await commercialService.listPurchaseOrders(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.post('/projects/:projectId/purchase-orders', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreatePurchaseOrderRequestSchema, req.body);
  const result = await commercialService.createPurchaseOrder(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

commercialRouter.patch('/purchase-orders/:poId', async (req, res) => {
  const poId = UuidSchema.parse(req.params.poId);
  const result = await commercialService.updatePurchaseOrder(poId, req.body);
  return res.json({ success: true, data: result, meta: {}, error: null });
});
