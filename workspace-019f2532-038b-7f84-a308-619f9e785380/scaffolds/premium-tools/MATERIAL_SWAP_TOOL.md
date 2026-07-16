# Material Swap Tool

## Purpose
Swap one material for another on a selected object/surface while preserving:
- geometry
- edges
- neighboring materials
- shadow/reflection logic
- style consistency

## Best use cases
- stone to wood
- fabric to leather
- matte to gloss
- brass to blackened metal
- countertop or cladding material replacement

## Key distinction from laminate changer
This tool is broader and should support:
- wood
- stone
- tile
- metal
- upholstery
- plaster
- textured finishes

## Core inputs
- renderId
- projectId
- zoneId
- mask or detected object id
- current material class (optional)
- target material reference
- finish override
- preserve seams/handles/fixtures flags

## AURA responsibilities
- identify material family fit
- warn about realism risks
- generate edit plan
- produce must_keep / must_avoid
- critique output after edit

## Validation ideas
- edit bleed detection
- neighboring material contamination check
- texture stretch detection (basic heuristic)
- style mismatch critique

## Premium UI notes
- material board with swatches, textures, tone chips
- before/after compare slider
- compatibility warnings panel
- “works well with current style” suggestions

## Suggested phases
1. manual-mask material swap
2. detected-object material swap
3. catalog-linked material swap
4. batch replace by material family
