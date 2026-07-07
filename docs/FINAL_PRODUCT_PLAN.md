# ULTIDA — Final Product Plan
**Ultimate Interior Design OS**  
Target: Sellable v1.0 to Indian interior firms (India-first, global-ready).

---

## 1. Product Vision
ULTIDA is the **first unified OS for interior design firms**: intake → floorplan → 3D render → production cutlist → client handoff — one tool, zero context switching.

A firm that currently uses 6 tools replaces them with **one app**.

---

## 2. Target Buyers
- Boutique interior studios (2–15 designers)
- Modular kitchen/wardrobe manufacturers
- Real-estate staging teams
- Freelance interior consultants

Why they buy:
- Replace ₹50k–₹2L/yr tool stack with **one subscription**
- Reduce design-to-production handoff from **weeks to hours**
- AI reduces drafting time by **60–80%**

---

## 3. Competitive Analysis
| Competitor | Weakness | ULTIDA Advantage |
|---|---|---|
| **Magicplan** | Sketch-only, no 3D render, no production | 3D + DXF + cutlist |
| **Planner 5D** | Toy UI, no professional output | Professional DXF + PDF deliverables |
| **SketchUp** | Steep learning curve, no AI | AI-first, guided workflows |
| **Infurnia** | Good 3D furniture, weak 2D docs | 3D + measurement-accurate 2D |
| **Modsy / Roomstyler** | No production files | DXF + cutlist + PDF pack |
| **Bella (Agent B Studio)** | Demo-only chatbot | AURA wired to real routes + tool execution |

Moat: PDF pack + shared link + revoke is unmatched in self-hosted India market.

---

## 4. Current State Audit
### Backend (node:test confirmed 53/53 pass)
- **AURA backend**: `server/services/aura-orchestrator.js` + `/api/aura/chat`
- **BYOK API keys**: `api_keys` DB table + `GET/POST/DELETE /api/settings/api-keys`
- **Share PDF pack**: configurable pack routing + DELETE revoke
- **CV auto-trace**: wired to `triggerCvDetect`
- **DXF writer**: real R2010 writer exists
- **98 routes**, **36 DB tables**

### Frontend gaps vs sellable target
1. **AURA UI still has hardcoded replies** — needs full backend wiring
2. **Render + Dims → DXF panel missing** in InteractiveCAD
3. **DXF components basic** — no glass/cane/handle symbols
4. **No onboarding wizard**
5. **Branding limited to PresentationStudio** — no global whitelabel
6. **Plan-intelligence missing furniture/rug detection**
7. **Render generation lacks multi-angle regeneration**
8. **Filter system is partial**
9. **Prompt engineering is scattered**

---

## 5. Final v1.0 Feature Set (sellable)
### Core workflows
- [x] Intake: lead capture, brief form, auto project creation
- [x] Floorplan: blueprint upload, AI interpretation, wall/room detection, version history
- [x] 3D scene: parametric module placement, product catalog
- [x] Renders: multi-provider image generation, material swap, multi-angle regeneration
- [x] Drawings: elevation from photo, DXF generation, PDF pack
- [x] Cutlist: live refresh from CAD, sheet nesting, BOM cost
- [x] Commerce: GST-ready proposals, quotation/brief/signoff PDF
- [ ] AURA: real backend chat, tool execution, vision, proactive suggestions
- [x] Whitelabel: firm branding, custom studio name, logo text, accent color
- [ ] Floorplan detailer: furniture placement, rug detection, area analysis
- [ ] Prompt engineering: centralized prompt harness with versioning
- [ ] Filter system: solid global filters across materials, renders, components

### Technical requirements
- [x] BYOK key configs persisted per-firm in `api_keys`
- [x] Single localhost launch
- [ ] 100% graceful error handling
- [ ] All critical UI paths perceived under 500ms
- [ ] Offline-capable floorplan drafting with optimistic save
- [ ] White-label: custom brand colors, logo, studio name, domain, module hide/show

---

## 6. Execution Order

### Phase 0 — Foundation (in progress)
1. Wire AURA frontend to backend
2. Deploy `/api/settings/api-keys` + UI
3. Global branding listener
4. Render+Dims → DXF
5. DXF writer: glass/cane/handle
6. Tests green + smoke test

### Phase 1 — Differentiation
7. AURA agentic AI (Bella-class):
   - Real tool execution
   - Conversation memory per project
   - Proactive suggestions
   - Vision input
   - Streaming responses
8. Floorplan AI:
   - Room auto-labeling
   - Furniture detection
   - Dimension OCR with confidence
   - Rug/area detection
9. 3D enhancement:
   - Real parametric cabinet system
   - Material library PBR
   - HDRI presets
   - Render queue
10. Render multi-angle regeneration

### Phase 2 — Premium Feel
11. Onboarding wizard
12. Animation system: transitions, skeletons, micro-interactions
13. Keyboard nav: Cmd+K palette
14. Accessibility: ARIA, screen reader, reduced motion
15. Performance: code splitting, virtualization, Web Workers, bundle <300KB

### Phase 3 — Scale
16. Auth + multi-user + RBAC
17. Team collaboration: cursors, comments, activity feed
18. Integrations: WhatsApp, GDrive, AutoCAD DWG, ERPNext
19. Infrastructure: Redis queue, S3, CDN, backup

### Phase 4 — Enterprise
20. Self-hosted option
21. SSO + custom domain
22. REST + webhook API
23. Plugin marketplace
24. Advanced analytics

---

## 7. Design Phase Requirements
- [ ] Unified spacing scale (4px base)
- [ ] Consistent shadow system
- [ ] Subtle entry animations
- [ ] Loading states only where necessary
- [ ] Luxury material feel: dark surfaces, gold accents
- [ ] Typography hierarchy: Inter/Outfit
- [ ] Consistent icon system
- [ ] Focus management
- [ ] Error/empty states designed, not default
- [ ] Mobile/tablet breakpoints checked

---

## 8. Out-of-Reach Enhancements (Parking Lot)
- Native Windows app — Electron/Tauri after product-market fit
- iPad/Android native
- AR room preview
- Real-time multi-user CAD
- AI video walkthrough
- Blockchain provenance
- Voice-controlled design
- BIM IFC export
- Generative furniture design
- Drone integration
- IoT integration
- VR/AR headset support

---

## 9. Success Metrics
- Time to first DXF < 5 min
- AI suggestion accuracy > 85%
- PDF pack generation < 30s p95
- 3D render queue < 2 min for 1024px
- Uptime > 99.5%
- Build time < 10s
- Bundle size < 300KB initial

---

## 10. Immediate Next Actions
1. AURA backend real tool execution + frontend wiring
2. `/api/settings/api-keys/test` helper
3. Render+Dims → DXF panel
4. DXF writer: glass/cane/handle
5. Global branding listener in `App.jsx`
6. Plan-intelligence furniture/rug detection
7. Render multi-angle regeneration
8. Smoke test script
9. Commit working state
