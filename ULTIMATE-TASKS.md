# Ultimate Interior Design App — Active Task List

## Phase 2L — Immediate maturity pass
- [x] Add live `frontend/src/screens/QuickLayoutScreen.jsx` with wall/door/window/furniture/select tools, SVG canvas, undo/redo, export SVG, and promote-to-scene POST.
- [x] Add live `frontend/src/screens/PlanReviewScreen.jsx` backed by real floor-plan APIs, with editable overlay markers and calibration/annotation panels.
- [x] Wire `layout` route/tab in `frontend/src/App.jsx` and nav metadata.
- [ ] Fix duplicate history state update bug in `QuickLayoutScreen.pushHistory`.
- [ ] Add route guard for layout screen when no project is selected.
- [ ] Improve Quick Layout promote UX: show success toast and clear sketch after promotion.
- [ ] Add persistent storage for Quick Layout drafts per project.

## Backend / API
- [x] Add `POST /api/projects/:id/quick-layout/promote` in `server/index.js`.
- [ ] Add `POST /api/smart-project/run` workflow orchestration endpoint.
- [ ] Add `GET /api/projects/:id/photo-edit/sessions` mock endpoint.
- [ ] Expand `server/services/visualizer-engine.js` render-memory suggestions with room-type-specific camera policies.
- [ ] Harden furniture_catalog schema in `server/database/seed.js` for new metadata fields.

## Phase 2M — Workflow surface & Agent B superset UI
- [ ] Replace mock Smart Project steps with live workflow run entity.
- [ ] Add specialist tool routing from Command Center quick actions to real tool endpoints.
- [ ] Add Photo Edit session entity and minimal UI shell.
- [ ] Add Design Product workspace shell with product family picker.
- [ ] Add Smart Kanban board component and route in dashboard.

## Notes
- Do not restart repo; extend existing scaffold.
- Preserve current backend Express routes and frontend JSX routing.
- Use absolute paths and live backend at `http://127.0.0.1:5055`.
