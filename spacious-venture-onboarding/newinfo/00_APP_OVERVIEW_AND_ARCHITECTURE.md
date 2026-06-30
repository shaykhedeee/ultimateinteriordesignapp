# Spacious Venture Studio OS — App Overview & Architecture

## Product Name
**Spacious Venture Studio OS** — A digital experience centre and production workflow system for modular interior design studios.

## Core Problems Solved

### Problem 1: Walk-in Client / Passerby Experience
When a prospective client walks into the office or factory, the designer needs to:
- Quickly capture comprehensive requirements (lifestyle, budget, rooms, style)
- Upload and annotate the floor plan to understand the space
- Generate visual renders of the proposed design so the client can "see" their space
- Produce a polished PDF design brief as a leave-behind document
- Seamlessly transfer all collected data from intake → renders → PDF → production

**Solution:** A guided step-by-step onboarding flow that feeds structured data into an AI render engine, then flows into a PDF brief generator — all connected so no information is lost between steps.

### Problem 2: Poor App Structure / Disorganized Flow
The existing app had disconnected modules (moodboards, design packages, AI gallery) without a clear operational pipeline.

**Solution:** A linear, stage-gated pipeline:
```
Add Client → Onboarding → Floor Plan → AI Renders → PDF Brief → Client Approval → Cutlist → Deliverables
```

Each stage feeds the next. The Command Center shows exactly where every project is in the pipeline.

### Problem 3: Cutlist Automation
Approved 2D designs need to be converted into workshop-ready cutlists without manual recalculation.

**Solution:** A cutlist engine that takes module definitions (wardrobe, kitchen, TV unit, etc.) and automatically generates:
- Part dimensions with production offsets
- Edge banding assignments
- Sheet layouts with optimization
- Workshop PDF/CSV exports
- Panel labels for factory floor

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Command   │ │Onboarding│ │ PDF      │ │ Cutlists  │ │
│  │ Center    │ │ Wizard   │ │ Briefs   │ │ Workspace │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├───────────┤ │
│  │ Projects │ │   AI     │ │Materials │ │Deliverable│ │
│  │ CRM      │ │ Renders  │ │ Library  │ │ Vault     │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│                         │                               │
│                   Studio Settings / Backup               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────┐
│                  BACKEND (Node/Express)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Projects │ │ Briefs   │ │ Cutlist  │ │ Materials │ │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes    │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├───────────┤ │
│  │ Renders  │ │ Admin/   │ │ Document │ │ Backup    │ │
│  │ Routes   │ │ Library  │ │ Vault    │ │ Service   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│                         │                               │
│  Services: Design Engine, Cutlist Engine, PDF Generator │
│  Providers: OpenAI, Freepik, Pexels (for AI renders)   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   DATA LAYER                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │            SQLite Database                        │   │
│  │  client_projects, floor_plans, intake_briefs,    │   │
│  │  cutlist_projects, cutlist_modules, cutlist_parts,│   │
│  │  material_sheets, laminate_products,              │   │
│  │  generated_assets, render_corrections,            │   │
│  │  inspiration_references, production_imports       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           File Storage (Local Filesystem)         │   │
│  │  storage/floor-plans/                             │   │
│  │  storage/assets/ (generated renders)              │   │
│  │  storage/proposals/ (PDF briefs)                  │   │
│  │  storage/cutlists/ (cutlist PDFs)                │   │
│  │  storage/uploads/                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Studio Owner / Admin** | Full access: all projects, settings, backup/restore, demo reset |
| **Designer** | Create projects, onboarding, generate renders, PDF briefs, manage cutlists |
| **Production Manager** | View approved projects, manage cutlists, export workshop PDFs/CSVs |

*(V1 focuses on single-studio/local install; multi-role is future scope)*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, vanilla CSS with dark theme |
| Backend | Node.js + Express |
| Database | SQLite (local-first, single file) |
| File Storage | Local filesystem |
| PDF Generation | PDFKit |
| AI Image Generation | OpenAI DALL-E, Freepik, Pexels (configurable) |
| CSV Export | Native Node.js |
| SVG Generation | Inline SVG for sheet layouts |

## Design System

| Property | Value |
|----------|-------|
| App Background | `#050707` (near-black) |
| Sidebar | `#090b0b` |
| Panel | `#101413` |
| Elevated Panel | `#171b19` |
| Borders | `rgba(255,255,255,0.08)` |
| Primary Text | `#f4f0e8` (warm white) |
| Secondary Text | `#aaa49a` |
| Muted Text | `#6f756d` |
| Gold (Primary Accent) | `#c89b45` |
| Gold Light | `#e1bf72` |
| Success | `#7dbb74` |
| Warning | `#d19a3a` |
| Risk | `#c46a4a` |
| Border Radius (Cards) | `8px` |
| Border Radius (Inputs) | `6px` |
| Typography | Inter / system sans-serif |

## Navigation Structure

```
┌─────────────────────────────────────┐
│  SIDEBAR (220px, dark)              │
│                                     │
│  ◆ Command Center       [Dashboard] │
│  ◆ Projects             [CRM]       │
│  ◆ Onboarding           [Wizard]    │
│  ◆ PDF Briefs           [Docs]      │
│  ◆ Cutlists             [Workshop]  │
│  ◆ AI Renders           [Studio]    │
│  ◆ Materials            [Library]   │
│  ◆ Deliverables         [Vault]     │
│  ◆ Settings             [Admin]     │
│                                     │
│  Gold = Active section              │
└─────────────────────────────────────┘
```

## Key Design Decisions

1. **Local-first**: SQLite + filesystem means no cloud dependency for V1. Works offline.
2. **Dark command-center UI**: Premium feel, matches interior design studio aesthetic.
3. **Pipeline-connected**: Every project has a stage. The app shows what's next.
4. **AI renders = optional module**: The app works without image generation. Core value is in the structured data flow and cutlist automation.
5. **Cutlist is the production bridge**: Takes designer-approved scope and turns it into factory-ready data.
6. **PDF brief = primary client deliverable**: Polished, branded, structured document that can be handed to the client physically or digitally.