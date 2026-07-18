import type { BudgetBand, EstimateType, JobStatus, JobType, ProjectStage, ProjectStatus, RenderTier, UUID } from './enums';
import type { BudgetProfile, EstimateSet, Invoice, PaymentPlan, PaymentReceipt, PurchaseOrder } from './commercial';
import type { DrawingSet, SceneDocument, SceneModule, SpatialModel } from './scene';
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface ApiEnvelope<T> {
    success: boolean;
    data: T | null;
    meta: Record<string, unknown>;
    error: ApiError | null;
}
export interface UserContextDto {
    id: UUID;
    studioId: UUID;
    role: string;
    fullName: string;
    email?: string;
}
export interface ProjectDto {
    id: UUID;
    clientId: UUID;
    projectCode: string;
    name: string;
    stage: ProjectStage;
    status: ProjectStatus;
    budgetBand?: BudgetBand;
    siteCity?: string;
}
export interface ReadinessDto {
    stage: ProjectStage;
    score: number;
    checks: Record<string, boolean>;
    nextRequiredAction?: string;
}
export interface ProjectSummaryDto extends ProjectDto {
    readiness: ReadinessDto;
    activeSceneVersionId?: UUID;
    activeFloorPlanVersionId?: UUID;
    staleFlags?: Record<string, boolean>;
    counts?: Record<string, number>;
}
export interface CreateLeadRequestDto {
    contactName: string;
    phone?: string;
    email?: string;
    city?: string;
    source: string;
    projectType?: string;
    budgetBand?: BudgetBand;
    urgencyLevel?: 'low' | 'medium' | 'high';
    notes?: string;
}
export interface CreateProjectRequestDto {
    leadId?: UUID;
    client: {
        primaryName: string;
        phone?: string;
        email?: string;
        city?: string;
    };
    name?: string;
    propertyType?: string;
    projectType?: string;
    budgetBand?: BudgetBand;
    siteCity?: string;
    siteAddressText?: string;
}
export interface UpdateProjectRequestDto {
    name?: string;
    budgetBand?: BudgetBand;
    targetTimelineText?: string;
    stage?: ProjectStage;
    status?: ProjectStatus;
}
export interface TransitionProjectRequestDto {
    nextStage: ProjectStage;
}
export interface SaveIntakeRequestDto {
    payload: Record<string, unknown>;
    isAutosave?: boolean;
}
export interface InterpretFloorPlanRequestDto {
    sourceAssetId: UUID;
    mode: 'image' | 'pdf' | 'scan' | 'hybrid';
    options?: {
        preferMetric?: boolean;
        inferRoomLabels?: boolean;
        inferOpenings?: boolean;
    };
}
export interface ReviewFloorPlanRequestDto {
    acceptRemainingHighConfidence?: boolean;
    corrections: Array<{
        itemType: 'room' | 'wall' | 'opening' | 'dimension' | 'symbol';
        itemRef: string;
        action: 'accept' | 'correct' | 'ignore';
        resolvedValue?: Record<string, unknown>;
    }>;
}
export interface ScenePatchOperationDto {
    op: 'add_room_metadata' | 'update_room_metadata' | 'update_wall_geometry' | 'add_opening' | 'update_opening' | 'place_module' | 'update_module_params' | 'remove_module' | 'assign_material' | 'assign_lighting_preset' | 'add_camera' | 'update_camera';
    roomRef?: string;
    wallRef?: string;
    moduleId?: UUID;
    params?: Record<string, unknown>;
    payload?: Record<string, unknown>;
}
export interface ScenePatchRequestDto {
    reason?: string;
    operations: ScenePatchOperationDto[];
}
export interface PlaceModuleRequestDto {
    templateKey: string;
    roomRef: string;
    wallRef?: string;
    anchor?: Record<string, unknown>;
    params: Record<string, unknown>;
}
export interface UpdateModuleRequestDto {
    name?: string;
    params?: Record<string, unknown>;
    materialAssignments?: Record<string, unknown>;
}
export interface CreateRenderSetRequestDto {
    roomRef?: string;
    renderTier: RenderTier;
    variantCount: number;
    cameraPresetIds?: UUID[];
    lightingPresetIds?: UUID[];
    stylePresetId?: string;
}
export interface CreateDrawingSetRequestDto {
    drawingScope: 'room' | 'full_project' | 'production';
    roomRefs?: string[];
    include: Array<'floor_plan' | 'elevations' | 'ceiling_plan' | 'module_schedule' | 'section'>;
}
export interface CreateProposalSetRequestDto {
    sceneVersionId: UUID;
    renderSetId?: UUID;
    drawingSetId?: UUID;
    pricingSetId?: UUID;
    sections?: string[];
}
export interface CreateApprovalPackageRequestDto {
    sceneVersionId: UUID;
    proposalSetId?: UUID;
    renderSetId?: UUID;
    drawingSetId?: UUID;
    pricingSetId?: UUID;
    packageType: 'concept' | 'client_approval' | 'production_lock';
}
export interface ApprovalDecisionRequestDto {
    decision: 'approved' | 'rejected';
    approvedByName?: string;
    comments?: string;
}
export interface GeneratePricingRequestDto {
    rateCardId: UUID;
    pricingMode?: 'estimate' | 'proposal' | 'final';
    includeLabor?: boolean;
    includeHardware?: boolean;
}
export interface GenerateBomRequestDto {
    productionPresetId: UUID;
    mode: 'draft' | 'approved_basis';
}
export interface CreateCommentRequestDto {
    projectId: UUID;
    targetType: 'project' | 'room' | 'wall' | 'module' | 'render_variant' | 'drawing_output' | 'proposal_set';
    targetId: string;
    body: string;
    metadata?: Record<string, unknown>;
}
export interface CreateBudgetProfileRequestDto extends Omit<BudgetProfile, 'id' | 'versionNumber' | 'isCurrent'> {
}
export interface CreateEstimateSetRequestDto {
    sceneVersionId?: UUID;
    budgetProfileId?: UUID;
    estimateType: EstimateType;
    assumptions?: Record<string, unknown>;
    items?: EstimateSet['items'];
}
export interface CreatePaymentPlanRequestDto {
    estimateSetId?: UUID;
    name: string;
    totalContractValue: number;
    milestones: PaymentPlan['milestones'];
}
export interface CreateInvoiceRequestDto {
    estimateSetId?: UUID;
    paymentPlanId?: UUID;
    milestoneId?: UUID;
    invoiceType: Invoice['invoiceType'];
    issueDate: string;
    dueDate?: string;
    currencyCode?: string;
    lineItems: Invoice['lineItems'];
    metadata?: Record<string, unknown>;
}
export interface RecordPaymentRequestDto {
    paymentPlanId?: UUID;
    amount: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    paymentDate: string;
    referenceNo?: string;
    notes?: string;
    allocations: PaymentReceipt['allocations'];
}
export interface CreateVariationOrderRequestDto {
    sceneVersionId?: UUID;
    sourceEstimateSetId?: UUID;
    revisedEstimateSetId?: UUID;
    reasonCategory: string;
    description: string;
    costDelta: number;
    timelineDeltaDays?: number;
    metadata?: Record<string, unknown>;
}
export interface CreatePurchaseOrderRequestDto {
    vendorName: string;
    category: string;
    expectedDeliveryDate?: string;
    lines: PurchaseOrder['lines'];
    metadata?: Record<string, unknown>;
}
export interface MaterialCatalogItemDto {
    id: UUID;
    category: string;
    subcategory?: string;
    code?: string;
    name: string;
    brand?: string;
    metadata?: Record<string, unknown>;
    pricing?: Record<string, unknown>;
    isActive?: boolean;
}
export interface TimelineEventDto {
    id: UUID;
    eventType: string;
    title: string;
    detail?: string;
    actor?: string;
    createdAt: string;
}
export interface SceneCompareDto {
    left: {
        id: UUID;
        branchName: string;
        versionNumber: number;
        isLocked: boolean;
    };
    right: {
        id: UUID;
        branchName: string;
        versionNumber: number;
        isLocked: boolean;
    };
    summary: {
        roomCountDelta: number;
        wallCountDelta: number;
        moduleCountDelta: number;
    };
    modules: {
        leftOnly: string[];
        rightOnly: string[];
    };
}
export interface JobDto {
    id: UUID;
    jobType: JobType | string;
    status: JobStatus | string;
    progress?: number;
    projectId?: UUID;
    sourceEntityType?: string;
    sourceEntityId?: UUID;
    createdAt?: string;
    result?: Record<string, unknown>;
    error?: Record<string, unknown>;
}
export interface SceneVersionDto {
    id: UUID;
    projectId: UUID;
    versionNumber: number;
    branchName: string;
    isCurrent: boolean;
    isLocked: boolean;
    lockReason?: string;
    lockedAt?: string;
    scene: SceneDocument;
}
export interface SpatialModelDto {
    id: UUID;
    projectId: UUID;
    versionNumber: number;
    isCurrent: boolean;
    model: SpatialModel;
}
export interface ModuleDto extends SceneModule {
}
export interface DrawingSetDto extends DrawingSet {
}
