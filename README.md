# Ultimate Interior Design App

Premium interior design OS with AI-assisted 3D renders, DXF production exports, CRM, invoicing, and AURA chat.

## Prerequisites
- Node.js 18+ (`node -v`)
- npm 9+
- Python 3.11+ with `opencv-python-headless` installed in `.venv`
- Git

## Setup
```bash
git clone https://github.com/shaykhedeee/ultimateinteriordesignapp.git
cd ultimateinteriordesignapp
npm install
```

## Backend
Start backend API:
```bash
npm run server
```
Backend runs on `http://127.0.0.1:5055`.

## Frontend
In a second terminal:
```bash
npm run dev
```
Frontend runs on `http://127.0.0.1:5175`.

## Windows Launcher
Use `LAUNCH.bat` or `START.bat` to start both backend and frontend, wait for ports, and open the app.

## Env/Keys
Set provider keys in `server/.env`:
- `OPENROUTER_API_KEY`
- `HUGGINGFACE_API_KEY`
- `GOOGLE_AI_STUDIO_KEY`
- `FREEPIK_API_KEY`
- `PEXELS_API_KEY`
- `OPENAI_API_KEY`
- `IMAGINE_ART_API_KEY`

Configure AURA provider/model from **System Admin** in the app UI.

## Scripts
- `npm run check` - backend syntax checks
- `npm run build` - production frontend build
- `scripts/ai-harness-evaluator.js` - local AI harness evaluator
- `scripts/run-ai-harness.bat` - Windows harness launcher

## Verified
- `npm run check` passes
- `npm run build` passes
- Core API routes respond on backend port 5055
- core frontend routes mount in browser on port 5175
