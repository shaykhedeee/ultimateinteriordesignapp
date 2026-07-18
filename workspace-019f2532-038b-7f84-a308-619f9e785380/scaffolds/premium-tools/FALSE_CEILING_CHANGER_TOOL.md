# False Ceiling Changer Tool

## Purpose
Modify ceiling treatment, cove design, paneling, and finishing mood while preserving room geometry, lighting logic, and believable architectural constraints.

## Important
This tool is higher risk than a simple surface swap.
It may be partially generative and should always communicate confidence.

## Supported changes
- finish/material change
- cove style change
- recessed light layout mood change (not exact electrical plan)
- wood slat ceiling styling
- gypsum band / floating edge style

## AURA responsibilities
- determine if requested ceiling style suits room scale and style
- warn about low ceiling / cramped-room risks
- suggest subtle vs dramatic ceiling treatment
- critique if output feels architecturally plausible

## Validation ideas
- obvious geometry corruption
- light source inconsistency
- implausible depth/shadow behavior
- style overload warning

## Premium UI notes
- mood presets: minimal cove / luxe cove / warm slat / shadow gap
- ceiling impact preview language
- “spatial risk” notes from AURA

## Rule
This tool must clearly distinguish between:
- safe finish changes
- speculative architectural redesign
