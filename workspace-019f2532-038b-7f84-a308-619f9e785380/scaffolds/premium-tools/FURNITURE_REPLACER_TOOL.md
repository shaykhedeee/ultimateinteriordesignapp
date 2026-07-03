# Furniture Replacer Tool

## Purpose
Replace a selected furniture object with another while preserving:
- room geometry
- circulation
- lighting consistency
- approximate scale fit
- style consistency

## Supported object classes
- sofa
- chair
- coffee table
- dining chair/table
- bed
- side table
- console
- pouf/bench
- storage unit

## AURA responsibilities
- classify furniture role
- check scale fit against room/zone context
- suggest replacement options from catalog
- produce placement/circulation warnings
- critique realism and fit after generation

## Validation ideas
- circulation obstruction risk
- obvious scale mismatch
- perspective mismatch
- style mismatch with room plan

## Premium UI notes
- object-select overlay
- replacement candidate carousel
- fit score badge
- “style match” and “scale fit” confidence bars

## Future enhancement
- multi-angle variant generation for replacement options
- hard constraints from design plan and catalog dimensions
