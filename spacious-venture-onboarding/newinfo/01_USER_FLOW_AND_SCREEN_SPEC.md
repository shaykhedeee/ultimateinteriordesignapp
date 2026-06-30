# Complete User Flow & Screen Structure

## Master Pipeline Flow

```
                            ┌─────────────┐
                            │  WALK-IN /  │
                            │  PASSERBY   │
                            │  CLIENT     │
                            └──────┬──────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    1. ADD CLIENT             │
                    │  (Quick profile capture)      │
                    │  • Name, Phone, City          │
                    │  • Project Type               │
                    │  • Budget Band                │
                    └──────────┬───────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────────┐
        │             2. ONBOARDING WIZARD                     │
        │  Guided step-by-step intake:                        │
        │                                                     │
        │  Step 1: Client Profile    Step 5: Style Prefs      │
        │  Step 2: Project Scope     Step 6: Vastu/Or.        │
        │  Step 3: Rooms & Spaces    Step 7: Cooking Habits    │
        │  Step 4: Budget & Timeline Step 8: References        │
        │                                                     │
        │  ★ Auto-saves at every step                         │
        │  ★ Progress indicator shows completion               │
        │  ★ Validation before proceeding                      │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────────────┐
        │             3. FLOOR PLAN & LAYOUT                    │
        │                                                     │
        │  • Upload floor plan image/PDF                      │
        │  • Draw zones (Living, Kitchen, Bedroom, etc.)      │
        │  • Place component markers:                         │
        │    - TV Unit, Sofa, Dining Table                    │
        │    - Kitchen Counter, Island                        │
        │    - Wardrobe, Bed, Study Table                     │
        │  • Add measurements / dimensions                    │
        │  • Add notes for each zone                           │
        │                                                     │
        │  ★ Floor plan becomes source of truth for all        │
        │    downstream processes                              │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────────────┐
        │             4. AI RENDER STUDIO (Optional)           │
        │                                                     │
        │  • Select room to visualize                         │
        │  • Choose style theme                               │
        │  • Set budget tier / model tier                     │
        │  • Choose quality: Quick / Balanced / Precision     │
        │  • Add exact furniture requirements                  │
        │  • Upload site photos / style references             │
        │  • View floor-plan constraints                       │
        │  • Generate up to 4 variants                         │
        │  • Review, select best variant                       │
        │  • Save corrections for memory                       │
        │  • Reuse library matches shown                       │
        │                                                     │
        │  ★ Approval unlocks PDF brief generation             │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────────────┐
        │             5. PDF DESIGN BRIEF                      │
        │                                                     │
        │  • Auto-generated from onboarding + floor plan      │
        │  • Structured sections:                             │
        │    1. Cover Page (branded)                          │
        │    2. Project Summary                               │
        │    3. Client Requirements                           │
        │    4. Floor Plan & Layout                           │
        │    5. Room-wise Design Brief                        │
        │    6. Module/Unit Schedule                          │
        │    7. Material & Hardware Assumptions               │
        │    8. Production Constraints                        │
        │    9. Site Measurement Checklist                    │
        │   10. Approval / Sign-off Page                      │
        │  • Preview before export                            │
        │  • Export professional PDF                          │
        │  • Revision tracking                                │
        │                                                     │
        │  ★ THIS IS THE PRIMARY CLIENT DELIVERABLE           │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────┐
        │         6. CLIENT APPROVAL                │
        │  (External — designer presents PDF)       │
        │                                           │
        │  • Client approves or requests changes    │
        │  • Designer updates brief, new revision   │
        │  • Approval → unlock cutlist project      │
        └──────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────────────────┐
        │             7. CUTLIST PROJECT                       │
        │                                                     │
        │  • Created from approved brief + modules            │
        │  • Module types:                                    │
        │    - Base Cabinet, Wall Cabinet, Tall Unit          │
        │    - Sink Cabinet, Hob Drawer Unit                  │
        │    - Wardrobe, Loft, TV Unit                        │
        │    - Shoe Rack, Pooja Unit, Custom Box              │
        │  • Each module has: W, H, D, quantity, material     │
        │  • Production defaults applied:                     │
        │    - Sheet: 2440×1220 mm                            │
        │    - Carcass: 18mm, Back: 6mm                       │
        │    - Kerf: 3mm, Trim: 10mm                          │
        │    - Edge banding rules                             │
        │  • Generate Parts automatically                     │
        │    - Sides, Top, Bottom, Back, Shelves              │
        │    - Shutters/Doors, Drawer Fronts, Drawer Sides    │
        │    - Fillers, Skirting, Fascia, End Panels          │
        │  • Edit modules, add/remove, regenerate parts       │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────────────┐
        │             8. SHEET OPTIMIZATION                    │
        │                                                     │
        │  • Parts grouped by material/thickness/grain        │
        │  • Sorted largest-first for placement               │
        │  • Guillotine-friendly layout on sheets             │
        │  • Respects kerf, trim, grain, rotation             │
        │  • Outputs:                                         │
        │    - Sheet layout diagrams (SVG preview)            │
        │    - Placement coordinates                          │
        │    - Waste percentage                               │
        │    - Unplaced/oversize warnings                     │
        │  ★ V1 = workshop planning, not CNC-grade            │
        └──────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────────────────┐
        │             9. EXPORT & DELIVERABLES                 │
        │                                                     │
        │  • Cutlist Workshop PDF (8 pages):                  │
        │    1. Cover                                          │
        │    2. Project & Settings Summary                     │
        │    3. Module Summary                                 │
        │    4. Part List                                      │
        │    5. Edge Banding List                              │
        │    6. Sheet Layout Diagrams                          │
        │    7. Unplaced/Warning Page                          │
        │    8. Workshop Sign-off                              │
        │  • Cutlist CSV (workshop spreadsheet):               │
        │    Project No, Room, Module, Part Code, Part Name,   │
        │    Material, Thickness, Length, Width, Quantity,     │
        │    Grain, Edge Top/Right/Bottom/Left, Notes          │
        │  • All documents stored in Deliverables Vault        │
        │  • Full project backup export                        │
        │                                                     │
        │  ★ Factory package (future)                          │
        └──────────────────────────────────────────────────────┘
```

## Screen-by-Screen Specification

### Screen 1: Command Center
**Purpose**: Studio dashboard — see everything at a glance

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR: Studio Name | Gold: "Spacious Venture"             │
├──────────┬─────────────────────────────────────┬────────────┤
│ SIDEBAR  │  MAIN WORKSPACE                     │ RIGHT RAIL │
│ (220px)  │                                     │ (320px)    │
│          │  ┌──────────────────────────────┐   │ ┌────────┐ │
│ ◆ Cmd Ctr│  │ KPI ROW                     │   │ │READI-  │ │
│ ◆ Projs  │  │ Total: 38 │ Active: 12      │   │ │NESS    │ │
│ ◆ Onbrd  │  │ Briefs: 9 │ Cuts: 3 | Exp:1 │   │ │CHECK-  │ │
│ ◆ PDF    │  └──────────────────────────────┘   │ │LIST    │ │
│ ◆ Cutlst │  ┌──────────────────────────────┐   │ │        │ │
│ ◆ AI     │  │ PROJECT PIPELINE TABLE        │   │ │• Intake│ │
│ ◆ Matrl  │  │ Client  │Rm │Stage│Next│Rdy │   │ │• Floor │ │
│ ◆ Deliv  │  │─────────┼───┼─────┼────┼─── │   │ │• Brief │ │
│ ◆ Sett   │  │Iyer     │5  │Brief│PDF  │85%│   │ │• Cutlst│ │
│          │  │Sharma   │3  │Rendr│Revw │60%│   │ │• Export│ │
│          │  │Patel    │4  │Cutls│Expt │90%│   │ └────────┘ │
│          │  │...      │   │     │     │   │   │ ┌────────┐ │
│          │  └──────────────────────────────┘   │ │RECENT  │ │
│          │  ┌──────────────────────────────┐   │ │BRIEFS  │ │
│          │  │ QUICK ACTIONS                │   │ │        │ │
│          │  │ [+ Add Client] [PDF Brief]   │   │ │• Iyer  │ │
│          │  │ [Create Cutlist] [Export]    │   │ │• Patel │ │
│          │  └──────────────────────────────┘   │ └────────┘ │
└──────────┴─────────────────────────────────────┴────────────┘
```

### Screen 2: Projects (CRM)
**Purpose**: Structured client/project tracking

| Column | Content |
|--------|---------|
| Client / Project | Name + project type |
| City | Bangalore, Mumbai, etc. |
| Budget | Economy / Standard / Premium / Luxury |
| Rooms | Count + types |
| Floor Plan | ✓ Uploaded / ✗ Pending |
| PDF Brief | ✓ Generated / ✗ Pending |
| Cutlist | ✓ Created / ✗ Pending |
| Next Action | Button to next stage |
| Readiness | % score with color |

**Filters**: All Projects, Active Onboarding, Brief Ready, Cutlist In Progress, Cutlist Exported

### Screen 3: Onboarding Wizard
**Purpose**: Guided intake for walk-in clients

**Layout**: Left = Steps (vertical stepper) | Center = Form content | Right = Summary/Readiness

**Steps**:
1. **Client Profile** — Name, Phone, Email, City, Property Address
2. **Project Scope** — New Home / Renovation / Office, BHK type, Property size (sq ft)
3. **Rooms & Spaces** — Select rooms: Living, Kitchen, Bedrooms, Bathrooms, Pooja, Balcony, Study, Utility
4. **Budget & Timeline** — Budget band, expected timeline, priority (cost/speed/design)
5. **Style Preferences** — Modern, Contemporary, Traditional, Minimalist, Industrial, Scandinavian, Bohemian
6. **Vastu & Orientation** — Facing direction, preferred room placements, Vastu constraints
7. **Cooking Habits** — Type of cooking (Indian/Western/Both), kitchen layout preference, ventilation
8. **References** — Upload inspiration images, Pinterest links, color preferences

**Validation**: Client name required, at least 1 room required
**Auto-save**: Every step auto-saves to project record

### Screen 4: Floor Plan & Layout
**Purpose**: Upload and annotate the floor plan

**Features**:
- Upload image (PNG/JPG) or PDF
- Drawing canvas with zoom/pan
- Zone drawing (rectangles, free-form)
- Zone labeling (Living, Kitchen, MBR, etc.)
- Component markers (TV, Sofa, Bed, Dining Table, Kitchen Counter, Wardrobe, Study)
- Dimension annotations
- Notes per zone
- Auto-extract room dimensions from annotations
- Floor plan becomes source of truth for AI renders and cutlist

### Screen 5: AI Render Studio
**Purpose**: Generate controlled design visualizations

**Input Panel** (Left):
- Room selection (from floor plan zones)
- Style theme dropdown
- Budget tier selector
- Model tier: Quick / Balanced / Precision
- Variant count (2-4)
- Camera angle options
- Exact furniture requirement text field
- Custom instruction text field
- Uploads: Site photo, Style reference, Zoomed control image

**Center**:
- Floor plan constraints display
- Compiled prompt preview
- Render variant gallery (generated images)
- Accept/Reject per variant

**Right Panel**:
- Reusable library matches
- Correction memory (previously saved prompt patches)
- Generate Variants button (always visible)

**Backend Contract**:
```
POST /api/projects/:id/renders/generate
→ Returns: asset, variants[], renderPlan, reuseMatches[], correctionsApplied[]
```

### Screen 6: PDF Briefs
**Purpose**: Create, preview, and export the client-facing design brief

**Layout**: Left = Project list | Center = PDF preview/content | Right = Section checklist + Export

**Sections** (10-page document):
1. Cover (branded with studio logo, gold accents)
2. Project summary
3. Client requirements
4. Floor plan and annotated layout
5. Room-wise design brief
6. Module/unit schedule
7. Material and hardware assumptions
8. Production constraints
9. Site measurement checklist
10. Sign-off page

**Right Rail**:
- ✓ Client Summary
- ✓ Floor Plan
- ✓ Room Requirements
- ✓ Material Direction
- ✓ Sign-off
- [Generate PDF Brief] button
- Revision number display

**Readiness**: Shows checklist of what's complete before export

### Screen 7: Cutlists Workspace
**Purpose**: Production-ready module and part management

**Layout**: Left = Module list | Center = Part table / Sheet preview | Right = Settings inspector

**Module List** (Left panel):
- Add module button
- Module cards: Name, Type, Room, W×H×D, Qty, Status
- Module editor (inline or modal):
  - Width, Height, Depth, Quantity
  - Carcass material, Shutter finish, Back panel
  - Shelf count, Drawer count, Door count
  - Visible sides, Edge banding rules
  - Hardware notes

**Center Panel**:
- Part Table: Part Code, Name, Material, Thickness, L×W, Qty, Grain, Edge bands, Notes
- Sheet Preview Cards: SVG layout per sheet, waste %, warnings
- Tab switcher: Parts View | Sheet Layout View

**Right Panel** (Production Inspector):
- ✓ Approved PDF Brief
- ✓ Modules Generated
- ✓ Part List Ready
- ✓ Sheet Preview Ready
- ✓ Workshop PDF Ready
- Production defaults summary
- Material confidence list
- Commercial pricing block

**Actions**: Generate Parts, Optimize Sheets, Export CSV, Export Workshop PDF

### Screen 8: Materials Library
**Purpose**: Maintain production material standards

**Categories**:
- **Plywood/Board**: Thickness, size, grade (BWP/BWR/HDMR/MR), veneer
- **Laminates**: Code, finish, texture, color family, application zone
- **Edge Banding**: Thickness, material, color match
- **Hardware**: Drawer slides, hinges, handles, channels, brackets
- **Vendors**: Source notes, lead time, price range

**Filters**: By category, application zone, thickness, finish

### Screen 9: Deliverables Vault
**Purpose**: Central repository for all exported documents

**KPIs**: PDF Briefs count, Cutlist PDFs count, Active project files, Total documents

**Document Cards**:
- PDF thumbnail block
- Title / Client name / Date
- Status summary
- Metadata chips (revision, modules count)
- Open link / Download link

**Filters**: All Documents, PDF Briefs, Cutlist PDFs

### Screen 10: Studio Settings
**Purpose**: Brand and operational configuration

**Brand Identity**:
- Brand name, tagline
- Logo text (primary/secondary)
- Studio admin, lead designer
- City, contact email, phone

**Proposal Settings**:
- Footer text, commercial scope
- One-time fee, payment terms
- Handover note

**Maintenance**:
- Export Full Backup (JSON + files)
- Import Backup (merge/replace)
- Demo Reset (guarded with confirmation phrase)

**Readiness**: Provider status checks (image gen, database, storage, backup)