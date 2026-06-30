import type {
  BudgetProfile,
  CreateLeadRequestDto,
  DrawingSetDto,
  EstimateSet,
  Invoice,
  PaymentPlan,
  PaymentReceipt,
  ProjectSummaryDto,
  PurchaseOrder,
  RenderSet,
  SceneVersionDto,
  UUID,
  VariationOrder,
} from '@studio/contracts';

export interface MaterialCatalogRecord {
  id: UUID;
  category: string;
  subcategory?: string;
  code?: string;
  name: string;
  brand?: string;
  metadata: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  isActive: boolean;
}

export interface LeadRecord {
  id: UUID;
  contactName: string;
  phone?: string;
  email?: string;
  city?: string;
  source: string;
  status: 'new' | 'qualified' | 'lost' | 'converted';
  projectType?: string;
  budgetBand?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
}

export interface ProjectRecord extends ProjectSummaryDto {
  createdAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

export interface IntakePackageRecord {
  id: UUID;
  projectId: UUID;
  versionNumber: number;
  isCurrent: boolean;
  payload: Record<string, unknown>;
  completionPercent: number;
}

export interface ProposalRecord {
  id: UUID;
  projectId: UUID;
  sceneVersionId: UUID;
  versionNumber: number;
  status: 'draft' | 'exported' | 'approved' | 'stale';
  renderSetId?: UUID;
  drawingSetId?: UUID;
  pricingSetId?: UUID;
}

export interface ApprovalPackageRecord {
  id: UUID;
  projectId: UUID;
  sceneVersionId: UUID;
  packageType: 'concept' | 'client_approval' | 'production_lock';
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  proposalSetId?: UUID;
  renderSetId?: UUID;
  drawingSetId?: UUID;
  pricingSetId?: UUID;
  approvedByClientName?: string;
  comments?: string;
}

export interface JobRecord {
  id: UUID;
  jobType: string;
  status: string;
  progress: number;
  projectId?: UUID;
  sourceEntityType?: string;
  sourceEntityId?: UUID;
  createdAt?: string;
}

export interface TimelineEventRecord {
  id: UUID;
  projectId: UUID;
  eventType: string;
  title: string;
  detail?: string;
  actor?: string;
  createdAt: string;
}

export interface AgentInboxRecord {
  id: UUID;
  projectId?: UUID;
  observationType: string;
  title: string;
  detail?: string;
  disposition: 'deterministic' | 'small_ai' | 'advanced_ai' | 'human_review' | 'memory_update';
  status: 'new' | 'triaged' | 'in_progress' | 'done';
  createdAt: string;
}

export interface RenderFeedbackRecord {
  id: UUID;
  projectId: UUID;
  renderSetId?: UUID;
  variantId?: UUID;
  roomRef?: string;
  decision: 'approved' | 'rejected' | 'shortlisted';
  note?: string;
  preferenceSignals?: Record<string, unknown>;
  createdAt: string;
}

export interface WalkthroughCameraRecord {
  id: UUID;
  projectId: UUID;
  sceneVersionId: UUID;
  roomRef: string;
  label: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  createdAt: string;
}

export const mockStore = {
  leads: [] as LeadRecord[],
  projects: [] as ProjectRecord[],
  intakePackages: [] as IntakePackageRecord[],
  scenes: [] as SceneVersionDto[],
  budgetProfiles: [] as BudgetProfile[],
  estimateSets: [] as EstimateSet[],
  paymentPlans: [] as PaymentPlan[],
  invoices: [] as Invoice[],
  payments: [] as PaymentReceipt[],
  variationOrders: [] as VariationOrder[],
  purchaseOrders: [] as PurchaseOrder[],
  renderSets: [] as RenderSet[],
  drawingSets: [] as DrawingSetDto[],
  proposals: [] as ProposalRecord[],
  approvalPackages: [] as ApprovalPackageRecord[],
  jobs: [] as JobRecord[],
  materials: [] as MaterialCatalogRecord[],
  timelineEvents: [] as TimelineEventRecord[],
  agentInbox: [] as AgentInboxRecord[],
  renderFeedbacks: [] as RenderFeedbackRecord[],
  walkthroughCameras: [] as WalkthroughCameraRecord[],
};

export function seedMockStore() {
  if (mockStore.projects.length > 0) return;

  const lead1: LeadRecord = {
    id: makeId(),
    contactName: 'Raghav Iyer',
    phone: '+91-9000000001',
    email: 'raghav@example.com',
    city: 'Bengaluru',
    source: 'walk_in',
    status: 'qualified',
    projectType: 'residential',
    budgetBand: 'premium',
    urgencyLevel: 'high',
    notes: 'Needs full-home modular interiors before possession date.',
    createdAt: nowIso(),
  };

  const lead2: LeadRecord = {
    id: makeId(),
    contactName: 'Neha Patel',
    phone: '+91-9000000002',
    city: 'Hyderabad',
    source: 'instagram',
    status: 'new',
    projectType: 'residential',
    budgetBand: 'standard',
    urgencyLevel: 'medium',
    createdAt: nowIso(),
  };

  mockStore.leads.push(lead1, lead2);

  const projectId = makeId();
  const sceneId = makeId();
  const livingTvModuleId = makeId();

  const project: ProjectRecord = {
    id: projectId,
    clientId: makeId(),
    projectCode: 'PRJ-2026-001',
    name: 'Iyer Residence',
    stage: 'design_in_progress',
    status: 'active',
    budgetBand: 'premium',
    siteCity: 'Bengaluru',
    readiness: {
      stage: 'design_in_progress',
      score: 64,
      checks: {
        intakeComplete: true,
        siteCaptureComplete: true,
        planReviewed: true,
        sceneReady: true,
        hasEstimate: true,
        hasFinalQuote: false,
      },
      nextRequiredAction: 'generate_concept_estimate',
    },
    activeSceneVersionId: sceneId,
    activeFloorPlanVersionId: makeId(),
    counts: {
      renders: 2,
      drawings: 1,
      estimates: 1,
    },
    staleFlags: {
      renders: false,
      drawings: false,
      pricing: true,
    },
    createdAt: nowIso(),
  };

  mockStore.projects.push(project);

  mockStore.scenes.push({
    id: sceneId,
    projectId,
    versionNumber: 12,
    branchName: 'main',
    isCurrent: true,
    isLocked: false,
    scene: {
      schemaVersion: '1.0.0',
      projectId,
      units: 'mm',
      levels: [
        {
          levelId: 'level_1',
          name: 'Ground Floor',
          rooms: [
            {
              roomId: 'room_living_1',
              roomType: 'living_room',
              name: 'Living Room',
              polygon2d: [
                { x: 0, y: 0 },
                { x: 4500, y: 0 },
                { x: 4500, y: 4000 },
                { x: 0, y: 4000 },
              ],
              heightMm: 3000,
              walls: ['wall_l1', 'wall_l2', 'wall_l3', 'wall_l4'],
              modules: [livingTvModuleId],
              furniture: [],
              photos: [],
            },
          ],
          walls: [
            { wallId: 'wall_l1', roomIdPrimary: 'room_living_1', start: { x: 0, y: 0 }, end: { x: 4500, y: 0 }, thicknessMm: 150, heightMm: 3000, openings: [], photos: [] },
            { wallId: 'wall_l2', roomIdPrimary: 'room_living_1', start: { x: 4500, y: 0 }, end: { x: 4500, y: 4000 }, thicknessMm: 150, heightMm: 3000, openings: [], photos: [] },
            { wallId: 'wall_l3', roomIdPrimary: 'room_living_1', start: { x: 4500, y: 4000 }, end: { x: 0, y: 4000 }, thicknessMm: 150, heightMm: 3000, openings: [], photos: [] },
            { wallId: 'wall_l4', roomIdPrimary: 'room_living_1', start: { x: 0, y: 4000 }, end: { x: 0, y: 0 }, thicknessMm: 150, heightMm: 3000, openings: [], photos: [] },
          ],
          openings: [],
          modules: [
            {
              moduleId: livingTvModuleId,
              moduleType: 'tv_unit',
              roomRef: 'room_living_1',
              wallRef: 'wall_l1',
              name: 'Living TV Feature Unit',
              geometry: {
                anchor: {
                  roomId: 'room_living_1',
                  wallId: 'wall_l1',
                  x: 2250,
                  y: 210,
                  z: 0,
                },
                size: {
                  widthMm: 2400,
                  heightMm: 2200,
                  depthMm: 420,
                },
                rotationDeg: 0,
              },
              params: {
                widthMm: 2400,
                heightMm: 2200,
                depthMm: 420,
                panelType: 'fluted',
                consoleType: 'floating',
              },
              materialAssignments: {
                primary_finish_name: 'Walnut Veneer',
              },
              productionMapping: {
                presetKey: 'tv_unit_premium_feature',
                boardDefault: '18mm BWP plywood',
                edgeDefault: '1mm matching edge band',
              },
            },
          ],
        },
      ],
      materials: [],
      lights: [],
      cameras: [],
      settings: { budgetBand: 'premium' },
      ruleResults: { passCount: 5, warnCount: 1, failCount: 0, results: [] },
    },
  });

  mockStore.budgetProfiles.push({
    id: makeId(),
    projectId,
    versionNumber: 1,
    isCurrent: true,
    budgetBand: 'premium',
    targetBudget: 1200000,
    maxBudget: 1450000,
    scopeType: 'turnkey',
    financingNeeded: false,
    priorities: { kitchen: 10, master_bedroom: 9, living_room: 8 },
    preferences: { maintenance: 'low', style: 'modern_contemporary' },
  });

  mockStore.estimateSets.push({
    id: makeId(),
    projectId,
    sceneVersionId: sceneId,
    budgetProfileId: mockStore.budgetProfiles[0].id,
    estimateType: 'concept',
    versionNumber: 1,
    status: 'shared',
    assumptions: { boardTier: 'tier_3_premium' },
    summary: { note: 'Concept estimate based on premium laminate + acrylic mix' },
    totals: { subtotal: 1085000, taxTotal: 195300, grandTotal: 1280300 },
    items: [
      {
        id: makeId(),
        lineCode: 'KIT-001',
        roomRef: 'room_kitchen_1',
        category: 'modular_unit',
        description: 'Modular kitchen package',
        quantity: 1,
        uom: 'lot',
        baseRate: 280000,
        marginRate: 0.18,
        lineTotal: 330400,
      },
    ],
  });

  mockStore.paymentPlans.push({
    id: makeId(),
    projectId,
    estimateSetId: mockStore.estimateSets[0].id,
    name: 'Standard Milestone Plan',
    versionNumber: 1,
    status: 'active',
    totalContractValue: 1280300,
    milestones: [
      { id: makeId(), milestoneKey: 'booking', milestoneLabel: 'Booking', dueType: 'event', dueEvent: 'booking', percentOfTotal: 0.1, sequenceNo: 1, status: 'paid' },
      { id: makeId(), milestoneKey: 'design_signoff', milestoneLabel: 'Design Sign-off', dueType: 'event', dueEvent: 'design_signoff', percentOfTotal: 0.5, sequenceNo: 2, status: 'due' },
    ],
  });

  mockStore.invoices.push({
    id: makeId(),
    projectId,
    paymentPlanId: mockStore.paymentPlans[0].id,
    milestoneId: mockStore.paymentPlans[0].milestones[0].id,
    invoiceType: 'advance',
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-06-20',
    dueDate: '2026-06-23',
    status: 'paid',
    currencyCode: 'INR',
    subtotal: 128030,
    taxTotal: 0,
    grandTotal: 128030,
    balanceDue: 0,
    lineItems: [
      { id: makeId(), category: 'design_service', description: 'Booking advance', quantity: 1, uom: 'lot', taxableValue: 128030, taxRate: 0, taxAmount: 0, lineTotal: 128030 },
    ],
  });

  mockStore.payments.push({
    id: makeId(),
    projectId,
    paymentPlanId: mockStore.paymentPlans[0].id,
    amount: 128030,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-06-21',
    status: 'cleared',
    allocations: [{ invoiceId: mockStore.invoices[0].id, allocatedAmount: 128030 }],
  });

  mockStore.variationOrders.push({
    id: makeId(),
    projectId,
    sourceEstimateSetId: mockStore.estimateSets[0].id,
    variationCode: 'VO-2026-001',
    status: 'priced',
    reasonCategory: 'finish_upgrade',
    description: 'Upgrade TV unit finish to veneer',
    costDelta: 45000,
    timelineDeltaDays: 2,
  });

  mockStore.purchaseOrders.push({
    id: makeId(),
    projectId,
    vendorName: 'Premium Laminates Vendor',
    poNumber: 'PO-2026-001',
    category: 'laminate',
    status: 'issued',
    expectedDeliveryDate: '2026-06-28',
    subtotal: 85000,
    taxTotal: 0,
    grandTotal: 85000,
    lines: [
      { id: makeId(), itemDescription: 'Walnut Veneer Laminate Sheets', quantity: 10, uom: 'sheet', unitRate: 8500, lineTotal: 85000 },
    ],
  });

  const renderSetId = makeId();
  const renderVariantDiagId = makeId();
  const renderVariantElevId = makeId();
  mockStore.renderSets.push({
    id: renderSetId,
    projectId,
    sceneVersionId: sceneId,
    roomRef: 'room_living_1',
    renderTier: 'review',
    status: 'ready',
    variants: [
      { id: renderVariantDiagId, cameraRef: 'cam_living_diag_01', lightingPresetRef: 'evening_warm_01', approvalStatus: 'shortlisted' },
      { id: renderVariantElevId, cameraRef: 'cam_living_elev_01', lightingPresetRef: 'day_soft_01', approvalStatus: 'pending' },
    ],
  });

  const drawingSetId = makeId();
  mockStore.drawingSets.push({
    id: drawingSetId,
    projectId,
    sceneVersionId: sceneId,
    drawingScope: 'room',
    status: 'ready',
    outputs: [
      { id: makeId(), drawingType: 'floor_plan', roomRef: 'room_living_1' },
      { id: makeId(), drawingType: 'elevation', roomRef: 'room_living_1', wallRef: 'wall_l1' },
    ],
  });

  const proposalId = makeId();
  mockStore.proposals.push({
    id: proposalId,
    projectId,
    sceneVersionId: sceneId,
    versionNumber: 1,
    status: 'draft',
    renderSetId,
    drawingSetId,
    pricingSetId: mockStore.estimateSets[0].id,
  });

  mockStore.approvalPackages.push({
    id: makeId(),
    projectId,
    sceneVersionId: sceneId,
    packageType: 'client_approval',
    status: 'pending',
    proposalSetId: proposalId,
    renderSetId,
    drawingSetId,
    pricingSetId: mockStore.estimateSets[0].id,
  });

  mockStore.jobs.push({
    id: makeId(),
    jobType: 'render_generation',
    status: 'succeeded',
    progress: 100,
    projectId,
    sourceEntityType: 'render_set',
    sourceEntityId: renderSetId,
    createdAt: nowIso(),
  });

  mockStore.renderFeedbacks.push(
    {
      id: makeId(),
      projectId,
      renderSetId,
      variantId: renderVariantDiagId,
      roomRef: 'room_living_1',
      decision: 'shortlisted',
      note: 'Warm lighting and diagonal camera composition preferred.',
      preferenceSignals: { cameraRef: 'cam_living_diag_01', lightingPresetRef: 'evening_warm_01' },
      createdAt: nowIso(),
    },
    {
      id: makeId(),
      projectId,
      renderSetId,
      variantId: renderVariantElevId,
      roomRef: 'room_living_1',
      decision: 'approved',
      note: 'Balanced elevation-like framing accepted for final concept sheet.',
      preferenceSignals: { cameraRef: 'cam_living_elev_01', lightingPresetRef: 'day_soft_01' },
      createdAt: nowIso(),
    }
  );

  mockStore.walkthroughCameras.push({
    id: makeId(),
    projectId,
    sceneVersionId: sceneId,
    roomRef: 'room_living_1',
    label: 'Living Room Fixed View',
    position: { x: 2250, y: 3200, z: 1500 },
    target: { x: 2250, y: 1600, z: 900 },
    createdAt: nowIso(),
  });

  mockStore.materials.push(
    {
      id: makeId(),
      category: 'laminate',
      subcategory: 'shutter_finish',
      code: 'LAM-001',
      name: 'Frosty White',
      brand: 'Generic',
      metadata: { budgetBand: 'standard', roomTypes: ['kitchen', 'wardrobe'], finish: 'matte' },
      pricing: { unit: 'sheet', rate: 2200 },
      isActive: true,
    },
    {
      id: makeId(),
      category: 'board',
      subcategory: 'carcass_board',
      code: 'BRD-018-BWP',
      name: 'BWP Plywood 18mm',
      brand: 'Generic',
      metadata: { budgetBand: 'premium', moisture: 'high', roomTypes: ['kitchen', 'utility'] },
      pricing: { unit: 'sheet', rate: 4800 },
      isActive: true,
    },
    {
      id: makeId(),
      category: 'veneer',
      subcategory: 'feature_finish',
      code: 'VEN-TEAK-01',
      name: 'Walnut Veneer',
      brand: 'PremiumWood',
      metadata: { budgetBand: 'luxury', roomTypes: ['living_room', 'tv_unit'], finish: 'veneer' },
      pricing: { unit: 'sheet', rate: 8500 },
      isActive: true,
    }
  );

  mockStore.timelineEvents.push(
    {
      id: makeId(),
      projectId,
      eventType: 'project.created',
      title: 'Project created',
      detail: 'Iyer Residence project initialized',
      actor: 'system',
      createdAt: nowIso(),
    },
    {
      id: makeId(),
      projectId,
      eventType: 'budget.profile.created',
      title: 'Budget profile saved',
      detail: 'Premium turnkey budget profile created',
      actor: 'estimator',
      createdAt: nowIso(),
    },
    {
      id: makeId(),
      projectId,
      eventType: 'estimate.created',
      title: 'Concept estimate created',
      detail: 'Concept estimate linked to scene v12',
      actor: 'estimator',
      createdAt: nowIso(),
    }
  );

  mockStore.agentInbox.push(
    {
      id: makeId(),
      projectId,
      observationType: 'budget_risk',
      title: 'Budget drift risk detected',
      detail: 'Premium veneer upgrade may exceed target budget.',
      disposition: 'advanced_ai',
      status: 'new',
      createdAt: nowIso(),
    },
    {
      id: makeId(),
      projectId,
      observationType: 'client_followup',
      title: 'Client follow-up due',
      detail: 'No response on concept estimate for 3 days.',
      disposition: 'small_ai',
      status: 'triaged',
      createdAt: nowIso(),
    }
  );
}

seedMockStore();

export function createLeadRecord(input: CreateLeadRequestDto): LeadRecord {
  return {
    id: makeId(),
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    city: input.city,
    source: input.source,
    status: 'new',
    projectType: input.projectType,
    budgetBand: input.budgetBand,
    urgencyLevel: input.urgencyLevel,
    notes: input.notes,
    createdAt: nowIso(),
  };
}
