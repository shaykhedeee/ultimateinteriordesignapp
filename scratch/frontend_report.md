## Complete Frontend Architecture Report

### ðŸ“ Directory Structure
```
frontend/
â”œâ”€â”€ index.html                          (1,188 B) â€” HTML shell with Tailwind CDN + custom brand theme
â””â”€â”€ src/
    â”œâ”€â”€ main.jsx                        (198 B)   â€” React 18 createRoot entry point
    â”œâ”€â”€ App.jsx                         (16,425 B)â€” Root app: sidebar nav, header, tab routing, project state
    â”œâ”€â”€ styles.css                      (8,566 B) â€” Global CSS: Tailwind directives + custom classes
    â””â”€â”€ screens/
        â”œâ”€â”€ CRMLeadDashboard.jsx        (34,154 B)â€” CRM lead management + AI caller + email outreach
        â”œâ”€â”€ ClientBriefStudio.jsx        (49,926 B)â€” 6-step client onboarding wizard
        â”œâ”€â”€ InteractiveCADScreen.jsx     (52,150 B)â€” Full 2D SVG floorplan editor
        â”œâ”€â”€ MaterialCatalogScreen.jsx    (25,919 B)â€” Laminate/hardware catalog + cost estimator
        â”œâ”€â”€ Render3DStudio.jsx           (50,129 B)â€” AI 3D render generation + Vastu + SketchUp export
        â”œâ”€â”€ CutlistNestingScreen.jsx     (14,160 B)â€” Cabinet cutlist + sheet nesting optimizer
        â””â”€â”€ ProjectManagementScreen.jsx  (13,903 B)â€” Project pipeline + Kanban board
```

**No `package.json` or `README.md` inside `frontend/`.** The project-level `package.json` is at the repo root.

---

### ðŸ›  Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18.3 (functional components, hooks only) |
| **Build Tool** | Vite 5.4 with `@vitejs/plugin-react` |
| **Styling** | Tailwind CSS (CDN in index.html + `@tailwind` directives in styles.css) |
| **Icons** | Lucide React (`lucide-react ^0.468`) |
| **Fonts** | Google Fonts: Inter, Outfit, JetBrains Mono |
| **State Mgmt** | React `useState`/`useEffect`/`useMemo` (no Redux/Zustand) |
| **Routing** | No router library â€” custom tab-based switching in `App.jsx` via `activeTab` state |
| **API Client** | Native `fetch()` to `http://127.0.0.1:5055` (Express backend) |
| **Persistence** | `localStorage` for active tab & project ID across sessions |
| **Backend** | Express.js + better-sqlite3 + multer + OpenAI SDK + pdfkit + exceljs |
| **Dev Server** | Vite on port 5175; backend on port 5055; `concurrently` runs both |

---

### ðŸ— Application Architecture

**Brand**: "SPACETRACE â€“ Ultimate Edition" (Sharma Workshop / Antigravity Core v2.0)

**Navigation Pattern**: Fixed left sidebar (240px) + top header bar + full-screen content area. No client-side routing â€” pure state-driven tab switching.

**Workflow Pipeline** (7 sequential stages):
1. **Lead CRM** â†’ 2. **Client Brief** â†’ 3. **2D CAD** â†’ 4. **Materials** â†’ 5. **3D Renders** â†’ 6. **Cutlist** â†’ 7. **Back to CRM**

Each step's `onComplete` callback auto-advances to the next tab. Project-context tabs are disabled until a project is selected.

**Global State in App.jsx**:
- `activeTab` â€” current screen ID (persisted to localStorage)
- `selectedProjectId` â€” active project (persisted to localStorage)
- `projectsList` â€” all projects from API
- `stats` â€” dashboard metrics (totalLeads, qualifiedLeads, activeProjects, conversionPct)
- Real-time clock (updated every 60s)
- Project dropdown selector in header

---

### ðŸ“‹ Screen-by-Screen Feature Breakdown

#### 1. CRMLeadDashboard.jsx (673 lines)
- **3-column layout**: Lead Queue | AI Caller/Email | Human Follow-Up Board
- **Lead Management**: Search, filter by status (New/Verified/Disqualified/Closed), sort by score/budget/newest
- **Demo Import**: Bulk import 5 demo Bangalore-area leads via `/api/leads/import`
- **AI Voice Caller Simulation**: Simulated call with audio wave animation, configurable yes/no answer, live transcript display
- **Email Outreach Studio**: 4 pre-built templates (Introduction, Post-Call Follow-Up, Formal Proposal, Nudge) with `{{NAME}}`/`{{LOCATION}}`/`{{BUDGET}}` merge fields, opens `mailto:` link
- **Deal Closing**: Close deal â†’ auto-creates project workspace â†’ navigates to Client Brief
- **Stats Strip**: Total Leads, Qualified, Deals Closed, Pipeline Value (â‚¹ Lakhs), Win Rate %
- **Toast Notifications**: Success/error toasts with auto-dismiss

#### 2. ClientBriefStudio.jsx (959 lines)
- **6-step wizard** with previous/next navigation:
  - Step 1: BHK Config, Ceiling Height, Material Tier (Gold BWP/Silver BWR/Bronze HDMR), Lifestyle
  - Step 2: Cooking Style, Kitchen Layout (L/Parallel/U/Straight), Purifier Setup, Pantry System, Pooja Preference, Partition Style, Family Profile (Kids/Elderly/Pets)
  - Step 3: Aesthetic Style (6 presets: Modern Luxury, Boho Chic, Scandi Minimal, Indian Contemporary, Japandi Fusion, Industrial Rustic), Space Selection (Living/Kitchen/Master/Kids/Pooja/Foyer)
  - Step 4: Floorplan Image Upload (JPG/PNG/WEBP), Style Reference Moodboard uploads (multiple), Core Requirements textarea
  - Step 5: Vastu Strictness, Lighting Mood, Chimney Ducting, Shutter Finish, Appliances checklist (OTG/Dishwasher/Fridge/Utility), Fittings checklist (Tandems/Pullouts/Corner/Trouser/Safe/Bench)
  - Step 6: Per-room customizations with Vastu orientation (N/NE/E/SE/S/SW/W/NW), primary finish selection
- **Demo Client Loader**: One-click pre-fill with realistic data
- **File Uploads**: Floorplan + Style references to backend via FormData/multer

#### 3. InteractiveCADScreen.jsx (1,279 lines) â€” **LARGEST SCREEN**
- **Full SVG-based 2D CAD editor** with pan/zoom/grid
- **Drawing Tools**: Select, Wall, Door/Window, Measure, Calibrate Scale, Pan
- **Drafting Aids**: Snap-to-Grid toggle, Ortho Angle Constraints (0Â°/45Â°/90Â°), Wall Endpoint Snapping
- **Furniture Symbol Library**: Bed, Wardrobe, Table, Counter â€” spawned at viewport center
- **Wall Joint Propagation**: Stretching a wall corner auto-adjusts connected walls
- **3 Canvas Themes**: Carbon (dark), Blueprint (blue), Warm (cream) â€” full color dictionaries
- **Undo/Redo System**: Full history stack with JSON state snapshots
- **Properties Panel**: Selected object info (wall length in meters, IDs), delete button
- **Floorplan Underlay**: Loads uploaded blueprint image as transparent background with adjustable opacity/scale
- **Video SLAM Walkthrough**: Upload video for dimension verification â†’ detects points + calibration suggestions
- **Scale Calibration Modal**: Draw a reference line â†’ enter real-world length â†’ auto-calculate px/meter
- **Zoom**: Mouse wheel (0.2xâ€“6.0x), explicit zoom buttons
- **Dimension Labels**: Auto-calculated wall lengths in meters using calibrated px/meter ratio
- **Saves**: All walls, openings, furniture, rooms, measures persisted to backend as JSON

#### 4. MaterialCatalogScreen.jsx (451 lines)
- **3-column layout**: Laminates & Veneers | Hardware & Fittings | Summary Panel
- **Laminate Catalog**: 14 items across 3 tiers:
  - Carcass Interior (CenturyPly, Greenlam) â€” â‚¹45â€“52/sqft
  - Shutter Facade (Royale Touche, Greenlam, Merino) â€” â‚¹85â€“135/sqft  
  - Premium Highlight (Decoply, GreenLam Stones) â€” â‚¹175â€“280/sqft
- **Hardware Catalog**: 10 items (Hettich, Blum, Ebco, Hafele) â€” â‚¹180â€“8,500 each
  - Soft-close runners, clip-top hinges, wire baskets, Aventos lift-up, InnoTech drawers, Magic Corner, tall larder, Servo-Drive, G-profile handles, trouser rack
- **Color Swatches**: Visual color blocks with check overlay on selection
- **Search & Filter**: Text search + type filter for laminates; text search for hardware
- **Star Ratings**: 5-star visual rating per item
- **Cost Estimator**: Adjustable sqft slider (50â€“500), calculates laminate avg cost + hardware total
- **Digital Brochure Library**: 6 brand catalogs (CenturyPly, Royale Touche, Blum, Hettich, Greenlam, Merino) with download buttons
- **Selection Summary**: Count badges, selected finish color swatches with tooltips

#### 5. Render3DStudio.jsx (1,101 lines)
- **4-column layout**: Visualizer Console | Main viewport area
- **AI Image Generation**: Room selection, 6 aesthetic themes, camera angle (Diagonal/Elevation/Wide), variant count (1â€“4), spend mode (Smart Cost/Demo Saver/Premium Quality), remove people toggle
- **Room-Specific Rules**:
  - Kitchen: Hob/sink swap, chimney over hob, loft alignment
  - Living: Concealed rafter doors, back panel material (marble/wood/quartz), sofa shape
- **Photo & Floorplan Uploads**: 4 slots (Site Photo, Style Ref, Zoomed Plan, Full Plan)
- **SketchUp Ruby Script Generator**: Auto-generates `.rb` script from CAD data for SketchUp Pro import â€” walls as extruded faces, furniture as cabinet boxes
- **Isometric 3D Preview**: SVG-based isometric projection of walls and furniture using laminate colors
- **Vastu Compliance Engine**: Computes score (0â€“100%) based on room orientations vs. ideal Vastu directions. Rules for Kitchen (SE/NW), Master Bed (SW), Living (N/E/NE), Pooja (NE), Foyer (N/E). Deductions scale with strictness level.
- **Render Gallery**: Filter by review status (all/approved/needs-revision/unreviewed/rejected), review counts
- **Render Review System**: Approve/Reject/Needs-Revision with notes
- **Mistake/Correction Log**: Log specific design errors with description + correction â†’ persisted for future AI training
- **Revision Requests**: Text-based edit requests sent to backend for re-generation
- **Provider Status**: Shows active image generator (mock/real API)

#### 6. CutlistNestingScreen.jsx (323 lines)
- **3-column layout**: Cabinet Parameters | Nesting Map | Slicing Coordinates Table
- **Cabinet Intake**: Add/remove cabinets with configurable:
  - Template: Modular Base Unit, Wardrobe Carcass, Kitchen Wall Loft
  - Dimensions: Height/Width/Depth in mm
  - Plinth height, carcass/back/shutter ply thickness
  - Joint type (butt), Edge banding (0.8mm India Standard / 2.0mm Premium PVC)
- **Nesting Optimization**: Calls backend `/cutlist/calculate` â†’ returns parts list + optimized sheet layouts
- **SVG Nesting Map**: Visual 8Ã—4 ft sheet (2440Ã—1220mm) with color-coded panel placement, usage percentage
- **Parts Table**: Part label, dimensions (LÃ—W mm), quantity, ply thickness
- **Edge Band Note**: All dimensions auto-subtract edge banding thickness
- **PDF Download**: `/signoff/pdf` endpoint for production handoff
- **Handoff Button**: Marks project production-complete

#### 7. ProjectManagementScreen.jsx (281 lines)
- **Stats Strip**: Active Projects, Total Pipeline (â‚¹ Lakhs), Avg Project Value, CRM Leads, Qualified Leads
- **Stage Pipeline Bar**: Visual progress bars per stage (Lead Won â†’ Brief â†’ CAD â†’ Materials â†’ Renders â†’ Production)
- **Two Views**:
  - **Project List**: Cards with client name, date, budget, stage progress bar with colored dots
  - **Kanban Pipeline**: 6 columns matching workflow stages, drag-style card layout
- **Project Navigation**: Click "Open" to navigate to project in Brief tab

---

### ðŸŽ¨ Design System

- **Theme**: Dark slate/navy premium (bg-slate-950 `#020617`) with Gold accent (`#D4AF37`)
- **Custom CSS Classes**: `active-nav-btn`, `gold-glow`, `glass-card`, `panel-gradient`, `btn-gold`, `btn-outline-gold`, `form-input`, `material-swatch`, `render-viewport`, `progress-ring`, `vastu-badge-*`, `toast-notification`, `nesting-panel-label`, `lead-card`, `score-high/mid/low`, `status-new/calling/qualified/disqualified/closed`
- **Animations**: `pulse-gold`, `slide-in-right`, `slide-up`, `fade-in`, `shimmer-bg`, `audio-wave-bar`, `spin-slow`
- **Custom Scrollbars**: Gold-tinted thumb on hover

---

### ðŸ”Œ API Integration

All screens communicate with `http://127.0.0.1:5055` (Express backend on port 5055):

| Endpoint | Screen | Method |
|----------|--------|--------|
| `/api/leads` | CRM | GET |
| `/api/leads/import` | CRM | POST |
| `/api/leads/:id/call` | CRM | POST |
| `/api/leads/:id/close` | CRM | POST |
| `/api/projects` | App, PM | GET |
| `/api/projects/:id` | Brief, Render | GET |
| `/api/projects/:id/brief` | Brief | POST |
| `/api/projects/:id/floorplan` | Brief | POST (multipart) |
| `/api/projects/:id/style-references` | Brief | POST (multipart) |
| `/api/projects/:id/cad` | CAD, Render | GET, POST |
| `/api/projects/:id/cad/video` | CAD | POST (multipart) |
| `/api/projects/:id/materials` | Materials, Render | GET, POST |
| `/api/projects/:id/renders` | Render | GET, POST |
| `/api/projects/:id/renders/generate` | Render | POST (multipart) |
| `/api/projects/:id/renders/edit` | Render | POST |
| `/api/projects/:id/renders/:renderId/review` | Render | POST |
| `/api/projects/:id/renders/mistake` | Render | POST |
| `/api/projects/:id/renders/mistakes` | Render | GET |
| `/api/projects/:id/cutlist` | Cutlist | GET |
| `/api/projects/:id/cutlist/calculate` | Cutlist | POST |
| `/api/projects/:id/signoff/pdf` | Cutlist | GET |
| `/api/providers/status` | Render | GET |

---

### ðŸ“Š Summary Statistics

| Metric | Value |
|--------|-------|
| Total frontend files | 10 |
| Total frontend code | ~267 KB |
| Total lines of JSX | ~5,900+ |
| Screen components | 7 |
| Unique Lucide icons used | 50+ |
| API endpoints consumed | 20+ |
| No `package.json` in frontend | Uses root-level monorepo package.json |
| No client-side router | Tab-based state navigation |
| No external state library | Pure React hooks |

This is a **monolithic single-page React application** with no code splitting, lazy loading, or routing library. All 7 screens are eagerly imported and rendered via conditional switch statement. The architecture is a full-stack monorepo with Vite serving the `frontend/` directory as root.

