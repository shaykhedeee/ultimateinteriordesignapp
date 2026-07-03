# App Deep Scan & Production Readiness Plan

## Scan Results

### Critical Blockers
1. Hardcoded API base URLs in 40+ frontend files: `http://127.0.0.1:5055`
   - Breaks production, mobile, staging, and any non-localhost deployment
   - Files affected: CommandCenterScreen, Render3DStudio, SettingsPanel, MaterialCatalog, Finance, CRM, InteractiveCAD, FloorPlanAnalyzer, Jobs, Timeline, VendorIntelligence, TvUnitGenerator, CeilingStudio, DrawingsElevationsStudio, DesignStudio, ProjectManagement, CutlistNesting, PinterestLearning, AuraBrainChat, RenderEditWorkspace, ClientBriefStudio, SystemsAdmin, VerifyRuntime
2. AI tools mostly simulated in frontend
   - Render generation, photo edit, material swap, floorplan analysis, ceiling design, TV unit generation are mostly UI placeholders with setTimeout or direct image swapping
   - Backend has provider router, free-model executor, and inference gateway, but most screens don't call them
3. Provider routing incomplete
   - `/api/providers/status`, `/api/settings/providers`, `/api/tools/run`, `/api/tools/execute` exist
   - Most screens bypass provider selection and hit only local image provider or static mock data
4. No environment config
   - No `.env` support for API URL, provider keys, or runtime mode
5. Missing auth/session
   - No login, no project ownership checks, no rate limiting
6. Error handling gaps
   - fetch errors often swallowed or shown as statusMessage only
   - No retry/backoff for AI provider failures
7. Mobile UX
   - Most screens assume desktop width; overflow handling inconsistent

### Medium Issues
8. Consumer onboarding added but not fully integrated into all entry screens
9. Walkthrough component now has barebones 3D; needs camera smoothing and room geometry accuracy
10. Pricing settings added but estimator only handles project-level; no room/sqft breakdown
11. Cutlist/DXF export exists but no machine profile selector persistence
12. AURA chat wired but falls back to local placeholder provider when OpenRouter key missing
13. Demo seeding works but demo data not reset between sessions
14. No CSRF/cors hardening; assumes same-origin
15. Build bundle >1.4MB; needs code splitting for screens

### Roadmap to Production Ready

#### Phase 1: Fix showstoppers (now)
- [x] 1.1 Audit complete
- [ ] 1.2 Add `.env` + `VITE_API_BASE` + runtime API base helper
- [ ] 1.3 Replace all hardcoded `127.0.0.1:5055` with env-aware fetch helper
- [ ] 1.4 Ensure backend health endpoints return accurate status
- [ ] 1.5 Centralize API error handling + retry helper in frontend

#### Phase 2: Make AI tools real (next)
- [ ] 2.1 Render generation: wire `/api/projects/:id/renders/generate` through provider router with real fallbacks
- [ ] 2.2 Photo redesign: wire Gemini `/ai/chat` for scene edit instructions + render-edit pipeline
- [ ] 2.3 Floorplan analysis: wire `cad/ai-detect` with real vision model or fail-fast with clear message
- [ ] 2.4 Material swap + palette suggestion: use provider router for image edit tasks
- [ ] 2.5 Design studio: connect parametric modules to BOM + quote APIs
- [ ] 2.6 Cutlist/nesting: wire real `nest-optimizer` + DXF export for selected machine profile
- [ ] 2.7 AURA: ensure OpenRouter key required for production; fail-fast if missing

#### Phase 3: UX hardening (soon)
- [ ] 3.1 Loading skeletons for all data fetches
- [ ] 3.2 Toast/error banner system instead of inline status text
- [ ] 3.3 Offline/read-only mode when backend unreachable
- [ ] 3.4 Mobile responsive breakpoints for all screens
- [ ] 3.5 Consumer mode onboarding flow fully wired
- [ ] 3.6 Walkthrough: smooth transitions + hotspots + 360 done

#### Phase 4: Production hardening (before launch)
- [ ] 4.1 CORS + Helmet + rate limiting
- [ ] 4.2 Input validation + schema checks
- [ ] 4.3 DB migrations + backup strategy
- [ ] 4.4 Provider health checks + circuit breaker live in UI
- [ ] 4.5 Logging + observability
- [ ] 4.6 Build optimization: code splitting, lazy screens
- [ ] 4.7 Windows launcher + offline packaging

## Best AI Implementation Strategy

### Recommended Stack
- Primary inference: OpenRouter (paid, reliable, supports Gemini/Claude/FLUX)
- Local fallback: Ollama for chat/analysis when API is rate-limited
- Image gen: Pollinations.ai or OpenRouter FLUX for renders
- Vision: Gemini 2.0 Flash via OpenRouter for object detection/edits

### Implementation Pattern
```js
// Frontend: call unified tool runner
const result = await fetch('/api/tools/run', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'render_generate',
    input: { roomType, style, prompt },
    provider: 'openrouter', // or 'ollama', 'pollinations'
    fallback: true
  })
})

// Backend: provider router selects cheapest available
providerRouter.execute(taskType, payload, {
  preferFree: false,
  timeoutMs: 60000,
  fallbackChain: ['openrouter', 'ollama', 'mock']
})
```

### What to build now
1. Real AI render pipeline:
   - Frontend sends room params
   - Backend builds prompt with Indian interiors context
   - Provider router calls OpenRouter FLUX or Pollinations
   - Result stored in `storage/renders` and returned
2. Real photo redesign:
   - Upload image → backend base64
   - AURA generates edit instructions
   - Provider router sends to image edit model
   - Return edited image
3. Real floorplan AI:
   - Floorplan image → Gemini vision
   - Detect rooms, walls, doors
   - Store structured CAD JSON
   - Fall back to heuristic only if vision fails
