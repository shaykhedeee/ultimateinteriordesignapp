# Flooring Changer Tool

## Purpose
Change flooring material while preserving perspective, room geometry, furniture grounding, shadow contact, and plank/tile continuity.

## Core complexity
Flooring is one of the hardest edit tools because of:
- perspective depth
- continuity under furniture
- plank/tile scaling
- reflection behavior
- grout/joint realism

## Supported flooring families
- wood planks
- herringbone
- stone slabs
- porcelain tile
- microcement
- carpet/rug field replacement (advanced)

## AURA responsibilities
- recommend flooring based on room style and lighting
- determine whether requested flooring is too visually heavy/light
- advise plank direction suggestion
- generate must_keep / must_avoid
- critique scaling and realism

## Validation ideas
- warped perspective detection
- texture repetition warning
- incorrect scale warning for planks/tiles
- furniture shadow separation failures

## Premium UI notes
- plank direction control
- tile size selector
- grout color option
- “full room brightness effect” note from AURA

## Important rule
If perspective confidence is low, force a warning and suggest manual confirmation.
