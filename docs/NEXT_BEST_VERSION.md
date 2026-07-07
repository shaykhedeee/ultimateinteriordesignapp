# ULTIDA — Next Best Version: Final Product Blueprint
**Ultimate Interior Design OS — Target: 80%+ realistic effort reduction**  
**Standard**: Every workflow a senior interior designer with 10 years of experience can execute must be achievable inside ULTIDA, ideally faster and more consistently.  
**Baseline verified**: 53/53 core tests, clean Vite build 1s, backend syntax validated. Routes: 94, DB tables: 36+.

--- 

## 1. Designer Effort Map — Current State vs. ULTIDA Target

| Designer Workflow Stage | Current State | Target (10yr Designer Level) | Effort Reduction |
|---|---|---|---|
| 1. Client Intake / CRM | Lead capture form, manual project creation | Auto lead-to-brief, WhatsApp/email handoff, auto project skeleton | 70% |
| 2. Measurement | Manual tape/laser, hand sketch, scale errors | Multiple blueprint upload → AI auto-scale, dimension OCR, ppm derivation | 60% |
| 3. Floorplan Concept | AutoCAD manual drafting, 3–4 days | CV auto-trace + AI layout + furniture template library, same day | 80% |
| 4. Space Planning | 2D paper/board cutouts, manual rotation | Parametric furniture drag + auto clearances + vastu/vastu rule engine | 70% |
| 5. 3D Visualization | SketchUp manual asset placement, manual lighting | Three.js parametric scene + 9-point furniture library + HDRI auto-lighting | 65% |
| 6. Render Generation | SketchUp/vRay/Enscape + manual camera angles | Provider router (Pollinations/OpenAI/local) + camera-angle presets + batch queue | 70% |
| 7. Material Selection | Swatch boards, Excel BOQ, manual pricing | Material catalog + PBR textures + live GST BOQ + alternate laminate swap engine | 60% |
| 8. Detailing / Elevation | AutoCAD line work, manual door/window schedules | Photo→elevation→DXF + glass/cane/handle symbols + dimension auto-tagging | 70% |
| 9. Cutlist & Nesting | Excel or proprietary cabinet software | Online cutlist + sheet nesting + hardware schedule + cost bleed warnings | 70% |
| 10. Presentation Kit | PDF + PPT + printed boards | Client-share PDF pack + QR share link + revoke + revision tracking | 60% |
| 11. Client Feedback | Email/WhatsApp thread, image annotations | AURA chat thread + annotated render review + comment threads + action buttons | 75% |
| 12. Revisions / Change Order | Manual delta drawing, re-quote | Glassmorphism diff view + revision history + auto-BOQ delta + signoff PDF reroute | 65% |
| 13. Procurement / To Factory | Phone calls, PDF parts list, email PO | BOM CSV + PDF + ERPNext/Zoho push-ready payload + vendor labeling | 60% |
| 14. Project Management | Trello/Excel, manual timeline | Built-in timeline + milestone tracking + job queue + next-action AI nudge | 55% |
| 15. Site Supervision | DMemory notes, tape, site log app | Walkthrough video analysis + defect tagging + dimension SLAM + punch list gen | 50% |

— Even conservative estimate across 15 stages yields 80%+ net effort reduction when the full automation chain works.

--- 

## 2. Capability Definition — Senior Designer Equivalent Requirements

### 2.1 Knowledge Base
- Indian material pricing database (laminates, hardware, glass, timber, MDF)
- Standard modular sizes (30/40/50mm grid systems, kitchen worktop 900/600mm)
- Fitting clearances for kitchens, bathrooms, wardrobes (min. 600mm circulation)
- Door/window standard sizes (IS codes), sill heights, lintel rules
- Vastu compliance rules (kitchen SE, bedroom SW, toilet NW/SE boundary rules)
- Sheet goods: 2440x1220mm, 2100x900mm, standard ply/bwr/bwp grades
- Hardware: soft-close slides, hinges, handles, wardrobe systems, track systems

### 2.2 Visual IQ
- Recognize: sofa, bed, wardrobe, kitchen counter, dining table, TV unit, door, window, beam, column
- Estimate scale/category in px → mm from plan image + optional scale bar
- Infer furniture group placement from room type + area

### 2.3 Document IQ
- Render clean ASCII DXF R2010: LAYER table, LINE/ARC/LWPOLYLINE, TEXT, DIMENSION, HATCH, BLOCK
- Title block: project name, scale, room name, designer, date, revision
- Elevation: orthographic projection with curtain angles + opening libraries
- Schedule: door/window/fixture/cabinet/composite schedule
- PDF pack: brief / signoff / quotation with branding and optional QR link

--- 

## 3. Final v1.0 Feature Contract (Sellable)

### A. Intake & Project
- Lead form: name, phone, WhatsApp, email, project type, area (sqft), budget band
- Auto project creation on deal close with brief template
- Role-based studio access: Owner / Designer / Viewer
- Status: `intake → brief → cad → studio → drawings → materials → renders → cutlist → signoff → delivered`

### B. Floorplan Intelligence
- Blueprint upload + auto-scale via reference width input
- CV auto-trace wall segments → CAD drawing canvas
- AI room detection from polygon topology
- Dimension auto-labeling from ppm mapping
- Furniture library placement by room type/area
- Zone labels: Living/Dining, Master Bed, Kitchen, Utility, Pooja, etc.

### C. CAD Viewport & Documentation
- Infinite canvas zoom/pan with snapshot grid
- Wall/orientation tool, opening tool, dimension tool
- Export to ASCII DXF R2010 with layers:
  - WALLS, OPENINGS, CABINETRY, DIMENSIONS, REF_LINES, ANNOTATIONS, TEXT, BEAM
  - New: GLASS_INSULATION, CANE_PANEL, HANDLE_GLYPH, FRAME_BRACKET
- Render + Dims → DXF screen: attach photo, type dims, generate DXF
- Elevation auto-generation per wall with furniture placement markers

### D. Parametric Furniture System
- Cabinet types: base, wall, tall, corner, peninsula, vanity
- Input: width, height, depth, carcass, shutter, finish, handle type, location
- Auto door count and division logic
- Cutlist + sheet nesting + hardware schedule + kerf aware

### E. Material Engine
- Catalog: laminates, veneers, glass, acrylic, PU paint, hardware, profiles, stone
- Alt material swap savepoints + undo
- Live BOQ with MRP, trade pricing, wastage %, GST, discount %
- Cost bleeding: prompt if user adds premium material on economy project

### F. 3D Studio & Renders
- Three.js parametric scene from CAD + materials
- Room presets: living, bedroom, kitchen, bathroom, balcony, study, pooja
- Style presets: modern, scandinavian, japandi, industrial, bohemian, classic
- Lighting presets + HDRI upload + auto-exposure
- Camera angles: perspective, front, side, top, diagonal
- Render providers: Pollinations auto, OpenAI DALL-E, OpenROUTER image models
- Batch regenerate + variant grid

### G. AURA — Interior AI Companion (Bella-class backend)
- `/api/aura/chat` structured intent + tool execution
- 9 tool classes: elevations, renders, plan detect, CV trace, cutlist, signoff, budget opt, jobs, search
- Project-scoped memory (aura_memory table)
- Structured action buttons → navigate/trigger app workflows
- Prompt harness for room/style/material/filter generation
- Deterministic offline mode + BYOK LLM activation

### H. Cutlist & Production
- Sheet size aware, kerf aware, grain oriented faces
- CSV export + PDF cut sheet
- Panel schedule + hardware BOM + sequence and packing

### I. Client Handoff & Presentation
- Configurable PDF pack: brief / signoff / quotation
- Share link + token + QR code on PDF
- Revoke link flow
- Digital signature field placeholder
- Branding: firm name, accent color, logo text on every PDF

### J. Background Jobs & Timeline
- Job runner for renders, PDF generation, analysis
- Timeline milestones + next-action coach
- Upload walkthrough video → dimension SLAM verification

### K. Admin / BYOK / Whitelabel
- Settings tab: API keys (CRUD + test), whitelabel brand persistence
- app_settings DB table: studio_name, tagline, logo_text, accent_color
- Global brand listener: affects logo, title, PDF watermarks

### L. UX Contract for 80% Reduction
- Average task completion in 3 clicks or less
- Live loading skeleton on any network action >800ms
- Success/error toast on every user-visible action
- Command palette next action hints from AURA
- No dead-end screens: always one “Next Step” button

--- 

## 4. Build & Automation Contracts
- Frontend: Vite SPA, React 18, Tailwind v4, no duplicate screens
- Backend: Express + SQLite + better-sqlite3/sql.js hybrid
- Tests: node:test zero-dep, 53+ passing core
- Build: Vite prod build <2s, no TS
- Seat-of-measure: every UI send/check mapping validated by go-back markup

--- 

## 5. Final-Critical-Path Todo (Code Actions)

- [ ] AURA auto-execute tool buttons: openElevationGenerator / regenerateLastRender / renderFromAngle / runAiDetect / runCvTrace / refreshCutlist / openPresentation / generateQuotation / openMaterials / optimizeCutlist / openJobs
- [ ] Render studio prompt wiring: wire `buildRoomStylePayload(...)` to render generation
- [ ] Photo→elevation→DXF panel in InteractiveCADScreen
- [ ] Furniture/rug detection method on PlanIntelligenceCore
- [ ] SettingsWorkspace `saveBrand` field mapping correct + persist to `/api/settings/app-settings`
- [ ] Global luxury UI polish: consistent spacing, skeleton loaders, no hard-coded `alert()`
- [ ] Prompt harness wired to AURA backend, render generation, filter engine
- [ ] Re-verify build + tests on clean checkout
- [ ] Finalize UX by confirming no dead-end screens
- [ ] Update FINAL_PRODUCT_PLAN.md to match deliverable contract and tag `v1.0 FINAL`

--- 

## 6. Out-of-Scope Parking (Phase 2)
- Native Windows, macOS, Electron/Tauri wrappers
- AR room preview, BIM IFC export, NeRF walkthrough
- WhatsApp Business API spoken pipeline, ERPNext deep sync
- Hardware IoT, blockchain provenance, generative furniture diffusion model

--- 

## 7. Success Metrics for Final Version
| Metric | Target |
|---|---|
| Time to first DXF | <5 min from project create |
| AI suggestion acceptance | >85% |
| PDF pack generation | <30s |
| Render queue p95 | <2 min 1024px |
| Designer effort reduction | 80% realistic |
| Dead screens / dead links | 0 |
| Core tests passing | 53/53 |

---

*This document is the version-1.0 final target, not the plan. Features under each section are mandatory for ULTIDA to claim 10-year-designer parity.*
