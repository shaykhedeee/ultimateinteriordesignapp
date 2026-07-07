# ULTIDA — Enhancement Roadmap & Platform Strategy
**Status**: Live build green, 53/53 tests passing, `dist/` valid.  
**Goal**: Make this the best-in-class interior design OS on whatever platform we choose.

---

## 1. Competitive Landscape (Evidence-Based)
| Competitor | Platform | Pricing | AI Depth | 2D Output | 3D Quality | White-Label | Indian Fit |
|---|---|---|---|---|---|---|---|
| **Magicplan** | Mobile+Web | ₹1.2k–4k/mo | Sketch assist only | PDF/PNG | Toy 3D | No | Weak |
| **Planner 5D** | Web+Mobile | Freemium | Asset suggestions | 2D only | Toy | No | No |
| **SketchUp** | Desktop+Web | ₹18k/yr | Limited | DXF/DWG | Pro | No | Weak |
| **Infurnia** | Web | ₹2k–10k/mo | Catalog recommend | DXF | Good | No | Good |
| **Modsy** | Web | ₹15k+ | Style match | PDF only | Photo-real | No | Weak |
| **Roomstyler** | Web | Free | None | 2D only | Toy | No | Weak |
| **Bella (Agent B)** | Web | Private | Agentic chat | Unknown | Unknown | No | Unknown |
| **ULTIDA (us)** | **Web now** | **TBD** | **Agentic + CV + LLM** | **DXF R2010 + PDF pack** | **Real-time parametric** | **Yes (planned)** | **Built for IN** |

**Key differentiators already in code:**
- CV auto-trace on client canvas (real line detection, not sketch-only)
- Client-share PDF pack with configurable brief/signoff/quotation
- Revokable share links
- Photo→elevation→DXF pipeline
- Cutlist + nesting
- AURA AI chat
- BYOK API key management

---

## 2. Web vs Native: Platform Assessment

### 2.1 Current Web App Strengths
- Single `npm run dev` launch, zero installer friction
- Vite build produces optimized static assets
- Easy CI/CD, cross-platform instantly
- DXF is ASCII text — perfect for web I/O
- SQLite works via better-sqlite3/better-sqlite3 WASM
- Canvas CV runs in-browser already
- Share links are naturally web
- BYOK keys stay server-side, never ship to client

### 2.2 Web App Weaknesses for Professional Use
| Limitation | Impact | Mitigation Path |
|---|---|---|
| **Large file I/O** | CAD drawings + renders can be 100MB+ | WASM fs + native filesystem access (File System Access API) |
| **GPU 3D rendering** | WebGL is weaker than native Vulkan/DX12 | Three.js + WebGPU when available; fallback to server-side Blender |
| **AutoCAD interoperability** | DXF read/write is partial | Expand DXF reader; DWG needs native bridge |
| **Offline editing** | PWA helps but not full offline | Service worker + IndexedDB; or Electron wrapper |
| **Large-format print/plot** | Browser print is limited | Server-side PDF → plotter queue, or native print bridge |
| **Plugin/scripting** | JS is the only extension language | Sandboxed JS workers + web workers; accept this constraint |

### 2.3 Native Windows Option
| Factor | Assessment |
|---|---|
| **Performance gain** | 20–40% for 3D, but not worth ecosystem cost at v1 |
| **Distribution** | Installer, auto-update, enterprise deployment |
| **Code reuse** | Would need to duplicate UI (React + Electron/WebView2) |
| **Time to market** | +3–6 months for parity |
| **User base** | 80% of Indian interior firms use Windows — relevant |
| **Verdict** | **Phase 2 enhancement after web product-market fit** |

### 2.4 Recommended Architecture Evolution
```
Phase 1 (now): Pure web — Vite + Express + SQLite + Canvas CV
Phase 2 (3–6 mo): Optional Electron/Tauri shell for:
  - native file dialogs
  - large-format plot bridge
  - offline-first SQLite mirror
  - plugin loading
  - background GPU rendering
Phase 3 (12+ mo): Server-side rendering farm for 4K/8K exports
```

**Decision: Stay web-first until product-market fit is proven. Add Electron wrapper at first paying customer request for offline/plotting.**

---

## 3. Enhancement Roadmap (Phased)

### Phase 0 — Foundation (Week 1–2)
**Goal: Every tool works end-to-end, no dead UI, no stubs.**

- [ ] Wire AURA to real backend `/api/aura/chat`
- [ ] BYOK API keys in DB + Settings UI
- [ ] Global branding listener in `App.jsx`
- [ ] Whitelabel persist to `app_settings` DB
- [ ] Render+Dims → DXF panel in InteractiveCAD
- [ ] DXF writer: glass, cane, handle symbols
- [ ] All tests green + smoke test script

### Phase 1 — Differentiation (Month 1–2)
**Goal: Every competitor feature is matched or beaten.**

- [ ] **AURA agentic AI** (Bella-class):
  - Multi-provider LLM router (OpenAI/Anthropic/Gemini/user key)
  - Tool calling with real execution
  - Conversation memory per project
  - Proactive suggestions ("Client hasn't approved yet")
  - Voice input/output
  -Streaming responses
  
- [ ] **Floorplan AI**:
  - Room auto-labeling
  - Furniture detection from photo
  - Dimension OCR with confidence score
  - Wall material classification
  
- [ ] **3D enhancement**:
  - Real parametric cabinet system (Infurnia-class)
  - Material library with 500+ PBR materials
  - HDRI lighting presets
  - Batch render queue with webhook notifications
  
- [ ] **PDF pack enhancement**:
  - Branded cover sheet
  - GST-ready tax columns
  - Revision history
  - Digital signature field
  - QR code to shared link

### Phase 2 — Premium Feel (Month 2–3)
**Goal: The app _feels_ like a ₹2L product, not a side project.**

- [ ] **Onboarding wizard**:
  - 5-step first-launch setup
  - Studio branding capture
  - API key auto-detect
  - Sample project walkthrough
  - Keyboard shortcuts cheat sheet
  
- [ ] **Animation system**:
  - Page transitions
  - Loading skeletons
  - Success micro-interactions
  - Drag-and-drop polish
  
- [ ] **Keyboard navigation**:
  - Cmd/Ctrl+K command palette
  - Arrow-key navigation
  - Tab order audit
  - Focus trapping in modals

- [ ] **Accessibility**:
  - ARIA labels every interactive element
  - Screen reader announcements for AI actions
  - High contrast mode
  - Reduced motion support
  - Focus indicators

- [ ] **Performance**:
  - Route-level code splitting
  - Virtualized long lists (materials, components)
  - Web Worker for CV processing
  - Image lazy loading + blur-up
  - Bundle audit: keep initial < 300KB

### Phase 3 — Scale (Month 3–6)
**Goal: Sell to 10 firms, handle real production load.**

- [ ] **Auth + multi-user**:
  - Email/password + OAuth
  - Role-based access (owner/designer/viewer)
  - Per-project permissions
  - Audit log every action
  
- [ ] **Team collaboration**:
  - Real-time cursors
  - Comments on drawings
  - @mentions in chat
  - Activity feed
  
- [ ] **Integrations**:
  - WhatsApp Business API for client updates
  - Google Drive/Dropbox sync
  - AutoCAD DWG import/export
  - ERPNext/Zoho invoice sync
  
- [ ] **Infrastructure**:
  - Queue system (Redis/Bull) for renders
  - Object storage (S3/MinIO) for assets
  - CDN for shared PDF links
  - Backup + restore

### Phase 4 — Enterprise (Month 6+)
**Goal: Land 3-5 mid-size firms, build defensible moat.**

- [ ] **Self-hosted option** for security-conscious firms
- [ ] **Custom domain + SSO** for enterprise
- [ ] **API for custom integrations** (REST + webhooks)
- [ ] **Plugin marketplace** (community extensions)
- [ ] **Advanced analytics** (project profitability, designer productivity)

---

## 4. Out-of-Reach Enhancements (Parking Lot)
These are exciting but premature before Phase 0–2 are complete.

- [ ] **Native Windows app** — requires Electron/Tauri + 3–6mo build
- [ ] **iPad/Android native** — would need React Native + Flutter parity
- [ ] **AR room preview** — requires LiDAR, native bridge, or WebXR
- [ ] **Real-time multi-user CAD** — CRDT/OT conflict resolution is hard
- [ ] **AI video walkthrough** — requires NeRF/Gaussian splatting pipeline
- [ ] **Blockchain provenance** for material sourcing — no current buyer demand
- [ ] **Voice-controlled design** — requires Whisper + custom wake word
- [ ] **BIM IFC export** — requires full BIM data model
- [ ] **AI cost estimation from photo** — needs training data on Indian material prices
- [ ] **Generative furniture design** — requires fine-tuned diffusion model
- [ ] **Drone integration** for site survey — hardware + regulatory
- [ ] **IoT integration** (lighting, HVAC control) — requires hardware partnerships
- [ ] **VR/AR headset support** — market too small in India currently

---

## 5. Success Metrics
| Metric | Target | Measurement |
|---|---|---|
| **Time to first DXF** | < 5 min | From project create to download |
| **AI suggestion accuracy** | > 85% | User acceptance rate |
| **PDF pack generation** | < 30s | Client-share endpoint p95 |
| **3D render queue** | < 2 min for 1024px | Provider-dependent |
| **Uptime** | > 99.5% | Per local instance / per-month |
| **Build time** | < 10s | Vite build cold start |
| **Bundle size** | < 300KB initial | dist/assets/index-*.js |

---

## 6. Risk Register
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **LLM costs** | High | Medium | BYOK + usage caps + caching |
| **DXF compatibility** | Medium | High | Real-world AutoCAD testing weekly |
| **3D performance on low-end** | High | Medium | LOD system + fallback renders |
| **Competitor copying** | Medium | Low | Speed of iteration > individual feature |
| **Single developer bandwidth** | High | High | Phase-based, subagent delegation, cut scope ruthlessly |
| **India payment integration** | Medium | Medium | Razorpay/RazorpayX, pre-built |

---

## 7. Immediate Next Actions (This Week)
1. **Enable** AURA backend to call real LLM APIs via BYOK keys
2. **Add** `/api/settings/api-keys/test` endpoint
3. **Implement** Render+Dims → DXF panel
4. **Enrich** DXF writer with glass/cane/handle symbols
5. **Deploy** global branding listener in `App.jsx`
6. **Create** smoke test script hitting 40+ endpoints
7. **Commit** working state with clear phase markers

---

*This document is the source of truth for ULTIDA enhancement. Update it as features ship.*
