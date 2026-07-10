# ULTIDA — Session 11 Changelog

> **Date**: 2026-07-10  
> **Status**: ✅ Shipped

---

## Changes Made

### 🤖 AURA — OpenAI GPT-4o-mini Fallback (Tier 3)

**`server/services/gemini-service.js`**

AURA's LLM chain is now:
```
1. OpenRouter  →  meta-llama/llama-3.3-70b-instruct:free
2. Gemini      →  gemini-2.5-flash
3. OpenAI      →  gpt-4o-mini  ← NEW
```

If any provider fails (rate limit, key invalid, etc.) the next one is tried automatically.  
The key for tier 3 is `OPENAI_API_KEY` from `.env` or the Brand Studio key manager.

---

### 🐍 Python Executor Service

**`server/services/python-executor.js`** ← NEW FILE

Sandboxed Python runner for ULTIDA. Capabilities:

| Function | Purpose |
|----------|---------|
| `executePythonScript(code, {context})` | Run any Python string, with optional `_ULTIDA_CONTEXT` injection |
| `probePythonLibraries(libs)` | Returns `{ available, missing }` for ezdxf, numpy, Pillow, cv2… |
| `computeDxfAreas(filePath)` | Parses LWPOLYLINE entities from a DXF and returns area in mm² + sqft |

- 20-second execution timeout
- Temp file cleanup after every run
- Auto-detects `python3` or `python` interpreter

---

### 🔌 Python Executor API Routes

**`server/index.js`**

```
POST /api/python/execute    → run a Python script string
GET  /api/python/probe      → list available Python libraries
POST /api/python/dxf-areas  → compute polygon areas from a .dxf file path
```

---

### 🔑 API Key Manager Routes (BYOK)

**`server/index.js`**

```
GET    /api/keys             → list all provider key statuses (masked)
POST   /api/keys             → save or update a key (persisted + hot-injected into process.env)
DELETE /api/keys/:provider   → remove a key
```

Supported providers: `openai`, `gemini`, `openrouter`, `freepik`, `huggingface`, `stability`

---

### 🎨 Brand Studio — API Key Manager UI

**`frontend/src/screens/WhiteLabelStudio.jsx`**

Added a full-featured AI Provider Keys (BYOK) section below the presets panel:

- Green dot + ACTIVE badge for configured keys
- Show/hide toggle for key input
- Save button per provider (calls POST /api/keys)
- Delete button (appears only when a key is configured)
- Status messages after save/delete
- Loads existing key statuses on mount from GET /api/keys
- Supports all 6 providers with color-coded save buttons

---

## Services Currently Running

| Service | Port | Status |
|---------|------|--------|
| Backend API (Node.js) | 8787 | Running |
| Frontend (Vite) | 5175 | Running |

App URL: http://127.0.0.1:5175  
API URL: http://127.0.0.1:8787
