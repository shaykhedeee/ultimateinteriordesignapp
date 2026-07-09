## Complete Backend Architecture Report

I've deeply scanned every source file in the server directory, all services, the database layer, .env, and package.json. Here is the full report.

---

### 1. TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules, `"type": "module"`) |
| Framework | Express.js v4.19.2, port **5055** |
| Database | **SQLite** via `better-sqlite3` (WAL mode) |
| File Uploads | `multer` (disk storage â†’ `storage/uploads/`) |
| PDF Generation | `pdfkit` v0.15.0 |
| AI / Image Gen | OpenAI SDK v6.39.0, Gemini Imagen API, Freepik API, Pexels API |
| IDs | `nanoid` |
| Env Config | `dotenv` |
| CORS | `cors` (wide-open, no origin restrictions) |

**No authentication or authorization middleware exists.** All API endpoints are publicly accessible. No JWT, session, cookie, or API key middleware is present.

---

### 2. DATABASE SCHEMA (SQLite â€” `storage/ultimate_interior.db`)

**8 tables total**, all created in `server/database/database.js`:

#### `leads`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `lead_XXXXXX` |
| name | TEXT NOT NULL | |
| email | TEXT | |
| phone | TEXT | |
| location | TEXT | |
| budget | REAL | |
| area | REAL | sq ft |
| requirements | TEXT | |
| score | INTEGER | 0-99, computed by lead-scorer |
| voice_status | TEXT | `new`, `calling`, `qualified`, `disqualified`, `human_closed`, `human_lost` |
| call_transcript | TEXT | |
| call_recording | TEXT | file path |
| created_at | TIMESTAMP | |

#### `projects`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `proj_XXXXXX` |
| lead_id | TEXT FKâ†’leads | |
| name | TEXT NOT NULL | |
| client_name | TEXT NOT NULL | |
| email, phone | TEXT | |
| budget | REAL | |
| unit_system | TEXT | default `metric` |
| status | TEXT | `closed` â†’ `brief_complete` â†’ `cad_approved` â†’ `materials_selected` â†’ `renders_approved` â†’ `signed_off` â†’ `production` |
| current_step | TEXT | `brief` â†’ `materials` â†’ `renders` â†’ `signoff` â†’ `billing` |
| advance_paid_amount | REAL | |
| total_cost | REAL | |
| client_brief_json | TEXT | JSON blob for room preferences, lifestyle, vastu, style refs, floorplan URL |
| created_at | TIMESTAMP | |

#### `cad_drawings`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT UNIQUE FKâ†’projects | One drawing per project |
| walls_json | TEXT | Array of wall segments (x1,y1,x2,y2,thickness,material) |
| openings_json | TEXT | Doors, windows |
| furniture_json | TEXT | Placed furniture items |
| rooms_json | TEXT | Room polygon regions |
| measures_json | TEXT | Dimension annotations |
| pixels_per_meter | REAL | default 40.0 |

#### `material_selections`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT UNIQUE FK | |
| laminates_json | TEXT | Selected laminates array |
| hardware_json | TEXT | Handles/fixtures array |
| notes | TEXT | |

#### `design_renders`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT FK | |
| image_url | TEXT | Path to generated image |
| sketchup_script_txt | TEXT | Auto-generated Ruby script |
| room | TEXT | |
| prompt | TEXT | Full generation prompt |
| review_status | TEXT | `unreviewed`, `approved`, `needs-revision`, `rejected` |
| review_note | TEXT | |

#### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT FK | |
| invoice_number | TEXT NOT NULL | |
| description | TEXT | |
| amount | REAL | |
| status | TEXT | `unpaid`, `paid` |

#### `production_cutlists`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT UNIQUE FK | |
| cutlist_data_json | TEXT | All cabinet parts |
| optimized_sheets_json | TEXT | Nesting results per material |

#### `render_corrections`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| project_id | TEXT FK | |
| asset_id | TEXT | |
| room | TEXT | |
| mistake | TEXT | |
| correction | TEXT | |
| prompt_patch | TEXT | |
| payload | TEXT | JSON |

Self-healing migrations at boot: adds `room`, `prompt`, `review_status`, `review_note` columns to `design_renders` if missing.

---

### 3. ALL API ENDPOINTS (30 total)

#### Module 1: Leads CRM
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leads` | List all leads (newest first) |
| POST | `/api/leads/import` | Bulk import leads from `{leadList:[...]}` |
| POST | `/api/leads/:id/call` | Trigger simulated AI voice qualification call |
| POST | `/api/leads/:id/close` | Mark lead as `human_closed` (auto-creates project + CAD drawing) or `human_lost` |

#### Module 2: Projects & Client Brief
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects/:id/brief` | Save/update client brief JSON |
| POST | `/api/projects/:id/floorplan` | Upload floorplan image (multer single) |
| POST | `/api/projects/:id/style-references` | Upload up to 10 style reference images |
| GET | `/api/projects/:id/brief/pdf` | Download design brief PDF |

#### Module 3: Interactive 2D CAD
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/cad` | Get CAD drawing data |
| POST | `/api/projects/:id/cad` | Save/update CAD vectors (walls, openings, furniture, rooms, measures). Auto-advances status to `cad_approved` |
| POST | `/api/projects/:id/cad/video` | Upload walkthrough video for SLAM dimension verification |

#### Module 4: Materials & Catalogue
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/materials` | Get material selections |
| POST | `/api/projects/:id/materials` | Save laminate + hardware selections. Auto-advances status to `materials_selected` |

#### Module 5: 3D Renders & SketchUp
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/renders` | List all renders for a project |
| POST | `/api/projects/:id/renders/generate` | **Main render generation** â€” multipart form with sitePhoto, stylePhoto, zoomedFloorPlan, fullFloorPlan + many body params |
| GET | `/api/projects/:id/renders/mistakes` | Get correction/mistake history |
| POST | `/api/projects/:id/renders/mistake` | Log a design mistake for RAG avoidance |
| POST | `/api/projects/:id/renders/edit` | Request a render revision/edit |
| POST | `/api/projects/:id/renders/:renderId/review` | Set review status (approved/needs-revision/rejected) |
| POST | `/api/projects/:id/renders` | Approve all renders, advance to `renders_approved` |
| GET | `/api/projects/:id/renders/sketchup` | Download SketchUp Ruby script for latest render |
| GET | `/api/providers/status` | Get image provider availability status |

#### Module 6: Sign-Off
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/signoff/pdf` | Download production sign-off contract PDF |

#### Module 7: Cutlist
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:id/cutlist/calculate` | Calculate cutlist from cabinet specs, run nesting optimizer. Advances to `production` |
| GET | `/api/projects/:id/cutlist` | Get existing cutlist data |

#### Static
| Method | Endpoint | Description |
|---|---|---|
| GET | `/storage/*` | Static file serving for uploads, assets, proposals |

---

### 4. SERVICE LAYER (7 services)

#### `lead-scorer.js` (61 lines)
- Scoring algorithm (0-99) based on: budget (â‚¹4Lâ€“â‚¹12L+ tiers), area (sq ft), premium Bangalore locations (HSR, Whitefield, Indiranagar, Koramangala, etc.), positive/negative keyword analysis in requirements text.

#### `voice-call-service.js` (84 lines)
- **Simulated** outbound AI qualification calls (1.5s delay timer). Generates scripted transcripts based on `yes`/`no` response parameter.
- Has a webhook handler skeleton (`processVoiceWebhook`) for future integration with Vapi, Retell, or Bland AI â€” not exposed via any route.

#### `gemini-multimodal-service.js` (127 lines)
- **Simulated** walkthrough video analysis. Doesn't actually call Gemini API.
- Generates mock service points (plumbing, electrical sockets) based on CAD room geometry.
- Returns dimension discrepancy warnings and calibration suggestions.

#### `cutlist-engine.js` (373 lines)
- Fully implemented deterministic engine. Generates precise panel cut lists for `base_cabinet` and `wardrobe_box` types.
- Handles: side panels, bottom panels, top rails, back panels, doors/shutters, internal shelves.
- Accounts for: edgeband thickness (0.8mm/2.0mm), joint type (butt/dado), plinth height, carcass/back/shutter ply thickness.
- **Nesting optimizer**: Guillotine-split bin-packing onto 8Ã—4 ft sheets (2440Ã—1220mm) with 3mm kerf and 10mm trim. Groups by material, sorts largest-area-first, supports rotation. Calculates wastage %.

#### `pdf-builder.js` (215 lines)
- Uses PDFKit. Generates two PDF types:
  1. **Client Design Brief PDF** â€” header banner, project cover, lifestyle/cooking/vastu profile fields, room-by-room checklist.
  2. **Production Sign-Off PDF** â€” multi-page contract with room schedules, approved laminates & hardware, agreement terms, signature blocks.
- Branded with "SPACETRACE OS" gold (#D4AF37) + dark (#020617) color scheme.

#### `image-provider.js` (459 lines)
- **Multi-provider image generation** with cascading fallback chain:
  1. `library-reuse` (primary, env-configured)
  2. `gemini-imagen` â€” calls Google Generative Language API (`imagen-4.0-generate-001`)
  3. `openai` â€” DALL-E 3 via OpenAI SDK
  4. `freepik` â€” Flux-Dev text-to-image API
  5. `pexels` â€” Stock photo search fallback
  6. `curated` â€” copies from pre-baked images in `server/images/`
  7. `mock` â€” generates SVG placeholders with room-themed color palettes
- Prompt enhancement adds Indian residential context, material details, no-watermark constraints.
- Each result includes a `reusableScore` (78â€“94 depending on provider).

#### `visualizer-engine.js` (977 lines) â€” **The core engine**
- **RAG Knowledge Base**: Loads `.md` files from `storage/knowledge-base/` filtered by room keywords.
- **Mistakes Log**: JSON-based `mistakes_log.json` for tracking and avoiding past render errors.
- **Structured Prompt Compiler**: Builds detailed interior design prompts with:
  - 11 style profiles (indian-contemporary, modern-luxury, japandi, industrial, art-deco, etc.)
  - 4 budget tiers (value â†’ luxury)
  - 6 room profiles with specific anchor elements and defaults
  - Kitchen-specific params: hob/sink swap, chimney placement, loft alignment, uniform loft height, beige/white laminate separation
  - Living room params: concealed rafter doors, rafter-to-marble transition, L-shaped sofa placement
  - Camera angle selection (diagonal/elevation)
- **Gemini Prompt Refinement**: Optional LLM-based prompt polishing via `gemini-1.5-flash`.
- **Multi-Agent Collaboration**: Simulated 4-agent dialogue (Vision Analyst, RAG Compiler, Layout Negotiator, Practicality Reviewer). Can use GPT-4o-mini for live generation.
- **Visual Validation Loop**: Post-generation GPT-4o-mini vision analysis with spec-checking (color bleeding, spatial alignment, element correctness). Auto-retry up to 2Ã— with DALL-E 3 refinement.
- **Render Editing**: Revision workflow that preserves camera angle while modifying materials/details.
- **Reusable Asset Finder**: Queries approved renders for concept reuse.
- **4 variant directions**: balanced, warmer premium, cleaner practical, presentation.

---

### 5. EXTERNAL API INTEGRATIONS

| Service | Key Present | Usage |
|---|---|---|
| OpenAI | âœ… `sk-or-v1-...` (via OpenRouter) | DALL-E 3 images, GPT-4o-mini vision validation + multimodal analysis |
| Google AI Studio | âœ… 2 keys | Gemini Imagen 4.0 image generation, Gemini 1.5 Flash prompt refinement |
| Freepik | âœ… | Flux-Dev text-to-image |
| Pexels | âœ… | Stock photo search fallback |
| ImagineArt | âœ… key present | Not actively used in code |
| Perplexity | âœ… key present | Not actively used in code |
| Groq | âœ… key present | Not actively used in code |
| AIML API | âœ… key present | Not actively used in code |
| HuggingFace | âœ… key present | Not actively used in code |
| OpenRouter | âœ… key present | The OpenAI key appears to be an OpenRouter proxy key |
| Ollama | âœ… key present | Not actively used in code |

---

### 6. STORAGE & FILE STRUCTURE

```
storage/
â”œâ”€â”€ ultimate_interior.db          â† SQLite database (73KB + WAL)
â”œâ”€â”€ ultimate_interior.db-shm
â”œâ”€â”€ ultimate_interior.db-wal
â”œâ”€â”€ assets/                       â† Generated render images (10 files: kitchen, living .jpg)
â”œâ”€â”€ uploads/                      â† User-uploaded floorplans (3 .jpg files)
â”œâ”€â”€ proposals/                    â† Generated PDF documents (empty)
â”œâ”€â”€ calls/                        â† Voice call recordings (empty)
â””â”€â”€ knowledge-base/               â† RAG documents (26 files)
    â”œâ”€â”€ *.md                      â† Design standards (kitchen, TV, wardrobe, mandir, lighting)
    â”œâ”€â”€ mistakes_log.json         â† Render correction log
    â”œâ”€â”€ metadata.json
    â””â”€â”€ index.html

server/images/                    â† 8 curated reference renders (.png, 488KBâ€“989KB)
uploads/                          â† Root uploads dir (contains app docs, not server uploads)
```

---

### 7. SEED DATA (`server/database/seed.js`)

Pre-populates:
- **5 leads** â€” Bangalore-based clients with varying budgets (â‚¹3Lâ€“â‚¹15L), areas, and voice statuses.
- **1 project** â€” "Sharma HSR 3BHK flat" with detailed brief (kitchen, master bedroom, living room specs).
- **1 CAD drawing** â€” 5 walls (4 outer + 1 partition), 2 openings (door + window), 2 furniture items, 2 rooms.
- **1 invoice** â€” INV-2026-001, â‚¹50,000 advance payment.

Run via `npm run seed`.

---

### 8. KEY ARCHITECTURAL OBSERVATIONS

1. **No Authentication**: Every endpoint is publicly accessible. No auth middleware exists.
2. **No Separate Routes/Controllers**: All 30 routes are inline in `server/index.js` (510 lines). No router modules.
3. **No Middleware Layer**: No error handling middleware, no request validation (beyond basic checks), no rate limiting, no logging middleware.
4. **Monolithic Single-File Server**: Everything is in one `index.js` file with service imports.
5. **Port Mismatch**: `.env` says `PORT=8787` but `index.js` hardcodes `port = 5055`.
6. **Smart Cost Mode**: `AI_SPEND_MODE=smart-cost` and `RENDER_REUSE_THRESHOLD=86` control asset reuse vs. fresh generation.
7. **Project State Machine**: Status progresses linearly through the pipeline: lead â†’ project â†’ brief â†’ CAD â†’ materials â†’ renders â†’ signoff â†’ production.
8. **SketchUp Integration**: Auto-generates Ruby scripts from CAD wall data for SketchUp model extrusion.
9. **Knowledge Base RAG**: 26 markdown files with domain-specific standards (kitchen layouts, wardrobe sizing, TV elevations, mandir design, lighting).

---

### Source File Inventory

| File | Size | Lines |
|---|---|---|
| `server/index.js` | 19.5KB | 510 |
| `server/database/database.js` | 4.1KB | 134 |
| `server/database/seed.js` | 6.6KB | 174 |
| `server/services/visualizer-engine.js` | 38.4KB | 977 |
| `server/services/image-provider.js` | 16.7KB | 459 |
| `server/services/cutlist-engine.js` | 12KB | 373 |
| `server/services/pdf-builder.js` | 10KB | 215 |
| `server/services/gemini-multimodal-service.js` | 4.5KB | 127 |
| `server/services/voice-call-service.js` | 3.6KB | 84 |
| `server/services/lead-scorer.js` | 2KB | 61 |
| **Total Backend** | **~117KB** | **~3,114 lines** |

