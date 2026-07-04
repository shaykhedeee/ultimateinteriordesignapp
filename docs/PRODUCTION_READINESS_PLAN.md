# App Deep Scan & Production Readiness Plan

## Current State

### Completed
- Centralized API routing via env-aware `getApiBase()` + `API_BASE`
- Hardcoded `127.0.0.1:5055` URLs removed from `frontend/src`
- Backend `/api/tools/run` executes real AI via `planFreeExecution`
- CommandCenter QuickGenerate and PhotoEdit wired to real backend calls
- Render generation respects provider/model defaults from Settings
- Provider feedback UI in Render3DStudio
- `useJobPolling` hook added for tool results tracking
- Consumer onboarding mode added with simplified 3-step flow
- Walkthrough feature implemented: room transitions, hotspots, 360 view
- Pricing settings + estimator API added
- Cutlist/DXF export + machine-preset flow implemented
- CORS + Helmet + rate-limit hardening added
- Zod validation schemas added for 18 POST routes
- DB migration + backup endpoints/scripts added
- Request logging added to server
- Lazy route loading for top-level screens
- Offline/read-only detectability added in App Shell
- Windows launcher validation added and passed
- `tool_results` table added for real persisted results
- AURA startup export mismatch fixed

### Remaining
- Replace remaining CommandCenter tool UI placeholders with real `fetch(${API_BASE}/tools/run)` plus live progress states
- Make `/api/tools/execute` always return stable `jobId` output for async tools
- Add global retry/backoff helper for transient provider failures
- Add toast/error banner system for failures
- Add loading skeletons for major fetches
- Tighten mobile responsive breakpoints across screens
- Harden multi-user auth beyond project-existence checks when required
- Add retry-runnable render edit fallback paths
- Demo data reset between sessions
- Final production validation + rollout checklist
