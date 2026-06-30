export declare const ruleSeeds: {
    globalRules: {
        ruleSetKey: string;
        scope: string;
        rules: {
            code: string;
            severity: string;
            description: string;
        }[];
    };
    kitchenRules: {
        ruleSetKey: string;
        scope: string;
        roomType: string;
        rules: ({
            code: string;
            severity: string;
            measure: string;
            min: number;
            max: number;
            description?: undefined;
        } | {
            code: string;
            severity: string;
            description: string;
            measure?: undefined;
            min?: undefined;
            max?: undefined;
        })[];
    };
    wardrobeRules: {
        ruleSetKey: string;
        scope: string;
        moduleType: string;
        rules: ({
            code: string;
            severity: string;
            measure: string;
            min: number;
            description?: undefined;
        } | {
            code: string;
            severity: string;
            description: string;
            measure?: undefined;
            min?: undefined;
        })[];
    };
    tvRules: {
        ruleSetKey: string;
        scope: string;
        moduleType: string;
        rules: {
            code: string;
            severity: string;
            description: string;
        }[];
    };
    mandirRules: {
        ruleSetKey: string;
        scope: string;
        moduleType: string;
        rules: ({
            code: string;
            severity: string;
            description: string;
            measure?: undefined;
            min?: undefined;
            max?: undefined;
        } | {
            code: string;
            severity: string;
            measure: string;
            min: number;
            max: number;
            description?: undefined;
        })[];
    };
    lightingRules: {
        ruleSetKey: string;
        scope: string;
        rules: ({
            code: string;
            severity: string;
            description: string;
            measure?: undefined;
            target?: undefined;
        } | {
            code: string;
            severity: string;
            measure: string;
            target: number;
            description?: undefined;
        })[];
    };
    budgetPolicies: {
        policySetKey: string;
        bands: {
            economy: {
                boardTiers: string[];
                shutterFinishTiers: string[];
                hardwareTiers: string[];
                notes: string[];
            };
            standard: {
                boardTiers: string[];
                shutterFinishTiers: string[];
                hardwareTiers: string[];
                notes: string[];
            };
            premium: {
                boardTiers: string[];
                shutterFinishTiers: string[];
                hardwareTiers: string[];
                notes: string[];
            };
            luxury: {
                boardTiers: string[];
                shutterFinishTiers: string[];
                hardwareTiers: string[];
                notes: string[];
            };
            ultra_luxury_bespoke: {
                boardTiers: string[];
                shutterFinishTiers: string[];
                hardwareTiers: string[];
                notes: string[];
            };
        };
    };
    productionPreset: {
        presetKey: string;
        name: string;
        boardDefaults: {
            carcass_thickness_mm: number;
            back_panel_thickness_mm: number;
            drawer_panel_thickness_mm: number;
            shelf_deduction_mm: number;
        };
        sheetDefaults: {
            sheet_length_mm: number;
            sheet_width_mm: number;
            kerf_mm: number;
            trim_mm: number;
        };
        edgeBandDefaults: {
            visible_edge: string;
            internal_edge: string;
            hidden_edge: string;
        };
        namingConvention: {
            side_panel: string;
            top_panel: string;
            bottom_panel: string;
            back_panel: string;
            vertical_panel: string;
            fixed_shelf: string;
            door: string;
            fascia: string;
            filler: string;
            skirting: string;
        };
    };
    vastuRules: {
        ruleSetKey: string;
        scope: string;
        rules: ({
            code: string;
            severity: string;
            roomType: string;
            description: string;
        } | {
            code: string;
            severity: string;
            description: string;
            roomType?: undefined;
        })[];
        notes: {
            important: string;
        };
    };
};
export type RuleSeedCollection = typeof ruleSeeds;
