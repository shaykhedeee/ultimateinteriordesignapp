# Feature Spec: Onboarding, PDF Brief, And Cutlist

## Module 1: Command Center

Purpose:

- Give the owner/designer a dark premium dashboard matching the reference screenshot.
- Show project status and operational readiness.

Required cards:

- Total projects
- Active onboarding
- PDF briefs ready
- Cutlists in progress
- Cutlists exported
- Pending measurements

Main table columns:

- Client / Project
- City
- Project type
- Rooms
- Brief status
- Floor plan
- Cutlist status
- Next action
- Confidence/readiness

Right panel:

- Readiness checklist
- Recent briefs
- Cutlist queue
- Material confidence
- Export actions

## Module 2: Client Onboarding

Required features:

- Add Client button.
- Guided intake steps.
- Autosave draft.
- Clear validation before generation.
- Floor plan upload.
- Manual annotations.
- Room schedule.
- Module/unit schedule.

Validation:

- Client name required.
- At least one room required.
- For cutlist, at least one module/unit with dimensions required.
- For sheet optimization, material sheet size required.

## Module 3: PDF Brief Builder

Purpose:

- Generate the polished deliverable the client asked for.

Inputs:

- Client profile.
- Project scope.
- Floor plan/measurements.
- Room requirements.
- Material choices.
- Module schedule.
- Designer notes.

Output sections:

1. Cover page
2. Project summary
3. Client requirements
4. Floor plan and annotated layout
5. Room-wise design brief
6. Module/unit schedule
7. Material and hardware assumptions
8. Production constraints
9. Site measurement checklist
10. Sign-off page

PDF should support:

- Studio logo and branding.
- Dark/gold cover or premium ivory internal pages.
- Project number.
- Revision number.
- Prepared by.
- Date.
- Client signature.

## Module 4: Cutlist Project

Purpose:

- Convert approved room/module schedule into fabrication-ready part data.

Core entities:

- Cutlist project
- Module/unit
- Material sheet
- Part
- Edge banding
- Hardware note
- Nesting layout

Module types:

- Base cabinet
- Wall cabinet
- Tall unit
- Sink cabinet
- Hob drawer unit
- Wardrobe
- Loft
- TV unit
- Shoe rack
- Pooja unit
- Custom box

Unit inputs:

- Room
- Unit name
- Width
- Height
- Depth
- Quantity
- Carcass board
- Shutter board/finish
- Back board
- Visible side panels
- Shelf count
- Drawer count
- Door/shutter count
- Hardware grade
- Edge banding rules

Part generation rules:

- Side panels
- Top and bottom panels
- Fixed shelves
- Adjustable shelves
- Back panel
- Shutters/doors
- Drawer fronts
- Drawer sides/bottoms
- Filler panels
- Skirting/plinth
- Fascia panels
- End panels

Production settings:

- Board thickness
- Back panel thickness
- Kerf
- Edge trim
- Grain direction
- Rotation allowed
- Sheet size
- Offcut reuse allowed

## Module 5: Sheet Optimizer

V1 should implement a simple deterministic nesting flow:

- Group parts by material/thickness/grain.
- Sort by largest area first.
- Place parts on sheets using guillotine-friendly rows/columns.
- Respect kerf and trim.
- Respect grain/rotation.
- Output placement coordinates.
- Calculate waste percentage.

V1 does not need perfect industrial optimization. It needs to be predictable, explainable, printable, and safe for workshop review.

## Module 6: Export Center

Exports:

- Client PDF brief.
- Cutlist PDF.
- Cutlist CSV.
- Sheet layout SVG/PDF.
- Project backup JSON.

Export naming:

- `SV-{projectNo}-{clientName}-brief-r{revision}.pdf`
- `SV-{projectNo}-{clientName}-cutlist-r{revision}.pdf`
- `SV-{projectNo}-{clientName}-cutlist-r{revision}.csv`

## Module 7: Settings

Studio settings:

- Logo
- Brand colors
- Prepared-by names
- PDF footer

Workshop settings:

- Default sheet sizes
- Default board thicknesses
- Kerf
- Trim
- Edge banding defaults
- Material cost
- Allowed wastage threshold

