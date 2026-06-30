# Business Feasibility, Folder Structure, & Implementation Roadmap

This document provides a strategic business evaluation of the modular cutlist problem in India, establishes the target folder structure for the separate cutlist application, and outlines a phased execution plan for development.

---

## 1. Feasibility Assessment & Strategic Valuation

### A. Can We Solve This Problem? (Technical Feasibility)
**Yes, 100% Feasible.**
The calculations for modular cabinetry are entirely deterministic. They rely on basic linear geometry, panel thicknesses, and hardware offsets. 
*   **The Math:** Can be packaged into pure, unit-testable JavaScript functions.
*   **Nesting Engine:** Client-side 2D bin packing algorithms are mature, extremely fast, and can run inside a browser Web Worker to avoid freezing the UI.
*   **AI Integrations:** Vision OCR models (via the Gemini API) are highly capable of reading handwriting, lines, and boxes from raw site drawings, transforming them into clean parametric inputs.

---

### B. Is It Worth Solving? (Business Feasibility & ROI)
**Absolutely. The market opportunity in India is massive.**

#### 1. The Paint Points
*   **The Modular Boom:** The Indian modular kitchen and wardrobe market is booming, growing at a CAGR of ~15%. Homeowners now demand clean finishes, which local carpenters struggle to build using traditional site-cut hand tools.
*   **High Error Rate:** The average local workshop or supervisor makes at least 2–3 calculation errors per modular project (e.g., forgetting edgeband deductions, miscalculating drawer bottom plates). A single wrong cut on premium plywood costs time, labor, and expensive materials.
*   **The Accessory Trap:** Accessories like Tandem boxes or pull-outs are engineered to tight millimetric tolerances (e.g., must have exactly 564mm interior clearance for a 600mm outer cabinet). If the carpenter builds the carcass at 562mm, the accessory cannot be installed. The whole cabinet must be discarded or rebuilt.

#### 2. The Return on Investment (ROI)
Let's look at the financial math for a typical small-scale boutique design firm or modular workshop in a tier-1/tier-2 city in India:

```
[Project Cost Elements (Typical Indian Kitchen)]
----------------------------------------------
Cost of 1 sheet of 18mm BWR Marine Plywood (Gurjan/Neem Core) :  ₹4,000 - ₹5,500
Cost of 1 sheet of 18mm HDMR Panel (Action TESA)              :  ₹2,200 - ₹3,000
Average labor cost per day (Carpenter + Helper)               :  ₹1,500 - ₹2,000

[Losses from a Single Calculation Error]
-----------------------------------------
1 ruined sheet of BWR Ply                                     :  ₹4,500
1 day of wasted labor (re-cutting & rebuilding)              :  ₹1,800
Project delay penalty / client friction                       :  Priceless
-----------------------------------------
TOTAL DIRECT LOSS PER ERROR                                   :  ₹6,300+
```

*   **SaaS Pricing Strategy:** If we sell this software to interior design firms for **₹1,200 to ₹1,800 per month** (or a white-labeled corporate license for **₹15,000 to ₹25,000 per year**), **preventing just a single calculation error pays for the entire yearly subscription!**
*   **Material Savings:** The nesting optimizer typically reduces material wastage by 10% to 15%. Over a medium-sized 3BHK interior project (requiring ~30 sheets of plywood/HDMR), our app can save **3 to 5 sheets of board**, putting **₹10,000 - ₹20,000 straight back into the designer's pocket.**

---

### C. Target Customer Profiles
1.  **Small Design-Build Studios (1-5 designers):** Firms that design modular interiors and coordinate with local modular factories or small workshops to execute.
2.  **Boutique Modular Retailers & Showrooms:** Independent dealers who sell kitchens/wardrobes locally and need a quick, white-labeled quotation and cutting list generator.
3.  **Local Workshops & Small Factories:** Fabrication workshops equipped with sliding table panel saws who receive drawings from designers and need to translate them into raw cutlists for the labor crew.

---

## 2. Separate Cutlist App Folder Structure

To branch out from the existing AutoCAD/DXF floor plan application while maintaining clean organization, we will initialize a completely independent, modern, single-page application (SPA) codebase inside the `cutlist` directory.

The suggested structure below is optimized for a modern, component-driven React/Vite development stack:

```
cutlist/
│
├── current_apps_analysis.md        # Research File 1
├── manual_cutlist_and_standards.md # Research File 2
├── proposed_solution_and_ai.md     # Research File 3
├── implementation_plan_and_roadmap.md # Research File 4
│
├── white_label_config.json          # Default tenant setup configuration
│
└── cutlist-app/                    # Core Application Codebase
    ├── package.json                # Project dependencies
    ├── vite.config.js              # Vite server & bundler config
    ├── index.html                  # Standard entry shell (SEO elements, Inter Google Font)
    │
    ├── public/
    │   └── assets/
    │       ├── default-logo.svg    # Default placeholder logo
    │       └── brands/             # Dir for white-labeled client logos
    │
    └── src/
        ├── main.jsx                # Application root mount
        ├── App.jsx                 # Core routing & layout shell
        ├── index.css               # Core styling (Vanilla CSS, custom dark mode, glassmorphism)
        │
        ├── config/
        │   └── hardwareDb.js       # Preloaded specs (Ebco, Hettich, Blum deductions)
        │
        ├── utils/
        │   ├── cabinetMath.js      # Core formulas (Sides, bottom, rails, back, shutter logic)
        │   ├── nestOptimizer.js    # Client-side 2D Bin Packing algorithm
        │   └── pdfGenerator.js     # PDF exporter with company branding header injection
        │
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx
        │   │   ├── InputField.jsx
        │   │   └── Card.jsx
        │   │
        │   ├── Layout/
        │   │   ├── Header.jsx      # Top bar (Shows white-labeled logo dynamically)
        │   │   ├── Sidebar.jsx
        │   │   └── Footer.jsx
        │   │
        │   ├── Calculator/
        │   │   ├── CabinetForm.jsx # Parameter inputs for cabinet sizes
        │   │   └── PartListTable.html # Output table showing finished vs raw sizes
        │   │
        │   ├── Nesting/
        │   │   ├── NestVisualizer.jsx # Canvas element drawing sheets and parts
        │   │   └── NestSummary.jsx    # Displays sheet efficiency, material waste
        │   │
        │   └── WhiteLabel/
        │       └── SettingsPanel.jsx  # Form to upload company logo, choose accent color
        │
        └── services/
            └── aiService.js        # Integrates Gemini API for drawing parsing and voice
```

---

## 3. Phased Delivery Roadmap

To ensure a smooth, risk-managed development cycle, we will build the app in four distinct phases:

```
[Phase 1: Core Calc] ---> [Phase 2: White Label] ---> [Phase 3: Nesting] ---> [Phase 4: AI Features]
```

### Phase 1: The Core Calculator (MVS - Minimum Viable Solution)
*   **Goal:** Build a robust, manual cabinet parameter calculator and export beautiful PDFs.
*   **Deliverables:**
    1.  Parametric calculation engine for Base, Wall, and Tall units.
    2.  Manual cabinet entry forms (Height, Width, Depth, joint offsets).
    3.  A responsive, premium grid layout that lists calculated parts (Finished vs Raw sizes).
    4.  Basic print stylesheet to export the list directly to paper or a standard PDF.

### Phase 2: White-Labeling & Databases
*   **Goal:** Add custom branding, material catalogs, and hardware tolerances.
*   **Deliverables:**
    1.  Settings page to upload Company Logo, input contact info, and set color accents.
    2.  Dynamic header and PDF exporter that injects the loaded company logo into the top corner.
    3.  Hardware tolerance presets (Tandem boxes, Drawer slides, Overlay hinges).
    4.  Local database saving (IndexedDB) to persist client projects on the device.

### Phase 3: The Nesting Engine & Cutting Visualizer
*   **Goal:** Auto-nest the parts list onto 8x4 ft sheets to maximize efficiency.
*   **Deliverables:**
    1.  Client-side 2D Bin Packing script running in a Web Worker (preventing screen freeze).
    2.  HTML5 Canvas visualizer showing the exact cut layout of plywood sheets with cutting lines.
    3.  Saw Kerf control (2mm - 4mm) and board trim adjustment.
    4.  Grain direction toggle controls (Force vertical vs free nesting).

### Phase 4: AI Integrations
*   **Goal:** Supercharge productivity using Gemini vision models and voice commands.
*   **Deliverables:**
    1.  Vision integration: User uploads a photo of site sketches or floor plans, and the Gemini model outputs a structured JSON list of cabinet objects.
    2.  Voice interpreter: Voice-to-command engine allowing hands-free cabinet additions.
    3.  AI Nesting Advisor: Active pop-ups suggesting size alterations to fit elements on fewer sheets.

---

## 4. Open Questions & Setup Decisions

Before starting the coding phase, we should align on the following technical choices:

1.  **Frontend Framework:** Should we proceed with **Vite + React (Vanilla JS/CSS)** as our core, or do you prefer a static, single-page bundle without React for extreme simplicity?
2.  **Hosting & Authentication:** For the multi-tenant white-label model, do you want to handle user registration and cloud syncing using **Supabase** (highly recommended, free tier is very generous), or should the initial version be purely local-storage based?
3.  **Hardware Database Priorities:** Which hardware brands are your immediate sales targets using most? (Typically, Ebco and Hettich are the most common in mid-market Indian modular designs).
