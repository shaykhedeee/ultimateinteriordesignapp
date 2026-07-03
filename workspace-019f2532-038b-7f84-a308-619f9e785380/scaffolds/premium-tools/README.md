# Premium Tool Pack Scaffold

This folder contains high-level **production-grade tool blueprints** for the next wave of advanced interior/product tools.

These tools are meant to plug into the platform architecture defined in:
- `HERMES_ULTIMATE_BUILD_SPEC.md`
- `HERMES_ULTIMATE_UI_SPEC.md`
- `HERMES_EXECUTION_CHECKLIST.md`

## Included tools
- Material Swap Tool
- Wall Paint Changer
- Flooring Changer
- Furniture Replacer
- Curtain Changer
- False Ceiling Changer
- Lighting Mood Changer
- Modular Kitchen Configurator
- Wardrobe Redesign Tool

## Design philosophy
Every tool should be:
- premium in UX
- versioned in output
- async job based
- AURA-assisted
- validation-aware
- failure-isolated
- feature-gated
- tenant-aware

## Common architectural pattern
Each tool should follow this layered shape:

1. **frontend workspace**
2. **API/domain service**
3. **worker processor**
4. **AURA planning module**
5. **provider/inference edit or generation step**
6. **validation / critique**
7. **artifact persistence + version lineage**

## Shared expectations across all tools
- Never do heavy generation in the request cycle
- All outputs must be versioned into render history or project history
- AURA must output structured JSON
- Always support `must_keep` and `must_avoid`
- All tools must degrade gracefully when auto-detection confidence is low
- Manual override paths must exist
- Tools must preserve geometry unless explicitly allowed not to

## Suggested implementation pattern per tool
Create these files per tool in the real repo:
- `*.types.ts`
- `*.schemas.ts`
- `*.prompts.ts`
- `*.service.ts`
- `*.processor.ts`
- `*.api.ts`
- `use*.ts`
- `*Workspace.tsx`

## Recommended shared packages to reuse
- `packages/aura-core`
- `packages/tool-registry`
- `packages/storage`
- `packages/jobs`
- `packages/schemas`
- `packages/design-core`

## Important
These blueprints are intentionally stricter than generic “AI edit tools”.
They are designed to help Hermes implement tools that feel like a **premium professional design OS**, not random image utilities.
