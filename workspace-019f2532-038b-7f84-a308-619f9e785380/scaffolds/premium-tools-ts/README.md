# Premium Tool Pack — TypeScript/Zod Scaffolds

This folder contains **actual TS/Zod scaffolds** for advanced design tools so Hermes can move from concept docs to implementation-ready modules.

## Included tools
- material-swap
- wall-paint-changer
- flooring-changer
- furniture-replacer
- curtain-changer
- false-ceiling-changer
- lighting-mood-changer
- modular-kitchen-configurator
- wardrobe-redesign

## File structure per tool
- `types.ts`
- `schemas.ts`
- `prompts.ts`
- `service.ts`
- `processor.ts`
- `Workspace.tsx`

## Shared utilities
- `shared/common-types.ts`
- `shared/common-schemas.ts`
- `shared/common-service-helpers.ts`

## Integration intent
These files are scaffolds for your real repo. Hermes should:
1. move each tool into the correct platform/domain package structure
2. wire it into the tool registry
3. connect service -> worker -> AURA -> inference gateway -> render history
4. replace placeholder dependency interfaces with real repos/clients
5. upgrade the workspace UI to match the premium platform shell
