import type { ApprovalStatus, BudgetBand, DrawingType, ModuleType, RenderTier, RoomType, RuleSeverity, RuleStatus, UUID } from './enums';
export interface Point2D {
    x: number;
    y: number;
}
export interface Point3D {
    x: number;
    y: number;
    z: number;
}
export interface SpatialRoomNode {
    roomId: string;
    roomType: RoomType | string;
    name: string;
    polygon2d: Point2D[];
    heightMm: number;
    notes?: string;
}
export interface SpatialWallNode {
    wallId: string;
    start: Point2D;
    end: Point2D;
    thicknessMm: number;
    heightMm: number;
}
export interface SpatialOpeningNode {
    openingId: string;
    wallId: string;
    openingType: 'door' | 'window' | 'arch' | 'niche';
    offsetFromStartMm: number;
    widthMm: number;
    sillHeightMm?: number;
    headHeightMm?: number;
}
export interface SpatialModel {
    units: 'mm';
    levels: Array<{
        levelId: string;
        name: string;
        elevationMm: number;
        rooms: SpatialRoomNode[];
        walls: SpatialWallNode[];
        openings: SpatialOpeningNode[];
    }>;
    adjacency: Array<{
        fromRoomId: string;
        toRoomId: string;
        relation: 'door' | 'open' | 'visual';
    }>;
    orientation?: {
        northAngleDeg?: number;
    };
}
export interface SceneMaterialRef {
    materialId: UUID;
    code?: string;
    name: string;
    category: string;
    brand?: string;
    budgetBand?: BudgetBand;
    metadata?: Record<string, unknown>;
}
export interface SceneLight {
    lightId: string;
    type: 'ambient' | 'spot' | 'profile' | 'cove' | 'pendant' | 'decorative';
    roomRef?: string;
    targetRef?: string;
    cctK?: number;
    intensity?: number;
    position?: Point3D;
}
export interface SceneCamera {
    cameraId: string;
    roomRef?: string;
    name: string;
    type: 'perspective' | 'orthographic';
    position: Point3D;
    target: Point3D;
    fovDeg?: number;
}
export interface RuleEvaluationItem {
    ruleCode: string;
    severity: RuleSeverity;
    status: RuleStatus;
    message: string;
    measured?: Record<string, unknown>;
    expected?: Record<string, unknown>;
    overrideAllowed: boolean;
}
export interface RuleEvaluationSummary {
    passCount: number;
    warnCount: number;
    failCount: number;
    score?: number;
    results: RuleEvaluationItem[];
}
export interface SceneRoom {
    roomId: string;
    roomType: RoomType | string;
    name: string;
    polygon2d: Point2D[];
    heightMm: number;
    floorFinishId?: UUID;
    ceilingStyleId?: string;
    walls: string[];
    modules: UUID[];
    furniture: string[];
    photos: UUID[];
    constraints?: {
        vastuZone?: string;
        daylightFaces?: string[];
        budgetBand?: BudgetBand;
    };
}
export interface SceneWall {
    wallId: string;
    roomIdPrimary: string;
    roomIdSecondary?: string;
    start: Point2D;
    end: Point2D;
    thicknessMm: number;
    heightMm: number;
    openings: string[];
    finishInnerId?: UUID;
    finishOuterId?: UUID;
    photos: UUID[];
}
export interface SceneOpening {
    openingId: string;
    wallId: string;
    openingType: 'door' | 'window' | 'arch' | 'niche';
    offsetFromStartMm: number;
    widthMm: number;
    sillHeightMm?: number;
    headHeightMm?: number;
}
export interface ModuleGeometry {
    anchor: {
        roomId: string;
        wallId?: string;
        x: number;
        y: number;
        z: number;
    };
    size: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    };
    rotationDeg: number;
}
export interface SceneModule {
    moduleId: UUID;
    moduleType: ModuleType | string;
    roomRef: string;
    wallRef?: string;
    name: string;
    geometry: ModuleGeometry;
    params: Record<string, unknown>;
    materialAssignments: Record<string, UUID | string>;
    productionMapping: Record<string, unknown>;
    validation?: RuleEvaluationSummary;
}
export interface SceneLevel {
    levelId: string;
    name: string;
    rooms: SceneRoom[];
    walls: SceneWall[];
    openings: SceneOpening[];
    modules: SceneModule[];
}
export interface SceneDocument {
    schemaVersion: string;
    projectId: UUID;
    units: 'mm';
    levels: SceneLevel[];
    materials: SceneMaterialRef[];
    lights: SceneLight[];
    cameras: SceneCamera[];
    settings: {
        defaultRenderPresetId?: string;
        defaultLightingPresetId?: string;
        budgetBand?: BudgetBand;
    };
    ruleResults: RuleEvaluationSummary;
}
export interface RenderVariant {
    id: UUID;
    cameraRef: string;
    lightingPresetRef: string;
    stylePresetRef?: string;
    assetId?: UUID;
    approvalStatus: ApprovalStatus;
}
export interface RenderSet {
    id: UUID;
    projectId: UUID;
    sceneVersionId: UUID;
    roomRef?: string;
    renderTier: RenderTier;
    status: 'queued' | 'processing' | 'ready' | 'failed' | 'approved' | 'stale';
    variants: RenderVariant[];
}
export interface DrawingOutput {
    id: UUID;
    drawingType: DrawingType;
    roomRef?: string;
    wallRef?: string;
    assetId?: UUID;
}
export interface DrawingSet {
    id: UUID;
    projectId: UUID;
    sceneVersionId: UUID;
    drawingScope: 'room' | 'full_project' | 'production';
    status: 'queued' | 'ready' | 'failed' | 'stale';
    outputs: DrawingOutput[];
}
