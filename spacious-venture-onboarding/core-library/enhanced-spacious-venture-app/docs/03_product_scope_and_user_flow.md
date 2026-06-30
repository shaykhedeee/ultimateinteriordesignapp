# Product Scope And User Flow

## North Star

Build a premium, dashboard-style Spacious Venture app that turns a client conversation into two reliable deliverables:

1. Client onboarding PDF brief.
2. Modular cutlist project output.

The app should feel like the supplied dark/gold command-center screenshot, but the workflow should be practical and scoped.

## Primary Users

- Studio admin / owner.
- Interior designer.
- Site measurement person.
- Production/carpentry coordinator.

## Primary Objects

- Client Project
- Intake Brief
- Floor Plan
- Room Schedule
- Module / Unit
- Material Library
- Cutlist Project
- Sheet Stock
- Generated Part
- PDF Brief
- Cutlist Export

## Recommended Navigation

Use the visual structure of the reference dashboard, but narrow the nav:

1. Command Center
   - All active clients.
   - Brief status.
   - Cutlist status.
   - Pending actions.
2. Projects
   - Project CRM/table.
   - Saved clients.
   - Status filters.
3. Onboarding
   - Guided client intake.
   - Floor plan upload.
   - Room/module scope.
4. PDF Briefs
   - Brief preview.
   - Export PDF.
   - Revision history.
5. Cutlists
   - Module builder.
   - Part generator.
   - Sheet optimizer.
   - Export PDF/CSV.
6. Materials
   - Board, laminate, hardware, edge banding libraries.
7. Settings
   - Studio branding.
   - Sheet sizes.
   - Kerf/trim defaults.
   - PDF templates.

Remove or de-prioritize:

- AI Renders as a primary nav item.
- Full image gallery as a primary module.
- Broad experience-centre claims.
- Full sales CRM features not tied to brief/cutlist delivery.

## Start Flow

All real work should start from `Add Client`.

Flow:

1. Add Client
2. Client & Project Details
3. Site/Floor Plan Upload
4. Room & Scope Selection
5. Requirements Intake
6. Material/Finish Preferences
7. Module Schedule
8. Generate PDF Brief
9. Create Cutlist Project
10. Generate Parts
11. Optimize Sheets
12. Export Cutlist PDF/CSV

## Onboarding Intake Steps

Recommended steps:

1. Client Profile
   - Name
   - Phone/WhatsApp
   - Email
   - City
   - Address/site notes
   - Designer assigned

2. Project Scope
   - Home type
   - Rooms
   - New/renovation
   - Site measurement status
   - Timeline
   - Budget band

3. Floor Plan & Measurements
   - Upload floor plan PDF/image.
   - Add room zones.
   - Add wall/component markers.
   - Record measured dimensions.

4. Room Requirements
   - Living/TV unit
   - Kitchen
   - Wardrobes
   - Pooja
   - Foyer
   - Study
   - Other custom units

5. Material Preferences
   - Plywood/board grade
   - Laminate/acrylic/PU/veneer
   - Finish tolerance
   - Edge banding preference
   - Hardware grade

6. Production Notes
   - Carcass thickness
   - Back panel thickness
   - Shutter thickness
   - Skirting/plinth
   - Grain direction
   - Visible sides
   - Site constraints

7. Review & Generate
   - Generate PDF brief.
   - Create cutlist project.

## Project Status Model

Use these statuses:

- Lead
- Intake Started
- Floor Plan Pending
- Brief Ready
- Brief Approved
- Cutlist Draft
- Cutlist Checked
- Cutlist Exported
- Archived

## Deliverables

### PDF Brief

Client-facing and internal handoff document:

- Cover page
- Client/project summary
- Floor plan preview
- Room scope
- Material/finish selections
- Unit/module schedule
- Site constraints
- Practical checks
- Approval/sign-off page

### Cutlist Output

Workshop-facing production document:

- Project/module summary
- Material sheet summary
- Part list
- Edge banding list
- Hardware notes
- Sheet nesting diagrams
- Waste/efficiency summary
- Labels/part codes
- CSV export

