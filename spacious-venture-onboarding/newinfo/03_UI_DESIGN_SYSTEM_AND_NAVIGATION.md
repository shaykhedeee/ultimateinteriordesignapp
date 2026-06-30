# UI Design System & Navigation Structure

## Visual Direction

The app follows a **dark command-center aesthetic** — premium, dense, operational. Think Bloomberg Terminal meets interior design studio.

```
APP BACKGROUND:    ■ #050707 (near-black)
SIDEBAR:           ■ #090b0b
PANEL:             ■ #101413
ELEVATED PANEL:    ■ #171b19
BORDERS:           ─ rgba(255,255,255,0.08)

TEXT:
  Primary:         #f4f0e8 (warm white)
  Secondary:       #aaa49a
  Muted:           #6f756d

ACCENTS:
  Gold:            #c89b45 (primary actions, active states)
  Gold Light:      #e1bf72 (hover, highlights)
  Success:         #7dbb74 (green - complete)
  Warning:         #d19a3a (amber - pending)
  Risk:            #c46a4a (red - issues)
  Info:            #4a8ec4 (blue - information)
```

---

## Layout Structure

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  TOPBAR (64px): Studio Brand | Gold Accent | Status Indicators  │
├──────────┬───────────────────────────────────────┬──────────────┤
│          │                                       │              │
│  SIDEBAR │     MAIN WORKSPACE                    │ RIGHT RAIL   │
│  (220px) │     (flex: 1)                         │ (320px)      │
│          │                                       │              │
│  Fixed   │  Scrollable content area              │ Contextual   │
│  Nav     │  Changes based on active screen       │ inspector    │
│          │                                       │ or readiness  │
│  Gold    │                                       │ panel        │
│  active  │                                       │              │
│  state   │                                       │              │
│          │                                       │              │
│          │                                       │              │
└──────────┴───────────────────────────────────────┴──────────────┘
```

### Mobile (<1024px)

```
┌──────────────────────────────┐
│  TOPBAR: Hamburger | Brand   │
├──────────────────────────────┤
│                              │
│  MAIN CONTENT (full width)   │
│                              │
│  Cards stack vertically      │
│  Tables → row cards          │
│  Sidebar → drawer overlay    │
│  Right rail → below content  │
│                              │
└──────────────────────────────┘
```

---

## Navigation Elements

### Sidebar (Desktop)

```
┌──────────────────────┐
│     SPACIOUS          │
│     VENTURE           │  ← Gold brand text
│     Studio OS         │
│──────────────────────│
│                       │
│  ◆  Command Center    │  ← Icon + Label
│  ◆  Projects          │
│  ◆  Onboarding        │
│  ◆  PDF Briefs        │
│  ◆  Cutlists          │
│  ◆  AI Renders        │
│  ◆  Materials         │
│  ◆  Deliverables      │
│                       │
│  ───────────────────  │  ← Divider
│                       │
│  ⚙  Settings          │
│  ?  Help              │
└──────────────────────┘
```

**Active state**: Gold left border (3px), gold icon, #f4f0e8 text
**Hover**: Background rgba(255,255,255,0.05)
**Collapsed**: Icons only at 64px width

### Topbar

```
┌──────────────────────────────────────────────────────────────┐
│  [☰]  Spacious Venture  │  Project: Iyer Residence   │  ⚪ │
│                          │  Stage: Cutlist            │  ⚫ │
│                          │  Readiness: ●●●●○ 85%     │     │
└──────────────────────────────────────────────────────────────┘
```

Left: Hamburger (mobile) | Brand name
Center: Active project context (when viewing a project)
Right: Status indicator, provider health

---

## Component Design Tokens

### Cards
```
┌──────────────────────────────────────────────────┐
│  Background: #101413                              │
│  Border: 1px solid rgba(255,255,255,0.08)         │
│  Border-radius: 8px                               │
│  Padding: 16px                                    │
│  Box-shadow: 0 1px 3px rgba(0,0,0,0.3)           │
└──────────────────────────────────────────────────┘
```

### Buttons
| Type | Background | Text | Border | Hover |
|------|-----------|------|--------|-------|
| Primary | `#c89b45` | `#050707` | None | `#e1bf72` |
| Secondary | Transparent | `#f4f0e8` | `1px solid rgba(255,255,255,0.2)` | `rgba(255,255,255,0.08)` |
| Danger | `rgba(196,106,74,0.2)` | `#c46a4a` | `1px solid rgba(196,106,74,0.3)` | `rgba(196,106,74,0.3)` |
| Ghost | Transparent | `#aaa49a` | None | `rgba(255,255,255,0.05)` |

**Border-radius**: 6px
**Padding**: 8px 16px (default), 12px 24px (large)
**Font-size**: 13px (default), 14px (large)

### Inputs
```
Background: #171b19
Border: 1px solid rgba(255,255,255,0.12)
Border-radius: 6px
Padding: 10px 12px
Color: #f4f0e8
Placeholder: #6f756d
Focus: border #c89b45, box-shadow 0 0 0 2px rgba(200,155,69,0.2)
```

### Tables
```
Header Background: #090b0b
Header Text: #aaa49a (uppercase, 11px, 600 weight)
Row Background: #101413 (alternating: #131816)
Row Hover: rgba(255,255,255,0.03)
Border: rgba(255,255,255,0.06)
Cell Padding: 12px 16px
Font-size: 13px
```

### Status Badges / Pills
| Status | Color |
|--------|-------|
| Completed / Approved | `bg: rgba(125,187,116,0.15)` text: `#7dbb74` |
| Pending / In Progress | `bg: rgba(209,154,58,0.15)` text: `#d19a3a` |
| Issue / Risk | `bg: rgba(196,106,74,0.15)` text: `#c46a4a` |
| Draft | `bg: rgba(170,164,154,0.15)` text: `#aaa49a` |
| Gold (Ready) | `bg: rgba(200,155,69,0.15)` text: `#c89b45` |

**Border-radius**: 999px (pill)
**Padding**: 4px 12px
**Font-size**: 11px, 600 weight

### Readiness / Progress Bars
```
Track: rgba(255,255,255,0.08), height 4px, radius 2px
Fill: #c89b45 (gold), transition width
Label: percentage with color coding:
  >80%: #7dbb74 (green)
  50-80%: #d19a3a (amber)
  <50%: #c46a4a (red)
```

### KPI Cards (Command Center)
```
┌──────────────────────────────────────────┐
│  Panel: #101413                          │
│  Number: 48px, 700 weight, #f4f0e8       │
│  Label: 12px, 500 weight, #aaa49a        │
│  Icon: Left-aligned, gold                │
│  Trend: Small arrow + % change           │
└──────────────────────────────────────────┘
```

---

## Screen-Specific Layouts

### Command Center (3-column layout)
```
┌──────────────┬────────────────────────────────────┬────────────┐
│  Left Panel  │  Center (Project Table)            │ Right Rail │
│  (280px)     │  Flex: 1                           │ (320px)    │
│              │                                    │            │
│  KPI Cards   │  Filters: tab bar                  │ Readiness  │
│  Stacked     │  Table: dense rows                 │ Checklist  │
│  vertically  │  Scrollable                        │            │
│              │  Quick actions: Add Client, etc.   │ Recent     │
│              │                                    │ Briefs     │
│              │                                    │            │
│              │                                    │ Cutlist    │
│              │                                    │ Queue      │
└──────────────┴────────────────────────────────────┴────────────┘
```

### Onboarding (3-column wizard)
```
┌────────────────┬──────────────────────────────┬────────────────┐
│  Steps Panel   │  Content Area                │ Summary Panel  │
│  (260px)       │  Flex: 1                     │ (300px)        │
│                │                              │                │
│  Vertical      │  Current step form           │ Completion %   │
│  stepper       │  Inputs, selects, uploads    │                │
│  with icons    │                              │ Validated      │
│                │  [Back] [Next/Save]          │ fields count   │
│  Gold = done   │                              │                │
│  White = curr  │                              │ Preview of     │
│  Muted = next  │                              │ collected data │
└────────────────┴──────────────────────────────┴────────────────┘
```

### Cutlists (3-column workshop)
```
┌────────────────┬──────────────────────────────┬────────────────┐
│  Modules Panel │  Center Workspace            │ Inspector      │
│  (300px)       │  Flex: 1                     │ (300px)        │
│                │                              │                │
│  Module cards  │  Tab: Parts | Sheet Layout   │ Production     │
│  with:         │                              │ defaults       │
│  Name, Type    │  Parts table                 │                │
│  Room, W×H×D   │  or SVG sheet previews       │ Readiness      │
│  Quantity      │                              │ checklist      │
│  Status        │                              │                │
│                │                              │ Material       │
│  [+ Add]       │                              │ confidence     │
│  Sort / Filter │                              │                │
└────────────────┴──────────────────────────────┴────────────────┘
```

---

## Typography Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 24px | 700 | 1.2 | Page titles |
| H2 | 18px | 600 | 1.3 | Section headers |
| H3 | 15px | 600 | 1.4 | Card titles |
| Body | 13px | 400 | 1.5 | Default text |
| Small | 11px | 400 | 1.4 | Metadata, badges |
| Label | 12px | 500 | 1.4 | Form labels |
| KPI Value | 32px | 700 | 1.0 | Dashboard numbers |
| Code | 12px | 400 | 1.4 | Part codes, data |

**Font Family**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## Iconography

Use simple geometric icons (SVG inline):

| Icon | Meaning |
|------|---------|
| ◆ | Dashboard / Command Center |
| 📋 | Projects / CRM |
| ✚ | Add Client |
| 📄 | PDF Brief |
| ✂ | Cutlist |
| 🎨 | AI Renders |
| 📦 | Materials |
| 🗄 | Deliverables |
| ⚙ | Settings |
| ✓ | Complete / Approved |
| ○ | Pending |
| ⚠ | Warning |
| ✕ | Error / Missing |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| <640px | Single column, minimized topbar, full-width cards |
| 640-1024px | Two columns, sidebar as overlay drawer |
| 1024-1440px | Three columns (sidebar + main + rail) |
| >1440px | Three columns with maximum content width 1440px |

---

## Empty States

Every screen should show a meaningful empty state:

**Command Center (no projects)**:
```
┌──────────────────────────────────────────────┐
│                                              │
│     ◆  No projects yet                       │
│                                              │
│     Add your first client to get started.     │
│                                              │
│     ┌──────────────────┐                     │
│     │  + Add Client     │                     │
│     └──────────────────┘                     │
│                                              │
└──────────────────────────────────────────────┘
```

**Cutlists (no modules)**:
```
┌──────────────────────────────────────────────┐
│     ✂  No modules defined                    │
│                                              │
│     Add modules from the approved PDF brief   │
│     or create them manually.                  │
│                                              │
│     ┌──────────────────────┐  ┌────────────┐ │
│     │  Add from Brief       │  │ + Manual   │ │
│     └──────────────────────┘  └────────────┘ │
└──────────────────────────────────────────────┘
```

## Animation & Transitions

| Element | Transition | Timing |
|---------|-----------|--------|
| Sidebar item hover | Background color | 0.15s ease |
| Panel loading | Opacity fade-in | 0.2s ease |
| Table row hover | Background highlight | 0.1s ease |
| Modal open | Scale (0.95→1) + fade | 0.2s ease-out |
| Page transition | Slide right (50px→0) + fade | 0.25s ease-out |
| Progress fill | Width transition | 0.5s ease |
| Status badge | Color change | 0.2s ease |