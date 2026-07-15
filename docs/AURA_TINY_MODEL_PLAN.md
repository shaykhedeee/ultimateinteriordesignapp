# AURA Tiny Model Plan

## Strategy

Use AURA as a structured assistant first, not as a geometry author.

## Phase 1

- Rules engine.
- Retrieval over design knowledge, materials, and prior corrections.
- Tool calls for plan, render, elevation, and quote actions.

## Phase 2

- Collect designer corrections and approved output pairs.
- Train a small LoRA adapter under the 1 GB target.
- Keep the output contract structured and tool-oriented.

## Success Criteria

- AURA proposes the right action.
- AURA does not invent dimensions or output types.
- AURA improves speed without replacing the scene graph.

