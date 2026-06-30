import { z } from 'zod';
export declare const UuidSchema: z.ZodString;
export declare const ISODateSchema: z.ZodString;
export declare const ISODateTimeSchema: z.ZodUnion<[z.ZodString, z.ZodString]>;
export declare const UserRoleSchema: z.ZodEnum<["admin", "owner", "designer", "sales_designer", "estimator", "production_manager", "site_exec", "client_viewer"]>;
export declare const ProjectStageSchema: z.ZodEnum<["draft", "lead_qualified", "intake_in_progress", "intake_complete", "site_capture", "plan_analysis_review", "scene_ready", "design_in_progress", "render_review", "proposal_review", "client_approval_pending", "design_approved", "production_preparation", "production_ready", "delivered"]>;
export declare const ProjectStatusSchema: z.ZodEnum<["active", "on_hold", "completed", "archived"]>;
export declare const BudgetBandSchema: z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>;
export declare const RoomTypeSchema: z.ZodEnum<["foyer", "living_room", "dining_room", "kitchen", "utility", "master_bedroom", "bedroom", "kids_bedroom", "guest_bedroom", "study", "balcony", "bathroom", "powder_room", "mandir_room", "passage", "office_cabin", "workstation_area", "reception", "showroom_zone"]>;
export declare const ModuleTypeSchema: z.ZodEnum<["kitchen_base_run", "kitchen_wall_run", "kitchen_tall_unit", "kitchen_sink_unit", "kitchen_hob_unit", "kitchen_island", "wardrobe_swing", "wardrobe_sliding", "loft_storage", "tv_unit", "feature_wall_panel_system", "mandir_floor_unit", "mandir_wall_unit", "crockery_unit", "study_desk", "shoe_rack", "vanity_unit", "utility_storage", "false_ceiling_system"]>;
export declare const RenderTierSchema: z.ZodEnum<["draft", "review", "final"]>;
export declare const DrawingTypeSchema: z.ZodEnum<["floor_plan", "elevation", "ceiling_plan", "schedule_sheet", "section"]>;
export declare const ApprovalStatusSchema: z.ZodEnum<["pending", "shortlisted", "approved", "rejected"]>;
export declare const EstimateTypeSchema: z.ZodEnum<["rough", "budget_fit", "concept", "boq_quote", "final_quote", "variation_quote"]>;
export declare const EstimateStatusSchema: z.ZodEnum<["draft", "shared", "revised", "approved", "rejected", "superseded"]>;
export declare const InvoiceTypeSchema: z.ZodEnum<["proforma", "advance", "milestone", "tax", "final", "credit_note", "debit_note"]>;
export declare const InvoiceStatusSchema: z.ZodEnum<["draft", "issued", "partially_paid", "paid", "overdue", "void"]>;
export declare const PaymentMethodSchema: z.ZodEnum<["bank_transfer", "cheque", "cash", "card", "upi", "emi_partner", "finance_partner", "other"]>;
export declare const PaymentStatusSchema: z.ZodEnum<["recorded", "cleared", "bounced", "reversed", "refunded"]>;
export declare const VariationStatusSchema: z.ZodEnum<["proposed", "priced", "awaiting_client_approval", "approved", "rejected", "executed", "canceled"]>;
export declare const RuleSeveritySchema: z.ZodEnum<["hard", "soft", "advisory", "score"]>;
export declare const RuleStatusSchema: z.ZodEnum<["pass", "warn", "fail"]>;
export declare const JobTypeSchema: z.ZodEnum<["floor_plan_interpretation", "floor_plan_review_package", "scene_shell_generation", "scene_validation", "pricing_generation", "render_generation", "drawing_generation", "proposal_export", "bom_generation", "cutlist_generation", "deliverables_packaging", "similarity_indexing"]>;
export declare const JobStatusSchema: z.ZodEnum<["queued", "running", "waiting_for_input", "succeeded", "failed", "canceled", "stale"]>;
export declare const Point2DSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const Point3DSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    z: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    z: number;
}, {
    x: number;
    y: number;
    z: number;
}>;
export declare const ModuleGeometrySchema: z.ZodObject<{
    anchor: z.ZodObject<{
        roomId: z.ZodString;
        wallId: z.ZodOptional<z.ZodString>;
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
        roomId: string;
        wallId?: string | undefined;
    }, {
        x: number;
        y: number;
        z: number;
        roomId: string;
        wallId?: string | undefined;
    }>;
    size: z.ZodObject<{
        widthMm: z.ZodNumber;
        heightMm: z.ZodNumber;
        depthMm: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    }, {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    }>;
    rotationDeg: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    anchor: {
        x: number;
        y: number;
        z: number;
        roomId: string;
        wallId?: string | undefined;
    };
    size: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    };
    rotationDeg: number;
}, {
    anchor: {
        x: number;
        y: number;
        z: number;
        roomId: string;
        wallId?: string | undefined;
    };
    size: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    };
    rotationDeg: number;
}>;
export declare const SceneModuleSchema: z.ZodObject<{
    moduleId: z.ZodString;
    moduleType: z.ZodString;
    roomRef: z.ZodString;
    wallRef: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    geometry: z.ZodObject<{
        anchor: z.ZodObject<{
            roomId: z.ZodString;
            wallId: z.ZodOptional<z.ZodString>;
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        }, {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        }>;
        size: z.ZodObject<{
            widthMm: z.ZodNumber;
            heightMm: z.ZodNumber;
            depthMm: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        }, {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        }>;
        rotationDeg: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        anchor: {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        };
        size: {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        };
        rotationDeg: number;
    }, {
        anchor: {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        };
        size: {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        };
        rotationDeg: number;
    }>;
    params: z.ZodRecord<z.ZodString, z.ZodAny>;
    materialAssignments: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    productionMapping: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    params: Record<string, any>;
    moduleId: string;
    moduleType: string;
    roomRef: string;
    geometry: {
        anchor: {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        };
        size: {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        };
        rotationDeg: number;
    };
    materialAssignments: Record<string, string>;
    productionMapping: Record<string, any>;
    wallRef?: string | undefined;
}, {
    name: string;
    params: Record<string, any>;
    moduleId: string;
    moduleType: string;
    roomRef: string;
    geometry: {
        anchor: {
            x: number;
            y: number;
            z: number;
            roomId: string;
            wallId?: string | undefined;
        };
        size: {
            widthMm: number;
            heightMm: number;
            depthMm: number;
        };
        rotationDeg: number;
    };
    wallRef?: string | undefined;
    materialAssignments?: Record<string, string> | undefined;
    productionMapping?: Record<string, any> | undefined;
}>;
export declare const SceneWallSchema: z.ZodObject<{
    wallId: z.ZodString;
    roomIdPrimary: z.ZodString;
    roomIdSecondary: z.ZodOptional<z.ZodString>;
    start: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    end: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    thicknessMm: z.ZodNumber;
    heightMm: z.ZodNumber;
    openings: z.ZodArray<z.ZodString, "many">;
    finishInnerId: z.ZodOptional<z.ZodString>;
    finishOuterId: z.ZodOptional<z.ZodString>;
    photos: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    end: {
        x: number;
        y: number;
    };
    wallId: string;
    heightMm: number;
    roomIdPrimary: string;
    start: {
        x: number;
        y: number;
    };
    thicknessMm: number;
    openings: string[];
    photos: string[];
    roomIdSecondary?: string | undefined;
    finishInnerId?: string | undefined;
    finishOuterId?: string | undefined;
}, {
    end: {
        x: number;
        y: number;
    };
    wallId: string;
    heightMm: number;
    roomIdPrimary: string;
    start: {
        x: number;
        y: number;
    };
    thicknessMm: number;
    openings: string[];
    photos: string[];
    roomIdSecondary?: string | undefined;
    finishInnerId?: string | undefined;
    finishOuterId?: string | undefined;
}>;
export declare const SceneRoomSchema: z.ZodObject<{
    roomId: z.ZodString;
    roomType: z.ZodString;
    name: z.ZodString;
    polygon2d: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>, "many">;
    heightMm: z.ZodNumber;
    floorFinishId: z.ZodOptional<z.ZodString>;
    ceilingStyleId: z.ZodOptional<z.ZodString>;
    walls: z.ZodArray<z.ZodString, "many">;
    modules: z.ZodArray<z.ZodString, "many">;
    furniture: z.ZodArray<z.ZodString, "many">;
    photos: z.ZodArray<z.ZodString, "many">;
    constraints: z.ZodOptional<z.ZodObject<{
        vastuZone: z.ZodOptional<z.ZodString>;
        daylightFaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        budgetBand: z.ZodOptional<z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>>;
    }, "strip", z.ZodTypeAny, {
        budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
        vastuZone?: string | undefined;
        daylightFaces?: string[] | undefined;
    }, {
        budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
        vastuZone?: string | undefined;
        daylightFaces?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    roomId: string;
    heightMm: number;
    photos: string[];
    roomType: string;
    polygon2d: {
        x: number;
        y: number;
    }[];
    walls: string[];
    modules: string[];
    furniture: string[];
    floorFinishId?: string | undefined;
    ceilingStyleId?: string | undefined;
    constraints?: {
        budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
        vastuZone?: string | undefined;
        daylightFaces?: string[] | undefined;
    } | undefined;
}, {
    name: string;
    roomId: string;
    heightMm: number;
    photos: string[];
    roomType: string;
    polygon2d: {
        x: number;
        y: number;
    }[];
    walls: string[];
    modules: string[];
    furniture: string[];
    floorFinishId?: string | undefined;
    ceilingStyleId?: string | undefined;
    constraints?: {
        budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
        vastuZone?: string | undefined;
        daylightFaces?: string[] | undefined;
    } | undefined;
}>;
export declare const SceneDocumentSchema: z.ZodObject<{
    schemaVersion: z.ZodString;
    projectId: z.ZodString;
    units: z.ZodLiteral<"mm">;
    levels: z.ZodArray<z.ZodObject<{
        levelId: z.ZodString;
        name: z.ZodString;
        rooms: z.ZodArray<z.ZodObject<{
            roomId: z.ZodString;
            roomType: z.ZodString;
            name: z.ZodString;
            polygon2d: z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>, "many">;
            heightMm: z.ZodNumber;
            floorFinishId: z.ZodOptional<z.ZodString>;
            ceilingStyleId: z.ZodOptional<z.ZodString>;
            walls: z.ZodArray<z.ZodString, "many">;
            modules: z.ZodArray<z.ZodString, "many">;
            furniture: z.ZodArray<z.ZodString, "many">;
            photos: z.ZodArray<z.ZodString, "many">;
            constraints: z.ZodOptional<z.ZodObject<{
                vastuZone: z.ZodOptional<z.ZodString>;
                daylightFaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                budgetBand: z.ZodOptional<z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>>;
            }, "strip", z.ZodTypeAny, {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            }, {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }, {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }>, "many">;
        walls: z.ZodArray<z.ZodObject<{
            wallId: z.ZodString;
            roomIdPrimary: z.ZodString;
            roomIdSecondary: z.ZodOptional<z.ZodString>;
            start: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>;
            end: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>;
            thicknessMm: z.ZodNumber;
            heightMm: z.ZodNumber;
            openings: z.ZodArray<z.ZodString, "many">;
            finishInnerId: z.ZodOptional<z.ZodString>;
            finishOuterId: z.ZodOptional<z.ZodString>;
            photos: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }, {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }>, "many">;
        openings: z.ZodArray<z.ZodAny, "many">;
        modules: z.ZodArray<z.ZodObject<{
            moduleId: z.ZodString;
            moduleType: z.ZodString;
            roomRef: z.ZodString;
            wallRef: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            geometry: z.ZodObject<{
                anchor: z.ZodObject<{
                    roomId: z.ZodString;
                    wallId: z.ZodOptional<z.ZodString>;
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    z: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                }, {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                }>;
                size: z.ZodObject<{
                    widthMm: z.ZodNumber;
                    heightMm: z.ZodNumber;
                    depthMm: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                }, {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                }>;
                rotationDeg: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            }, {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            }>;
            params: z.ZodRecord<z.ZodString, z.ZodAny>;
            materialAssignments: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            productionMapping: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            materialAssignments: Record<string, string>;
            productionMapping: Record<string, any>;
            wallRef?: string | undefined;
        }, {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            wallRef?: string | undefined;
            materialAssignments?: Record<string, string> | undefined;
            productionMapping?: Record<string, any> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        openings: any[];
        walls: {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }[];
        modules: {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            materialAssignments: Record<string, string>;
            productionMapping: Record<string, any>;
            wallRef?: string | undefined;
        }[];
        levelId: string;
        rooms: {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }[];
    }, {
        name: string;
        openings: any[];
        walls: {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }[];
        modules: {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            wallRef?: string | undefined;
            materialAssignments?: Record<string, string> | undefined;
            productionMapping?: Record<string, any> | undefined;
        }[];
        levelId: string;
        rooms: {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }[];
    }>, "many">;
    materials: z.ZodArray<z.ZodAny, "many">;
    lights: z.ZodArray<z.ZodAny, "many">;
    cameras: z.ZodArray<z.ZodAny, "many">;
    settings: z.ZodRecord<z.ZodString, z.ZodAny>;
    ruleResults: z.ZodObject<{
        passCount: z.ZodNumber;
        warnCount: z.ZodNumber;
        failCount: z.ZodNumber;
        score: z.ZodOptional<z.ZodNumber>;
        results: z.ZodArray<z.ZodObject<{
            ruleCode: z.ZodString;
            severity: z.ZodEnum<["hard", "soft", "advisory", "score"]>;
            status: z.ZodEnum<["pass", "warn", "fail"]>;
            message: z.ZodString;
            overrideAllowed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }, {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        passCount: number;
        warnCount: number;
        failCount: number;
        results: {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }[];
        score?: number | undefined;
    }, {
        passCount: number;
        warnCount: number;
        failCount: number;
        results: {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }[];
        score?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    schemaVersion: string;
    units: "mm";
    levels: {
        name: string;
        openings: any[];
        walls: {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }[];
        modules: {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            materialAssignments: Record<string, string>;
            productionMapping: Record<string, any>;
            wallRef?: string | undefined;
        }[];
        levelId: string;
        rooms: {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }[];
    }[];
    materials: any[];
    lights: any[];
    cameras: any[];
    settings: Record<string, any>;
    ruleResults: {
        passCount: number;
        warnCount: number;
        failCount: number;
        results: {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }[];
        score?: number | undefined;
    };
}, {
    projectId: string;
    schemaVersion: string;
    units: "mm";
    levels: {
        name: string;
        openings: any[];
        walls: {
            end: {
                x: number;
                y: number;
            };
            wallId: string;
            heightMm: number;
            roomIdPrimary: string;
            start: {
                x: number;
                y: number;
            };
            thicknessMm: number;
            openings: string[];
            photos: string[];
            roomIdSecondary?: string | undefined;
            finishInnerId?: string | undefined;
            finishOuterId?: string | undefined;
        }[];
        modules: {
            name: string;
            params: Record<string, any>;
            moduleId: string;
            moduleType: string;
            roomRef: string;
            geometry: {
                anchor: {
                    x: number;
                    y: number;
                    z: number;
                    roomId: string;
                    wallId?: string | undefined;
                };
                size: {
                    widthMm: number;
                    heightMm: number;
                    depthMm: number;
                };
                rotationDeg: number;
            };
            wallRef?: string | undefined;
            materialAssignments?: Record<string, string> | undefined;
            productionMapping?: Record<string, any> | undefined;
        }[];
        levelId: string;
        rooms: {
            name: string;
            roomId: string;
            heightMm: number;
            photos: string[];
            roomType: string;
            polygon2d: {
                x: number;
                y: number;
            }[];
            walls: string[];
            modules: string[];
            furniture: string[];
            floorFinishId?: string | undefined;
            ceilingStyleId?: string | undefined;
            constraints?: {
                budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
                vastuZone?: string | undefined;
                daylightFaces?: string[] | undefined;
            } | undefined;
        }[];
    }[];
    materials: any[];
    lights: any[];
    cameras: any[];
    settings: Record<string, any>;
    ruleResults: {
        passCount: number;
        warnCount: number;
        failCount: number;
        results: {
            message: string;
            status: "warn" | "pass" | "fail";
            ruleCode: string;
            severity: "hard" | "soft" | "advisory" | "score";
            overrideAllowed: boolean;
        }[];
        score?: number | undefined;
    };
}>;
export declare const CreateLeadRequestSchema: z.ZodObject<{
    contactName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    source: z.ZodString;
    projectType: z.ZodOptional<z.ZodString>;
    budgetBand: z.ZodOptional<z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>>;
    urgencyLevel: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contactName: string;
    source: string;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    projectType?: string | undefined;
    urgencyLevel?: "low" | "medium" | "high" | undefined;
    notes?: string | undefined;
}, {
    contactName: string;
    source: string;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    projectType?: string | undefined;
    urgencyLevel?: "low" | "medium" | "high" | undefined;
    notes?: string | undefined;
}>;
export declare const CreateProjectRequestSchema: z.ZodObject<{
    leadId: z.ZodOptional<z.ZodString>;
    client: z.ZodObject<{
        primaryName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primaryName: string;
        phone?: string | undefined;
        email?: string | undefined;
        city?: string | undefined;
    }, {
        primaryName: string;
        phone?: string | undefined;
        email?: string | undefined;
        city?: string | undefined;
    }>;
    name: z.ZodOptional<z.ZodString>;
    propertyType: z.ZodOptional<z.ZodString>;
    projectType: z.ZodOptional<z.ZodString>;
    budgetBand: z.ZodOptional<z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>>;
    siteCity: z.ZodOptional<z.ZodString>;
    siteAddressText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    client: {
        primaryName: string;
        phone?: string | undefined;
        email?: string | undefined;
        city?: string | undefined;
    };
    name?: string | undefined;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    projectType?: string | undefined;
    leadId?: string | undefined;
    propertyType?: string | undefined;
    siteCity?: string | undefined;
    siteAddressText?: string | undefined;
}, {
    client: {
        primaryName: string;
        phone?: string | undefined;
        email?: string | undefined;
        city?: string | undefined;
    };
    name?: string | undefined;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    projectType?: string | undefined;
    leadId?: string | undefined;
    propertyType?: string | undefined;
    siteCity?: string | undefined;
    siteAddressText?: string | undefined;
}>;
export declare const UpdateProjectRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    budgetBand: z.ZodOptional<z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>>;
    targetTimelineText: z.ZodOptional<z.ZodString>;
    stage: z.ZodOptional<z.ZodEnum<["draft", "lead_qualified", "intake_in_progress", "intake_complete", "site_capture", "plan_analysis_review", "scene_ready", "design_in_progress", "render_review", "proposal_review", "client_approval_pending", "design_approved", "production_preparation", "production_ready", "delivered"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "on_hold", "completed", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "active" | "on_hold" | "completed" | "archived" | undefined;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    targetTimelineText?: string | undefined;
    stage?: "draft" | "lead_qualified" | "intake_in_progress" | "intake_complete" | "site_capture" | "plan_analysis_review" | "scene_ready" | "design_in_progress" | "render_review" | "proposal_review" | "client_approval_pending" | "design_approved" | "production_preparation" | "production_ready" | "delivered" | undefined;
}, {
    name?: string | undefined;
    status?: "active" | "on_hold" | "completed" | "archived" | undefined;
    budgetBand?: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke" | undefined;
    targetTimelineText?: string | undefined;
    stage?: "draft" | "lead_qualified" | "intake_in_progress" | "intake_complete" | "site_capture" | "plan_analysis_review" | "scene_ready" | "design_in_progress" | "render_review" | "proposal_review" | "client_approval_pending" | "design_approved" | "production_preparation" | "production_ready" | "delivered" | undefined;
}>;
export declare const TransitionProjectRequestSchema: z.ZodObject<{
    nextStage: z.ZodEnum<["draft", "lead_qualified", "intake_in_progress", "intake_complete", "site_capture", "plan_analysis_review", "scene_ready", "design_in_progress", "render_review", "proposal_review", "client_approval_pending", "design_approved", "production_preparation", "production_ready", "delivered"]>;
}, "strip", z.ZodTypeAny, {
    nextStage: "draft" | "lead_qualified" | "intake_in_progress" | "intake_complete" | "site_capture" | "plan_analysis_review" | "scene_ready" | "design_in_progress" | "render_review" | "proposal_review" | "client_approval_pending" | "design_approved" | "production_preparation" | "production_ready" | "delivered";
}, {
    nextStage: "draft" | "lead_qualified" | "intake_in_progress" | "intake_complete" | "site_capture" | "plan_analysis_review" | "scene_ready" | "design_in_progress" | "render_review" | "proposal_review" | "client_approval_pending" | "design_approved" | "production_preparation" | "production_ready" | "delivered";
}>;
export declare const SaveIntakeRequestSchema: z.ZodObject<{
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    isAutosave: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    payload: Record<string, any>;
    isAutosave?: boolean | undefined;
}, {
    payload: Record<string, any>;
    isAutosave?: boolean | undefined;
}>;
export declare const InterpretFloorPlanRequestSchema: z.ZodObject<{
    sourceAssetId: z.ZodString;
    mode: z.ZodEnum<["image", "pdf", "scan", "hybrid"]>;
    options: z.ZodOptional<z.ZodObject<{
        preferMetric: z.ZodOptional<z.ZodBoolean>;
        inferRoomLabels: z.ZodOptional<z.ZodBoolean>;
        inferOpenings: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preferMetric?: boolean | undefined;
        inferRoomLabels?: boolean | undefined;
        inferOpenings?: boolean | undefined;
    }, {
        preferMetric?: boolean | undefined;
        inferRoomLabels?: boolean | undefined;
        inferOpenings?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    sourceAssetId: string;
    mode: "image" | "pdf" | "scan" | "hybrid";
    options?: {
        preferMetric?: boolean | undefined;
        inferRoomLabels?: boolean | undefined;
        inferOpenings?: boolean | undefined;
    } | undefined;
}, {
    sourceAssetId: string;
    mode: "image" | "pdf" | "scan" | "hybrid";
    options?: {
        preferMetric?: boolean | undefined;
        inferRoomLabels?: boolean | undefined;
        inferOpenings?: boolean | undefined;
    } | undefined;
}>;
export declare const ReviewFloorPlanRequestSchema: z.ZodObject<{
    acceptRemainingHighConfidence: z.ZodOptional<z.ZodBoolean>;
    corrections: z.ZodArray<z.ZodObject<{
        itemType: z.ZodEnum<["room", "wall", "opening", "dimension", "symbol"]>;
        itemRef: z.ZodString;
        action: z.ZodEnum<["accept", "correct", "ignore"]>;
        resolvedValue: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        itemType: "symbol" | "room" | "wall" | "opening" | "dimension";
        itemRef: string;
        action: "accept" | "correct" | "ignore";
        resolvedValue?: Record<string, any> | undefined;
    }, {
        itemType: "symbol" | "room" | "wall" | "opening" | "dimension";
        itemRef: string;
        action: "accept" | "correct" | "ignore";
        resolvedValue?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    corrections: {
        itemType: "symbol" | "room" | "wall" | "opening" | "dimension";
        itemRef: string;
        action: "accept" | "correct" | "ignore";
        resolvedValue?: Record<string, any> | undefined;
    }[];
    acceptRemainingHighConfidence?: boolean | undefined;
}, {
    corrections: {
        itemType: "symbol" | "room" | "wall" | "opening" | "dimension";
        itemRef: string;
        action: "accept" | "correct" | "ignore";
        resolvedValue?: Record<string, any> | undefined;
    }[];
    acceptRemainingHighConfidence?: boolean | undefined;
}>;
export declare const ScenePatchRequestSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
    operations: z.ZodArray<z.ZodObject<{
        op: z.ZodString;
        roomRef: z.ZodOptional<z.ZodString>;
        wallRef: z.ZodOptional<z.ZodString>;
        moduleId: z.ZodOptional<z.ZodString>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        op: string;
        params?: Record<string, any> | undefined;
        moduleId?: string | undefined;
        roomRef?: string | undefined;
        wallRef?: string | undefined;
        payload?: Record<string, any> | undefined;
    }, {
        op: string;
        params?: Record<string, any> | undefined;
        moduleId?: string | undefined;
        roomRef?: string | undefined;
        wallRef?: string | undefined;
        payload?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    operations: {
        op: string;
        params?: Record<string, any> | undefined;
        moduleId?: string | undefined;
        roomRef?: string | undefined;
        wallRef?: string | undefined;
        payload?: Record<string, any> | undefined;
    }[];
    reason?: string | undefined;
}, {
    operations: {
        op: string;
        params?: Record<string, any> | undefined;
        moduleId?: string | undefined;
        roomRef?: string | undefined;
        wallRef?: string | undefined;
        payload?: Record<string, any> | undefined;
    }[];
    reason?: string | undefined;
}>;
export declare const PlaceModuleRequestSchema: z.ZodObject<{
    templateKey: z.ZodString;
    roomRef: z.ZodString;
    wallRef: z.ZodOptional<z.ZodString>;
    anchor: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    params: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    params: Record<string, any>;
    roomRef: string;
    templateKey: string;
    anchor?: Record<string, any> | undefined;
    wallRef?: string | undefined;
}, {
    params: Record<string, any>;
    roomRef: string;
    templateKey: string;
    anchor?: Record<string, any> | undefined;
    wallRef?: string | undefined;
}>;
export declare const CreateRenderSetRequestSchema: z.ZodObject<{
    roomRef: z.ZodOptional<z.ZodString>;
    renderTier: z.ZodEnum<["draft", "review", "final"]>;
    variantCount: z.ZodNumber;
    cameraPresetIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lightingPresetIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    stylePresetId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    renderTier: "draft" | "review" | "final";
    variantCount: number;
    roomRef?: string | undefined;
    cameraPresetIds?: string[] | undefined;
    lightingPresetIds?: string[] | undefined;
    stylePresetId?: string | undefined;
}, {
    renderTier: "draft" | "review" | "final";
    variantCount: number;
    roomRef?: string | undefined;
    cameraPresetIds?: string[] | undefined;
    lightingPresetIds?: string[] | undefined;
    stylePresetId?: string | undefined;
}>;
export declare const CreateDrawingSetRequestSchema: z.ZodObject<{
    drawingScope: z.ZodEnum<["room", "full_project", "production"]>;
    roomRefs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    include: z.ZodArray<z.ZodEnum<["floor_plan", "elevations", "ceiling_plan", "module_schedule", "section"]>, "many">;
}, "strip", z.ZodTypeAny, {
    drawingScope: "production" | "room" | "full_project";
    include: ("floor_plan" | "ceiling_plan" | "section" | "elevations" | "module_schedule")[];
    roomRefs?: string[] | undefined;
}, {
    drawingScope: "production" | "room" | "full_project";
    include: ("floor_plan" | "ceiling_plan" | "section" | "elevations" | "module_schedule")[];
    roomRefs?: string[] | undefined;
}>;
export declare const CreateProposalSetRequestSchema: z.ZodObject<{
    sceneVersionId: z.ZodString;
    renderSetId: z.ZodOptional<z.ZodString>;
    drawingSetId: z.ZodOptional<z.ZodString>;
    pricingSetId: z.ZodOptional<z.ZodString>;
    sections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    sceneVersionId: string;
    renderSetId?: string | undefined;
    drawingSetId?: string | undefined;
    pricingSetId?: string | undefined;
    sections?: string[] | undefined;
}, {
    sceneVersionId: string;
    renderSetId?: string | undefined;
    drawingSetId?: string | undefined;
    pricingSetId?: string | undefined;
    sections?: string[] | undefined;
}>;
export declare const CreateApprovalPackageRequestSchema: z.ZodObject<{
    sceneVersionId: z.ZodString;
    proposalSetId: z.ZodOptional<z.ZodString>;
    renderSetId: z.ZodOptional<z.ZodString>;
    drawingSetId: z.ZodOptional<z.ZodString>;
    pricingSetId: z.ZodOptional<z.ZodString>;
    packageType: z.ZodEnum<["concept", "client_approval", "production_lock"]>;
}, "strip", z.ZodTypeAny, {
    sceneVersionId: string;
    packageType: "concept" | "client_approval" | "production_lock";
    renderSetId?: string | undefined;
    drawingSetId?: string | undefined;
    pricingSetId?: string | undefined;
    proposalSetId?: string | undefined;
}, {
    sceneVersionId: string;
    packageType: "concept" | "client_approval" | "production_lock";
    renderSetId?: string | undefined;
    drawingSetId?: string | undefined;
    pricingSetId?: string | undefined;
    proposalSetId?: string | undefined;
}>;
export declare const ApprovalDecisionRequestSchema: z.ZodObject<{
    decision: z.ZodEnum<["approved", "rejected"]>;
    approvedByName: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "approved" | "rejected";
    approvedByName?: string | undefined;
    comments?: string | undefined;
}, {
    decision: "approved" | "rejected";
    approvedByName?: string | undefined;
    comments?: string | undefined;
}>;
export declare const GeneratePricingRequestSchema: z.ZodObject<{
    rateCardId: z.ZodString;
    pricingMode: z.ZodOptional<z.ZodEnum<["estimate", "proposal", "final"]>>;
    includeLabor: z.ZodOptional<z.ZodBoolean>;
    includeHardware: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rateCardId: string;
    pricingMode?: "final" | "estimate" | "proposal" | undefined;
    includeLabor?: boolean | undefined;
    includeHardware?: boolean | undefined;
}, {
    rateCardId: string;
    pricingMode?: "final" | "estimate" | "proposal" | undefined;
    includeLabor?: boolean | undefined;
    includeHardware?: boolean | undefined;
}>;
export declare const EstimateLineItemSchema: z.ZodObject<{
    lineCode: z.ZodString;
    roomRef: z.ZodOptional<z.ZodString>;
    moduleRef: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    description: z.ZodString;
    quantity: z.ZodNumber;
    uom: z.ZodString;
    baseRate: z.ZodNumber;
    marginRate: z.ZodNumber;
    lineTotal: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    lineCode: string;
    category: string;
    description: string;
    quantity: number;
    uom: string;
    baseRate: number;
    marginRate: number;
    lineTotal: number;
    roomRef?: string | undefined;
    moduleRef?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    lineCode: string;
    category: string;
    description: string;
    quantity: number;
    uom: string;
    baseRate: number;
    marginRate: number;
    lineTotal: number;
    roomRef?: string | undefined;
    moduleRef?: string | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export declare const CreateBudgetProfileRequestSchema: z.ZodObject<{
    budgetBand: z.ZodEnum<["economy", "standard", "premium", "luxury", "ultra_luxury_bespoke"]>;
    targetBudget: z.ZodOptional<z.ZodNumber>;
    maxBudget: z.ZodOptional<z.ZodNumber>;
    scopeType: z.ZodEnum<["full_home", "room_package", "modular_only", "turnkey", "design_only"]>;
    financingNeeded: z.ZodBoolean;
    priorities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    budgetBand: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke";
    scopeType: "full_home" | "room_package" | "modular_only" | "turnkey" | "design_only";
    financingNeeded: boolean;
    targetBudget?: number | undefined;
    maxBudget?: number | undefined;
    priorities?: Record<string, number> | undefined;
    preferences?: Record<string, any> | undefined;
}, {
    budgetBand: "economy" | "standard" | "premium" | "luxury" | "ultra_luxury_bespoke";
    scopeType: "full_home" | "room_package" | "modular_only" | "turnkey" | "design_only";
    financingNeeded: boolean;
    targetBudget?: number | undefined;
    maxBudget?: number | undefined;
    priorities?: Record<string, number> | undefined;
    preferences?: Record<string, any> | undefined;
}>;
export declare const CreateEstimateSetRequestSchema: z.ZodObject<{
    sceneVersionId: z.ZodOptional<z.ZodString>;
    budgetProfileId: z.ZodOptional<z.ZodString>;
    estimateType: z.ZodEnum<["rough", "budget_fit", "concept", "boq_quote", "final_quote", "variation_quote"]>;
    assumptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        lineCode: z.ZodString;
        roomRef: z.ZodOptional<z.ZodString>;
        moduleRef: z.ZodOptional<z.ZodString>;
        category: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        uom: z.ZodString;
        baseRate: z.ZodNumber;
        marginRate: z.ZodNumber;
        lineTotal: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        lineCode: string;
        category: string;
        description: string;
        quantity: number;
        uom: string;
        baseRate: number;
        marginRate: number;
        lineTotal: number;
        roomRef?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }, {
        lineCode: string;
        category: string;
        description: string;
        quantity: number;
        uom: string;
        baseRate: number;
        marginRate: number;
        lineTotal: number;
        roomRef?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    estimateType: "rough" | "budget_fit" | "concept" | "boq_quote" | "final_quote" | "variation_quote";
    items?: {
        lineCode: string;
        category: string;
        description: string;
        quantity: number;
        uom: string;
        baseRate: number;
        marginRate: number;
        lineTotal: number;
        roomRef?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[] | undefined;
    sceneVersionId?: string | undefined;
    budgetProfileId?: string | undefined;
    assumptions?: Record<string, any> | undefined;
}, {
    estimateType: "rough" | "budget_fit" | "concept" | "boq_quote" | "final_quote" | "variation_quote";
    items?: {
        lineCode: string;
        category: string;
        description: string;
        quantity: number;
        uom: string;
        baseRate: number;
        marginRate: number;
        lineTotal: number;
        roomRef?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[] | undefined;
    sceneVersionId?: string | undefined;
    budgetProfileId?: string | undefined;
    assumptions?: Record<string, any> | undefined;
}>;
export declare const CreatePaymentPlanRequestSchema: z.ZodObject<{
    estimateSetId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    totalContractValue: z.ZodNumber;
    milestones: z.ZodArray<z.ZodObject<{
        milestoneKey: z.ZodString;
        milestoneLabel: z.ZodString;
        dueType: z.ZodEnum<["event", "date"]>;
        dueEvent: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodString>;
        percentOfTotal: z.ZodOptional<z.ZodNumber>;
        fixedAmount: z.ZodOptional<z.ZodNumber>;
        sequenceNo: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        milestoneKey: string;
        milestoneLabel: string;
        dueType: "event" | "date";
        sequenceNo: number;
        dueEvent?: string | undefined;
        dueDate?: string | undefined;
        percentOfTotal?: number | undefined;
        fixedAmount?: number | undefined;
    }, {
        milestoneKey: string;
        milestoneLabel: string;
        dueType: "event" | "date";
        sequenceNo: number;
        dueEvent?: string | undefined;
        dueDate?: string | undefined;
        percentOfTotal?: number | undefined;
        fixedAmount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    milestones: {
        milestoneKey: string;
        milestoneLabel: string;
        dueType: "event" | "date";
        sequenceNo: number;
        dueEvent?: string | undefined;
        dueDate?: string | undefined;
        percentOfTotal?: number | undefined;
        fixedAmount?: number | undefined;
    }[];
    totalContractValue: number;
    estimateSetId?: string | undefined;
}, {
    name: string;
    milestones: {
        milestoneKey: string;
        milestoneLabel: string;
        dueType: "event" | "date";
        sequenceNo: number;
        dueEvent?: string | undefined;
        dueDate?: string | undefined;
        percentOfTotal?: number | undefined;
        fixedAmount?: number | undefined;
    }[];
    totalContractValue: number;
    estimateSetId?: string | undefined;
}>;
export declare const CreateInvoiceRequestSchema: z.ZodObject<{
    estimateSetId: z.ZodOptional<z.ZodString>;
    paymentPlanId: z.ZodOptional<z.ZodString>;
    milestoneId: z.ZodOptional<z.ZodString>;
    invoiceType: z.ZodEnum<["proforma", "advance", "milestone", "tax", "final", "credit_note", "debit_note"]>;
    issueDate: z.ZodString;
    dueDate: z.ZodOptional<z.ZodString>;
    currencyCode: z.ZodDefault<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        lineCode: z.ZodOptional<z.ZodString>;
        category: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        uom: z.ZodString;
        taxableValue: z.ZodNumber;
        taxRate: z.ZodNumber;
        taxAmount: z.ZodNumber;
        lineTotal: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        description: string;
        quantity: number;
        uom: string;
        lineTotal: number;
        taxableValue: number;
        taxRate: number;
        taxAmount: number;
        lineCode?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }, {
        category: string;
        description: string;
        quantity: number;
        uom: string;
        lineTotal: number;
        taxableValue: number;
        taxRate: number;
        taxAmount: number;
        lineCode?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    invoiceType: "final" | "proforma" | "advance" | "milestone" | "tax" | "credit_note" | "debit_note";
    lineItems: {
        category: string;
        description: string;
        quantity: number;
        uom: string;
        lineTotal: number;
        taxableValue: number;
        taxRate: number;
        taxAmount: number;
        lineCode?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[];
    issueDate: string;
    currencyCode: string;
    estimateSetId?: string | undefined;
    dueDate?: string | undefined;
    paymentPlanId?: string | undefined;
    milestoneId?: string | undefined;
}, {
    invoiceType: "final" | "proforma" | "advance" | "milestone" | "tax" | "credit_note" | "debit_note";
    lineItems: {
        category: string;
        description: string;
        quantity: number;
        uom: string;
        lineTotal: number;
        taxableValue: number;
        taxRate: number;
        taxAmount: number;
        lineCode?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[];
    issueDate: string;
    estimateSetId?: string | undefined;
    dueDate?: string | undefined;
    paymentPlanId?: string | undefined;
    milestoneId?: string | undefined;
    currencyCode?: string | undefined;
}>;
export declare const RecordPaymentRequestSchema: z.ZodObject<{
    paymentPlanId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    paymentMethod: z.ZodEnum<["bank_transfer", "cheque", "cash", "card", "upi", "emi_partner", "finance_partner", "other"]>;
    paymentDate: z.ZodString;
    referenceNo: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    allocations: z.ZodArray<z.ZodObject<{
        invoiceId: z.ZodString;
        allocatedAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        invoiceId: string;
        allocatedAmount: number;
    }, {
        invoiceId: string;
        allocatedAmount: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    paymentMethod: "bank_transfer" | "cheque" | "cash" | "card" | "upi" | "emi_partner" | "finance_partner" | "other";
    allocations: {
        invoiceId: string;
        allocatedAmount: number;
    }[];
    amount: number;
    paymentDate: string;
    notes?: string | undefined;
    paymentPlanId?: string | undefined;
    referenceNo?: string | undefined;
}, {
    paymentMethod: "bank_transfer" | "cheque" | "cash" | "card" | "upi" | "emi_partner" | "finance_partner" | "other";
    allocations: {
        invoiceId: string;
        allocatedAmount: number;
    }[];
    amount: number;
    paymentDate: string;
    notes?: string | undefined;
    paymentPlanId?: string | undefined;
    referenceNo?: string | undefined;
}>;
export declare const CreateVariationOrderRequestSchema: z.ZodObject<{
    sceneVersionId: z.ZodOptional<z.ZodString>;
    sourceEstimateSetId: z.ZodOptional<z.ZodString>;
    revisedEstimateSetId: z.ZodOptional<z.ZodString>;
    reasonCategory: z.ZodString;
    description: z.ZodString;
    costDelta: z.ZodNumber;
    timelineDeltaDays: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    reasonCategory: string;
    costDelta: number;
    sceneVersionId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    sourceEstimateSetId?: string | undefined;
    revisedEstimateSetId?: string | undefined;
    timelineDeltaDays?: number | undefined;
}, {
    description: string;
    reasonCategory: string;
    costDelta: number;
    sceneVersionId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    sourceEstimateSetId?: string | undefined;
    revisedEstimateSetId?: string | undefined;
    timelineDeltaDays?: number | undefined;
}>;
export declare const CreatePurchaseOrderRequestSchema: z.ZodObject<{
    vendorName: z.ZodString;
    category: z.ZodString;
    expectedDeliveryDate: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        lineCode: z.ZodOptional<z.ZodString>;
        roomRef: z.ZodOptional<z.ZodString>;
        moduleRef: z.ZodOptional<z.ZodString>;
        itemDescription: z.ZodString;
        quantity: z.ZodNumber;
        uom: z.ZodString;
        unitRate: z.ZodNumber;
        lineTotal: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        uom: string;
        lineTotal: number;
        itemDescription: string;
        unitRate: number;
        roomRef?: string | undefined;
        lineCode?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }, {
        quantity: number;
        uom: string;
        lineTotal: number;
        itemDescription: string;
        unitRate: number;
        roomRef?: string | undefined;
        lineCode?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    lines: {
        quantity: number;
        uom: string;
        lineTotal: number;
        itemDescription: string;
        unitRate: number;
        roomRef?: string | undefined;
        lineCode?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[];
    category: string;
    vendorName: string;
    metadata?: Record<string, any> | undefined;
    expectedDeliveryDate?: string | undefined;
}, {
    lines: {
        quantity: number;
        uom: string;
        lineTotal: number;
        itemDescription: string;
        unitRate: number;
        roomRef?: string | undefined;
        lineCode?: string | undefined;
        moduleRef?: string | undefined;
        metadata?: Record<string, any> | undefined;
    }[];
    category: string;
    vendorName: string;
    metadata?: Record<string, any> | undefined;
    expectedDeliveryDate?: string | undefined;
}>;
