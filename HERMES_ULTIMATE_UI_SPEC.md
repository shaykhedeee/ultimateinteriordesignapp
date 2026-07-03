# HERMES ULTIMATE UI SPEC

## Purpose
This document is the **master UI/UX spec** for building a world-class interface for the platform.

It exists to ensure the product looks and feels:
- premium
- distinctive
- calm
- intelligent
- modern
- enterprise-safe
- creative-tool grade

This is **not** a generic SaaS dashboard spec.
This is a **premium AI workspace / spatial intelligence studio** design spec.

---

# 1. The Design Goal

Build one of the best-looking enterprise AI apps to exist.

That means the product must feel like:
- a **luxury-grade digital studio**
- a **serious professional tool**
- a **creative operating system**
- a **calm, confident, highly structured workspace**

It must NOT feel like:
- a Tailwind template
- a CRUD admin panel
- a cluttered analytics dashboard
- a generic dark UI with random gradients
- an AI toy with neon glows and noisy effects

---

# 2. Core Design Philosophy

## The interface should feel:
- **architectural**: strong layout, disciplined whitespace, grid logic
- **editorial**: refined hierarchy, beautiful composition, premium typography
- **cinematic**: large reveals, immersive previews, clear before/after moments
- **tool-like**: precise controls, excellent feedback, confidence in actions
- **intelligent**: the system always explains what it is doing and why
- **quietly futuristic**: modern without gimmicks

## Emotional target
The user should feel:
- “this is premium”
- “this system is smart and reliable”
- “I trust what I’m seeing”
- “I can present directly from this app”
- “this is more advanced than other AI products”

---

# 3. Global Visual Identity

## Base mode
Default to **dark mode first**.
The dark mode should be:
- rich charcoal
- graphite
- deep slate
- warm-neutral black

Not pure black.
Not flat gray.

## Surface language
Surfaces should feel:
- layered
- slightly elevated
- soft but precise
- dense without clutter

Use:
- subtle contrast differences between layers
- thin architectural borders
- restrained shadows
- occasional soft translucency only where useful

## Visual density
Target density:
- more refined than Notion
- calmer than Figma
- less cramped than typical admin SaaS
- more polished than developer-first AI apps

---

# 4. Art Direction Tokens

Use these as default visual rules.

## Colors
### Backgrounds
- `bg/base`: deep graphite
- `bg/elevated`: slightly lighter charcoal
- `bg/panel`: dark neutral with subtle warmth
- `bg/canvas`: near-black but not pure black
- `bg/overlay`: smoky transparent dark

### Text
- `text/primary`: soft bright neutral
- `text/secondary`: muted stone gray
- `text/tertiary`: quiet low-contrast neutral
- `text/accent`: reserved accent tint only when important

### Accent strategy
Use **one strong accent** per tenant theme.
Default accent should feel premium, not playful.
Good defaults:
- muted violet
- refined sapphire
- deep teal
- bronze-gold accent used sparingly

Avoid:
- excessive cyan
- neon green
- bright gradient overload

### Semantic colors
- success: subtle emerald
- warning: muted amber
- danger: deep coral/red
- info: restrained blue-violet

## Border treatment
- ultra-thin borders
- low-contrast but visible
- internal separators softer than outer boundaries

## Shadows
Use soft, low, broad shadows.
No cartoon drop shadows.
No “floating card marketplace” feeling.

## Radius
- small components: 10–12px
- panels/cards: 14–18px
- large hero surfaces: 20–24px

Rounded, but not bubbly.

---

# 5. Typography System

Typography is one of the biggest differentiators.

## Desired feel
- modern
- highly legible
- premium
- subtle editorial quality

## Suggested structure
### Display / Headline
Use a modern sans with elegant proportion.
Good categories:
- Inter-like but more premium
- Geist / Söhne / Suisse Intl / General Sans / IBM Plex Sans alternatives

### Body
Must be:
- neutral
- highly readable
- compact enough for dense tools

## Hierarchy
### Level 1 — Page title
Used rarely.
Strong, spacious, elegant.

### Level 2 — Workspace title
Project title, tool title, stage title.

### Level 3 — Section title
Panels, cards, grouped controls.

### Level 4 — Labels / metadata
Muted, quiet, crisp.

## Typographic rules
- never let text hierarchy feel flat
- use letter-spacing carefully for tool labels and status tags
- use uppercase only for compact meta labels, not body UI everywhere
- line heights should feel airy, not cramped

---

# 6. Layout System

## Application shell
Use a 3-layer shell:

### 1. Left Rail
Persistent navigation rail.
Should feel compact and premium.

Contains:
- logo / org identity
- main nav icons + labels
- workspace switcher
- settings/admin access

### 2. Top Context Bar
Displays:
- current project
- current stage
- current zone or selection context
- status indicators
- save/sync state
- right-side utility actions

### 3. Main Workspace
Large content area for:
- canvas
- renders
- comparisons
- planning panels
- timelines

## Main layout principle
The hero of the screen should almost always be:
- a floorplan
- a render
- a compare surface
- a canvas
- a visual board

Not a form.
Not a table.

## Grid
Use a disciplined layout grid.
Recommended:
- 12-column main grid
- structured spacing scale
- predictable breakpoints

## Space philosophy
More whitespace than a typical enterprise app.
But not empty for the sake of emptiness.
Whitespace must create confidence and hierarchy.

---

# 7. Motion & Interaction Design

## Motion principles
Motion must feel:
- intentional
- soft
- informative
- premium
- never flashy

## Use motion for
- screen transitions
- compare reveals
- timeline expansion
- tool mode switching
- preview loading
- version changes
- panel docking/undocking

## Avoid
- bouncy gimmicks
- overlong transitions
- dramatic parallax
- gratuitous glowing animations

## Timing guidelines
- micro interactions: 120–180ms
- panel transitions: 180–240ms
- major reveal: 260–360ms

## Easing
Use smooth, low-friction easing.
Prefer calm and precise over playful.

---

# 8. Global UX Rules

1. The user must always know where they are in the workflow.
2. The user must always know what the system is doing.
3. The user must always know what is deterministic vs AI-generated.
4. Large visual surfaces must come first.
5. Controls must support confidence, not noise.
6. Every important action must have clear feedback.
7. Empty states must feel premium, not unfinished.
8. Error states must feel recoverable and calm.
9. Feature-gated areas must disappear gracefully, not leave holes.
10. Every screen should feel presentation-worthy.

---

# 9. Core Product Personality

The product personality should be:
- quiet
- premium
- smart
- exact
- spatial
- editorial
- mature

Avoid anything that feels:
- juvenile
- overhyped
- crypto-ish
- “AI startup landing page”
- SaaS boilerplate

---

# 10. Design Language for AURA

AURA should not appear as a chat widget by default.
AURA should feel like a:
- trusted design intelligence layer
- contextual advisor
- structured recommendation engine
- critic and planner

## AURA UI should appear as
- insights cards
- strategy panels
- recommendation stacks
- critique overlays
- confidence modules
- “next best action” suggestions

Avoid default chat bubbles unless a conversational mode is explicitly needed.

---

# 11. The 12 Major Screens and Their Visual Hierarchy

---

## Screen 1 — Project Creation / Upload

### Goal
Create a premium entry into the workspace.

### Layout
- Left 65%: hero upload surface
- Right 35%: project metadata + smart setup panel

### Priority
1. upload hero
2. project info
3. sample project / template shortcuts
4. helpful metadata and constraints

### Design rules
- upload surface should feel elegant and large
- file preview should appear immediately
- support drag/drop and one-click sample load
- no plain form page feeling

### Required states
- empty
- dragging file
- upload in progress
- file validated
- file warning (resolution/rotation)

---

## Screen 2 — Processing / Analysis Status

### Goal
Turn waiting into confidence.

### Layout
- Center hero: current stage card + live preview
- Bottom timeline: stage progress rail
- Right panel: findings + confidence notes

### Priority
1. current stage
2. live intermediate preview
3. pipeline timeline
4. uncertainties / warnings

### Design rules
- do not use spinner-only loading
- reveal intermediate outputs where available
- let stage names feel intelligent and clear

---

## Screen 3 — Analysis Review

### Goal
Build trust in the machine’s interpretation.

### Layout
- Left: original plan
- Center: interpreted plan/layers
- Right: findings panel

### Priority
1. original vs interpreted view
2. room/opening findings
3. confidence and ambiguities
4. confirm/correct CTA

### Key interactions
- layer toggles
- compare modes
- ambiguity cards

---

## Screen 4 — Correction Workspace

### Goal
Feel like a premium technical canvas.

### Layout
- Main canvas: 72%
- Toolbar: floating/top
- Inspector panel: 28%

### Priority
1. canvas
2. active tool
3. selected object inspector
4. save/apply controls

### Must support
- select
- relabel room
- draw wall
- adjust opening
- measure / calibrate
- merge / split zones
- undo/redo

### Feel
- precise
- crisp
- satisfying
- low-noise
- highly professional

---

## Screen 5 — Canonical Top-View Preview

### Goal
Reveal the geometry-safe plan artifact.

### Layout
- Main hero preview
- Right panel with view modes + exports + explanation

### Priority
1. plan preview
2. mode toggles
3. trust messaging
4. export / continue

### Compare modes
- original
- clean linework
- labeled
- zoning

---

## Screen 6 — Enhanced Top-View Reveal

### Goal
Deliver a cinematic before/after moment.

### Layout
- Main 75% compare viewer
- Right 25% enhancement/validation panel

### Priority
1. before/after compare
2. geometry validation badge
3. enhancement mode and settings
4. accept / retry actions

### Required compare patterns
- scrub slider
- side-by-side
- overlay diff

---

## Screen 7 — Zone Browser

### Goal
Make each zone feel like a design scene.

### Layout
- top mini plan navigator
- lower filmstrip/grid of zone cards

### Priority
1. plan map
2. zone cards
3. zone statuses
4. open / plan actions

### Zone card contents
- thumbnail
- room type
- dimensions if known
- status
- confidence
- render count

---

## Screen 8 — Zone Design Planning Workspace

### Goal
AURA recommendations should feel curated and high-end.

### Layout
- Left 22%: zone facts and constraints
- Center 48%: strategy board
- Right 30%: reference board + recommendations

### Priority
1. style direction
2. palette/materials
3. must_keep / must_avoid
4. placement/circulation notes
5. risk flags

### AURA surface pattern
Use structured cards, chips, moodboards, swatches, and annotated notes.
Not raw chat.

---

## Screen 9 — Quick Render Workspace

### Goal
Fast ideation with low friction.

### Layout
- Left controls panel
- Main render gallery grid

### Priority
1. render outputs
2. references and settings
3. generate/accept actions

### Feel
- exploratory
- fast
- elegant
- gallery-like

---

## Screen 10 — Detailed Render Workspace

### Goal
Creative control room.

### Layout
- Left: controls
- Center: large render preview
- Right: context inspector

### Priority
1. render preview
2. material/product refs
3. camera/prompt controls
4. AURA critique + history

### Feel
- more serious than quick render
- more focused
- more exact

---

## Screen 11 — Edit / Inpaint Workspace

### Goal
Localized visual editing with tactile precision.

### Layout
- Center large editable preview
- Left compact tool rail
- Right edit intent panel

### Priority
1. mask/canvas area
2. edit intent
3. result compare
4. branch/commit controls

### Must support
- rectangle mask
- lasso mask
- erase mask
- material swap
- furniture replace
- object remove/add
- lighting tweak

---

## Screen 12 — Version Browser / History Timeline

### Goal
Make version evolution feel creative and premium.

### Layout
- Left timeline/branch tree
- Center selected version hero preview
- Right metadata/compare panel

### Priority
1. hero preview
2. lineage context
3. compare controls
4. critic score and tags

### Required interactions
- version compare
- branch browsing
- milestone tags
- restore version

---

# 12. Global Component Library Requirements

Hermes must build or refine a reusable UI system around these components:

## Shell & Layout
- `AppShell`
- `LeftRail`
- `TopContextBar`
- `WorkspaceFrame`
- `InspectorPanel`
- `ActionTray`

## Workflow & State
- `WorkflowStepper`
- `ProcessingTimeline`
- `StatusPill`
- `ConfidenceBadge`
- `ValidationBadge`
- `FeatureGate`

## Visual Workspaces
- `PlanCanvas`
- `CompareViewer`
- `ReferenceBoard`
- `ZoneFilmstrip`
- `RenderGallery`
- `VersionTimeline`

## AI / Aura
- `AIRecommendationCard`
- `CritiqueCard`
- `RiskFlagList`
- `NextBestActionCard`

## Utility
- `PremiumEmptyState`
- `StructuredErrorState`
- `LoadingSkeletonSurface`
- `SmartToast`

---

# 13. Design Tokens Hermes Must Define

Hermes should formalize design tokens for:
- colors
- spacing
- radii
- shadows
- z-index
- typography scale
- animation duration/easing
- border color hierarchy
- semantic statuses

These must be implemented in a consistent theming system that supports white-label overrides.

---

# 14. White-Label UX Rules

The product is white-label capable, but the base system must remain beautiful.

## Hermes must support
- organization logo
- app name
- custom primary accent
- custom secondary accent
- optional font overrides later
- feature visibility changes

## Hermes must avoid
- allowing branding to destroy contrast or hierarchy
- wildly inconsistent visual results between orgs
- overexposing tenant config into core layout logic

Use a **theme override layer**, not per-tenant hardcoded UI branches.

---

# 15. Interaction Quality Bar

Before shipping any major screen, Hermes must verify:
- visual hierarchy is obvious in <3 seconds
- main CTA is unmistakable
- loading states are polished
- keyboard navigation works for key actions
- empty states are useful and premium
- compare interactions feel smooth
- the page is presentation-worthy at laptop size

---

# 16. Anti-Patterns Hermes Must Avoid

Do NOT build:
- generic admin tables as primary interfaces
- giant forms in the center of screens
- too many equally weighted cards
- overexposed JSON/debug UI in user flows
- bright AI gimmicks
- crowded left/right sidebars everywhere
- unnecessary gradients and neon glows
- purely chat-based Aura interfaces for structured work

---

# 17. Accessibility & Usability Rules

The app must remain premium **and** usable.

## Must have
- strong color contrast
- visible focus states
- keyboard shortcuts for tool canvases
- screen-size resilience on common laptop widths
- non-mouse accessibility for key workflows
- clear error recovery paths

---

# 18. “Best Looking App” Acceptance Standard

Hermes should consider the UI direction successful only if:
- the app feels more like a premium studio than a SaaS dashboard
- previews/canvases dominate the experience
- every major workflow has a cinematic or editorial moment
- Aura surfaces feel structured and intelligent, not chatty and raw
- the system feels calm, exact, and expensive
- the UI could credibly be shown directly to enterprise customers and design firms without visual embarrassment

---

# 19. UI Build Priorities

Hermes must improve the UI in this order:

1. global shell + layout system
2. theme tokens + typography + spacing
3. upload/processing/review workflow screens
4. correction canvas UX
5. canonical/enhanced compare experiences
6. zone browser and planning workspace
7. render workspaces
8. inpaint/edit workspace
9. version timeline/history
10. polish states (loading, empty, error, success, compare, transitions)

---

# 20. Final Directive to Hermes

> Build the interface as a premium spatial intelligence operating system.
> Bias toward strong hierarchy, large visual surfaces, calm density, elegant contrast, and refined interaction.
> Make every important workflow feel clear, expensive, and presentable.
> Never settle for generic dashboard UI.
> If in doubt, choose the more structured, more visual, more editorial, more premium option.

---

# End of Ultimate UI Spec
