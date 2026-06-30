# UI Design System And Navigation

## Visual Target

The supplied reference image is the end-state visual direction:

- Dark enterprise dashboard.
- Black sidebar.
- Gold active state.
- Compact topbar.
- Project table as the main surface.
- Right-side operational inspector.
- Dense but polished information layout.
- Small thumbnails and material swatches.
- Professional SaaS/admin feel.

## Spacious Venture Adaptation

The app should keep that structure, but labels and modules should be scoped to onboarding, PDF briefs, and cutlists.

## Design Tokens

Recommended palette:

- App background: `#050707`
- Sidebar: `#090b0b`
- Panel: `#101413`
- Panel elevated: `#171b19`
- Border: `rgba(255,255,255,0.08)`
- Primary text: `#f4f0e8`
- Secondary text: `#aaa49a`
- Muted text: `#6f756d`
- Gold: `#c89b45`
- Gold light: `#e1bf72`
- Success: `#7dbb74`
- Warning: `#d19a3a`
- Risk: `#c46a4a`

Recommended radii:

- Cards/panels: `8px`
- Inputs/buttons: `6px`
- Thumbnails: `6px`
- Pills: `999px`

Typography:

- Use Inter or similar sans-serif for UI.
- Use a refined display face only for logo/brand if needed.
- Keep dashboard text small but legible.
- Avoid oversized landing-page typography.

## Layout

Desktop:

- Left sidebar: 220px.
- Topbar: 64px.
- Main workspace: project table / active screen.
- Right inspector: 320px.

Mobile:

- Hide persistent sidebar.
- Topbar wraps.
- Main cards stack.
- Project table becomes row cards.
- Right inspector moves below main content.

## Final Navigation

Use:

- Command Center
- Projects
- Onboarding
- PDF Briefs
- Cutlists
- Materials
- Settings
- Help

Optional/future:

- AI Studio
- Design Library

Do not put AI rendering at the center of the core workflow.

## Screen Specs

### Command Center

Hero should be removed or minimized. The first viewport should be the product surface:

- KPI row.
- Project table.
- Right readiness panel.
- Bottom queue panels.

### Projects

Table columns:

- Client / Project
- City
- Rooms
- Brief Status
- Floor Plan
- Cutlist Status
- Next Action
- Readiness

### Onboarding

Left guided steps. Center form/workspace. Right summary/readiness.

### PDF Briefs

Left project list. Center PDF preview. Right section checklist/export controls.

### Cutlists

Left modules list. Center sheet layout/cutlist table. Right material/settings inspector.

### Materials

Structured catalog:

- Sheet boards
- Laminates
- Edge banding
- Hardware
- Vendor/source notes

## Copy Rules

Use precise operational text:

- "Generate PDF Brief"
- "Create Cutlist"
- "Generate Parts"
- "Optimize Sheets"
- "Export Workshop PDF"
- "Export CSV"

Avoid broad text:

- "AI Experience Centre"
- "Generate full design package"
- "Moodboard everything"
- "Pinterest scraping"

