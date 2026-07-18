import { z } from 'zod';
import {
  APPROVAL_STATUS,
  BUDGET_BANDS,
  DRAWING_TYPES,
  ESTIMATE_STATUSES,
  ESTIMATE_TYPES,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  JOB_STATUSES,
  JOB_TYPES,
  MODULE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  RENDER_TIERS,
  ROOM_TYPES,
  RULE_SEVERITIES,
  RULE_STATUSES,
  USER_ROLES,
  VARIATION_STATUSES,
} from './enums';

export const UuidSchema = z.string().uuid();
export const ISODateSchema = z.string().min(10);
export const ISODateTimeSchema = z.string().datetime().or(z.string().min(10));

export const UserRoleSchema = z.enum(USER_ROLES);
export const ProjectStageSchema = z.enum(PROJECT_STAGES);
export const ProjectStatusSchema = z.enum(PROJECT_STATUSES);
export const BudgetBandSchema = z.enum(BUDGET_BANDS);
export const RoomTypeSchema = z.enum(ROOM_TYPES);
export const ModuleTypeSchema = z.enum(MODULE_TYPES);
export const RenderTierSchema = z.enum(RENDER_TIERS);
export const DrawingTypeSchema = z.enum(DRAWING_TYPES);
export const ApprovalStatusSchema = z.enum(APPROVAL_STATUS);
export const EstimateTypeSchema = z.enum(ESTIMATE_TYPES);
export const EstimateStatusSchema = z.enum(ESTIMATE_STATUSES);
export const InvoiceTypeSchema = z.enum(INVOICE_TYPES);
export const InvoiceStatusSchema = z.enum(INVOICE_STATUSES);
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const VariationStatusSchema = z.enum(VARIATION_STATUSES);
export const RuleSeveritySchema = z.enum(RULE_SEVERITIES);
export const RuleStatusSchema = z.enum(RULE_STATUSES);
export const JobTypeSchema = z.enum(JOB_TYPES);
export const JobStatusSchema = z.enum(JOB_STATUSES);

export const Point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const Point3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const ModuleGeometrySchema = z.object({
  anchor: z.object({
    roomId: z.string(),
    wallId: z.string().optional(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  size: z.object({
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    depthMm: z.number().positive(),
  }),
  rotationDeg: z.number(),
});

export const SceneModuleSchema = z.object({
  moduleId: UuidSchema,
  moduleType: z.string(),
  roomRef: z.string(),
  wallRef: z.string().optional(),
  name: z.string().min(1),
  geometry: ModuleGeometrySchema,
  params: z.record(z.any()),
  materialAssignments: z.record(z.string()).default({}),
  productionMapping: z.record(z.any()).default({}),
});

export const SceneWallSchema = z.object({
  wallId: z.string(),
  roomIdPrimary: z.string(),
  roomIdSecondary: z.string().optional(),
  start: Point2DSchema,
  end: Point2DSchema,
  thicknessMm: z.number().positive(),
  heightMm: z.number().positive(),
  openings: z.array(z.string()),
  finishInnerId: UuidSchema.optional(),
  finishOuterId: UuidSchema.optional(),
  photos: z.array(UuidSchema),
});

export const SceneRoomSchema = z.object({
  roomId: z.string(),
  roomType: z.string(),
  name: z.string().min(1),
  polygon2d: z.array(Point2DSchema).min(3),
  heightMm: z.number().positive(),
  floorFinishId: UuidSchema.optional(),
  ceilingStyleId: z.string().optional(),
  walls: z.array(z.string()),
  modules: z.array(UuidSchema),
  furniture: z.array(z.string()),
  photos: z.array(UuidSchema),
  constraints: z
    .object({
      vastuZone: z.string().optional(),
      daylightFaces: z.array(z.string()).optional(),
      budgetBand: BudgetBandSchema.optional(),
    })
    .optional(),
});

export const SceneDocumentSchema = z.object({
  schemaVersion: z.string(),
  projectId: UuidSchema,
  units: z.literal('mm'),
  levels: z.array(
    z.object({
      levelId: z.string(),
      name: z.string(),
      rooms: z.array(SceneRoomSchema),
      walls: z.array(SceneWallSchema),
      openings: z.array(z.any()),
      modules: z.array(SceneModuleSchema),
    })
  ),
  materials: z.array(z.any()),
  lights: z.array(z.any()),
  cameras: z.array(z.any()),
  settings: z.record(z.any()),
  ruleResults: z.object({
    passCount: z.number(),
    warnCount: z.number(),
    failCount: z.number(),
    score: z.number().optional(),
    results: z.array(
      z.object({
        ruleCode: z.string(),
        severity: RuleSeveritySchema,
        status: RuleStatusSchema,
        message: z.string(),
        overrideAllowed: z.boolean(),
      })
    ),
  }),
});

export const CreateLeadRequestSchema = z.object({
  contactName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  source: z.string().min(1),
  projectType: z.string().optional(),
  budgetBand: BudgetBandSchema.optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

export const CreateProjectRequestSchema = z.object({
  leadId: UuidSchema.optional(),
  client: z.object({
    primaryName: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    city: z.string().optional(),
  }),
  name: z.string().optional(),
  propertyType: z.string().optional(),
  projectType: z.string().optional(),
  budgetBand: BudgetBandSchema.optional(),
  siteCity: z.string().optional(),
  siteAddressText: z.string().optional(),
});

export const UpdateProjectRequestSchema = z.object({
  name: z.string().optional(),
  budgetBand: BudgetBandSchema.optional(),
  targetTimelineText: z.string().optional(),
  stage: ProjectStageSchema.optional(),
  status: ProjectStatusSchema.optional(),
});

export const TransitionProjectRequestSchema = z.object({
  nextStage: ProjectStageSchema,
});

export const SaveIntakeRequestSchema = z.object({
  payload: z.record(z.any()),
  isAutosave: z.boolean().optional(),
});

export const InterpretFloorPlanRequestSchema = z.object({
  sourceAssetId: UuidSchema,
  mode: z.enum(['image', 'pdf', 'scan', 'hybrid']),
  options: z
    .object({
      preferMetric: z.boolean().optional(),
      inferRoomLabels: z.boolean().optional(),
      inferOpenings: z.boolean().optional(),
    })
    .optional(),
});

export const ReviewFloorPlanRequestSchema = z.object({
  acceptRemainingHighConfidence: z.boolean().optional(),
  corrections: z.array(
    z.object({
      itemType: z.enum(['room', 'wall', 'opening', 'dimension', 'symbol']),
      itemRef: z.string().min(1),
      action: z.enum(['accept', 'correct', 'ignore']),
      resolvedValue: z.record(z.any()).optional(),
    })
  ).min(1),
});

export const ScenePatchRequestSchema = z.object({
  reason: z.string().optional(),
  operations: z.array(
    z.object({
      op: z.string().min(1),
      roomRef: z.string().optional(),
      wallRef: z.string().optional(),
      moduleId: UuidSchema.optional(),
      params: z.record(z.any()).optional(),
      payload: z.record(z.any()).optional(),
    })
  ).min(1),
});

export const PlaceModuleRequestSchema = z.object({
  templateKey: z.string().min(1),
  roomRef: z.string().min(1),
  wallRef: z.string().optional(),
  anchor: z.record(z.any()).optional(),
  params: z.record(z.any()),
});

export const CreateRenderSetRequestSchema = z.object({
  roomRef: z.string().optional(),
  renderTier: RenderTierSchema,
  variantCount: z.number().int().min(1).max(8),
  cameraPresetIds: z.array(UuidSchema).optional(),
  lightingPresetIds: z.array(UuidSchema).optional(),
  stylePresetId: z.string().optional(),
});

export const CreateDrawingSetRequestSchema = z.object({
  drawingScope: z.enum(['room', 'full_project', 'production']),
  roomRefs: z.array(z.string()).optional(),
  include: z.array(z.enum(['floor_plan', 'elevations', 'ceiling_plan', 'module_schedule', 'section'])).min(1),
});

export const CreateProposalSetRequestSchema = z.object({
  sceneVersionId: UuidSchema,
  renderSetId: UuidSchema.optional(),
  drawingSetId: UuidSchema.optional(),
  pricingSetId: UuidSchema.optional(),
  sections: z.array(z.string()).optional(),
});

export const CreateApprovalPackageRequestSchema = z.object({
  sceneVersionId: UuidSchema,
  proposalSetId: UuidSchema.optional(),
  renderSetId: UuidSchema.optional(),
  drawingSetId: UuidSchema.optional(),
  pricingSetId: UuidSchema.optional(),
  packageType: z.enum(['concept', 'client_approval', 'production_lock']),
});

export const ApprovalDecisionRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  approvedByName: z.string().optional(),
  comments: z.string().optional(),
});

export const GeneratePricingRequestSchema = z.object({
  rateCardId: UuidSchema,
  pricingMode: z.enum(['estimate', 'proposal', 'final']).optional(),
  includeLabor: z.boolean().optional(),
  includeHardware: z.boolean().optional(),
});

export const EstimateLineItemSchema = z.object({
  lineCode: z.string().min(1),
  roomRef: z.string().optional(),
  moduleRef: z.string().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  uom: z.string().min(1),
  baseRate: z.number().nonnegative(),
  marginRate: z.number().nonnegative(),
  lineTotal: z.number(),
  metadata: z.record(z.any()).optional(),
});

export const CreateBudgetProfileRequestSchema = z.object({
  budgetBand: BudgetBandSchema,
  targetBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  scopeType: z.enum(['full_home', 'room_package', 'modular_only', 'turnkey', 'design_only']),
  financingNeeded: z.boolean(),
  priorities: z.record(z.number()).optional(),
  preferences: z.record(z.any()).optional(),
});

export const CreateEstimateSetRequestSchema = z.object({
  sceneVersionId: UuidSchema.optional(),
  budgetProfileId: UuidSchema.optional(),
  estimateType: EstimateTypeSchema,
  assumptions: z.record(z.any()).optional(),
  items: z.array(EstimateLineItemSchema).optional(),
});

export const CreatePaymentPlanRequestSchema = z.object({
  estimateSetId: UuidSchema.optional(),
  name: z.string().min(1),
  totalContractValue: z.number().positive(),
  milestones: z.array(
    z.object({
      milestoneKey: z.string().min(1),
      milestoneLabel: z.string().min(1),
      dueType: z.enum(['event', 'date']),
      dueEvent: z.string().optional(),
      dueDate: ISODateSchema.optional(),
      percentOfTotal: z.number().optional(),
      fixedAmount: z.number().optional(),
      sequenceNo: z.number().int().nonnegative(),
    })
  ).min(1),
});

export const CreateInvoiceRequestSchema = z.object({
  estimateSetId: UuidSchema.optional(),
  paymentPlanId: UuidSchema.optional(),
  milestoneId: UuidSchema.optional(),
  invoiceType: InvoiceTypeSchema,
  issueDate: ISODateSchema,
  dueDate: ISODateSchema.optional(),
  currencyCode: z.string().default('INR'),
  lineItems: z.array(
    z.object({
      lineCode: z.string().optional(),
      category: z.string().min(1),
      description: z.string().min(1),
      quantity: z.number().positive(),
      uom: z.string().min(1),
      taxableValue: z.number().nonnegative(),
      taxRate: z.number().nonnegative(),
      taxAmount: z.number().nonnegative(),
      lineTotal: z.number(),
      metadata: z.record(z.any()).optional(),
    })
  ).min(1),
});

export const RecordPaymentRequestSchema = z.object({
  paymentPlanId: UuidSchema.optional(),
  amount: z.number().positive(),
  paymentMethod: PaymentMethodSchema,
  paymentDate: ISODateSchema,
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  allocations: z.array(
    z.object({
      invoiceId: UuidSchema,
      allocatedAmount: z.number().positive(),
    })
  ).min(1),
});

export const CreateVariationOrderRequestSchema = z.object({
  sceneVersionId: UuidSchema.optional(),
  sourceEstimateSetId: UuidSchema.optional(),
  revisedEstimateSetId: UuidSchema.optional(),
  reasonCategory: z.string().min(1),
  description: z.string().min(1),
  costDelta: z.number(),
  timelineDeltaDays: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

export const CreatePurchaseOrderRequestSchema = z.object({
  vendorName: z.string().min(1),
  category: z.string().min(1),
  expectedDeliveryDate: ISODateSchema.optional(),
  lines: z.array(
    z.object({
      lineCode: z.string().optional(),
      roomRef: z.string().optional(),
      moduleRef: z.string().optional(),
      itemDescription: z.string().min(1),
      quantity: z.number().positive(),
      uom: z.string().min(1),
      unitRate: z.number().nonnegative(),
      lineTotal: z.number(),
      metadata: z.record(z.any()).optional(),
    })
  ).min(1),
  metadata: z.record(z.any()).optional(),
});
