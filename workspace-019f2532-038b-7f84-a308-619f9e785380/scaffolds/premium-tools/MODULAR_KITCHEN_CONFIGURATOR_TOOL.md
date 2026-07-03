# Modular Kitchen Configurator

## Purpose
Create a structured kitchen layout and finish configuration experience that combines:
- cabinet system logic
- finish/material choices
- countertop and backsplash selection
- appliance placement suggestions
- render generation for concept visualization

## This is not just an inpaint tool
It is a mini workflow product inside the platform.

## Modes
1. finish-only configuration
2. facade + countertop + backsplash swap
3. layout-aware concept generation (higher complexity)

## Inputs
- kitchen image or zone
- layout context if available
- cabinet run type hints
- selected finish families
- appliance constraints
- style brief

## AURA responsibilities
- infer kitchen style direction
- recommend cabinet finish combinations
- recommend handle/no-handle direction
- suggest countertop/backsplash harmony
- produce modular design notes
- generate critique for realism and coherence

## Data model suggestions
- kitchen_config_sessions
- cabinet_run_definitions
- finish_stack_options
- appliance_constraints

## Premium UI notes
- facade board
- countertop board
- backsplash board
- finish stack preview
- generated concept variants
- “good / better / bold” recommendation tiers

## Future enhancement
- exact module widths from CAD/plan
- budget-aware BOM generation
- appliance compatibility checks
