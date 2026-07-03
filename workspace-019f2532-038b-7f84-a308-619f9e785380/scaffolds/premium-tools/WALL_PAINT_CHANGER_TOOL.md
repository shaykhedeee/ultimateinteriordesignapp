# Wall Paint Changer Tool

## Purpose
Change wall paint color/finish/mood while preserving:
- wall geometry
- trims/cornices if locked
- artwork/mirrors/fixed furniture if excluded
- shadow consistency
- daylight behavior

## Core complexity
Wall paint change is deceptively hard because it affects:
- room brightness perception
- white balance
- reflected color cast
- edge cleanliness around furniture/openings

## Supported controls
- target wall selection
- whole-room wall change vs single accent wall
- paint tone selection
- finish selection: matte / eggshell / satin
- undertone guidance: warm / cool / neutral
- mood target: calm / dramatic / airy / luxe

## AURA responsibilities
- suggest suitable paint colors by room type/style
- warn against incompatible undertones
- generate preserve rules
- critique whether the paint change feels realistic and balanced

## Validation ideas
- edge spill onto ceilings/furniture
- over-saturation warning
- daylight mismatch warning
- room darkening risk note

## Premium UI notes
- paint swatch library
- tonal ladder preview
- side-by-side mood compare
- “daylight / evening” toggle mock preview later

## Advanced future mode
- harmonize paint with floor + joinery + upholstery palette
